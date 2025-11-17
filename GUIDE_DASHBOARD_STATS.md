# 📊 Guide - Dashboard Statistiques Interactif

## ✨ Vue d'ensemble

Un dashboard statistiques complet, moderne et interactif pour l'admin avec :
- **KPIs animés** : Total leads, validés, en attente, agents actifs
- **Graphiques interactifs** : Évolution, validation, projets, quotidien
- **Leaderboard** : Top 5 des meilleurs agents
- **Stats hebdomadaires** : Performance par jour de la semaine
- **Design moderne** : Glassmorphism, animations, responsive

---

## 🎯 Fonctionnalités

### 1. **KPI Cards (4 cartes)**

**Total Leads**
- Nombre total de leads
- Tendance vs période précédente
- Icône bleu avec animation hover

**Leads Validés**
- Nombre de leads validés
- Pourcentage de validation
- Icône vert avec animation

**En Attente**
- Leads en attente de validation
- Pourcentage du total
- Icône orange

**Agents Actifs**
- Nombre d'agents ayant créé des leads
- Tendance positive
- Icône violet

### 2. **Graphiques**

**Évolution des Leads**
- Graphique en ligne (Chart.js)
- Périodes : 7, 30, 90 jours
- Animation fluide
- Couleurs gradient

**Taux de Validation**
- Graphique doughnut
- 3 statuts : Validé, En attente, Rejeté
- Pourcentages interactifs

**Leads par Projet**
- Graphique en barres horizontales
- Tous les projets avec leur nombre de leads
- Tri par nombre décroissant

**Leads par Jour (7 derniers jours)**
- Graphique en barres
- Affichage par jour de la semaine
- Couleur violet

### 3. **Leaderboard - Top 5 Agents**

**Classement**
- 🥇 1er : Badge or avec ombre dorée
- 🥈 2ème : Badge argent
- 🥉 3ème : Badge bronze
- 4-5 : Badge gris

**Informations**
- Nom de l'agent
- Email
- Nombre total de leads
- Animation slide-in

### 4. **Performance Hebdomadaire**

**7 derniers jours**
- Lun, Mar, Mer, Jeu, Ven, Sam, Dim
- Nombre de leads par jour
- Barre de progression relative
- Animation scale-in

### 5. **Filtres de Période**

**Sélecteur global**
- Aujourd'hui
- Cette semaine
- Ce mois (par défaut)
- Cette année

**Bouton Actualiser**
- Icône rotation
- Recharge toutes les stats
- Animation spin

---

## 🎨 Design & Animations

### Animations d'entrée

**KPI Cards**
- `slide-up` : Glisse de bas en haut
- Délai échelonné (0s, 0.1s, 0.2s, 0.3s)

**Charts**
- `fade-in` : Apparition en fondu
- Délai échelonné

**Leaderboard**
- `slideInRight` : Glisse de gauche à droite
- Délai par item

**Weekly Stats**
- `scaleIn` : Zoom depuis 90%
- Délai échelonné

### Effets hover

**KPI Cards**
- Élévation : `translateY(-5px)`
- Ombre accentuée
- Bordure colorée
- Barre supérieure animée

**Charts**
- Élévation légère
- Ombre douce

**Leaderboard Items**
- Translation horizontale
- Fond plus clair
- Bordure colorée

**Week Days**
- Élévation
- Bordure colorée

### Couleurs

