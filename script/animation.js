// animations.js - Animations chaleureuses et fluides
document.addEventListener('DOMContentLoaded', function () {
    // Appliquer des animations aux albums
    animateAlbums();

    // Appliquer des animations aux photos si nous sommes sur la page album
    if (document.querySelector('.photos-grid')) {
        setupMasonryGrid();
        animatePhotos();
    }

    // Ajouter des transitions de page fluides
    initPageTransitions();

    // Améliorer les animations des modales
    enhanceModalAnimations();

    // Ajouter des overlays d'information aux photos
    addPhotoInfoOverlays();

    // Animer les titres et sections
    animateHeaders();
});

/**
 * Anime l'entrée des cartes d'albums avec un effet staggered
 */
function animateAlbums() {
    const albumCards = document.querySelectorAll('.album-card');

    albumCards.forEach((card, index) => {
        // Position initiale
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

        // Staggered animation avec délai progressif
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + (index * 80));

        // Effet de survol légèrement amélioré
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = 'var(--shadow-md)';

            // Animer l'image de couverture
            const thumbnail = this.querySelector('.album-thumbnail img');
            if (thumbnail) {
                thumbnail.style.transform = 'scale(1.05)';
            }
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'var(--shadow)';

            // Réinitialiser l'animation de l'image
            const thumbnail = this.querySelector('.album-thumbnail img');
            if (thumbnail) {
                thumbnail.style.transform = 'scale(1)';
            }
        });
    });
}

/**
 * Configure une disposition masonry pour les photos
 */
function setupMasonryGrid() {
    const photosGrid = document.querySelector('.photos-grid');
    if (!photosGrid) return;

    // Convertir la grille en disposition masonry
    photosGrid.classList.add('masonry-grid');

    // Configurer la disposition des photos
    const photoCards = photosGrid.querySelectorAll('.photo-card');

    photoCards.forEach((card, index) => {
        // Réinitialiser le style d'abord
        card.style.height = '220px';
        card.className = 'photo-card';

        // Distribuer les photos selon des modèles
        if (index % 6 === 0) {
            // Grande photo tous les 6 éléments
            card.classList.add('large');
            card.style.height = '440px';
        } else if (index % 8 === 3) {
            // Photo large tous les 8 éléments (décalé de 3)
            card.classList.add('wide');
            card.style.height = '220px';
        } else if (index % 5 === 2) {
            // Photo verticale tous les 5 éléments (décalé de 2)
            card.classList.add('tall');
            card.style.height = '440px';
        }

        // Optimisation pour mobile
        if (window.innerWidth <= 480) {
            card.className = 'photo-card';
            card.style.height = '160px';
        }
    });
}

/**
 * Anime l'entrée et les interactions des photos
 */
function animatePhotos() {
    const photoCards = document.querySelectorAll('.photo-card');

    photoCards.forEach((card, index) => {
        // Position initiale
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease';

        // Animation d'entrée avec délai staggered
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + (index * 50));

        // Animation au survol
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = 'var(--shadow-md)';
            this.style.zIndex = '5';

            // Animer l'image
            const img = this.querySelector('img');
            if (img) {
                img.style.transform = 'scale(1.05)';
            }

            // Afficher l'overlay d'info
            const overlay = this.querySelector('.photo-info-overlay');
            if (overlay) {
                overlay.style.transform = 'translateY(0)';
                overlay.style.opacity = '1';
            }
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'var(--shadow)';
            this.style.zIndex = '1';

            // Réinitialiser l'image
            const img = this.querySelector('img');
            if (img) {
                img.style.transform = 'scale(1)';
            }

            // Masquer l'overlay d'info
            const overlay = this.querySelector('.photo-info-overlay');
            if (overlay) {
                overlay.style.transform = 'translateY(100%)';
                overlay.style.opacity = '0';
            }
        });
    });
}

/**
 * Ajoute des overlays d'information aux photos
 */
function addPhotoInfoOverlays() {
    const photoCards = document.querySelectorAll('.photo-card');

    photoCards.forEach(card => {
        // S'assurer que l'overlay n'existe pas déjà
        if (!card.querySelector('.photo-info-overlay')) {
            // Créer l'overlay d'information
            const overlay = document.createElement('div');
            overlay.className = 'photo-info-overlay';

            // Récupérer le titre ou utiliser un placeholder
            const title = card.getAttribute('data-title') || 'Photo';
            overlay.innerHTML = `<p class="photo-title">${title}</p>`;

            // Ajouter l'overlay à la carte
            card.appendChild(overlay);
        }
    });
}

/**
 * Initialise les transitions entre les pages
 */
