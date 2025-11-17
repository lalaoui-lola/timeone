-- Créer la table des projets
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table des champs de projet
CREATE TABLE IF NOT EXISTS project_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    options TEXT[], -- Pour stocker les options des select, radio, checkboxes
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table pour stocker les réponses aux formulaires
CREATE TABLE IF NOT EXISTS project_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    response_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS sur les tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_responses ENABLE ROW LEVEL SECURITY;

-- Politiques pour projects
CREATE POLICY "Authenticated users can view all projects" ON projects
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert projects" ON projects
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update projects" ON projects
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete projects" ON projects
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Politiques pour project_fields
CREATE POLICY "Authenticated users can view all project fields" ON project_fields
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert project fields" ON project_fields
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update project fields" ON project_fields
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete project fields" ON project_fields
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Politiques pour project_responses
CREATE POLICY "Users can view their own responses" ON project_responses
    FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Authenticated users can insert responses" ON project_responses
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own responses" ON project_responses
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete responses" ON project_responses
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_project_fields_project_id ON project_fields(project_id);
CREATE INDEX IF NOT EXISTS idx_project_responses_project_id ON project_responses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_responses_user_id ON project_responses(user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at sur projects
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
