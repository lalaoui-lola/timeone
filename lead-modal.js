// Lead Modal JavaScript
let currentLead = null;
let isEditMode = false;
let userRole = null;
let isConseillerMode = false;

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDateForInput(value) {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTimeForInput(value) {
    if (!value) return '';
    if (/^\d{2}:\d{2}$/.test(value)) return value.slice(0, 5);
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function formatDateTimeForInput(value) {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
}

// Open lead modal
async function openLeadModal(leadId, editable = false, conseillerMode = false) {
    try {
        // Check if supabase is defined
        if (typeof supabase === 'undefined') {
            console.error('Supabase non défini');
            alert('Erreur: Supabase non initialisé');
            return;
        }
        
        // Get user session and role
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            alert('Session expirée. Veuillez vous reconnecter.');
            window.location.href = 'index.html';
            return;
        }
        
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role, user_id')
            .eq('user_id', session.user.id)
            .single();
        
        userRole = profile?.role;
        
        // Load lead data
        const { data: lead, error } = await supabase
            .from('project_responses')
            .select('*')
            .eq('id', leadId)
            .single();
        
        if (error) {
            console.error('Erreur chargement lead:', error);
            alert('Erreur lors du chargement du lead: ' + error.message);
            return;
        }
        
        // Check permissions for agents
        if (userRole === 'agent' && lead.user_id !== session.user.id) {
            alert('Vous ne pouvez voir que vos propres leads.');
            return;
        }
        
        // Get project name
        const { data: project } = await supabase
            .from('projects')
            .select('name')
            .eq('id', lead.project_id)
            .single();
        
        // Get project fields to display proper field names
        const { data: projectFields, error: fieldsError } = await supabase
            .from('project_fields')
            .select('*')
            .eq('project_id', lead.project_id);
        
        if (fieldsError) {
            console.error('Erreur chargement champs:', fieldsError);
        }
        
        // Get agent email
        const { data: agent } = await supabase
            .from('user_profiles')
            .select('email')
            .eq('user_id', lead.user_id)
            .single();
        
        currentLead = {
            ...lead,
            project_name: project?.name || 'N/A',
            project_fields: projectFields || [],
            agent_email: agent?.email || 'N/A',
            current_user_id: session.user.id,
            current_user_role: userRole
        };
        
        isEditMode = editable;
        isConseillerMode = conseillerMode;
        
        renderLeadModal();
        showModal();
        
    } catch (error) {
        console.error('Erreur ouverture modal:', error);
        alert('Erreur lors du chargement du lead: ' + error.message);
    }
}

// Render modal content
function renderLeadModal() {
    const modal = document.getElementById('leadModal');
    if (!modal) {
        createModalElement();
        return renderLeadModal();
    }
    
    const status = currentLead.status || 'pending';
    const statusConfig = {
        pending: { label: 'En attente', icon: '⏳', class: 'pending' },
        validated: { label: 'Validé', icon: '✅', class: 'validated' },
        rejected: { label: 'Rejeté', icon: '❌', class: 'rejected' }
    };
    
    const statusInfo = statusConfig[status];
    const isAdmin = currentLead.current_user_role === 'admin';
    const canEdit = currentLead.current_user_role === 'admin' || 
                    (currentLead.current_user_role === 'agent' && currentLead.user_id === currentLead.current_user_id);
    
    const modalHTML = `
        <div class="modal-overlay" id="modalOverlay" onclick="closeLeadModal()">
            <div class="lead-modal" onclick="event.stopPropagation()">
                <!-- Header -->
                <div class="modal-header">
                    <div class="modal-title">
                        <div class="modal-title-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <line x1="19" y1="8" x2="19" y2="14"></line>
                                <line x1="22" y1="11" x2="16" y2="11"></line>
                            </svg>
                        </div>
                        <div>
                            <h2>Détails du Lead</h2>
                            <p>${currentLead.project_name}</p>
                        </div>
                    </div>
                    <button class="modal-close" onclick="closeLeadModal()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <!-- Body -->
                <div class="modal-body">
                    <!-- General Info -->
                    <div class="lead-section">
                        <div class="section-title">
                            <div class="section-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </div>
                            Informations Générales
                        </div>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Projet</div>
                                <div class="info-value">${currentLead.project_name}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Agent</div>
                                <div class="info-value">${currentLead.agent_email}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Date de création</div>
                                <div class="info-value${isEditMode && isAdmin ? ' editable' : ''}">
                                    ${isEditMode && isAdmin ? `
                                        <input
                                            type="datetime-local"
                                            id="leadCreatedAtInput"
                                            class="edit-inline-input"
                                            value="${formatDateTimeForInput(currentLead.created_at)}"
                                        />
                                    ` : escapeHtml(new Date(currentLead.created_at).toLocaleString('fr-FR'))}
                                </div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Statut</div>
                                <div class="info-value">
                                    <span class="status-badge ${statusInfo.class}">
                                        <span>${statusInfo.icon}</span>
                                        <span>${statusInfo.label}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Response Data -->
                    ${renderResponseData()}
                    
                    <!-- Audio -->
                    ${renderAudioSection()}
                    
                    <!-- Conseiller Section (visible if conseiller mode or if there's conseiller data) -->
                    ${isConseillerMode || currentLead.conseiller_status || currentLead.conseiller_comment ? renderConseillerSection() : ''}
                    
                    <!-- Notes (editable for agents and admin) -->
                    ${canEdit ? renderNotesSection() : ''}
                </div>
                
                <!-- Footer -->
                <div class="modal-footer">
                    <div>
                        ${isEditMode ? '<span class="edit-mode-badge">✎ Mode édition</span>' : ''}
                        ${isConseillerMode ? '<span class="edit-mode-badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">💼 Mode Conseiller</span>' : ''}
                    </div>
                    <div class="modal-actions">
                        ${isConseillerMode ? `
                            <button class="modal-btn modal-btn-secondary" onclick="closeLeadModal()">
                                Fermer
                            </button>
                            <button class="modal-btn modal-btn-primary" onclick="saveConseillerComment()" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Enregistrer
                            </button>
                        ` : !isEditMode ? `
                            ${canEdit ? `
                                <button class="modal-btn modal-btn-secondary" onclick="enableEditMode()">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    Modifier
                                </button>
                            ` : ''}
                            <button class="modal-btn modal-btn-secondary" onclick="closeLeadModal()">
                                Fermer
                            </button>
                            ${currentLead.current_user_role === 'admin' && status === 'pending' ? `
                                <button class="modal-btn modal-btn-primary" onclick="validateLeadFromModal('${currentLead.id}', 'validated')">
                                    ✅ Valider
                                </button>
                                <button class="modal-btn modal-btn-danger" onclick="validateLeadFromModal('${currentLead.id}', 'rejected')">
                                    ❌ Rejeter
                                </button>
                            ` : ''}
                        ` : `
                            <button class="modal-btn modal-btn-secondary" onclick="cancelEdit()">
                                Annuler
                            </button>
                            <button class="modal-btn modal-btn-primary" onclick="saveLeadChanges()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Enregistrer
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.innerHTML = modalHTML;
}

// Render response data section
function renderResponseData() {
    if (!currentLead.response_data) return '';
    
    const data = typeof currentLead.response_data === 'string' 
        ? JSON.parse(currentLead.response_data) 
        : (currentLead.response_data || {});

    if (!data || Object.keys(data).length === 0) {
        return '<div class="lead-section"><p style="color: rgba(255,255,255,0.5);">Aucune donnée</p></div>';
    }

    const items = Object.entries(data).map(([fieldId, value]) => {
        // Find the field name from project_fields
        const field = currentLead.project_fields?.find(f => f.id === fieldId);
        const fieldName = field ? field.name : fieldId;
        const fieldType = (field?.type || 'text').toLowerCase();

        let displayValue = value;
        if (Array.isArray(value)) {
            displayValue = value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
            displayValue = JSON.stringify(value);
        }

        const stringValue = displayValue !== undefined && displayValue !== null ? String(displayValue) : '';

        if (isEditMode) {
            let inputHTML = '';
            const baseAttributes = `class="edit-input" data-field-id="${fieldId}" data-field-type="${fieldType}"`;

            if (fieldType === 'textarea') {
                inputHTML = `<textarea ${baseAttributes} rows="3">${escapeHtml(stringValue)}</textarea>`;
            } else if (fieldType === 'select' && field?.options) {
                const options = field.options.map(opt => 
                    `<option value="${escapeHtml(opt)}" ${opt === value ? 'selected' : ''}>${escapeHtml(opt)}</option>`
                ).join('');
                inputHTML = `<select ${baseAttributes}>${options}</select>`;
            } else {
                let inputType = 'text';
                let inputValue = stringValue;

                if (fieldType === 'number') {
                    inputType = 'number';
                } else if (fieldType === 'email') {
                    inputType = 'email';
                } else if (fieldType === 'tel') {
                    inputType = 'tel';
                } else if (fieldType === 'date') {
                    inputType = 'date';
                    inputValue = formatDateForInput(value);
                } else if (fieldType === 'time') {
                    inputType = 'time';
                    inputValue = formatTimeForInput(value);
                } else if (fieldType === 'datetime' || fieldType === 'datetime-local') {
                    inputType = 'datetime-local';
                    inputValue = formatDateTimeForInput(value);
                }

                inputHTML = `<input type="${inputType}" ${baseAttributes} value="${escapeHtml(inputValue)}" />`;
            }

            return `
                <div class="response-item">
                    <span class="response-key">${escapeHtml(fieldName)}</span>
                    <div class="response-value editable">
                        ${inputHTML}
                    </div>
                </div>
            `;
        } else {
            // View mode - display only
            return `
                <div class="response-item">
                    <span class="response-key">${escapeHtml(fieldName)}</span>
                    <span class="response-value">${escapeHtml(stringValue)}</span>
                </div>
            `;
        }
    }).join('');

    return `
        <div class="lead-section">
            <div class="section-title">
                <div class="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                Données du Formulaire
            </div>
            <div class="response-data">
                ${items}
            </div>
        </div>
    `;
}

// Render audio section
function renderAudioSection() {
    if (currentLead.audio_url) {
        return `
            <div class="lead-section">
                <div class="section-title">
                    <div class="section-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                    </div>
                    Fichier Audio
                </div>
                <div class="modal-audio-player">
                    <audio controls src="${currentLead.audio_url}" style="width: 100%;"></audio>
                    ${isEditMode ? `
                        <button class="modal-btn modal-btn-danger" onclick="removeAudio('${currentLead.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    } else if (isEditMode) {
        return `
            <div class="lead-section">
                <div class="section-title">
                    <div class="section-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                    </div>
                    Fichier Audio
                </div>
                <div class="modal-audio-upload" onclick="uploadAudioFromModal('${currentLead.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p>Cliquez pour ajouter un fichier audio</p>
                </div>
            </div>
        `;
    }
    return '';
}

// Render notes section
function renderNotesSection() {
    const notes = currentLead.notes || '';
    
    return `
        <div class="lead-section">
            <div class="section-title">
                <div class="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </div>
                Notes
            </div>
            <div class="info-item">
                <div class="info-value ${isEditMode ? 'editable' : ''}">
                    ${isEditMode ? `
                        <textarea id="leadNotes" rows="4">${notes}</textarea>
                    ` : (notes || 'Aucune note')}
                </div>
            </div>
        </div>
    `;
}

// Render conseiller section
function renderConseillerSection() {
    const conseillerStatus = currentLead.conseiller_status || '';
    const conseillerComment = currentLead.conseiller_comment || '';
    
    const statusConfig = {
        'OK': { label: '✅ OK', color: '#10b981' },
        'Rappeler': { label: '📞 Rappeler', color: '#f59e0b' },
        'No OK': { label: '❌ No OK', color: '#ef4444' }
    };
    
    return `
        <div class="lead-section" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%); border: 1px solid rgba(16, 185, 129, 0.2);">
            <div class="section-title">
                <div class="section-icon" style="color: #10b981;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                </div>
                Avis Conseiller
            </div>
            
            ${isConseillerMode ? `
                <!-- Conseiller Edit Mode -->
                <div class="info-item">
                    <div class="info-label" style="font-size: 1rem; font-weight: 600; color: #10b981; margin-bottom: 0.75rem;">Statut *</div>
                    <div class="info-value">
                        <select id="conseillerStatus" style="width: 100%; padding: 1rem; background: rgba(16, 185, 129, 0.1); border: 2px solid rgba(16, 185, 129, 0.3); border-radius: 12px; color: white; font-size: 1.1rem; font-weight: 600; cursor: pointer;">
                            <option value="" ${!conseillerStatus ? 'selected' : ''} style="background: #1a1a2e; color: rgba(255,255,255,0.6);">-- Sélectionner un statut --</option>
                            <option value="OK" ${conseillerStatus === 'OK' ? 'selected' : ''} style="background: #1a1a2e; color: white;">✅ OK - Lead validé</option>
                            <option value="Rappeler" ${conseillerStatus === 'Rappeler' ? 'selected' : ''} style="background: #1a1a2e; color: white;">📞 Rappeler - À recontacter</option>
                            <option value="No OK" ${conseillerStatus === 'No OK' ? 'selected' : ''} style="background: #1a1a2e; color: white;">❌ No OK - Lead refusé</option>
                        </select>
                    </div>
                </div>
                
                <div class="info-item" style="margin-top: 1.5rem;">
                    <div class="info-label" style="font-size: 1rem; font-weight: 600; color: #10b981; margin-bottom: 0.75rem;">Commentaire</div>
                    <div class="info-value editable">
                        <textarea id="conseillerComment" rows="5" style="width: 100%; padding: 1rem; background: rgba(16, 185, 129, 0.1); border: 2px solid rgba(16, 185, 129, 0.3); border-radius: 12px; color: white; font-size: 1.05rem; font-weight: 500; line-height: 1.6; resize: vertical; min-height: 140px;" placeholder="Ajoutez votre commentaire détaillé ici...">${conseillerComment}</textarea>
                        <div style="margin-top: 0.5rem; font-size: 0.85rem; color: rgba(255,255,255,0.5); font-style: italic;">
                            💡 Ce commentaire sera visible par l'agent et l'administrateur
                        </div>
                    </div>
                </div>
            ` : `
                <!-- Conseiller View Mode -->
                ${conseillerStatus ? `
                    <div class="info-item">
                        <div class="info-label">Statut</div>
                        <div class="info-value">
                            <span class="role-badge" style="background: rgba(${statusConfig[conseillerStatus] ? getColorRGB(statusConfig[conseillerStatus].color) : '255,255,255'}, 0.1); border-color: ${statusConfig[conseillerStatus] ? statusConfig[conseillerStatus].color : '#fff'}; color: ${statusConfig[conseillerStatus] ? statusConfig[conseillerStatus].color : '#fff'};">
                                ${statusConfig[conseillerStatus] ? statusConfig[conseillerStatus].label : conseillerStatus}
                            </span>
                        </div>
                    </div>
                ` : ''}
                
                ${conseillerComment ? `
                    <div class="info-item">
                        <div class="info-label">Commentaire</div>
                        <div class="info-value">${conseillerComment}</div>
                    </div>
                ` : ''}
                
                ${!conseillerStatus && !conseillerComment ? `
                    <div class="info-item">
                        <div class="info-value" style="color: rgba(255,255,255,0.5); font-style: italic;">
                            Aucun avis du conseiller pour le moment
                        </div>
                    </div>
                ` : ''}
            `}
        </div>
    `;
}

function getColorRGB(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `${r}, ${g}, ${b}`;
}

// Create modal element
function createModalElement() {
    const modal = document.createElement('div');
    modal.id = 'leadModal';
    document.body.appendChild(modal);
}

// Show modal
function showModal() {
    setTimeout(() => {
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }, 50);
}

// Close modal
function closeLeadModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay?.classList.remove('active');
    setTimeout(() => {
        const modal = document.getElementById('leadModal');
        if (modal) modal.innerHTML = '';
        isEditMode = false;
        currentLead = null;
    }, 300);
}

