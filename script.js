/* ==========================================
   1. VARIÁVEIS E CONFIGURAÇÕES GLOBAIS
   ========================================== */
let allFilms = [];           // ARMAZENA TODOS OS FILMES DO CATÁLOGO
let currentFilms = [];       // ARMAZENA OS FILMES FILTRADOS ATUALMENTE
let currentPage = 1;         // PÁGINA ATUAL DA PAGINAÇÃO
let allGenres = [];          // LISTA DE TODOS OS GÊNEROS ÚNICOS
let selectedGenre = ";      // GÊNERO SELECIONADO ATUALMENTE
let debounceTimer;          // TIMER PARA DEBOUNCE DA BUSCA
const itemsPerPage = 20;     // QUANTIDADE DE FILMES POR PÁGINA

/* ==========================================
   2. FUNÇÕES DE UTILIDADE E FORMATAÇÃO (MOVIDAS PARA UTILS.JS)
   ========================================== */

// GERENCIA O CARREGAMENTO DE CAPAS DOS FILMES
function getDvdCover(filmData) {
    const DEFAULT_COVER = 'capas/progbrasil.png';
    
    if (filmData.imageName) {
        // REMOVE EXTENSÃO SE EXISTIR E ADICIONA .JPG
        const baseName = filmData.imageName.replace(/\.(jpg|jpeg|png|gif)$/i, '');
        const imagePath = `capas/${baseName}.jpg`;
        return imagePath;
    }
    
    return DEFAULT_COVER;
}

/* ==========================================
   3. FUNÇÕES DE TRANSFORMAÇÃO E ORDENAÇÃO (TRANSFORMAÇÃO MOVIDA PARA UTILS.JS)
   ========================================== */

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
            // USA FUNÇÃO DE UTILS.JS
            const transformedFilm = transformFilmData(film); 
            
            const matchesSearch = 
                transformedFilm.title.toLowerCase().includes(searchTerm) ||
                (transformedFilm.director && transformedFilm.director.toLowerCase().includes(searchTerm)) ||
                (transformedFilm.cast && transformedFilm.cast.toLowerCase().includes(searchTerm)) ||
                (transformedFilm.synopsis && transformedFilm.synopsis.toLowerCase().includes(searchTerm)) ||
                (transformedFilm.tema && transformedFilm.tema.toLowerCase().includes(searchTerm)) ||
                (transformedFilm.tags && transformedFilm.tags.toLowerCase().includes(searchTerm)) ||
                (transformedFilm.dvd && transformedFilm.dvd.toLowerCase().includes(searchTerm));
            
            const matchesGenre = !selectedGenre || transformedFilm.genre === selectedGenre;
            
            const matchesClassification = !selectedClassification || 
                transformedFilm.classification === parseInt(selectedClassification) ||
                (selectedClassification === 'L' && transformedFilm.classification <= 0);
           
            const matchesAccessibility = !selectedAccessibility || (
                (selectedAccessibility === 'planos_de_aula' && transformedFilm.planos_de_aula && transformedFilm.planos_de_aula.length > 0) ||
                (selectedAccessibility === 'audiodescricao' && transformedFilm.audiodescricao) ||
                (selectedAccessibility === 'closed_caption' && transformedFilm.closedCaption) ||
                (selectedAccessibility === 'trailer' && transformedFilm.trailer && transformedFilm.trailer.trim() !== '') ||
                (selectedAccessibility === 'material_outros' && transformedFilm.materialOutros && transformedFilm.materialOutros.length > 0) ||
                (selectedAccessibility === 'assistir_online' && transformedFilm.assistirOnline && transformedFilm.assistirOnline.trim() !== '') // FILTRO ASSISTIR ONLINE
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
    genreSelect.innerHTML = '<option value="">TODOS OS GÊNEROS</option>';
    allGenres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
    });
    // OS OUTROS SELECTS (CLASSIFICATION, ACCESSIBILITY) SÃO ESTÁTICOS NO HTML
}

// ==========================================
// FUNÇÕES DE RENDERIZAÇÃO PARA O MODAL (USA FUNÇÕES DE UTILS.JS)
// ==========================================
function renderTeachingPlansModal(film, encodedTitle) {
    // CHAMA A FUNÇÃO CENTRALIZADA COM LIMITE 1
    return renderTeachingPlans(film, 1, encodedTitle);
}

