# 🔧 Configuration Supabase pour la création d'utilisateurs

## ⚠️ Problème résolu

L'erreur CORS que vous rencontriez était due à l'appel d'une fonction Edge non déployée. 
J'ai modifié le code pour utiliser `signUp` directement, ce qui fonctionne sans serveur.

---

## 📋 Étapes de configuration

### 1️⃣ Désactiver la confirmation par email (Recommandé pour le développement)

Pour que l'admin puisse créer des utilisateurs sans qu'ils aient à confirmer leur email :

1. Allez sur https://supabase.com
2. Ouvrez votre projet **hylknkgcvpsizrqmudcm**
3. Dans le menu de gauche, cliquez sur **Authentication**
4. Cliquez sur **Providers**
5. Cliquez sur **Email**
6. Désactivez l'option **"Confirm email"**
7. Cliquez sur **Save**

### 2️⃣ Vérifier les politiques RLS

Assurez-vous que les politiques RLS permettent l'insertion dans `user_profiles` :

```sql
-- Vérifier que cette politique existe
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

Si vous avez des erreurs, exécutez le fichier `fix_policies.sql` dans l'éditeur SQL de Supabase.

---

## ✅ Comment ça fonctionne maintenant

### Création d'utilisateur par l'admin

1. L'admin remplit le formulaire (email, mot de passe, rôle)
2. Le système appelle `supabase.auth.signUp()` pour créer l'utilisateur
3. Le profil est automatiquement ajouté dans `user_profiles` avec le rôle
4. L'utilisateur peut se connecter immédiatement (si confirmation email désactivée)

### Avantages

✅ **Pas de serveur nécessaire** - Tout fonctionne côté client
✅ **Pas de problème CORS** - Utilise l'API Supabase directe
✅ **Simple à maintenir** - Pas de fonction Edge à déployer
✅ **Sécurisé** - Les politiques RLS protègent les données

### Limitations

⚠️ **Confirmation email** - Si activée, l'utilisateur doit confirmer son email avant de se connecter
⚠️ **Rate limiting** - Supabase limite le nombre de signUp par heure (pour éviter les abus)

---

## 🔐 Pour la production

Si vous voulez plus de contrôle en production, vous pouvez :

### Option 1 : Garder cette approche simple
- Activez la confirmation par email
- Les utilisateurs recevront un email de confirmation
- Ils pourront se connecter après confirmation

### Option 2 : Utiliser une fonction Edge (avancé)
- Nécessite d'installer Supabase CLI
- Permet de créer des utilisateurs sans confirmation email
- Plus de contrôle mais plus complexe

---

## 🧪 Test de la création d'utilisateur

1. Connectez-vous en tant qu'admin
2. Allez sur le dashboard admin
3. Remplissez le formulaire de création d'utilisateur :
   - **Email** : test@example.com
   - **Mot de passe** : Test123456
   - **Rôle** : agent (ou conseiller)
4. Cliquez sur "Créer l'utilisateur"
5. Vous devriez voir : "Utilisateur créé avec succès!"

### Vérification

Pour vérifier que l'utilisateur a été créé :

1. Allez sur https://supabase.com
2. Ouvrez votre projet
3. Allez dans **Authentication** > **Users**
4. Vous devriez voir le nouvel utilisateur
5. Allez dans **Table Editor** > **user_profiles**
6. Vous devriez voir le profil avec le rôle

---

## 🐛 Dépannage

### Erreur : "User already registered"
- L'email existe déjà dans Supabase
- Utilisez un autre email ou supprimez l'utilisateur existant

### Erreur : "Invalid email"
- Le format de l'email est incorrect
- Vérifiez que l'email contient @ et un domaine

### Erreur : "Password should be at least 6 characters"
- Le mot de passe est trop court
- Utilisez au moins 6 caractères

### Erreur lors de l'ajout du profil
- Vérifiez que les politiques RLS sont correctes
- Exécutez `fix_policies.sql`

---

## 📝 Résumé

**Avant** : Tentative d'utiliser une fonction Edge → Erreur CORS
**Maintenant** : Utilisation de `signUp` directement → ✅ Fonctionne

**Action requise** : Désactivez la confirmation par email dans les paramètres Supabase pour que les utilisateurs puissent se connecter immédiatement après leur création.

---

**Votre système de création d'utilisateurs est maintenant opérationnel ! 🎉**
