-- Vérifier la structure de la table project_fields
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'project_fields'
ORDER BY ordinal_position;

-- Vérifier les données existantes
SELECT * FROM project_fields LIMIT 5;

-- Si order_index n'existe pas, l'ajouter
ALTER TABLE project_fields 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Mettre à jour les order_index existants
UPDATE project_fields 
SET order_index = 0 
WHERE order_index IS NULL;
