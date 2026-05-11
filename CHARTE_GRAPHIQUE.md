# Charte graphique — Sudoku des Sous-préfectures

Identité « Atlas / vieille carte ». Sobre, civique, intellectuelle. Évoque les manuels de géographie Vidal de la Blache, les cartes Cassini, les atlas du XIXᵉ siècle. **Aucun élément étatique** (pas de drapeau RF, pas de DSFR, pas de Marianne logotype).

## 1. Naming

- **Nom du site** : Sudoku des Sous-préfectures
- **Sous-titre** : Édition quotidienne · grille du jour
- **Vocabulaire** : grille, case, joueur, essai, classement (pas d'« arpenteur », « feuille n° », « tracer »)

## 2. Palette (12 couleurs)

| Rôle | Code | Usage |
|---|---|---|
| Bleu encre | `#1F2E4A` | Titres, encres, fond des en-têtes de cellule |
| Bleu ardoise | `#2C3E5B` | Corps de texte sur fond clair |
| Bleu pâle | `#7B91B3` | Lignes décoratives, annotations |
| Crème principal | `#F8F5EE` | Fond de page |
| Crème claire | `#FBF9F4` | Cellules vides, cartes |
| Crème vieillie | `#EFE8D5` | Sections secondaires |
| Cream succès | `#F0EAD8` | Fond des cellules validées |
| Ocre | `#C19A4B` | Bordures ornementales, accents chauds |
| Ocre clair | `#D9B570` | États focus, hover |
| Cream doublon | `#F5E8DC` | Fond cellule placée en double |
| Vert mousse | `#4A6B47` | Validation (succès) |
| Bordeaux | `#8B3A3A` | Erreur |
| Sépia | `#6B5847` | Texte secondaire, méta |

**Mode sombre** (à implémenter en V2) : fond `#1E1B14`, encre `#E8DBB8`, ocre `#A88B4A`, vert `#8FAD7E`, bordeaux `#C97070`.

## 3. Typographie

- **Serif principal** : Spectral (Google Fonts, libre). Hiérarchie : titres, noms de communes.
- **Sans-serif** : Public Sans (libre, design USGS). Hiérarchie : corps, UI, boutons.
- **Monospace** : IBM Plex Mono (libre). Hiérarchie : coordonnées, dates, étiquettes techniques.

| Niveau | Police | Taille | Poids | Letter-spacing |
|---|---|---|---|---|
| Titre principal | Spectral | 24px | 500 | -0.01em |
| Lettrine | Spectral italic | 36px | 500 | — |
| Sous-titre | IBM Plex Mono | 10px | 500 | 0.18em |
| Section serif | Spectral italic | 15px | 500 | — |
| Corps | Public Sans | 14px | 400 | 0 |
| UI / boutons | Public Sans | 12px | 600 | 0.02em |
| Coordonnées | IBM Plex Mono | 11px | 400 | 0.16em |
| Méta sépia | IBM Plex Mono | 10px | 400 | 0.04em |

Chiffres « old-style » (3, 5, 7 descendent sous la ligne, 0, 1, 2 restent dessus) activés via `font-variant-numeric: oldstyle-nums` sur Spectral et Public Sans.

## 4. Logo

Hexagone vectoriel 58×58 avec :
- Contour bleu encre 1,5px
- Contour interne ocre pointillé (déphasé de 2px)
- Mini-grille 3×3 au centre
- Carré central ocre plein

Trois variantes :
- **Signature complète** : logo + wordmark + sous-titre
- **Signature compacte** : logo + wordmark
- **Monogramme** : logo seul, pour favicon et avatars

## 5. Composition générale

```
┌────────────────────────────────────────────┐  ← cartouche bleu encre 1px
│  ┌──────────────────────────────────────┐  │  ← border ocre 0.5px, 6px de gap
│  │  équerres ornementales aux 4 angles  │  │
│  │                                       │  │
│  │  [Logo] [Titre avec lettrine] [rose]  │  │  ← header
│  │  ───── ligne 2px bleu encre ────────  │  │
│  │  [meta-bar mono sépia]                │  │
│  │  ───── ligne 0.5px ocre ────────────  │  │
│  │  [date italique]                      │  │
│  │                                       │  │
│  │  ┌──────────────┐  ┌──────────┐      │  │
│  │  │              │  │ Territoire│      │  │  ← grille + panneau latéral
│  │  │  GRILLE 3×3  │  │  couvert  │      │  │
│  │  │              │  ├──────────┤      │  │
│  │  │              │  │  Légende  │      │  │
│  │  └──────────────┘  └──────────┘      │  │
│  │                                       │  │
│  │  ┌──────────────────────────────────┐ │  │  ← classement du jour
│  │  │  Classement du jour              │ │  │
│  │  └──────────────────────────────────┘ │  │
│  │                                       │  │
│  │  ┌── Découverte du jour ────────────┐ │  │  ← Wikipédia
│  │  └──────────────────────────────────┘ │  │
│  │                                       │  │
│  │  ┌──────────────────────────────────┐ │  │  ← galerie 7 derniers jours
│  │  │  Galerie des grilles passées     │ │  │
│  │  └──────────────────────────────────┘ │  │
│  │                                       │  │
│  │  ───── ligne 0.5px ocre ────────────  │  │
│  │  Crédits italique sépia               │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

Largeur max : 900px en desktop. Sur mobile : tout passe en pleine largeur, panneau latéral sous la grille.

## 6. Composants

### Cellule de la grille

Structure flex à 2 colonnes :
- **Colonne principale** (`flex: 1`) : nom commune en Spectral 12.5px / dept en IBM Plex Mono 8.5px sépia
- **Colonne icône** (flex-shrink: 0, 14-18px) : indicateur d'état OU boussole géographique

Séparateur dotted ocre + ligne de stats en bas (n tentatives · moy. X,X).

États :
| État | Background | Border | Icône coin |
|---|---|---|---|
| Vide | `#FBF9F4` | dashed `#6B5847` 1.5px | — |
| Vide active | `#FBF9F4` | dashed `#C19A4B` 1.5px | — |
| Valide | `#F0EAD8` | solid `#4A6B47` 1.5px | ✓ vert |
| Erronée | `#FBF9F4` | solid `#8B3A3A` 1.5px | ✕ bordeaux |
| Doublon | `#F5E8DC` | solid `#C19A4B` 1.5px | ↻ ocre |

### Boussole cellulaire (cellules à critère géographique)

Petite boussole 18×18px en coin droit de la cellule. Aiguille rouge (bordeaux) pointant la direction satisfaisant le critère. Affichée uniquement si l'un des deux critères de la case est géographique (`est_paris`, `ouest_paris`, `nord_lyon`, `sud_lyon`, `nord_loire`, `proche_mer`, `proche_frontiere`).

### Cartouche frame

Double bordure :
- Externe : `#1F2E4A` 1px
- Interne : `#C19A4B` 0.5px
- Gap entre les deux : 6px

Équerres ornementales aux 4 angles : 14×14px, border-top + border-left (ou right/bottom selon angle) `#C19A4B` 1.5px.

### Classement du jour

Tableau grid `40px 1fr 90px 70px` :
- Rang (mono sépia, indices ordinaux : 1ᵉʳ, 2ᵉ, 3ᵉ…)
- Pseudo (serif bleu encre)
- Essais (mono vert)
- Temps (mono sépia)

Ligne du joueur connecté : background `#F0EAD8`, border 1px vert mousse.

### Mini-carte territoire couvert

SVG 200×180 viewBox.
- Contour France métropolitaine fill `#FBF9F4`, stroke bleu encre 1px
- Filet pointillé ocre 0.4px en doublure décalée de +2px sur Y
- Points placés à coordonnées GPS réelles (cercle r=3, fill ocre, stroke bleu encre 0.6px)

## 7. Calque topographique de fond

SVG en `position: absolute; inset: 0; pointer-events: none;` sur le conteneur principal.
- 3 « collines » en ellipses concentriques imbriquées (3-4 niveaux)
- 1-2 lignes ondulantes type Bezier pour suggérer un cours d'eau
- Stroke `#C19A4B` 0.5px, opacity 0.15
- Lignes ondulantes : stroke `#7B91B3` 0.4px, opacity 0.22

Désactivable via préférence utilisateur : toggle dans le footer « mode papier sobre ».

## 8. Rose des vents

SVG 50×50 en haut à droite du header.
- Cercle externe stroke bleu encre 0.5px, r=22
- Cercle interne pointillé, r=19
- 4 branches en losanges : Nord rouge bordeaux, Sud bleu encre, Est/Ouest bleu encre opacity 0.7
- Centre cercle ocre r=1.5

## 9. Micro-interactions

| Élément | Animation | Durée |
|---|---|---|
| Placement commune | scale 0.96 → 1 + opacity 0 → 1 (effet tampon) | 240ms |
| Victoire | cartouche pulse ocre → encre → ocre + rose des vents fait demi-tour | 800ms |
| Hover cellule | border 1.5px → 2px | 150ms |
| Suggestions autocomplete | cascade 10ms par item | 50-80ms total |
| Chrono | imperceptible pulse sur le séparateur chaque seconde | infini |
| Logo hover | mini-grille s'éclaire en cascade 80ms × 9 cases | 720ms |
| Focus clavier | outline ocre 2px offset 3px | instant |
| Tampon « VALIDÉ » | apparaît à la victoire avec rotation aléatoire ±3°, opacity 0 → 0.9 | 400ms |

## 10. Iconographie

Tous les pictos en SVG inline, viewBox unifié 14×14 ou 18×18 pour la boussole.

| Icône | Description |
|---|---|
| ✓ valide | path simple `M2,7 L5,10 L12,3` stroke vert mousse 1.5px |
| ✕ erreur | 2 lignes croisées + cercle stroke bordeaux 0.8px |
| ↻ doublon | cercle + flèche en arc, stroke ocre |
| Boussole cellule | cercle + 2 polygones aiguille + centre ocre |
| Lettrine S | Spectral italic 36px en ocre |

## 11. Responsive

- **Desktop (≥ 720px)** : panneau latéral à droite de la grille, classement et galerie sur toute la largeur
- **Tablet (480-720px)** : panneau latéral passe sous la grille, mini-carte agrandie
- **Mobile (< 480px)** : tout en pleine largeur, boussoles cellulaires un peu plus petites (12×12), galerie scroll horizontal

## 12. Mode sombre (V2)

Bascule via `prefers-color-scheme: dark` + toggle utilisateur.

| Rôle | Code dark |
|---|---|
| Fond | `#1E1B14` |
| Encre principale | `#E8DBB8` |
| Bordures ornementales | `#A88B4A` |
| Validations | `#8FAD7E` |
| Erreurs | `#C97070` |

## 13. Accessibilité

- Contraste minimal AA partout (texte bleu encre sur crème = 12.5:1)
- Focus states clavier visibles
- Aria-labels sur tous les boutons et icônes
- `prefers-reduced-motion` désactive les animations
- Pas de couleur seule pour transmettre l'état (icône + couleur ensemble)

## 14. Crédits & sources des polices

- **Spectral** : Production Type pour Google Fonts (SIL Open Font License)
- **Public Sans** : USWDS (Creative Commons Zero)
- **IBM Plex Mono** : IBM (SIL Open Font License)

Self-host dans `/fonts/` ou via Google Fonts CDN selon configuration.

---

*Document de référence à maintenir à jour à chaque évolution visuelle majeure.*
