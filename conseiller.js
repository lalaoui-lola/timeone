// Conseiller Dashboard JavaScript
let currentUser = null;
let currentProjectId = null;
let conseillerAdvancedProjectsChart = null;

// ========== INITIALISATION ==========

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadProjects();
    setupTabNavigation();
});

function setupTabNavigation() {
    document.querySelectorAll('.nav-item[data-tab]').forEach(button => {
        button.addEventListener('click', async (e) => {
            const tab = e.currentTarget.dataset.tab;
            
            // Mettre à jour les boutons actifs
            document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            // Mettre à jour les contenus
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(`${tab}Tab`).classList.add('active');
            
            // Mettre à jour les titres
            const titles = {
                projects: { title: 'Projets', subtitle: 'Sélectionnez un projet pour voir les leads validés' },
                leads: { title: 'Tous les Leads', subtitle: 'Gérer et valider les leads des agents' },
                stats: { title: 'Statistiques', subtitle: 'Vue d\'ensemble des performances' }
            };
            
            if (titles[tab]) {
                document.getElementById('pageTitle').textContent = titles[tab].title;
                document.getElementById('pageSubtitle').textContent = titles[tab].subtitle;
            }
            
            // Charger les données selon l'onglet
            if (tab === 'leads') {
                await loadAllLeads();
            } else if (tab === 'stats') {
                await loadConseillerStats();
                initializeConseillerAdvancedFilters();
            }
        });
    });
}

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
}

// ========== STATISTIQUES AVANCÉES ==========

let conseillerCharts = {
    status: null,
    daily: null,
    monthly: null
};