function renderOtherMaterialsModal(film, encodedTitle) {
    // CHAMA A FUNÇÃO CENTRALIZADA COM LIMITE 1
    return renderOtherMaterials(film, 1, encodedTitle);
}

/* ==========================================
   6. FUNÇÕES DE RENDERIZAÇÃO DOS FILMES E PAGINAÇÃO
   ========================================== */

// RENDERIZA OS FILMES NA GRADE
function renderFilms() {
    const filmGrid = document.getElementById('filmGrid');
    const loadingMessage = document.getElementById('loadingMessage');
    
    loadingMessage.style.display = 'none';
    filmGrid.innerHTML = ''; // LIMPA A GRADE
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filmsToRender = currentFilms.slice(startIndex, endIndex);
    
    if (filmsToRender.length === 0) {
        filmGrid.innerHTML = '<p class="no-results"><i class="fas fa-film"></i> NENHUM FILME ENCONTRADO COM OS CRITÉRIOS SELECIONADOS.</p>';
        return;
    }
    
    filmsToRender.forEach(film => {
        const filmCard = document.createElement('div');
        filmCard.className = 'film-card';
        
        // USA FUNÇÕES DE UTILS.JS
        const transformedFilm = transformFilmData(film); 
        const classificationClass = getClassificationClass(transformedFilm.classification);
        const classificationText = transformedFilm.classification <= 0 ? 'L' : transformedFilm.classification;
        const coverPath = getDvdCover(transformedFilm);
        
        filmCard.innerHTML = `
            <div class="film-poster-container">
                <img 
                    src="${coverPath}" 
                    alt="CAPA DO FILME ${transformedFilm.title}" 
                    class="film-poster lazy-load" 
                    loading="lazy"
                    onerror="this.onerror=null; this.src='capas/progbrasil.png'; this.classList.add('loaded');"
                    onload="this.classList.add('loaded');"
                >
                <span class="classification ${classificationClass}">${classificationText}</span>
            </div>
            <div class="film-info">
                <h3 class="film-title">${transformedFilm.title}</h3>
                <p class="film-director">${transformedFilm.director || 'DIREÇÃO NÃO INFORMADA'}</p>
                <div class="film-details">
                    <span><i class="fas fa-clock"></i> ${transformedFilm.duration || '?'} MIN</span>
                    <span><i class="fas fa-calendar-alt"></i> ${transformedFilm.year || '?'}</span>
                </div>
            </div>
        `;
        
        filmCard.addEventListener('click', () => openModal(transformedFilm));
        filmGrid.appendChild(filmCard);
    });
}

// RENDERIZA A PAGINAÇÃO
function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; // LIMPA A PAGINAÇÃO
    
    const totalPages = Math.ceil(currentFilms.length / itemsPerPage);
    
    if (totalPages <= 1) return; // NÃO MOSTRA PAGINAÇÃO SE HOUVER APENAS 1 PÁGINA
    
    const maxVisiblePages = 5; 
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // AJUSTA STARTPAGE SE ENDPAGE CHEGAR AO LIMITE
    if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }

    // BOTÃO "PRIMEIRA PÁGINA"
    if (currentPage > 1) {
        const firstButton = document.createElement('button');
        firstButton.innerHTML = '<i class="fas fa-angle-double-left"></i>';
        firstButton.title = "PRIMEIRA PÁGINA";
        firstButton.addEventListener('click', () => {
            currentPage = 1;
            renderFilms();
            renderPagination();
            window.scrollTo(0, 0);
        });
        paginationContainer.appendChild(firstButton);
    }

    // BOTÃO "ANTERIOR"
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<i class="fas fa-angle-left"></i>';
        prevButton.title = "PÁGINA ANTERIOR";
        prevButton.addEventListener('click', () => {
            currentPage--;
            renderFilms();
            renderPagination();
            window.scrollTo(0, 0);
        });
        paginationContainer.appendChild(prevButton);
    }

    // NÚMEROS DAS PÁGINAS
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => {
            currentPage = i;
            renderFilms();
            renderPagination();
            window.scrollTo(0, 0);
        });
        paginationContainer.appendChild(pageButton);
    }

    // BOTÃO "PRÓXIMA"
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '<i class="fas fa-angle-right"></i>';
        nextButton.title = "PRÓXIMA PÁGINA";
        nextButton.addEventListener('click', () => {
            currentPage++;
            renderFilms();
            renderPagination();
            window.scrollTo(0, 0);
        });
        paginationContainer.appendChild(nextButton);
    }

    // BOTÃO "ÚLTIMA PÁGINA"
    if (currentPage < totalPages) {
        const lastButton = document.createElement('button');
        lastButton.innerHTML = '<i class="fas fa-angle-double-right"></i>';
        lastButton.title = "ÚLTIMA PÁGINA";
        lastButton.addEventListener('click', () => {
            currentPage = totalPages;
            renderFilms();
            renderPagination();
            window.scrollTo(0, 0);
        });
        paginationContainer.appendChild(lastButton);
    }
}

