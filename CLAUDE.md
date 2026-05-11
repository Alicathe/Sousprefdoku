# CLAUDE.md — Mémoire du projet Sudoku des Sous-préfectures

Document de contexte pour les futures sessions Claude sur ce projet. Lis-le en premier.

---

## 1. Contexte du projet

**Auteur** : Lucas Panvier, COO de Monde Singulier (plateforme B2B de design de luxe). Travaille en français, niveau de langue soutenu, tutoiement.

**Genèse** : Lucas découvre `dailymetro.live`, un Wordle quotidien sur les stations de métro parisien. Il demande un guide pour faire l'équivalent avec les sous-préfectures françaises. Le projet pivote ensuite vers un format **Sudoku** inspiré de `metrodoku.fr` : grille 3×3 où chaque case attend une commune satisfaisant deux critères (ligne + colonne).

**État actuel** : en ligne sur `https://alicathe.github.io/Sousprefdoku/`. Pipeline Google Sheet → GitHub Action → GitHub Pages opérationnel. Stats joueurs (perso + globales avec comparaison « Top X% ») branchées via Apps Script.

---

## 2. Architecture finale

```
[Google Sheet]  ──cron quotidien 04h15──▶  [GitHub Action]  ──commits si diff──▶  [GitHub Pages]
                                                  │                                       ▲
                                                  ▼                                       │
                                         data.json + criteria.json              navigateur joueur
                                                                                          │
                                                                                          ▼
                                                                              [Apps Script + Sheet de scores]
                                                                              GET stats du jour, POST score
```

Tout est statique. Aucun backend permanent. Le seul service serveur est l'endpoint Apps Script pour les stats globales (optionnel).

---

## 3. Stack technique

**Frontend** : HTML/CSS/JS vanilla, single-page, sans framework. Pas de build, pas de bundler. Le code est dans `index.html` + `data.json` + `criteria.json`.

**Style** : palette République Française (DSFR) — bleu Marianne `#000091`, rouge Marianne `#E1000F`, vert `#18753C`, orange `#B34000`. Typographie Marianne en fallback system-ui.

