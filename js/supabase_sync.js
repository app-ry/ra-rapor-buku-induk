// supabase_sync.js — Pusat Lisensi Aplikasi (akun 1 kode = 1 akun)
// Data siswa/rapor tidak dikirim ke Supabase; hanya akun dan status lisensi.
(function () {
  'use strict';

  var SUPABASE_URL = 'https://llaukzsztguwrtwdubpm.supabase.co';
  // Publishable/anon key memang aman berada di frontend; jangan pernah memasukkan service_role key.
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYXVrenN6dGd1d3J0d2R1YnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTI1NDgsImV4cCI6MjEwMjc2ODU0OH0.DqKtA0aus9nOLViMEWjAPvYIAdLS_EKU3H8dYKe_Zhk';
  var APP_SLUG = 'ra-rapor-buku-induk';
  // Kredensial admin diseragamkan dengan aplikasi PKG/PKKM.
  // Admin tetap diverifikasi server-side; tidak ada password atau key di source.
  var ADMIN_APP_SLUG = 'pkkm';
  var TIMEOUT_MS = 10000;

  function callRpc(fnName, params) {
    var controller = window.AbortController ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, TIMEOUT_MS) : null;
    return fetch(SUPABASE_URL + '/rest/v1/rpc/' + fnName, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params || {}),
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.text().then(function (text) {
        var data;
        try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { message: text }; }
        if (!res.ok) throw new Error('RPC ' + fnName + ' failed: ' + res.status);
        return data;
      });
    }).catch(function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  }

  function hashPassword(username, password) {
    var text = String(username || '').trim().toLowerCase() + ':' + String(password || '');
    if (window.crypto && crypto.subtle) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
        return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      });
    }
    return Promise.reject(new Error('Browser tidak mendukung Web Crypto'));
  }

  function deviceInfo() {
    return [navigator.userAgent || '', screen.width + 'x' + screen.height].join(' | ').slice(0, 500);
  }

  function safeCall(fn, params, fallback) {
    return callRpc(fn, params).catch(function (err) {
      console.warn('[SupabaseSync] ' + fn + ':', err.message);
      return fallback;
    });
  }

  window.SupabaseSync = {
    APP_SLUG: APP_SLUG,
    hashPassword: hashPassword,
    adminGetStats: function (adminKey) {
      return safeCall('admin_get_stats', {
        p_admin_key: String(adminKey || ''),
        p_app_slug: APP_SLUG
      }, { success: null, reason: 'network_error' });
    },
    adminListCodes: function (adminKey) {
      return safeCall('admin_list_codes', {
        p_admin_key: String(adminKey || ''),
        p_app_slug: APP_SLUG
      }, { success: null, codes: [] });
    },
    adminBatchCreateCodes: function (adminKey, count, recipient) {
      return safeCall('admin_batch_create_codes', {
        p_admin_key: String(adminKey || ''), p_count: Number(count || 1),
        p_app_slug: APP_SLUG, p_recipient: recipient || ''
      }, { success: null, codes: [] });
    },
    adminEditCode: function (adminKey, code, recipient) {
      return safeCall('admin_edit_code_by_code', {
        p_admin_key: String(adminKey || ''), p_code: String(code || '').toUpperCase(),
        p_app_slug: APP_SLUG, p_recipient: recipient || ''
      }, { success: null, reason: 'network_error' });
    },
    adminRevokeCode: function (adminKey, code) {
      return safeCall('admin_revoke_code_by_code', {
        p_admin_key: String(adminKey || ''), p_code: String(code || '').toUpperCase(), p_app_slug: APP_SLUG
      }, { success: null, reason: 'network_error' });
    },
    adminDeleteCode: function (adminKey, code) {
      return safeCall('admin_delete_code_by_code', {
        p_admin_key: String(adminKey || ''), p_code: String(code || '').toUpperCase(), p_app_slug: APP_SLUG
      }, { success: null, reason: 'network_error' });
    },
    adminRegisterCode: function (adminKey, code, recipient) {
      return safeCall('admin_register_code', {
        p_admin_key: String(adminKey || ''),
        p_code: String(code || '').trim().toUpperCase(),
        p_app_slug: APP_SLUG,
        p_tier: 'pro',
        p_recipient: recipient || '',
        p_app_name: 'Rapor & Buku Induk RA',
        p_max_devices: 1
      }, { success: null, reason: 'network_error' });
    },
    registerAccount: function (code, username, password, fullname, madrasah) {
      return hashPassword(username, password).then(function (passwordHash) {
        return safeCall('register_account', {
          p_code: String(code || '').trim().toUpperCase(),
          p_app_slug: APP_SLUG,
          p_username: String(username || '').trim().toLowerCase(),
          p_password_hash: passwordHash,
          p_fullname: fullname || '',
          p_madrasah: madrasah || '',
          p_device_info: deviceInfo()
        }, { success: null, reason: 'network_error' }).then(function (result) {
          return { result: result, passwordHash: passwordHash };
        });
      });
    },
    adminLogin: function (username, password) {
      return hashPassword(username, password).then(function (passwordHash) {
        return safeCall('admin_login', {
          p_app_slug: ADMIN_APP_SLUG,
          p_username: String(username || '').trim().toLowerCase(),
          p_password_hash: passwordHash
        }, { success: null, reason: 'network_error' }).then(function (result) {
          return { result: result, passwordHash: passwordHash };
        });
      });
    },
    loginAccount: function (username, password) {
      return hashPassword(username, password).then(function (passwordHash) {
        return safeCall('login_account', {
          p_app_slug: APP_SLUG,
          p_username: String(username || '').trim().toLowerCase(),
          p_password_hash: passwordHash,
          p_device_info: deviceInfo(),
          p_touch: true
        }, { valid: null, reason: 'network_error' }).then(function (result) {
          return { result: result, passwordHash: passwordHash };
        });
      });
    },
    verifyAccount: function (username, passwordHash) {
      return safeCall('login_account', {
        p_app_slug: APP_SLUG,
        p_username: String(username || '').trim().toLowerCase(),
        p_password_hash: passwordHash,
        p_device_info: '',
        p_touch: false
      }, { valid: null, reason: 'network_error' });
    },
    isConfigured: function () { return !!SUPABASE_URL && !!SUPABASE_ANON_KEY; }
  };
})();
