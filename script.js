import { worksData } from "./data/works.js";

// ==========================================================================
// Estado Global de la Aplicación
// ==========================================================================
const state = {
    works: [...worksData],
    searchQuery: "",
    selectedArtist: "all",
    selectedTechnique: "all",
    sortBy: "thesis-asc",
    currentView: "grid", // 'grid' | 'list' | 'favs'
    favorites: new Set(JSON.parse(localStorage.getItem("thesis_gallery_favs") || "[]")),
    activeModalWorkId: null,
    lightboxInstance: null
};

// ==========================================================================
// Elementos del DOM
// ==========================================================================
const DOM = {
    // Inputs & Filters
    searchInput: document.getElementById("search-input"),
    btnClearSearch: document.getElementById("btn-clear-search"),
    filterArtist: document.getElementById("filter-artist"),
    filterTechnique: document.getElementById("filter-technique"),
    sortBy: document.getElementById("sort-by"),
    btnResetFilters: document.getElementById("btn-reset-filters"),
    btnEmptyReset: document.getElementById("btn-empty-reset"),

    // Views & Containers
    galleryGrid: document.getElementById("gallery-grid"),
    catalogContainer: document.getElementById("catalog-table-container"),
    catalogTableBody: document.getElementById("catalog-table-body"),
    emptyState: document.getElementById("empty-state"),
    activeChips: document.getElementById("active-chips"),
    resultsCounter: document.getElementById("results-counter"),

    // View switcher buttons
    btnViewGrid: document.getElementById("btn-view-grid"),
    btnViewList: document.getElementById("btn-view-list"),
    btnViewFavs: document.getElementById("btn-view-favs"),

    // Modal
    detailModal: document.getElementById("detail-modal"),
    btnModalClose: document.getElementById("btn-modal-close"),
    modalImg: document.getElementById("modal-img"),
    modalLightboxLink: document.getElementById("modal-lightbox-link"),
    modalRef: document.getElementById("modal-ref"),
    modalTitle: document.getElementById("modal-title"),
    modalOriginalTitle: document.getElementById("modal-original-title"),
    modalAuthor: document.getElementById("modal-author"),
    modalYear: document.getElementById("modal-year"),
    modalTechnique: document.getElementById("modal-technique"),
    modalMovement: document.getElementById("modal-movement"),
    modalDescription: document.getElementById("modal-description"),
    modalCitation: document.getElementById("modal-citation"),
    btnCopyCitation: document.getElementById("btn-copy-citation"),
    modalFavBtn: document.getElementById("modal-fav-btn"),

    // UI Utilities
    toast: document.getElementById("toast"),
    btnScrollTop: document.getElementById("btn-scroll-top")
};

// ==========================================================================
// Inicialización
// ==========================================================================
function init() {
    setupFilterOptions();
    setupEventListeners();
    render();
}

// Llenar selectores dinámicamente con conteos
function setupFilterOptions() {
    // Artistas
    const artistCounts = {};
    const techniqueCounts = {};

    state.works.forEach(w => {
        artistCounts[w.author] = (artistCounts[w.author] || 0) + 1;
        techniqueCounts[w.mediumCategory] = (techniqueCounts[w.mediumCategory] || 0) + 1;
    });

    // Populate Artists
    Object.keys(artistCounts).sort().forEach(artist => {
        const opt = document.createElement("option");
        opt.value = artist;
        opt.textContent = `${artist} (${artistCounts[artist]})`;
        DOM.filterArtist.appendChild(opt);
    });

    // Populate Techniques
    Object.keys(techniqueCounts).sort().forEach(tech => {
        const opt = document.createElement("option");
        opt.value = tech;
        opt.textContent = `${tech} (${techniqueCounts[tech]})`;
        DOM.filterTechnique.appendChild(opt);
    });
}

