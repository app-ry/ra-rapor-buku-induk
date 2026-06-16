// pages/generate_license.js — Halaman terbitkan lisensi (admin only)
window.Pages.generate_license = {
  render: async function() {
    const root = document.getElementById('pageRoot');
    const today = new Date().toISOString().slice(0, 10);

    root.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-key-fill"></i> Terbitkan Lisensi</h1>
          <div class="subtitle">Generate kunci lisensi untuk RA pengguna</div>
        </div>
      </div>

      <div id="genAlert"></div>

      <div class="row g-3">
        <div class="col-md-6">
          <div class="panel">
            <div class="panel-head"><h5 class="panel-title"><i class="bi bi-pencil-square"></i> Form Generate</h5></div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Nama RA / Lembaga <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="genNamaRA" placeholder="contoh: RA Miftahul Jannah Sukowono" />
            </div>
            <div class="row g-2 mb-3">
              <div class="col-6">
                <label class="form-label fw-semibold">Masa Berlaku</label>
                <select class="form-select" id="genTahun">
                  <option value="1">1 Tahun</option>
                  <option value="2">2 Tahun</option>
                  <option value="3">3 Tahun</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label fw-semibold">Mulai Tanggal</label>
                <input type="date" class="form-control" id="genStartDate" value="${today}" />
              </div>
            </div>
            <button class="btn btn-success w-100 fw-semibold" id="btnGenLicense">
              <i class="bi bi-shield-check"></i> Generate Kunci Lisensi
            </button>

            <div class="mt-3" id="genResult" style="display:none">
              <label class="form-label fw-semibold">Kunci Lisensi</label>
              <textarea class="form-control" id="genKeyOutput" rows="3" readonly style="font-family:monospace;font-size:11px"></textarea>
              <button class="btn btn-outline-success btn-sm mt-2 w-100" id="btnCopyKey">
                <i class="bi bi-clipboard"></i> Salin Kunci
              </button>
              <div class="small text-muted mt-2">
                Kirim kunci ini ke pengguna. Pengguna buka menu <b>Lisensi</b> → tempel kunci → Aktifkan.
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="panel">
            <div class="panel-head"><h5 class="panel-title"><i class="bi bi-clock-history"></i> Riwayat Generate</h5></div>
            <div id="genHistory"><div class="small text-muted p-2">Belum ada riwayat. Data disimpan di browser ini.</div></div>
            <button class="btn btn-outline-danger btn-sm w-100 mt-2" id="btnClearHistory" disabled>
              <i class="bi bi-trash"></i> Hapus Riwayat
            </button>
          </div>
        </div>
      </div>

      <div class="small text-muted mt-3 text-center">
        ⚠️ Jangan bagikan halaman ini ke orang lain. Hanya admin yang bisa mengakses.
      </div>
    `;

    _bindEvents();
    _renderHistory();
  }
};

// ── Secret (sama dengan license.js) ──
const _GEN_SECRET_RAW = 'UmFoJldGhJLYmFjYSBrdG9yByYWFrYW4gUiByBjaXJpQnJhbmdhbSBpY29ubGljZW5zZSBrZQ==';

function _genDecodeSecret() {
  const bin = atob(_GEN_SECRET_RAW);
  return new Uint8Array(bin.length).map((_, i) => bin.charCodeAt(i));
}

async function _genHmacSign(secretBytes, data) {
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const enc = new TextEncoder().encode(data);
  const sig = await crypto.subtle.sign('HMAC', key, enc);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function _genDateMs(ds) {
  if (!ds) return 0;
  const d = new Date(ds);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function _genFmtDate(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── History (localStorage, key = licgen_history) ──
function _genLoadHistory() {
  try { return JSON.parse(localStorage.getItem('licgen_history') || '[]'); }
  catch (e) { return []; }
}

function _genSaveHistory(arr) {
  localStorage.setItem('licgen_history', JSON.stringify(arr));
}

function _renderHistory() {
  const hist = _genLoadHistory();
  const el = document.getElementById('genHistory');
  const btn = document.getElementById('btnClearHistory');
  if (!el) return;
  if (hist.length === 0) {
    el.innerHTML = '<div class="small text-muted p-2">Belum ada riwayat.</div>';
    if (btn) btn.disabled = true;
    return;
  }
  if (btn) btn.disabled = false;
  el.innerHTML = hist.slice().reverse().map(h => {
    const expired = h.expired_at <= Date.now();
    return `<div class="d-flex justify-content-between align-items-start py-2 border-bottom small">
      <div>
        <b>${U.esc(h.nama_ra)}</b><br>
        <span class="text-muted">${h.tahun} tahun · ${_genFmtDate(h.start)} s/d ${_genFmtDate(h.expired_at)}</span>
      </div>
      <span class="badge ${expired ? 'bg-secondary' : 'bg-success'}">${expired ? 'EXPIRED' : 'AKTIF'}</span>
    </div>`;
  }).join('');
}

function _genShowAlert(msg, type) {
  const el = document.getElementById('genAlert');
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show mb-3">
    ${U.esc(msg)}
    <button class="btn-close" data-bs-dismiss="alert"></button>
  </div>`;
}

function _bindEvents() {
  const btn = document.getElementById('btnGenLicense');
  const resultDiv = document.getElementById('genResult');
  const keyOutput = document.getElementById('genKeyOutput');
  const btnCopy = document.getElementById('btnCopyKey');
  const btnClear = document.getElementById('btnClearHistory');

  if (!btn) return;

  btn.addEventListener('click', async () => {
    const namaRA = document.getElementById('genNamaRA').value.trim();
    const tahun = parseInt(document.getElementById('genTahun').value);
    const startStr = document.getElementById('genStartDate').value;

    if (!namaRA) { _genShowAlert('Nama RA / Lembaga wajib diisi.', 'warning'); return; }
    if (!startStr) { _genShowAlert('Tanggal mulai wajib diisi.', 'warning'); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating...';

    try {
      const startMs = _genDateMs(startStr);
      const expDate = new Date(startStr);
      expDate.setFullYear(expDate.getFullYear() + tahun);
      const expiredAt = _genDateMs(expDate.toISOString().slice(0, 10));

      const dataToSign = `v=1|ra=${namaRA}|exp=${expiredAt}`;
      const secret = _genDecodeSecret();
      const sig = await _genHmacSign(secret, dataToSign);

      const payload = { v: 1, nama_ra: namaRA, expired_at: expiredAt, sig };
      const key = btoa(JSON.stringify(payload));

      keyOutput.value = key;
      resultDiv.style.display = 'block';
      _genShowAlert('Kunci lisensi berhasil dibuat!', 'success');

      // Save history
      const hist = _genLoadHistory();
      hist.push({ nama_ra: namaRA, tahun, start: startMs, expired_at: expiredAt, sig: sig.slice(0, 8) + '...' });
      _genSaveHistory(hist);
      _renderHistory();
    } catch (e) {
      _genShowAlert('Gagal generate kunci: ' + e.message, 'danger');
    }
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-shield-check"></i> Generate Kunci Lisensi';
  });

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const text = keyOutput.value;
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        btnCopy.innerHTML = '<i class="bi bi-check-lg"></i> Tersalin!';
        setTimeout(() => { btnCopy.innerHTML = '<i class="bi bi-clipboard"></i> Salin Kunci'; }, 2000);
      }).catch(() => { _genShowAlert('Gagal menyalin. Copy manual saja.', 'warning'); });
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (!confirm('Hapus semua riwayat generate lisensi?')) return;
      localStorage.removeItem('licgen_history');
      _renderHistory();
    });
  }
}