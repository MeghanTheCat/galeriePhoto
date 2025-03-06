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

        // Récupérer le pseudo depuis la table profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('pseudo')
            .eq('id', user.id)
            .single();

        // Récupérer le pseudo ou utiliser l'email comme fallback
        const displayName = profile && profile.pseudo ? profile.pseudo : user.email;

        document.querySelector('.user-section').innerHTML = `
            <span class="user-name">${displayName}</span>
            <button id="logoutBtn" class="logout-btn">Déconnexion</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);

        return true;
    } else {
        document.querySelector('.user-section').innerHTML = `
            <button id="loginBtn" class="login-btn">Connexion</button>
            <button id="registerBtn" class="register-btn">Inscription</button>
        `;
        document.getElementById('loginBtn').addEventListener('click', () => window.location.href = '../index.html');
        document.getElementById('registerBtn').addEventListener('click', () => window.location.href = '../index.html');

        // Cacher les boutons d'ajout de photos pour les visiteurs non connectés
        document.querySelectorAll('.add-photo-btn').forEach(btn => {
            btn.style.display = 'none';
        });

        return false;
    }
}

// Fonction de déconnexion
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        window.location.href = '../index.html';
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
            window.location.href = '../index.html';
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
            window.location.href = '../index.html';
            return;
        }

        // Récupérer le pseudo du propriétaire à partir de la table profiles
        let ownerPseudo = 'Utilisateur inconnu';
        if (album.created_by) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('pseudo')
                .eq('id', album.created_by)
                .single();

            if (!profileError && profile) {
                ownerPseudo = profile.pseudo;
            }
        }

        // Mettre à jour les détails de l'album dans la page
        document.getElementById('albumTitle').textContent = album.title;

        // Mise à jour de la description pour inclure le propriétaire
        const descriptionEl = document.getElementById('albumDescription');

        // Créer un élément pour le propriétaire
        const ownerEl = document.createElement('div');
        ownerEl.className = 'album-owner';
        ownerEl.textContent = `Par ${ownerPseudo}`;

        // Ajouter la description si elle existe
        if (album.description) {
            descriptionEl.textContent = album.description;
        } else {
            descriptionEl.textContent = '';
        }

        // Ajouter l'information du propriétaire après la description
        descriptionEl.appendChild(document.createElement('br'));
        descriptionEl.appendChild(ownerEl);

        document.title = `${album.title} | Ma Galerie Photo`;

        // Stocker l'album courant
        currentAlbum = album;

        // Vérifier si l'utilisateur connecté est le propriétaire de l'album
        const isAlbumOwner = currentUser && currentUser.id === album.created_by;

        // Afficher ou masquer les boutons d'ajout de photos selon les droits
        document.querySelectorAll('.add-photo-btn').forEach(btn => {
            btn.style.display = isAlbumOwner ? 'inline-block' : 'none';
        });

        // Mettre à jour le compteur de photos pour s'assurer qu'il est correct
        if (currentUser && isAlbumOwner) {
            await updatePhotoCount();
        }

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
        const loadingElement = document.getElementById('loading');
        const photosGridElement = document.getElementById('photosGrid');
        const noPhotosElement = document.getElementById('noPhotos');

        // Vérifier que les éléments existent
        if (!loadingElement || !photosGridElement) {
            console.error("Éléments DOM requis non trouvés");
            return;
        }

        loadingElement.style.display = 'block';
        photosGridElement.style.display = 'none';

        // Vérifier si l'utilisateur est le propriétaire de l'album
        const isAlbumOwner = currentUser && currentAlbum && currentUser.id === currentAlbum.created_by;

        // Récupérer les photos depuis Supabase
        const { data: photos, error } = await supabase
            .from('photos')
            .select('*')
            .eq('album_id', currentAlbumId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Vider la grille existante
        photosGridElement.innerHTML = '';

        // Ajouter la classe masonry-grid pour la mise en page moderne
        photosGridElement.classList.add('masonry-grid');

        // Afficher un message s'il n'y a pas de photos
        if (!photos || photos.length === 0) {
            if (noPhotosElement) {
                noPhotosElement.style.display = 'block';

                // Adapter le message selon que l'utilisateur est le propriétaire ou non
                if (isAlbumOwner) {
                    noPhotosElement.innerHTML = `
                        <p>Cet album ne contient pas encore de photos.</p>
                        <button class="add-photo-btn" id="addFirstPhotoBtn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 5v14M5 12h14"></path>
                            </svg>
                            Ajouter ma première photo
                        </button>
                    `;
                    // Vérifier si le bouton existe avant d'ajouter l'écouteur d'événement
                    const addFirstPhotoBtn = document.getElementById('addFirstPhotoBtn');
                    if (addFirstPhotoBtn) {
                        addFirstPhotoBtn.addEventListener('click', openPhotoModal);
                    }
                } else {
                    noPhotosElement.innerHTML = `
                        <p>Cet album ne contient pas encore de photos.</p>
                    `;
                }
            }
        } else {
            // Cacher le message "pas de photos" si l'élément existe
            if (noPhotosElement) {
                noPhotosElement.style.display = 'none';
            }

            // Ajouter l'icône "+" au bouton d'ajout
            const addPhotoBtn = document.getElementById('addPhotoBtn');
            if (addPhotoBtn) {
                addPhotoBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5v14M5 12h14"></path>
                    </svg>
                    Ajouter des photos
                `;
            }

            // Créer chaque carte de photo
            photos.forEach((photo, index) => {
                const photoCard = document.createElement('div');
                photoCard.className = 'photo-card';
                photoCard.dataset.id = photo.id;
                photoCard.dataset.title = photo.title || '';

                // La hauteur sera ajustée dynamiquement par setupMasonryGrid()

                // Construire l'URL publique pour l'image
                let publicUrl;
                try {
                    const { data } = supabase.storage
                        .from('photos')
                        .getPublicUrl(photo.storage_path);

                    publicUrl = data.publicUrl;
                } catch (error) {
                    console.error("Erreur lors de la récupération de l'URL:", error);
                    // Fallback sur l'URL directe si disponible
                    publicUrl = photo.storage_path;
                }

                photoCard.innerHTML = `
                    <div class="photo-thumbnail">
                        <img src="${publicUrl}" alt="${photo.title || 'Photo'}" 
                            onerror="this.onerror=null; this.src='/path/to/fallback-image.jpg'; console.error('Impossible de charger:', this.alt);">
                    </div>
                `;

                // Ouvrir la photo en grand au clic
                photoCard.addEventListener('click', () => openPhotoViewer(photo, publicUrl));

                photosGridElement.appendChild(photoCard);
            });
        }

        // Cacher l'indicateur de chargement et afficher la grille
        loadingElement.style.display = 'none';
        photosGridElement.style.display = 'grid';

        // Appliquer le layout masonry après affichage
        setTimeout(() => {
            setupMasonryGrid();
            addPhotoInfoOverlays();
            animatePhotos();
        }, 100);

    } catch (error) {
        console.error('Erreur lors du chargement des photos:', error);
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.textContent = 'Erreur lors du chargement des photos.';
        }
    }
}

