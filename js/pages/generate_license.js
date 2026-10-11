// Panel penerbitan kode aktivasi — satu aplikasi, khusus Admin Key pusat.
(function () {
  'use strict';
  var STORAGE = 'ra_license_admin_key';
  var CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function esc(v) { return U.esc(String(v == null ? '' : v)); }
  function makeCode() {
    var part = function () { return Array.from({ length: 4 }, function () { return CHARS[Math.floor(Math.random() * CHARS.length)]; }).join(''); };
    return 'RA-' + part() + '-' + part();
  }
  function key() { return sessionStorage.getItem(STORAGE) || ''; }
  function alertBox(msg, type) {
    var el = document.getElementById('genAlert');
    if (el) el.innerHTML = '<div class="alert alert-' + type + ' py-2">' + esc(msg) + '</div>';
  }

  window.Pages.generate_license = {
    render: function () {
      var root = document.getElementById('pageRoot');
      if (!key()) { renderLogin(root); return; }
      renderPanel(root);
    }
  };

  function renderLogin(root) {
    root.innerHTML = '<div class="container py-4" style="max-width:520px">' +
      '<div class="card shadow-sm"><div class="card-body">' +
      '<h4 class="mb-2"><i class="bi bi-shield-lock-fill"></i> Admin Penerbit Lisensi</h4>' +
      '<p class="text-muted small">Masukkan Admin Key untuk membuka panel penerbitan kode aktivasi. Kunci ini hanya untuk admin pusat.</p>' +
      '<div id="genAlert"></div>' +
      '<input type="password" id="genAdminKey" class="form-control mb-3" placeholder="Admin Key Pusat Lisensi" autocomplete="off">' +
      '<button id="btnGenAdminLogin" class="btn btn-success w-100"><i class="bi bi-box-arrow-in-right"></i> Masuk Panel Admin</button>' +
      '</div></div></div>';
    var input = document.getElementById('genAdminKey');
    var btn = document.getElementById('btnGenAdminLogin');
    var login = async function () {
      var adminKey = input.value.trim();
      if (!adminKey) { alertBox('Admin Key wajib diisi.', 'warning'); return; }
      btn.disabled = true; btn.textContent = 'Memverifikasi...';
      var result = await SupabaseSync.adminGetStats(adminKey);
      if (result && result.success === true) {
        sessionStorage.setItem(STORAGE, adminKey); renderPanel(root); return;
      }
      alertBox(result && result.reason === 'invalid_admin_key' ? 'Admin Key salah.' : 'Koneksi ke Pusat Lisensi gagal.', 'danger');
      btn.disabled = false; btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Masuk Panel Admin';
    };
    btn.addEventListener('click', login);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') login(); });
  }

  function renderPanel(root) {
    root.innerHTML = '<div class="container-fluid py-3"><div class="d-flex justify-content-between align-items-center mb-3">' +
      '<div><h1><i class="bi bi-key-fill"></i> Terbitkan Lisensi</h1><div class="subtitle">Panel Admin Pusat — buat kode aktivasi untuk RA</div></div>' +
      '<button id="btnGenAdminLogout" class="btn btn-outline-secondary btn-sm">Keluar Panel</button></div>' +
      '<div id="genAlert"></div><div class="row g-3"><div class="col-lg-7"><div class="card shadow-sm"><div class="card-body">' +
      '<label class="form-label fw-semibold">Nama RA / Lembaga</label><input id="genNamaRA" class="form-control mb-3" placeholder="Contoh: RA Miftahul Jannah">' +
      '<label class="form-label fw-semibold">Format Kode</label><input class="form-control mb-3" value="RA-XXXX-XXXX" readonly>' +
      '<button id="btnGenCode" class="btn btn-success"><i class="bi bi-shield-check"></i> Generate Kode Lisensi</button>' +
      '<div id="genResult" class="mt-3" style="display:none"><label class="form-label fw-semibold">Kode Aktivasi</label><div class="input-group"><input id="genKeyOutput" class="form-control fw-bold" readonly style="font-family:monospace;font-size:18px;letter-spacing:1px"><button id="btnCopyCode" class="btn btn-outline-secondary">Salin</button></div><div class="small text-muted mt-2">Berikan kode ini kepada lembaga. Kode dipakai saat pendaftaran akun.</div></div>' +
      '</div></div><div class="col-lg-5"><div class="card shadow-sm"><div class="card-body"><h5>Riwayat Generate</h5><div id="genHistory" class="small text-muted">Belum ada kode pada sesi ini.</div><button id="btnClearHistory" class="btn btn-outline-secondary btn-sm mt-3">Hapus Riwayat</button></div></div></div></div>' +
      '<div class="alert alert-warning mt-3 small"><i class="bi bi-exclamation-triangle"></i> Jangan membagikan Admin Key. Yang dibagikan kepada pengguna hanya kode RA-XXXX-XXXX.</div></div>';
    bindPanel();
  }

  function bindPanel() {
    var historyKey = 'ra_license_generated_history';
    var history = JSON.parse(sessionStorage.getItem(historyKey) || '[]');
    var historyEl = document.getElementById('genHistory');
    function draw() { historyEl.innerHTML = history.length ? history.slice().reverse().map(function (h) { return '<div class="border-bottom py-2"><b>' + esc(h.nama) + '</b><br><code>' + esc(h.code) + '</code></div>'; }).join('') : 'Belum ada kode pada sesi ini.'; }
    draw();
    document.getElementById('btnGenAdminLogout').onclick = function () { sessionStorage.removeItem(STORAGE); location.hash = '#/license'; };
    document.getElementById('btnClearHistory').onclick = function () { history = []; sessionStorage.removeItem(historyKey); draw(); };
    document.getElementById('btnGenCode').onclick = async function () {
      var nama = document.getElementById('genNamaRA').value.trim();
      if (!nama) { alertBox('Nama RA / Lembaga wajib diisi.', 'warning'); return; }
      var btn = document.getElementById('btnGenCode'); btn.disabled = true; btn.textContent = 'Mendaftarkan...';
      var code = makeCode();
      var result = await SupabaseSync.adminRegisterCode(key(), code, nama);
      btn.disabled = false; btn.innerHTML = '<i class="bi bi-shield-check"></i> Generate Kode Lisensi';
      if (!result || result.success !== true) { alertBox(result && result.reason === 'invalid_admin_key' ? 'Admin Key salah.' : 'Kode gagal didaftarkan ke Pusat Lisensi.', 'danger'); return; }
      document.getElementById('genKeyOutput').value = result.code || code;
      document.getElementById('genResult').style.display = '';
      history.push({ nama: nama, code: result.code || code }); sessionStorage.setItem(historyKey, JSON.stringify(history)); draw();
      alertBox('Kode berhasil dibuat dan didaftarkan.', 'success');
    };
    document.getElementById('btnCopyCode').onclick = function () { navigator.clipboard.writeText(document.getElementById('genKeyOutput').value); this.textContent = 'Tersalin'; };
  }
})();
