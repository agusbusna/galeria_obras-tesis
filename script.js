const lightbox = GLightbox({

    selector: ".glightbox",

    /*
        Permite navegar entre las 31 obras.
    */
    loop: true,

    /*
        Animación al cambiar de obra.
    */
    transition: "slide",

    /*
        Permite cerrar haciendo click
        fuera de la imagen.
    */
    closeOnOutsideClick: true,

    /*
        Zoom de las imágenes.
    */
    zoomable: true,

    /*
        En dispositivos táctiles permite
        gestos como deslizar.
    */
    touchNavigation: true,

    /*
        Navegación con teclado.
    */
    keyboardNavigation: true,

    /*
        Pantalla completa.
    */
    openEffect: "fade",
    closeEffect: "fade",
    slideEffect: "slide"
});