// cetak.js — Cetak rapor satuan (#/cetak/:muridId) atau kelas (#/cetak/kelas/:kelasId)
window.Pages.cetak = (function() {

  function render(ctx) {
    const params = ctx?.params || [];
    if (params[0] && params[0] !== 'kelas') {
      return renderRapor([params[0]]);
    }
    if (params[0] === 'kelas' && params[1]) {
      return renderRapor(getMuridIdsByKelas(params[1]), { kelasId: params[1] });
    }
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
            <h5 class="panel-title mb-3"><i class="bi bi-person"></i> Cetak / Download Rapor per Murid</h5>
            <p class="small text-muted">Pilih kelas dan murid, lalu klik <b>Cetak</b> atau <b>Download PDF</b>.</p>
            <div class="mb-2"><select class="form-select" id="cKelas">
              <option value="">-- pilih kelas --</option>
              ${kelasView.map(k => `<option value="${k.id}">${U.esc(k.nama)}</option>`).join('')}
            </select></div>
            <div class="mb-2"><select class="form-select" id="cMurid" disabled>
              <option value="">-- pilih murid --</option>
            </select></div>
            <div class="d-flex gap-2">
              <button class="btn btn-success flex-fill" id="btnGoMurid" disabled><i class="bi bi-printer"></i> Cetak</button>
              <button class="btn btn-outline-success flex-fill" id="btnPdfMurid" disabled><i class="bi bi-file-earmark-pdf"></i> Download PDF</button>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="panel">
            <h5 class="panel-title mb-3"><i class="bi bi-collection"></i> Cetak / Download Rapor Satu Kelas</h5>
            <p class="small text-muted">Mencetak/download rapor seluruh murid 1 kelas, page-break antar anak.</p>
            <div class="mb-2"><select class="form-select" id="cKelasAll">
              <option value="">-- pilih kelas --</option>
              ${kelasView.map(k => `<option value="${k.id}">${U.esc(k.nama)}</option>`).join('')}
            </select></div>
            <div class="d-flex gap-2">
              <button class="btn btn-success flex-fill" id="btnGoKelas" disabled><i class="bi bi-printer"></i> Cetak Satu Kelas</button>
              <button class="btn btn-outline-success flex-fill" id="btnPdfKelas" disabled><i class="bi bi-file-earmark-pdf"></i> Download PDF</button>
            </div>
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
            <select class="form-select mb-2" id="cKelasRekap">
              <option value="">-- pilih kelas untuk rekap asesmen --</option>
              ${kelasView.map(k => `<option value="${k.id}">${U.esc(k.nama)}</option>`).join('')}
            </select>
            <button class="btn btn-outline-success w-100" id="btnRekapEx" disabled><i class="bi bi-download"></i> Export Rekap Asesmen</button>
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
      document.getElementById('btnPdfMurid').disabled = true;
    };
    document.getElementById('cMurid').onchange = (e) => {
      document.getElementById('btnGoMurid').disabled = !e.target.value;
      document.getElementById('btnPdfMurid').disabled = !e.target.value;
    };
    document.getElementById('btnGoMurid').onclick = () => {
      const id = document.getElementById('cMurid').value;
      if (id) location.hash = '#/cetak/' + id;
    };
    document.getElementById('btnPdfMurid').onclick = () => {
      const id = document.getElementById('cMurid').value;
      if (id) downloadPDF([id]);
    };
    document.getElementById('cKelasAll').onchange = (e) => {
      document.getElementById('btnGoKelas').disabled = !e.target.value;
      document.getElementById('btnPdfKelas').disabled = !e.target.value;
    };
    document.getElementById('btnGoKelas').onclick = () => {
      const id = document.getElementById('cKelasAll').value;
      if (id) location.hash = '#/cetak/kelas/' + id;
    };
    document.getElementById('btnPdfKelas').onclick = () => {
      const id = document.getElementById('cKelasAll').value;
      if (id) downloadPDF(getMuridIdsByKelas(id), { kelasId: id });
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

  function renderRapor(muridIds, opts={}) {
    const root = document.getElementById('pageRoot');
    const ta = Store.activeTA(); const sem = Store.activeSem();
    if (!muridIds.length) {
      root.innerHTML = `<div class="empty"><i class="bi bi-exclamation-circle"></i><div>Tidak ada murid untuk dicetak</div><a href="#/cetak" class="btn btn-sm btn-outline-success mt-2">Kembali</a></div>`;
      return;
    }
    const html = muridIds.map(id => raporHTML(id, ta?.id, sem?.id)).join('');
    const filename = opts.kelasId
      ? `Rapor_Kelas_${(Store.findById('kelas', opts.kelasId)?.nama||'').replace(/\s+/g,'_')}_${ta?.label?.replace('/','-')||''}.pdf`
      : `Rapor_${(Store.findById('murid', muridIds[0])?.nama_lengkap||'').replace(/\s+/g,'_')}.pdf`;

    root.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3 no-print flex-wrap gap-2">
        <div>
          <a href="#/cetak" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left"></i> Kembali</a>
          <a href="#/rapor" class="btn btn-sm btn-outline-success"><i class="bi bi-pencil"></i> Edit Rapor</a>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="small text-muted">Orientasi:</span>
          <div class="btn-group" role="group">
            <input type="radio" class="btn-check" name="raporOri" id="raporOriP" value="portrait" checked>
            <label class="btn btn-sm btn-outline-secondary" for="raporOriP"><i class="bi bi-file-text"></i> Portrait</label>
            <input type="radio" class="btn-check" name="raporOri" id="raporOriL" value="landscape">
            <label class="btn btn-sm btn-outline-secondary" for="raporOriL"><i class="bi bi-file-earmark-image"></i> Landscape</label>
          </div>
        </div>
        <div class="small text-muted">${muridIds.length} rapor siap cetak</div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-success btn-sm" id="btnDownloadPDF"><i class="bi bi-file-earmark-pdf"></i> Download PDF</button>
          <button class="btn btn-success btn-sm" onclick="window.print()"><i class="bi bi-printer"></i> Cetak</button>
        </div>
      </div>
      <style id="oriStyle">@page { size: A4 portrait; }</style>
      <div id="raporContainer">${html}</div>
    `;

    const oriStyle = document.getElementById('oriStyle');
    document.querySelectorAll('input[name="raporOri"]').forEach(r => {
      r.onchange = () => { oriStyle.textContent = `@page { size: A4 ${r.value}; }`; };
    });

    document.getElementById('btnDownloadPDF').onclick = () => {
      const ori = document.querySelector('input[name="raporOri"]:checked')?.value || 'portrait';
      downloadPDF(muridIds, { kelasId: opts.kelasId, filename, orientation: ori });
    };
  }

  // Generate PDF dengan html2pdf
  async function downloadPDF(muridIds, opts={}) {
    const ta = Store.activeTA(); const sem = Store.activeSem();
    if (typeof html2pdf === 'undefined') {
      U.toast('Library PDF belum siap, coba refresh','danger');
      return;
    }
    U.toast('Menyiapkan PDF...', 'info');

    // Build offscreen tapi tetap visible secara render (opacity 0)
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;left:0;top:0;width:210mm;background:#fff;opacity:0;pointer-events:none;z-index:-9999';
    wrap.innerHTML = muridIds.map(id => raporHTML(id, ta?.id, sem?.id)).join('');
    document.body.appendChild(wrap);

    // Tambah pagebreak class manual untuk html2pdf
    wrap.querySelectorAll('.rapor-page').forEach((el, i) => {
      if (i > 0) el.classList.add('html2pdf__page-break');
    });

    const filename = opts.filename || (opts.kelasId
      ? `Rapor_Kelas_${(Store.findById('kelas', opts.kelasId)?.nama||'').replace(/\s+/g,'_')}.pdf`
      : `Rapor_${(Store.findById('murid', muridIds[0])?.nama_lengkap||'').replace(/\s+/g,'_')}.pdf`);

    try {
      // Tunggu DOM settle + image load
      await new Promise(r => setTimeout(r, 200));
      const imgs = wrap.querySelectorAll('img');
      await Promise.all(Array.from(imgs).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(res => { img.onload = img.onerror = res; });
      }));

      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          windowWidth: 794,
          backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: opts.orientation || 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], before: '.html2pdf__page-break' }
      }).from(wrap).save();
      U.toast('PDF berhasil didownload');
    } catch (e) {
      console.error(e);
      U.toast('Gagal membuat PDF: ' + e.message, 'danger');
    } finally {
      wrap.remove();
    }
  }

  function raporHTML(muridId, taId, semId) {
    const m = Store.findById('murid', muridId);
    if (!m) return '';
    const profil = Store.getObj('profil_ra', {});
    const kelas = Store.findById('kelas', m.kelas_id) || {};
    const guru = Store.findById('guru', kelas.guru_id) || {};
    let r = Store.list('rapor').find(x => x.murid_id === muridId && x.ta_id === taId && x.sem_id === semId);
    if (!r) {
      // auto-generate kalau belum ada (preview only, tidak disimpan)
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

    const alamat = [profil.alamat, profil.desa, profil.kec, profil.kab, profil.prov].filter(Boolean).join(', ');

    return `
    <article class="rapor-page">
      <div class="rapor-header">
        ${profil.logo_ra_dataurl
          ? `<img src="${profil.logo_ra_dataurl}" alt="Logo RA">`
          : `<div style="width:70px;height:70px"></div>`}
        <div class="text">
          ${profil.nama_yayasan ? `<div style="font-size:11pt;font-weight:600">${U.esc(profil.nama_yayasan.toUpperCase())}</div>` : `<div style="font-size:10.5pt">KEMENTERIAN AGAMA REPUBLIK INDONESIA</div>`}
          <h2>${U.esc((profil.nama || 'RAUDHATUL ATHFAL').toUpperCase())}</h2>
          <div class="alamat">${U.esc(alamat || '-')}</div>
          <div class="alamat-kecil">NSM: ${U.esc(profil.nsm||'-')} &mdash; NPSN: ${U.esc(profil.npsn||'-')}</div>
        </div>
        <div style="width:70px;height:70px"></div>
      </div>

      <div class="rapor-title">Laporan Hasil Belajar Anak</div>
      <div class="rapor-subtitle">Raudhatul Athfal · Fase Fondasi</div>

      <table class="rapor-id-table">
        <tr>
          <td class="lbl">Nama Anak</td><td class="sep">:</td><td class="val"><b>${U.esc(m.nama_lengkap||'-')}</b></td>
          <td class="lbl">Tahun Ajaran</td><td class="sep">:</td><td class="val">${U.esc(ta?.label||'-')}</td>
        </tr>
        <tr>
          <td class="lbl">Nomor Induk</td><td class="sep">:</td><td class="val">${U.esc(m.no_induk||'-')}</td>
          <td class="lbl">Semester</td><td class="sep">:</td><td class="val">${U.esc(sem?.label||'-')}</td>
        </tr>
        <tr>
          <td class="lbl">NISN</td><td class="sep">:</td><td class="val">${U.esc(m.nisn||'-')}</td>
          <td class="lbl">Fase</td><td class="sep">:</td><td class="val">${U.esc(kelas.fase||'Fondasi')}</td>
        </tr>
        <tr>
          <td class="lbl">NIK</td><td class="sep">:</td><td class="val">${U.esc(m.nik||'-')}</td>
          <td class="lbl">Kelas / Kelompok</td><td class="sep">:</td><td class="val">${U.esc(kelas.nama||'-')}${kelas.kelompok_usia?` (${U.esc(kelas.kelompok_usia)} thn)`:''}</td>
        </tr>
        <tr>
          <td class="lbl">Tempat, Tanggal Lahir</td><td class="sep">:</td><td class="val">${U.esc(m.tempat_lahir||'')}, ${U.esc(U.fmtDate(m.tanggal_lahir))}</td>
          <td class="lbl">Tinggi Badan</td><td class="sep">:</td><td class="val">${U.esc(m.tinggi||'-')} cm</td>
        </tr>
        <tr>
          <td class="lbl">Jenis Kelamin</td><td class="sep">:</td><td class="val">${m.jenis_kelamin==='P'?'Perempuan':(m.jenis_kelamin==='L'?'Laki-laki':'-')}</td>
          <td class="lbl">Berat Badan</td><td class="sep">:</td><td class="val">${U.esc(m.berat||'-')} kg</td>
        </tr>
        <tr>
          <td class="lbl">Nama RA</td><td class="sep">:</td><td colspan="4"><b>${U.esc(profil.nama||'-')}</b></td>
        </tr>
      </table>

      ${Object.keys(elemen).map((el, idx) => `
        <div class="elemen-block">
          <div class="elemen-head">${alpha(idx)}. ${U.esc(elemen[el])}</div>
          <div class="elemen-body">${paragraphs(r.deskripsi?.[el]||'-')}</div>
        </div>
      `).join('')}

      <div class="elemen-block">
        <div class="elemen-head">E. Refleksi Orang Tua/Wali</div>
        <div class="elemen-body" style="padding:10px 14px">
          <div class="refleksi-block">
            <div class="q">1. Apa yang sudah berkembang pada diri anak saya?</div>
            <div class="a">${U.esc(r.refleksi_ortu?.q1||'-').replace(/\n/g,'<br>')}</div>
          </div>
          <div class="refleksi-block">
            <div class="q">2. Apa yang masih perlu dikembangkan pada diri anak saya?</div>
            <div class="a">${U.esc(r.refleksi_ortu?.q2||'-').replace(/\n/g,'<br>')}</div>
          </div>
          <div class="refleksi-block">
            <div class="q">3. Langkah-langkah apa yang dapat saya lakukan untuk membantu anak saya mengembangkan hal tersebut?</div>
            <div class="a">${U.esc(r.refleksi_ortu?.q3||'-').replace(/\n/g,'<br>')}</div>
          </div>
        </div>
      </div>

      <div class="elemen-block">
        <div class="elemen-head">F. Informasi Mengenai Perkembangan Anak</div>
        <div class="elemen-body"><div class="info-block" style="border:none;padding:0">${U.esc(r.info_perkembangan||'-').replace(/\n/g,'<br>')}</div></div>
      </div>

      <div class="elemen-block">
        <div class="elemen-head">G. Kehadiran</div>
        <div class="elemen-body" style="padding:10px 14px">
          <table class="kehadiran-table">
            <thead><tr><th>No</th><th>Ketidakhadiran</th><th>Jumlah Hari</th></tr></thead>
            <tbody>
              <tr><td class="no">1</td><td>Sakit</td><td>${r.kehadiran?.sakit||0}</td></tr>
              <tr><td class="no">2</td><td>Izin</td><td>${r.kehadiran?.izin||0}</td></tr>
              <tr><td class="no">3</td><td>Tanpa Keterangan</td><td>${r.kehadiran?.alfa||0}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="ttd-tempat">${U.esc(r.tanda_tangan?.tempat||profil.kota_cetak||'')}, ${U.esc(U.fmtDate(r.tanda_tangan?.tanggal||U.todayISO()))}</div>
      <div class="ttd-grid">
        <div class="col-ttd">
          <div class="role">&nbsp;<br>Orang Tua/Wali</div>
          <div class="nama">${U.esc(r.tanda_tangan?.ortu_nama||'( ........................ )')}</div>
        </div>
        <div class="col-ttd">
          <div class="role">&nbsp;<br>Guru Kelas</div>
          ${guru.ttd_dataurl ? `<img class="ttd-img" src="${guru.ttd_dataurl}" alt="">` : ''}
          <div class="nama">${U.esc(guru.nama||'( ........................ )')}</div>
          ${guru.nip ? `<div class="nip">NIP. ${U.esc(guru.nip)}</div>` : (guru.nuptk ? `<div class="nip">NUPTK. ${U.esc(guru.nuptk)}</div>` : '')}
        </div>
        <div class="col-ttd">
          <div class="role">Mengetahui,<br>Kepala RA</div>
          <div class="nama">${U.esc(profil.kepala_nama||'( ........................ )')}</div>
          ${profil.kepala_nip && profil.kepala_nip !== '-' ? `<div class="nip">NIP. ${U.esc(profil.kepala_nip)}</div>` : ''}
        </div>
      </div>
    </article>
    `;
  }

  function alpha(idx) { return ['A','B','C','D'][idx] || ''; }
  function paragraphs(text) {
    return String(text||'').split(/\n\n+/).map(p => `<p>${U.esc(p.trim()).replace(/\n/g,'<br>')}</p>`).join('');
  }

  return { render };
})();
