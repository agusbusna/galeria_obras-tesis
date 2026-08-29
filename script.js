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