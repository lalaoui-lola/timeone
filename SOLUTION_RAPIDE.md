# 🚨 SOLUTION RAPIDE - Erreur 404/500

## ⚠️ Le problème

Vous obtenez une erreur 404/500 car :
1. La table `user_profiles` n'existe pas dans Supabase
2. OU l'utilisateur n'a pas de profil dans cette table

---

## ✅ SOLUTION EN 3 ÉTAPES

### ÉTAPE 1 : Exécuter le script SQL dans Supabase

1. Allez sur https://supabase.com
2. Connectez-vous et ouvrez votre projet
3. Dans le menu de gauche, cliquez sur **SQL Editor**
4. Cliquez sur **New Query**
5. Copiez TOUT le contenu du fichier `supabase_setup.sql`
6. Collez-le dans l'éditeur
7. Cliquez sur **Run** (bouton vert en bas à droite)

✅ Vous devriez voir : "Success. No rows returned"

---

### ÉTAPE 2 : Créer votre premier utilisateur admin

#### A. Créer l'utilisateur dans Authentication

1. Dans Supabase, cliquez sur **Authentication** (icône de cadenas dans le menu)
2. Cliquez sur **Users**
3. Cliquez sur **Add user** puis **Create new user**
4. Remplissez :
   - **Email** : `admin@test.com` (ou votre email)
   - **Password** : `admin123456`
   - Cochez **Auto Confirm User**
5. Cliquez sur **Create user**
6. **IMPORTANT** : Copiez le **User UID** qui apparaît (exemple : `b0e0058c-154c-4cc0-94a2-47ab94fd2bf4`)

#### B. Créer le profil dans user_profiles

1. Dans Supabase, cliquez sur **Table Editor** (icône de tableau)
2. Sélectionnez la table **user_profiles**
3. Cliquez sur **Insert** puis **Insert row**
4. Remplissez :
   - **user_id** : Collez l'UID copié à l'étape A.6
   - **email** : `admin@test.com` (le même email)
   - **role** : `admin`
5. Cliquez sur **Save**

---

### ÉTAPE 3 : Tester la connexion

1. Ouvrez `index.html` dans votre navigateur
2. Ouvrez la console (F12)
3. Connectez-vous avec :
   - Email : `admin@test.com`
   - Password : `admin123456`
4. Regardez la console pour voir les logs
5. Vous devriez être redirigé vers `admin-dashboard.html`

---

## 🔍 Vérifications

### Si ça ne marche toujours pas :

#### 1. Vérifier que la table existe
Dans **Table Editor**, vous devez voir :
- ✅ `roles`
- ✅ `user_profiles`

#### 2. Vérifier les données
Dans **Table Editor** > **user_profiles**, vous devez voir une ligne avec :
- Votre `user_id`
- Votre `email`
- Le `role` = `admin`

#### 3. Vérifier les politiques RLS
Dans **Table Editor** > **user_profiles** > **RLS Policies**, vous devez voir :
- ✅ "Users can view own profile"
- ✅ "Admins can view all profiles"
- ✅ "Admins can insert profiles"
- ✅ "Admins can update profiles"

---

## 📝 Script SQL rapide (si besoin)

Si vous voulez tout faire en SQL :

```sql
-- 1. Créer les tables (si pas déjà fait)
-- Copiez le contenu de supabase_setup.sql

-- 2. Ajouter un profil pour un utilisateur existant
-- Remplacez 'VOTRE_USER_ID' par l'ID de votre utilisateur
INSERT INTO user_profiles (user_id, email, role)
VALUES ('b0e0058c-154c-4cc0-94a2-47ab94fd2bf4', 'admin@test.com', 'admin');
```

---

## 🎯 Après la connexion réussie

Une fois connecté en tant qu'admin, vous pourrez créer d'autres utilisateurs directement depuis l'interface web !

---

## ❓ Toujours bloqué ?

Ouvrez la console du navigateur (F12) et envoyez-moi :
1. Les messages dans la console
2. Une capture d'écran de votre table `user_profiles` dans Supabase
