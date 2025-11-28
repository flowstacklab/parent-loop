const CACHE_NAME = 'mep-v1';
const urlsToCache = [];

// Installazione del Service Worker
self.addEventListener('install', (event) => {
  // Forza l'attivazione immediata del nuovo service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aperta, tentativo di cache dei file...');
        // Prova a cachare ogni file singolarmente per evitare errori 404
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`Impossibile cachare ${url}:`, err);
              // Continua anche se un file non è disponibile
            });
          })
        );
      })
      .then(() => {
        console.log('Service Worker installato con successo');
      })
      .catch((error) => {
        console.error('Errore durante installazione Service Worker:', error);
      })
  );
});

// Attivazione del Service Worker
self.addEventListener('activate', (event) => {
  // Prendi il controllo immediatamente
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminazione cache vecchia:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Intercettazione delle richieste con strategia mista
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // NESSUNA CACHE per menu-data.txt e index.html - SEMPRE dalla rete!
  if (url.pathname.includes('menu-data.txt') || url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store'  // Forza nessuna cache del browser
      })
    );
    return;
  }
  
  // Cache-First per tutto il resto (HTML, CSS, JS, immagini)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          return caches.match('./index.html');
        });
      })
  );
});

// Ascolta messaggi per forzare l'attivazione
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
