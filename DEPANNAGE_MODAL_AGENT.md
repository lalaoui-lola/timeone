# 🔧 Dépannage - Modal Leads pour Agent

## ❌ Problème : L'agent ne peut pas voir/modifier ses leads

### 🔍 Diagnostic

**1. Vérifier que les fichiers sont chargés**

Ouvrir la console du navigateur (F12) et vérifier :

```javascript
// Vérifier que supabase est défini
console.log('Supabase:', typeof supabase);

// Vérifier que la fonction existe
console.log('openLeadModal:', typeof openLeadModal);

// Vérifier la session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

**2. Vérifier l'ordre de chargement des scripts**

Dans `agent-dashboard.html`, l'ordre DOIT être :
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
<script src="config.js"></script>
<script src="lead-modal.js"></script>
<script src="agent.js"></script>
```

**3. Vérifier les permissions RLS**

```sql
-- Vérifier que l'agent peut lire ses leads
SELECT * FROM project_responses WHERE user_id = '[agent_user_id]';
```

---

## ✅ Solutions

### Solution 1 : Vérifier l'ordre des scripts

**Problème** : `lead-modal.js` chargé avant `config.js`

**Solution** : Vérifier l'ordre dans `agent-dashboard.html`

```html
<!-- CORRECT -->
<script src="supabase-config.js"></script>
<script src="config.js"></script>
<script src="lead-modal.js"></script>
<script src="agent.js"></script>

<!-- INCORRECT -->
<script src="lead-modal.js"></script>
<script src="config.js"></script>
```

### Solution 2 : Vérifier que supabase est initialisé

**Dans `config.js` ou `supabase-config.js`** :

```javascript
const SUPABASE_URL = 'https://[votre-projet].supabase.co';
const SUPABASE_ANON_KEY = '[votre-clé]';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Solution 3 : Vérifier les permissions

**L'agent doit pouvoir lire ses propres leads** :

```sql
-- Policy pour les agents
CREATE POLICY "Agents can view own leads"
ON project_responses FOR SELECT
USING (auth.uid() = user_id);

-- Policy pour les agents (update)
CREATE POLICY "Agents can update own leads"
ON project_responses FOR UPDATE
USING (auth.uid() = user_id);
```

### Solution 4 : Tester avec la page de test

**Utiliser `test-modal.html`** :

1. Ouvrir `test-modal.html` dans le navigateur
2. Se connecter d'abord (si nécessaire)
3. Entrer un ID de lead
4. Cliquer sur "Ouvrir Modal"
5. Vérifier les messages de debug

---

## 🐛 Erreurs courantes

### Erreur 1 : "Supabase non défini"

**Cause** : Scripts chargés dans le mauvais ordre

**Solution** :
```html
<!-- Charger Supabase EN PREMIER -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="config.js"></script>
<script src="lead-modal.js"></script>
```

### Erreur 2 : "Session expirée"

**Cause** : L'utilisateur n'est pas connecté

**Solution** :
```javascript
// Vérifier la session
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
    // Rediriger vers login
    window.location.href = 'index.html';
}
```

### Erreur 3 : "Vous ne pouvez voir que vos propres leads"

**Cause** : L'agent essaie de voir un lead qui ne lui appartient pas

**Solution** : Vérifier que `lead.user_id === session.user.id`

```javascript
// Dans openLeadModal
if (userRole === 'agent' && lead.user_id !== session.user.id) {
    alert('Vous ne pouvez voir que vos propres leads.');
    return;
}
```

### Erreur 4 : "Erreur lors du chargement du lead"

**Cause** : Problème de permissions RLS ou lead inexistant

**Solution** :
```sql
-- Vérifier les policies
SELECT * FROM pg_policies WHERE tablename = 'project_responses';

-- Vérifier que le lead existe
SELECT * FROM project_responses WHERE id = '[lead_id]';
```

---

## 🧪 Tests à effectuer

### Test 1 : Console du navigateur

```javascript
// 1. Vérifier supabase
console.log('Supabase:', supabase);

