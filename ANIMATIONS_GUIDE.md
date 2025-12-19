# Guide des Animations - TimeOne

## 🎨 Palette de Couleurs

Les animations respectent la charte graphique TimeOne :

- **Couleur Primaire** : `#F7C7BB` (Rose pêche)
- **Couleur Secondaire** : `#175C64` (Bleu-vert foncé)
- **Couleur Claire** : `#EEF2F2` (Gris très clair)
- **Couleur Foncée** : `#0E3A40` (Bleu-vert très foncé)

## ✨ Animations Implémentées

### 1. Animations d'Entrée

#### Fade In
- **Classe** : `.animate-fade-in`
- **Usage** : Apparition en fondu avec légère translation vers le haut
- **Durée** : 0.6s
- **Utilisé sur** : Contenu principal, sections

#### Fade In Up
- **Classe** : `.animate-fade-in-up`
- **Usage** : Apparition depuis le bas
- **Durée** : 0.6s
- **Utilisé sur** : Cartes, éléments de liste

#### Fade In Left/Right
- **Classes** : `.animate-fade-in-left`, `.animate-fade-in-right`
- **Usage** : Apparition depuis les côtés
- **Durée** : 0.6s
- **Utilisé sur** : Sidebar (left), formulaires (right)

#### Scale In
- **Classe** : `.animate-scale-in`
- **Usage** : Apparition avec effet de zoom
- **Durée** : 0.4s
- **Utilisé sur** : Modals, badges

#### Bounce In
- **Classe** : `.animate-bounce-in`
- **Usage** : Apparition avec rebond
- **Durée** : 0.6s
- **Utilisé sur** : Notifications, alertes

### 2. Animations de Fond

#### Gradient Shift
- **Animation** : `gradientShift`
- **Usage** : Déplacement du gradient de fond
- **Durée** : Variable
- **Utilisé sur** : Arrière-plans animés

#### Background Pulse
- **Animation** : `backgroundPulse`
- **Usage** : Pulsation douce du fond
- **Durée** : 15s
- **Utilisé sur** : Body::before

#### Floating Background
- **Animation** : `floatingBackground`
- **Usage** : Mouvement flottant
- **Durée** : 6s
- **Utilisé sur** : Éléments décoratifs

### 3. Animations d'Interaction

#### Hover Lift
- **Classe** : `.hover-lift`
- **Effet** : Élévation au survol avec ombre
- **Translation** : -5px vers le haut
- **Utilisé sur** : Boutons, cartes

#### Hover Scale
- **Classe** : `.hover-scale`
- **Effet** : Agrandissement au survol
- **Scale** : 1.05
- **Utilisé sur** : Images, icônes

#### Hover Glow
- **Classe** : `.hover-glow`
- **Effet** : Effet de lueur au survol
- **Couleur** : rgba(247, 199, 187, 0.5)
- **Utilisé sur** : Éléments interactifs

### 4. Animations de Boutons

#### Boutons Primaires
- **Effet** : Ripple (onde) au clic
- **Hover** : Translation -3px + glow
- **Active** : Translation -1px
- **Couleur** : Gradient secondaire

#### Boutons Navigation
- **Effet** : Barre latérale animée
- **Hover** : Translation 5px vers la droite
- **Active** : Bordure gauche colorée

#### Bouton Déconnexion
- **Effet** : Hover rouge avec ombre
- **Translation** : -2px vers le haut
- **Couleur** : #ef4444

### 5. Animations de Cartes

#### Cartes Projet
- **Entrée** : slideInUp avec délai séquentiel
- **Hover** : 
  - Translation -8px + scale 1.02
  - Barre supérieure animée
  - Effet de glow rotatif
  - Ombre amplifiée

#### Cartes Conseiller
- **Hover** : Translation -6px + scale 1.015
- **Effet** : Plus subtil que les cartes projet

### 6. Animations de Tableau

#### Lignes de Tableau
- **Entrée** : fadeInUp séquentiel
- **Délai** : 0.05s entre chaque ligne
- **Hover** : 
  - Translation 5px vers la droite
  - Fond coloré
  - Ombre légère

### 7. Animations de Modal

#### Ouverture
- **Backdrop** : Fade in 0.3s
- **Contenu** : Slide in + scale
- **Translation** : -30px vers le haut
- **Scale** : 0.95 → 1

#### Fermeture
- **Effet** : Inverse de l'ouverture

### 8. Animations de Chargement

