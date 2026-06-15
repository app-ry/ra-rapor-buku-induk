// profil.js — Edit Profil RA
window.Pages.profil = (function() {
  function render() {
    const profil = Store.getObj('profil_ra', {});
    const root = document.getElementById('pageRoot');
    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-building"></i> Profil RA</h1>
        <div class="subtitle">Identitas Raudhatul Athfal</div></div>
      </div>
      <form id="profilForm" class="panel">
        <h6 class="form-section-title">Identitas KOP / Header Rapor</h6>
        <div class="row g-3">
          ${field('nama_yayasan','Nama Yayasan',profil.nama_yayasan)}
          ${field('nama','Nama Madrasah (RA)',profil.nama,true)}
          ${field('nsm','NSM',profil.nsm)}
          ${field('npsn','NPSN',profil.npsn)}
          ${field('alamat','Alamat Madrasah',profil.alamat,false,12)}
        </div>
        <h6 class="form-section-title mt-4">Lokasi & Pejabat</h6>
        <div class="row g-3">
          ${field('desa','Desa/Kelurahan',profil.desa)}
          ${field('kec','Kecamatan',profil.kec)}
          ${field('kab','Kabupaten',profil.kab)}
          ${field('prov','Provinsi',profil.prov)}
          ${field('kepala_nama','Nama Kepala RA',profil.kepala_nama)}
          ${field('kepala_nip','NIP/NUPTK Kepala',profil.kepala_nip)}
          ${field('kota_cetak','Kota Tanggal Cetak',profil.kota_cetak)}
        </div>
        <div class="row g-3 mt-1">
          <div class="col-md-6">
            <label class="form-label">Logo RA</label>
            ${profil.logo_ra_dataurl ? `<div class="mb-2"><img src="${profil.logo_ra_dataurl}" style="max-width:120px;max-height:80px;border:1px solid #ccc;padding:4px;border-radius:6px"></div>` : ''}
            <input type="file" class="form-control" id="logo_ra_file" accept="image/*">
          </div>
        </div>
        <div class="mt-3">
          <button class="btn btn-success" type="submit"><i class="bi bi-check-lg"></i> Simpan</button>
        </div>
      </form>
    `;

    document.getElementById('profilForm').onsubmit = async (e) => {
      e.preventDefault();
      const cur = Store.getObj('profil_ra', {});
      ['nama_yayasan','nama','nsm','npsn','alamat','desa','kec','kab','prov','kepala_nama','kepala_nip','kota_cetak'].forEach(k => {
        cur[k] = document.getElementById('f_'+k).value.trim();
      });
      const fr = document.getElementById('logo_ra_file').files[0];
      if (fr) cur.logo_ra_dataurl = await U.fileToDataURL(fr);
      Store.setObj('profil_ra', cur);
      Store.log('update','profil_ra');
      U.toast('Profil RA disimpan');
      document.getElementById('sidebarRaName').textContent = cur.nama || 'RA';
      render();
    };
  }
  function field(k, label, val, req, cols) {
    return `<div class="col-md-${cols||6}"><label class="form-label">${label}</label>
      <input class="form-control" id="f_${k}" value="${U.esc(val||'')}" ${req?'required':''}></div>`;
  }
  return { render };
})();
