/* ==========================================
   1. VARIÁVEIS E CONFIGURAÇÕES GLOBAIS
   ========================================== */
let allFilms = [];           // ARMAZENA TODOS OS FILMES DO CATÁLOGO
let currentFilms = [];       // ARMAZENA OS FILMES FILTRADOS ATUALMENTE
let currentPage = 1;         // PÁGINA ATUAL DA PAGINAÇÃO
let allGenres = [];          // LISTA DE TODOS OS GÊNEROS ÚNICOS
let selectedGenre = '';      // GÊNERO SELECIONADO ATUALMENTE
let debounceTimer;          // TIMER PARA DEBOUNCE DA BUSCA
const itemsPerPage = 20;     // QUANTIDADE DE FILMES POR PÁGINA

/* ==========================================
   2. FUNÇÕES DE UTILIDADE E FORMATAÇÃO
   ========================================== */

// LIMPA E FORMATA CAMPOS DE TEXTO
function cleanField(value) {
    if (!value) return '';
    // Remove aspas extras no início/fim e espaços em branco
    return String(value).replace(/^"|"$/g, '').trim(); 
}

// OBTÉM A CLASSE CSS PARA CLASSIFICAÇÃO INDICATIVA
function getClassificationClass(age) {
    if (!age || age <= 0) return 'L';
    
    const ageNum = typeof age === 'string' ? parseInt(age) : age;
    
    switch(ageNum) {
        case 10: return 'ten';
        case 12: return 'twelve';
        case 14: return 'fourteen';
        case 16: return 'sixteen';
        case 18: return 'eighteen';
        default: return 'L';
    }
}

// GERENCIA O CARREGAMENTO DE CAPAS DOS FILMES
function getDvdCover(filmData) {
    const DEFAULT_COVER = 'capas/progbrasil.png';
    
    if (filmData.imageName) {
        const baseName = filmData.imageName.replace(/\.(jpg|jpeg|png|gif)$/i, '');
        const imagePath = `capas/${baseName}.jpg`;
        return imagePath;
    }
    
    return DEFAULT_COVER;
}

/* ==========================================
   3. FUNÇÕES DE TRANSFORMAÇÃO E ORDENAÇÃO
   ========================================== */

// TRANSFORMA DADOS DO JSON PARA O FORMATO DESEJADO
function transformFilmData(originalFilm) {
    // TRATAMENTO ESPECIAL PARA NOTA IMDB
    let imdbData = { votantes: '' };
    if (originalFilm["nota imdb/votantes"]) {
        const [nota, votantes] = String(originalFilm["nota imdb/votantes"]).split('/');
        imdbData = { votantes: `${nota}/${votantes || ''}`.trim() };
    }
    
    return {
        title: cleanField(originalFilm["Título do filme"]),
        director: cleanField(originalFilm["Direção"]),
        cast: cleanField(originalFilm["Elenco"]),
        duration: parseInt(originalFilm["Dur.(´)"]) || 0,
        genre: cleanField(originalFilm["GEN."]),
        year: parseInt(originalFilm["Ano"]) || 0,
        imdb: imdbData,
        country: cleanField(originalFilm["País"]),
        state: cleanField(originalFilm["UF"]),
        city: cleanField(originalFilm["cidade"]),
        audiodescricao: cleanField(originalFilm["Audiodescrição"]),
        closedCaption: cleanField(originalFilm["Closed Caption"]),
        trailer: cleanField(originalFilm["trailer"] || ''),
        synopsis: cleanField(originalFilm["Sinopse"]),
        tema: cleanField(originalFilm["tema (Programadora Brasil)"]),
        tags: cleanField(originalFilm["tags"]),
        website: cleanField(originalFilm["website"]),
        assistirOnline: cleanField(originalFilm["Assistir Online"] || ''), // Campo renomeado
        festivais: cleanField(originalFilm["festivais"]),
        premios: cleanField(originalFilm["premios"]),
        legendasOutras: cleanField(originalFilm["legendas_outras"]),
        materialOutros: (() => {
            const material = originalFilm["material_outros"];
            if (!material) return [];
            if (typeof material === 'string') {
                return [{ tipo: material, titulo: material, url: '#' }];
            }
            return Array.isArray(material) ? material : [];
        })(),
        duracaoFormato: cleanField(originalFilm["duracao FORMATO"]),
        pgm: parseInt(originalFilm["PGM"]) || 0,
        filmes: parseInt(originalFilm["Filmes"]) || 0,
        dvd: cleanField(originalFilm["Nome do Programa"]),
        imageName: cleanField(originalFilm["imageName"]),
        classification: parseInt(originalFilm["Classificação Indicativa POR PGM"]) || 0,
        planos_de_aula: originalFilm["planos_de_aula"] || [],
        videos: originalFilm["videos"] || []
    };
}

