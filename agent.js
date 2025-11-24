// Vérifier l'authentification
let currentUser = null;
let currentProjectId = null;

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
    
    if (!profile || (profile.role !== 'agent' && profile.role !== 'admin')) {
        alert('Accès refusé. Vous devez être agent.');
        await supabase.auth.signOut();
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = session.user;
    
    // Afficher le nom de l'agent
    document.getElementById('agentName').textContent = profile.email.split('@')[0];
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
        
        // Charger les leads quand on clique sur l'onglet
        if (tab === 'leads') {
            loadLeads();
        }
        
        // Mettre à jour le titre
        const titles = {
            projects: { title: 'Projets disponibles', subtitle: 'Sélectionnez un projet pour ajouter un lead' },
            leads: { title: 'Mes Leads', subtitle: 'Liste de tous vos leads ajoutés' }
        };
        
        document.getElementById('pageTitle').textContent = titles[tab].title;
        document.getElementById('pageSubtitle').textContent = titles[tab].subtitle;
        
        // Charger les données selon l'onglet
        if (tab === 'projects') {
            loadProjects();
        } else if (tab === 'leads') {
            loadLeads();
        }
    });
});

// Déconnexion
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// ========== GESTION DES PROJETS ==========

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
        grid.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 3rem;">Aucun projet disponible</p>';
        return;
    }
    
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="project-header">
                <div>
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-description">${project.description || 'Aucune description'}</p>
                </div>
            </div>
            <div class="project-meta">
                <span>📝 ${project.project_fields?.[0]?.count || 0} champs</span>
            </div>
            <div class="project-actions">
                <button class="btn-primary" style="width: 100%;" onclick="openLeadForm('${project.id}', '${project.name}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Ajouter un lead
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Ouvrir le formulaire de lead
async function openLeadForm(projectId, projectName) {
    currentProjectId = projectId;
    
    try {
        // Charger les champs du projet
        const { data: fields, error } = await supabase
            .from('project_fields')
            .select('*')
            .eq('project_id', projectId)
            .order('order', { ascending: true });
        
        if (error) throw error;
        
        // Générer le formulaire dynamique
        const dynamicFields = document.getElementById('dynamicFields');
        dynamicFields.innerHTML = '';
        
        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';
            
            let inputHTML = '';
            const fieldId = `field_${field.id}`;
            
            switch (field.type) {
                case 'text':
                case 'email':
                case 'number':
                case 'date':
                case 'time':
                    inputHTML = `<input type="${field.type}" id="${fieldId}" ${field.required ? 'required' : ''}>`;
                    break;
                    
                case 'datetime':
                    inputHTML = `<input type="datetime-local" id="${fieldId}" ${field.required ? 'required' : ''}>`;
                    break;
                    
                case 'textarea':
                    inputHTML = `<textarea id="${fieldId}" rows="4" ${field.required ? 'required' : ''}></textarea>`;
                    break;
                    
                case 'select':
                    inputHTML = `<select id="${fieldId}" ${field.required ? 'required' : ''}>
                        <option value="">Sélectionnez...</option>
                        ${field.options?.map(opt => `<option value="${opt}">${opt}</option>`).join('') || ''}
                    </select>`;
                    break;
                    
                case 'radio':
                    inputHTML = field.options?.map((opt, idx) => `
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <input type="radio" id="${fieldId}_${idx}" name="${fieldId}" value="${opt}" ${field.required && idx === 0 ? 'required' : ''}>
                            <label for="${fieldId}_${idx}" style="margin: 0; cursor: pointer;">${opt}</label>
                        </div>
                    `).join('') || '';
                    break;
                    
                case 'checkbox':
                    inputHTML = `
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" id="${fieldId}" ${field.required ? 'required' : ''}>
                            <label for="${fieldId}" style="margin: 0; cursor: pointer;">${field.name}</label>
                        </div>
                    `;
                    break;
                    
                case 'checkboxes':
                    inputHTML = field.options?.map((opt, idx) => `
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <input type="checkbox" id="${fieldId}_${idx}" name="${fieldId}" value="${opt}">
                            <label for="${fieldId}_${idx}" style="margin: 0; cursor: pointer;">${opt}</label>
                        </div>
                    `).join('') || '';
                    break;
                    
                case 'file':
                    inputHTML = `<input type="file" id="${fieldId}" ${field.required ? 'required' : ''}>`;
                    break;
            }
            
            if (field.type !== 'checkbox') {
                fieldDiv.innerHTML = `
                    <label>${field.name}${field.required ? ' *' : ''}</label>
                    ${inputHTML}
                `;
            } else {
                fieldDiv.innerHTML = inputHTML;
            }
            
            fieldDiv.dataset.fieldId = field.id;
            fieldDiv.dataset.fieldType = field.type;
            dynamicFields.appendChild(fieldDiv);
        });
        
        document.getElementById('leadModalTitle').textContent = `Nouveau Lead - ${projectName}`;
        openModal('addLeadModal');
        
    } catch (error) {
        alert('Erreur lors du chargement du formulaire: ' + error.message);
    }
}

