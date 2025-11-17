# 🔧 Guide - Agent ne peut pas voir/modifier ses leads

## ❌ Problème

L'agent ne peut pas :
- Voir ses leads dans l'onglet "Mes Leads"
- Ouvrir la modal pour voir les détails
- Modifier ses leads

---

## ✅ Solutions appliquées

### 1. Chargement automatique des leads

**Problème** : `loadLeads()` n'était jamais appelé

**Solution dans `agent.js`** :

```javascript
// Initialisation
async function init() {
    await checkAuth();
    await loadProjects();
    await loadLeads(); // ← Ajouté
}

init();
```

**Résultat** : Les leads se chargent au démarrage

### 2. Chargement lors du clic sur l'onglet

**Problème** : Les leads ne se rafraîchissent pas

**Solution dans `agent.js`** :

```javascript
// Navigation entre les onglets
document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        
        // Charger les leads quand on clique sur l'onglet
        if (tab === 'leads') {
            loadLeads(); // ← Ajouté
        }
        // ...
    });
});
```

**Résultat** : Les leads se rafraîchissent à chaque clic

### 3. Permissions RLS corrigées

**Fichier** : `fix_agent_permissions.sql`

```sql
-- Les agents peuvent voir leurs propres leads
CREATE POLICY "Agents can view own leads"
ON project_responses FOR SELECT
USING (auth.uid() = user_id OR role = 'admin');

-- Les agents peuvent modifier leurs propres leads
CREATE POLICY "Agents can update own leads"
ON project_responses FOR UPDATE
USING (auth.uid() = user_id OR role = 'admin');
```

**Résultat** : Permissions correctes pour les agents

---

## 🧪 Tests

### Test 1 : Page de test complète

**Ouvrir** : `test-agent-leads.html`

**Tests disponibles** :
1. ✅ Vérification de la session
2. ✅ Chargement des leads
3. ✅ Test de la modal
4. ✅ Test des permissions RLS
5. ✅ Test complet

**Utilisation** :
```
1. Ouvrir test-agent-leads.html dans le navigateur
2. Se connecter en tant qu'agent
3. Cliquer sur "Exécuter tous les tests"
4. Vérifier les résultats
```

### Test 2 : Console du navigateur

**Ouvrir la console (F12)** sur `agent-dashboard.html` :

```javascript
// 1. Vérifier la session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('User ID:', session?.user.id);

// 2. Tester le chargement des leads
const { data: leads, error } = await supabase
    .from('project_responses')
    .select('*, projects(name)')
    .eq('user_id', session.user.id);

console.log('Leads:', leads);
console.log('Error:', error);

// 3. Tester l'ouverture de la modal
if (leads && leads.length > 0) {
    await openLeadModal(leads[0].id, false);
}
```

### Test 3 : Vérifier les permissions

**Dans Supabase SQL Editor** :

```sql
-- Vérifier les policies
SELECT * FROM pg_policies 
WHERE tablename = 'project_responses';

-- Tester en tant qu'agent
SELECT * FROM project_responses 
WHERE user_id = auth.uid();
```

---

## 📋 Checklist de vérification

### Fichiers modifiés
- [x] `agent.js` - Ajout de `loadLeads()` à l'initialisation
- [x] `agent.js` - Chargement des leads au clic sur l'onglet
- [x] `fix_agent_permissions.sql` - Permissions RLS corrigées

### Fichiers créés
- [x] `test-agent-leads.html` - Page de test complète
- [x] `GUIDE_AGENT_LEADS.md` - Ce guide

### Base de données
- [ ] Exécuter `fix_agent_permissions.sql` dans Supabase
- [ ] Vérifier que RLS est activé sur `project_responses`
- [ ] Tester les permissions avec un agent

### Interface
- [ ] Vider le cache (Ctrl + Shift + R)
- [ ] Se connecter en tant qu'agent
- [ ] Vérifier que les leads s'affichent
- [ ] Tester l'ouverture de la modal
- [ ] Tester la modification

---

## 🔍 Diagnostic

### Si les leads ne s'affichent pas

**1. Vérifier la console (F12)**
```javascript
// Chercher les erreurs
console.log('Current User:', currentUser);
console.log('Leads loaded:', document.getElementById('leadsTableBody').innerHTML);
```