// ORDENAÇÃO DOS FILMES
function sortFilms(films, sortOption) {
    const sortedFilms = [...films];
    
    switch(sortOption) {
        case 'title-asc':
            sortedFilms.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            sortedFilms.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'year-asc':
            sortedFilms.sort((a, b) => a.year - b.year);
            break;
        case 'year-desc':
            sortedFilms.sort((a, b) => b.year - a.year);
            break;
        case 'duration-asc':
            sortedFilms.sort((a, b) => a.duration - b.duration);
            break;
        case 'duration-desc':
            sortedFilms.sort((a, b) => b.duration - a.duration);
            break;
    }
    
    return sortedFilms;
}

/* ==========================================
   4. FUNÇÕES DE FILTRO E BUSCA
   ========================================== */

// FILTRA E RENDERIZA OS FILMES COM DEBOUNCE
function filterAndRenderFilms() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const sortOption = document.getElementById('sortSelect').value;
        const selectedClassification = document.getElementById('classificationSelect').value;
        const selectedGenre = document.getElementById('genreSelect').value;
        const selectedAccessibility = document.getElementById('accessibilitySelect').value;
        
        currentFilms = allFilms.filter(film => {
            const matchesSearch = 
                film.title.toLowerCase().includes(searchTerm) ||
                (film.director && film.director.toLowerCase().includes(searchTerm)) ||
                (film.cast && film.cast.toLowerCase().includes(searchTerm)) ||
                (film.synopsis && film.synopsis.toLowerCase().includes(searchTerm)) ||
                (film.tema && film.tema.toLowerCase().includes(searchTerm)) ||
                (film.tags && film.tags.toLowerCase().includes(searchTerm)) ||
                (film.dvd && film.dvd.toLowerCase().includes(searchTerm));
            
            const matchesGenre = !selectedGenre || film.genre === selectedGenre;
            
            const matchesClassification = !selectedClassification || 
                film.classification === parseInt(selectedClassification) ||
                (selectedClassification === 'L' && film.classification <= 0);
           
            const matchesAccessibility = !selectedAccessibility || (
                (selectedAccessibility === 'planos_de_aula' && film.planos_de_aula && film.planos_de_aula.length > 0) ||
                (selectedAccessibility === 'audiodescricao' && film.audiodescricao) ||
                (selectedAccessibility === 'closed_caption' && film.closedCaption) ||
                (selectedAccessibility === 'trailer' && film.trailer && film.trailer.trim() !== '') ||
                (selectedAccessibility === 'material_outros' && film.materialOutros && film.materialOutros.length > 0) ||
                (selectedAccessibility === 'assistir_online' && film.assistirOnline && film.assistirOnline.trim() !== '') // Filtro Assistir Online
            );
            
            return matchesSearch && matchesGenre && matchesClassification && matchesAccessibility;
        });

        updateFilmsCounter();
        currentFilms = sortFilms(currentFilms, sortOption);
        
        currentPage = 1;
        renderPagination();
        renderFilms();
    }, 300);
}

/* ==========================================
   5. FUNÇÕES DE RENDERIZAÇÃO DA INTERFACE
   ========================================== */

// ATUALIZA O CONTADOR DE FILMES
function updateFilmsCounter() {
    const countElement = document.getElementById('filmsCount');
    const counterContainer = document.querySelector('.results-counter');
    
    countElement.classList.add('updated');
    setTimeout(() => {
        countElement.classList.remove('updated');
    }, 300);

    countElement.textContent = currentFilms.length;
    
    if (currentFilms.length === 0) {
        counterContainer.classList.add('sem-resultados');
        counterContainer.classList.remove('com-resultados');
    } else {
        counterContainer.classList.add('com-resultados');
        counterContainer.classList.remove('sem-resultados');
    }
}

