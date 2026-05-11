#!/usr/bin/env node
/**
 * Sync Google Sheet → data.json + criteria.json
 *
 * Variables d'environnement attendues :
 *   SHEET_ID  — l'ID du Google Sheet (depuis l'URL, entre /d/ et /edit).
 *
 * Le Sheet doit être partagé en « Tout utilisateur disposant du lien » en lecture.
 * Aucune authentification API requise — on passe par l'export CSV public (gviz/tq).
 */

const fs = require('fs');
const path = require('path');

const SHEET_ID = process.env.SHEET_ID;
if (!SHEET_ID) {
  console.error('Erreur : variable SHEET_ID non définie.');
  process.exit(1);
}

const SHEET_BASE = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=`;

/* ─── Parser CSV minimal (gestion des guillemets et virgules dans champs) ── */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQ = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') { inQ = true; }
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\r') { /* ignore */ }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else { cur += ch; }
    }
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  // Filtrer les lignes complètement vides
  return rows.filter(r => r.some(v => v && v.trim()));
}

async function fetchSheet(name) {
  const url = SHEET_BASE + encodeURIComponent(name);
  console.log(`Fetch ${name}...`);
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(`Onglet « ${name} » : HTTP ${r.status}`);
  const text = await r.text();
  return parseCSV(text);
}

function rowsToObjects(rows, skipHelpRow = true) {
  // Deux cas possibles selon le comportement de Google Sheets gviz :
  // - Cas A (clean) : ligne 0 = clés techniques seules, ligne 1 = libellés FR (à ignorer), lignes 2+ = données.
  // - Cas B (merged) : ligne 0 = clés + libellés fusionnés ("i Code INSEE"), lignes 1+ = données directement.
  // On détecte automatiquement quel cas en regardant si la première cellule contient un espace.
  if (rows.length < 2) return [];
  const firstCell = (rows[0][0] || '').trim();
  const isMerged = /\s/.test(firstCell);
  // Dans tous les cas, on extrait juste le premier mot de chaque en-tête (= la clé technique)
  const keys = rows[0].map(k => (k || '').trim().split(/\s+/)[0]);
  const dataStart = isMerged ? 1 : (skipHelpRow ? 2 : 1);
  return rows.slice(dataStart).map(row => {
    const obj = {};
    keys.forEach((k, i) => { if (k) obj[k] = (row[i] || '').trim(); });
    return obj;
  });
}

function asBool(v) {
  return String(v).trim().toUpperCase() === 'TRUE';
}

/* ─── Conversion ──────────────────────────────────────────── */
function buildCorpus(corpusRows) {
  return corpusRows.map(row => {
    const k = {};
    Object.keys(row).forEach(key => {
      if (key.startsWith('k_')) k[key.slice(2)] = asBool(row[key]);
    });
    return {
      i:  row.i,
      n:  row.n,
      nn: row.nn,
      s:  row.s,
      d:  row.d,
      dn: row.dn,
      r:  row.r,
      rn: row.rn,
      lat: parseFloat(row.lat) || null,
      lon: parseFloat(row.lon) || null,
      k,
    };
  }).filter(c => c.i && c.n);
}

function buildCriteria(rows) {
  return rows.map(r => {
    const c = { id: r.id, label: r.label, family: r.family, type: r.type };
    if (c.type === 'flag') c.flag = r.flag;
    if (c.type === 'field_eq') { c.field = r.field; c.value = r.value; }
    if (c.type === 'cp_first') c.value = r.value;
    return c;
  }).filter(c => c.id && c.label && c.type);
}

function buildMutex(rows) {
  return rows.map(r => [r.crit_a, r.crit_b]).filter(p => p[0] && p[1]);
}

function buildConfig(rows) {
  const cfg = {};
  rows.forEach(r => { if (r.key) cfg[r.key] = r.value; });
  return cfg;
}

function buildWikiOverrides(rows) {
  const out = {};
  rows.forEach(r => { if (r.code_insee && r.wiki_title) out[r.code_insee] = r.wiki_title; });
  return out;
}

/* ─── Main ────────────────────────────────────────────────── */
(async () => {
  try {
    const [corpusRaw, criteresRaw, mutexRaw, configRaw, wikiRaw] = await Promise.all([
      fetchSheet('corpus'),
      fetchSheet('criteres'),
      fetchSheet('mutex'),
      fetchSheet('config'),
      fetchSheet('wiki_overrides'),
    ]);

    const corpusObjs   = rowsToObjects(corpusRaw);
    const criteresObjs = rowsToObjects(criteresRaw);
    const mutexObjs    = rowsToObjects(mutexRaw);
    const configObjs   = rowsToObjects(configRaw);
    const wikiObjs     = rowsToObjects(wikiRaw);

    const corpus = buildCorpus(corpusObjs);
    const criteria = buildCriteria(criteresObjs);
    const mutex_pairs = buildMutex(mutexObjs);
    const cfg = buildConfig(configObjs);
    const wiki_title_overrides = buildWikiOverrides(wikiObjs);

    // Validation minimale
    if (corpus.length < 100) throw new Error(`Corpus trop petit (${corpus.length} entrées) — vérifier l'onglet « corpus ».`);
    if (criteria.length < 5) throw new Error(`Trop peu de critères (${criteria.length}) — vérifier l'onglet « criteres ».`);

    // Construction des fichiers de sortie
    const today = new Date().toISOString().slice(0, 10);

    const dataOut = { version: 1, updated: today, corpus };
    const critOut = {
      version: 1,
      updated: today,
      criteria,
      mutex_pairs,
      wiki_title_overrides,
      min_candidates_per_cell: parseInt(cfg.min_candidates_per_cell) || 5,
      max_per_family: parseInt(cfg.max_per_family) || 2,
      discovery_filter: {
        statut: cfg.discovery_filter_statut || 'souspref',
        exclude_flag: cfg.discovery_exclude_flag || 'plus_50k',
      },
      corpus_filter: cfg.corpus_filter_statut
        ? { statut: cfg.corpus_filter_statut }
        : { statut: 'souspref' },
      stats_endpoint: cfg.stats_endpoint || '',
    };

    fs.writeFileSync(path.join(__dirname, '..', 'data.json'),
                     JSON.stringify(dataOut, null, 0));
    fs.writeFileSync(path.join(__dirname, '..', 'criteria.json'),
                     JSON.stringify(critOut, null, 2));

    console.log(`✓ data.json : ${corpus.length} communes`);
    console.log(`✓ criteria.json : ${criteria.length} critères, ${mutex_pairs.length} mutex, ${Object.keys(wiki_title_overrides).length} wiki overrides`);
    console.log(`✓ Synchronisation terminée le ${today}`);
  } catch (e) {
    console.error('✗ Erreur :', e.message);
    process.exit(1);
  }
})();
