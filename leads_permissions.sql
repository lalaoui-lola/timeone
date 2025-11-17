-- Mettre à jour la table project_fields pour ajouter la colonne options si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='project_fields' AND column_name='options') THEN
        ALTER TABLE project_fields ADD COLUMN options TEXT[];
    END IF;
END $$;

-- Supprimer les anciennes politiques sur project_responses
DROP POLICY IF EXISTS "Users can view their own responses" ON project_responses;
DROP POLICY IF EXISTS "Authenticated users can insert responses" ON project_responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON project_responses;
DROP POLICY IF EXISTS "Admins can delete responses" ON project_responses;

-- Nouvelles politiques pour project_responses

-- Les agents peuvent voir uniquement leurs propres leads
CREATE POLICY "Agents can view their own leads" ON project_responses
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Les agents peuvent créer des leads
CREATE POLICY "Agents can create leads" ON project_responses
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('agent', 'admin')
        )
    );

-- Les agents peuvent modifier leurs propres leads
CREATE POLICY "Agents can update their own leads" ON project_responses
    FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Seuls les admins peuvent supprimer des leads
CREATE POLICY "Only admins can delete leads" ON project_responses
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Créer une vue pour les admins qui affiche tous les leads avec les infos de l'agent
CREATE OR REPLACE VIEW admin_all_leads AS
SELECT 
    pr.*,
    p.name as project_name,
    up.email as agent_email,
    up.role as agent_role
FROM project_responses pr
LEFT JOIN projects p ON pr.project_id = p.id
LEFT JOIN user_profiles up ON pr.user_id = up.user_id
ORDER BY pr.created_at DESC;

-- Donner accès à la vue aux admins uniquement
GRANT SELECT ON admin_all_leads TO authenticated;

-- Créer une fonction pour compter les leads par agent
CREATE OR REPLACE FUNCTION count_leads_by_agent(agent_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM project_responses
        WHERE user_id = agent_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer une fonction pour compter les leads par projet
CREATE OR REPLACE FUNCTION count_leads_by_project(proj_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM project_responses
        WHERE project_id = proj_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_project_responses_created_at ON project_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_responses_user_project ON project_responses(user_id, project_id);

-- Commentaires pour documentation
COMMENT ON TABLE project_responses IS 'Stocke les leads (réponses aux formulaires) créés par les agents';
COMMENT ON COLUMN project_responses.response_data IS 'Données JSON contenant les réponses aux champs du formulaire';
COMMENT ON COLUMN project_responses.user_id IS 'ID de l''agent qui a créé le lead';
COMMENT ON COLUMN project_responses.project_id IS 'ID du projet (formulaire) associé';
