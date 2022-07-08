const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/idb.js',
    '/js/index.js',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    '/manifest.json'
];

const STATIC_CACHE = "static-cache-v2";
const DATA_CACHE = "data-cache-v1";
const RUNTIME_CACHE = "runtime-cache";

// lifecylce method
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
        .then(cache => cache.addAll(FILES_TO_CACHE))
        .then(self.skipWaiting())
    );
});

// old cache clean up
self.addEventListener('activate', event => {
    const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        })
        .then(deleteCaches => {
            return Promise.all(deleteCaches.map(deleteCaches => {
                return chaches.delete(deleteCaches);
            }));
        })
        .then(() => self.clients.claim())
    );
});

// fetch
self.addEventListener('fetch', event => {
    if ( event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        event.respondWith(fetch(event.request));
        return;
    }


if (event.request.url.includes('/api/transaction')) {
    event.respondWith(
        caches.open(RUNTIME_CACHE).then(cache => {
            return fetch(event.request)
            .then(response => {
                cache.put(event.request, response.clone());
                return response;
            })
            .catch(() => caches.match(event.request));
        })
    );
    return;
}


event.respondWith(
    caches.match(event.request)
    .then(cacheResponse => {
        if (cacheResponse) {
            return cacheResponse;
        }

        return caches.open(RUNTIME_CACHE)
        .then(cache => {
            return fetch(event.request)
            .then(response => {
                return cache.put(event.request, response.clone())
                .then(() => {
                    return response;
                });
            });
        });
    })
)});