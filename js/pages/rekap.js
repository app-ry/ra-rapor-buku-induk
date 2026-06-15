// rekap.js — Rekap perkembangan
window.Pages.rekap = (function() {
  let selKelas = '';
  function render() {
    const user = Store.currentUser();
    let kelas = Store.list('kelas');
    if (user.role === 'guru' && user.kelas_id) kelas = kelas.filter(k => k.id === user.kelas_id);
    if (!selKelas && kelas[0]) selKelas = kelas[0].id;
    const ta = Store.activeTA(); const sem = Store.activeSem();
    const murid = Store.list('murid').filter(m => m.kelas_id === selKelas);
    const indikator = Store.list('indikator');
    const ases = Store.list('asesmen').filter(a => a.ta_id === ta?.id && a.sem_id === sem?.id);
    const elemen = Narasi.ELEMEN_LABEL;

    // Hitung distribusi per anak
    const summaryAnak = murid.map(m => {
      const myAses = ases.filter(a => a.murid_id === m.id);
      const dist = { BB:0, MB:0, BSH:0, BSB:0 };
      myAses.forEach(a => dist[a.capaian] = (dist[a.capaian]||0)+1);
      const total = myAses.length || 1;
      const skor = (dist.BSB*4 + dist.BSH*3 + dist.MB*2 + dist.BB*1) / total;
      return { murid:m, dist, total: myAses.length, skor };
    });

    // Distribusi per elemen kelas
    const perElemen = {};
    Object.keys(elemen).forEach(el => {
      const inds = indikator.filter(i => i.elemen === el).map(i => i.id);
      const myAses = ases.filter(a => murid.find(m => m.id === a.murid_id) && inds.includes(a.indikator_id));
      const dist = { BB:0, MB:0, BSH:0, BSB:0 };
      myAses.forEach(a => dist[a.capaian] = (dist[a.capaian]||0)+1);
      perElemen[el] = { dist, total: myAses.length };
    });

    const root = document.getElementById('pageRoot');
    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-bar-chart"></i> Rekap Perkembangan</h1>
        <div class="subtitle">${U.esc(ta?.label||'-')} · Semester ${U.esc(sem?.label||'-')}</div></div>
        <button class="btn btn-outline-success btn-sm" id="btnExport"><i class="bi bi-download"></i> Export Rekap</button>
      </div>

      <div class="panel">
        <div class="row g-2 mb-3">
          <div class="col-md-6"><label class="form-label small">Kelas</label>
            <select class="form-select" id="rkKelas">
              ${kelas.map(k => `<option value="${k.id}" ${k.id===selKelas?'selected':''}>${U.esc(k.nama)}</option>`).join('')}
            </select></div>
        </div>

        <h6 class="form-section-title">Distribusi Capaian per Elemen (Kelas)</h6>
        <div class="row g-3 mb-3">
          ${Object.keys(elemen).map(el => {
            const d = perElemen[el].dist;
            const tot = perElemen[el].total || 1;
            return `<div class="col-md-6"><div class="panel" style="margin:0">
              <div class="fw-semibold mb-2 small">${U.esc(elemen[el])}</div>
              ${bar('BSB', d.BSB, tot, '#2e7d32')}
              ${bar('BSH', d.BSH, tot, '#1565c0')}
              ${bar('MB',  d.MB,  tot, '#f57f17')}
              ${bar('BB',  d.BB,  tot, '#c62828')}
            </div></div>`;
          }).join('')}
        </div>

        <h6 class="form-section-title">Per Anak</h6>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Nama</th><th>BB</th><th>MB</th><th>BSH</th><th>BSB</th><th>Total</th><th>Skor Rata</th><th>Aksi</th></tr></thead>
          <tbody>
            ${summaryAnak.length===0?`<tr><td colspan="8" class="text-center text-muted">Tidak ada data</td></tr>`:
              summaryAnak.map(s => `<tr>
                <td><b>${U.esc(s.murid.nama_lengkap)}</b></td>
                <td>${s.dist.BB}</td>
                <td>${s.dist.MB}</td>
                <td>${s.dist.BSH}</td>
                <td>${s.dist.BSB}</td>
                <td>${s.total}</td>
                <td><b>${s.skor.toFixed(2)}</b> / 4</td>
                <td class="actions"><a href="#/cetak/${s.murid.id}" class="btn btn-sm btn-outline-success"><i class="bi bi-file-text"></i> Rapor</a></td>
              </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    `;
    document.getElementById('rkKelas').onchange = (e) => { selKelas = e.target.value; render(); };
    document.getElementById('btnExport').onclick = () => XLS.exportRekapAsesmen(selKelas);
  }
  function bar(label, val, tot, color) {
    const pct = tot ? Math.round(val/tot*100) : 0;
    return `<div class="d-flex align-items-center gap-2 mb-1" style="font-size:12px">
      <div style="width:34px"><b>${label}</b></div>
      <div style="flex:1;background:#eee;height:14px;border-radius:7px;overflow:hidden">
        <div style="background:${color};height:100%;width:${pct}%"></div>
      </div>
      <div style="width:60px;text-align:right">${val} (${pct}%)</div>
    </div>`;
  }
  return { render };
})();
