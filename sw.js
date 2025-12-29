const CACHE_NAME = "dartmaster-cache-v2";
const urlsToCache = ["index.html","app.js","styles.css","manifest.json"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(urlsToCache)));
});

self.addEventListener("fetch", e=>{
  e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request)));
});
