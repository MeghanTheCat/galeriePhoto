// Configuration Supabase
const SUPABASE_URL = 'https://dwmsjqlgxnsnaqudsbxw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bXNqcWxneG5zbmFxdWRzYnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzEzMTEsImV4cCI6MjA1Njc0NzMxMX0.WGz-U7imvPc91NB8iLCd5FPug8D0heVtP59tRLN0zfc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// État de l'application
let currentUser = null;
let currentAlbum = null;
let currentAlbumId = null;

// Récupérer l'ID de l'album depuis l'URL
function getAlbumIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Vérifier si l'utilisateur est connecté
async function checkAuth() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user) {
        currentUser = user;
        document.querySelector('.user-section').innerHTML = `
            <span class="user-email">${user.email}</span>
            <button id="logoutBtn" class="logout-btn">Déconnexion</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        return true;
    } else {
        document.querySelector('.user-section').innerHTML = `
            <button id="loginBtn" class="login-btn">Connexion</button>
            <button id="registerBtn" class="register-btn">Inscription</button>
        `;
        // Rediriger vers la page d'accueil si non connecté
        alert('Veuillez vous connecter pour accéder à cet album.');
        window.location.href = 'index.html';
        return false;
    }
}

// Fonction de déconnexion
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
    }
}

// Charger les détails de l'album
async function loadAlbumDetails() {
    try {
        // Récupérer l'ID de l'album depuis l'URL
        currentAlbumId = getAlbumIdFromUrl();

        if (!currentAlbumId) {
            alert('Album non trouvé.');
            window.location.href = 'index.html';
            return;
        }

        // Récupérer les détails de l'album depuis Supabase
        const { data: album, error } = await supabase
            .from('albums')
            .select('*')
            .eq('id', currentAlbumId)
            .single();

        if (error) throw error;

        if (!album) {
            alert('Album non trouvé.');
            window.location.href = 'index.html';
            return;
        }

        // Vérifier si l'utilisateur actuel est le propriétaire de l'album
        // Si vous voulez implémenter cette vérification
        // if (album.created_by !== currentUser.id) {
        //     alert('Vous n\'avez pas accès à cet album.');
        //     window.location.href = 'index.html';
        //     return;
        // }

        // Mettre à jour les détails de l'album dans la page
        document.getElementById('albumTitle').textContent = album.title;
        document.getElementById('albumDescription').textContent = album.description || '';
        document.title = `${album.title} | Ma Galerie Photo`;

        // Stocker l'album courant
        currentAlbum = album;

        // Charger les photos de l'album
        loadPhotos();
    } catch (error) {
        console.error('Erreur lors du chargement des détails de l\'album:', error);
        alert('Une erreur est survenue lors du chargement de l\'album.');
    }
}

// Charger les photos de l'album
async function loadPhotos() {
    try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('photosGrid').style.display = 'none';

        // Récupérer les photos depuis Supabase (à créer dans votre base de données)
        const { data: photos, error } = await supabase
            .from('photos')
            .select('*')
            .eq('album_id', currentAlbumId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const photosGrid = document.getElementById('photosGrid');
        const noPhotos = document.getElementById('noPhotos');

        // Vider la grille existante
        photosGrid.innerHTML = '';

        // Afficher un message s'il n'y a pas de photos
        if (!photos || photos.length === 0) {
            noPhotos.style.display = 'block';
            document.getElementById('addFirstPhotoBtn').addEventListener('click', openPhotoModal);
        } else {
            noPhotos.style.display = 'none';

            // Afficher chaque photo
            photos.forEach(photo => {
                const photoCard = document.createElement('div');
                photoCard.className = 'photo-card';
                photoCard.dataset.id = photo.id;

                photoCard.innerHTML = `
                    <div class="photo-thumbnail">
                        <img src="${photo.photo_url}" alt="${photo.title || 'Photo'}">
                    </div>
                    ${photo.title ? `<div class="photo-title">${photo.title}</div>` : ''}
                `;

                // Ouvrir la photo en grand au clic
                photoCard.addEventListener('click', () => openPhotoViewer(photo));

                photosGrid.appendChild(photoCard);
            });
        }

        // Cacher l'indicateur de chargement
        document.getElementById('loading').style.display = 'none';
        photosGrid.style.display = 'grid';
    } catch (error) {
        console.error('Erreur lors du chargement des photos:', error);
        document.getElementById('loading').textContent = 'Erreur lors du chargement des photos.';
    }
}

// Ouvrir la modal d'ajout de photo
function openPhotoModal() {
    document.getElementById('photoModal').classList.add('modal-visible');
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoForm').reset();
}

// Fermer la modal d'ajout de photo
function closePhotoModal() {
    document.getElementById('photoModal').classList.remove('modal-visible');
    document.getElementById('photoForm').reset();
    document.getElementById('photoPreview').style.display = 'none';
}

// Prévisualiser l'image sélectionnée
function previewPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('photoPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}

// Ajouter une photo à l'album
async function addPhoto(event) {
    event.preventDefault();

    const submitBtn = document.querySelector('.submit-btn');
    const initialButtonText = submitBtn.textContent;
    submitBtn.textContent = 'Ajout en cours...';
    submitBtn.disabled = true;

    try {
        const photoTitle = document.getElementById('photoTitle').value;
        const photoFile = document.getElementById('photoFile').files[0];

        if (!photoFile) {
            alert('Veuillez sélectionner une image.');
            submitBtn.textContent = initialButtonText;
            submitBtn.disabled = false;
            return;
        }

        // Générer un nom de fichier unique
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `photos/${currentAlbumId}/${fileName}`;

        // Télécharger l'image dans le storage Supabase
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('album-photos')
            .upload(filePath, photoFile);

        if (uploadError) throw uploadError;

        // Récupérer l'URL publique de l'image
        const { data: { publicUrl } } = supabase.storage
            .from('album-photos')
            .getPublicUrl(filePath);

        // Ajouter l'information de la photo dans la base de données
        const { data: photo, error: insertError } = await supabase
            .from('photos')
            .insert([
                {
                    album_id: currentAlbumId,
                    title: photoTitle,
                    photo_url: publicUrl,
                    created_by: currentUser.id,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (insertError) throw insertError;

        // Mettre à jour le compteur de photos de l'album
        const { error: updateError } = await supabase
            .from('albums')
            .update({
                photo_count: (currentAlbum.photo_count || 0) + 1,
                updated_at: new Date().toISOString(),
                cover_image_url: currentAlbum.photo_count === 0 ? publicUrl : currentAlbum.cover_image_url
            })
            .eq('id', currentAlbumId);

        if (updateError) throw updateError;

        // Fermer la modal et recharger les photos
        closePhotoModal();
        await loadAlbumDetails(); // Recharger l'album pour avoir le compteur à jour
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la photo:', error);
        alert('Une erreur est survenue lors de l\'ajout de la photo.');
    } finally {
        submitBtn.textContent = initialButtonText;
        submitBtn.disabled = false;
    }
}

// Ouvrir la visionneuse de photo
function openPhotoViewer(photo) {
    const modal = document.getElementById('viewPhotoModal');
    const photoImg = document.getElementById('currentPhoto');
    const photoTitle = document.getElementById('photoViewTitle');

    photoImg.src = photo.photo_url;
    photoTitle.textContent = photo.title || '';

    modal.classList.add('modal-visible');
}

// Fermer la visionneuse de photo
function closePhotoViewer() {
    document.getElementById('viewPhotoModal').classList.remove('modal-visible');
}

// Initialisation 
document.addEventListener('DOMContentLoaded', async () => {
    const isLoggedIn = await checkAuth();
    if (isLoggedIn) {
        await loadAlbumDetails();
    }

    // Configuration des gestionnaires d'événements
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.getElementById('addPhotoBtn').addEventListener('click', openPhotoModal);
    document.getElementById('closeModalBtn').addEventListener('click', closePhotoModal);
    document.getElementById('photoForm').addEventListener('submit', addPhoto);
    document.getElementById('photoFile').addEventListener('change', previewPhoto);

    document.getElementById('closeViewModalBtn').addEventListener('click', closePhotoViewer);

    // Fermer modals si clic en dehors
    document.getElementById('photoModal').addEventListener('click', function (event) {
        if (event.target === this) closePhotoModal();
    });

    document.getElementById('viewPhotoModal').addEventListener('click', function (event) {
        if (event.target === this) closePhotoViewer();
    });
});