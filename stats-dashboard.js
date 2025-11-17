// Stats Dashboard JavaScript
// Supabase client is initialized in supabase-config.js

// Chart instances
let leadsEvolutionChart, validationRateChart, projectsChart, dailyLeadsChart;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadAllStats();
    setupEventListeners();
});

// Check authentication
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    // Vérifier le rôle admin
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
    
    if (profile?.role !== 'admin') {
        window.location.href = 'index.html';
    }
}

// Logout
async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('evolutionPeriod').addEventListener('change', loadLeadsEvolution);
}

// Load all statistics
async function loadAllStats() {
    try {
        await Promise.all([
            loadKPIs(),
            loadLeadsEvolution(),
            loadValidationRate(),
            loadProjectsStats(),
            loadConseillerStats(),
            loadTopAgents(),
            loadDailyLeads(),
            loadWeeklyStats()
        ]);
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// Refresh stats
async function refreshStats() {
    const btn = document.querySelector('.refresh-btn');
    btn.disabled = true;
    btn.querySelector('svg').style.animation = 'spin 0.6s ease';
    
    await loadAllStats();
    
    setTimeout(() => {
        btn.disabled = false;
        btn.querySelector('svg').style.animation = 'none';
    }, 600);
}

// Load KPIs
async function loadKPIs() {
    // Total leads (all time)
    const { count: totalLeads } = await supabase
        .from('project_responses')
        .select('*', { count: 'exact' });
    
    // RDV Cette Semaine (Lun-Ven)
    const today = new Date();
    const currentDay = today.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);
    
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5); // Samedi (pour exclure)
    
    const { count: weekLeads } = await supabase
        .from('project_responses')
        .select('*', { count: 'exact' })
        .gte('created_at', monday.toISOString())
        .lt('created_at', saturday.toISOString());
    
    // RDV Ce Mois
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    firstDayOfNextMonth.setHours(0, 0, 0, 0);
    
    const { count: monthLeads } = await supabase
        .from('project_responses')
        .select('*', { count: 'exact' })
        .gte('created_at', firstDayOfMonth.toISOString())
        .lt('created_at', firstDayOfNextMonth.toISOString());
    
    // Validated leads (all time)
    const { count: validatedLeads } = await supabase
        .from('project_responses')
        .select('*', { count: 'exact' })
        .eq('status', 'validated');
    
    // Pending leads (all time)
    const { count: pendingLeads } = await supabase
        .from('project_responses')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');
    
    // Active agents (all time)
    const { data: leadsData } = await supabase.from('project_responses').select('user_id');
    const activeAgents = new Set(leadsData?.map(l => l.user_id)).size;
    
    // Conseiller OK count (all time)
    const { count: conseillerOK } = await supabase
        .from('project_responses')
        .select('*', { count: 'exact' })
        .eq('conseiller_status', 'OK');
    
    // Calculate transformation rate (OK Conseiller / Total Leads)
    const transformationRate = totalLeads > 0 ? ((conseillerOK / totalLeads) * 100).toFixed(1) : 0;
    
    // Update UI with animation - start from current value
    const currentTotal = parseInt(document.getElementById('totalLeads')?.textContent) || 0;
    const currentWeek = parseInt(document.getElementById('weekLeads')?.textContent) || 0;
    const currentMonth = parseInt(document.getElementById('monthLeads')?.textContent) || 0;
    const currentValidated = parseInt(document.getElementById('validatedLeads')?.textContent) || 0;
    const currentPending = parseInt(document.getElementById('pendingLeads')?.textContent) || 0;
    const currentAgents = parseInt(document.getElementById('activeAgents')?.textContent) || 0;
    const currentOK = parseInt(document.getElementById('conseillerOK')?.textContent) || 0;
    
    animateValue('totalLeads', currentTotal, totalLeads || 0, 600);
    animateValue('weekLeads', currentWeek, weekLeads || 0, 600);
    animateValue('monthLeads', currentMonth, monthLeads || 0, 600);
    animateValue('validatedLeads', currentValidated, validatedLeads || 0, 600);
    animateValue('pendingLeads', currentPending, pendingLeads || 0, 600);
    animateValue('activeAgents', currentAgents, activeAgents || 0, 600);
    animateValue('conseillerOK', currentOK, conseillerOK || 0, 600);
    
    // Update transformation rate with animation
    const currentRateText = document.getElementById('transformationRate')?.textContent || '0%';
    const currentRate = parseFloat(currentRateText.replace('%', '')) || 0;
    animatePercentage('transformationRate', currentRate, parseFloat(transformationRate), 600);
    
    // Update month name
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    document.getElementById('monthName').textContent = monthNames[today.getMonth()];
    
    // Update percentages
    document.getElementById('validatedLeadsTrend').textContent = `${totalLeads > 0 ? ((validatedLeads / totalLeads) * 100).toFixed(1) : 0}%`;
    document.getElementById('pendingLeadsTrend').textContent = `${totalLeads > 0 ? ((pendingLeads / totalLeads) * 100).toFixed(1) : 0}%`;
    document.getElementById('activeAgentsTrend').textContent = `+${activeAgents}`;
    
    // Calculate percentage of OK vs total validated leads
    const okPercent = validatedLeads > 0 ? ((conseillerOK / validatedLeads) * 100).toFixed(1) : 0;
    document.getElementById('conseillerOKPercent').textContent = `${okPercent}%`;
}

