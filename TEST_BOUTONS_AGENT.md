# 🔧 Test des boutons Agent

## 🎯 Problème

Les boutons "Voir" et "Modifier" ne font rien quand on clique dessus.

---

## 🧪 Test rapide

### 1. Page de debug

**Ouvrir** : `debug-agent-buttons.html`

**Tests** :
1. ✅ "Vérifier les fonctions" - Vérifie que `openLeadModal` existe
2. ✅ "Charger des leads test" - Affiche vos leads avec des boutons
3. ✅ Boutons "Voir" et "Modifier" - Test direct

### 2. Console du navigateur

**Ouvrir `agent-dashboard.html`** → **Console (F12)** :

```javascript
// 1. Vérifier que la fonction existe
console.log('openLeadModal:', typeof openLeadModal);
// Doit afficher: "function"

// 2. Vérifier les variables
console.log('currentUser:', currentUser);
// Doit afficher l'objet user

// 3. Vérifier les leads
console.log('Leads dans le tableau:', document.querySelectorAll('#leadsTableBody tr').length);
```

### 3. Test direct

**Dans la console (F12)** :

```javascript
// Si vous avez des leads, tester avec le premier ID
const firstLeadId = document.querySelector('#leadsTableBody tr button[onclick*="openLeadModal"]')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];

if (firstLeadId) {
    console.log('Test avec lead ID:', firstLeadId);
    openLeadModal(firstLeadId, false); // Test lecture
}
```

---

## 🔍 Diagnostic

### Si `openLeadModal` n'est pas définie

**Cause** : `lead-modal.js` n'est pas chargé

**Solution** : Vérifier l'ordre des scripts dans `agent-dashboard.html` :

```html
<!-- ORDRE CORRECT -->
<script src="supabase-config.js"></script>
<script src="lead-modal.js"></script>
<script src="agent.js"></script>
```

### Si `currentUser` n'est pas défini

**Cause** : `checkAuth()` n'a pas été appelé

**Solution** : Vérifier que `init()` est appelé :

```javascript
// Dans agent.js
async function init() {
    await checkAuth();
    await loadProjects();
    await loadLeads();
}

init(); // Doit être à la fin du fichier
```

### Si les leads ne s'affichent pas

**Cause** : `loadLeads()` n'est pas appelé

**Solution** : Vérifier qu'il y a des leads :

```javascript
// Dans la console
const { data: leads } = await supabase
    .from('project_responses')
    .select('*')
    .eq('user_id', currentUser.id);

console.log('Leads trouvés:', leads.length);
```

---

## ✅ Solutions

### 1. Vider le cache

```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### 2. Vérifier les erreurs

**Console (F12)** → Chercher les erreurs en rouge :

```
- "openLeadModal is not defined"
- "Cannot read property of undefined"
- "404 Not Found" (pour lead-modal.js)
```

### 3. Tester avec debug-agent-buttons.html

**Étapes** :
1. Ouvrir `debug-agent-buttons.html`
2. Cliquer sur "Vérifier les fonctions"
3. Si tout est vert ✅ → Les fonctions sont OK
4. Cliquer sur "Charger des leads test"
5. Tester les boutons "Voir" et "Modifier"

### 4. Corriger si nécessaire

**Si `openLeadModal` non définie** :
```html
<!-- Ajouter dans agent-dashboard.html -->
<script src="lead-modal.js"></script>
```

**Si les leads ne se chargent pas** :
```javascript
// Dans agent.js, à la fin du fichier
window.addEventListener('DOMContentLoaded', () => {
    init();
});
```

---

## 📋 Checklist

### Vérifications
- [ ] `lead-modal.js` est chargé dans `agent-dashboard.html`
- [ ] `openLeadModal` est définie (console)
- [ ] `currentUser` est défini (console)
- [ ] Les leads s'affichent dans le tableau
- [ ] Les boutons ont les bons `onclick`

### Tests
- [ ] `debug-agent-buttons.html` fonctionne
- [ ] "Vérifier les fonctions" → tout vert ✅
- [ ] "Charger des leads test" → leads affichés
- [ ] Boutons "Voir" et "Modifier" → modal s'ouvre

### Résultat final
- [ ] Clic sur œil → modal en lecture
- [ ] Clic sur crayon → modal en édition
- [ ] Noms des champs affichés
- [ ] Modifications possibles

---

## 🚀 Test final

**1. Ouvrir `debug-agent-buttons.html`**
```
http://localhost:5500/debug-agent-buttons.html
```

**2. Cliquer sur "Vérifier les fonctions"**
```
✅ openLeadModal: défini
✅ currentUser: défini
✅ loadLeads: défini
```

**3. Cliquer sur "Charger des leads test"**
```
✅ Leads trouvés et affichés
```

**4. Cliquer sur "Voir" ou "Modifier"**
```
✅ Modal s'ouvre
✅ Informations affichées
```

**5. Si tout fonctionne → tester dans agent-dashboard.html**

---

## 💡 Si ça ne fonctionne toujours pas

**1. Vérifier la console** :
```
F12 → Console → Chercher les erreurs rouges
```

**2. Vérifier les fichiers** :
```
- lead-modal.js existe ?
- supabase-config.js existe ?
- Scripts dans le bon ordre ?
```

**3. Vérifier la connexion** :
```
- Vous êtes bien connecté en tant qu'agent ?
- La session est active ?
```

**4. Réinstaller les scripts** :
```html
<!-- Dans agent-dashboard.html, à la fin du body -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
<script src="lead-modal.js"></script>
<script src="agent.js"></script>
```

---

## ✨ Résultat attendu

**Quand tout fonctionne** :
```
✅ Bouton œil → Modal s'ouvre en lecture
✅ Bouton crayon → Modal s'ouvre en édition
✅ Noms des champs affichés (pas les IDs)
✅ Notes modifiables
✅ Audio gérable
✅ Sauvegarde fonctionne
```

**Testez maintenant avec `debug-agent-buttons.html` ! 🎉✨**