// INICIALIZA OS SELECTS DE FILTRO
function initializeFilters() {
    const genreSelect = document.getElementById('genreSelect');
    genreSelect.innerHTML = '<option value="">Todos os Gêneros</option>';
    allGenres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
    });
    // Os outros selects (classification, accessibility) são estáticos no HTML
}

// CRIA LISTA DE TEMAS
function createThemesList(film) {
    const themes = [
        film.tema,
        ...(film.tags ? film.tags.split(' ') : [])
    ];
    return [...new Set(themes.filter(t => t))];
}

// ==========================================
// FUNÇÕES DE RENDERIZAÇÃO PARA PÁGINA DO FILME (filme.js)
// ==========================================
// Estas funções são definidas aqui para referência, mas usadas principalmente em filme.js
function renderTeachingPlans(film) { // Versão completa
    if (!film.planos_de_aula || film.planos_de_aula.length === 0) {
        return '<p><i class="fas fa-info-circle"></i> Nenhum plano de aula disponível.</p>';
    }
    return film.planos_de_aula.map(plano => `
        <div class="teaching-plan-card">
            <p><strong><i class="fas fa-graduation-cap"></i> Nível de Ensino:</strong> ${plano.nivel_ensino || ''}</p>
            <p><strong><i class="fas fa-book"></i> Área de Conhecimento:</strong> ${plano.area_conhecimento || ''}</p>
            <p><strong><i class="fas fa-globe"></i> Site:</strong> <a href="${plano.url}" target="_blank">${plano.site}</a></p>
            <p><strong><i class="fas fa-info-circle"></i> Descrição:</strong> ${plano.descricao || ''}</p>
        </div>
    `).join('');
}

function renderOtherMaterials(film) { // Versão completa
    if (!film.materialOutros || film.materialOutros.length === 0) {
        return '<p><i class="fas fa-info-circle"></i> Nenhum material adicional disponível.</p>';
    }
    return film.materialOutros.map(material => `
        <div class="other-material-card">
            <p><strong><i class="fas fa-bookmark"></i> Tipo:</strong> ${material.tipo || ''}</p>
            <p><strong><i class="fas fa-file-alt"></i> Título:</strong> <a href="${material.url}" target="_blank">${material.titulo}</a></p>
        </div>
    `).join('');
}

// ==========================================
// FUNÇÕES DE RENDERIZAÇÃO PARA O MODAL (script.js)
// ==========================================
function renderTeachingPlansModal(film, encodedTitle) { // Versão limitada para o modal
    if (!film.planos_de_aula || film.planos_de_aula.length === 0) {
        return '<p><i class="fas fa-info-circle"></i> Nenhum plano de aula disponível.</p>';
    }

    const firstPlan = film.planos_de_aula[0];
    let html = `
        <div class="teaching-plan-card">
            <p><strong><i class="fas fa-graduation-cap"></i> Nível de Ensino:</strong> ${firstPlan.nivel_ensino || ''}</p>
            <p><strong><i class="fas fa-book"></i> Área de Conhecimento:</strong> ${firstPlan.area_conhecimento || ''}</p>
            <p><strong><i class="fas fa-globe"></i> Site:</strong> <a href="${firstPlan.url}" target="_blank">${firstPlan.site}</a></p>
            <p><strong><i class="fas fa-info-circle"></i> Descrição:</strong> ${firstPlan.descricao || ''}</p>
        </div>
    `;

    if (film.planos_de_aula.length > 1) {
        const remainingCount = film.planos_de_aula.length - 1;
        html += `
            <a href="filme.html?titulo=${encodedTitle}" class="btn-ver-mais">
                +${remainingCount} Resultados
            </a>
        `;
    }

    return html;
}

function renderOtherMaterialsModal(film, encodedTitle) { // Versão limitada para o modal
    if (!film.materialOutros || film.materialOutros.length === 0) {
        return '<p><i class="fas fa-info-circle"></i> Nenhum material adicional disponível.</p>';
    }

    const firstMaterial = film.materialOutros[0];
    let html = `
        <div class="other-material-card">
            <p><strong><i class="fas fa-bookmark"></i> Tipo:</strong> ${firstMaterial.tipo || ''}</p>
            <p><strong><i class="fas fa-file-alt"></i> Título:</strong> <a href="${firstMaterial.url}" target="_blank">${firstMaterial.titulo}</a></p>
        </div>
    `;

    if (film.materialOutros.length > 1) {
        const remainingCount = film.materialOutros.length - 1;
        html += `
            <a href="filme.html?titulo=${encodedTitle}" class="btn-ver-mais">
                +${remainingCount} Resultados
            </a>
        `;
    }

    return html;
}

