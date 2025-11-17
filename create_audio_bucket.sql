-- Créer le bucket pour les fichiers audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'lead-audios', 
    'lead-audios', 
    true, 
    52428800, -- 50MB
    ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/webm']
) ON CONFLICT (id) DO NOTHING;

-- Politiques pour le bucket lead-audios
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'lead-audios');

CREATE POLICY "Users can upload audio files" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'lead-audios' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can update audio files" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'lead-audios' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete audio files" ON storage.objects
FOR DELETE USING (
    bucket_id = 'lead-audios' AND 
    auth.role() = 'authenticated'
);

-- Donner les permissions sur le bucket
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
