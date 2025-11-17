-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;

-- Désactiver temporairement RLS pour permettre l'accès
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Réactiver RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Politique simple : Tous les utilisateurs authentifiés peuvent lire tous les profils
CREATE POLICY "Authenticated users can view all profiles" ON user_profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Politique : Seuls les utilisateurs authentifiés peuvent insérer (on vérifiera le rôle côté application)
CREATE POLICY "Authenticated users can insert profiles" ON user_profiles
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Politique : Seuls les utilisateurs authentifiés peuvent mettre à jour
CREATE POLICY "Authenticated users can update profiles" ON user_profiles
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Politique : Les utilisateurs peuvent supprimer (optionnel)
CREATE POLICY "Authenticated users can delete profiles" ON user_profiles
    FOR DELETE
    USING (auth.role() = 'authenticated');
