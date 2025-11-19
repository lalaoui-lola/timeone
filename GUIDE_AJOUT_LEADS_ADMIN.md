# Guide : Ajout de Leads par l'Admin

## 📋 Vue d'ensemble

L'administrateur peut maintenant créer des leads directement depuis le dashboard admin et les assigner à des agents spécifiques. Cette fonctionnalité permet une gestion centralisée des leads.

## ✨ Fonctionnalités

### 1. Bouton "Ajouter un lead"
- Situé dans l'onglet "Tous les Leads" du dashboard admin
- Ouvre un modal pour créer un nouveau lead

### 2. Sélection du Projet
- Liste déroulante de tous les projets disponibles
- Chargement automatique des champs du projet sélectionné

### 3. Assignation à un Agent
- Liste déroulante de tous les agents disponibles
- Le lead sera visible dans le dashboard de l'agent sélectionné

### 4. Formulaire Dynamique
- Les champs du formulaire s'affichent automatiquement selon le projet choisi
- Support de tous les types de champs :
  - Texte simple
  - Email
  - Nombre
  - Date / Heure / Date et heure
  - Zone de texte longue
  - Liste déroulante
  - Boutons radio
  - Case à cocher unique
  - Cases à cocher multiples
  - Fichier

## 🎯 Comment utiliser

### Étape 1 : Accéder à l'onglet Leads
1. Connectez-vous au dashboard admin
2. Cliquez sur "Tous les Leads" dans le menu latéral

### Étape 2 : Ouvrir le formulaire
1. Cliquez sur le bouton "Ajouter un lead" en haut de la page
2. Un modal s'ouvre avec le formulaire

### Étape 3 : Remplir le formulaire
1. **Sélectionnez un projet** : Choisissez le projet dans la liste déroulante
2. **Sélectionnez un agent** : Choisissez l'agent qui recevra ce lead
3. **Remplissez les champs** : Les champs du projet s'affichent automatiquement
   - Les champs marqués d'un astérisque (*) sont obligatoires
   - Remplissez toutes les informations du lead

### Étape 4 : Créer le lead
1. Cliquez sur "Créer le lead"
2. Le lead est créé avec le statut "En attente"
3. L'agent assigné peut maintenant voir ce lead dans son dashboard

## 🔧 Détails Techniques

### Structure des données
```javascript
{
  project_id: "uuid-du-projet",
  user_id: "uuid-de-l-agent",
  response_data: {
    "field-id-1": "valeur1",
    "field-id-2": "valeur2",
    // ...
  },
  status: "pending"
}
```

### Fichiers modifiés
- `admin-dashboard.html` : Ajout du bouton et du modal
- `admin-new.js` : Logique de création des leads

### Fonctions principales
- `openAddLeadModal()` : Charge les projets et agents
- `leadProjectSelect.onChange` : Génère les champs dynamiques
- `addLeadForm.onSubmit` : Crée le lead dans la base de données

## 📊 Workflow

```
Admin clique "Ajouter un lead"
    ↓
Chargement des projets et agents
    ↓
Admin sélectionne un projet
    ↓
Champs dynamiques générés
    ↓
Admin sélectionne un agent
    ↓
Admin remplit les champs
    ↓
Soumission du formulaire
    ↓
Lead créé et assigné à l'agent
    ↓
Lead visible dans le dashboard de l'agent
```

## ✅ Avantages

1. **Centralisation** : L'admin peut créer des leads pour n'importe quel projet
2. **Flexibilité** : Assignation libre à n'importe quel agent
3. **Simplicité** : Interface intuitive avec formulaire dynamique
4. **Validation** : Respect des champs obligatoires définis dans le projet
5. **Traçabilité** : Tous les leads sont horodatés et liés à un agent

## 🔒 Permissions

- Seuls les administrateurs peuvent créer des leads via cette interface
- Les agents verront les leads assignés dans leur dashboard
- Les conseillers peuvent valider/rejeter les leads créés par l'admin

## 💡 Cas d'usage

1. **Import manuel de leads** : L'admin peut saisir des leads reçus par téléphone ou email
2. **Distribution de leads** : Répartition équitable des leads entre agents
3. **Tests** : Création de leads de test pour vérifier le système
4. **Correction** : Création d'un lead si un agent a des difficultés techniques

## 🚀 Prochaines améliorations possibles

- Import de leads en masse via CSV
- Assignation automatique selon des règles (round-robin, charge de travail)
- Duplication de leads existants
- Templates de leads pré-remplis
