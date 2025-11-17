-- Vérifier et corriger les permissions pour les agents
-- Permet aux agents de voir et modifier leurs propres leads

-- 1. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Agents can view own leads" ON project_responses;
DROP POLICY IF EXISTS "Agents can insert own leads" ON project_responses;
DROP POLICY IF EXISTS "Agents can update own leads" ON project_responses;
DROP POLICY IF EXISTS "Agents can delete own leads" ON project_responses;

-- 2. Créer les nouvelles policies pour les agents

-- SELECT: Les agents peuvent voir leurs propres leads
CREATE POLICY "Agents can view own leads"
ON project_responses FOR SELECT
USING (
    auth.uid() = user_id
    OR
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- INSERT: Les agents peuvent créer des leads
CREATE POLICY "Agents can insert own leads"
ON project_responses FOR INSERT
WITH CHECK (
    auth.uid() = user_id
);

-- UPDATE: Les agents peuvent modifier leurs propres leads
CREATE POLICY "Agents can update own leads"
ON project_responses FOR UPDATE
USING (
    auth.uid() = user_id
    OR
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
)
WITH CHECK (
    auth.uid() = user_id
    OR
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- DELETE: Les agents peuvent supprimer leurs propres leads (optionnel)
CREATE POLICY "Agents can delete own leads"
ON project_responses FOR DELETE
USING (
    auth.uid() = user_id
    OR
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- 3. Vérifier que RLS est activé
ALTER TABLE project_responses ENABLE ROW LEVEL SECURITY;

-- 4. Test: Vérifier les policies créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'project_responses'
ORDER BY policyname;