**2. Vérifier que l'agent a des leads**
```sql
SELECT * FROM project_responses 
WHERE user_id = '[agent_user_id]';
```

**3. Vérifier les permissions RLS**
```sql
-- Doit retourner des policies
SELECT * FROM pg_policies 
WHERE tablename = 'project_responses';
```

### Si la modal ne s'ouvre pas

**1. Vérifier que lead-modal.js est chargé**
```javascript
console.log('openLeadModal:', typeof openLeadModal);
// Doit afficher: "function"
```

**2. Vérifier l'ordre des scripts**
```html
<script src="supabase-config.js"></script>
<script src="lead-modal.js"></script>
<script src="agent.js"></script>
```

**3. Vérifier les erreurs dans la console**
```
F12 → Console → Chercher les erreurs en rouge
```

### Si les modifications ne se sauvegardent pas

**1. Vérifier les permissions UPDATE**
```sql
-- Tester en tant qu'agent
UPDATE project_responses 
SET notes = 'Test' 
WHERE id = '[lead_id]' AND user_id = auth.uid();
```

**2. Vérifier la fonction saveLeadChanges**
```javascript
// Dans la console
console.log('saveLeadChanges:', typeof saveLeadChanges);
```

---

## 🚀 Étapes de résolution

### Étape 1 : Exécuter le SQL (OBLIGATOIRE)

```sql
-- Dans Supabase SQL Editor
-- Copier/coller le contenu de fix_agent_permissions.sql
-- Cliquer sur "Run"
```

### Étape 2 : Vider le cache

```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### Étape 3 : Tester avec test-agent-leads.html

```
1. Ouvrir test-agent-leads.html
2. Se connecter en tant qu'agent
3. Exécuter tous les tests
4. Vérifier les résultats
```

### Étape 4 : Tester dans l'interface

```
1. Ouvrir agent-dashboard.html
2. Cliquer sur "Mes Leads"
3. Vérifier que les leads s'affichent
4. Cliquer sur l'icône œil
5. Vérifier que la modal s'ouvre
```

### Étape 5 : Tester la modification

```
1. Ouvrir un lead en mode édition (icône crayon)
2. Modifier les notes
3. Cliquer sur "Enregistrer"
4. Vérifier que les modifications sont sauvegardées
```

---

## 📊 Structure des données

### Table project_responses

```sql
CREATE TABLE project_responses (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    user_id UUID REFERENCES auth.users(id),
    response_data JSONB,
    notes TEXT,
    audio_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Permissions RLS

```sql
-- SELECT: Agent voit ses leads
auth.uid() = user_id

-- UPDATE: Agent modifie ses leads
auth.uid() = user_id

-- Admin voit/modifie tout
role = 'admin'
```

---

## ✅ Résultat attendu

### Avant
```
❌ Onglet "Mes Leads" vide
❌ Aucun lead affiché
❌ Modal ne s'ouvre pas
❌ Impossible de modifier
```

### Après
```
✅ Leads affichés dans l'onglet
✅ Nombre de leads visible
✅ Modal s'ouvre au clic
✅ Modification possible
✅ Sauvegarde fonctionne
```

---

## 💡 Points importants

### 1. Ordre de chargement

```javascript
// CORRECT
async function init() {
    await checkAuth();      // 1. Vérifier l'auth
    await loadProjects();   // 2. Charger les projets
    await loadLeads();      // 3. Charger les leads
}
```

### 2. Permissions RLS

```sql
-- L'agent DOIT être propriétaire du lead
auth.uid() = user_id
```

### 3. Scripts

```html
<!-- ORDRE IMPORTANT -->
<script src="supabase-config.js"></script>  <!-- 1 -->
<script src="lead-modal.js"></script>       <!-- 2 -->
<script src="agent.js"></script>            <!-- 3 -->
```

---

## 🎉 Vérification finale

**Tout fonctionne si** :

✅ Les leads s'affichent dans l'onglet "Mes Leads"  
✅ Le nombre de leads est correct  
✅ La modal s'ouvre au clic sur l'icône œil  
✅ Les informations du lead s'affichent  
✅ Les noms de champs (pas les IDs) s'affichent  
✅ Le mode édition fonctionne (icône crayon)  
✅ Les modifications se sauvegardent  
✅ Pas d'erreur dans la console  

**Votre système est maintenant opérationnel ! 🎉✨**
