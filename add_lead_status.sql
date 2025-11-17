-- Ajouter la colonne status pour la validation des leads
ALTER TABLE project_responses 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Créer un type enum pour les statuts (optionnel mais recommandé)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
        CREATE TYPE lead_status AS ENUM ('pending', 'validated', 'rejected');
    END IF;
END $$;

-- Modifier la colonne pour utiliser l'enum (si vous voulez)
-- ALTER TABLE project_responses ALTER COLUMN status TYPE lead_status USING status::lead_status;

-- Ajouter un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_project_responses_status ON project_responses(status);

-- Mettre à jour les leads existants
UPDATE project_responses SET status = 'pending' WHERE status IS NULL;

-- Commentaire
COMMENT ON COLUMN project_responses.status IS 'Statut du lead: pending (en attente), validated (validé), rejected (rejeté)';
