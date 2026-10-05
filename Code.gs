/**
 * Unit 2 Day 2 — Industrial Transformation: student save/resume backend.
 * SETUP
 * 1. Create a private Google Sheet. Open Extensions > Apps Script.
 * 2. Replace Code.gs with this entire file; save.
 * 3. Project Settings > Script properties: add SHEET_ID = spreadsheet ID
 *    (the part between /d/ and /edit in its URL, not the whole URL).
 * 4. Select setupBackend in the function menu and Run; authorize it.
 *    Creates Saves and Errors tabs; generates SHARED_SECRET if absent.
 * 5. Deploy > New deployment > Web app: Execute as Me; access Anyone.
 *    Send the /exec URL and SHARED_SECRET to connect the student HTML.
 *    SHARED_SECRET is an application token, never your Google password.
 * 6. Open the /exec URL: it should return ok:true and status:"ready".
 * After code changes: Deploy > Manage deployments > Edit > New version.
 * Keep the spreadsheet private; students access the web app, not the Sheet.
 * If your district disables Anyone access, tell me before HTML integration.
 *
 * CONTRACT FOR THE FUTURE HTML
 * POST JSON as Content-Type: text/plain;charset=utf-8 (no custom headers).
 * Follow redirects; parse JSON; ONLY ok:true acknowledges a cloud save.
 * Do not use fetch no-cors: its opaque response cannot confirm saving.
 * load: {action:"load_state",secret,studentId}
 * save: {action:"save_state",secret,studentId,interactiveData:{...},
 *        baseRevision:0,requestId:"unique-client-save-id"}
 * Load before first save; use returned revision as next baseRevision.
 * Serialize/debounce saves. Retry the SAME requestId after a network failure.
 * On REVISION_CONFLICT, preserve local work and offer reload/reconciliation.
 * Never send student names. Use assigned pseudonymous IDs such as AB1234.
 * The ID/token pattern deters casual misuse; it is not student authentication.
 * Any person with the token and an ID can access that ID's work.
 * This backend stores HTML work only; Boost work goes in its Google Doc.
 */

const BACKEND = Object.freeze({
  lessonId: 'u2-day2-industrial-transformation',
  savesTab: 'Saves', errorsTab: 'Errors', maxStateChars: 45000,
  headers: ['Timestamp', 'LessonId', 'StudentId', 'Revision', 'RequestId', 'InteractiveData'],
  errorHeaders: ['Timestamp', 'Action', 'Code']
});

function setupBackend() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SHARED_SECRET')) {
    props.setProperty('SHARED_SECRET', Utilities.getUuid() + Utilities.getUuid());
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = openSpreadsheet_();
    ensureTab_(ss, BACKEND.savesTab, BACKEND.headers);
    ensureTab_(ss, BACKEND.errorsTab, BACKEND.errorHeaders);
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  console.log('Setup complete. Find SHARED_SECRET in Project Settings > Script properties.');
}

function doGet() {
  // No student data or token is exposed by GET.
  try {
    const props = PropertiesService.getScriptProperties();
    if (!props.getProperty('SHARED_SECRET')) fail_('NOT_CONFIGURED');
    const ss = openSpreadsheet_();
    if (!ss.getSheetByName(BACKEND.savesTab) || !ss.getSheetByName(BACKEND.errorsTab)) {
      fail_('NOT_CONFIGURED');
    }
    return json_({ok:true, status:'ready', lessonId:BACKEND.lessonId});
  } catch (err) { return errorResponse_(err); }
}