/* ==========================================
   7. FUNÇÕES DO MODAL
   ========================================== */

// ABRE O MODAL COM DETALHES DO FILME
function openModal(film) {
    const modal = document.getElementById('filmModal');
    const modalContent = document.getElementById('modalContent');
    
    // USA FUNÇÕES DE UTILS.JS
    const classificationClass = getClassificationClass(film.classification);
    const classificationText = film.classification <= 0 ? 'L' : film.classification;
    const themes = createThemesList(film);
    const coverPath = getDvdCover(film);
    const encodedTitle = encodeURIComponent(film.title);

    modalContent.innerHTML = `
        <span class="close" onclick="closeModal()">&times;</span>
        <div class="modal-poster-container">
            <img src="${coverPath}" alt="CAPA DO FILME ${film.title}" class="modal-poster" onerror="this.onerror=null; this.src='capas/progbrasil.png';">
            <span class="classification ${classificationClass}">${classificationText}</span>
        </div>
        <h2 class="modal-title">${film.title}</h2>
        <div class="modal-details">
            ${film.director ? `<p><strong><i class="fas fa-user"></i> DIREÇÃO:</strong> ${film.director}</p>` : ''}
            ${film.cast ? `<p><strong><i class="fas fa-users"></i> ELENCO:</strong> ${film.cast}</p>` : ''}
            ${film.duration ? `<p><strong><i class="fas fa-clock"></i> DURAÇÃO:</strong> ${film.duration} MIN</p>` : ''}
            ${film.genre ? `<p><strong><i class="fas fa-tag"></i> GÊNERO:</strong> ${film.genre}</p>` : ''}
            ${film.year ? `<p><strong><i class="fas fa-calendar-alt"></i> ANO:</strong> ${film.year}</p>` : ''}
            ${film.imdb.votantes ? `<p><strong><i class="fab fa-imdb"></i> IMDB:</strong> ${film.imdb.votantes}</p>` : ''}
            ${film.country ? `<p><strong><i class="fas fa-globe-americas"></i> PAÍS:</strong> ${film.country}</p>` : ''}
            ${film.state ? `<p><strong><i class="fas fa-map-marker-alt"></i> UF:</strong> ${film.state}</p>` : ''}
            ${film.city ? `<p><strong><i class="fas fa-city"></i> CIDADE:</strong> ${film.city}</p>` : ''}
        </div>
        
        ${film.synopsis ? `
        <div class="modal-synopsis">
            <h3><i class="fas fa-align-left"></i> SINOPSE</h3>
            <p>${film.synopsis}</p>
        </div>` : ''}
        
        ${themes.length > 0 ? `
        <div class="modal-themes">
            <h3><i class="fas fa-tags"></i> TEMAS</h3>
            ${themes.map(theme => `<span class="theme-tag">${theme}</span>`).join('')}
        </div>` : ''}

        ${film.planos_de_aula && film.planos_de_aula.length > 0 ? `
        <div class="modal-teaching-plans">
            <h3><i class="fas fa-chalkboard-teacher"></i> PLANOS DE AULA</h3>
            ${renderTeachingPlansModal(film, encodedTitle)} 
        </div>` : ''}

        ${film.materialOutros && film.materialOutros.length > 0 ? `
        <div class="modal-other-materials">
            <h3><i class="fas fa-file-alt"></i> OUTROS MATERIAIS</h3>
            ${renderOtherMaterialsModal(film, encodedTitle)}
        </div>` : ''}

        <div class="modal-additional">
            <h3><i class="fas fa-info-circle"></i> INFORMAÇÕES ADICIONAIS</h3>
            ${film.audiodescricao ? `<p><strong><i class="fas fa-assistive-listening-systems"></i> AUDIODESCRIÇÃO:</strong> ${film.audiodescricao}</p>` : ''}
            ${film.closedCaption ? `<p><strong><i class="fas fa-closed-captioning"></i> CLOSED CAPTION:</strong> ${film.closedCaption}</p>` : ''}
            ${film.legendasOutras ? `<p><strong><i class="fas fa-language"></i> OUTRAS LEGENDAS:</strong> ${film.legendasOutras}</p>` : ''}
            ${film.website ? `<p><strong><i class="fas fa-globe"></i> WEBSITE:</strong> <a href="${film.website}" target="_blank">${film.website}</a></p>` : ''}
            ${film.assistirOnline ? `<p><strong><i class="fas fa-play-circle"></i> ASSISTIR ONLINE:</strong> <a href="${film.assistirOnline.startsWith('http') ? film.assistirOnline : 'https://' + film.assistirOnline}" target="_blank">LINK</a></p>` : ''}
            ${film.festivais ? `<p><strong><i class="fas fa-ticket-alt"></i> FESTIVAIS:</strong> ${film.festivais.replace(/\n/g, '<br>')}</p>` : ''}
            ${film.premios ? `<p><strong><i class="fas fa-award"></i> PRÊMIOS:</strong> ${film.premios.replace(/\n/g, '<br>')}</p>` : ''}
        </div>

        <div class="modal-actions">
             <a href="filme.html?titulo=${encodedTitle}" class="btn-full-page">
                 <i class="fas fa-external-link-alt"></i> VER PÁGINA COMPLETA
             </a>
        </div>
    `;
    
    modal.style.display = "block";
    // ADICIONA CLASSE PARA ANIMAÇÃO APÓS UM PEQUENO ATRASO
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// FECHA O MODAL
function closeModal() {
    const modal = document.getElementById('filmModal');
    modal.classList.remove('show');
    // ESPERA A ANIMAÇÃO TERMINAR ANTES DE OCULTAR
    setTimeout(() => {
        modal.style.display = "none";
    }, 300); 
}

/* ==========================================
   8. INICIALIZAÇÃO E EVENT LISTENERS
   ========================================== */

// CARREGA OS DADOS DO JSON E INICIALIZA A PÁGINA
async function initializeApp() {
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.style.display = 'block';
    
    try {
        const response = await fetch('catalogo.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // EXTRAI GÊNEROS ÚNICOS E ORDENA
        const genres = new Set();
        allFilms = data.map(film => {
            const transformed = transformFilmData(film); // USA FUNÇÃO DE UTILS.JS
            if (transformed.genre) {
                genres.add(transformed.genre);
            }
            return transformed;
        });
        
        allGenres = [...genres].sort((a, b) => a.localeCompare(b));
        
        initializeFilters();
        filterAndRenderFilms(); // CHAMA A FUNÇÃO INICIAL PARA RENDERIZAR
        
    } catch (error) {
        console.error('ERRO AO CARREGAR O CATÁLOGO:', error);
        loadingMessage.textContent = 'ERRO AO CARREGAR O CATÁLOGO. TENTE RECARREGAR A PÁGINA.';
        loadingMessage.style.color = 'red';
    }
}

// ADICIONA EVENT LISTENERS AOS CONTROLES
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    
    document.getElementById('searchInput').addEventListener('input', filterAndRenderFilms);
    document.getElementById('sortSelect').addEventListener('change', filterAndRenderFilms);
    document.getElementById('genreSelect').addEventListener('change', filterAndRenderFilms);
    document.getElementById('classificationSelect').addEventListener('change', filterAndRenderFilms);
    document.getElementById('accessibilitySelect').addEventListener('change', filterAndRenderFilms);

    // FECHA O MODAL SE CLICAR FORA DO CONTEÚDO
    const modal = document.getElementById('filmModal');
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    // BOTÃO VOLTAR AO TOPO
    const backToTopButton = document.querySelector('.voltar-topo');
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopButton.style.display = 'flex';
            } else {
                backToTopButton.style.display = 'none';
            }
        });
        backToTopButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});

