# 🔧 Debug - Admin ne voit pas les leads

## 🎯 Solution rapide

### Étape 1 : Exécuter le SQL de correction

1. Allez sur https://supabase.com
2. Ouvrez votre projet
3. Allez dans **SQL Editor**
4. Exécutez le fichier **`fix_admin_leads_view.sql`**
5. Cliquez sur **Run**

Ce script va :
- ✅ Ajouter la colonne `status` si elle n'existe pas
- ✅ Supprimer toutes les anciennes politiques RLS
- ✅ Créer de nouvelles politiques simplifiées
- ✅ Afficher les politiques créées pour vérification

### Étape 2 : Vérifier dans la console

1. Ouvrez `admin-dashboard.html` en tant qu'admin
2. Allez dans l'onglet "Tous les Leads"
3. Ouvrez la console du navigateur (F12)
4. Regardez les messages :

**Si ça marche :**
```
Session admin: [uuid]
✅ Leads chargés: 5 leads
Données: [array of leads]
```

**Si erreur :**
```
❌ Erreur chargement leads: [message d'erreur]
```

### Étape 3 : Vider le cache

- Appuyez sur `Ctrl + Shift + R` pour forcer le rechargement

---

## 🔍 Diagnostic des problèmes

### Problème 1 : "permission denied for table project_responses"

**Cause** : Les politiques RLS bloquent l'accès

**Solution** :
```sql
-- Exécutez fix_admin_leads_view.sql
-- Puis vérifiez les politiques :
SELECT * FROM pg_policies WHERE tablename = 'project_responses';
```

### Problème 2 : "column status does not exist"

**Cause** : La colonne status n'a pas été ajoutée

**Solution** :
```sql
ALTER TABLE project_responses 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

UPDATE project_responses SET status = 'pending' WHERE status IS NULL;
```

### Problème 3 : "relation user_profiles does not exist"

**Cause** : Problème de jointure

**Solution** : La requête a été simplifiée dans `admin-new.js`

### Problème 4 : Aucun lead affiché mais pas d'erreur

**Causes possibles** :
1. Aucun lead n'a été créé
2. Les politiques RLS bloquent l'accès
3. Le rôle n'est pas 'admin'

**Vérifications** :
```sql
-- 1. Vérifier qu'il y a des leads
SELECT COUNT(*) FROM project_responses;

-- 2. Vérifier votre rôle
SELECT role FROM user_profiles WHERE user_id = auth.uid();

-- 3. Tester la requête directement
SELECT 
    pr.*,
    p.name as project_name,
    up.email as agent_email
FROM project_responses pr
LEFT JOIN projects p ON pr.project_id = p.id
LEFT JOIN user_profiles up ON pr.user_id = up.user_id;
```

---

## 📋 Checklist de vérification

### Base de données
- [ ] Table `project_responses` existe
- [ ] Colonne `status` existe
- [ ] RLS est activé sur `project_responses`
- [ ] Politiques RLS créées (4 politiques)
- [ ] Des leads existent dans la table

### Profil utilisateur
- [ ] Vous êtes connecté en tant qu'admin
- [ ] Votre rôle dans `user_profiles` est 'admin'
- [ ] Votre `user_id` correspond à `auth.uid()`

### Frontend
- [ ] Fichier `admin-new.js` mis à jour
- [ ] Cache du navigateur vidé
- [ ] Console ne montre pas d'erreur JavaScript
- [ ] L'onglet "Tous les Leads" est bien sélectionné

---

## 🔧 Script de vérification SQL

Exécutez ce script pour tout vérifier :

```sql
-- 1. Vérifier la structure de la table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'project_responses';

-- 2. Vérifier les politiques RLS
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'project_responses';

-- 3. Compter les leads
SELECT COUNT(*) as total_leads FROM project_responses;

-- 4. Vérifier votre rôle (remplacez [votre-email] par votre email)
SELECT user_id, role, email
FROM user_profiles
WHERE email = '[votre-email]';

-- 5. Tester la requête complète
SELECT 
    pr.id,
    pr.status,
    pr.created_at,
    p.name as project_name,
    up.email as agent_email
FROM project_responses pr
LEFT JOIN projects p ON pr.project_id = p.id
LEFT JOIN user_profiles up ON pr.user_id = up.user_id
ORDER BY pr.created_at DESC
LIMIT 10;
```

---

## 🎯 Les 4 politiques RLS nécessaires

```sql
-- 1. SELECT: Admin voit tout, agent voit ses leads
CREATE POLICY "select_project_responses" ON project_responses
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- 2. INSERT: Agent et admin peuvent créer
CREATE POLICY "insert_project_responses" ON project_responses
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('agent', 'admin')
        )
    );

-- 3. UPDATE: Admin peut tout modifier, agent ses leads
CREATE POLICY "update_project_responses" ON project_responses
    FOR UPDATE
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- 4. DELETE: Seul l'admin peut supprimer
CREATE POLICY "delete_project_responses" ON project_responses
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );
```

---

## 🚀 Procédure complète de réinitialisation

Si rien ne fonctionne, suivez cette procédure :

### 1. Nettoyer complètement
```sql
-- Supprimer toutes les politiques
DROP POLICY IF EXISTS "select_project_responses" ON project_responses;
DROP POLICY IF EXISTS "insert_project_responses" ON project_responses;
DROP POLICY IF EXISTS "update_project_responses" ON project_responses;
DROP POLICY IF EXISTS "delete_project_responses" ON project_responses;
DROP POLICY IF EXISTS "Agents can view their own leads" ON project_responses;
DROP POLICY IF EXISTS "Agents can create leads" ON project_responses;
DROP POLICY IF EXISTS "Agents can update their own leads" ON project_responses;
DROP POLICY IF EXISTS "Only admins can delete leads" ON project_responses;
```

### 2. Exécuter fix_admin_leads_view.sql

### 3. Vider le cache et recharger

### 4. Tester

---

## 📞 Support

Si le problème persiste :

1. **Vérifiez la console** : Ouvrez F12 et regardez les erreurs
2. **Copiez l'erreur exacte** : Message complet de l'erreur
3. **Vérifiez les logs Supabase** : Dans le dashboard Supabase → Logs

**Message d'erreur à chercher :**
- "permission denied"
- "relation does not exist"
- "column does not exist"
- "policy violation"

---

## ✅ Résultat attendu

Après avoir exécuté `fix_admin_leads_view.sql` :

**Admin Dashboard → Tous les Leads :**
- ✅ Tableau avec 5 colonnes (Projet, Agent, Date, Statut, Actions)
- ✅ Tous les leads de tous les agents visibles
- ✅ Boutons de validation (si status = pending)
- ✅ Console affiche : "✅ Leads chargés: X leads"

**Si vous voyez ça, c'est réussi ! 🎉**
