# 🔑 Documentation API Keys - TimeOne

## Vue d'ensemble

Le système de clés API permet aux administrateurs de créer des clés d'accès sécurisées pour l'intégration externe avec TimeOne. Ces clés permettent d'accéder aux données via des requêtes API sans nécessiter d'authentification utilisateur traditionnelle.

---

## 📋 Fonctionnalités

### 1. **Création de clés API**
- Génération automatique de clés sécurisées (format: `tk_...`)
- Hachage SHA-256 pour stockage sécurisé
- Nom et description personnalisables
- Affichage unique de la clé complète (une seule fois)

### 2. **Gestion des clés**
- Liste de toutes les clés créées
- Activation/Désactivation des clés
- Suppression de clés
- Suivi de la dernière utilisation

### 3. **Sécurité**
- Hash SHA-256 stocké en base de données (pas la clé réelle)
- Préfixe visible uniquement (`tk_abc123...`)
- Révocation instantanée possible
- Accès restreint aux administrateurs

---

## 🚀 Utilisation

### Créer une clé API

1. **Accéder à l'onglet "Clés API"** dans le dashboard admin
2. **Cliquer sur "Créer une clé API"**
3. **Remplir le formulaire :**
   - **Nom** : Un nom descriptif (ex: "Production API", "Mobile App")
   - **Description** : Optionnel, détails sur l'utilisation
4. **Cliquer sur "Créer la clé"**
5. **⚠️ IMPORTANT : Copier la clé immédiatement**
   - La clé complète ne sera affichée qu'une seule fois
   - Une fois la fenêtre fermée, vous ne pourrez plus la récupérer
   - Si vous la perdez, vous devrez créer une nouvelle clé

### Gérer les clés

#### Désactiver une clé
- Cliquez sur l'icône ✗ pour désactiver temporairement
- La clé ne sera plus valide pour les requêtes API
- Peut être réactivée à tout moment

#### Activer une clé
- Cliquez sur l'icône ✓ pour réactiver une clé désactivée

#### Supprimer une clé
- Cliquez sur l'icône poubelle
- Confirmez la suppression
- ⚠️ Action irréversible

---

## 💻 Structure de la base de données

### Table `api_keys`

```sql
- id (UUID) : Identifiant unique
- name (TEXT) : Nom de la clé
- description (TEXT) : Description optionnelle
- key_hash (TEXT) : Hash SHA-256 de la clé
- key_prefix (TEXT) : Préfixe visible (ex: tk_abc123...)
- created_by (UUID) : ID de l'admin créateur
- created_at (TIMESTAMP) : Date de création
- last_used_at (TIMESTAMP) : Dernière utilisation
- is_active (BOOLEAN) : Statut actif/inactif
- metadata (JSONB) : Métadonnées additionnelles
```

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais partager les clés API**
   - Traiter comme un mot de passe
   - Ne pas les inclure dans le code source versioned

2. **Utiliser des noms descriptifs**
   - Facilite l'identification et la révocation si nécessaire

3. **Révoquer les clés non utilisées**
   - Minimiser les risques de sécurité

4. **Surveiller l'utilisation**
   - Vérifier régulièrement la colonne "Dernière utilisation"
   - Désactiver les clés inactives depuis longtemps

5. **Rotation régulière**
   - Créer de nouvelles clés périodiquement
   - Supprimer les anciennes

---

## 🛠️ Utilisation des clés API (pour les développeurs)

### Format de la clé
```
tk_[64 caractères hexadécimaux]
```

### Authentification
Inclure la clé dans le header des requêtes HTTP :

```http
Authorization: Bearer tk_your_api_key_here
```

### Exemple de requête
```javascript
fetch('https://your-api-endpoint.com/api/leads', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer tk_your_api_key_here',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## 📊 Informations affichées

Pour chaque clé API, le tableau affiche :

| Colonne | Description |
|---------|-------------|
| **Nom** | Nom et description de la clé |
| **Clé API** | Préfixe visible (`tk_abc123...`) |
| **Créée le** | Date et heure de création |
| **Dernière utilisation** | Date de la dernière requête ou "Jamais utilisée" |
| **Statut** | Active ✓ ou Inactive ✗ |
| **Actions** | Activer/Désactiver, Supprimer |

---

## ⚠️ Notes importantes

1. **La clé complète n'est affichée qu'une seule fois** lors de la création
2. **Seuls les administrateurs** peuvent créer et gérer les clés API
3. **Les clés désactivées** refusent toutes les requêtes API
4. **La suppression est définitive** - aucune récupération possible
5. **Le hash SHA-256** garantit qu'une clé volée dans la base de données est inutilisable

---

## 🔄 Flux de création

```
Admin Dashboard
    ↓
Clic "Créer une clé API"
    ↓
Formulaire (Nom + Description)
    ↓
Génération clé sécurisée (crypto.getRandomValues)
    ↓
Hash SHA-256 de la clé
    ↓
Stockage en DB (hash uniquement)
    ↓
Affichage de la clé complète (UNE FOIS)
    ↓
Admin copie la clé
    ↓
Fermeture → Clé complète définitivement cachée
```

---

## 📝 Installation

1. **Exécuter le script SQL**
   ```sql
   -- Dans Supabase SQL Editor
   -- Exécuter: sql/create_api_keys_table.sql
   ```

2. **Vérifier les politiques RLS**
   - Seuls les admins ont accès aux clés API
   - Lecture, création, modification, suppression

3. **Tester la création**
   - Se connecter en tant qu'admin
   - Créer une clé de test
   - Vérifier l'affichage dans le tableau

---

## 🐛 Dépannage

### La clé ne s'affiche pas après création
- Vérifier la console JavaScript
- Vérifier que la table `api_keys` existe
- Vérifier les politiques RLS

### Erreur lors de la création
- Vérifier que l'utilisateur est admin
- Vérifier la connexion à Supabase
- Consulter les logs du navigateur

### Les clés ne se chargent pas
- Vérifier le script `api-keys.js` est bien importé
- Vérifier la fonction `loadApiKeys()`
- Vérifier les permissions RLS

---

## 📚 Ressources

- [Supabase Documentation](https://supabase.com/docs)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [SHA-256 Hashing](https://en.wikipedia.org/wiki/SHA-2)

---

**Version:** 1.0.0  
**Dernière mise à jour:** Novembre 2024
