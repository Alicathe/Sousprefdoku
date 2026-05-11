/**
 * Apps Script — backend de stats du Sudoku des Sous-préfectures.
 *
 * Endpoints :
 *   GET  ?date=YYYY-MM-DD[&anon_id=xxx]
 *        → { count, avg, histogram, cell_avg, cell_count, leaderboard, your_rank }
 *   POST { date, attempts, cell_attempts, duration_ms, mode, anon_id, pseudo }
 *        → enregistre un score (pseudo obligatoire)
 *
 * Sécurité : un anon_id ne peut enregistrer qu'un score par date.
 */

const SHEET_NAME = 'scores';
const HEADERS = ['timestamp', 'date', 'attempts', 'success', 'mode', 'anon_id', 'cell_attempts', 'pseudo', 'duration_ms'];
const TOP_N = 20;

function doGet(e) {
  try {
    const sheet = ensureSheet_();
    const date = (e.parameter.date || '').trim();
    const anonId = (e.parameter.anon_id || '').trim();
    if (!date) return jsonOut_({ error: 'missing date parameter' });

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return jsonOut_({ count: 0, avg: 0, histogram: {}, cell_avg: null, cell_count: 0, leaderboard: [], your_rank: null });

    const head = data[0].map(String);
    const idx = name => head.indexOf(name);
    const rows = data.slice(1).filter(r => String(r[idx('date')]) === date);

    // Stats globales
    const attemptsList = rows.map(r => parseInt(r[idx('attempts')])).filter(n => !isNaN(n) && n > 0);
    const histogram = {};
    attemptsList.forEach(a => { histogram[a] = (histogram[a] || 0) + 1; });
    const sum = attemptsList.reduce((a, b) => a + b, 0);
    const avg = attemptsList.length ? sum / attemptsList.length : 0;

    // Stats par cellule
    let cellSum = [0,0,0,0,0,0,0,0,0];
    let cellN = [0,0,0,0,0,0,0,0,0];
    if (idx('cell_attempts') >= 0) {
      rows.forEach(r => {
        const raw = r[idx('cell_attempts')];
        if (!raw) return;
        try {
          const arr = JSON.parse(String(raw));
          if (Array.isArray(arr) && arr.length === 9) {
            for (let k = 0; k < 9; k++) {
              const v = parseInt(arr[k]);
              if (!isNaN(v) && v >= 0) { cellSum[k] += v; cellN[k] += 1; }
            }
          }
        } catch (_) {}
      });
    }
    const cellAvg = cellN.map((n, k) => n > 0 ? cellSum[k] / n : null);
    const cellCount = Math.max.apply(null, cellN);

    // Leaderboard : tri par (attempts ASC, duration_ms ASC, timestamp ASC), seules les lignes avec pseudo
    const playersAll = rows
      .map(r => ({
        pseudo: String(r[idx('pseudo')] || '').trim(),
        attempts: parseInt(r[idx('attempts')]) || 0,
        duration_ms: parseInt(r[idx('duration_ms')]) || 0,
        timestamp: String(r[idx('timestamp')] || ''),
        anon_id: String(r[idx('anon_id')] || ''),
      }))
      .filter(p => p.pseudo && p.attempts > 0);
    playersAll.sort((a, b) => {
      if (a.attempts !== b.attempts) return a.attempts - b.attempts;
      if (a.duration_ms !== b.duration_ms) return (a.duration_ms || 999999999) - (b.duration_ms || 999999999);
      return a.timestamp.localeCompare(b.timestamp);
    });

    let yourRank = null;
    const ranked = playersAll.map((p, i) => {
      const rank = i + 1;
      const isYou = anonId && p.anon_id === anonId;
      if (isYou) yourRank = rank;
      return { rank, pseudo: p.pseudo, attempts: p.attempts, duration_ms: p.duration_ms, is_you: isYou };
    });
    const leaderboard = ranked.slice(0, TOP_N).map(r => ({ rank: r.rank, pseudo: r.pseudo, attempts: r.attempts, duration_ms: r.duration_ms, is_you: r.is_you }));

    return jsonOut_({
      count: attemptsList.length,
      avg: avg,
      histogram: histogram,
      cell_avg: cellAvg,
      cell_count: cellCount,
      leaderboard: leaderboard,
      your_rank: yourRank,
      total_with_pseudo: playersAll.length,
    });
  } catch (err) {
    return jsonOut_({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const date = (body.date || '').trim();
    const attempts = parseInt(body.attempts);
    const mode = (body.mode || 'sudoku').toString();
    const anonId = (body.anon_id || '').toString();
    const cellAttempts = body.cell_attempts;
    const durationMs = parseInt(body.duration_ms) || 0;
    const pseudo = String(body.pseudo || '').trim();

    if (!date || !attempts || !anonId) {
      return jsonOut_({ ok: false, error: 'missing field' });
    }
    if (attempts < 1 || attempts > 200) {
      return jsonOut_({ ok: false, error: 'invalid attempts' });
    }
    // Pseudo obligatoire : 3-20 chars, lettres/chiffres/tirets/underscores
    if (!pseudo || pseudo.length < 3 || pseudo.length > 20 || !/^[a-zA-Z0-9_-]+$/.test(pseudo)) {
      return jsonOut_({ ok: false, error: 'invalid pseudo' });
    }

    const sheet = ensureSheet_();
    const data = sheet.getDataRange().getValues();
    const head = data[0].map(String);
    const idxDate = head.indexOf('date');
    const idxAnon = head.indexOf('anon_id');

    const exists = data.slice(1).some(r => String(r[idxDate]) === date && String(r[idxAnon]) === anonId);
    if (exists) return jsonOut_({ ok: false, error: 'already_scored' });

    let cellSerialized = '';
    if (Array.isArray(cellAttempts) && cellAttempts.length === 9) {
      const valid = cellAttempts.every(v => Number.isInteger(v) && v >= 0 && v <= 200);
      if (valid) cellSerialized = JSON.stringify(cellAttempts);
    }

    sheet.appendRow([
      new Date().toISOString(),  // timestamp
      date,                      // YYYY-MM-DD
      attempts,                  // total essais
      true,                      // success
      mode,                      // 'sudoku'
      anonId,                    // identifiant anonyme
      cellSerialized,            // JSON 9 entiers
      pseudo,                    // pseudo joueur
      durationMs,                // durée en ms
    ]);
    return jsonOut_({ ok: true });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

/* ─── Helpers ─────────────────────────────────────────────── */

function ensureSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    return sheet;
  }
  // Migration : ajout des colonnes manquantes si nécessaire
  const head = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  HEADERS.forEach(h => {
    if (head.indexOf(h) < 0) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
    }
  });
  return sheet;
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
