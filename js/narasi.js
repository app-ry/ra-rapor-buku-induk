// narasi.js — generator deskripsi rapor & refleksi otomatis
// Mengikuti pola Yanto: BSB/BSH/MB/BB per indikator, pakai catatan observasi & rekomendasi dari detail asesmen
window.Narasi = (function() {
  const ELEMEN_LABEL = {
    nilai_agama:'Nilai Agama dan Budi Pekerti',
    jati_diri:'Jati Diri',
    literasi:'Dasar-dasar Literasi, Matematika, Sains, Rekayasa, Teknologi, dan Seni',
    kokurikuler:'Kokurikuler'
  };

  // Saran tindak lanjut default per elemen (digunakan kalau guru tidak isi rekomendasi manual)
  const SARAN = {
    nilai_agama: [
      'membiasakan doa harian sebelum makan, tidur, dan kegiatan sehari-hari',
      'mengenalkan bacaan thayyibah seperti tasbih, tahmid, dan takbir',
      'mengajak Ananda menirukan gerakan ibadah sederhana bersama keluarga',
      'memberi teladan akhlak yang baik dalam kehidupan sehari-hari',
      'mengajak Ananda merawat tanaman atau hewan peliharaan sebagai bentuk cinta lingkungan'
    ],
    jati_diri: [
      'memberi kesempatan bercerita tentang kegiatan hariannya',
      'membiasakan Ananda mengurus dirinya sendiri secara bertahap',
      'mengajak bermain peran untuk melatih kemandirian dan empati',
      'menyediakan kegiatan motorik halus seperti meronce, menggunting, dan menggambar',
      'mengajak bermain gerak di luar rumah seperti berlari, melompat, dan bersepeda',
      'membiasakan pola hidup sehat: makan teratur, cukup tidur, dan rajin mencuci tangan'
    ],
    literasi: [
      'membacakan buku cerita bergambar setiap hari',
      'mengajak Ananda mengenali huruf dan angka melalui permainan',
      'menyediakan buku, kertas, dan alat tulis untuk pra-menulis',
      'mengajak menghitung benda-benda di sekitar rumah',
      'memberi kesempatan bereksplorasi dengan bahan-bahan alami',
      'mengajak bernyanyi, menggambar, dan membuat karya seni sederhana',
      'mendampingi penggunaan gawai secara terbatas dan edukatif'
    ],
    kokurikuler: [
      'mengajak Ananda membantu pekerjaan rumah yang sesuai usianya',
      'mengenalkan budaya daerah melalui cerita, lagu, dan permainan tradisional',
      'mengajak Ananda mengenal lingkungan sekitar dan menjaganya',
      'menanamkan rasa cinta tanah air melalui lagu kebangsaan dan cerita kepahlawanan',
      'mengajak Ananda berinteraksi dengan teman sebaya'
    ]
  };

  // Pembuka per elemen (variasi)
  const PEMBUKA = {
    nilai_agama: [
      'Pada semester ini, Ananda %NAMA% menunjukkan perkembangan yang membahagiakan dalam aspek nilai agama dan budi pekerti.',
      'Ananda %NAMA% terus tumbuh dalam pembiasaan religius dan akhlak mulia selama mengikuti kegiatan di RA.',
      'Dalam aspek nilai agama dan budi pekerti, Ananda %NAMA% memperlihatkan perkembangan yang baik.'
    ],
    jati_diri: [
      'Dalam aspek jati diri, Ananda %NAMA% menunjukkan kemajuan yang baik selama semester ini.',
      'Ananda %NAMA% memperlihatkan pertumbuhan kepercayaan diri, kemandirian, dan keterampilan motorik yang terus berkembang.',
      'Pada aspek jati diri, Ananda %NAMA% tampak semakin berkembang dari hari ke hari.'
    ],
    literasi: [
      'Pada aspek dasar-dasar literasi, matematika, sains, rekayasa, teknologi, dan seni, Ananda %NAMA% menunjukkan perkembangan yang menggembirakan.',
      'Ananda %NAMA% memperlihatkan rasa ingin tahu dan minat belajar yang baik dalam berbagai kegiatan eksplorasi.',
      'Dalam aspek pengembangan dasar-dasar literasi, numerasi, sains, dan seni, Ananda %NAMA% terus tumbuh dengan baik.'
    ],
    kokurikuler: [
      'Pada kegiatan kokurikuler dan projek penguatan profil pelajar, Ananda %NAMA% menunjukkan keterlibatan yang baik.',
      'Ananda %NAMA% berpartisipasi aktif dalam berbagai kegiatan kokurikuler yang dilaksanakan di RA selama semester ini.',
      'Dalam aspek kokurikuler, Ananda %NAMA% menunjukkan perkembangan yang menyenangkan untuk diamati.'
    ]
  };

  // Daftar kata negatif yang harus dihindari (final scrub)
  const KATA_NEGATIF = [
    /\bgagal\b/gi, /\bburuk\b/gi, /\btidak mampu\b/gi, /\blemah\b/gi,
    /\bbermasalah\b/gi, /\bnakal\b/gi, /\blambat\b/gi, /\bkurang\b/gi,
    /\bbodoh\b/gi, /\bmalas\b/gi
  ];
  const KATA_NEGATIF_PENGGANTI = {
    'gagal':'belum berhasil',
    'buruk':'belum optimal',
    'tidak mampu':'masih perlu dukungan',
    'lemah':'masih perlu dikuatkan',
    'bermasalah':'memerlukan pendampingan',
    'nakal':'aktif',
    'lambat':'sedang berkembang',
    'kurang':'masih perlu',
    'bodoh':'sedang belajar',
    'malas':'masih perlu dimotivasi'
  };
  function scrubNegatif(s) {
    if (!s) return s;
    let out = String(s);
    KATA_NEGATIF.forEach(rx => {
      out = out.replace(rx, m => KATA_NEGATIF_PENGGANTI[m.toLowerCase()] || 'masih perlu dikembangkan');
    });
    return out;
  }

  // Bersihkan teks indikator menjadi frasa pendek (untuk disisipkan di kalimat)
  function frasaIndikator(teks) {
    return String(teks||'')
      .replace(/^Anak\s+/i,'')
      .replace(/\.$/,'')
      .replace(/^[A-Z]/, c => c.toLowerCase());
  }

  // Bersihkan catatan observasi agar muat di pola "ketika [catatan]"
  function frasaCatatan(catatan) {
    if (!catatan) return '';
    let s = String(catatan).trim();
    s = s.replace(/\.$/,'');
    // Lowercase huruf pertama untuk natural flow setelah "ketika"
    s = s.charAt(0).toLowerCase() + s.slice(1);
    return s;
  }

  function pickRand(arr, seed) {
    if (!arr || !arr.length) return '';
    if (seed != null) return arr[Math.abs(seed) % arr.length];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ============================================================
  // POLA NARASI per CAPAIAN (sesuai brief Yanto)
  // ============================================================
  function kalimatPerCapaian(nama, capaian, indikatorTeks, catatan, rekomendasi, elemen, seed) {
    const ind = frasaIndikator(indikatorTeks);
    const cat = frasaCatatan(catatan);
    const saran = rekomendasi && rekomendasi.trim() ? rekomendasi.trim().replace(/\.$/,'') : pickRand(SARAN[elemen]||[], seed);

    if (capaian === 'BSB') {
      const ketika = cat
        ? `Hal ini tampak ketika ${cat}.`
        : 'Hal ini tampak dalam keseharian Ananda di RA.';
      return `Ananda ${nama} menunjukkan perkembangan yang sangat baik dalam ${ind}. ${ketika} Ananda sudah mampu melakukan kegiatan tersebut secara mandiri dan konsisten. Di rumah, Ayah dan Ibu dapat terus memberi kesempatan kepada Ananda untuk mempraktikkan kemampuan ini dalam kegiatan sehari-hari.`;
    }
    if (capaian === 'BSH') {
      const terlihat = cat
        ? `Hal ini terlihat saat ${cat}.`
        : 'Hal ini terlihat dalam berbagai kegiatan kelas.';
      return `Ananda ${nama} menunjukkan perkembangan yang baik dalam ${ind}. ${terlihat} Ananda mulai mampu melakukan kegiatan dengan percaya diri dan sesuai harapan. Stimulasi di rumah dapat dilakukan melalui kegiatan sederhana seperti ${saran}.`;
    }
    if (capaian === 'MB') {
      const mencoba = cat
        ? `Dalam beberapa kegiatan, Ananda sudah mencoba untuk ${cat}, meskipun masih memerlukan pendampingan guru.`
        : `Dalam beberapa kegiatan, Ananda sudah mulai mencoba ${ind}, meskipun masih memerlukan pendampingan guru.`;
      return `Ananda ${nama} mulai menunjukkan perkembangan dalam ${ind}. ${mencoba} Ayah dan Ibu dapat membantu menstimulasi kemampuan ini melalui kegiatan bermain yang menyenangkan di rumah, misalnya ${saran}.`;
    }
    if (capaian === 'BB') {
      return `Ananda ${nama} sedang berada pada tahap awal dalam mengembangkan kemampuan ${ind}. Ananda masih memerlukan dukungan dan pembiasaan secara bertahap. Guru dan orang tua dapat bekerja sama memberikan stimulasi melalui kegiatan yang sederhana, menyenangkan, dan dilakukan secara berulang, seperti ${saran}.`;
    }
    return '';
  }

  // ============================================================
  // PARAGRAF per ELEMEN
  // ============================================================
  function paragrafElemen(nama, elemen, items, namaSeed) {
    if (!items || !items.length) {
      return `Ananda ${nama} terus mengikuti kegiatan pembelajaran di kelas dengan antusias. Ayah dan Ibu dapat mendukung perkembangan Ananda melalui pembiasaan-pembiasaan sederhana di rumah.`;
    }

    // Group per capaian
    const byCap = { BSB:[], BSH:[], MB:[], BB:[] };
    items.forEach(it => { (byCap[it.capaian] || (byCap[it.capaian] = [])).push(it); });

    const paragraf = [];

    // P1: Pembuka
    const pembuka = pickRand(PEMBUKA[elemen]||[], namaSeed).replace(/%NAMA%/g, nama);

    // P1 lanjutan: ringkasan kekuatan (BSB+BSH)
    const kuat = [...byCap.BSB, ...byCap.BSH];
    if (kuat.length) {
      const sample = kuat.slice(0, 5).map(it => frasaIndikator(it.indikatorTeks));
      const list = sample.length === 1 ? sample[0]
                  : sample.length === 2 ? sample.join(' dan ')
                  : sample.slice(0,-1).join(', ') + ', serta ' + sample.slice(-1)[0];
      paragraf.push(`${pembuka} Ananda ${nama} telah ${list}.`);
    } else {
      paragraf.push(pembuka);
    }

    // P2: Detail kekuatan utama (1-2 BSB/BSH terdetail dengan catatan observasi)
    const detail = kuat
      .filter(it => it.catatan || it.rekomendasi || it.capaian === 'BSB')
      .slice(0, 2);
    if (detail.length) {
      const kalimat = detail
        .map((it, idx) => kalimatPerCapaian(nama, it.capaian, it.indikatorTeks, it.catatan, it.rekomendasi, elemen, namaSeed + idx))
        .filter(Boolean)
        .join(' ');
      if (kalimat) paragraf.push(kalimat);
    }

    // P3: Yang masih berkembang (MB)
    if (byCap.MB.length) {
      const it = byCap.MB[0];
      paragraf.push(kalimatPerCapaian(nama, 'MB', it.indikatorTeks, it.catatan, it.rekomendasi, elemen, namaSeed + 10));
    }

    // P4: Tahap awal (BB) atau saran tindak lanjut umum
    if (byCap.BB.length) {
      const it = byCap.BB[0];
      paragraf.push(kalimatPerCapaian(nama, 'BB', it.indikatorTeks, it.catatan, it.rekomendasi, elemen, namaSeed + 20));
    } else if (paragraf.length < 3) {
      // Tambah saran tindak lanjut umum kalau paragraf masih kurang dari 3
      const s1 = pickRand(SARAN[elemen]||[], namaSeed);
      const s2 = pickRand(SARAN[elemen]||[], namaSeed + 7);
      paragraf.push(`Sebagai bentuk dukungan di rumah, Ayah dan Ibu dapat ${s1}${s1!==s2?', serta '+s2:''}. Pembiasaan yang dilakukan secara konsisten dan menyenangkan akan sangat membantu pertumbuhan Ananda.`);
    }

    // Maksimal 4 paragraf
    return paragraf.slice(0, 4).map(scrubNegatif).join('\n\n');
  }

  // ============================================================
  // MAIN: Generate semua deskripsi rapor
  // ============================================================
  function generateRapor(murid, asesArr, indikatorList) {
    const indMap = {}; indikatorList.forEach(i => indMap[i.id] = i);

    // Build items per elemen
    const byElemen = { nilai_agama:[], jati_diri:[], literasi:[], kokurikuler:[] };
    asesArr.forEach(a => {
      const ind = indMap[a.indikator_id];
      if (!ind || !byElemen[ind.elemen]) return;
      byElemen[ind.elemen].push({
        capaian: a.capaian,
        catatan: a.catatan || '',
        rekomendasi: a.rekomendasi || '',
        indikatorTeks: ind.teks,
        indikatorKode: ind.kode || ''
      });
    });

    const nama = murid.nama_panggilan || murid.nama_lengkap || 'Ananda';
    const seed = (murid.id || nama).split('').reduce((a,c) => a + c.charCodeAt(0), 0);

    const out = {};
    Object.keys(ELEMEN_LABEL).forEach(el => {
      out[el] = paragrafElemen(nama, el, byElemen[el], seed);
    });
    return out;
  }

  // ============================================================
  // Refleksi orang tua otomatis
  // ============================================================
  function generateRefleksi(murid, asesArr, indikatorList) {
    const indMap = {}; indikatorList.forEach(i => indMap[i.id] = i);
    const nama = murid.nama_panggilan || murid.nama_lengkap || 'Ananda';

    const kuat = asesArr
      .filter(a => a.capaian === 'BSB' || a.capaian === 'BSH')
      .slice(0, 3)
      .map(a => indMap[a.indikator_id])
      .filter(Boolean)
      .map(i => frasaIndikator(i.teks));

    const lemah = asesArr
      .filter(a => a.capaian === 'BB' || a.capaian === 'MB')
      .slice(0, 3)
      .map(a => indMap[a.indikator_id])
      .filter(Boolean)
      .map(i => frasaIndikator(i.teks));

    const joinList = (arr) => {
      if (arr.length === 0) return '';
      if (arr.length === 1) return arr[0];
      if (arr.length === 2) return arr.join(' dan ');
      return arr.slice(0,-1).join(', ') + ', serta ' + arr.slice(-1)[0];
    };

    const q1 = kuat.length
      ? `Ananda ${nama} sudah ${joinList(kuat)}. Ananda juga semakin percaya diri, mandiri, dan senang berinteraksi dengan teman-temannya di RA.`
      : `Ananda ${nama} menunjukkan perkembangan positif dalam kegiatan sehari-hari di RA.`;

    const q2 = lemah.length
      ? `Ananda ${nama} masih perlu distimulasi untuk ${joinList(lemah)}.`
      : `Ananda ${nama} masih perlu dibiasakan untuk menyelesaikan tugas hingga tuntas dan mengelola emosi dengan lebih baik.`;

    const q3 = `Saya akan membacakan buku cerita, mengajak bermain gerak, membiasakan doa harian, dan memberi kesempatan kepada Ananda ${nama} untuk berlatih kemandirian dalam kegiatan sehari-hari di rumah.`;

    return {
      q1: scrubNegatif(q1),
      q2: scrubNegatif(q2),
      q3: scrubNegatif(q3)
    };
  }

  // ============================================================
  // Default info perkembangan
  // ============================================================
  function defaultInfoPerkembangan(murid) {
    const nama = murid.nama_panggilan || murid.nama_lengkap || 'Ananda';
    return scrubNegatif(`Ananda ${nama} dalam kondisi sehat dan menunjukkan daya tahan tubuh yang baik selama mengikuti kegiatan di RA. Imunisasi yang sudah diberikan tercatat lengkap. Pola makan Ananda teratur dan kebiasaan positif seperti mencuci tangan sebelum makan, berdoa sebelum kegiatan, serta mengucapkan salam sudah mulai terbentuk. Bagi Ayah dan Ibu, mohon terus mendukung pembiasaan tersebut di rumah.`);
  }

  return {
    generateRapor,
    generateRefleksi,
    defaultInfoPerkembangan,
    scrubNegatif,
    ELEMEN_LABEL
  };
})();
