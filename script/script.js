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

    registerBtn.textContent = 'Création en cours...';
    registerBtn.disabled = true;
    errorElement.style.display = 'none';

    try {
        // Créer l'utilisateur dans Supabase
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;

        // Vérifier si l'inscription a réussi
        if (data.user) {
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

        // Si non connecté, afficher message approprié
        if (!currentUser) {
            const albumsGrid = document.getElementById('albumsGrid');
            albumsGrid.innerHTML = `
                <div class="no-albums">
                    <p>Veuillez vous connecter pour voir vos albums.</p>
                </div>
            `;
            loading.style.display = 'none';
            albumsGrid.style.display = 'block';
            document.getElementById('openModalBtn').style.display = 'none';
            return;
        } else {
            document.getElementById('openModalBtn').style.display = 'block';
        }

        // Récupérer les albums depuis Supabase
        const { data: albums, error } = await supabase
            .from('albums')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const albumsGrid = document.getElementById('albumsGrid');
        // Vider la grille existante
        albumsGrid.innerHTML = '';

        if (albums.length === 0) {
            const noAlbums = document.createElement('div');
            noAlbums.className = 'no-albums';
            noAlbums.innerHTML = `
                <p>Vous n'avez pas encore créé d'albums.</p>
                <button class="add-album-btn" id="createFirstAlbumBtn">Créer mon premier album</button>
            `;
            albumsGrid.appendChild(noAlbums);
            document.getElementById('createFirstAlbumBtn').addEventListener('click', openModal);
        } else {
            // Afficher chaque album
            albums.forEach(album => {
                const albumCard = document.createElement('div');
                albumCard.className = 'album-card';
                albumCard.dataset.id = album.id;

                const coverUrl = album.cover_image_url || '/api/placeholder/400/320';

                albumCard.innerHTML = `
                    <div class="album-thumbnail">
                        <img src="${coverUrl}" alt="${album.title}">
                    </div>
                    <div class="album-info">
                        <h3 class="album-title">${album.title}</h3>
                        <p class="album-stats">${album.photo_count || 0} photos · Créé le ${new Date(album.created_at).toLocaleDateString()}</p>
                    </div>
                `;

                // Ouvrir l'album au clic
                albumCard.addEventListener('click', () => {
                    window.location.href = `album.html?id=${album.id}`;
                });

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

        // Insérer l'album dans Supabase
        const { data: album, error } = await supabase
            .from('albums')
            .insert([
                {
                    title,
                    description,
                    user_id: currentUser.id,  // Associer l'album à l'utilisateur actuel
                    photo_count: 0
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

// Ouvrir modal pour créer un album
function openModal() {
    document.getElementById('albumModal').classList.add('modal-visible');
}

// Fermer modal pour créer un album
function closeModal() {
    document.getElementById('albumModal').classList.remove('modal-visible');
    document.getElementById('albumForm').reset();
}

// Initialisation 
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    loadAlbums();

    // Configuration des gestionnaires d'événements
    document.getElementById('openModalBtn').addEventListener('click', openModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('albumForm').addEventListener('submit', createAlbum);
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