// sw.js — simples App Shell + fallback de navegação
const CACHE = 'estudos-v1';
const ASSETS = [
  './',
  './index.html',
  './Icone.webp',
  './manifest.webmanifest',
  // adicione aqui seus HTMLs da home:
  './campeonato.html',
  './selecoes.html',
  './palavras.html',
  './edicoes.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // 1) Navegações → sempre tentar rede, senão cair para index.html (SPA fallback)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 2) Para estáticos → cache-first
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
