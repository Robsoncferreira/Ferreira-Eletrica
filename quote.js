
// Atualizar status do orçamento
function updateQuoteStatus(quoteId, status) {
    showLoading();
    
    updateQuoteStatus(quoteId, status)
        .then(() => {
            hideLoading();
            showToast(`Orçamento ${getStatusText(status)} com sucesso`);
            showScreen('home-screen');
            loadRecentQuotes();
            loadStatistics();
        })
        .catch(error => {
            hideLoading();
            console.error('Erro ao atualizar status do orçamento:', error);
            showToast('Erro ao atualizar status do orçamento');
        });
}
