-- Ajouter la colonne notes pour les leads
ALTER TABLE project_responses 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ajouter un commentaire
COMMENT ON COLUMN project_responses.notes IS 'Notes et commentaires sur le lead';

-- Mettre à jour les leads existants avec NULL
UPDATE project_responses SET notes = NULL WHERE notes IS NULL;
