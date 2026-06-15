// asesmen.js — Input asesmen per murid (matrix view: indikator x capaian)
window.Pages.asesmen = (function() {
  let selKelas = '';
  let selMurid = '';

  function render() {
    const user = Store.currentUser();
    let kelas = Store.list('kelas');
    if (user.role === 'guru' && user.kelas_id) kelas = kelas.filter(k => k.id === user.kelas_id);
    if (!selKelas && kelas[0]) selKelas = kelas[0].id;
    let murid = Store.list('murid').filter(m => m.kelas_id === selKelas);
    if (!selMurid && murid[0]) selMurid = murid[0].id;
    const ta = Store.activeTA();
    const sem = Store.activeSem();
    const root = document.getElementById('pageRoot');

    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-clipboard-check"></i> Input Asesmen Perkembangan</h1>
        <div class="subtitle">${U.esc(ta?.label||'-')} · Semester ${U.esc(sem?.label||'-')}</div></div>
      </div>

      <div class="panel">
        <div class="row g-2 mb-3">
          <div class="col-md-5"><label class="form-label small">Kelas</label>
            <select class="form-select" id="aKelas">
              ${kelas.map(k => `<option value="${k.id}" ${k.id===selKelas?'selected':''}>${U.esc(k.nama)}</option>`).join('') || '<option value="">(tidak ada kelas)</option>'}
            </select></div>
          <div class="col-md-7"><label class="form-label small">Murid</label>
            <select class="form-select" id="aMurid">
              ${murid.map(m => `<option value="${m.id}" ${m.id===selMurid?'selected':''}>${U.esc(m.nama_lengkap)}</option>`).join('') || '<option value="">(tidak ada murid)</option>'}
            </select></div>
        </div>

        ${selMurid ? renderMatrix(selMurid, ta?.id, sem?.id) : '<div class="empty">Pilih kelas & murid dulu</div>'}
      </div>
    `;
    document.getElementById('aKelas').onchange = (e) => { selKelas = e.target.value; selMurid = ''; render(); };
    document.getElementById('aMurid').onchange = (e) => { selMurid = e.target.value; render(); };

    if (selMurid) bindMatrix();
  }

  function renderMatrix(muridId, taId, semId) {
    const indikator = Store.list('indikator');
    const ases = Store.list('asesmen').filter(a => a.murid_id === muridId && a.ta_id === taId && a.sem_id === semId);
    const asesByInd = {}; ases.forEach(a => asesByInd[a.indikator_id] = a);
    const elemen = Narasi.ELEMEN_LABEL;
    let html = '';
    Object.keys(elemen).forEach(el => {
      const inds = indikator.filter(i => i.elemen === el);
      if (!inds.length) return;
      html += `<h6 class="form-section-title">${U.esc(elemen[el])}</h6>`;
      html += `<div class="table-wrap mb-3"><table class="tbl">
        <thead><tr><th width="80">Kode</th><th>Indikator</th>
          <th width="60" class="text-center">BB</th>
          <th width="60" class="text-center">MB</th>
          <th width="60" class="text-center">BSH</th>
          <th width="60" class="text-center">BSB</th>
          <th width="180">Catatan</th></tr></thead>
        <tbody>
          ${inds.map(i => {
            const a = asesByInd[i.id];
            const c = a?.capaian || '';
            return `<tr data-ind="${i.id}">
              <td><b>${U.esc(i.kode||'-')}</b></td>
              <td>${U.esc(i.teks)}</td>
              ${['BB','MB','BSH','BSB'].map(v => `<td class="text-center">
                <input type="radio" name="cap_${i.id}" value="${v}" ${c===v?'checked':''}>
              </td>`).join('')}
              <td><input class="form-control form-control-sm" data-catatan="${i.id}" value="${U.esc(a?.catatan||'')}"></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>`;
    });
    html += `
      <div class="d-flex justify-content-between align-items-center mt-3">
        <div class="small text-muted"><i class="bi bi-info-circle"></i> Pilih capaian untuk tiap indikator. Catatan opsional. Klik Simpan untuk menyimpan semua.</div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-success btn-sm" id="btnAllBSH"><i class="bi bi-check2-all"></i> Set Semua BSH</button>
          <button class="btn btn-success" id="btnSaveAll"><i class="bi bi-save"></i> Simpan</button>
        </div>
      </div>
    `;
    return html;
  }

  function bindMatrix() {
    const root = document.getElementById('pageRoot');
    root.querySelector('#btnSaveAll').onclick = () => {
      const ta = Store.activeTA(); const sem = Store.activeSem();
      const rows = root.querySelectorAll('tr[data-ind]');
      let saved = 0;
      rows.forEach(tr => {
        const indId = tr.dataset.ind;
        const r = tr.querySelector(`input[name="cap_${indId}"]:checked`);
        const cap = r ? r.value : '';
        const cat = tr.querySelector(`input[data-catatan="${indId}"]`).value.trim();
        if (!cap && !cat) {
          // skip kosong total
          return;
        }
        const ex = Store.list('asesmen').find(a => a.murid_id === selMurid && a.ta_id === ta.id && a.sem_id === sem.id && a.indikator_id === indId);
        const obj = {
          murid_id: selMurid, ta_id: ta.id, sem_id: sem.id, indikator_id: indId,
          capaian: cap || (ex?.capaian || 'BSH'),
          intensitas: cap === 'BSB' ? 'Konsisten' : cap === 'BSH' ? 'Sering' : cap === 'MB' ? 'Kadang' : cap === 'BB' ? 'Jarang' : (ex?.intensitas||''),
          catatan: cat,
          tgl: U.todayISO()
        };
        if (ex) Store.update('asesmen', ex.id, obj);
        else Store.add('asesmen', obj);
        saved++;
      });
      Store.log('save_asesmen', selMurid);
      U.toast(`${saved} asesmen tersimpan`);
    };
    root.querySelector('#btnAllBSH').onclick = () => {
      root.querySelectorAll('input[type="radio"][value="BSH"]').forEach(r => { r.checked = true; });
      U.toast('Semua diset BSH (belum disimpan)');
    };
  }

  return { render };
})();
