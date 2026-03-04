document.addEventListener("DOMContentLoaded", function () {
    // Initialiser Isotope si la galerie existe
    const galleryWrapper = document.querySelector(".gallery-wrapper");
    let isotopeInstance;
    if (galleryWrapper) {
        isotopeInstance = new Isotope(galleryWrapper, {
            itemSelector: ".element-item",
            layoutMode: "fitRows"
        });
    }

    // Gestion des catégories de filtrage
    const filterMenu = document.querySelector(".categories-filter");
    if (filterMenu) {
        filterMenu.addEventListener("click", function (event) {
            const target = event.target;
            if (matchesSelector(target, "li a")) {
                const filterValue = target.getAttribute("data-filter");
                if (filterValue && isotopeInstance) {
                    isotopeInstance.arrange({ filter: filterValue });
                }
            }
        });

        // Ajouter une classe "active" au bouton sélectionné
        filterMenu.querySelectorAll("li a").forEach(function (filterLink) {
            filterLink.addEventListener("click", function () {
                const activeLink = filterMenu.querySelector(".active");
                if (activeLink) {
                    activeLink.classList.remove("active");
                }
                filterLink.classList.add("active");
            });
        });
    }

    // Initialiser GLightbox
    const lightbox = GLightbox({
        selector: ".image-popup",
        title: false
    });
});
