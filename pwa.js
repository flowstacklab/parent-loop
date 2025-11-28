// PWA Service Worker Registration and Install Prompt Handling
(function () {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    const installButton = document.getElementById('btn-install');
    let deferredPrompt;
    let hideButtonTimeout;

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then((registration) => {
                registration.update();

                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            window.location.reload();
                        }
                    });
                });
            })
            .catch((error) => {
                console.log('Registrazione Service Worker fallita:', error);
            });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    });

    if (!installButton) {
        return;
    }

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        installButton.style.display = 'block';

        hideButtonTimeout = setTimeout(() => {
            installButton.style.display = 'none';
        }, 15000);
    });

    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) {
            return;
        }

        if (hideButtonTimeout) {
            clearTimeout(hideButtonTimeout);
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome !== 'accepted') {
            console.log('Installazione PWA rifiutata');
        }

        deferredPrompt = null;
        installButton.style.display = 'none';
    });

    window.addEventListener('appinstalled', () => {
        if (hideButtonTimeout) {
            clearTimeout(hideButtonTimeout);
        }
        installButton.style.display = 'none';
        deferredPrompt = null;
    });

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        installButton.style.display = 'none';
    }
})();
