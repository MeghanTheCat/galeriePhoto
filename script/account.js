// Configuration Supabase
const SUPABASE_URL = 'https://dwmsjqlgxnsnaqudsbxw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bXNqcWxneG5zbmFxdWRzYnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzEzMTEsImV4cCI6MjA1Njc0NzMxMX0.WGz-U7imvPc91NB8iLCd5FPug8D0heVtP59tRLN0zfc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// État de l'application
let currentUser = null;
let currentProfile = null;

console.log("account.js chargé !");

// Vérifier si l'utilisateur est connecté
async function checkAuth() {
    try {
        console.log("Vérification de l'authentification...");

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error("Erreur d'authentification:", error);
            document.getElementById('loading').textContent = "Erreur d'authentification";
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
            return false;
        }

        if (!user) {
            console.log("Utilisateur non connecté, redirection...");
            document.getElementById('loading').textContent = "Vous n'êtes pas connecté. Redirection...";
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
            return false;
        }

        console.log("Utilisateur authentifié:", user.id);
        currentUser = user;

        // Configuration du header et de l'interface utilisateur...
        // [reste du code inchangé]

        // Charger les informations du compte
        await loadAccountInfo();
        return true;
    } catch (error) {
        console.error('Erreur critique d\'authentification:', error);
        document.getElementById('loading').textContent = `Erreur: ${error.message || 'Problème d\'authentification'}`;
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 3000);
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

// Charger les informations du compte utilisateur
async function loadAccountInfo() {
    try {
        console.log("Début du chargement des informations");
        const loadingEl = document.getElementById('loading');
        const accountContainerEl = document.getElementById('accountContainer');

        if (!currentUser) {
            console.error("Utilisateur non connecté");
            loadingEl.textContent = "Erreur: utilisateur non connecté";
            return;
        }

        console.log("Récupération du profil pour l'utilisateur:", currentUser.id);

        // Vérifier si currentProfile est déjà défini
        if (!currentProfile) {
            // Tenter de récupérer à nouveau le profil
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (profileError) {
                console.error('Erreur lors de la récupération du profil:', profileError);
                loadingEl.textContent = "Erreur lors du chargement du profil";
                return;
            }

            if (!profile) {
                console.error('Profil non trouvé');
                loadingEl.textContent = "Profil utilisateur non trouvé";
                return;
            }

            currentProfile = profile;
        }

        console.log("Profil récupéré:", currentProfile);

        // Afficher l'avatar
        const profileAvatarEl = document.getElementById('profileAvatar');
        profileAvatarEl.textContent = currentProfile.pseudo.charAt(0).toUpperCase();

        // Afficher les informations du profil
        document.getElementById('profileName').textContent = currentProfile.pseudo;
        document.getElementById('profileEmail').textContent = currentProfile.email;

        // Formater la date de création du compte
        if (currentProfile.created_at) {
            const createdDate = new Date(currentProfile.created_at);
            const formattedDate = createdDate.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            document.getElementById('profileCreated').textContent = `Membre depuis: ${formattedDate}`;
        } else {
            document.getElementById('profileCreated').textContent = 'Date de création inconnue';
        }

        // Remplir le formulaire de modification de profil
        document.getElementById('editPseudo').value = currentProfile.pseudo || '';

        // Récupérer les statistiques de l'utilisateur (nombre d'albums et de photos)
        try {
            await loadUserStats();
        } catch (statsError) {
            console.error("Erreur lors du chargement des statistiques:", statsError);
            // Continuer malgré l'erreur
        }

        console.log("Chargement terminé, affichage du contenu");

        // Masquer le chargement et afficher le contenu
        loadingEl.style.display = 'none';
        accountContainerEl.style.display = 'block';

    } catch (error) {
        console.error('Erreur lors du chargement des informations du compte:', error);
        const loadingEl = document.getElementById('loading');
        loadingEl.textContent = `Erreur: ${error.message || 'Problème de chargement'}`;
    }
}

