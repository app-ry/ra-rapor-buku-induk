// narasi.js — generator deskripsi rapor & refleksi otomatis
window.Narasi = (function() {
  const ELEMEN_LABEL = {
    nilai_agama:'Nilai Agama dan Budi Pekerti',
    jati_diri:'Jati Diri',
    literasi:'Dasar-dasar Literasi, Matematika, Sains, Rekayasa, Teknologi, dan Seni',
    kokurikuler:'Kokurikuler'
  };

  // Saran tindak lanjut per elemen
  const SARAN = {
    nilai_agama: [
      'membiasakan doa harian sebelum makan, tidur, dan kegiatan sehari-hari',
      'mengenalkan bacaan-bacaan thayyibah seperti tasbih, tahmid, dan takbir',
      'mengajak Ananda menirukan gerakan ibadah sederhana bersama keluarga',
      'memberi teladan akhlak yang baik dalam kehidupan sehari-hari',
      'mengajak Ananda merawat tanaman atau hewan peliharaan sebagai bentuk cinta lingkungan'
    ],
    jati_diri: [
      'memberi kesempatan bercerita tentang kegiatan hariannya',
      'membiasakan Ananda mengurus dirinya sendiri secara bertahap',
      'mengajak bermain peran untuk melatih kemandirian dan empati',
      'menyediakan kegiatan motorik halus seperti meronce, menggunting, dan menggambar di rumah',
      'mengajak bermain gerak di luar rumah seperti berlari, melompat, dan bersepeda',
      'membiasakan pola hidup sehat: makan teratur, cukup tidur, dan rajin mencuci tangan'
    ],
    literasi: [
      'membacakan buku cerita bergambar setiap hari',
      'mengajak Ananda mengenali huruf dan angka melalui permainan',
      'menyediakan buku, kertas, dan alat tulis untuk pra-menulis',
      'mengajak menghitung benda di sekitar rumah',
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

  // Variasi pembuka
  const PEMBUKA_TEMPLATES = {
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

  // Frase penghubung capaian
  function frasaCapaian(c) {
    return ({
      BSB:'sangat baik dan konsisten',
      BSH:'baik dan sesuai harapan',
      MB:'mulai berkembang',
      BB:'berada pada tahap awal'
    })[c] || c;
  }

  function pickRand(arr, seed) {
    if (!arr || !arr.length) return '';
    if (seed != null) return arr[Math.abs(seed) % arr.length];
    return arr[Math.floor(Math.random()*arr.length)];
  }

  // Hitung distribusi capaian per elemen
  function ringkas(asesArr, indikatorMap) {
    const byElemen = {};
    asesArr.forEach(a => {
      const ind = indikatorMap[a.indikator_id];
      if (!ind) return;
      if (!byElemen[ind.elemen]) byElemen[ind.elemen] = { items: [], dist:{ BB:0, MB:0, BSH:0, BSB:0 } };
      byElemen[ind.elemen].items.push({ ...a, _ind: ind });
      byElemen[ind.elemen].dist[a.capaian] = (byElemen[ind.elemen].dist[a.capaian] || 0) + 1;
    });
    return byElemen;
  }

  // Generate paragraf untuk satu elemen
  function paragrafElemen(nama, elemen, data, namaSeed) {
    const { items, dist } = data;
    const total = items.length || 1;
    const kuat = items.filter(x => x.capaian === 'BSB' || x.capaian === 'BSH');
    const lemah = items.filter(x => x.capaian === 'MB' || x.capaian === 'BB');

    // Pembuka
    const pembuka = pickRand(PEMBUKA_TEMPLATES[elemen], namaSeed).replace(/%NAMA%/g, nama);

    // Isi capaian
    let isi = '';
    if (kuat.length > 0) {
      const sample = kuat.slice(0, 4).map(x => x._ind.teks.replace(/^Anak /,'').replace(/\.$/,''));
      const list = sample.length === 1 ? sample[0]
                  : sample.length === 2 ? sample.join(' dan ')
                  : sample.slice(0, -1).join(', ') + ', serta ' + sample.slice(-1)[0];
      isi += `Ananda ${nama} sudah ${list}. `;
      const dom = (dist.BSB > dist.BSH) ? 'BSB' : 'BSH';
      isi += `Capaian ini menunjukkan perkembangan yang ${frasaCapaian(dom)}. `;
    }
    if (lemah.length > 0) {
      const sample = lemah.slice(0, 3).map(x => x._ind.teks.toLowerCase().replace(/^anak /,'').replace(/\.$/,''));
      const list = sample.length === 1 ? sample[0]
                  : sample.length === 2 ? sample.join(' dan ')
                  : sample.slice(0, -1).join(', ') + ', serta ' + sample.slice(-1)[0];
      isi += `Untuk aspek ${list}, Ananda ${nama} masih memerlukan dukungan dan pembiasaan secara bertahap. `;
    }
    if (!isi) {
      isi = `Ananda ${nama} terus mengikuti kegiatan pembelajaran di kelas dengan baik. `;
    }

    // Tindak lanjut
    const saranArr = SARAN[elemen] || [];
    const s1 = pickRand(saranArr, namaSeed);
    const s2 = pickRand(saranArr, (namaSeed||0) + 7);
    const tindakLanjut = `Di rumah, Ayah dan Ibu dapat membantu menstimulasi perkembangan Ananda dengan ${s1}${s1 !== s2 ? ', serta ' + s2 : ''}. Pembiasaan yang dilakukan secara konsisten dan menyenangkan akan sangat membantu pertumbuhan Ananda.`;

    return [pembuka, isi.trim(), tindakLanjut].filter(Boolean).join(' \n\n');
  }

  // Main: generate semua deskripsi rapor
  function generateRapor(murid, asesArr, indikatorList) {
    const indikatorMap = {};
    indikatorList.forEach(i => indikatorMap[i.id] = i);
    const ring = ringkas(asesArr, indikatorMap);
    const nama = murid.nama_panggilan || murid.nama_lengkap || 'Ananda';
    const seed = (murid.id || '').split('').reduce((a,c) => a + c.charCodeAt(0), 0);
    const out = {};
    Object.keys(ELEMEN_LABEL).forEach(el => {
      out[el] = paragrafElemen(nama, el, ring[el] || { items:[], dist:{BB:0,MB:0,BSH:0,BSB:0} }, seed);
    });
    return out;
  }

  // Refleksi orang tua
  function generateRefleksi(murid, asesArr, indikatorList) {
    const indikatorMap = {};
    indikatorList.forEach(i => indikatorMap[i.id] = i);
    const nama = murid.nama_panggilan || murid.nama_lengkap || 'Ananda';
    const kuat = asesArr.filter(a => a.capaian === 'BSB' || a.capaian === 'BSH').slice(0, 3)
      .map(a => indikatorMap[a.indikator_id])
      .filter(Boolean)
      .map(i => i.teks.replace(/^Anak /,'').replace(/\.$/,''));
    const lemah = asesArr.filter(a => a.capaian === 'BB' || a.capaian === 'MB').slice(0, 3)
      .map(a => indikatorMap[a.indikator_id])
      .filter(Boolean)
      .map(i => i.teks.toLowerCase().replace(/^anak /,'').replace(/\.$/,''));

    const q1 = kuat.length
      ? `Ananda ${nama} sudah ${kuat.length===1?kuat[0]:kuat.slice(0,-1).join(', ')+(kuat.length>1?', dan '+kuat[kuat.length-1]:kuat[0])}. Ananda juga semakin percaya diri, mandiri, dan senang berinteraksi dengan teman-temannya.`
      : `Ananda ${nama} menunjukkan perkembangan positif dalam kegiatan sehari-hari di RA.`;

    const q2 = lemah.length
      ? `Ananda ${nama} masih perlu distimulasi untuk ${lemah.length===1?lemah[0]:lemah.slice(0,-1).join(', ')+(lemah.length>1?', dan '+lemah[lemah.length-1]:lemah[0])}.`
      : `Ananda ${nama} masih perlu dibiasakan untuk menyelesaikan tugas hingga tuntas dan mengelola emosi dengan lebih baik.`;

    const q3 = `Saya akan membacakan buku cerita, mengajak bermain gerak, membiasakan doa harian, dan memberi kesempatan kepada Ananda ${nama} untuk berlatih kemandirian dalam kegiatan sehari-hari di rumah.`;

    return { q1, q2, q3 };
  }

  // Default info perkembangan
  function defaultInfoPerkembangan(murid) {
    const nama = murid.nama_panggilan || murid.nama_lengkap || 'Ananda';
    return `Ananda ${nama} dalam kondisi sehat dan menunjukkan daya tahan tubuh yang baik selama mengikuti kegiatan di RA. Imunisasi yang sudah diberikan tercatat lengkap. Pola makan Ananda teratur dan kebiasaan positif seperti mencuci tangan sebelum makan, berdoa sebelum kegiatan, serta mengucapkan salam sudah mulai terbentuk. Bagi Ayah dan Ibu, mohon terus mendukung pembiasaan tersebut di rumah.`;
  }

  return { generateRapor, generateRefleksi, defaultInfoPerkembangan, ELEMEN_LABEL };
})();
