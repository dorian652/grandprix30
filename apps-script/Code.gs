/**
 * Grand Prix de nos 30 ans : enregistrement des engagements par écurie.
 *
 * Installation (une seule fois, environ 5 minutes) :
 *  1. Créer une feuille Google Sheets vide, nommée par exemple « GP 30 ans - Engagements ».
 *  2. Menu Extensions > Apps Script. Supprimer le contenu, coller ce fichier, enregistrer (icône disquette).
 *  3. Bouton bleu « Déployer » > « Nouveau déploiement » > type « Application Web ».
 *     - Exécuter en tant que : Moi
 *     - Qui a accès : Tout le monde
 *     > Déployer. Autoriser l'accès quand Google le demande (compte > Paramètres avancés > Accéder au projet).
 *  4. Copier l'URL « Application Web » (elle se termine par /exec) et l'envoyer à Dorian :
 *     elle est collée dans index.html (constante API_URL).
 *
 * Mode organisateur : sur le site, ajouter #admin à l'adresse, saisir le code ADMIN_PIN ci-dessous,
 * et une croix apparaît sur chaque inscription et chaque chrono pour les retirer.
 *
 * La feuille se remplit toute seule :
 *  - onglet « Engagements » : une ligne par engagement (horodatage, identifiant, écurie, pilote 1, pilote 2, message) ;
 *  - onglet « PitStop » : une ligne par participant au concours (horodatage, identifiant, prénom, nom, temps en ms).
 * On peut supprimer une ligne à la main pour retirer quelqu'un.
 */

var ADMIN_PIN = 'A-REMPLACER';   // code organisateur : à définir avant de déployer (chiffres ou lettres, entre apostrophes)
var SHEET_NAME = 'Engagements';
var PIT_SHEET = 'PitStop';
var MAX_SEATS = 30;
var HEADERS = ['Horodatage', 'Identifiant', 'Écurie', 'Pilote 1', 'Pilote 2', 'Message'];
var PIT_HEADERS = ['Horodatage', 'Identifiant', 'Prénom', 'Nom', 'Temps (ms)'];

function doGet() {
  return json_(list_());
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var id = clean_(body.id, 64);
    if (!id) return json_({ ok: false, error: 'invalid' });

    if (body.action === 'admin_check') {
      return json_({ ok: String(body.pin) === ADMIN_PIN, error: String(body.pin) === ADMIN_PIN ? undefined : 'pin' });
    }
    if (body.action === 'admin_delete' || body.action === 'admin_delete_pit') {
      if (String(body.pin) !== ADMIN_PIN) return json_({ ok: false, error: 'pin' });
      var target = clean_(body.target, 64);
      var tsh = body.action === 'admin_delete' ? sheet_() : pitSheet_();
      var trows = tsh.getDataRange().getValues();
      for (var t = trows.length - 1; t >= 1; t--) {
        if (String(trows[t][1]) === target) tsh.deleteRow(t + 1);
      }
      return json_(list_());
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(8000);
    try {
      if (body.action === 'pitstop') {
        var first = clean_(body.first, 40), last = clean_(body.last, 40), ms = Math.round(Number(body.ms));
        if (!first || !last || !(ms > 0) || ms > 600000) return json_({ ok: false, error: 'invalid' });
        var ps = pitSheet_();
        var prow = ps.getDataRange().getValues();
        var pIndex = -1;
        for (var k = 1; k < prow.length; k++) { if (String(prow[k][1]) === id) { pIndex = k + 1; break; } }
        if (pIndex > 0 && Number(prow[pIndex - 1][4]) <= ms) return json_(list_());
        var prowData = [new Date(), id, first, last, ms];
        if (pIndex > 0) ps.getRange(pIndex, 1, 1, prowData.length).setValues([prowData]);
        else ps.appendRow(prowData);
        return json_(list_());
      }
      var sh = sheet_();
      var rows = sh.getDataRange().getValues();
      var rowIndex = -1;
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][1]) === id) { rowIndex = i + 1; break; }
      }

      if (body.action === 'delete') {
        if (rowIndex > 0) sh.deleteRow(rowIndex);
        return json_(list_());
      }

      var team = clean_(body.team, 40);
      var pilot1 = clean_(body.pilot1, 40);
      var pilot2 = clean_(body.pilot2, 40);
      var note = clean_(body.note, 200);
      if (!team || !pilot1) return json_({ ok: false, error: 'invalid' });

      var taken = 0;
      for (var j = 1; j < rows.length; j++) {
        if (String(rows[j][2]) === team && String(rows[j][1]) !== id) {
          taken += rows[j][4] ? 2 : 1;
        }
      }
      var need = pilot2 ? 2 : 1;
      if (taken + need > MAX_SEATS) return json_({ ok: false, error: 'full' });

      var row = [new Date(), id, team, pilot1, pilot2, note];
      if (rowIndex > 0) sh.getRange(rowIndex, 1, 1, row.length).setValues([row]);
      else sh.appendRow(row);
    } finally {
      lock.releaseLock();
    }
    return json_(list_());
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function pitSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(PIT_SHEET);
  if (!sh) sh = ss.insertSheet(PIT_SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow(PIT_HEADERS);
    sh.getRange(1, 1, 1, PIT_HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function pitList_() {
  var rows = pitSheet_().getDataRange().getValues();
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[1] || !(Number(r[4]) > 0)) continue;
    out.push({ id: String(r[1]), first: String(r[2]), last: String(r[3]), ms: Number(r[4]) });
  }
  out.sort(function (a, b) { return a.ms - b.ms; });
  return out.slice(0, 50);
}

function list_() {
  var sh = sheet_();
  var rows = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[1]) continue;
    out.push({
      id: String(r[1]),
      team: String(r[2]),
      pilot1: String(r[3]),
      pilot2: String(r[4] || ''),
      note: String(r[5] || ''),
      at: r[0] instanceof Date ? r[0].toISOString() : String(r[0])
    });
  }
  return { ok: true, entries: out, pitstop: pitList_() };
}

function clean_(v, max) {
  return String(v === undefined || v === null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
