// indexedDB.js

// Função para salvar dados offline
async function saveOfflineData(data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('offlineDataDB', 3);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('offlineForms')) {
                db.createObjectStore('offlineForms', { keyPath: 'id', autoIncrement: true });
                console.log("Objeto 'offlineForms' criado com sucesso!");
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('offlineForms')) {
                reject("Objeto 'offlineForms' não encontrado no banco de dados.");
                return;
            }

            const transaction = db.transaction(['offlineForms'], 'readwrite');
            const store = transaction.objectStore('offlineForms');
            const addRequest = store.add(data);

            addRequest.onsuccess = () => {
                console.log("Dados salvos offline com sucesso!");
                resolve();
            };

            addRequest.onerror = (event) => {
                console.error("Erro ao salvar dados offline:", event.target.error);
                reject(event.target.error);
            };

            transaction.oncomplete = () => {
                console.log("Transação concluída com sucesso.");
            };

            transaction.onerror = (event) => {
                console.error("Erro na transação:", event.target.error);
                reject(event.target.error);
            };
        };

        request.onerror = (event) => {
            console.error("Erro ao abrir o banco de dados:", event.target.error);
            reject(event.target.error);
        };
    });
}

// Função para sincronizar dados offline
let isSyncing = false; // Flag para evitar sincronizações simultâneas

async function syncOfflineData() {
    if (isSyncing) {
        console.log("Sincronização já em andamento. Ignorando...");
        return;
    }

    isSyncing = true; // Marca como sincronizando

    return new Promise((resolve, reject) => {
        const request = indexedDB.open('offlineDataDB', 3); // Versão consistente

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('offlineForms')) {
                db.createObjectStore('offlineForms', { keyPath: 'id', autoIncrement: true });
                console.log("Objeto 'offlineForms' criado com sucesso!");
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('offlineForms')) {
                reject("Objeto 'offlineForms' não encontrado no banco de dados.");
                return;
            }

            const transaction = db.transaction(['offlineForms'], 'readonly');
            const store = transaction.objectStore('offlineForms');
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = async () => {
                const offlineData = getAllRequest.result;

                if (offlineData.length > 0) {
                    try {
                        const response = await fetch("/sync/", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(offlineData),
                        });

                        if (response.ok) {
                            // Remove apenas os dados sincronizados
                            const clearTransaction = db.transaction(['offlineForms'], 'readwrite');
                            const clearStore = clearTransaction.objectStore('offlineForms');

                            // Remove cada item sincronizado
                            await Promise.all(offlineData.map(item => {
                                return new Promise((resolve, reject) => {
                                    const deleteRequest = clearStore.delete(item.id);
                                    deleteRequest.onsuccess = () => resolve();
                                    deleteRequest.onerror = (event) => reject(event.target.error);
                                });
                            }));

                            console.log("Dados sincronizados e removidos com sucesso!");
                            resolve();
                        } else {
                            console.error(`Erro ao sincronizar com o servidor: ${response.statusText}`);
                            reject("Erro ao sincronizar com o servidor.");
                        }
                    } catch (err) {
                        console.error("Erro de rede ao tentar sincronizar:", err);
                        reject("Erro de rede ao tentar sincronizar: " + err);
                    }
                } else {
                    console.log("Nenhum dado offline para sincronizar.");
                    resolve();
                }
            };

            getAllRequest.onerror = (event) => {
                console.error("Erro ao recuperar dados offline:", event.target.error);
                reject(event.target.error);
            };
        };

        request.onerror = (event) => {
            console.error("Erro ao abrir o banco de dados:", event.target.error);
            reject(event.target.error);
        };
    }).finally(() => {
        isSyncing = false; // Libera a flag de sincronização
    });
}

// Detecta quando a conexão de rede é restaurada
window.addEventListener('online', () => {
    console.log("Conexão restaurada! Tentando sincronizar os dados...");
    syncOfflineData().then(() => {
        console.log("Dados sincronizados com sucesso!");
    }).catch((err) => {
        console.error("Erro ao sincronizar:", err);
    });
});

if (navigator.onLine) {
    syncOfflineData().then(() => {
        console.log("Dados sincronizados com sucesso ao carregar a página!");
    }).catch((err) => {
        console.error("Erro ao tentar sincronizar logo no carregamento:", err);
    });
}