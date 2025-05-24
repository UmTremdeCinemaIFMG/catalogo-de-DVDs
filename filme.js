// ===========================
// SCRIPT PARA PÁGINA DE FILME
// ===========================

// VARIÁVEIS GLOBAIS
let currentSlide = 0;
let slides = [];
let mediaItems = [];

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
            throw new Error("Título do filme não especificado na URL");
        }

        console.log("Buscando filme com título:", decodeURIComponent(filmTitle));

        // CARREGA O CATÁLOGO
        const response = await fetch("catalogo.json");
        if (!response.ok) {
            throw new Error("Erro ao carregar o catálogo");
        }

        const data = await response.json();
        console.log("Catálogo carregado, total de filmes:", data.length);

        // BUSCA O FILME PELO TÍTULO - MELHORADA PARA NORMALIZAR STRINGS
        const normalizedSearchTitle = decodeURIComponent(filmTitle).toLowerCase().trim();
        console.log("Título normalizado para busca:", normalizedSearchTitle);

        const film = data.find(item => {
            if (!item["Título do filme"]) return false;
            const normalizedItemTitle = item["Título do filme"].toLowerCase().trim();
            return normalizedItemTitle === normalizedSearchTitle;
        });

        if (!film) {
            console.error("Filme não encontrado. Títulos disponíveis:",
                data.slice(0, 10).map(f => f["Título do filme"]));
            throw new Error(`Filme "${decodeURIComponent(filmTitle)}" não encontrado no catálogo`);
        }

        console.log("Filme encontrado:", film["Título do filme"]);

        // TRANSFORMA OS DADOS DO FILME
        const transformedFilm = transformFilmData(film);
        console.log("Dados transformados:", transformedFilm);

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

        // CONFIGURA BOTÃO ASSISTIR ONLINE
        setupAssistirOnlineButton(transformedFilm);

    } catch (error) {
        console.error("Erro:", error);
        const filmContainer = document.getElementById("filmeContainer");
        if (filmContainer) {
            filmContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar dados do filme</p>
                    <p>${error.message}</p>
                    <a href="index.html" class="btn-voltar">
                        <i class="fas fa-arrow-left"></i> Voltar para o catálogo
                    </a>
                </div>
            `;
        }
    }
}

// FUNÇÃO PARA TRANSFORMAR DADOS DO FILME
function transformFilmData(originalFilm) {
    // TRATAMENTO ESPECIAL PARA NOTA IMDB
    let imdbData = { votantes: "" };
    if (originalFilm["nota imdb/votantes"]) {
        const [nota, votantes] = String(originalFilm["nota imdb/votantes"]).split("/");
        imdbData = { votantes: `${nota}/${votantes || ""}`.trim() };
    } else if (originalFilm["nota imdb"] && originalFilm["nota imdb"].votantes) {
        imdbData = originalFilm["nota imdb"];
    }

    // LIMPA E FORMATA CAMPOS DE TEXTO
    function cleanField(value) {
        if (!value) return "";
        return String(value).replace(/^\"|\"$/g, "").trim();
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
        trailer: cleanField(originalFilm["trailer"] || ""),
        synopsis: cleanField(originalFilm["Sinopse"]),
        tema: cleanField(originalFilm["tema (Programadora Brasil)"]),
        tags: cleanField(originalFilm["tags"]),
        website: cleanField(originalFilm["website"]),
        assistirOnline: cleanField(originalFilm["Assistir Online"] || ""), // Campo renomeado
        festivais: cleanField(originalFilm["festivais"]),
        premios: cleanField(originalFilm["premios"]),
        legendasOutras: cleanField(originalFilm["legendas_outras"]),
        materialOutros: (() => {
            const material = originalFilm["material_outros"];
            if (!material) return [];
            if (typeof material === "string") {
                return [{
                    tipo: material,
                    titulo: material,
                    url: "#"
                }];
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
        videos: originalFilm["videos"] || [],
        imagens_adicionais: originalFilm["imagens_adicionais"] || []
    };
}

// FUNÇÃO PARA RENDERIZAR DADOS DO FILME
function renderFilmData(film) {
    const filmContainer = document.getElementById("filmeContainer");
    if (!filmContainer) {
        console.error("Container do filme não encontrado");
        return;
    }

    // CLASSIFICAÇÃO INDICATIVA
    const classification = film.classification || 0;
    const classificationClass = getClassificationClass(classification);
    const classificationText = classification <= 0 ? "L" : classification;

    // TEMAS
    const themes = createThemesList(film);
    const hasThemes = themes.length > 0;

    // INFORMAÇÕES ADICIONAIS (sem Assistir Online)
    const hasAdditionalInfo = film.audiodescricao || film.closedCaption || film.website ||
                            film.festivais || film.premios ||
                            film.legendasOutras || film.materialOutros.length > 0;

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
                ${film.director ? `<p><strong><i class="fas fa-user"></i> Direção:</strong> ${film.director}</p>` : ""}
                ${film.cast ? `<p><strong><i class="fas fa-users"></i> Elenco:</strong> ${film.cast}</p>` : ""}
                ${film.duration ? `<p><strong><i class="fas fa-clock"></i> Duração:</strong> ${film.duration} min</p>` : ""}
                ${film.genre ? `<p><strong><i class="fas fa-tag"></i> Gênero:</strong> ${film.genre}</p>` : ""}
                ${film.year ? `<p><strong><i class="fas fa-calendar-alt"></i> Ano:</strong> ${film.year}</p>` : ""}
                ${film.imdb.votantes ? `<p><strong><i class="fab fa-imdb"></i> IMDb:</strong> ${film.imdb.votantes}</p>` : ""}
                ${film.country ? `<p><strong><i class="fas fa-globe-americas"></i> País:</strong> ${film.country}</p>` : ""}
                ${film.state ? `<p><strong><i class="fas fa-map-marker-alt"></i> UF:</strong> ${film.state}</p>` : ""}
                ${film.city ? `<p><strong><i class="fas fa-city"></i> Cidade:</strong> ${film.city}</p>` : ""}
            </div>

            <!-- Botões de compartilhamento -->
            <div class="social-share-container">
                <div class="social-share-title">Compartilhar:</div>
                <div class="social-share-buttons">
                    <button class="social-share-button whatsapp" title="Compartilhar no WhatsApp" onclick="shareOnWhatsApp()">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button class="social-share-button facebook" title="Compartilhar no Facebook" onclick="shareOnFacebook()">
                        <i class="fab fa-facebook-f"></i>
                    </button>
                    <button class="social-share-button twitter" title="Compartilhar no X (Twitter)" onclick="shareOnTwitter()">
                        <i class="fab fa-twitter"></i>
                    </button>
                    <button class="social-share-button copy" title="Copiar link" onclick="copyToClipboard()">
                        <i class="fas fa-link"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    // SINOPSE
    let filmContent = "";
    if (film.synopsis) {
        filmContent += `
        <div class="filme-section">
            <h3><i class="fas fa-align-left"></i> Sinopse</h3>
            <p>${film.synopsis}</p>
        </div>
        `;
    }

    // TEMAS
    if (hasThemes) {
        filmContent += `
        <div class="filme-section">
            <h3><i class="fas fa-tags"></i> Temas</h3>
            ${themes.map(theme => `<span class="theme-tag">${theme}</span>`).join("")}
        </div>
        `;
    }

    // PLANOS DE AULA
    if (film.planos_de_aula && film.planos_de_aula.length > 0) {
        filmContent += `
        <div class="filme-section">
            <h3><i class="fas fa-chalkboard-teacher"></i> Planos de Aula</h3>
            ${renderTeachingPlans(film)}
        </div>
        `;
    }

    // FESTIVAIS
    if (film.festivais) {
        filmContent += `
        <div class="filme-section">
            <h3><i class="fas fa-ticket-alt"></i> Festivais</h3>
            <p>${film.festivais.replace(/\n/g, "<br>")}</p>
        </div>
        `;
    }

    // PRÊMIOS
    if (film.premios) {
        filmContent += `
        <div class="filme-section">
            <h3><i class="fas fa-award"></i> Prêmios</h3>
            <p>${film.premios.replace(/\n/g, "<br>")}</p>
        </div>
        `;
    }

    // OUTROS MATERIAIS
    if (film.materialOutros && film.materialOutros.length > 0) {
        filmContent += `
        <div class="filme-section">
            <h3><i class="fas fa-file-alt"></i> Outros Materiais</h3>
            ${renderOtherMaterials(film)}
        </div>
        `;
    }

    // INFORMAÇÕES ADICIONAIS (sem Assistir Online)
    if (hasAdditionalInfo) {
        let additionalContent = "";

        if (film.audiodescricao) {
            additionalContent += `<p><strong><i class="fas fa-assistive-listening-systems"></i> Audiodescrição:</strong> ${film.audiodescricao}</p>`;
        }

        if (film.closedCaption) {
            additionalContent += `<p><strong><i class="fas fa-closed-captioning"></i> Closed Caption:</strong> ${film.closedCaption}</p>`;
        }

        if (film.legendasOutras) {
            additionalContent += `<p><strong><i class="fas fa-language"></i> Outras Legendas:</strong> ${film.legendasOutras}</p>`;
        }

        if (film.website) {
            additionalContent += `<p><strong><i class="fas fa-globe"></i> Website:</strong> <a href="${film.website}" target="_blank">${film.website}</a></p>`;
        }

        // Link "Assistir Online" removido daqui

        if (additionalContent) {
            filmContent += `
            <div class="filme-section">
                <h3><i class="fas fa-info-circle"></i> Informações Adicionais</h3>
                ${additionalContent}
            </div>
            `;
        }
    }

    // ADICIONA O CONTEÚDO AO CONTAINER
    filmContainer.innerHTML = `
        <!-- Banner com carrossel -->
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
}

// FUNÇÃO PARA CONFIGURAR O BOTÃO ASSISTIR ONLINE
function setupAssistirOnlineButton(film) {
    const btnAssistirOnline = document.getElementById("btnAssistirOnline");
    if (btnAssistirOnline && film.assistirOnline) {
        btnAssistirOnline.href = film.assistirOnline;
        btnAssistirOnline.style.display = "inline-block"; // Mostra o botão
    }
}

// FUNÇÃO PARA INICIALIZAR O CARROSSEL
function initializeCarousel(film) {
    const slidesContainer = document.getElementById("bannerSlides");
    const indicatorsContainer = document.getElementById("bannerIndicators");

    if (!slidesContainer || !indicatorsContainer) {
        console.error("Containers do carrossel não encontrados");
        return;
    }

    // Prepara os itens de mídia para o carrossel
    mediaItems = [];

    // 1. Adiciona o trailer primeiro (se existir)
    if (film.trailer && film.trailer.trim() !== "") {
        mediaItems.push({
            type: "video",
            url: film.trailer,
            title: "Trailer"
        });
    }

    // 2. Adiciona outros vídeos (se existirem)
    if (film.videos && film.videos.length > 0) {
        film.videos.forEach(video => {
            mediaItems.push({
                type: "video",
                url: video.url,
                title: video.titulo || "Vídeo"
            });
        });
    }

    // 3. Adiciona a capa do filme (se não houver trailer)
    if (!(film.trailer && film.trailer.trim() !== "")) {
         mediaItems.push({
            type: "image",
            url: `capas/${film.imageName || "progbrasil"}.jpg`,
            title: "Capa do filme"
        });
    }

    // 4. Adiciona imagens adicionais (se existirem)
    if (film.imagens_adicionais && film.imagens_adicionais.length > 0) {
        film.imagens_adicionais.forEach(imagem => {
            mediaItems.push({
                type: "image",
                url: imagem.url || imagem,
                title: imagem.titulo || "Imagem"
            });
        });
    }

    // Se não houver trailer nem vídeos, adiciona a capa mesmo assim
    if (mediaItems.length === 0) {
         mediaItems.push({
            type: "image",
            url: `capas/${film.imageName || "progbrasil"}.jpg`,
            title: "Capa do filme"
        });
    }

    // Renderiza os slides
    slidesContainer.innerHTML = ""; // Limpa slides anteriores
    indicatorsContainer.innerHTML = ""; // Limpa indicadores anteriores

    mediaItems.forEach((item, index) => {
        const slide = document.createElement("div");
        slide.className = "banner-slide";

        if (item.type === "video") {
            const youtubeId = getYoutubeId(item.url);
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
                slide.innerHTML = `<p>Vídeo indisponível: ${item.url}</p>`;
            }
        } else { // type === "image"
            slide.innerHTML = `
                <img src="${item.url}" alt="${item.title}" onerror="this.src='capas/progbrasil.png'">
            `;
        }
        slidesContainer.appendChild(slide);

        // Adiciona indicador
        const indicator = document.createElement("span");
        indicator.className = "banner-indicator";
        indicator.addEventListener("click", () => showSlide(index));
        indicatorsContainer.appendChild(indicator);
    });

    slides = document.querySelectorAll(".banner-slide");
    showSlide(0); // Mostra o primeiro slide

    // Configura botões de controle
    const prevButton = document.getElementById("prevSlide");
    const nextButton = document.getElementById("nextSlide");

    if (prevButton) {
        prevButton.addEventListener("click", prevSlide);
    }
    if (nextButton) {
        nextButton.addEventListener("click", nextSlide);
    }
}

