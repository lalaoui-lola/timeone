# 🎯 Guide - Filtres et Audio pour les Leads

## ✨ Nouvelles fonctionnalités ajoutées

### 1. **Système de filtres avancés**
- ✅ **Recherche textuelle** : Cherche dans projet, agent, et données
- ✅ **Filtre par projet** : Liste déroulante de tous les projets
- ✅ **Filtre par agent** : Liste déroulante de tous les agents
- ✅ **Filtre par date** : Sélecteur de date pour un jour spécifique
- ✅ **Boutons d'action** : Appliquer / Effacer les filtres

### 2. **Gestion des fichiers audio**
- ✅ **Upload audio** : Bouton "Ajouter" pour chaque lead
- ✅ **Lecteur audio** : Player intégré avec contrôles
- ✅ **Suppression** : Bouton "✕" pour supprimer l'audio
- ✅ **Stockage Supabase** : Files sauvegardés dans `lead-audios`

---

## 📋 Installation

### Étape 1 : Base de données

Exécutez le fichier SQL `add_audio_column.sql` :

```sql
ALTER TABLE project_responses 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

COMMENT ON COLUMN project_responses.audio_url IS 'URL du fichier audio associé au lead';
```

### Étape 2 : Storage Supabase

1. Allez sur **Supabase Dashboard**
2. Cliquez sur **Storage**
3. Créez un nouveau bucket nommé **`lead-audios`**
4. Configurez les permissions :
   - **Public** : Accès en lecture
   - **Authenticated** : Upload/Update/Delete

### Étape 3 : Politiques RLS (Storage)

```sql
-- Politiques pour le bucket lead-audios
CREATE POLICY "Users can upload audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'lead-audios' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'lead-audios'
);

CREATE POLICY "Users can update audio files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'lead-audios' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete audio files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'lead-audios' AND 
  auth.role() = 'authenticated'
);
```

---

## 🎨 Interface utilisateur

### Section des filtres

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Recherche          │ 📁 Projet     │ 👤 Agent        │  │
│ [texte...]            │ [dropdown]     │ [dropdown]      │  │
│ 📅 Date               │ [Appliquer]    │ [Effacer]       │  │
│ [date picker]         │                │                 │  │
└─────────────────────────────────────────────────────────────┘
```

### Tableau des leads

```
┌──────┬─────────┬─────────────┬─────────┬────────┬─────────┐
│ Projet│ Agent   │ Date        │ Statut  │ Audio  │ Actions │
├──────┼─────────┼─────────────┼─────────┼────────┼─────────┤
│ Lead1│ agent@  │ 05/11/2025  │ ⏳     │ [🎵]   │ ✅❌👁️🗑️ │
│ Lead2│ admin@  │ 05/11/2025  │ ✅     │ [▶️]   │ 👁️🗑️   │
│ Lead3│ agent@  │ 04/11/2025  │ ❌     │ [+🎵]  │ 👁️🗑️   │
└──────┴─────────┴─────────────┴─────────┴────────┴─────────┘
```

---

## 🔧 Fonctionnalités détaillées

### 1. **Recherche textuelle**

Cherche dans :
- ✅ **Nom du projet** : Contient le terme
- ✅ **Email de l'agent** : Contient le terme  
- ✅ **Données du lead** : Toutes les réponses JSON

**Exemple** : "marie" trouve tous les leads avec :
- Projet contenant "marie"
- Agent "marie@domaine.com"
- Réponses contenant "marie"

### 2. **Filtre par projet**

- Charge dynamiquement tous les projets
- Filtre exact sur `project_id`
- Affiche les leads du projet sélectionné

### 3. **Filtre par agent**

- Charge dynamiquement tous les agents
- Filtre exact sur `user_id`
- Affiche les leads de l'agent sélectionné

### 4. **Filtre par date**

- Sélecteur de date moderne
- Filtre sur la journée complète (00:00 à 23:59)
- Format ISO pour la recherche

### 5. **Upload audio**

**Processus :**
1. Clic sur "Ajouter" → Sélecteur de fichiers
2. Sélection fichier audio (mp3, wav, m4a...)
3. Upload vers Supabase Storage
4. URL publique sauvegardée dans `audio_url`
5. Rechargement automatique du tableau

**Nom du fichier :** `{leadId}/{timestamp}-{originalName}`

### 6. **Lecteur audio**

- Contrôles natifs HTML5
- Largeur : 120px, hauteur : 30px
- Style glassmorphism vert
- Bouton suppression rouge

---

## 📊 Workflow complet

### 1. **Admin consulte les leads**

```
1. Admin Dashboard → "Tous les Leads"
2. Filtres automatiquement chargés
3. Tableau avec tous les leads
4. Options de filtrage disponibles
```

### 2. **Admin filtre les leads**

```
1. Choisit un projet dans la liste
2. Sélectionne un agent spécifique
3. Choisit une date
4. Tape un terme de recherche
5. Clique "Appliquer"
6. Résultats filtrés affichés
```

### 3. **Admin ajoute un audio**

```
1. Trouve le lead souhaité
2. Clique "Ajouter" dans colonne Audio
3. Sélectionne fichier audio
4. Fichier uploadé automatiquement
5. Player audio apparaît
```

### 4. **Admin gère l'audio**

```
1. Écoute l'audio avec le player intégré
2. Clique "✕" pour supprimer
3. Confirmation demandée
4. Audio supprimé du storage et de la BDD
```

---

## 🎯 Comportements UX

### Filtres

- **Recherche** : Temps réel sur "Appliquer"
- **Dropdowns** : Options chargées dynamiquement
- **Date** : Picker moderne avec format JJ/MM/AAAA
- **Effacer** : Remet tous les filtres à zéro
- **Appliquer** : Exécute tous les filtres en même temps

### Audio

- **Upload** : Progression indiquée dans la console
- **Player** : Contrôles natifs, style personnalisé
- **Suppression** : Confirmation avant suppression
- **Feedback** : Messages d'alerte pour succès/erreur

### Tableau

- **Responsive** : S'adapte à la taille d'écran
- **Colonnes** : 6 colonnes avec largeur fixe
- **Actions** : Boutons conditionnels selon statut
- **Vide** : Message "Aucun lead trouvé"

---

## 🔧 Configuration technique

### Variables globales

```javascript
// Stockage des données pour les filtres
let projects = [];
let profiles = [];
let allLeads = [];
```

### Fonctions principales

```javascript
// loadFilterOptions() - Charge les options des filtres
// applyFilters() - Applique tous les filtres
// displayFilteredLeads() - Affiche les résultats
// clearFilters() - Réinitialise les filtres
// uploadAudio() - Upload un fichier audio
// removeAudio() - Supprime un fichier audio
```

### URLs Supabase

```javascript
// Storage bucket
const bucketName = 'lead-audios';

