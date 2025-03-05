// Structure de données pour stocker les albums
let albums = JSON.parse(localStorage.getItem('photoGalleryAlbums')) || [];

// Sélection des éléments DOM
const albumsGrid = document.getElementById('albumsGrid');
const noAlbums = document.getElementById('noAlbums');
const albumModal = document.getElementById('albumModal');
const albumForm = document.getElementById('albumForm');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const createFirstAlbumBtn = document.getElementById('createFirstAlbumBtn');

// Afficher ou masquer le message "pas d'albums"
function toggleNoAlbumsMessage() {
    if (albums.length === 0) {
        noAlbums.style.display = 'block';
        albumsGrid.style.display = 'block'; // Gardez la grille visible pour contenir le message
    } else {
        noAlbums.style.display = 'none';
        albumsGrid.style.display = 'grid';
    }
}

// Rendre les albums dans la grille
function renderAlbums() {
    // Vider la grille sauf le message "pas d'albums"
    albumsGrid.innerHTML = '';
    albumsGrid.appendChild(noAlbums);

    // Afficher chaque album
    albums.forEach((album, index) => {
        const albumCard = document.createElement('div');
        albumCard.className = 'album-card';
        albumCard.dataset.id = index;

        // Définir le contenu HTML de l'album
        albumCard.innerHTML = `
                    <div class="album-thumbnail">
                        <img src="${album.coverImage || '/api/placeholder/400/320'}" alt="${album.title}">
                    </div>
                    <div class="album-info">
                        <h3 class="album-title">${album.title}</h3>
                        <p class="album-stats">${album.photos ? album.photos.length : 0} photos · Créé le ${new Date(album.createdAt).toLocaleDateString()}</p>
                    </div>
                `;

        // Ajouter l'événement de clic pour ouvrir l'album
        albumCard.addEventListener('click', () => {
            // Rediriger vers la page de l'album (à implémenter plus tard)
            console.log(`Ouvrir l'album: ${album.title}`);
            // Ici, vous pourriez rediriger vers une page spécifique à l'album avec:
            // window.location.href = `album.html?id=${index}`;
        });

        albumsGrid.appendChild(albumCard);
    });

    toggleNoAlbumsMessage();
}

// Ouvrir la fenêtre modale
function openModal() {
    albumModal.classList.add('modal-visible');
}

// Fermer la fenêtre modale
function closeModal() {
    albumModal.classList.remove('modal-visible');
    albumForm.reset();
}

// Créer un nouvel album
function createAlbum(event) {
    event.preventDefault();

    const title = document.getElementById('albumTitle').value;
    const description = document.getElementById('albumDescription').value;

    const newAlbum = {
        title,
        description,
        createdAt: new Date().toISOString(),
        photos: []
    };

    albums.push(newAlbum);
    localStorage.setItem('photoGalleryAlbums', JSON.stringify(albums));

    renderAlbums();
    closeModal();
}

// Gestionnaires d'événements
openModalBtn.addEventListener('click', openModal);
createFirstAlbumBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
albumForm.addEventListener('submit', createAlbum);

// Fermer la modale si on clique en dehors
albumModal.addEventListener('click', function (event) {
    if (event.target === albumModal) {
        closeModal();
    }
});

// Afficher les albums au chargement de la page
document.addEventListener('DOMContentLoaded', renderAlbums);