// FUNÇÕES DO CARROSSEL
function showSlide(index) {
    if (!slides || slides.length === 0) return;

    // Garante que o índice esteja dentro dos limites
    if (index >= slides.length) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = slides.length - 1;
    } else {
        currentSlide = index;
    }

    // Calcula o deslocamento
    const offset = -currentSlide * 100;
    const slidesContainer = document.getElementById("bannerSlides");
    if (slidesContainer) {
        slidesContainer.style.transform = `translateX(${offset}%)`;
    }

    // Atualiza indicadores
    const indicators = document.querySelectorAll(".banner-indicator");
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle("active", i === currentSlide);
    });
}

function nextSlide() {
    showSlide(currentSlide + 1);
}

function prevSlide() {
    showSlide(currentSlide - 1);
}

// FUNÇÃO PARA OBTER ID DO YOUTUBE
function getYoutubeId(url) {
    if (!url) return null;
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

// FUNÇÃO PARA OBTER CLASSE DE CLASSIFICAÇÃO
function getClassificationClass(age) {
    if (!age || age <= 0) return "L";
    const ageNum = typeof age === "string" ? parseInt(age) : age;
    switch(ageNum) {
        case 10: return "ten";
        case 12: return "twelve";
        case 14: return "fourteen";
        case 16: return "sixteen";
        case 18: return "eighteen";
        default: return "L";
    }
}

// FUNÇÃO PARA CRIAR LISTA DE TEMAS
function createThemesList(film) {
    const themes = [];
    if (film.tema) {
        themes.push(...film.tema.split(",").map(t => t.trim()));
    }
    if (film.tags) {
        themes.push(...film.tags.split(",").map(t => t.trim()));
    }
    return [...new Set(themes.filter(t => t))];
}

// FUNÇÃO PARA RENDERIZAR PLANOS DE AULA
function renderTeachingPlans(film) {
    if (!film.planos_de_aula || film.planos_de_aula.length === 0) {
        return "<p><i class=\"fas fa-info-circle\"></i> Nenhum plano de aula disponível.</p>";
    }
    return film.planos_de_aula.map((plano, index) => `
        <div class="teaching-plan-card">
            <p><strong><i class="fas fa-graduation-cap"></i> Nível de Ensino:</strong> ${plano.nivel_ensino || ""}</p>
            <p><strong><i class="fas fa-book"></i> Área de Conhecimento:</strong> ${plano.area_conhecimento || ""}</p>
            <p><strong><i class="fas fa-globe"></i> Site:</strong> <a href="${plano.url}" target="_blank">${plano.site}</a></p>
            <p><strong><i class="fas fa-info-circle"></i> Descrição:</strong> ${plano.descricao || ""}</p>
            <div class="site-preview-toggle">
                <button class="btn-toggle-preview" data-target="site-preview-${index}">
                    <i class="fas fa-eye"></i> Visualizar site
                </button>
            </div>
            <div class="site-preview" id="site-preview-${index}" style="display: none;">
                <iframe src="${plano.url}" frameborder="0" width="100%" height="600px"></iframe>
                <button class="btn-toggle-preview-close" data-target="site-preview-${index}">
                    <i class="fas fa-times"></i> Fechar visualização
                </button>
            </div>
        </div>
    `).join("");
}

// FUNÇÃO PARA RENDERIZAR OUTROS MATERIAIS
function renderOtherMaterials(film) {
    if (!film.materialOutros || film.materialOutros.length === 0) {
        return "<p><i class=\"fas fa-info-circle\"></i> Nenhum material adicional disponível.</p>";
    }
    return film.materialOutros.map(material => `
        <div class="other-material-card">
            <p><strong><i class="fas fa-file-alt"></i> Tipo:</strong> ${material.tipo || "N/A"}</p>
            <p><strong><i class="fas fa-heading"></i> Título:</strong> ${material.titulo || "N/A"}</p>
            ${material.url && material.url !== "#" ? `<p><strong><i class="fas fa-link"></i> Link:</strong> <a href="${material.url}" target="_blank">Acessar material</a></p>` : ""}
        </div>
    `).join("");
}

// FUNÇÃO PARA CONFIGURAR CONTEÚDO EXPANSÍVEL
function setupExpandableContent() {
    document.querySelectorAll(".btn-toggle-preview").forEach(button => {
        button.addEventListener("click", function() {
            const targetId = this.getAttribute("data-target");
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.style.display = "block";
            }
        });
    });

    document.querySelectorAll(".btn-toggle-preview-close").forEach(button => {
        button.addEventListener("click", function() {
            const targetId = this.getAttribute("data-target");
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.style.display = "none";
            }
        });
    });
}

