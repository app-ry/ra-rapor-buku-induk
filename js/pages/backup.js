// backup.js — Backup/Restore JSON + Reset
window.Pages.backup = (function() {
  function render() {
    const root = document.getElementById('pageRoot');
    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-cloud-arrow-down"></i> Backup & Restore Data</h1>
        <div class="subtitle">Backup/restore seluruh data aplikasi (JSON)</div></div>
      </div>
      <div class="row g-3">
        <div class="col-md-6">
          <div class="panel">
            <h5 class="panel-title mb-3"><i class="bi bi-download"></i> Backup Data</h5>
            <p class="small text-muted">Unduh seluruh data aplikasi (profil RA, murid, asesmen, rapor, dst) sebagai file JSON. Simpan di tempat aman.</p>
            <button class="btn btn-success w-100" id="btnExport"><i class="bi bi-download"></i> Download Backup JSON</button>
          </div>
        </div>
        <div class="col-md-6">
          <div class="panel">
            <h5 class="panel-title mb-3"><i class="bi bi-upload"></i> Restore Data</h5>
            <p class="small text-muted text-warning"><i class="bi bi-exclamation-triangle"></i> Restore akan MENIMPA data yang ada saat ini. Pastikan sudah backup dulu.</p>
            <input type="file" class="form-control mb-2" id="restoreFile" accept=".json">
            <button class="btn btn-warning w-100" id="btnRestore"><i class="bi bi-upload"></i> Restore</button>
          </div>
        </div>
      </div>

      <div class="panel mt-3">
        <h5 class="panel-title mb-3 text-danger"><i class="bi bi-exclamation-triangle"></i> Zona Berbahaya</h5>
        <p class="small text-muted">Reset menghapus SELURUH data aplikasi dan kembali ke kondisi awal (data demo akan ter-seed ulang).</p>
        <button class="btn btn-outline-danger" id="btnReset"><i class="bi bi-trash"></i> Reset Semua Data</button>
      </div>
    `;
    document.getElementById('btnExport').onclick = () => {
      const data = Store.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
      U.downloadBlob(blob, `Backup_RA_${U.todayISO()}.json`);
      Store.log('backup', null);
    };
    document.getElementById('btnRestore').onclick = async () => {
      const f = document.getElementById('restoreFile').files[0];
      if (!f) { U.toast('Pilih file backup dulu','warning'); return; }
      if (!await U.confirmModal({ title:'Restore?', body:'Data saat ini akan ditimpa. Lanjutkan?', danger:true, okText:'Restore' })) return;
      try {
        const txt = await f.text();
        const obj = JSON.parse(txt);
        Store.importAll(obj);
        U.toast('Restore berhasil. Halaman akan dimuat ulang.');
        setTimeout(() => location.reload(), 1000);
      } catch (e) {
        U.toast('File tidak valid: ' + e.message, 'danger');
      }
    };
    document.getElementById('btnReset').onclick = async () => {
      if (!await U.confirmModal({ title:'RESET SEMUA?', body:'Semua data akan dihapus permanen. Yakin?', danger:true, okText:'Hapus Semua' })) return;
      Store.resetAll();
      U.toast('Semua data dihapus. Halaman akan dimuat ulang.');
      setTimeout(() => location.reload(), 800);
    };
  }
  return { render };
})();
