/* Service Worker for Meal & Play PWA */

const CACHE_NAME = 'meal-and-play-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/week-config.txt',
    '/menu-nido.txt',
    '/menu-infanzia.txt',
    '/activities.txt'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache, but always try network first for data files
self.addEventListener('fetch', function(event) {
    const url = new URL(event.request.url);
    
    // For data files, always try network first to get latest data
    if (url.pathname.includes('.txt')) {
        event.respondWith(
            fetch(event.request)
                .then(function(response) {
                    // If network request succeeds, cache the new response
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(function() {
                    // If network fails, try to serve from cache
                    return caches.match(event.request);
                })
        );
    } else {
        // For other files, use cache-first strategy
        event.respondWith(
            caches.match(event.request)
                .then(function(response) {
                    // Cache hit - return response
                    if (response) {
                        return response;
                    }
                    
                    // Clone the request
                    const fetchRequest = event.request.clone();
                    
                    return fetch(fetchRequest).then(
                        function(response) {
                            // Check if valid response
                            if(!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }
                            
                            // Clone the response
                            const responseToCache = response.clone();
                            
                            caches.open(CACHE_NAME)
                                .then(function(cache) {
                                    cache.put(event.request, responseToCache);
                                });
                            
                            return response;
                        }
                    );
                })
        );
    }
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
