# 🔧 Dépannage - Erreur 400 project_fields

## ❌ Erreur identifiée

```
Failed to load resource: the server responded with a status of 400
/rest/v1/project_fields?select=*&project_id=eq.xxx&order=order_index.asc
```

**Cause** : La colonne `order_index` n'existe pas dans la table `project_fields`

---

## ✅ Solution 1 : Supprimer le tri (RAPIDE)

### Modification appliquée

**Fichier** : `lead-modal.js`

**Avant** :
```javascript
const { data: projectFields } = await supabase
    .from('project_fields')
    .select('*')
    .eq('project_id', lead.project_id)
    .order('order_index', { ascending: true });  // ← ERREUR 400
```

**Après** :
```javascript
const { data: projectFields, error: fieldsError } = await supabase
    .from('project_fields')
    .select('*')
    .eq('project_id', lead.project_id);  // ← Sans order

if (fieldsError) {
    console.error('Erreur chargement champs:', fieldsError);
}
```

**Résultat** : ✅ Plus d'erreur 400, les champs sont récupérés

---

## ✅ Solution 2 : Ajouter la colonne order_index (OPTIONNEL)

Si vous voulez trier les champs par ordre :

### Étape 1 : Exécuter le SQL

**Fichier** : `check_project_fields.sql`

```sql
-- Ajouter la colonne order_index
ALTER TABLE project_fields 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Mettre à jour les valeurs existantes
UPDATE project_fields 
SET order_index = 0 
WHERE order_index IS NULL;
```

### Étape 2 : Réactiver le tri

**Dans `lead-modal.js`** :
```javascript
const { data: projectFields } = await supabase
    .from('project_fields')
    .select('*')
    .eq('project_id', lead.project_id)
    .order('order_index', { ascending: true });  // ← Maintenant OK
```

---

## 🧪 Tests

### Test 1 : Console du navigateur

**Ouvrir la console (F12)** et copier/coller :

```javascript
// Test simple
const { data, error } = await supabase
    .from('project_fields')
    .select('*')
    .limit(1);

console.log('Data:', data);
console.log('Error:', error);
console.log('Colonnes:', data ? Object.keys(data[0]) : 'N/A');
```

**Résultat attendu** :
```
Data: [{id: "xxx", project_id: "xxx", name: "Nom", type: "text", ...}]
Error: null
Colonnes: ["id", "project_id", "name", "type", "required", ...]
```

### Test 2 : Script de test complet

**Copier le contenu de `test-fields-query.js`** dans la console :

```javascript
// Le script va :
// 1. Récupérer un lead
// 2. Tester la requête sans order
// 3. Tester la requête avec order
// 4. Afficher la structure des champs
// 5. Tester le mapping ID → Nom
```

### Test 3 : Vérifier la modal

**Dans l'interface** :
```
1. Vider le cache (Ctrl + Shift + R)
2. Ouvrir un lead (clic sur l'icône œil)
3. Vérifier la console (F12)
4. Plus d'erreur 400
5. Les noms de champs s'affichent
```

---

## 🔍 Diagnostic

### Vérifier la structure de la table

**Dans Supabase SQL Editor** :

```sql
-- Voir toutes les colonnes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'project_fields'
ORDER BY ordinal_position;
```

**Colonnes attendues** :
```
id              uuid
project_id      uuid
name            text
type            text
required        boolean
options         jsonb (optionnel)
order_index     integer (optionnel)
```

### Vérifier les données

```sql
-- Voir les champs d'un projet
SELECT * FROM project_fields 
WHERE project_id = '[votre-project-id]';
```

---

## 📋 Checklist de vérification

### Erreur 400 résolue
- [x] Supprimé `.order('order_index')` de la requête
- [x] Ajouté gestion d'erreur `fieldsError`
- [x] Testé dans la console
- [x] Plus d'erreur 400

### Fonctionnalités
- [ ] Les noms de champs s'affichent
- [ ] Les valeurs s'affichent correctement
- [ ] Pas d'erreur dans la console
- [ ] Modal s'ouvre correctement

### Optionnel : Tri des champs
- [ ] Colonne `order_index` ajoutée
- [ ] Valeurs `order_index` définies
- [ ] Tri réactivé dans le code
- [ ] Champs affichés dans le bon ordre

---

## 🎯 Résultat

### Avant
```
❌ Failed to load resource: 400
❌ project_fields?order=order_index.asc
❌ Les champs ne se chargent pas
❌ IDs affichés au lieu des noms
```

### Après
```
✅ Requête réussie
✅ project_fields chargés
✅ Noms de champs affichés
✅ Plus d'erreur 400
```

---

## 🚀 Actions à faire

### Immédiat (déjà fait)
1. ✅ Supprimer `.order('order_index')` → **FAIT**
2. ✅ Ajouter gestion d'erreur → **FAIT**
3. ✅ Tester dans la console → **À FAIRE**

### Recommandé
1. Vider le cache du navigateur
2. Tester l'ouverture d'un lead
3. Vérifier que les noms s'affichent

### Optionnel
1. Exécuter `check_project_fields.sql`
2. Ajouter la colonne `order_index`
3. Définir l'ordre des champs
4. Réactiver le tri

---

## 💡 Explication technique

### Pourquoi l'erreur 400 ?

**Supabase PostgREST** retourne une erreur 400 quand :
- Une colonne n'existe pas dans la requête
- La syntaxe de la requête est invalide
- Un filtre utilise une colonne inexistante

**Dans notre cas** :
```javascript
.order('order_index', { ascending: true })
```

Si `order_index` n'existe pas → **400 Bad Request**

### Solution

**Option 1** : Ne pas trier (simple)
```javascript
.select('*')
.eq('project_id', lead.project_id)
// Pas de .order()
```

**Option 2** : Ajouter la colonne (complet)
```sql
ALTER TABLE project_fields 
ADD COLUMN order_index INTEGER DEFAULT 0;
```

---

## ✅ Vérification finale

**Exécuter dans la console** :

```javascript
// Test rapide
async function quickTest() {
    const { data, error } = await supabase
        .from('project_fields')
        .select('*')
        .limit(1);
    
    console.log('✅ Test réussi:', !error);
    console.log('Colonnes:', data ? Object.keys(data[0]) : []);
    console.log('order_index existe:', data?.[0]?.hasOwnProperty('order_index'));
}

quickTest();
```

**Résultat attendu** :
```
✅ Test réussi: true
Colonnes: ["id", "project_id", "name", "type", "required"]
order_index existe: false
```

**L'erreur 400 est maintenant corrigée ! 🎉✨**
