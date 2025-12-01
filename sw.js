/* Service Worker for Meal & Play PWA - Network First Only */

// Install event - skip waiting immediately
self.addEventListener('install', function(event) {
    self.skipWaiting();
});

// Fetch event - always network first, no cache
self.addEventListener('fetch', function(event) {
    event.respondWith(fetch(event.request));
});

// Activate event - delete all caches and claim clients
self.addEventListener('activate', function(event) {
    event.waitUntil(
        Promise.all([
            // Delete ALL caches
            caches.keys().then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        console.log('Deleting cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            }),
            // Take control immediately
            self.clients.claim()
        ])
    );
});
