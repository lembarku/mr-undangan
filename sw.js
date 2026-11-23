// =========================================================================
// MR UNDANGAN — SERVICE WORKER (PWA CACHE & OFFLINE RESILIENCE)
// File: sw.js
// =========================================================================
const CACHE_NAME = 'mr-undangan-cache-v5';
const STATIC_ASSETS = [
  './',
  './manifest.json',
  './logo.png',
  './css/styles.css',
  './js/config.js',
  './js/qris.js',
  './js/vault.js',
  './js/chat.js',
  './js/portfolio.js',
  './js/invitation.js',
  './js/admin.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        STATIC_ASSETS.map((assetUrl) =>
          fetch(assetUrl, { cache: 'no-cache' })
            .then((res) => {
              if (res && res.ok && !res.redirected) {
                return cache.put(assetUrl, res);
              }
            })
            .catch(() => {})
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Jangan simpan sw.js ke dalam cache agar pembaruan Service Worker langsung terdeteksi
  if (url.pathname.endsWith('/sw.js')) return;

  const isNavigation = req.mode === 'navigate';
  const isCode = /\.(html|css|js|json)$/i.test(url.pathname);

  // Network-First untuk halaman utama & file kode agar update GitHub/Netlify langsung aktif
  if (isNavigation || isCode) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic' && !res.redirected) {
            if (!isNavigation || !url.search) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
            }
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => {
            if (cached) return cached;
            if (isNavigation) return caches.match('./');
            return new Response('', { status: 503, statusText: 'Offline' });
          })
        )
    );
    return;
  }

  // Cache-First untuk logo, gambar & aset statis lokal
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic' && !res.redirected) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached || new Response('', { status: 503, statusText: 'Offline' }));

      return cached || networkFetch;
    })
  );
});
```[cite: 28]

### Langkah Pasang & Uji
1. Tempel kode di atas ke **`sw.js`** di repositori GitHub dan tunggu *deployment* selesai[cite: 28].
2. Tutup total tab/aplikasi di HP, lalu buka kembali dan uji klik kartu akun di **Followers/Following**, aksi lengkap di **Project**, tombol *Back* bertahap, serta ubah username / daftar akun[cite: 22, 23, 24, 25, 28].

Silakan kabari hasilnya ya bro!
