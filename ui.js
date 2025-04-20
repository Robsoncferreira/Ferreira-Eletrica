
// Inicializar interface
function initUI() {
    // Carregar configurações
    loadSettings();
    
    // Preencher dados de exemplo para serviços e materiais
    populateExampleData();
}

// Carregar configurações
function loadSettings() {
    const settingsJson = localStorage.getItem('appSettings');
    if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        
        document.getElementById('company-name').value = settings.companyName || 'Ferreira Elétrica';
        document.getElementById('company-phone').value = settings.companyPhone || '(XX) XXXXX-XXXX';
        document.getElementById('company-email').value = settings.companyEmail || 'contato@ferreiraeletrica.com.br';
        document.getElementById('quote-validity').value = settings.quoteValidity || '15';
        document.getElementById('sync-frequency').value = settings.syncFrequency || 'daily';
    }
}

// Preencher dados de exemplo
function populateExampleData() {
    // Verificar se já existem dados
    const transaction = db.transaction(['services', 'materials'], 'readonly');
    const servicesStore = transaction.objectStore('services');
    const materialsStore = transaction.objectStore('materials');
    
    const servicesRequest = servicesStore.count();
    const materialsRequest = materialsStore.count();
    
    servicesRequest.onsuccess = (event) => {
        if (event.target.result === 0) {
            // Não existem serviços, adicionar exemplos
            addExampleServices();
        }
    };
    
    materialsRequest.onsuccess = (event) => {
        if (event.target.result === 0) {
            // Não existem materiais, adicionar exemplos
            addExampleMaterials();
        }
    };
}

// Adicionar serviços de exemplo
function addExampleServices() {
    const services = [
        {
            id: 'service-1',
            description: 'Instalação de tomada simples',
            unit: 'un',
            price: 85.00,
            category: 'installation'
        },
        {
            id: 'service-2',
            description: 'Instalação de interruptor simples',
            unit: 'un',
            price: 75.00,
            category: 'installation'
        },
        {
            id: 'service-3',
            description: 'Instalação de ponto de iluminação',
            unit: 'un',
            price: 95.00,
            category: 'lighting'
        },
        {
            id: 'service-4',
            description: 'Instalação de quadro de distribuição monofásico',
            unit: 'un',
            price: 350.00,
            category: 'installation'
        },
        {
            id: 'service-5',
            description: 'Passagem de eletrodutos e cabeamento',
            unit: 'm',
            price: 25.00,
            category: 'installation'
        },
        {
            id: 'service-6',
            description: 'Instalação de disjuntores',
            unit: 'un',
            price: 45.00,
            category: 'installation'
        },
        {
            id: 'service-7',
            description: 'Instalação de luminária',
            unit: 'un',
            price: 120.00,
            category: 'lighting'
        },
        {
            id: 'service-8',
            description: 'Instalação de ventilador de teto',
            unit: 'un',
            price: 180.00,
            category: 'installation'
        },
        {
            id: 'service-9',
            description: 'Instalação de sensor de presença',
            unit: 'un',
            price: 110.00,
            category: 'automation'
        },
        {
            id: 'service-10',
            description: 'Manutenção preventiva',
            unit: 'h',
            price: 120.00,
            category: 'maintenance'
        }
    ];
    
    const transaction = db.transaction(['services'], 'readwrite');
    const servicesStore = transaction.objectStore('services');
    
    services.forEach(service => {
        servicesStore.add(service);
    });
}

