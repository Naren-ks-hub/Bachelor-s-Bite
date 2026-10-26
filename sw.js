const CACHE_NAME = 'bachelorbite-v2.2.0-voice';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/icon.svg',
  '/images/recipe_noodles.jpg',
  '/images/recipe_egg_toast.jpg',
  '/images/recipe_smokey_rice.jpg',
  '/images/collection_budget.jpg',
  '/images/collection_quick.jpg',
  '/images/collection_protein.jpg',
  '/images/collection_midnight.jpg',
  '/images/collection_vegan.jpg',
  '/images/collection_fiber.jpg',
  '/images/collection_global.jpg',
  '/images/logo.png',
  '/images/logo_badge.jpg',
  '/bachelors bite.jpg'
];

// Install Event - Pre-cache critical static shell & activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ [Service Worker v2.1.0] Pre-caching offline app shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('⚠️ [Service Worker] Non-critical cache item skipped:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up stale old caches (including legacy v1.0.0 Firebase caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('🧹 [Service Worker] Purging legacy cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Pass-through for non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 1. API Requests: Network First with Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 2. Navigation / HTML Requests: NETWORK FIRST to prevent serving stale Firebase code
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return networkResponse;
        })
        .catch(() => {
          console.log('⚡ [Service Worker] Network unavailable, falling back to cached app shell');
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 3. Static Media Assets (Images, Icons, Fonts): Cache First with background revalidation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const resClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return networkResponse;
      });
    })
  );
});
