# Sudoku des Sous-préfectures

Jeu quotidien de type Sudoku où chaque case attend une commune française (préfecture ou sous-préfecture) qui satisfait à la fois le critère de sa ligne et celui de sa colonne. Le moteur tire 9 cases différentes chaque jour, identiques pour tous les joueurs.

## Architecture

```
┌──────────────────┐    cron quotidien    ┌──────────────────┐    push     ┌──────────────────┐
│  Google Sheet    │ ──────────────────▶  │  GitHub Action   │ ──────────▶ │   GitHub Pages   │
│  (source vérité) │                      │  scripts/sync.js │             │   (site public)  │
└──────────────────┘                      └──────────────────┘             └──────────────────┘
        ▲                                          │                                 ▲
        │                                          ▼                                 │
   éditer les                             data.json + criteria.json           navigateur du
   onglets corpus,                        commit + push                        joueur
   criteres, etc.
```

L'utilisateur ouvre la page → le navigateur fetch `data.json` et `criteria.json` → le moteur génère la grille du jour. Aucun serveur, tout est statique.

## Structure du repo

```
sudoku-souspref/
├── index.html                  Le jeu (charge data.json + criteria.json)
├── data.json                   Corpus des 334 chefs-lieux (généré par sync.js)
├── criteria.json               Définition des critères + config (généré par sync.js)
├── scripts/
│   └── sync.js                 Sync Google Sheet → JSON (Node.js, zéro dépendance)
├── .github/workflows/
│   └── sync.yml                Workflow cron quotidien + manuel
└── README.md
```

## Mise en place complète — pas à pas

### Étape 1 — Créer le Google Sheet

1. Télécharge `sudoku-souspref-sheet-template.xlsx` (fourni à part, à côté du dossier `sudoku-souspref/`).
2. Va sur **Google Drive** (drive.google.com), connecte-toi avec ton compte.
3. **Importer le .xlsx** : Nouveau > Importer un fichier > déposer `sudoku-souspref-sheet-template.xlsx`.
4. Une fois importé, **clic droit** sur le fichier > **Ouvrir avec** > **Google Sheets**.
5. Rends le Sheet **lisible publiquement** : Fichier > Partager > Partager > « Tout utilisateur disposant du lien » > **Lecteur**.
6. **Copie l'ID du Sheet** depuis l'URL :
   ```
   https://docs.google.com/spreadsheets/d/AbCdEf...XyZ/edit
                                          ↑
                                       cet ID
   ```

### Étape 2 — Créer le repo GitHub

1. Sur github.com, **Nouveau repo** : nom au choix (`sudoku-souspref` par exemple), **public**.
2. Clone-le sur ton poste, ou utilise l'interface web pour uploader les fichiers.
3. **Pousse le contenu** de ce dossier `sudoku-souspref/` dans le repo (à la racine) :
   - `index.html`
   - `data.json`
   - `criteria.json`
   - `scripts/sync.js`
   - `.github/workflows/sync.yml`
   - `README.md`

### Étape 3 — Configurer le SHEET_ID

1. Dans ton repo GitHub : **Settings** > **Secrets and variables** > **Actions** > onglet **Variables**.
2. Clique « **New repository variable** ».
3. Nom : `SHEET_ID`. Valeur : l'ID copié à l'étape 1.
4. Sauvegarde.

> Note : on utilise une *variable* et non un *secret* car l'ID du Sheet n'est pas confidentiel (le Sheet est de toute façon public en lecture).

### Étape 4 — Activer GitHub Pages

1. **Settings** > **Pages**.
2. Source : **Deploy from a branch** > Branche : `main` (ou `master`) > Dossier : `/ (root)`.
3. Sauvegarde. Au bout d'une minute, le site est en ligne sur :
   ```
   https://<ton-pseudo>.github.io/sudoku-souspref/
   ```

### Étape 5 — Lancer la première synchronisation

1. Onglet **Actions** de ton repo.
2. Si nécessaire, clique « Enable workflows ».
3. Clique sur le workflow « Sync from Google Sheet ».
4. Bouton « **Run workflow** » > confirme.
5. Le job tourne en ~30 secondes. Si tout va bien : ✓ vert.

À partir de maintenant, le pipeline tourne **tous les jours à 03:15 UTC**, et tu peux le déclencher manuellement depuis l'onglet Actions à tout moment.

## Modifier le jeu

### Ajouter un critère booléen

Le cas le plus courant. Disons « Possède un château classé monument historique ».

