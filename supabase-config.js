// Configuration Supabase
const SUPABASE_URL = 'https://hylknkgcvpsizrqmudcm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bGtua2djdnBzaXpycW11ZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjY0MTEsImV4cCI6MjA3Nzg0MjQxMX0.oC7L7wcuzS4WJEfvmwkIz4fwqhQRr99FDDeJsfkfFPs';

// Initialisation du client Supabase
// Vérifions d'abord si la variable supabase existe déjà
if (typeof window.supabase !== 'undefined') {
    // Utiliser la bibliothèque Supabase déjà chargée
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('La bibliothèque Supabase n\'est pas chargée correctement');
}
