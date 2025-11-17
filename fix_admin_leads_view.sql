-- ================================================
-- FIX: Admin ne peut pas voir les leads
-- ================================================

-- 1. Vérifier que la colonne status existe
ALTER TABLE project_responses 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- 2. Mettre à jour les leads existants
UPDATE project_responses SET status = 'pending' WHERE status IS NULL;

-- 3. Supprimer TOUTES les anciennes politiques sur project_responses
DROP POLICY IF EXISTS "Agents can view their own leads" ON project_responses;
DROP POLICY IF EXISTS "Agents can create leads" ON project_responses;
DROP POLICY IF EXISTS "Agents can update their own leads" ON project_responses;
DROP POLICY IF EXISTS "Only admins can delete leads" ON project_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON project_responses;
DROP POLICY IF EXISTS "Authenticated users can insert responses" ON project_responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON project_responses;
DROP POLICY IF EXISTS "Admins can delete responses" ON project_responses;

-- 4. Créer de nouvelles politiques SIMPLIFIÉES

-- SELECT: Les agents voient leurs leads, les admins voient TOUT
CREATE POLICY "select_project_responses" ON project_responses
    FOR SELECT
    USING (
        -- L'agent voit ses propres leads
        auth.uid() = user_id
        OR
        -- L'admin voit TOUS les leads
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- INSERT: Agents et admins peuvent créer des leads
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

-- UPDATE: Les agents peuvent modifier leurs leads, les admins peuvent modifier TOUS les leads
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

-- DELETE: Seuls les admins peuvent supprimer
CREATE POLICY "delete_project_responses" ON project_responses
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- 5. Vérifier que RLS est activé
ALTER TABLE project_responses ENABLE ROW LEVEL SECURITY;

-- 6. Afficher les politiques créées (pour vérification)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'project_responses';