1. **Dans Google Sheets**, onglet **`corpus`** : ajoute une colonne tout à droite, intitulée `k_chateau_mh` en ligne 1 (et un libellé FR en ligne 2). Remplis `TRUE` ou `FALSE` pour chacune des 334 communes.
2. **Onglet `criteres`** : ajoute une ligne :
   - id : `chateau_mh`
   - label : `Possède un château MH`
   - family : `encyclopedique` (ou autre)
   - type : `flag`
   - flag : `chateau_mh`
3. **Lance le workflow** manuellement (Actions > Run workflow), ou attends le prochain run automatique.
4. Le site se met à jour à la fin du job.

### Ajouter une paire interdite (mutex)

Si deux critères ne doivent jamais coexister dans une même grille (par construction trop restrictive ou logiquement incompatible), ajoute simplement une ligne dans l'onglet **`mutex`** avec les deux ID.

### Modifier les paramètres du générateur

Dans l'onglet **`config`**, tu peux changer :

| Clé | Effet |
|---|---|
| `min_candidates_per_cell` | Nombre minimum de communes valides par case (défaut : 5). Augmente pour des grilles plus faciles. |
| `max_per_family` | Nombre maximum de critères de la même famille dans une grille (défaut : 2). |
| `discovery_filter_statut` | Statut des communes éligibles à la « Découverte du jour » (`souspref` ou `pref`). |
| `discovery_exclude_flag` | Flag à exclure du pool de découverte (par défaut `plus_50k` pour ne garder que les villes méconnues). |

### Ajouter un critère paramétrique (région, code postal, etc.)

Trois types sont supportés sans toucher au code :

- **`flag`** : test sur une colonne booléenne (cas standard ci-dessus).
- **`field_eq`** : test d'égalité sur un champ (ex. `r === '11'` pour Île-de-France). Ajouter id, label, family, type=`field_eq`, field=`r`, value=`11`.
- **`cp_first`** : test sur le premier chiffre du code postal. Ajouter id=`cp_X`, label=`...`, type=`cp_first`, value=`X`.

Pour des règles plus complexes (« à moins de N km de »), il faudrait étendre le compilateur dans `index.html` (fonction `compileCriterion`).

## Tester en local

`index.html` charge `data.json` et `criteria.json` via `fetch()`, ce qui ne marche pas en `file://`. Pour tester sans serveur distant :

```bash
cd sudoku-souspref
python3 -m http.server 8000
# puis ouvre http://localhost:8000
```

Pour tester `scripts/sync.js` en local :

```bash
SHEET_ID=AbCdEf...XyZ node scripts/sync.js
```

## Mises à jour du corpus

Le corpus (334 communes) est lui-même éditable depuis l'onglet `corpus`. Pour modifier la population de Vichy ou ajouter une cathédrale oubliée à Tarbes, c'est dans le Sheet.

Si tu veux ajouter une commune au corpus (par exemple intégrer Saint-Pierre-et-Miquelon ou Saint-Martin), il faut une nouvelle ligne dans `corpus` avec tous les champs renseignés (i, n, nn, s, d, dn, r, rn et tous les `k_*`).

## Variables d'environnement requises (rappel)

| Variable GitHub | Type | Valeur |
|---|---|---|
| `SHEET_ID` | Repository variable | L'ID du Google Sheet (depuis l'URL) |

## Cycle complet en cas de modification

1. Tu édites le Sheet (ajout d'un critère, correction d'un flag, etc.).
2. Tu lances le workflow (manuel ou attends le cron).
3. `sync.js` fetch les 5 onglets, reconstruit `data.json` + `criteria.json`.
4. Si différence → commit + push.
5. GitHub Pages redéploie automatiquement.
6. Le lendemain, la grille intègre tes changements (ou immédiatement si on supprime le cache localStorage de l'utilisateur).

## Dépannage

- **« Onglet "corpus" : HTTP 400 »** dans le log du workflow → le Sheet n'est pas partagé en lecture publique, ou le SHEET_ID est faux.
- **Le workflow ne démarre pas automatiquement** → vérifie qu'il est activé dans Actions, et que `permissions: contents: write` est bien dans le YAML.
- **Le site reste figé après modification du Sheet** → Force-reload (Ctrl+Maj+R) pour vider le cache du navigateur ; le `localStorage` conserve la progression du jour mais pas la grille elle-même, donc un reload suffit.

## Crédits & licence

- Données INSEE 2022 (Licence Ouverte / Etalab)
- Centroïdes communaux : `gregoiredavid/france-geojson`
- Altitudes : sql.sh + Wikipédia
- Inspiration de jeu : `metrodoku.fr`

Code sous licence ouverte. Réutilisation libre avec mention.
