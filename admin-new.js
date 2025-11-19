// Vérifier l'authentification
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    // Vérifier le rôle
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, email')
        .eq('user_id', session.user.id)
        .single();
    
    if (!profile || profile.role !== 'admin') {
        alert('Accès refusé. Vous devez être administrateur.');
        await supabase.auth.signOut();
        window.location.href = 'index.html';
        return;
    }
    
    // Afficher le nom de l'admin
    document.getElementById('adminName').textContent = profile.email.split('@')[0];
}

// Navigation entre les onglets
document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        
        // Mettre à jour les boutons
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Mettre à jour le contenu
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tab + 'Tab').classList.add('active');
        
        // Mettre à jour le titre
        const titles = {
            users: { title: 'Gestion des utilisateurs', subtitle: 'Créer, modifier et supprimer des utilisateurs' },
            projects: { title: 'Gestion des projets', subtitle: 'Créer et gérer vos formulaires dynamiques' },
            leads: { title: 'Tous les Leads', subtitle: 'Vue d\'ensemble de tous les leads créés par les agents' },
            api: { title: 'Gestion des clés API', subtitle: 'Créer et gérer les clés d\'accès API' },
            settings: { title: 'Paramètres', subtitle: 'Configuration du système' }
        };
        
        document.getElementById('pageTitle').textContent = titles[tab].title;
        document.getElementById('pageSubtitle').textContent = titles[tab].subtitle;
        
        // Charger les données selon l'onglet
        if (tab === 'users') {
            loadUsers();
        } else if (tab === 'projects') {
            loadProjects();
        } else if (tab === 'leads') {
            loadAllLeads();
        } else if (tab === 'api') {
            if (typeof loadApiKeys === 'function') {
                loadApiKeys();
            }
        }
    });
});

// Déconnexion
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// ========== GESTION DES UTILISATEURS ==========

let currentUserId = null;

// Charger les utilisateurs
async function loadUsers() {
    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Erreur chargement utilisateurs:', error);
        return;
    }
    
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.email}</td>
            <td><span class="role-badge role-${user.role}">${user.role}</span></td>
            <td>${new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="editUser('${user.user_id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteUser('${user.user_id}', '${user.email}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Ouvrir modal d'ajout d'utilisateur
document.getElementById('addUserBtn').addEventListener('click', () => {
    currentUserId = null;
    document.getElementById('userModalTitle').textContent = 'Nouvel utilisateur';
    document.getElementById('userForm').reset();
    document.getElementById('userPassword').required = true;
    openModal('userModal');
});

// Créer/Modifier utilisateur
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const messageDiv = document.getElementById('userMessage');
    
    messageDiv.style.display = 'block';
    messageDiv.className = 'message';
    messageDiv.textContent = 'Traitement en cours...';
    
    try {
        if (!currentUserId) {
            // Créer un nouvel utilisateur
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password
            });
            
            if (authError) throw authError;
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert([{ 
                    user_id: authData.user.id, 
                    email: email, 
                    role: role 
                }]);
            
            if (profileError && !profileError.message.includes('duplicate')) {
                throw profileError;
            }
            
            messageDiv.className = 'message success';
            messageDiv.textContent = 'Utilisateur créé avec succès!';
        } else {
            // Modifier un utilisateur existant
            const { error } = await supabase
                .from('user_profiles')
                .update({ role: role })
                .eq('user_id', currentUserId);
            
            if (error) throw error;
            
            messageDiv.className = 'message success';
            messageDiv.textContent = 'Utilisateur modifié avec succès!';
        }
        
        setTimeout(() => {
            closeModal('userModal');
            loadUsers();
        }, 1500);
        
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Erreur: ' + error.message;
    }
});

// Modifier un utilisateur
async function editUser(userId) {
    currentUserId = userId;
    
    const { data: user } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (user) {
        document.getElementById('userModalTitle').textContent = 'Modifier l\'utilisateur';
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userEmail').disabled = true;
        document.getElementById('userPassword').required = false;
        document.getElementById('userPassword').value = '';
        document.getElementById('userRole').value = user.role;
        openModal('userModal');
    }
}

