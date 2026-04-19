const CACHE_NAME = 'chess-vision-v38';
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Stale-while-revalidate для puzzles.json:
  // — отдаём из кэша мгновенно (если есть), одновременно обновляем кэш в фоне.
  // — при первом заходе ждём сеть, кэшируем результат.
  if (url.pathname.endsWith('/puzzles.json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const networkFetch = fetch(event.request).then((response) => {
            if (response.ok && response.status !== 206) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => null);

          // Если в кэше есть — отдаём сразу, сеть обновляет в фоне
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // Network-first для всего остального (JS/CSS обновляются с деплоем)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.status !== 206) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
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
