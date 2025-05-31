// ===========================
// SCRIPT PARA PÁGINA DE FILME
// ===========================

// VARIÁVEIS GLOBAIS ESPECÍFICAS DA PÁGINA
let currentSlide = 0;
let slides = [];
let mediaItems = [];
let shareUrl = window.location.href; // URL PARA COMPARTILHAMENTO
let shareText = "; // TEXTO PARA COMPARTILHAMENTO

// FUNÇÃO PARA OBTER PARÂMETROS DA URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// FUNÇÃO PARA CARREGAR DADOS DO FILME
async function loadFilmData() {
    try {
        // EXIBE MENSAGEM DE CARREGAMENTO
        const loadingElement = document.querySelector(".loading");
        if (loadingElement) {
            loadingElement.style.display = "flex";
        }
        
        // OBTÉM O TÍTULO DO FILME DA URL
        const filmTitle = getUrlParameter("titulo");
        if (!filmTitle) {
            throw new Error("TÍTULO DO FILME NÃO ESPECIFICADO NA URL");
        }
        
        console.log("BUSCANDO FILME COM TÍTULO:", decodeURIComponent(filmTitle));
        
        // CARREGA O CATÁLOGO
        const response = await fetch("catalogo.json");
        if (!response.ok) {
            throw new Error("ERRO AO CARREGAR O CATÁLOGO");
        }
        
        const data = await response.json();
        console.log("CATÁLOGO CARREGADO, TOTAL DE FILMES:", data.length);
        
        // BUSCA O FILME PELO TÍTULO - MELHORADA PARA NORMALIZAR STRINGS
        const normalizedSearchTitle = decodeURIComponent(filmTitle).toLowerCase().trim();
        console.log("TÍTULO NORMALIZADO PARA BUSCA:", normalizedSearchTitle);
        
        // USA A FUNÇÃO transformFilmData DE UTILS.JS IMPLICITAMENTE AO COMPARAR
        const filmData = data.find(item => {
            const tempTransformed = transformFilmData(item); // USA FUNÇÃO GLOBAL
            return tempTransformed.title.toLowerCase().trim() === normalizedSearchTitle;
        });
        
        if (!filmData) {
            console.error("FILME NÃO ENCONTRADO. TÍTULOS DISPONÍVEIS:", 
                data.slice(0, 10).map(f => f["Título do filme"]));
            throw new Error(`FILME "${decodeURIComponent(filmTitle)}" NÃO ENCONTRADO NO CATÁLOGO`);
        }
        
        console.log("FILME ENCONTRADO:", filmData["Título do filme"]);
        
        // TRANSFORMA OS DADOS DO FILME USANDO A FUNÇÃO GLOBAL
        const transformedFilm = transformFilmData(filmData); 
        console.log("DADOS TRANSFORMADOS:", transformedFilm);
        
        // RENDERIZA OS DADOS DO FILME
        renderFilmData(transformedFilm);
        
        // OCULTA MENSAGEM DE CARREGAMENTO
        if (loadingElement) {
            loadingElement.style.display = "none";
        }
        
        // CONFIGURA EVENTOS PARA EXPANDIR/RECOLHER PLANOS DE AULA
        setupExpandableContent();
        
        // INICIALIZA O CARROSSEL
        initializeCarousel(transformedFilm);
        
        // CONFIGURA COMPARTILHAMENTO
        setupSharingButtons(transformedFilm);
        
    } catch (error) {
        console.error("ERRO:", error);
        const filmContainer = document.getElementById("filmeContainer");
        if (filmContainer) {
            filmContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>ERRO AO CARREGAR DADOS DO FILME</p>
                    <p>${error.message}</p>
                    <a href="index.html" class="btn-voltar">
                        <i class="fas fa-arrow-left"></i> VOLTAR PARA O CATÁLOGO
                    </a>
                </div>
            `;
        }
    }
}

// FUNÇÃO PARA RENDERIZAR DADOS DO FILME NA PÁGINA
function renderFilmData(film) {
    const filmContainer = document.getElementById("filmeContainer");
    if (!filmContainer) {
        console.error("CONTAINER DO FILME NÃO ENCONTRADO");
        return;
    }
    
    // USA FUNÇÕES GLOBAIS DE UTILS.JS
    const classificationClass = getClassificationClass(film.classification);
    const classificationText = film.classification <= 0 ? "L" : film.classification;
    const themes = createThemesList(film);
    const hasThemes = themes.length > 0;
    
    // VERIFICA SE HÁ INFORMAÇÕES ADICIONAIS
    const hasAdditionalInfo = film.audiodescricao || film.closedCaption || film.website || 
                            film.assistirOnline || film.festivais || film.premios || 
                            film.legendasOutras || (film.materialOutros && film.materialOutros.length > 0);
    
    // HEADER DO FILME
    const filmHeader = document.createElement("div");
    filmHeader.className = "filme-header";
    filmHeader.innerHTML = `
        <div class="filme-info">
            <h1 class="filme-title">
                <span class="classification ${classificationClass}">${classificationText}</span>
                ${film.title}
            </h1>
            <div class="filme-details">
                ${film.director ? `<p><strong><i class="fas fa-user"></i> DIREÇÃO:</strong> ${film.director}</p>` : ""}
                ${film.cast ? `<p><strong><i class="fas fa-users"></i> ELENCO:</strong> ${film.cast}</p>` : ""}
                ${film.duration ? `<p><strong><i class="fas fa-clock"></i> DURAÇÃO:</strong> ${film.duration} MIN</p>` : ""}
                ${film.genre ? `<p><strong><i class="fas fa-tag"></i> GÊNERO:</strong> ${film.genre}</p>` : ""}
                ${film.year ? `<p><strong><i class="fas fa-calendar-alt"></i> ANO:</strong> ${film.year}</p>` : ""}
                ${film.imdb.votantes ? `<p><strong><i class="fab fa-imdb"></i> IMDB:</strong> ${film.imdb.votantes}</p>` : ""}
                ${film.country ? `<p><strong><i class="fas fa-globe-americas"></i> PAÍS:</strong> ${film.country}</p>` : ""}
                ${film.state ? `<p><strong><i class="fas fa-map-marker-alt"></i> UF:</strong> ${film.state}</p>` : ""}
                ${film.city ? `<p><strong><i class="fas fa-city"></i> CIDADE:</strong> ${film.city}</p>` : ""}
            </div>
            
            <!-- BOTÕES DE COMPARTILHAMENTO -->
            <div class="social-share-container">
                <div class="social-share-title">COMPARTILHAR:</div>
                <div class="social-share-buttons">
                    <button class="social-share-button whatsapp" title="COMPARTILHAR NO WHATSAPP" onclick="shareOnWhatsApp()">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button class="social-share-button facebook" title="COMPARTILHAR NO FACEBOOK" onclick="shareOnFacebook()">
                        <i class="fab fa-facebook-f"></i>
                    </button>
                    <button class="social-share-button twitter" title="COMPARTILHAR NO X (TWITTER)" onclick="shareOnTwitter()">
                        <i class="fab fa-twitter"></i>
                    </button>
                    <button class="social-share-button copy" title="COPIAR LINK" onclick="copyToClipboard()">
                        <i class="fas fa-link"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // CONTEÚDO PRINCIPAL DO FILME (SINOPSE, TEMAS, ETC.)
    let filmContent = "";
    if (film.synopsis) {
        filmContent += `
        <div class="filme-section">
            <h3><i class="fas fa-align-left"></i> SINOPSE</h3>
            <p>${film.synopsis}</p>
        </div>
        `;
    }
    
    if (hasThemes) {
        filmContent += `
        <div class="filme-section">
            <h3><i class="fas fa-tags"></i> TEMAS</h3>
            ${themes.map(theme => `<span class="theme-tag">${theme}</span>`).join("")}
        </div>
        `;
    }
    
    // RENDERIZA PLANOS DE AULA USANDO FUNÇÃO GLOBAL (SEM LIMITE)
    if (film.planos_de_aula && film.planos_de_aula.length > 0) {
        filmContent += `
        <div class="filme-section">
            <h3><i class="fas fa-chalkboard-teacher"></i> PLANOS DE AULA</h3>
            ${renderTeachingPlans(film)} 
        </div>
        `;
    }
    
    if (film.festivais) {
        filmContent += `
        <div class="filme-section">
            <h3><i class="fas fa-ticket-alt"></i> FESTIVAIS</h3>
            <p>${film.festivais.replace(/\n/g, "<br>")}</p>
        </div>
        `;
    }
    
    if (film.premios) {
        filmContent += `
        <div class="filme-section">
            <h3><i class="fas fa-award"></i> PRÊMIOS</h3>
            <p>${film.premios.replace(/\n/g, "<br>")}</p>
        </div>
        `;
    }
    
    // RENDERIZA OUTROS MATERIAIS USANDO FUNÇÃO GLOBAL (SEM LIMITE)
    if (film.materialOutros && film.materialOutros.length > 0) {
        filmContent += `
        <div class="filme-section">
            <h3><i class="fas fa-file-alt"></i> OUTROS MATERIAIS</h3>
            ${renderOtherMaterials(film)}
        </div>
        `;
    }
    
    // INFORMAÇÕES ADICIONAIS
    if (hasAdditionalInfo) {
        let additionalContent = "";
        if (film.audiodescricao) additionalContent += `<p><strong><i class="fas fa-assistive-listening-systems"></i> AUDIODESCRIÇÃO:</strong> ${film.audiodescricao}</p>`;
        if (film.closedCaption) additionalContent += `<p><strong><i class="fas fa-closed-captioning"></i> CLOSED CAPTION:</strong> ${film.closedCaption}</p>`;
        if (film.legendasOutras) additionalContent += `<p><strong><i class="fas fa-language"></i> OUTRAS LEGENDAS:</strong> ${film.legendasOutras}</p>`;
        if (film.website) additionalContent += `<p><strong><i class="fas fa-globe"></i> WEBSITE:</strong> <a href="${film.website}" target="_blank">${film.website}</a></p>`;
        
        if (additionalContent) {
            filmContent += `
            <div class="filme-section">
                <h3><i class="fas fa-info-circle"></i> INFORMAÇÕES ADICIONAIS</h3>
                ${additionalContent}
            </div>
            `;
        }
    }
    
    // ADICIONA O CONTEÚDO AO CONTAINER PRINCIPAL
    filmContainer.innerHTML = `
        <!-- BANNER COM CARROSSEL -->
        <div class="banner-carrossel">
            <div class="banner-slides" id="bannerSlides"></div>
            <div class="banner-controls">
                <button class="banner-control" id="prevSlide">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="banner-control" id="nextSlide">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="banner-indicators" id="bannerIndicators"></div>
        </div>
        
        ${filmHeader.outerHTML}
        ${filmContent}
    `;

    // ADICIONA O BOTÃO "ASSISTIR ONLINE" SE EXISTIR O LINK
    const controlsContainer = document.querySelector(".filme-page-controls");
    if (controlsContainer && film.assistirOnline && film.assistirOnline.trim() !== "") {
        const assistirOnlineBtn = document.createElement("a");
        assistirOnlineBtn.href = film.assistirOnline.startsWith("http") ? film.assistirOnline : "https://" + film.assistirOnline;
        assistirOnlineBtn.target = "_blank";
        assistirOnlineBtn.className = "btn-assistir-online";
        assistirOnlineBtn.innerHTML = `ASSISTIR ONLINE <i class="fas fa-external-link-alt"></i>`; // ÍCONE ALTERADO
        // INSERE ANTES DO BOTÃO VOLTAR, SE EXISTIR
        const voltarBtn = controlsContainer.querySelector(".btn-voltar");
        if (voltarBtn) {
            controlsContainer.insertBefore(assistirOnlineBtn, voltarBtn);
        } else {
            controlsContainer.appendChild(assistirOnlineBtn);
        }
    }
}

// FUNÇÃO PARA INICIALIZAR O CARROSSEL DE MÍDIAS
function initializeCarousel(film) {
    const slidesContainer = document.getElementById("bannerSlides");
    const indicatorsContainer = document.getElementById("bannerIndicators");
    
    if (!slidesContainer || !indicatorsContainer) {
        console.error("CONTAINERS DO CARROSSEL NÃO ENCONTRADOS");
        return;
    }
    
    // PREPARA OS ITENS DE MÍDIA PARA O CARROSSEL
    mediaItems = [];
    
    // 1. ADICIONA O TRAILER PRIMEIRO (SE EXISTIR)
    if (film.trailer && film.trailer.trim() !== "") {
        mediaItems.push({
            type: "video",
            url: film.trailer,
            title: "TRAILER"
        });
    }
    
    // 2. ADICIONA OUTROS VÍDEOS (SE EXISTIREM)
    if (film.videos && film.videos.length > 0) {
        film.videos.forEach(video => {
            mediaItems.push({
                type: "video",
                url: video.url,
                title: video.titulo || "VÍDEO"
            });
        });
    }
    
    // 3. ADICIONA A CAPA DO FILME
    mediaItems.push({
        type: "image",
        url: `capas/${film.imageName || "progbrasil"}.jpg`,
        title: "CAPA DO FILME"
    });
    
    // 4. ADICIONA IMAGENS ADICIONAIS (SE EXISTIREM)
    if (film.imagens_adicionais && film.imagens_adicionais.length > 0) {
        film.imagens_adicionais.forEach(imagem => {
            mediaItems.push({
                type: "image",
                url: imagem.url || imagem, // PODE SER STRING OU OBJETO
                title: imagem.titulo || "IMAGEM"
            });
        });
    }
    
    // RENDERIZA OS SLIDES E INDICADORES
    slidesContainer.innerHTML = ""; // LIMPA SLIDES ANTIGOS
    indicatorsContainer.innerHTML = ""; // LIMPA INDICADORES ANTIGOS
    mediaItems.forEach((item, index) => {
        const slide = document.createElement("div");
        slide.className = "banner-slide";
        
        if (item.type === "video") {
            const youtubeId = getYoutubeId(item.url); // USA FUNÇÃO LOCAL
            if (youtubeId) {
                slide.innerHTML = `
                    <iframe 
                        src="https://www.youtube.com/embed/${youtubeId}" 
                        title="${item.title}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
            } else {
                // MOSTRA UM PLACEHOLDER SE NÃO FOR VÍDEO DO YOUTUBE OU ID INVÁLIDO
                slide.innerHTML = `
                    <div class="youtube-placeholder">
                        <i class="fas fa-video-slash"></i>
                        <span>VÍDEO INDISPONÍVEL</span>
                    </div>
                `;
            }
        } else {
            // PARA IMAGENS
            slide.innerHTML = `<img src="${item.url}" alt="${item.title}" onerror="this.onerror=null; this.src=\'capas/progbrasil.jpg\';">`;
        }
        
        slidesContainer.appendChild(slide);
        
        // ADICIONA INDICADOR
        const indicator = document.createElement("div");
        indicator.className = "banner-indicator";
        indicator.dataset.index = index;
        indicator.addEventListener("click", () => {
            goToSlide(index);
        });
        indicatorsContainer.appendChild(indicator);
    });
    
    // CONFIGURA OS CONTROLES DO CARROSSEL
    const prevButton = document.getElementById("prevSlide");
    const nextButton = document.getElementById("nextSlide");
    
    if (prevButton) {
        prevButton.addEventListener("click", () => {
            goToSlide(currentSlide - 1);
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener("click", () => {
            goToSlide(currentSlide + 1);
        });
    }
    
    // INICIALIZA O PRIMEIRO SLIDE
    slides = document.querySelectorAll(".banner-slide");
    goToSlide(0);
}

// FUNÇÃO PARA NAVEGAR ENTRE SLIDES DO CARROSSEL
function goToSlide(index) {
    if (!slides || slides.length === 0) return;
    
    // GARANTE QUE O ÍNDICE ESTEJA DENTRO DOS LIMITES
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    
    currentSlide = index;
    
    // ATUALIZA A POSIÇÃO DOS SLIDES
    const slidesContainer = document.getElementById("bannerSlides");
    if (slidesContainer) {
        slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    
    // ATUALIZA OS INDICADORES
    const indicators = document.querySelectorAll(".banner-indicator");
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle("active", i === currentSlide);
    });
}

// FUNÇÃO PARA CONFIGURAR BOTÕES DE COMPARTILHAMENTO
function setupSharingButtons(film) {
    // ATUALIZA AS VARIÁVEIS GLOBAIS DE COMPARTILHAMENTO
    shareUrl = window.location.href;
    shareText = `Confira o filme "${film.title}" no catálogo de DVDs do Projeto Um Trem de Cinema IFMG Sabará`;
}

// FUNÇÃO PARA COMPARTILHAR NO WHATSAPP
function shareOnWhatsApp() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const encodedText = encodeURIComponent(shareText + " " + shareUrl);
    const whatsappUrl = isMobile 
        ? `whatsapp://send?text=${encodedText}`
        : `https://web.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
}

// FUNÇÃO PARA COMPARTILHAR NO FACEBOOK
function shareOnFacebook() {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, "_blank");
}

// FUNÇÃO PARA COMPARTILHAR NO TWITTER (X)
function shareOnTwitter() {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank");
}

// FUNÇÃO PARA COPIAR LINK PARA ÁREA DE TRANSFERÊNCIA
function copyToClipboard() {
    navigator.clipboard.writeText(shareUrl).then(() => {
        // MOSTRA MENSAGEM DE SUCESSO
        const copySuccess = document.createElement("div");
        copySuccess.className = "copy-success";
        copySuccess.textContent = "LINK COPIADO PARA A ÁREA DE TRANSFERÊNCIA!";
        document.body.appendChild(copySuccess);
        
        // EXIBE A MENSAGEM COM ANIMAÇÃO
        setTimeout(() => {
            copySuccess.classList.add("show");
        }, 10);
        
        // REMOVE A MENSAGEM APÓS 3 SEGUNDOS
        setTimeout(() => {
            copySuccess.classList.remove("show");
            setTimeout(() => {
                if (document.body.contains(copySuccess)) {
                    document.body.removeChild(copySuccess);
                }
            }, 300); // TEMPO PARA A ANIMAÇÃO DE SAÍDA
        }, 3000);
    }).catch(err => {
        console.error("ERRO AO COPIAR TEXTO: ", err);
        alert("ERRO AO COPIAR O LINK."); // FEEDBACK PARA O USUÁRIO
    });
}

// FUNÇÃO PARA CONFIGURAR CONTEÚDO EXPANSÍVEL (PLANOS DE AULA)
function setupExpandableContent() {
    document.querySelectorAll(".btn-toggle-preview").forEach(button => {
        button.addEventListener("click", function() {
            const targetId = this.getAttribute("data-target");
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.style.display = "block";
                this.style.display = "none"; // ESCONDE O BOTÃO "VISUALIZAR"
            }
        });
    });
    
    document.querySelectorAll(".btn-toggle-preview-close").forEach(button => {
        button.addEventListener("click", function() {
            const targetId = this.getAttribute("data-target");
            const targetElement = document.getElementById(targetId);
            const toggleButton = document.querySelector(`.btn-toggle-preview[data-target="${targetId}"]`);
            if (targetElement) {
                targetElement.style.display = "none";
                if (toggleButton) {
                    toggleButton.style.display = "inline-block"; // MOSTRA O BOTÃO "VISUALIZAR" NOVAMENTE
                }
            }
        });
    });
}

// EXTRAI ID DO YOUTUBE DE UMA URL (FUNÇÃO LOCAL, POIS É ESPECÍFICA DO CARROSSEL)
function getYoutubeId(url) {
    if (!url) return null;
    
    // PADRÕES DE URL DO YOUTUBE
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/i,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/i
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

// INICIALIZA A PÁGINA DE FILME QUANDO O DOM ESTIVER PRONTO
document.addEventListener("DOMContentLoaded", function() {
    console.log("PÁGINA DE FILME CARREGADA, INICIANDO CARREGAMENTO DE DADOS...");
    loadFilmData();
    // A FUNÇÃO setupGlobalInteractions() DE UTILS.JS CUIDARÁ DO MODAL DE FEEDBACK E FOOTER
});