// Load leads evolution
async function loadLeadsEvolution() {
    const days = parseInt(document.getElementById('evolutionPeriod').value);
    const labels = [];
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const { count } = await supabase
            .from('project_responses')
            .select('*', { count: 'exact' })
            .gte('created_at', date.toISOString())
            .lt('created_at', nextDate.toISOString());
        
        labels.push(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
        data.push(count || 0);
    }
    
    if (leadsEvolutionChart) {
        leadsEvolutionChart.destroy();
    }
    
    const ctx = document.getElementById('leadsEvolutionChart').getContext('2d');
    leadsEvolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Leads',
                data: data,
                borderColor: 'rgba(247, 199, 187, 1)',
                backgroundColor: 'rgba(247, 199, 187, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: 'rgba(247, 199, 187, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
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
                    padding: 12,
                    titleColor: '#000',
                    bodyColor: '#000',
                    borderColor: 'rgba(247, 199, 187, 0.5)',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#000',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.12)'
                    }
                },
                x: {
                    ticks: {
                        color: '#000'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Load validation rate
async function loadValidationRate() {
    const { data: leads } = await supabase
        .from('project_responses')
        .select('status');
    
    const statusCounts = {
        validated: 0,
        pending: 0,
        rejected: 0
    };
    
    leads?.forEach(lead => {
        const status = lead.status || 'pending';
        statusCounts[status]++;
    });
    
    if (validationRateChart) {
        validationRateChart.destroy();
    }
    
    const ctx = document.getElementById('validationRateChart').getContext('2d');
    validationRateChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Validés', 'En attente', 'Rejetés'],
            datasets: [{
                data: [statusCounts.validated, statusCounts.pending, statusCounts.rejected],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)'
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
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff'
                }
            }
        }
    });
}