function initPageTransitions() {
    // Gérer les transitions de page pour les albums et boutons retour
    const albumLinks = document.querySelectorAll('.album-card');
    const backButtons = document.querySelectorAll('.back-btn');

    // Pour chaque carte d'album
    albumLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // Ne pas appliquer l'effet si on clique sur le bouton supprimer
            if (e.target.closest('.delete-album-btn')) {
                return;
            }

            e.preventDefault();
            const href = this.dataset.id ? `../pages/album.html?id=${this.dataset.id}` : null;

            if (!href) return;

            // Créer un overlay de transition élégant
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'linear-gradient(135deg, var(--primary), var(--primary-light))';
            overlay.style.zIndex = '9999';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.4s ease';

            document.body.appendChild(overlay);

            // Animation de transition
            setTimeout(() => {
                overlay.style.opacity = '1';
            }, 10);

            // Redirection après l'animation
            setTimeout(() => {
                window.location.href = href;
            }, 400);
        });
    });

    // Pour les boutons retour
    backButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();

            // Créer l'overlay de transition
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'linear-gradient(135deg, var(--primary), var(--primary-light))';
            overlay.style.zIndex = '9999';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.4s ease';

            document.body.appendChild(overlay);

            // Animation de transition
            setTimeout(() => {
                overlay.style.opacity = '1';
            }, 10);

            // Redirection
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 400);
        });
    });
}

/**
 * Améliore les animations des modales
 */
function enhanceModalAnimations() {
    // Obtenir toutes les modales et boutons
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    const modalButtons = document.querySelectorAll('.login-btn, .register-btn, .add-album-btn, .add-photo-btn');

    // Animer l'ouverture des modales
    modalButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Identifier la modale cible
            let targetModalId;
            if (this.id === 'loginBtn') targetModalId = 'loginModal';
            else if (this.id === 'registerBtn') targetModalId = 'registerModal';
            else if (this.id === 'openModalBtn' || this.id === 'createFirstAlbumBtn') targetModalId = 'albumModal';
            else if (this.id === 'addPhotoBtn' || this.id === 'addFirstPhotoBtn') targetModalId = 'photoModal';

            const targetModal = document.getElementById(targetModalId);

            if (targetModal) {
                // Assurer que la modale est bien positionnée même sur mobile
                const modalContent = targetModal.querySelector('.modal-content');
                if (modalContent) {
                    // Style de départ
                    modalContent.style.transform = 'translateY(10px) scale(0.98)';
                    modalContent.style.opacity = '0';
                    modalContent.style.transition = 'transform 0.4s ease, opacity 0.4s ease';

                    // Animation douce
                    setTimeout(() => {
                        modalContent.style.transform = 'translateY(0) scale(1)';
                        modalContent.style.opacity = '1';
                    }, 10);
                }
            }
        });
    });

    // S'assurer que les modales sont correctement positionnées sur mobile
    modalOverlays.forEach(overlay => {
        const modalContent = overlay.querySelector('.modal-content');
        if (modalContent) {
            // Ajouter un gestionnaire de défilement pour les longues modales sur mobile
            modalContent.addEventListener('scroll', function (e) {
                e.stopPropagation(); // Empêcher la propagation au document
            });
        }
    });

    // Animer la fermeture des modales
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const modal = this.closest('.modal-overlay');
            const modalContent = modal.querySelector('.modal-content');

            // Animation de sortie douce
            if (modalContent) {
                modalContent.style.transform = 'translateY(10px) scale(0.98)';
                modalContent.style.opacity = '0';
            }
        });
    });
}

/**
 * Anime les en-têtes et titres
 */
function animateHeaders() {
    const headers = document.querySelectorAll('.section-title, .album-header h1, .logo');

    headers.forEach(header => {
        // Configuration initiale
        header.style.opacity = '0';
        header.style.transform = 'translateY(10px)';
        header.style.transition = 'opacity 0.7s ease, transform 0.7s ease';

        // Animation d'entrée
        setTimeout(() => {
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
        }, 200);
    });

    // Animation pour l'en-tête de l'album
    const albumHeader = document.querySelector('.album-header');
    if (albumHeader) {
        albumHeader.style.opacity = '0';
        albumHeader.style.transform = 'translateY(15px)';
        albumHeader.style.transition = 'opacity 0.7s ease, transform 0.7s ease';

        setTimeout(() => {
            albumHeader.style.opacity = '1';
            albumHeader.style.transform = 'translateY(0)';
        }, 100);
    }
}

// Ajuster la grille masonry lors du redimensionnement de la fenêtre
window.addEventListener('resize', function () {
    if (document.querySelector('.photos-grid')) {
        setupMasonryGrid();
    }
});