// app.js ou indexeddb.js
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/static/sw.js").then((registration) => {
            console.log("Service Worker registrado com sucesso!", registration);
        }).catch((error) => {
            console.log("Falha ao registrar o Service Worker:", error);
        });
    });
}

window.addEventListener("online", () => {
    console.log("Você está online!");
    syncOfflineData(); // Tenta sincronizar os dados armazenados offline
});

window.addEventListener("offline", () => {
    console.log("Você está offline!");
});

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("meu-formulario");
    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            const jsonData = Object.fromEntries(formData.entries());

            if (navigator.onLine) {
                try {
                    const response = await fetch("/sync/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify([jsonData]),
                    });

                    if (response.ok) {
                        window.location.href = "/formulario/";
                    } else {
                        alert("Erro ao enviar os dados. Tente novamente.");
                    }
                } catch (error) {
                    alert("Erro de conexão com o servidor.");
                }
            } else {
                await saveOfflineData(jsonData);
                navigator.serviceWorker.ready.then((registration) => {
                    registration.sync.register("sync-offline-forms");
                });

                alert("Sem conexão! Seus dados foram salvos e serão sincronizados automaticamente.");
                window.location.href = "/formulario/";
            }
        });
    } else {
        console.error("Erro: O formulário não foi encontrado.");
    }
});

async function saveOfflineData(data) {
    const db = await openIndexedDB();
    const transaction = db.transaction(['offlineForms'], 'readwrite');
    const store = transaction.objectStore('offlineForms');
    store.add(data);
}