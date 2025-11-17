# 🚀 Guide Complet - Système de Leads

## ✨ Nouvelles fonctionnalités

### 1. **Types de champs étendus**
- ✅ **Heure** : Sélecteur d'heure
- ✅ **Date et heure** : Sélecteur combiné
- ✅ **Boutons radio** : Choix unique parmi plusieurs options
- ✅ **Cases à cocher multiples** : Sélection multiple
- ✅ **Options configurables** : Pour select, radio et checkboxes

### 2. **Dashboard Agent**
- ✅ **Style dark glassmorphism** identique à l'admin
- ✅ **Vue des projets** : Liste des formulaires disponibles
- ✅ **Ajout de leads** : Formulaires dynamiques
- ✅ **Mes leads** : Voir uniquement ses propres leads
- ✅ **Badge bleu** : Distinction visuelle agent/admin

### 3. **Dashboard Admin - Leads**
- ✅ **Nouvel onglet "Tous les Leads"**
- ✅ **Vue globale** : Voir tous les leads de tous les agents
- ✅ **Informations** : Projet, Agent, Date de création
- ✅ **Actions** : Voir détails, Supprimer
- ✅ **Recherche** : Filtrer les leads

### 4. **Permissions RLS**
- ✅ **Agents** : Voient uniquement leurs leads
- ✅ **Admins** : Voient tous les leads
- ✅ **Création** : Agents et admins peuvent créer
- ✅ **Suppression** : Seuls les admins peuvent supprimer

---

## 📋 Installation

### Étape 1 : Mettre à jour la base de données

1. Allez sur https://supabase.com
2. Ouvrez votre projet
3. Allez dans **SQL Editor**
4. Exécutez d'abord `projects_setup.sql` (si pas déjà fait)
5. Exécutez ensuite `leads_permissions.sql`
6. Cliquez sur **Run** pour chaque script

### Étape 2 : Tester le système

**En tant qu'Admin :**
1. Ouvrez `admin-dashboard.html`
2. Créez un projet avec des champs variés (texte, heure, checkboxes, etc.)
3. Allez dans l'onglet "Tous les Leads" pour voir tous les leads

**En tant qu'Agent :**
1. Ouvrez `agent-dashboard.html`
2. Cliquez sur un projet
3. Remplissez le formulaire
4. Le lead est ajouté avec la date de création automatique

---

## 🎯 Types de champs disponibles

| Type | Description | Options | Exemple |
|------|-------------|---------|---------|
| **Texte** | Champ texte court | Non | Nom, prénom |
| **Email** | Validation email | Non | Email de contact |
| **Nombre** | Chiffres uniquement | Non | Âge, quantité |
| **Date** | Sélecteur de date | Non | Date de naissance |
| **Heure** | Sélecteur d'heure | Non | Heure de RDV |
| **Date et heure** | Sélecteur combiné | Non | Date/heure de RDV |
| **Texte long** | Zone de texte | Non | Message, commentaire |
| **Liste déroulante** | Menu déroulant | **Oui** | Sélection produit |
| **Boutons radio** | Choix unique | **Oui** | Oui/Non, Choix |
| **Case à cocher unique** | Oui/Non | Non | Accepter CGU |
| **Cases à cocher multiples** | Sélection multiple | **Oui** | Intérêts multiples |
| **Fichier** | Upload de fichier | Non | CV, photo |

---

## 💡 Utilisation

### Créer un projet avec options

1. **Admin** → Onglet "Projets" → "Nouveau projet"
2. Ajoutez un champ de type "Cases à cocher multiples"
3. Dans la zone "Options", entrez (une par ligne) :
   ```
   Marketing digital
   Réseaux sociaux
   SEO
   Publicité en ligne
   ```
4. Créez le projet

### Agent : Ajouter un lead

1. **Agent** → Onglet "Projets"
2. Cliquez sur "Ajouter un lead" sur un projet
3. Remplissez le formulaire dynamique
4. Les champs s'adaptent automatiquement au type :
   - **Select** : Menu déroulant avec les options
   - **Radio** : Boutons radio avec les options
   - **Checkboxes** : Cases à cocher multiples
   - **Heure** : Sélecteur d'heure (HH:MM)
   - **Date et heure** : Sélecteur combiné
5. Cliquez sur "Ajouter le lead"
6. **Date de création automatique** enregistrée

### Admin : Voir tous les leads

1. **Admin** → Onglet "Tous les Leads"
2. Vue en tableau avec :
   - Nom du projet
   - Email de l'agent
   - Date de création (format français)
   - Actions (Voir, Supprimer)
3. Cliquez sur l'œil pour voir les détails complets
4. Recherchez avec la barre de recherche

---

## 🔐 Permissions

