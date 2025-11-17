// Configuration Supabase
const SUPABASE_URL = 'https://hylknkgcvpsizrqmudcm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bGtua2djdnBzaXpycW11ZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjY0MTEsImV4cCI6MjA3Nzg0MjQxMX0.oC7L7wcuzS4WJEfvmwkIz4fwqhQRr99FDDeJsfkfFPs';

// Initialisation du client Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
