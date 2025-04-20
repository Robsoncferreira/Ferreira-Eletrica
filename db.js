
// Banco de dados IndexedDB
let db;

// Inicializar banco de dados
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('OrcamentosDB', 1);
        
        request.onerror = (event) => {
            reject(new Error('Erro ao abrir banco de dados'));
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Criar object store para orçamentos
            if (!db.objectStoreNames.contains('quotes')) {
                const quotesStore = db.createObjectStore('quotes', { keyPath: 'id' });
                quotesStore.createIndex('date', 'date', { unique: false });
                quotesStore.createIndex('status', 'status', { unique: false });
                quotesStore.createIndex('synced', 'synced', { unique: false });
            }
            
            // Criar object store para serviços
            if (!db.objectStoreNames.contains('services')) {
                const servicesStore = db.createObjectStore('services', { keyPath: 'id' });
                servicesStore.createIndex('category', 'category', { unique: false });
            }
            
            // Criar object store para materiais
            if (!db.objectStoreNames.contains('materials')) {
                const materialsStore = db.createObjectStore('materials', { keyPath: 'id' });
                servicesStore.createIndex('category', 'category', { unique: false });
            }
            
            // Criar object store para clientes
            if (!db.objectStoreNames.contains('clients')) {
                const clientsStore = db.createObjectStore('clients', { keyPath: 'id' });
                clientsStore.createIndex('name', 'name', { unique: false });
                clientsStore.createIndex('phone', 'phone', { unique: false });
            }
        };
    });
}

// Salvar orçamento no banco de dados
function saveQuoteToDB(quote) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['quotes'], 'readwrite');
        const quotesStore = transaction.objectStore('quotes');
        
        const request = quotesStore.add(quote);
        
        request.onsuccess = () => {
            // Salvar cliente se não existir
            saveClientIfNotExists(quote.client)
                .then(() => resolve())
                .catch(error => reject(error));
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao salvar orçamento no banco de dados'));
        };
    });
}

// Salvar cliente se não existir
function saveClientIfNotExists(client) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['clients'], 'readwrite');
        const clientsStore = transaction.objectStore('clients');
        
        // Verificar se o cliente já existe
        const index = clientsStore.index('phone');
        const request = index.get(client.phone);
        
        request.onsuccess = (event) => {
            if (!event.target.result) {
                // Cliente não existe, adicionar
                const newClient = {
                    id: 'client-' + Date.now(),
                    name: client.name,
                    phone: client.phone,
                    email: client.email,
                    address: client.address,
                    createdAt: new Date().toISOString()
                };
                
                clientsStore.add(newClient);
            }
            resolve();
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao verificar cliente no banco de dados'));
        };
    });
}

// Obter orçamentos recentes
function getRecentQuotes() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['quotes'], 'readonly');
        const quotesStore = transaction.objectStore('quotes');
        const index = quotesStore.index('date');
        
        const request = index.openCursor(null, 'prev');
        const quotes = [];
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                quotes.push(cursor.value);
                if (quotes.length < 10) {
                    cursor.continue();
                } else {
                    resolve(quotes);
                }
            } else {
                resolve(quotes);
            }
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao obter orçamentos recentes'));
        };
    });
}

// Obter estatísticas de orçamentos
function getQuoteStatistics() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['quotes'], 'readonly');
        const quotesStore = transaction.objectStore('quotes');
        
        const request = quotesStore.getAll();
        
        request.onsuccess = (event) => {
            const quotes = event.target.result;
            
            // Calcular estatísticas
            const pendingQuotes = quotes.filter(quote => quote.status === 'pending');
            const approvedQuotes = quotes.filter(quote => quote.status === 'approved');
            const rejectedQuotes = quotes.filter(quote => quote.status === 'rejected');
            
            const conversionRate = quotes.length > 0 
                ? (approvedQuotes.length / quotes.length * 100).toFixed(1) 
                : 0;
            
            resolve({
                total: quotes.length,
                pending: pendingQuotes.length,
                approved: approvedQuotes.length,
                rejected: rejectedQuotes.length,
                conversionRate: conversionRate
            });
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao obter estatísticas de orçamentos'));
        };
    });
}