// FUNÇÕES DE COMPARTILHAMENTO
function shareOnWhatsApp() {
    const shareUrl = window.location.href;
    const filmTitle = document.querySelector(".filme-title")?.innerText || "este filme";
    const shareText = `Confira ${filmTitle} no catálogo de DVDs do Projeto Um Trem de Cinema IFMG Sabará`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const formattedText = encodeURIComponent(shareText + " " + shareUrl);
    const whatsappUrl = isMobile ? `whatsapp://send?text=${formattedText}` : `https://web.whatsapp.com/send?text=${formattedText}`;
    window.open(whatsappUrl, "_blank");
}

function shareOnFacebook() {
    const shareUrl = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, "_blank");
}

function shareOnTwitter() {
    const shareUrl = window.location.href;
    const filmTitle = document.querySelector(".filme-title")?.innerText || "este filme";
    const shareText = `Confira ${filmTitle} no catálogo de DVDs do Projeto Um Trem de Cinema IFMG Sabará`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank");
}

function copyToClipboard() {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
        const copySuccess = document.createElement("div");
        copySuccess.className = "copy-success";
        copySuccess.textContent = "Link copiado para a área de transferência!";
        document.body.appendChild(copySuccess);
        setTimeout(() => { copySuccess.classList.add("show"); }, 10);
        setTimeout(() => {
            copySuccess.classList.remove("show");
            setTimeout(() => { document.body.removeChild(copySuccess); }, 300);
        }, 3000);
    }).catch(err => {
        console.error("Erro ao copiar texto: ", err);
    });
}