// ==========================================================================
// Filtrado, Búsqueda y Ordenamiento
// ==========================================================================
function getFilteredWorks() {
    let list = [...state.works];

    // Favoritos view mode
    if (state.currentView === "favs") {
        list = list.filter(w => state.favorites.has(w.id));
    }

    // Artist Filter
    if (state.selectedArtist !== "all") {
        list = list.filter(w => w.author === state.selectedArtist);
    }

    // Technique Filter
    if (state.selectedTechnique !== "all") {
        list = list.filter(w => w.mediumCategory === state.selectedTechnique);
    }

    // Search Query
    if (state.searchQuery.trim() !== "") {
        const query = normalizeString(state.searchQuery);
        list = list.filter(w => {
            const title = normalizeString(w.title);
            const orig = normalizeString(w.originalTitle || "");
            const author = normalizeString(w.author);
            const tech = normalizeString(w.technique);
            const ref = normalizeString(w.thesisRef);
            const desc = normalizeString(w.description || "");
            const year = String(w.yearNum || "");

            return title.includes(query) ||
                orig.includes(query) ||
                author.includes(query) ||
                tech.includes(query) ||
                ref.includes(query) ||
                desc.includes(query) ||
                year.includes(query);
        });
    }

    // Sorting
    list.sort((a, b) => {
        switch (state.sortBy) {
            case "thesis-asc":
                return a.id - b.id;
            case "thesis-desc":
                return b.id - a.id;
            case "year-asc":
                return (a.yearNum || 0) - (b.yearNum || 0);
            case "year-desc":
                return (b.yearNum || 0) - (a.yearNum || 0);
            case "title-asc":
                return a.title.localeCompare(b.title, "es");
            case "author-asc":
                return a.author.localeCompare(b.author, "es");
            default:
                return a.id - b.id;
        }
    });

    return list;
}

