const CACHE_NAME = 'chess-vision-v37';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './brown.png',
  './dist/main.js',
  './dist/core/ChessVisionTrainer.js',
  './dist/core/IGame.js',
  './dist/core/GameRegistry.js',
  './dist/core/CommonStatsManager.js',
  './dist/core/StatsScreen.js',
  './dist/core/GameSession.js',
  './dist/core/FieldColorGame.js',
  './dist/core/games/FieldColorModule.js',
  './dist/core/games/ChecksAndCapturesModule.js',
  './dist/core/PuzzleManager.js',
  './dist/core/PuzzleProgressManager.js',
  './dist/core/StatsManager.js',
  './dist/core/SoundManager.js',
  './dist/ui/BoardRenderer.js',
  './dist/ui/UIManager.js',
  './dist/ui/StatusManager.js',
  './dist/types/stats.js',
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

// Network-first стратегия: сначала сеть, потом кэш
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Кэшируем свежий ответ
        // Skip caching partial responses (206) — not supported by Cache API
        if (response.ok && response.status !== 206) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Если сеть недоступна - берём из кэша
        return caches.match(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});
