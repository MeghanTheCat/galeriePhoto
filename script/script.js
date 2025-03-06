// Configuration Supabase
const SUPABASE_URL = 'https://dwmsjqlgxnsnaqudsbxw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bXNqcWxneG5zbmFxdWRzYnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzEzMTEsImV4cCI6MjA1Njc0NzMxMX0.WGz-U7imvPc91NB8iLCd5FPug8D0heVtP59tRLN0zfc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// État de l'utilisateur
let currentUser = null;

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
            <div class="user-info">
                <span class="user-avatar">${displayName.charAt(0).toUpperCase()}</span>
                <span class="user-name">${displayName}</span>
                <button id="logoutBtn" class="logout-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>
            </div>
        `;
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        return true;
    } else {
        document.querySelector('.user-section').innerHTML = `
            <button id="loginBtn" class="login-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Connexion
            </button>
            <button id="registerBtn" class="register-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Inscription
            </button>
        `;
        document.getElementById('loginBtn').addEventListener('click', openLoginModal);
        document.getElementById('registerBtn').addEventListener('click', openRegisterModal);
        return false;
    }
}

// Fonction de connexion
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.querySelector('.login-submit');
    const initialText = loginBtn.textContent;

    loginBtn.textContent = 'Connexion en cours...';
    loginBtn.disabled = true;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        closeLoginModal();
        await checkAuth();
        loadAlbums(); // Recharger les albums après connexion
    } catch (error) {
        console.error('Erreur de connexion:', error);
        document.getElementById('loginError').textContent = 'Email ou mot de passe incorrect';
        document.getElementById('loginError').style.display = 'block';
    } finally {
        loginBtn.textContent = initialText;
        loginBtn.disabled = false;
    }
}

// Fonction d'inscription
async function handleRegister(event) {
    event.preventDefault();

    // Récupérer les valeurs du formulaire
    const email = document.getElementById('registerEmail').value;
    const pseudo = document.getElementById('registerPseudo').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const registerBtn = document.querySelector('.register-submit');
    const initialText = registerBtn.textContent;
    const errorElement = document.getElementById('registerError');

    // Vérifier si les mots de passe correspondent
    if (password !== confirmPassword) {
        errorElement.textContent = 'Les mots de passe ne correspondent pas';
        errorElement.style.display = 'block';
        return;
    }

    // Vérifier la longueur du mot de passe
    if (password.length < 6) {
        errorElement.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
        errorElement.style.display = 'block';
        return;
    }

    // Vérifier la longueur du pseudo
    if (pseudo.length < 3) {
        errorElement.textContent = 'Le pseudo doit contenir au moins 3 caractères';
        errorElement.style.display = 'block';
        return;
    }

    registerBtn.textContent = 'Création en cours...';
    registerBtn.disabled = true;
    errorElement.style.display = 'none';

    try {
        // Étape 1: Créer l'utilisateur dans Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    pseudo: pseudo // Ajouter le pseudo aux métadonnées de l'utilisateur
                }
            }
        });

        if (error) throw error;

        // Vérifier si l'inscription a réussi
        if (data.user) {
            // Étape 2: Si nécessaire, insérer des données supplémentaires dans votre table profiles
            // Si vous avez une table profiles distincte, vous pouvez y insérer des données ici
            try {
                const { error: profileError } = await supabase
                    .from('profiles') // Remplacez par le nom de votre table si différent
                    .insert([
                        {
                            id: data.user.id, // utilise l'UUID de l'utilisateur comme ID de profil
                            pseudo: pseudo,
                            email: email,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }
                    ]);

                if (profileError) {
                    console.error('Erreur lors de la création du profil:', profileError);
                    // On continue malgré cette erreur secondaire
                }
            } catch (profileInsertError) {
                console.error('Exception lors de la création du profil:', profileInsertError);
                // On continue malgré cette erreur secondaire
            }

            // Fermer le modal d'inscription
            closeRegisterModal();

            // Afficher un message de succès
            alert('Compte créé avec succès! Vous pouvez maintenant vous connecter.');

            // Ouvrir le modal de connexion
            openLoginModal();
        }
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        errorElement.textContent = error.message || 'Une erreur est survenue lors de la création du compte';
        errorElement.style.display = 'block';
    } finally {
        registerBtn.textContent = initialText;
        registerBtn.disabled = false;
    }
}

// Fonction de déconnexion
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentUser = null;
        await checkAuth();
        loadAlbums(); // Recharger les albums après déconnexion
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
    }
}

// Ouvrir modal de connexion
function openLoginModal() {
    document.getElementById('loginModal').classList.add('modal-visible');
}

// Fermer modal de connexion
function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('modal-visible');
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
}

// Ouvrir modal d'inscription
function openRegisterModal() {
    document.getElementById('registerModal').classList.add('modal-visible');
}

// Fermer modal d'inscription
function closeRegisterModal() {
    document.getElementById('registerModal').classList.remove('modal-visible');
    document.getElementById('registerForm').reset();
    document.getElementById('registerError').style.display = 'none';
}

// Fonction pour charger les albums
async function loadAlbums() {
    try {
        const loading = document.getElementById('loading') || document.createElement('div');
        if (!document.getElementById('loading')) {
            loading.id = 'loading';
            loading.className = 'loading';
            loading.textContent = 'Chargement des albums...';
            document.querySelector('.container').appendChild(loading);
        }

        // Masquer le bouton "Nouvel Album" si l'utilisateur n'est pas connecté
        const addAlbumBtn = document.getElementById('openModalBtn');
        if (addAlbumBtn) {
            // Ajouter une icône au bouton
            addAlbumBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14M5 12h14"></path>
                </svg>
                Nouvel Album
            `;
            addAlbumBtn.style.display = currentUser ? 'flex' : 'none';
        }

        // 1. D'abord, récupérer tous les albums
        const { data: albums, error } = await supabase
            .from('albums')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 2. Si nous avons des albums, récupérer les profils des propriétaires
        if (albums && albums.length > 0) {
            // Collecter tous les IDs des propriétaires d'albums
            const ownerIds = [...new Set(albums.map(album => album.created_by))];

            // Récupérer les profils correspondants
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, pseudo')
                .in('id', ownerIds);

            if (profilesError) {
                console.warn('Erreur lors de la récupération des pseudos:', profilesError);
            } else if (profiles) {
                // Créer un dictionnaire pour recherche rapide: ID -> pseudo
                const profileMap = {};
                profiles.forEach(profile => {
                    profileMap[profile.id] = profile.pseudo;
                });

                // Ajouter le pseudo à chaque album
                albums.forEach(album => {
                    album.ownerPseudo = profileMap[album.created_by] || 'Utilisateur inconnu';
                });
            }
        }

        const albumsGrid = document.getElementById('albumsGrid');
        // Vider la grille existante
        albumsGrid.innerHTML = '';

        if (albums.length === 0) {
            const noAlbums = document.createElement('div');
            noAlbums.className = 'no-albums';

            // Message différent si l'utilisateur est connecté ou non
            if (currentUser) {
                noAlbums.innerHTML = `
                    <p>Vous n'avez pas encore créé d'albums.</p>
                    <button class="add-album-btn" id="createFirstAlbumBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        Créer mon premier album
                    </button>
                `;
                albumsGrid.appendChild(noAlbums);
                document.getElementById('createFirstAlbumBtn').addEventListener('click', openModal);
            } else {
                noAlbums.innerHTML = `
                    <p>Aucun album n'est disponible pour le moment.</p>
                `;
                albumsGrid.appendChild(noAlbums);
            }
        } else {
            // Afficher chaque album avec le nouveau design
            albums.forEach(album => {
                const albumCard = document.createElement('div');
                albumCard.className = 'album-card';
                albumCard.dataset.id = album.id;

                const coverUrl = album.cover_image_url || '/assets/placeholder-album.jpg';

                // Récupérer le pseudo du propriétaire
                const ownerPseudo = album.ownerPseudo || 'Utilisateur inconnu';

                // Formater la date de création
                const creationDate = new Date(album.created_at).toLocaleDateString();

                // Inclure le bouton de suppression uniquement si l'utilisateur est connecté
                const deleteButton = currentUser && currentUser.id === album.created_by ?
                    `<button class="delete-album-btn" data-id="${album.id}" title="Supprimer cet album">
                        <span>&times;</span>
                    </button>` : '';

                albumCard.innerHTML = `
                    <div class="album-thumbnail">
                        <img src="${coverUrl}" alt="${album.title}">
                        ${deleteButton}
                    </div>
                    <div class="album-info">
                        <h3 class="album-title">${album.title}</h3>
                        <p class="album-stats">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            ${album.photo_count || 0} photos · Créé le ${creationDate}
                        </p>
                        <p class="album-owner">Par ${ownerPseudo}</p>
                    </div>
                `;

                // Ouvrir l'album au clic sur la carte (sauf si on clique sur le bouton supprimer)
                albumCard.addEventListener('click', (event) => {
                    // Ne pas naviguer vers l'album si on clique sur le bouton supprimer
                    if (!event.target.closest('.delete-album-btn')) {
                        window.location.href = `../pages/album.html?id=${album.id}`;
                    }
                });

                // Ajouter un gestionnaire spécifique pour le bouton de suppression si l'utilisateur est connecté
                if (currentUser && currentUser.id === album.created_by) {
                    const deleteBtn = albumCard.querySelector('.delete-album-btn');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', (event) => {
                            event.stopPropagation(); // Empêcher la propagation de l'événement (ne pas ouvrir l'album)
                            deleteAlbum(album);
                        });
                    }
                }

                albumsGrid.appendChild(albumCard);
            });
        }

        // Cacher l'indicateur de chargement
        loading.style.display = 'none';
        albumsGrid.style.display = 'grid';
    } catch (error) {
        console.error('Erreur lors du chargement des albums:', error);
        document.getElementById('loading').textContent = 'Erreur lors du chargement des albums.';
    }
}