// Adicionar materiais de exemplo
function addExampleMaterials() {
    const materials = [
        {
            id: 'material-1',
            description: 'Tomada 2P+T 10A',
            unit: 'un',
            price: 12.00,
            category: 'installation'
        },
        {
            id: 'material-2',
            description: 'Interruptor simples',
            unit: 'un',
            price: 10.00,
            category: 'installation'
        },
        {
            id: 'material-3',
            description: 'Cabo flexível 2,5mm²',
            unit: 'm',
            price: 2.50,
            category: 'installation'
        },
        {
            id: 'material-4',
            description: 'Cabo flexível 4,0mm²',
            unit: 'm',
            price: 4.00,
            category: 'installation'
        },
        {
            id: 'material-5',
            description: 'Quadro de distribuição 12 disjuntores',
            unit: 'un',
            price: 120.00,
            category: 'installation'
        },
        {
            id: 'material-6',
            description: 'Disjuntor monopolar 16A',
            unit: 'un',
            price: 15.00,
            category: 'installation'
        },
        {
            id: 'material-7',
            description: 'Disjuntor monopolar 20A',
            unit: 'un',
            price: 15.00,
            category: 'installation'
        },
        {
            id: 'material-8',
            description: 'Eletroduto corrugado 25mm',
            unit: 'm',
            price: 3.50,
            category: 'installation'
        },
        {
            id: 'material-9',
            description: 'Luminária LED sobrepor 18W',
            unit: 'un',
            price: 65.00,
            category: 'lighting'
        },
        {
            id: 'material-10',
            description: 'Sensor de presença',
            unit: 'un',
            price: 45.00,
            category: 'automation'
        }
    ];
    
    const transaction = db.transaction(['materials'], 'readwrite');
    const materialsStore = transaction.objectStore('materials');
    
    materials.forEach(material => {
        materialsStore.add(material);
    });
}