**Hébergement** : GitHub Pages (gratuit, illimité, HTTPS auto via Let's Encrypt).

**Source de données** : Google Sheet partagé en lecture publique, exporté en CSV via l'endpoint `gviz/tq` de Google.

**Pipeline de sync** : GitHub Action en Node 20 natif (zéro dépendance), tourne tous les jours à 03h15 UTC + déclenchable manuellement.

**Backend stats** : Apps Script attaché à un Google Sheet, déployé en application web publique. Limites : 20 000 requêtes/jour gratuites.

---

## 3 bis. Identité visuelle « Atlas » (mai 2026)

Le site a été refondu en mai 2026 pour quitter l'identité État (DSFR, drapeau RF, Marianne logotype — risque juridique). Nouvelle direction : **« vieille carte / atlas géographique »**. Voir `CHARTE_GRAPHIQUE.md` pour le détail complet.

- **Palette** : bleu encre (#1F2E4A), ocre (#C19A4B), vert mousse (#4A6B47), crème (#F8F5EE), sépia (#6B5847)
- **Typographie** : Spectral (titres serif), Public Sans (corps), IBM Plex Mono (méta techniques) — via Google Fonts
- **Logo** : hexagone vectoriel avec mini-grille 3×3 et carré ocre central
- **Éléments signature** : cartouche encadré bleu encre + ocre avec équerres aux angles, rose des vents en haut à droite, lettrine ocre sur le « S » du titre
- **Calque topographique** en fond, opacité 0.15 (courbes isohypses + lignes ondulantes type fleuve)
- **Mini-carte de France** dans la marge avec vrais contours et points placés aux coordonnées GPS réelles
- **Boussoles cellulaires** sur les cellules à critère géographique (aiguille pointant vers la direction satisfaite)
- **Galerie des grilles passées** tout en bas (7 derniers jours, mini-grilles cliquables — rejouer en entraînement à brancher en V2)
- **Classement du jour** inline (top 5) juste sous la grille, avec lien vers le classement complet dans « Mes stats »

## 4. Fichiers du projet

```
Sousprefdoku/                                   GitHub repo (alicathe/Sousprefdoku)
├── index.html                                  Le jeu (~38 Ko, JS vanilla)
├── data.json                                   334 communes + flags booléens (~197 Ko, généré par sync.js)
├── criteria.json                               47 critères + config + mutex (~8 Ko, généré par sync.js)
├── README.md                                   Documentation utilisateur
├── CLAUDE.md                                   Ce fichier (mémoire pour Claude)
├── CNAME                                       (présent localement, NON poussé : domaine sousprefdoku.io non acheté)
├── scripts/
│   ├── sync.js                                 Fetch Google Sheet → JSON (Node, 0 dep)
│   └── scores.gs                               Apps Script backend stats (à déployer côté Google)
└── .github/
    └── workflows/
        └── sync.yml                            Cron quotidien + workflow_dispatch
```

**Hors repo, sur le poste de Lucas** : 
- `dailysouspref_database.xlsx` : version xlsx du corpus (utile pour audit, pas dans la prod)
- `sudoku-souspref-sheet-template.xlsx` : template à uploader sur Google Sheets pour reconstruire le Sheet

---

## 5. Le corpus

**Filtré à 233 sous-préfectures** dans le jeu (préfectures retirées par décision de Lucas en mai 2026). Le `data.json` contient toujours 334 lignes ; le filtre est appliqué côté frontend via `criteria.json.corpus_filter = { statut: "souspref" }`. Réversible en modifiant ce champ.

Avant filtrage : **334 chefs-lieux** = 101 préfectures + 233 sous-préfectures, **DROM inclus** (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte). COM (Saint-Pierre-et-Miquelon, Saint-Martin, etc.) **non incluses** car elles n'ont pas le statut administratif sous-préfecture/préfecture.

Sources :
- **Liste administrative** : `etalab/decoupage-administratif` (INSEE COG 2024, version 6.0.0)
- **Coordonnées + superficie** : `gregoiredavid/france-geojson`, centroïdes calculés en projection equal-area. Les champs `lat` et `lon` sont **embarqués dans `data.json` depuis mai 2026** (version 2) pour alimenter la mini-carte. Ils sont sourcés depuis l'onglet `corpus` du Google Sheet via les colonnes éponymes.
- **Population** : INSEE millésime 2022 (pop. municipale en vigueur 1ᵉʳ janvier 2025)
- **Population 1999** : ~135 communes hardcodées depuis le RGP 1999 (les communes très peuplées, le reste laissé en `null`). Vichy, Briançon, Saverne, Sélestat, Issoire, Haguenau, Saint-Denis 93 ont été **explicitement exclues** parce que mes valeurs étaient suspectes (fusions post-2000 ou confusion d'INSEE)
- **Altitudes** : sql.sh `villes-france.csv` via `Lyssal/geographie-bundle` pour métropole + Corse (`(zmin + zmax) / 2`). Pour DROM + Paris/Lyon/Marseille (où la moyenne min/max est trompeuse), valeurs de la mairie hardcodées depuis Wikipédia
- **Adjacence départementale** : calculée depuis les contours départementaux du geojson (96 départements + DROM)
- **Critères encyclopédiques** (cathédrale, tramway, gare TGV, Ligue 1, Tour de France) : listes hardcodées à partir de Wikipédia. Approximations qui peuvent contenir 5-10 % d'erreurs.

---

## 6. Les 47 critères du jeu

**24 booléens** dans `c.k.*` :

| Famille | Critères |
|---|---|
| Géographie | nord_loire, est_paris, ouest_paris, sud_lyon, nord_lyon, proche_mer, proche_frontiere, altitude_sup_600 |
| Démographie | moins_15k, plus_50k, plus_100k, gain_population, perte_population |
| Statut | est_pref, est_souspref |
| Encyclopédique | cathedrale, tramway, gare_tgv, ligue_1, tour_de_france |
| Lexical | contient_o, contient_trait_union, deux_mots_plus |
| Administratif | dept_impair |

**13 paramétriques** régions (`c.r === "11"` pour Île-de-France, etc.)

**10 paramétriques** code postal premier chiffre (`cp_first(c) === "5"`)

**3 types de critères** supportés sans toucher au code :
- `flag` : test sur `c.k[flag] === true`
- `field_eq` : test sur `c[field] === value`
- `cp_first` : cas spécial sur premier chiffre de code postal (dérivé du dept code)

---

## 7. Décisions de conception clés

### Géographique
- **Loire** : ligne droite Saint-Nazaire (-2.2, 47.27) → Roanne (4.0, 46.04). Approximation simple, suffisante pour le jeu.
- **Paris/Lyon** : Paris exclue de « est_paris » et « ouest_paris ». Lyon exclue de « nord_lyon » et « sud_lyon ».
- **DROM** : exclus des critères géographiques de métropole (nord_loire, est_paris, etc.). Inclus dans `proche_mer` (toutes îles) et `proche_frontiere` (Guyane). Décision : appliquer les critères de métropole UNIQUEMENT à la métropole.
- **Mer/frontière** : haversine vers une liste hardcodée de ~35 points côtiers et ~30 points frontières terrestres. Seuil 100 km.
- **Altitude** : seuil **600 m** retenu (et non 1000 m). 33 communes concernées au lieu de 12, beaucoup moins de paires impossibles dans la matrice.

### Démographique
- **Gain/perte population** : seuil **±10 %** sur 1999→2022 pour filtrer le bruit. Couverture partielle (~40 % du corpus) car population 1999 hardcodée seulement pour les 135 communes les mieux connues.

### Encyclopédique
- **Cathédrales** : ~118 chefs-lieux, basé sur la liste Wikipédia des cathédrales catholiques.
- **Tramway** : 27 chefs-lieux avec un tramway urbain en service au 1ᵉʳ janvier 2026.
- **Gare TGV** : 57 chefs-lieux desservis par TGV inOui ou OuiGo.
- **Ligue 1** : 52 villes ayant eu un club en L1 depuis 1932, **au sens commun** (Bordeaux compte même si le stade Matmut est ailleurs).
- **Tour de France** : 102 chefs-lieux ayant été ville-étape depuis 1947 (toutes années confondues).

### Génération de la grille
- **Min 5 candidats par case** (cf. demande explicite de Lucas).
- **Max 2 critères par famille** dans une grille (variété).
- **7 paires mutex** logiquement exclusives codées en dur (ex : est_paris × ouest_paris, plus_50k × moins_15k).
- **Algorithme** : tirage aléatoire seed-déterministe (mulberry32 sur hash du jour), retry jusqu'à 20 000 fois (porté de 5k à 20k en mai 2026 car le corpus restreint à 233 sous-pref + exclusion veille demande plus de tentatives), vérification du matching parfait par backtracking pour garantir 9 réponses uniques possibles.
- **Pas de répétition de critère 2 jours de suite** (depuis mai 2026) : chaîne déterministe sur 14 jours en arrière, chaque jour exclut les 6 critères du précédent. Résultats mis en cache localStorage (`mdku:chain:YYYY-MM-DD`) pour éviter le recalcul à chaque visite. Performance : ~150ms cold load (14 jours), ~3ms warm.
- **Auto-filtrage des critères triviaux** : les critères avec coverage 0% ou 100% sur le corpus filtré sont automatiquement retirés du pool (ex : `est_pref` devient 0% quand corpus = souspref only).

### Persistance
- **localStorage** pour l'état de la partie + stats perso. Clés :
  - `mdku:YYYY-MM-DD` : état de la grille du jour
  - `mdku:stats` : historique des victoires (60 dernières)
  - `mdku:anon_id` : identifiant anonyme stable par navigateur
- **Pas de cookies, pas de tracking**.

---

## 8. Stats joueurs

**Stats perso** (toujours actives) : streak, joué, meilleur, moyenne, distribution. Stockées en localStorage.

**Comparaison globale** (optionnelle, via Apps Script) :
- POST sur victoire : `{ date, attempts, cell_attempts: [9 ints], anon_id }`
- GET par date : renvoie `{ count, avg, histogram, cell_avg, cell_count }`
- Anti-double-saisie : un anon_id ne peut enregistrer qu'un score par date
- Calcul **« Top X% »** côté client à partir de l'histogramme renvoyé
- **Stats par case** : moyenne globale d'essais affichée en bas de chaque case à la fin de la grille, avec code couleur (vert si tu as fait mieux, rouge si pire)

L'URL Apps Script est branchée via `criteria.json.stats_endpoint`, soit poussée à la main soit via l'onglet `config` du Google Sheet.

---

## 9. URL et hébergement

- **URL active** : `https://alicathe.github.io/Sousprefdoku/`
- **Domaine `sousprefdoku.io`** : Lucas l'avait saisi dans GitHub Pages mais sans l'acheter. DNS check forcément échouait. Le custom domain a été retiré (action « Remove » dans Settings → Pages). À reprendre quand/si Lucas achète le domaine — `CNAME` est prêt dans le projet local.

---

## 10. Compte GitHub & déploiement

- Repo : `Alicathe/Sousprefdoku` (public)
- Variable repo : `SHEET_ID` (l'ID du Google Sheet de configuration, dans Settings → Secrets and variables → Actions → Variables)
- Source Pages : branche `main`, dossier `/ (root)`
- Workflow custom : `Sync from Google Sheet` (cron quotidien 03:15 UTC + workflow_dispatch)

**Pour pousser une modif** :
- Soit éditer directement sur github.com (UI web)
- Soit clone local + commit + push
- Soit GitHub Desktop pour Lucas qui n'est pas dev pur

---

## 11. Conventions de code adoptées

- **Pas de framework côté client**. JS vanilla, dépendances zéro.
- **Données externalisées** dans des JSON. Le `index.html` ne contient aucune donnée métier.
- **Trois types de critères** seulement (`flag`, `field_eq`, `cp_first`). Pour ajouter un type plus complexe (« à moins de N km de »), étendre `compileCriterion` dans `index.html`.
- **Apps Script** : noms en snake_case côté JSON, camelCase côté JS. Compatibilité ascendante (lecture des anciennes lignes sans `cell_attempts`).
- **Mutex et matrice** : codés en dur dans `criteria.json`. Le générateur lit, applique, retry si conflit.
- **Pas de leaderboard nominatif**. Anon_id uniquement, pas de pseudo, pas de compte.

---

## 12. Workflow type pour ajouter un critère

1. Sur le Google Sheet, onglet `corpus` : ajouter une colonne `k_<nouveau>` à droite (ligne 1 = clé technique, ligne 2 = libellé FR), remplir TRUE/FALSE pour chaque commune.
2. Onglet `criteres` : ajouter une ligne avec `id`, `label`, `family`, `type=flag`, `flag=<nouveau>`.
3. Si le critère ne doit pas coexister avec un autre : onglet `mutex`, ajouter la paire.
4. **Actions → Run workflow** : la sync régénère `data.json` et `criteria.json`, GitHub Pages redéploie.
5. Le critère est dans le pool dès le tirage du lendemain.

---

## 13. Todos et idées de V2

**En attente** :
- **Améliorer l'UI** (Task #37) : self-host de la police Marianne, mode sombre, animations sur la validation, peaufinage mobile.
- **Achat du domaine sousprefdoku.io** (~30 €/an chez Cloudflare Registrar, le moins cher pour les .io). DNS à pointer sur les 4 IPs GitHub Pages, remettre le `CNAME`.

**Idées de critères supplémentaires** :
- Maire PS / LR / autre parti (volatil, demande maintenance)
- Lieu de naissance d'une personnalité (encyclopédique)
- Site UNESCO / Plus beau village de France
- Ville traversée par tel fleuve majeur
- Critère « limitrophe d'un département X » (96 valeurs paramétriques, données déjà en base via `c.adj`, à exposer dans `criteria.json` et étendre le compilateur)

**Idées de fonctionnalités** :
- Mode multi-grilles (générer plusieurs puzzles par jour)
- Indices payants en attempts (le joueur peut révéler une lettre du nom contre +5 essais)
- Replay d'anciennes grilles archivées
- Leaderboard anonyme par pseudo (demanderait un vrai backend type Supabase)

---

## 14. Conseils pour Claude future

- **Lucas est en finance/conseil**, pas dev pur. Il comprend les concepts techniques mais préfère qu'on lui explique les manips concrètes (capture d'écran, copier-coller, où cliquer). Privilégier les pas-à-pas.
- **Niveau de langue soutenu, tutoiement, en français**. Détaillé et structuré (titres, listes), pas concis. Pas d'emoji (sauf si lui en met).
- **Posture analytique demandée**. Challenger les hypothèses, proposer des angles non considérés.
- **Ne pas refaire ce qui marche**. La pipeline GitHub + Sheet + Apps Script tourne. Toute modif doit s'inscrire dans cette architecture, pas la remplacer.
- **Préférer éditer les JSON** (data.json / criteria.json) plutôt que `index.html` quand c'est possible. Le code JS doit rester stable.
- **Ne jamais ajouter de dépendance npm** sans raison forte. Le projet est volontairement zéro-dep.
- **Pour les nouveaux critères encyclopédiques**, vérifier avec Wikipédia/Wikidata avant de hardcoder. Les listes de Tour de France, Ligue 1, etc., contiennent probablement quelques erreurs à corriger au fil de l'eau.

---

*Dernière mise à jour : mai 2026, à la fin de la session de mise en place du jeu et des stats par cellule.*
