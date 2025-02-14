const CACHE_NAME = "fiscalizacao-cache-v15";
const urlsToCache = [
    "/",
    "/static/js/app.js",
    "/static/js/indexedDB.js",
    "/static/manifest.json",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache)
                .catch((err) => {
                    console.error("Erro ao adicionar arquivos ao cache:", err);
                });
        })
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch((err) => {
                console.error("Erro ao buscar arquivo offline:", err);
                return caches.match('/');
            });
        })
    );
});

self.addEventListener("sync", (event) => {
    if (event.tag === "sync-offline-forms") {
        event.waitUntil(syncOfflineData());
    }
});

async function syncOfflineData() {
    const db = await openIndexedDB();
    const offlineData = await getOfflineData(db);

    if (offlineData.length > 0) {
        try {
            const response = await fetch("/sync/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(offlineData),
            });

            if (response.ok) {
                await clearOfflineData(db);
            } else {
                console.log("Erro ao sincronizar com o servidor.");
            }
        } catch (err) {
            console.log("Erro de rede ao tentar sincronizar:", err);
        }
    }
}

async function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('offlineDataDB', 1);
        request.onerror = (event) => reject(event.target.error);
        request.onsuccess = (event) => resolve(event.target.result);
    });
}

async function getOfflineData(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['offlineForms'], 'readonly');
        const store = transaction.objectStore('offlineForms');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function clearOfflineData(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['offlineForms'], 'readwrite');
        const store = transaction.objectStore('offlineForms');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}