function normalizeString(str) {
    return (str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// ==========================================================================
// Renderizado de Vistas
// ==========================================================================
function render() {
    const filtered = getFilteredWorks();

    // Actualizar barra de resultados y chips activos
    updateActiveChips();
    DOM.resultsCounter.innerHTML = `Mostrando <strong>${filtered.length}</strong> de ${state.works.length} obras`;

    // Toggle Empty State
    if (filtered.length === 0) {
        DOM.galleryGrid.style.display = "none";
        DOM.catalogContainer.style.display = "none";
        DOM.emptyState.style.display = "block";
        return;
    } else {
        DOM.emptyState.style.display = "none";
    }

    // Render según modo de vista activo
    if (state.currentView === "list") {
        DOM.galleryGrid.style.display = "none";
        DOM.catalogContainer.style.display = "block";
        renderCatalogTable(filtered);
    } else {
        DOM.catalogContainer.style.display = "none";
        DOM.galleryGrid.style.display = "grid";
        renderGalleryGrid(filtered);
    }

    // Actualizar GLightbox
    setupLightbox();
}

function renderGalleryGrid(works) {
    DOM.galleryGrid.innerHTML = works.map(w => {
        const isFav = state.favorites.has(w.id);
        return `
            <article class="art-card" data-id="${w.id}">
                <div class="art-media-wrapper">
                    <span class="art-thesis-badge">${w.thesisRef}</span>
                    <button class="art-fav-btn ${isFav ? 'is-favorite' : ''}" data-id="${w.id}" title="${isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}">
                        ${isFav ? '★' : '☆'}
                    </button>
                    <a href="${w.image}" class="glightbox" data-gallery="tesis-gallery" 
                       data-title="<strong>${w.id}. ${w.title} (${w.year})</strong>" 
                       data-description="<em>${w.author}</em> — ${w.technique}<br><small style='opacity:0.8'>${w.description}</small>">
                        <img class="art-img" src="${w.thumbnail}" alt="${w.title}" loading="lazy">
                    </a>
                </div>

                <div class="art-info">
                    <div class="art-author-row">
                        <span class="art-author" data-author="${w.author}" title="Filtrar por ${w.author}">${w.author}</span>
                        <span class="art-year">${w.year}</span>
                    </div>

                    <h3 class="art-title" title="${w.title}">${w.title}</h3>
                    <span class="art-technique-pill">${w.technique}</span>

                    <div class="art-card-actions">
                        <a href="${w.image}" class="btn-card-action btn-card-lightbox glightbox" data-gallery="tesis-gallery-btn" 
                           data-title="<strong>${w.id}. ${w.title} (${w.year})</strong>" 
                           data-description="<em>${w.author}</em> — ${w.technique}">
                            🔍 HD
                        </a>
                        <button class="btn-card-action btn-card-detail" data-id="${w.id}">
                            📖 Ficha
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

function renderCatalogTable(works) {
    DOM.catalogTableBody.innerHTML = works.map(w => {
        const isFav = state.favorites.has(w.id);
        return `
            <tr data-id="${w.id}">
                <td class="col-ref"><strong>${w.thesisRef}</strong></td>
                <td class="col-thumb">
                    <a href="${w.image}" class="glightbox table-thumb-wrapper" data-gallery="tesis-table"
                       data-title="<strong>${w.id}. ${w.title}</strong>" data-description="${w.author} (${w.year})">
                        <img src="${w.thumbnail}" alt="${w.title}" loading="lazy">
                    </a>
                </td>
                <td class="col-title">
                    <div class="table-work-title">${w.title}</div>
                    <div class="table-original-title">${w.originalTitle || ''}</div>
                </td>
                <td class="col-author">
                    <span class="art-author" data-author="${w.author}">${w.author}</span>
                </td>
                <td class="col-year"><span class="art-year">${w.year}</span></td>
                <td class="col-technique">${w.technique}</td>
                <td class="col-actions">
                    <div class="table-actions">
                        <button class="btn-card-action btn-card-detail" data-id="${w.id}" title="Ver Ficha Académica">
                            📖 Ficha
                        </button>
                        <button class="art-fav-btn ${isFav ? 'is-favorite' : ''}" style="position:static; width:28px; height:28px;" data-id="${w.id}" title="Favorito">
                            ${isFav ? '★' : '☆'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// ==========================================================================
// GLightbox
// ==========================================================================
function setupLightbox() {
    if (state.lightboxInstance) {
        state.lightboxInstance.destroy();
    }

    state.lightboxInstance = GLightbox({
        selector: ".glightbox",
        loop: true,
        touchNavigation: true,
        keyboardNavigation: true,
        zoomable: true,
        closeOnOutsideClick: true
    });
}

// ==========================================================================
// Chips activos y métricas
// ==========================================================================
function updateActiveChips() {
    const chips = [];

    if (state.searchQuery) {
        chips.push({ type: "search", label: `Búsqueda: "${state.searchQuery}"` });
    }
    if (state.selectedArtist !== "all") {
        chips.push({ type: "artist", label: `Artista: ${state.selectedArtist}` });
    }
    if (state.selectedTechnique !== "all") {
        chips.push({ type: "technique", label: `Técnica: ${state.selectedTechnique}` });
    }
    if (state.currentView === "favs") {
        chips.push({ type: "view", label: `Vista: ⭐ Favoritos (${state.favorites.size})` });
    }

    DOM.activeChips.innerHTML = chips.map(chip => `
        <span class="filter-chip">
            ${chip.label}
            <span class="chip-remove" data-chip-type="${chip.type}" title="Quitar filtro">✕</span>
        </span>
    `).join("");
}

// ==========================================================================
// Modal de Detalle Académico
// ==========================================================================
function openDetailModal(workId) {
    const work = state.works.find(w => w.id === Number(workId));
    if (!work) return;

    state.activeModalWorkId = work.id;

    DOM.modalImg.src = work.image;
    DOM.modalImg.alt = work.title;
    DOM.modalLightboxLink.href = work.image;
    DOM.modalRef.textContent = work.thesisRef;
    DOM.modalTitle.textContent = work.title;
    DOM.modalOriginalTitle.textContent = work.originalTitle ? `Título original: ${work.originalTitle}` : "";
    DOM.modalAuthor.textContent = work.author;
    DOM.modalYear.textContent = work.year;
    DOM.modalTechnique.textContent = work.technique;
    DOM.modalMovement.textContent = work.movement;
    DOM.modalDescription.textContent = work.description;

    // Generar cita bibliográfica académica
    const citation = `${work.author} (${work.year}). *${work.title}* [${work.technique}]. Referenciada en: Busnadiego, A. (Tesis: Imagen-esperanza, ${work.thesisRef}).`;
    DOM.modalCitation.innerHTML = `${work.author} (${work.year}). <em>${work.title}</em> [${work.technique}]. Referenciada en: Busnadiego, A. (Tesis: <em>Imagen-esperanza</em>, ${work.thesisRef}).`;
    DOM.btnCopyCitation.dataset.citation = `${work.author} (${work.year}). ${work.title} [${work.technique}]. Referenciada en: Busnadiego, A. (Tesis: Imagen-esperanza, ${work.thesisRef}).`;

    // Estado de favorito en el modal
    const isFav = state.favorites.has(work.id);
    DOM.modalFavBtn.classList.toggle("is-fav", isFav);
    DOM.modalFavBtn.querySelector(".fav-text").textContent = isFav ? "Guardada en Favoritos" : "Guardar en Favoritos";

    DOM.detailModal.classList.add("is-open");
    DOM.detailModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeDetailModal() {
    DOM.detailModal.classList.remove("is-open");
    DOM.detailModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    state.activeModalWorkId = null;
}

// ==========================================================================
// Favoritos & Almacenamiento Local
// ==========================================================================
function toggleFavorite(workId) {
    const id = Number(workId);
    if (state.favorites.has(id)) {
        state.favorites.delete(id);
        showToast("Obra eliminada de Favoritos");
    } else {
        state.favorites.add(id);
        showToast("⭐ Obra guardada en Favoritos");
    }

    localStorage.setItem("thesis_gallery_favs", JSON.stringify([...state.favorites]));

    // Actualizar botón de modal si está abierto
    if (state.activeModalWorkId === id) {
        const isFav = state.favorites.has(id);
        DOM.modalFavBtn.classList.toggle("is-fav", isFav);
        DOM.modalFavBtn.querySelector(".fav-text").textContent = isFav ? "Guardada en Favoritos" : "Guardar en Favoritos";
    }

    render();
}

// ==========================================================================
// Toast Notification
// ==========================================================================
let toastTimeout;
function showToast(message) {
    DOM.toast.textContent = message;
    DOM.toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        DOM.toast.classList.remove("show");
    }, 2400);
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function setupEventListeners() {
    // Search input
    DOM.searchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        DOM.btnClearSearch.style.display = state.searchQuery ? "block" : "none";
        render();
    });

    DOM.btnClearSearch.addEventListener("click", () => {
        state.searchQuery = "";
        DOM.searchInput.value = "";
        DOM.btnClearSearch.style.display = "none";
        DOM.searchInput.focus();
        render();
    });

    // Filters
    DOM.filterArtist.addEventListener("change", (e) => {
        state.selectedArtist = e.target.value;
        render();
    });

    DOM.filterTechnique.addEventListener("change", (e) => {
        state.selectedTechnique = e.target.value;
        render();
    });

    DOM.sortBy.addEventListener("change", (e) => {
        state.sortBy = e.target.value;
        render();
    });

    // Reset Filters
    const resetAll = () => {
        state.searchQuery = "";
        state.selectedArtist = "all";
        state.selectedTechnique = "all";
        state.sortBy = "thesis-asc";
        state.currentView = "grid";

        DOM.searchInput.value = "";
        DOM.filterArtist.value = "all";
        DOM.filterTechnique.value = "all";
        DOM.sortBy.value = "thesis-asc";
        DOM.btnClearSearch.style.display = "none";

        updateViewButtons("grid");
        render();
        showToast("Filtros restablecidos");
    };

    DOM.btnResetFilters.addEventListener("click", resetAll);
    DOM.btnEmptyReset.addEventListener("click", resetAll);

    // View Switchers
    DOM.btnViewGrid.addEventListener("click", () => switchView("grid"));
    DOM.btnViewList.addEventListener("click", () => switchView("list"));
    DOM.btnViewFavs.addEventListener("click", () => switchView("favs"));

    // Delegación de clicks en galería y catálogo (Abrir modal, favoritos, autor)
    document.addEventListener("click", (e) => {
        // Abrir Ficha
        const detailBtn = e.target.closest(".btn-card-detail");
        if (detailBtn) {
            openDetailModal(detailBtn.dataset.id);
            return;
        }

        // Toggle Favorito
        const favBtn = e.target.closest(".art-fav-btn");
        if (favBtn) {
            e.stopPropagation();
            toggleFavorite(favBtn.dataset.id);
            return;
        }

        // Click en nombre de artista para filtrar directamente
        const authorEl = e.target.closest(".art-author");
        if (authorEl && authorEl.dataset.author) {
            state.selectedArtist = authorEl.dataset.author;
            DOM.filterArtist.value = state.selectedArtist;
            render();
            document.getElementById("controls-section").scrollIntoView({ behavior: "smooth" });
            showToast(`Filtrando por ${state.selectedArtist}`);
            return;
        }

        // Quitar chip individual
        const chipRemove = e.target.closest(".chip-remove");
        if (chipRemove) {
            const type = chipRemove.dataset.chipType;
            if (type === "search") {
                state.searchQuery = "";
                DOM.searchInput.value = "";
                DOM.btnClearSearch.style.display = "none";
            } else if (type === "artist") {
                state.selectedArtist = "all";
                DOM.filterArtist.value = "all";
            } else if (type === "technique") {
                state.selectedTechnique = "all";
                DOM.filterTechnique.value = "all";
            } else if (type === "view") {
                switchView("grid");
                return;
            }
            render();
        }
    });

    // Modal listeners
    DOM.btnModalClose.addEventListener("click", closeDetailModal);
    DOM.detailModal.addEventListener("click", (e) => {
        if (e.target === DOM.detailModal) {
            closeDetailModal();
        }
    });

    DOM.modalFavBtn.addEventListener("click", () => {
        if (state.activeModalWorkId) {
            toggleFavorite(state.activeModalWorkId);
        }
    });

    DOM.btnCopyCitation.addEventListener("click", () => {
        const text = DOM.btnCopyCitation.dataset.citation;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showToast("📋 Cita académica copiada");
            });
        }
    });

    // Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && DOM.detailModal.classList.contains("is-open")) {
            closeDetailModal();
        } else if (e.key === "/" && document.activeElement !== DOM.searchInput) {
            e.preventDefault();
            DOM.searchInput.focus();
        }
    });

    // Scroll to Top
    window.addEventListener("scroll", () => {
        if (window.scrollY > 400) {
            DOM.btnScrollTop.classList.add("visible");
        } else {
            DOM.btnScrollTop.classList.remove("visible");
        }
    });

    DOM.btnScrollTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

function switchView(viewName) {
    state.currentView = viewName;
    updateViewButtons(viewName);
    render();
}

function updateViewButtons(activeView) {
    DOM.btnViewGrid.classList.toggle("active", activeView === "grid");
    DOM.btnViewList.classList.toggle("active", activeView === "list");
    DOM.btnViewFavs.classList.toggle("active", activeView === "favs");
}

// ==========================================================================
// Iniciar Aplicación
// ==========================================================================
document.addEventListener("DOMContentLoaded", init);