// 2. Vérifier session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// 3. Vérifier profil
const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();
console.log('Profile:', profile);

// 4. Vérifier leads
const { data: leads } = await supabase
    .from('project_responses')
    .select('*')
    .eq('user_id', session.user.id);
console.log('Leads:', leads);

// 5. Tester ouverture modal
await openLeadModal(leads[0].id, false);
```

### Test 2 : Vérifier les boutons

**Dans agent-dashboard.html** :

```html
<!-- Les boutons doivent appeler openLeadModal -->
<button onclick="openLeadModal('${lead.id}', false)">Voir</button>
<button onclick="openLeadModal('${lead.id}', true)">Modifier</button>
```

### Test 3 : Vérifier le chargement

**Ouvrir la console réseau (F12 → Network)** :

- ✅ `supabase-js@2` chargé
- ✅ `config.js` chargé
- ✅ `lead-modal.js` chargé
- ✅ `lead-modal.css` chargé
- ✅ Pas d'erreurs 404

---

## 📋 Checklist de vérification

### Fichiers
- [ ] `lead-modal.css` existe
- [ ] `lead-modal.js` existe
- [ ] `add_notes_column.sql` exécuté
- [ ] `lead-modal.css` lié dans `agent-dashboard.html`
- [ ] `lead-modal.js` chargé dans `agent-dashboard.html`
- [ ] `<div id="leadModal"></div>` présent dans `agent-dashboard.html`

### Scripts
- [ ] Supabase chargé en premier
- [ ] `config.js` chargé avant `lead-modal.js`
- [ ] `lead-modal.js` chargé avant `agent.js`
- [ ] Pas d'erreurs dans la console

### Permissions
- [ ] Agent peut lire ses leads (RLS)
- [ ] Agent peut modifier ses leads (RLS)
- [ ] Colonne `notes` existe
- [ ] Colonne `audio_url` existe

### Fonctionnalités
- [ ] Bouton "Voir" fonctionne
- [ ] Bouton "Modifier" fonctionne
- [ ] Modal s'ouvre avec animation
- [ ] Informations affichées correctement
- [ ] Mode édition fonctionne
- [ ] Sauvegarde des notes fonctionne

---

## 🚀 Solution rapide

**Si rien ne fonctionne, suivez ces étapes dans l'ordre :**

### Étape 1 : Vider le cache
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Étape 2 : Vérifier la console
```
F12 → Console
Chercher les erreurs en rouge
```

### Étape 3 : Tester avec test-modal.html
```
Ouvrir test-modal.html
Suivre les instructions
Vérifier le debug info
```

### Étape 4 : Vérifier les permissions
```sql
-- Dans Supabase SQL Editor
SELECT * FROM project_responses 
WHERE user_id = auth.uid();
```

### Étape 5 : Recharger les scripts
```html
<!-- Ajouter ?v=2 pour forcer le rechargement -->
<script src="lead-modal.js?v=2"></script>
```

---

## 📞 Support

**Si le problème persiste :**

1. Ouvrir `test-modal.html`
2. Copier le contenu de "Debug Info"
3. Copier les erreurs de la console (F12)
4. Vérifier les policies RLS dans Supabase

**Informations à fournir :**
- Rôle de l'utilisateur (agent/admin)
- Message d'erreur exact
- Contenu de la console
- Output de test-modal.html

---

## ✅ Vérification finale

**Une fois que tout fonctionne :**

✅ Agent peut voir ses leads  
✅ Agent peut modifier ses notes  
✅ Agent peut ajouter/supprimer audio  
✅ Admin peut voir tous les leads  
✅ Admin peut valider/rejeter  
✅ Animations fluides  
✅ Pas d'erreurs console  

**Votre système de modal est maintenant opérationnel ! 🎉✨**
