// animations.js - Animations pour le thème rustique et vintage
document.addEventListener('DOMContentLoaded', function () {
    // Appliquer des animations aux albums
    animateAlbums();

    // Appliquer des animations aux photos si nous sommes sur la page album
    if (document.querySelector('.photos-grid')) {
        animatePhotos();
    }

    // Ajouter l'effet de papier vieilli à tous les éléments d'en-tête
    addVintageHeaderEffect();

    // Ajouter l'effet ondulé pour les transitions de page
    addPageTransitionEffect();

    // Animation pour l'ouverture des modales
    enhanceModalAnimations();
});

/**
 * Ajoute des animations aux cartes d'albums
 */
function animateAlbums() {
    const albumCards = document.querySelectorAll('.album-card');

    // Animer l'entrée des albums avec délai progressif
    albumCards.forEach((card, index) => {
        // Position de départ en dehors de l'écran avec opacité 0
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px) rotate(-1deg)';
        card.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        // Retarder l'animation pour chaque carte
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) rotate(-1deg)';
        }, 100 + (index * 100));

        // Ajouter des rotations légèrement différentes
        if (index % 2 === 0) {
            card.style.transform = 'translateY(0) rotate(1deg)';
        } else if (index % 3 === 0) {
            card.style.transform = 'translateY(0) rotate(-0.5deg)';
        } else if (index % 4 === 0) {
            card.style.transform = 'translateY(0) rotate(2deg)';
        }

        // Ajouter l'effet d'usure sur les bords
        addWornEdges(card);
    });
}

/**
 * Ajoute des animations aux cartes de photos
 */
function animatePhotos() {
    const photoCards = document.querySelectorAll('.photo-card');

    // Animer l'entrée des photos avec délai progressif
    photoCards.forEach((card, index) => {
        // Position de départ en dehors de l'écran avec opacité 0
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px) rotate(-1deg)';
        card.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        // Retarder l'animation pour chaque carte
        setTimeout(() => {
            card.style.opacity = '1';

            // Varier les angles de rotation pour un effet plus naturel
            if (index % 2 === 0) {
                card.style.transform = 'translateY(0) rotate(1.5deg)';
            } else if (index % 3 === 0) {
                card.style.transform = 'translateY(0) rotate(-0.5deg)';
            } else if (index % 4 === 0) {
                card.style.transform = 'translateY(0) rotate(2deg)';
            } else {
                card.style.transform = 'translateY(0) rotate(-1deg)';
            }
        }, 100 + (index * 80));

        // Ajouter l'effet d'usure sur les bords
        addWornEdges(card);

        // Ajouter un effet de coin plié aléatoirement
        if (Math.random() > 0.7) {
            addDogEar(card);
        }
    });
}

/**
 * Ajoute un effet d'usure sur les bords des éléments
 */
function addWornEdges(element) {
    // Créer une pseudo-élément pour l'effet d'usure
    const style = document.createElement('style');
    const randomId = 'worn-' + Math.floor(Math.random() * 10000);

    element.classList.add(randomId);

    style.innerHTML = `
        .${randomId}::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 1px solid rgba(121, 85, 72, 0.3);
            pointer-events: none;
            box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1);
        }
    `;

    document.head.appendChild(style);
}

/**
 * Ajoute un effet de coin plié à un élément
 */
function addDogEar(element) {
    const dogEar = document.createElement('div');
    dogEar.style.position = 'absolute';
    dogEar.style.top = '0';
    dogEar.style.right = '0';
    dogEar.style.width = '30px';
    dogEar.style.height = '30px';
    dogEar.style.backgroundColor = 'inherit';
    dogEar.style.transformOrigin = 'top right';
    dogEar.style.transform = 'rotate(-45deg)';
    dogEar.style.boxShadow = '-2px 2px 3px rgba(0, 0, 0, 0.3)';
    dogEar.style.zIndex = '1';
    dogEar.style.pointerEvents = 'none';

    element.style.overflow = 'visible';
    element.appendChild(dogEar);
}

/**
 * Ajoute des effets vintage aux en-têtes
 */
function addVintageHeaderEffect() {
    const headers = document.querySelectorAll('.logo, h1, h2, h3, .section-title');

    headers.forEach(header => {
        // Ajouter une texture subtile
        header.style.textShadow = '1px 1px 2px rgba(44, 32, 28, 0.2)';

        // Faire apparaître les titres avec un léger délai
        header.style.opacity = '0';
        header.style.transition = 'opacity 0.8s ease-in-out, transform 0.5s ease-out';
        header.style.transform = 'translateY(10px)';

        setTimeout(() => {
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
        }, 300);
    });
}

/**
 * Ajoute des effets de transition pour les changements de page
 */
function addPageTransitionEffect() {
    // Effet de transition lors de la navigation (pour les liens vers les albums)
    const albumLinks = document.querySelectorAll('.album-card');
    const backButtons = document.querySelectorAll('.back-btn');

    // Pour chaque carte d'album qui est un lien
    albumLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // Ne pas appliquer l'effet si on clique sur le bouton supprimer
            if (e.target.closest('.delete-album-btn')) {
                return;
            }

            e.preventDefault();
            const href = this.dataset.id ? `../pages/album.html?id=${this.dataset.id}` : false;

            if (!href) return;

            // Créer un overlay pour la transition
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = '#4e342e';
            overlay.style.zIndex = '9999';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.4s ease-in-out';

            document.body.appendChild(overlay);

            // Activer la transition
            setTimeout(() => {
                overlay.style.opacity = '1';
            }, 10);

            // Rediriger après la transition
            setTimeout(() => {
                window.location.href = href;
            }, 400);
        });
    });

    // Pour les boutons retour
    backButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();

            // Créer un overlay pour la transition
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = '#4e342e';
            overlay.style.zIndex = '9999';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.4s ease-in-out';

            document.body.appendChild(overlay);

            // Activer la transition
            setTimeout(() => {
                overlay.style.opacity = '1';
            }, 10);

            // Rediriger après la transition
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
    // Obtenir toutes les modales
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    const modalButtons = document.querySelectorAll('.login-btn, .register-btn, .add-album-btn, .add-photo-btn');

    // Ajouter des animations pour chaque bouton ouvrant des modales
    modalButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Trouver la modale associée (si implémentée)
            let targetModalId;
            if (this.id === 'loginBtn') targetModalId = 'loginModal';
            else if (this.id === 'registerBtn') targetModalId = 'registerModal';
            else if (this.id === 'openModalBtn' || this.id === 'createFirstAlbumBtn') targetModalId = 'albumModal';
            else if (this.id === 'addPhotoBtn') targetModalId = 'photoModal';

            const targetModal = document.getElementById(targetModalId);

            if (targetModal) {
                // Ajouter l'animation d'entrée
                const modalContent = targetModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.transform = 'scale(0.8)';
                    modalContent.style.opacity = '0';
                    modalContent.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease';

                    // Rétablir après que la classe visible soit ajoutée
                    setTimeout(() => {
                        modalContent.style.transform = 'scale(1)';
                        modalContent.style.opacity = '1';
                    }, 10);
                }
            }
        });
    });

    // Ajouter des animations de sortie
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const modal = this.closest('.modal-overlay');
            const modalContent = modal.querySelector('.modal-content');

            // Animation de sortie
            modalContent.style.transform = 'scale(0.8)';
            modalContent.style.opacity = '0';

            // Attendre la fin de l'animation avant de fermer la modale
            setTimeout(() => {
                // La logique de fermeture est gérée par les gestionnaires existants
            }, 300);
        });
    });
}