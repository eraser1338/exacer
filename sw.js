const V = 'exacer-1.5';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE).then(() => Promise.all(LIBS.map(u => fetch(u, { mode: 'cors' }).then(r => { if (r.ok) return c.put(u, r); }).catch(() => {}))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // only this app's old copies: other apps on the same github.io address keep theirs
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf('exacer-') === 0 && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // the PDF reader never changes at its address: from the cache first
  if (LIBS.indexOf(req.url) >= 0) {
    e.respondWith(caches.match(req.url).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(req.url, cp)); return res; })));
    return;
  }
  if (new URL(req.url).origin !== self.location.origin) return;
  // the app itself: the newest copy when online, the saved one when not
  e.respondWith(fetch(req).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(req, cp)); } return res; })
    .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
});
