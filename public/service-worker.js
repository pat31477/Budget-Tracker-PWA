const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/manifest.webmanifest',
    '/index.js',
    '/db.js',
    'service-index.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];


self.addEventListener("install", function(evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});


self.addEventListener("activate", function(evt) {
    evt.waitUntil(
        cache.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if(key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});


self.addEventListener("fetch", function(evt) {
    if (evt.request.url.includes ("/api/")) {
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request)
                  .then(response => {
                    if(response.status === 200) {
                        cache.put(evt.request.url, response.clone());
                    }

                    return response;
                })
                .catch(err => {
                    return cache.match(evt.request);
                });
            }).catch(err => console.log(err))
        );

        return;
    }

    evt.respondWith(
        fetch(evt.request).catch(function() {
            return cache.match(evt.request).then(function(response) {
                if (response) {
                    return response;
                } else if (evt.request.header.get("accept").include("text/html")) {
                    return cache.match("/");
                }
            });
        })
    );
});