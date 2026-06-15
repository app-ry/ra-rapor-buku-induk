// dashboard.js
window.Pages = window.Pages || {};
window.Pages.dashboard = (function() {

  function render() {
    const user = Store.currentUser();
    const profil = Store.getObj('profil_ra', {});
    const ta = Store.activeTA();
    const sem = Store.activeSem();
    const murid = Store.list('murid');
    const guru = Store.list('guru');
    const kelas = Store.list('kelas');
    const rapor = Store.list('rapor').filter(r => r.ta_id === ta?.id && r.sem_id === sem?.id);
    const muridL = murid.filter(m => m.jenis_kelamin === 'L').length;
    const muridP = murid.filter(m => m.jenis_kelamin === 'P').length;

    const lengkap = murid.filter(m => rapor.find(r => r.murid_id === m.id && r.locked)).length;
    const belumLengkap = murid.length - lengkap;

    const validasi = [];
    murid.forEach(m => {
      if (!m.nik || !m.nisn) validasi.push(`${m.nama_lengkap}: NIK/NISN belum lengkap`);
      if (!m.tinggi || !m.berat) validasi.push(`${m.nama_lengkap}: Tinggi/Berat belum diisi`);
    });

    const root = document.getElementById('pageRoot');
    root.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-house-door"></i> Dashboard</h1>
          <div class="subtitle">Selamat datang, ${U.esc(user.nama)} · ${U.esc(profil.nama || 'RA')}</div>
        </div>
        <div class="text-end small">
          <div class="text-muted">Tahun Ajaran</div>
          <div class="fw-semibold">${U.esc(ta?.label || '-')} · Semester ${U.esc(sem?.label || '-')}</div>
        </div>
      </div>

      <div class="demo-banner">
        <i class="bi bi-lightbulb-fill" style="font-size:20px"></i>
        <div class="flex-grow-1">
          <b>Mode Demo:</b> Aplikasi sudah berisi data contoh RA Miftahul Jannah dengan murid Syifa Aulia.
          Coba klik tombol di samping untuk melihat rapor demo lengkap dengan deskripsi otomatis.
        </div>
        <a href="#/cetak/mrd_syifa" class="btn btn-sm btn-success"><i class="bi bi-eye"></i> Lihat Demo Rapor</a>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-6 col-md-3"><div class="card-stat"><div class="icon"><i class="bi bi-people"></i></div><div><div class="label">Murid</div><div class="value">${murid.length}</div></div></div></div>
        <div class="col-6 col-md-3"><div class="card-stat"><div class="icon"><i class="bi bi-collection"></i></div><div><div class="label">Kelas</div><div class="value">${kelas.length}</div></div></div></div>
        <div class="col-6 col-md-3"><div class="card-stat"><div class="icon"><i class="bi bi-person-badge"></i></div><div><div class="label">Guru</div><div class="value">${guru.length}</div></div></div></div>
        <div class="col-6 col-md-3"><div class="card-stat gold"><div class="icon"><i class="bi bi-award"></i></div><div><div class="label">L / P</div><div class="value">${muridL} / ${muridP}</div></div></div></div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <div class="panel">
            <div class="panel-head"><h5 class="panel-title"><i class="bi bi-file-text"></i> Status Rapor</h5></div>
            <div class="d-flex gap-3">
              <div class="flex-fill text-center p-3" style="background:#e8f5e9;border-radius:10px">
                <div style="font-size:32px;font-weight:700;color:#2e7d32">${lengkap}</div>
                <div class="small text-muted">Sudah Lengkap & Dikunci</div>
              </div>
              <div class="flex-fill text-center p-3" style="background:#fff8e1;border-radius:10px">
                <div style="font-size:32px;font-weight:700;color:#f57f17">${belumLengkap}</div>
                <div class="small text-muted">Belum Lengkap</div>
              </div>
            </div>
            <div class="mt-3">
              <a href="#/rapor" class="btn btn-success btn-sm w-100"><i class="bi bi-pencil-square"></i> Kelola Rapor</a>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="panel">
            <div class="panel-head"><h5 class="panel-title"><i class="bi bi-exclamation-triangle"></i> Validasi Data</h5></div>
            ${validasi.length === 0
              ? `<div class="alert alert-success mb-0"><i class="bi bi-check-circle"></i> Semua data murid sudah lengkap.</div>`
              : `<div class="alert alert-warning alert-validasi mb-0">
                  <div class="fw-semibold mb-2">${validasi.length} hal perlu dilengkapi:</div>
                  <ul class="mb-0 small">
                    ${validasi.slice(0, 6).map(v => `<li>${U.esc(v)}</li>`).join('')}
                    ${validasi.length > 6 ? `<li><i>+${validasi.length-6} lainnya...</i></li>` : ''}
                  </ul>
                </div>`}
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h5 class="panel-title"><i class="bi bi-lightning"></i> Akses Cepat</h5>
        </div>
        <div class="row g-2">
          <div class="col-6 col-md-3"><a href="#/buku-induk" class="btn btn-outline-success w-100 text-start"><i class="bi bi-journal-text"></i> Buku Induk</a></div>
          <div class="col-6 col-md-3"><a href="#/asesmen" class="btn btn-outline-success w-100 text-start"><i class="bi bi-clipboard-check"></i> Input Asesmen</a></div>
          <div class="col-6 col-md-3"><a href="#/generate" class="btn btn-outline-success w-100 text-start"><i class="bi bi-magic"></i> Generate Rapor</a></div>
          <div class="col-6 col-md-3"><a href="#/cetak" class="btn btn-outline-success w-100 text-start"><i class="bi bi-printer"></i> Cetak Rapor</a></div>
        </div>
      </div>
    `;
  }

  return { render };
})();