// URL publique
const publicUrl = supabase.storage
    .from('lead-audios')
    .getPublicUrl(fileName);
```

---

## 🐛 Résolution de problèmes

### Erreurs communes

**1. "Storage bucket not found"**
- Solution : Créer le bucket `lead-audios` dans Supabase Storage

**2. "Permission denied"**
- Solution : Configurer les politiques RLS pour le storage

**3. "Audio column does not exist"**
- Solution : Exécuter `add_audio_column.sql`

**4. "Filtres ne se chargent pas"**
- Solution : Vérifier que `loadFilterOptions()` est appelée

**5. "Upload ne fonctionne pas"**
- Solution : Vérifier les permissions du bucket storage

### Debug

```javascript
// Console logs pour le débogage
console.log('Leads chargés:', leads);
console.log('Projets:', projects);
console.log('Profiles:', profiles);
console.log('Filtres appliqués:', { searchTerm, projectId, agentId, dateFilter });
```

---

## ✅ Checklist de vérification

### Base de données
- [ ] Colonne `audio_url` ajoutée
- [ ] Bucket `lead-audios` créé
- [ ] Politiques RLS configurées

### Frontend
- [ ] Filtres apparaissent dans l'interface
- [ ] Dropdowns se remplissent
- [ ] Boutons "Appliquer" et "Effacer" fonctionnels
- [ ] Upload audio fonctionne
- [] Player audio s'affiche
- [ ] Suppression audio fonctionne

### Tests
- [ ] Filtrer par projet
- [ ] Filtrer par agent
- [ ] Filtrer par date
- [ ] Rechercher par texte
- [ ] Uploader un fichier audio
- [ ] Écouter l'audio
- [ ] Supprimer l'audio

---

## 🎉 Résultat final

Vous avez maintenant un **système complet de gestion des leads** avec :

✅ **Filtres multi-critères** : Projet, agent, date, recherche
✅ **Upload audio** : Fichiers audio par lead
✅ **Player intégré** : Écoute directe dans le tableau
✅ **Interface moderne** : Design glassmorphism cohérent
✅ **Stockage cloud** : Supabase Storage sécurisé
✅ **UX fluide** : Feedback utilisateur complet

**Votre système de leads est maintenant professionnel et complet ! 🚀✨**
