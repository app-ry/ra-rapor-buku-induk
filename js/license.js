// license.js — Status lisensi berbasis akun Pusat Lisensi
window.License = (function() {
  'use strict';

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
   *   trial   — within 5-day local onboarding trial
   *   grace   — expired but within 3-day grace period (read-only)
   *   expired — no valid license, trial over, grace over
   */
  function status() {
    // Akun Pusat Lisensi berlaku lintas perangkat/browser. Status ini hanya
    // menyimpan cache identitas; verifikasi kredensial dilakukan saat login.
    const remoteUser = typeof Store !== 'undefined' && Store.currentUser ? Store.currentUser() : null;
    if (remoteUser && remoteUser.remote_account && remoteUser.license_tier) {
      return {
        state: 'active', reason: 'account_licensed', is_account: true,
        nama_ra: remoteUser.madrasah || remoteUser.nama || remoteUser.username,
        username: remoteUser.username, license_code: remoteUser.license_code || null,
        days_left: null, warn: false
      };
    }
    // Jalur ini hanya kompatibilitas untuk lingkungan tanpa Supabase.
    if (remoteUser && remoteUser.role === 'admin') {
      return {
        state: 'active', reason: 'admin_access', is_admin: true,
        nama_ra: remoteUser.madrasah || remoteUser.nama || 'Administrator',
        username: remoteUser.username, days_left: null, warn: false
      };
    }
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
   * Legacy local-key history is intentionally empty. Current licensing is
   * account-based and verified by Supabase RPC; no offline secret is shipped
   * to the browser.
   */
  function keyHistory() {
    return [];
  }

  // Kompatibilitas dengan pola PKG/PKKM: sesi akun adalah sumber status
  // lisensi, sedangkan data rapor tetap tidak pernah dikirim ke server.
  function activateFromAccount(account) {
    const info = _getInfo() || { trial_start: todayMs(), keys: [] };
    info.account = {
      username: account.username || '',
      license_code: account.licenseCode || '',
      nama_ra: account.madrasah || account.fullname || '',
      activated_at: new Date().toISOString()
    };
    _setInfo(info);
    return info.account;
  }

  return { init, status, keyHistory, activateFromAccount, TRIAL_DAYS, WARN_DAYS };
})();