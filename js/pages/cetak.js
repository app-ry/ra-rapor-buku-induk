// cetak.js — Cetak rapor satuan (#/cetak/:muridId) atau kelas (#/cetak-kelas/:kelasId)
window.Pages.cetak = (function() {

  function render(ctx) {
    const params = ctx?.params || [];
    const root = document.getElementById('pageRoot');
    if (params[0] && params[0] !== 'kelas') {
      // Cetak per murid: hash = #/cetak/:id
      return renderRapor([params[0]]);
    }
    if (params[0] === 'kelas' && params[1]) {
      return renderRapor(getMuridIdsByKelas(params[1]));
    }
    // Index
    renderIndex();
  }

  function renderIndex() {
    const root = document.getElementById('pageRoot');
    const kelas = Store.list('kelas');
    const user = Store.currentUser();
    let kelasView = kelas;
    if (user.role === 'guru' && user.kelas_id) kelasView = kelas.filter(k => k.id === user.kelas_id);
    const ta = Store.activeTA(); const sem = Store.activeSem();
    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-printer"></i> Cetak & Export Rapor</h1>
        <div class="subtitle">${U.esc(ta?.label||'-')} · Semester ${U.esc(sem?.label||'-')}</div></div>
      </div>

      <div class="row g-3">
        <div class="col-md-6">
          <div class="panel">
            <h5 class="panel-title mb-3"><i class="bi bi-person"></i> Cetak Rapor per Murid</h5>
            <p class="small text-muted">Pilih kelas dan murid yang akan dicetak rapornya.</p>
            <div class="mb-2"><select class="form-select" id="cKelas">
              <option value="">-- pilih kelas --</option>
              ${kelasView.map(k => `<option value="${k.id}">${U.esc(k.nama)}</option>`).join('')}
            </select></div>
            <div class="mb-2"><select class="form-select" id="cMurid" disabled>
              <option value="">-- pilih murid --</option>
            </select></div>
            <button class="btn btn-success w-100" id="btnGoMurid" disabled><i class="bi bi-printer"></i> Cetak Rapor Murid</button>
          </div>
        </div>
        <div class="col-md-6">
          <div class="panel">
            <h5 class="panel-title mb-3"><i class="bi bi-collection"></i> Cetak Rapor Satu Kelas</h5>
            <p class="small text-muted">Mencetak rapor semua murid dalam 1 kelas (page break antar anak).</p>
            <div class="mb-2"><select class="form-select" id="cKelasAll">
              <option value="">-- pilih kelas --</option>
              ${kelasView.map(k => `<option value="${k.id}">${U.esc(k.nama)}</option>`).join('')}
            </select></div>
            <button class="btn btn-success w-100" id="btnGoKelas" disabled><i class="bi bi-printer"></i> Cetak Satu Kelas</button>
          </div>
        </div>
      </div>

      <div class="panel mt-3">
        <h5 class="panel-title mb-3"><i class="bi bi-file-earmark-excel"></i> Export Excel</h5>
        <div class="row g-2">
          <div class="col-md-6">
            <button class="btn btn-outline-success w-100" onclick="XLS.exportBukuInduk()"><i class="bi bi-download"></i> Export Buku Induk Lengkap</button>
          </div>
          <div class="col-md-6">
            <select class="form-select" id="cKelasRekap">
              <option value="">-- pilih kelas untuk rekap asesmen --</option>
              ${kelasView.map(k => `<option value="${k.id}">${U.esc(k.nama)}</option>`).join('')}
            </select>
            <button class="btn btn-outline-success w-100 mt-2" id="btnRekapEx" disabled><i class="bi bi-download"></i> Export Rekap Asesmen</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('cKelas').onchange = (e) => {
      const list = Store.list('murid').filter(m => m.kelas_id === e.target.value);
      const sel = document.getElementById('cMurid');
      sel.innerHTML = `<option value="">-- pilih murid --</option>` + list.map(m => `<option value="${m.id}">${U.esc(m.nama_lengkap)}</option>`).join('');
      sel.disabled = list.length === 0;
      document.getElementById('btnGoMurid').disabled = true;
    };
    document.getElementById('cMurid').onchange = (e) => {
      document.getElementById('btnGoMurid').disabled = !e.target.value;
    };
    document.getElementById('btnGoMurid').onclick = () => {
      const id = document.getElementById('cMurid').value;
      if (id) location.hash = '#/cetak/' + id;
    };
    document.getElementById('cKelasAll').onchange = (e) => {
      document.getElementById('btnGoKelas').disabled = !e.target.value;
    };
    document.getElementById('btnGoKelas').onclick = () => {
      const id = document.getElementById('cKelasAll').value;
      if (id) location.hash = '#/cetak/kelas/' + id;
    };
    document.getElementById('cKelasRekap').onchange = (e) => {
      document.getElementById('btnRekapEx').disabled = !e.target.value;
    };
    document.getElementById('btnRekapEx').onclick = () => {
      const id = document.getElementById('cKelasRekap').value;
      if (id) XLS.exportRekapAsesmen(id);
    };
  }

  function getMuridIdsByKelas(kelasId) {
    return Store.list('murid').filter(m => m.kelas_id === kelasId).map(m => m.id);
  }

  function renderRapor(muridIds) {
    const root = document.getElementById('pageRoot');
    const ta = Store.activeTA(); const sem = Store.activeSem();
    if (!muridIds.length) {
      root.innerHTML = `<div class="empty"><i class="bi bi-exclamation-circle"></i><div>Tidak ada murid untuk dicetak</div><a href="#/cetak" class="btn btn-sm btn-outline-success mt-2">Kembali</a></div>`;
      return;
    }

    const html = muridIds.map(id => raporHTML(id, ta?.id, sem?.id)).join('');
    root.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3 no-print">
        <div>
          <a href="#/cetak" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left"></i> Kembali</a>
          <a href="#/rapor" class="btn btn-sm btn-outline-success">Edit Rapor</a>
        </div>
        <button class="btn btn-success btn-sm" onclick="window.print()"><i class="bi bi-printer"></i> Cetak / Save as PDF</button>
      </div>
      ${html}
    `;
  }

  function raporHTML(muridId, taId, semId) {
    const m = Store.findById('murid', muridId);
    if (!m) return '';
    const profil = Store.getObj('profil_ra', {});
    const kelas = Store.findById('kelas', m.kelas_id) || {};
    let r = Store.list('rapor').find(x => x.murid_id === muridId && x.ta_id === taId && x.sem_id === semId);
    if (!r) {
      // auto-generate kalau belum ada
      const ases = Store.list('asesmen').filter(a => a.murid_id === muridId && a.ta_id === taId && a.sem_id === semId);
      const indikator = Store.list('indikator');
      r = {
        deskripsi: Narasi.generateRapor(m, ases, indikator),
        refleksi_ortu: Narasi.generateRefleksi(m, ases, indikator),
        info_perkembangan: Narasi.defaultInfoPerkembangan(m),
        kehadiran:{ sakit:0,izin:0,alfa:0 },
        tanda_tangan:{ tempat: profil.kota_cetak||'', tanggal: U.todayISO(), ortu_nama:'' }
      };
    }
    const ta = Store.findById('tahun_ajaran', taId);
    const sem = Store.findById('semester', semId);
    const elemen = Narasi.ELEMEN_LABEL;

    return `
    <article class="rapor-page">
      <div class="rapor-header">
        ${profil.logo_kemenag_dataurl ? `<img src="${profil.logo_kemenag_dataurl}" alt="">` : ''}
        <div class="text">
          <div style="font-size:11pt">KEMENTERIAN AGAMA REPUBLIK INDONESIA</div>
          <h2>${U.esc(profil.nama || 'RAUDHATUL ATHFAL')}</h2>
          <div class="alamat">${U.esc(profil.alamat||'')} · ${U.esc(profil.desa||'')} · ${U.esc(profil.kec||'')} · ${U.esc(profil.kab||'')} · ${U.esc(profil.prov||'')}</div>
          <div class="alamat" style="font-size:9pt">NSM: ${U.esc(profil.nsm||'-')} · NPSN: ${U.esc(profil.npsn||'-')}</div>
        </div>
        ${profil.logo_ra_dataurl ? `<img src="${profil.logo_ra_dataurl}" alt="">` : ''}
      </div>

      <div class="rapor-title">Laporan Hasil Belajar Anak Raudhatul Athfal</div>

      <table class="rapor-id-table">
        <tr><td class="lbl">Nama Anak</td><td class="sep">:</td><td><b>${U.esc(m.nama_lengkap||'')}</b></td>
            <td class="lbl">Tahun Ajaran</td><td class="sep">:</td><td>${U.esc(ta?.label||'-')}</td></tr>
        <tr><td class="lbl">NISN/Nomor Induk</td><td class="sep">:</td><td>${U.esc(m.nisn||'-')} / ${U.esc(m.no_induk||'-')}</td>
            <td class="lbl">Semester</td><td class="sep">:</td><td>${U.esc(sem?.label||'-')}</td></tr>
        <tr><td class="lbl">NIK</td><td class="sep">:</td><td>${U.esc(m.nik||'-')}</td>
            <td class="lbl">Fase</td><td class="sep">:</td><td>${U.esc(kelas.fase||'Fondasi')}</td></tr>
        <tr><td class="lbl">Tempat, Tanggal Lahir</td><td class="sep">:</td><td>${U.esc(m.tempat_lahir||'')}, ${U.esc(U.fmtDate(m.tanggal_lahir))}</td>
            <td class="lbl">Kelas/Kelompok</td><td class="sep">:</td><td>${U.esc(kelas.nama||'-')} (${U.esc(kelas.kelompok_usia||'-')} thn)</td></tr>
        <tr><td class="lbl">Jenis Kelamin</td><td class="sep">:</td><td>${m.jenis_kelamin==='P'?'Perempuan':'Laki-laki'}</td>
            <td class="lbl">Tinggi / Berat Badan</td><td class="sep">:</td><td>${U.esc(m.tinggi||'-')} cm / ${U.esc(m.berat||'-')} kg</td></tr>
        <tr><td class="lbl">Alamat</td><td class="sep">:</td><td colspan="4">${U.esc([m.alamat, m.rt_rw?'RT/RW '+m.rt_rw:'', m.desa, m.kec, m.kab, m.prov].filter(Boolean).join(', '))}</td></tr>
      </table>

      ${Object.keys(elemen).map(el => `
        <div class="elemen-block">
          <div class="elemen-head">${alpha(el)}. ${U.esc(elemen[el])}</div>
          <div class="elemen-body">${paragraphs(r.deskripsi?.[el]||'-')}</div>
        </div>
      `).join('')}

      <div class="elemen-block">
        <div class="elemen-head">E. Refleksi Orang Tua/Wali</div>
        <div class="elemen-body">
          <div class="refleksi-block"><div class="q">1. Apa yang sudah berkembang pada diri anak saya?</div><div>${U.esc(r.refleksi_ortu?.q1||'-')}</div></div>
          <div class="refleksi-block"><div class="q">2. Apa yang masih perlu dikembangkan?</div><div>${U.esc(r.refleksi_ortu?.q2||'-')}</div></div>
          <div class="refleksi-block"><div class="q">3. Langkah-langkah yang dapat dilakukan untuk membantu?</div><div>${U.esc(r.refleksi_ortu?.q3||'-')}</div></div>
        </div>
      </div>

      <div class="elemen-block">
        <div class="elemen-head">F. Informasi Mengenai Perkembangan Anak</div>
        <div class="elemen-body"><div class="info-block">${U.esc(r.info_perkembangan||'-')}</div></div>
      </div>

      <div class="elemen-block">
        <div class="elemen-head">G. Kehadiran</div>
        <div class="elemen-body">
          <table class="kehadiran-table">
            <thead><tr><th>Sakit</th><th>Izin</th><th>Tanpa Keterangan</th></tr></thead>
            <tbody><tr><td>${r.kehadiran?.sakit||0} hari</td><td>${r.kehadiran?.izin||0} hari</td><td>${r.kehadiran?.alfa||0} hari</td></tr></tbody>
          </table>
        </div>
      </div>

      <div class="ttd-tempat">${U.esc(r.tanda_tangan?.tempat||profil.kota_cetak||'')}, ${U.esc(U.fmtDate(r.tanda_tangan?.tanggal||U.todayISO()))}</div>
      <div class="ttd-grid">
        <div class="col-ttd"><div class="role">Orang Tua/Wali</div><div class="nama">${U.esc(r.tanda_tangan?.ortu_nama||'( ........................ )')}</div></div>
        <div class="col-ttd"><div class="role">Guru Kelas</div><div class="nama">${U.esc(getGuruNama(kelas.guru_id)||'( ........................ )')}</div></div>
        <div class="col-ttd"><div class="role">Mengetahui,<br>Kepala RA</div><div class="nama">${U.esc(profil.kepala_nama||'( ........................ )')}</div></div>
      </div>
    </article>
    `;
  }

  function alpha(el) { return ({nilai_agama:'A', jati_diri:'B', literasi:'C', kokurikuler:'D'})[el] || ''; }
  function paragraphs(text) {
    return String(text||'').split(/\n\n+/).map(p => `<p>${U.esc(p.trim())}</p>`).join('');
  }
  function getGuruNama(guruId) {
    const g = Store.findById('guru', guruId);
    return g?.nama || '';
  }

  return { render };
})();