// Enable edit mode
function enableEditMode() {
    isEditMode = true;
    renderLeadModal();
}

// Cancel edit
function cancelEdit() {
    isEditMode = false;
    renderLeadModal();
}

// Save lead changes
async function saveLeadChanges() {
    try {
        const notes = document.getElementById('leadNotes')?.value || '';
        
        // Récupérer les données modifiées des champs
        const updatedData = {};
        const editInputs = document.querySelectorAll('.edit-input');
        
        editInputs.forEach(input => {
            const fieldId = input.getAttribute('data-field-id');
            if (!fieldId) return;
            if (input.type === 'checkbox') {
                updatedData[fieldId] = input.checked;
            } else {
                updatedData[fieldId] = input.value;
            }
        });
        
        // Fusionner avec les données existantes
        const currentData = typeof currentLead.response_data === 'string' 
            ? JSON.parse(currentLead.response_data) 
            : (currentLead.response_data || {});
        
        const finalData = { ...currentData, ...updatedData };
        const updatePayload = {
            notes: notes,
            response_data: finalData
        };

        const createdAtInput = document.getElementById('leadCreatedAtInput');
        if (createdAtInput && createdAtInput.value) {
            const parsedDate = new Date(createdAtInput.value);
            if (!Number.isNaN(parsedDate.getTime())) {
                updatePayload.created_at = parsedDate.toISOString();
            }
        }

        const { error } = await supabase
            .from('project_responses')
            .update(updatePayload)
            .eq('id', currentLead.id);

        if (error) throw error;
        
        alert('Modifications enregistrées avec succès!');
        isEditMode = false;
        
        // Reload lead data
        await openLeadModal(currentLead.id, false);
        
        // Refresh parent page
        if (typeof loadAllLeads === 'function') {
            loadAllLeads();
        }
        if (typeof loadLeads === 'function') {
            loadLeads();
        }
        
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        alert('Erreur lors de la sauvegarde: ' + error.message);
    }
}

