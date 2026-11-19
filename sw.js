/* 她她经营作战台 service worker
   - index.html / 导航 / data.json: network-first（打开就拿最新数字），断网回退缓存
   - 其他静态资源（图标、manifest）: cache-first */
const VERSION = 'tata-v13';
const CORE = ['./', './index.html', './data.json', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/logo-wordmark.png', './icons/logo-wordmark-dark.png', './icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
function networkFirst(req, cacheKey) {
  return fetch(req, {cache: 'no-store'}).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(cacheKey, copy)); }
    return res;
  }).catch(() => caches.match(cacheKey, {ignoreSearch: true}).then(r => r || caches.match('./index.html')));
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    e.respondWith(networkFirst(req, './index.html')); return;
  }
  if (url.pathname.endsWith('/data.json')) { e.respondWith(networkFirst(req, './data.json')); return; }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(r => r || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })));
});