### Ce que peut faire un **Agent** :
- ✅ Voir tous les projets
- ✅ Créer des leads sur n'importe quel projet
- ✅ Voir **uniquement ses propres leads**
- ❌ Ne peut pas voir les leads des autres agents
- ❌ Ne peut pas supprimer de leads

### Ce que peut faire un **Admin** :
- ✅ Tout ce que peut faire un agent
- ✅ Voir **tous les leads de tous les agents**
- ✅ Supprimer n'importe quel lead
- ✅ Créer/modifier/supprimer des projets
- ✅ Créer/modifier/supprimer des utilisateurs

---

## 🎨 Style et Design

### Dashboard Agent
- **Badge bleu** : `rgba(59, 130, 246, 0.1)`
- **Avatar bleu** : Dégradé bleu au lieu de rose
- **Même style dark** que l'admin
- **Cartes projet** : Bouton "Ajouter un lead" en pleine largeur

### Formulaires dynamiques
- **Champs visibles** : Fond clair, bordures colorées
- **Select stylisé** : Flèche personnalisée
- **Radio/Checkbox** : Accent color primaire
- **Labels clairs** : Nom du champ + astérisque si obligatoire

---

## 📊 Structure des données

### Table `project_fields`
```sql
- id: UUID
- project_id: UUID
- name: VARCHAR (nom du champ)
- type: VARCHAR (text, email, select, radio, checkboxes, etc.)
- required: BOOLEAN
- options: TEXT[] (pour select, radio, checkboxes)
- order: INTEGER
```

### Table `project_responses` (Leads)
```sql
- id: UUID
- project_id: UUID (référence au projet)
- user_id: UUID (référence à l'agent)
- response_data: JSONB (données du formulaire)
- created_at: TIMESTAMP (date de création automatique)
```

### Exemple de `response_data`
```json
{
  "field_uuid_1": "Jean Dupont",
  "field_uuid_2": "jean@example.com",
  "field_uuid_3": "14:30",
  "field_uuid_4": ["Marketing digital", "SEO"],
  "field_uuid_5": true
}
```

---

## 🔧 Fichiers créés/modifiés

### Nouveaux fichiers
- `agent-dashboard.html` : Dashboard agent moderne
- `agent.js` : Logique agent (projets + leads)
- `leads_permissions.sql` : Permissions RLS pour les leads

### Fichiers modifiés
- `admin-dashboard.html` : Ajout onglet "Tous les Leads"
- `admin-new.js` : Fonctions pour gérer tous les leads
- `admin-new.js` : Types de champs étendus + options
- `projects_setup.sql` : Ajout colonne `options`

---

## 🚀 Workflow complet

### 1. Admin crée un projet
```
Admin Dashboard → Projets → Nouveau projet
- Nom: "Formulaire de contact commercial"
- Champs:
  * Nom (texte, obligatoire)
  * Email (email, obligatoire)
  * Téléphone (texte, obligatoire)
  * Heure de contact préférée (heure, optionnel)
  * Intérêts (checkboxes multiples, options: Web, Mobile, Cloud)
  * Budget (select, options: <5K, 5-10K, >10K)
```

### 2. Agent ajoute un lead
```
Agent Dashboard → Projets → Cliquer sur le projet
- Formulaire dynamique s'ouvre
- Remplir tous les champs
- Soumettre
- Lead créé avec date automatique
```

### 3. Agent consulte ses leads
```
Agent Dashboard → Mes Leads
- Voir uniquement ses leads
- Rechercher par nom/projet
- Voir les détails
```

### 4. Admin consulte tous les leads
```
Admin Dashboard → Tous les Leads
- Voir leads de tous les agents
- Filtrer par agent/projet/date
- Voir détails complets
- Supprimer si nécessaire
```

---

## ✅ Checklist de vérification

- [ ] SQL exécuté (`projects_setup.sql` + `leads_permissions.sql`)
- [ ] Admin peut créer des projets avec options
- [ ] Agent voit tous les projets
- [ ] Agent peut ajouter des leads
- [ ] Agent voit uniquement ses leads
- [ ] Admin voit tous les leads
- [ ] Date de création automatique sur les leads
- [ ] Champs avec options fonctionnent (select, radio, checkboxes)
- [ ] Type heure et date-heure fonctionnent
- [ ] Recherche fonctionne dans les deux dashboards

---

## 🎉 Résultat final

Vous avez maintenant un **système complet de gestion de leads** avec :

✅ **Formulaires dynamiques** créés par l'admin
✅ **12 types de champs** différents
✅ **Options configurables** pour select, radio, checkboxes
✅ **Dashboard agent** moderne et intuitif
✅ **Permissions RLS** sécurisées
✅ **Date de création automatique**
✅ **Vue admin globale** de tous les leads
✅ **Style dark glassmorphism** cohérent

**Votre système est prêt à être utilisé en production ! 🚀✨**
