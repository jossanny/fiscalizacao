//sw.js

const CACHE_NAME = "fiscalizacao-cache-v25"; // Incrementa a versão do cache
const urlsToCache = [
    "/",
    "/static/js/app.js",
    "/static/js/indexeddb.js",
    "/static/manifest.json", // Se você tiver um manifest.json
    "/static/img/192.png",
    "/static/img/512.png",
];

// Instalação do Service Worker e cache de recursos estáticos
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .catch((err) => {
                console.error("Erro ao adicionar arquivos ao cache:", err);
            })
    );
});

// Limpeza de caches antigos
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Intercepta requisições e serve do cache ou da rede
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response; // Retorna do cache se encontrado
            }

            // Se não estiver no cache, tenta buscar na rede
            return fetch(event.request)
                .then(response => {
                    if (response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            return cache.put(event.request, responseToCache);
                        });
                    }
                    return response; // Retorna a resposta da rede
                })
                .catch((error) => {
                    console.error("Erro ao buscar arquivo:", error);
                    if (event.request.mode === 'navigate') {
                        return caches.match('/'); // Página inicial offline
                    }
                    return new Response("Você está offline. Esta página não está disponível.", {
                        status: 503,
                        statusText: "Service Unavailable"
                    });
                });
        })
    );
});

// Sincronização em segundo plano com retentativas exponenciais
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-forms') {
        console.log('Sincronizando dados offline...');
        event.waitUntil(
            syncOfflineDataWithRetry()
        );
    }
});

// Função para sincronizar dados offline com retentativas exponenciais
async function syncOfflineDataWithRetry(retryCount = 0) {
    try {
        const db = await openIndexedDB();
        const offlineData = await getAllOfflineData(db);

        if (offlineData.length > 0) {
            const response = await fetch("/sync/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(offlineData),
            });

            if (response.ok) {
                await clearOfflineData(db);
                console.log("Dados sincronizados com sucesso!");
                // Notifica o cliente (app.js) sobre o sucesso
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({ type: 'sync-success', data: offlineData });
                    });
                });
            } else {
                throw new Error(`Erro ao sincronizar: ${response.statusText}`);
            }
        } else {
            console.log("Nenhum dado offline para sincronizar.");
        }
    } catch (err) {
        console.error("Erro ao sincronizar:", err);

        // Retentativa exponencial
        if (retryCount < 3) { // Limite de 3 tentativas
            const delay = Math.pow(2, retryCount) * 1000; // Intervalo exponencial
            console.log(`Tentando novamente em ${delay / 1000} segundos...`);
            setTimeout(() => {
                syncOfflineDataWithRetry(retryCount + 1);
            }, delay);
        } else {
            console.error("Número máximo de tentativas atingido. Abortando sincronização.");
            // Notifica o cliente (app.js) sobre o erro
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'sync-error', error: err.message });
                });
            });
        }
    }
}

// Funções auxiliares para IndexedDB
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('offlineDataDB', 2);

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function getAllOfflineData(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['offlineForms'], 'readonly');
        const store = transaction.objectStore('offlineForms');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function clearOfflineData(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['offlineForms'], 'readwrite');
        const store = transaction.objectStore('offlineForms');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

// Evento message para receber mensagens do cliente (app.js)
self.addEventListener('message', event => {
    if (event.data === 'sync-offline-forms') {
        self.registration.sync.register('sync-offline-forms');
    }
});