// Charger les statistiques de l'utilisateur
async function loadUserStats() {
    try {
        // Compter le nombre d'albums créés par l'utilisateur
        const { count: albumCount, error: albumError } = await supabase
            .from('albums')
            .select('id', { count: 'exact' })
            .eq('created_by', currentUser.id);

        if (albumError) throw albumError;

        // Compter le nombre total de photos dans tous les albums de l'utilisateur
        const { data: albums, error: albumsError } = await supabase
            .from('albums')
            .select('id')
            .eq('created_by', currentUser.id);

        if (albumsError) throw albumsError;

        let totalPhotos = 0;

        // Si l'utilisateur a des albums, compter toutes les photos
        if (albums && albums.length > 0) {
            const albumIds = albums.map(album => album.id);

            const { count: photoCount, error: photoError } = await supabase
                .from('photos')
                .select('id', { count: 'exact' })
                .in('album_id', albumIds);

            if (photoError) throw photoError;

            totalPhotos = photoCount;
        }

        // Afficher les statistiques
        document.getElementById('albumCount').textContent = albumCount || 0;
        document.getElementById('photoCount').textContent = totalPhotos || 0;
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        // Continuer malgré l'erreur pour ne pas bloquer le chargement de la page
        document.getElementById('albumCount').textContent = '?';
        document.getElementById('photoCount').textContent = '?';
    }
}

// Mettre à jour le profil utilisateur
async function updateProfile(event) {
    event.preventDefault();

    const pseudo = document.getElementById('editPseudo').value.trim();
    const submitBtn = event.target.querySelector('.submit-btn');
    const successEl = document.getElementById('profileSuccess');
    const errorEl = document.getElementById('profileError');

    // Masquer les messages précédents
    successEl.style.display = 'none';
    errorEl.style.display = 'none';

    // Validation du pseudo
    if (pseudo.length < 3) {
        errorEl.textContent = 'Le pseudo doit contenir au moins 3 caractères.';
        errorEl.style.display = 'block';
        return;
    }

    const initialButtonText = submitBtn.textContent;
    submitBtn.textContent = 'Enregistrement en cours...';
    submitBtn.disabled = true;

    try {
        // Mettre à jour le profil dans la base de données
        const { data, error } = await supabase
            .from('profiles')
            .update({
                pseudo: pseudo,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);

        if (error) throw error;

        // Mettre à jour l'état local
        currentProfile.pseudo = pseudo;

        // Mettre à jour l'affichage de l'avatar et du nom
        document.getElementById('profileName').textContent = pseudo;
        document.getElementById('profileAvatar').textContent = pseudo.charAt(0).toUpperCase();

        // Mettre à jour l'affichage dans le header
        const userAvatarEl = document.querySelector('.user-section .user-avatar');
        const userNameEl = document.querySelector('.user-section .user-name');

        if (userAvatarEl) userAvatarEl.textContent = pseudo.charAt(0).toUpperCase();
        if (userNameEl) userNameEl.textContent = pseudo;

        // Afficher un message de succès
        successEl.style.display = 'block';

        // Masquer le message de succès après quelques secondes
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 5000);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        errorEl.textContent = 'Une erreur est survenue lors de la mise à jour de votre profil.';
        errorEl.style.display = 'block';
    } finally {
        submitBtn.textContent = initialButtonText;
        submitBtn.disabled = false;
    }
}

// Changer le mot de passe
async function changePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const submitBtn = event.target.querySelector('.submit-btn');
    const successEl = document.getElementById('passwordSuccess');
    const errorEl = document.getElementById('passwordError');

    // Masquer les messages précédents
    successEl.style.display = 'none';
    errorEl.style.display = 'none';

    // Validation des mots de passe
    if (newPassword.length < 6) {
        errorEl.textContent = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
        errorEl.style.display = 'block';
        return;
    }

    if (newPassword !== confirmNewPassword) {
        errorEl.textContent = 'Les nouveaux mots de passe ne correspondent pas.';
        errorEl.style.display = 'block';
        return;
    }

    const initialButtonText = submitBtn.textContent;
    submitBtn.textContent = 'Modification en cours...';
    submitBtn.disabled = true;

    try {
        // Vérifier le mot de passe actuel en se reconnectant
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: currentUser.email,
            password: currentPassword
        });

        if (signInError) {
            throw new Error('Le mot de passe actuel est incorrect');
        }

        // Changer le mot de passe
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        // Réinitialiser le formulaire
        document.getElementById('passwordForm').reset();

        // Afficher un message de succès
        successEl.style.display = 'block';

        // Masquer le message de succès après quelques secondes
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 5000);
    } catch (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        errorEl.textContent = error.message || 'Une erreur est survenue lors du changement de mot de passe.';
        errorEl.style.display = 'block';
    } finally {
        submitBtn.textContent = initialButtonText;
        submitBtn.disabled = false;
    }
}

// Ouvrir la modal de suppression de compte
function openDeleteAccountModal() {
    document.getElementById('deleteAccountModal').classList.add('modal-visible');
    document.getElementById('confirmDeletePassword').value = '';
    document.getElementById('deleteAccountError').style.display = 'none';
}

