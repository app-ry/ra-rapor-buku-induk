// seed.js — first-run demo data
window.Seed = (function() {
  const ELEMEN = {
    nilai_agama: 'Nilai Agama dan Budi Pekerti',
    jati_diri: 'Jati Diri',
    literasi: 'Dasar-dasar Literasi, Matematika, Sains, Rekayasa, Teknologi, dan Seni',
    kokurikuler: 'Kokurikuler'
  };

  const INDIKATOR_AWAL = [
    // Nilai Agama dan Budi Pekerti
    { elemen:'nilai_agama', kode:'NA-01', teks:'Anak mampu menyebut nama Allah Swt. dan Rasul-Nya.' },
    { elemen:'nilai_agama', kode:'NA-02', teks:'Anak mampu menyebut sebagian Asmaulhusna.' },
    { elemen:'nilai_agama', kode:'NA-03', teks:'Anak terbiasa berdoa sebelum dan sesudah kegiatan.' },
    { elemen:'nilai_agama', kode:'NA-04', teks:'Anak terbiasa mengucapkan salam.' },
    { elemen:'nilai_agama', kode:'NA-05', teks:'Anak mampu menirukan gerakan salat dan kegiatan ibadah sederhana.' },
    { elemen:'nilai_agama', kode:'NA-06', teks:'Anak mampu membaca kalimat thayyibah.' },
    { elemen:'nilai_agama', kode:'NA-07', teks:'Anak menunjukkan perilaku akhlak baik dan sayang teman.' },
    { elemen:'nilai_agama', kode:'NA-08', teks:'Anak menunjukkan kepedulian terhadap lingkungan sebagai ciptaan Allah.' },
    { elemen:'nilai_agama', kode:'NA-09', teks:'Anak mengenal dan mencintai Al-Qur\'an.' },

    // Jati Diri
    { elemen:'jati_diri', kode:'JD-01', teks:'Anak berani tampil di depan teman dan menunjukkan rasa percaya diri.' },
    { elemen:'jati_diri', kode:'JD-02', teks:'Anak mampu menyampaikan pendapat dan perasaan secara sederhana.' },
    { elemen:'jati_diri', kode:'JD-03', teks:'Anak dapat mengikuti aturan bermain dan kegiatan kelas.' },
    { elemen:'jati_diri', kode:'JD-04', teks:'Anak dapat menunggu giliran dan bersikap sabar.' },
    { elemen:'jati_diri', kode:'JD-05', teks:'Anak mampu mengurus kebutuhan diri sederhana (makan, toilet, pakaian).' },
    { elemen:'jati_diri', kode:'JD-06', teks:'Anak mampu mengendalikan emosi dengan bantuan guru.' },
    { elemen:'jati_diri', kode:'JD-07', teks:'Anak menunjukkan motorik halus melalui kegiatan menggunting, menempel, meronce, dan menggambar.' },
    { elemen:'jati_diri', kode:'JD-08', teks:'Anak menunjukkan motorik kasar melalui berlari, melompat, memanjat, meniti, dan bermain gerak.' },
    { elemen:'jati_diri', kode:'JD-09', teks:'Anak menunjukkan kebiasaan hidup sehat dan menjaga kebersihan.' },
    { elemen:'jati_diri', kode:'JD-10', teks:'Anak mampu menjaga diri dari hal yang membahayakan.' },

    // Literasi-Matematika-Sains-Rekayasa-Teknologi-Seni
    { elemen:'literasi', kode:'LT-01', teks:'Anak mampu menyimak cerita atau penjelasan guru.' },
    { elemen:'literasi', kode:'LT-02', teks:'Anak mampu menceritakan kembali pengalaman sederhana.' },
    { elemen:'literasi', kode:'LT-03', teks:'Anak mengenal beberapa huruf dan bunyinya.' },
    { elemen:'literasi', kode:'LT-04', teks:'Anak mengenal angka 1–10 dan menghitung benda konkret.' },
    { elemen:'literasi', kode:'LT-05', teks:'Anak mengenal warna, bentuk, ukuran, dan pola.' },
    { elemen:'literasi', kode:'LT-06', teks:'Anak menunjukkan rasa ingin tahu melalui pertanyaan dan eksplorasi.' },
    { elemen:'literasi', kode:'LT-07', teks:'Anak mampu melakukan percobaan/sains sederhana.' },
    { elemen:'literasi', kode:'LT-08', teks:'Anak mampu membuat karya seni sederhana (gambar, musik, gerak).' },
    { elemen:'literasi', kode:'LT-09', teks:'Anak mampu menggunakan alat teknologi sederhana dengan pendampingan.' },
    { elemen:'literasi', kode:'LT-10', teks:'Anak menunjukkan kemampuan pra-membaca dan pra-menulis.' },
    { elemen:'literasi', kode:'LT-11', teks:'Anak mampu membuat rekayasa/konstruksi sederhana dari benda di sekitarnya.' },

    // Kokurikuler
    { elemen:'kokurikuler', kode:'KK-01', teks:'Anak terlibat aktif dalam kegiatan projek/kokurikuler.' },
    { elemen:'kokurikuler', kode:'KK-02', teks:'Anak menunjukkan kreativitas dalam membuat karya.' },
    { elemen:'kokurikuler', kode:'KK-03', teks:'Anak menunjukkan kemandirian dalam kegiatan.' },
    { elemen:'kokurikuler', kode:'KK-04', teks:'Anak mengenal budaya daerah dan nasional.' },
    { elemen:'kokurikuler', kode:'KK-05', teks:'Anak menunjukkan cinta lingkungan.' },
    { elemen:'kokurikuler', kode:'KK-06', teks:'Anak menunjukkan kebanggaan terhadap tanah air.' },
    { elemen:'kokurikuler', kode:'KK-07', teks:'Anak mampu berkolaborasi dengan teman dalam kegiatan kelompok.' }
  ];

  function needsSeed() {
    return Store.list('users').length === 0;
  }

  function seedAll() {
    // 1. Users
    Store.setList('users', [
      { id:'usr_admin',    username:'admin',    password:'admin123',    role:'admin',    nama:'Admin RA' },
      { id:'usr_kepala',   username:'kepala',   password:'kepala123',   role:'kepala',   nama:'Hj. Siti Rahmawati, S.Pd.I' },
      { id:'usr_guru',     username:'guru',     password:'guru123',     role:'guru',     nama:'Aisyah Rahmah, S.Pd.', kelas_id:'kls_matahari' },
      { id:'usr_operator', username:'operator', password:'operator123', role:'operator', nama:'Operator RA' }
    ]);

    // 2. Profil RA
    Store.setObj('profil_ra', {
      nama:'RA Miftahul Jannah',
      nsm:'101235090123',
      npsn:'69876543',
      alamat:'Jl. Pendidikan No. 12',
      desa:'Sumberwringin',
      kec:'Sukowono',
      kab:'Jember',
      prov:'Jawa Timur',
      kepala_nama:'Hj. Siti Rahmawati, S.Pd.I',
      kepala_nip:'-',
      logo_ra_dataurl:'',
      logo_kemenag_dataurl:'',
      ta_aktif:'ta_2025_2026',
      sem_aktif:'sem_2',
      kota_cetak:'Jember'
    });

    // 3. Tahun Ajaran & Semester
    Store.setList('tahun_ajaran', [
      { id:'ta_2025_2026', label:'2025/2026', aktif:true },
      { id:'ta_2024_2025', label:'2024/2025', aktif:false }
    ]);
    Store.setList('semester', [
      { id:'sem_1', ta_id:'ta_2025_2026', label:'Ganjil', aktif:false },
      { id:'sem_2', ta_id:'ta_2025_2026', label:'Genap',  aktif:true  },
      { id:'sem_1_old', ta_id:'ta_2024_2025', label:'Ganjil', aktif:false },
      { id:'sem_2_old', ta_id:'ta_2024_2025', label:'Genap',  aktif:false }
    ]);

    // 4. Guru
    Store.setList('guru', [
      { id:'gru_aisyah', nama:'Aisyah Rahmah, S.Pd.', nip:'-', nuptk:'1234567890', jabatan:'Guru Kelas', hp:'081234567890', email:'aisyah@ra.sch.id', kelas_id:'kls_matahari', ttd_dataurl:'' }
    ]);

    // 5. Kelas
    Store.setList('kelas', [
      { id:'kls_matahari', nama:'Matahari', kelompok_usia:'4-5', fase:'Fondasi', guru_id:'gru_aisyah', ta_id:'ta_2025_2026', sem_id:'sem_2' },
      { id:'kls_bulan',    nama:'Bulan',    kelompok_usia:'5-6', fase:'Fondasi', guru_id:'gru_aisyah', ta_id:'ta_2025_2026', sem_id:'sem_2' }
    ]);

    // 6. Murid demo: Syifa Aulia
    Store.setList('murid', [{
      id:'mrd_syifa',
      kelas_id:'kls_matahari',
      no_induk:'001/2025',
      nisn:'0123456789',
      nik:'3509012345678901',
      nama_lengkap:'Syifa Aulia',
      nama_panggilan:'Syifa',
      jenis_kelamin:'P',
      tempat_lahir:'Jember',
      tanggal_lahir:'2021-01-15',
      agama:'Islam',
      kewarganegaraan:'Indonesia',
      anak_ke:1,
      jumlah_saudara:0,
      bahasa_sehari:'Indonesia/Madura',
      alamat:'Dusun Krajan',
      rt_rw:'02/03',
      desa:'Sumberwringin',
      kec:'Sukowono',
      kab:'Jember',
      prov:'Jawa Timur',
      kode_pos:'68194',
      jarak_rumah:'1 km',
      transportasi:'Diantar orang tua',
      tinggal_bersama:'Orang tua kandung',
      tinggi:97.9, berat:15.5, lingkar_kepala:48,
      gol_darah:'B', riwayat_penyakit:'-', alergi:'-',
      imunisasi:'Lengkap', catatan_kesehatan:'Sehat',
      ayah_nama:'Ahmad Fauzi', ayah_nik:'3509121234567890', ayah_ttl:'Jember, 12 Mei 1992',
      ayah_pendidikan:'S1', ayah_pekerjaan:'Wiraswasta', ayah_penghasilan:'Rp 3.000.000',
      ayah_hp:'081234567891',
      ibu_nama:'Fatimah Az-Zahra', ibu_nik:'3509121234567891', ibu_ttl:'Jember, 5 Maret 1994',
      ibu_pendidikan:'S1', ibu_pekerjaan:'Ibu Rumah Tangga', ibu_penghasilan:'-',
      ibu_hp:'081234567892',
      wali_nama:'', wali_hubungan:'', wali_hp:'', wali_alamat:'',
      tanggal_masuk:'2025-07-15',
      asal_paud:'-',
      kelompok_masuk:'A (4-5 tahun)',
      ta_masuk:'2025/2026',
      status:'Aktif',
      no_ijazah:'',
      no_akta:'AK-3509-2021-00123',
      foto_dataurl:'',
      tanggal_keluar:'', alasan_keluar:'', melanjutkan_ke:'', no_surat_pindah:'', keterangan_keluar:''
    }]);

    // 7. Indikator
    const indikatorList = INDIKATOR_AWAL.map((it, i) => Object.assign({ id:'ind_'+(i+1) }, it));
    Store.setList('indikator', indikatorList);

    // 8. Asesmen demo untuk Syifa di sem_2 ta_2025_2026
    const asesDemo = [];
    const capaianSyifa = {
      'NA-01':'BSB','NA-02':'BSH','NA-03':'BSB','NA-04':'BSB','NA-05':'BSH','NA-06':'BSH','NA-07':'BSB','NA-08':'BSH','NA-09':'BSH',
      'JD-01':'BSH','JD-02':'BSH','JD-03':'BSH','JD-04':'MB','JD-05':'BSH','JD-06':'MB','JD-07':'BSB','JD-08':'BSB','JD-09':'BSH','JD-10':'BSH',
      'LT-01':'BSH','LT-02':'BSH','LT-03':'MB','LT-04':'BSH','LT-05':'BSB','LT-06':'BSB','LT-07':'BSH','LT-08':'BSB','LT-09':'MB','LT-10':'MB','LT-11':'BSH',
      'KK-01':'BSH','KK-02':'BSB','KK-03':'BSH','KK-04':'BSH','KK-05':'BSB','KK-06':'BSH','KK-07':'BSH'
    };
    indikatorList.forEach(ind => {
      const c = capaianSyifa[ind.kode] || 'BSH';
      asesDemo.push({
        id:'ase_'+ind.id,
        murid_id:'mrd_syifa',
        ta_id:'ta_2025_2026',
        sem_id:'sem_2',
        indikator_id: ind.id,
        capaian: c,
        intensitas: c === 'BSB' ? 'Konsisten' : c === 'BSH' ? 'Sering' : c === 'MB' ? 'Kadang' : 'Jarang',
        catatan:'',
        bukti_url:'',
        rekomendasi:'',
        tgl: U.todayISO()
      });
    });
    Store.setList('asesmen', asesDemo);

    // 9. Rapor demo (kosong, akan auto-generate saat dibuka)
    Store.setList('rapor', []);
    Store.setList('log_aktivitas', []);
  }

  return { needsSeed, seedAll, ELEMEN, INDIKATOR_AWAL };
})();
