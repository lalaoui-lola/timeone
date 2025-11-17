// Test de la requête project_fields
// À exécuter dans la console du navigateur (F12)

async function testProjectFieldsQuery() {
    console.log('🧪 Test de la requête project_fields...');
    
    // 1. Récupérer un lead
    const { data: leads, error: leadsError } = await supabase
        .from('project_responses')
        .select('*')
        .limit(1)
        .single();
    
    if (leadsError) {
        console.error('❌ Erreur leads:', leadsError);
        return;
    }
    
    console.log('✅ Lead trouvé:', leads);
    console.log('Project ID:', leads.project_id);
    
    // 2. Tester la requête project_fields (SANS order)
    console.log('\n📋 Test 1: Sans order_index...');
    const { data: fields1, error: error1 } = await supabase
        .from('project_fields')
        .select('*')
        .eq('project_id', leads.project_id);
    
    if (error1) {
        console.error('❌ Erreur:', error1);
    } else {
        console.log('✅ Champs récupérés:', fields1);
        console.log('Nombre de champs:', fields1?.length);
    }
    
    // 3. Tester avec order_index
    console.log('\n📋 Test 2: Avec order_index...');
    const { data: fields2, error: error2 } = await supabase
        .from('project_fields')
        .select('*')
        .eq('project_id', leads.project_id)
        .order('order_index', { ascending: true });
    
    if (error2) {
        console.error('❌ Erreur:', error2);
        console.log('→ La colonne order_index n\'existe probablement pas');
    } else {
        console.log('✅ Champs récupérés avec order:', fields2);
    }
    
    // 4. Vérifier la structure d'un champ
    if (fields1 && fields1.length > 0) {
        console.log('\n📝 Structure d\'un champ:');
        console.log(fields1[0]);
        console.log('Colonnes disponibles:', Object.keys(fields1[0]));
    }
    
    // 5. Tester le mapping ID → Nom
    if (fields1 && leads.response_data) {
        console.log('\n🔗 Test du mapping ID → Nom:');
        const responseData = typeof leads.response_data === 'string' 
            ? JSON.parse(leads.response_data) 
            : leads.response_data;
        
        Object.entries(responseData).forEach(([fieldId, value]) => {
            const field = fields1.find(f => f.id === fieldId);
            console.log(`${fieldId} → ${field?.name || 'NON TROUVÉ'}: ${value}`);
        });
    }
    
    console.log('\n✅ Tests terminés !');
}

// Exécuter le test
testProjectFieldsQuery();
