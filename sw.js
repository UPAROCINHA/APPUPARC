// Service Worker — UPA Rocinha Portal
// Garante funcionamento básico mesmo sem internet

const CACHE_NAME = 'upa-rocinha-v1';
const ASSETS = [
    './',
    './index.html',
    './logo.png',
    './logoazul.ico',
    './logoazul.jpeg',
    './manifest.json'
];

// Instalar e cachear assets estáticos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS).catch(() => {});
        })
    );
    self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Estratégia: Network First, fallback para cache
self.addEventListener('fetch', event => {
    // Não interceptar requisições do Google Sheets (JSONP)
    if (event.request.url.includes('docs.google.com') ||
        event.request.url.includes('googleapis.com')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Salvar no cache se for GET bem-sucedido
                if (event.request.method === 'GET' && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                // Sem internet: retornar do cache
                return caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    // Fallback para index.html se for navegação
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});
