# Aplikasi Rapor & Buku Induk RA Digital

Aplikasi web (SPA) untuk Raudhatul Athfal (RA), Fase Fondasi, sesuai **Panduan Pembelajaran dan Asesmen Kemenag Tahun 2025** dan **KMA 1503 Tahun 2025**.

## Fitur Utama

- **Buku Induk Peserta Didik** lengkap (identitas, alamat, fisik & kesehatan, orang tua/wali, data masuk & keluar)
- **Master Data**: Profil RA, Tahun Ajaran, Semester, Guru, Kelas
- **Bank Indikator** RA (4 elemen × 35+ indikator default, bisa di-edit/ditambah)
- **Input Asesmen** per murid dengan skala BB/MB/BSH/BSB
- **Generate Deskripsi Rapor Otomatis** — narasi positif, lembut, sesuai gaya rapor RA
- **Edit Manual Deskripsi** + kunci/buka kunci rapor
- **Cetak Rapor** A4 portrait per murid atau seluruh kelas
- **Save as PDF** via dialog cetak browser
- **Export/Import Excel** Buku Induk (template tersedia)
- **Export Rekap Asesmen** per kelas (4 sheet per elemen)
- **Login Multi-Role**: Admin, Kepala RA, Guru Kelas, Operator
- **Backup/Restore** semua data sebagai JSON
- **PWA** — bisa di-install ke laptop/HP, jalan offline
- **Responsif** — tampil rapi di laptop dan HP

## Cara Menjalankan

### Cara cepat (rekomendasi):

```
node serve.js
```

Buka http://localhost:8080 di browser.

### Atau buka langsung:

Bisa juga buka `index.html` langsung dari file explorer (double click), tapi beberapa fitur PWA tidak akan aktif.

## Akun Demo

| Username | Password | Role |
|----------|----------|------|
| admin    | admin123 | Admin RA (semua akses) |
| kepala   | kepala123 | Kepala RA |
| guru     | guru123 | Guru Kelas (hanya kelasnya) |
| operator | operator123 | Operator |

## Data Demo

Saat pertama kali dijalankan, aplikasi otomatis terisi data contoh:

- **RA Miftahul Jannah** (Sukowono, Jember, Jawa Timur)
- 1 Kepala RA, 1 Guru Kelas, 2 Kelas (Matahari & Bulan)
- 1 Murid contoh: **Syifa Aulia** (4-5 tahun) dengan asesmen lengkap
- Bank indikator awal sesuai brief Kemenag

Klik tombol **"Lihat Demo Rapor"** di Dashboard untuk melihat hasil rapor lengkap dengan deskripsi otomatis.

## Struktur Aplikasi

```
ra-rapor-buku-induk/
├── index.html              # entry point
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # service worker (offline support)
├── serve.js                # dev server (no-deps Node.js)
├── icons/                  # logo & ikon PWA
├── css/
│   ├── app.css             # tema hijau madrasah
│   └── print.css           # styling cetak A4
└── js/
    ├── lib/utils.js        # helpers
    ├── store.js            # CRUD localStorage
    ├── seed.js             # data demo
    ├── narasi.js           # generator deskripsi otomatis
    ├── excel.js            # export/import Excel via ExcelJS
    ├── app.js              # router & login
    └── pages/              # halaman per menu
```

Semua data disimpan di **localStorage** browser (prefix `ra_v1_`). Jangan menghapus cache browser tanpa backup dulu.

## Workflow Penggunaan

1. **Setup awal** (admin):
   - Atur **Profil RA** → upload logo
   - Set **Tahun Ajaran** & semester aktif
   - Tambahkan **Guru** dan **Kelas**
   - Tambahkan **Murid** di Buku Induk (manual atau import Excel)
2. **Per semester** (guru):
   - Input **Asesmen** untuk semua murid (4 elemen × indikator)
   - Klik **Generate Deskripsi** → semua narasi rapor otomatis terisi
   - Buka **Rapor RA** → review/edit narasi, isi kehadiran, refleksi ortu, TTD
   - Cetak rapor (per anak atau 1 kelas) sebagai PDF/print
3. **Akhir tahun**:
   - Export buku induk Excel sebagai arsip
   - Backup data JSON

## 4 Elemen Capaian Pembelajaran (Fase Fondasi)

1. **Nilai Agama dan Budi Pekerti**
2. **Jati Diri**
3. **Dasar-dasar Literasi, Matematika, Sains, Rekayasa, Teknologi, dan Seni**
4. **Kokurikuler** (Projek Penguatan Profil Pelajar)

Skala capaian: **BB** (Belum Berkembang), **MB** (Mulai Berkembang), **BSH** (Berkembang Sesuai Harapan), **BSB** (Berkembang Sangat Baik).

## Generator Narasi Otomatis

Sistem menghasilkan deskripsi rapor 2-4 paragraf per elemen, mengikuti aturan bahasa rapor RA:

- Positif, lembut, mendidik
- Pakai panggilan **"Ananda [Nama]"**
- Mengutamakan kekuatan anak
- Menyebut hal yang masih perlu distimulasi (dengan bahasa positif)
- Saran konkret untuk orang tua di rumah
- Hindari kata negatif (gagal, buruk, lemah, dst)

Tidak butuh API berbayar — semua narasi dibuat dari template lokal yang variasi pembukanya di-acak per anak.

## Lisensi & Pengembangan

Aplikasi ini dibuat untuk membantu RA mengelola rapor dan buku induk secara digital. Silakan dikembangkan, dimodifikasi, dan disebarkan untuk kepentingan pendidikan madrasah.

---

**v1.0.0** · Juni 2026  
Dibuat berdasarkan KMA 1503 Tahun 2025 + Panduan Pembelajaran dan Asesmen Kemenag 2025
