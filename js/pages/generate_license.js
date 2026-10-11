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
      '<div><h1><i class="bi bi-key-fill"></i> Kelola Kode Aktivasi & Akun</h1><div class="subtitle">Pusat Lisensi Rapor & Buku Induk RA</div></div>' +
      '<button id="btnGenAdminLogout" class="btn btn-outline-secondary btn-sm">Keluar Panel</button></div><div id="genAlert"></div>' +
      '<div class="row g-3 mb-3"><div class="col-md-3"><div class="card shadow-sm border-0"><div class="card-body"><div class="text-muted small">Total Kode</div><div id="statTotal" class="fs-3 fw-bold">-</div></div></div></div>' +
      '<div class="col-md-3"><div class="card shadow-sm border-0"><div class="card-body"><div class="text-muted small">Belum Dipakai</div><div id="statUnused" class="fs-3 fw-bold text-success">-</div></div></div></div>' +
      '<div class="col-md-3"><div class="card shadow-sm border-0"><div class="card-body"><div class="text-muted small">Akun Terdaftar</div><div id="statAccounts" class="fs-3 fw-bold text-primary">-</div></div></div></div>' +
      '<div class="col-md-3"><div class="card shadow-sm border-0"><div class="card-body"><div class="text-muted small">Dicabut</div><div id="statRevoked" class="fs-3 fw-bold text-danger">-</div></div></div></div></div>' +
      '<div class="card shadow-sm"><div class="card-body"><div class="d-flex flex-wrap gap-2 align-items-center mb-3"><span class="fw-semibold me-2">Buat:</span><button class="btn btn-success btn-sm create-count" data-count="1">1 Kode</button><button class="btn btn-success btn-sm create-count" data-count="5">5 Kode</button><button class="btn btn-success btn-sm create-count" data-count="10">10 Kode</button><input id="genRecipient" class="form-control form-control-sm" style="max-width:260px" placeholder="Penerima / catatan (opsional)"><button id="btnReloadCodes" class="btn btn-outline-secondary btn-sm">↻ Muat Ulang</button></div>' +
      '<div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead><tr><th>Kode Aktivasi</th><th>Penerima</th><th>Dibuat</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="codesBody"><tr><td colspan="5" class="text-center text-muted">Memuat...</td></tr></tbody></table></div></div></div>' +
      '<div class="alert alert-warning mt-3 small"><i class="bi bi-exclamation-triangle"></i> Jangan membagikan Admin Key. Pengguna hanya menerima kode aktivasi.</div></div>';
    bindPanel();
  }

  function bindPanel() {
    var codes = [];
    function date(v) { return v ? new Date(v).toLocaleDateString('id-ID') : '-'; }
    function draw() {
      var body = document.getElementById('codesBody');
      var unused = codes.filter(function (c) { return !c.used_count && c.is_active !== false; }).length;
      document.getElementById('statTotal').textContent = codes.length;
      document.getElementById('statUnused').textContent = unused;
      document.getElementById('statAccounts').textContent = codes.reduce(function (n, c) { return n + Number(c.used_count || 0); }, 0);
      document.getElementById('statRevoked').textContent = codes.filter(function (c) { return c.is_active === false; }).length;
      body.innerHTML = codes.length ? codes.map(function (c, i) {
        var active = c.is_active !== false, used = Number(c.used_count || 0) > 0;
        return '<tr><td><code>' + esc(c.code) + '</code></td><td>' + esc(c.recipient || '-') + '</td><td>' + date(c.created_at) + '</td><td><span class="badge ' + (!active ? 'bg-danger' : used ? 'bg-success' : 'bg-secondary') + '">' + (!active ? 'Dicabut' : used ? 'Terpakai' : 'Belum Dipakai') + '</span></td><td><button class="btn btn-sm btn-outline-secondary copy-code" data-code="' + esc(c.code) + '"><i class="bi bi-clipboard"></i></button></td></tr>';
      }).join('') : '<tr><td colspan="5" class="text-center text-muted py-4">Belum ada kode.</td></tr>';
      body.querySelectorAll('.copy-code').forEach(function (b) { b.onclick = function () { navigator.clipboard.writeText(b.dataset.code); b.innerHTML = '✓'; }; });
    }
    async function reload() {
      var r = await SupabaseSync.adminListCodes(key());
      codes = r && Array.isArray(r.codes) ? r.codes : (Array.isArray(r) ? r : []); draw();
    }
    document.getElementById('btnGenAdminLogout').onclick = function () { sessionStorage.removeItem(STORAGE); location.hash = '#/license'; };
    document.getElementById('btnReloadCodes').onclick = reload;
    document.querySelectorAll('.create-count').forEach(function (btn) { btn.onclick = async function () {
      var count = Number(btn.dataset.count), recipient = document.getElementById('genRecipient').value.trim();
      btn.disabled = true; btn.textContent = 'Membuat...';
      var jobs = Array.from({ length: count }, function () { var code = makeCode(); return SupabaseSync.adminRegisterCode(key(), code, recipient).then(function (r) { return r && r.success === true; }); });
      var ok = (await Promise.all(jobs)).filter(Boolean).length; btn.disabled = false; btn.textContent = count + ' Kode';
      alertBox(ok + ' kode berhasil dibuat.', ok ? 'success' : 'danger'); await reload();
    }; });
    reload();
  }
})();
