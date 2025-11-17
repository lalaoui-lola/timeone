// Vérifier l'authentification et le rôle admin
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Vérifier si l'utilisateur est admin
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        alert('Accès refusé : vous devez être administrateur');
        window.location.href = 'index.html';
    }
}

// Créer un nouvel utilisateur
document.getElementById('createUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const messageDiv = document.getElementById('message');
    
    messageDiv.style.display = 'block';
    messageDiv.className = 'message';
    messageDiv.textContent = 'Création de l\'utilisateur en cours...';

    try {
        // Sauvegarder la session actuelle de l'admin
        const { data: { session: adminSession } } = await supabase.auth.getSession();
        
        // Créer un nouveau client Supabase temporaire pour l'inscription
        const tempSupabase = window.supabase.createClient(
            supabase.supabaseUrl,
            supabase.supabaseKey
        );

        // Créer l'utilisateur avec le client temporaire
        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    role: role
                }
            }
        });

        if (authError) throw authError;

        if (!authData.user) {
            throw new Error('Aucune donnée utilisateur retournée');
        }

        console.log('Utilisateur créé:', authData.user.id);

        // Attendre un peu pour que l'utilisateur soit bien créé
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Restaurer la session admin
        if (adminSession) {
            await supabase.auth.setSession({
                access_token: adminSession.access_token,
                refresh_token: adminSession.refresh_token
            });
        }

        // Ajouter le profil utilisateur avec le rôle
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([
                { 
                    user_id: authData.user.id, 
                    email: email, 
                    role: role 
                }
            ]);

        if (profileError) {
            console.error('Erreur profil:', profileError);
            // Ne pas lancer d'erreur si le profil existe déjà
            if (!profileError.message.includes('duplicate')) {
                throw new Error('Utilisateur créé mais erreur lors de l\'ajout du profil: ' + profileError.message);
            }
        }

        messageDiv.className = 'message success';
        messageDiv.textContent = `Utilisateur ${email} créé avec succès avec le rôle ${role}!`;
        
        // Réinitialiser le formulaire
        document.getElementById('createUserForm').reset();
        
        // Recharger la liste des utilisateurs après un délai
        setTimeout(() => {
            loadUsers();
        }, 2000);

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);

    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = `Erreur: ${error.message}`;
        console.error('Erreur complète:', error);
        
        // Essayer de restaurer la session admin en cas d'erreur
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                location.reload();
            }
        } catch (e) {
            console.error('Erreur lors de la restauration de session:', e);
        }
    }
});

// Charger la liste des utilisateurs
async function loadUsers() {
    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        return;
    }

    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';

    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        
        let roleClass = 'role-agent';
        if (user.role === 'admin') roleClass = 'role-admin';
        if (user.role === 'conseiller') roleClass = 'role-conseiller';

        userCard.innerHTML = `
            <div class="user-info">
                <div class="user-email">${user.email}</div>
                <div class="user-role">ID: ${user.user_id}</div>
            </div>
            <span class="role-badge ${roleClass}">${user.role.toUpperCase()}</span>
        `;
        
        usersList.appendChild(userCard);
    });
}

// Déconnexion
async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// Initialisation
checkAuth();
loadUsers();