/* ==========================================
   6. FUNÇÕES DE RENDERIZAÇÃO DOS FILMES E PAGINAÇÃO
   ========================================== */

// RENDERIZA OS FILMES NA GRADE
function renderFilms() {
    const filmGrid = document.getElementById('filmGrid');
    const loadingMessage = document.getElementById('loadingMessage');
    
    loadingMessage.style.display = 'none';
    filmGrid.innerHTML = ''; // Limpa a grade
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filmsToRender = currentFilms.slice(startIndex, endIndex);
    
    if (filmsToRender.length === 0) {
        filmGrid.innerHTML = '<p class="no-results">Nenhum filme encontrado com os critérios selecionados.</p>';
        return;
    }
    
    filmsToRender.forEach(film => {
        const filmCard = document.createElement('div');
        filmCard.className = 'film-card';
        
        const classificationClass = getClassificationClass(film.classification);
        const classificationText = film.classification <= 0 ? 'L' : film.classification;
        const coverPath = getDvdCover(film);
        
        filmCard.innerHTML = `
            <div class="film-poster-container">
                <img 
                    src="${coverPath}" 
                    alt="Capa do filme ${film.title}" 
                    class="film-poster" 
                    onerror="this.onerror=null; this.src='capas/progbrasil.png';"
                >
                <span class="classification ${classificationClass}">${classificationText}</span>
            </div>
            <div class="film-info">
                <h3 class="film-title">${film.title}</h3>
                <p class="film-director">${film.director || 'Direção não informada'}</p>
                <div class="film-details">
                    <span><i class="fas fa-clock"></i> ${film.duration || '?'} min</span>
                    <span><i class="fas fa-calendar-alt"></i> ${film.year || '?'}</span>
                </div>
            </div>
        `;
        
        filmCard.addEventListener('click', () => openModal(film));
        filmGrid.appendChild(filmCard);
    });
}

// RENDERIZA A PAGINAÇÃO
function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; // Limpa a paginação
    
    const totalPages = Math.ceil(currentFilms.length / itemsPerPage);
    
    if (totalPages <= 1) return; // Não mostra paginação se houver apenas 1 página
    
    const maxVisiblePages = 5; 
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }
    
    // Botão Primeira Página
    if (currentPage > 1) {
        paginationContainer.appendChild(createPageButton('<i class="fas fa-angle-double-left"></i>', 1, 'Primeira Página'));
    }
    
    // Botão Anterior
    if (currentPage > 1) {
        paginationContainer.appendChild(createPageButton('<i class="fas fa-angle-left"></i>', currentPage - 1, 'Página Anterior'));
    }
    
    // Botões Numéricos
    for (let i = startPage; i <= endPage; i++) {
        paginationContainer.appendChild(createPageButton(i, i));
    }
    
    // Botão Próxima
    if (currentPage < totalPages) {
        paginationContainer.appendChild(createPageButton('<i class="fas fa-angle-right"></i>', currentPage + 1, 'Próxima Página'));
    }
    
    // Botão Última Página
    if (currentPage < totalPages) {
        paginationContainer.appendChild(createPageButton('<i class="fas fa-angle-double-right"></i>', totalPages, 'Última Página'));
    }
}

// Função auxiliar para criar botões de paginação
function createPageButton(content, pageNumber, title = '') {
    const button = document.createElement('button');
    button.innerHTML = content;
    if (title) button.title = title;
    if (pageNumber === currentPage && typeof content === 'number') {
        button.classList.add('active');
    }
    button.addEventListener('click', () => {
        currentPage = pageNumber;
        renderFilms();
        renderPagination();
        window.scrollTo(0, 0); // Rola para o topo
    });
    return button;
}

/* ==========================================
   7. FUNÇÕES DO MODAL
   ========================================== */

