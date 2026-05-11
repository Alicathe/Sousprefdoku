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
| `corpus_filter_statut` | Filtre du corpus principal (`souspref` ou `pref` ou vide pour tout). |
| `stats_endpoint` | URL de l'endpoint Apps Script qui agrège les scores (vide = stats locales uniquement). Voir section « Stats joueurs » plus bas. |

### Coordonnées géographiques (lat/lon)

L'onglet `corpus` du Google Sheet contient **deux colonnes obligatoires** : `lat` et `lon` (en degrés décimaux, WGS84). Elles sont utilisées par la **mini-carte de France** pour positionner chaque commune placée dans la grille.

- Format : `43.492353` (latitude), `-1.465895` (longitude)
- Source recommandée : centroïdes communaux de l'INSEE / GeoFLA
- Pour une nouvelle commune ajoutée au corpus, renseigner ces deux colonnes sinon le point n'apparaîtra pas sur la mini-carte.

### Ajouter un critère paramétrique (région, code postal, etc.)

Trois types sont supportés sans toucher au code :

- **`flag`** : test sur une colonne booléenne (cas standard ci-dessus).
- **`field_eq`** : test d'égalité sur un champ (ex. `r === '11'` pour Île-de-France). Ajouter id, label, family, type=`field_eq`, field=`r`, value=`11`.
- **`cp_first`** : test sur le premier chiffre du code postal. Ajouter id=`cp_X`, label=`...`, type=`cp_first`, value=`X`.

Pour des règles plus complexes (« à moins de N km de »), il faudrait étendre le compilateur dans `index.html` (fonction `compileCriterion`).

## Stats joueurs (optionnel) — backend Apps Script

Le jeu enregistre par défaut tes stats personnelles (streak, meilleur score, distribution) dans `localStorage` côté joueur. Pour activer en plus la **comparaison avec les autres joueurs** (« Top X% des joueurs aujourd'hui »), il faut un mini backend qui agrège les scores. Le plus simple : un Google Apps Script attaché à un Sheet.

### Étape 1 — Créer le Sheet de scores

1. Sur Google Drive, crée un nouveau Sheet vierge nommé par exemple `sousprefdoku-scores`. *Tu peux aussi réutiliser ton Sheet de configuration existant.*
2. Pas besoin de structurer les colonnes — le script créera l'onglet `scores` automatiquement à la première écriture.

### Étape 2 — Coller le code Apps Script

1. Dans ton Sheet, menu **Extensions → Apps Script**.
2. Supprime le code par défaut, colle le contenu de `scripts/scores.gs` (fourni à la racine de ce repo).
3. Bouton 💾 « Enregistrer le projet ». Donne un nom au projet (ex. `sousprefdoku-stats`).

### Étape 3 — Déployer comme application web

1. En haut à droite : **Déployer → Nouveau déploiement**.
2. Engrenage à côté de « Sélectionner le type » → choisis **Application web**.
3. Configuration :
   - Description : `sousprefdoku stats v1` (au choix)
   - **Exécuter en tant que** : `Moi (ton.email@gmail.com)`
   - **Qui a accès** : `Tout le monde` ⚠️ important, sinon les requêtes anonymes du jeu seront refusées.
4. Bouton **Déployer**. Première fois, il te demande d'autoriser le script à accéder à ton Sheet : tu acceptes (ton compte Google personnel).
5. Une fenêtre te donne l'**URL de l'application web**. Format : `https://script.google.com/macros/s/AKfy.../exec`. **Copie-la**.

### Étape 4 — Brancher l'URL dans ta config

Deux moyens, au choix :

**Option A — via le Google Sheet de config (préférée)** : ouvre ton Sheet de configuration du jeu (celui avec les onglets corpus/criteres/etc.). Dans l'onglet **`config`**, ajoute une ligne :
   - key : `stats_endpoint`
   - value : ton URL Apps Script
   - description : `Endpoint Apps Script pour les stats globales`

Lance ensuite Run workflow dans Actions → l'URL est intégrée dans `criteria.json` automatiquement.

**Option B — directement dans `criteria.json`** : édite la dernière ligne, mets `"stats_endpoint": "https://script.google.com/..."`. Commit, push.

### Étape 5 — Tester

Recharge `https://alicathe.github.io/Sousprefdoku/`, joue une grille jusqu'à la fin. Clique sur « Voir mes stats » : tu dois voir un encart bleu « Top X% » (basé pour l'instant sur ton seul score, donc forcément 100 %, plus pertinent quand d'autres joueurs auront joué).

Pour vérifier que ton score a bien été enregistré : ouvre ton Sheet de scores → onglet `scores` → tu dois voir une nouvelle ligne avec timestamp, date, attempts, ton anon_id.

### Limites & sécurité

- Apps Script gratuit autorise ~20 000 requêtes/jour. Largement suffisant pour un projet perso.
- **Anti-tricherie minimal** : un même `anon_id` (généré aléatoirement par navigateur, stocké en localStorage) ne peut enregistrer **qu'un seul score par date**. Quelqu'un qui veut tricher peut juste vider son localStorage entre deux essais — c'est volontairement léger.
- Aucune authentification, aucune donnée personnelle collectée. Juste : timestamp, date, nb d'essais, identifiant anonyme.

### Si tu veux désactiver

Vide simplement `stats_endpoint` dans la config. Le jeu retombe en mode « stats locales uniquement », sans rien casser.

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