// Supprimer un utilisateur
async function deleteUser(userId, email) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${email} ?`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('user_profiles')
            .delete()
            .eq('user_id', userId);
        
        if (error) throw error;
        
        loadUsers();
    } catch (error) {
        alert('Erreur lors de la suppression: ' + error.message);
    }
}

// Recherche d'utilisateurs
document.getElementById('searchUsers').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
});

// ========== GESTION DES PROJETS ==========

let currentProjectId = null;
let fieldCounter = 0;

// Charger les projets
async function loadProjects() {
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*, project_fields(count)')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Erreur chargement projets:', error);
        return;
    }
    
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '';
    
    if (projects.length === 0) {
        grid.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 3rem;">Aucun projet. Créez votre premier projet!</p>';
        return;
    }
    
    projects.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <div class="project-header">
                <div>
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-description">${project.description || 'Aucune description'}</p>
                </div>
            </div>
            <div class="project-meta">
                <span>📝 ${project.project_fields?.[0]?.count || 0} champs</span>
                <span>•</span>
                <span>📅 ${new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="project-actions">
                <button class="btn-edit" onclick="editProject('${project.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Modifier
                </button>
                <button class="btn-delete" onclick="deleteProject('${project.id}', '${project.name}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Supprimer
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Ouvrir modal de création de projet
document.getElementById('addProjectBtn').addEventListener('click', () => {
    currentProjectId = null;
    fieldCounter = 0;
    document.getElementById('projectModalTitle').textContent = 'Nouveau projet';
    document.getElementById('projectForm').reset();
    document.getElementById('fieldsContainer').innerHTML = '';
    openModal('projectModal');
});

// Ajouter un champ au projet
document.getElementById('addFieldBtn').addEventListener('click', () => {
    addFieldToProject();
});

function addFieldToProject(fieldData = null) {
    fieldCounter++;
    const container = document.getElementById('fieldsContainer');
    
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'field-item';
    fieldDiv.dataset.fieldId = fieldCounter;
    
    fieldDiv.innerHTML = `
        <div class="field-header">
            <span class="field-number">Champ #${fieldCounter}</span>
            <button type="button" class="btn-icon delete" onclick="removeField(${fieldCounter})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="field-row">
            <div class="form-group">
                <label>Nom du champ</label>
                <input type="text" class="field-name" value="${fieldData?.name || ''}" placeholder="Ex: Nom complet" required>
            </div>
            <div class="form-group">
                <label>Type de champ</label>
                <select class="field-type" onchange="handleFieldTypeChange(this)" required>
                    <option value="text" ${fieldData?.type === 'text' ? 'selected' : ''}>Texte</option>
                    <option value="email" ${fieldData?.type === 'email' ? 'selected' : ''}>Email</option>
                    <option value="number" ${fieldData?.type === 'number' ? 'selected' : ''}>Nombre</option>
                    <option value="date" ${fieldData?.type === 'date' ? 'selected' : ''}>Date</option>
                    <option value="time" ${fieldData?.type === 'time' ? 'selected' : ''}>Heure</option>
                    <option value="datetime" ${fieldData?.type === 'datetime' ? 'selected' : ''}>Date et heure</option>
                    <option value="textarea" ${fieldData?.type === 'textarea' ? 'selected' : ''}>Texte long</option>
                    <option value="select" ${fieldData?.type === 'select' ? 'selected' : ''}>Liste déroulante</option>
                    <option value="radio" ${fieldData?.type === 'radio' ? 'selected' : ''}>Boutons radio</option>
                    <option value="checkbox" ${fieldData?.type === 'checkbox' ? 'selected' : ''}>Case à cocher unique</option>
                    <option value="checkboxes" ${fieldData?.type === 'checkboxes' ? 'selected' : ''}>Cases à cocher multiples</option>
                    <option value="file" ${fieldData?.type === 'file' ? 'selected' : ''}>Fichier</option>
                </select>
            </div>
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 0.75rem;">
            <input type="checkbox" class="field-required" ${fieldData?.required ? 'checked' : ''}>
            <label style="margin: 0; cursor: pointer;">Champ obligatoire</label>
        </div>
        <div class="field-options" style="display: none;">
            <label>Options (une par ligne)</label>
            <textarea class="field-options-text" rows="4" placeholder="Option 1&#10;Option 2&#10;Option 3">${fieldData?.options?.join('\n') || ''}</textarea>
        </div>
    `;
    
    container.appendChild(fieldDiv);
    
    // Afficher les options si le type le nécessite
    const typeSelect = fieldDiv.querySelector('.field-type');
    handleFieldTypeChange(typeSelect);
}

// Gérer le changement de type de champ
function handleFieldTypeChange(selectElement) {
    const fieldItem = selectElement.closest('.field-item');
    const optionsDiv = fieldItem.querySelector('.field-options');
    const type = selectElement.value;
    
    // Afficher les options pour select, radio et checkboxes
    if (type === 'select' || type === 'radio' || type === 'checkboxes') {
        optionsDiv.style.display = 'block';
    } else {
        optionsDiv.style.display = 'none';
    }
}

function removeField(fieldId) {
    const field = document.querySelector(`[data-field-id="${fieldId}"]`);
    if (field) {
        field.remove();
    }
}

// Créer/Modifier un projet
document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('projectName').value;
    const description = document.getElementById('projectDescription').value;
    const messageDiv = document.getElementById('projectMessage');
    
    // Récupérer tous les champs
    const fields = [];
    document.querySelectorAll('.field-item').forEach((fieldDiv, index) => {
        const type = fieldDiv.querySelector('.field-type').value;
        const optionsText = fieldDiv.querySelector('.field-options-text').value;
        const options = optionsText ? optionsText.split('\n').filter(o => o.trim()) : null;
        
        fields.push({
            name: fieldDiv.querySelector('.field-name').value,
            type: type,
            required: fieldDiv.querySelector('.field-required').checked,
            options: options,
            order: index
        });
    });
    
    if (fields.length === 0) {
        alert('Veuillez ajouter au moins un champ au projet');
        return;
    }
    
    messageDiv.style.display = 'block';
    messageDiv.className = 'message';
    messageDiv.textContent = currentProjectId ? 'Modification en cours...' : 'Création du projet en cours...';
    
    try {
        let projectId;
        
        if (currentProjectId) {
            // Modifier le projet existant
            const { error: updateError } = await supabase
                .from('projects')
                .update({ name, description })
                .eq('id', currentProjectId);
            
            if (updateError) throw updateError;
            
            // Supprimer les anciens champs
            await supabase
                .from('project_fields')
                .delete()
                .eq('project_id', currentProjectId);
            
            projectId = currentProjectId;
            
        } else {
            // Créer un nouveau projet
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert([{ name, description }])
                .select()
                .single();
            
            if (projectError) throw projectError;
            projectId = project.id;
        }
        
        // Ajouter les champs (nouveaux ou modifiés)
        const fieldsToInsert = fields.map(field => ({
            project_id: projectId,
            ...field
        }));
        
        const { error: fieldsError } = await supabase
            .from('project_fields')
            .insert(fieldsToInsert);
        
        if (fieldsError) throw fieldsError;
        
        messageDiv.className = 'message success';
        messageDiv.textContent = currentProjectId ? 'Projet modifié avec succès!' : 'Projet créé avec succès!';
        
        setTimeout(() => {
            closeModal('projectModal');
            loadProjects();
        }, 1500);
        
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Erreur: ' + error.message;
        console.error('Erreur:', error);
    }
});

// Modifier un projet
async function editProject(projectId) {
    currentProjectId = projectId;
    
    try {
        // Charger le projet
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        
        if (projectError) throw projectError;
        
        // Charger les champs du projet
        const { data: fields, error: fieldsError } = await supabase
            .from('project_fields')
            .select('*')
            .eq('project_id', projectId)
            .order('order', { ascending: true });
        
        if (fieldsError) throw fieldsError;
        
        // Remplir le formulaire
        document.getElementById('projectModalTitle').textContent = 'Modifier le projet';
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectDescription').value = project.description || '';
        
        // Réinitialiser et ajouter les champs existants
        fieldCounter = 0;
        document.getElementById('fieldsContainer').innerHTML = '';
        
        fields.forEach(field => {
            addFieldToProject({
                name: field.name,
                type: field.type,
                required: field.required
            });
        });
        
        openModal('projectModal');
        
    } catch (error) {
        alert('Erreur lors du chargement du projet: ' + error.message);
    }
}

// Supprimer un projet
async function deleteProject(projectId, projectName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le projet "${projectName}" ?\n\nCette action est irréversible et supprimera tous les champs associés.`)) {
        return;
    }
    
    try {
        // Supprimer d'abord les champs (cascade devrait le faire automatiquement, mais on s'assure)
        const { error: fieldsError } = await supabase
            .from('project_fields')
            .delete()
            .eq('project_id', projectId);
        
        // Supprimer le projet
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);
        
        if (error) throw error;
        
        loadProjects();
    } catch (error) {
        alert('Erreur lors de la suppression: ' + error.message);
    }
}