#### Spinner
- **Classe** : `.animate-spin`
- **Rotation** : 360° en 1s
- **Usage** : Indicateurs de chargement

#### Skeleton Loading
- **Classe** : `.skeleton`
- **Effet** : Gradient animé
- **Durée** : 1.5s
- **Usage** : Placeholders de contenu

### 9. Animations de Notification

#### Success
- **Animation** : `successPulse`
- **Effet** : Pulsation verte avec ombre
- **Couleur** : #10b981

#### Error
- **Animation** : `errorShake`
- **Effet** : Secousse horizontale
- **Couleur** : #ef4444

### 10. Animations Continues

#### Pulse
- **Classe** : `.animate-pulse`
- **Effet** : Pulsation scale 1 → 1.05
- **Durée** : 2s infini

#### Glow
- **Classe** : `.animate-glow`
- **Effet** : Pulsation de lueur
- **Durée** : 2s infini

#### Shimmer
- **Classe** : `.animate-shimmer`
- **Effet** : Brillance qui traverse
- **Durée** : 2s infini

## 🎯 Classes Utilitaires

### Délais d'Animation
```css
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
...
.delay-800 { animation-delay: 0.8s; }
```

### Transitions
```css
.smooth-transition       /* 0.3s cubic-bezier */
.smooth-transition-fast  /* 0.2s cubic-bezier */
.smooth-transition-slow  /* 0.5s cubic-bezier */
```

## 📱 Responsive

Les animations respectent les préférences utilisateur :

```css
@media (prefers-reduced-motion: reduce) {
    /* Toutes les animations sont réduites à 0.01ms */
}
```

## 🎨 Exemples d'Utilisation

### Carte avec Animation
```html
<div class="project-card animate-fade-in-up delay-100 hover-lift">
    <!-- Contenu -->
</div>
```

### Bouton avec Effet
```html
<button class="btn-primary btn-animate hover-glow">
    Cliquez-moi
</button>
```

### Ligne de Tableau
```html
<tr class="table-row-animate">
    <!-- Cellules -->
</tr>
```

### Modal Animé
```html
<div class="modal active">
    <div class="modal-content modal-content-animated">
        <!-- Contenu -->
    </div>
</div>
```

## 🚀 Performance

### Optimisations Appliquées

1. **GPU Acceleration** : Utilisation de `transform` et `opacity`
2. **Will-change** : Préparation des animations coûteuses
3. **Cubic-bezier** : Courbes d'animation naturelles
4. **Backdrop-filter** : Effets de flou optimisés

### Bonnes Pratiques

- ✅ Animations < 0.6s pour les interactions
- ✅ Délais séquentiels < 0.05s entre éléments
- ✅ Utilisation de `transform` plutôt que `left/top`
- ✅ Animations infinies uniquement pour les éléments décoratifs
- ✅ Respect des préférences utilisateur

## 🎭 Effets Spéciaux

### Ripple Effect (Boutons)
Effet d'onde au clic créé avec `::before` pseudo-élément

### Glow Rotatif (Cartes)
Effet de lueur qui tourne autour de la carte au hover

### Barre Latérale (Navigation)
Barre colorée qui apparaît au hover avec `scaleY`

### Shimmer (Loading)
Effet de brillance qui traverse l'élément

## 📊 Statistiques

- **Total d'animations** : 30+
- **Classes utilitaires** : 25+
- **Keyframes** : 20+
- **Fichier** : animations.css (~ 500 lignes)
- **Taille** : ~ 15KB (non minifié)

## 🎨 Personnalisation

Pour personnaliser les animations, modifiez les variables dans `animations.css` :

```css
/* Durées */
--duration-fast: 0.2s;
--duration-normal: 0.3s;
--duration-slow: 0.5s;

/* Courbes */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

## 🔄 Mises à Jour

Les animations sont appliquées sur :
- ✅ Page de connexion (index.html)
- ✅ Dashboard Admin (admin-dashboard.html)
- ✅ Dashboard Agent (agent-dashboard.html)
- ✅ Dashboard Conseiller (conseiller-dashboard.html)
- ✅ Dashboard Statistiques (stats-dashboard.html)

## 💡 Conseils

1. **Utilisez les classes** plutôt que de créer de nouvelles animations
2. **Combinez les classes** pour des effets complexes
3. **Ajoutez des délais** pour les animations séquentielles
4. **Testez sur mobile** pour la performance
5. **Respectez l'accessibilité** avec `prefers-reduced-motion`