async function loadConseillerStats() {
    try {
        // Charger tous les leads validés
        const { data: leads } = await supabase
            .from('project_responses')
            .select('*, projects(name)')
            .eq('status', 'validated')
            .order('created_at', { ascending: false });
        
        if (!leads) return;
        
        // KPIs
        const totalLeads = leads.length;
        const leadsOK = leads.filter(l => l.conseiller_status === 'OK').length;
        const leadsRappeler = leads.filter(l => l.conseiller_status === 'Rappeler').length;
        const leadsNonOK = leads.filter(l => l.conseiller_status === 'No OK').length;
        const tauxOK = totalLeads > 0 ? ((leadsOK / totalLeads) * 100).toFixed(1) : 0;
        
        // Leads du mois en cours
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const leadsMois = leads.filter(l => new Date(l.created_at) >= firstDayOfMonth).length;
        
        // Leads de la semaine en cours (Lundi-Dimanche)
        const currentDay = now.getDay();
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - daysFromMonday);
        monday.setHours(0, 0, 0, 0);
        const leadsSemaine = leads.filter(l => new Date(l.created_at) >= monday).length;
        
        // Mettre à jour les KPIs
        document.getElementById('kpiTotalLeads').textContent = totalLeads;
        document.getElementById('kpiLeadsOK').textContent = leadsOK;
        document.getElementById('kpiLeadsRappeler').textContent = leadsRappeler;
        document.getElementById('kpiLeadsNonOK').textContent = leadsNonOK;
        document.getElementById('kpiTauxOK').textContent = `${tauxOK}%`;
        document.getElementById('kpiLeadsMois').textContent = leadsMois;
        document.getElementById('kpiLeadsSemaine').textContent = leadsSemaine;
        
        // Charger les graphiques
        await loadConseillerProjectsChart(leads);
        loadConseillerStatusChart(leadsOK, leadsRappeler, leadsNonOK, totalLeads - leadsOK - leadsRappeler - leadsNonOK);
        await loadConseillerDailyChart();
        await loadConseillerMonthlyChart();
        
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

async function loadConseillerProjectsChart(leads) {
    // Grouper par projet
    const projectCounts = {};
    leads.forEach(lead => {
        const projectName = lead.projects?.name || 'N/A';
        projectCounts[projectName] = (projectCounts[projectName] || 0) + 1;
    });
    
    const projectData = Object.entries(projectCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    
    const maxCount = Math.max(...projectData.map(p => p.count), 1);
    
    const container = document.getElementById('conseillerProjectsChart');
    container.innerHTML = '';
    
    projectData.forEach((project, index) => {
        const percentage = (project.count / maxCount) * 100;
        const minWidth = project.count === 0 ? 5 : Math.max(percentage, 10);
        
        const projectBar = document.createElement('div');
        projectBar.className = 'project-bar-item';
        projectBar.style.cssText = `
            animation: slideInRight 0.5s ease forwards;
            animation-delay: ${index * 0.1}s;
            opacity: 0;
        `;
        
        projectBar.innerHTML = `
            <div class="project-bar-header">
                <span class="project-bar-name">${project.name}</span>
                <span class="project-bar-count">${project.count}</span>
            </div>
            <div class="project-bar-track">
                <div class="project-bar-fill ${project.count === 0 ? 'empty' : ''}" 
                     style="width: ${minWidth}%">
                </div>
            </div>
        `;
        
        container.appendChild(projectBar);
    });
}

function loadConseillerStatusChart(ok, rappeler, nonOk, nonTraite) {
    if (conseillerCharts.status) {
        conseillerCharts.status.destroy();
    }
    
    const ctx = document.getElementById('conseillerStatusChart').getContext('2d');
    conseillerCharts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['OK', 'À Rappeler', 'Non OK', 'Non Traité'],
            datasets: [{
                data: [ok, rappeler, nonOk, nonTraite],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(156, 163, 175, 0.8)'
                ],
                borderColor: [
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#9ca3af'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            }
        }
    });
}

async function loadConseillerDailyChart() {
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const { count } = await supabase
            .from('project_responses')
            .select('*', { count: 'exact' })
            .eq('status', 'validated')
            .gte('created_at', date.toISOString())
            .lt('created_at', nextDate.toISOString());
        
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
        const dayDate = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        labels.push(`${dayName.charAt(0).toUpperCase() + dayName.slice(1)}\n${dayDate}`);
        data.push(count || 0);
    }
    
    if (conseillerCharts.daily) {
        conseillerCharts.daily.destroy();
    }
    
    const ctx = document.getElementById('conseillerDailyChart').getContext('2d');
    conseillerCharts.daily = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Leads',
                data: data,
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: { size: 11 }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

async function loadConseillerMonthlyChart() {
    const now = new Date();
    const labels = [];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const { count } = await supabase
            .from('project_responses')
            .select('*', { count: 'exact' })
            .eq('status', 'validated')
            .gte('created_at', date.toISOString())
            .lt('created_at', nextMonth.toISOString());
        
        labels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
        data.push(count || 0);
    }
    
    if (conseillerCharts.monthly) {
        conseillerCharts.monthly.destroy();
    }
    
    const ctx = document.getElementById('conseillerMonthlyChart').getContext('2d');
    conseillerCharts.monthly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Leads validés',
                data: data,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)'
                    },
                    grid: { display: false }
                }
            }
        }
    });
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
    const dateDebutFilter = document.getElementById('filterConseillerDateDebut').value;
    const dateFinFilter = document.getElementById('filterConseillerDateFin').value;
    
    let filteredLeads = [...allLeadsData];
    
    // Filtre par projet
    if (projectFilter) {
        filteredLeads = filteredLeads.filter(lead => lead.project_id === projectFilter);
    }
    
    // Filtre par date de début
    if (dateDebutFilter) {
        filteredLeads = filteredLeads.filter(lead => {
            const leadDate = new Date(lead.created_at).toISOString().split('T')[0];
            return leadDate >= dateDebutFilter;
        });
    }
    
    // Filtre par date de fin
    if (dateFinFilter) {
        filteredLeads = filteredLeads.filter(lead => {
            const leadDate = new Date(lead.created_at).toISOString().split('T')[0];
            return leadDate <= dateFinFilter;
        });
    }
    
    displayLeads(filteredLeads);
    updateStats(filteredLeads);
}

