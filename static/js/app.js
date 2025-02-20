// Registrar o Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('Service Worker registrado com sucesso!', registration);
            })
            .catch(function(error) {
                console.log('Falha ao registrar o Service Worker:', error);
            });
    });
}
// Detectar mudanças na conectividade
window.addEventListener("online", () => {
    console.log("Você está online!");
    syncOfflineData(); // Sincroniza dados offline quando a conexão é restabelecida
});

window.addEventListener("offline", () => {
    console.log("Você está offline!");
});

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("meu-formulario");

    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            // Coleta de dados do formulário
            const formData = new FormData(event.target);
            const jsonData = {};

            // Atribuindo valores aos campos JSON (corrigir problemas de campos do tipo array)
            formData.forEach((value, key) => {
                if (!jsonData[key]) {
                    jsonData[key] = [];
                }
                jsonData[key].push(value);  // Adiciona o valor no array correspondente
            });

            // Remove o campo csrfmiddlewaretoken (se presente)
            delete jsonData.csrfmiddlewaretoken;

            // Estrutura os dados corretamente
            const dadosCorretos = [];
            const numItems = jsonData["id_parcela[]"] ? jsonData["id_parcela[]"].length : 0;

            if (numItems > 0) {
                // Campos fora da tabela (valores únicos)
                const codigo_propriedade = jsonData.codigo_propriedade[0]; // Valor único
                const ui = jsonData.ui[0]; // Valor único
                const parcela_t = jsonData.parcela_t[0]; // Valor único
                const codigo_ut = jsonData.codigo_ut[0]; // Valor único
                const fiscal_responsavel = jsonData.fiscal_responsavel[0]; // Valor único
                const municipio = jsonData.municipio[0]; // Valor único
                const empresa = jsonData.empresa[0]; // Valor único
                const mes_medicao = jsonData.mes_medicao[0]; // Valor único
                const metodo = jsonData.metodo[0]; // Valor único




                // Processa os dados do formulário e os estrutura
                for (let i = 0; i < numItems; i++) {
                    dadosCorretos.push({
                        codigo_propriedade: codigo_propriedade,
                        ui: ui,
                        parcela_t: parcela_t,
                        codigo_ut: codigo_ut,
                        fiscal_responsavel: fiscal_responsavel,
                        municipio: municipio,
                        empresa: empresa,
                        mes_medicao: mes_medicao,
                        metodo: metodo,
                        id_parcela: jsonData["id_parcela[]"][i],
                        fase: jsonData["fase[]"][i],
                        atividades: jsonData["atividades[]"][i],
                        area_medicao_ha: jsonData["area_medicao_ha[]"][i],
                        espacamento: jsonData["espacamento[]"][i],
                        nota: jsonData["nota[]"][i],
                        quantidade: jsonData["quantidade[]"][i],
                        observacao: jsonData["observacao[]"][i],
                    });
                }

                const dadosParaEnviar = [dadosCorretos];

                console.log("Dados a serem enviados:", dadosParaEnviar);

                if (navigator.onLine) {
                    try {
                        const response = await fetch("/sync/", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(dadosParaEnviar),
                        });

                        if (!response.ok) {
                            const errorResponse = await response.json();
                            throw new Error(`Erro na requisição: ${response.statusText}. Detalhes: ${JSON.stringify(errorResponse)}`);
                        }

                        const result = await response.json();
                        console.log("Resposta do servidor:", result);
                        alert("Dados enviados com sucesso!"); // Mensagem de sucesso
                    } catch (error) {
                        console.error("Erro ao enviar dados:", error);
                        alert(`Erro ao enviar os dados: ${error.message}`); // Mensagem de erro
                    }
                } else {
                    try {
                        await saveOfflineData(dadosCorretos);
                        navigator.serviceWorker.ready.then((registration) => {
                            registration.sync.register("sync-offline-forms");
                        });

                        alert("Sem conexão! Seus dados foram salvos e serão sincronizados automaticamente."); // Mensagem de sucesso offline
                    } catch (error) {
                        console.error("Erro ao salvar dados offline:", error);
                        alert("Erro ao salvar os dados offline. Tente novamente."); // Mensagem de erro offline
                    }
                }
            } else {
                console.error("Erro: Nenhum dado de parcela encontrado.");
                alert("Erro: Nenhum dado de parcela encontrado."); // Mensagem de erro
            }
        });
    } else {
        console.error("Erro: O formulário não foi encontrado.");
    }
});

// Função para salvar dados offline no indexedDB
async function saveOfflineData(data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('offlineDataDB', 2);

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

            // Verificar duplicação antes de adicionar
            const getRequest = store.getAll();
            getRequest.onsuccess = () => {
                const existingData = getRequest.result;
                const isDuplicate = existingData.some(item => JSON.stringify(item) === JSON.stringify(data));

                if (!isDuplicate) {
                    const addRequest = store.add(data);
                    addRequest.onsuccess = () => {
                        console.log("Dados salvos offline com sucesso!");
                        resolve();
                    };

                    addRequest.onerror = (event) => {
                        console.error("Erro ao salvar dados offline:", event.target.error);
                        reject(event.target.error);
                    };
                } else {
                    console.log("Os dados já estão no banco de dados, evitando duplicação.");
                    resolve(); // Ignorar a duplicação
                }
            };

            getRequest.onerror = (event) => {
                console.error("Erro ao verificar dados existentes:", event.target.error);
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
async function syncOfflineData() {
    const request = indexedDB.open('offlineDataDB', 2);

    request.onsuccess = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('offlineForms')) {
            console.log("Nenhum dado offline para sincronizar.");
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

                    if (!response.ok) {
                        throw new Error(`Erro na requisição: ${response.statusText}`);
                    }

                    const result = await response.json();
                    console.log("Dados sincronizados com sucesso:", result);

                    // Remover os dados sincronizados do indexedDB
                    const deleteTransaction = db.transaction(['offlineForms'], 'readwrite');
                    const deleteStore = deleteTransaction.objectStore('offlineForms');
                    offlineData.forEach((item) => {
                        deleteStore.delete(item.id);
                    });

                    deleteTransaction.oncomplete = () => {
                        console.log("Dados offline removidos após sincronização.");
                    };

                    deleteTransaction.onerror = (event) => {
                        console.error("Erro ao remover dados sincronizados:", event.target.error);
                    };
                } catch (error) {
                    console.error("Erro ao sincronizar dados offline:", error);
                }
            } else {
                console.log("Nenhum dado offline para sincronizar.");
            }
        };

        getAllRequest.onerror = (event) => {
            console.error("Erro ao recuperar dados offline:", event.target.error);
        };
    };

    request.onerror = (event) => {
        console.error("Erro ao abrir o banco de dados:", event.target.error);
    };
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // Impede que o prompt apareça automaticamente
    deferredPrompt = event; // Salva o evento para uso posterior

    // Mostra um aviso personalizado
    const installAlert = confirm("Deseja instalar o aplicativo Fiscalização PWA?");
    if (installAlert) {
        deferredPrompt.prompt(); // Mostra o prompt de instalação
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Usuário aceitou a instalação');
            } else {
                console.log('Usuário recusou a instalação');
            }
            deferredPrompt = null; // Limpa o evento
        });
    }
});