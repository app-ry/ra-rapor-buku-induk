// Service Worker — Aplikasi Rapor & Buku Induk RA
const CACHE = 'ra-v1-2026-06-15-r2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './css/print.css',
  './js/lib/utils.js',
  './js/store.js',
  './js/seed.js',
  './js/narasi.js',
  './js/excel.js',
  './js/app.js',
  './js/pages/dashboard.js',
  './js/pages/profil.js',
  './js/pages/tahun_ajaran.js',
  './js/pages/guru.js',
  './js/pages/kelas.js',
  './js/pages/buku_induk.js',
  './js/pages/indikator.js',
  './js/pages/asesmen.js',
  './js/pages/generate.js',
  './js/pages/rapor.js',
  './js/pages/cetak.js',
  './js/pages/cetak_induk.js',
  './js/pages/rekap.js',
  './js/pages/pengguna.js',
  './js/pages/backup.js',
  './icons/kemenag.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(()=>{})));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // CDN assets: network first
  if (url.origin !== location.origin) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
