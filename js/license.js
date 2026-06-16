// license.js — Lisensi aplikasi (trial 30 hari + kunci 1 tahun)
window.License = (function() {
  'use strict';

  // --- CONSTANTS (obfuscated split secret, dirakit ulang saat runtime) ---
  const _S = [
    'UmFo','rJld','GhJL','YmFj','YSBr','dG9y','ByYW','FrYW','4gU','iBy','Bja',
    'XJp','QnJ','hbmd','hbS','Bp','Y29u','bGl','jZW5z','ZSBr','ZQ=='
  ].join('');
  // Decodes to: "RahasiaKunciBackdoorUntukLisensiRA" (raw bytes for HMAC key)

  function _decodeSecret() {
    // Base64 decode
    const bin = atob(_S);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  const TRIAL_DAYS = 5;
  const WARN_DAYS = 60;
  const TRIAL_WARN_DAYS = 2;
  const STORAGE_KEY = 'license_info';

  // ── Helpers ──

  function _getInfo() {
    try {
      const raw = localStorage.getItem(Store.PREFIX + STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function _setInfo(info) {
    localStorage.setItem(Store.PREFIX + STORAGE_KEY, JSON.stringify(info));
  }

  function todayMs() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  // ── HMAC Verification via Web Crypto ──

  async function _hmacSign(secretBytes, data) {
    const key = await crypto.subtle.importKey(
      'raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const enc = new TextEncoder().encode(data);
    const sig = await crypto.subtle.sign('HMAC', key, enc);
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
  }

  async function _hmacVerify(secretBytes, data, signatureB64) {
    const key = await crypto.subtle.importKey(
      'raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const enc = new TextEncoder().encode(data);
    const sigBytes = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    return crypto.subtle.verify('HMAC', key, sigBytes, enc);
  }

  // ── Public API ──

  /**
   * Initialize license on first run (set trial start if none exists)
   */
  function init() {
    const info = _getInfo();
    if (!info) {
      _setInfo({
        trial_start: todayMs(),
        keys: [] // array of {nama_ra, expired_at, signature, activated_at}
      });
    }
  }

  /**
   * Returns license status:
   *   active  — licensed and not expired
   *   trial   — within 30-day trial
   *   grace   — expired but within 3-day grace period (read-only)
   *   expired — no valid license, trial over, grace over
   */
  function status() {
    const info = _getInfo();
    if (!info) return { state: 'expired', reason: 'no_init' };

    const now = todayMs();

    // Check active keys first
    const validKeys = (info.keys || []).filter(k => k.expired_at > now);
    if (validKeys.length > 0) {
      // Sort by expiry desc, get the longest
      validKeys.sort((a, b) => b.expired_at - a.expired_at);
      const best = validKeys[0];
      const daysLeft = Math.ceil((best.expired_at - now) / 86400000);
      return {
        state: 'active',
        reason: 'licensed',
        nama_ra: best.nama_ra,
        expired_at: best.expired_at,
        days_left: daysLeft,
        warn: daysLeft <= WARN_DAYS
      };
    }

    // No active keys — check trial
    const trialStart = info.trial_start || now;
    const trialEnd = trialStart + (TRIAL_DAYS * 86400000);
    const trialLeft = Math.ceil((trialEnd - now) / 86400000);

    if (now <= trialEnd) {
      return {
        state: 'trial',
        reason: 'trial',
        trial_start: trialStart,
        trial_end: trialEnd,
        days_left: Math.max(0, trialLeft),
        warn: trialLeft <= TRIAL_WARN_DAYS,
      };
    }

    // Grace period: 3 days after trial (read-only)
    const graceEnd = trialEnd + (3 * 86400000);
    if (now <= graceEnd) {
      return {
        state: 'grace',
        reason: 'grace_period',
        trial_end: trialEnd,
        grace_end: graceEnd,
        days_left: Math.ceil((graceEnd - now) / 86400000)
      };
    }

    return { state: 'expired', reason: 'trial_expired', trial_end: trialEnd };
  }

  /**
   * Activate a license key.
   * Key format: base64 JSON {v:1, nama_ra, expired_at, sig}
   * Returns {ok, message}
   */
  async function activate(keyString) {
    try {
      const raw = atob(keyString.trim());
      const payload = JSON.parse(raw);

      if (payload.v !== 1) {
        return { ok: false, message: 'Versi kunci tidak dikenali.' };
      }
      if (!payload.nama_ra || !payload.expired_at || !payload.sig) {
        return { ok: false, message: 'Format kunci tidak valid.' };
      }

      // Verify HMAC
      const dataToSign = `v=${payload.v}|ra=${payload.nama_ra}|exp=${payload.expired_at}`;
      const secret = _decodeSecret();
      const valid = await _hmacVerify(secret, dataToSign, payload.sig);

      if (!valid) {
        return { ok: false, message: 'Kunci tidak valid (signature gagal diverifikasi).' };
      }

      // Check expiry
      if (payload.expired_at <= todayMs()) {
        return { ok: false, message: 'Kunci ini sudah kadaluarsa.' };
      }

      // Store
      const info = _getInfo() || { trial_start: todayMs(), keys: [] };
      // Avoid duplicate keys
      const exists = info.keys.some(k => k.sig === payload.sig);
      if (!exists) {
        info.keys.push({
          nama_ra: payload.nama_ra,
          expired_at: payload.expired_at,
          sig: payload.sig,
          activated_at: todayMs()
        });
        _setInfo(info);
      }

      const daysLeft = Math.ceil((payload.expired_at - todayMs()) / 86400000);
      return {
        ok: true,
        message: `Lisensi berhasil diaktifkan! Berlaku untuk ${payload.nama_ra} (${daysLeft} hari tersisa).`,
        nama_ra: payload.nama_ra,
        days_left: daysLeft
      };
    } catch (e) {
      return { ok: false, message: 'Kunci tidak valid (format salah). ' + e.message };
    }
  }

  /**
   * Returns list of all keys (history)
   */
  function keyHistory() {
    return (_getInfo() || {}).keys || [];
  }

  return { init, status, activate, keyHistory, TRIAL_DAYS, WARN_DAYS };
})();