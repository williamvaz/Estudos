// /Estudos/sw.js
const CACHE = 'estudos-v3'; // <-- mude a versão para forçar atualização
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icone.webp',
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
    (async () => {
      // limpa caches antigos
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
      // habilita navigation preload (opcional, ajuda desempenho)
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })()
  );
});

// Fallback de navegação para App Shell (corrige 404 do GH Pages)
self.addEventListener('fetch', (e) => {
  const req = e.request;

  // 1) Páginas/navegação
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        // usa preload se disponível
        const preload = await e.preloadResponse;
        if (preload) return handleNavResponse(preload);

        const net = await fetch(req);
        return handleNavResponse(net);
      } catch {
        // offline/erro de rede -> cai pro shell
        return caches.match('./index.html');
      }
    })());
    return;
  }

  // 2) Assets estáticos (cache-first)
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});

function handleNavResponse(resp) {
  // GH Pages devolve 404.html com status 404; também podemos checar URL
  const is404 = resp.status === 404 || resp.url.endsWith('/404.html');
  if (is404) {
    return caches.match('./index.html');
  }
  return resp;
}
