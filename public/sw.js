const CACHE_NAME = 'rathore-rishtey-pwa-v3';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/pwa-144x144.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve(false);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

function shouldBypassCache(url) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;
  if (url.origin !== self.location.origin) return true;
  // Never intercept Vite HMR / dev modules, pre-bundled deps, source files, or API calls
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('__vite') ||
    /\.(ts|tsx|jsx|mts|cts)$/i.test(url.pathname) ||
    url.searchParams.has('v') ||
    url.searchParams.has('t') ||
    url.searchParams.has('import') ||
    url.searchParams.has('direct')
  ) {
    return true;
  }
  return false;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (shouldBypassCache(url)) return;

  // Navigation requests (SPA routes including /, /privacy-policy, etc.): Network-First -> Cached App Shell -> Offline Page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(async () => {
          const cachedRoute = await caches.match(request);
          if (cachedRoute) return cachedRoute;
          const cachedShell = await caches.match('/index.html');
          if (cachedShell) return cachedShell;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Web manifests: Network-First so app name and icon updates always propagate immediately
  if (url.pathname === '/manifest.json' || url.pathname === '/manifest.webmanifest') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static same-origin assets: Cache-First with background refresh fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
