// Arquivo para gerenciar URLs amigáveis
// Este script deve ser incluído antes do filme.js

// Função para extrair parâmetros da URL
function getUrlParams() {
    // Verifica se há parâmetros na query string (formato ?titulo=nome-do-filme)
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }
    
    return params;
}

// Função para gerar URL amigável (desativada para compatibilidade com GitHub Pages)
function generateFriendlyUrl(title) {
    // Retorna apenas o formato de query string para compatibilidade com GitHub Pages
    if (!title) return '';
    return `?titulo=${encodeURIComponent(title)}`;
}

// Função de redirecionamento (desativada para evitar erros 404)
function redirectToFriendlyUrl() {
    // Função desativada para evitar problemas com GitHub Pages
    // Não faz nada para garantir compatibilidade
    return;
}

// Não executa o redirecionamento para evitar erros 404
// document.addEventListener('DOMContentLoaded', redirectToFriendlyUrl);