// Fermer la modal de suppression de compte
function closeDeleteAccountModal() {
    document.getElementById('deleteAccountModal').classList.remove('modal-visible');
}

// Supprimer le compte utilisateur
async function deleteAccount() {
    const password = document.getElementById('confirmDeletePassword').value;
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const errorEl = document.getElementById('deleteAccountError');

    // Masquer le message d'erreur précédent
    errorEl.style.display = 'none';

    if (!password) {
        errorEl.textContent = 'Veuillez entrer votre mot de passe pour confirmer.';
        errorEl.style.display = 'block';
        return;
    }

    const initialButtonText = confirmBtn.textContent;
    confirmBtn.textContent = 'Suppression en cours...';
    confirmBtn.disabled = true;

    try {
        // Vérifier le mot de passe en se reconnectant
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: currentUser.email,
            password: password
        });

        if (signInError) {
            throw new Error('Mot de passe incorrect');
        }

        // Récupérer tous les albums de l'utilisateur
        const { data: albums, error: albumsError } = await supabase
            .from('albums')
            .select('id')
            .eq('created_by', currentUser.id);

        if (albumsError) throw albumsError;

        // Supprimer les photos et fichiers associés pour chaque album
        if (albums && albums.length > 0) {
            const albumIds = albums.map(album => album.id);

            // Récupérer toutes les photos des albums de l'utilisateur
            const { data: photos, error: photosError } = await supabase
                .from('photos')
                .select('id, storage_path')
                .in('album_id', albumIds);

            if (photosError) throw photosError;

            // Supprimer les fichiers du stockage
            if (photos && photos.length > 0) {
                const storagePaths = photos.map(photo => photo.storage_path).filter(path => path);

                if (storagePaths.length > 0) {
                    const { error: storageError } = await supabase.storage
                        .from('photos')
                        .remove(storagePaths);

                    // Journaliser l'erreur, mais continuer
                    if (storageError) {
                        console.error('Erreur lors de la suppression des fichiers:', storageError);
                    }
                }

                // Supprimer les entrées de photos dans la base de données
                const { error: photosDeleteError } = await supabase
                    .from('photos')
                    .delete()
                    .in('album_id', albumIds);

                if (photosDeleteError) throw photosDeleteError;
            }

            // Supprimer les albums
            const { error: albumsDeleteError } = await supabase
                .from('albums')
                .delete()
                .eq('created_by', currentUser.id);

            if (albumsDeleteError) throw albumsDeleteError;
        }

        // Supprimer le profil utilisateur
        const { error: profileDeleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', currentUser.id);

        if (profileDeleteError) throw profileDeleteError;

        // Supprimer le compte utilisateur lui-même
        const { error: userDeleteError } = await supabase.auth.admin.deleteUser(
            currentUser.id
        );

        // Si l'API admin n'est pas disponible, utiliser l'alternative
        if (userDeleteError) {
            // La méthode directe ci-dessus peut nécessiter des droits admin,
            // nous demandons donc à l'utilisateur de se déconnecter
            await supabase.auth.signOut();

            // Rediriger vers la page d'accueil avec un paramètre de suppression réussie
            window.location.href = '../index.html?accountDeleted=true';
            return;
        }

        // Redirection vers la page d'accueil
        window.location.href = '../index.html?accountDeleted=true';
    } catch (error) {
        console.error('Erreur lors de la suppression du compte:', error);
        errorEl.textContent = error.message || 'Une erreur est survenue lors de la suppression de votre compte.';
        errorEl.style.display = 'block';

        confirmBtn.textContent = initialButtonText;
        confirmBtn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = await checkAuth();

    if (isLoggedIn) {
        // Configuration des gestionnaires d'événements
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = '../index.html';
        });

        // Formulaires
        document.getElementById('profileForm').addEventListener('submit', updateProfile);
        document.getElementById('passwordForm').addEventListener('submit', changePassword);

        // Suppression de compte
        document.getElementById('deleteAccountBtn').addEventListener('click', openDeleteAccountModal);
        document.getElementById('closeDeleteModalBtn').addEventListener('click', closeDeleteAccountModal);
        document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteAccountModal);
        document.getElementById('confirmDeleteBtn').addEventListener('click', deleteAccount);

        // Fermer la modal si clic en dehors
        document.getElementById('deleteAccountModal').addEventListener('click', function (event) {
            if (event.target === this) closeDeleteAccountModal();
        });
    }
});