// Conseiller Dashboard JavaScript
let currentUser = null;
let currentProjectId = null;

// ========== AUTHENTIFICATION ==========

async function checkAuth() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            window.location.href = 'index.html';
            return;
        }
        
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('role, email')
            .eq('user_id', session.user.id)
            .single();
        
        if (error) throw error;
        
        if (!profile || profile.role !== 'conseiller') {
            alert('Accès refusé. Vous devez être conseiller.');
            await supabase.auth.signOut();
            window.location.href = 'index.html';
            return;
        }
        
        currentUser = session.user;
        document.getElementById('conseillerName').textContent = profile.email.split('@')[0];
        
    } catch (error) {
        console.error('Erreur authentification:', error);
    }
}

async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// ========== CHARGEMENT DES LEADS ==========

async function loadAllLeads() {
    try {
        // Charger les leads avec les projets
        const { data: leads, error: leadsError } = await supabase
            .from('project_responses')
            .select('*, projects(name)')
            .order('created_at', { ascending: false });
        
        if (leadsError) throw leadsError;
        
        // Récupérer les emails des agents
        if (leads && leads.length > 0) {
            const userIds = [...new Set(leads.map(l => l.user_id))];
            const { data: profiles } = await supabase
                .from('user_profiles')
                .select('user_id, email')
                .in('user_id', userIds);
            
            const profileMap = {};
            profiles?.forEach(p => {
                profileMap[p.user_id] = p.email;
            });
            
            leads.forEach(lead => {
                lead.agent_email = profileMap[lead.user_id] || 'N/A';
            });
        }
        
        // Stocker les données pour le filtrage
        allLeadsData = leads || [];
        
        displayLeads(allLeadsData);
        updateStats(allLeadsData);
        
        // Charger les projets dans le filtre
        await loadConseillerProjectsFilter();
        
    } catch (error) {
        console.error('Erreur chargement leads:', error);
    }
}

