// pengguna.js — kelola users (admin only)
window.Pages.pengguna = (function() {
  function render() {
    const current = Store.currentUser();
    const root = document.getElementById('pageRoot');
    // Pada produksi, identitas akun dikelola Pusat Lisensi. Jangan sediakan
    // CRUD user lokal yang dapat membuat akun bypass lisensi pusat.
    if (current && current.remote_account) {
      root.innerHTML = `
        <div class="page-header">
          <div><h1><i class="bi bi-people"></i> Akun Lembaga</h1>
          <div class="subtitle">Identitas akun dikelola oleh Pusat Lisensi</div></div>
        </div>
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i>
          Aplikasi ini menggunakan model <b>1 kode aktivasi = 1 akun/lembaga</b>.
          Pengelolaan username, password, dan status lisensi dilakukan melalui
          Pusat Lisensi. Data siswa, guru, dan rapor tetap tersimpan lokal di perangkat ini.
        </div>
        <div class="panel">
          <h5 class="panel-title">Akun aktif</h5>
          <dl class="row mb-0">
            <dt class="col-sm-3">Username</dt><dd class="col-sm-9">${U.esc(current.username || '-')}</dd>
            <dt class="col-sm-3">Nama</dt><dd class="col-sm-9">${U.esc(current.nama || '-')}</dd>
            <dt class="col-sm-3">Lembaga</dt><dd class="col-sm-9">${U.esc(current.madrasah || '-')}</dd>
            <dt class="col-sm-3">Status</dt><dd class="col-sm-9"><span class="badge bg-success">Aktif</span></dd>
          </dl>
        </div>`;
      return;
    }
    const list = Store.list('users');
    const kelas = Store.list('kelas');
    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-people"></i> Pengaturan Pengguna</h1>
        <div class="subtitle">Kelola akun login aplikasi</div></div>
        <button class="btn btn-success btn-sm" id="btnAdd"><i class="bi bi-plus"></i> Tambah Pengguna</button>
      </div>
      <div class="panel">
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Username</th><th>Nama</th><th>Role</th><th>Kelas (guru)</th><th>Aksi</th></tr></thead>
          <tbody>
            ${list.map(u => `<tr>
              <td><b>${U.esc(u.username)}</b></td>
              <td>${U.esc(u.nama||'-')}</td>
              <td><span class="bdg bdg-bsh">${U.esc(u.role)}</span></td>
              <td>${U.esc(kelas.find(k=>k.id===u.kelas_id)?.nama||'-')}</td>
              <td class="actions">
                <button class="btn btn-sm btn-outline-success" data-act="edit" data-id="${u.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${u.id}"><i class="bi bi-trash"></i></button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    `;
    document.getElementById('btnAdd').onclick = () => editForm(null);
    root.querySelectorAll('[data-act]').forEach(b => {
      b.onclick = async () => {
        if (b.dataset.act === 'edit') editForm(b.dataset.id);
        else if (b.dataset.act === 'del') {
          const me = Store.currentUser();
          if (b.dataset.id === me.id) { U.toast('Tidak bisa hapus akun sendiri','warning'); return; }
          if (await U.confirmModal({ title:'Hapus akun?', danger:true, okText:'Hapus' })) {
            Store.remove('users', b.dataset.id);
            render();
            U.toast('Pengguna dihapus');
          }
        }
      };
    });
  }
  function editForm(id) {
    const u = id ? Store.findById('users', id) : { username:'', password:'', role:'guru', nama:'', kelas_id:'' };
    const kelas = Store.list('kelas');
    const m = U.showModal({
      title: id?'Edit Pengguna':'Tambah Pengguna',
      bodyHTML: `
        <div class="row g-3">
          <div class="col-md-6"><label class="form-label">Username</label><input class="form-control" id="u_user" value="${U.esc(u.username)}" required ${id?'readonly':''}></div>
          <div class="col-md-6"><label class="form-label">Password ${id?'(kosongkan = tidak ubah)':''}</label><input type="text" class="form-control" id="u_pass" value=""></div>
          <div class="col-md-6"><label class="form-label">Nama Lengkap</label><input class="form-control" id="u_nama" value="${U.esc(u.nama)}"></div>
          <div class="col-md-6"><label class="form-label">Role</label>
            <select class="form-select" id="u_role">
              ${['admin','kepala','guru','operator'].map(r => `<option value="${r}" ${r===u.role?'selected':''}>${r}</option>`).join('')}
            </select></div>
          <div class="col-md-12"><label class="form-label">Kelas (untuk role guru)</label>
            <select class="form-select" id="u_kelas">
              <option value="">-- tidak terikat kelas --</option>
              ${kelas.map(k => `<option value="${k.id}" ${k.id===u.kelas_id?'selected':''}>${U.esc(k.nama)}</option>`).join('')}
            </select></div>
        </div>`,
      footerHTML:`<button class="btn btn-secondary" data-bs-dismiss="modal">Batal</button><button class="btn btn-success" id="btnSU">Simpan</button>`
    });
    m.el.querySelector('#btnSU').onclick = () => {
      const obj = {
        username: m.el.querySelector('#u_user').value.trim(),
        nama:     m.el.querySelector('#u_nama').value.trim(),
        role:     m.el.querySelector('#u_role').value,
        kelas_id: m.el.querySelector('#u_kelas').value
      };
      const newPass = m.el.querySelector('#u_pass').value;
      if (!obj.username) { U.toast('Username wajib','danger'); return; }
      if (!id) {
        if (Store.list('users').find(x => x.username === obj.username)) { U.toast('Username sudah dipakai','danger'); return; }
        if (!newPass) { U.toast('Password wajib untuk akun baru','danger'); return; }
        obj.password = newPass;
        Store.add('users', obj);
      } else {
        if (newPass) obj.password = newPass;
        Store.update('users', id, obj);
      }
      m.close();
      U.toast('Pengguna disimpan');
      render();
    };
  }
  return { render };
})();
