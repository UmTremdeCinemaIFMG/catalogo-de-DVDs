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
    return String(value).replace(/^\"|\"$/g, '').trim();
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
    console.log("Buscando capa para:", filmData.imageName);
    const DEFAULT_COVER = 'capas/progbrasil.png';
    
    if (filmData.imageName) {
        const baseName = filmData.imageName.replace(/\.(jpg|jpeg|png|gif)$/i, '');
        const imagePath = `capas/${baseName}.jpg`;
        console.log("Tentando carregar:", imagePath);
        return imagePath;
    }
    
    return DEFAULT_COVER;
}

/* ==========================================
   3. FUNÇÕES DE TRANSFORMAÇÃO E ORDENAÇÃO
   ========================================== */

// TRANSFORMA DADOS DO JSON PARA O FORMATO DESEJADO
function transformFilmData(originalFilm) {
    console.log("Original imageName:", originalFilm["imageName"]);
    
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
        assistirOnline: cleanField(originalFilm["Assistir Online"] || ''),
        festivais: cleanField(originalFilm["festivais"]),
        premios: cleanField(originalFilm["premios"]),
        legendasOutras: cleanField(originalFilm["legendas_outras"]),
        materialOutros: (() => {
            const material = originalFilm["material_outros"];
            if (!material) return [];
            if (typeof material === 'string') {
                // Converte string em um objeto no formato esperado
                return [{
                    tipo: material,
                    titulo: material,
                    url: '#'
                }];
            }
            // Se já for array, retorna como está
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
        
        // APLICA TODOS OS FILTROS
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
                film.classification === parseInt(selectedClassifi                            const matchesAccessibility = !selectedAccessibility || (
                                (selectedAccessibility === 'planos_de_aula' && film.planos_de_aula && film.planos_de_aula.length > 0) ||
                                (selectedAccessibility === 'audiodescricao' && film.audiodescricao) ||
                                (selectedAccessibility === 'closed_caption' && film.closedCaption) ||
                                (selectedAccessibility === 'trailer' && film.trailer && film.trailer.trim() !== '') ||
                                (selectedAccessibility === 'material_outros' && film.materialOutros && film.materialOutros.length > 0) ||
                                (selectedAccessibility === 'assistir_online' && film.assistirOnline && film.assistirOnline.trim() !== '') // Nova condição
                            );eturn matchesSearch && matchesGenre && matchesClassification && matchesAccessibility;
        });

        // ATUALIZA CONTADOR E APLICA ORDENAÇÃO
        updateFilmsCounter();
        currentFilms = sortFilms(currentFilms, sortOption);
        
        // RESETA PAGINAÇÃO E RENDERIZA
        currentPage = 1;        // Reseta para a primeira página
        renderPagination();     // Atualiza a paginação
        renderFilms();         // Renderiza os filmes
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
    // PREENCHE O SELECT DE GÊNEROS
    const genreSelect = document.getElementById('genreSelect');
    genreSelect.innerHTML = '<option value="">Todos os Gêneros</option>';
    allGenres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
    });

    // PREENCHE O SELECT DE CLASSIFICAÇÃO
    const classificationSelect = document.getElementById('classificationSelect');
    classificationSelect.innerHTML = `
        <option value="">Todas as Classificações</option>
        <option value="L">Livre</option>
        <option value="10">10 anos</option>
        <option value="12">12 anos</option>
        <option value="14">14 anos</option>
        <option value="16">16 anos</option>
        <option value="18">18 anos</option>
    `;
}

