// rapor.js — Editor Rapor (deskripsi, refleksi, kehadiran, info, TTD)
window.Pages.rapor = (function() {
  let selKelas = '';
  let selMurid = '';

  function render() {
    const user = Store.currentUser();
    let kelas = Store.list('kelas');
    if (user.role === 'guru' && user.kelas_id) kelas = kelas.filter(k => k.id === user.kelas_id);
    if (!selKelas && kelas[0]) selKelas = kelas[0].id;
    const muridList = Store.list('murid').filter(m => m.kelas_id === selKelas);
    if (!selMurid && muridList[0]) selMurid = muridList[0].id;
    const ta = Store.activeTA(); const sem = Store.activeSem();
    const root = document.getElementById('pageRoot');

    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-file-text"></i> Rapor RA</h1>
        <div class="subtitle">${U.esc(ta?.label||'-')} · Semester ${U.esc(sem?.label||'-')}</div></div>
      </div>

      <div class="panel">
        <div class="row g-2 mb-3">
          <div class="col-md-5"><label class="form-label small">Kelas</label>
            <select class="form-select" id="rKelas">
              ${kelas.map(k => `<option value="${k.id}" ${k.id===selKelas?'selected':''}>${U.esc(k.nama)}</option>`).join('')}
            </select></div>
          <div class="col-md-7"><label class="form-label small">Murid</label>
            <select class="form-select" id="rMurid">
              ${muridList.map(m => `<option value="${m.id}" ${m.id===selMurid?'selected':''}>${U.esc(m.nama_lengkap)}</option>`).join('') || '<option value="">(kosong)</option>'}
            </select></div>
        </div>
        ${selMurid ? renderEditor(selMurid, ta?.id, sem?.id) : '<div class="empty">Pilih murid dulu</div>'}
      </div>
    `;
    document.getElementById('rKelas').onchange = (e) => { selKelas = e.target.value; selMurid = ''; render(); };
    document.getElementById('rMurid').onchange = (e) => { selMurid = e.target.value; render(); };
    if (selMurid) bindEditor();
  }

  function renderEditor(muridId, taId, semId) {
    const m = Store.findById('murid', muridId);
    let r = Store.list('rapor').find(x => x.murid_id === muridId && x.ta_id === taId && x.sem_id === semId);
    if (!r) {
      r = { murid_id: muridId, ta_id: taId, sem_id: semId,
        deskripsi: { nilai_agama:'', jati_diri:'', literasi:'', kokurikuler:'' },
        refleksi_ortu: { q1:'', q2:'', q3:'' },
        info_perkembangan:'',
        kehadiran:{ sakit:0, izin:0, alfa:0 },
        tanda_tangan:{ tempat: Store.getObj('profil_ra',{}).kota_cetak||'', tanggal: U.todayISO(), ortu_nama:'' },
        locked:false
      };
    }
    const elemen = Narasi.ELEMEN_LABEL;
    const lockBadge = r.locked
      ? '<span class="bdg bdg-bsb"><i class="bi bi-lock-fill"></i> Terkunci</span>'
      : '<span class="bdg bdg-mb"><i class="bi bi-pencil"></i> Draft</span>';

    return `
      <div class="alert alert-light border d-flex justify-content-between align-items-center">
        <div><b>${U.esc(m.nama_lengkap)}</b> · ${lockBadge}</div>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-success" id="btnGen"><i class="bi bi-magic"></i> Generate Otomatis</button>
          <a class="btn btn-sm btn-outline-success" href="#/cetak/${m.id}"><i class="bi bi-printer"></i> Cetak</a>
        </div>
      </div>

      <h6 class="form-section-title">Deskripsi Perkembangan per Elemen</h6>
      ${Object.keys(elemen).map(el => `
        <div class="mb-3">
          <label class="form-label fw-semibold">${U.esc(elemen[el])}</label>
          <textarea class="form-control" id="d_${el}" rows="6" ${r.locked?'disabled':''}>${U.esc(r.deskripsi[el]||'')}</textarea>
        </div>
      `).join('')}

      <h6 class="form-section-title">Refleksi Orang Tua/Wali</h6>
      <div class="mb-2"><label class="form-label small">1. Apa yang sudah berkembang pada diri anak saya?</label>
        <textarea class="form-control" id="q1" rows="3" ${r.locked?'disabled':''}>${U.esc(r.refleksi_ortu?.q1||'')}</textarea></div>
      <div class="mb-2"><label class="form-label small">2. Apa yang masih perlu dikembangkan?</label>
        <textarea class="form-control" id="q2" rows="3" ${r.locked?'disabled':''}>${U.esc(r.refleksi_ortu?.q2||'')}</textarea></div>
      <div class="mb-3"><label class="form-label small">3. Langkah-langkah yang dapat dilakukan?</label>
        <textarea class="form-control" id="q3" rows="3" ${r.locked?'disabled':''}>${U.esc(r.refleksi_ortu?.q3||'')}</textarea></div>

      <h6 class="form-section-title">Informasi Perkembangan Anak</h6>
      <textarea class="form-control mb-3" id="info_p" rows="4" ${r.locked?'disabled':''}>${U.esc(r.info_perkembangan||'')}</textarea>

      <h6 class="form-section-title">Kehadiran</h6>
      <div class="row g-2 mb-3">
        <div class="col-md-4"><label class="form-label small">Sakit</label><input type="number" class="form-control" id="k_sakit" value="${r.kehadiran?.sakit||0}" ${r.locked?'disabled':''}></div>
        <div class="col-md-4"><label class="form-label small">Izin</label><input type="number" class="form-control" id="k_izin" value="${r.kehadiran?.izin||0}" ${r.locked?'disabled':''}></div>
        <div class="col-md-4"><label class="form-label small">Tanpa Keterangan</label><input type="number" class="form-control" id="k_alfa" value="${r.kehadiran?.alfa||0}" ${r.locked?'disabled':''}></div>
      </div>

      <h6 class="form-section-title">Tanda Tangan</h6>
      <div class="row g-2 mb-3">
        <div class="col-md-4"><label class="form-label small">Tempat</label><input class="form-control" id="t_tempat" value="${U.esc(r.tanda_tangan?.tempat||'')}" ${r.locked?'disabled':''}></div>
        <div class="col-md-4"><label class="form-label small">Tanggal</label><input type="date" class="form-control" id="t_tanggal" value="${r.tanda_tangan?.tanggal||''}" ${r.locked?'disabled':''}></div>
        <div class="col-md-4"><label class="form-label small">Nama Orang Tua/Wali</label><input class="form-control" id="t_ortu" value="${U.esc(r.tanda_tangan?.ortu_nama||'')}" ${r.locked?'disabled':''}></div>
      </div>

      <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
        <div class="small text-muted"><i class="bi bi-info-circle"></i> Setelah dikunci, rapor tidak bisa diedit kecuali admin/kepala membuka kuncinya.</div>
        <div class="d-flex gap-2">
          ${!r.locked ? `
            <button class="btn btn-success" id="btnSave"><i class="bi bi-save"></i> Simpan</button>
            <button class="btn btn-warning" id="btnLock"><i class="bi bi-lock"></i> Simpan & Kunci</button>
          ` : `
            ${(Store.currentUser().role==='admin'||Store.currentUser().role==='kepala')
              ? `<button class="btn btn-outline-warning" id="btnUnlock"><i class="bi bi-unlock"></i> Buka Kunci</button>` : ''}
          `}
        </div>
      </div>
    `;
  }

  function bindEditor() {
    const root = document.getElementById('pageRoot');
    const ta = Store.activeTA(); const sem = Store.activeSem();

    const collect = () => {
      return {
        deskripsi: {
          nilai_agama: root.querySelector('#d_nilai_agama').value,
          jati_diri:   root.querySelector('#d_jati_diri').value,
          literasi:    root.querySelector('#d_literasi').value,
          kokurikuler: root.querySelector('#d_kokurikuler').value
        },
        refleksi_ortu: {
          q1: root.querySelector('#q1').value,
          q2: root.querySelector('#q2').value,
          q3: root.querySelector('#q3').value
        },
        info_perkembangan: root.querySelector('#info_p').value,
        kehadiran: {
          sakit: U.asNum(root.querySelector('#k_sakit').value)||0,
          izin:  U.asNum(root.querySelector('#k_izin').value)||0,
          alfa:  U.asNum(root.querySelector('#k_alfa').value)||0
        },
        tanda_tangan: {
          tempat: root.querySelector('#t_tempat').value,
          tanggal: root.querySelector('#t_tanggal').value,
          ortu_nama: root.querySelector('#t_ortu').value
        }
      };
    };

    const upsert = (patch) => {
      const ex = Store.list('rapor').find(x => x.murid_id === selMurid && x.ta_id === ta.id && x.sem_id === sem.id);
      if (ex) Store.update('rapor', ex.id, patch);
      else Store.add('rapor', Object.assign({ murid_id:selMurid, ta_id:ta.id, sem_id:sem.id, locked:false }, patch));
    };

    const btnSave = root.querySelector('#btnSave');
    if (btnSave) btnSave.onclick = () => { upsert(collect()); Store.log('save_rapor', selMurid); U.toast('Rapor disimpan'); render(); };

    const btnLock = root.querySelector('#btnLock');
    if (btnLock) btnLock.onclick = async () => {
      if (!await U.confirmModal({ title:'Kunci rapor?', body:'Setelah dikunci, deskripsi tidak bisa diedit kecuali admin/kepala membukanya. Lanjutkan?', okText:'Kunci' })) return;
      const data = collect();
      data.locked = true;
      data.finalized_at = new Date().toISOString();
      upsert(data);
      Store.log('lock_rapor', selMurid);
      U.toast('Rapor dikunci');
      render();
    };

    const btnUnlock = root.querySelector('#btnUnlock');
    if (btnUnlock) btnUnlock.onclick = async () => {
      if (!await U.confirmModal({ title:'Buka kunci?', danger:true, okText:'Buka', body:'Rapor akan kembali bisa diedit.' })) return;
      const ex = Store.list('rapor').find(x => x.murid_id === selMurid && x.ta_id === ta.id && x.sem_id === sem.id);
      if (ex) Store.update('rapor', ex.id, { locked:false });
      Store.log('unlock_rapor', selMurid);
      U.toast('Rapor dibuka');
      render();
    };

    const btnGen = root.querySelector('#btnGen');
    if (btnGen) btnGen.onclick = () => {
      Pages.generate.genFor(selMurid);
      U.toast('Deskripsi di-generate');
      render();
    };
  }

  return { render };
})();