// FUNÇÃO PARA CONFIGURAR BOTÕES DE COMPARTILHAMENTO
function setupSharingButtons(film) {
    // As funções de compartilhamento agora pegam o título e URL dinamicamente
    // Não é necessário passar o film aqui, mas mantemos a função para futuras expansões
}

// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM da página do filme carregado, iniciando...");
    loadFilmData();

    // Configura modal de Fale Conosco
    const modalFaleConosco = document.getElementById("modalFaleConosco");
    const btnFaleConosco = document.getElementById("btnFaleConosco");

    if (modalFaleConosco && btnFaleConosco) {
        const spanCloseFeedback = modalFaleConosco.querySelector(".close");

        btnFaleConosco.addEventListener("click", function() {
            modalFaleConosco.style.display = "block";
            setTimeout(() => { modalFaleConosco.classList.add("show"); }, 10);
        });

        if (spanCloseFeedback) {
            spanCloseFeedback.addEventListener("click", function() {
                modalFaleConosco.classList.remove("show");
                setTimeout(() => { modalFaleConosco.style.display = "none"; }, 300);
            });
        }

        window.addEventListener("click", function(event) {
            if (event.target == modalFaleConosco) {
                modalFaleConosco.classList.remove("show");
                setTimeout(() => { modalFaleConosco.style.display = "none"; }, 300);
            }
        });
    }
});

