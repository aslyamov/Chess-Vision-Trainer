const CACHE_NAME = 'chess-vision-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './maple.jpg',
  './dist/main.js',
  './dist/core/ChessVisionTrainer.js',
  './dist/core/GameSession.js',
  './dist/core/PuzzleManager.js',
  './dist/ui/BoardRenderer.js',
  './dist/ui/UIManager.js',
  './dist/ui/StatusManager.js',
  './dist/utils/chess-utils.js',
  './dist/utils/error-handler.js',
  './dist/utils/localization.js',
  './dist/utils/performance-utils.js',
  './locales/ru.json',
  './locales/en.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
