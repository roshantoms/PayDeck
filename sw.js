const CACHE_NAME = 'paydeck-v2';
const urlsToCache = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'images/PayDeck_logo.png',
  'images/PayDeck_Title.png',
  'images/PayDeck_applogo.png',
  'fonts/Inter-Regular.woff2',
  'fonts/Inter-Medium.woff2',
  'fonts/Inter-SemiBold.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error('Cache addAll failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('Deleting old cache:', key);
          return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('index.html');
          }
          return new Response('Offline – resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});