// ========== UTILITAIRES ==========

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.getElementById(modalId).querySelector('form')?.reset();
    const messageDiv = document.getElementById(modalId).querySelector('.message');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

// Fermer modal en cliquant en dehors
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal.id);
        }
    });
});

// ========== GESTION DES LEADS (ADMIN) ==========

// Charger tous les leads (admin uniquement)
async function loadAllLeads() {
    try {
        // Vérifier d'abord la session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session admin:', session?.user?.id);
        
        // Charger les leads
        const { data: leads, error: leadsError } = await supabase
            .from('project_responses')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (leadsError) throw leadsError;
        
        // Charger les projets
        const { data: projectsData } = await supabase
            .from('projects')
            .select('id, name');
        
        // Charger les profils utilisateurs
        const { data: profilesData } = await supabase
            .from('user_profiles')
            .select('user_id, email');
        
        // Stocker globalement pour les filtres
        window.projectsData = projectsData;
        window.profilesData = profilesData;
        
        // Combiner les données manuellement
        const leadsWithDetails = leads.map(lead => ({
            ...lead,
            project_name: projectsData?.find(p => p.id === lead.project_id)?.name || 'N/A',
            agent_email: profilesData?.find(p => p.user_id === lead.user_id)?.email || 'N/A'
        }));
        
        // Charger les filtres
        await loadFilterOptions(projectsData, profilesData);
        
        const error = null;
        
        if (error) {
            console.error('❌ Erreur chargement leads:', error);
            console.error('Message:', error.message);
            console.error('Code:', error.code);
            console.error('Details:', error.details);
            
            // Afficher un message à l'utilisateur
            const tbody = document.getElementById('leadsTableBody');
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 2rem;">
                Erreur: ${error.message}<br>
                <small>Vérifiez que le SQL fix_admin_leads_view.sql a été exécuté</small>
            </td></tr>`;
            return;
        }
        
        console.log('✅ Leads chargés:', leadsWithDetails?.length || 0, 'leads');
        console.log('Données:', leadsWithDetails);
        
        const tbody = document.getElementById('leadsTableBody');
        tbody.innerHTML = '';
        
        if (!leadsWithDetails || leadsWithDetails.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">Aucun lead</td></tr>';
            return;
        }
        
        leadsWithDetails.forEach(lead => {
        const status = lead.status || 'pending';
        const statusConfig = {
            pending: { label: 'En attente', class: 'role-conseiller', color: '#f59e0b' },
            validated: { label: 'Validé', class: 'role-admin', color: '#10b981' },
            rejected: { label: 'Rejeté', class: 'role-agent', color: '#ef4444' }
        };
        
        const statusInfo = statusConfig[status] || statusConfig.pending;
        
        // Avis conseiller
        const conseillerStatus = lead.conseiller_status;
        const conseillerComment = lead.conseiller_comment;
        
        const conseillerStatusConfig = {
            'OK': { label: '✅ OK', color: '#10b981' },
            'Rappeler': { label: '📞 Rappeler', color: '#f59e0b' },
            'No OK': { label: '❌ No OK', color: '#ef4444' }
        };
        
        let conseillerAvis = '';
        if (conseillerStatus) {
            const statusInf = conseillerStatusConfig[conseillerStatus];
            const rgb = statusInf.color === '#10b981' ? '16, 185, 129' : statusInf.color === '#ef4444' ? '239, 68, 68' : '245, 158, 11';
            conseillerAvis = `
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <span class="role-badge" style="background: rgba(${rgb}, 0.1); border-color: ${statusInf.color}; color: ${statusInf.color}; display: inline-block; width: fit-content;">
                        ${statusInf.label}
                    </span>
                    ${conseillerComment ? `<div style="color: rgba(255,255,255,0.7); font-size: 0.85rem; line-height: 1.4; max-width: 250px;">${conseillerComment.substring(0, 80)}${conseillerComment.length > 80 ? '...' : ''}</div>` : ''}
                </div>
            `;
        } else {
            conseillerAvis = '<span style="color: rgba(255,255,255,0.4); font-style: italic; font-size: 0.9rem;">Non traité</span>';
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${lead.project_name}</td>
            <td>${lead.agent_email}</td>
            <td>${new Date(lead.created_at).toLocaleDateString('fr-FR')}</td>
            <td>
                <span class="role-badge ${statusInfo.class}" style="background: rgba(${statusInfo.color === '#10b981' ? '16, 185, 129' : statusInfo.color === '#ef4444' ? '239, 68, 68' : '245, 158, 11'}, 0.1); border-color: ${statusInfo.color}; color: ${statusInfo.color};">
                    ${statusInfo.label}
                </span>
            </td>
            <td class="audio-cell">
                ${lead.audio_url ? `
                    <div class="audio-player">
                        <audio controls src="${lead.audio_url}"></audio>
                        <button class="audio-remove" onclick="removeAudio('${lead.id}')">✕</button>
                    </div>
                ` : `
                    <button class="audio-upload-btn" onclick="uploadAudio('${lead.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Ajouter
                    </button>
                `}
            </td>
            <td>${conseillerAvis}</td>
            <td>
                <div class="action-buttons">
                    ${status === 'pending' ? `
                        <button class="btn-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;" onclick="validateLead('${lead.id}', 'validated')" title="Valider">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                        <button class="btn-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;" onclick="validateLead('${lead.id}', 'rejected')" title="Rejeter">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    ` : ''}
                    <button class="btn-icon" onclick="openLeadModal('${lead.id}', false)" title="Voir les détails">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="openLeadModal('${lead.id}', true)" title="Modifier" style="background: rgba(59, 130, 246, 0.1); color: #60a5fa;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteLead('${lead.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('❌ Erreur inattendue:', error);
        const tbody = document.getElementById('leadsTableBody');
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 2rem;">
            Erreur inattendue: ${error.message}
        </td></tr>`;
    }
}

// Voir les détails d'un lead
async function viewLeadDetails(leadId) {
    try {
        // Charger le lead
        const { data: lead, error } = await supabase
            .from('project_responses')
            .select('*')
            .eq('id', leadId)
            .single();
        
        if (error) throw error;
        
        // Charger le projet
        const { data: project } = await supabase
            .from('projects')
            .select('name')
            .eq('id', lead.project_id)
            .single();
        
        // Charger le profil de l'agent
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('email')
            .eq('user_id', lead.user_id)
            .single();
        
        // Charger les champs du projet pour afficher les noms
        const { data: fields } = await supabase
            .from('project_fields')
            .select('*')
            .eq('project_id', lead.project_id);
        
        let details = `Projet: ${project?.name || 'N/A'}\n`;
        details += `Agent: ${profile?.email || 'N/A'}\n`;
        details += `Date: ${new Date(lead.created_at).toLocaleString('fr-FR')}\n\n`;
        details += '--- Données du lead ---\n\n';
        
        for (const [fieldId, value] of Object.entries(lead.response_data)) {
            const field = fields?.find(f => f.id === fieldId);
            if (field) {
                const displayValue = Array.isArray(value) ? value.join(', ') : (typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : value);
                details += `${field.name}: ${displayValue}\n`;
            }
        }
        
        alert(details);
        
    } catch (error) {
        alert('Erreur lors du chargement du lead: ' + error.message);
    }
}

// Valider ou rejeter un lead
async function validateLead(leadId, newStatus) {
    const statusText = newStatus === 'validated' ? 'valider' : 'rejeter';
    
    if (!confirm(`Êtes-vous sûr de vouloir ${statusText} ce lead ?`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('project_responses')
            .update({ status: newStatus })
            .eq('id', leadId);
        
        if (error) throw error;
        
        loadAllLeads();
    } catch (error) {
        alert('Erreur lors de la validation: ' + error.message);
    }
}

// Charger les options pour les filtres
async function loadFilterOptions(projects, profiles) {
    // Charger les projets
    const projectSelect = document.getElementById('filterProject');
    projectSelect.innerHTML = '<option value="">Tous les projets</option>';
    projects?.forEach(project => {
        projectSelect.innerHTML += `<option value="${project.id}">${project.name}</option>`;
    });
    
    // Charger les agents
    const agentSelect = document.getElementById('filterAgent');
    agentSelect.innerHTML = '<option value="">Tous les agents</option>';
    profiles?.forEach(profile => {
        agentSelect.innerHTML += `<option value="${profile.user_id}">${profile.email}</option>`;
    });
}

// Appliquer les filtres
async function applyFilters() {
    const searchTerm = document.getElementById('searchLeads').value.toLowerCase();
    const projectId = document.getElementById('filterProject').value;
    const agentId = document.getElementById('filterAgent').value;
    const dateFilter = document.getElementById('filterDate').value;
    
    try {
        let query = supabase
            .from('project_responses')
            .select('*');
        
        // Appliquer les filtres
        if (projectId) {
            query = query.eq('project_id', projectId);
        }
        if (agentId) {
            query = query.eq('user_id', agentId);
        }
        if (dateFilter) {
            const startDate = new Date(dateFilter);
            const endDate = new Date(dateFilter);
            endDate.setHours(23, 59, 59, 999);
            query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
        }
        
        const { data: leads, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Filtrer par recherche textuelle
        let filteredLeads = leads;
        if (searchTerm) {
            filteredLeads = leads.filter(lead => {
                const project = window.projectsData?.find(p => p.id === lead.project_id);
                const profile = window.profilesData?.find(p => p.user_id === lead.user_id);
                const projectName = project?.name || '';
                const agentEmail = profile?.email || '';
                const responseText = JSON.stringify(lead.response_data || {}).toLowerCase();
                
                return projectName.toLowerCase().includes(searchTerm) ||
                       agentEmail.toLowerCase().includes(searchTerm) ||
                       responseText.includes(searchTerm);
            });
        }
        
        // Afficher les résultats
        displayFilteredLeads(filteredLeads);
        
    } catch (error) {
        console.error('Erreur lors du filtrage:', error);
        alert('Erreur lors du filtrage: ' + error.message);
    }
}

// Afficher les leads filtrés
function displayFilteredLeads(leads) {
    const leadsWithDetails = leads.map(lead => ({
        ...lead,
        project_name: window.projectsData?.find(p => p.id === lead.project_id)?.name || 'N/A',
        agent_email: window.profilesData?.find(p => p.user_id === lead.user_id)?.email || 'N/A'
    }));
    
    const tbody = document.getElementById('leadsTableBody');
    tbody.innerHTML = '';
    
    if (!leadsWithDetails || leadsWithDetails.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">Aucun lead trouvé</td></tr>';
        return;
    }
    
    // Réutiliser le code d'affichage existant
    leadsWithDetails.forEach(lead => {
        const status = lead.status || 'pending';
        const statusConfig = {
            pending: { label: 'En attente', class: 'role-conseiller', color: '#f59e0b' },
            validated: { label: 'Validé', class: 'role-admin', color: '#10b981' },
            rejected: { label: 'Rejeté', class: 'role-agent', color: '#ef4444' }
        };
        
        const statusInfo = statusConfig[status] || statusConfig.pending;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${lead.project_name}</td>
            <td>${lead.agent_email}</td>
            <td>${new Date(lead.created_at).toLocaleDateString('fr-FR')}</td>
            <td>
                <span class="role-badge ${statusInfo.class}" style="background: rgba(${statusInfo.color === '#10b981' ? '16, 185, 129' : statusInfo.color === '#ef4444' ? '239, 68, 68' : '245, 158, 11'}, 0.1); border-color: ${statusInfo.color}; color: ${statusInfo.color};">
                    ${statusInfo.label}
                </span>
            </td>
            <td class="audio-cell">
                ${lead.audio_url ? `
                    <div class="audio-player">
                        <audio controls src="${lead.audio_url}"></audio>
                        <button class="audio-remove" onclick="removeAudio('${lead.id}')">✕</button>
                    </div>
                ` : `
                    <button class="audio-upload-btn" onclick="uploadAudio('${lead.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Ajouter
                    </button>
                `}
            </td>
            <td>
                <div class="action-buttons">
                    ${status === 'pending' ? `
                        <button class="btn-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;" onclick="validateLead('${lead.id}', 'validated')" title="Valider">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                        <button class="btn-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;" onclick="validateLead('${lead.id}', 'rejected')" title="Rejeter">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    ` : ''}
                    <button class="btn-icon" onclick="openLeadModal('${lead.id}', false)" title="Voir les détails">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="openLeadModal('${lead.id}', true)" title="Modifier" style="background: rgba(59, 130, 246, 0.1); color: #60a5fa;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteLead('${lead.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Effacer les filtres
function clearFilters() {
    document.getElementById('searchLeads').value = '';
    document.getElementById('filterProject').value = '';
    document.getElementById('filterAgent').value = '';
    document.getElementById('filterDate').value = '';
    loadAllLeads();
}

// Upload audio
function uploadAudio(leadId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Upload vers Supabase Storage
                const fileName = `${leadId}/${Date.now()}-${file.name}`;
                const { data, error } = await supabase.storage
                    .from('lead-audios')
                    .upload(fileName, file);
                
                if (error) throw error;
                
                // Obtenir l'URL publique
                const { data: { publicUrl } } = supabase.storage
                    .from('lead-audios')
                    .getPublicUrl(fileName);
                
                // Mettre à jour le lead
                const { error: updateError } = await supabase
                    .from('project_responses')
                    .update({ audio_url: publicUrl })
                    .eq('id', leadId);
                
                if (updateError) throw updateError;
                
                alert('Fichier audio ajouté avec succès!');
                loadAllLeads();
                
            } catch (error) {
                console.error('Erreur upload audio:', error);
                alert('Erreur lors de l\'upload: ' + error.message);
            }
        }
    };
    input.click();
}

// Supprimer audio
async function removeAudio(leadId) {
    if (!confirm('Supprimer le fichier audio?')) return;
    
    try {
        const { error } = await supabase
            .from('project_responses')
            .update({ audio_url: null })
            .eq('id', leadId);
        
        if (error) throw error;
        
        loadAllLeads();
    } catch (error) {
        console.error('Erreur suppression audio:', error);
        alert('Erreur: ' + error.message);
    }
}

// Supprimer un lead
async function deleteLead(leadId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lead ?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('project_responses')
            .delete()
            .eq('id', leadId);
        
        if (error) throw error;
        
        loadAllLeads();
    } catch (error) {
        alert('Erreur lors de la suppression: ' + error.message);
    }
}

// Recherche de leads
if (document.getElementById('searchLeads')) {
    document.getElementById('searchLeads').addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#leadsTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(search) ? '' : 'none';
        });
    });
}