// Save conseiller comment
async function saveConseillerComment() {
    try {
        const status = document.getElementById('conseillerStatus')?.value || null;
        const comment = document.getElementById('conseillerComment')?.value || '';
        
        if (!status && !comment) {
            alert('Veuillez sélectionner un statut ou ajouter un commentaire.');
            return;
        }
        
        const { error } = await supabase
            .from('project_responses')
            .update({ 
                conseiller_status: status,
                conseiller_comment: comment,
                conseiller_updated_at: new Date().toISOString()
            })
            .eq('id', currentLead.id);
        
        if (error) throw error;
        
        alert('Commentaire enregistré avec succès!');
        isConseillerMode = false;
        
        // Reload lead data
        await openLeadModal(currentLead.id, false, false);
        
        // Refresh parent page
        if (typeof loadProjectLeads === 'function' && typeof currentProjectId !== 'undefined' && currentProjectId) {
            loadProjectLeads(currentProjectId);
        }
        if (typeof loadAllLeads === 'function') {
            loadAllLeads();
        }
        
    } catch (error) {
        console.error('Erreur sauvegarde conseiller:', error);
        alert('Erreur lors de la sauvegarde: ' + error.message);
    }
}

// Upload audio from modal
function uploadAudioFromModal(leadId) {
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
                
                // Reload modal
                await openLeadModal(leadId, true);
                
            } catch (error) {
                console.error('Erreur upload audio:', error);
                alert('Erreur lors de l\'upload: ' + error.message);
            }
        }
    };
    input.click();
}

// Remove audio
async function removeAudio(leadId) {
    if (!confirm('Supprimer le fichier audio?')) return;
    
    try {
        const { error } = await supabase
            .from('project_responses')
            .update({ audio_url: null })
            .eq('id', leadId);
        
        if (error) throw error;
        
        alert('Fichier audio supprimé!');
        
        // Reload modal
        await openLeadModal(leadId, true);
        
    } catch (error) {
        console.error('Erreur suppression audio:', error);
        alert('Erreur: ' + error.message);
    }
}

// Validate lead (admin only)
async function validateLeadFromModal(leadId, status) {
    try {
        const { error } = await supabase
            .from('project_responses')
            .update({ status: status })
            .eq('id', leadId);
        
        if (error) throw error;
        
        alert(`Lead ${status === 'validated' ? 'validé' : 'rejeté'} avec succès!`);
        
        // Close modal and refresh
        closeLeadModal();
        
        if (typeof loadAllLeads === 'function') {
            loadAllLeads();
        }
        
    } catch (error) {
        console.error('Erreur validation:', error);
        alert('Erreur: ' + error.message);
    }
}