// Soumettre le formulaire de lead
document.getElementById('leadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const messageDiv = document.getElementById('leadMessage');
    messageDiv.style.display = 'block';
    messageDiv.className = 'message';
    messageDiv.textContent = 'Ajout du lead en cours...';
    
    try {
        // Récupérer les données du formulaire
        const formData = {};
        const fieldDivs = document.querySelectorAll('#dynamicFields .form-group');
        
        fieldDivs.forEach(fieldDiv => {
            const fieldId = fieldDiv.dataset.fieldId;
            const fieldType = fieldDiv.dataset.fieldType;
            const inputId = `field_${fieldId}`;
            
            if (fieldType === 'checkboxes') {
                const checkboxes = fieldDiv.querySelectorAll(`input[name="${inputId}"]:checked`);
                formData[fieldId] = Array.from(checkboxes).map(cb => cb.value);
            } else if (fieldType === 'radio') {
                const radio = fieldDiv.querySelector(`input[name="${inputId}"]:checked`);
                formData[fieldId] = radio ? radio.value : '';
            } else if (fieldType === 'checkbox') {
                const checkbox = fieldDiv.querySelector(`#${inputId}`);
                formData[fieldId] = checkbox ? checkbox.checked : false;
            } else {
                const input = document.getElementById(inputId);
                formData[fieldId] = input ? input.value : '';
            }
        });
        
        // Sauvegarder le lead
        const { error } = await supabase
            .from('project_responses')
            .insert([{
                project_id: currentProjectId,
                user_id: currentUser.id,
                response_data: formData
            }]);
        
        if (error) throw error;
        
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Lead ajouté avec succès!';
        
        setTimeout(() => {
            closeModal('addLeadModal');
            loadLeads();
        }, 1500);
        
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Erreur: ' + error.message;
        console.error('Erreur:', error);
    }
});

// ========== GESTION DES LEADS ==========

// Clear filters
function clearFilters() {
    document.getElementById('searchLeads').value = '';
    document.getElementById('projectFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    loadLeads();
}

// Load projects for filter
async function loadProjectsFilter() {
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
    
    const select = document.getElementById('projectFilter');
    projects?.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        select.appendChild(option);
    });
}

// Setup filters event listeners
function setupFilters() {
    document.getElementById('searchLeads').addEventListener('input', loadLeads);
    document.getElementById('projectFilter').addEventListener('change', loadLeads);
    document.getElementById('dateFromFilter').addEventListener('change', loadLeads);
    document.getElementById('dateToFilter').addEventListener('change', loadLeads);
}