// Fonction pour mettre à jour le compteur de photos de l'album
async function updatePhotoCount() {
    try {
        // Récupérer le nombre réel de photos dans l'album
        const { count, error } = await supabase
            .from('photos')
            .select('id', { count: 'exact' })
            .eq('album_id', currentAlbumId);

        if (error) throw error;

        // Mettre à jour le compteur dans la table albums
        const { error: updateError } = await supabase
            .from('albums')
            .update({
                photo_count: count,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentAlbumId);

        if (updateError) throw updateError;

        // Mettre à jour l'objet currentAlbum localement
        if (currentAlbum) {
            currentAlbum.photo_count = count;
        }

        console.log(`Compteur de photos mis à jour: ${count} photos`);

    } catch (error) {
        console.error('Erreur lors de la mise à jour du compteur de photos:', error);
    }
}

// Fonction pour supprimer une photo
async function deletePhoto(photo) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
        return;
    }

    try {
        // Supprimer le fichier du storage
        const { error: storageError } = await supabase.storage
            .from('photos')
            .remove([photo.storage_path]);

        if (storageError) {
            console.error('Erreur lors de la suppression du fichier:', storageError);
            // Continuer malgré l'erreur de suppression du fichier
            // pour au moins supprimer l'entrée de la base de données
        }

        // Supprimer l'entrée de la base de données
        const { error: dbError } = await supabase
            .from('photos')
            .delete()
            .eq('id', photo.id);

        if (dbError) throw dbError;

        // Mettre à jour le compteur de photos
        await updatePhotoCount();

        // Fermer la visionneuse si elle est ouverte
        closePhotoViewer();

        // Recharger les photos pour mettre à jour l'affichage
        await loadPhotos();

        console.log('Photo supprimée avec succès');
    } catch (error) {
        console.error('Erreur lors de la suppression de la photo:', error);
        alert('Une erreur est survenue lors de la suppression de la photo.');
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
        const photoDescription = document.getElementById('photoDescription')?.value || ''; // Si vous ajoutez un champ description
        const photoFile = document.getElementById('photoFile').files[0];

        if (!photoFile) {
            alert('Veuillez sélectionner une image.');
            submitBtn.textContent = initialButtonText;
            submitBtn.disabled = false;
            return;
        }

        // Générer un nom de fichier unique
        const fileExt = photoFile.name.split('.').pop();
        const filename = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        // Créer le chemin de stockage dans le format souhaité
        const storagePath = `assets/${currentAlbumId}/${filename}`;

        // Télécharger l'image dans le storage Supabase
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('photos')
            .upload(storagePath, photoFile);

        if (uploadError) throw uploadError;

        // Récupérer l'URL publique de l'image (utile pour l'affichage)
        const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(storagePath);

        // Timestamp actuel pour created_at et updated_at
        const currentTimestamp = new Date().toISOString();

        // Ajouter l'information de la photo dans la base de données
        const { data: photo, error: insertError } = await supabase
            .from('photos')
            .insert([
                {
                    album_id: currentAlbumId,
                    filename: filename,
                    storage_path: storagePath,
                    title: photoTitle,
                    description: photoDescription,
                    created_at: currentTimestamp,
                    updated_at: currentTimestamp
                }
            ])
            .select()
            .single();

        if (insertError) throw insertError;

        // Mettre à jour le compteur de photos en comptant le nombre réel de photos
        await updatePhotoCount();

        // Si c'est la première photo, définir comme image de couverture
        if (currentAlbum && currentAlbum.photo_count === 1 && !currentAlbum.cover_image_url) {
            const { error: updateError } = await supabase
                .from('albums')
                .update({
                    cover_image_url: publicUrl,
                    updated_at: currentTimestamp
                })
                .eq('id', currentAlbumId);

            if (updateError) console.error('Erreur lors de la mise à jour de l\'image de couverture:', updateError);
        }

        // Fermer la modal et recharger les photos
        closePhotoModal();
        await loadPhotos(); // Recharger uniquement les photos au lieu de l'album complet
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la photo:', error);
        alert('Une erreur est survenue lors de l\'ajout de la photo.');
    } finally {
        submitBtn.textContent = initialButtonText;
        submitBtn.disabled = false;
    }
}

