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
 * La feuille se remplit toute seule : une ligne par engagement (horodatage, identifiant, écurie,
 * pilote 1, pilote 2, message). On peut supprimer une ligne à la main pour retirer quelqu'un.
 */

var SHEET_NAME = 'Engagements';
var MAX_SEATS = 30;
var HEADERS = ['Horodatage', 'Identifiant', 'Écurie', 'Pilote 1', 'Pilote 2', 'Message'];

function doGet() {
  return json_(list_());
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var id = clean_(body.id, 64);
    if (!id) return json_({ ok: false, error: 'invalid' });

    var lock = LockService.getScriptLock();
    lock.waitLock(8000);
    try {
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
  return { ok: true, entries: out };
}

function clean_(v, max) {
  return String(v === undefined || v === null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