function clearConseillerFilters() {
    document.getElementById('filterConseillerProject').value = '';
    document.getElementById('filterConseillerDateDebut').value = '';
    document.getElementById('filterConseillerDateFin').value = '';
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
                <div class="project-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <div>
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-description">${project.description || 'Aucune description disponible pour ce projet'}</p>
                </div>
            </div>
            <div class="project-meta">
                <span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    ${totalValidated} Leads
                </span>
                <span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

// ========== ADVANCED FILTERS & STATS ==========

// Initialize conseiller advanced filters
function initializeConseillerAdvancedFilters() {
    // Populate year filter
    const yearSelect = document.getElementById('conseillerFilterYear');
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    
    yearSelect.innerHTML = '<option value="">Toutes les années</option>';
    for (let year = currentYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
    
    // Set current month
    const monthSelect = document.getElementById('conseillerFilterMonth');
    const currentMonth = new Date().getMonth() + 1;
    monthSelect.value = currentMonth;
    
    // Load initial data
    loadConseillerAdvancedStats();
}

// Apply conseiller advanced filters
async function applyConseillerAdvancedFilters() {
    await loadConseillerAdvancedStats();
}

// Clear conseiller advanced filters
async function clearConseillerAdvancedFilters() {
    document.getElementById('conseillerFilterYear').value = '';
    document.getElementById('conseillerFilterMonth').value = '';
    await loadConseillerAdvancedStats();
}

// Load conseiller advanced statistics
async function loadConseillerAdvancedStats() {
    const year = document.getElementById('conseillerFilterYear')?.value;
    const month = document.getElementById('conseillerFilterMonth')?.value;
    
    try {
        // Build query - only validated leads for conseiller
        let query = supabase
            .from('project_responses')
            .select('*')
            .eq('status', 'validated');
        
        // Apply filters
        if (year) {
            const startDate = new Date(year, month ? parseInt(month) - 1 : 0, 1);
            const endDate = month 
                ? new Date(year, parseInt(month), 0, 23, 59, 59)
                : new Date(year, 11, 31, 23, 59, 59);
            
            query = query
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());
        } else if (month) {
            const currentYear = new Date().getFullYear();
            const startDate = new Date(currentYear, parseInt(month) - 1, 1);
            const endDate = new Date(currentYear, parseInt(month), 0, 23, 59, 59);
            
            query = query
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());
        }
        
        const { data: leads, error } = await query;
        
        if (error) throw error;
        
        // Update period label
        updateConseillerPeriodLabel(year, month);
        
        // Update total count
        document.getElementById('conseillerPeriodLeadsCount').textContent = leads.length;
        
        // Load projects data
        const { data: projects } = await supabase
            .from('projects')
            .select('id, name');
        
        // Calculate leads by project
        const projectStats = {};
        projects.forEach(project => {
            projectStats[project.id] = {
                name: project.name,
                count: 0
            };
        });
        
        leads.forEach(lead => {
            if (projectStats[lead.project_id]) {
                projectStats[lead.project_id].count++;
            }
        });
        
        // Prepare chart data
        const projectNames = [];
        const projectCounts = [];
        const projectColors = [];
        
        Object.values(projectStats).forEach((project, index) => {
            projectNames.push(project.name);
            projectCounts.push(project.count);
            // Generate colors
            const hue = (index * 137.5) % 360;
            projectColors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
        });
        
        // Update chart
        updateConseillerAdvancedProjectsChart(projectNames, projectCounts, projectColors);
        
    } catch (error) {
        console.error('Erreur chargement stats avancées conseiller:', error);
    }
}

// Update conseiller period label
function updateConseillerPeriodLabel(year, month) {
    const periodLabel = document.getElementById('conseillerPeriodLabel');
    if (!periodLabel) return;
    
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    if (year && month) {
        periodLabel.textContent = `${monthNames[parseInt(month) - 1]} ${year}`;
    } else if (year) {
        periodLabel.textContent = `Année ${year}`;
    } else if (month) {
        const currentYear = new Date().getFullYear();
        periodLabel.textContent = `${monthNames[parseInt(month) - 1]} ${currentYear}`;
    } else {
        periodLabel.textContent = 'Toutes les périodes';
    }
}

// Update conseiller advanced projects chart
function updateConseillerAdvancedProjectsChart(labels, data, colors) {
    const ctx = document.getElementById('conseillerAdvancedProjectsChart');
    if (!ctx) return;
    
    if (conseillerAdvancedProjectsChart) {
        conseillerAdvancedProjectsChart.destroy();
    }
    
    conseillerAdvancedProjectsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nombre de Leads',
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.8', '1')),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#0E3A40',
                    bodyColor: '#0E3A40',
                    borderColor: '#F7C7BB',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return ' ' + context.parsed.y + ' lead(s)';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: 'rgba(14, 58, 64, 0.7)',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(247, 199, 187, 0.15)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(14, 58, 64, 0.7)',
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Note: Initialization is handled by DOMContentLoaded event listener above
// No need for separate init() call to avoid duplicate loading