function doPost(e) {
  let action = '';
  try {
    const body = e && e.postData && e.postData.contents;
    if (!body || body.length > 100000) fail_('INVALID_REQUEST');
    let req;
    try { req = JSON.parse(body); } catch (_) { fail_('INVALID_JSON'); }
    if (!req || typeof req !== 'object' || Array.isArray(req)) fail_('INVALID_REQUEST');
    const secret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
    if (!secret) fail_('NOT_CONFIGURED');
    if (typeof req.secret !== 'string' || req.secret !== secret) fail_('UNAUTHORIZED');
    action = req.action;
    if (action !== 'save_state' && action !== 'load_state') fail_('INVALID_ACTION');
    const studentId = String(req.studentId || '').trim().toUpperCase();
    if (!/^[A-Z]{2,12}[0-9]{2,12}$/.test(studentId)) fail_('INVALID_STUDENT_ID');
    let serialized;
    if (action === 'save_state') {
      if (!req.interactiveData || typeof req.interactiveData !== 'object' ||
          Array.isArray(req.interactiveData)) fail_('INVALID_STATE');
      serialized = JSON.stringify(req.interactiveData);
      if (serialized.length > BACKEND.maxStateChars) fail_('STATE_TOO_LARGE');
      if (!Number.isSafeInteger(req.baseRevision) || req.baseRevision < 0) fail_('INVALID_REVISION');
      if (typeof req.requestId !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(req.requestId)) {
        fail_('INVALID_REQUEST_ID');
      }
    }
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) fail_('BUSY');
    try {
      const sheet = ensureTab_(openSpreadsheet_(), BACKEND.savesTab, BACKEND.headers);
      const rows = studentRows_(sheet, studentId);
      const latest = rows.length ? rows[rows.length - 1] : null;
      const revision = latest ? Number(latest[3]) : 0;
      if (action === 'load_state') {
        return json_({ok:true, found:!!latest, studentId:studentId,
          lessonId:BACKEND.lessonId, revision:revision,
          savedAt:latest ? new Date(latest[0]).toISOString() : null,
          interactiveData:latest ? JSON.parse(latest[5]) : null});
      }
      // A retried request must never append twice or roll back a later save.
      const previous = rows.find(row => row[4] === req.requestId);
      if (previous) {
        if (previous[5] !== serialized || Number(previous[3]) !== req.baseRevision + 1) {
          fail_('REQUEST_ID_REUSED');
        }
        return json_({ok:true, duplicate:true, revision:Number(previous[3]),
          latestRevision:revision, studentId:studentId,
          savedAt:new Date(previous[0]).toISOString()});
      }
      if (req.baseRevision !== revision) {
        return json_({ok:false, code:'REVISION_CONFLICT', latestRevision:revision,
          message:'Newer work exists. Keep local work and reload or reconcile before saving.'});
      }
      const timestamp = new Date();
      sheet.appendRow([timestamp, BACKEND.lessonId, studentId, revision + 1,
        req.requestId, serialized]);
      SpreadsheetApp.flush();
      return json_({ok:true, studentId:studentId, revision:revision + 1,
        savedAt:timestamp.toISOString()});
    } finally { lock.releaseLock(); }
  } catch (err) {
    logError_(action, err);
    return errorResponse_(err);
  }
}

function studentRows_(sheet, studentId) {
  if (sheet.getLastRow() < 2) return [];
  // Search the ID column rather than downloading every student's response.
  const matches = sheet.getRange(2, 3, sheet.getLastRow() - 1, 1)
    .createTextFinder(studentId).matchEntireCell(true).matchCase(true).findAll();
  return matches.sort((a,b) => a.getRow() - b.getRow())
    .map(cell => sheet.getRange(cell.getRow(), 1, 1, 6).getValues()[0])
    .filter(row => row[1] === BACKEND.lessonId);
}

function openSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id || !id.trim()) fail_('NOT_CONFIGURED');
  return SpreadsheetApp.openById(id.trim());
}

function ensureTab_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    const existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (existing.some((value, i) => value !== headers[i])) fail_('SHEET_HEADERS_MISMATCH');
  }
  return sheet;
}

function fail_(code) { const error = new Error(code); error.appCode = code; throw error; }
function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
function errorResponse_(err) {
  const code = err && err.appCode || 'SERVER_ERROR';
  return json_({ok:false, code:code, message:code === 'SERVER_ERROR'
    ? 'Saving service failed. Keep local work and retry; ask your teacher if this persists.' : code});
}
function logError_(action, err) {
  // Never log tokens, student responses, raw requests, or exception messages.
  const code = err && err.appCode || 'SERVER_ERROR';
  console.error(code);
  if (['UNAUTHORIZED','INVALID_JSON','INVALID_REQUEST','INVALID_ACTION'].includes(code)) return;
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(1000)) return;
    ensureTab_(openSpreadsheet_(), BACKEND.errorsTab, BACKEND.errorHeaders)
      .appendRow([new Date(), ['save_state','load_state'].includes(action) ? action : '', code]);
    SpreadsheetApp.flush();
  } catch (_) { console.error('ERROR_LOG_UNAVAILABLE'); }
  finally { if (lock.hasLock()) lock.releaseLock(); }
}
