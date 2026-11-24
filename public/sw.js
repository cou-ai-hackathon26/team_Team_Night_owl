// ScamShield BD Service Worker
const CACHE_NAME = 'scamshield-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      // Clear all older caches
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // CRITICAL: NEVER intercept or cache HTML/Navigation requests (avoids serving stale SSR markup)
  if (event.request.mode === 'navigate') {
    return;
  }

  const url = new URL(event.request.url);

  // CRITICAL: NEVER cache API routes under /api/*
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Only cache immutable static assets like /_next/static/ or images
  if (event.request.method === 'GET' && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