// CRIA CONTROLES DE NAVEGAÇÃO PARA IMAGENS
function createImageControls(container, image) {
    const controls = document.createElement('div');
    controls.className = container.classList.contains('modal-poster-container') ? 
        'modal-poster-controls' : 'film-poster-controls';
    
    const leftButton = document.createElement('button');
    leftButton.className = container.classList.contains('modal-poster-container') ? 
        'modal-poster-control' : 'film-poster-control';
    leftButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    leftButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentTransform = image.style.transform || 'translateX(0)';
        const currentX = parseInt(currentTransform.match(/translateX\(([-\d]+)px\)/)?.[1] || 0);
        const newX = Math.min(currentX + 100, 0);
        image.style.transform = `translateX(${newX}px)`;
    });
    
    const rightButton = document.createElement('button');
    rightButton.className = container.classList.contains('modal-poster-container') ? 
        'modal-poster-control' : 'film-poster-control';
    rightButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    rightButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentTransform = image.style.transform || 'translateX(0)';
        const currentX = parseInt(currentTransform.match(/translateX\(([-\d]+)px\)/)?.[1] || 0);
        const containerWidth = container.clientWidth;
        const imageWidth = image.clientWidth;
        const maxX = containerWidth - imageWidth;
        const newX = Math.max(currentX - 100, maxX);
        image.style.transform = `translateX(${newX}px)`;
    });
    
    controls.appendChild(leftButton);
    controls.appendChild(rightButton);
    container.appendChild(controls);
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
// FUNÇÃO DE RENDERIZAÇÃO DOS PLANOS DE AULA (COMPLETO - USADO EM filme.js)
// ==========================================
function renderTeachingPlans(film) {
    // Se não houver campo ou for vazio, retorna mensagem padrão
    if (!film.planos_de_aula || film.planos_de_aula.length === 0) {
        return '<p><i class="fas fa-info-circle"></i> Nenhum plano de aula disponível.</p>';
    }
    // Monta o HTML para cada plano de aula
    return film.planos_de_aula.map(plano => `
        <div class="teaching-plan-card">
            <p><strong><i class="fas fa-graduation-cap"></i> Nível de Ensino:</strong> ${plano.nivel_ensino || ''}</p>
            <p><strong><i class="fas fa-book"></i> Área de Conhecimento:</strong> ${plano.area_conhecimento || ''}</p>
            <p><strong><i class="fas fa-globe"></i> Site:</strong> <a href="${plano.url}" target="_blank">${plano.site}</a></p>
            <p><strong><i class="fas fa-info-circle"></i> Descrição:</strong> ${plano.descricao || ''}</p>
        </div>
    `).join('');
}

// ==========================================
// FUNÇÃO DE RENDERIZAÇÃO DE OUTROS MATERIAIS (COMPLETO - USADO EM filme.js)
// ==========================================
function renderOtherMaterials(film) {
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
// FUNÇÃO DE RENDERIZAÇÃO DOS PLANOS DE AULA (MODAL - LIMITADO A 1 + BOTÃO)
// ==========================================
function renderTeachingPlansModal(film, encodedTitle) {
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
                +${remainingCount} mais
            </a>
        `;
    }

    return html;
}

// ==========================================
// FUNÇÃO DE RENDERIZAÇÃO DE OUTROS MATERIAIS (MODAL - LIMITADO A 1 + BOTÃO)
// ==========================================
function renderOtherMaterialsModal(film, encodedTitle) {
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
                +${remainingCount} mais
            </a>
        `;
    }

    return html;
}

/* ==========================================
   6. FUNÇÕES DE RENDERIZAÇÃO DOS FILMES
   ========================================== */

// RENDERIZA OS CARDS DOS FILMES NA PÁGINA
function renderFilms() {
    const filmsGrid = document.getElementById('filmsGrid');
    filmsGrid.innerHTML = ''; // Limpa a grade antes de renderizar
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filmsToRender = currentFilms.slice(startIndex, endIndex);
    
    if (filmsToRender.length === 0) {
        filmsGrid.innerHTML = '<p class="no-results">Nenhum filme encontrado com os critérios selecionados.</p>';
        return;
    }
    
    filmsToRender.forEach(film => {
        const classification = film.classification || 0;
        const classificationClass = getClassificationClass(classification);
        const classificationText = classification <= 0 ? 'L' : classification;
        
        const filmCard = document.createElement('div');
        filmCard.className = 'film-card';
        filmCard.innerHTML = `
            <div class="film-poster-container">
                <img src="${getDvdCover(film)}" alt="${film.title}" class="film-poster" loading="lazy" onerror="this.src='capas/progbrasil.png'">
                <span class="classification ${classificationClass}">${classificationText}</span>
            </div>
            <div class="film-info">
                <h3 class="film-title">${film.title}</h3>
                <p class="film-director">${film.director || 'Diretor não informado'}</p>
            </div>
        `;
        
        filmCard.addEventListener('click', () => openModal(film));
        filmsGrid.appendChild(filmCard);
    });
}

