// guru.js
window.Pages.guru = (function() {
  function render() {
    const list = Store.list('guru');
    const kelas = Store.list('kelas');
    const root = document.getElementById('pageRoot');
    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-person-badge"></i> Data Guru</h1></div>
        <button class="btn btn-success btn-sm" id="btnAdd"><i class="bi bi-plus"></i> Tambah Guru</button>
      </div>
      <div class="panel">
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Nama</th><th>NIP/NUPTK</th><th>Jabatan</th><th>Kelas</th><th>HP</th><th>Aksi</th></tr></thead>
          <tbody>
            ${list.map(g => `<tr>
              <td>${U.esc(g.nama)}</td>
              <td>${U.esc(g.nip||'-')} / ${U.esc(g.nuptk||'-')}</td>
              <td>${U.esc(g.jabatan||'-')}</td>
              <td>${U.esc(kelas.find(k=>k.id===g.kelas_id)?.nama||'-')}</td>
              <td>${U.esc(g.hp||'-')}</td>
              <td class="actions">
                <button class="btn btn-sm btn-outline-success" data-act="edit" data-id="${g.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${g.id}"><i class="bi bi-trash"></i></button>
              </td>
            </tr>`).join('') || `<tr><td colspan="6" class="text-center text-muted">Belum ada guru</td></tr>`}
          </tbody>
        </table></div>
      </div>
    `;
    document.getElementById('btnAdd').onclick = () => editForm(null);
    root.querySelectorAll('[data-act]').forEach(b => {
      b.onclick = async () => {
        if (b.dataset.act === 'edit') editForm(b.dataset.id);
        else if (b.dataset.act === 'del') {
          if (await U.confirmModal({ title:'Hapus guru?', danger:true, okText:'Hapus' })) {
            Store.remove('guru', b.dataset.id);
            U.toast('Guru dihapus');
            render();
          }
        }
      };
    });
  }
  function editForm(id) {
    const g = id ? Store.findById('guru', id) : { nama:'', nip:'', nuptk:'', jabatan:'Guru Kelas', hp:'', email:'', kelas_id:'', ttd_dataurl:'' };
    const kelas = Store.list('kelas');
    const m = U.showModal({
      title: id ? 'Edit Guru' : 'Tambah Guru',
      bodyHTML: `
        <div class="row g-3">
          <div class="col-md-12"><label class="form-label">Nama</label><input class="form-control" id="g_nama" value="${U.esc(g.nama)}" required></div>
          <div class="col-md-6"><label class="form-label">NIP</label><input class="form-control" id="g_nip" value="${U.esc(g.nip||'')}"></div>
          <div class="col-md-6"><label class="form-label">NUPTK</label><input class="form-control" id="g_nuptk" value="${U.esc(g.nuptk||'')}"></div>
          <div class="col-md-6"><label class="form-label">Jabatan</label><input class="form-control" id="g_jabatan" value="${U.esc(g.jabatan||'')}"></div>
          <div class="col-md-6"><label class="form-label">Kelas yang Diampu</label>
            <select class="form-select" id="g_kelas_id">
              <option value="">-- pilih --</option>
              ${kelas.map(k => `<option value="${k.id}" ${k.id===g.kelas_id?'selected':''}>${U.esc(k.nama)}</option>`).join('')}
            </select></div>
          <div class="col-md-6"><label class="form-label">HP</label><input class="form-control" id="g_hp" value="${U.esc(g.hp||'')}"></div>
          <div class="col-md-6"><label class="form-label">Email</label><input class="form-control" id="g_email" value="${U.esc(g.email||'')}"></div>
          <div class="col-12"><label class="form-label">Tanda Tangan Digital (opsional)</label>
            ${g.ttd_dataurl?`<div class="mb-2"><img src="${g.ttd_dataurl}" style="max-height:60px;border:1px solid #ccc;padding:4px"></div>`:''}
            <input type="file" class="form-control" id="g_ttd" accept="image/*"></div>
        </div>`,
      footerHTML: `<button class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
        <button class="btn btn-success" id="btnSaveG">Simpan</button>`
    });
    m.el.querySelector('#btnSaveG').onclick = async () => {
      const obj = {
        nama: m.el.querySelector('#g_nama').value.trim(),
        nip:  m.el.querySelector('#g_nip').value.trim(),
        nuptk:m.el.querySelector('#g_nuptk').value.trim(),
        jabatan: m.el.querySelector('#g_jabatan').value.trim(),
        kelas_id: m.el.querySelector('#g_kelas_id').value,
        hp: m.el.querySelector('#g_hp').value.trim(),
        email: m.el.querySelector('#g_email').value.trim()
      };
      if (!obj.nama) { U.toast('Nama wajib diisi','danger'); return; }
      const fttd = m.el.querySelector('#g_ttd').files[0];
      if (fttd) obj.ttd_dataurl = await U.fileToDataURL(fttd);
      else if (g.ttd_dataurl) obj.ttd_dataurl = g.ttd_dataurl;
      if (id) Store.update('guru', id, obj);
      else Store.add('guru', obj);
      m.close();
      U.toast('Data guru disimpan');
      render();
    };
  }
  return { render };
})();