// Ouvrir la visionneuse de photo avec contrôle d'accès basé sur le propriétaire
function openPhotoViewer(photo, publicUrl) {
    console.log("Ouverture de la photo:", photo);

    const modal = document.getElementById('viewPhotoModal');
    const photoImg = document.getElementById('currentPhoto');
    const photoTitle = document.getElementById('photoViewTitle');
    const photoDescription = document.getElementById('photoViewDescription');
    const deleteBtn = document.getElementById('deletePhotoBtn');

    if (!modal || !photoImg) {
        console.error("Éléments du visualiseur manquants");
        return;
    }

    // Utiliser l'URL fournie ou reconstruire l'URL si nécessaire
    if (!publicUrl) {
        try {
            const { data } = supabase.storage
                .from('photos')
                .getPublicUrl(photo.storage_path);

            publicUrl = data.publicUrl;
        } catch (error) {
            console.error("Erreur lors de la récupération de l'URL:", error);
            // Fallback sur l'URL directe si disponible
            publicUrl = photo.storage_path;
        }
    }

    // Vérifier que l'URL n'est pas undefined
    if (!publicUrl) {
        console.error("Impossible d'obtenir l'URL de l'image");
        return;
    }

    photoImg.src = publicUrl;
    photoImg.alt = photo.title || 'Photo';

    if (photoTitle) {
        if (photo.title) {
            photoTitle.textContent = photo.title;
            photoTitle.style.display = 'block';
        } else {
            photoTitle.style.display = 'none';
        }
    }

    // Afficher la description si elle existe
    if (photoDescription) {
        if (photo.description) {
            photoDescription.textContent = photo.description;
            photoDescription.style.display = 'block';
        } else {
            photoDescription.style.display = 'none';
        }
    }

    // Vérification si l'utilisateur est le propriétaire de l'album
    const isAlbumOwner = currentUser && currentAlbum && currentAlbum.created_by === currentUser.id;

    // Configuration du bouton de suppression - uniquement pour le propriétaire de l'album
    if (deleteBtn) {
        if (isAlbumOwner) {
            deleteBtn.style.display = 'flex';
            deleteBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Supprimer
            `;
            deleteBtn.onclick = () => deletePhoto(photo);
        } else {
            deleteBtn.style.display = 'none';
        }
    }

    modal.classList.add('modal-visible');
}

// Fermer la visionneuse de photo
function closePhotoViewer() {
    const modal = document.getElementById('viewPhotoModal');
    const photoViewer = modal.querySelector('.photo-viewer');

    if (photoViewer) {
        photoViewer.style.opacity = '0';
        photoViewer.style.transform = 'scale(0.95)';

        setTimeout(() => {
            modal.classList.remove('modal-visible');
            // Réinitialiser les styles pour la prochaine ouverture
            setTimeout(() => {
                photoViewer.style.opacity = '';
                photoViewer.style.transform = '';
            }, 300);
        }, 300);
    } else {
        modal.classList.remove('modal-visible');
    }
}

// Initialisation 
document.addEventListener('DOMContentLoaded', async () => {
    const isLoggedIn = await checkAuth();
    await loadAlbumDetails(); // Charger les détails que l'utilisateur soit connecté ou non

    // Configuration des gestionnaires d'événements
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    // Vérifier si l'utilisateur est le propriétaire de l'album
    const isAlbumOwner = currentUser && currentAlbum && currentUser.id === currentAlbum.created_by;

    // Configuration des boutons uniquement si l'utilisateur est connecté ET est le propriétaire
    if (isLoggedIn && isAlbumOwner) {
        document.getElementById('addPhotoBtn').addEventListener('click', openPhotoModal);
        document.getElementById('closeModalBtn').addEventListener('click', closePhotoModal);
        document.getElementById('photoForm').addEventListener('submit', addPhoto);
        document.getElementById('photoFile').addEventListener('change', previewPhoto);
    }

    document.getElementById('closeViewModalBtn').addEventListener('click', closePhotoViewer);

    // Fermer modals si clic en dehors
    document.getElementById('photoModal')?.addEventListener('click', function (event) {
        if (event.target === this) closePhotoModal();
    });

    document.getElementById('viewPhotoModal').addEventListener('click', function (event) {
        if (event.target === this) closePhotoViewer();
    });
});