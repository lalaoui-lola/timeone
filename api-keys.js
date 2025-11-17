// API Keys Management

// Generate secure API key
function generateApiKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return 'tk_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Open create API key modal
function openCreateApiKeyModal() {
    document.getElementById('apiKeyForm').reset();
    document.getElementById('apiKeyMessage').style.display = 'none';
    document.getElementById('apiKeyModal').classList.add('active');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Handle API key form submission
document.getElementById('apiKeyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const messageDiv = document.getElementById('apiKeyMessage');
    messageDiv.style.display = 'block';
    messageDiv.className = 'message';
    messageDiv.textContent = 'Création de la clé API...';
    
    try {
        const name = document.getElementById('apiKeyName').value;
        const description = document.getElementById('apiKeyDescription').value;
        const apiKey = generateApiKey();
        
        // Hash the API key for storage (only hash is stored in DB)
        const encoder = new TextEncoder();
        const data = encoder.encode(apiKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Save to database
        const { error } = await supabase
            .from('api_keys')
            .insert([{
                name: name,
                description: description,
                key_hash: hashedKey,
                key_prefix: apiKey.substring(0, 10) + '...',
                created_by: user.id,
                is_active: true
            }]);
        
        if (error) throw error;
        
        // Close create modal
        closeModal('apiKeyModal');
        
        // Show the API key to user (only shown once)
        document.getElementById('displayApiKey').value = apiKey;
        document.getElementById('displayApiKeyModal').classList.add('active');
        
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Erreur: ' + error.message;
        console.error('Erreur:', error);
    }
});

// Copy API key to clipboard
async function copyApiKey() {
    const apiKeyInput = document.getElementById('displayApiKey');
    
    try {
        await navigator.clipboard.writeText(apiKeyInput.value);
        
        // Visual feedback
        const button = event.target.closest('button');
        const originalContent = button.innerHTML;
        button.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Copié !
        `;
        button.style.background = 'rgba(16, 185, 129, 0.2)';
        button.style.borderColor = '#10b981';
        
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.style.background = '';
            button.style.borderColor = '';
        }, 2000);
    } catch (error) {
        console.error('Erreur lors de la copie:', error);
        alert('Impossible de copier la clé. Veuillez la copier manuellement.');
    }
}

// Copy API key prefix
async function copyPrefix(prefix) {
    try {
        await navigator.clipboard.writeText(prefix);
        
        // Visual feedback
        const button = event.target.closest('button');
        const originalContent = button.innerHTML;
        button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        button.style.background = 'rgba(16, 185, 129, 0.2)';
        button.style.borderColor = '#10b981';
        
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.style.background = '';
            button.style.borderColor = '';
        }, 1500);
    } catch (error) {
        console.error('Erreur lors de la copie:', error);
        alert('Impossible de copier. Veuillez le copier manuellement.');
    }
}

// Show API usage modal
function showApiUsage(keyName) {
    document.getElementById('apiUsageKeyName').textContent = keyName;
    document.getElementById('apiUsageModal').classList.add('active');
}

// Load API keys
async function loadApiKeys() {
    const { data: apiKeys, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Erreur chargement clés API:', error);
        return;
    }
    
    const tbody = document.getElementById('apiKeysTableBody');
    tbody.innerHTML = '';
    
    if (apiKeys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">Aucune clé API créée</td></tr>';
        return;
    }
    
    apiKeys.forEach(key => {
        const statusBadge = key.is_active
            ? '<span class="role-badge role-admin" style="background: rgba(16, 185, 129, 0.1); border-color: #10b981; color: #10b981;">✓ Active</span>'
            : '<span class="role-badge role-agent" style="background: rgba(239, 68, 68, 0.1); border-color: #ef4444; color: #ef4444;">✗ Inactive</span>';
        
        const lastUsed = key.last_used_at 
            ? new Date(key.last_used_at).toLocaleString('fr-FR')
            : '<span style="color: rgba(255,255,255,0.4); font-style: italic;">Jamais utilisée</span>';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="font-weight: 600;">${key.name}</div>
                ${key.description ? `<div style="color: rgba(255,255,255,0.6); font-size: 0.85rem; margin-top: 0.25rem;">${key.description}</div>` : ''}
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <code style="background: rgba(0,0,0,0.3); padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.85rem; color: #10b981; flex: 1;">
                        ${key.key_prefix}
                    </code>
                    <button class="btn-icon" onclick="copyPrefix('${key.key_prefix}')" title="Copier le préfixe" style="min-width: 32px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
                <div style="color: rgba(255,255,255,0.4); font-size: 0.75rem; margin-top: 0.25rem;">
                    ⚠️ Clé complète non récupérable
                </div>
            </td>
            <td>${new Date(key.created_at).toLocaleString('fr-FR')}</td>
            <td>${lastUsed}</td>
            <td>${statusBadge}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-icon" onclick="showApiUsage('${key.name}')" title="Voir les usages" style="background: rgba(59, 130, 246, 0.1); color: #60a5fa;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="toggleApiKeyStatus('${key.id}', ${!key.is_active})" title="${key.is_active ? 'Désactiver' : 'Activer'}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${key.is_active 
                                ? '<path d="M18 6L6 18"></path><path d="M6 6l12 12"></path>'
                                : '<polyline points="20 6 9 17 4 12"></polyline>'
                            }
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteApiKey('${key.id}', '${key.name}')" title="Supprimer">
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

// Toggle API key status (active/inactive)
async function toggleApiKeyStatus(keyId, newStatus) {
    try {
        const { error } = await supabase
            .from('api_keys')
            .update({ is_active: newStatus })
            .eq('id', keyId);
        
        if (error) throw error;
        
        await loadApiKeys();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la modification du statut: ' + error.message);
    }
}

// Delete API key
async function deleteApiKey(keyId, keyName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la clé "${keyName}" ?\n\nCette action est irréversible.`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('api_keys')
            .delete()
            .eq('id', keyId);
        
        if (error) throw error;
        
        await loadApiKeys();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression: ' + error.message);
    }
}

// Copy code example
async function copyCodeExample() {
    const codeElement = document.getElementById('codeExample');
    
    try {
        await navigator.clipboard.writeText(codeElement.textContent);
        
        // Visual feedback
        const button = event.target;
        const originalContent = button.textContent;
        button.textContent = '✓ Copié !';
        button.style.background = 'rgba(16, 185, 129, 0.3)';
        
        setTimeout(() => {
            button.textContent = originalContent;
            button.style.background = 'rgba(16, 185, 129, 0.2)';
        }, 2000);
    } catch (error) {
        console.error('Erreur lors de la copie:', error);
        alert('Impossible de copier. Veuillez le copier manuellement.');
    }
}

// Initialize when on API tab
document.addEventListener('DOMContentLoaded', () => {
    // Load API keys when API tab is clicked
    const apiNavButton = document.querySelector('[data-tab="api"]');
    if (apiNavButton) {
        apiNavButton.addEventListener('click', () => {
            loadApiKeys();
        });
    }
});
