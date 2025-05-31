/* ==========================================
   FUNÇÕES UTILITÁRIAS COMPARTILHADAS
   ========================================== */

// LIMPA E FORMATA CAMPOS DE TEXTO
function cleanField(value) {
    if (!value) return ";
    // REMOVE ASPAS EXTRAS NO INÍCIO/FIM E ESPAÇOS EM BRANCO
    return String(value).replace(/^"|"$/g, ").trim(); 
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

// CRIA LISTA DE TEMAS
function createThemesList(film) {
    const themes = [];
    
    if (film.tema) {
        themes.push(...film.tema.split(',').map(t => t.trim()));
    }
    
    if (film.tags) {
        themes.push(...film.tags.split(',').map(t => t.trim()));
    }
    
    // USA SET PARA REMOVER DUPLICADOS E FILTRA VALORES VAZIOS
    return [...new Set(themes.filter(t => t))]; 
}

// TRANSFORMA DADOS DO JSON PARA O FORMATO DESEJADO
function transformFilmData(originalFilm) {
    // TRATAMENTO ESPECIAL PARA NOTA IMDB
    let imdbData = { votantes: '' };
    if (originalFilm["nota imdb/votantes"]) {
        const [nota, votantes] = String(originalFilm["nota imdb/votantes"]).split('/');
        imdbData = { votantes: `${nota}/${votantes || ''}`.trim() };
    } else if (originalFilm["nota imdb"] && originalFilm["nota imdb"].votantes) {
        // CASO JÁ VENHA COMO OBJETO (MENOS COMUM NO JSON ATUAL)
        imdbData = originalFilm["nota imdb"];
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
                // CONVERTE STRING EM UM OBJETO NO FORMATO ESPERADO
                return [{
                    tipo: material,
                    titulo: material,
                    url: '#'
                }];
            }
            // SE JÁ FOR ARRAY, RETORNA COMO ESTÁ
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
        imagens_adicionais: originalFilm["imagens_adicionais"] || [] // ADICIONADO CAMPO DE IMAGENS ADICIONAIS
    };
}

// FUNÇÃO PARA RENDERIZAR PLANOS DE AULA (COM LIMITE OPCIONAL)
function renderTeachingPlans(film, limit = null, encodedTitle = '') {
    if (!film.planos_de_aula || film.planos_de_aula.length === 0) {
        return '<p><i class="fas fa-info-circle"></i> NENHUM PLANO DE AULA DISPONÍVEL.</p>';
    }

    const plansToRender = limit ? film.planos_de_aula.slice(0, limit) : film.planos_de_aula;
    let html = plansToRender.map((plano, index) => {
        // GERA UM ID ÚNICO PARA O PREVIEW DENTRO DO MODAL OU PÁGINA
        const previewId = `site-preview-${encodedTitle ? 'modal-' : ''}${index}`;
        return `
        <div class="teaching-plan-card">
            <p><strong><i class="fas fa-graduation-cap"></i> NÍVEL DE ENSINO:</strong> ${plano.nivel_ensino || ''}</p>
            <p><strong><i class="fas fa-book"></i> ÁREA DE CONHECIMENTO:</strong> ${plano.area_conhecimento || ''}</p>
            <p><strong><i class="fas fa-globe"></i> SITE:</strong> <a href="${plano.url}" target="_blank">${plano.site}</a></p>
            <p><strong><i class="fas fa-info-circle"></i> DESCRIÇÃO:</strong> ${plano.descricao || ''}</p>
            ${!limit ? `
            <div class="site-preview-toggle">
                <button class="btn-toggle-preview" data-target="${previewId}">
                    <i class="fas fa-eye"></i> VISUALIZAR SITE
                </button>
            </div>
            <div class="site-preview" id="${previewId}" style="display: none;">
                <iframe src="${plano.url}" frameborder="0" width="100%" height="600px" loading="lazy"></iframe>
                <button class="btn-toggle-preview-close" data-target="${previewId}">
                    <i class="fas fa-times"></i> FECHAR VISUALIZAÇÃO
                </button>
            </div>
            ` : ''}
        </div>
    `}).join('');

    // ADICIONA BOTÃO "VER MAIS" SE HOUVER LIMITE E MAIS ITENS
    if (limit && film.planos_de_aula.length > limit) {
        const remainingCount = film.planos_de_aula.length - limit;
        html += `
            <div class="modal-plan-actions">
                <a href="filme.html?titulo=${encodedTitle}" class="btn-ver-mais">
                    +${remainingCount} RESULTADO(S)
                </a>
                <a href="https://forms.gle/your-google-form-link" target="_blank" class="btn-enviar-plano">
                    <i class="fas fa-plus-circle"></i> ENVIAR PLANO
                </a>
                <p class="modal-plan-collab-text">COLABORE ENVIANDO SEU PLANO DE AULA!</p>
            </div>
        `;
    }

    return html;
}

// FUNÇÃO PARA RENDERIZAR OUTROS MATERIAIS (COM LIMITE OPCIONAL)
function renderOtherMaterials(film, limit = null, encodedTitle = '') {
    if (!film.materialOutros || film.materialOutros.length === 0) {
        return '<p><i class="fas fa-info-circle"></i> NENHUM MATERIAL ADICIONAL DISPONÍVEL.</p>';
    }

    const materialsToRender = limit ? film.materialOutros.slice(0, limit) : film.materialOutros;
    let html = materialsToRender.map(material => `
        <div class="other-material-card">
            <p><strong><i class="fas fa-bookmark"></i> TIPO:</strong> ${material.tipo || ''}</p>
            <p><strong><i class="fas fa-file-alt"></i> TÍTULO:</strong> <a href="${material.url}" target="_blank">${material.titulo}</a></p>
        </div>
    `).join('');

    // ADICIONA BOTÃO "VER MAIS" SE HOUVER LIMITE E MAIS ITENS
    if (limit && film.materialOutros.length > limit) {
        const remainingCount = film.materialOutros.length - limit;
        html += `
            <a href="filme.html?titulo=${encodedTitle}" class="btn-ver-mais">
                +${remainingCount} RESULTADO(S)
            </a>
        `;
    }

    return html;
}

// FUNÇÃO PARA CONFIGURAR O MODAL DE FALE CONOSCO E FOOTER
function setupGlobalInteractions() {
    // CONFIGURA MODAL DE FALE CONOSCO
    const modalFaleConosco = document.getElementById("modalFaleConosco");
    const btnFaleConosco = document.getElementById("btnFaleConosco");
    
    if (modalFaleConosco && btnFaleConosco) {
        const spanCloseFeedback = modalFaleConosco.querySelector(".close");
        
        btnFaleConosco.addEventListener("click", function() {
            modalFaleConosco.style.display = "block";
            // ADICIONA CLASSE PARA ANIMAÇÃO APÓS UM PEQUENO ATRASO
            setTimeout(() => {
                modalFaleConosco.classList.add('show');
            }, 10); 
        });
        
        if (spanCloseFeedback) {
            spanCloseFeedback.addEventListener("click", function() {
                modalFaleConosco.classList.remove('show');
                // ESPERA A ANIMAÇÃO TERMINAR ANTES DE OCULTAR
                setTimeout(() => {
                    modalFaleConosco.style.display = "none";
                }, 300); 
            });
        }
        
        // FECHA O MODAL SE CLICAR FORA DO CONTEÚDO
        window.addEventListener("click", function(event) {
            if (event.target == modalFaleConosco) {
                modalFaleConosco.classList.remove('show');
                setTimeout(() => {
                    modalFaleConosco.style.display = "none";
                }, 300);
            }
        });
    }

    // EVENTO DO FOOTER
    const footer = document.querySelector('footer');
    if (footer) {
        footer.addEventListener('click', function() {
            window.open('https://umtremdecinema.wixsite.com/umtremdecinema', '_blank');
        });
    }
}

// INICIALIZA AS INTERAÇÕES GLOBAIS QUANDO O DOM ESTIVER PRONTO
document.addEventListener('DOMContentLoaded', setupGlobalInteractions);

