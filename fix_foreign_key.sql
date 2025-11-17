-- ================================================
-- FIX: Ajouter la clé étrangère manquante
-- ================================================

-- 1. Vérifier que la table user_profiles existe
SELECT COUNT(*) FROM user_profiles;

-- 2. Ajouter la clé étrangère entre project_responses et user_profiles
-- Note: On utilise ON DELETE CASCADE pour supprimer les leads si l'utilisateur est supprimé
ALTER TABLE project_responses
DROP CONSTRAINT IF EXISTS project_responses_user_id_fkey;

ALTER TABLE project_responses
ADD CONSTRAINT project_responses_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(user_id) 
ON DELETE CASCADE;

-- 3. Vérifier que la clé étrangère a été créée
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='project_responses';

-- 4. Ajouter la colonne status si elle n'existe pas
ALTER TABLE project_responses 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- 5. Mettre à jour les leads existants
UPDATE project_responses SET status = 'pending' WHERE status IS NULL;

-- Message de confirmation
SELECT 'Clé étrangère créée avec succès!' as message;
