// excel.js — export/import Buku Induk + rekap asesmen via ExcelJS
window.XLS = (function() {

  const BI_COLS = [
    { key:'no_induk', header:'No Induk', width:12 },
    { key:'nisn', header:'NISN', width:14 },
    { key:'nik', header:'NIK', width:18 },
    { key:'nama_lengkap', header:'Nama Lengkap', width:25 },
    { key:'nama_panggilan', header:'Nama Panggilan', width:14 },
    { key:'jenis_kelamin', header:'Jenis Kelamin (L/P)', width:10 },
    { key:'tempat_lahir', header:'Tempat Lahir', width:14 },
    { key:'tanggal_lahir', header:'Tanggal Lahir (YYYY-MM-DD)', width:18 },
    { key:'agama', header:'Agama', width:10 },
    { key:'kewarganegaraan', header:'Kewarganegaraan', width:14 },
    { key:'anak_ke', header:'Anak Ke', width:8 },
    { key:'jumlah_saudara', header:'Jumlah Saudara', width:10 },
    { key:'bahasa_sehari', header:'Bahasa Sehari-hari', width:14 },
    { key:'alamat', header:'Alamat', width:25 },
    { key:'rt_rw', header:'RT/RW', width:8 },
    { key:'desa', header:'Desa/Kelurahan', width:14 },
    { key:'kec', header:'Kecamatan', width:14 },
    { key:'kab', header:'Kabupaten', width:14 },
    { key:'prov', header:'Provinsi', width:14 },
    { key:'kode_pos', header:'Kode Pos', width:8 },
    { key:'jarak_rumah', header:'Jarak Rumah', width:10 },
    { key:'transportasi', header:'Transportasi', width:14 },
    { key:'tinggal_bersama', header:'Tinggal Bersama', width:14 },
    { key:'tinggi', header:'Tinggi (cm)', width:10 },
    { key:'berat', header:'Berat (kg)', width:10 },
    { key:'lingkar_kepala', header:'Lingkar Kepala (cm)', width:10 },
    { key:'gol_darah', header:'Gol. Darah', width:10 },
    { key:'riwayat_penyakit', header:'Riwayat Penyakit', width:18 },
    { key:'alergi', header:'Alergi', width:14 },
    { key:'imunisasi', header:'Imunisasi', width:14 },
    { key:'catatan_kesehatan', header:'Catatan Kesehatan', width:18 },
    { key:'ayah_nama', header:'Nama Ayah', width:20 },
    { key:'ayah_nik', header:'NIK Ayah', width:18 },
    { key:'ayah_ttl', header:'TTL Ayah', width:18 },
    { key:'ayah_pendidikan', header:'Pendidikan Ayah', width:14 },
    { key:'ayah_pekerjaan', header:'Pekerjaan Ayah', width:14 },
    { key:'ayah_penghasilan', header:'Penghasilan Ayah', width:14 },
    { key:'ayah_hp', header:'HP Ayah', width:14 },
    { key:'ibu_nama', header:'Nama Ibu', width:20 },
    { key:'ibu_nik', header:'NIK Ibu', width:18 },
    { key:'ibu_ttl', header:'TTL Ibu', width:18 },
    { key:'ibu_pendidikan', header:'Pendidikan Ibu', width:14 },
    { key:'ibu_pekerjaan', header:'Pekerjaan Ibu', width:14 },
    { key:'ibu_penghasilan', header:'Penghasilan Ibu', width:14 },
    { key:'ibu_hp', header:'HP Ibu', width:14 },
    { key:'wali_nama', header:'Nama Wali', width:20 },
    { key:'wali_hubungan', header:'Hubungan Wali', width:12 },
    { key:'wali_hp', header:'HP Wali', width:14 },
    { key:'wali_alamat', header:'Alamat Wali', width:20 },
    { key:'tanggal_masuk', header:'Tanggal Masuk', width:14 },
    { key:'asal_paud', header:'Asal PAUD/TK/KB', width:18 },
    { key:'kelompok_masuk', header:'Kelompok Masuk', width:14 },
    { key:'ta_masuk', header:'TA Masuk', width:12 },
    { key:'status', header:'Status (Aktif/Pindah/Lulus)', width:12 },
    { key:'no_ijazah', header:'No Ijazah', width:14 },
    { key:'no_akta', header:'No Akta Kelahiran', width:18 }
  ];

  async function exportBukuInduk(filename='Buku_Induk_RA.xlsx') {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Aplikasi Rapor RA Digital';
    wb.created = new Date();

    const profil = Store.getObj('profil_ra', {});
    const kelas = Store.list('kelas');
    const kelasMap = {}; kelas.forEach(k => kelasMap[k.id] = k.nama);
    const murid = Store.list('murid');

    const ws = wb.addWorksheet('Buku Induk');
    ws.columns = [
      { key:'_kelas', header:'Kelas', width:14 },
      ...BI_COLS
    ];

    // Header style
    ws.getRow(1).font = { bold:true, color:{argb:'FFFFFFFF'} };
    ws.getRow(1).fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF2E7D32'} };
    ws.getRow(1).alignment = { vertical:'middle', horizontal:'center', wrapText:true };
    ws.getRow(1).height = 36;

    murid.forEach(m => {
      const row = { _kelas: kelasMap[m.kelas_id] || '' };
      BI_COLS.forEach(c => row[c.key] = m[c.key] != null ? m[c.key] : '');
      ws.addRow(row);
    });

    ws.views = [{ state:'frozen', ySplit:1 }];

    // Sheet petunjuk
    const ws2 = wb.addWorksheet('Petunjuk');
    ws2.columns = [{ width:120 }];
    [
      'PETUNJUK PENGISIAN BUKU INDUK RA',
      '',
      `Profil RA: ${profil.nama || ''}`,
      `Tahun Ajaran: ${profil.ta_aktif || ''}`,
      '',
      '1. Kolom "Kelas" diisi nama kelas yang sudah terdaftar di aplikasi.',
      '2. Tanggal Lahir & Tanggal Masuk format YYYY-MM-DD (contoh: 2021-01-15).',
      '3. Jenis Kelamin diisi L atau P.',
      '4. Status diisi: Aktif / Pindah / Lulus.',
      '5. Saat import, baris dengan NIK sama akan di-update; NIK kosong akan dibuat baru.',
      '6. Kolom kosong akan diisi string kosong.',
      '7. Kolom Tinggi/Berat/Lingkar Kepala dapat berupa angka (cm/kg).',
    ].forEach(line => ws2.addRow([line]));
    ws2.getRow(1).font = { bold:true, size:14, color:{argb:'FF2E7D32'} };

    const buf = await wb.xlsx.writeBuffer();
    U.downloadBlob(new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
  }

  async function downloadTemplateBukuInduk() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Buku Induk');
    ws.columns = [{ key:'_kelas', header:'Kelas', width:14 }, ...BI_COLS];
    ws.getRow(1).font = { bold:true, color:{argb:'FFFFFFFF'} };
    ws.getRow(1).fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF2E7D32'} };
    ws.getRow(1).alignment = { vertical:'middle', horizontal:'center', wrapText:true };
    ws.getRow(1).height = 36;
    // Contoh 1 baris
    const example = { _kelas:'Matahari', no_induk:'001/2025', nisn:'0123456789', nik:'3509012345678901',
      nama_lengkap:'Contoh Nama', nama_panggilan:'Nama', jenis_kelamin:'L', tempat_lahir:'Jember',
      tanggal_lahir:'2021-01-15', agama:'Islam', kewarganegaraan:'Indonesia', status:'Aktif' };
    ws.addRow(example);

    const ws2 = wb.addWorksheet('Petunjuk');
    ws2.columns = [{ width:120 }];
    [
      'TEMPLATE BUKU INDUK RA',
      'Hapus baris contoh sebelum diisi data sebenarnya.',
      'Format Tanggal: YYYY-MM-DD. Jenis Kelamin: L/P. Status: Aktif/Pindah/Lulus.',
      'Saat import, NIK menjadi kunci unik untuk update; jika kosong akan dibuat data baru.'
    ].forEach(l => ws2.addRow([l]));

    const buf = await wb.xlsx.writeBuffer();
    U.downloadBlob(new Blob([buf]), 'Template_Buku_Induk_RA.xlsx');
  }

  async function importBukuInduk(file) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.getWorksheet('Buku Induk') || wb.worksheets[0];
    if (!ws) throw new Error('Sheet Buku Induk tidak ditemukan');

    const headerRow = ws.getRow(1);
    const headerMap = {};
    headerRow.eachCell((cell, col) => {
      const v = String(cell.value || '').trim();
      headerMap[v] = col;
    });

    const allCols = [{ key:'_kelas', header:'Kelas' }, ...BI_COLS];
    const colByHeader = {};
    allCols.forEach(c => {
      const idx = headerMap[c.header];
      if (idx) colByHeader[c.key] = idx;
    });

    const kelasList = Store.list('kelas');
    const kelasByName = {}; kelasList.forEach(k => kelasByName[(k.nama||'').toLowerCase()] = k.id);

    let created = 0, updated = 0, skipped = 0;
    const errors = [];

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const isEmpty = row.values.every(v => v == null || v === '');
      if (isEmpty) continue;

      const obj = {};
      BI_COLS.forEach(c => {
        const idx = colByHeader[c.key];
        if (!idx) return;
        let val = row.getCell(idx).value;
        if (val && typeof val === 'object' && val.text) val = val.text;
        if (val instanceof Date) val = val.toISOString().slice(0,10);
        obj[c.key] = val == null ? '' : String(val).trim();
      });

      // Numerik
      ['anak_ke','jumlah_saudara','tinggi','berat','lingkar_kepala'].forEach(k => {
        if (obj[k] !== '' && obj[k] != null) {
          const n = parseFloat(obj[k]);
          if (!isNaN(n)) obj[k] = n;
        }
      });

      // Kelas resolution
      const kelasIdx = colByHeader._kelas;
      if (kelasIdx) {
        const kelasName = String(row.getCell(kelasIdx).value || '').trim().toLowerCase();
        if (kelasName && kelasByName[kelasName]) obj.kelas_id = kelasByName[kelasName];
      }

      if (!obj.nama_lengkap) { skipped++; continue; }

      // Mode: by NIK if available, else create new
      if (obj.nik) {
        const existing = Store.list('murid').find(m => m.nik === obj.nik);
        if (existing) {
          Store.update('murid', existing.id, obj);
          updated++;
        } else {
          Store.add('murid', obj);
          created++;
        }
      } else {
        // try by Nama+TTL
        const existing = Store.list('murid').find(m =>
          (m.nama_lengkap||'').toLowerCase() === obj.nama_lengkap.toLowerCase()
          && m.tanggal_lahir === obj.tanggal_lahir
        );
        if (existing) {
          Store.update('murid', existing.id, obj);
          updated++;
        } else {
          Store.add('murid', obj);
          created++;
        }
      }
    }

    return { created, updated, skipped, errors };
  }

  // Export rekap asesmen per kelas
  async function exportRekapAsesmen(kelasId) {
    const kelas = Store.findById('kelas', kelasId);
    if (!kelas) throw new Error('Kelas tidak ditemukan');
    const ta = Store.activeTA(); const sem = Store.activeSem();
    const wb = new ExcelJS.Workbook();
    const muridList = Store.list('murid').filter(m => m.kelas_id === kelasId);
    const indikatorList = Store.list('indikator');
    const asesAll = Store.list('asesmen').filter(a => a.ta_id === ta?.id && a.sem_id === sem?.id);

    const elemenMap = { nilai_agama:'Nilai Agama', jati_diri:'Jati Diri', literasi:'Literasi-Matsens', kokurikuler:'Kokurikuler' };
    Object.keys(elemenMap).forEach(el => {
      const indEl = indikatorList.filter(i => i.elemen === el);
      const ws = wb.addWorksheet(elemenMap[el]);
      const cols = [{ key:'no', header:'No', width:5 }, { key:'nama', header:'Nama Murid', width:25 }];
      indEl.forEach(i => cols.push({ key:i.id, header:`${i.kode}: ${i.teks.substring(0,40)}...`, width:18 }));
      ws.columns = cols;
      ws.getRow(1).font = { bold:true, color:{argb:'FFFFFFFF'} };
      ws.getRow(1).fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF2E7D32'} };
      ws.getRow(1).alignment = { vertical:'middle', horizontal:'center', wrapText:true };
      ws.getRow(1).height = 60;

      muridList.forEach((m, idx) => {
        const row = { no: idx+1, nama: m.nama_lengkap };
        indEl.forEach(i => {
          const a = asesAll.find(x => x.murid_id === m.id && x.indikator_id === i.id);
          row[i.id] = a ? a.capaian : '';
        });
        ws.addRow(row);
      });
    });

    const buf = await wb.xlsx.writeBuffer();
    U.downloadBlob(new Blob([buf]), `Rekap_Asesmen_${kelas.nama}.xlsx`);
  }

  return { exportBukuInduk, downloadTemplateBukuInduk, importBukuInduk, exportRekapAsesmen };
})();