// Fonction pour créer un nouvel album
async function createAlbum(event) {
    event.preventDefault();

    const submitBtn = document.querySelector('.submit-btn');
    const initialButtonText = submitBtn.textContent;
    submitBtn.textContent = 'Création en cours...';
    submitBtn.disabled = true;

    try {
        const title = document.getElementById('albumTitle').value;
        const description = document.getElementById('albumDescription').value;
        const coverFile = document.getElementById('albumCover').files[0];
        const now = new Date().toISOString();

        // URL de l'image de couverture (par défaut, utiliser un placeholder)
        let coverImageUrl = "/assets/placeholder-album.jpg"; // Chemin vers votre image placeholder

        // Si une image de couverture a été sélectionnée, la télécharger
        if (coverFile) {
            // Générer un nom de fichier unique
            const fileExt = coverFile.name.split('.').pop();
            const filename = `cover_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `covers/${filename}`;

            // Télécharger l'image dans le storage Supabase
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('photos')
                .upload(filePath, coverFile);

            if (uploadError) throw uploadError;

            // Récupérer l'URL publique de l'image
            const { data: { publicUrl } } = supabase.storage
                .from('photos')
                .getPublicUrl(filePath);

            coverImageUrl = publicUrl;
        }

        // Insérer l'album dans Supabase
        const { data: album, error } = await supabase
            .from('albums')
            .insert([
                {
                    title,
                    description,
                    created_by: currentUser.id,
                    photo_count: 0,
                    created_at: now,
                    updated_at: now,
                    cover_image_url: coverImageUrl
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // Recharger les albums pour afficher le nouveau
        closeModal();
        loadAlbums();
    } catch (error) {
        console.error('Erreur lors de la création de l\'album:', error);
        alert('Une erreur est survenue lors de la création de l\'album.');
    } finally {
        submitBtn.textContent = initialButtonText;
        submitBtn.disabled = false;
    }
}

// Fonction pour supprimer un album
async function deleteAlbum(album) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'album "${album.title}" ?\nCette action supprimera également toutes les photos contenues dans cet album et ne peut pas être annulée.`)) {
        return;
    }

    try {
        // 1. Récupérer toutes les photos de l'album
        const { data: photos, error: photosError } = await supabase
            .from('photos')
            .select('id, storage_path')
            .eq('album_id', album.id);

        if (photosError) throw photosError;

        // 2. Supprimer les fichiers stockés
        if (photos && photos.length > 0) {
            // Récupérer tous les chemins de stockage
            const storagePaths = photos.map(photo => photo.storage_path);

            // Supprimer les fichiers du stockage
            const { error: storageError } = await supabase.storage
                .from('photos')
                .remove(storagePaths);

            if (storageError) {
                console.error('Erreur lors de la suppression des fichiers:', storageError);
                // Continuer malgré l'erreur pour essayer de supprimer les références en base de données
            }

            // 3. Supprimer les entrées de photos dans la base de données
            const { error: photosDeleteError } = await supabase
                .from('photos')
                .delete()
                .eq('album_id', album.id);

            if (photosDeleteError) throw photosDeleteError;
        }

        // 4. Supprimer l'image de couverture si elle existe et n'est pas un placeholder
        if (album.cover_image_url && !album.cover_image_url.includes('placeholder')) {
            // Extraire le chemin de l'URL de couverture
            try {
                // Supposons que l'URL de couverture contient le chemin après le nom du bucket
                const coverPath = new URL(album.cover_image_url).pathname
                    .split('/object/public/photos/')[1];

                if (coverPath) {
                    await supabase.storage
                        .from('photos')
                        .remove([coverPath]);
                }
            } catch (coverError) {
                console.error('Erreur lors de la suppression de la couverture:', coverError);
                // Continuer malgré l'erreur
            }
        }

        // 5. Supprimer l'album lui-même
        const { error: albumDeleteError } = await supabase
            .from('albums')
            .delete()
            .eq('id', album.id);

        if (albumDeleteError) throw albumDeleteError;

        // 6. Recharger la liste des albums
        await loadAlbums();

        console.log(`Album "${album.title}" supprimé avec succès`);
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'album:', error);
        alert('Une erreur est survenue lors de la suppression de l\'album.');
    }
}

