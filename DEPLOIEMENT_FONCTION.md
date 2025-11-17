# 🚀 Déploiement de la fonction Edge Supabase

## 📋 Étapes pour déployer la fonction

### 1️⃣ Installer Supabase CLI

Ouvrez PowerShell et exécutez :

```powershell
npm install -g supabase
```

### 2️⃣ Se connecter à Supabase

```powershell
supabase login
```

Cela ouvrira votre navigateur pour vous connecter.

### 3️⃣ Lier votre projet

Dans le dossier de votre projet :

```powershell
cd c:\Users\DELL\Desktop\time
supabase link --project-ref hylknkgcvpsizrqmudcm
```

### 4️⃣ Déployer la fonction

```powershell
supabase functions deploy create-user
```

### 5️⃣ Tester la fonction

Une fois déployée, testez depuis votre interface admin en créant un utilisateur.

---

## ✅ C'est tout !

Après le déploiement :
- ✅ L'admin pourra créer des utilisateurs directement depuis l'interface
- ✅ Pas besoin de serveur Node.js
- ✅ Tout est géré par Supabase de manière sécurisée
- ✅ La clé service_role reste protégée côté serveur

---

## 🔍 Vérification

Pour vérifier que la fonction est déployée :
1. Allez sur https://supabase.com
2. Ouvrez votre projet
3. Allez dans **Edge Functions**
4. Vous devriez voir `create-user` dans la liste

---

## 🎯 Utilisation

Maintenant, quand l'admin remplit le formulaire de création d'utilisateur :
1. Le formulaire appelle la fonction Edge `create-user`
2. La fonction utilise la clé service_role (sécurisée)
3. L'utilisateur est créé dans Supabase Auth
4. Le profil est ajouté dans `user_profiles`
5. L'admin reçoit une confirmation

**Aucune clé sensible n'est exposée côté client !** 🔒
