# 🎯 Guide - Système de Validation des Leads

## ✅ Fonctionnalités ajoutées

### 1. **Colonne Status**
- ✅ Nouveau champ `status` dans `project_responses`
- ✅ 3 statuts possibles :
  - **pending** (⏳ En attente) - Orange
  - **validated** (✅ Validé) - Vert
  - **rejected** (❌ Rejeté) - Rouge

### 2. **Dashboard Admin**
- ✅ Correction de la requête SQL (ajout de `!inner`)
- ✅ Colonne "Statut" dans le tableau
- ✅ Boutons de validation :
  - ✅ **Valider** (vert) - Apparaît si statut = pending
  - ❌ **Rejeter** (rouge) - Apparaît si statut = pending
- ✅ Boutons disparaissent une fois validé/rejeté

### 3. **Dashboard Agent**
- ✅ Colonne "Validation" dans le tableau
- ✅ Badge coloré avec emoji :
  - ⏳ **En attente** (orange)
  - ✅ **Validé** (vert)
  - ❌ **Rejeté** (rouge)

---

## 📋 Installation

### Étape 1 : Exécuter le SQL

1. Allez sur https://supabase.com
2. Ouvrez votre projet
3. Allez dans **SQL Editor**
4. Exécutez le fichier `add_lead_status.sql`
5. Cliquez sur **Run**

```sql
-- Ajoute la colonne status
ALTER TABLE project_responses 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Met à jour les leads existants
UPDATE project_responses SET status = 'pending' WHERE status IS NULL;
```

### Étape 2 : Tester

**En tant qu'Admin :**
1. Ouvrez `admin-dashboard.html`
2. Allez dans l'onglet "Tous les Leads"
3. Vous devriez voir tous les leads avec leur statut
4. Cliquez sur ✅ pour valider ou ❌ pour rejeter

**En tant qu'Agent :**
1. Ouvrez `agent-dashboard.html`
2. Allez dans "Mes Leads"
3. Vous voyez le statut de validation de chaque lead

---

## 🎨 Statuts et Couleurs

| Statut | Label | Couleur | Badge | Quand |
|--------|-------|---------|-------|-------|
| **pending** | En attente | Orange (#f59e0b) | ⏳ | Lead créé, pas encore validé |
| **validated** | Validé | Vert (#10b981) | ✅ | Admin a validé le lead |
| **rejected** | Rejeté | Rouge (#ef4444) | ❌ | Admin a rejeté le lead |

---

## 🔧 Workflow complet

### 1. Agent crée un lead
```
Agent Dashboard → Projets → Ajouter un lead
- Remplit le formulaire
- Soumet
- Lead créé avec status = "pending"
```

### 2. Agent consulte ses leads
```
Agent Dashboard → Mes Leads
- Voit tous ses leads
- Badge "⏳ En attente" (orange)
```

### 3. Admin consulte tous les leads
```
Admin Dashboard → Tous les Leads
- Voit tous les leads de tous les agents
- Colonne "Statut" avec badge coloré
- Boutons ✅ Valider et ❌ Rejeter (si pending)
```

### 4. Admin valide/rejette
```
Admin clique sur ✅ Valider
- Confirmation demandée
- Status passe à "validated"
- Badge devient "✅ Validé" (vert)
- Boutons de validation disparaissent
```

### 5. Agent voit la validation
```
Agent Dashboard → Mes Leads
- Badge mis à jour automatiquement
- "✅ Validé" (vert) ou "❌ Rejeté" (rouge)
```

---

## 🔐 Permissions

### Admin peut :
- ✅ Voir tous les leads de tous les agents
- ✅ Valider n'importe quel lead
- ✅ Rejeter n'importe quel lead
- ✅ Supprimer n'importe quel lead
- ✅ Voir les détails complets

### Agent peut :
- ✅ Voir uniquement ses propres leads
- ✅ Voir le statut de validation
- ✅ Voir les détails de ses leads
- ❌ Ne peut pas valider/rejeter
- ❌ Ne peut pas voir les leads des autres

---

## 💡 Détails techniques

### Requête SQL corrigée (Admin)
```javascript
const { data: leads, error } = await supabase
    .from('project_responses')
    .select(`
        *,
        projects (name),
        user_profiles!inner (email)  // !inner force le JOIN
    `)
    .order('created_at', { ascending: false });
```

### Fonction de validation
```javascript
async function validateLead(leadId, newStatus) {
    const { error } = await supabase
        .from('project_responses')
        .update({ status: newStatus })
        .eq('id', leadId);
    
    if (error) throw error;
    loadAllLeads(); // Recharge la liste
}
```

### Badge dynamique
```javascript
const statusConfig = {
    pending: { label: '⏳ En attente', color: '#f59e0b' },
    validated: { label: '✅ Validé', color: '#10b981' },
    rejected: { label: '❌ Rejeté', color: '#ef4444' }
};
```

---

## 🐛 Résolution de problèmes

### L'admin ne voit pas les leads
**Solution :** Utilisez `!inner` dans la requête SQL
```javascript
user_profiles!inner (email)  // Au lieu de user_profiles (email)
```

### Les boutons de validation n'apparaissent pas
**Vérifiez :**
1. Le statut du lead est bien "pending"
2. La colonne `status` existe dans la table
3. Le SQL `add_lead_status.sql` a été exécuté

### Le statut ne s'affiche pas
**Vérifiez :**
1. La colonne `status` a été ajoutée
2. Les leads existants ont été mis à jour avec `UPDATE`
3. Rechargez la page avec `Ctrl + Shift + R`

---

## ✅ Checklist finale

- [ ] SQL `add_lead_status.sql` exécuté
- [ ] Colonne `status` existe dans `project_responses`
- [ ] Admin voit tous les leads
- [ ] Admin voit les boutons ✅ et ❌ sur les leads "pending"
- [ ] Admin peut valider un lead
- [ ] Admin peut rejeter un lead
- [ ] Agent voit le statut de ses leads
- [ ] Badge coloré s'affiche correctement
- [ ] Boutons disparaissent après validation

---

## 🎉 Résultat final

Vous avez maintenant un **système complet de validation de leads** :

✅ **Admin** :
- Vue globale de tous les leads
- Validation/rejet en un clic
- Boutons conditionnels (apparaissent uniquement si pending)

✅ **Agent** :
- Vue de ses propres leads
- Statut de validation visible
- Badges colorés avec emojis

✅ **Statuts** :
- 3 états clairs et visuels
- Couleurs cohérentes
- Workflow simple

**Votre système de leads est maintenant complet et professionnel ! 🚀✨**