// Charger les leads
async function loadLeads() {
    console.log('🔍 loadLeads() appelée');
    console.log('🔍 currentUser:', currentUser);
    
    if (!currentUser) {
        console.error('❌ currentUser non défini');
        return;
    }
    
    // Get filter values
    const searchTerm = document.getElementById('searchLeads')?.value.toLowerCase() || '';
    const projectId = document.getElementById('projectFilter')?.value || '';
    const dateFrom = document.getElementById('dateFromFilter')?.value || '';
    const dateTo = document.getElementById('dateToFilter')?.value || '';
    
    // Build query
    let query = supabase
        .from('project_responses')
        .select(`
            *,
            projects (name)
        `)
        .eq('user_id', currentUser.id);
    
    // Apply project filter
    if (projectId) {
        query = query.eq('project_id', projectId);
    }
    
    // Apply date filters
    if (dateFrom) {
        const startDate = new Date(dateFrom);
        startDate.setHours(0, 0, 0, 0);
        query = query.gte('created_at', startDate.toISOString());
    }
    
    if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data: leads, error } = await query;
    
    if (error) {
        console.error('❌ Erreur chargement leads:', error);
        return;
    }
    
    console.log('✅ Leads chargés:', leads.length);
    
    // Construire le nom complet pour chaque lead
    leads.forEach(lead => {
        if (lead.nom && lead.prenom) {
            lead.name = `${lead.prenom} ${lead.nom}`;
        } else if (lead.nom) {
            lead.name = lead.nom;
        } else if (lead.prenom) {
            lead.name = lead.prenom;
        } else if (!lead.name) {
            lead.name = 'N/A';
        }
    });
    
    // Apply search filter (client-side)
    let filteredLeads = leads;
    if (searchTerm) {
        filteredLeads = leads.filter(lead => {
            const projectName = lead.projects?.name?.toLowerCase() || '';
            const status = (lead.status || '').toLowerCase();
            const conseillerStatus = (lead.conseiller_status || '').toLowerCase();
            const date = new Date(lead.created_at).toLocaleDateString('fr-FR').toLowerCase();
            
            return projectName.includes(searchTerm) || 
                   status.includes(searchTerm) || 
                   conseillerStatus.includes(searchTerm) ||
                   date.includes(searchTerm);
        });
    }
    
    const tbody = document.getElementById('leadsTableBody');
    tbody.innerHTML = '';
    
    if (filteredLeads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">Aucun lead trouvé</td></tr>';
        return;
    }
    
    filteredLeads.forEach(lead => {
        const status = lead.status || 'pending';
        const statusConfig = {
            pending: { label: '⏳ En attente', class: 'role-conseiller', color: '#f59e0b' },
            validated: { label: '✅ Validé', class: 'role-admin', color: '#10b981' },
            rejected: { label: '❌ Rejeté', class: 'role-agent', color: '#ef4444' }
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
            <td><strong>${lead.name || 'N/A'}</strong></td>
            <td>${lead.projects?.name || 'N/A'}</td>
            <td>${new Date(lead.created_at).toLocaleString('fr-FR')}</td>
            <td>
                <span class="role-badge ${statusInfo.class}" style="background: rgba(${statusInfo.color === '#10b981' ? '16, 185, 129' : statusInfo.color === '#ef4444' ? '239, 68, 68' : '245, 158, 11'}, 0.1); border-color: ${statusInfo.color}; color: ${statusInfo.color};">
                    ${statusInfo.label}
                </span>
            </td>
            <td>${conseillerAvis}</td>
            <td>
                <div class="action-buttons">
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
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Voir un lead
async function viewLead(leadId) {
    try {
        const { data: lead, error } = await supabase
            .from('project_responses')
            .select(`
                *,
                projects (name),
                project_fields (*)
            `)
            .eq('id', leadId)
            .single();
        
        if (error) throw error;
        
        // Afficher les détails du lead
        let details = `<h3>${lead.projects?.name}</h3><br>`;
        details += `<strong>Date:</strong> ${new Date(lead.created_at).toLocaleString('fr-FR')}<br><br>`;
        
        for (const [fieldId, value] of Object.entries(lead.response_data)) {
            const field = lead.project_fields?.find(f => f.id === fieldId);
            if (field) {
                details += `<strong>${field.name}:</strong> ${Array.isArray(value) ? value.join(', ') : value}<br>`;
            }
        }
        
        alert(details);
        
    } catch (error) {
        alert('Erreur lors du chargement du lead: ' + error.message);
    }
}

// Recherche de leads
document.getElementById('searchLeads').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#leadsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
});

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

// Initialisation
async function init() {
    await checkAuth();
    loadProjects();
    loadProjectsFilter();
    setupFilters();
    await loadLeads(); // Charger les leads au démarrage
}

// Démarrer l'initialisation quand la page est chargée
document.addEventListener('DOMContentLoaded', init);
