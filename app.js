
// Variáveis globais
let currentScreen = 'home-screen';
let currentTab = 'client-tab';
let capturedPhotos = [];
let signaturePad;
let cameraStream = null;

// Inicialização do aplicativo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar banco de dados
    initDB().then(() => {
        // Carregar dados iniciais
        loadRecentQuotes();
        loadStatistics();
        
        // Inicializar interface
        initUI();
        
        // Inicializar manipuladores de eventos
        initEventHandlers();
        
        // Inicializar pad de assinatura
        initSignaturePad();
        
        // Mostrar tela inicial
        showScreen('home-screen');
    }).catch(error => {
        showToast('Erro ao inicializar o aplicativo: ' + error.message);
        console.error('Erro ao inicializar o aplicativo:', error);
    });
});

// Inicializar manipuladores de eventos
function initEventHandlers() {
    // Botões de navegação do rodapé
    document.querySelectorAll('.footer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const screen = btn.getAttribute('data-screen');
            showScreen(screen);
        });
    });
    
    // Botão de novo orçamento
    document.getElementById('new-quote-btn').addEventListener('click', () => {
        resetQuoteForm();
        showScreen('new-quote-screen');
    });
    
    // Botão de voltar para a tela inicial
    document.getElementById('back-to-home-btn').addEventListener('click', () => {
        showScreen('home-screen');
    });
    
    // Botão de configurações
    document.getElementById('settings-btn').addEventListener('click', () => {
        showScreen('settings-screen');
    });
    
    // Botão de voltar das configurações
    document.getElementById('settings-back-btn').addEventListener('click', () => {
        showScreen('home-screen');
    });
    
    // Botão de sincronização
    document.getElementById('sync-btn').addEventListener('click', () => {
        syncData();
    });
    
    // Navegação entre abas do formulário de orçamento
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            showTab(tabId);
        });
    });
    
    // Botões de próximo e anterior nas abas
    document.querySelectorAll('.next-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            nextTab();
        });
    });
    
    document.querySelectorAll('.prev-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            prevTab();
        });
    });
    
    // Botões para adicionar serviço e material
    document.getElementById('add-service-btn').addEventListener('click', () => {
        showServiceModal();
    });
    
    document.getElementById('add-material-btn').addEventListener('click', () => {
        showMaterialModal();
    });
    
    // Botões dos modais
    document.getElementById('save-service-btn').addEventListener('click', () => {
        addService();
    });
    
    document.getElementById('cancel-service-btn').addEventListener('click', () => {
        hideServiceModal();
    });
    
    document.getElementById('save-material-btn').addEventListener('click', () => {
        addMaterial();
    });
    
    document.getElementById('cancel-material-btn').addEventListener('click', () => {
        hideMaterialModal();
    });
    
    // Botão para tirar foto
    document.getElementById('take-photo-btn').addEventListener('click', () => {
        takePhoto();
    });
    
    // Botão para limpar assinatura
    document.getElementById('clear-signature-btn').addEventListener('click', () => {
        signaturePad.clear();
    });
    
    // Botão para compartilhar orçamento
    document.getElementById('share-quote-btn').addEventListener('click', () => {
        shareQuote();
    });
    
    // Formulário de orçamento
    document.getElementById('quote-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveQuote();
    });
    
    // Formulário de configurações
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings();
    });
}

// Inicializar pad de assinatura
function initSignaturePad() {
    const canvas = document.getElementById('signature-pad');
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });
    
    // Ajustar tamanho do canvas
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear();
    }
    
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
}

// Mostrar tela específica
function showScreen(screenId) {
    // Ocultar todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar a tela selecionada
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
    
    // Ações específicas para cada tela
    if (screenId === 'new-quote-screen') {
        initCamera();
    } else {
        stopCamera();
    }
}

// Mostrar aba específica no formulário de orçamento
function showTab(tabId) {
    // Ocultar todas as abas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Mostrar a aba selecionada
    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    currentTab = tabId;
    
    // Atualizar resumo se estiver na aba de resumo
    if (tabId === 'summary-tab') {
        updateSummary();
    }
}

