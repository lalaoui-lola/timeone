// Alias pour supabase-config.js
// Ce fichier existe pour éviter les erreurs 404
// La configuration réelle est dans supabase-config.js

// Si supabase n'est pas encore défini, charger depuis supabase-config.js
if (typeof supabase === 'undefined') {
    console.warn('Supabase non défini. Assurez-vous que supabase-config.js est chargé avant config.js');
}
