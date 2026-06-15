// asesmen.js — Input asesmen per murid (matrix + detail modal per indikator)
window.Pages.asesmen = (function() {
  let selTA = '';
  let selSem = '';
  let selKelas = '';
  let selMurid = '';
  let selElemen = ''; // '' = semua

  function render() {
    const user = Store.currentUser();
    const tas = Store.list('tahun_ajaran');
    const sems = Store.list('semester');
    if (!selTA) selTA = Store.activeTA()?.id || tas[0]?.id || '';
    let semsTA = sems.filter(s => s.ta_id === selTA);
    if (!selSem || !semsTA.find(s => s.id === selSem)) {
      selSem = (semsTA.find(s => s.aktif) || semsTA[0])?.id || '';
    }
    let kelas = Store.list('kelas');
    if (user.role === 'guru' && user.kelas_id) kelas = kelas.filter(k => k.id === user.kelas_id);
    if (!selKelas && kelas[0]) selKelas = kelas[0].id;
    let muridList = Store.list('murid').filter(m => m.kelas_id === selKelas);
    if (!selMurid && muridList[0]) selMurid = muridList[0].id;

    const root = document.getElementById('pageRoot');
    const elemenLabel = Narasi.ELEMEN_LABEL;

    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-clipboard-check"></i> Input Asesmen Perkembangan</h1>
        <div class="subtitle">Skala capaian: BB · MB · BSH · BSB sesuai KMA 1503</div></div>
        <div class="d-flex gap-2 flex-wrap">
          ${selMurid ? `<button class="btn btn-outline-success btn-sm" id="btnDetail"><i class="bi bi-eye"></i> Detail Anak</button>` : ''}
          <a href="#/rekap" class="btn btn-outline-success btn-sm"><i class="bi bi-bar-chart"></i> Rekap Kelas</a>
        </div>
      </div>

      <div class="panel">
        <div class="row g-2 mb-3">
          <div class="col-md-3"><label class="form-label small">Tahun Ajaran</label>
            <select class="form-select form-select-sm" id="aTA">
              ${tas.map(t => `<option value="${t.id}" ${t.id===selTA?'selected':''}>${U.esc(t.label)}${t.aktif?' (aktif)':''}</option>`).join('')}
            </select></div>
          <div class="col-md-2"><label class="form-label small">Semester</label>
            <select class="form-select form-select-sm" id="aSem">
              ${semsTA.map(s => `<option value="${s.id}" ${s.id===selSem?'selected':''}>${U.esc(s.label)}${s.aktif?' (aktif)':''}</option>`).join('') || '<option value="">(kosong)</option>'}
            </select></div>
          <div class="col-md-3"><label class="form-label small">Kelas</label>
            <select class="form-select form-select-sm" id="aKelas">
              ${kelas.map(k => `<option value="${k.id}" ${k.id===selKelas?'selected':''}>${U.esc(k.nama)}</option>`).join('') || '<option value="">(tidak ada kelas)</option>'}
            </select></div>
          <div class="col-md-4"><label class="form-label small">Murid</label>
            <select class="form-select form-select-sm" id="aMurid">
              ${muridList.map(m => `<option value="${m.id}" ${m.id===selMurid?'selected':''}>${U.esc(m.nama_lengkap)}</option>`).join('') || '<option value="">(tidak ada murid)</option>'}
            </select></div>
        </div>

        <div class="d-flex flex-wrap gap-2 mb-3">
          <span class="small text-muted me-1">Filter Elemen CP:</span>
          ${['',...Object.keys(elemenLabel)].map(el => `
            <button type="button" class="btn btn-sm ${el===selElemen?'btn-success':'btn-outline-success'}" data-el="${U.esc(el)}">
              ${el===''?'Semua':U.esc(elemenLabel[el])}
            </button>
          `).join('')}
        </div>

        ${selMurid ? renderMatrix(selMurid, selTA, selSem, selElemen) : '<div class="empty">Pilih kelas & murid dulu</div>'}
      </div>
    `;

    document.getElementById('aTA').onchange = (e) => { selTA = e.target.value; selSem = ''; render(); };
    document.getElementById('aSem').onchange = (e) => { selSem = e.target.value; render(); };
    document.getElementById('aKelas').onchange = (e) => { selKelas = e.target.value; selMurid = ''; render(); };
    document.getElementById('aMurid').onchange = (e) => { selMurid = e.target.value; render(); };
    root.querySelectorAll('[data-el]').forEach(b => {
      b.onclick = () => { selElemen = b.dataset.el; render(); };
    });
    const btnDetail = document.getElementById('btnDetail');
    if (btnDetail) btnDetail.onclick = () => showDetail(selMurid, selTA, selSem);

    if (selMurid) bindMatrix();
  }

  function renderMatrix(muridId, taId, semId, filterEl) {
    const indikator = Store.list('indikator');
    const ases = Store.list('asesmen').filter(a => a.murid_id === muridId && a.ta_id === taId && a.sem_id === semId);
    const asesByInd = {}; ases.forEach(a => asesByInd[a.indikator_id] = a);
    const elemen = Narasi.ELEMEN_LABEL;
    const elKeys = filterEl ? [filterEl] : Object.keys(elemen);
    let html = '';
    elKeys.forEach(el => {
      const inds = indikator.filter(i => i.elemen === el);
      if (!inds.length) return;
      html += `<h6 class="form-section-title">${U.esc(elemen[el])} <span class="text-muted small">(${inds.length} indikator)</span></h6>`;
      html += `<div class="table-wrap mb-3"><table class="tbl">
        <thead><tr><th width="80">Kode</th><th>Indikator</th>
          <th width="50" class="text-center" title="Belum Berkembang">BB</th>
          <th width="50" class="text-center" title="Mulai Berkembang">MB</th>
          <th width="50" class="text-center" title="Berkembang Sesuai Harapan">BSH</th>
          <th width="50" class="text-center" title="Berkembang Sangat Baik">BSB</th>
          <th width="120">Detail</th></tr></thead>
        <tbody>
          ${inds.map(i => {
            const a = asesByInd[i.id];
            const c = a?.capaian || '';
            const hasDetail = a && (a.catatan || a.bukti_url || a.rekomendasi);
            return `<tr data-ind="${i.id}">
              <td><b>${U.esc(i.kode||'-')}</b></td>
              <td>${U.esc(i.teks)}</td>
              ${['BB','MB','BSH','BSB'].map(v => `<td class="text-center">
                <input type="radio" name="cap_${i.id}" value="${v}" ${c===v?'checked':''}>
              </td>`).join('')}
              <td class="actions">
                <button type="button" class="btn btn-sm ${hasDetail?'btn-success':'btn-outline-success'}" data-detail="${i.id}" title="Catatan, bukti, rekomendasi">
                  <i class="bi bi-pencil-square"></i>${hasDetail?' ✓':''}
                </button>
                ${a ? `<button type="button" class="btn btn-sm btn-outline-danger" data-del="${a.id}" title="Hapus asesmen ini"><i class="bi bi-trash"></i></button>` : ''}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>`;
    });
    if (!html) html = '<div class="empty">Tidak ada indikator untuk elemen ini. Silakan tambah di menu Bank Indikator.</div>';
    html += `
      <div class="d-flex justify-content-between align-items-center mt-3">
        <div class="small text-muted"><i class="bi bi-info-circle"></i> Pilih capaian per indikator. Klik <i class="bi bi-pencil-square"></i> untuk tambah catatan/bukti/rekomendasi. Klik Simpan untuk menyimpan semua.</div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-success btn-sm" id="btnAllBSH"><i class="bi bi-check2-all"></i> Set Semua BSH</button>
          <button type="button" class="btn btn-success" id="btnSaveAll"><i class="bi bi-save"></i> Simpan</button>
        </div>
      </div>
    `;
    return html;
  }

  function bindMatrix() {
    const root = document.getElementById('pageRoot');

    root.querySelector('#btnSaveAll').onclick = () => {
      const rows = root.querySelectorAll('tr[data-ind]');
      let saved = 0;
      rows.forEach(tr => {
        const indId = tr.dataset.ind;
        const r = tr.querySelector(`input[name="cap_${indId}"]:checked`);
        const cap = r ? r.value : '';
        if (!cap) return;
        const ex = Store.list('asesmen').find(a => a.murid_id === selMurid && a.ta_id === selTA && a.sem_id === selSem && a.indikator_id === indId);
        const obj = {
          murid_id: selMurid, ta_id: selTA, sem_id: selSem, indikator_id: indId,
          capaian: cap,
          intensitas: cap === 'BSB' ? 'Konsisten' : cap === 'BSH' ? 'Sering' : cap === 'MB' ? 'Kadang' : 'Jarang',
          catatan: ex?.catatan || '',
          bukti_url: ex?.bukti_url || '',
          bukti_nama: ex?.bukti_nama || '',
          rekomendasi: ex?.rekomendasi || '',
          tgl: U.todayISO()
        };
        if (ex) Store.update('asesmen', ex.id, obj);
        else Store.add('asesmen', obj);
        saved++;
      });
      Store.log('save_asesmen', selMurid);
      U.toast(`${saved} asesmen tersimpan`);
      render();
    };

    root.querySelector('#btnAllBSH').onclick = () => {
      root.querySelectorAll('input[type="radio"][value="BSH"]').forEach(r => { r.checked = true; });
      U.toast('Semua diset BSH (klik Simpan untuk menyimpan)','info');
    };

    root.querySelectorAll('[data-detail]').forEach(b => {
      b.onclick = () => detailModal(b.dataset.detail);
    });

    root.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = async () => {
        if (!await U.confirmModal({ title:'Hapus asesmen?', body:'Asesmen indikator ini akan dihapus.', danger:true, okText:'Hapus' })) return;
        Store.remove('asesmen', b.dataset.del);
        U.toast('Asesmen dihapus');
        render();
      };
    });
  }

  function detailModal(indikatorId) {
    const ind = Store.findById('indikator', indikatorId);
    if (!ind) return;
    const ex = Store.list('asesmen').find(a => a.murid_id === selMurid && a.ta_id === selTA && a.sem_id === selSem && a.indikator_id === indikatorId);
    const a = ex || { capaian:'', catatan:'', bukti_url:'', bukti_nama:'', rekomendasi:'' };

    const m = U.showModal({
      size:'lg',
      title: `Detail Asesmen: ${ind.kode || ''}`,
      bodyHTML: `
        <div class="alert alert-light border small mb-3">
          <div class="text-muted small">Indikator</div>
          <div>${U.esc(ind.teks)}</div>
        </div>

        <div class="mb-3">
          <label class="form-label">Capaian Perkembangan</label>
          <div class="d-flex gap-2 flex-wrap">
            ${[['BB','Belum Berkembang','#c62828'],['MB','Mulai Berkembang','#f57f17'],['BSH','Berkembang Sesuai Harapan','#1565c0'],['BSB','Berkembang Sangat Baik','#2e7d32']].map(([v,l,c]) => `
              <label class="form-check-label" style="cursor:pointer">
                <input type="radio" name="dCap" value="${v}" ${a.capaian===v?'checked':''}>
                <span style="display:inline-block;padding:4px 10px;border-radius:14px;background:${a.capaian===v?c:'#f5f5f5'};color:${a.capaian===v?'#fff':'#333'};font-weight:600;font-size:12px;margin-left:4px"><b>${v}</b> · ${l}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Catatan Observasi</label>
          <textarea class="form-control" id="dCat" rows="3" placeholder="Tuliskan apa yang diamati guru terkait indikator ini...">${U.esc(a.catatan||'')}</textarea>
        </div>

        <div class="mb-3">
          <label class="form-label">Bukti Kegiatan</label>
          ${a.bukti_url ? `
            <div class="mb-2 d-flex align-items-center gap-2 p-2" style="background:#e8f5e9;border-radius:8px">
              ${a.bukti_url.startsWith('data:image') ? `<img src="${a.bukti_url}" style="max-height:60px;border-radius:4px">` : `<i class="bi bi-file-earmark" style="font-size:32px;color:#2e7d32"></i>`}
              <div class="small flex-grow-1">${U.esc(a.bukti_nama||'bukti tersimpan')}</div>
              <button type="button" class="btn btn-sm btn-outline-danger" id="dHapusBukti"><i class="bi bi-trash"></i></button>
            </div>
          ` : ''}
          <input type="file" class="form-control" id="dBukti" accept="image/*,.pdf">
          <div class="form-text">Upload foto kegiatan atau PDF (opsional). Akan disimpan sebagai data:url di browser.</div>
        </div>

        <div class="mb-3">
          <label class="form-label">Rekomendasi Tindak Lanjut</label>
          <textarea class="form-control" id="dRek" rows="2" placeholder="Saran kegiatan untuk distimulasi di kelas/rumah...">${U.esc(a.rekomendasi||'')}</textarea>
        </div>
      `,
      footerHTML: `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
        <button type="button" class="btn btn-success" id="btnSaveDetail"><i class="bi bi-save"></i> Simpan</button>`
    });

    let buktiBaru = null;
    let hapusBukti = false;
    const inputFile = m.el.querySelector('#dBukti');
    inputFile.onchange = async () => {
      const f = inputFile.files[0];
      if (f) {
        if (f.size > 2 * 1024 * 1024) {
          U.toast('Bukti maksimal 2 MB','warning');
          inputFile.value = '';
          return;
        }
        buktiBaru = { url: await U.fileToDataURL(f), nama: f.name };
      }
    };
    const btnHapusBukti = m.el.querySelector('#dHapusBukti');
    if (btnHapusBukti) btnHapusBukti.onclick = () => {
      hapusBukti = true;
      btnHapusBukti.closest('.d-flex').remove();
      U.toast('Bukti akan dihapus saat simpan','info');
    };

    m.el.querySelector('#btnSaveDetail').onclick = () => {
      const cap = m.el.querySelector('input[name="dCap"]:checked')?.value || a.capaian || '';
      if (!cap) { U.toast('Pilih capaian dulu','warning'); return; }
      const obj = {
        murid_id: selMurid, ta_id: selTA, sem_id: selSem, indikator_id: indikatorId,
        capaian: cap,
        intensitas: cap === 'BSB' ? 'Konsisten' : cap === 'BSH' ? 'Sering' : cap === 'MB' ? 'Kadang' : 'Jarang',
        catatan: m.el.querySelector('#dCat').value.trim(),
        rekomendasi: m.el.querySelector('#dRek').value.trim(),
        tgl: U.todayISO()
      };
      if (buktiBaru) {
        obj.bukti_url = buktiBaru.url;
        obj.bukti_nama = buktiBaru.nama;
      } else if (hapusBukti) {
        obj.bukti_url = '';
        obj.bukti_nama = '';
      } else {
        obj.bukti_url = a.bukti_url || '';
        obj.bukti_nama = a.bukti_nama || '';
      }
      if (ex) Store.update('asesmen', ex.id, obj);
      else Store.add('asesmen', obj);
      Store.log('save_asesmen_detail', selMurid + ':' + indikatorId);
      m.close();
      U.toast('Detail asesmen tersimpan');
      render();
    };
  }

  function showDetail(muridId, taId, semId) {
    const m = Store.findById('murid', muridId);
    if (!m) return;
    const indikator = Store.list('indikator');
    const indMap = {}; indikator.forEach(i => indMap[i.id] = i);
    const ases = Store.list('asesmen').filter(a => a.murid_id === muridId && a.ta_id === taId && a.sem_id === semId);
    const elemen = Narasi.ELEMEN_LABEL;

    const dist = { BB:0, MB:0, BSH:0, BSB:0 };
    ases.forEach(a => dist[a.capaian] = (dist[a.capaian]||0)+1);
    const total = ases.length || 1;
    const skor = (dist.BSB*4 + dist.BSH*3 + dist.MB*2 + dist.BB*1) / total;

    let html = `
      <div class="row g-2 mb-3">
        <div class="col"><div class="card-stat" style="padding:10px"><div class="label">BB</div><div class="value" style="font-size:18px;color:#c62828">${dist.BB}</div></div></div>
        <div class="col"><div class="card-stat" style="padding:10px"><div class="label">MB</div><div class="value" style="font-size:18px;color:#f57f17">${dist.MB}</div></div></div>
        <div class="col"><div class="card-stat" style="padding:10px"><div class="label">BSH</div><div class="value" style="font-size:18px;color:#1565c0">${dist.BSH}</div></div></div>
        <div class="col"><div class="card-stat" style="padding:10px"><div class="label">BSB</div><div class="value" style="font-size:18px;color:#2e7d32">${dist.BSB}</div></div></div>
        <div class="col"><div class="card-stat gold" style="padding:10px"><div class="label">Skor</div><div class="value" style="font-size:18px">${skor.toFixed(2)}/4</div></div></div>
      </div>
    `;
    Object.keys(elemen).forEach(el => {
      const items = ases.map(a => ({ a, ind: indMap[a.indikator_id] })).filter(x => x.ind && x.ind.elemen === el);
      if (!items.length) return;
      html += `<h6 class="form-section-title">${U.esc(elemen[el])}</h6>`;
      html += `<div class="table-wrap mb-3"><table class="tbl">
        <thead><tr><th width="80">Kode</th><th>Indikator</th><th width="60">Capaian</th><th>Catatan</th><th>Rekomendasi</th><th width="80">Bukti</th></tr></thead>
        <tbody>
          ${items.map(({a, ind}) => `<tr>
            <td><b>${U.esc(ind.kode||'-')}</b></td>
            <td>${U.esc(ind.teks)}</td>
            <td><span class="bdg bdg-${a.capaian.toLowerCase()}">${U.esc(a.capaian)}</span></td>
            <td><small>${U.esc(a.catatan||'-')}</small></td>
            <td><small>${U.esc(a.rekomendasi||'-')}</small></td>
            <td>${a.bukti_url ? (a.bukti_url.startsWith('data:image') ? `<img src="${a.bukti_url}" style="max-width:60px;max-height:50px;cursor:pointer" onclick="window.open('${a.bukti_url}','_blank')">` : `<a href="${a.bukti_url}" target="_blank" download="${U.esc(a.bukti_nama||'bukti')}"><i class="bi bi-file-earmark"></i> ${U.esc(a.bukti_nama||'unduh')}</a>`) : '<span class="text-muted">-</span>'}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;
    });
    if (!ases.length) html = '<div class="empty">Belum ada asesmen tersimpan untuk anak ini di TA/Semester yang dipilih.</div>';

    U.showModal({
      size:'xl',
      title: `Detail Asesmen: ${m.nama_lengkap}`,
      bodyHTML: html,
      footerHTML: `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>`
    });
  }

  return { render };
})();