// ========== AJOUT DE LEAD PAR L'ADMIN ==========

// Ouvrir le modal d'ajout de lead
document.getElementById('addLeadBtn').addEventListener('click', async () => {
    await openAddLeadModal();
});

// Ouvrir le modal et charger les données
async function openAddLeadModal() {
    try {
        // Charger les projets
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name')
            .order('name', { ascending: true });
        
        if (projectsError) throw projectsError;
        
        // Charger les agents
        const { data: agents, error: agentsError } = await supabase
            .from('user_profiles')
            .select('user_id, email, role')
            .eq('role', 'agent')
            .order('email', { ascending: true });
        
        if (agentsError) throw agentsError;
        
        // Remplir le select des projets
        const projectSelect = document.getElementById('leadProjectSelect');
        projectSelect.innerHTML = '<option value="">Sélectionnez un projet</option>';
        projects.forEach(project => {
            projectSelect.innerHTML += `<option value="${project.id}">${project.name}</option>`;
        });
        
        // Remplir le select des agents
        const agentSelect = document.getElementById('leadAgentSelect');
        agentSelect.innerHTML = '<option value="">Sélectionnez un agent</option>';
        agents.forEach(agent => {
            agentSelect.innerHTML += `<option value="${agent.user_id}">${agent.email}</option>`;
        });
        
        // Réinitialiser les champs dynamiques
        document.getElementById('leadDynamicFields').innerHTML = '';
        
        openModal('addLeadModal');
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        alert('Erreur lors du chargement des données: ' + error.message);
    }
}

