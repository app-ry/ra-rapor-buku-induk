// buku_induk.js — CRUD murid lengkap
window.Pages.buku_induk = (function() {
  let filterKelas = '';
  let filterStatus = '';
  let qstr = '';

  function render() {
    const user = Store.currentUser();
    const kelas = Store.list('kelas');
    let muridAll = Store.list('murid');

    // Role guru: filter ke kelasnya saja
    if (user.role === 'guru' && user.kelas_id) {
      muridAll = muridAll.filter(m => m.kelas_id === user.kelas_id);
    }

    let murid = muridAll.slice();
    if (filterKelas) murid = murid.filter(m => m.kelas_id === filterKelas);
    if (filterStatus) murid = murid.filter(m => (m.status||'Aktif') === filterStatus);
    if (qstr) {
      const q = qstr.toLowerCase();
      murid = murid.filter(m =>
        (m.nama_lengkap||'').toLowerCase().includes(q) ||
        (m.nisn||'').includes(q) ||
        (m.nik||'').includes(q) ||
        (m.no_induk||'').toLowerCase().includes(q)
      );
    }

    const root = document.getElementById('pageRoot');
    root.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-journal-text"></i> Buku Induk Peserta Didik</h1>
        <div class="subtitle">${murid.length} dari ${muridAll.length} murid</div></div>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-outline-success btn-sm" id="btnTemplate"><i class="bi bi-download"></i> Template</button>
          <button class="btn btn-outline-success btn-sm" id="btnImport"><i class="bi bi-upload"></i> Import Excel</button>
          <button class="btn btn-outline-success btn-sm" id="btnExport"><i class="bi bi-file-earmark-excel"></i> Export Excel</button>
          <button class="btn btn-outline-success btn-sm" id="btnPrintAll"><i class="bi bi-printer"></i> Cetak Buku Induk</button>
          ${user.role !== 'kepala' ? `<button class="btn btn-success btn-sm" id="btnAdd"><i class="bi bi-plus"></i> Tambah Murid</button>` : ''}
        </div>
      </div>

      <div class="panel">
        <div class="row g-2 mb-3">
          <div class="col-md-4"><input class="form-control form-control-sm" id="fSearch" placeholder="Cari nama/NIK/NISN/no induk" value="${U.esc(qstr)}"></div>
          <div class="col-md-4"><select class="form-select form-select-sm" id="fKelas">
            <option value="">Semua kelas</option>
            ${kelas.map(k => `<option value="${k.id}" ${k.id===filterKelas?'selected':''}>${U.esc(k.nama)}</option>`).join('')}
          </select></div>
          <div class="col-md-4"><select class="form-select form-select-sm" id="fStatus">
            <option value="">Semua status</option>
            ${['Aktif','Pindah','Lulus','Keluar'].map(s => `<option value="${s}" ${s===filterStatus?'selected':''}>${s}</option>`).join('')}
          </select></div>
        </div>

        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>No</th><th>No Induk</th><th>NISN</th><th>Nama</th><th>JK</th><th>Kelas</th><th>TTL</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            ${murid.length === 0 ? `<tr><td colspan="9" class="text-center text-muted">Belum ada data murid</td></tr>` :
              murid.map((m,i) => `<tr>
                <td>${i+1}</td>
                <td>${U.esc(m.no_induk||'-')}</td>
                <td>${U.esc(m.nisn||'-')}</td>
                <td><b>${U.esc(m.nama_lengkap||'')}</b><br><small class="text-muted">${U.esc(m.nama_panggilan||'')}</small></td>
                <td>${m.jenis_kelamin||'-'}</td>
                <td>${U.esc(kelas.find(k=>k.id===m.kelas_id)?.nama||'-')}</td>
                <td><small>${U.esc(m.tempat_lahir||'')}, ${U.esc(U.fmtDate(m.tanggal_lahir))}</small></td>
                <td><span class="bdg ${m.status==='Aktif'?'bdg-bsb':'bdg-mb'}">${U.esc(m.status||'Aktif')}</span></td>
                <td class="actions">
                  <button class="btn btn-sm btn-outline-success" data-act="edit" data-id="${m.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                  <a class="btn btn-sm btn-outline-success" href="#/cetak-induk/${m.id}" title="Cetak Buku Induk"><i class="bi bi-printer"></i></a>
                  <a class="btn btn-sm btn-outline-success" href="#/cetak/${m.id}" title="Rapor"><i class="bi bi-file-text"></i></a>
                  ${user.role!=='kepala'?`<button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${m.id}" title="Hapus"><i class="bi bi-trash"></i></button>`:''}
                </td>
              </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    `;

    document.getElementById('fSearch').oninput = (e) => { qstr = e.target.value; renderRows(); };
    document.getElementById('fKelas').onchange = (e) => { filterKelas = e.target.value; render(); };
    document.getElementById('fStatus').onchange = (e) => { filterStatus = e.target.value; render(); };
    document.getElementById('btnTemplate').onclick = () => XLS.downloadTemplateBukuInduk();
    document.getElementById('btnExport').onclick = () => XLS.exportBukuInduk();
    document.getElementById('btnImport').onclick = () => doImport();
    document.getElementById('btnPrintAll').onclick = () => {
      // print semua yang sedang difilter
      const ids = murid.map(m => m.id);
      if (!ids.length) { U.toast('Tidak ada murid untuk dicetak','warning'); return; }
      sessionStorage.setItem('ra_print_induk_ids', JSON.stringify(ids));
      location.hash = '#/cetak-induk/batch';
    };
    const btnAdd = document.getElementById('btnAdd');
    if (btnAdd) btnAdd.onclick = () => editForm(null);

    function renderRows() { render(); /* simple re-render */ }

    root.querySelectorAll('[data-act]').forEach(b => {
      b.onclick = async () => {
        if (b.dataset.act === 'edit') editForm(b.dataset.id);
        else if (b.dataset.act === 'del') {
          if (await U.confirmModal({ title:'Hapus murid?', body:'Data asesmen & rapor terkait juga akan terhapus.', danger:true, okText:'Hapus' })) {
            Store.remove('murid', b.dataset.id);
            Store.list('asesmen').filter(a => a.murid_id === b.dataset.id).forEach(a => Store.remove('asesmen', a.id));
            Store.list('rapor').filter(r => r.murid_id === b.dataset.id).forEach(r => Store.remove('rapor', r.id));
            U.toast('Murid dihapus');
            render();
          }
        }
      };
    });
  }

  function doImport() {
    const m = U.showModal({
      title:'Import Buku Induk dari Excel',
      bodyHTML: `
        <p class="small text-muted">Pilih file Excel hasil export atau template. Baris dengan NIK sama akan di-update; NIK kosong → buat baru.</p>
        <input type="file" class="form-control" id="impFile" accept=".xlsx,.xls">
        <div id="impResult" class="mt-3"></div>
      `,
      footerHTML: `<button class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
        <button class="btn btn-success" id="btnDoImp">Import</button>`
    });
    m.el.querySelector('#btnDoImp').onclick = async () => {
      const f = m.el.querySelector('#impFile').files[0];
      if (!f) { U.toast('Pilih file dulu','warning'); return; }
      try {
        const r = await XLS.importBukuInduk(f);
        m.el.querySelector('#impResult').innerHTML = `
          <div class="alert alert-success">
            <b>Selesai.</b> ${r.created} murid baru, ${r.updated} di-update, ${r.skipped} dilewati.
          </div>`;
        U.toast('Import selesai');
        Store.log('import','buku_induk');
      } catch (e) {
        m.el.querySelector('#impResult').innerHTML = `<div class="alert alert-danger">${U.esc(e.message)}</div>`;
      }
    };
  }

  function field(k, label, val, opts={}) {
    const t = opts.type || 'text';
    const ph = opts.ph || '';
    if (t === 'select') {
      return `<div class="col-md-${opts.cols||6}"><label class="form-label small">${label}</label>
        <select class="form-select" id="bi_${k}">
          ${opts.options.map(o => `<option value="${U.esc(o.v||o)}" ${ (val||'')===(o.v||o) ?'selected':''}>${U.esc(o.l||o)}</option>`).join('')}
        </select></div>`;
    }
    if (t === 'textarea') {
      return `<div class="col-md-${opts.cols||12}"><label class="form-label small">${label}</label>
        <textarea class="form-control" id="bi_${k}" rows="2" placeholder="${ph}">${U.esc(val||'')}</textarea></div>`;
    }
    return `<div class="col-md-${opts.cols||6}"><label class="form-label small">${label}</label>
      <input type="${t}" class="form-control" id="bi_${k}" value="${U.esc(val||'')}" placeholder="${ph}"></div>`;
  }

  function editForm(id) {
    const m0 = id ? Store.findById('murid', id) : { kelas_id:'', jenis_kelamin:'L', agama:'Islam', kewarganegaraan:'Indonesia', status:'Aktif' };
    const kelas = Store.list('kelas');
    const tabBtn = (id, label, active) => `<button class="nav-link ${active?'active':''}" data-bs-toggle="pill" data-bs-target="#tab-${id}" type="button">${label}</button>`;

    const m = U.showModal({
      size:'xl',
      title: id ? `Edit Murid: ${m0.nama_lengkap}` : 'Tambah Murid Baru',
      bodyHTML: `
        <ul class="nav nav-pills mb-3 flex-wrap" role="tablist">
          ${tabBtn('id','Identitas',true)}
          ${tabBtn('alm','Alamat',false)}
          ${tabBtn('fis','Fisik & Kesehatan',false)}
          ${tabBtn('ot','Orang Tua/Wali',false)}
          ${tabBtn('msk','Data Masuk',false)}
          ${tabBtn('klr','Data Keluar',false)}
        </ul>
        <div class="tab-content">
          <div class="tab-pane fade show active" id="tab-id">
            <div class="row g-3">
              ${field('kelas_id','Kelas',m0.kelas_id,{type:'select',options:[{v:'',l:'-- pilih --'},...kelas.map(k=>({v:k.id,l:k.nama}))]})}
              ${field('no_induk','No Induk',m0.no_induk)}
              ${field('nisn','NISN',m0.nisn)}
              ${field('nik','NIK',m0.nik)}
              ${field('nama_lengkap','Nama Lengkap',m0.nama_lengkap,{cols:8})}
              ${field('nama_panggilan','Nama Panggilan',m0.nama_panggilan,{cols:4})}
              ${field('jenis_kelamin','Jenis Kelamin',m0.jenis_kelamin,{type:'select',options:['L','P']})}
              ${field('tempat_lahir','Tempat Lahir',m0.tempat_lahir)}
              ${field('tanggal_lahir','Tanggal Lahir',m0.tanggal_lahir,{type:'date'})}
              ${field('agama','Agama',m0.agama)}
              ${field('kewarganegaraan','Kewarganegaraan',m0.kewarganegaraan)}
              ${field('anak_ke','Anak Ke',m0.anak_ke,{type:'number'})}
              ${field('jumlah_saudara','Jumlah Saudara',m0.jumlah_saudara,{type:'number'})}
              ${field('bahasa_sehari','Bahasa Sehari-hari',m0.bahasa_sehari)}
            </div>
          </div>
          <div class="tab-pane fade" id="tab-alm">
            <div class="row g-3">
              ${field('alamat','Alamat',m0.alamat,{cols:12})}
              ${field('rt_rw','RT/RW',m0.rt_rw,{cols:4})}
              ${field('desa','Desa/Kelurahan',m0.desa,{cols:4})}
              ${field('kec','Kecamatan',m0.kec,{cols:4})}
              ${field('kab','Kabupaten',m0.kab)}
              ${field('prov','Provinsi',m0.prov)}
              ${field('kode_pos','Kode Pos',m0.kode_pos)}
              ${field('jarak_rumah','Jarak Rumah ke RA',m0.jarak_rumah)}
              ${field('transportasi','Transportasi',m0.transportasi)}
              ${field('tinggal_bersama','Tinggal Bersama',m0.tinggal_bersama)}
            </div>
          </div>
          <div class="tab-pane fade" id="tab-fis">
            <div class="row g-3">
              ${field('tinggi','Tinggi (cm)',m0.tinggi,{type:'number'})}
              ${field('berat','Berat (kg)',m0.berat,{type:'number'})}
              ${field('lingkar_kepala','Lingkar Kepala (cm)',m0.lingkar_kepala,{type:'number'})}
              ${field('gol_darah','Gol. Darah',m0.gol_darah,{type:'select',options:['','A','B','AB','O']})}
              ${field('riwayat_penyakit','Riwayat Penyakit',m0.riwayat_penyakit)}
              ${field('alergi','Alergi',m0.alergi)}
              ${field('imunisasi','Imunisasi',m0.imunisasi)}
              ${field('catatan_kesehatan','Catatan Kesehatan',m0.catatan_kesehatan,{type:'textarea'})}
            </div>
          </div>
          <div class="tab-pane fade" id="tab-ot">
            <div class="row g-3">
              <div class="col-12"><div class="form-section-title">Ayah</div></div>
              ${field('ayah_nama','Nama Ayah',m0.ayah_nama)}
              ${field('ayah_nik','NIK Ayah',m0.ayah_nik)}
              ${field('ayah_ttl','Tempat/Tanggal Lahir Ayah',m0.ayah_ttl)}
              ${field('ayah_pendidikan','Pendidikan Ayah',m0.ayah_pendidikan)}
              ${field('ayah_pekerjaan','Pekerjaan Ayah',m0.ayah_pekerjaan)}
              ${field('ayah_penghasilan','Penghasilan Ayah',m0.ayah_penghasilan)}
              ${field('ayah_hp','HP Ayah',m0.ayah_hp)}
              <div class="col-12"><div class="form-section-title">Ibu</div></div>
              ${field('ibu_nama','Nama Ibu',m0.ibu_nama)}
              ${field('ibu_nik','NIK Ibu',m0.ibu_nik)}
              ${field('ibu_ttl','Tempat/Tanggal Lahir Ibu',m0.ibu_ttl)}
              ${field('ibu_pendidikan','Pendidikan Ibu',m0.ibu_pendidikan)}
              ${field('ibu_pekerjaan','Pekerjaan Ibu',m0.ibu_pekerjaan)}
              ${field('ibu_penghasilan','Penghasilan Ibu',m0.ibu_penghasilan)}
              ${field('ibu_hp','HP Ibu',m0.ibu_hp)}
              <div class="col-12"><div class="form-section-title">Wali (jika ada)</div></div>
              ${field('wali_nama','Nama Wali',m0.wali_nama)}
              ${field('wali_hubungan','Hubungan dengan Anak',m0.wali_hubungan)}
              ${field('wali_hp','HP Wali',m0.wali_hp)}
              ${field('wali_alamat','Alamat Wali',m0.wali_alamat)}
            </div>
          </div>
          <div class="tab-pane fade" id="tab-msk">
            <div class="row g-3">
              ${field('tanggal_masuk','Tanggal Masuk',m0.tanggal_masuk,{type:'date'})}
              ${field('asal_paud','Asal PAUD/TK/KB',m0.asal_paud)}
              ${field('kelompok_masuk','Kelompok Masuk',m0.kelompok_masuk)}
              ${field('ta_masuk','TA Masuk',m0.ta_masuk)}
              ${field('status','Status',m0.status,{type:'select',options:['Aktif','Pindah','Lulus','Keluar']})}
              ${field('no_ijazah','No Ijazah/STTB',m0.no_ijazah)}
              ${field('no_akta','No Akta Kelahiran',m0.no_akta)}
              <div class="col-md-6"><label class="form-label small">Foto Anak</label>
                ${m0.foto_dataurl?`<div class="mb-2"><img src="${m0.foto_dataurl}" style="max-height:80px;border:1px solid #ccc"></div>`:''}
                <input type="file" class="form-control" id="bi_foto" accept="image/*"></div>
              ${field('catatan_khusus','Catatan Khusus',m0.catatan_khusus,{type:'textarea',cols:12})}
            </div>
          </div>
          <div class="tab-pane fade" id="tab-klr">
            <div class="row g-3">
              ${field('tanggal_keluar','Tanggal Keluar',m0.tanggal_keluar,{type:'date'})}
              ${field('alasan_keluar','Alasan Keluar',m0.alasan_keluar)}
              ${field('melanjutkan_ke','Melanjutkan Ke',m0.melanjutkan_ke)}
              ${field('no_surat_pindah','No Surat Pindah',m0.no_surat_pindah)}
              ${field('keterangan_keluar','Keterangan',m0.keterangan_keluar,{type:'textarea'})}
            </div>
          </div>
        </div>
      `,
      footerHTML: `<button class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
        <button class="btn btn-success" id="btnSaveBI">Simpan</button>`
    });

    m.el.querySelector('#btnSaveBI').onclick = async () => {
      const fields = ['kelas_id','no_induk','nisn','nik','nama_lengkap','nama_panggilan','jenis_kelamin','tempat_lahir','tanggal_lahir','agama','kewarganegaraan','anak_ke','jumlah_saudara','bahasa_sehari','alamat','rt_rw','desa','kec','kab','prov','kode_pos','jarak_rumah','transportasi','tinggal_bersama','tinggi','berat','lingkar_kepala','gol_darah','riwayat_penyakit','alergi','imunisasi','catatan_kesehatan','ayah_nama','ayah_nik','ayah_ttl','ayah_pendidikan','ayah_pekerjaan','ayah_penghasilan','ayah_hp','ibu_nama','ibu_nik','ibu_ttl','ibu_pendidikan','ibu_pekerjaan','ibu_penghasilan','ibu_hp','wali_nama','wali_hubungan','wali_hp','wali_alamat','tanggal_masuk','asal_paud','kelompok_masuk','ta_masuk','status','no_ijazah','no_akta','tanggal_keluar','alasan_keluar','melanjutkan_ke','no_surat_pindah','keterangan_keluar','catatan_khusus'];
      const obj = {};
      fields.forEach(k => {
        const el = m.el.querySelector('#bi_'+k);
        if (!el) return;
        let v = el.value;
        if (['anak_ke','jumlah_saudara','tinggi','berat','lingkar_kepala'].includes(k)) {
          v = U.asNum(v);
        } else {
          v = (v||'').trim();
        }
        obj[k] = v;
      });
      if (!obj.nama_lengkap) { U.toast('Nama lengkap wajib','danger'); return; }
      const fFoto = m.el.querySelector('#bi_foto').files[0];
      if (fFoto) obj.foto_dataurl = await U.fileToDataURL(fFoto);
      else if (m0.foto_dataurl) obj.foto_dataurl = m0.foto_dataurl;
      if (id) Store.update('murid', id, obj);
      else Store.add('murid', obj);
      Store.log(id?'update_murid':'create_murid', id || obj.nama_lengkap);
      m.close();
      U.toast('Murid disimpan');
      render();
    };
  }

  return { render };
})();