// Carregar orçamentos recentes
function loadRecentQuotes() {
    getRecentQuotes()
        .then(quotes => {
            const recentQuotesElement = document.getElementById('recent-quotes');
            
            if (quotes.length === 0) {
                recentQuotesElement.innerHTML = `
                    <div class="list-item">
                        <div class="list-item-title">Nenhum orçamento encontrado</div>
                    </div>
                `;
                return;
            }
            
            let html = '';
            quotes.forEach(quote => {
                const date = new Date(quote.date).toLocaleDateString('pt-BR');
                const statusClass = getStatusClass(quote.status);
                const statusText = getStatusText(quote.status);
                
                html += `
                    <div class="list-item" data-id="${quote.id}">
                        <div>
                            <div class="list-item-title">${quote.client.name}</div>
                            <div class="list-item-subtitle">${quote.number} - ${date}</div>
                        </div>
                        <div class="list-item-right">
                            <div class="status ${statusClass}">${statusText}</div>
                            <div class="list-item-subtitle">R$ ${quote.total.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            });
            
            recentQuotesElement.innerHTML = html;
            
            // Adicionar evento de clique para ver detalhes
            document.querySelectorAll('#recent-quotes .list-item').forEach(item => {
                item.addEventListener('click', () => {
                    const quoteId = item.getAttribute('data-id');
                    showQuoteDetails(quoteId);
                });
            });
        })
        .catch(error => {
            console.error('Erro ao carregar orçamentos recentes:', error);
            showToast('Erro ao carregar orçamentos recentes');
        });
}

// Carregar estatísticas
function loadStatistics() {
    getQuoteStatistics()
        .then(stats => {
            document.getElementById('pending-count').textContent = stats.pending;
            document.getElementById('approved-count').textContent = stats.approved;
            document.getElementById('conversion-rate').textContent = `${stats.conversionRate}%`;
        })
        .catch(error => {
            console.error('Erro ao carregar estatísticas:', error);
            showToast('Erro ao carregar estatísticas');
        });
}

// Mostrar detalhes do orçamento
function showQuoteDetails(quoteId) {
    showLoading();
    
    getQuoteById(quoteId)
        .then(quote => {
            const quoteDetailsElement = document.getElementById('quote-details');
            
            const date = new Date(quote.date).toLocaleDateString('pt-BR');
            const statusClass = getStatusClass(quote.status);
            const statusText = getStatusText(quote.status);
            
            // Calcular totais
            const servicesTotal = quote.servicesTotal.toFixed(2);
            const materialsTotal = quote.materialsTotal.toFixed(2);
            const total = quote.total.toFixed(2);
            
            // Gerar HTML para serviços
            let servicesHtml = '';
            quote.services.forEach(service => {
                const serviceTotal = (service.quantity * service.price).toFixed(2);
                servicesHtml += `
                    <div class="list-item">
                        <div>
                            <div class="list-item-title">${service.description}</div>
                            <div class="list-item-subtitle">${service.quantity} ${service.unit} x R$ ${service.price.toFixed(2)}</div>
                        </div>
                        <div class="list-item-right">
                            <div>R$ ${serviceTotal}</div>
                        </div>
                    </div>
                `;
            });
            
            // Gerar HTML para materiais
            let materialsHtml = '';
            quote.materials.forEach(material => {
                const materialTotal = (material.quantity * material.price).toFixed(2);
                materialsHtml += `
                    <div class="list-item">
                        <div>
                            <div class="list-item-title">${material.description}</div>
                            <div class="list-item-subtitle">${material.quantity} ${material.unit} x R$ ${material.price.toFixed(2)}</div>
                        </div>
                        <div class="list-item-right">
                            <div>R$ ${materialTotal}</div>
                        </div>
                    </div>
                `;
            });
            
            // Gerar HTML para fotos
            let photosHtml = '';
            if (quote.photos && quote.photos.length > 0) {
                photosHtml = '<div class="card"><div class="card-title">Fotos</div>';
                quote.photos.forEach(photo => {
                    photosHtml += `<img src="${photo}" class="photo-preview">`;
                });
                photosHtml += '</div>';
            }
            
            // Gerar HTML para assinatura
            let signatureHtml = '';
            if (quote.signature) {
                signatureHtml = `
                    <div class="card">
                        <div class="card-title">Assinatura do Cliente</div>
                        <img src="${quote.signature}" class="photo-preview">
                    </div>
                `;
            }
            
            // Montar HTML completo
            const html = `
                <div class="card">
                    <div class="card-title">Informações Gerais</div>
                    <div class="list-item">
                        <div class="list-item-title">Número</div>
                        <div>${quote.number}</div>
                    </div>
                    <div class="list-item">
                        <div class="list-item-title">Data</div>
                        <div>${date}</div>
                    </div>
                    <div class="list-item">
                        <div class="list-item-title">Status</div>
                        <div class="status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="list-item">
                        <div class="list-item-title">Tipo de Serviço</div>
                        <div>${quote.serviceType || 'Não especificado'}</div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">Cliente</div>
                    <div class="list-item">
                        <div class="list-item-title">Nome</div>
                        <div>${quote.client.name}</div>
                    </div>
                    <div class="list-item">
                        <div class="list-item-title">Telefone</div>
                        <div>${quote.client.phone}</div>
                    </div>
                    <div class="list-item">
                        <div class="list-item-title">E-mail</div>
                        <div>${quote.client.email || 'Não informado'}</div>
                    </div>
                    <div class="list-item">
                        <div class="list-item-title">Endereço</div>
                        <div>${quote.client.address}</div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">Serviços</div>
                    ${servicesHtml}
                    <div class="total-row">
                        <div>Total Serviços:</div>
                        <div>R$ ${servicesTotal}</div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">Materiais</div>
                    ${materialsHtml}
                    <div class="total-row">
                        <div>Total Materiais:</div>
                        <div>R$ ${materialsTotal}</div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">Resumo Financeiro</div>
                    <div class="list-item">
                        <div class="list-item-title">Total Serviços</div>
                        <div>R$ ${servicesTotal}</div>
                    </div>
                    <div class="list-item">
                        <div class="list-item-title">Total Materiais</div>
                        <div>R$ ${materialsTotal}</div>
                    </div>
                    <div class="total-row">
                        <div>Total Geral:</div>
                        <div>R$ ${total}</div>
                    </div>
                </div>
                
                ${photosHtml}
                
                ${signatureHtml}
                
                <div class="card">
                    <div class="card-title">Observações</div>
                    <div class="list-item">
                        <div>${quote.notes || 'Nenhuma observação'}</div>
                    </div>
                </div>
                
                <div class="btn-group">
                    <button class="btn btn-success" onclick="updateQuoteStatus('${quote.id}', 'approved')">Aprovar</button>
                    <button class="btn btn-danger" onclick="updateQuoteStatus('${quote.id}', 'rejected')">Recusar</button>
                </div>
            `;
            
            quoteDetailsElement.innerHTML = html;
            hideLoading();
            showScreen('quote-details-screen');
        })
        .catch(error => {
            hideLoading();
            console.error('Erro ao carregar detalhes do orçamento:', error);
            showToast('Erro ao carregar detalhes do orçamento');
        });
}

// Obter classe CSS para status
function getStatusClass(status) {
    switch (status) {
        case 'pending':
            return 'status-pending';
        case 'approved':
            return 'status-approved';
        case 'rejected':
            return 'status-rejected';
        default:
            return '';
    }
}

// Obter texto para status
function getStatusText(status) {
    switch (status) {
        case 'pending':
            return 'Pendente';
        case 'approved':
            return 'Aprovado';
        case 'rejected':
            return 'Recusado';
        default:
            return 'Desconhecido';
    }
}