// Charger les champs du projet sélectionné
document.getElementById('leadProjectSelect').addEventListener('change', async (e) => {
    const projectId = e.target.value;
    const dynamicFieldsContainer = document.getElementById('leadDynamicFields');
    
    if (!projectId) {
        dynamicFieldsContainer.innerHTML = '';
        return;
    }
    
    try {
        // Charger les champs du projet
        const { data: fields, error } = await supabase
            .from('project_fields')
            .select('*')
            .eq('project_id', projectId)
            .order('order', { ascending: true });
        
        if (error) throw error;
        
        // Générer les champs dynamiques
        dynamicFieldsContainer.innerHTML = '<h4 style="color: var(--color-primary); margin-bottom: 1rem;">Informations du lead</h4>';
        
        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';
            
            let fieldHTML = `<label>${field.name}${field.required ? ' *' : ''}</label>`;
            
            switch (field.type) {
                case 'text':
                case 'email':
                case 'number':
                case 'date':
                case 'time':
                case 'datetime':
                    fieldHTML += `<input type="${field.type}" name="field_${field.id}" ${field.required ? 'required' : ''} placeholder="${field.name}">`;
                    break;
                    
                case 'textarea':
                    fieldHTML += `<textarea name="field_${field.id}" rows="4" ${field.required ? 'required' : ''} placeholder="${field.name}"></textarea>`;
                    break;
                    
                case 'select':
                    fieldHTML += `<select name="field_${field.id}" ${field.required ? 'required' : ''}>`;
                    fieldHTML += `<option value="">Sélectionnez une option</option>`;
                    if (field.options) {
                        field.options.forEach(option => {
                            fieldHTML += `<option value="${option}">${option}</option>`;
                        });
                    }
                    fieldHTML += `</select>`;
                    break;
                    
                case 'radio':
                    if (field.options) {
                        field.options.forEach((option, index) => {
                            fieldHTML += `
                                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                    <input type="radio" name="field_${field.id}" value="${option}" id="field_${field.id}_${index}" ${field.required && index === 0 ? 'required' : ''}>
                                    <label for="field_${field.id}_${index}" style="margin: 0; cursor: pointer;">${option}</label>
                                </div>
                            `;
                        });
                    }
                    break;
                    
                case 'checkbox':
                    fieldHTML += `
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <input type="checkbox" name="field_${field.id}" id="field_${field.id}" ${field.required ? 'required' : ''}>
                            <label for="field_${field.id}" style="margin: 0; cursor: pointer;">${field.name}</label>
                        </div>
                    `;
                    break;
                    
                case 'checkboxes':
                    if (field.options) {
                        field.options.forEach((option, index) => {
                            fieldHTML += `
                                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                    <input type="checkbox" name="field_${field.id}[]" value="${option}" id="field_${field.id}_${index}">
                                    <label for="field_${field.id}_${index}" style="margin: 0; cursor: pointer;">${option}</label>
                                </div>
                            `;
                        });
                    }
                    break;
                    
                case 'file':
                    fieldHTML += `<input type="file" name="field_${field.id}" ${field.required ? 'required' : ''}>`;
                    break;
            }
            
            fieldDiv.innerHTML = fieldHTML;
            dynamicFieldsContainer.appendChild(fieldDiv);
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement des champs:', error);
        alert('Erreur lors du chargement des champs: ' + error.message);
    }
});

