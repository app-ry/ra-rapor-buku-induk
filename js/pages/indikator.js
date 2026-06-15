// indikator.js — Bank Indikator (CRUD per elemen)
window.Pages.indikator = (function() {
  let activeEl = 'nilai_agama';
  function render() {
    const list = Store.list('indikator');
    const elemen = Narasi.ELEMEN_LABEL;
    const root = document.getElementById('pageRoot');
    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-list-check"></i> Bank Indikator RA</h1>
        <div class="subtitle">Indikator perkembangan per elemen Capaian Pembelajaran</div></div>
        <button class="btn btn-success btn-sm" id="btnAdd"><i class="bi bi-plus"></i> Tambah Indikator</button>
      </div>

      <div class="panel">
        <ul class="nav nav-tabs mb-3">
          ${Object.keys(elemen).map(k => `
            <li class="nav-item"><a href="#" class="nav-link ${k===activeEl?'active':''}" data-el="${k}">${U.esc(elemen[k])} <span class="badge bg-secondary ms-1">${list.filter(x=>x.elemen===k).length}</span></a></li>
          `).join('')}
        </ul>

        <div class="table-wrap"><table class="tbl">
          <thead><tr><th width="100">Kode</th><th>Indikator</th><th>Aksi</th></tr></thead>
          <tbody>
            ${list.filter(i => i.elemen === activeEl).map(i => `<tr>
              <td><b>${U.esc(i.kode||'-')}</b></td>
              <td>${U.esc(i.teks)}</td>
              <td class="actions">
                <button class="btn btn-sm btn-outline-success" data-act="edit" data-id="${i.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${i.id}"><i class="bi bi-trash"></i></button>
              </td>
            </tr>`).join('') || `<tr><td colspan="3" class="text-center text-muted">Belum ada indikator untuk elemen ini</td></tr>`}
          </tbody>
        </table></div>
      </div>
    `;
    root.querySelectorAll('[data-el]').forEach(a => {
      a.onclick = (e) => { e.preventDefault(); activeEl = a.dataset.el; render(); };
    });
    document.getElementById('btnAdd').onclick = () => editForm(null);
    root.querySelectorAll('[data-act]').forEach(b => {
      b.onclick = async () => {
        if (b.dataset.act === 'edit') editForm(b.dataset.id);
        else if (b.dataset.act === 'del') {
          if (await U.confirmModal({ title:'Hapus indikator?', body:'Asesmen yang sudah memakai indikator ini tetap tersimpan, tapi indikator akan hilang dari pilihan.', danger:true, okText:'Hapus' })) {
            Store.remove('indikator', b.dataset.id);
            U.toast('Indikator dihapus');
            render();
          }
        }
      };
    });
  }
  function editForm(id) {
    const it = id ? Store.findById('indikator', id) : { elemen:activeEl, kode:'', teks:'' };
    const elemen = Narasi.ELEMEN_LABEL;
    const m = U.showModal({
      title: id ? 'Edit Indikator' : 'Tambah Indikator',
      bodyHTML: `
        <div class="row g-3">
          <div class="col-md-12"><label class="form-label">Elemen</label>
            <select class="form-select" id="i_elemen">
              ${Object.keys(elemen).map(k => `<option value="${k}" ${k===it.elemen?'selected':''}>${U.esc(elemen[k])}</option>`).join('')}
            </select></div>
          <div class="col-md-4"><label class="form-label">Kode</label><input class="form-control" id="i_kode" value="${U.esc(it.kode)}" placeholder="NA-09"></div>
          <div class="col-md-12"><label class="form-label">Teks Indikator</label>
            <textarea class="form-control" id="i_teks" rows="3" required>${U.esc(it.teks)}</textarea>
            <div class="form-text">Mulai dengan "Anak ..." dan akhiri dengan tanda titik.</div>
          </div>
        </div>`,
      footerHTML:`<button class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
        <button class="btn btn-success" id="btnSI">Simpan</button>`
    });
    m.el.querySelector('#btnSI').onclick = () => {
      const obj = {
        elemen: m.el.querySelector('#i_elemen').value,
        kode:   m.el.querySelector('#i_kode').value.trim(),
        teks:   m.el.querySelector('#i_teks').value.trim()
      };
      if (!obj.teks) { U.toast('Teks indikator wajib','danger'); return; }
      if (id) Store.update('indikator', id, obj);
      else Store.add('indikator', obj);
      m.close();
      U.toast('Indikator disimpan');
      activeEl = obj.elemen;
      render();
    };
  }
  return { render };
})();
