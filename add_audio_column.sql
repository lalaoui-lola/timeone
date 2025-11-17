-- Ajouter la colonne audio pour les fichiers audio des leads
ALTER TABLE project_responses 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Ajouter un commentaire
COMMENT ON COLUMN project_responses.audio_url IS 'URL du fichier audio associé au lead';

-- Mettre à jour les leads existants avec NULL
UPDATE project_responses SET audio_url = NULL WHERE audio_url IS NULL;
