// cetak_induk.js — Cetak Buku Induk per murid atau batch
window.Pages.cetak_induk = (function() {

  function render(ctx) {
    const params = ctx?.params || [];
    const root = document.getElementById('pageRoot');
    let muridIds = [];

    if (params[0] === 'batch') {
      try {
        muridIds = JSON.parse(sessionStorage.getItem('ra_print_induk_ids') || '[]');
      } catch (e) {}
    } else if (params[0]) {
      muridIds = [params[0]];
    }

    if (!muridIds.length) {
      root.innerHTML = `<div class="empty"><i class="bi bi-exclamation-circle"></i><div>Tidak ada murid untuk dicetak</div><a href="#/buku-induk" class="btn btn-sm btn-outline-success mt-2">Kembali</a></div>`;
      return;
    }

    const html = muridIds.map(id => indukHTML(id)).filter(Boolean).join('');
    root.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3 no-print">
        <a href="#/buku-induk" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left"></i> Kembali</a>
        <div class="text-muted small">${muridIds.length} buku induk siap cetak</div>
        <button class="btn btn-success btn-sm" onclick="window.print()"><i class="bi bi-printer"></i> Cetak / Save as PDF</button>
      </div>
      ${html}
    `;
  }

  function indukHTML(muridId) {
    const m = Store.findById('murid', muridId);
    if (!m) return '';
    const profil = Store.getObj('profil_ra', {});
    const kelas = Store.findById('kelas', m.kelas_id) || {};
    const ttl = `${m.tempat_lahir || ''}${m.tempat_lahir && m.tanggal_lahir ? ', ' : ''}${m.tanggal_lahir ? U.fmtDate(m.tanggal_lahir) : ''}`;
    const alamatLengkap = [m.alamat, m.rt_rw ? 'RT/RW ' + m.rt_rw : '', m.desa, m.kec, m.kab, m.prov, m.kode_pos]
      .filter(Boolean).join(', ');

    return `
    <article class="rapor-page induk-page">
      <div class="rapor-header">
        ${profil.logo_kemenag_dataurl ? `<img src="${profil.logo_kemenag_dataurl}" alt="">` : ''}
        <div class="text">
          <div style="font-size:10pt">KEMENTERIAN AGAMA REPUBLIK INDONESIA</div>
          <h2>${U.esc(profil.nama || 'RAUDHATUL ATHFAL')}</h2>
          <div class="alamat">${U.esc(profil.alamat||'')}, ${U.esc(profil.desa||'')}, ${U.esc(profil.kec||'')}, ${U.esc(profil.kab||'')}, ${U.esc(profil.prov||'')}</div>
          <div class="alamat" style="font-size:9pt">NSM: ${U.esc(profil.nsm||'-')} · NPSN: ${U.esc(profil.npsn||'-')}</div>
        </div>
        ${profil.logo_ra_dataurl ? `<img src="${profil.logo_ra_dataurl}" alt="">` : ''}
      </div>

      <div class="rapor-title">Buku Induk Peserta Didik</div>

      <div class="induk-foto-row">
        <div class="induk-foto-box">
          ${m.foto_dataurl
            ? `<img src="${m.foto_dataurl}" alt="Foto">`
            : `<div class="induk-foto-placeholder">FOTO<br>3 × 4</div>`}
        </div>
        <table class="induk-summary">
          <tr><td class="lbl">Nomor Induk</td><td class="sep">:</td><td><b>${U.esc(m.no_induk||'-')}</b></td></tr>
          <tr><td class="lbl">NISN</td><td class="sep">:</td><td>${U.esc(m.nisn||'-')}</td></tr>
          <tr><td class="lbl">NIK</td><td class="sep">:</td><td>${U.esc(m.nik||'-')}</td></tr>
          <tr><td class="lbl">Nama Lengkap</td><td class="sep">:</td><td><b>${U.esc(m.nama_lengkap||'-')}</b></td></tr>
          <tr><td class="lbl">Nama Panggilan</td><td class="sep">:</td><td>${U.esc(m.nama_panggilan||'-')}</td></tr>
          <tr><td class="lbl">Kelas / Kelompok</td><td class="sep">:</td><td>${U.esc(kelas.nama||'-')} (${U.esc(kelas.kelompok_usia||'-')} thn)</td></tr>
        </table>
      </div>

      <div class="induk-section">
        <div class="induk-section-head">A. Identitas Anak</div>
        <table class="induk-table">
          ${rowGrid([
            ['Tempat, Tanggal Lahir', ttl || '-'],
            ['Jenis Kelamin', m.jenis_kelamin === 'P' ? 'Perempuan' : (m.jenis_kelamin === 'L' ? 'Laki-laki' : '-')],
            ['Agama', m.agama || '-'],
            ['Kewarganegaraan', m.kewarganegaraan || '-'],
            ['Anak Ke', m.anak_ke || '-'],
            ['Jumlah Saudara', m.jumlah_saudara || '-'],
            ['Bahasa Sehari-hari', m.bahasa_sehari || '-'],
            ['Tinggal Bersama', m.tinggal_bersama || '-']
          ])}
        </table>
      </div>

      <div class="induk-section">
        <div class="induk-section-head">B. Alamat</div>
        <table class="induk-table">
          <tr><td class="lbl" style="width:25%">Alamat Lengkap</td><td class="sep">:</td><td colspan="3">${U.esc(alamatLengkap || '-')}</td></tr>
          ${rowGrid([
            ['Jarak Rumah ke RA', m.jarak_rumah || '-'],
            ['Transportasi ke RA', m.transportasi || '-']
          ])}
        </table>
      </div>

      <div class="induk-section">
        <div class="induk-section-head">C. Data Fisik dan Kesehatan</div>
        <table class="induk-table">
          ${rowGrid([
            ['Tinggi Badan', (m.tinggi||'-') + ' cm'],
            ['Berat Badan', (m.berat||'-') + ' kg'],
            ['Lingkar Kepala', (m.lingkar_kepala||'-') + ' cm'],
            ['Golongan Darah', m.gol_darah || '-'],
            ['Imunisasi', m.imunisasi || '-'],
            ['Riwayat Penyakit', m.riwayat_penyakit || '-'],
            ['Alergi', m.alergi || '-']
          ])}
          ${m.catatan_kesehatan ? `<tr><td class="lbl">Catatan Kesehatan</td><td class="sep">:</td><td colspan="3">${U.esc(m.catatan_kesehatan)}</td></tr>` : ''}
        </table>
      </div>

      <div class="induk-section">
        <div class="induk-section-head">D. Data Orang Tua</div>
        <table class="induk-table">
          <thead><tr><th></th><th>Ayah</th><th>Ibu</th></tr></thead>
          <tbody>
            <tr><td class="lbl">Nama</td><td>${U.esc(m.ayah_nama||'-')}</td><td>${U.esc(m.ibu_nama||'-')}</td></tr>
            <tr><td class="lbl">NIK</td><td>${U.esc(m.ayah_nik||'-')}</td><td>${U.esc(m.ibu_nik||'-')}</td></tr>
            <tr><td class="lbl">Tempat/Tgl Lahir</td><td>${U.esc(m.ayah_ttl||'-')}</td><td>${U.esc(m.ibu_ttl||'-')}</td></tr>
            <tr><td class="lbl">Pendidikan</td><td>${U.esc(m.ayah_pendidikan||'-')}</td><td>${U.esc(m.ibu_pendidikan||'-')}</td></tr>
            <tr><td class="lbl">Pekerjaan</td><td>${U.esc(m.ayah_pekerjaan||'-')}</td><td>${U.esc(m.ibu_pekerjaan||'-')}</td></tr>
            <tr><td class="lbl">Penghasilan</td><td>${U.esc(m.ayah_penghasilan||'-')}</td><td>${U.esc(m.ibu_penghasilan||'-')}</td></tr>
            <tr><td class="lbl">No. HP</td><td>${U.esc(m.ayah_hp||'-')}</td><td>${U.esc(m.ibu_hp||'-')}</td></tr>
          </tbody>
        </table>
      </div>

      ${(m.wali_nama || m.wali_hp || m.wali_hubungan) ? `
      <div class="induk-section">
        <div class="induk-section-head">E. Data Wali</div>
        <table class="induk-table">
          ${rowGrid([
            ['Nama Wali', m.wali_nama || '-'],
            ['Hubungan dengan Anak', m.wali_hubungan || '-'],
            ['No. HP Wali', m.wali_hp || '-'],
            ['Alamat Wali', m.wali_alamat || '-']
          ])}
        </table>
      </div>` : ''}

      <div class="induk-section">
        <div class="induk-section-head">${(m.wali_nama || m.wali_hp || m.wali_hubungan) ? 'F' : 'E'}. Data Masuk RA</div>
        <table class="induk-table">
          ${rowGrid([
            ['Tanggal Masuk', U.fmtDate(m.tanggal_masuk) || '-'],
            ['Asal Sekolah/PAUD', m.asal_paud || '-'],
            ['Kelompok Masuk', m.kelompok_masuk || '-'],
            ['Tahun Ajaran Masuk', m.ta_masuk || '-'],
            ['Status Murid', m.status || 'Aktif'],
            ['No. Akta Kelahiran', m.no_akta || '-']
          ])}
        </table>
      </div>

      ${(m.tanggal_keluar || m.alasan_keluar || m.melanjutkan_ke) ? `
      <div class="induk-section">
        <div class="induk-section-head">G. Data Keluar/Pindah/Lulus</div>
        <table class="induk-table">
          ${rowGrid([
            ['Tanggal Keluar', U.fmtDate(m.tanggal_keluar) || '-'],
            ['Alasan Keluar', m.alasan_keluar || '-'],
            ['Melanjutkan Ke', m.melanjutkan_ke || '-'],
            ['No. Surat Pindah', m.no_surat_pindah || '-']
          ])}
          ${m.keterangan_keluar ? `<tr><td class="lbl">Keterangan</td><td class="sep">:</td><td colspan="3">${U.esc(m.keterangan_keluar)}</td></tr>` : ''}
        </table>
      </div>` : ''}

      ${m.catatan_khusus ? `
      <div class="induk-section">
        <div class="induk-section-head">Catatan Khusus</div>
        <div class="induk-catatan">${U.esc(m.catatan_khusus).replace(/\n/g,'<br>')}</div>
      </div>` : ''}

      <div class="ttd-tempat" style="margin-top:24px">${U.esc(profil.kota_cetak||'')}, ${U.esc(U.fmtDate(U.todayISO()))}</div>
      <div class="ttd-grid" style="grid-template-columns:1fr 1fr;margin-top:8px">
        <div class="col-ttd"><div class="role">Operator/Tata Usaha</div><div class="nama">( ........................ )</div></div>
        <div class="col-ttd"><div class="role">Mengetahui,<br>Kepala RA</div><div class="nama">${U.esc(profil.kepala_nama||'( ........................ )')}</div></div>
      </div>
    </article>
    `;
  }

  function rowGrid(pairs) {
    // Render pairs as 2-column grid (lbl:val, lbl:val per row)
    let html = '';
    for (let i = 0; i < pairs.length; i += 2) {
      const [l1, v1] = pairs[i];
      const [l2, v2] = pairs[i+1] || ['', ''];
      html += `<tr>
        <td class="lbl">${U.esc(l1)}</td><td class="sep">:</td><td>${U.esc(v1)}</td>
        <td class="lbl">${U.esc(l2)}</td><td class="sep">${l2?':':''}</td><td>${U.esc(v2)}</td>
      </tr>`;
    }
    return html;
  }

  return { render };
})();
