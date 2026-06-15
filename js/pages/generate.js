// generate.js — Generate deskripsi rapor otomatis (per murid + bulk per kelas)
window.Pages.generate = (function() {
  let selKelas = '';
  let selTA = '';
  let selSem = '';
  let overwriteLocked = false;

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
    const murid = Store.list('murid').filter(m => m.kelas_id === selKelas);

    const root = document.getElementById('pageRoot');
    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-magic"></i> Generate Deskripsi Rapor Otomatis</h1>
        <div class="subtitle">Mengubah hasil asesmen menjadi narasi rapor 4 elemen CP</div></div>
      </div>

      <div class="alert alert-info small">
        <b><i class="bi bi-info-circle"></i> Cara kerja:</b>
        Sistem mengubah capaian (BB/MB/BSH/BSB) + catatan observasi + rekomendasi yang sudah Bapak/Ibu input di menu <b>Asesmen</b> menjadi narasi 2-4 paragraf per elemen, mengikuti pola resmi rapor RA.
        Bahasa otomatis dijaga agar positif, lembut, dan menggunakan sebutan <b>"Ananda [Nama]"</b>. Setelah generate, narasi tetap bisa diedit manual di menu <b>Rapor RA</b>.
      </div>

      <div class="panel">
        <div class="row g-2 mb-3">
          <div class="col-md-3"><label class="form-label small">Tahun Ajaran</label>
            <select class="form-select form-select-sm" id="gTA">
              ${tas.map(t => `<option value="${t.id}" ${t.id===selTA?'selected':''}>${U.esc(t.label)}${t.aktif?' (aktif)':''}</option>`).join('')}
            </select></div>
          <div class="col-md-2"><label class="form-label small">Semester</label>
            <select class="form-select form-select-sm" id="gSem">
              ${semsTA.map(s => `<option value="${s.id}" ${s.id===selSem?'selected':''}>${U.esc(s.label)}${s.aktif?' (aktif)':''}</option>`).join('') || '<option value="">(kosong)</option>'}
            </select></div>
          <div class="col-md-4"><label class="form-label small">Kelas</label>
            <select class="form-select form-select-sm" id="gKelas">
              ${kelas.map(k => `<option value="${k.id}" ${k.id===selKelas?'selected':''}>${U.esc(k.nama)}</option>`).join('') || '<option value="">(tidak ada kelas)</option>'}
            </select></div>
          <div class="col-md-3 d-flex align-items-end">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="gOverwrite" ${overwriteLocked?'checked':''}>
              <label class="form-check-label small" for="gOverwrite">Timpa rapor terkunci</label>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mb-3">
          <button class="btn btn-outline-success" id="btnGenAll"><i class="bi bi-magic"></i> Generate Seluruh Kelas (${murid.length} murid)</button>
        </div>

        <div class="table-wrap"><table class="tbl">
          <thead><tr>
            <th>Murid</th>
            <th class="text-center">Asesmen</th>
            <th class="text-center">BSB</th>
            <th class="text-center">BSH</th>
            <th class="text-center">MB</th>
            <th class="text-center">BB</th>
            <th>Status Rapor</th>
            <th>Aksi</th>
          </tr></thead>
          <tbody>
            ${murid.map(m => {
              const ases = Store.list('asesmen').filter(a => a.murid_id === m.id && a.ta_id === selTA && a.sem_id === selSem);
              const dist = { BB:0, MB:0, BSH:0, BSB:0 };
              ases.forEach(a => dist[a.capaian] = (dist[a.capaian]||0)+1);
              const r = Store.list('rapor').find(x => x.murid_id === m.id && x.ta_id === selTA && x.sem_id === selSem);
              const status = r ? (r.locked ? '<span class="bdg bdg-bsb"><i class="bi bi-lock-fill"></i> Terkunci</span>' : '<span class="bdg bdg-bsh">Draft</span>') : '<span class="bdg bdg-mb">Belum dibuat</span>';
              const btnLabel = r && !r.locked ? 'Re-generate' : (r && r.locked ? 'Generate (terkunci)' : 'Generate');
              const btnClass = r && r.locked ? 'btn-outline-warning' : 'btn-outline-success';
              const disabled = r && r.locked && !overwriteLocked ? 'disabled' : '';
              return `<tr>
                <td><b>${U.esc(m.nama_lengkap)}</b><br><small class="text-muted">${U.esc(m.nama_panggilan||'')}</small></td>
                <td class="text-center"><span class="bdg bdg-bsh">${ases.length}</span></td>
                <td class="text-center">${dist.BSB||'-'}</td>
                <td class="text-center">${dist.BSH||'-'}</td>
                <td class="text-center">${dist.MB||'-'}</td>
                <td class="text-center">${dist.BB||'-'}</td>
                <td>${status}</td>
                <td class="actions">
                  <button type="button" class="btn btn-sm ${btnClass}" data-act="gen" data-id="${m.id}" ${disabled}><i class="bi bi-magic"></i> ${btnLabel}</button>
                  <button type="button" class="btn btn-sm btn-outline-success" data-act="preview" data-id="${m.id}"><i class="bi bi-eye"></i></button>
                  ${r ? `<a class="btn btn-sm btn-outline-success" href="#/rapor"><i class="bi bi-pencil"></i></a>` : ''}
                </td>
              </tr>`;
            }).join('') || `<tr><td colspan="8" class="text-center text-muted py-4">Tidak ada murid di kelas ini</td></tr>`}
          </tbody>
        </table></div>

        <div id="genProgress" class="mt-3" style="display:none">
          <div class="progress" style="height:24px"><div id="genBar" class="progress-bar bg-success" style="width:0%">0%</div></div>
          <div id="genLog" class="small text-muted mt-2"></div>
        </div>
      </div>
    `;

    document.getElementById('gTA').onchange = (e) => { selTA = e.target.value; selSem = ''; render(); };
    document.getElementById('gSem').onchange = (e) => { selSem = e.target.value; render(); };
    document.getElementById('gKelas').onchange = (e) => { selKelas = e.target.value; render(); };
    document.getElementById('gOverwrite').onchange = (e) => { overwriteLocked = e.target.checked; render(); };

    document.getElementById('btnGenAll').onclick = async () => {
      if (!murid.length) { U.toast('Tidak ada murid','warning'); return; }
      if (!await U.confirmModal({
        title: 'Generate seluruh kelas?',
        body: `Akan men-generate ulang deskripsi rapor untuk ${murid.length} murid pada TA/Semester yang dipilih. Rapor draft akan ditimpa.${overwriteLocked?' <b>Rapor terkunci JUGA akan ditimpa.</b>':' Rapor terkunci akan dilewati.'}`,
        okText: 'Generate Semua'
      })) return;
      await runBulk(murid.map(m => m.id));
    };

    root.querySelectorAll('[data-act="gen"]').forEach(b => {
      b.onclick = () => {
        const ok = genFor(b.dataset.id, selTA, selSem, overwriteLocked);
        if (ok) U.toast('Deskripsi di-generate');
        render();
      };
    });

    root.querySelectorAll('[data-act="preview"]').forEach(b => {
      b.onclick = () => previewFor(b.dataset.id);
    });
  }

  async function runBulk(muridIds) {
    const root = document.getElementById('pageRoot');
    const progBox = root.querySelector('#genProgress');
    const bar = root.querySelector('#genBar');
    const log = root.querySelector('#genLog');
    progBox.style.display = '';
    log.innerHTML = '';
    let done = 0, ok = 0, skipped = 0;
    for (const id of muridIds) {
      const m = Store.findById('murid', id);
      const result = genFor(id, selTA, selSem, overwriteLocked);
      done++;
      if (result === true) { ok++; log.innerHTML += `<div>✓ ${U.esc(m?.nama_lengkap||id)}</div>`; }
      else if (result === 'locked') { skipped++; log.innerHTML += `<div class="text-warning">⊘ ${U.esc(m?.nama_lengkap||id)} (terkunci, dilewati)</div>`; }
      else { skipped++; log.innerHTML += `<div class="text-muted">- ${U.esc(m?.nama_lengkap||id)} (tidak ada asesmen)</div>`; }
      const pct = Math.round(done / muridIds.length * 100);
      bar.style.width = pct + '%';
      bar.textContent = `${pct}% (${done}/${muridIds.length})`;
      // small yield biar UI update
      await new Promise(r => setTimeout(r, 30));
    }
    log.innerHTML = `<div class="alert alert-success mt-2"><b>Selesai:</b> ${ok} berhasil, ${skipped} dilewati.</div>` + log.innerHTML;
    U.toast(`Generate selesai: ${ok} berhasil, ${skipped} dilewati`);
    setTimeout(render, 1500);
  }

  function genFor(muridId, taId, semId, overrideLocked) {
    if (!taId || !semId) { U.toast('Pilih TA/Semester dulu','warning'); return false; }
    const m = Store.findById('murid', muridId);
    if (!m) return false;
    const ases = Store.list('asesmen').filter(a => a.murid_id === muridId && a.ta_id === taId && a.sem_id === semId);
    if (!ases.length) return 'no-asesmen';
    const indikator = Store.list('indikator');
    const desc = Narasi.generateRapor(m, ases, indikator);
    const refleksi = Narasi.generateRefleksi(m, ases, indikator);
    const info = Narasi.defaultInfoPerkembangan(m);

    let r = Store.list('rapor').find(x => x.murid_id === muridId && x.ta_id === taId && x.sem_id === semId);
    if (r && r.locked && !overrideLocked) return 'locked';

    if (!r) {
      Store.add('rapor', {
        murid_id: muridId, ta_id: taId, sem_id: semId,
        deskripsi: desc, refleksi_ortu: refleksi, info_perkembangan: info,
        kehadiran: { sakit:0, izin:0, alfa:0 },
        tanda_tangan: { tempat: Store.getObj('profil_ra',{}).kota_cetak||'', tanggal: U.todayISO(), ortu_nama:'' },
        locked: false
      });
    } else {
      Store.update('rapor', r.id, {
        deskripsi: desc,
        refleksi_ortu: refleksi,
        info_perkembangan: info,
        locked: overrideLocked && r.locked ? false : r.locked
      });
    }
    Store.log('generate_rapor', muridId);
    return true;
  }

  function previewFor(muridId) {
    const m = Store.findById('murid', muridId);
    if (!m) return;
    const ases = Store.list('asesmen').filter(a => a.murid_id === muridId && a.ta_id === selTA && a.sem_id === selSem);
    if (!ases.length) {
      U.showModal({
        title: `Preview: ${m.nama_lengkap}`,
        bodyHTML: '<div class="alert alert-warning">Belum ada asesmen tersimpan untuk anak ini di TA/Semester yang dipilih. Silakan input asesmen dulu di menu Asesmen.</div>',
        footerHTML: '<button class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>'
      });
      return;
    }
    const indikator = Store.list('indikator');
    const desc = Narasi.generateRapor(m, ases, indikator);
    const refleksi = Narasi.generateRefleksi(m, ases, indikator);
    const elemen = Narasi.ELEMEN_LABEL;

    U.showModal({
      size: 'xl',
      title: `Preview Narasi: ${m.nama_lengkap}`,
      bodyHTML: `
        <div class="alert alert-light border small mb-3">
          <i class="bi bi-info-circle"></i> Ini hanya preview. Klik <b>Generate</b> di tabel untuk benar-benar menyimpan ke rapor.
        </div>
        ${Object.keys(elemen).map(el => `
          <div class="mb-3">
            <h6 class="form-section-title">${U.esc(elemen[el])}</h6>
            <div class="p-3" style="background:#fafafa;border-left:4px solid #2e7d32;border-radius:8px;white-space:pre-wrap;line-height:1.6;font-size:13px">${U.esc(desc[el])}</div>
          </div>
        `).join('')}
        <h6 class="form-section-title mt-4">Refleksi Orang Tua (auto-fill)</h6>
        <div class="p-3 mb-2" style="background:#fafafa;border-radius:8px"><b>1. Yang sudah berkembang:</b><br>${U.esc(refleksi.q1)}</div>
        <div class="p-3 mb-2" style="background:#fafafa;border-radius:8px"><b>2. Yang masih perlu dikembangkan:</b><br>${U.esc(refleksi.q2)}</div>
        <div class="p-3 mb-2" style="background:#fafafa;border-radius:8px"><b>3. Langkah-langkah yang dapat dilakukan:</b><br>${U.esc(refleksi.q3)}</div>
      `,
      footerHTML: `<button class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
        <button class="btn btn-success" id="btnGenFromPreview"><i class="bi bi-magic"></i> Generate & Simpan</button>`,
      onShow: (el) => {
        el.querySelector('#btnGenFromPreview').onclick = () => {
          genFor(muridId, selTA, selSem, overwriteLocked);
          U.toast('Deskripsi di-generate');
          bootstrap.Modal.getInstance(el).hide();
          render();
        };
      }
    });
  }

  return { render, genFor };
})();
