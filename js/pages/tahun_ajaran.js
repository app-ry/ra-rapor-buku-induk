// tahun_ajaran.js
window.Pages.tahun_ajaran = (function() {
  function render() {
    const tas = Store.list('tahun_ajaran');
    const sems = Store.list('semester');
    const root = document.getElementById('pageRoot');
    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-calendar-range"></i> Tahun Ajaran & Semester</h1></div>
        <button class="btn btn-success btn-sm" id="btnAddTA"><i class="bi bi-plus"></i> Tambah TA</button>
      </div>
      <div class="panel">
        <h6 class="form-section-title">Tahun Ajaran</h6>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Label</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            ${tas.map(t => `<tr>
              <td>${U.esc(t.label)}</td>
              <td>${t.aktif?'<span class="bdg bdg-bsb">Aktif</span>':'<span class="bdg bdg-bb">Non-aktif</span>'}</td>
              <td class="actions">
                <button class="btn btn-sm btn-outline-success" data-act="aktif" data-id="${t.id}">Aktifkan</button>
                <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${t.id}"><i class="bi bi-trash"></i></button>
              </td>
            </tr>`).join('') || `<tr><td colspan="3" class="text-center text-muted">Belum ada</td></tr>`}
          </tbody>
        </table></div>

        <h6 class="form-section-title mt-4">Semester</h6>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>TA</th><th>Semester</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            ${sems.map(s => {
              const ta = tas.find(x => x.id === s.ta_id);
              return `<tr>
                <td>${U.esc(ta?.label||'-')}</td>
                <td>${U.esc(s.label)}</td>
                <td>${s.aktif?'<span class="bdg bdg-bsb">Aktif</span>':'<span class="bdg bdg-bb">Non-aktif</span>'}</td>
                <td class="actions">
                  <button class="btn btn-sm btn-outline-success" data-act="sem-aktif" data-id="${s.id}">Aktifkan</button>
                </td>
              </tr>`;
            }).join('') || `<tr><td colspan="4" class="text-center text-muted">Belum ada</td></tr>`}
          </tbody>
        </table></div>
      </div>
    `;

    document.getElementById('btnAddTA').onclick = () => {
      const label = prompt('Label tahun ajaran baru (contoh: 2026/2027):');
      if (!label) return;
      const ta = Store.add('tahun_ajaran', { label, aktif:false });
      Store.add('semester', { ta_id: ta.id, label:'Ganjil', aktif:false });
      Store.add('semester', { ta_id: ta.id, label:'Genap', aktif:false });
      U.toast('Tahun ajaran ditambah');
      render();
    };

    root.querySelectorAll('[data-act]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const act = btn.dataset.act;
        if (act === 'aktif') {
          Store.list('tahun_ajaran').forEach(t => Store.update('tahun_ajaran', t.id, { aktif: t.id === id }));
          U.toast('TA diaktifkan');
        } else if (act === 'sem-aktif') {
          const sem = Store.findById('semester', id);
          Store.list('semester').forEach(s => {
            if (s.ta_id === sem.ta_id) Store.update('semester', s.id, { aktif: s.id === id });
          });
          U.toast('Semester diaktifkan');
        } else if (act === 'del') {
          if (await U.confirmModal({ title:'Hapus TA?', body:'Yakin hapus tahun ajaran ini?', danger:true, okText:'Hapus' })) {
            Store.remove('tahun_ajaran', id);
            Store.list('semester').filter(s => s.ta_id === id).forEach(s => Store.remove('semester', s.id));
            U.toast('Tahun ajaran dihapus');
          }
        }
        render();
      };
    });
  }
  return { render };
})();