/* ==========================================
   7. FUNÇÕES DO MODAL
   ========================================== */

// ABRE O MODAL COM ANIMAÇÃO
function openModal(film) {
    const modal = document.getElementById('filmModal');
    const modalContent = document.getElementById('modalContent');
    
    const classification = film.classification || 0;
    const classificationClass = getClassificationClass(classification);
    const classificationText = classification <= 0 ? 'L' : classification;
    
    const themes = createThemesList(film);
    const hasThemes = themes.length > 0;
    
    const hasAdditionalInfo = film.audiodescricao || film.closedCaption || film.website || 
                            film.assistirOnline || film.festivais || film.premios || 
                            film.legendasOutras || (film.materialOutros && film.materialOutros.length > 0);
    
    // Codifica o título do filme para uso na URL
    const encodedTitle = encodeURIComponent(film.title);
    
    modalContent.innerHTML = `
        <div class="modal-poster-container">
            <img src="${getDvdCover(film)}" alt="${film.title}" class="modal-poster" onerror="this.src='capas/progbrasil.png'">
        </div>
        <h2 class="modal-title">
            <span class="classification ${classificationClass}">${classificationText}</span>
            ${film.title}
        </h2>
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
            ${film.closedCaption ? `<p><strong><i class="fas fa-closed-captioning"></i> Closed Caption:</strong> ${film.closedCap            ${film.website ? `<p><strong><i class="fas fa-globe"></i> Website:</strong> <a href="${film.website.startsWith('http') ? film.website : 'https://' + film.website}" target="_blank">${film.website}</a></p>` : ''}
            ${film.festivais ? `<p><strong><i class="fas fa-trophy"></i> Festivais:</strong> ${film.festivais}</p>` : ''}
            ${film.premios ? `<p><strong><i class="fas fa-award"></i> Prêmios:</strong> ${film.premios}</p>` : ''}
            ${film.legendasOutras ? `<p><strong><i class="fas fa-language"></i> Outras Legendas:</strong> ${film.legendasOutras}</p>` : ''}tros Materiais (Modal) -->
            <div class="modal-other-materials">
                <h3><i class="fas fa-box-open"></i> Outros Materiais</h3>
                ${renderOtherMaterialsModal(film, encodedTitle)}
            </div>
        </div>
        ` : ''}

        <!-- Bloco dos Planos de Aula (Modal) -->
        <div class="modal-teaching-plans">
            <h3><i class="fas fa-chalkboard-teacher"></i> Planos de Aula</h3>
            ${renderTeachingPlansModal(film, encodedTitle)}
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
    
    const modalPosterContainer = modalContent.querySelector('.modal-poster-container');
    const modalPoster = modalContent.querySelector('.modal-poster');
    if (modalPosterContainer && modalPoster) {
        createImageControls(modalPosterContainer, modalPoster);
    }
    
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    document.addEventListener('keydown', handleKeyDown);
}

// FECHA O MODAL
function closeModal() {
    const modal = document.getElementById('filmModal');
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    
    document.removeEventListener('keydown', handleKeyDown);
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

// CARREGA OS DADOS DO CATÁLOGO
async function loadCatalogData() {
    try {
        const response = await fetch('catalogo.json');
        if (!response.ok) {
            throw new Error(`Erro ao carregar o catálogo: ${response.statusText}`);
        }
        const data = await response.json();
        
        allFilms = data.map(transformFilmData);
        allGenres = [...new Set(allFilms.map(film => film.genre).filter(genre => genre))].sort();
        
        initializeFilters();
        filterAndRenderFilms(); // Renderiza inicialmente
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        const filmsGrid = document.getElementById('filmsGrid');
        filmsGrid.innerHTML = `<p class="error-message">Falha ao carregar o catálogo de filmes. Tente recarregar a página. Detalhes: ${error.message}</p>`;
    }
}

/* ==========================================
   9. INICIALIZAÇÃO E EVENTOS
   ========================================== */

// CONFIGURA TODOS OS EVENT LISTENERS
function setupEventListeners() {
    // EVENTOS DE BUSCA E FILTROS
    document.getElementById('searchInput').addEventListener('input', filterAndRenderFilms);
    document.getElementById('genreSelect').addEventListener('change', filterAndRenderFilms);
    document.getElementById('classificationSelect').addEventListener('change', filterAndRenderFilms);
    document.getElementById('sortSelect').addEventListener('change', filterAndRenderFilms);
    document.getElementById('accessibilitySelect').addEventListener('change', filterAndRenderFilms);
    
    // EVENTOS DO MODAL
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('filmModal')) {
            closeModal();
        }
    });
    
    // EVENTO DO FOOTER
    document.querySelector('footer').addEventListener('click', function() {
        window.open('https://umtremdecinema.wixsite.com/umtremdecinema', '_blank');
    });

    // EVENTOS DO FALE CONOSCO
    const modalFaleConosco = document.getElementById("modalFaleConosco");
    const btnFaleConosco = document.getElementById("btnFaleConosco");
    const spanCloseFeedback = modalFaleConosco.querySelector(".close");

    // Abre o modal do Fale Conosco
    btnFaleConosco.addEventListener('click', function() {
        modalFaleConosco.style.display = "block";
    });

    // Fecha o modal do Fale Conosco ao clicar no X
    spanCloseFeedback.addEventListener('click', function() {
        modalFaleConosco.style.display = "none";
    });

    // Fecha o modal do Fale Conosco ao clicar fora dele
    window.addEventListener('click', function(event) {
        if (event.target == modalFaleConosco) {
            modalFaleConosco.style.display = "none";
        }
    });           
}

// INICIALIZAÇÃO DA APLICAÇÃO
window.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadCatalogData();
});

/* ==========================================
   10. FUNÇÕES DE PAGINAÇÃO
   ========================================== */

// RENDERIZA A PAGINAÇÃO
function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    const totalPages = Math.ceil(currentFilms.length / itemsPerPage);
    if (totalPages <= 1) return;
    
    // BOTÃO ANTERIOR
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i> Anterior';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderFilms();
            renderPagination();
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    });
    pagination.appendChild(prevButton);
    
    // PÁGINAS
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // PRIMEIRA PÁGINA
    if (startPage > 1) {
        const firstButton = document.createElement('button');
        firstButton.textContent = '1';
        firstButton.addEventListener('click', () => {
            currentPage = 1;
            renderFilms();
            renderPagination();
            window.scrollTo({top: 0, behavior: 'smooth'});
        });
        pagination.appendChild(firstButton);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
    }
    
    // PÁGINAS INTERMEDIÁRIAS
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
            window.scrollTo({top: 0, behavior: 'smooth'});
        });
        pagination.appendChild(pageButton);
    }
    
    // ÚLTIMA PÁGINA
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
        
        const lastButton = document.createElement('button');
        lastButton.textContent = totalPages;
        lastButton.addEventListener('click', () => {
            currentPage = totalPages;
            renderFilms();
            renderPagination();
            window.scrollTo({top: 0, behavior: 'smooth'});
        });
        pagination.appendChild(lastButton);
    }
    
    // BOTÃO PRÓXIMO
    const nextButton = document.createElement('button');
    nextButton.innerHTML = 'Próximo <i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderFilms();
            renderPagination();
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    });
    pagination.appendChild(nextButton);
}

