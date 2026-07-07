const CACHE_NAME = 'land-dev-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './src/app.js',
  './src/calculations.js',
  './src/map.js',
  './src/pptx.js',
  './src/state.js',
  './src/style.css',
  './facade-finder/index.html',
  './facade-finder/style.css',
  './facade-finder/app.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://cdn-icons-png.flaticon.com/512/602/602182.png'
];

// 安裝事件 (Install Event) - 預先快取靜態資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 激活事件 (Activate Event) - 清理舊快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 攔截請求事件 (Fetch Event) - 採用 Stale-While-Revalidate 策略
self.addEventListener('fetch', event => {
  // 排除 POST 請求 (例如 API generate-pdf)，因為 POST 無法快取
  if (event.request.method !== 'GET') {
    return;
  }

  // 排除外部 API（例如 Google Maps API、地圖瓦片伺服器），只使用網路加載
  if (event.request.url.includes('googleapis.com') || event.request.url.includes('google-chrome') || event.request.url.includes('tile.openstreetmap.org')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // 發起背景更新
        fetch(event.request).then(networkResponse => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(err => console.log('[Service Worker] Background fetch failed', err));
        
        return cachedResponse;
      }

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
