/* Chuteira Cansada - Service Worker (PWA) */

const CACHE_NAME = 'chuteira-cansada-v34';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/jogadores.html',
  '/gastos.html',
  '/saldo.html',
  '/classificacao.html',
  '/campeonato.html',
  '/entreterimento.html',
  '/jogador.html',
  '/assets/styles.css?v=20260311-17',
  '/assets/app.js?v=20260311-19',
  '/manifest.json',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Never cache API responses.
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Navigation: try network first for fresh content; fallback to cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // Static assets: simple cache-first strategy.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return res;
      });
    })
  );
});




