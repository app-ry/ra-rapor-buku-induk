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
            <p class="small text-muted">Backup terenkripsi berisi profil RA, murid, asesmen, rapor, dan data lain. Gunakan password kuat dan simpan file secara aman.</p>
            <button class="btn btn-success w-100" id="btnExport"><i class="bi bi-download"></i> Download Backup Terenkripsi</button>
          </div>
        </div>
        <div class="col-md-6">
          <div class="panel">
            <h5 class="panel-title mb-3"><i class="bi bi-upload"></i> Restore Data</h5>
            <p class="small text-muted text-warning"><i class="bi bi-exclamation-triangle"></i> Restore akan MENIMPA data yang ada saat ini. File backup harus memiliki password.</p>
            <input type="file" class="form-control mb-2" id="restoreFile" accept=".json">
            <button class="btn btn-warning w-100" id="btnRestore"><i class="bi bi-upload"></i> Restore Backup</button>
          </div>
        </div>
      </div>

      <div class="panel mt-3">
        <h5 class="panel-title mb-3 text-danger"><i class="bi bi-exclamation-triangle"></i> Zona Berbahaya</h5>
        <p class="small text-muted">Reset menghapus SELURUH data aplikasi dan kembali ke kondisi awal (data demo akan ter-seed ulang).</p>
        <button class="btn btn-outline-danger" id="btnReset"><i class="bi bi-trash"></i> Reset Semua Data</button>
      </div>
    `;
    document.getElementById('btnExport').onclick = async () => {
      const password = window.prompt('Buat password backup (minimal 8 karakter):');
      if (password === null) return;
      if (password.length < 8) { U.toast('Password backup minimal 8 karakter.', 'warning'); return; }
      try {
        const payload = await encryptBackup(Store.exportAll(), password);
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
        U.downloadBlob(blob, `Backup_RA_${U.todayISO()}.ra-backup.json`);
        Store.log('backup_encrypted', null);
        U.toast('Backup terenkripsi berhasil dibuat.');
      } catch (e) { U.toast('Backup gagal: ' + e.message, 'danger'); }
    };
    document.getElementById('btnRestore').onclick = async () => {
      const f = document.getElementById('restoreFile').files[0];
      if (!f) { U.toast('Pilih file backup dulu','warning'); return; }
      if (!await U.confirmModal({ title:'Restore?', body:'Data saat ini akan ditimpa. Lanjutkan?', danger:true, okText:'Restore' })) return;
      try {
        const txt = await f.text();
        const obj = JSON.parse(txt);
        const password = window.prompt('Masukkan password backup:');
        if (password === null) return;
        const data = await decryptBackup(obj, password);
        Store.importAll(data);
        Store.log('restore_encrypted', null);
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

  function bytesToB64(bytes) {
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  function b64ToBytes(value) {
    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
  }

  async function deriveKey(password, salt) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name:'PBKDF2', salt, iterations:150000, hash:'SHA-256' },
      base,
      { name:'AES-GCM', length:256 },
      false,
      ['encrypt','decrypt']
    );
  }

  async function encryptBackup(data, password) {
    if (!window.crypto || !crypto.subtle) throw new Error('Browser tidak mendukung enkripsi Web Crypto.');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const plaintext = new TextEncoder().encode(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, plaintext);
    return { _format:'ra-encrypted-backup', version:1, algorithm:'AES-256-GCM/PBKDF2-SHA-256', iterations:150000, salt:bytesToB64(salt), iv:bytesToB64(iv), data:bytesToB64(new Uint8Array(ciphertext)) };
  }

  async function decryptBackup(payload, password) {
    if (!payload || payload._format !== 'ra-encrypted-backup' || payload.version !== 1) throw new Error('File bukan backup RA terenkripsi.');
    const salt = b64ToBytes(payload.salt), iv = b64ToBytes(payload.iv), ciphertext = b64ToBytes(payload.data);
    const key = await deriveKey(password, salt);
    let plaintext;
    try { plaintext = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, ciphertext); }
    catch (_) { throw new Error('Password salah atau file backup rusak.'); }
    const data = JSON.parse(new TextDecoder().decode(plaintext));
    if (!data || typeof data !== 'object' || !data._meta) throw new Error('Isi backup tidak valid.');
    return data;
  }
})();
