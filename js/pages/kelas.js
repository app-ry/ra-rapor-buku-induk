// kelas.js
window.Pages.kelas = (function() {
  function render() {
    const list = Store.list('kelas');
    const guru = Store.list('guru');
    const tas = Store.list('tahun_ajaran');
    const sems = Store.list('semester');
    const root = document.getElementById('pageRoot');
    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-collection"></i> Data Kelas</h1></div>
        <button class="btn btn-success btn-sm" id="btnAdd"><i class="bi bi-plus"></i> Tambah Kelas</button>
      </div>
      <div class="panel">
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Nama</th><th>Kelompok Usia</th><th>Fase</th><th>Guru</th><th>TA</th><th>Sem</th><th>Aksi</th></tr></thead>
          <tbody>
            ${list.map(k => {
              const g = guru.find(x=>x.id===k.guru_id);
              const ta = tas.find(x=>x.id===k.ta_id);
              const sem = sems.find(x=>x.id===k.sem_id);
              return `<tr>
                <td>${U.esc(k.nama)}</td>
                <td>${U.esc(k.kelompok_usia||'-')} tahun</td>
                <td>${U.esc(k.fase||'Fondasi')}</td>
                <td>${U.esc(g?.nama||'-')}</td>
                <td>${U.esc(ta?.label||'-')}</td>
                <td>${U.esc(sem?.label||'-')}</td>
                <td class="actions">
                  <button class="btn btn-sm btn-outline-success" data-act="edit" data-id="${k.id}"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${k.id}"><i class="bi bi-trash"></i></button>
                </td>
              </tr>`;
            }).join('') || `<tr><td colspan="7" class="text-center text-muted">Belum ada</td></tr>`}
          </tbody>
        </table></div>
      </div>
    `;
    document.getElementById('btnAdd').onclick = () => editForm(null);
    root.querySelectorAll('[data-act]').forEach(b => {
      b.onclick = async () => {
        if (b.dataset.act === 'edit') editForm(b.dataset.id);
        else if (b.dataset.act === 'del') {
          if (await U.confirmModal({ title:'Hapus kelas?', danger:true, okText:'Hapus' })) {
            Store.remove('kelas', b.dataset.id);
            U.toast('Kelas dihapus');
            render();
          }
        }
      };
    });
  }
  function editForm(id) {
    const k = id ? Store.findById('kelas', id) : { nama:'', kelompok_usia:'4-5', fase:'Fondasi', guru_id:'', ta_id:Store.activeTA()?.id, sem_id:Store.activeSem()?.id };
    const guru = Store.list('guru');
    const tas = Store.list('tahun_ajaran');
    const sems = Store.list('semester').filter(s => s.ta_id === k.ta_id);
    const m = U.showModal({
      title: id ? 'Edit Kelas' : 'Tambah Kelas',
      bodyHTML: `
        <div class="row g-3">
          <div class="col-md-6"><label class="form-label">Nama Kelas</label><input class="form-control" id="k_nama" value="${U.esc(k.nama)}" required></div>
          <div class="col-md-6"><label class="form-label">Kelompok Usia</label>
            <select class="form-select" id="k_usia">
              <option value="4-5" ${k.kelompok_usia==='4-5'?'selected':''}>4-5 tahun</option>
              <option value="5-6" ${k.kelompok_usia==='5-6'?'selected':''}>5-6 tahun</option>
            </select></div>
          <div class="col-md-6"><label class="form-label">Fase</label><input class="form-control" id="k_fase" value="${U.esc(k.fase||'Fondasi')}"></div>
          <div class="col-md-6"><label class="form-label">Guru Kelas</label>
            <select class="form-select" id="k_guru">
              <option value="">-- pilih --</option>
              ${guru.map(g => `<option value="${g.id}" ${g.id===k.guru_id?'selected':''}>${U.esc(g.nama)}</option>`).join('')}
            </select></div>
          <div class="col-md-6"><label class="form-label">Tahun Ajaran</label>
            <select class="form-select" id="k_ta">
              ${tas.map(t => `<option value="${t.id}" ${t.id===k.ta_id?'selected':''}>${U.esc(t.label)}</option>`).join('')}
            </select></div>
          <div class="col-md-6"><label class="form-label">Semester</label>
            <select class="form-select" id="k_sem">
              ${sems.map(s => `<option value="${s.id}" ${s.id===k.sem_id?'selected':''}>${U.esc(s.label)}</option>`).join('')}
            </select></div>
        </div>`,
      footerHTML: `<button class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
        <button class="btn btn-success" id="btnSaveK">Simpan</button>`
    });
    m.el.querySelector('#k_ta').onchange = (e) => {
      const taId = e.target.value;
      const opts = Store.list('semester').filter(s => s.ta_id === taId);
      m.el.querySelector('#k_sem').innerHTML = opts.map(s => `<option value="${s.id}">${U.esc(s.label)}</option>`).join('');
    };
    m.el.querySelector('#btnSaveK').onclick = () => {
      const obj = {
        nama: m.el.querySelector('#k_nama').value.trim(),
        kelompok_usia: m.el.querySelector('#k_usia').value,
        fase: m.el.querySelector('#k_fase').value.trim(),
        guru_id: m.el.querySelector('#k_guru').value,
        ta_id: m.el.querySelector('#k_ta').value,
        sem_id: m.el.querySelector('#k_sem').value
      };
      if (!obj.nama) { U.toast('Nama kelas wajib','danger'); return; }
      if (id) Store.update('kelas', id, obj);
      else Store.add('kelas', obj);
      m.close();
      U.toast('Kelas disimpan');
      render();
    };
  }
  return { render };
})();