// Prévisualiser l'image de couverture sélectionnée
function previewCover(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('coverPreview');

    if (!preview) {
        console.error("Élément de prévisualisation non trouvé");
        return;
    }

    if (file) {
        console.log("Prévisualisation du fichier:", file.name);
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.onerror = function (e) {
            console.error("Erreur lors de la lecture du fichier:", e);
            preview.style.display = 'none';
        }
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
}

// Ouvrir modal pour créer un album
function openModal() {
    const modal = document.getElementById('albumModal');
    modal.classList.add('modal-visible');

    // Ajouter une animation d'entrée élégante
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.transform = 'translateY(20px) scale(0.95)';
        modalContent.style.opacity = '0';
        modalContent.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.1), opacity 0.4s ease';

        setTimeout(() => {
            modalContent.style.transform = 'translateY(0) scale(1)';
            modalContent.style.opacity = '1';
        }, 10);
    }
}

// Fermer modal pour créer un album
function closeModal() {
    const modal = document.getElementById('albumModal');
    const modalContent = modal.querySelector('.modal-content');

    if (modalContent) {
        modalContent.style.transform = 'translateY(20px) scale(0.95)';
        modalContent.style.opacity = '0';

        // Attendre la fin de l'animation avant de fermer la modale
        setTimeout(() => {
            modal.classList.remove('modal-visible');
            document.getElementById('albumForm').reset();

            // Réinitialiser les styles pour la prochaine ouverture
            setTimeout(() => {
                modalContent.style.transform = '';
                modalContent.style.opacity = '';
            }, 300);
        }, 300);
    } else {
        modal.classList.remove('modal-visible');
        document.getElementById('albumForm').reset();
    }
}

function enhanceAuthButtons() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    if (loginBtn) {
        loginBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Connexion
        `;
    }

    if (registerBtn) {
        registerBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Inscription
        `;
    }
}

// Initialisation 
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    loadAlbums();
    enhanceAuthButtons();

    // Configuration des gestionnaires d'événements
    document.getElementById('openModalBtn').addEventListener('click', openModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('albumForm').addEventListener('submit', createAlbum);
    document.getElementById('albumCover').addEventListener('change', previewCover);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('closeLoginModalBtn').addEventListener('click', closeLoginModal);

    // Nouveaux gestionnaires pour l'inscription
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('closeRegisterModalBtn').addEventListener('click', closeRegisterModal);

    // Fermer modals si clic en dehors
    document.getElementById('albumModal').addEventListener('click', function (event) {
        if (event.target === this) closeModal();
    });

    document.getElementById('loginModal').addEventListener('click', function (event) {
        if (event.target === this) closeLoginModal();
    });

    document.getElementById('registerModal').addEventListener('click', function (event) {
        if (event.target === this) closeRegisterModal();
    });
});