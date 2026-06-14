// ForgeFit AI - PWA Service Worker (v4.3)

const CACHE_NAME = 'forgefit-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/sitemap.xml',
  '/robots.txt'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching App Shell and Assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event (Cleanup Old Caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Interception (Cache First / Stale While Revalidate fallback)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Skip non-GET requests (e.g. Supabase POST operations are queued by offlineDb)
  if (req.method !== 'GET') {
    return;
  }

  // Handle asset requests
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached, but fetch fresh copy in the background
        fetch(req)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
            }
          })
          .catch(() => {/* Ignore network errors offline */});
        return cachedResponse;
      }

      return fetch(req)
        .then((networkResponse) => {
          // If response is valid, cache it
          if (networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          // Offline Fallback for html pages
          const accept = req.headers.get('accept');
          if (accept && accept.includes('text/html')) {
            return caches.match('/index.html');
          }
          throw err;
        });
    })
  );
});
