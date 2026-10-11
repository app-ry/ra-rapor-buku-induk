# Matriks Kepatuhan Rapor & Buku Induk RA

Dokumen ini adalah alat verifikasi internal, bukan sertifikasi dari Kemenag.
Status **Perlu verifikasi** harus dibandingkan dengan dokumen resmi terbaru
dan format yang diminta Kankemenag/Kanwil setempat sebelum dipakai sebagai
dokumen administrasi resmi.

| Area | Bukti implementasi | Status audit | Verifikasi lanjutan |
|---|---|---|---|
| Elemen CP Fase Fondasi | `js/seed.js`, `js/narasi.js` | Terimplementasi | Cocokkan dengan panduan resmi terbaru |
| Skala BB/MB/BSH/BSB | `js/seed.js`, halaman asesmen | Terimplementasi | Pastikan istilah dan penggunaannya sesuai pedoman |
| Deskripsi perkembangan | `js/narasi.js`, `js/pages/rapor.js` | Terimplementasi | Review sampel oleh guru/kepala RA |
| Buku induk peserta didik | `js/pages/buku_induk.js`, `js/pages/cetak_induk.js` | Perlu verifikasi | Bandingkan seluruh kolom dengan format resmi lokal |
| Format cetak rapor | `js/pages/cetak.js`, `css/print.css` | Perlu verifikasi | Uji cetak A4 dan minta validasi operator/pengawas |
| Data orang tua dan kesehatan | `js/store.js`, `js/pages/cetak_induk.js` | Ada, tetapi sensitif | Tetapkan dasar akses, retensi, dan perlindungan data |
| Penyimpanan data | `js/store.js` | Lokal | Enkripsi backup; pertimbangkan enkripsi localStorage |
| Autentikasi akun lembaga | `js/supabase_sync.js`, RPC pusat | Terimplementasi | Uji login lintas perangkat dan pencabutan akun |
| Admin Key | `js/pages/generate_license.js` | Tidak di repository aplikasi | Rotasi berkala dan jangan masukkan ke GitHub |
| Offline/PWA | `sw.js`, `manifest.webmanifest` | Terimplementasi | Uji pembaruan cache setiap deployment |
| Backup/restore | `js/pages/backup.js`, `js/store.js` | Terimplementasi tanpa enkripsi | Tambahkan enkripsi dan validasi backup |

## Bukti yang wajib disimpan sebelum rilis

1. Salinan dokumen regulasi resmi dengan tanggal akses.
2. Sampel PDF rapor dan Buku Induk dari aplikasi.
3. Hasil review kepala RA/operator/pengawas.
4. Bukti uji restore backup.
5. Bukti uji registrasi, login lintas perangkat, edit, cabut, dan hapus kode.