// Soumettre le formulaire d'ajout de lead
document.getElementById('addLeadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const projectId = document.getElementById('leadProjectSelect').value;
    const agentId = document.getElementById('leadAgentSelect').value;
    const messageDiv = document.getElementById('addLeadMessage');
    
    if (!projectId || !agentId) {
        alert('Veuillez sélectionner un projet et un agent');
        return;
    }
    
    messageDiv.style.display = 'block';
    messageDiv.className = 'message';
    messageDiv.textContent = 'Création du lead en cours...';
    
    try {
        // Récupérer les champs du projet
        const { data: fields, error: fieldsError } = await supabase
            .from('project_fields')
            .select('*')
            .eq('project_id', projectId);
        
        if (fieldsError) throw fieldsError;
        
        // Construire l'objet response_data
        const responseData = {};
        const formData = new FormData(e.target);
        
        fields.forEach(field => {
            const fieldName = `field_${field.id}`;
            
            if (field.type === 'checkboxes') {
                // Pour les checkboxes multiples
                const values = formData.getAll(`${fieldName}[]`);
                responseData[field.id] = values;
            } else if (field.type === 'checkbox') {
                // Pour une checkbox unique
                responseData[field.id] = formData.has(fieldName);
            } else if (field.type === 'file') {
                // Pour les fichiers, on stocke juste le nom (ou on pourrait uploader)
                const file = formData.get(fieldName);
                responseData[field.id] = file ? file.name : null;
            } else {
                // Pour tous les autres types
                responseData[field.id] = formData.get(fieldName);
            }
        });
        
        // Créer le lead
        const { data: newLead, error: insertError } = await supabase
            .from('project_responses')
            .insert([{
                project_id: projectId,
                user_id: agentId,
                response_data: responseData,
                status: 'pending'
            }])
            .select()
            .single();
        
        if (insertError) throw insertError;
        
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Lead créé avec succès!';
        
        setTimeout(() => {
            closeModal('addLeadModal');
            loadAllLeads();
        }, 1500);
        
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Erreur: ' + error.message;
        console.error('Erreur lors de la création du lead:', error);
    }
});

// Initialisation
checkAuth();
loadUsers();