// Navegar para a próxima aba
function nextTab() {
    const tabs = ['client-tab', 'services-tab', 'materials-tab', 'photos-tab', 'summary-tab'];
    const currentIndex = tabs.indexOf(currentTab);
    
    if (currentIndex < tabs.length - 1) {
        showTab(tabs[currentIndex + 1]);
    }
}

// Navegar para a aba anterior
function prevTab() {
    const tabs = ['client-tab', 'services-tab', 'materials-tab', 'photos-tab', 'summary-tab'];
    const currentIndex = tabs.indexOf(currentTab);
    
    if (currentIndex > 0) {
        showTab(tabs[currentIndex - 1]);
    }
}

// Mostrar modal para adicionar serviço
function showServiceModal() {
    document.getElementById('service-modal').style.display = 'flex';
}

// Ocultar modal de serviço
function hideServiceModal() {
    document.getElementById('service-modal').style.display = 'none';
    document.getElementById('service-description').value = '';
    document.getElementById('service-quantity').value = '1';
    document.getElementById('service-price').value = '';
}

// Mostrar modal para adicionar material
function showMaterialModal() {
    document.getElementById('material-modal').style.display = 'flex';
}

// Ocultar modal de material
function hideMaterialModal() {
    document.getElementById('material-modal').style.display = 'none';
    document.getElementById('material-description').value = '';
    document.getElementById('material-quantity').value = '1';
    document.getElementById('material-price').value = '';
}

// Adicionar serviço à lista
function addService() {
    const description = document.getElementById('service-description').value;
    const quantity = parseFloat(document.getElementById('service-quantity').value);
    const unit = document.getElementById('service-unit').value;
    const price = parseFloat(document.getElementById('service-price').value);
    
    if (!description || isNaN(quantity) || isNaN(price)) {
        showToast('Preencha todos os campos corretamente');
        return;
    }
    
    const total = quantity * price;
    const servicesList = document.getElementById('services-list');
    const serviceId = 'service-' + Date.now();
    
    const serviceHtml = `
        <div id="${serviceId}" class="item-row">
            <input type="text" value="${description}" readonly>
            <input type="number" value="${quantity}" min="1" style="width: 60px" readonly>
            <input type="text" value="${unit}" style="width: 60px" readonly>
            <input type="number" value="${price.toFixed(2)}" step="0.01" style="width: 100px" readonly>
            <button type="button" class="btn btn-danger" onclick="removeService('${serviceId}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    servicesList.insertAdjacentHTML('beforeend', serviceHtml);
    updateServicesTotal();
    hideServiceModal();
}

// Remover serviço da lista
function removeService(serviceId) {
    document.getElementById(serviceId).remove();
    updateServicesTotal();
}

// Adicionar material à lista
function addMaterial() {
    const description = document.getElementById('material-description').value;
    const quantity = parseFloat(document.getElementById('material-quantity').value);
    const unit = document.getElementById('material-unit').value;
    const price = parseFloat(document.getElementById('material-price').value);
    
    if (!description || isNaN(quantity) || isNaN(price)) {
        showToast('Preencha todos os campos corretamente');
        return;
    }
    
    const total = quantity * price;
    const materialsList = document.getElementById('materials-list');
    const materialId = 'material-' + Date.now();
    
    const materialHtml = `
        <div id="${materialId}" class="item-row">
            <input type="text" value="${description}" readonly>
            <input type="number" value="${quantity}" min="1" style="width: 60px" readonly>
            <input type="text" value="${unit}" style="width: 60px" readonly>
            <input type="number" value="${price.toFixed(2)}" step="0.01" style="width: 100px" readonly>
            <button type="button" class="btn btn-danger" onclick="removeMaterial('${materialId}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    materialsList.insertAdjacentHTML('beforeend', materialHtml);
    updateMaterialsTotal();
    hideMaterialModal();
}

// Remover material da lista
function removeMaterial(materialId) {
    document.getElementById(materialId).remove();
    updateMaterialsTotal();
}

