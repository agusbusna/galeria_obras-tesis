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

// Ocultar la descripción mientras la imagen está en modo zoom (funciona en desktop y mobile)
lightbox.on("open", () => {
    const container = document.querySelector(".glightbox-container");
    if (!container) return;

    const checkZoom = () => {
        const zoomedByClass = !!container.querySelector(".zoomed");

        const zoomedByTransform = [...container.querySelectorAll(".gslide-image img")].some((img) => {
            const t = img.style.transform || "";
            const match = t.match(/scale\(([\d.]+)/);
            return match && parseFloat(match[1]) > 1.01;
        });

        container.classList.toggle("is-zoomed-active", zoomedByClass || zoomedByTransform);
    };

    const zoomObserver = new MutationObserver(checkZoom);
    zoomObserver.observe(container, {
        attributes: true,
        attributeFilter: ["class", "style"],
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