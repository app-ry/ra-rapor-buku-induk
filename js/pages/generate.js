// generate.js — Generate deskripsi rapor otomatis
window.Pages.generate = (function() {
  let selKelas = '';
  function render() {
    const user = Store.currentUser();
    let kelas = Store.list('kelas');
    if (user.role === 'guru' && user.kelas_id) kelas = kelas.filter(k => k.id === user.kelas_id);
    if (!selKelas && kelas[0]) selKelas = kelas[0].id;
    const murid = Store.list('murid').filter(m => m.kelas_id === selKelas);
    const ta = Store.activeTA(); const sem = Store.activeSem();

    const root = document.getElementById('pageRoot');
    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-magic"></i> Generate Deskripsi Rapor</h1>
        <div class="subtitle">${U.esc(ta?.label||'-')} · Semester ${U.esc(sem?.label||'-')}</div></div>
      </div>

      <div class="panel">
        <div class="row g-2 mb-3 align-items-end">
          <div class="col-md-6"><label class="form-label small">Kelas</label>
            <select class="form-select" id="gKelas">
              ${kelas.map(k => `<option value="${k.id}" ${k.id===selKelas?'selected':''}>${U.esc(k.nama)}</option>`).join('')}
            </select></div>
          <div class="col-md-6 text-end">
            <button class="btn btn-success" id="btnGenAll"><i class="bi bi-magic"></i> Generate Semua Murid Sekelas</button>
          </div>
        </div>

        <div class="alert alert-info small">
          <i class="bi bi-info-circle"></i> Tombol ini akan membuat deskripsi rapor otomatis untuk SEMUA murid kelas terpilih berdasarkan asesmen yang sudah diinput.
          Deskripsi yang sudah ada akan ditimpa, kecuali rapor sudah dikunci. Setelah generate, Anda tetap bisa mengeditnya secara manual di menu <b>Rapor RA</b>.
        </div>

        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Murid</th><th>Asesmen</th><th>Status Rapor</th><th>Aksi</th></tr></thead>
          <tbody>
            ${murid.map(m => {
              const ases = Store.list('asesmen').filter(a => a.murid_id === m.id && a.ta_id === ta?.id && a.sem_id === sem?.id);
              const r = Store.list('rapor').find(x => x.murid_id === m.id && x.ta_id === ta?.id && x.sem_id === sem?.id);
              return `<tr>
                <td>${U.esc(m.nama_lengkap)}</td>
                <td>${ases.length} indikator</td>
                <td>${r ? (r.locked?'<span class="bdg bdg-bsb">Terkunci</span>':'<span class="bdg bdg-bsh">Draft</span>') : '<span class="bdg bdg-mb">Belum</span>'}</td>
                <td><button class="btn btn-sm btn-outline-success" data-act="gen" data-id="${m.id}"><i class="bi bi-magic"></i> Generate</button></td>
              </tr>`;
            }).join('') || `<tr><td colspan="4" class="text-center text-muted">Tidak ada murid di kelas ini</td></tr>`}
          </tbody>
        </table></div>
      </div>
    `;

    document.getElementById('gKelas').onchange = (e) => { selKelas = e.target.value; render(); };
    document.getElementById('btnGenAll').onclick = () => {
      let n = 0;
      murid.forEach(m => { if (genFor(m.id)) n++; });
      U.toast(`${n} rapor di-generate`);
      render();
    };
    root.querySelectorAll('[data-act="gen"]').forEach(b => {
      b.onclick = () => {
        if (genFor(b.dataset.id)) U.toast('Deskripsi di-generate');
        render();
      };
    });
  }

  function genFor(muridId) {
    const ta = Store.activeTA(); const sem = Store.activeSem();
    if (!ta || !sem) { U.toast('Set tahun ajaran/semester aktif dulu','warning'); return false; }
    const m = Store.findById('murid', muridId);
    if (!m) return false;
    const ases = Store.list('asesmen').filter(a => a.murid_id === muridId && a.ta_id === ta.id && a.sem_id === sem.id);
    const indikator = Store.list('indikator');
    const desc = Narasi.generateRapor(m, ases, indikator);
    const refleksi = Narasi.generateRefleksi(m, ases, indikator);
    const info = Narasi.defaultInfoPerkembangan(m);

    let r = Store.list('rapor').find(x => x.murid_id === muridId && x.ta_id === ta.id && x.sem_id === sem.id);
    if (r && r.locked) { U.toast(`Rapor ${m.nama_lengkap} terkunci, lewati`,'warning'); return false; }

    if (!r) {
      r = Store.add('rapor', {
        murid_id: muridId, ta_id: ta.id, sem_id: sem.id,
        deskripsi: desc, refleksi_ortu: refleksi, info_perkembangan: info,
        kehadiran: { sakit:0, izin:0, alfa:0 },
        tanda_tangan: { tempat: Store.getObj('profil_ra',{}).kota_cetak||'', tanggal: U.todayISO(), ortu_nama:'' },
        locked: false
      });
    } else {
      Store.update('rapor', r.id, { deskripsi: desc, refleksi_ortu: refleksi, info_perkembangan: info });
    }
    Store.log('generate_rapor', muridId);
    return true;
  }

  return { render, genFor };
})();