// Atualizar total de serviços
function updateServicesTotal() {
    let total = 0;
    document.querySelectorAll('#services-list .item-row').forEach(row => {
        const quantity = parseFloat(row.querySelectorAll('input')[1].value);
        const price = parseFloat(row.querySelectorAll('input')[3].value);
        total += quantity * price;
    });
    
    document.getElementById('services-total').textContent = `R$ ${total.toFixed(2)}`;
}

// Atualizar total de materiais
function updateMaterialsTotal() {
    let total = 0;
    document.querySelectorAll('#materials-list .item-row').forEach(row => {
        const quantity = parseFloat(row.querySelectorAll('input')[1].value);
        const price = parseFloat(row.querySelectorAll('input')[3].value);
        total += quantity * price;
    });
    
    document.getElementById('materials-total').textContent = `R$ ${total.toFixed(2)}`;
}

// Atualizar resumo do orçamento
function updateSummary() {
    const clientName = document.getElementById('client-name').value;
    document.getElementById('summary-client').textContent = clientName;
    
    // Obter totais
    const servicesTotal = document.getElementById('services-total').textContent;
    const materialsTotal = document.getElementById('materials-total').textContent;
    
    document.getElementById('summary-services-total').textContent = servicesTotal;
    document.getElementById('summary-materials-total').textContent = materialsTotal;
    
    // Calcular total geral
    const servicesValue = parseFloat(servicesTotal.replace('R$ ', '').replace(',', '.'));
    const materialsValue = parseFloat(materialsTotal.replace('R$ ', '').replace(',', '.'));
    const totalValue = servicesValue + materialsValue;
    
    document.getElementById('summary-total').textContent = `R$ ${totalValue.toFixed(2)}`;
}

// Inicializar câmera
function initCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('Câmera não suportada neste dispositivo');
        return;
    }
    
    const constraints = {
        video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };
    
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            const videoElement = document.getElementById('camera-feed');
            videoElement.srcObject = stream;
            cameraStream = stream;
        })
        .catch(error => {
            console.error('Erro ao acessar a câmera:', error);
            showToast('Erro ao acessar a câmera');
        });
}

// Parar câmera
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => {
            track.stop();
        });
        cameraStream = null;
    }
}

// Tirar foto
function takePhoto() {
    if (!cameraStream) {
        showToast('Câmera não está ativa');
        return;
    }
    
    const videoElement = document.getElementById('camera-feed');
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    const photoData = canvas.toDataURL('image/jpeg');
    capturedPhotos.push(photoData);
    
    // Adicionar preview da foto
    const photosPreview = document.getElementById('photos-preview');
    const photoId = 'photo-' + Date.now();
    
    const photoHtml = `
        <div id="${photoId}" class="photo-container">
            <img src="${photoData}" class="photo-preview">
            <button type="button" class="btn btn-danger" onclick="removePhoto('${photoId}', ${capturedPhotos.length - 1})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    photosPreview.insertAdjacentHTML('beforeend', photoHtml);
    showToast('Foto capturada com sucesso');
}

// Remover foto
function removePhoto(photoId, index) {
    document.getElementById(photoId).remove();
    capturedPhotos.splice(index, 1);
}

// Salvar orçamento
function saveQuote() {
    showLoading();
    
    // Validar assinatura
    if (signaturePad.isEmpty()) {
        hideLoading();
        showToast('É necessário a assinatura do cliente');
        return;
    }
    
    // Coletar dados do formulário
    const clientName = document.getElementById('client-name').value;
    const clientPhone = document.getElementById('client-phone').value;
    const clientEmail = document.getElementById('client-email').value;
    const clientAddress = document.getElementById('client-address').value;
    const serviceType = document.getElementById('service-type').value;
    const notes = document.getElementById('notes').value;
    
    // Coletar serviços
    const services = [];
    document.querySelectorAll('#services-list .item-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        services.push({
            description: inputs[0].value,
            quantity: parseFloat(inputs[1].value),
            unit: inputs[2].value,
            price: parseFloat(inputs[3].value)
        });
    });
    
    // Coletar materiais
    const materials = [];
    document.querySelectorAll('#materials-list .item-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        materials.push({
            description: inputs[0].value,
            quantity: parseFloat(inputs[1].value),
            unit: inputs[2].value,
            price: parseFloat(inputs[3].value)
        });
    });
    
    // Obter assinatura
    const signature = signaturePad.toDataURL();
    
    // Criar objeto de orçamento
    const quote = {
        id: 'quote-' + Date.now(),
        date: new Date().toISOString(),
        number: generateQuoteNumber(),
        client: {
            name: clientName,
            phone: clientPhone,
            email: clientEmail,
            address: clientAddress
        },
        serviceType: serviceType,
        services: services,
        materials: materials,
        photos: capturedPhotos,
        notes: notes,
        signature: signature,
        status: 'pending',
        servicesTotal: calculateServicesTotal(),
        materialsTotal: calculateMaterialsTotal(),
        total: calculateServicesTotal() + calculateMaterialsTotal(),
        synced: false
    };
    
    // Salvar no banco de dados
    saveQuoteToDB(quote)
        .then(() => {
            hideLoading();
            showToast('Orçamento salvo com sucesso');
            resetQuoteForm();
            showScreen('home-screen');
            loadRecentQuotes();
            loadStatistics();
        })
        .catch(error => {
            hideLoading();
            showToast('Erro ao salvar orçamento: ' + error.message);
            console.error('Erro ao salvar orçamento:', error);
        });
}

// Gerar número de orçamento
function generateQuoteNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${year}${month}-${random}`;
}

