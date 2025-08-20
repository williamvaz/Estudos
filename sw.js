// /Estudos/sw.js
const CACHE = 'estudos-v5';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './Icone-192.png', // garanta que existem com esses nomes
  './Icone-512.png',
  './icone.webp',    // opcional, se existir
  './selecoes.html',
  './palavras.html',
  './edicoes.html'
  // NÃO liste ./campeonato.html enquanto não existir no repo
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Precache resiliente (não quebra a instalação se faltar um arquivo)
    for (const url of APP_SHELL) {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch (err) {
        console.warn('[SW] pulando', url, err);
      }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

// Navegação: network-first com fallback pro app shell
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        const net = preload || await fetch(req);

        // GH Pages: trate 404 de navegação como SPA fallback
        if (net.status === 404 || net.url.endsWith('/404.html')) {
          const cached = await caches.match('./index.html');
          return cached || Response.redirect('/Estudos/index.html', 302);
        }
        return net;
      } catch {
        const cached = await caches.match('./index.html');
        return cached || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // Assets: cache-first
  event.respondWith(caches.match(req).then(c => c || fetch(req)));
});
