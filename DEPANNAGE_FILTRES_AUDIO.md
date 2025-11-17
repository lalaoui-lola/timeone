# 🔧 Guide de Dépannage - Filtres et Audio

## ❌ Erreurs identifiées et solutions

### 1. **Erreur : `projects is not defined`**

**Problème :** Les variables `projects` et `profiles` ne sont pas accessibles dans les fonctions de filtrage.

**Solution :** ✅ **CORRIGÉ**
- Variables stockées globalement : `window.projectsData` et `window.profilesData`
- Utilisation dans `applyFilters()` et `displayFilteredLeads()`

**Code corrigé :**
```javascript
// Stockage global
window.projectsData = projectsData;
window.profilesData = profilesData;

// Utilisation dans les filtres
const project = window.projectsData?.find(p => p.id === lead.project_id);
const profile = window.profilesData?.find(p => p.user_id === lead.user_id);
```

### 2. **Erreur : `Bucket not found`**

**Problème :** Le bucket `lead-audios` n'existe pas dans Supabase Storage.

**Solution :** Exécuter `create_audio_bucket.sql`

**Étapes :**
1. Allez sur **Supabase Dashboard** → **SQL Editor**
2. Copiez-collez le contenu de `create_audio_bucket.sql`
3. Exécutez le script
4. Vérifiez dans **Storage** que le bucket `lead-audios` existe

---

## 📋 Instructions complètes

### Étape 1 : Base de données (audio)

```sql
-- Exécuter add_audio_column.sql
ALTER TABLE project_responses 
ADD COLUMN IF NOT EXISTS audio_url TEXT;
```

### Étape 2 : Storage Supabase

```sql
-- Exécuter create_audio_bucket.sql
-- Crée le bucket et les politiques RLS
```

### Étape 3 : Vérification manuelle

**1. Vérifier le bucket :**
- Dashboard → Storage
- Vérifier que `lead-audios` existe
- Public : ✅ activé

**2. Vérifier les politiques :**
- Storage → Policies
- 4 politiques doivent exister :
  - Public Access (SELECT)
  - Users can upload (INSERT)
  - Users can update (UPDATE)
  - Users can delete (DELETE)

**3. Vérifier la colonne :**
- Table Editor → project_responses
- Vérifier que `audio_url` existe

---

## 🔧 Tests de fonctionnement

### Test 1 : Filtres

```javascript
// Ouvrir la console et tester :
console.log('Projects:', window.projectsData);
console.log('Profiles:', window.profilesData);

// Devrait afficher les données chargées
```

### Test 2 : Upload audio

1. Cliquez sur "Ajouter" audio
2. Sélectionnez un fichier MP3/WAV
3. Vérifiez la console pour les erreurs

### Test 3 : Vérifier l'URL

```javascript
// Après upload, vérifiez :
console.log('Audio URL:', lead.audio_url);
// Doit afficher une URL Supabase
```

---

## 🐛 Résolution des problèmes

### Si les filtres ne fonctionnent toujours pas :

**1. Rechargez la page**
- `Ctrl + Shift + R`
- Attendre le chargement complet

**2. Vérifiez la console**
```javascript
// Tapez dans la console :
window.projectsData?.length // Nombre de projets
window.profilesData?.length // Nombre d'agents
```

**3. Rechargez les données manuellement**
```javascript
// Dans la console :
loadAllLeads();
```

### Si l'audio ne s'upload pas :

**1. Vérifiez le bucket**
- Dashboard → Storage → lead-audios
- Doit être public et accessible

**2. Vérifiez les permissions**
```sql
-- Exécutez cette requête pour vérifier :
SELECT * FROM storage.policies WHERE bucket_id = 'lead-audios';
```

**3. Testez l'upload manuellement**
```javascript
// Test avec un petit fichier :
const testFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
```

### Si l'audio ne se lit pas :

**1. Vérifiez l'URL**
- Doit commencer par : `https://[project].supabase.co/storage/v1/object/public/lead-audios/`

**2. Vérifiez le format**
- Formats supportés : MP3, WAV, M4A, OGG, WebM
- Taille maximale : 50MB

---

## 📊 État des corrections

### ✅ Corrections appliquées

1. **Variables globales** : `window.projectsData` et `window.profilesData`
2. **Fonctions de filtrage** : Utilisent les variables globales
3. **Date simplifiée** : `toLocaleDateString('fr-FR')`
4. **Design moderne** : Filtres en ligne avec icônes

### ⏳ Étapes restantes

1. **Exécuter `create_audio_bucket.sql`**
2. **Vérifier le bucket dans Supabase Storage**
3. **Tester l'upload audio**

---

## 🎯 Checklist finale

### Base de données
- [ ] `add_audio_column.sql` exécuté
- [ ] `create_audio_bucket.sql` exécuté
- [ ] Bucket `lead-audios` créé
- [ ] Politiques RLS configurées

### Frontend
- [ ] Filtres chargent sans erreur
- [ ] Recherche fonctionne
- [ ] Filtres par projet/agent/date fonctionnent
- [ ] Upload audio fonctionne
- [ ] Lecture audio fonctionne

### Tests
- [ ] Console sans erreurs
- [ ] `window.projectsData` défini
- [ ] `window.profilesData` défini
- [ ] Bucket storage accessible
- [ ] Fichiers audio uploadés

---

## 🚀 Une fois corrigé

Vos fonctionnalités seront :

✅ **Filtres modernes** : Recherche, projet, agent, date  
✅ **Upload audio** : Fichiers jusqu'à 50MB  
✅ **Lecteur intégré** : Lecture directe dans le tableau  
✅ **Design moderne** : Interface glassmorphism  
✅ **Gestion complète** : Ajouter, écouter, supprimer  

**Le système sera 100% fonctionnel ! 🎉✨**
