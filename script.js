const lightbox = GLightbox({
    selector: ".glightbox",
    loop: true,
    touchNavigation: true,
    keyboardNavigation: true,
    zoomable: true,
    closeOnOutsideClick: true
});

lightbox.on("slide_after_load", ({ slide }) => {

    const element = slide.trigger;

    const title = element.dataset.title;
    const technique = element.dataset.technique;
    const author = element.dataset.description;

    const titleElement = slide.slideNode.querySelector(".gslide-title");
    const descriptionElement = slide.slideNode.querySelector(".gslide-description");

    titleElement.innerHTML = title;

    descriptionElement.innerHTML = `
        <div class="technique">${technique}</div>
        <div class="author">${author}</div>
    `;
});

lightbox.on("open", () => {
    const container = document.querySelector(".glightbox-container");
    if (!container) return;

    const zoomObserver = new MutationObserver(() => {
        const isZoomed = !!container.querySelector(".zoomed");
        container.classList.toggle("is-zoomed-active", isZoomed);
    });

    zoomObserver.observe(container, {
        attributes: true,
        attributeFilter: ["class"],
        subtree: true
    });

    container._zoomObserver = zoomObserver;
});

lightbox.on("close", () => {
    const container = document.querySelector(".glightbox-container");
    if (container && container._zoomObserver) {
        container._zoomObserver.disconnect();
        delete container._zoomObserver;
    }
});