const CACHE_NAME = 'land-dev-v2';

// 只預先快取必要的本地核心檔案（不包含大型 CDN 函式庫）
// CDN 函式庫使用「網路優先，快取備用」策略，避免安裝時等待大量外部下載
const LOCAL_ASSETS = [
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
];

// 安裝事件 - 只快取本地核心檔案，立即完成不等 CDN
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(LOCAL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn('[SW] Install cache failed, continuing anyway:', err);
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 請求攔截策略
self.addEventListener('fetch', event => {
  // 排除 POST / 非 GET
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // 地圖瓦片 / Google API：永遠走網路，不快取（避免污染快取空間）
  if (
    url.includes('tile.openstreetmap.org') ||
    url.includes('googleapis.com') ||
    url.includes('nominatim.openstreetmap.org')
  ) {
    return; // 讓瀏覽器直接處理
  }

  // CDN 大型函式庫（Tailwind, Chart.js, Leaflet, xlsx 等）：
  // 網路優先，失敗才用快取，第一次成功後自動存入快取
  if (
    url.includes('cdn.tailwindcss.com') ||
    url.includes('cdn.jsdelivr.net') ||
    url.includes('unpkg.com') ||
    url.includes('flaticon.com')
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 本地核心資源：快取優先（Stale-While-Revalidate），回應最快
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => null);

      return cached || networkFetch;
    })
  );
});
