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
          <div class="d-flex justify-content-between align-items-center">
            <label class="form-label mb-0">Catatan Observasi</label>
            <button type="button" class="btn btn-sm btn-outline-secondary" id="dIsiOtomatis" title="Isi otomatis berdasarkan capaian & indikator"><i class="bi bi-magic"></i> Isi Otomatis</button>
          </div>
          <textarea class="form-control mt-1" id="dCat" rows="3" placeholder="Tuliskan apa yang diamati guru terkait indikator ini...">${U.esc(a.catatan||'')}</textarea>
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

    // Auto-fill saat capaian berubah (kalau textarea masih kosong)
    const dCat = m.el.querySelector('#dCat');
    const dRek = m.el.querySelector('#dRek');
    const radios = m.el.querySelectorAll('input[name="dCap"]');
    radios.forEach(r => r.onchange = () => {
      const cap = r.value;
      // Update visual highlight
      radios.forEach(x => {
        const span = x.parentElement.querySelector('span');
        if (!span) return;
        if (x.checked) {
          const colorMap = { BB:'#c62828', MB:'#f57f17', BSH:'#1565c0', BSB:'#2e7d32' };
          span.style.background = colorMap[x.value]; span.style.color = '#fff';
        } else {
          span.style.background = '#f5f5f5'; span.style.color = '#333';
        }
      });
      if (!dCat.value.trim()) dCat.value = generateCatatan(ind, cap);
      if (!dRek.value.trim()) dRek.value = generateRekomendasi(ind, cap);
    });

    // Tombol isi ulang manual (override isi yang ada)
    m.el.querySelector('#dIsiOtomatis').onclick = () => {
      const cap = m.el.querySelector('input[name="dCap"]:checked')?.value;
      if (!cap) { U.toast('Pilih capaian dulu','warning'); return; }
      dCat.value = generateCatatan(ind, cap);
      dRek.value = generateRekomendasi(ind, cap);
      U.toast('Catatan & rekomendasi terisi otomatis');
    };
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

    const ta = Store.findById('tahun_ajaran', taId);
    const sem = Store.findById('semester', semId);
    const periodeLabel = `TA ${ta?.label||'-'} \u00b7 Semester ${sem?.label||'-'}`;

    U.showModal({
      size:'xl',
      title: `Detail Asesmen: ${m.nama_lengkap}`,
      bodyHTML: html,
      footerHTML: `
        <button type="button" class="btn btn-outline-success" id="btnCetakDetail"><i class="bi bi-printer"></i> Cetak</button>
        <div class="btn-group ms-2" role="group">
          <input type="radio" class="btn-check" name="detailOri" id="oriPort" value="portrait" checked>
          <label class="btn btn-sm btn-outline-secondary" for="oriPort"><i class="bi bi-file-text"></i> Portrait</label>
          <input type="radio" class="btn-check" name="detailOri" id="oriLand" value="landscape">
          <label class="btn btn-sm btn-outline-secondary" for="oriLand"><i class="bi bi-file-earmark-image"></i> Landscape</label>
        </div>
        <button type="button" class="btn btn-secondary ms-auto" data-bs-dismiss="modal">Tutup</button>`
    });

    document.getElementById('btnCetakDetail').onclick = () => {
      const ori = document.querySelector('input[name="detailOri"]:checked')?.value || 'portrait';
      cetakDetailAsesmen(m, periodeLabel, html, ori);
    };
  }

  function cetakDetailAsesmen(murid, periodeLabel, bodyHTML, orientation) {
    const profil = Store.profilRA();
    const css = `
      @page { size: A4 ${orientation}; margin: 12mm; }
      body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; margin: 0; padding: 0; }
      .kop { display:flex; gap:12px; align-items:center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
      .kop img { width: 60px; height: 60px; object-fit: contain; }
      .kop .text { flex:1; text-align:center; }
      .kop .text h2 { margin:0; font-size:16pt; }
      .kop .text .yayasan { font-size:10pt; font-weight:600; }
      .kop .text .alamat { font-size:9pt; }
      .judul { text-align:center; font-weight:bold; font-size:13pt; text-transform:uppercase; margin: 6px 0 2px; }
      .sub { text-align:center; font-size:10pt; margin-bottom:10px; }
      .info { display:flex; gap:30px; margin: 8px 0 12px; font-size:10.5pt; flex-wrap:wrap; }
      .info .lbl { display:inline-block; min-width:90px; }
      table.tbl { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9.5pt; }
      table.tbl th, table.tbl td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
      table.tbl th { background: #e8f5e9; font-weight: 600; text-align:center; }
      .form-section-title { font-weight:bold; font-size:11pt; margin: 10px 0 4px; padding: 4px 6px; background: #f0f0f0; border-left: 3px solid #2e7d32; }
      .row { display:flex; gap:6px; margin-bottom: 8px; }
      .col { flex:1; border: 1px solid #999; padding: 6px; text-align:center; }
      .col .label { font-size:9pt; color:#555; }
      .col .value { font-size:14pt; font-weight:bold; }
      .empty { text-align:center; padding:20px; font-style:italic; color:#777; }
      .bdg { display:inline-block; padding: 2px 6px; border-radius: 3px; font-size:9pt; font-weight:600; border: 1px solid #999; }
      .bdg-bb { background:#ffebee; } .bdg-mb { background:#fff8e1; }
      .bdg-bsh { background:#e3f2fd; } .bdg-bsb { background:#e8f5e9; }
      .table-wrap { width: 100%; overflow: visible; }
      img { max-width: 50px; max-height: 40px; }
      .ttd { display:flex; justify-content: space-between; margin-top: 30px; font-size: 10.5pt; }
      .ttd .col-ttd { width: 40%; text-align:center; }
      .ttd .nama { margin-top: 60px; font-weight: 600; text-decoration: underline; }
      .card-stat { padding:6px; border:1px solid #999; text-align:center; }
      .card-stat .label { font-size:9pt; color:#555; }
      .card-stat .value { font-size:13pt; font-weight:bold; }
    `;
    const kop = `
      <div class="kop">
        ${profil.logo_ra_dataurl ? `<img src="${profil.logo_ra_dataurl}">` : '<div style="width:60px;height:60px"></div>'}
        <div class="text">
          ${profil.nama_yayasan ? `<div class="yayasan">${U.esc(profil.nama_yayasan.toUpperCase())}</div>` : ''}
          <h2>${U.esc(profil.nama || 'RAUDHATUL ATHFAL')}</h2>
          <div class="alamat">${U.esc(profil.alamat||'')}, ${U.esc(profil.desa||'')}, ${U.esc(profil.kec||'')}, ${U.esc(profil.kab||'')}, ${U.esc(profil.prov||'')}</div>
          <div class="alamat">NSM: ${U.esc(profil.nsm||'-')} &mdash; NPSN: ${U.esc(profil.npsn||'-')}</div>
        </div>
        <div style="width:60px;height:60px"></div>
      </div>
      <div class="judul">Detail Asesmen Perkembangan</div>
      <div class="sub">${U.esc(periodeLabel)}</div>
      <div class="info">
        <div><span class="lbl">Nama</span>: <b>${U.esc(murid.nama_lengkap||'-')}</b></div>
        <div><span class="lbl">NISN</span>: ${U.esc(murid.nisn||'-')}</div>
        <div><span class="lbl">Jenis Kelamin</span>: ${U.esc(murid.jk||'-')}</div>
      </div>
    `;
    const ttd = `
      <div class="ttd">
        <div class="col-ttd">
          Mengetahui,<br>Kepala ${U.esc(profil.nama||'RA')}<br>
          <div class="nama">${U.esc(profil.kepala_nama||'(.................)')}</div>
          ${profil.kepala_nip ? `<div>NIP. ${U.esc(profil.kepala_nip)}</div>` : ''}
        </div>
        <div class="col-ttd">
          ${U.esc(profil.kota_cetak||'')}, ${new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}<br>Guru Kelas<br>
          <div class="nama">(.................)</div>
        </div>
      </div>
    `;
    // Pakai iframe (lebih reliable, ngga kena popup blocker)
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Detail Asesmen ${U.esc(murid.nama_lengkap||'')}</title><style>${css}</style></head><body>${kop}${bodyHTML}${ttd}</body></html>`);
    doc.close();
    // Tunggu image load lalu print
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) { U.toast('Gagal cetak: '+e.message,'danger'); }
      // Cleanup setelah print dialog ditutup (delay 5 detik)
      setTimeout(() => iframe.remove(), 5000);
    }, 400);
    U.toast('Membuka dialog cetak...');
  }

  // Auto-fill catatan observasi & rekomendasi berdasarkan capaian + indikator
  function generateCatatan(ind, cap) {
    const teks = (ind?.teks || '').toLowerCase();
    const elemen = ind?.elemen || '';
    // Snippet pendek nama aktivitas dari teks indikator
    const aktivitas = teks.length > 70 ? teks.slice(0, 70).split(' ').slice(0, -1).join(' ') + '...' : teks;

    const tmpl = {
      BSB: [
        `Ananda menunjukkan kemampuan yang konsisten dan mandiri terkait "${aktivitas}". Ananda mampu melakukannya tanpa arahan guru dan kerap menjadi contoh bagi teman-teman.`,
        `Ananda secara konsisten menampilkan capaian terkait "${aktivitas}". Ananda melakukannya dengan percaya diri, runtut, dan tuntas.`,
        `Ananda terlihat sangat berkembang dalam hal "${aktivitas}". Ananda mengerjakannya dengan inisiatif sendiri dan hasil yang baik.`
      ],
      BSH: [
        `Ananda sudah mampu melakukan "${aktivitas}" sesuai harapan. Ananda menyelesaikan kegiatan dengan baik dengan sedikit panduan guru.`,
        `Ananda menunjukkan kemajuan yang baik terkait "${aktivitas}". Capaian Ananda sudah sesuai dengan tahap perkembangannya.`,
        `Ananda terlihat antusias dan mampu mengikuti kegiatan "${aktivitas}" dengan baik.`
      ],
      MB: [
        `Ananda mulai menunjukkan kemampuan terkait "${aktivitas}". Ananda masih membutuhkan bimbingan guru untuk menyelesaikannya secara utuh.`,
        `Ananda sedang dalam proses berkembang pada kegiatan "${aktivitas}". Dengan dukungan guru, Ananda dapat mengikuti tahap demi tahap.`,
        `Ananda menunjukkan minat pada kegiatan "${aktivitas}" dan sedang belajar untuk lebih konsisten.`
      ],
      BB: [
        `Ananda masih dalam tahap awal mengenal kegiatan "${aktivitas}". Ananda akan terus didampingi melalui pembiasaan dan stimulasi yang menyenangkan.`,
        `Ananda baru memulai pengalaman terkait "${aktivitas}". Guru memberi pendampingan agar Ananda nyaman bereksplorasi.`,
        `Ananda perlu pembiasaan tambahan untuk kegiatan "${aktivitas}". Pendampingan akan terus diberikan dengan pendekatan yang lembut.`
      ]
    };
    const arr = tmpl[cap] || tmpl.BSH;
    // Pilih template berdasarkan hash sederhana indikator id biar konsisten per indikator
    const idx = (ind?.id || '').split('').reduce((s,c) => s + c.charCodeAt(0), 0) % arr.length;
    const kalimat = arr[idx];
    // Capitalize first letter of aktivitas spot kalau perlu — biar aman pakai sebagaimana adanya
    return kalimat.charAt(0).toUpperCase() + kalimat.slice(1);
  }

  function generateRekomendasi(ind, cap) {
    const teks = (ind?.teks || '').toLowerCase();
    const aktivitas = teks.length > 60 ? teks.slice(0, 60).split(' ').slice(0, -1).join(' ') + '...' : teks;
    const tmpl = {
      BSB: [
        `Pertahankan capaian Ananda. Berikan tantangan baru yang lebih variatif terkait "${aktivitas}" dan ajak Ananda membantu teman yang masih belajar.`,
        `Lanjutkan stimulasi dengan kegiatan yang lebih kompleks. Ananda dapat dilibatkan sebagai role model dalam kegiatan kelompok.`
      ],
      BSH: [
        `Lanjutkan stimulasi rutin terkait "${aktivitas}" dengan variasi kegiatan yang menarik agar capaian Ananda semakin konsisten.`,
        `Kembangkan kegiatan serupa dengan tingkat kesulitan bertahap. Berikan apresiasi positif untuk memperkuat kemajuan Ananda.`
      ],
      MB: [
        `Berikan pendampingan tambahan dan kegiatan pembiasaan terkait "${aktivitas}" baik di kelas maupun di rumah. Ajak orang tua melanjutkan stimulasi serupa.`,
        `Lanjutkan dengan kegiatan bermain yang menyenangkan untuk memperkuat kemampuan Ananda. Berikan contoh konkret dan apresiasi setiap usaha.`
      ],
      BB: [
        `Lakukan pembiasaan rutin dengan langkah sederhana. Libatkan orang tua untuk menstimulasi "${aktivitas}" di rumah dengan suasana yang nyaman.`,
        `Berikan pengalaman bermain yang konkret dan berulang. Dampingi Ananda dengan sabar agar tumbuh rasa percaya diri.`
      ]
    };
    const arr = tmpl[cap] || tmpl.BSH;
    const idx = ((ind?.id || '').split('').reduce((s,c) => s + c.charCodeAt(0), 0) + 7) % arr.length;
    return arr[idx];
  }

  return { render };
})();
