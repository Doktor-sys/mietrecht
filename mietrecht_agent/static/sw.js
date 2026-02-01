const CACHE_NAME = 'jurismind-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/images/icons/icon-192x192.png',
    '/static/images/icons/icon-512x512.png',
    '/static/images/icons/icon-maskable-192x192.png',
    '/static/images/icons/icon-maskable-512x512.png',
    '/static/images/offline.png',
    '/offline.html'
];

// Installations-Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache geöffnet');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Aktivierungs-Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch-Event mit erweiterter Logik
self.addEventListener('fetch', (event) => {
    // Ignoriere Nicht-GET-Requests und andere Origin-Requests
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Strategie: Cache First, dann Netzwerk
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Sofort Cache zurückgeben, falls vorhanden
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Ansonsten vom Netzwerk laden und im Cache speichern
                return fetch(event.request)
                    .then((response) => {
                        // Nur gültige Antworten cachen
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Klonen der Response, da der Stream nur einmal gelesen werden kann
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Offline-Fallback für HTML-Seiten
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/offline.html');
                        }
                        // Offline-Fallback für Bilder
                        if (event.request.headers.get('accept').includes('image')) {
                            return caches.match('/static/images/offline.png');
                        }
                    });
            })
    );
});

// Hintergrund-Synchronisierung
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-requests') {
        console.log('Hintergrundsynchronisierung gestartet');
        // Hier können Sie Logik für die Synchronisierung implementieren
    }
});

// Push-Benachrichtigungen
self.addEventListener('push', (event) => {
    const options = {
        body: event.data?.text() || 'Neue Benachrichtigung von JurisMind',
        icon: '/static/images/icons/icon-192x192.png',
        badge: '/static/images/icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        }
    };

    event.waitUntil(
        self.registration.showNotification('JurisMind', options)
    );
});