// Load projects stats
async function loadProjectsStats() {
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name');
    
    const projectCounts = await Promise.all(
        projects.map(async (project) => {
            const { count } = await supabase
                .from('project_responses')
                .select('*', { count: 'exact' })
                .eq('project_id', project.id);
            return { name: project.name, count: count || 0 };
        })
    );
    
    projectCounts.sort((a, b) => b.count - a.count);
    
    if (projectsChart) {
        projectsChart.destroy();
    }
    
    const ctx = document.getElementById('projectsChart').getContext('2d');
    projectsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: projectCounts.map(p => p.name),
            datasets: [{
                label: 'Nombre de leads',
                data: projectCounts.map(p => p.count),
                backgroundColor: 'rgba(247, 199, 187, 0.6)',
                borderColor: 'rgba(247, 199, 187, 1)',
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
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff'
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
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Load conseiller stats
async function loadConseillerStats() {
    // Get all projects
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
    
    if (!projects) return;
    
    // Get OK count for each project
    const projectStats = await Promise.all(
        projects.map(async (project) => {
            const { count } = await supabase
                .from('project_responses')
                .select('*', { count: 'exact' })
                .eq('project_id', project.id)
                .eq('conseiller_status', 'OK');
            
            return {
                name: project.name,
                okCount: count || 0
            };
        })
    );
    
    // Sort by OK count descending
    projectStats.sort((a, b) => b.okCount - a.okCount);
    
    // Display in container
    const container = document.getElementById('conseillerProjectsStats');
    container.innerHTML = '';
    
    if (projectStats.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">Aucun projet</p>';
        return;
    }
    
    // Find max for percentage calculation
    const maxCount = Math.max(...projectStats.map(p => p.okCount));
    
    projectStats.forEach((project, index) => {
        const percentage = maxCount > 0 ? (project.okCount / maxCount) * 100 : 0;
        
        const projectElement = document.createElement('div');
        projectElement.style.cssText = `
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            transition: all 0.3s ease;
            animation: slideUp 0.6s ease ${index * 0.1}s backwards;
        `;
        
        projectElement.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="color: rgba(255, 255, 255, 0.9); font-weight: 500; font-size: 0.9rem;">${project.name}</span>
                    <span style="color: #10b981; font-weight: 700; font-size: 1.1rem;">${project.okCount}</span>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #10b981, #059669); transition: width 1s ease;"></div>
                </div>
            </div>
        `;
        
        projectElement.addEventListener('mouseenter', () => {
            projectElement.style.background = 'rgba(255, 255, 255, 0.05)';
            projectElement.style.transform = 'translateX(5px)';
        });
        
        projectElement.addEventListener('mouseleave', () => {
            projectElement.style.background = 'rgba(255, 255, 255, 0.03)';
            projectElement.style.transform = 'translateX(0)';
        });
        
        container.appendChild(projectElement);
    });
}

// Load top agents
async function loadTopAgents() {
    const { data: leads } = await supabase
        .from('project_responses')
        .select('user_id');
    
    const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, email, role')
        .eq('role', 'agent');
    
    const agentCounts = {};
    leads?.forEach(lead => {
        agentCounts[lead.user_id] = (agentCounts[lead.user_id] || 0) + 1;
    });
    
    const agentStats = profiles?.map(profile => ({
        ...profile,
        count: agentCounts[profile.user_id] || 0
    })).sort((a, b) => b.count - a.count).slice(0, 5);
    
    const container = document.getElementById('topAgents');
    container.innerHTML = '';
    
    agentStats?.forEach((agent, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'other';
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.style.animationDelay = `${index * 0.1}s`;
        item.innerHTML = `
            <div class="leaderboard-rank ${rankClass}">${index + 1}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${agent.email.split('@')[0]}</div>
                <div class="leaderboard-email">${agent.email}</div>
            </div>
            <div class="leaderboard-stats">
                <div class="leaderboard-stat">
                    <div class="leaderboard-stat-value">${agent.count}</div>
                    <div class="leaderboard-stat-label">Leads</div>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Load daily leads (last 7 days)
async function loadDailyLeads() {
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
            .gte('created_at', date.toISOString())
            .lt('created_at', nextDate.toISOString());
        
        labels.push(date.toLocaleDateString('fr-FR', { weekday: 'short' }));
        data.push(count || 0);
    }
    
    if (dailyLeadsChart) {
        dailyLeadsChart.destroy();
    }
    
    const ctx = document.getElementById('dailyLeadsChart').getContext('2d');
    dailyLeadsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Leads',
                data: data,
                backgroundColor: 'rgba(168, 85, 247, 0.6)',
                borderColor: 'rgba(168, 85, 247, 1)',
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
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Load weekly stats
async function loadWeeklyStats() {
    const container = document.getElementById('weeklyStats');
    container.innerHTML = '';
    
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
    const dailyData = [];
    let maxCount = 0;
    
    // Get the Monday of the current week
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // If Sunday, go back 6 days to Monday
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);
    
    // Collect data from Monday to Friday of current week
    for (let i = 0; i < 5; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const { count } = await supabase
            .from('project_responses')
            .select('*', { count: 'exact' })
            .gte('created_at', date.toISOString())
            .lt('created_at', nextDate.toISOString());
        
        dailyData.push({
            dayName: dayNames[i],
            count: count || 0,
            date: date,
            isFuture: date > today
        });
        
        maxCount = Math.max(maxCount, count || 0);
    }
    
    // Display the data
    dailyData.forEach((data, index) => {
        const percentage = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
        const dayElement = document.createElement('div');
        dayElement.className = 'week-day';
        dayElement.style.animationDelay = `${index * 0.1}s`;
        
        // Add opacity for future days
        const opacity = data.isFuture ? 'opacity: 0.5;' : '';
        
        dayElement.innerHTML = `
            <div class="week-day-name">${data.dayName}</div>
            <div class="week-day-value" style="${opacity}">${data.count}</div>
            <div class="week-day-bar">
                <div class="week-day-bar-fill" style="width: ${percentage}%; ${opacity}"></div>
            </div>
        `;
        container.appendChild(dayElement);
    });
}

// Helper functions
function getDateFilter(period) {
    const now = new Date();
    switch (period) {
        case 'today':
            now.setHours(0, 0, 0, 0);
            return now.toISOString();
        case 'week':
            now.setDate(now.getDate() - 7);
            return now.toISOString();
        case 'month':
            now.setMonth(now.getMonth() - 1);
            return now.toISOString();
        case 'year':
            now.setFullYear(now.getFullYear() - 1);
            return now.toISOString();
        default:
            return null;
    }
}

function getPreviousPeriodFilter(period) {
    const now = new Date();
    const start = new Date();
    const end = new Date();
    
    switch (period) {
        case 'today':
            start.setDate(start.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            end.setDate(end.getDate() - 1);
            end.setHours(23, 59, 59, 999);
            break;
        case 'week':
            start.setDate(start.getDate() - 14);
            end.setDate(end.getDate() - 7);
            break;
        case 'month':
            start.setMonth(start.getMonth() - 2);
            end.setMonth(end.getMonth() - 1);
            break;
        case 'year':
            start.setFullYear(start.getFullYear() - 2);
            end.setFullYear(end.getFullYear() - 1);
            break;
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
}

function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

function animatePercentage(id, start, end, duration) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = current.toFixed(1) + '%';
    }, 16);
}