// ABRE O MODAL COM DETALHES DO FILME
function openModal(film) {
    const modal = document.getElementById('filmModal');
    const modalContent = document.getElementById('modalContent');
    
    const classificationClass = getClassificationClass(film.classification);
    const classificationText = film.classification <= 0 ? 'L' : film.classification;
    const coverPath = getDvdCover(film);
    const encodedTitle = encodeURIComponent(film.title);
    
    const themes = createThemesList(film);
    const hasThemes = themes.length > 0;
    
    // Verifica informações adicionais (EXCLUINDO Assistir Online, Planos e Materiais)
    const hasAdditionalInfo = film.audiodescricao || film.closedCaption || film.website || 
                            film.festivais || film.premios || film.legendasOutras;

    modalContent.innerHTML = `
        <div class="modal-header">
            <div class="modal-poster-container">
                <img 
                    src="${coverPath}" 
                    alt="Capa do filme ${film.title}" 
                    class="modal-poster" 
                    onerror="this.onerror=null; this.src='capas/progbrasil.png';"
                >
                <span class="classification ${classificationClass}">${classificationText}</span>
            </div>
        </div>
        <h2 class="modal-title">${film.title}</h2>
        <div class="modal-details">
            ${film.director ? `<p><strong><i class="fas fa-user"></i> Direção:</strong> ${film.director}</p>` : ''}
            ${film.cast ? `<p><strong><i class="fas fa-users"></i> Elenco:</strong> ${film.cast}</p>` : ''}
            ${film.duration ? `<p><strong><i class="fas fa-clock"></i> Duração:</strong> ${film.duration} min</p>` : ''}
            ${film.genre ? `<p><strong><i class="fas fa-tag"></i> Gênero:</strong> ${film.genre}</p>` : ''}
            ${film.year ? `<p><strong><i class="fas fa-calendar-alt"></i> Ano:</strong> ${film.year}</p>` : ''}
            ${film.imdb.votantes ? `<p><strong><i class="fab fa-imdb"></i> IMDb:</strong> ${film.imdb.votantes}</p>` : ''}
            ${film.country ? `<p><strong><i class="fas fa-globe-americas"></i> País:</strong> ${film.country}</p>` : ''}
            ${film.state ? `<p><strong><i class="fas fa-map-marker-alt"></i> UF:</strong> ${film.state}</p>` : ''}
            ${film.dvd ? `<p><strong><i class="fas fa-compact-disc"></i> DVD:</strong> ${film.dvd}</p>` : ''}
        </div>
        
        ${hasThemes ? `
        <div class="modal-themes">
            <h3><i class="fas fa-tags"></i> Temas</h3>
            ${themes.map(theme => `<span class="theme-tag">${theme}</span>`).join('')}
        </div>
        ` : ''}
        
        ${film.synopsis ? `
        <div class="modal-synopsis">
            <h3><i class="fas fa-align-left"></i> Sinopse</h3>
            <p>${film.synopsis}</p>
        </div>
        ` : ''}
        
        ${hasAdditionalInfo ? `
        <div class="modal-additional">
            <h3><i class="fas fa-info-circle"></i> Informações Adicionais</h3>
            ${film.audiodescricao ? `<p><strong><i class="fas fa-assistive-listening-systems"></i> Audiodescrição:</strong> ${film.audiodescricao}</p>` : ''}
            ${film.closedCaption ? `<p><strong><i class="fas fa-closed-captioning"></i> Closed Caption:</strong> ${film.closedCaption}</p>` : ''}
            ${film.website ? `<p><strong><i class="fas fa-globe"></i> Website:</strong> <a href="${film.website.startsWith('http') ? film.website : 'https://' + film.website}" target="_blank">${film.website}</a></p>` : ''}
            ${film.festivais ? `<p><strong><i class="fas fa-trophy"></i> Festivais:</strong> ${film.festivais}</p>` : ''}
            ${film.premios ? `<p><strong><i class="fas fa-award"></i> Prêmios:</strong> ${film.premios}</p>` : ''}
            ${film.legendasOutras ? `<p><strong><i class="fas fa-language"></i> Outras Legendas:</strong> ${film.legendasOutras}</p>` : ''}
        </div>
        ` : ''}

        <!-- Bloco dos Outros Materiais (Modal) -->
        <div class="modal-other-materials">
            <h3><i class="fas fa-box-open"></i> Outros Materiais</h3>
            ${renderOtherMaterialsModal(film, encodedTitle)} <!-- Chama a função correta -->
        </div>

        <!-- Bloco dos Planos de Aula (Modal) -->
        <div class="modal-teaching-plans">
            <h3><i class="fas fa-chalkboard-teacher"></i> Planos de Aula</h3>
            ${renderTeachingPlansModal(film, encodedTitle)} <!-- Chama a função correta -->
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSdxQz8onMOFjxIqEPpo5v2I4CJdLQ9cN50I7zUhmnBwgUeGIQ/viewform?usp=sharing&ouid=101786859238464224020" target="_blank" class="btn-enviar-plano" style="display:inline-block; margin-top:15px; background:#009a44; color:#fff; padding:10px 18px; border-radius:6px; text-decoration:none; font-weight:500;">
                <i class="fas fa-plus"></i> Envie um plano de aula
            </a>
            <p style="font-size: 0.95em; color: #666; margin-top: 6px;">
                Você pode colaborar enviando um plano de aula para este filme. Ao clicar, você será direcionado a um formulário.
            </p>
        </div>
        
        <!-- Botão para página exclusiva do filme -->
        <div style="text-align: center; margin-top: 20px;">
            <a href="filme.html?titulo=${encodedTitle}" class="btn-enviar-plano" style="display:inline-block; background:#009a44; color:#fff; padding:12px 25px; border-radius:6px; text-decoration:none; font-weight:500;">
                <i class="fas fa-external-link-alt"></i> Ver página completa do filme
            </a>
        </div>
    `;
    
    const closeButton = modalContent.parentNode.querySelector('.close');
    if (closeButton) {
        closeButton.onclick = closeModal;
    }
    
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    document.addEventListener('keydown', handleKeyDown);
    
    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }
}