// Obter orçamento por ID
function getQuoteById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['quotes'], 'readonly');
        const quotesStore = transaction.objectStore('quotes');
        
        const request = quotesStore.get(id);
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao obter orçamento'));
        };
    });
}

// Atualizar status do orçamento
function updateQuoteStatus(id, status) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['quotes'], 'readwrite');
        const quotesStore = transaction.objectStore('quotes');
        
        const request = quotesStore.get(id);
        
        request.onsuccess = (event) => {
            const quote = event.target.result;
            if (quote) {
                quote.status = status;
                quote.synced = false;
                
                const updateRequest = quotesStore.put(quote);
                
                updateRequest.onsuccess = () => {
                    resolve();
                };
                
                updateRequest.onerror = () => {
                    reject(new Error('Erro ao atualizar status do orçamento'));
                };
            } else {
                reject(new Error('Orçamento não encontrado'));
            }
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao obter orçamento para atualização'));
        };
    });
}

// Excluir orçamento
function deleteQuote(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['quotes'], 'readwrite');
        const quotesStore = transaction.objectStore('quotes');
        
        const request = quotesStore.delete(id);
        
        request.onsuccess = () => {
            resolve();
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao excluir orçamento'));
        };
    });
}

// Obter orçamentos não sincronizados
function getUnsyncedQuotes() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['quotes'], 'readonly');
        const quotesStore = transaction.objectStore('quotes');
        const index = quotesStore.index('synced');
        
        const request = index.getAll(false);
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao obter orçamentos não sincronizados'));
        };
    });
}

// Marcar orçamento como sincronizado
function markQuoteAsSynced(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['quotes'], 'readwrite');
        const quotesStore = transaction.objectStore('quotes');
        
        const request = quotesStore.get(id);
        
        request.onsuccess = (event) => {
            const quote = event.target.result;
            if (quote) {
                quote.synced = true;
                
                const updateRequest = quotesStore.put(quote);
                
                updateRequest.onsuccess = () => {
                    resolve();
                };
                
                updateRequest.onerror = () => {
                    reject(new Error('Erro ao marcar orçamento como sincronizado'));
                };
            } else {
                reject(new Error('Orçamento não encontrado'));
            }
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao obter orçamento para sincronização'));
        };
    });
}

// Adicionar serviço ao banco de dados
function addServiceToDB(service) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['services'], 'readwrite');
        const servicesStore = transaction.objectStore('services');
        
        const request = servicesStore.add(service);
        
        request.onsuccess = () => {
            resolve();
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao adicionar serviço ao banco de dados'));
        };
    });
}

// Obter serviços por categoria
function getServicesByCategory(category) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['services'], 'readonly');
        const servicesStore = transaction.objectStore('services');
        const index = servicesStore.index('category');
        
        const request = index.getAll(category);
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao obter serviços por categoria'));
        };
    });
}

// Adicionar material ao banco de dados
function addMaterialToDB(material) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['materials'], 'readwrite');
        const materialsStore = transaction.objectStore('materials');
        
        const request = materialsStore.add(material);
        
        request.onsuccess = () => {
            resolve();
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao adicionar material ao banco de dados'));
        };
    });
}

// Obter materiais por categoria
function getMaterialsByCategory(category) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['materials'], 'readonly');
        const materialsStore = transaction.objectStore('materials');
        const index = materialsStore.index('category');
        
        const request = index.getAll(category);
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao obter materiais por categoria'));
        };
    });
}

// Obter todos os clientes
function getAllClients() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['clients'], 'readonly');
        const clientsStore = transaction.objectStore('clients');
        
        const request = clientsStore.getAll();
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onerror = () => {
            reject(new Error('Erro ao obter todos os clientes'));
        };
    });
}

// Limpar todos os dados (para testes)
function clearAllData() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['quotes', 'services', 'materials', 'clients'], 'readwrite');
        
        transaction.objectStore('quotes').clear();
        transaction.objectStore('services').clear();
        transaction.objectStore('materials').clear();
        transaction.objectStore('clients').clear();
        
        transaction.oncomplete = () => {
            resolve();
        };
        
        transaction.onerror = () => {
            reject(new Error('Erro ao limpar todos os dados'));
        };
    });
}
