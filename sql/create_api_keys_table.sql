-- Création de la table api_keys pour stocker les clés API
-- À exécuter dans Supabase SQL Editor

-- Créer la table api_keys
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- Activer RLS (Row Level Security)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Politique: Les admins peuvent tout voir
CREATE POLICY "Admins can view all API keys"
ON api_keys
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- Politique: Les admins peuvent créer des clés API
CREATE POLICY "Admins can create API keys"
ON api_keys
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- Politique: Les admins peuvent mettre à jour les clés API
CREATE POLICY "Admins can update API keys"
ON api_keys
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- Politique: Les admins peuvent supprimer les clés API
CREATE POLICY "Admins can delete API keys"
ON api_keys
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- Commentaires pour la documentation
COMMENT ON TABLE api_keys IS 'Stocke les clés API pour l''accès externe au système';
COMMENT ON COLUMN api_keys.name IS 'Nom descriptif de la clé API';
COMMENT ON COLUMN api_keys.description IS 'Description optionnelle de l''utilisation de la clé';
COMMENT ON COLUMN api_keys.key_hash IS 'Hash SHA-256 de la clé API (pour la sécurité)';
COMMENT ON COLUMN api_keys.key_prefix IS 'Préfixe visible de la clé pour identification (ex: tk_abc123...)';
COMMENT ON COLUMN api_keys.created_by IS 'ID de l''admin qui a créé la clé';
COMMENT ON COLUMN api_keys.last_used_at IS 'Date et heure de la dernière utilisation de la clé';
COMMENT ON COLUMN api_keys.is_active IS 'Indique si la clé est active ou révoquée';
COMMENT ON COLUMN api_keys.metadata IS 'Métadonnées additionnelles (JSON)';
