// =========================================================================
// LEMBARKU — SERVICE WORKER PWA ENGINE (sw.js — V14.3)
// =========================================================================
const CACHE_NAME = "lembarku-cache-v2";
const ASSETS_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",
    "./lembarku-logo.png",
    "./css/styles.css",
    "./js/config.js",
    "./js/qris.js",
    "./js/vault.js",
    "./js/chat.js",
    "./js/portfolio.js",
    "./js/invitation.js",
    "./js/admin.js",
    "./js/app.js"
];

// 1. INSTALL: Simpan aset inti ke penyimpanan lokal
self.addEventListener("install", (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
        })
    );
});

// 2. ACTIVATE: Hapus cache versi lama (v1) secara otomatis
self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((k) => {
                    if (k !== CACHE_NAME) {
                        return caches.delete(k);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. FETCH: Network-First untuk berkas HTML/API & Cache-First untuk aset statis
self.addEventListener("fetch", (e) => {
    const req = e.request;
    const url = new URL(req.url);

    // Jangan cegat permintaan POST atau panggilan API Google Apps Script
    if (req.method !== "GET" || url.href.includes("script.google.com") || url.href.includes("script.googleusercontent.com")) {
        return;
    }

    // Untuk file HTML utama: ambil dari jaringan agar selalu mutakhir, fallback ke cache jika offline
    if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
        e.respondWith(
            fetch(req)
                .then((res) => {
                    if (res && res.status === 200) {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                    }
                    return res;
                })
                .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
        );
        return;
    }

    // Untuk aset statis (JS, CSS, Gambar): Ambil cache terlebih dahulu, perbarui di latar belakang
    e.respondWith(
        caches.match(req).then((cached) => {
            const fetchPromise = fetch(req)
                .then((networkRes) => {
                    if (networkRes && networkRes.status === 200 && networkRes.type === "basic") {
                        const copy = networkRes.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                    }
                    return networkRes;
                })
                .catch(() => cached);

            return cached || fetchPromise;
        })
    );
});
