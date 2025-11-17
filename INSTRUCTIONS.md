# 📋 Instructions de Configuration - Système d'Authentification

## 🎯 Vue d'ensemble

Vous avez maintenant un système d'authentification complet avec 3 rôles :
- **Admin** : Peut créer des utilisateurs et assigner des rôles
- **Agent** : Accès à son tableau de bord personnel
- **Conseiller** : Accès à son tableau de bord personnel

---

## 📝 ÉTAPE 1 : Configuration de Supabase

### 1.1 Accéder à votre projet Supabase
- Allez sur : https://supabase.com
- Connectez-vous à votre compte
- Sélectionnez votre projet (URL: https://hylknkgcvpsizrqmudcm.supabase.co)

### 1.2 Exécuter le script SQL
1. Dans le menu de gauche, cliquez sur **SQL Editor**
2. Cliquez sur **New Query**
3. Copiez TOUT le contenu du fichier `supabase_setup.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)

⚠️ **IMPORTANT** : Le script va créer :
- Une table `roles` avec 3 rôles (agent, admin, conseiller)
- Une table `user_profiles` pour stocker les profils utilisateurs
- Les politiques de sécurité (RLS)

---

## 📝 ÉTAPE 2 : Modifier le script SQL (IMPORTANT!)

Le script SQL actuel utilise `auth.uid()` qui fonctionne avec Supabase Auth. Mais nous devons créer une table `user_profiles` au lieu de `users`. Voici le script SQL CORRIGÉ à utiliser :

```sql
-- Table pour les rôles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Table pour les profils utilisateurs
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les rôles par défaut
INSERT INTO roles (name) VALUES ('agent'), ('admin'), ('conseiller')
ON CONFLICT (name) DO NOTHING;

-- Activer RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Politique : Les admins peuvent tout voir
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Politique : Les admins peuvent insérer des profils
CREATE POLICY "Admins can insert profiles" ON user_profiles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Politique : Les admins peuvent mettre à jour des profils
CREATE POLICY "Admins can update profiles" ON user_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
```

---

## 📝 ÉTAPE 3 : Créer le premier utilisateur Admin

### Option A : Via l'interface Supabase (RECOMMANDÉ)

1. Dans Supabase, allez dans **Authentication** > **Users**
2. Cliquez sur **Add user** > **Create new user**
3. Entrez :
   - Email : `admin@example.com` (ou votre email)
   - Password : `admin123456` (ou votre mot de passe)
4. Cliquez sur **Create user**
5. Copiez l'**User UID** qui apparaît

6. Allez dans **Table Editor** > **user_profiles**
7. Cliquez sur **Insert** > **Insert row**
8. Remplissez :
   - `user_id` : Collez l'UID copié
   - `email` : `admin@example.com`
   - `role` : `admin`
9. Cliquez sur **Save**

### Option B : Via SQL

```sql
-- Remplacez 'VOTRE_USER_ID' par l'ID de l'utilisateur créé dans Authentication
INSERT INTO user_profiles (user_id, email, role)
VALUES ('VOTRE_USER_ID', 'admin@example.com', 'admin');
```

---

## 📝 ÉTAPE 4 : Tester l'application

1. **Ouvrez** `index.html` dans votre navigateur
2. **Connectez-vous** avec :
   - Email : `admin@example.com`
   - Mot de passe : `admin123456`
3. Vous devriez être redirigé vers **admin-dashboard.html**

---

## 📝 ÉTAPE 5 : Créer d'autres utilisateurs

Une fois connecté en tant qu'admin :

1. Sur la page **admin-dashboard.html**, vous verrez un formulaire
2. Remplissez :
   - Email de l'utilisateur
   - Mot de passe
   - Rôle (agent, admin, ou conseiller)
3. Cliquez sur **Créer l'utilisateur**

L'utilisateur sera automatiquement créé dans Supabase Auth ET dans la table user_profiles.

---

## 🗂️ Structure des fichiers

```
time/
├── index.html                    # Page de connexion
├── admin-dashboard.html          # Tableau de bord Admin
├── agent-dashboard.html          # Tableau de bord Agent
├── conseiller-dashboard.html     # Tableau de bord Conseiller
├── supabase-config.js           # Configuration Supabase
├── script.js                    # Logique d'authentification
├── admin-script.js              # Logique admin (création utilisateurs)
├── styles.css                   # Styles CSS
├── supabase_setup.sql           # Script SQL pour Supabase
└── INSTRUCTIONS.md              # Ce fichier
```

---

## 🔐 Informations de connexion Supabase

- **URL** : https://hylknkgcvpsizrqmudcm.supabase.co
- **API Key** : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bGtua2djdnBzaXpycW11ZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjY0MTEsImV4cCI6MjA3Nzg0MjQxMX0.oC7L7wcuzS4WJEfvmwkIz4fwqhQRr99FDDeJsfkfFPs

---

## 🎨 Fonctionnalités

### Page de connexion (index.html)
- ✅ Effet de verre dépoli moderne
- ✅ Animation de dégradé de couleurs
- ✅ Validation en temps réel
- ✅ Authentification Supabase
- ✅ Redirection automatique selon le rôle

### Tableau de bord Admin
- ✅ Création d'utilisateurs
- ✅ Attribution de rôles
- ✅ Liste de tous les utilisateurs
- ✅ Déconnexion

### Tableaux de bord Agent/Conseiller
- ✅ Interface personnalisée
- ✅ Statistiques (exemple)
- ✅ Déconnexion

---

## ⚠️ Dépannage

### Erreur : "relation 'user_profiles' does not exist"
➡️ Vous n'avez pas exécuté le script SQL. Retournez à l'ÉTAPE 1.

### Erreur : "Invalid login credentials"
➡️ Vérifiez que l'utilisateur existe dans Authentication > Users

### Erreur : "Cannot read property 'role' of null"
➡️ L'utilisateur existe dans Auth mais pas dans user_profiles. Ajoutez-le manuellement.

### La page ne redirige pas
➡️ Vérifiez la console du navigateur (F12) pour voir les erreurs

---

## 🚀 Prochaines étapes

1. Personnalisez les tableaux de bord pour chaque rôle
2. Ajoutez des fonctionnalités spécifiques à chaque rôle
3. Améliorez le design selon vos besoins
4. Ajoutez la récupération de mot de passe
5. Ajoutez la modification de profil

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs dans Supabase (Logs > Auth)
3. Assurez-vous que toutes les étapes ont été suivies

---

**Bon développement ! 🎉**
