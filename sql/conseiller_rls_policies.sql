-- ================================================
-- Politiques RLS pour le rôle CONSEILLER
-- ================================================
-- À exécuter dans Supabase SQL Editor
-- Ces politiques permettent au conseiller de :
-- 1. Voir TOUS les leads (peu importe le statut)
-- 2. Mettre à jour les champs conseiller (conseiller_status, conseiller_comment)
-- ================================================

-- 1. Permettre au conseiller de LIRE tous les leads
CREATE POLICY IF NOT EXISTS "Conseiller can view all leads"
ON project_responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'conseiller'
  )
);

-- 2. Permettre au conseiller de METTRE À JOUR les champs conseiller uniquement
CREATE POLICY IF NOT EXISTS "Conseiller can update conseiller fields"
ON project_responses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'conseiller'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'conseiller'
  )
);

-- 3. Permettre au conseiller de lire les projets
CREATE POLICY IF NOT EXISTS "Conseiller can view all projects"
ON projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'conseiller'
  )
);

-- 4. Permettre au conseiller de lire les champs des projets (project_fields)
CREATE POLICY IF NOT EXISTS "Conseiller can view project fields"
ON project_fields
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'conseiller'
  )
);

-- Vérifier les politiques créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('project_responses', 'projects', 'project_fields')
AND policyname LIKE '%Conseiller%'
ORDER BY tablename, policyname;