**Primaire** : Rose pêche (#F7C7BB)
**Bleu** : #3b82f6 (Total leads)
**Vert** : #10b981 (Validés)
**Orange** : #f59e0b (En attente)
**Violet** : #a855f7 (Agents)
**Rouge** : #ef4444 (Rejetés)

---

## 📋 Structure des fichiers

### HTML : `stats-dashboard.html`

```html
<!-- Structure -->
<div class="dashboard-container">
    <aside class="sidebar">...</aside>
    <main class="main-content">
        <header class="page-header">...</header>
        <div class="kpi-grid">...</div>
        <div class="charts-row">...</div>
        <div class="leaderboard">...</div>
        <div class="weekly-stats">...</div>
    </main>
</div>
```

### CSS : `stats-styles.css`

**Sections principales**
- Page Header
- KPI Grid & Cards
- Charts & Containers
- Leaderboard
- Weekly Stats
- Animations
- Responsive

### JavaScript : `stats-dashboard.js`

**Fonctions principales**
```javascript
// Auth
checkAuth()
logout()

// Data loading
loadAllStats()
loadKPIs()
loadLeadsEvolution()
loadValidationRate()
loadProjectsStats()
loadTopAgents()
loadDailyLeads()
loadWeeklyStats()

// Helpers
getDateFilter(period)
getPreviousPeriodFilter(period)
animateValue(id, start, end, duration)
refreshStats()
```

---

## 🔧 Configuration technique

### Chart.js

**Version** : 4.4.0
**CDN** : `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`

**Types de graphiques**
- Line : Évolution des leads
- Doughnut : Taux de validation
- Bar : Projets, quotidien

**Configuration commune**
```javascript
{
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { ... },
        tooltip: { ... }
    },
    scales: {
        y: { ... },
        x: { ... }
    }
}
```

### Supabase Queries

**KPIs**
```javascript
// Total avec filtre de période
supabase.from('project_responses')
    .select('*', { count: 'exact' })
    .gte('created_at', dateFilter)

// Par statut
.eq('status', 'validated')
```

**Évolution**
```javascript
// Par jour
.gte('created_at', date.toISOString())
.lt('created_at', nextDate.toISOString())
```

**Top Agents**
```javascript
// Compter par user_id
const agentCounts = {};
leads.forEach(lead => {
    agentCounts[lead.user_id] = (agentCounts[lead.user_id] || 0) + 1;
});
```

---

## 📊 Métriques calculées

### Tendances

**Formule**
```javascript
const trend = ((current - previous) / previous * 100).toFixed(1);
```

**Affichage**
- Positive : Flèche haut ↑, vert
- Négative : Flèche bas ↓, rouge
- Neutre : Tiret -, orange

### Pourcentages

**Taux de validation**
```javascript
const rate = (validated / total * 100).toFixed(1);
```

**Barre de progression**
```javascript
const percentage = (value / maxValue * 100);
```

### Animation des valeurs

**Counter animé**
```javascript
function animateValue(id, start, end, duration) {
    const increment = (end - start) / (duration / 16);
    // Incrémente toutes les 16ms (60fps)
}
```

---

## 🎯 Workflow utilisateur

### 1. **Accès au dashboard**

```
Admin Dashboard → Clic "Statistiques" → stats-dashboard.html
```

### 2. **Vue d'ensemble**

```
1. KPIs en haut (4 cartes)
2. Graphiques principaux (2 charts)
3. Projets (1 chart large)
4. Leaderboard + Quotidien (2 colonnes)
5. Performance hebdomadaire (7 jours)
```

### 3. **Interactions**

**Sélecteur de période**
- Change toutes les stats
- Recharge automatiquement

**Sélecteur évolution**
- Change uniquement le graphique d'évolution
- 7, 30 ou 90 jours

**Bouton actualiser**
- Recharge toutes les données
- Animation de rotation

**Hover sur graphiques**
- Tooltips détaillés
- Valeurs exactes

---

## 🐛 Résolution de problèmes

### Graphiques ne s'affichent pas

**Vérifier**
1. Chart.js chargé : `console.log(Chart)`
2. Canvas existe : `document.getElementById('leadsEvolutionChart')`
3. Contexte 2D : `.getContext('2d')`

**Solution**
```javascript
if (leadsEvolutionChart) {
    leadsEvolutionChart.destroy();
}
// Puis créer le nouveau graphique
```

### Données ne se chargent pas

**Vérifier**
1. Session authentifiée
2. Rôle admin
3. Connexion Supabase
4. Console pour erreurs

**Debug**
```javascript
console.log('Session:', session);
console.log('Leads:', leads);
console.log('Projects:', projects);
```

### Animations ne fonctionnent pas

**Vérifier**
1. CSS chargé : `stats-styles.css`
2. Attributs `data-animation`
3. Délais `animation-delay`

**Forcer**
```css
.kpi-card {
    animation: slideUp 0.6s ease !important;
}
```

---

## ✅ Checklist de vérification

### Fichiers
- [ ] `stats-dashboard.html` créé
- [ ] `stats-styles.css` créé
- [ ] `stats-dashboard.js` créé
- [ ] Lien dans `admin-dashboard.html`

### Fonctionnalités
- [ ] KPIs affichent les bonnes valeurs
- [ ] Tendances calculées correctement
- [ ] Graphiques s'affichent
- [ ] Leaderboard trié par nombre de leads
- [ ] Stats hebdomadaires complètes
- [ ] Filtres de période fonctionnent
- [ ] Bouton actualiser fonctionne

### Design
- [ ] Animations fluides
- [ ] Hover effects fonctionnent
- [ ] Responsive sur mobile
- [ ] Couleurs cohérentes
- [ ] Icônes affichées

### Performance
- [ ] Chargement < 2 secondes
- [ ] Pas d'erreurs console
- [ ] Graphiques interactifs
- [ ] Transitions fluides

---

## 🚀 Améliorations futures

### Fonctionnalités

**Export**
- PDF des statistiques
- Excel des données
- Images des graphiques

**Filtres avancés**
- Par agent spécifique
- Par projet spécifique
- Par plage de dates personnalisée

**Comparaisons**
- Période vs période
- Agent vs agent
- Projet vs projet

**Alertes**
- Objectifs non atteints
- Baisse de performance
- Agents inactifs

### Graphiques supplémentaires

**Taux de conversion**
- Par source
- Par campagne
- Par agent

**Temps de traitement**
- Délai moyen de validation
- Temps de réponse
- Performance horaire

**Prévisions**
- Tendances futures
- Objectifs projetés
- Recommandations IA

---

## 🎉 Résultat final

Vous avez maintenant un **dashboard statistiques professionnel** avec :

✅ **4 KPIs animés** : Métriques clés avec tendances  
✅ **5 graphiques interactifs** : Évolution, validation, projets, quotidien, hebdomadaire  
✅ **Leaderboard Top 5** : Meilleurs agents avec badges  
✅ **Performance hebdomadaire** : 7 derniers jours avec barres  
✅ **Filtres de période** : Aujourd'hui, semaine, mois, année  
✅ **Design moderne** : Glassmorphism, animations, responsive  
✅ **Interactif** : Hover, tooltips, actualisation  

**Votre dashboard est maintenant complet et professionnel ! 📊✨🚀**