function displayLeads(leads) {
    const tbody = document.getElementById('leadsTableBody');
    tbody.innerHTML = '';
    
    if (leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">Aucun lead trouvé</td></tr>';
        return;
    }
    
    leads.forEach(lead => {
        // Conseiller status and comment
        const conseillerStatus = lead.conseiller_status;
        const conseillerComment = lead.conseiller_comment;
        
        const statusConfig = {
            'OK': { label: '✅ OK', color: '#10b981' },
            'Rappeler': { label: '📞 Rappeler', color: '#f59e0b' },
            'No OK': { label: '❌ No OK', color: '#ef4444' }
        };
        
        let conseillerAvis = '';
        if (conseillerStatus) {
            const statusInfo = statusConfig[conseillerStatus];
            conseillerAvis = `
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <span class="role-badge" style="background: rgba(${getColorRGB(statusInfo.color)}, 0.1); border-color: ${statusInfo.color}; color: ${statusInfo.color}; display: inline-block; width: fit-content;">
                        ${statusInfo.label}
                    </span>
                    ${conseillerComment ? `<div style="color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.4; max-width: 300px;">${conseillerComment.substring(0, 100)}${conseillerComment.length > 100 ? '...' : ''}</div>` : ''}
                </div>
            `;
        } else {
            conseillerAvis = '<span style="color: rgba(255,255,255,0.4); font-style: italic;">Non traité</span>';
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${lead.projects?.name || 'N/A'}</td>
            <td>${lead.agent_email || 'N/A'}</td>
            <td>${new Date(lead.created_at).toLocaleDateString('fr-FR')}</td>
            <td>${conseillerAvis}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="openLeadModal('${lead.id}', false)" title="Voir les détails">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="openLeadModalConseiller('${lead.id}')" title="Ajouter/Modifier avis" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getColorRGB(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `${r}, ${g}, ${b}`;
}

function updateStats(leads) {
    const total = leads.length;
    const pending = leads.filter(l => (l.status || 'pending') === 'pending').length;
    const validated = leads.filter(l => l.status === 'validated').length;
    const rejected = leads.filter(l => l.status === 'rejected').length;
    
    document.getElementById('totalLeads').textContent = total;
    document.getElementById('pendingLeads').textContent = pending;
    document.getElementById('validatedLeads').textContent = validated;
    
    document.getElementById('statsTotal').textContent = total;
    document.getElementById('statsPending').textContent = pending;
    document.getElementById('statsValidated').textContent = validated;
    document.getElementById('statsRejected').textContent = rejected;
}

// ========== VALIDATION DES LEADS ==========

async function validateLead(leadId, status) {
    const confirmMessage = status === 'validated' 
        ? 'Voulez-vous vraiment valider ce lead ?' 
        : 'Voulez-vous vraiment rejeter ce lead ?';
    
    if (!confirm(confirmMessage)) return;
    
    try {
        const { error } = await supabase
            .from('project_responses')
            .update({ status: status })
            .eq('id', leadId);
        
        if (error) throw error;
        
        alert(`Lead ${status === 'validated' ? 'validé' : 'rejeté'} avec succès!`);
        loadAllLeads();
        
    } catch (error) {
        console.error('Erreur validation:', error);
        alert('Erreur lors de la validation: ' + error.message);
    }
}

// ========== FILTRES ==========

let allLeadsData = []; // Stocker tous les leads pour le filtrage

async function loadConseillerProjectsFilter() {
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
    
    const select = document.getElementById('filterConseillerProject');
    if (select && projects) {
        select.innerHTML = '<option value="">Tous les projets</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            select.appendChild(option);
        });
    }
}

function applyConseillerFilters() {
    const projectFilter = document.getElementById('filterConseillerProject').value;
    const dateFilter = document.getElementById('filterConseillerDate').value;
    
    let filteredLeads = [...allLeadsData];
    
    // Filtre par projet
    if (projectFilter) {
        filteredLeads = filteredLeads.filter(lead => lead.project_id === projectFilter);
    }
    
    // Filtre par date
    if (dateFilter) {
        filteredLeads = filteredLeads.filter(lead => {
            const leadDate = new Date(lead.created_at).toISOString().split('T')[0];
            return leadDate === dateFilter;
        });
    }
    
    displayLeads(filteredLeads);
    updateStats(filteredLeads);
}

function clearConseillerFilters() {
    document.getElementById('filterConseillerProject').value = '';
    document.getElementById('filterConseillerDate').value = '';
    displayLeads(allLeadsData);
    updateStats(allLeadsData);
}

// ========== PROJETS ==========

async function loadProjects() {
    try {
        console.log('🔍 Chargement des projets...');
        
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .order('name');
        
        if (error) {
            console.error('❌ Erreur projets:', error);
            throw error;
        }
        
        console.log('✅ Projets chargés:', projects);
        
        // Vérifier tous les leads (debug)
        const { data: allLeads } = await supabase
            .from('project_responses')
            .select('id, project_id, status');
        
        console.log('📊 Tous les leads dans la DB:', allLeads);
        console.log('📊 Leads par statut:', {
            total: allLeads?.length || 0,
            pending: allLeads?.filter(l => l.status === 'pending').length || 0,
            validated: allLeads?.filter(l => l.status === 'validated').length || 0,
            rejected: allLeads?.filter(l => l.status === 'rejected').length || 0,
            null_status: allLeads?.filter(l => !l.status).length || 0
        });
        
        displayProjectCards(projects);
        
    } catch (error) {
        console.error('Erreur chargement projets:', error);
        alert('Erreur: ' + error.message);
    }
}

async function displayProjectCards(projects) {
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '';
    
    console.log('🔍 Projets chargés:', projects.length);
    
    if (projects.length === 0) {
        grid.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 3rem;">Aucun projet trouvé</p>';
        return;
    }
    
    for (const project of projects) {
        // Count validated leads for this project
        const { data: leads, error } = await supabase
            .from('project_responses')
            .select('id, conseiller_status')
            .eq('project_id', project.id)
            .eq('status', 'validated');
        
        console.log(`📊 Projet ${project.name}: ${leads ? leads.length : 0} leads validés`, leads);
        if (error) console.error('Erreur leads:', error);
        
        const totalValidated = leads ? leads.length : 0;
        const withConseillerStatus = leads ? leads.filter(l => l.conseiller_status).length : 0;
        
        const card = document.createElement('div');
        card.className = 'project-card conseiller-card';
        card.style.cursor = 'pointer';
        card.onclick = () => openProjectLeads(project.id, project.name);
        
        card.innerHTML = `
            <div class="project-header">
                <div>
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-description">${project.description || 'Aucune description'}</p>
                </div>
            </div>
            <div class="project-meta">
                <span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    ${totalValidated} Leads validés
                </span>
                <span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    ${withConseillerStatus} Traités
                </span>
            </div>
        `;
        
        grid.appendChild(card);
    }
}

async function openProjectLeads(projectId, projectName) {
    currentProjectId = projectId;
    
    // Hide other tabs
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById('projectLeadsTab').classList.add('active');
    
    // Update title
    document.getElementById('projectLeadsTitle').textContent = `Leads validés - ${projectName}`;
    
    // Load validated leads for this project
    await loadProjectLeads(projectId);
}

async function loadProjectLeads(projectId) {
    try {
        console.log('🔍 Chargement leads pour projet:', projectId);
        
        // Charger les leads
        const { data: leads, error: leadsError } = await supabase
            .from('project_responses')
            .select('*')
            .eq('project_id', projectId)
            .eq('status', 'validated')
            .order('created_at', { ascending: false });
        
        if (leadsError) {
            console.error('❌ Erreur SQL:', leadsError);
            throw leadsError;
        }
        
        console.log('✅ Leads chargés:', leads ? leads.length : 0, leads);
        
        // Récupérer les emails des agents pour chaque lead
        if (leads && leads.length > 0) {
            const userIds = [...new Set(leads.map(l => l.user_id))];
            const { data: profiles } = await supabase
                .from('user_profiles')
                .select('user_id, email')
                .in('user_id', userIds);
            
            // Associer les emails aux leads
            const profileMap = {};
            profiles?.forEach(p => {
                profileMap[p.user_id] = p.email;
            });
            
            leads.forEach(lead => {
                lead.agent_email = profileMap[lead.user_id] || 'N/A';
            });
        }
        
        displayProjectLeads(leads || []);
        
    } catch (error) {
        console.error('Erreur chargement leads:', error);
        alert('Erreur lors du chargement des leads: ' + error.message);
    }
}

function displayProjectLeads(leads) {
    const tbody = document.getElementById('projectLeadsTableBody');
    tbody.innerHTML = '';
    
    document.getElementById('projectLeadsCount').textContent = leads.length;
    
    if (leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">Aucun lead validé pour ce projet</td></tr>';
        return;
    }
    
    leads.forEach(lead => {
        const statusConfig = {
            'OK': { label: '✅ OK', color: '#10b981' },
            'Rappeler': { label: '📞 Rappeler', color: '#f59e0b' },
            'No OK': { label: '❌ No OK', color: '#ef4444' }
        };
        
        const statusInfo = lead.conseiller_status ? statusConfig[lead.conseiller_status] : null;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${lead.agent_email || 'N/A'}</td>
            <td>${new Date(lead.created_at).toLocaleString('fr-FR')}</td>
            <td>
                ${statusInfo ? `
                    <span class="role-badge" style="background: rgba(${getColorRGB(statusInfo.color)}, 0.1); border-color: ${statusInfo.color}; color: ${statusInfo.color};">
                        ${statusInfo.label}
                    </span>
                ` : '<span style="color: rgba(255,255,255,0.5);">Non traité</span>'}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="openLeadModalConseiller('${lead.id}')" title="Ajouter/Modifier commentaire">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function backToProjects() {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById('projectsTab').classList.add('active');
    
    document.getElementById('pageTitle').textContent = 'Projets';
    document.getElementById('pageSubtitle').textContent = 'Sélectionnez un projet pour voir les leads validés';
    
    currentProjectId = null;
}

// ========== MODAL CONSEILLER ==========

async function openLeadModalConseiller(leadId) {
    // Open modal with conseiller edit mode
    await openLeadModal(leadId, false, true);
}

// ========== NAVIGATION ==========

document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tab + 'Tab').classList.add('active');
        
        const titles = {
            projects: { title: 'Projets', subtitle: 'Sélectionnez un projet pour voir les leads validés' },
            leads: { title: 'Tous les Leads', subtitle: 'Gérer et valider les leads des agents' },
            stats: { title: 'Statistiques', subtitle: 'Vue d\'ensemble des performances' }
        };
        
        document.getElementById('pageTitle').textContent = titles[tab].title;
        document.getElementById('pageSubtitle').textContent = titles[tab].subtitle;
    });
});

// ========== INITIALISATION ==========

async function init() {
    await checkAuth();
    await loadProjects();
    await loadAllLeads();
}

init();
