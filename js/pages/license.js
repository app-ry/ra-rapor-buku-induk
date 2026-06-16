// pages/license.js — Halaman aktivasi & status lisensi
window.Pages = window.Pages || {};
window.Pages.license = {
  render: async function() {
    const root = document.getElementById('pageRoot');
    const st = License.status();

    root.innerHTML = `
      <div class="page-header">
        <h1><i class="bi bi-shield-lock"></i> Status Lisensi</h1>
      </div>

      <div id="licenseAlert"></div>

      <div class="row g-3">
        <div class="col-md-6">
          <div class="panel">
            <div class="panel-head"><h5 class="panel-title"><i class="bi bi-info-circle"></i> Status Saat Ini</h5></div>
            ${_renderStatusCard(st)}
          </div>
        </div>

        <div class="col-md-6">
          <div class="panel">
            <div class="panel-head"><h5 class="panel-title"><i class="bi bi-key"></i> Aktivasi Kunci</h5></div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Kunci Lisensi</label>
              <textarea class="form-control" id="keyInput" rows="3" placeholder="Tempel kunci lisensi di sini..." style="font-family:monospace;font-size:12px"></textarea>
              <div class="form-text">Kunci didapat dari admin/pengembang. Satu kunci berlaku 1 tahun untuk satu RA.</div>
            </div>
            <button class="btn btn-success w-100 fw-semibold" id="btnActivate">
              <i class="bi bi-check-circle"></i> Aktifkan Lisensi
            </button>
          </div>
        </div>
      </div>

      <div class="row g-3 mt-2">
        <div class="col-12">
          <div class="panel">
            <div class="panel-head"><h5 class="panel-title"><i class="bi bi-clock-history"></i> Riwayat Aktivasi</h5></div>
            ${_renderHistory()}
          </div>
        </div>
      </div>

      <div class="text-muted small mt-3 text-center">
        Butuh perpanjangan? Hubungi pengembang untuk mendapatkan kunci lisensi baru.
      </div>
    `;

    _bindEvents();
  }
};

function _renderStatusCard(st) {
  let badge = '', borderColor = '', bgColor = '';

  if (st.state === 'active') {
    badge = st.warn
      ? `<span class="badge bg-warning text-dark">Aktif (segera perpanjang)</span>`
      : `<span class="badge bg-success">Aktif</span>`;
    borderColor = 'border-success';
    bgColor = 'bg-success bg-opacity-10';
  } else if (st.state === 'trial') {
    badge = `<span class="badge bg-info">Masa Uji Coba</span>`;
    borderColor = 'border-info';
    bgColor = 'bg-info bg-opacity-10';
  } else if (st.state === 'grace') {
    badge = `<span class="badge bg-warning text-dark">Masa Tenggang</span>`;
    borderColor = 'border-warning';
    bgColor = 'bg-warning bg-opacity-10';
  } else {
    badge = `<span class="badge bg-danger">Kadaluarsa</span>`;
    borderColor = 'border-danger';
    bgColor = 'bg-danger bg-opacity-10';
  }

  let body = '';
  if (st.state === 'active') {
    body = `
      <div class="text-center py-2">
        <div class="fs-4 fw-bold text-success mb-1">🟢 Lisensi Aktif</div>
        <div class="mb-2"><b>${U.esc(st.nama_ra || '-')}</b></div>
        <div class="small text-muted">Berlaku sampai</div>
        <div class="fw-semibold">${_fmtDate(st.expired_at)}</div>
        <div class="mt-1">Sisa <b>${st.days_left}</b> hari</div>
      </div>`;
  } else if (st.state === 'trial') {
    body = `
      <div class="text-center py-2">
        <div class="fs-4 fw-bold text-info mb-1">🔵 Masa Uji Coba</div>
        <div class="small text-muted">Gratis selama ${License.TRIAL_DAYS} hari sejak pertama kali aplikasi dibuka</div>
        <div class="mt-2">Berakhir: <b>${_fmtDate(st.trial_end)}</b></div>
        <div class="mt-1">Sisa <b>${st.days_left}</b> hari</div>
        <div class="mt-2 small text-warning"><i class="bi bi-exclamation-triangle"></i> Setelah masa uji coba habis, aplikasi akan terkunci. Aktifkan lisensi untuk melanjutkan.</div>
      </div>`;
  } else if (st.state === 'grace') {
    body = `
      <div class="text-center py-2">
        <div class="fs-4 fw-bold text-warning mb-1">🟡 Masa Tenggang</div>
        <div class="small text-muted">Masa uji coba sudah berakhir. Segera aktifkan lisensi.</div>
        <div class="mt-1">Sisa <b>${st.days_left}</b> hari untuk aktivasi</div>
      </div>`;
  } else {
    body = `
      <div class="text-center py-2">
        <div class="fs-4 fw-bold text-danger mb-1">🔴 Lisensi Kadaluarsa</div>
        <div class="small text-muted">Masa uji coba telah berakhir dan belum ada lisensi aktif.</div>
        <div class="mt-2">Aplikasi terkunci. Masukkan kunci lisensi untuk melanjutkan.</div>
      </div>`;
  }

  return `<div class="p-3 rounded-3 border ${borderColor} ${bgColor}">${badge}${body}</div>`;
}

function _renderHistory() {
  const keys = License.keyHistory();
  if (keys.length === 0) {
    return `<div class="text-muted small p-2">Belum ada riwayat aktivasi.</div>`;
  }
  return `
    <table class="table table-sm small mb-0">
      <thead><tr><th>Nama RA</th><th>Aktivasi</th><th>Kadaluarsa</th><th>Status</th></tr></thead>
      <tbody>
        ${keys.map(k => {
          const now = new Date().getTime();
          const expired = k.expired_at <= now;
          return `<tr class="${expired ? 'table-secondary' : ''}">
            <td>${U.esc(k.nama_ra)}</td>
            <td>${_fmtDate(k.activated_at)}</td>
            <td>${_fmtDate(k.expired_at)}</td>
            <td>${expired ? '<span class="badge bg-secondary">Expired</span>' : '<span class="badge bg-success">Aktif</span>'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function _fmtDate(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
}

async function _bindEvents() {
  const btn = document.getElementById('btnActivate');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const keyInput = document.getElementById('keyInput');
    const alertEl = document.getElementById('licenseAlert');
    const key = keyInput.value.trim();
    if (!key) {
      _showAlert('Masukkan kunci lisensi terlebih dahulu.', 'warning');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memverifikasi...';

    try {
      const result = await License.activate(key);
      if (result.ok) {
        _showAlert(result.message, 'success');
        keyInput.value = '';
        // Reload page after 1.5s
        setTimeout(() => App.go('license'), 1500);
      } else {
        _showAlert(result.message, 'danger');
      }
    } catch (e) {
      _showAlert('Gagal memverifikasi kunci: ' + e.message, 'danger');
    }
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-circle"></i> Aktifkan Lisensi';
  });
}

function _showAlert(msg, type) {
  const el = document.getElementById('licenseAlert');
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show mb-3">
    ${U.esc(msg)}
    <button class="btn-close" data-bs-dismiss="alert"></button>
  </div>`;
}