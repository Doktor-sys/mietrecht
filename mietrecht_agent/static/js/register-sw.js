// Service Worker Registrierung
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                
                // Überprüfe auf Updates
                registration.update().then(() => {
                    console.log('Service Worker updated');
                }).catch(error => {
                    console.log('Service Worker update check failed:', error);
                });
                
                // Event-Listener für Nachrichten vom Service Worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    console.log('Message from Service Worker:', event.data);
                    // Hier können Sie auf Nachrichten vom Service Worker reagieren
                });
                
                // Sende eine Nachricht an den Service Worker
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'INIT',
                        message: 'Service Worker initialisiert',
                        timestamp: Date.now()
                    });
                }
            })
            .catch(function(error) {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Online/Offline Status überwachen
function updateOnlineStatus() {
    const status = document.getElementById('connection-status');
    if (navigator.onLine) {
        console.log('Online');
        if (status) status.textContent = 'Online';
    } else {
        console.log('Offline');
        if (status) status.textContent = 'Offline';
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus(); // Initialen Status setzen