// Calcular total de serviços
function calculateServicesTotal() {
    let total = 0;
    document.querySelectorAll('#services-list .item-row').forEach(row => {
        const quantity = parseFloat(row.querySelectorAll('input')[1].value);
        const price = parseFloat(row.querySelectorAll('input')[3].value);
        total += quantity * price;
    });
    return total;
}

// Calcular total de materiais
function calculateMaterialsTotal() {
    let total = 0;
    document.querySelectorAll('#materials-list .item-row').forEach(row => {
        const quantity = parseFloat(row.querySelectorAll('input')[1].value);
        const price = parseFloat(row.querySelectorAll('input')[3].value);
        total += quantity * price;
    });
    return total;
}

// Resetar formulário de orçamento
function resetQuoteForm() {
    document.getElementById('quote-form').reset();
    document.getElementById('services-list').innerHTML = '';
    document.getElementById('materials-list').innerHTML = '';
    document.getElementById('photos-preview').innerHTML = '';
    document.getElementById('services-total').textContent = 'R$ 0,00';
    document.getElementById('materials-total').textContent = 'R$ 0,00';
    capturedPhotos = [];
    if (signaturePad) {
        signaturePad.clear();
    }
    showTab('client-tab');
}

// Sincronizar dados
function syncData() {
    showLoading();
    
    // Simular sincronização
    setTimeout(() => {
        hideLoading();
        showToast('Dados sincronizados com sucesso');
    }, 2000);
}

// Salvar configurações
function saveSettings() {
    const companyName = document.getElementById('company-name').value;
    const companyPhone = document.getElementById('company-phone').value;
    const companyEmail = document.getElementById('company-email').value;
    const quoteValidity = document.getElementById('quote-validity').value;
    const syncFrequency = document.getElementById('sync-frequency').value;
    
    const settings = {
        companyName,
        companyPhone,
        companyEmail,
        quoteValidity,
        syncFrequency
    };
    
    localStorage.setItem('appSettings', JSON.stringify(settings));
    showToast('Configurações salvas com sucesso');
    showScreen('home-screen');
}

// Compartilhar orçamento
function shareQuote() {
    // Implementação básica de compartilhamento
    if (navigator.share) {
        navigator.share({
            title: 'Orçamento Ferreira Elétrica',
            text: 'Confira o orçamento da Ferreira Elétrica',
            url: window.location.href
        })
        .then(() => console.log('Orçamento compartilhado com sucesso'))
        .catch((error) => console.log('Erro ao compartilhar', error));
    } else {
        showToast('Compartilhamento não suportado neste dispositivo');
    }
}

// Mostrar indicador de carregamento
function showLoading() {
    document.querySelector('.loading').style.display = 'flex';
}

// Ocultar indicador de carregamento
function hideLoading() {
    document.querySelector('.loading').style.display = 'none';
}

// Mostrar mensagem toast
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
