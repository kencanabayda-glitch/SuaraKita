// sw.js : simpan file aplikasi + modul Firebase ke cache agar bisa dibuka offline.
// Naikkan angka VERSI setiap kali mengubah file aplikasi.
const VERSI = "suarakita-v3";
const FILE = [
  "./", "index.html", "manifest.json",
  "css/style.css", "js/app.js", "js/storage.js", "js/firebase-config.js",
  "icons/icon-192.png", "icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(FILE)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(nama =>
    Promise.all(nama.filter(n => n !== VERSI).map(n => caches.delete(n)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Hanya file aplikasi & modul Firebase dari gstatic yang di-cache.
  // Permintaan data/login Firebase dibiarkan lewat langsung.
  const boleh = req.method === "GET" &&
    (url.origin === location.origin || url.hostname === "www.gstatic.com");
  if (!boleh) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    const salinan = res.clone();
    caches.open(VERSI).then(c => c.put(req, salinan));
    return res;
  })));
});