// FECHA O MODAL
function closeModal() {
    const modal = document.getElementById('filmModal');
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    
    document.removeEventListener('keydown', handleKeyDown);
    window.onclick = null; 
}

// HANDLER PARA TECLA ESC
function handleKeyDown(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
}

/* ==========================================
   8. FUNÇÕES DE CARREGAMENTO INICIAL
   ========================================== */

// CARREGA O CATÁLOGO E INICIALIZA A APLICAÇÃO
async function initializeApp() {
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.style.display = 'flex';
    
    try {
        const response = await fetch('catalogo.json');
        if (!response.ok) {
            throw new Error(`Erro ao carregar catalogo.json: ${response.statusText}`);
        }
        const data = await response.json();
        
        allFilms = data.map(transformFilmData);
        allGenres = [...new Set(allFilms.map(film => film.genre).filter(genre => genre))].sort();
        
        initializeFilters();
        filterAndRenderFilms(); // Chama a função que atualiza contador, ordena e renderiza
        
    } catch (error) {
        console.error("Erro ao inicializar:", error);
        const filmGrid = document.getElementById('filmGrid');
        if (filmGrid) { // Verifica se o elemento existe
             filmGrid.innerHTML = `<p class="error-message">Falha ao carregar o catálogo de filmes. Tente recarregar a página.</p>`;
        }
        loadingMessage.style.display = 'none';
    }
}

/* ==========================================
   9. EVENT LISTENERS
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    
    document.getElementById('searchInput').addEventListener('input', filterAndRenderFilms);
    document.getElementById('sortSelect').addEventListener('change', filterAndRenderFilms);
    document.getElementById('classificationSelect').addEventListener('change', filterAndRenderFilms);
    document.getElementById('genreSelect').addEventListener('change', filterAndRenderFilms);
    document.getElementById('accessibilitySelect').addEventListener('change', filterAndRenderFilms);

    // MODAL FALE CONOSCO
    const btnFaleConosco = document.getElementById('btnFaleConosco');
    const modalFaleConosco = document.getElementById('modalFaleConosco');
    const closeFaleConosco = modalFaleConosco.querySelector('.close');

    btnFaleConosco.onclick = () => {
        modalFaleConosco.style.display = 'block';
        setTimeout(() => modalFaleConosco.classList.add('show'), 10);
    }

    closeFaleConosco.onclick = () => {
        modalFaleConosco.classList.remove('show');
        setTimeout(() => modalFaleConosco.style.display = 'none', 300);
    }

    window.onclick = (event) => {
        // Fecha modal Fale Conosco se clicar fora
        if (event.target == modalFaleConosco) {
            modalFaleConosco.classList.remove('show');
            setTimeout(() => modalFaleConosco.style.display = 'none', 300);
        }
        // Fecha modal do Filme se clicar fora (se estiver aberto)
        const filmModal = document.getElementById('filmModal');
        if (filmModal && event.target == filmModal) {
            closeModal();
        }
    }
});

