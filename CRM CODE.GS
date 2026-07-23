
/**************************************************************
 * MK JEWELS CRM SYSTEM
 * CODE.GS — FULL UPDATED FILE
 *
 * IMPORTANT FIXES IN THIS VERSION:
 * 1) Historical Backfill / Rebuild clears CRM sheets and rebuilds ALL source rows.
 * 2) Incremental Sync DOES NOT clear CRM sheets.
 *    It only adds WALKIN DATASET rows whose REFERENCE NUMBER is not already
 *    present in CLIENT TIMELINE column N.
 * 3) Reset CRM Completely clears data rows and keeps headers.
 * 4) REFERENCE NUMBER is read from WALKIN DATASET column DY first.
 * 5) CLIENT TIMELINE column N uses the same DY reference number.
 **************************************************************/

/** ==========================================================
 *  CONFIG
 *  ==========================================================
 */
const CRM_CONFIG = {
  // ===== CRM FILE =====
  CRM_SPREADSHEET_ID: '1Vsg2jXyDL1JuKv57z7QFa1OO3X6E7JsxSij1hvWAAeE',

  // ===== SOURCE WALK-IN FILE =====
  WALKIN_SPREADSHEET_ID: '1ILCK8wTd_njc6CHy53ujqYgJQkkd5DC4_Iv6YgL8LB4',
  WALKIN_SHEET_NAME: 'WALKIN DATASET',
  ENTRY_LOG_SHEET_NAME: 'CLIENT ENTRY LOG',

  // ===== EXISTING LIVE WALK-IN WEB APP =====
  WALKIN_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbwdyzI7jyi5pmVOeNKplw3hc2xyv6GsE_N2e2FWLU8xDChPf6NZAvs8uaz8HLx1Isp0/exec',



  // ===== CRM SHEETS =====
  SHEETS: {
    MASTER: 'CLIENT DATABASE MASTER',
    TIMELINE: 'CLIENT TIMELINE',
    EDIT_LOG: 'CLIENT PROFILE EDIT LOG',
    DASHBOARD_CACHE: 'DASHBOARD CACHE'
  },

  // ===== SCRIPT STATE =====
  PROP_LAST_SYNC_TS: 'MK_CRM_LAST_SYNC_TS',
  PROP_CLIENT_ID_COUNTER: 'MK_CRM_CLIENT_ID_COUNTER',
  PROP_WALKIN_SOURCE_ID_OVERRIDE: 'MK_CRM_WALKIN_SOURCE_ID_OVERRIDE',
  PROP_CRM_DAILY_AVAILABILITY_PREFIX: 'MK_CRM_DAILY_AVAILABILITY_',
  PROP_CUSTOM_BRANCH_CRM_MASTER: 'MK_CRM_CUSTOM_BRANCH_CRM_MASTER',
  PROP_BRANCH_CRM_MASTER_OVERRIDE: 'MK_CRM_BRANCH_CRM_MASTER_OVERRIDE',

  // ===== MATCHING =====
  PHONE_KEY_DIGITS: 10,
  CLIENT_ID_PREFIX: 'MKC',
  CLIENT_ID_START: 100001,

  // ===== SOURCE LAYOUT =====
  SOURCE_HEADER_ROW: 1,
  SOURCE_DATA_START_ROW: 2,
  SOURCE_MIN_COLS: 132,
  SOURCE_REFERENCE_COL: 129, // DY
  SOURCE_LEGACY_REFERENCE_COLS: [123], // DS old Project-1 reference location
  SOURCE_CRM_CLIENT_ID_COL: 2, // B

  // ===== GENERAL =====
  TIMEZONE: Session.getScriptTimeZone() || 'Asia/Kolkata',
  CACHE_TTL_SEC: 300,

  // ===== SOURCE COLUMN CANDIDATES =====
  SOURCE_HEADERS: {
    crmClientId: ['CRM CLIENT ID', 'CLIENT ID'],
    referenceNumber: ['REFERENCE NUMBER', 'REFERENCE_NO', 'REFERENCE', 'REF NO', 'REF NUMBER'],
    timestamp: ['TIMESTAMP'],
    visitDate: ['CLIENT VISIT DATE', 'VISIT DATE'],
    sourceLead: ['SOURCE OF LEAD'],
    sourceOther: ['SOURCE (OTHER)'],
    referenceName: ['REFERENCE NAME'],
    referencePhone: ['REFERENCE PHONE'],
    branch: ['BRANCH'],
    crmName: ['CRM NAME'],
    clientName: ['CLIENT NAME', 'NAME OF THE CLIENT', 'CLIENT FULL NAME', 'CUSTOMER NAME', 'NAME'],
    gender: ['GENDER'],
    clientPhone: ['CLIENT PHONE', 'PHONE NUMBER OF THE CLIENT', 'MOBILE NUMBER', 'MOBILE', 'CONTACT NUMBER', 'CONTACT NO', 'PHONE NUMBER', 'CLIENT MOBILE'],
    billingPhone: ['BILLING PHONE', 'BILLING PHONE NUMBER', 'BILLING MOBILE', 'BILLING CONTACT NUMBER', 'BILLING CONTACT NO'],
    country: ['COUNTRY'],
    state: ['STATE'],
    city: ['CITY'],
    cityOther: ['CITY (OTHER)'],
    pincode: ['PINCODE'],
    address: ['ADDRESS', 'ADDRESS OF THE CLIENT'],
    community: ['COMMUNITY'],
    communityOther: ['COMMUNITY (OTHER)'],
    dob: ['DOB', 'DATE OF BIRTH'],
    anniversary: ['ANNIVERSARY', 'DATE OF ANNIVERSARY'],
    salesperson: ['SALESPERSON', 'SALESPERSON ATTENDING THE CLIENT'],
    buyStatus: ['FINAL STATUS', 'CLIENT BOUGHT ANY PRODUCT?'],
    notBoughtReasons: ['NOT BOUGHT REASONS', 'NOT BOUGHT REASONS (FINAL)'],
    repairApproach: ['REPAIR/ORDER APPROACH'],
    newThingsChoice: ['NEW THINGS CHOICE'],
    newThingsSalesperson: ['NEW THINGS SALESPERSON'],
    seenCategories: ['SEEN CATEGORIES', 'SEEN CATEGORIES (FINAL)'],
    seenProductsCount: ['SEEN PRODUCTS COUNT'],
    seenTags: ['SEEN TAGS (COMBINED)'],
    seenOtherText: ['SEEN OTHER TEXT'],
    boughtCategories: ['BOUGHT CATEGORIES', 'BOUGHT CATEGORIES(FINAL)'],
    boughtProductsCount: ['BOUGHT PRODUCTS COUNT'],
    boughtTags: ['BOUGHT TAGS (COMBINED)'],
    boughtOtherText: ['BOUGHT OTHER TEXT'],
    orderCategories: ['ORDER/NEW THINGS CATEGORIES', 'OTHER/ NEW PRODUCTS'],
    orderCount: ['ORDER/NEW THINGS COUNT'],
    orderTags: ['ORDER/NEW THINGS TAGS (COMBINED)'],
    orderOtherText: ['ORDER/NEW THINGS OTHER TEXT'],
    otherOrder: ['OTHER ORDER'],
    marketingMessage: ['MARKETING MESSAGE'],
    instagramAsked: ['INSTAGRAM FOLLOW ASKED'],
    instagramReason: ['INSTAGRAM FOLLOW - NO REASON'],
    instagramProof: ['INSTAGRAM FOLLOW - PROOF URL'],
    googleReviewAsked: ['GOOGLE REVIEW ASKED'],
    googleReviewReason: ['GOOGLE REVIEW - NO REASON'],
    googleReviewProof: ['GOOGLE REVIEW - SCREENSHOT URL'],
    testimonialAsked: ['TESTIMONIAL ASKED'],
    testimonialReason: ['TESTIMONIAL - NO REASON'],
    testimonialProof: ['TESTIMONIAL - MEDIA URL'],
    feedbackAsked: ['FEEDBACK FORM ASKED'],
    feedbackReason: ['FEEDBACK FORM - NO REASON'],
    feedbackProof: ['FEEDBACK FORM - SCREENSHOT URL'],
    thankyouAsked: ['THANK-YOU NOTE GIVEN'],
    thankyouReason: ['THANK-YOU NOTE - NO REASON'],
    thankyouProof: ['THANK-YOU NOTE - PHOTO URL'],
    referralsAsked: ['REFERRALS ASKED'],
    referralsReason: ['REFERRALS - NO REASON'],
    referralsProof: ['REFERRALS - PROOF URL'],
    beverage: ['BEVERAGE', 'BEVERAGE (FINAL)'],
    beverageOther: ['BEVERAGE (OTHER)'],
    sugar: ['SUGAR', 'SUGAR (FINAL)'],
    sugarOther: ['SUGAR (OTHER)'],
    snack: ['SNACK', 'SNACK (FINAL)'],
    snackOther: ['SNACK (OTHER)'],
    giftGiven: ['GIFT GIVEN', 'GIFT GIVEN (FINAL)'],
    giftOther: ['GIFT (OTHER)'],
    nextVisitDate: ['NEXT VISIT DATE'],
    clientPotentialCategory: ['CLIENT POTENTIAL CATEGORY'],
    highPotentialReason: ['WHY IS THIS CLIENT A HIGH-POTENTIAL BUYER?'],
    remark: ['REMARK'],
    upload: ['UPLOAD'],
    productRequirement: ['PRODUCT REQUIREMENT', 'REQUIREMENTS OF CLIENT'],
    otherStoreVisit: ['OTHER STORE CLIENT WANTS TO VISIT', 'IF CLIENT WANTS TO VISIT ANOTHER STORE'],
    moreDesignCategories: ['WHICH CATEGORIES CLIENT WANT TO SEE MORE'],
    profileUpdatedBy: ['PROFILE UPDATED BY', 'UPDATED BY', 'CRM NAME']
  }
};

/** ==========================================================
 *  CORE SPREADSHEET HELPERS
 *  ==========================================================
 */
function getCrmSpreadsheet_() {
  return SpreadsheetApp.openById(CRM_CONFIG.CRM_SPREADSHEET_ID);
}

function extractSpreadsheetId_(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  const match = text.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];

  return text.replace(/[^a-zA-Z0-9-_]/g, '');
}

function getEffectiveWalkinSpreadsheetId_() {
  const props = PropertiesService.getScriptProperties();
  const overrideId = String(props.getProperty(CRM_CONFIG.PROP_WALKIN_SOURCE_ID_OVERRIDE) || '').trim();
  return overrideId || CRM_CONFIG.WALKIN_SPREADSHEET_ID;
}

function getWalkinSpreadsheet_() {
  return SpreadsheetApp.openById(getEffectiveWalkinSpreadsheetId_());
}

function getWalkinSourceSheet_() {
  const ss = getWalkinSpreadsheet_();
  const sh = ss.getSheetByName(CRM_CONFIG.WALKIN_SHEET_NAME);
  if (!sh) throw new Error(`Source sheet not found: ${CRM_CONFIG.WALKIN_SHEET_NAME}`);
  return sh;
}

function getWalkinSheet_(sheetName) {
  const ss = getWalkinSpreadsheet_();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error(`Walk-in sheet not found: ${sheetName}`);
  return sh;
}

function getCrmSheet_(sheetName) {
  const ss = getCrmSpreadsheet_();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error(`CRM sheet not found: ${sheetName}`);
  return sh;
}

/** ==========================================================
 *  MASTER / TIMELINE / EDIT LOG HEADERS
 *  ==========================================================
 */
function getMasterHeaders_() {
  return [
    'CLIENT ID',
    'PHONE KEY',
    'NAME KEY',
    'PRIMARY NAME',
    'OTHER NAMES',
    'PRIMARY PHONE',
    'SECONDARY PHONE',
    'BILLING PHONE',
    'OTHER KNOWN PHONES',
    'GENDER',
    'COUNTRY',
    'STATE',
    'CITY',
    'CITY OTHER',
    'PINCODE',
    'ADDRESS',
    'COMMUNITY',
    'COMMUNITY OTHER',
    'DOB',
    'ANNIVERSARY',
    'BEVERAGE',
    'SUGAR',
    'SNACK',
    'GIFT HISTORY',
    'FIRST VISIT DATE',
    'LAST VISIT DATE',
    'TOTAL VISITS',
    'TOTAL PURCHASE VISITS',
    'TOTAL NON PURCHASE VISITS',
    'TOTAL REPAIR VISITS',
    'TOTAL ORDER VISITS',
    'LAST BUY STATUS',
    'LAST BRANCH',
    'LAST CRM',
    'LAST SALESPERSON',
    'LAST REMARK',
    'LAST PRODUCT REQUIREMENT',
    'LAST SEEN CATEGORIES',
    'LAST BOUGHT CATEGORIES',
    'LAST ORDER CATEGORIES',
    'CLIENT POTENTIAL CATEGORY',
    'HIGH POTENTIAL REASON',
    'INSTAGRAM STATUS',
    'GOOGLE REVIEW STATUS',
    'TESTIMONIAL STATUS',
    'REFERRAL STATUS',
    'NEXT VISIT DATE',
    'PROFILE LAST UPDATED ON',
    'PROFILE UPDATED BY'
  ];
}

function getTimelineHeaders_() {
  return [
    'TIMESTAMP',
    'CLIENT ID',
    'EVENT DATE',
    'EVENT TYPE',
    'BUY STATUS',
    'BRANCH',
    'CRM NAME',
    'SALESPERSON',
    'SEEN CATEGORIES',
    'BOUGHT CATEGORIES',
    'ORDER CATEGORIES',
    'PRODUCT REQUIREMENT',
    'REMARK',
    'REFERENCE NUMBER'
  ];
}

function getEditLogHeaders_() {
  return [
    'TIMESTAMP',
    'CLIENT ID',
    'EDITED BY',
    'SOURCE',
    'FIELD NAME',
    'OLD VALUE',
    'NEW VALUE'
  ];
}

function getDashboardCacheHeaders_() {
  return [
    'CACHE KEY',
    'CACHE VALUE',
    'UPDATED ON'
  ];
}

/** ==========================================================
 *  MENU
 *  ==========================================================
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('MK CRM')
    .addItem('Initialize CRM Sheets', 'initializeCrmSystemManual')
    .addSeparator()
    .addItem('Set Walk-in Source File ID', 'setWalkinSourceSpreadsheetIdManual')
    .addItem('Check Walk-in Source File', 'debugOpenExactWalkinSourceUrl')
    .addItem('Walk-in Import Audit', 'debugWalkinImportAudit')
    .addItem('Check Edit Entry Reference Lookup', 'debugWalkinEditReferenceLookupManual')
.addSeparator()
.addItem('Clear CRM Client IDs From Source', 'clearWalkinCrmClientIdsManual')
    .addSeparator()
    .addItem('Reset CRM Completely', 'resetCrmCompletelyManual')
    .addItem('Rebuild CRM From Walk-in Source', 'rebuildCrmFromWalkinSourceManual')
    .addItem('Historical Backfill Sync', 'runHistoricalBackfillManual')
    .addItem('Incremental Sync', 'runIncrementalSyncManual')
    .addSeparator()
    .addItem('Sync Not Bought Followups Now', 'syncNotBoughtFollowupsFromWalkinManual')
    .addItem('Move Closed Not Bought To Closed Sheet', 'moveClosedNotBoughtFollowupsToLeadsManual')
    .addItem('Import Legacy Not Bought Followups', 'importLegacyNotBoughtFollowupsManual')
    .addSeparator()
    .addItem('Install 5 Min Sync Trigger', 'installIncrementalSyncTrigger')
    .addItem('Install Not Bought Auto Sync Trigger', 'installNotBoughtFollowupAutoSyncTrigger')
    .addToUi();
}

/** ==========================================================
 *  INITIALIZATION
 *  ==========================================================
 */
function initializeCrmSystem(showAlert) {
  const ss = getCrmSpreadsheet_();

  ensureSheetWithHeaders_(ss, CRM_CONFIG.SHEETS.MASTER, getMasterHeaders_());
  ensureSheetWithHeaders_(ss, CRM_CONFIG.SHEETS.TIMELINE, getTimelineHeaders_());
  ensureSheetWithHeaders_(ss, CRM_CONFIG.SHEETS.EDIT_LOG, getEditLogHeaders_());
  ensureSheetWithHeaders_(ss, CRM_CONFIG.SHEETS.DASHBOARD_CACHE, getDashboardCacheHeaders_());

  if (showAlert === true) {
    SpreadsheetApp.getUi().alert('CRM sheets initialized successfully.');
  }
}

function ensureSheetWithHeaders_(ss, sheetName, headers) {
  let sh = ss.getSheetByName(sheetName);
  if (!sh) sh = ss.insertSheet(sheetName);

  const lastCol = headers.length;
  const existing = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const mismatch = headers.some((h, i) => String(existing[i] || '').trim() !== h);

  if (sh.getLastRow() === 0 || mismatch) {
    sh.getRange(1, 1, 1, lastCol).setValues([headers]);
    sh.setFrozenRows(1);
  }
}

/** ==========================================================
 *  SOURCE FILE SETUP / AUDIT
 *  ==========================================================
 */
function setWalkinSourceSpreadsheetIdManual() {
  const ui = SpreadsheetApp.getUi();

  const res = ui.prompt(
    'Set Walk-in Source File ID',
    'Paste the Google Sheet URL or Spreadsheet ID of the file that contains the full WALKIN DATASET.',
    ui.ButtonSet.OK_CANCEL
  );

  if (res.getSelectedButton() !== ui.Button.OK) return;

  const input = res.getResponseText();
  const id = extractSpreadsheetId_(input);

  if (!id) {
    ui.alert('Invalid source ID / URL.');
    return;
  }

  const ss = SpreadsheetApp.openById(id);
  const sh = ss.getSheetByName(CRM_CONFIG.WALKIN_SHEET_NAME);

  if (!sh) {
    ui.alert('This file opened, but WALKIN DATASET sheet was not found.');
    return;
  }

  PropertiesService.getScriptProperties()
    .setProperty(CRM_CONFIG.PROP_WALKIN_SOURCE_ID_OVERRIDE, id);

  ui.alert(
    'Walk-in source file saved successfully.\n\n' +
    'File: ' + ss.getName() + '\n' +
    'Sheet: ' + sh.getName() + '\n' +
    'Max Rows: ' + sh.getMaxRows() + '\n' +
    'Last Row: ' + sh.getLastRow() + '\n\n' +
    'Now run: Walk-in Import Audit'
  );
}

function debugOpenExactWalkinSourceUrl() {
  const ss = getWalkinSpreadsheet_();
  const sh = ss.getSheetByName(CRM_CONFIG.WALKIN_SHEET_NAME);

  if (!sh) {
    SpreadsheetApp.getUi().alert('WALKIN DATASET sheet not found in source file.');
    return;
  }

  const msg =
    'PROJECT 2 IS READING THIS FILE:\n\n' +
    ss.getUrl() + '\n\n' +
    'EFFECTIVE SPREADSHEET ID: ' + getEffectiveWalkinSpreadsheetId_() + '\n' +
    'SPREADSHEET NAME: ' + ss.getName() + '\n' +
    'SHEET NAME: ' + sh.getName() + '\n' +
    'SHEET ID / GID: ' + sh.getSheetId() + '\n' +
    'MAX ROWS: ' + sh.getMaxRows() + '\n' +
    'LAST ROW: ' + sh.getLastRow() + '\n' +
    'LAST COL: ' + sh.getLastColumn();

  Logger.log(msg);
  SpreadsheetApp.getUi().alert(msg);
}

/** ==========================================================
 *  PUBLIC SYNC RUNNERS
 *  ==========================================================
 */
function runHistoricalBackfill() {
  return rebuildCrmFromWalkinSource();
}

function runIncrementalSync() {
  initializeCrmSystem(false);

  const lock = LockService.getScriptLock();
  const gotLock = lock.tryLock(120000);

  if (!gotLock) {
    return {
      ok: false,
      processedCount: 0,
      skippedNoRef: 0,
      skippedExistingRef: 0,
      sourceRowsRead: 0,
      masterClients: 0,
      message: 'Another CRM sync/rebuild is already running. Please wait 2 minutes and run again.'
    };
  }

  try {
    const sourceRows = readAllWalkinRows_();
    const masterState = readMasterState_();
    const timelineRefSet = readTimelineReferenceSet_();

    const outTimelineRows = [];
    const outEditLogRows = [];

    let processedCount = 0;
    let skippedNoRef = 0;
    let skippedExistingRef = 0;

    sourceRows.forEach(rowObj => {
      const normalized = normalizeWalkinRow_(rowObj);

      if (!normalized.referenceNumber) {
        skippedNoRef++;
        return;
      }

      const refKey = String(normalized.referenceNumber || '').trim().toUpperCase();

      // Incremental means: do not clear, do not duplicate.
      // Add only rows whose reference is not already present in CLIENT TIMELINE.
      if (timelineRefSet.has(refKey)) {
        skippedExistingRef++;
        return;
      }

      const clientId = upsertClientFromVisit_(
        masterState,
        normalized,
        outEditLogRows,
        'INCREMENTAL_SYNC'
      );

      writeClientIdBackToWalkinRow_(normalized.sourceRowNumber, clientId);

      outTimelineRows.push(buildTimelineRow_(normalized, clientId));
      timelineRefSet.add(refKey);
      processedCount++;
    });

    flushMasterState_(masterState);
    appendRowsIfAny_(getCrmSheet_(CRM_CONFIG.SHEETS.TIMELINE), outTimelineRows);
    appendRowsIfAny_(getCrmSheet_(CRM_CONFIG.SHEETS.EDIT_LOG), outEditLogRows);

    setLastSyncTs_(new Date());

    return {
      ok: true,
      processedCount,
      skippedNoRef,
      skippedExistingRef,
      sourceRowsRead: sourceRows.length,
      masterClients: masterState.rowsByClientId.size,
      message:
        'Incremental sync completed.\n\n' +
        'Source rows read: ' + sourceRows.length + '\n' +
        'New visits added: ' + processedCount + '\n' +
        'Skipped no DY / 129 reference: ' + skippedNoRef + '\n' +
        'Skipped already existing reference: ' + skippedExistingRef + '\n' +
        'Master clients: ' + masterState.rowsByClientId.size
    };

  } finally {
    lock.releaseLock();
  }
}

/** ==========================================================
 *  SOURCE READ
 *  ==========================================================
 */
function readAllWalkinRows_() {
  const sh = getWalkinSourceSheet_();

  const headerRow = CRM_CONFIG.SOURCE_HEADER_ROW;
  const dataStartRow = CRM_CONFIG.SOURCE_DATA_START_ROW;

  // IMPORTANT FIX:
  // Earlier code was reading maxRows and then filtering only a few fixed columns.
  // If a row had phone/name in a different mapped header, or DY reference was blank,
  // that walk-in was skipped and never reached CLIENT DATABASE.
  // Now we read only real lastRow for speed and keep every row that has any value.
  const lastRow = sh.getLastRow();
  const lastCol = Math.max(sh.getLastColumn(), CRM_CONFIG.SOURCE_MIN_COLS);

  if (lastRow < dataStartRow) return [];

  const headers = sh.getRange(headerRow, 1, 1, lastCol).getValues()[0].map(v => cleanHeader_(v));
  const rows = sh.getRange(dataStartRow, 1, lastRow - dataStartRow + 1, lastCol).getValues();

  return rows
    .map((row, idx) => ({
      rowNumber: dataStartRow + idx,
      raw: row,
      headers: headers,
      map: rowToHeaderMap_(headers, row)
    }))
    .filter(obj => (obj.raw || []).some(v => String(v || '').trim() !== ''));
}

function rowToHeaderMap_(headers, row) {
  const obj = {};

  headers.forEach((h, i) => {
    const key = cleanHeader_(h);
    if (!key) return;

    const newVal = row[i];

    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      obj[key] = newVal;
      return;
    }

    const oldText = asText_(obj[key]).trim();
    const newText = asText_(newVal).trim();

    if (!oldText && newText) {
      obj[key] = newVal;
    }
  });

  return obj;
}

function cleanHeader_(value) {
  return String(value || '')
    .trim()
    .replace(/[\r\n]+/g, ' ')
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function getSourceValue_(rowMap, candidateHeaders) {
  for (let i = 0; i < candidateHeaders.length; i++) {
    const key = cleanHeader_(candidateHeaders[i]);
    if (Object.prototype.hasOwnProperty.call(rowMap, key)) {
      return rowMap[key];
    }
  }
  return '';
}

function getReferenceNumberFromWalkinRow_(rowObj) {
  /************************************************************
   * FIX FOR MISSING CLIENTS IN CLIENT DATABASE:
   * 1) Prefer correct DY / column 129 reference.
   * 2) If DY is blank, check legacy DS / column 123 reference.
   * 3) If still blank, use any REFERENCE NUMBER header value.
   * 4) If still blank, scan the row for MK reference format.
   * 5) If still blank, create a stable row-based AUTO reference so the
   *    walk-in can still be imported into CLIENT DATABASE.
   *
   * This prevents valid WALKIN DATASET rows from being skipped only
   * because DY reference is blank/misplaced.
   ************************************************************/

  const row = rowObj.raw || [];
  const dyRef = asText_(row[CRM_CONFIG.SOURCE_REFERENCE_COL - 1]).trim().toUpperCase();
  if (dyRef) return dyRef;

  const legacyCols = CRM_CONFIG.SOURCE_LEGACY_REFERENCE_COLS || [];
  for (let i = 0; i < legacyCols.length; i++) {
    const legacyRef = asText_(row[Number(legacyCols[i]) - 1]).trim().toUpperCase();
    if (legacyRef) return legacyRef;
  }

  const headerRef = upperTrim_(getSourceValue_(rowObj.map || {}, CRM_CONFIG.SOURCE_HEADERS.referenceNumber || []));
  if (headerRef) return headerRef;

  const scannedRef = findReferenceLikeInRawRow_(row);
  if (scannedRef) return scannedRef;

  return buildAutoReferenceForWalkinRow_(rowObj.rowNumber);
}

function findReferenceLikeInRawRow_(row) {
  const values = (row || []).map(v => asText_(v).trim()).filter(Boolean);
  for (let i = 0; i < values.length; i++) {
    const text = values[i].toUpperCase();
    const match = text.match(/\bMK[-_ ]?(?:NWK|WK|WALKIN|WALK|CRM)?[-_ ]?[A-Z0-9-]{3,}\b/);
    if (match && match[0]) return match[0].replace(/\s+/g, '-').replace(/_/g, '-');
  }
  return '';
}

function buildAutoReferenceForWalkinRow_(rowNumber) {
  const rn = Number(rowNumber || 0);
  if (!rn) return '';
  return 'AUTO-WALKIN-ROW-' + rn;
}

function findPhoneLikeValuesInRawRow_(row) {
  const out = [];
  const seen = new Set();

  (row || []).forEach(v => {
    const digits = normalizePhone_(v);
    if (!digits) return;

    // Avoid picking dates, amounts, pincodes etc. Phone should be at least 10 digits.
    if (digits.length < 10) return;
    if (digits.length > 15) return;

    const key = last10_(digits);
    if (!key || seen.has(key)) return;

    seen.add(key);
    out.push(digits);
  });

  return out;
}

/** ==========================================================
 *  NORMALIZATION
 *  ==========================================================
 */
function normalizeWalkinRow_(rowObj) {
  const m = rowObj.map;
  const H = CRM_CONFIG.SOURCE_HEADERS;

  const crmClientId = upperTrim_(getSourceValue_(m, H.crmClientId));
  const referenceNumber = getReferenceNumberFromWalkinRow_(rowObj) || '';

  const timestamp = getSourceValue_(m, H.timestamp);
  const visitDate = getSourceValue_(m, H.visitDate);

  const clientName = upperTrim_(getSourceValue_(m, H.clientName));
  let billingPhone = normalizePhone_(getSourceValue_(m, H.billingPhone));
  let clientPhone = normalizePhone_(getSourceValue_(m, H.clientPhone));
  const referencePhone = normalizePhone_(getSourceValue_(m, H.referencePhone));

  // IMPORTANT FIX:
  // Some WALKIN DATASET rows have phone data, but the exact header name may
  // be different or shifted. If mapped phone headers are blank, pick valid
  // 10-15 digit phone values from the row so CLIENT DATABASE search works.
  const fallbackPhones = findPhoneLikeValuesInRawRow_(rowObj.raw || []);
  if (!clientPhone && fallbackPhones.length) clientPhone = fallbackPhones[0];
  if (!billingPhone && fallbackPhones.length) billingPhone = fallbackPhones[1] || fallbackPhones[0];

  const phoneKey = derivePhoneKey_(billingPhone, clientPhone);
  const nameKey = deriveNameKey_(clientName);

  const buyStatus = normalizeBuyStatus_(getSourceValue_(m, H.buyStatus));
  const eventDateObj = parseDateSafe_(visitDate) || parseDateSafe_(timestamp);
  const timestampObj = parseDateSafe_(timestamp) || parseDateSafe_(visitDate);

  return {
    sourceRowNumber: rowObj.rowNumber,
    crmClientId: crmClientId,
    referenceNumber: referenceNumber,

    timestamp: normalizeDateTimeString_(timestampObj || eventDateObj),
    visitDate: normalizeDateString_(eventDateObj),
    timestampObj,
    eventDateObj,

    sourceOfLead: upperTrim_(getSourceValue_(m, H.sourceLead)),
    sourceOther: upperTrim_(getSourceValue_(m, H.sourceOther)),
    referrerName: upperTrim_(getSourceValue_(m, H.referenceName)),
    referrerPhone: referencePhone,

    branch: upperTrim_(getSourceValue_(m, H.branch)),
    crmName: upperTrim_(getSourceValue_(m, H.crmName)),
    clientName: clientName,
    gender: upperTrim_(getSourceValue_(m, H.gender)),
    clientPhone: clientPhone,
    billingPhone: billingPhone,
    country: upperTrim_(getSourceValue_(m, H.country)),
    state: upperTrim_(getSourceValue_(m, H.state)),
    city: upperTrim_(getSourceValue_(m, H.city)),
    cityOther: upperTrim_(getSourceValue_(m, H.cityOther)),
    pincode: asText_(getSourceValue_(m, H.pincode)).trim(),
    address: upperTrim_(getSourceValue_(m, H.address)),
    community: upperTrim_(getSourceValue_(m, H.community)),
    communityOther: upperTrim_(getSourceValue_(m, H.communityOther)),
    dob: normalizeDateString_(parseDateSafe_(getSourceValue_(m, H.dob))),
    anniversary: normalizeDateString_(parseDateSafe_(getSourceValue_(m, H.anniversary))),
    salesperson: upperTrim_(getSourceValue_(m, H.salesperson)),

    buyStatus: buyStatus,
    notBoughtReasons: upperTrim_(getSourceValue_(m, H.notBoughtReasons)),
    repairApproach: upperTrim_(getSourceValue_(m, H.repairApproach)),
    newThingsChoice: upperTrim_(getSourceValue_(m, H.newThingsChoice)),
    newThingsSalesperson: upperTrim_(getSourceValue_(m, H.newThingsSalesperson)),

    seenCategories: upperTrim_(getSourceValue_(m, H.seenCategories)),
    seenProductsCount: asText_(getSourceValue_(m, H.seenProductsCount)).trim(),
    seenTags: upperTrim_(getSourceValue_(m, H.seenTags)),
    seenOtherText: upperTrim_(getSourceValue_(m, H.seenOtherText)),

    boughtCategories: upperTrim_(getSourceValue_(m, H.boughtCategories)),
    boughtProductsCount: asText_(getSourceValue_(m, H.boughtProductsCount)).trim(),
    boughtTags: upperTrim_(getSourceValue_(m, H.boughtTags)),
    boughtOtherText: upperTrim_(getSourceValue_(m, H.boughtOtherText)),

    orderCategories: upperTrim_(getSourceValue_(m, H.orderCategories)),
    orderCount: asText_(getSourceValue_(m, H.orderCount)).trim(),
    orderTags: upperTrim_(getSourceValue_(m, H.orderTags)),
    orderOtherText: upperTrim_(getSourceValue_(m, H.orderOtherText)),
    otherOrder: upperTrim_(getSourceValue_(m, H.otherOrder)),

    marketingMessage: upperTrim_(getSourceValue_(m, H.marketingMessage)),
    instagramStatus: deriveStatusField_(getSourceValue_(m, H.instagramAsked)),
    googleReviewStatus: deriveStatusField_(getSourceValue_(m, H.googleReviewAsked)),
    testimonialStatus: deriveStatusField_(getSourceValue_(m, H.testimonialAsked)),
    referralStatus: deriveStatusField_(getSourceValue_(m, H.referralsAsked)),

    beverage: mergeOtherChoice_(getSourceValue_(m, H.beverage), getSourceValue_(m, H.beverageOther)),
    sugar: mergeOtherChoice_(getSourceValue_(m, H.sugar), getSourceValue_(m, H.sugarOther)),
    snack: mergeOtherChoice_(getSourceValue_(m, H.snack), getSourceValue_(m, H.snackOther)),
    giftGiven: mergeOtherChoice_(getSourceValue_(m, H.giftGiven), getSourceValue_(m, H.giftOther)),

    nextVisitDate: normalizeDateString_(parseDateSafe_(getSourceValue_(m, H.nextVisitDate))),
    clientPotentialCategory: upperTrim_(getSourceValue_(m, H.clientPotentialCategory)),
    highPotentialReason: upperTrim_(getSourceValue_(m, H.highPotentialReason)),
    remark: upperTrim_(getSourceValue_(m, H.remark)),
    upload: asText_(getSourceValue_(m, H.upload)).trim(),

    productRequirement: upperTrim_(getSourceValue_(m, H.productRequirement)),
    otherStoreVisit: upperTrim_(getSourceValue_(m, H.otherStoreVisit)),
    moreDesignCategories: upperTrim_(getSourceValue_(m, H.moreDesignCategories)),

    profileUpdatedBy: upperTrim_(getSourceValue_(m, H.profileUpdatedBy)) || upperTrim_(getSourceValue_(m, H.crmName)),

    phoneKey: phoneKey,
    nameKey: nameKey
  };
}

function normalizeBuyStatus_(value) {
  const raw = upperTrim_(value);
  const v = raw.replace(/\s+/g, '_');

  const map = {
    'ORDER_PLACED': 'ORDER_PLACED',
    'ORDER_PICKUP': 'ORDER_PICKUP',
    'REPAIR_PLACED': 'REPAIR_PLACED',
    'REPAIR_PICKUP': 'REPAIR_PICKUP',
    'PRODUCT_RETURN': 'PRODUCT_RETURN',
    'PRODUCT_EXCHANGE': 'PRODUCT_EXCHANGE',
    'STORE_VISIT': 'STORE_VISIT',
    'PRICE_CALCULATION': 'PRICE_CALCULATION',
    'YES': 'YES',
    'NO': 'NO'
  };

  if (map[v]) return map[v];
  return raw;
}

function asText_(value) {
  return value == null ? '' : String(value);
}

function upperTrim_(value) {
  return asText_(value).trim().toUpperCase();
}

function normalizePhone_(value) {
  const digits = asText_(value).replace(/\D/g, '');
  if (!digits) return '';
  return digits;
}

function last10_(digits) {
  if (!digits) return '';
  return digits.slice(-CRM_CONFIG.PHONE_KEY_DIGITS);
}

function derivePhoneKey_(billingPhone, clientPhone) {
  return last10_(billingPhone) || last10_(clientPhone) || '';
}

function deriveNameKey_(name) {
  if (!name) return '';
  return name
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function deriveStatusField_(value) {
  return upperTrim_(value);
}

function mergeOtherChoice_(mainValue, otherValue) {
  const main = upperTrim_(mainValue);
  const other = upperTrim_(otherValue);

  if (!main && !other) return '';
  if (!main) return other;
  if (!other) return main;

  if (main === 'OTHER' || main.startsWith('OTHER')) return other;

  return main;
}

function parseDateSafe_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) return value;

  const t = new Date(value);
  return isNaN(t) ? null : t;
}

function normalizeDateString_(dateObj) {
  if (!dateObj) return '';
  return Utilities.formatDate(dateObj, CRM_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function normalizeDateTimeString_(dateObj) {
  if (!dateObj) return '';
  return Utilities.formatDate(dateObj, CRM_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

/** ==========================================================
 *  MASTER STATE LOAD
 *  ==========================================================
 */
function readMasterState_() {
  const sh = getCrmSheet_(CRM_CONFIG.SHEETS.MASTER);
  const values = sh.getDataRange().getValues();
  const headers = values.length ? values[0] : getMasterHeaders_();
  const rows = values.length > 1 ? values.slice(1) : [];

  const state = {
    headers,
    rowsByClientId: new Map(),
    rowIndexByClientId: new Map(),
    clientIdByPhoneKey: new Map(),
    clientIdByNameKey: new Map()
  };

  rows.forEach((row, idx) => {
    const obj = rowToHeaderMap_(headers, row);
    const clientId = asText_(obj['CLIENT ID']).trim();
    if (!clientId) return;

    state.rowsByClientId.set(clientId, obj);
    state.rowIndexByClientId.set(clientId, idx + 2);

    const phoneKey = asText_(obj['PHONE KEY']).trim();
    const nameKey = asText_(obj['NAME KEY']).trim();

    if (phoneKey) state.clientIdByPhoneKey.set(phoneKey, clientId);
    if (nameKey) state.clientIdByNameKey.set(nameKey, clientId);
  });

  return state;
}

function readTimelineReferenceSet_() {
  const sh = getCrmSheet_(CRM_CONFIG.SHEETS.TIMELINE);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return new Set();

  const headers = values[0];
  const refIdx = headers.indexOf('REFERENCE NUMBER');
  if (refIdx < 0) throw new Error('REFERENCE NUMBER column missing in CLIENT TIMELINE');

  const set = new Set();
  for (let i = 1; i < values.length; i++) {
    const ref = asText_(values[i][refIdx]).trim().toUpperCase();
    if (ref) set.add(ref);
  }
  return set;
}

/** ==========================================================
 *  CLIENT MATCHING
 *  ==========================================================
 */
function isExistingClientIdInMaster_(masterState, clientId) {
  const id = asText_(clientId).trim();
  if (!id) return false;
  return masterState.rowsByClientId.has(id);
}

function storedClientIdMatchesVisit_(masterState, storedClientId, visit) {
  const id = asText_(storedClientId).trim();
  if (!id) return false;
  if (!masterState.rowsByClientId.has(id)) return false;

  const existing = masterState.rowsByClientId.get(id);
  const existingPhoneKey = asText_(existing['PHONE KEY']).trim();

  if (existingPhoneKey && visit.phoneKey && existingPhoneKey !== visit.phoneKey) {
    return false;
  }

  return true;
}

function findMatchingClientId_(masterState, visit) {
  const storedClientId = asText_(visit.crmClientId).trim();

  if (storedClientId && storedClientIdMatchesVisit_(masterState, storedClientId, visit)) {
    return storedClientId;
  }

  if (visit.phoneKey && masterState.clientIdByPhoneKey.has(visit.phoneKey)) {
    return masterState.clientIdByPhoneKey.get(visit.phoneKey);
  }

  return '';
}

function generateNextClientId_() {
  const props = PropertiesService.getScriptProperties();
  let current = Number(props.getProperty(CRM_CONFIG.PROP_CLIENT_ID_COUNTER) || 0);

  if (!current) current = CRM_CONFIG.CLIENT_ID_START - 1;

  current += 1;
  props.setProperty(CRM_CONFIG.PROP_CLIENT_ID_COUNTER, String(current));
  return `${CRM_CONFIG.CLIENT_ID_PREFIX}-${current}`;
}

function bumpClientIdCounterFromClientId_(clientId) {
  const id = String(clientId || '').trim().toUpperCase();
  const prefix = String(CRM_CONFIG.CLIENT_ID_PREFIX || '').trim().toUpperCase();

  const match = id.match(new RegExp('^' + prefix + '-(\\d+)$'));
  if (!match) return;

  const n = Number(match[1]);
  if (!n || isNaN(n)) return;

  const props = PropertiesService.getScriptProperties();
  const current = Number(props.getProperty(CRM_CONFIG.PROP_CLIENT_ID_COUNTER) || 0);

  if (n > current) props.setProperty(CRM_CONFIG.PROP_CLIENT_ID_COUNTER, String(n));
}

/** ==========================================================
 *  UPSERT CLIENT FROM VISIT
 *  ==========================================================
 */
function upsertClientFromVisit_(masterState, visit, editLogRows, sourceLabel) {
  let clientId = findMatchingClientId_(masterState, visit);

  if (!clientId) {
    const storedClientId = asText_(visit.crmClientId).trim();

    if (storedClientId && !masterState.rowsByClientId.has(storedClientId)) {
      clientId = storedClientId;
      bumpClientIdCounterFromClientId_(clientId);
    } else {
      clientId = generateNextClientId_();
    }

    const base = buildInitialMasterObject_(visit, clientId);

    masterState.rowsByClientId.set(clientId, base);
    masterState.rowIndexByClientId.set(clientId, -1);

    if (base['PHONE KEY']) masterState.clientIdByPhoneKey.set(base['PHONE KEY'], clientId);
    if (base['NAME KEY']) masterState.clientIdByNameKey.set(base['NAME KEY'], clientId);

    return clientId;
  }

  const existing = masterState.rowsByClientId.get(clientId);
  const updated = mergeVisitIntoMaster_(existing, visit);

  const diffs = collectDiffs_(existing, updated);
  diffs.forEach(d => {
    editLogRows.push([
      normalizeDateTimeString_(new Date()),
      clientId,
      visit.profileUpdatedBy || visit.crmName || '',
      sourceLabel,
      d.fieldName,
      d.oldValue,
      d.newValue
    ]);
  });

  masterState.rowsByClientId.set(clientId, updated);

  if (updated['PHONE KEY']) masterState.clientIdByPhoneKey.set(updated['PHONE KEY'], clientId);
  if (updated['NAME KEY']) masterState.clientIdByNameKey.set(updated['NAME KEY'], clientId);

  return clientId;
}

function buildInitialMasterObject_(visit, clientId) {
  const now = normalizeDateTimeString_(new Date());
  const stats = computeVisitStatsDelta_(visit);

  return {
    'CLIENT ID': clientId,
    'PHONE KEY': visit.phoneKey || '',
    'NAME KEY': visit.nameKey || '',
    'PRIMARY NAME': visit.clientName || '',
    'OTHER NAMES': '',
    'PRIMARY PHONE': visit.clientPhone || visit.billingPhone || '',
    'SECONDARY PHONE': pickSecondaryPhone_('', visit.clientPhone, visit.billingPhone),
    'BILLING PHONE': visit.billingPhone || '',
    'OTHER KNOWN PHONES': buildOtherKnownPhones_([], [visit.clientPhone, visit.billingPhone, visit.referrerPhone]),
    'GENDER': visit.gender || '',
    'COUNTRY': visit.country || '',
    'STATE': visit.state || '',
    'CITY': visit.city || '',
    'CITY OTHER': visit.cityOther || '',
    'PINCODE': visit.pincode || '',
    'ADDRESS': visit.address || '',
    'COMMUNITY': visit.community || '',
    'COMMUNITY OTHER': visit.communityOther || '',
    'DOB': visit.dob || '',
    'ANNIVERSARY': visit.anniversary || '',
    'BEVERAGE': visit.beverage || '',
    'SUGAR': visit.sugar || '',
    'SNACK': visit.snack || '',
    'GIFT HISTORY': visit.giftGiven || '',
    'FIRST VISIT DATE': visit.visitDate || '',
    'LAST VISIT DATE': visit.visitDate || '',
    'TOTAL VISITS': stats.totalVisits,
    'TOTAL PURCHASE VISITS': stats.purchaseVisits,
    'TOTAL NON PURCHASE VISITS': stats.nonPurchaseVisits,
    'TOTAL REPAIR VISITS': stats.repairVisits,
    'TOTAL ORDER VISITS': stats.orderVisits,
    'LAST BUY STATUS': visit.buyStatus || '',
    'LAST BRANCH': visit.branch || '',
    'LAST CRM': visit.crmName || '',
    'LAST SALESPERSON': visit.salesperson || '',
    'LAST REMARK': visit.remark || '',
    'LAST PRODUCT REQUIREMENT': visit.productRequirement || '',
    'LAST SEEN CATEGORIES': visit.seenCategories || '',
    'LAST BOUGHT CATEGORIES': visit.boughtCategories || '',
    'LAST ORDER CATEGORIES': visit.orderCategories || '',
    'CLIENT POTENTIAL CATEGORY': visit.clientPotentialCategory || '',
    'HIGH POTENTIAL REASON': visit.highPotentialReason || '',
    'INSTAGRAM STATUS': visit.instagramStatus || '',
    'GOOGLE REVIEW STATUS': visit.googleReviewStatus || '',
    'TESTIMONIAL STATUS': visit.testimonialStatus || '',
    'REFERRAL STATUS': visit.referralStatus || '',
    'NEXT VISIT DATE': visit.nextVisitDate || '',
    'PROFILE LAST UPDATED ON': now,
    'PROFILE UPDATED BY': visit.profileUpdatedBy || visit.crmName || ''
  };
}

function mergeVisitIntoMaster_(existing, visit) {
  const out = Object.assign({}, existing);
  const now = normalizeDateTimeString_(new Date());
  const stats = computeVisitStatsDelta_(visit);

  const existingNames = splitList_(existing['OTHER NAMES']);
  const allNames = dedupeList_([existing['PRIMARY NAME'], ...existingNames, visit.clientName]);
  out['PRIMARY NAME'] = choosePrimaryName_(existing['PRIMARY NAME'], visit.clientName);
  out['OTHER NAMES'] = dedupeList_(allNames.filter(n => n && n !== out['PRIMARY NAME'])).join(', ');

  const phones = dedupeList_([
    existing['PRIMARY PHONE'],
    existing['SECONDARY PHONE'],
    existing['BILLING PHONE'],
    ...splitList_(existing['OTHER KNOWN PHONES']),
    visit.clientPhone,
    visit.billingPhone,
    visit.referrerPhone
  ]).filter(Boolean);

  out['PHONE KEY'] = existing['PHONE KEY'] || visit.phoneKey || '';
  out['NAME KEY'] = existing['NAME KEY'] || visit.nameKey || '';

  out['PRIMARY PHONE'] = choosePrimaryPhone_(existing, visit, phones);
  out['BILLING PHONE'] = chooseValue_(existing['BILLING PHONE'], visit.billingPhone);
  out['SECONDARY PHONE'] = chooseSecondaryFromPool_(out['PRIMARY PHONE'], out['BILLING PHONE'], phones);
  out['OTHER KNOWN PHONES'] = dedupeList_(
    phones.filter(p => p && p !== out['PRIMARY PHONE'] && p !== out['SECONDARY PHONE'] && p !== out['BILLING PHONE'])
  ).join(', ');

  out['GENDER'] = chooseValue_(existing['GENDER'], visit.gender);
  out['COUNTRY'] = chooseValue_(existing['COUNTRY'], visit.country);
  out['STATE'] = chooseValue_(existing['STATE'], visit.state);
  out['CITY'] = chooseValue_(existing['CITY'], visit.city);
  out['CITY OTHER'] = chooseValue_(existing['CITY OTHER'], visit.cityOther);
  out['PINCODE'] = chooseValue_(existing['PINCODE'], visit.pincode);
  out['ADDRESS'] = chooseLongerValue_(existing['ADDRESS'], visit.address);
  out['COMMUNITY'] = chooseValue_(existing['COMMUNITY'], visit.community);
  out['COMMUNITY OTHER'] = chooseValue_(existing['COMMUNITY OTHER'], visit.communityOther);
  out['DOB'] = chooseValue_(existing['DOB'], visit.dob);
  out['ANNIVERSARY'] = chooseValue_(existing['ANNIVERSARY'], visit.anniversary);

  out['BEVERAGE'] = chooseValue_(existing['BEVERAGE'], visit.beverage);
  out['SUGAR'] = chooseValue_(existing['SUGAR'], visit.sugar);
  out['SNACK'] = chooseValue_(existing['SNACK'], visit.snack);
  out['GIFT HISTORY'] = mergeCsvField_(existing['GIFT HISTORY'], visit.giftGiven);

  out['FIRST VISIT DATE'] = minDateString_(existing['FIRST VISIT DATE'], visit.visitDate);
  out['LAST VISIT DATE'] = maxDateString_(existing['LAST VISIT DATE'], visit.visitDate);

  out['TOTAL VISITS'] = toInt_(existing['TOTAL VISITS']) + stats.totalVisits;
  out['TOTAL PURCHASE VISITS'] = toInt_(existing['TOTAL PURCHASE VISITS']) + stats.purchaseVisits;
  out['TOTAL NON PURCHASE VISITS'] = toInt_(existing['TOTAL NON PURCHASE VISITS']) + stats.nonPurchaseVisits;
  out['TOTAL REPAIR VISITS'] = toInt_(existing['TOTAL REPAIR VISITS']) + stats.repairVisits;
  out['TOTAL ORDER VISITS'] = toInt_(existing['TOTAL ORDER VISITS']) + stats.orderVisits;

  if (isVisitLaterThanMaster_(existing, visit)) {
    out['LAST BUY STATUS'] = visit.buyStatus || out['LAST BUY STATUS'];
    out['LAST BRANCH'] = visit.branch || out['LAST BRANCH'];
    out['LAST CRM'] = visit.crmName || out['LAST CRM'];
    out['LAST SALESPERSON'] = visit.salesperson || out['LAST SALESPERSON'];
    out['LAST REMARK'] = chooseValue_(out['LAST REMARK'], visit.remark);
    out['LAST PRODUCT REQUIREMENT'] = chooseValue_(out['LAST PRODUCT REQUIREMENT'], visit.productRequirement);
    out['LAST SEEN CATEGORIES'] = chooseValue_(out['LAST SEEN CATEGORIES'], visit.seenCategories);
    out['LAST BOUGHT CATEGORIES'] = chooseValue_(out['LAST BOUGHT CATEGORIES'], visit.boughtCategories);
    out['LAST ORDER CATEGORIES'] = chooseValue_(out['LAST ORDER CATEGORIES'], visit.orderCategories);
  }

  out['CLIENT POTENTIAL CATEGORY'] = chooseValue_(existing['CLIENT POTENTIAL CATEGORY'], visit.clientPotentialCategory);
  out['HIGH POTENTIAL REASON'] = chooseValue_(existing['HIGH POTENTIAL REASON'], visit.highPotentialReason);
  out['INSTAGRAM STATUS'] = chooseValue_(existing['INSTAGRAM STATUS'], visit.instagramStatus);
  out['GOOGLE REVIEW STATUS'] = chooseValue_(existing['GOOGLE REVIEW STATUS'], visit.googleReviewStatus);
  out['TESTIMONIAL STATUS'] = chooseValue_(existing['TESTIMONIAL STATUS'], visit.testimonialStatus);
  out['REFERRAL STATUS'] = chooseValue_(existing['REFERRAL STATUS'], visit.referralStatus);
  out['NEXT VISIT DATE'] = maxDateString_(existing['NEXT VISIT DATE'], visit.nextVisitDate);
  out['PROFILE LAST UPDATED ON'] = now;
  out['PROFILE UPDATED BY'] = visit.profileUpdatedBy || visit.crmName || out['PROFILE UPDATED BY'];

  return out;
}

function getStatusGroups_() {
  return {
    readyProduct: new Set(['YES', 'YES_AND_ORDER_PLACED', 'YES AND ORDER_PLACED']),
    orderPlaced: new Set(['YES_AND_ORDER_PLACED', 'YES AND ORDER_PLACED', 'ORDER_PLACED', 'ORDER_PLACED_AND_BUYING_NEW_PRODUCT', 'ORDER_PLACED_AND_MAKING_NEW_ORDER']),
    orderPickup: new Set(['ORDER_PICKUP', 'ORDER_PICKUP_AND_BUYING_NEW_PRODUCT', 'ORDER_PICKUP_AND_MAKING_NEW_ORDER']),
    repairPlaced: new Set(['REPAIR_PLACED', 'REPAIR_PLACED_AND_BUYING_NEW_PRODUCT', 'REPAIR_PLACED_AND_MAKING_NEW_ORDER']),
    repairPickup: new Set(['REPAIR_PICKUP', 'REPAIR_PICKUP_AND_BUYING_NEW_PRODUCT', 'REPAIR_PICKUP_AND_MAKING_NEW_ORDER']),
    upsale: new Set(['ORDER_PLACED_AND_BUYING_NEW_PRODUCT', 'ORDER_PLACED_AND_MAKING_NEW_ORDER', 'ORDER_PICKUP_AND_MAKING_NEW_ORDER', 'ORDER_PICKUP_AND_BUYING_NEW_PRODUCT', 'REPAIR_PICKUP_AND_BUYING_NEW_PRODUCT', 'REPAIR_PICKUP_AND_MAKING_NEW_ORDER', 'REPAIR_PLACED_AND_BUYING_NEW_PRODUCT', 'REPAIR_PLACED_AND_MAKING_NEW_ORDER']),
    nonBuyer: new Set(['NO', 'PRODUCT_RETURN', 'STORE_VISIT', 'PRICE_CALCULATION']),
    productReturn: new Set(['PRODUCT_RETURN'])
  };
}

function computeVisitStatsDelta_(visit) {
  const buy = upperTrim_(visit.buyStatus).replace(/\s+/g, '_');
  const g = getStatusGroups_();

  return {
    totalVisits: 1,
    purchaseVisits: g.readyProduct.has(buy) ? 1 : 0,
    nonPurchaseVisits: g.nonBuyer.has(buy) ? 1 : 0,
    repairVisits: (g.repairPlaced.has(buy) || g.repairPickup.has(buy)) ? 1 : 0,
    orderVisits: (g.orderPlaced.has(buy) || g.orderPickup.has(buy)) ? 1 : 0
  };
}

/** ==========================================================
 *  TIMELINE
 *  ==========================================================
 */
function buildTimelineRow_(visit, clientId) {
  return [
    visit.timestamp || '',
    clientId || '',
    visit.visitDate || '',
    deriveEventType_(visit),
    visit.buyStatus || '',
    visit.branch || '',
    visit.crmName || '',
    visit.salesperson || '',
    visit.seenCategories || '',
    visit.boughtCategories || '',
    visit.orderCategories || '',
    visit.productRequirement || '',
    visit.remark || '',
    visit.referenceNumber || ''
  ];
}

function deriveEventType_(visit) {
  const buy = upperTrim_(visit.buyStatus).replace(/\s+/g, '_');
  const g = getStatusGroups_();

  if (g.upsale.has(buy)) return 'UPSALE_VISIT';
  if (g.readyProduct.has(buy)) return 'READY_PRODUCT_PURCHASE';
  if (g.orderPlaced.has(buy)) return 'ORDER_PLACED_VISIT';
  if (g.orderPickup.has(buy)) return 'ORDER_PICKUP_VISIT';
  if (g.repairPlaced.has(buy)) return 'REPAIR_PLACED_VISIT';
  if (g.repairPickup.has(buy)) return 'REPAIR_PICKUP_VISIT';
  if (buy === 'PRODUCT_RETURN') return 'PRODUCT_RETURN_VISIT';
  if (buy === 'PRODUCT_EXCHANGE') return 'PRODUCT_EXCHANGE_VISIT';
  if (buy === 'NO') return 'NON_PURCHASE_VISIT';
  if (buy === 'STORE_VISIT') return 'STORE_VISIT';
  if (buy === 'PRICE_CALCULATION') return 'PRICE_CALCULATION_VISIT';

  return 'VISIT';
}

/** ==========================================================
 *  FLUSH MASTER
 *  ==========================================================
 */
function flushMasterState_(masterState) {
  const headers = getMasterHeaders_();
  const rows = Array.from(masterState.rowsByClientId.values())
    .map(obj => headers.map(h => obj[h] != null ? obj[h] : ''));

  const sh = getCrmSheet_(CRM_CONFIG.SHEETS.MASTER);
  sh.clearContents();
  sh.clearFormats();

  sh.getRange(1, 1, 1, headers.length).setValues([headers]);

  if (rows.length) {
    sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  sh.setFrozenRows(1);

  const countColumns = [
    'TOTAL VISITS',
    'TOTAL PURCHASE VISITS',
    'TOTAL NON PURCHASE VISITS',
    'TOTAL REPAIR VISITS',
    'TOTAL ORDER VISITS'
  ];

  countColumns.forEach(header => {
    const colIndex = headers.indexOf(header) + 1;
    if (colIndex > 0 && sh.getLastRow() > 1) {
      sh.getRange(2, colIndex, sh.getLastRow() - 1, 1).setNumberFormat('0');
    }
  });

  const dateOnlyColumns = ['DOB', 'ANNIVERSARY', 'FIRST VISIT DATE', 'LAST VISIT DATE', 'NEXT VISIT DATE'];
  dateOnlyColumns.forEach(header => {
    const colIndex = headers.indexOf(header) + 1;
    if (colIndex > 0 && sh.getLastRow() > 1) {
      sh.getRange(2, colIndex, sh.getLastRow() - 1, 1).setNumberFormat('dd/mm/yyyy');
    }
  });

  const dateTimeColumns = ['PROFILE LAST UPDATED ON'];
  dateTimeColumns.forEach(header => {
    const colIndex = headers.indexOf(header) + 1;
    if (colIndex > 0 && sh.getLastRow() > 1) {
      sh.getRange(2, colIndex, sh.getLastRow() - 1, 1).setNumberFormat('dd/mm/yyyy hh:mm');
    }
  });
}

/** ==========================================================
 *  DIFFS / MERGE UTILS
 *  ==========================================================
 */
function collectDiffs_(oldObj, newObj) {
  const diffs = [];
  getMasterHeaders_().forEach(h => {
    const oldVal = asText_(oldObj[h]).trim();
    const newVal = asText_(newObj[h]).trim();
    if (oldVal !== newVal) {
      diffs.push({ fieldName: h, oldValue: oldVal, newValue: newVal });
    }
  });
  return diffs;
}

function isBlankLike_(value) {
  const v = String(value || '').trim().toUpperCase();
  return (
    v === '' ||
    v === 'NA' ||
    v === 'N/A' ||
    v === 'NULL' ||
    v === '-' ||
    v === 'NOT MENTIONED'
  );
}

function chooseValue_(oldVal, newVal) {
  const o = String(oldVal || '').trim();
  const n = String(newVal || '').trim();

  if (isBlankLike_(o) && !isBlankLike_(n)) return n;
  if (!isBlankLike_(n)) return n;
  if (!isBlankLike_(o)) return o;

  return '';
}

function chooseLongerValue_(oldVal, newVal) {
  const o = String(oldVal || '').trim();
  const n = String(newVal || '').trim();

  if (isBlankLike_(o) && !isBlankLike_(n)) return n;
  if (isBlankLike_(n) && !isBlankLike_(o)) return o;
  if (isBlankLike_(o) && isBlankLike_(n)) return '';

  return n.length > o.length ? n : o;
}

function choosePrimaryName_(oldPrimary, newName) {
  const o = asText_(oldPrimary).trim();
  const n = asText_(newName).trim();
  if (!o) return n;
  if (!n) return o;
  return o.length >= n.length ? o : n;
}

function choosePrimaryPhone_(existing, visit, phones) {
  const oldPrimary = asText_(existing['PRIMARY PHONE']).trim();
  const billing = visit.billingPhone || '';
  const client = visit.clientPhone || '';

  if (billing) return billing;
  if (oldPrimary) return oldPrimary;
  if (client) return client;
  return phones[0] || '';
}

function pickSecondaryPhone_(existingSecondary, clientPhone, billingPhone) {
  const c = asText_(clientPhone).trim();
  const b = asText_(billingPhone).trim();
  if (c && c !== b) return c;
  return asText_(existingSecondary).trim();
}

function chooseSecondaryFromPool_(primary, billing, pool) {
  const list = pool.filter(p => p && p !== primary && p !== billing);
  return list[0] || '';
}

function buildOtherKnownPhones_(existingPhones, incomingPhones) {
  return dedupeList_([...(existingPhones || []), ...(incomingPhones || [])])
    .filter(Boolean)
    .join(', ');
}

function splitList_(value) {
  return asText_(value).split(',').map(s => s.trim()).filter(Boolean);
}

function dedupeList_(arr) {
  const seen = new Set();
  const out = [];
  (arr || []).forEach(v => {
    const x = asText_(v).trim();
    if (!x) return;
    const k = x.toUpperCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(x);
  });
  return out;
}

function mergeCsvField_(oldVal, newVal) {
  return dedupeList_([...splitList_(oldVal), ...splitList_(newVal)]).join(', ');
}

function minDateString_(a, b) {
  const da = parseDateSafe_(a);
  const db = parseDateSafe_(b);
  if (!da && !db) return '';
  if (!da) return normalizeDateString_(db);
  if (!db) return normalizeDateString_(da);
  return normalizeDateString_(da <= db ? da : db);
}

function maxDateString_(a, b) {
  const da = parseDateSafe_(a);
  const db = parseDateSafe_(b);
  if (!da && !db) return '';
  if (!da) return normalizeDateString_(db);
  if (!db) return normalizeDateString_(da);
  return normalizeDateString_(da >= db ? da : db);
}

function isVisitLaterThanMaster_(existing, visit) {
  const masterLast = parseDateSafe_(existing['LAST VISIT DATE']);
  const v = parseDateSafe_(visit.visitDate);
  if (!masterLast || !v) return true;
  return v >= masterLast;
}

function toInt_(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

/** ==========================================================
 *  CHECKPOINTS
 *  ==========================================================
 */
function getLastSyncTs_() {
  const raw = PropertiesService.getScriptProperties().getProperty(CRM_CONFIG.PROP_LAST_SYNC_TS);
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d) ? null : d;
}

function setLastSyncTs_(dateObj) {
  PropertiesService.getScriptProperties().setProperty(CRM_CONFIG.PROP_LAST_SYNC_TS, dateObj.toISOString());
}

/** ==========================================================
 *  SHEET / APPEND HELPERS
 *  ==========================================================
 */
function appendRowsIfAny_(sheet, rows) {
  if (!rows || !rows.length) return;
  const startRow = sheet.getLastRow() + 1;
  const numCols = rows[0].length;
  sheet.getRange(startRow, 1, rows.length, numCols).setValues(rows);
}

function writeClientIdBackToWalkinRow_(sourceRowNumber, clientId) {
  if (!sourceRowNumber || !clientId) return;

  const sh = getWalkinSourceSheet_();
  const headerRow = CRM_CONFIG.SOURCE_HEADER_ROW;
  const lastCol = Math.max(sh.getLastColumn(), CRM_CONFIG.SOURCE_MIN_COLS);

  const headers = sh.getRange(headerRow, 1, 1, lastCol).getValues()[0].map(h => cleanHeader_(h));
  let crmClientIdCol = headers.indexOf('CRM CLIENT ID') + 1;

  if (crmClientIdCol <= 0) crmClientIdCol = CRM_CONFIG.SOURCE_CRM_CLIENT_ID_COL;

  const cell = sh.getRange(sourceRowNumber, crmClientIdCol);
  const existing = asText_(cell.getValue()).trim();

  if (existing !== clientId) cell.setValue(clientId);
}

/** ==========================================================
 *  DEBUG / AUDIT HELPERS
 *  ==========================================================
 */
function debug_readFirst10WalkinRows() {
  const rows = readAllWalkinRows_().slice(0, 10).map(r => normalizeWalkinRow_(r));
  Logger.log(JSON.stringify(rows, null, 2));
}

function debug_runSingleBackfillPreview() {
  const sourceRows = readAllWalkinRows_();
  if (!sourceRows.length) {
    Logger.log('No source rows found.');
    return;
  }

  const preview = normalizeWalkinRow_(sourceRows[0]);
  Logger.log(JSON.stringify(preview, null, 2));
}

function debugWalkinImportAudit() {
  const ss = getWalkinSpreadsheet_();
  const sh = getWalkinSourceSheet_();
  const sourceRows = readAllWalkinRows_();

  const DY_REF_COL = CRM_CONFIG.SOURCE_REFERENCE_COL; // 129
  const DC_WRONG_REF_COL = 107;

  let withDyRef = 0;
  let withoutDyRef = 0;
  let withPhone = 0;
  let withName = 0;

  let dcWrongRefCount = 0;
  let dcHasRefButDyBlank = 0;

  const refs = new Set();
  const blankExamples = [];
  const dcWrongExamples = [];

  sourceRows.forEach(rowObj => {
    const row = rowObj.raw || [];

    const dyRef = String(row[DY_REF_COL - 1] || '').trim().toUpperCase();
    const dcRef = String(row[DC_WRONG_REF_COL - 1] || '').trim().toUpperCase();

    const name = String(row[10] || '').trim();
    const phone1 = String(row[12] || '').trim();
    const phone2 = String(row[13] || '').trim();

    if (name) withName++;
    if (phone1 || phone2) withPhone++;

    if (dyRef) {
      withDyRef++;
      refs.add(dyRef);
    } else {
      withoutDyRef++;

      if (blankExamples.length < 10) {
        blankExamples.push({
          rowNumber: rowObj.rowNumber,
          clientName: name,
          clientPhone: phone1,
          billingPhone: phone2,
          dyCol129Value: dyRef,
          dcCol107Value: dcRef
        });
      }
    }

    if (dcRef && (dcRef.startsWith('MK-WK') || dcRef.startsWith('MK-'))) {
      dcWrongRefCount++;

      if (!dyRef) {
        dcHasRefButDyBlank++;
      }

      if (dcWrongExamples.length < 10) {
        dcWrongExamples.push({
          rowNumber: rowObj.rowNumber,
          clientName: name,
          dyCol129Value: dyRef,
          dcCol107Value: dcRef
        });
      }
    }
  });

  const msg =
    'SOURCE SPREADSHEET ID: ' + getEffectiveWalkinSpreadsheetId_() + '\n' +
    'SOURCE SPREADSHEET NAME: ' + ss.getName() + '\n' +
    'SOURCE SHEET: ' + CRM_CONFIG.WALKIN_SHEET_NAME + '\n' +
    'SHEET MAX ROWS: ' + sh.getMaxRows() + '\n' +
    'SHEET LAST ROW: ' + sh.getLastRow() + '\n' +
    'SHEET LAST COL: ' + sh.getLastColumn() + '\n\n' +

    'SOURCE ROWS READ: ' + sourceRows.length + '\n' +
    'ROWS WITH DY / 129 REFERENCE: ' + withDyRef + '\n' +
    'ROWS WITHOUT DY / 129 REFERENCE: ' + withoutDyRef + '\n' +
    'UNIQUE DY REFERENCES: ' + refs.size + '\n\n' +

    'WRONG DC / 107 REFERENCES FOUND: ' + dcWrongRefCount + '\n' +
    'DC HAS REF BUT DY IS BLANK: ' + dcHasRefButDyBlank + '\n\n' +

    'ROWS WITH NAME: ' + withName + '\n' +
    'ROWS WITH PHONE: ' + withPhone + '\n\n' +
    'CHECK LOGS FOR EXAMPLES.';

  Logger.log(JSON.stringify({
    spreadsheetId: getEffectiveWalkinSpreadsheetId_(),
    spreadsheetName: ss.getName(),
    sheetName: CRM_CONFIG.WALKIN_SHEET_NAME,
    maxRows: sh.getMaxRows(),
    lastRow: sh.getLastRow(),
    lastCol: sh.getLastColumn(),
    sourceRowsRead: sourceRows.length,
    rowsWithDyReference: withDyRef,
    rowsWithoutDyReference: withoutDyRef,
    uniqueDyReferences: refs.size,
    wrongDcReferenceCount: dcWrongRefCount,
    dcHasRefButDyBlank: dcHasRefButDyBlank,
    rowsWithName: withName,
    rowsWithPhone: withPhone,
    blankExamples,
    dcWrongExamples
  }, null, 2));

  SpreadsheetApp.getUi().alert(msg);
}


/** ==========================================================
 *  REFERENCE NUMBER GENERATION DISABLED IN PROJECT 2
 *
 * Final rule:
 * - Project 1 generates REFERENCE NUMBER in WALKIN DATASET DY / 129.
 * - Project 2 only reads DY / 129.
 * - Project 2 must not create or repair reference numbers.
 * ==========================================================
 */
function generateMissingWalkinReferencesFromOldLogicManual() {
  SpreadsheetApp.getUi().alert(
    'Reference number generation is disabled in Project 2.\n\n' +
    'Please run reference generation only from Project 1 Code.gs.\n\n' +
    'Correct reference column: WALKIN DATASET column DY / 129.'
  );
}


/** ==========================================================
 *  WALK-IN ENTRY LOG / QUEUE HELPERS
 *  ==========================================================
 */
const BRANCH_CRM_ALLOCATION = {
  'BANDRA': ['SHRUTI VORA', 'SRAVANI MAHARANA', 'TANYA KEDARE', 'TEHREEM ANSARI'],
  'ZAVERI BAZAR': ['NA'],
  'ANDHERI': ['NA'],
  'EXHIBITION': ['SONALI DUTTA', 'SHRUTI VORA', 'LEENA VERNEKAR', 'MANALI CHAUDHARY', 'SRAVANI MAHARANA', 'TANYA KEDARE', 'TEHREEM ANSARI']
};


/**************************************************************
 * DYNAMIC BRANCH / CRM MASTER
 * Added for CRM PRESENT TODAY panel.
 * Users can add a new branch and CRM from the web app without
 * editing this script. Data is stored in Script Properties and
 * merged with the default BRANCH_CRM_ALLOCATION above.
 **************************************************************/
function normalizeBranchName_(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function normalizeCrmName_(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function dedupeCrmArray_(arr) {
  const out = [];
  const seen = new Set();
  (arr || []).forEach(v => {
    const x = normalizeCrmName_(v);
    if (!x) return;
    if (seen.has(x)) return;
    seen.add(x);
    out.push(x);
  });
  return out;
}

function getCustomBranchCrmAllocation_() {
  const raw = PropertiesService.getScriptProperties()
    .getProperty(CRM_CONFIG.PROP_CUSTOM_BRANCH_CRM_MASTER);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return cleanBranchCrmMasterObject_(parsed);
  } catch (e) {
    return {};
  }
}

function getBranchCrmMasterOverride_() {
  const raw = PropertiesService.getScriptProperties()
    .getProperty(CRM_CONFIG.PROP_BRANCH_CRM_MASTER_OVERRIDE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return cleanBranchCrmMasterObject_(parsed);
  } catch (e) {
    return null;
  }
}

function cleanBranchCrmMasterObject_(obj) {
  const clean = {};
  Object.keys(obj || {}).forEach(branch => {
    const b = normalizeBranchName_(branch);
    if (!b) return;
    const list = dedupeCrmArray_(obj[branch]);
    if (list.length) clean[b] = list;
  });
  return clean;
}

function saveCustomBranchCrmAllocation_(obj) {
  PropertiesService.getScriptProperties()
    .setProperty(CRM_CONFIG.PROP_CUSTOM_BRANCH_CRM_MASTER, JSON.stringify(obj || {}));
}

function saveBranchCrmMasterOverride_(obj) {
  PropertiesService.getScriptProperties()
    .setProperty(CRM_CONFIG.PROP_BRANCH_CRM_MASTER_OVERRIDE, JSON.stringify(cleanBranchCrmMasterObject_(obj || {})));
}

function getEffectiveBranchCrmAllocation_() {
  /************************************************************
   * If the web app has edited/deleted a branch/CRM, use the
   * full override master. This allows editing/deleting even
   * the default static names without changing this script.
   ************************************************************/
  const override = getBranchCrmMasterOverride_();
  if (override) return override;

  const merged = {};

  Object.keys(BRANCH_CRM_ALLOCATION || {}).forEach(branch => {
    const b = normalizeBranchName_(branch);
    merged[b] = dedupeCrmArray_(BRANCH_CRM_ALLOCATION[branch]);
  });

  const custom = getCustomBranchCrmAllocation_();
  Object.keys(custom || {}).forEach(branch => {
    const b = normalizeBranchName_(branch);
    if (!b) return;

    const existing = merged[b] || [];
    const incoming = custom[branch] || [];

    // If old static branch had only NA and user adds a real CRM, remove NA.
    let finalList = dedupeCrmArray_(existing.concat(incoming));
    if (finalList.length > 1) finalList = finalList.filter(v => v !== 'NA');

    merged[b] = finalList;
  });

  return merged;
}

function resetBranchAvailabilityForBranch_(branch) {
  const branchUp = normalizeBranchName_(branch);
  if (!branchUp) return;
  PropertiesService.getScriptProperties().deleteProperty(getCrmDailyAvailabilityPropKey_(branchUp));
}

function addBranchCrmAllocation_(branch, crmName) {
  const branchUp = normalizeBranchName_(branch);
  const crmUp = normalizeCrmName_(crmName);

  if (!branchUp) throw new Error('BRANCH NAME IS REQUIRED.');
  if (!crmUp) throw new Error('CRM NAME IS REQUIRED.');

  const master = getEffectiveBranchCrmAllocation_();
  let list = dedupeCrmArray_((master[branchUp] || []).concat([crmUp]));

  // If branch had only NA and user adds a real CRM, remove NA.
  if (list.length > 1) list = list.filter(v => v !== 'NA');

  master[branchUp] = list;
  saveBranchCrmMasterOverride_(master);
  resetBranchAvailabilityForBranch_(branchUp);

  return {
    ok: true,
    branch: branchUp,
    crmName: crmUp,
    allCrms: getCrmNamesByBranch_(branchUp),
    branches: getWalkinBranchesForRegister(),
    message: 'CRM / Branch added successfully.'
  };
}

function updateBranchCrmAllocation_(oldBranch, oldCrmName, newBranch, newCrmName) {
  const oldBranchUp = normalizeBranchName_(oldBranch);
  const oldCrmUp = normalizeCrmName_(oldCrmName);
  const newBranchUp = normalizeBranchName_(newBranch);
  const newCrmUp = normalizeCrmName_(newCrmName);

  if (!oldBranchUp) throw new Error('OLD BRANCH NAME IS REQUIRED.');
  if (!oldCrmUp) throw new Error('OLD CRM NAME IS REQUIRED.');
  if (!newBranchUp) throw new Error('NEW BRANCH NAME IS REQUIRED.');
  if (!newCrmUp) throw new Error('NEW CRM NAME IS REQUIRED.');

  const master = getEffectiveBranchCrmAllocation_();
  const oldList = dedupeCrmArray_(master[oldBranchUp] || []);
  if (oldList.indexOf(oldCrmUp) < 0) throw new Error('CRM NAME NOT FOUND IN OLD BRANCH.');

  const remainingOldList = oldList.filter(v => v !== oldCrmUp);
  if (remainingOldList.length) master[oldBranchUp] = remainingOldList;
  else delete master[oldBranchUp];

  let newList = dedupeCrmArray_((master[newBranchUp] || []).concat([newCrmUp]));
  if (newList.length > 1) newList = newList.filter(v => v !== 'NA');
  master[newBranchUp] = newList;

  saveBranchCrmMasterOverride_(master);
  resetBranchAvailabilityForBranch_(oldBranchUp);
  resetBranchAvailabilityForBranch_(newBranchUp);

  return {
    ok: true,
    oldBranch: oldBranchUp,
    oldCrmName: oldCrmUp,
    branch: newBranchUp,
    crmName: newCrmUp,
    allCrms: getCrmNamesByBranch_(newBranchUp),
    branches: getWalkinBranchesForRegister(),
    message: 'CRM / Branch updated successfully.'
  };
}

function deleteBranchCrmAllocation_(branch, crmName) {
  const branchUp = normalizeBranchName_(branch);
  const crmUp = normalizeCrmName_(crmName);

  if (!branchUp) throw new Error('BRANCH NAME IS REQUIRED.');
  if (!crmUp) throw new Error('CRM NAME IS REQUIRED.');

  const master = getEffectiveBranchCrmAllocation_();
  const list = dedupeCrmArray_(master[branchUp] || []);
  if (list.indexOf(crmUp) < 0) throw new Error('CRM NAME NOT FOUND IN THIS BRANCH.');

  const finalList = list.filter(v => v !== crmUp);
  if (finalList.length) master[branchUp] = finalList;
  else delete master[branchUp];

  saveBranchCrmMasterOverride_(master);
  resetBranchAvailabilityForBranch_(branchUp);

  return {
    ok: true,
    branch: branchUp,
    crmName: crmUp,
    allCrms: getCrmNamesByBranch_(branchUp),
    branches: getWalkinBranchesForRegister(),
    message: 'CRM deleted successfully.'
  };
}

function getEntryLogHeaders_() {
  return ['ENTRY TIMESTAMP', 'TOKEN', 'CLIENT NAME', 'MOBILE', 'BRANCH', 'ASSIGNED CRM', 'STATUS', 'FULL FORM TIMESTAMP', 'CLIENT ID', 'REMARK'];
}

function ensureEntryLogSheet_() {
  const ss = getWalkinSpreadsheet_();
  let sh = ss.getSheetByName(CRM_CONFIG.ENTRY_LOG_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(CRM_CONFIG.ENTRY_LOG_SHEET_NAME);

  const headers = getEntryLogHeaders_();
  const lastCol = headers.length;
  const existing = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const mismatch = headers.some((h, i) => String(existing[i] || '').trim() !== h);

  if (sh.getLastRow() === 0 || mismatch) {
    sh.getRange(1, 1, 1, lastCol).setValues([headers]);
    sh.setFrozenRows(1);
  }

  return sh;
}

function getWalkinBranchesForRegister() {
  return Object.keys(getEffectiveBranchCrmAllocation_()).sort();
}

function getCrmNamesByBranch_(branch) {
  const branchUp = normalizeBranchName_(branch);
  if (!branchUp) return [];
  return (getEffectiveBranchCrmAllocation_()[branchUp] || []).slice();
}

function getAllCrmNames_() {
  const master = getEffectiveBranchCrmAllocation_();
  const set = new Set();

  Object.keys(master || {}).forEach(branch => {
    (master[branch] || []).forEach(crm => {
      const c = normalizeCrmName_(crm);
      if (c && c !== 'NA') set.add(c);
    });
  });

  return Array.from(set).sort();
}

function getTodayDateKey_() {
  return Utilities.formatDate(new Date(), CRM_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function getCrmDailyAvailabilityPropKey_(branch) {
  const branchUp = String(branch || '').trim().toUpperCase();
  return CRM_CONFIG.PROP_CRM_DAILY_AVAILABILITY_PREFIX + branchUp.replace(/\s+/g, '_');
}

function getDailyAvailabilityRecord_(branch) {
  const branchUp = String(branch || '').trim().toUpperCase();
  if (!branchUp) return null;

  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(getCrmDailyAvailabilityPropKey_(branchUp));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function getAvailableCrmForBranchToday_(branch) {
  const branchUp = String(branch || '').trim().toUpperCase();
  const fullList = getCrmNamesByBranch_(branchUp);

  if (!fullList.length) return [];
  if (fullList.length === 1 && fullList[0] === 'NA') return ['NA'];

  const record = getDailyAvailabilityRecord_(branchUp);
  const todayKey = getTodayDateKey_();

  if (!record || record.date !== todayKey) return fullList.slice();

  const validSet = new Set(fullList.map(v => String(v || '').trim().toUpperCase()));
  const available = (record.availableCrms || [])
    .map(v => String(v || '').trim().toUpperCase())
    .filter(v => validSet.has(v));

  if (!available.length) return fullList.slice();

  return available;
}

function saveAvailableCrmForToday_(branch, crmList) {
  const branchUp = String(branch || '').trim().toUpperCase();
  const fullList = getCrmNamesByBranch_(branchUp);

  if (!branchUp) throw new Error('BRANCH IS REQUIRED.');
  if (!fullList.length) throw new Error('BRANCH NOT FOUND IN BRANCH_CRM_ALLOCATION.');

  if (fullList.length === 1 && fullList[0] === 'NA') {
    const payload = { date: getTodayDateKey_(), availableCrms: ['NA'] };
    PropertiesService.getScriptProperties().setProperty(getCrmDailyAvailabilityPropKey_(branchUp), JSON.stringify(payload));
    return payload;
  }

  const validSet = new Set(fullList.map(v => String(v || '').trim().toUpperCase()));
  const cleaned = (crmList || [])
    .map(v => String(v || '').trim().toUpperCase())
    .filter(v => validSet.has(v));

  if (!cleaned.length) throw new Error('PLEASE SELECT AT LEAST ONE CRM PRESENT TODAY.');

  const payload = { date: getTodayDateKey_(), availableCrms: cleaned };
  PropertiesService.getScriptProperties().setProperty(getCrmDailyAvailabilityPropKey_(branchUp), JSON.stringify(payload));
  return payload;
}

function getCrmAvailabilityForBranchToday(branch) {
  const branchUp = String(branch || '').trim().toUpperCase();
  const fullList = getCrmNamesByBranch_(branchUp);
  const record = getDailyAvailabilityRecord_(branchUp);
  const todayKey = getTodayDateKey_();

  let availableCrms = fullList.slice();
  let isSavedForToday = false;

  if (record && record.date === todayKey) {
    availableCrms = getAvailableCrmForBranchToday_(branchUp);
    isSavedForToday = true;
  }

  return { branch: branchUp, today: todayKey, allCrms: fullList, availableCrms, isSavedForToday };
}

function generateEntryToken_() {
  const ts = Utilities.formatDate(new Date(), CRM_CONFIG.TIMEZONE, 'yyyyMMddHHmmss');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MKQ-${ts}-${rand}`;
}

function normalizeQueuePhone_(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeQueueCountryCode_(value) {
  const digits = normalizeQueuePhone_(value);
  return digits || '91';
}

function buildQueueMobileWithCountry_(mobileValue, countryCodeValue) {
  const digits = normalizeQueuePhone_(mobileValue);
  const code = normalizeQueueCountryCode_(countryCodeValue);

  if (!digits) return '';

  // If user already pasted a full international number, keep it as-is.
  // Example: 919876543210 or 971501234567.
  if (digits.length > 10) return digits;

  // Otherwise save country code + local number in the same MOBILE column.
  // This lets the live Client Walk-in Form split the number correctly.
  return code + digits;
}

function assignCrmRoundRobin_(branch) {
  const branchUp = String(branch || '').trim().toUpperCase();
  const crmList = getAvailableCrmForBranchToday_(branchUp);

  if (!crmList.length) return 'NA';
  if (crmList.length === 1 && crmList[0] === 'NA') return 'NA';

  const props = PropertiesService.getScriptProperties();
  const key = 'RR_CRM_' + branchUp.replace(/\s+/g, '_');

  const last = parseInt(props.getProperty(key) || '-1', 10);
  const next = (last + 1) % crmList.length;

  props.setProperty(key, String(next));
  return crmList[next];
}

function registerClientEntryInWalkin(registerObj) {
  const branch = String((registerObj && registerObj.branch) || '').trim().toUpperCase();
  const clientName = String((registerObj && registerObj.clientName) || '').trim().toUpperCase();
  const countryCode = normalizeQueueCountryCode_((registerObj && registerObj.countryCode) || '91');
  const mobile = buildQueueMobileWithCountry_((registerObj && registerObj.mobile) || '', countryCode);

  if (!branch) throw new Error('BRANCH IS REQUIRED.');
  if (!clientName) throw new Error('CLIENT NAME IS REQUIRED.');
  if (!mobile) throw new Error('MOBILE NUMBER IS REQUIRED.');

  const sh = ensureEntryLogSheet_();
  const values = sh.getDataRange().getValues();

  if (values.length >= 2) {
    const headers = values[0].map(v => String(v || '').trim().toUpperCase());
    const col = (name) => headers.indexOf(String(name || '').trim().toUpperCase());

    const idxToken = col('TOKEN');
    const idxClientName = col('CLIENT NAME');
    const idxMobile = col('MOBILE');
    const idxBranch = col('BRANCH');
    const idxCrm = col('ASSIGNED CRM');
    const idxStatus = col('STATUS');
    const idxTs = col('ENTRY TIMESTAMP');

    for (let i = values.length - 1; i >= 1; i--) {
      const rowMobile = normalizeQueuePhone_(values[i][idxMobile] || '');
      const rowBranch = String(values[i][idxBranch] || '').trim().toUpperCase();
      const rowStatus = String(values[i][idxStatus] || '').trim().toUpperCase();

      if (rowMobile === mobile && rowBranch === branch && rowStatus === 'PENDING') {
        return {
          ok: true,
          token: idxToken >= 0 ? String(values[i][idxToken] || '').trim() : '',
          ts: idxTs >= 0 ? String(values[i][idxTs] || '').trim() : '',
          clientName: idxClientName >= 0 ? String(values[i][idxClientName] || '').trim() : clientName,
          mobile: mobile,
          branch: branch,
          assignedCRM: idxCrm >= 0 ? String(values[i][idxCrm] || '').trim() : '',
          status: 'PENDING'
        };
      }
    }
  }

  const assignedCRM = assignCrmRoundRobin_(branch);
  const token = generateEntryToken_();
  const ts = Utilities.formatDate(new Date(), CRM_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

  sh.appendRow([ts, token, clientName, mobile, branch, assignedCRM, 'PENDING', '', '', '']);

  return { ok: true, token, ts, clientName, mobile, branch, assignedCRM, status: 'PENDING' };
}

function findClientIdByAnyPhone_(mobile) {
  const target = last10_(normalizeQueuePhone_(mobile));
  if (!target) return '';

  const sh = getCrmSheet_(CRM_CONFIG.SHEETS.MASTER);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return '';

  const headers = values[0].map(v => String(v || '').trim().toUpperCase());
  const rows = values.slice(1);
  const col = (name) => headers.indexOf(String(name || '').trim().toUpperCase());

  const idxClientId = col('CLIENT ID');
  const idxPrimary = col('PRIMARY PHONE');
  const idxSecondary = col('SECONDARY PHONE');
  const idxBilling = col('BILLING PHONE');
  const idxOther = col('OTHER KNOWN PHONES');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const phones = [
      idxPrimary >= 0 ? row[idxPrimary] : '',
      idxSecondary >= 0 ? row[idxSecondary] : '',
      idxBilling >= 0 ? row[idxBilling] : ''
    ];

    const otherPhones = idxOther >= 0 ? String(row[idxOther] || '').split(',') : [];
    const allPhones = phones.concat(otherPhones);

    const matched = allPhones.some(p => last10_(normalizeQueuePhone_(p)) === target);
    if (matched) return String(row[idxClientId] || '').trim();
  }

  return '';
}

function getCrmQueueFromWalkin(crmName, branch) {
  const crmUp = String(crmName || '').trim().toUpperCase();
  const branchUp = String(branch || '').trim().toUpperCase();

  const sh = ensureEntryLogSheet_();
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(v => String(v || '').trim().toUpperCase());
  const rows = values.slice(1);
  const col = (name) => headers.indexOf(String(name || '').trim().toUpperCase());
  const out = [];

  rows.forEach((row, idx) => {
    const status = String(row[col('STATUS')] || '').trim().toUpperCase();
    const rowCRM = String(row[col('ASSIGNED CRM')] || '').trim().toUpperCase();
    const rowBranch = String(row[col('BRANCH')] || '').trim().toUpperCase();

    if (status !== 'PENDING') return;
    if (branchUp && rowBranch !== branchUp) return;
    if (crmUp && rowCRM !== crmUp) return;

    const mobile = String(row[col('MOBILE')] || '').trim();
    const matchedClientId = findClientIdByAnyPhone_(mobile);
    const isExisting = !!matchedClientId;

    out.push({
      rowIndex: idx + 2,
      token: String(row[col('TOKEN')] || '').trim(),
      ts: String(row[col('ENTRY TIMESTAMP')] || '').trim(),
      name: String(row[col('CLIENT NAME')] || '').trim(),
      mobile: mobile,
      branch: String(row[col('BRANCH')] || '').trim(),
      crm: String(row[col('ASSIGNED CRM')] || '').trim(),
      isExisting: isExisting,
      clientId: matchedClientId || '',
      actionText: isExisting ? 'MAKE WALK-IN ENTRY' : 'ADD WALKIN ENTRY'
    });
  });

  return out;
}

function buildWalkinFormUrlForQueue(item) {
  const base = CRM_CONFIG.WALKIN_WEBAPP_URL;
  if (!base) return '';

  const token = encodeURIComponent(item.token || '');

  if (item.isExisting && item.clientId) {
    return `${base}?mode=EXISTING_CLIENT&clientId=${encodeURIComponent(item.clientId)}&token=${token}`;
  }

  return `${base}?token=${token}`;
}

/**
 * EDIT WALK-IN ENTRY URL BUILDER
 *
 * IMPORTANT FIX:
 * WALKIN DATASET reference number has moved from DS to DY.
 * This CRM now resolves the live source row before opening the Walk-in Form
 * and passes rowNumber + referenceCol=129 to the Walk-in Form web app.
 *
 * The live Walk-in Form should use these parameters first:
 *   mode=EDIT_WALKIN_ENTRY
 *   referenceNumber=<ref>
 *   clientId=<client id>
 *   rowNumber=<WALKIN DATASET row>
 *   referenceCol=129
 *
 * This keeps old references working by also searching DS / 123 as fallback.
 */
function buildWalkinEditFormUrl_(referenceNumber, clientId) {
  const base = CRM_CONFIG.WALKIN_WEBAPP_URL;
  const ref = String(referenceNumber || '').trim();
  const cid = String(clientId || '').trim();

  if (!base || !ref) return '';

  const found = findWalkinSourceRowForEdit_(ref);

  const params = {
    mode: 'EDIT_WALKIN_ENTRY',
    referenceNumber: ref,
    clientId: cid,
    referenceCol: String(CRM_CONFIG.SOURCE_REFERENCE_COL || 129),
    legacyReferenceCols: (CRM_CONFIG.SOURCE_LEGACY_REFERENCE_COLS || []).join(','),
    sourceSpreadsheetId: getEffectiveWalkinSpreadsheetId_(),
    sourceSheetName: CRM_CONFIG.WALKIN_SHEET_NAME
  };

  if (found && found.rowNumber) params.rowNumber = String(found.rowNumber);
  if (found && found.referenceCol) params.foundReferenceCol = String(found.referenceCol);

  return base + '?' + Object.keys(params)
    .filter(k => params[k] !== null && params[k] !== undefined && String(params[k]).trim() !== '')
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(String(params[k])))
    .join('&');
}

function findWalkinSourceRowForEdit_(referenceNumber) {
  const ref = String(referenceNumber || '').trim().toUpperCase();
  if (!ref) return null;

  const sh = getWalkinSourceSheet_();
  const lastRow = sh.getLastRow();
  const lastCol = Math.max(sh.getLastColumn(), CRM_CONFIG.SOURCE_MIN_COLS || 132);

  if (lastRow < CRM_CONFIG.SOURCE_DATA_START_ROW) return null;

  const refCols = dedupeNumberArray_([
    CRM_CONFIG.SOURCE_REFERENCE_COL || 129,
    ...(CRM_CONFIG.SOURCE_LEGACY_REFERENCE_COLS || []),
    ...findReferenceHeaderColumns_(sh, lastCol)
  ]).filter(c => c > 0 && c <= lastCol);

  // Fast scan only possible reference columns first.
  for (let i = 0; i < refCols.length; i++) {
    const col = Number(refCols[i]);
    const values = sh.getRange(CRM_CONFIG.SOURCE_DATA_START_ROW, col, lastRow - CRM_CONFIG.SOURCE_DATA_START_ROW + 1, 1).getValues();

    for (let r = 0; r < values.length; r++) {
      const cellRef = normalizeReferenceForCompare_(values[r][0]);
      if (cellRef === ref) {
        return {
          rowNumber: CRM_CONFIG.SOURCE_DATA_START_ROW + r,
          referenceCol: col,
          referenceNumber: cellRef
        };
      }
    }
  }

  // Final fallback: scan whole row for reference-like value.
  const data = sh.getRange(CRM_CONFIG.SOURCE_DATA_START_ROW, 1, lastRow - CRM_CONFIG.SOURCE_DATA_START_ROW + 1, lastCol).getValues();
  for (let r = 0; r < data.length; r++) {
    const row = data[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cellRef = normalizeReferenceForCompare_(row[c]);
      if (cellRef === ref) {
        return {
          rowNumber: CRM_CONFIG.SOURCE_DATA_START_ROW + r,
          referenceCol: c + 1,
          referenceNumber: cellRef
        };
      }
    }
  }

  return null;
}

function normalizeReferenceForCompare_(value) {
  return String(value || '').trim().toUpperCase().replace(/_/g, '-').replace(/\s+/g, '-');
}

function dedupeNumberArray_(arr) {
  const seen = new Set();
  const out = [];
  (arr || []).forEach(v => {
    const n = Number(v);
    if (!n || isNaN(n)) return;
    if (seen.has(n)) return;
    seen.add(n);
    out.push(n);
  });
  return out;
}

function findReferenceHeaderColumns_(sheet, lastCol) {
  const headers = sheet.getRange(CRM_CONFIG.SOURCE_HEADER_ROW, 1, 1, lastCol).getValues()[0].map(h => cleanHeader_(h));
  const candidates = (CRM_CONFIG.SOURCE_HEADERS && CRM_CONFIG.SOURCE_HEADERS.referenceNumber)
    ? CRM_CONFIG.SOURCE_HEADERS.referenceNumber.map(h => cleanHeader_(h))
    : ['REFERENCE NUMBER', 'REFERENCE_NO', 'REFERENCE', 'REF NO', 'REF NUMBER'];

  const cols = [];
  headers.forEach((h, i) => {
    if (candidates.indexOf(h) >= 0) cols.push(i + 1);
  });
  return cols;
}

function debugWalkinEditReferenceLookupManual() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt(
    'Check Walk-in Edit Reference',
    'Paste reference number, for example MK-WK-KMX-BAN-TA-46800',
    ui.ButtonSet.OK_CANCEL
  );

  if (res.getSelectedButton() !== ui.Button.OK) return;

  const ref = String(res.getResponseText() || '').trim();
  const found = findWalkinSourceRowForEdit_(ref);

  if (!found) {
    ui.alert('REFERENCE NOT FOUND in WALKIN DATASET. Checked DY / 129, DS / 123, reference headers, and full row scan.');
    return;
  }

  ui.alert(
    'REFERENCE FOUND.\n\n' +
    'Reference: ' + found.referenceNumber + '\n' +
    'Row Number: ' + found.rowNumber + '\n' +
    'Reference Column: ' + found.referenceCol + '\n\n' +
    'Edit URL:\n' + buildWalkinEditFormUrl_(ref, '')
  );
}

function getCrmQueueWithActionUrls(crmName, branch) {
  const items = getCrmQueueFromWalkin(crmName, branch);
  return items.map(item => {
    item.actionUrl = buildWalkinFormUrlForQueue(item);
    return item;
  });
}

/**************************************************************
 * WEB APP / APIs
 **************************************************************/
function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) ? String(e.parameter.page).trim().toUpperCase() : 'APP';

  if (page === 'APP') {
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('MK JEWELS CRM')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService.createHtmlOutput('<h3>INVALID PAGE</h3>');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getCrmAppBootstrap() {
  initializeCrmSystem(false);
  ensureNotBoughtFollowupAutoSyncTrigger_();

  const stats = getDashboardStats_();
  return {
    ok: true,
    appName: 'MK JEWELS CRM',
    accentColor: '#c9a24a',
    walkinWebAppUrl: CRM_CONFIG.WALKIN_WEBAPP_URL,
    registerBranches: getWalkinBranchesForRegister(),
    branchCrmMaster: getEffectiveBranchCrmAllocation_(),
    queueCrmNames: getAllCrmNames_(),
    menu: [
      { id: 'dashboard', label: 'DASHBOARD' },
      { id: 'client_walkin_form', label: 'CLIENT WALKIN FORM' },
      { id: 'not_bought_follow_up', label: 'NOT BOUGHT FOLLOW UP' },
      { id: 'referrals_calling', label: 'REFERRALS CALLING' },
      { id: 'client_database', label: 'CLIENT DATABASE' }
    ],
    dashboard: stats
  };
}

function apiRegisterClientEntry(registerObj) {
  return registerClientEntryInWalkin(registerObj);
}

function apiGetQueueCrmNames(branch) {
  const branchUp = normalizeBranchName_(branch);

  // If branch is not selected, show all CRM names so the CRM Queue
  // dropdown is never blank. Branch selection will still filter when used.
  if (!branchUp) return getAllCrmNames_();

  return getCrmNamesByBranch_(branchUp);
}

function apiGetCrmQueue(crmName, branch) {
  return getCrmQueueWithActionUrls(crmName, branch);
}

function apiGetCrmAvailability(branch) {
  return getCrmAvailabilityForBranchToday(branch);
}

function apiSaveCrmAvailability(branch, crmList) {
  const result = saveAvailableCrmForToday_(branch, crmList);

  return {
    ok: true,
    branch: String(branch || '').trim().toUpperCase(),
    today: result.date,
    availableCrms: result.availableCrms
  };
}


function apiAddBranchCrmAllocation(branch, crmName) {
  return addBranchCrmAllocation_(branch, crmName);
}

function apiUpdateBranchCrmAllocation(oldBranch, oldCrmName, newBranch, newCrmName) {
  return updateBranchCrmAllocation_(oldBranch, oldCrmName, newBranch, newCrmName);
}

function apiDeleteBranchCrmAllocation(branch, crmName) {
  return deleteBranchCrmAllocation_(branch, crmName);
}

/** ==========================================================
 *  DASHBOARD API
 *  ==========================================================
 */
function getDashboardData(filter) {
  initializeCrmSystem(false);

  return {
    ok: true,
    appliedFilter: getDateRangeFromFilter_(filter),
    stats: getDashboardStats_(filter),
    recentVisits: getRecentVisits_(25, filter),
    branchBreakdown: getBranchBreakdown_(filter),
    crmBreakdown: getCrmBreakdown_(filter),
    trendChart: getDashboardTrendChartData_(filter)
  };
}

function rebuildDashboardCache() {
  initializeCrmSystem(false);

  const stats = getDashboardStats_();
  const branchBreakdown = getBranchBreakdown_();
  const crmBreakdown = getCrmBreakdown_();
  const recentVisits = getRecentVisits_(50);

  const cacheRows = [
    ['TOTAL_WALKINS', JSON.stringify(stats.totalWalkins), nowTs_()],
    ['TOTAL_NOT_BOUGHT', JSON.stringify(stats.totalNotBought), nowTs_()],
    ['TOTAL_BOUGHT', JSON.stringify(stats.totalBought), nowTs_()],
    ['TOTAL_ORDER_PLACE', JSON.stringify(stats.totalOrderPlace), nowTs_()],
    ['TOTAL_REPAIR_PLACE', JSON.stringify(stats.totalRepairPlace), nowTs_()],
    ['TOTAL_ORDER_PICKUP', JSON.stringify(stats.totalOrderPickup), nowTs_()],
    ['TOTAL_REPAIR_PICKUP', JSON.stringify(stats.totalRepairPickup), nowTs_()],
    ['TOTAL_UPSALE', JSON.stringify(stats.totalUpsale), nowTs_()],
    ['TOTAL_PRODUCT_RETURN', JSON.stringify(stats.totalProductReturn), nowTs_()],
    ['BRANCH_BREAKDOWN', JSON.stringify(branchBreakdown), nowTs_()],
    ['CRM_BREAKDOWN', JSON.stringify(crmBreakdown), nowTs_()],
    ['RECENT_VISITS', JSON.stringify(recentVisits), nowTs_()]
  ];

  const sh = getCrmSheet_(CRM_CONFIG.SHEETS.DASHBOARD_CACHE);
  sh.clearContents();
  sh.getRange(1, 1, 1, 3).setValues([getDashboardCacheHeaders_()]);
  sh.getRange(2, 1, cacheRows.length, 3).setValues(cacheRows);
  sh.setFrozenRows(1);

  return { ok: true, message: 'Dashboard cache rebuilt successfully.' };
}

function getDashboardStats_(filter) {
  const filteredTimelineRows = getFilteredTimelineRows_(filter);
  const totalWalkins = filteredTimelineRows.length;

  let totalNotBought = 0;
  let totalBought = 0;
  let totalOrderPlace = 0;
  let totalRepairPlace = 0;
  let totalOrderPickup = 0;
  let totalRepairPickup = 0;
  let totalUpsale = 0;
  let totalProductReturn = 0;

  const g = getStatusGroups_();

  filteredTimelineRows.forEach(obj => {
    const buy = upperTrim_(obj['BUY STATUS']).replace(/\s+/g, '_');

    if (g.nonBuyer.has(buy) && buy !== 'PRODUCT_RETURN') totalNotBought++;
    if (g.readyProduct.has(buy)) totalBought++;
    if (g.orderPlaced.has(buy)) totalOrderPlace++;
    if (g.repairPlaced.has(buy)) totalRepairPlace++;
    if (g.orderPickup.has(buy)) totalOrderPickup++;
    if (g.repairPickup.has(buy)) totalRepairPickup++;
    if (g.upsale.has(buy)) totalUpsale++;
    if (g.productReturn.has(buy)) totalProductReturn++;
  });

  return {
    totalWalkins,
    totalNotBought,
    totalBought,
    totalOrderPlace,
    totalRepairPlace,
    totalOrderPickup,
    totalRepairPickup,
    totalUpsale,
    totalProductReturn
  };
}

function getRecentVisits_(limit, filter) {
  const objRows = getFilteredTimelineRows_(filter);

  const today = new Date();
  const todayStr = Utilities.formatDate(today, CRM_CONFIG.TIMEZONE, 'yyyy-MM-dd');

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = Utilities.formatDate(yesterday, CRM_CONFIG.TIMEZONE, 'yyyy-MM-dd');

  const recentRows = objRows.filter(obj => {
    const eventDate = normalizeFilterDate_(obj['EVENT DATE'] || obj['TIMESTAMP']);
    return eventDate === todayStr || eventDate === yesterdayStr;
  });

  recentRows.sort((a, b) => {
    const da = parseDateSafe_(a['TIMESTAMP']) || parseDateSafe_(a['EVENT DATE']) || new Date(0);
    const db = parseDateSafe_(b['TIMESTAMP']) || parseDateSafe_(b['EVENT DATE']) || new Date(0);
    return db - da;
  });

  return recentRows.slice(0, limit || 25).map(r => ({
    timestamp: asText_(r['TIMESTAMP']).trim(),
    clientId: asText_(r['CLIENT ID']).trim(),
    eventDate: asText_(r['EVENT DATE']).trim(),
    eventType: asText_(r['EVENT TYPE']).trim(),
    buyStatus: asText_(r['BUY STATUS']).trim(),
    branch: asText_(r['BRANCH']).trim(),
    crmName: asText_(r['CRM NAME']).trim(),
    salesperson: asText_(r['SALESPERSON']).trim(),
    remark: asText_(r['REMARK']).trim(),
    referenceNumber: asText_(r['REFERENCE NUMBER']).trim()
  }));
}

function getBranchBreakdown_(filter) {
  const rows = getFilteredTimelineRows_(filter);
  const map = {};

  rows.forEach(obj => {
    const key = asText_(obj['BRANCH']).trim() || 'UNKNOWN';
    map[key] = (map[key] || 0) + 1;
  });

  return Object.keys(map)
    .map(k => ({ branch: k, count: map[k] }))
    .sort((a, b) => b.count - a.count);
}

function getCrmBreakdown_(filter) {
  const rows = getFilteredTimelineRows_(filter);
  const map = {};

  rows.forEach(obj => {
    const key = asText_(obj['CRM NAME']).trim() || 'UNKNOWN';
    map[key] = (map[key] || 0) + 1;
  });

  return Object.keys(map)
    .map(k => ({ crmName: k, count: map[k] }))
    .sort((a, b) => b.count - a.count);
}

function getDashboardTrendChartData_(filter) {
  const rows = getFilteredTimelineRows_(filter);
  const g = getStatusGroups_();
  const map = {};

  rows.forEach(obj => {
    const dateStr = normalizeFilterDate_(obj['EVENT DATE'] || obj['TIMESTAMP']);
    if (!dateStr) return;

    const buy = upperTrim_(obj['BUY STATUS']).replace(/\s+/g, '_');

    if (!map[dateStr]) {
      map[dateStr] = { label: dateStr, totalWalkins: 0, bought: 0, notBought: 0 };
    }

    map[dateStr].totalWalkins += 1;

    if (g.readyProduct.has(buy)) map[dateStr].bought += 1;
    if (buy === 'NO') map[dateStr].notBought += 1;
  });

  return Object.keys(map)
    .sort()
    .map(k => ({
      label: k,
      totalWalkins: map[k].totalWalkins,
      bought: map[k].bought,
      notBought: map[k].notBought
    }));
}

/** ==========================================================
 *  CLIENT SEARCH API
 *  ==========================================================
 */
function searchClients(query) {
  initializeCrmSystem(false);

  const q = upperTrim_(query);
  if (!q) return { ok: true, results: [] };

  const sh = getCrmSheet_(CRM_CONFIG.SHEETS.MASTER);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return { ok: true, results: [] };

  const headers = values[0];
  const rows = values.slice(1).map(r => rowToHeaderMap_(headers, r));
  const qDigits = normalizePhone_(q);
  const qLast10 = last10_(qDigits);

  const results = rows.filter(obj => clientMatchesSearch_(obj, q, qLast10))
    .map(obj => ({
      clientId: asText_(obj['CLIENT ID']).trim(),
      primaryName: asText_(obj['PRIMARY NAME']).trim(),
      primaryPhone: asText_(obj['PRIMARY PHONE']).trim(),
      secondaryPhone: asText_(obj['SECONDARY PHONE']).trim(),
      billingPhone: asText_(obj['BILLING PHONE']).trim(),
      city: asText_(obj['CITY']).trim(),
      state: asText_(obj['STATE']).trim(),
      totalVisits: Number(obj['TOTAL VISITS']) || 0,
      lastVisitDate: asText_(obj['LAST VISIT DATE']).trim(),
      lastStatus: asText_(obj['LAST BUY STATUS']).trim()
    }))
    .sort((a, b) => {
      const da = parseDateSafe_(a.lastVisitDate) || new Date(0);
      const db = parseDateSafe_(b.lastVisitDate) || new Date(0);
      return db - da;
    })
    .slice(0, 200);

  return { ok: true, results };
}

function clientMatchesSearch_(obj, qUpper, qLast10) {
  const textFields = [
    asText_(obj['PRIMARY NAME']).trim().toUpperCase(),
    asText_(obj['OTHER NAMES']).trim().toUpperCase()
  ];

  if (textFields.some(v => v.includes(qUpper))) return true;

  if (qLast10) {
    const phoneFields = [
      asText_(obj['PRIMARY PHONE']).trim(),
      asText_(obj['SECONDARY PHONE']).trim(),
      asText_(obj['BILLING PHONE']).trim(),
      ...splitList_(obj['OTHER KNOWN PHONES'])
    ];

    const matched = phoneFields.some(p => last10_(normalizePhone_(p)) === qLast10);
    if (matched) return true;
  }

  return false;
}

/** ==========================================================
 *  CLIENT PROFILE API
 *  ==========================================================
 */
function getClientProfile(clientId) {
  initializeCrmSystem(false);

  const masterObj = getMasterRecordByClientId_(clientId);
  if (!masterObj) return { ok: false, message: 'Client not found.' };

  const timeline = getTimelineByClientId_(clientId);

  return {
    ok: true,
    profile: {
      clientId: asText_(masterObj['CLIENT ID']).trim(),
      phoneKey: asText_(masterObj['PHONE KEY']).trim(),
      primaryName: asText_(masterObj['PRIMARY NAME']).trim(),
      otherNames: asText_(masterObj['OTHER NAMES']).trim(),
      primaryPhone: asText_(masterObj['PRIMARY PHONE']).trim(),
      secondaryPhone: asText_(masterObj['SECONDARY PHONE']).trim(),
      billingPhone: asText_(masterObj['BILLING PHONE']).trim(),
      otherKnownPhones: asText_(masterObj['OTHER KNOWN PHONES']).trim(),
      gender: asText_(masterObj['GENDER']).trim(),
      country: asText_(masterObj['COUNTRY']).trim(),
      state: asText_(masterObj['STATE']).trim(),
      city: asText_(masterObj['CITY']).trim(),
      cityOther: asText_(masterObj['CITY OTHER']).trim(),
      pincode: asText_(masterObj['PINCODE']).trim(),
      address: asText_(masterObj['ADDRESS']).trim(),
      community: asText_(masterObj['COMMUNITY']).trim(),
      communityOther: asText_(masterObj['COMMUNITY OTHER']).trim(),
      dob: asText_(masterObj['DOB']).trim(),
      anniversary: asText_(masterObj['ANNIVERSARY']).trim(),
      beverage: asText_(masterObj['BEVERAGE']).trim(),
      sugar: asText_(masterObj['SUGAR']).trim(),
      snack: asText_(masterObj['SNACK']).trim(),
      giftHistory: asText_(masterObj['GIFT HISTORY']).trim(),
      firstVisitDate: asText_(masterObj['FIRST VISIT DATE']).trim(),
      lastVisitDate: asText_(masterObj['LAST VISIT DATE']).trim(),
      totalVisits: Number(masterObj['TOTAL VISITS']) || 0,
      totalPurchaseVisits: Number(masterObj['TOTAL PURCHASE VISITS']) || 0,
      totalNonPurchaseVisits: Number(masterObj['TOTAL NON PURCHASE VISITS']) || 0,
      totalRepairVisits: Number(masterObj['TOTAL REPAIR VISITS']) || 0,
      totalOrderVisits: Number(masterObj['TOTAL ORDER VISITS']) || 0,
      lastBuyStatus: asText_(masterObj['LAST BUY STATUS']).trim(),
      lastBranch: asText_(masterObj['LAST BRANCH']).trim(),
      lastCrm: asText_(masterObj['LAST CRM']).trim(),
      lastSalesperson: asText_(masterObj['LAST SALESPERSON']).trim(),
      lastRemark: asText_(masterObj['LAST REMARK']).trim(),
      lastProductRequirement: asText_(masterObj['LAST PRODUCT REQUIREMENT']).trim(),
      lastSeenCategories: asText_(masterObj['LAST SEEN CATEGORIES']).trim(),
      lastBoughtCategories: asText_(masterObj['LAST BOUGHT CATEGORIES']).trim(),
      lastOrderCategories: asText_(masterObj['LAST ORDER CATEGORIES']).trim(),
      clientPotentialCategory: asText_(masterObj['CLIENT POTENTIAL CATEGORY']).trim(),
      highPotentialReason: asText_(masterObj['HIGH POTENTIAL REASON']).trim(),
      instagramStatus: asText_(masterObj['INSTAGRAM STATUS']).trim(),
      googleReviewStatus: asText_(masterObj['GOOGLE REVIEW STATUS']).trim(),
      testimonialStatus: asText_(masterObj['TESTIMONIAL STATUS']).trim(),
      referralStatus: asText_(masterObj['REFERRAL STATUS']).trim(),
      nextVisitDate: asText_(masterObj['NEXT VISIT DATE']).trim(),
      profileLastUpdatedOn: asText_(masterObj['PROFILE LAST UPDATED ON']).trim(),
      profileUpdatedBy: asText_(masterObj['PROFILE UPDATED BY']).trim()
    },
    timeline
  };
}

function getTimelineByClientId(clientId) {
  initializeCrmSystem(false);
  return { ok: true, timeline: getTimelineByClientId_(clientId) };
}

function getTimelineByClientId_(clientId) {
  const sh = getCrmSheet_(CRM_CONFIG.SHEETS.TIMELINE);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  const rows = values.slice(1).map(r => rowToHeaderMap_(headers, r));

  return rows
    .filter(obj => asText_(obj['CLIENT ID']).trim() === asText_(clientId).trim())
    .map(obj => {
      const referenceNumber = asText_(obj['REFERENCE NUMBER']).trim();

      return {
        timestamp: asText_(obj['TIMESTAMP']).trim(),
        clientId: asText_(obj['CLIENT ID']).trim(),
        eventDate: asText_(obj['EVENT DATE']).trim(),
        eventType: asText_(obj['EVENT TYPE']).trim(),
        buyStatus: asText_(obj['BUY STATUS']).trim(),
        branch: asText_(obj['BRANCH']).trim(),
        crmName: asText_(obj['CRM NAME']).trim(),
        salesperson: asText_(obj['SALESPERSON']).trim(),
        seenCategories: asText_(obj['SEEN CATEGORIES']).trim(),
        boughtCategories: asText_(obj['BOUGHT CATEGORIES']).trim(),
        orderCategories: asText_(obj['ORDER CATEGORIES']).trim(),
        productRequirement: asText_(obj['PRODUCT REQUIREMENT']).trim(),
        remark: asText_(obj['REMARK']).trim(),
        referenceNumber: referenceNumber,
        canEdit: !!referenceNumber,
        editUrl: buildWalkinEditFormUrl_(referenceNumber, clientId)
      };
    })
    .sort((a, b) => {
      const da = parseDateSafe_(a.timestamp) || parseDateSafe_(a.eventDate) || new Date(0);
      const db = parseDateSafe_(b.timestamp) || parseDateSafe_(b.eventDate) || new Date(0);
      return db - da;
    });
}

/** ==========================================================
 *  PROFILE EDIT API
 *  ==========================================================
 */
function updateClientProfile(payload) {
  initializeCrmSystem(false);

  if (!payload || !payload.clientId) return { ok: false, message: 'clientId is required.' };

  const clientId = asText_(payload.clientId).trim();
  const editedBy = upperTrim_(payload.editedBy || 'MANUAL CRM EDIT');

  const sh = getCrmSheet_(CRM_CONFIG.SHEETS.MASTER);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return { ok: false, message: 'Master sheet has no client data.' };

  const headers = values[0];
  const rows = values.slice(1);

  let targetRowIndex = -1;
  let currentObj = null;

  for (let i = 0; i < rows.length; i++) {
    const obj = rowToHeaderMap_(headers, rows[i]);
    if (asText_(obj['CLIENT ID']).trim() === clientId) {
      targetRowIndex = i + 2;
      currentObj = obj;
      break;
    }
  }

  if (targetRowIndex < 0 || !currentObj) return { ok: false, message: 'Client not found in master.' };

  const allowedFields = new Set([
    'PRIMARY NAME', 'OTHER NAMES', 'PRIMARY PHONE', 'SECONDARY PHONE', 'BILLING PHONE', 'OTHER KNOWN PHONES',
    'GENDER', 'COUNTRY', 'STATE', 'CITY', 'CITY OTHER', 'PINCODE', 'ADDRESS', 'COMMUNITY', 'COMMUNITY OTHER',
    'DOB', 'ANNIVERSARY', 'BEVERAGE', 'SUGAR', 'SNACK', 'GIFT HISTORY', 'LAST REMARK', 'LAST PRODUCT REQUIREMENT',
    'LAST SEEN CATEGORIES', 'LAST BOUGHT CATEGORIES', 'LAST ORDER CATEGORIES', 'CLIENT POTENTIAL CATEGORY',
    'HIGH POTENTIAL REASON', 'INSTAGRAM STATUS', 'GOOGLE REVIEW STATUS', 'TESTIMONIAL STATUS', 'REFERRAL STATUS', 'NEXT VISIT DATE'
  ]);

  const updates = {};
  Object.keys(payload).forEach(k => {
    const headerName = cleanHeader_(k);
    if (allowedFields.has(headerName)) updates[headerName] = asText_(payload[k]).trim();
  });

  if (!Object.keys(updates).length) return { ok: false, message: 'No editable fields provided.' };

  const newObj = Object.assign({}, currentObj);
  const editRows = [];

  Object.keys(updates).forEach(fieldName => {
    const oldVal = asText_(currentObj[fieldName]).trim();
    const newVal = updates[fieldName];

    if (oldVal !== newVal) {
      newObj[fieldName] = newVal;
      editRows.push([nowTs_(), clientId, editedBy, 'MANUAL_PROFILE_EDIT', fieldName, oldVal, newVal]);
    }
  });

  const recomputedPhoneKey = derivePhoneKey_(normalizePhone_(newObj['BILLING PHONE']), normalizePhone_(newObj['PRIMARY PHONE']));
  const recomputedNameKey = deriveNameKey_(newObj['PRIMARY NAME']);

  if (asText_(newObj['PHONE KEY']).trim() !== recomputedPhoneKey) {
    editRows.push([nowTs_(), clientId, editedBy, 'MANUAL_PROFILE_EDIT', 'PHONE KEY', asText_(newObj['PHONE KEY']).trim(), recomputedPhoneKey]);
    newObj['PHONE KEY'] = recomputedPhoneKey;
  }

  if (asText_(newObj['NAME KEY']).trim() !== recomputedNameKey) {
    editRows.push([nowTs_(), clientId, editedBy, 'MANUAL_PROFILE_EDIT', 'NAME KEY', asText_(newObj['NAME KEY']).trim(), recomputedNameKey]);
    newObj['NAME KEY'] = recomputedNameKey;
  }

  newObj['PROFILE LAST UPDATED ON'] = nowTs_();
  newObj['PROFILE UPDATED BY'] = editedBy;

  const rowValues = headers.map(h => newObj[h] != null ? newObj[h] : '');
  sh.getRange(targetRowIndex, 1, 1, headers.length).setValues([rowValues]);

  appendRowsIfAny_(getCrmSheet_(CRM_CONFIG.SHEETS.EDIT_LOG), editRows);

  return { ok: true, message: 'Client profile updated successfully.', clientId };
}

/** ==========================================================
 *  CLIENT LOOKUP HELPERS
 *  ==========================================================
 */
function getMasterRecordByClientId_(clientId) {
  const sh = getCrmSheet_(CRM_CONFIG.SHEETS.MASTER);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return null;

  const headers = values[0];
  const rows = values.slice(1);

  for (let i = 0; i < rows.length; i++) {
    const obj = rowToHeaderMap_(headers, rows[i]);
    if (asText_(obj['CLIENT ID']).trim() === asText_(clientId).trim()) return obj;
  }

  return null;
}

function getClientQuickList(limit) {
  initializeCrmSystem(false);

  const sh = getCrmSheet_(CRM_CONFIG.SHEETS.MASTER);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return { ok: true, results: [] };

  const headers = values[0];
  const rows = values.slice(1).map(r => rowToHeaderMap_(headers, r));

  rows.sort((a, b) => {
    const da = parseDateSafe_(a['LAST VISIT DATE']) || new Date(0);
    const db = parseDateSafe_(b['LAST VISIT DATE']) || new Date(0);
    return db - da;
  });

  return {
    ok: true,
    results: rows.slice(0, limit || 100).map(obj => ({
      clientId: asText_(obj['CLIENT ID']).trim(),
      primaryName: asText_(obj['PRIMARY NAME']).trim(),
      primaryPhone: asText_(obj['PRIMARY PHONE']).trim(),
      secondaryPhone: asText_(obj['SECONDARY PHONE']).trim(),
      billingPhone: asText_(obj['BILLING PHONE']).trim(),
      city: asText_(obj['CITY']).trim(),
      state: asText_(obj['STATE']).trim(),
      totalVisits: Number(obj['TOTAL VISITS']) || 0,
      lastVisitDate: asText_(obj['LAST VISIT DATE']).trim(),
      lastStatus: asText_(obj['LAST BUY STATUS']).trim()
    }))
  };
}

/** ==========================================================
 *  WALK-IN LINK PAGE API
 *  ==========================================================
 */
function getWalkinLaunchData() {
  return {
    ok: true,
    buttonLabel: 'NEW WALK-IN ENTRY',
    url: CRM_CONFIG.WALKIN_WEBAPP_URL,
    openInNewTab: true
  };
}

/** ==========================================================
 *  OPTIONAL ADMIN HELPERS
 *  ==========================================================
 */
function resetIncrementalSyncCheckpoint() {
  PropertiesService.getScriptProperties().deleteProperty(CRM_CONFIG.PROP_LAST_SYNC_TS);
  return { ok: true, message: 'Incremental sync checkpoint reset.' };
}

function getSystemHealth() {
  initializeCrmSystem(false);

  const masterSh = getCrmSheet_(CRM_CONFIG.SHEETS.MASTER);
  const timelineSh = getCrmSheet_(CRM_CONFIG.SHEETS.TIMELINE);
  const editSh = getCrmSheet_(CRM_CONFIG.SHEETS.EDIT_LOG);
  const cacheSh = getCrmSheet_(CRM_CONFIG.SHEETS.DASHBOARD_CACHE);

  return {
    ok: true,
    sourceSpreadsheetId: getEffectiveWalkinSpreadsheetId_(),
    configuredSourceSpreadsheetId: CRM_CONFIG.WALKIN_SPREADSHEET_ID,
    sourceSheetName: CRM_CONFIG.WALKIN_SHEET_NAME,
    walkinWebAppUrl: CRM_CONFIG.WALKIN_WEBAPP_URL,
    lastSyncTs: getLastSyncTs_() ? getLastSyncTs_().toISOString() : '',
    sheets: {
      master: { name: CRM_CONFIG.SHEETS.MASTER, rows: Math.max(masterSh.getLastRow() - 1, 0) },
      timeline: { name: CRM_CONFIG.SHEETS.TIMELINE, rows: Math.max(timelineSh.getLastRow() - 1, 0) },
      editLog: { name: CRM_CONFIG.SHEETS.EDIT_LOG, rows: Math.max(editSh.getLastRow() - 1, 0) },
      dashboardCache: { name: CRM_CONFIG.SHEETS.DASHBOARD_CACHE, rows: Math.max(cacheSh.getLastRow() - 1, 0) }
    }
  };
}

/** ==========================================================
 *  SERVER-SIDE TEST FUNCTIONS
 *  ==========================================================
 */
function debug_searchClients() {
  Logger.log(JSON.stringify(searchClients('MUMBAI'), null, 2));
}

function debug_getDashboardData() {
  Logger.log(JSON.stringify(getDashboardData(), null, 2));
}

function debug_getSystemHealth() {
  Logger.log(JSON.stringify(getSystemHealth(), null, 2));
}

function debug_getFirstClientProfile() {
  const quick = getClientQuickList(1);
  if (!quick.results.length) {
    Logger.log('No client found.');
    return;
  }
  const clientId = quick.results[0].clientId;
  Logger.log(JSON.stringify(getClientProfile(clientId), null, 2));
}

/** ==========================================================
 *  SMALL COMMON HELPERS
 *  ==========================================================
 */
function nowTs_() {
  return Utilities.formatDate(new Date(), CRM_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

function normalizeFilterDate_(value) {
  if (!value) return '';
  const d = parseDateSafe_(value);
  if (!d) return '';
  return Utilities.formatDate(d, CRM_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function getDateRangeFromFilter_(filter) {
  const today = new Date();
  const todayStr = Utilities.formatDate(today, CRM_CONFIG.TIMEZONE, 'yyyy-MM-dd');

  const f = filter || {};
  const mode = upperTrim_(f.mode || 'ALL');

  let startDate = '';
  let endDate = todayStr;

  if (mode === 'ALL') return { mode: 'ALL', startDate: '', endDate: '' };

  if (mode === 'DATE_TO_DATE') {
    startDate = normalizeFilterDate_(f.startDate);
    endDate = normalizeFilterDate_(f.endDate || f.startDate);

    if (!startDate) startDate = todayStr;
    if (!endDate) endDate = startDate;

    if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }

    return { mode, startDate, endDate };
  }

  if (mode === 'WEEK') {
    const day = new Date(today);
    const jsDay = day.getDay();
    const diffToMonday = jsDay === 0 ? 6 : jsDay - 1;
    day.setDate(day.getDate() - diffToMonday);
    startDate = Utilities.formatDate(day, CRM_CONFIG.TIMEZONE, 'yyyy-MM-dd');
    return { mode, startDate, endDate };
  }

  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  startDate = Utilities.formatDate(firstDay, CRM_CONFIG.TIMEZONE, 'yyyy-MM-dd');
  return { mode: 'MONTH', startDate, endDate };
}

function isDateWithinRange_(dateValue, startDate, endDate) {
  const dateStr = normalizeFilterDate_(dateValue);
  if (!dateStr) return false;
  return dateStr >= startDate && dateStr <= endDate;
}

function getFilteredTimelineRows_(filter) {
  const sh = getCrmSheet_(CRM_CONFIG.SHEETS.TIMELINE);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  const rows = values.slice(1).map(r => rowToHeaderMap_(headers, r));
  const range = getDateRangeFromFilter_(filter);

  if (range.mode === 'ALL') return rows;

  return rows.filter(obj => isDateWithinRange_(obj['EVENT DATE'] || obj['TIMESTAMP'], range.startDate, range.endDate));
}

/** ==========================================================
 *  MANUAL RUNNERS
 *  ==========================================================
 */
function initializeCrmSystemManual() {
  initializeCrmSystem(true);
}

function runHistoricalBackfillManual() {
  const result = runHistoricalBackfill();
  SpreadsheetApp.getUi().alert(result.message);
}

function runIncrementalSyncManual() {
  const result = runIncrementalSync();
  SpreadsheetApp.getUi().alert(result.message);
}

function rebuildCrmFromWalkinSource() {
  initializeCrmSystem(false);

  const lock = LockService.getScriptLock();
  const gotLock = lock.tryLock(120000);

  if (!gotLock) {
    return {
      ok: false,
      processedCount: 0,
      skippedNoRef: 0,
      skippedDuplicateRef: 0,
      sourceRowsRead: 0,
      masterClients: 0,
      message: 'Another CRM sync/rebuild is already running. Please wait 2 minutes and run again.'
    };
  }

  try {
    const masterSh = getCrmSheet_(CRM_CONFIG.SHEETS.MASTER);
    const timelineSh = getCrmSheet_(CRM_CONFIG.SHEETS.TIMELINE);
    const editLogSh = getCrmSheet_(CRM_CONFIG.SHEETS.EDIT_LOG);

    masterSh.clearContents();
    timelineSh.clearContents();
    editLogSh.clearContents();

    masterSh.getRange(1, 1, 1, getMasterHeaders_().length).setValues([getMasterHeaders_()]);
    timelineSh.getRange(1, 1, 1, getTimelineHeaders_().length).setValues([getTimelineHeaders_()]);
    editLogSh.getRange(1, 1, 1, getEditLogHeaders_().length).setValues([getEditLogHeaders_()]);

    masterSh.setFrozenRows(1);
    timelineSh.setFrozenRows(1);
    editLogSh.setFrozenRows(1);

    const sourceRows = readAllWalkinRows_();
    const masterState = readMasterState_();

    const outTimelineRows = [];
    const outEditLogRows = [];
    const seenRefs = new Set();

    let processedCount = 0;
    let skippedNoRef = 0;
    let skippedDuplicateRef = 0;

    sourceRows.forEach(rowObj => {
      const normalized = normalizeWalkinRow_(rowObj);
      if (!normalized.referenceNumber) {
        skippedNoRef++;
        return;
      }

      const refKey = String(normalized.referenceNumber || '').trim().toUpperCase();
      if (seenRefs.has(refKey)) {
        skippedDuplicateRef++;
        return;
      }
      seenRefs.add(refKey);

      const clientId = upsertClientFromVisit_(
        masterState,
        normalized,
        outEditLogRows,
        'FULL_REBUILD_FROM_WALKIN'
      );

      writeClientIdBackToWalkinRow_(normalized.sourceRowNumber, clientId);

      outTimelineRows.push(buildTimelineRow_(normalized, clientId));
      processedCount++;
    });

    flushMasterState_(masterState);
    appendRowsIfAny_(timelineSh, outTimelineRows);
    appendRowsIfAny_(editLogSh, outEditLogRows);

    setLastSyncTs_(new Date());

    return {
      ok: true,
      processedCount,
      skippedNoRef,
      skippedDuplicateRef,
      sourceRowsRead: sourceRows.length,
      masterClients: masterState.rowsByClientId.size,
      message:
        'CRM rebuilt from Walk-in source.\n\n' +
        'Source rows read: ' + sourceRows.length + '\n' +
        'Processed visits: ' + processedCount + '\n' +
        'Skipped no DY / 129 reference: ' + skippedNoRef + '\n' +
        'Skipped duplicate reference: ' + skippedDuplicateRef + '\n' +
        'Master clients: ' + masterState.rowsByClientId.size
    };

  } finally {
    lock.releaseLock();
  }
}

function rebuildCrmFromWalkinSourceManual() {
  const result = rebuildCrmFromWalkinSource();
  SpreadsheetApp.getUi().alert(result.message);
}

function resetCrmCompletely() {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty(CRM_CONFIG.PROP_LAST_SYNC_TS);
  props.deleteProperty(CRM_CONFIG.PROP_CLIENT_ID_COUNTER);

  initializeCrmSystem(false);

  const ss = getCrmSpreadsheet_();

  const sheetHeaderMap = {};
  sheetHeaderMap[CRM_CONFIG.SHEETS.MASTER] = getMasterHeaders_();
  sheetHeaderMap[CRM_CONFIG.SHEETS.TIMELINE] = getTimelineHeaders_();
  sheetHeaderMap[CRM_CONFIG.SHEETS.EDIT_LOG] = getEditLogHeaders_();
  sheetHeaderMap[CRM_CONFIG.SHEETS.DASHBOARD_CACHE] = getDashboardCacheHeaders_();

  Object.keys(sheetHeaderMap).forEach(sheetName => {
    const sh = ss.getSheetByName(sheetName);
    if (!sh) return;

    const headers = sheetHeaderMap[sheetName];
    sh.clearContents();
    sh.clearFormats();
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  });

  return {
    ok: true,
    message: 'CRM reset completed. Headers kept, all data rows cleared.'
  };
}

function resetCrmCompletelyManual() {
  const result = resetCrmCompletely();
  SpreadsheetApp.getUi().alert(result.message);
}

function installIncrementalSyncTrigger() {
  const handler = 'runIncrementalSync';

  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === handler) ScriptApp.deleteTrigger(trigger);
  });

  ScriptApp.newTrigger(handler)
    .timeBased()
    .everyMinutes(5)
    .create();

  SpreadsheetApp.getUi().alert('5 minute incremental sync trigger installed.');
}

function clearWalkinCrmClientIdsManual() {
  const sh = getWalkinSourceSheet_();
  const lastRow = sh.getMaxRows();
  const lastCol = Math.max(sh.getLastColumn(), CRM_CONFIG.SOURCE_MIN_COLS);

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('No data rows found.');
    return;
  }

  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(h => cleanHeader_(h));
  let col = headers.indexOf('CRM CLIENT ID') + 1;

  if (col <= 0) col = CRM_CONFIG.SOURCE_CRM_CLIENT_ID_COL;

  sh.getRange(2, col, lastRow - 1, 1).clearContent();

  SpreadsheetApp.getUi().alert('CRM CLIENT ID cleared from WALKIN DATASET. Now run Rebuild CRM From Walk-in Source.');
}


/**************************************************************
 * ADD-ON MODULE: NOT BOUGHT FOLLOW UP SYSTEM
 * This module is added without changing old CRM logic.
 * Purpose:
 * - Pick all walk-in clients where CLIENT BOUGHT ANY PRODUCT? = NO
 * - Store them in a separate follow-up spreadsheet
 * - Show CRM-wise Today Follow Up / All Pending / All Done
 * - Save every follow-up attempt in history
 **************************************************************/
const NB_FOLLOWUP_CONFIG = {
  // New folder where the active and closed Not Bought Google Sheets will be created/kept.
  FOLDER_ID: '1ZzwNTVCxwPz8p4cLG0PX98ilthc7LmE5',

  // Active follow-up Google Sheet file name.
  ACTIVE_SPREADSHEET_NAME: 'NOT BOUGHT FOLLOW UP_2025-2027',

  // Closed / no-requirement Google Sheet file name.
  CLOSED_SPREADSHEET_NAME: 'NOT BOUGHT- NO REQUIREMENT AT THE MOMENT- 2025-2027',

  PROP_ACTIVE_SPREADSHEET_ID: 'MK_NB_ACTIVE_SPREADSHEET_ID_2025_2027',
  PROP_CLOSED_SPREADSHEET_ID: 'MK_NB_CLOSED_SPREADSHEET_ID_2025_2027',

  SHEETS: {
    MASTER: 'NOT BOUGHT FOLLOW UP_2025-2027',
    HISTORY: 'NOT BOUGHT FOLLOW UP HISTORY',
    LEADS: 'NOT BOUGHT- NO REQUIREMENT AT THE MOMENT- 2025-2027'
  },
  DONE_STATUSES: [
    'ALREADY PURCHASED FROM MK JEWELS',
    'ALREADY PURCHASED FROM ANOTHER JEWELLER',
    'NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)',
    'CALL NOT PICKED'
  ],
  ACTIVE_STATUSES: [
    'PENDING',
    'CLIENT ASKED TO CALL LATER',
    'INTERESTED - NEED FOLLOW UP',
    'NEGOTIATION / PRICE DISCUSSION',
    'VISIT PLANNED',
    'WHATSAPP SENT',
    'NOT DECIDED YET'
  ],
  TIMEZONE: CRM_CONFIG.TIMEZONE
};

function getNbFollowupMasterHeaders_() {
  return [
    'CREATED ON',
    'UPDATED ON',
    'CLIENT ID',
    'REFERENCE NUMBER',
    'CLIENT NAME',
    'PRIMARY PHONE',
    'BILLING PHONE',
    'BRANCH',
    'CRM NAME',
    'SALESPERSON',
    'EVENT DATE',
    'SEEN CATEGORIES',
    'PRODUCT REQUIREMENT',
    'NOT BOUGHT REASON',
    'OTHER STORE / BRANCH',
    'MORE DESIGN CATEGORIES',
    'LAST WALKIN REMARK',
    'ACTION POINT',
    'FOLLOW UP STATUS',
    'NEXT FOLLOW UP DATE',
    'LAST FOLLOW UP DATE',
    'FOLLOW UP COUNT',
    'LAST FOLLOW UP REMARK',
    'FINAL OUTCOME',
    'SOURCE'
  ];
}

function getNbFollowupHistoryHeaders_() {
  return [
    'TIMESTAMP',
    'CLIENT ID',
    'REFERENCE NUMBER',
    'CLIENT NAME',
    'PHONE',
    'CRM NAME',
    'OLD STATUS',
    'NEW STATUS',
    'FOLLOW UP DATE',
    'NEXT FOLLOW UP DATE',
    'CALL RESPONSE',
    'REMARK',
    'ACTION POINT',
    'ENTERED BY'
  ];
}

function getNbLeadsHeaders_() {
  return [
    'CLIENT ID',
    'CLIENT NAME',
    'PRIMARY PHONE',
    'BILLING PHONE',
    'BRANCH',
    'CRM NAME',
    'SALESPERSON',
    'EVENT DATE',
    'SEEN CATEGORIES',
    'PRODUCT REQUIREMENT',
    'NOT BOUGHT REASON',
    'OTHER STORE / BRANCH',
    'MORE DESIGN CATEGORIES',
    'LAST WALKIN REMARK',
    'ACTION POINT',
    'FOLLOW UP STATUS'
  ];
}


function getOrCreateNbSpreadsheetInFolder_(spreadsheetName, propKey) {
  const props = PropertiesService.getScriptProperties();
  const savedId = String(props.getProperty(propKey) || '').trim();

  if (savedId) {
    try {
      return SpreadsheetApp.openById(savedId);
    } catch (e) {
      props.deleteProperty(propKey);
    }
  }

  const folder = DriveApp.getFolderById(NB_FOLLOWUP_CONFIG.FOLDER_ID);
  const files = folder.getFilesByName(spreadsheetName);

  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType && file.getMimeType() !== MimeType.GOOGLE_SHEETS) continue;
    props.setProperty(propKey, file.getId());
    return SpreadsheetApp.openById(file.getId());
  }

  const ss = SpreadsheetApp.create(spreadsheetName);
  const file = DriveApp.getFileById(ss.getId());

  try {
    file.moveTo(folder);
  } catch (err) {
    folder.addFile(file);
    try { DriveApp.getRootFolder().removeFile(file); } catch (ignore) {}
  }

  props.setProperty(propKey, ss.getId());
  return ss;
}

function getNbActiveFollowupSpreadsheet_() {
  return getOrCreateNbSpreadsheetInFolder_(
    NB_FOLLOWUP_CONFIG.ACTIVE_SPREADSHEET_NAME,
    NB_FOLLOWUP_CONFIG.PROP_ACTIVE_SPREADSHEET_ID
  );
}

function getNbClosedFollowupSpreadsheet_() {
  return getOrCreateNbSpreadsheetInFolder_(
    NB_FOLLOWUP_CONFIG.CLOSED_SPREADSHEET_NAME,
    NB_FOLLOWUP_CONFIG.PROP_CLOSED_SPREADSHEET_ID
  );
}

function getNbFollowupSpreadsheet_(sheetName) {
  // Active data and active history stay in active file.
  // Closed statuses are copied into the separate closed/no-requirement file.
  if (String(sheetName || '').trim() === NB_FOLLOWUP_CONFIG.SHEETS.LEADS) {
    return getNbClosedFollowupSpreadsheet_();
  }
  return getNbActiveFollowupSpreadsheet_();
}

function getNbFollowupSheet_(sheetName) {
  const ss = getNbFollowupSpreadsheet_(sheetName);
  let sh = ss.getSheetByName(sheetName);
  if (!sh) sh = ss.insertSheet(sheetName);

  const headers = sheetName === NB_FOLLOWUP_CONFIG.SHEETS.HISTORY
    ? getNbFollowupHistoryHeaders_()
    : (sheetName === NB_FOLLOWUP_CONFIG.SHEETS.LEADS
        ? getNbLeadsHeaders_()
        : getNbFollowupMasterHeaders_());

  const existing = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  const mismatch = headers.some((h, i) => String(existing[i] || '').trim() !== h);
  if (sh.getLastRow() === 0 || mismatch) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function ensureNotBoughtFollowupAutoSyncTrigger_() {
  const handler = 'syncNotBoughtFollowupsFromWalkin';
  try {
    const exists = ScriptApp.getProjectTriggers()
      .some(trigger => trigger.getHandlerFunction && trigger.getHandlerFunction() === handler);

    if (!exists) {
      ScriptApp.newTrigger(handler)
        .timeBased()
        .everyMinutes(5)
        .create();
    }
  } catch (err) {
    Logger.log('ensureNotBoughtFollowupAutoSyncTrigger_ failed: ' + (err && err.stack ? err.stack : err));
  }
}


function getNbClosedHistorySheet_() {
  const ss = getNbClosedFollowupSpreadsheet_();
  const sheetName = NB_FOLLOWUP_CONFIG.SHEETS.HISTORY;
  let sh = ss.getSheetByName(sheetName);
  if (!sh) sh = ss.insertSheet(sheetName);

  const headers = getNbFollowupHistoryHeaders_();
  const existing = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  const mismatch = headers.some((h, i) => String(existing[i] || '').trim() !== h);
  if (sh.getLastRow() === 0 || mismatch) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function initializeNotBoughtFollowupSystem() {
  getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.MASTER);
  getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.HISTORY);
  getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.LEADS);
  getNbClosedHistorySheet_();
  cleanupNotBoughtBlankRows_();
  ensureNotBoughtFollowupAutoSyncTrigger_();
  return { ok: true, message: 'Not Bought Follow Up sheets initialized.' };
}

/**************************************************************
 * NOT BOUGHT BLANK ROW CLEANUP
 * Fix requested: do not keep empty rows between follow-up records.
 * This safely removes only fully blank data rows below the header.
 * It does not delete any row that has even one value.
 **************************************************************/
function isCompletelyBlankRow_(row) {
  return (row || []).every(function (cell) {
    return String(cell == null ? '' : cell).trim() === '';
  });
}

function deleteCompletelyBlankDataRows_(sheet, requiredHeaderCount) {
  if (!sheet) return 0;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;

  const lastCol = Math.max(sheet.getLastColumn(), Number(requiredHeaderCount || 1));
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();

  const rowsToDelete = [];
  values.forEach(function (row, index) {
    if (isCompletelyBlankRow_(row)) {
      rowsToDelete.push(index + 2);
    }
  });

  // Delete from bottom to top so row numbers stay valid.
  rowsToDelete.sort(function (a, b) { return b - a; });
  rowsToDelete.forEach(function (rowNo) {
    sheet.deleteRow(rowNo);
  });

  return rowsToDelete.length;
}

function cleanupNotBoughtBlankRows_() {
  const summary = {
    activeMasterDeleted: 0,
    activeHistoryDeleted: 0,
    closedMasterDeleted: 0,
    closedHistoryDeleted: 0
  };

  try {
    summary.activeMasterDeleted = deleteCompletelyBlankDataRows_(
      getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.MASTER),
      getNbFollowupMasterHeaders_().length
    );
  } catch (e) {
    Logger.log('cleanup active master failed: ' + e);
  }

  try {
    summary.activeHistoryDeleted = deleteCompletelyBlankDataRows_(
      getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.HISTORY),
      getNbFollowupHistoryHeaders_().length
    );
  } catch (e) {
    Logger.log('cleanup active history failed: ' + e);
  }

  try {
    summary.closedMasterDeleted = deleteCompletelyBlankDataRows_(
      getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.LEADS),
      getNbLeadsHeaders_().length
    );
  } catch (e) {
    Logger.log('cleanup closed master failed: ' + e);
  }

  try {
    summary.closedHistoryDeleted = deleteCompletelyBlankDataRows_(
      getNbClosedHistorySheet_(),
      getNbFollowupHistoryHeaders_().length
    );
  } catch (e) {
    Logger.log('cleanup closed history failed: ' + e);
  }

  return summary;
}

function getNbFollowupKey_(clientId, referenceNumber) {
  return String(clientId || '').trim().toUpperCase() + '|' + String(referenceNumber || '').trim().toUpperCase();
}

function isNbDoneStatus_(status) {
  const s = upperTrim_(status);
  return NB_FOLLOWUP_CONFIG.DONE_STATUSES.indexOf(s) >= 0;
}


function nbLeadSignatureFromObj_(obj) {
  return [
    upperTrim_(obj['CLIENT ID']),
    nbPhoneLast10_(obj['PRIMARY PHONE']) || nbPhoneLast10_(obj['BILLING PHONE']),
    upperTrim_(obj['FOLLOW UP STATUS']) || upperTrim_(obj['FINAL OUTCOME'])
  ].join('|');
}

function readNbLeadsSignatureSet_() {
  const sh = getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.LEADS);
  const values = sh.getDataRange().getValues();
  const set = new Set();
  if (values.length < 2) return set;

  const headers = values[0];
  for (let i = 1; i < values.length; i++) {
    const obj = rowToHeaderMap_(headers, values[i]);
    const sig = nbLeadSignatureFromObj_(obj);
    if (sig && sig !== '||') set.add(sig);
  }
  return set;
}

function buildNbLeadRowFromObj_(obj) {
  return [
    asText_(obj['CLIENT ID']).trim(),
    asText_(obj['CLIENT NAME']).trim(),
    asText_(obj['PRIMARY PHONE']).trim(),
    asText_(obj['BILLING PHONE']).trim(),
    asText_(obj['BRANCH']).trim(),
    asText_(obj['CRM NAME']).trim(),
    asText_(obj['SALESPERSON']).trim(),
    asText_(obj['EVENT DATE']).trim(),
    asText_(obj['SEEN CATEGORIES']).trim(),
    asText_(obj['PRODUCT REQUIREMENT']).trim(),
    asText_(obj['NOT BOUGHT REASON']).trim(),
    asText_(obj['OTHER STORE / BRANCH']).trim(),
    asText_(obj['MORE DESIGN CATEGORIES']).trim(),
    asText_(obj['LAST WALKIN REMARK']).trim(),
    asText_(obj['ACTION POINT']).trim(),
    asText_(obj['FOLLOW UP STATUS']).trim() || asText_(obj['FINAL OUTCOME']).trim()
  ];
}

function nbHistoryRowMatchesClosedLead_(historyObj, closedObj) {
  const histClientId = upperTrim_(historyObj['CLIENT ID']);
  const histRef = upperTrim_(historyObj['REFERENCE NUMBER']);
  const histPhone = nbPhoneLast10_(historyObj['PHONE']);

  const closedClientId = upperTrim_(closedObj['CLIENT ID']);
  const closedRef = upperTrim_(closedObj['REFERENCE NUMBER']);
  const closedPhones = [closedObj['PRIMARY PHONE'], closedObj['BILLING PHONE']].map(nbPhoneLast10_).filter(Boolean);

  if (closedRef && histRef && histRef === closedRef) return true;
  if (closedClientId && histClientId && histClientId === closedClientId) return true;
  if (histPhone && closedPhones.indexOf(histPhone) >= 0) return true;

  return false;
}


function deleteNbHistoryRowsForClosedLead_(closedObj) {
  const sh = getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.HISTORY);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return 0;

  const headers = values[0];
  const deleteRows = [];
  const rowsToArchive = [];

  for (let i = 1; i < values.length; i++) {
    const obj = rowToHeaderMap_(headers, values[i]);
    if (nbHistoryRowMatchesClosedLead_(obj, closedObj)) {
      deleteRows.push(i + 1);
      rowsToArchive.push(values[i]);
    }
  }

  // Before deleting from active history, copy all matching history to the closed sheet history.
  // This keeps full follow-up tracking for closed clients in the closed workbook.
  if (rowsToArchive.length) {
    const closedHist = getNbClosedHistorySheet_();
    appendRowsIfAny_(closedHist, rowsToArchive);
  }

  deleteRows.sort((a, b) => b - a).forEach(rowNo => sh.deleteRow(rowNo));
  return deleteRows.length;
}

function appendClosedNbLeadIfNeeded_(closedObj, leadSignatureSet) {
  const sh = getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.LEADS);
  const sig = nbLeadSignatureFromObj_(closedObj);
  if (!sig || sig === '||') return { pasted: false, duplicate: true };

  if (leadSignatureSet.has(sig)) {
    return { pasted: true, duplicate: true };
  }

  const row = buildNbLeadRowFromObj_(closedObj);
  sh.appendRow(row);
  leadSignatureSet.add(sig);

  // IMPORTANT: check data is pasted in LEADS before deleting from follow-up sheets.
  const lastRow = sh.getLastRow();
  const pasted = sh.getRange(lastRow, 1, 1, row.length).getValues()[0];
  const pastedObj = rowToHeaderMap_(getNbLeadsHeaders_(), pasted);
  const pastedSig = nbLeadSignatureFromObj_(pastedObj);

  if (pastedSig !== sig) {
    throw new Error('LEADS paste verification failed. No rows deleted from follow-up sheets.');
  }

  return { pasted: true, duplicate: false };
}

function moveClosedNbFollowupRecordToLeads_(closedObj, masterRowIndex, leadSignatureSet) {
  const pasteRes = appendClosedNbLeadIfNeeded_(closedObj, leadSignatureSet);

  if (!pasteRes.pasted) {
    return { moved: false, duplicate: !!pasteRes.duplicate, historyDeleted: 0 };
  }

  const historyDeleted = deleteNbHistoryRowsForClosedLead_(closedObj);

  if (masterRowIndex) {
    const masterSheet = getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.MASTER);
    masterSheet.deleteRow(masterRowIndex);
  }

  return { moved: !pasteRes.duplicate, duplicate: !!pasteRes.duplicate, historyDeleted: historyDeleted };
}

function moveClosedNbFollowupsToLeads_() {
  initializeNotBoughtFollowupSystem();

  const state = readNbFollowupMasterState_();
  const leadSignatureSet = readNbLeadsSignatureSet_();
  const closedRows = [];

  state.rows.forEach(rec => {
    const obj = rec.obj || {};
    if (isNbDoneStatus_(obj['FOLLOW UP STATUS']) || isNbDoneStatus_(obj['FINAL OUTCOME'])) {
      closedRows.push({ rowIndex: rec.rowIndex, obj: obj });
    }
  });

  closedRows.sort((a, b) => b.rowIndex - a.rowIndex);

  let moved = 0;
  let duplicateAlreadyInLeads = 0;
  let historyDeleted = 0;

  closedRows.forEach(rec => {
    const res = moveClosedNbFollowupRecordToLeads_(rec.obj, rec.rowIndex, leadSignatureSet);
    if (res.moved) moved++;
    if (res.duplicate) duplicateAlreadyInLeads++;
    historyDeleted += Number(res.historyDeleted || 0);
  });

  return {
    ok: true,
    moved: moved,
    duplicateAlreadyInLeads: duplicateAlreadyInLeads,
    historyDeleted: historyDeleted,
    message: 'Closed Not Bought follow-ups moved to closed Not Bought sheet. Moved: ' + moved + ', duplicates already in closed sheet: ' + duplicateAlreadyInLeads + ', history rows deleted: ' + historyDeleted + '.'
  };
}

function moveClosedNotBoughtFollowupsToLeadsManual() {
  const res = moveClosedNbFollowupsToLeads_();
  SpreadsheetApp.getUi().alert(res.message);
}

function addDaysDateString_(dateValue, days) {
  const d = parseDateSafe_(dateValue) || new Date();
  d.setDate(d.getDate() + Number(days || 0));
  return Utilities.formatDate(d, NB_FOLLOWUP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function getTodayNbDateString_() {
  return Utilities.formatDate(new Date(), NB_FOLLOWUP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function getYesterdayNbDateString_() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return Utilities.formatDate(d, NB_FOLLOWUP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function buildNbActionPoint_(visit) {
  const reason = upperTrim_(visit.notBoughtReasons);
  const remark = upperTrim_(visit.remark);
  const requirement = upperTrim_(visit.productRequirement);
  const otherStore = upperTrim_(visit.otherStoreVisit);
  const moreDesign = upperTrim_(visit.moreDesignCategories);
  const combined = [reason, remark, requirement, otherStore, moreDesign, upperTrim_(visit.seenCategories), upperTrim_(visit.seenTags)].join(' ');

  if (isNbRepairOrderFollowupVisit_(visit)) {
    return 'Repair/Order Client Follow Up: Client came for repair/order and saw products. Call client, mention the exact seen categories/tags, share matching options on WhatsApp, and book next visit to convert into purchase.';
  }

  if (/PRICE|RATE|BUDGET|COST|EXPENSIVE|DISCOUNT|MAKING/.test(combined)) {
    return 'Price Not Matching Budget: Call and understand exact budget, share 2-3 options within range, explain value/making, and offer visit appointment with senior approval if needed.';
  }
  if (/DESIGN|LIKE|LIKED|CHOICE|PATTERN|STYLE/.test(combined)) {
    return 'Didn’t Like Design / Product: Ask preferred design style, send matching catalogue/photos on WhatsApp, and schedule visit when new designs are available.';
  }
  if (/MORE OPTION|MORE DESIGN|VARIETY|COLLECTION|CATEGORY/.test(combined) || moreDesign) {
    return 'Need More Options: Send additional design options in requested category and invite client for curated showing with CRM/salesperson.';
  }
  if (/AVAILABLE|NOT AVAILABLE|STOCK|SIZE|CUSTOM|ORDER/.test(combined)) {
    return 'Product Not Available: Confirm exact requirement, check stock/order possibility, and update client with availability date or alternative product.';
  }
  if (/DECIDE|FAMILY|THINK|LATER|CALL BACK|DISCUSS|PENDING/.test(combined)) {
    return 'Decision Pending: Follow up politely, ask what information is pending, share final shortlist and book next visit/call time.';
  }
  if (/OTHER STORE|ANOTHER|COMPARE|VISIT OTHER|BRANCH/.test(combined) || otherStore) {
    return 'Comparing Other Stores: Ask comparison point, highlight MK Jewels trust/service/design benefits, and share best matching option before they finalize elsewhere.';
  }
  if (/ENQUIRY|INQUIRY|JUST SEE|JUST VISIT|TIME PASS/.test(combined)) {
    return 'Just Enquiry: Keep relationship warm, send relevant catalogue, capture future occasion/date, and follow up after 7-15 days.';
  }
  if (/SHIFT|NEXT MONTH|LATER|FESTIVAL|WEDDING|OCCASION/.test(combined)) {
    return 'Purchase Shifted: Note expected purchase period, set next follow-up date before that occasion, and send fresh options near the buying time.';
  }

  return 'General Not-Bought Follow Up: Call client, understand exact reason for not buying, share suitable options on WhatsApp, and set next follow-up date.';
}

function readNbFollowupMasterState_() {
  const sh = getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.MASTER);
  const values = sh.getDataRange().getValues();
  const headers = values[0] || getNbFollowupMasterHeaders_();
  const map = new Map();
  const rows = [];

  for (let i = 1; i < values.length; i++) {
    const obj = rowToHeaderMap_(headers, values[i]);
    const key = getNbFollowupKey_(obj['CLIENT ID'], obj['REFERENCE NUMBER']);
    if (!String(obj['CLIENT ID'] || '').trim() && !String(obj['REFERENCE NUMBER'] || '').trim()) continue;
    map.set(key, { rowIndex: i + 1, obj: obj });
    rows.push({ rowIndex: i + 1, obj: obj });
  }

  return { sheet: sh, headers: headers, keyMap: map, rows: rows };
}

function findMasterObjectByClientIdSafe_(clientId) {
  try {
    return getMasterRecordByClientId_(clientId) || null;
  } catch (e) {
    return null;
  }
}


function nbVisitClientIdOrFallback_(visit) {
  let clientId = asText_(visit.crmClientId).trim();
  if (!clientId && visit.phoneKey) {
    clientId = findClientIdByAnyPhone_(visit.clientPhone || visit.billingPhone) || '';
  }
  return clientId;
}

function nbPhoneLast10_(value) {
  return last10_(normalizePhone_(value));
}

function nbRecordMatchesVisitClient_(obj, visit, clientId) {
  const recClientId = asText_(obj['CLIENT ID']).trim();
  const recName = upperTrim_(obj['CLIENT NAME']);
  const visitName = upperTrim_(visit.clientName);

  if (clientId && recClientId && upperTrim_(recClientId) === upperTrim_(clientId)) return true;

  const visitPhones = [visit.clientPhone, visit.billingPhone].map(nbPhoneLast10_).filter(Boolean);
  const recPhones = [obj['PRIMARY PHONE'], obj['BILLING PHONE']].map(nbPhoneLast10_).filter(Boolean);
  if (visitPhones.length && recPhones.some(p => visitPhones.indexOf(p) >= 0)) return true;

  if (visitName && recName && visitName === recName) return true;
  return false;
}

function findActiveNbRecordForVisit_(state, visit, clientId) {
  for (let i = 0; i < state.rows.length; i++) {
    const rec = state.rows[i];
    const obj = rec.obj || {};
    if (isNbDoneStatus_(obj['FOLLOW UP STATUS']) || isNbDoneStatus_(obj['FINAL OUTCOME'])) continue;
    if (nbRecordMatchesVisitClient_(obj, visit, clientId)) return rec;
  }
  return null;
}

function findAnyNbRecordForVisit_(state, visit, clientId) {
  for (let i = 0; i < state.rows.length; i++) {
    const rec = state.rows[i];
    if (nbRecordMatchesVisitClient_(rec.obj || {}, visit, clientId)) return rec;
  }
  return null;
}

function isNbPurchaseClosingStatus_(buyStatus) {
  const buy = upperTrim_(buyStatus).replace(/\s+/g, '_');
  const g = getStatusGroups_();

  // Do NOT auto-close ORDER / REPAIR visits here.
  // These visits can still need follow-up when REPAIR/ORDER APPROACH = YES
  // and the client has seen categories / tags for possible conversion.
  return g.readyProduct.has(buy) || buy === 'PRODUCT_EXCHANGE';
}

function isNbNonEmptyValue_(value) {
  const v = upperTrim_(value);
  return !!v && v !== 'NA' && v !== 'N/A' && v !== '-' && v !== 'NONE';
}

function isNbRepairOrderFollowupVisit_(visit) {
  const buy = upperTrim_(visit && visit.buyStatus).replace(/\s+/g, '_');
  const allowedStatuses = new Set([
    'REPAIR_PICKUP',
    'REPAIR_PLACED',
    'ORDER_PICKUP',
    'ORDER_PLACED'
  ]);

  if (!allowedStatuses.has(buy)) return false;
  if (upperTrim_(visit && visit.repairApproach) !== 'YES') return false;

  // Client has seen something, so CRM should follow up to convert.
  return isNbNonEmptyValue_(visit && visit.seenCategories) || isNbNonEmptyValue_(visit && visit.seenTags);
}

function isNbFollowupEligibleVisit_(visit) {
  const buy = upperTrim_(visit && visit.buyStatus).replace(/\s+/g, '_');
  return buy === 'NO' || isNbRepairOrderFollowupVisit_(visit);
}

function buildNbSeenProductRemark_(visit) {
  const parts = [];
  if (isNbNonEmptyValue_(visit && visit.seenCategories)) parts.push('SEEN CATEGORIES: ' + upperTrim_(visit.seenCategories));
  if (isNbNonEmptyValue_(visit && visit.seenTags)) parts.push('SEEN TAGS: ' + upperTrim_(visit.seenTags));
  if (isNbNonEmptyValue_(visit && visit.remark)) parts.push('ORIGINAL REMARK: ' + upperTrim_(visit.remark));
  return parts.join(' | ');
}

function getNbWalkinRemarkForFollowup_(visit) {
  const seenRemark = buildNbSeenProductRemark_(visit);
  return seenRemark || upperTrim_(visit && visit.remark);
}

function getNbFollowupSourceLabel_(visit) {
  return isNbRepairOrderFollowupVisit_(visit)
    ? 'AUTO_FROM_REPAIR_ORDER_APPROACH_SEEN_PRODUCT'
    : 'AUTO_FROM_WALKIN_NO';
}

function updateNbMasterRow_(state, rec, obj) {
  obj['UPDATED ON'] = nowTs_();
  state.sheet.getRange(rec.rowIndex, 1, 1, state.headers.length)
    .setValues([state.headers.map(h => obj[h] != null ? obj[h] : '')]);
  rec.obj = obj;
}

function nbHistorySignature_(obj) {
  return [
    upperTrim_(obj['CLIENT ID']),
    upperTrim_(obj['REFERENCE NUMBER']),
    upperTrim_(obj['NEW STATUS']),
    normalizeFilterDate_(obj['FOLLOW UP DATE']),
    upperTrim_(obj['CALL RESPONSE']),
    upperTrim_(obj['REMARK'])
  ].join('|');
}

function getNbHistorySignatureSet_() {
  const sh = getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.HISTORY);
  const values = sh.getDataRange().getValues();
  const set = new Set();
  if (values.length < 2) return set;
  const headers = values[0];
  for (let i = 1; i < values.length; i++) {
    const obj = rowToHeaderMap_(headers, values[i]);
    set.add(nbHistorySignature_(obj));
  }
  return set;
}

function appendNbHistoryIfNew_(historySheet, signatureSet, row) {
  const headers = getNbFollowupHistoryHeaders_();
  const obj = rowToHeaderMap_(headers, row);
  const sig = nbHistorySignature_(obj);
  if (signatureSet.has(sig)) return false;
  appendRowsIfAny_(historySheet, [row]);
  signatureSet.add(sig);
  return true;
}

function buildNbRevisitHistoryRemark_(visit) {
  return [
    'CLIENT VISITED AGAIN AND STILL NOT BOUGHT.',
    visit.referenceNumber ? 'REFERENCE: ' + visit.referenceNumber : '',
    visit.visitDate ? 'CLIENT VISIT DATE: ' + visit.visitDate : '',
    visit.branch ? 'BRANCH: ' + visit.branch : '',
    visit.crmName ? 'VISIT CRM: ' + visit.crmName : '',
    visit.seenCategories ? 'SEEN: ' + visit.seenCategories : '',
    visit.productRequirement ? 'PRODUCT REQUIREMENT: ' + visit.productRequirement : '',
    visit.notBoughtReasons ? 'REASON: ' + visit.notBoughtReasons : '',
    visit.remark ? 'ORIGINAL REMARK: ' + visit.remark : ''
  ].filter(Boolean).join(' | ');
}

function buildNbAutoClosePurchaseRemark_(visit) {
  return [
    'AUTO CLOSED: CLIENT PURCHASED IN LATER WALK-IN VISIT.',
    visit.referenceNumber ? 'PURCHASE REFERENCE: ' + visit.referenceNumber : '',
    visit.visitDate ? 'PURCHASE VISIT DATE: ' + visit.visitDate : '',
    visit.buyStatus ? 'BUY STATUS: ' + visit.buyStatus : '',
    visit.branch ? 'BRANCH: ' + visit.branch : '',
    visit.crmName ? 'VISIT CRM: ' + visit.crmName : '',
    visit.boughtCategories ? 'BOUGHT: ' + visit.boughtCategories : '',
    visit.orderCategories ? 'ORDER: ' + visit.orderCategories : '',
    visit.remark ? 'REMARK: ' + visit.remark : ''
  ].filter(Boolean).join(' | ');
}

function syncNotBoughtFollowupsFromWalkin() {
  initializeCrmSystem(false);
  initializeNotBoughtFollowupSystem();

  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(5000);

  if (!hasLock) {
    return {
      ok: false,
      added: 0,
      mergedSameClient: 0,
      autoClosedPurchased: 0,
      skippedExisting: 0,
      skippedNotNo: 0,
      skippedNoReference: 0,
      message: 'Another Not Bought Follow Up sync is already running. Please wait 20-30 seconds and click REFRESH / SYNC again.'
    };
  }

  try {
    const sourceRows = readAllWalkinRows_()
      .map(rowObj => normalizeWalkinRow_(rowObj))
      .filter(visit => !!visit.referenceNumber)
      .sort((a, b) => {
        const da = parseDateSafe_(a.timestamp) || parseDateSafe_(a.visitDate) || new Date(0);
        const db = parseDateSafe_(b.timestamp) || parseDateSafe_(b.visitDate) || new Date(0);
        return da - db;
      });

    const state = readNbFollowupMasterState_();
    const historySheet = getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.HISTORY);
    const historySigSet = getNbHistorySignatureSet_();
    const out = [];

    let added = 0;
    let mergedSameClient = 0;
    let autoClosedPurchased = 0;
    let historyAdded = 0;
    let skippedExisting = 0;
    let skippedNotNo = 0;
    let skippedNoReference = 0;

    sourceRows.forEach(visit => {
      const buy = upperTrim_(visit.buyStatus).replace(/\s+/g, '_');
      const clientId = nbVisitClientIdOrFallback_(visit);
      const key = getNbFollowupKey_(clientId || visit.phoneKey || visit.clientName, visit.referenceNumber);

      if (!visit.referenceNumber) {
        skippedNoReference++;
        return;
      }

      /********************************************************
       * AUTO CLOSE RULE:
       * If the same client later purchases from MK Jewels, close
       * the active Not Bought follow-up automatically. This helps
       * when CRM did not fill the follow-up form but the client
       * came back and bought.
       ********************************************************/
      if (isNbPurchaseClosingStatus_(visit.buyStatus) && !isNbFollowupEligibleVisit_(visit)) {
        const activeRec = findActiveNbRecordForVisit_(state, visit, clientId);
        if (activeRec && activeRec.obj) {
          const obj = Object.assign({}, activeRec.obj);
          const oldStatus = asText_(obj['FOLLOW UP STATUS']).trim() || 'PENDING';
          obj['FOLLOW UP STATUS'] = 'ALREADY PURCHASED FROM MK JEWELS';
          obj['FINAL OUTCOME'] = 'ALREADY PURCHASED FROM MK JEWELS';
          obj['NEXT FOLLOW UP DATE'] = '';
          obj['LAST FOLLOW UP DATE'] = visit.visitDate || getTodayNbDateString_();
          obj['LAST FOLLOW UP REMARK'] = buildNbAutoClosePurchaseRemark_(visit);
          obj['SOURCE'] = mergeCsvField_(obj['SOURCE'], 'AUTO_CLOSED_BY_LATER_PURCHASE');
          updateNbMasterRow_(state, activeRec, obj);

          const addedHist = appendNbHistoryIfNew_(historySheet, historySigSet, [
            normalizeDateTimeString_(parseDateSafe_(visit.timestamp) || new Date()),
            asText_(obj['CLIENT ID']).trim() || clientId || '',
            visit.referenceNumber || asText_(obj['REFERENCE NUMBER']).trim(),
            asText_(obj['CLIENT NAME']).trim() || visit.clientName || '',
            asText_(obj['PRIMARY PHONE']).trim() || asText_(obj['BILLING PHONE']).trim() || visit.clientPhone || visit.billingPhone || '',
            asText_(obj['CRM NAME']).trim() || visit.crmName || '',
            oldStatus,
            'ALREADY PURCHASED FROM MK JEWELS',
            visit.visitDate || getTodayNbDateString_(),
            '',
            'AUTO CLOSED - CLIENT PURCHASED IN LATER VISIT',
            buildNbAutoClosePurchaseRemark_(visit),
            asText_(obj['ACTION POINT']).trim(),
            'SYSTEM AUTO CLOSE'
          ]);
          if (addedHist) historyAdded++;
          autoClosedPurchased++;
        } else {
          skippedNotNo++;
        }
        return;
      }

      if (!isNbFollowupEligibleVisit_(visit)) {
        skippedNotNo++;
        return;
      }

      const exactRec = state.keyMap.get(key);
      if (exactRec && exactRec.obj) {
        const existingObj = Object.assign({}, exactRec.obj);
        const existingCount = Number(existingObj['FOLLOW UP COUNT'] || 0);
        const existingDone = isNbDoneStatus_(existingObj['FOLLOW UP STATUS']) || isNbDoneStatus_(existingObj['FINAL OUTCOME']);
        if (!existingDone && existingCount === 0) {
          const sourceNextDate = visit.nextVisitDate || getTodayNbDateString_();
          let changedExact = false;
          if (sourceNextDate && asText_(existingObj['NEXT FOLLOW UP DATE']).trim() !== sourceNextDate) {
            existingObj['NEXT FOLLOW UP DATE'] = sourceNextDate;
            changedExact = true;
          }
          const walkinRemark = getNbWalkinRemarkForFollowup_(visit);
          if (walkinRemark && asText_(existingObj['LAST WALKIN REMARK']).trim() !== walkinRemark) {
            existingObj['LAST WALKIN REMARK'] = walkinRemark;
            changedExact = true;
          }
          if (isNbRepairOrderFollowupVisit_(visit)) {
            existingObj['ACTION POINT'] = buildNbActionPoint_(visit);
            existingObj['SOURCE'] = mergeCsvField_(existingObj['SOURCE'], getNbFollowupSourceLabel_(visit));
            changedExact = true;
          }
          if (changedExact) updateNbMasterRow_(state, exactRec, existingObj);
        }
        skippedExisting++;
        return;
      }

      /********************************************************
       * SAME CLIENT / NEW NOT-BOUGHT VISIT RULE:
       * Do not create 2 pending follow-up rows for the same client.
       * Keep one CRM owner and store every later not-bought visit
       * into follow-up history, while updating the master row with
       * latest visit information.
       ********************************************************/
      const activeSameClient = findActiveNbRecordForVisit_(state, visit, clientId);
      if (activeSameClient && activeSameClient.obj) {
        const obj = Object.assign({}, activeSameClient.obj);
        const oldStatus = asText_(obj['FOLLOW UP STATUS']).trim() || 'PENDING';
        const newNextDate = visit.nextVisitDate || asText_(obj['NEXT FOLLOW UP DATE']).trim() || getTodayNbDateString_();

        obj['REFERENCE NUMBER'] = visit.referenceNumber || asText_(obj['REFERENCE NUMBER']).trim();
        obj['CLIENT ID'] = asText_(obj['CLIENT ID']).trim() || clientId || '';
        obj['CLIENT NAME'] = asText_(obj['CLIENT NAME']).trim() || visit.clientName || '';
        obj['PRIMARY PHONE'] = asText_(obj['PRIMARY PHONE']).trim() || visit.clientPhone || '';
        obj['BILLING PHONE'] = asText_(obj['BILLING PHONE']).trim() || visit.billingPhone || '';
        obj['BRANCH'] = visit.branch || asText_(obj['BRANCH']).trim();
        // Keep original assigned CRM so only one CRM handles the case.
        obj['CRM NAME'] = asText_(obj['CRM NAME']).trim() || visit.crmName || '';
        obj['SALESPERSON'] = visit.salesperson || asText_(obj['SALESPERSON']).trim();
        obj['EVENT DATE'] = visit.visitDate || asText_(obj['EVENT DATE']).trim();
        obj['SEEN CATEGORIES'] = visit.seenCategories || asText_(obj['SEEN CATEGORIES']).trim();
        obj['PRODUCT REQUIREMENT'] = visit.productRequirement || asText_(obj['PRODUCT REQUIREMENT']).trim();
        obj['NOT BOUGHT REASON'] = visit.notBoughtReasons || asText_(obj['NOT BOUGHT REASON']).trim();
        obj['OTHER STORE / BRANCH'] = visit.otherStoreVisit || asText_(obj['OTHER STORE / BRANCH']).trim();
        obj['MORE DESIGN CATEGORIES'] = visit.moreDesignCategories || asText_(obj['MORE DESIGN CATEGORIES']).trim();
        obj['LAST WALKIN REMARK'] = getNbWalkinRemarkForFollowup_(visit) || asText_(obj['LAST WALKIN REMARK']).trim();
        obj['ACTION POINT'] = buildNbActionPoint_(visit);
        obj['NEXT FOLLOW UP DATE'] = newNextDate;
        obj['SOURCE'] = mergeCsvField_(obj['SOURCE'], 'MERGED_SAME_CLIENT_REVISIT_NO');
        updateNbMasterRow_(state, activeSameClient, obj);

        const addedHist = appendNbHistoryIfNew_(historySheet, historySigSet, [
          normalizeDateTimeString_(parseDateSafe_(visit.timestamp) || new Date()),
          asText_(obj['CLIENT ID']).trim() || clientId || '',
          visit.referenceNumber || '',
          asText_(obj['CLIENT NAME']).trim() || visit.clientName || '',
          asText_(obj['PRIMARY PHONE']).trim() || asText_(obj['BILLING PHONE']).trim() || visit.clientPhone || visit.billingPhone || '',
          asText_(obj['CRM NAME']).trim() || visit.crmName || '',
          oldStatus,
          oldStatus,
          visit.visitDate || getTodayNbDateString_(),
          newNextDate,
          'CLIENT REVISITED - STILL NOT BOUGHT',
          buildNbRevisitHistoryRemark_(visit),
          asText_(obj['ACTION POINT']).trim(),
          'SYSTEM MERGE'
        ]);
        if (addedHist) historyAdded++;

        const newKey = getNbFollowupKey_(obj['CLIENT ID'], obj['REFERENCE NUMBER']);
        state.keyMap.set(newKey, activeSameClient);
        mergedSameClient++;
        return;
      }

      const masterObj = clientId ? findMasterObjectByClientIdSafe_(clientId) : null;
      const clientName = visit.clientName || (masterObj ? asText_(masterObj['PRIMARY NAME']).trim() : '');
      const primaryPhone = visit.clientPhone || (masterObj ? asText_(masterObj['PRIMARY PHONE']).trim() : '');
      const billingPhone = visit.billingPhone || (masterObj ? asText_(masterObj['BILLING PHONE']).trim() : '');
      const actionPoint = buildNbActionPoint_(visit);
      const eventDate = visit.visitDate || getTodayNbDateString_();
      const nextDate = visit.nextVisitDate || getTodayNbDateString_();

      const row = [
        nowTs_(),
        nowTs_(),
        clientId || '',
        visit.referenceNumber || '',
        clientName || '',
        primaryPhone || '',
        billingPhone || '',
        visit.branch || '',
        visit.crmName || '',
        visit.salesperson || '',
        eventDate || '',
        visit.seenCategories || '',
        visit.productRequirement || '',
        visit.notBoughtReasons || '',
        visit.otherStoreVisit || '',
        visit.moreDesignCategories || '',
        getNbWalkinRemarkForFollowup_(visit) || '',
        actionPoint,
        'PENDING',
        nextDate,
        '',
        0,
        '',
        '',
        getNbFollowupSourceLabel_(visit)
      ];
      out.push(row);
      const pendingRec = { rowIndex: state.sheet.getLastRow() + out.length, obj: rowToHeaderMap_(state.headers, row) };
      state.rows.push(pendingRec);
      state.keyMap.set(key, pendingRec);
      added++;
    });

    appendRowsIfAny_(state.sheet, out);
    const legacyImport = applyLegacyNotBoughtFollowupsFromUploadedCsv_();
    const leadMove = moveClosedNbFollowupsToLeads_();
    const blankCleanup = cleanupNotBoughtBlankRows_();
    return {
      ok: true,
      added,
      mergedSameClient,
      autoClosedPurchased,
      skippedExisting,
      skippedNotNo,
      skippedNoReference,
      historyAdded,
      legacyImport,
      leadMove,
      message: 'Not Bought Follow Up sync completed. Added: ' + added +
        '. Same-client duplicate visits merged into history: ' + mergedSameClient +
        '. Auto closed after later purchase: ' + autoClosedPurchased +
        '. System history added: ' + historyAdded +
        '. Legacy follow-ups updated: ' + (legacyImport.updated || 0) +
        ', history added: ' + (legacyImport.historyAdded || 0) +
        ', planned dates updated: ' + (legacyImport.plannedUpdated || 0) +
        '. Closed rows moved to LEADS: ' + (leadMove.moved || 0) +
        ', history deleted: ' + (leadMove.historyDeleted || 0) +
        '. Blank rows removed: ' + (
          Number(blankCleanup.activeMasterDeleted || 0) +
          Number(blankCleanup.activeHistoryDeleted || 0) +
          Number(blankCleanup.closedMasterDeleted || 0) +
          Number(blankCleanup.closedHistoryDeleted || 0)
        ) + '.'
    };
  } finally {
    lock.releaseLock();
  }
}


function maybeAutoSyncNotBoughtFollowups_() {
  /************************************************************
   * AUTO NOT BOUGHT IMPORT GUARD
   * Runs sync automatically from web app load/filter, but not
   * on every single click. This keeps page fast and prevents
   * duplicate lock calls.
   ************************************************************/
  const props = PropertiesService.getScriptProperties();
  const key = 'MK_NB_LAST_AUTO_SYNC_TS';
  const now = Date.now();
  const last = Number(props.getProperty(key) || 0);

  // Auto sync max once every 2 minutes from web load.
  if (last && now - last < 2 * 60 * 1000) return { ok: true, skipped: true };

  try {
    const res = syncNotBoughtFollowupsFromWalkin();
    props.setProperty(key, String(now));
    return res;
  } catch (err) {
    Logger.log('maybeAutoSyncNotBoughtFollowups_ failed: ' + (err && err.stack ? err.stack : err));
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}

function installNotBoughtFollowupAutoSyncTrigger() {
  const handler = 'syncNotBoughtFollowupsFromWalkin';

  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === handler) ScriptApp.deleteTrigger(trigger);
  });

  ScriptApp.newTrigger(handler)
    .timeBased()
    .everyMinutes(5)
    .create();

  SpreadsheetApp.getUi().alert('Not Bought Follow Up auto sync trigger installed. It will run every 5 minutes.');
}

function getNotBoughtFollowupBootstrap() {
  initializeNotBoughtFollowupSystem();

  // AUTO SYNC FIX:
  // When the Not Bought Follow Up page opens, first import latest eligible
  // WALKIN DATASET rows into NOT BOUGHT FOLLOW UP sheet.
  maybeAutoSyncNotBoughtFollowups_();

  const state = readNbFollowupMasterState_();
  const crmSet = new Set();
  state.rows.forEach(r => {
    const crm = upperTrim_(r.obj['CRM NAME']);
    if (crm) crmSet.add(crm);
  });

  Object.keys(getEffectiveBranchCrmAllocation_() || {}).forEach(branch => {
    (getEffectiveBranchCrmAllocation_()[branch] || []).forEach(crm => {
      const c = upperTrim_(crm);
      if (c && c !== 'NA') crmSet.add(c);
    });
  });

  return {
    ok: true,
    crmNames: Array.from(crmSet).sort(),
    activeStatuses: NB_FOLLOWUP_CONFIG.ACTIVE_STATUSES,
    doneStatuses: NB_FOLLOWUP_CONFIG.DONE_STATUSES,
    today: getTodayNbDateString_()
  };
}

function getNotBoughtFollowups(filter) {
  initializeNotBoughtFollowupSystem();

  // AUTO SYNC FIX:
  // The web app will automatically pull all eligible WALKIN DATASET rows:
  // 1) CLIENT BOUGHT ANY PRODUCT? / FINAL STATUS = NO
  // 2) REPAIR / ORDER clients where REPAIR/ORDER APPROACH = YES and products were seen
  // It does not duplicate existing references.
  maybeAutoSyncNotBoughtFollowups_();

  const f = filter || {};
  const tab = upperTrim_(f.tab || 'TODAY');
  const crmFilter = upperTrim_(f.crmName || '');
  const q = upperTrim_(f.query || '');
  const today = getTodayNbDateString_();

  const state = readNbFollowupMasterState_();
  const histMap = getNbHistoryCountMap_();
  let rows = state.rows.map(r => nbMasterObjToClientObject_(r.obj, histMap));

  if (crmFilter && crmFilter !== 'ALL') {
    rows = rows.filter(r => upperTrim_(r.crmName) === crmFilter);
  }

  if (q) {
    const qDigits = normalizePhone_(q);
    rows = rows.filter(r => {
      const text = [
        r.clientId,
        r.referenceNumber,
        r.clientName,
        r.crmName,
        r.primaryPhone,
        r.billingPhone,
        r.notBoughtReason,
        r.lastWalkinRemark,
        r.seenCategories,
        r.productRequirement,
        r.actionPoint
      ].join(' ').toUpperCase();
      const phones = normalizePhone_(r.primaryPhone + ' ' + r.billingPhone);
      return text.includes(q) || (qDigits && phones.includes(qDigits));
    });
  }

  if (tab === 'DONE') {
    rows = rows.filter(r => isNbDoneStatus_(r.followUpStatus) || isNbDoneStatus_(r.finalOutcome));
  } else if (tab === 'INPROCESS') {
    rows = rows.filter(r => {
      if (isNbDoneStatus_(r.followUpStatus) || isNbDoneStatus_(r.finalOutcome)) return false;
      const status = upperTrim_(r.followUpStatus || 'PENDING');
      const count = Number(r.followUpCount || 0);
      return count > 0 || (status && status !== 'PENDING');
    });
  } else if (tab === 'PENDING') {
    rows = rows.filter(r => !isNbDoneStatus_(r.followUpStatus) && !isNbDoneStatus_(r.finalOutcome));
  } else {
    // TODAY FOLLOW UP FIX:
    // Show blank next date + today + overdue follow-ups.
    // Earlier code showed only nextDate === today, so old pending records stayed hidden.
    rows = rows.filter(r => {
      if (isNbDoneStatus_(r.followUpStatus) || isNbDoneStatus_(r.finalOutcome)) return false;
      const nextDate = normalizeFilterDate_(r.nextFollowUpDate);
      if (!nextDate) return true;
      return nextDate <= today;
    });
  }

  rows.sort((a, b) => {
    const da = parseDateSafe_(a.nextFollowUpDate) || parseDateSafe_(a.updatedOn) || parseDateSafe_(a.eventDate) || new Date(0);
    const db = parseDateSafe_(b.nextFollowUpDate) || parseDateSafe_(b.updatedOn) || parseDateSafe_(b.eventDate) || new Date(0);

    // Today tab: oldest overdue first, so CRM clears pending backlog properly.
    if (tab === 'TODAY') return da - db;

    // Other tabs: latest first.
    return db - da;
  });

  return { ok: true, rows: rows, today: today };
}

function nbMasterObjToClientObject_(obj, histMap) {
  const key = getNbFollowupKey_(obj['CLIENT ID'], obj['REFERENCE NUMBER']);
  const clientHistoryKey = upperTrim_(obj['CLIENT ID']) + '|';
  return {
    createdOn: asText_(obj['CREATED ON']).trim(),
    updatedOn: asText_(obj['UPDATED ON']).trim(),
    clientId: asText_(obj['CLIENT ID']).trim(),
    referenceNumber: asText_(obj['REFERENCE NUMBER']).trim(),
    clientName: asText_(obj['CLIENT NAME']).trim(),
    primaryPhone: asText_(obj['PRIMARY PHONE']).trim(),
    billingPhone: asText_(obj['BILLING PHONE']).trim(),
    branch: asText_(obj['BRANCH']).trim(),
    crmName: asText_(obj['CRM NAME']).trim(),
    salesperson: asText_(obj['SALESPERSON']).trim(),
    eventDate: asText_(obj['EVENT DATE']).trim(),
    seenCategories: asText_(obj['SEEN CATEGORIES']).trim(),
    productRequirement: asText_(obj['PRODUCT REQUIREMENT']).trim(),
    notBoughtReason: asText_(obj['NOT BOUGHT REASON']).trim(),
    otherStoreBranch: asText_(obj['OTHER STORE / BRANCH']).trim(),
    moreDesignCategories: asText_(obj['MORE DESIGN CATEGORIES']).trim(),
    lastWalkinRemark: asText_(obj['LAST WALKIN REMARK']).trim(),
    actionPoint: asText_(obj['ACTION POINT']).trim(),
    followUpStatus: asText_(obj['FOLLOW UP STATUS']).trim(),
    nextFollowUpDate: asText_(obj['NEXT FOLLOW UP DATE']).trim(),
    lastFollowUpDate: asText_(obj['LAST FOLLOW UP DATE']).trim(),
    followUpCount: Number(obj['FOLLOW UP COUNT']) || 0,
    lastFollowUpRemark: asText_(obj['LAST FOLLOW UP REMARK']).trim(),
    finalOutcome: asText_(obj['FINAL OUTCOME']).trim(),
    source: asText_(obj['SOURCE']).trim(),
    historyCount: histMap[key] || histMap[clientHistoryKey] || 0
  };
}

function getNbHistoryCountMap_() {
  const sh = getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.HISTORY);
  const values = sh.getDataRange().getValues();
  const map = {};
  if (values.length < 2) return map;
  const headers = values[0];
  for (let i = 1; i < values.length; i++) {
    const obj = rowToHeaderMap_(headers, values[i]);
    const key = getNbFollowupKey_(obj['CLIENT ID'], obj['REFERENCE NUMBER']);
    const clientKey = upperTrim_(obj['CLIENT ID']) + '|';
    map[key] = (map[key] || 0) + 1;
    if (upperTrim_(obj['CLIENT ID'])) map[clientKey] = (map[clientKey] || 0) + 1;
  }
  return map;
}


function isDuplicateNbFollowupSubmit_(obj, newStatus, nextDate, callResponse, remark, enteredBy) {
  const clientId = upperTrim_(obj['CLIENT ID']);
  const ref = upperTrim_(obj['REFERENCE NUMBER']);
  if (!clientId && !ref) return false;

  const sh = getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.HISTORY);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return false;

  const headers = values[0];
  const now = new Date();

  for (let i = values.length - 1; i >= Math.max(1, values.length - 25); i--) {
    const h = rowToHeaderMap_(headers, values[i]);
    const sameRecord =
      (ref && upperTrim_(h['REFERENCE NUMBER']) === ref) ||
      (clientId && upperTrim_(h['CLIENT ID']) === clientId);

    if (!sameRecord) continue;

    const ts = parseDateSafe_(h['TIMESTAMP']);
    const diffMs = ts ? Math.abs(now.getTime() - ts.getTime()) : 0;
    const within3Minutes = ts ? diffMs <= 3 * 60 * 1000 : true;

    const samePayload =
      upperTrim_(h['NEW STATUS']) === upperTrim_(newStatus) &&
      normalizeFilterDate_(h['NEXT FOLLOW UP DATE']) === normalizeFilterDate_(nextDate) &&
      upperTrim_(h['CALL RESPONSE']) === upperTrim_(callResponse) &&
      upperTrim_(h['REMARK']) === upperTrim_(remark) &&
      upperTrim_(h['ENTERED BY']) === upperTrim_(enteredBy);

    if (within3Minutes && samePayload) return true;
  }

  return false;
}

function saveNotBoughtFollowup(payload) {
  initializeNotBoughtFollowupSystem();

  const p = payload || {};
  const clientId = asText_(p.clientId).trim();
  const referenceNumber = asText_(p.referenceNumber).trim();
  if (!clientId && !referenceNumber) throw new Error('CLIENT ID OR REFERENCE NUMBER REQUIRED.');

  const state = readNbFollowupMasterState_();
  const headers = state.headers;
  const key = getNbFollowupKey_(clientId, referenceNumber);
  let rec = state.keyMap.get(key);

  if (!rec) {
    // fallback by reference number only
    rec = state.rows.find(r => upperTrim_(r.obj['REFERENCE NUMBER']) === upperTrim_(referenceNumber));
  }
  if (!rec) throw new Error('FOLLOW UP RECORD NOT FOUND. PLEASE SYNC FIRST.');

  const oldObj = Object.assign({}, rec.obj);
  const obj = Object.assign({}, rec.obj);
  const oldStatus = asText_(obj['FOLLOW UP STATUS']).trim();
  const newStatus = upperTrim_(p.followUpStatus || oldStatus || 'PENDING');
  const nextDate = normalizeFilterDate_(p.nextFollowUpDate) || asText_(obj['NEXT FOLLOW UP DATE']).trim();
  const remark = asText_(p.remark).trim();
  const callResponse = upperTrim_(p.callResponse || '');
  const enteredBy = upperTrim_(p.enteredBy || p.crmName || obj['CRM NAME'] || 'CRM WEB APP');
  const actionPoint = asText_(p.actionPoint || obj['ACTION POINT']).trim();

  if (isDuplicateNbFollowupSubmit_(obj, newStatus, nextDate, callResponse, remark, enteredBy)) {
    return {
      ok: true,
      duplicateIgnored: true,
      message: 'Duplicate follow-up click ignored. Existing latest follow-up is already saved.',
      record: nbMasterObjToClientObject_(obj, getNbHistoryCountMap_())
    };
  }

  obj['UPDATED ON'] = nowTs_();
  obj['FOLLOW UP STATUS'] = newStatus;
  obj['NEXT FOLLOW UP DATE'] = isNbDoneStatus_(newStatus) ? '' : nextDate;
  obj['LAST FOLLOW UP DATE'] = getTodayNbDateString_();
  obj['FOLLOW UP COUNT'] = (Number(obj['FOLLOW UP COUNT']) || 0) + 1;
  obj['LAST FOLLOW UP REMARK'] = remark;
  obj['ACTION POINT'] = actionPoint;
  obj['FINAL OUTCOME'] = isNbDoneStatus_(newStatus) ? newStatus : asText_(obj['FINAL OUTCOME']).trim();

  const rowValues = headers.map(h => obj[h] != null ? obj[h] : '');
  state.sheet.getRange(rec.rowIndex, 1, 1, headers.length).setValues([rowValues]);

  const hist = getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.HISTORY);
  appendRowsIfAny_(hist, [[
    nowTs_(),
    asText_(obj['CLIENT ID']).trim(),
    asText_(obj['REFERENCE NUMBER']).trim(),
    asText_(obj['CLIENT NAME']).trim(),
    asText_(obj['PRIMARY PHONE']).trim() || asText_(obj['BILLING PHONE']).trim(),
    asText_(obj['CRM NAME']).trim(),
    oldStatus,
    newStatus,
    getTodayNbDateString_(),
    obj['NEXT FOLLOW UP DATE'],
    callResponse,
    remark,
    actionPoint,
    enteredBy
  ]]);

  if (isNbDoneStatus_(newStatus)) {
    const leadSignatureSet = readNbLeadsSignatureSet_();
    const moveRes = moveClosedNbFollowupRecordToLeads_(obj, rec.rowIndex, leadSignatureSet);
    return {
      ok: true,
      message: 'Follow up saved successfully. Closed client moved to closed Not Bought sheet and removed from active follow-up.',
      movedToLeads: true,
      moveResult: moveRes,
      record: nbMasterObjToClientObject_(obj, getNbHistoryCountMap_())
    };
  }

  return { ok: true, message: 'Follow up saved successfully.', record: nbMasterObjToClientObject_(obj, getNbHistoryCountMap_()) };
}

function getNotBoughtFollowupHistory(clientId, referenceNumber) {
  initializeNotBoughtFollowupSystem();
  const sh = getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.HISTORY);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return { ok: true, history: [] };

  const headers = values[0];
  const cid = upperTrim_(clientId);
  const ref = upperTrim_(referenceNumber);
  const rows = values.slice(1).map(r => rowToHeaderMap_(headers, r)).filter(obj => {
    const rowCid = upperTrim_(obj['CLIENT ID']);
    const rowRef = upperTrim_(obj['REFERENCE NUMBER']);
    return (cid && rowCid === cid) || (ref && rowRef === ref);
  }).map(obj => ({
    timestamp: asText_(obj['TIMESTAMP']).trim(),
    clientId: asText_(obj['CLIENT ID']).trim(),
    referenceNumber: asText_(obj['REFERENCE NUMBER']).trim(),
    clientName: asText_(obj['CLIENT NAME']).trim(),
    phone: asText_(obj['PHONE']).trim(),
    crmName: asText_(obj['CRM NAME']).trim(),
    oldStatus: asText_(obj['OLD STATUS']).trim(),
    newStatus: asText_(obj['NEW STATUS']).trim(),
    followUpDate: asText_(obj['FOLLOW UP DATE']).trim(),
    nextFollowUpDate: asText_(obj['NEXT FOLLOW UP DATE']).trim(),
    callResponse: asText_(obj['CALL RESPONSE']).trim(),
    remark: asText_(obj['REMARK']).trim(),
    actionPoint: asText_(obj['ACTION POINT']).trim(),
    enteredBy: asText_(obj['ENTERED BY']).trim()
  }));

  rows.sort((a, b) => {
    const da = parseDateSafe_(a.timestamp) || new Date(0);
    const db = parseDateSafe_(b.timestamp) || new Date(0);
    return db - da;
  });

  return { ok: true, history: rows };
}



/** ==========================================================
 *  LEGACY EXCEL IMPORT — CLIENT FOLLOW-UP FMS (NOT BOUGHT)
 *  Generated from uploaded CSV. Keeps already-taken follow-ups
 *  in this CRM system and appends them into follow-up history.
 *  ==========================================================
 */
function getLegacyNbFollowupTakenRows_() {
  return [{"r":"MK-WK-MBW-ZBX-PG-2239","n":"MANJU B. WAGHWANI","p":"9737739000","c":"PRATIKSHA GOHIL","f":1,"pl":"02/06/2026 00:00:00","a":"02/06/2026 03:29:05","s":"ALREADY PURCHASED FROM MK JEWELS","m":"PURCHASED FROM BANDRA STORE BY ARCHANA CHAVAN","nx":""},{"r":"MK-WK-AGX-BAN-DB-2240","n":"ADELE GRUNDAMANN","p":"9892055216","c":"TANYA KEDARE","f":1,"pl":"01/06/2026 00:00:00","a":"02/06/2026 05:06:37","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-RLX-BAN-AW-2233","n":"RUCHITA LADDHA","p":"9883889111","c":"SRAVANI MAHARANA","f":1,"pl":"30/05/2026 00:00:00","a":"02/06/2026 04:42:05","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-SNX-BAN-BS-2220","n":"SNEHA NANDRAJU","p":"7700033169","c":"TEHREEM ANSARI","f":1,"pl":"30/05/2026 00:00:00","a":"01/06/2026 02:43:09","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"WILL VISIT TODAY","nx":"01/06/2026 05:00:00"},{"r":"MK-WK-RMX-BAN-AC-2210","n":"RAMONA MAHESHWARI","p":"9820604725","c":"TANYA KEDARE","f":1,"pl":"30/05/2026 00:00:00","a":"02/06/2026 05:06:52","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-PTX-BAN-BS-2218","n":"PALAK TALREJA","p":"7888229900","c":"SHRUTI VORA","f":1,"pl":"15/06/2026 00:00:00","a":"31/05/2026 23:56:35","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"CUSTOMER HAD CAME TO JUST EXPLORE THE COLLECTION NO PLAN TO PUR MAYBE IN FUTURE THEY WILL VISIT IF NEEDED","nx":""},{"r":"MK-WK-NKX-BAN-DB-2204","n":"NEELAMABRI KULKARNI","p":"9987238848","c":"SHRUTI VORA","f":1,"pl":"26/05/2026 00:00:00","a":"27/05/2026 00:52:33","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 30/05/2026 11:00\n- REMARK  : Call cut after introduction- follow up","nx":"30/05/2026 11:00:00"},{"r":"MK-WK-NKX-BAN-DB-2204","n":"NEELAMABRI KULKARNI","p":"9987238848","c":"SHRUTI VORA","f":2,"pl":"30/05/2026 11:00:00","a":"01/06/2026 00:18:26","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-VKX-AND-PS-2207","n":"VANEERA KATARIA","p":"9820167741","c":"POOJA SHIGWAN","f":1,"pl":"27/05/2026 00:00:00","a":"02/06/2026 03:44:01","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NOT INTERESTED","nx":""},{"r":"MK-WK-AYS-BAN-AC-2193","n":"ANISHA Y SHARMA","p":"8779724239","c":"TANYA KEDARE","f":1,"pl":"26/05/2026 00:00:00","a":"02/06/2026 05:07:10","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-MVX-BAN-US-2174","n":"MRS. VELLECHA","p":"8652515802","c":"TEHREEM ANSARI","f":1,"pl":"25/05/2026 00:00:00","a":"01/06/2026 02:47:04","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 01/07/2026 12:00\n- REMARK  : SHE IS OUT OF TOWN WILL VISIT NEXT MONTH","nx":"01/07/2026 12:00:00"},{"r":"MK-WK-SAD-AND-VG-2176","n":"SADIK","p":"8655466894","c":"VIKAS GAUTAM","f":1,"pl":"28/05/2026 00:00:00","a":"02/06/2026 03:52:41","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"CLOSE BY RAM SIR","nx":""},{"r":"MK-WK-AGX-BAN-DB-2179","n":"AMITA GUPTA","p":"8558844605","c":"TANYA KEDARE","f":1,"pl":"26/05/2026 00:00:00","a":"02/06/2026 05:07:31","s":"BUSY / DECLINED","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-VKX-BAN-AC-2180","n":"VRUSHALI KUKREJA","p":"9619400029","c":"TEHREEM ANSARI","f":1,"pl":"24/05/2026 00:00:00","a":"01/06/2026 02:30:17","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-SJX-BAN-BS-2182","n":"SAKSHI JAGWANI","p":"9422208636","c":"TEHREEM ANSARI","f":1,"pl":"24/05/2026 00:00:00","a":"27/05/2026 00:56:21","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-MSX-BAN-US-2163","n":"MANDEEP SINGH","p":"9821053850","c":"TEHREEM ANSARI","f":1,"pl":"25/05/2026 00:00:00","a":"01/06/2026 02:45:19","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 08/06/2026 02:00\n- REMARK  : AATE HAI MA'AM","nx":"08/06/2026 02:00:00"},{"r":"MK-WK-SMX-BAN-NJ-2164","n":"SHEHZAN MANJI","p":"9619953666","c":"TEHREEM ANSARI","f":1,"pl":"29/05/2026 00:00:00","a":"01/06/2026 02:38:02","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"WILL VISIT IN A DAY OR TWO","nx":"02/06/2026 02:00:00"},{"r":"MK-WK-MAR-ZBX-PG-2165","n":"MARIA","p":"9706054000","c":"PRATIKSHA GOHIL","f":1,"pl":"25/05/2026 00:00:00","a":"02/06/2026 03:28:23","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"CUSTOMER IS OUT OF TOWN AND NOT INTERESTED","nx":""},{"r":"MK-WK-KJX-BAN-AW-2166","n":"KITIKA JAIN","p":"9619440733","c":"TEHREEM ANSARI","f":1,"pl":"25/05/2026 00:00:00","a":"27/05/2026 01:04:01","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Currently no REQUIREMENT","nx":""},{"r":"MK-WK-SSX-BAN-US-2168","n":"SHEEBA SETHI","p":"7738775552","c":"TEHREEM ANSARI","f":1,"pl":"24/05/2026 00:00:00","a":"01/06/2026 02:33:11","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 08/06/2026 12:00\n- REMARK  : SHE SAID I HAD ALREADY SPOKEN TO RAM WILL GET BACK TO YOU","nx":"08/06/2026 12:00:00"},{"r":"MK-WK-RCX-BAN-US-2157","n":"RUBY CHAUDHARY","p":"9987527301","c":"TEHREEM ANSARI","f":1,"pl":"24/05/2026 00:00:00","a":"27/05/2026 00:31:32","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-SHI-BAN-BS-2158","n":"SHIVANI","p":"9892598938","c":"SHRUTI VORA","f":1,"pl":"01/06/2026 00:00:00","a":"26/05/2026 06:43:17","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 31/05/2026 11:00\n- REMARK  : followup","nx":"31/05/2026 11:00:00"},{"r":"MK-WK-MKX-BAN-BS-2160","n":"MEHJABEEN KHAN","p":"9930182682","c":"SHRUTI VORA","f":1,"pl":"25/05/2026 00:00:00","a":"26/05/2026 06:45:26","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 01/06/2026 11:00\n- REMARK  : bhavna maam had a word they will discuss at home and let her know after few days","nx":"01/06/2026 11:00:00"},{"r":"MK-WK-SFX-BAN-US-2149","n":"SAHELA FAIZ","p":"9723551229","c":"TEHREEM ANSARI","f":1,"pl":"21/05/2026 00:00:00","a":"01/06/2026 03:13:31","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT THEY ARE ASKING 5% MAKING CHARGES WHICH IS NOT FEASIBLE","nx":""},{"r":"MK-WK-KCX-BAN-US-2152","n":"KAVITA CHAWLA","p":"9975562942","c":"TANYA KEDARE","f":1,"pl":"23/05/2026 00:00:00","a":"02/06/2026 05:07:54","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-RMX-BAN-BS-2153","n":"RITA MEHTA","p":"9870104533","c":"SHRUTI VORA","f":1,"pl":"24/05/2026 00:00:00","a":"26/05/2026 06:48:50","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 01/06/2026 11:00\n- REMARK  : bhavna maam had a word with customer they said they are busy with invitation cards things they will let us know whenever they want to finilaze","nx":"01/06/2026 11:00:00"},{"r":"MK-WK-SAX-BAN-AC-2146","n":"SNEHA ARORA","p":"8872356789","c":"TEHREEM ANSARI","f":1,"pl":"22/05/2026 00:00:00","a":"27/05/2026 00:34:55","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-ASX-BAN-BS-2111","n":"ANWAR SHAIKH","p":"9820268423","c":"SRAVANI MAHARANA","f":1,"pl":"18/05/2026 00:00:00","a":"02/06/2026 04:42:37","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"they brought Nath from another store","nx":""},{"r":"MK-WK-JKX-BAN-DB-2112","n":"JASLEEN KAUR","p":"9958569611","c":"TEHREEM ANSARI","f":1,"pl":"22/05/2026 00:00:00","a":"01/06/2026 02:50:32","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-SMX-BAN-AC-2115","n":"SHEHZAN MANJI","p":"9619953666","c":"TANYA KEDARE","f":1,"pl":"21/05/2026 00:00:00","a":"02/06/2026 05:19:10","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 17/06/2026 20:00\n- REMARK  : i'll come soon","nx":"17/06/2026 20:00:00"},{"r":"MK-WK-SMX-BAN-AC-2116","n":"SHEHZAN MANJI","p":"9619953666","c":"TANYA KEDARE","f":1,"pl":"21/05/2026 00:00:00","a":"02/06/2026 05:19:42","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 17/06/2026 20:00\n- REMARK  : i'll come soon","nx":"17/06/2026 20:00:00"},{"r":"MK-WK-ASX-BAN-BS-2120","n":"AYAZ SHAIKH","p":"9892275987","c":"TEHREEM ANSARI","f":1,"pl":"02/06/2026 00:00:00","a":"01/06/2026 02:24:45","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"DOUBLE ENTRY SAME NO. TWICE","nx":""},{"r":"MK-WK-ASX-BAN-BS-2121","n":"AYAZ SHAIKH","p":"9892275987","c":"TEHREEM ANSARI","f":1,"pl":"02/06/2026 00:00:00","a":"01/06/2026 02:24:05","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 06/06/2026 12:00\n- REMARK  : THEY SAID WE WILL VISIT DIDN'T SHARE THE ACCURATE DATE","nx":"06/06/2026 12:00:00"},{"r":"MK-WK-NMX-BAN-DB-2100","n":"NAZIYA MEMON","p":"9920100098","c":"SHRUTI VORA","f":1,"pl":"19/05/2026 00:00:00","a":"27/05/2026 00:53:36","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 30/05/2026 11:00\n- REMARK  : Deepa maam has whatsapp her as she is not answering the call","nx":"30/05/2026 11:00:00"},{"r":"MK-WK-PRA-BAN-BS-2101","n":"PRACHI","p":"9819338873","c":"TEHREEM ANSARI","f":1,"pl":"18/05/2026 00:00:00","a":"01/06/2026 00:36:09","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"SHE STRICTLY MENTIONED NO MARKETING MESSAGE AND SHE SAID I'LL COME BACK ON M Y OWN BUT NEVER DID SO","nx":""},{"r":"MK-WK-PRX-BAN-BS-2108","n":"PRIYANKA RAITANI","p":"9795669797","c":"SRAVANI MAHARANA","f":1,"pl":"17/05/2026 00:00:00","a":"02/06/2026 04:43:00","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-RPX-BAN-NA-2083","n":"ROHINI PATIL","p":"9881300674","c":"TANYA KEDARE","f":1,"pl":"16/05/2026 00:00:00","a":"02/06/2026 05:20:10","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 17/06/2026 20:00\n- REMARK  : not conform I'll let you know","nx":"17/06/2026 20:00:00"},{"r":"MK-WK-AAX-BAN-AC-2089","n":"ARZOO AGARWAL","p":"9820066279","c":"TANYA KEDARE","f":1,"pl":"18/05/2026 00:00:00","a":"17/05/2026 01:39:15","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"[ close] bcz she was asking for the price which is not even our cost","nx":""},{"r":"MK-WK-HPX-AND-PS-2097","n":"HALIMA PATEL","p":"7977544808","c":"POOJA SHIGWAN","f":1,"pl":"15/05/2026 00:00:00","a":"03/06/2026 03:01:50","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NOT INTERESTED","nx":""},{"r":"MK-WK-SRX-BAN-AC-2078","n":"SIDDESH RAJPUT","p":"8879888344","c":"TEHREEM ANSARI","f":1,"pl":"16/05/2026 00:00:00","a":"15/05/2026 03:10:07","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-PPX-BAN-AC-2081","n":"PALAK PURSWANI","p":"8888801808","c":"TEHREEM ANSARI","f":1,"pl":"15/05/2026 00:00:00","a":"27/05/2026 00:36:13","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"not intrested","nx":""},{"r":"MK-WK-TRX-AND-BB-2085","n":"TARANNUM RAWANI","p":"9152298888","c":"BHOOMI BHAGAT","f":1,"pl":"15/07/2026 00:00:00","a":"15/05/2026 03:31:03","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT As of now","nx":""},{"r":"MK-WK-HSX-BAN-DB-2060","n":"HUMERA SAQLAIN","p":"7715073999","c":"SHRUTI VORA","f":1,"pl":"14/05/2026 00:00:00","a":"16/05/2026 06:17:48","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Order placed","nx":""},{"r":"MK-WK-HSX-BAN-DB-2067","n":"HEENA SANGHVI","p":"9323420721","c":"TEHREEM ANSARI","f":1,"pl":"16/05/2026 00:00:00","a":"01/06/2026 03:14:04","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-VMX-BAN-BS-2071","n":"VAISHALI MEHTA","p":"9819849802","c":"SRAVANI MAHARANA","f":1,"pl":"16/05/2026 00:00:00","a":"15/05/2026 00:38:47","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-SKX-BAN-TA-2539","n":"SANA KHAKRA","p":"9821225422","c":"TEHREEM ANSARI","f":1,"pl":"14/05/2026 00:00:00","a":"15/05/2026 03:11:22","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 22/05/2026 12:00\n- REMARK  : Coordinating with bhavna maam on  whatsapp","nx":"22/05/2026 12:00:00"},{"r":"MK-WK-SKX-BAN-TA-2539","n":"SANA KHAKRA","p":"9821225422","c":"TEHREEM ANSARI","f":2,"pl":"21/05/2026 11:00:00","a":"19/05/2026 03:10:34","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 15/06/2026 12:00\n- REMARK  : she is travelling will connect with us after 20/25 days","nx":"15/06/2026 12:00"},{"r":"MK-WK-SSX-BAN-US-2052","n":"SHRUTI SHETTY","p":"7738024422","c":"SHRUTI VORA","f":1,"pl":"13/05/2026 00:00:00","a":"13/05/2026 05:09:17","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"wanted ready and particular pc","nx":""},{"r":"MK-WK-IJX-AND-BB-2064","n":"ISHIKA JAIN","p":"7738604766","c":"BHOOMI BHAGAT","f":1,"pl":"16/05/2026 00:00:00","a":"15/05/2026 03:31:50","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 07/06/2026 13:30\n- REMARK  : Will visit after 20days","nx":"07/06/2026 13:30:00"},{"r":"MK-WK-SPX-BAN-TK-2502","n":"SANA PATEL","p":"9920758177","c":"TANYA KEDARE","f":1,"pl":"12/05/2026 00:00:00","a":"18/05/2026 01:59:58","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 23/05/2026 02:00\n- REMARK  : CUSTOMER IS OUT OF MUMBAI SHE WILL GET IN TOUCH ONCE SHE'LL BACK","nx":"23/05/2026 02:00:00"},{"r":"MK-WK-SPX-BAN-TK-2502","n":"SANA PATEL","p":"9920758177","c":"TANYA KEDARE","f":2,"pl":"22/05/2026 11:00:00","a":"18/05/2026 04:52:55","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 22/05/2026 11:00\n- REMARK  : Customer is travelling out of station , she will get in touch once she comes back","nx":"22/05/2026 11:00"},{"r":"MK-WK-SPX-BAN-TK-2502","n":"SANA PATEL","p":"9920758177","c":"TANYA KEDARE","f":3,"pl":"21/05/2026 11:00:00","a":"02/06/2026 05:21:05","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-TDX-BAN-TA-2504","n":"TANISHKA DESAI","p":"9689908973","c":"TEHREEM ANSARI","f":1,"pl":"11/05/2026 00:00:00","a":"19/05/2026 03:02:35","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"no requirement","nx":""},{"r":"MK-WK-SHR-BAN-TK-2510","n":"SHRADDHA","p":"7506070998","c":"TANYA KEDARE","f":1,"pl":"12/05/2026 00:00:00","a":"15/05/2026 02:43:22","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"SHE WAS JUST BROWSING THE COLLECTION","nx":""},{"r":"MK-WK-NJX-BAN-TA-2511","n":"NYRA JESWANI","p":"9827977929","c":"TEHREEM ANSARI","f":1,"pl":"12/05/2026 00:00:00","a":"27/05/2026 00:50:21","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement his brother went back to his native","nx":""},{"r":"MK-WK-ABX-BAN-TA-2515","n":"AARTI BHATLA","p":"9889880370","c":"TEHREEM ANSARI","f":1,"pl":"12/05/2026 00:00:00","a":"12/05/2026 06:29:09","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased","nx":""},{"r":"MK-WK-SCX-BAN-SV-2516","n":"SAMA CHOUDHARY","p":"7506297227","c":"SHRUTI VORA","f":1,"pl":"11/05/2026 00:00:00","a":"13/05/2026 05:11:09","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 31/05/2026 11:00\n- REMARK  : uma maam to send quote","nx":"31/05/2026 11:00:00"},{"r":"MK-WK-SCX-BAN-SV-2516","n":"SAMA CHOUDHARY","p":"7506297227","c":"SHRUTI VORA","f":2,"pl":"30/05/2026 11:00:00","a":"01/06/2026 00:18:08","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 30/06/2026 11:00\n- REMARK  : FOLLOWUP","nx":"30/06/2026 11:00"},{"r":"MK-WK-RAX-BAN-SV-2519","n":"RADHIKA ARORA","p":"9768213222","c":"SHRUTI VORA","f":1,"pl":"11/05/2026 00:00:00","a":"13/05/2026 05:10:19","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased","nx":""},{"r":"MK-WK-VCX-BAN-TK-2527","n":"VARHA  CHOUDHARY","p":"9920029915","c":"TANYA KEDARE","f":1,"pl":"13/05/2026 00:00:00","a":"18/05/2026 01:16:32","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-JMX-AND-NA-2537","n":"JAGRUTI MEHATA","p":"7506475002","c":"BHOOMI BHAGAT","f":1,"pl":"10/05/2026 00:00:00","a":"15/05/2026 03:32:18","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-MST-AND-NA-2538","n":"MS. SEEMA TANDON","p":"9820420582","c":"BHOOMI BHAGAT","f":1,"pl":"10/05/2026 00:00:00","a":"15/05/2026 03:32:50","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-PSX-BAN-TA-2488","n":"PARISHA SHAH","p":"9892116648","c":"TEHREEM ANSARI","f":1,"pl":"10/05/2026 00:00:00","a":"14/05/2026 02:18:00","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-SPX-BAN-SV-2494","n":"SALMA PATKA","p":"9930255595","c":"SHRUTI VORA","f":1,"pl":"10/05/2026 00:00:00","a":"13/05/2026 05:02:11","s":"ALREADY PURCHASED FROM MK JEWELS","m":"order placed","nx":""},{"r":"MK-WK-MPX-BAN-SV-2498","n":"MAARIA PALSANI","p":"8369534471","c":"SHRUTI VORA","f":1,"pl":"10/05/2026 00:00:00","a":"13/05/2026 05:13:57","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 18/05/2026 11:00\n- REMARK  : followup","nx":"18/05/2026 11:00:00"},{"r":"MK-WK-SHX-BAN-TA-2477","n":"SAMIA HAZURIA","p":"9820225905","c":"TEHREEM ANSARI","f":1,"pl":"09/05/2026 00:00:00","a":"15/05/2026 03:11:57","s":"ALREADY PURCHASED FROM MK JEWELS","m":"ALREADY PURCHASED","nx":""},{"r":"MK-WK-MJX-BAN-TK-2480","n":"MITTU JESWANI","p":"9860813555","c":"TANYA KEDARE","f":1,"pl":"10/05/2026 00:00:00","a":"15/05/2026 02:58:38","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"WE WILL SCEDULE A VIDEO CALL FOR HER WHENEVER SHE IS FREE , AS HER MOTHER WONT BE ABLE TO COME","nx":"18/05/2026 01:00:00"},{"r":"MK-WK-MJX-BAN-TK-2480","n":"MITTU JESWANI","p":"9860813555","c":"TANYA KEDARE","f":2,"pl":"18/05/2026 11:00:00","a":"02/06/2026 05:21:22","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-ZOR-BAN-TK-2481","n":"ZORAA","p":"7045758231","c":"TANYA KEDARE","f":1,"pl":"10/05/2026 00:00:00","a":"15/05/2026 03:07:34","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"SHE HAVE NO REQUIREMENT RIGHT NOW","nx":""},{"r":"MK-WK-NZX-BAN-TA-2483","n":"NAZIYA ZAVERI","p":"9819700279","c":"TEHREEM ANSARI","f":1,"pl":"10/05/2026 00:00:00","a":"27/05/2026 00:44:06","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"will visit","nx":"03/06/2026 12:00:00"},{"r":"MK-WK-SRX-ZBX-PG-2061","n":"SONA ROHRA","p":"7869228666","c":"PRATIKSHA GOHIL","f":1,"pl":"09/05/2026 00:00:00","a":"13/05/2026 05:13:29","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Bandra Store se purchase Kiya Hai order bhi diya hai Uma mam ke pass Se Maine unko Uma madam ko customer ka number diya tha customer ko Uma mam ka number diya tha aur vah visit bhi kiye the aur unhen purchase bhi kiya hai aur order bhi diya hai 9 tarikh ko","nx":""},{"r":"MK-WK-SJX-AND-NA-2459","n":"SURAJ JAWAHAR","p":"9004379378","c":"BHOOMI BHAGAT","f":1,"pl":"07/05/2026 00:00:00","a":"15/05/2026 03:33:29","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-ASX-BAN-TA-2461","n":"AASHI SHAH","p":"9930886664","c":"TEHREEM ANSARI","f":1,"pl":"08/05/2026 00:00:00","a":"14/05/2026 02:23:23","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-SKX-BAN-SV-2465","n":"SWATI KINJRANI","p":"9930322180","c":"SHRUTI VORA","f":1,"pl":"08/05/2026 00:00:00","a":"13/05/2026 05:16:53","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 18/05/2026 11:00\n- REMARK  : followup","nx":"18/05/2026 11:00:00"},{"r":"MK-WK-SKX-BAN-SV-2465","n":"SWATI KINJRANI","p":"9930322180","c":"SHRUTI VORA","f":2,"pl":"17/05/2026 11:00:00","a":"27/05/2026 00:54:17","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 15/06/2026 11:00\n- REMARK  : Deepa maam had word with her she will visit on 15th june","nx":"15/06/2026 11:00"},{"r":"MK-WK-ASX-BAN-SV-2466","n":"AJAY SINGH","p":"9512781794","c":"SHRUTI VORA","f":1,"pl":"07/05/2026 00:00:00","a":"13/05/2026 05:17:50","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer wanted particular pendent in ready","nx":""},{"r":"MK-WK-ADX-BAN-SM-2469","n":"AIYESHA DUMBA","p":"9986117786","c":"SRAVANI MAHARANA","f":1,"pl":"13/06/2026 00:00:00","a":"15/05/2026 00:40:41","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT)","nx":""},{"r":"MK-WK-SSX-AND-NA-2473","n":"SHAMSHAD SAYED","p":"9769776009","c":"VIKAS GAUTAM","f":1,"pl":"31/07/2026 00:00:00","a":"18/05/2026 23:29:10","s":"RINGING / NOT ANSWERED","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-KTX-BAN-TA-2454","n":"KISHAN THACKER","p":"7016098263","c":"TEHREEM ANSARI","f":1,"pl":"08/05/2026 00:00:00","a":"14/05/2026 02:21:53","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 17/05/2026 02:00\n- REMARK  : was driving can't talk right now said to uma maam","nx":"17/05/2026 02:00:00"},{"r":"MK-WK-KTX-BAN-TA-2454","n":"KISHAN THACKER","p":"7016098263","c":"TEHREEM ANSARI","f":2,"pl":"17/05/2026 11:00:00","a":"19/05/2026 03:03:55","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-SHA-BAN-SV-2455","n":"SHAGUFTA","p":"9443630787","c":"SHRUTI VORA","f":1,"pl":"07/05/2026 00:00:00","a":"13/05/2026 05:17:18","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"just came to explore","nx":""},{"r":"MK-WK-NJX-BAN-SM-2456","n":"NYRA JESWANI","p":"9827977929","c":"SRAVANI MAHARANA","f":1,"pl":"08/05/2026 00:00:00","a":"14/05/2026 04:40:49","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she will go to andheri store for purchase","nx":""},{"r":"MK-WK-HHX-BAN-SM-2445","n":"HEENA HOTCHANDANI","p":"8452831340","c":"SRAVANI MAHARANA","f":1,"pl":"06/05/2026 00:00:00","a":"14/05/2026 03:50:47","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they said rn they dont have any requirements","nx":""},{"r":"MK-WK-NAM-BAN-TA-2449","n":"NAMRATA","p":"9922333488","c":"TEHREEM ANSARI","f":1,"pl":"07/05/2026 00:00:00","a":"14/05/2026 02:25:38","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-FZX-BAN-TK-2451","n":"FARZANA ZAVERI","p":"8879058972","c":"TANYA KEDARE","f":1,"pl":"07/05/2026 00:00:00","a":"02/06/2026 05:21:40","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-SLX-BAN-TK-2453","n":"SALIM LODHA","p":"9825689825","c":"TANYA KEDARE","f":1,"pl":"06/05/2026 00:00:00","a":"15/05/2026 03:24:48","s":"ALREADY PURCHASED FROM MK JEWELS","m":"NO ANY ANOTHER REQUIREMENT BCZ THEIR DELIVERY OF ONE ORDER IS PENDING","nx":""},{"r":"MK-WK-JKX-AND-NA-2437","n":"JAYA KALWANI","p":"8828089556","c":"BHOOMI BHAGAT","f":1,"pl":"05/05/2026 00:00:00","a":"05/05/2026 23:07:52","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 06/05/2026 05:00\n- REMARK  : Today she will visit with husaband","nx":"06/05/2026 05:00:00"},{"r":"MK-WK-JKX-AND-NA-2437","n":"JAYA KALWANI","p":"8828089556","c":"NA","f":2,"pl":"06/05/2026 11:00:00","a":"07/05/2026 20:37:27","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Next day come 6th may and purchased pendent set","nx":""},{"r":"MK-WK-PCX-BAN-TK-2439","n":"POOJA CHANDIRAMANI","p":"7215811013","c":"TANYA KEDARE","f":1,"pl":"08/05/2026 00:00:00","a":"15/05/2026 03:12:14","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"WRONG NUMBER","nx":""},{"r":"MK-WK-SZX-BAN-TK-2440","n":"SANA ZAVERI","p":"9867861443","c":"TANYA KEDARE","f":1,"pl":"08/05/2026 00:00:00","a":"19/05/2026 00:31:02","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Not Interested","nx":""},{"r":"MK-WK-SJX-BAN-SV-2441","n":"SALONI JAIN","p":"9920524866","c":"SHRUTI VORA","f":1,"pl":"10/05/2026 00:00:00","a":"13/05/2026 05:15:21","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"just came to explore","nx":""},{"r":"MK-WK-KRX-BAN-SV-2442","n":"KRITIKA ROHIRA","p":"9819184186","c":"SHRUTI VORA","f":1,"pl":"05/05/2026 00:00:00","a":"13/05/2026 05:03:58","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased","nx":""},{"r":"MK-WK-ASH-BAN-TK-2416","n":"ASHA","p":"9920073516","c":"TANYA KEDARE","f":1,"pl":"07/05/2026 00:00:00","a":"15/05/2026 03:16:50","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 16/05/2026 02:00\n- REMARK  : SHE SAID SHE WILL COORDINATE WITH BHAVNA MAM","nx":"16/05/2026 02:00:00"},{"r":"MK-WK-ASH-BAN-TK-2416","n":"ASHA","p":"9920073516","c":"TANYA KEDARE","f":2,"pl":"16/05/2026 11:00:00","a":"15/05/2026 06:16:13","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 17/05/2026 12:00\n- REMARK  : she will coordinate with bhavna mam","nx":"17/05/2026 12:00"},{"r":"MK-WK-ASH-BAN-TK-2416","n":"ASHA","p":"9920073516","c":"TANYA KEDARE","f":3,"pl":"17/05/2026 11:00:00","a":"19/05/2026 02:56:58","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-PJX-AND-NA-2417","n":"PRATIMA JAIN","p":"9930758494","c":"BHOOMI BHAGAT","f":1,"pl":"06/05/2026 00:00:00","a":"15/05/2026 03:33:50","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-TBK-BAN-TA-2419","n":"T B KHEMCHANDANI","p":"9322139191","c":"TEHREEM ANSARI","f":1,"pl":"06/05/2026 00:00:00","a":"14/05/2026 02:27:21","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-RZX-BAN-SM-2422","n":"RAHIMA ZIKHAR","p":"8123442941","c":"SRAVANI MAHARANA","f":1,"pl":"07/05/2026 00:00:00","a":"14/05/2026 04:26:44","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"her husband thinks making is too much","nx":""},{"r":"MK-WK-SDX-BAN-TK-2423","n":"SOBIYA DARVESH","p":"9699907838","c":"TANYA KEDARE","f":1,"pl":"05/05/2026 00:00:00","a":"18/05/2026 06:36:47","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she clearly mentioned [ no requirement]","nx":""},{"r":"MK-WK-MAY-BAN-SM-2425","n":"MAYUR","p":"9324210822","c":"SRAVANI MAHARANA","f":1,"pl":"06/05/2026 00:00:00","a":"14/05/2026 03:51:51","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they think our prices are high compare to other stores","nx":""},{"r":"MK-WK-PTX-BAN-SV-2428","n":"PAYAL TAHILIANI","p":"9820601973","c":"SHRUTI VORA","f":1,"pl":"05/05/2026 00:00:00","a":"13/05/2026 05:20:21","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 18/05/2026 11:00\n- REMARK  : take update from ashwini sir","nx":"18/05/2026 11:00:00"},{"r":"MK-WK-SPX-BAN-SV-2429","n":"SANA PATEL","p":"9920758177","c":"SHRUTI VORA","f":1,"pl":"05/05/2026 00:00:00","a":"13/05/2026 05:19:49","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 31/05/2026 11:00\n- REMARK  : followup","nx":"31/05/2026 11:00:00"},{"r":"MK-WK-SPX-BAN-SV-2429","n":"SANA PATEL","p":"9920758177","c":"SHRUTI VORA","f":2,"pl":"30/05/2026 11:00:00","a":"27/05/2026 01:16:47","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 10/06/2026 11:00\n- REMARK  : customer is in vaccation - deepa is in followup with her","nx":"10/06/2026 11:00"},{"r":"MK-WK-ZSX-BAN-SV-2430","n":"ZAINAB SOREWALA","p":"9987811050","c":"SHRUTI VORA","f":1,"pl":"05/05/2026 00:00:00","a":"13/05/2026 05:19:03","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 18/05/2026 11:00\n- REMARK  : take update from uma maam","nx":"18/05/2026 11:00:00"},{"r":"MK-WK-HKX-BAN-SV-2407","n":"HEENA KAPADIA","p":"9930908171","c":"SHRUTI VORA","f":1,"pl":"04/05/2026 00:00:00","a":"13/05/2026 05:22:06","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"purchased from other store","nx":""},{"r":"MK-WK-PGX-BAN-TA-2408","n":"PARUL GANDHI","p":"9453466998","c":"TEHREEM ANSARI","f":1,"pl":"05/05/2026 00:00:00","a":"14/05/2026 02:28:15","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-SMX-AND-NA-2412","n":"SHIFA MEMAN","p":"9867864555","c":"BHOOMI BHAGAT","f":1,"pl":"03/05/2026 00:00:00","a":"07/05/2026 20:39:33","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"No requirement","nx":""},{"r":"MK-WK-NSX-AND-NA-2413","n":"NIDA SURYA","p":"9833442088","c":"POOJA SHIGWAN","f":1,"pl":"04/05/2026 00:00:00","a":"15/05/2026 04:30:49","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT AT THE MOMENT FOLLOW UP AFTER A FEW MONTH","nx":""},{"r":"MK-WK-BSX-AND-NA-2395","n":"BARAKHA SINHA","p":"9152524252","c":"POOJA SHIGWAN","f":1,"pl":"01/05/2026 00:00:00","a":"15/05/2026 04:12:30","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-VJX-BAN-TK-2398","n":"VANITA JAISING","p":"9819505086","c":"TANYA KEDARE","f":1,"pl":"09/05/2026 00:00:00","a":"02/06/2026 05:21:55","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-SHI-BAN-TK-2404","n":"SHITAL","p":"9892591518","c":"TANYA KEDARE","f":1,"pl":"09/05/2026 00:00:00","a":"15/05/2026 03:08:42","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NON REQUIREMENT , SHE WAS JUST BROWSING [ CLOSE]","nx":""},{"r":"MK-WK-KJX-BAN-TK-2405","n":"KALA  JEEWANI","p":"7021708453","c":"TANYA KEDARE","f":1,"pl":"07/05/2026 00:00:00","a":"02/05/2026 00:12:46","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Client just came for the price calculation of her ring which she bought from us 3 yes back","nx":""},{"r":"MK-WK-RUX-AND-NA-2406","n":"RAGHINI UNADKAT","p":"9167718777","c":"BHOOMI BHAGAT","f":1,"pl":"02/05/2026 00:00:00","a":"07/05/2026 20:41:07","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"No requirement at the moment","nx":""},{"r":"MK-WK-VSX-BAN-TA-2379","n":"VIDHI SANGHAVI","p":"8291201993","c":"TEHREEM ANSARI","f":1,"pl":"05/05/2026 00:00:00","a":"19/05/2026 03:22:56","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 19/06/2026 12:00\n- REMARK  : due to hike in gold rates she dropped her plan for now probably be visiting by next month","nx":"19/06/2026 12:00:00"},{"r":"MK-WK-SNX-BAN-SV-2380","n":"SUNITA NANDKUMAR","p":"9820021613","c":"SHRUTI VORA","f":1,"pl":"02/05/2026 00:00:00","a":"01/06/2026 00:00:23","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT FOR NOW CHANGED THEY PLANS","nx":""},{"r":"MK-WK-CCX-BAN-TK-2382","n":"CHERRY CHHATROLA","p":"9619318731","c":"TANYA KEDARE","f":1,"pl":"10/05/2026 00:00:00","a":"19/05/2026 00:32:16","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement she is exploring other  product now","nx":""},{"r":"MK-WK-MLX-BAN-TA-2383","n":"MUNIRA LONIWALA","p":"9820700911","c":"TEHREEM ANSARI","f":1,"pl":"03/05/2026 00:00:00","a":"19/05/2026 03:15:41","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-VJX-BAN-SM-2384","n":"VINOD JAIN","p":"9869766671","c":"SRAVANI MAHARANA","f":1,"pl":"02/05/2026 00:00:00","a":"14/05/2026 04:04:08","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-SDX-BAN-SV-2385","n":"SOBIYA DARVESH","p":"9699907838","c":"SHRUTI VORA","f":1,"pl":"03/05/2026 00:00:00","a":"13/05/2026 05:23:46","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement at the moment","nx":""},{"r":"MK-WK-DEE-BAN-SV-2388","n":"DEEPIKA","p":"9922115500","c":"SHRUTI VORA","f":1,"pl":"01/05/2026 00:00:00","a":"13/05/2026 05:29:27","s":"ALREADY PURCHASED FROM MK JEWELS","m":"pur from mk","nx":""},{"r":"MK-WK-NMX-BAN-TA-2369","n":"NEHA MENGHANI","p":"9819044277","c":"TEHREEM ANSARI","f":1,"pl":"01/05/2026 00:00:00","a":"14/05/2026 02:36:08","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-APX-BAN-SV-2370","n":"ANJU PUNJABI","p":"8369510212","c":"SHRUTI VORA","f":1,"pl":"20/05/2026 00:00:00","a":"13/05/2026 05:06:20","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer wanted ready pc","nx":""},{"r":"MK-WK-ASX-BAN-SV-2371","n":"ANJALI SURANA","p":"9890338682","c":"SHRUTI VORA","f":1,"pl":"30/04/2026 00:00:00","a":"13/05/2026 05:31:53","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"pur from another store","nx":""},{"r":"MK-WK-MLX-BAN-TA-2372","n":"MEENAZ LADHA","p":"9820505047","c":"TEHREEM ANSARI","f":1,"pl":"30/04/2026 00:00:00","a":"30/04/2026 07:32:10","s":"ALREADY PURCHASED FROM MK JEWELS","m":"PURCHASED","nx":""},{"r":"MK-WK-MIZ-BAN-SV-2373","n":"MIZBA","p":"9820268070","c":"SHRUTI VORA","f":1,"pl":"02/05/2026 00:00:00","a":"13/05/2026 05:26:46","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 13/05/2026 11:00\n- REMARK  : followup","nx":"13/05/2026 11:00:00"},{"r":"MK-WK-MIZ-BAN-SV-2373","n":"MIZBA","p":"9820268070","c":"SHRUTI VORA","f":2,"pl":"13/05/2026 11:00:00","a":"01/06/2026 00:01:15","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-PNX-AND-NA-2375","n":"PARIDHI NILKANTH","p":"9930268988","c":"POOJA SHIGWAN","f":1,"pl":"30/04/2026 00:00:00","a":"15/05/2026 04:13:31","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 22/05/2026 14:00\n- REMARK  : NA","nx":"22/05/2026 14:00:00"},{"r":"MK-WK-PNX-AND-NA-2375","n":"PARIDHI NILKANTH","p":"9930268988","c":"NA","f":2,"pl":"21/05/2026 11:00:00","a":"02/06/2026 03:45:08","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"filhal order dene ka nhi hai hold pe haI","nx":""},{"r":"MK-WK-VSX-BAN-SM-2349","n":"VAISHNAVI SAWLANI","p":"7499522153","c":"SRAVANI MAHARANA","f":1,"pl":"29/04/2026 00:00:00","a":"14/05/2026 03:37:29","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"they said they got better making then mk","nx":""},{"r":"MK-WK-RSX-BAN-TA-2351","n":"RIDDHI SAWLANI","p":"9145748114","c":"TEHREEM ANSARI","f":1,"pl":"29/04/2026 00:00:00","a":"29/04/2026 00:37:50","s":"ALREADY PURCHASED FROM MK JEWELS","m":"PURCHASED","nx":""},{"r":"MK-WK-HIT-BAN-TA-2352","n":"HITESH","p":"9820766779","c":"TEHREEM ANSARI","f":1,"pl":"29/04/2026 00:00:00","a":"14/05/2026 02:41:08","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-VIS-BAN-SM-2353","n":"VISHAL","p":"9892244828","c":"SRAVANI MAHARANA","f":1,"pl":"29/04/2026 00:00:00","a":"02/06/2026 04:43:42","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 17/06/2026 20:00\n- REMARK  : they'll buy from ahemdabad","nx":"17/06/2026 20:00:00"},{"r":"MK-WK-AMJ-BAN-SV-2355","n":"ALI MOHAMMAD JUNAID","p":"9930287723","c":"SHRUTI VORA","f":1,"pl":"30/04/2026 00:00:00","a":"13/05/2026 05:32:24","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 31/05/2026 11:00\n- REMARK  : followup","nx":"31/05/2026 11:00:00"},{"r":"MK-WK-AMJ-BAN-SV-2355","n":"ALI MOHAMMAD JUNAID","p":"9930287723","c":"SHRUTI VORA","f":2,"pl":"30/05/2026 11:00:00","a":"27/05/2026 00:51:37","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 10/06/2026 11:00\n- REMARK  : Deepa maam Is in talk with him on whatsapp","nx":"10/06/2026 11:00"},{"r":"MK-WK-FDX-BAN-TA-2356","n":"FARZANA DEEWAN","p":"9284419781","c":"TEHREEM ANSARI","f":1,"pl":"30/04/2026 00:00:00","a":"15/05/2026 03:13:19","s":"RINGING / NOT ANSWERED","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-ESX-BAN-TA-2357","n":"ESHMEET SIAN","p":"9892588889","c":"TEHREEM ANSARI","f":1,"pl":"01/05/2026 00:00:00","a":"14/05/2026 02:34:15","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"-","nx":"01/06/2026 02:00:00"},{"r":"MK-WK-NAB-BAN-SV-2359","n":"NABILA","p":"9884474608","c":"SHRUTI VORA","f":1,"pl":"29/04/2026 00:00:00","a":"13/05/2026 05:33:13","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement for now","nx":""},{"r":"MK-WK-AJX-BAN-SV-2360","n":"AYESHA JUNAID","p":"9594658043","c":"SHRUTI VORA","f":1,"pl":"30/04/2026 00:00:00","a":"13/05/2026 05:31:15","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she will call whenever needed","nx":""},{"r":"MK-WK-ASX-AND-NA-2361","n":"AKHIL SINDHU","p":"9321798886","c":"POOJA SHIGWAN","f":1,"pl":"29/04/2026 00:00:00","a":"29/04/2026 04:00:29","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"No","nx":""},{"r":"MK-WK-VHX-BAN-SM-2362","n":"VERSHA HASANE","p":"9420020040","c":"SRAVANI MAHARANA","f":1,"pl":"30/04/2026 00:00:00","a":"14/05/2026 03:41:08","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"they purchased from anothere jewelery shop because they liked there design better","nx":""},{"r":"MK-WK-KBX-BAN-SM-2363","n":"KOMAL BABANI","p":"9821542424","c":"SRAVANI MAHARANA","f":1,"pl":"30/04/2026 00:00:00","a":"14/05/2026 03:43:00","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she said they have no requirement rn","nx":""},{"r":"MK-WK-PPS-BAN-SM-2335","n":"PREETI PUNIT SURANA","p":"9833850819","c":"SRAVANI MAHARANA","f":1,"pl":"28/04/2026 00:00:00","a":"27/04/2026 04:16:15","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 02/05/2026 11:11\n- REMARK  : LONGG REMARKKKKKKKKKKK","nx":"02/05/2026 11:11:00"},{"r":"MK-WK-PPS-BAN-SM-2335","n":"PREETI PUNIT SURANA","p":"9833850819","c":"SRAVANI MAHARANA","f":2,"pl":"01/05/2026 11:00:00","a":"14/05/2026 03:44:23","s":"ALREADY PURCHASED FROM MK JEWELS","m":"deepa maam visited her home and she purchased","nx":""},{"r":"MK-WK-BTX-BAN-SV-2339","n":"BHAVANA THARWANI","p":"8600149200","c":"SHRUTI VORA","f":1,"pl":"29/04/2026 00:00:00","a":"13/05/2026 05:34:43","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement for now informed by neha maam","nx":""},{"r":"MK-WK-NIK-BAN-SM-2341","n":"NIKITA","p":"9819513909","c":"SRAVANI MAHARANA","f":1,"pl":"28/04/2026 00:00:00","a":"14/05/2026 03:25:26","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"clint dont want to purchase rn","nx":""},{"r":"MK-WK-RPX-AND-NA-2347","n":"RASHMEEN PATEL","p":"9619794974","c":"POOJA SHIGWAN","f":1,"pl":"28/04/2026 00:00:00","a":"29/04/2026 04:07:33","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Inka sale returns tha","nx":""},{"r":"MK-WK-SLX-AND-NA-2320","n":"SHABAZ LOKADIA","p":"9773790886","c":"VIKAS GAUTAM","f":1,"pl":"30/04/2026 00:00:00","a":"14/05/2026 03:56:52","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Making to much high we pay only 700/- per gram","nx":""},{"r":"MK-WK-PBX-BAN-TA-2321","n":"PARUL BHATIA","p":"7208776377","c":"TEHREEM ANSARI","f":1,"pl":"30/04/2026 00:00:00","a":"29/04/2026 02:32:19","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer was asking 500/- making charges which is not feasible","nx":""},{"r":"MK-WK-PPX-BAN-SV-2324","n":"POONAM PARYANI","p":"9870797717","c":"SHRUTI VORA","f":1,"pl":"27/04/2026 00:00:00","a":"30/04/2026 04:26:45","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 03/05/2026 11:00\n- REMARK  : revisited us but the product was sent to Ahmedabad store","nx":"03/05/2026 11:00:00"},{"r":"MK-WK-PPX-BAN-SV-2324","n":"POONAM PARYANI","p":"9870797717","c":"SHRUTI VORA","f":2,"pl":"03/05/2026 11:00:00","a":"03/05/2026 23:51:29","s":"ALREADY PURCHASED FROM MK JEWELS","m":"pur earring","nx":""},{"r":"MK-WK-RBX-BAN-TA-2328","n":"RUBINA BATLIWALA","p":"8657862400","c":"TEHREEM ANSARI","f":1,"pl":"28/04/2026 00:00:00","a":"14/05/2026 02:43:49","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased","nx":""},{"r":"MK-WK-SJX-AND-NA-2330","n":"SHAILJA JAISWAL","p":"9831943527","c":"BHOOMI BHAGAT","f":1,"pl":"28/04/2026 00:00:00","a":"07/05/2026 20:43:58","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 10/05/2026 04:00\n- REMARK  : She want to see more design we have arrange also but not visited again last follow and show her bangles design 10th may .","nx":"10/05/2026 04:00:00"},{"r":"MK-WK-SJX-AND-NA-2330","n":"SHAILJA JAISWAL","p":"9831943527","c":"NA","f":2,"pl":"10/05/2026 11:00:00","a":"15/05/2026 03:38:42","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-DRX-AND-NA-2305","n":"DEEPTI RAINA","p":"9987307771","c":"BHOOMI BHAGAT","f":1,"pl":"26/04/2026 00:00:00","a":"15/05/2026 03:35:09","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 31/05/2026 13:30\n- REMARK  : Will visit store , as of now out of station","nx":"31/05/2026 13:30:00"},{"r":"MK-WK-AYE-BAN-SV-2309","n":"AYESHA","p":"9819685536","c":"TEHREEM ANSARI","f":1,"pl":"26/04/2026 00:00:00","a":"29/04/2026 02:49:56","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-SSX-BAN-TA-2310","n":"SEEMA SINGH","p":"9820033862","c":"TEHREEM ANSARI","f":1,"pl":"30/04/2026 00:00:00","a":"28/04/2026 04:42:46","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased","nx":""},{"r":"MK-WK-OLI-BAN-TA-2313","n":"OLIVER","p":"8850686110","c":"TEHREEM ANSARI","f":1,"pl":"29/04/2026 00:00:00","a":"14/05/2026 02:43:12","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"-","nx":"04/09/2026 12:00:00"},{"r":"MK-WK-SRX-BAN-SV-2316","n":"SALMAN ROKODIA","p":"9773790886","c":"SHRUTI VORA","f":1,"pl":"26/04/2026 00:00:00","a":"17/05/2026 23:55:46","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Pur from mk","nx":""},{"r":"MK-WK-NKX-BAN-SM-2296","n":"NEETA KAVEDI","p":"9920222144","c":"SRAVANI MAHARANA","f":1,"pl":"27/04/2026 00:00:00","a":"02/06/2026 04:44:18","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they have no requirement","nx":""},{"r":"MK-WK-RGX-BAN-TA-2299","n":"RAZIYA GHETA","p":"9702416635","c":"TEHREEM ANSARI","f":1,"pl":"25/04/2026 00:00:00","a":"29/04/2026 01:59:43","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 01/05/2026 12:00\n- REMARK  : i'll you upfrontly within 2/3 days if required","nx":"01/05/2026 12:00:00"},{"r":"MK-WK-RGX-BAN-TA-2299","n":"RAZIYA GHETA","p":"9702416635","c":"TEHREEM ANSARI","f":2,"pl":"01/05/2026 11:00:00","a":"14/05/2026 02:30:47","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"currently no requirement","nx":""},{"r":"MK-WK-RAM-BAN-TA-2304","n":"RUBINA ADIL MEMON","p":"9036299596","c":"TEHREEM ANSARI","f":1,"pl":"25/04/2026 00:00:00","a":"29/04/2026 02:01:13","s":"ALREADY PURCHASED FROM MK JEWELS","m":"already purchased","nx":""},{"r":"MK-WK-NGX-BAN-SM-2306","n":"NEETU GYANANI","p":"9869478517","c":"SRAVANI MAHARANA","f":1,"pl":"25/04/2026 00:00:00","a":"02/06/2026 04:44:48","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"husband thinks making is high so they have no requirement rn","nx":""},{"r":"MK-WK-RJX-ZBX-NA-2307","n":"RAKESH JAIN","p":"7021975728","c":"PRATIKSHA GOHIL","f":1,"pl":"08/05/2026 00:00:00","a":"13/05/2026 05:15:34","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer hai na vah Virar se aate Hain last time bhi Aaye The tabhi unhone purchase kiya tha but is time hai na unko market mein unka old gold ka price humko kam aaya isliye unhone nahin bola ki bhai gol gol ka humko amount kam a raha hai kyunki ham log always exchange mein Hi lete Hain to apne pass to unko dikhana nahin tha unhone market mein Hi dikhaya tha jab bhi Aaye The tabhi to Abhi unko Maine call kiya na to bole madam Abhi to kuchh Hai nahin दो-तीन mahine ke bad wapas visit karenge tabhi dekhenge unhone aise bola mujhe call mat kiya karo office mein rahata hun iske liye","nx":""},{"r":"MK-WK-DMC-BAN-TA-2308","n":"DR. MADHURI CHELANI","p":"9881186925","c":"TEHREEM ANSARI","f":1,"pl":"26/04/2026 00:00:00","a":"29/04/2026 02:23:10","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-SRX-BAN-SV-2276","n":"SIMRAN RAWAL","p":"8169507190","c":"SHRUTI VORA","f":1,"pl":"24/04/2026 00:00:00","a":"03/05/2026 23:53:11","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"came for survey - close","nx":""},{"r":"MK-WK-RUM-BAN-SM-2278","n":"RUMANA","p":"0:00:00","c":"SRAVANI MAHARANA","f":1,"pl":"24/04/2026 00:00:00","a":"14/05/2026 03:10:08","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"we dont have her number","nx":""},{"r":"MK-WK-SBX-BAN-SM-2279","n":"SHALINI BUCH","p":"9820107212","c":"SRAVANI MAHARANA","f":1,"pl":"24/04/2026 00:00:00","a":"14/05/2026 03:12:22","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she dont want to see any desings rn","nx":""},{"r":"MK-WK-MAX-BAN-SM-2280","n":"MEENU AGARWAL","p":"9920676222","c":"SRAVANI MAHARANA","f":1,"pl":"24/04/2026 00:00:00","a":"14/05/2026 03:14:53","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"her daughter dont have requirement for gold rn","nx":""},{"r":"MK-WK-KAS-BAN-SV-2282","n":"KASHISH","p":"9920695556","c":"SHRUTI VORA","f":1,"pl":"24/04/2026 00:00:00","a":"03/05/2026 23:55:20","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 25/05/2026 11:00\n- REMARK  : her nani is unwell so cant visit now","nx":"25/05/2026 11:00:00"},{"r":"MK-WK-KAS-BAN-SV-2282","n":"KASHISH","p":"9920695556","c":"SHRUTI VORA","f":2,"pl":"24/05/2026 11:00:00","a":"13/05/2026 05:05:32","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 31/05/2026 11:00\n- REMARK  : archana maam in talk with her","nx":"31/05/2026 11:00"},{"r":"MK-WK-KAS-BAN-SV-2282","n":"KASHISH","p":"9920695556","c":"SHRUTI VORA","f":3,"pl":"30/05/2026 11:00:00","a":"01/06/2026 00:30:48","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 30/06/2026 11:00\n- REMARK  : FOLLOWUP AS CURRENTLY HER MOM IS UNWELL","nx":"30/06/2026 11:00"},{"r":"MK-WK-SNK-BAN-SV-2286","n":"SARA NISAR KHAN","p":"9769104105","c":"SHRUTI VORA","f":1,"pl":"24/04/2026 00:00:00","a":"13/05/2026 05:35:48","s":"ALREADY PURCHASED FROM MK JEWELS","m":"pur from mk","nx":""},{"r":"MK-WK-SBX-AND-NA-2255","n":"SARALA BAJURIA","p":"9769558155","c":"VIKAS GAUTAM","f":1,"pl":"30/04/2026 00:00:00","a":"14/05/2026 03:54:08","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 26/05/2026 12:30\n- REMARK  : She is out of town","nx":"26/05/2026 12:30:00"},{"r":"MK-WK-SBX-AND-NA-2255","n":"SARALA BAJURIA","p":"9769558155","c":"NA","f":2,"pl":"25/05/2026 11:00:00","a":"02/06/2026 03:58:26","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NOT INTERESTED","nx":""},{"r":"MK-WK-MAC-ZBX-NA-2256","n":"MEHER  AMIT CHUGRIA","p":"9689163549","c":"PRATIKSHA GOHIL","f":1,"pl":"22/04/2026 00:00:00","a":"24/04/2026 03:38:24","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Customer ko call kiya tha aur Bandra mein bhi baat ho gai hai customer Ne Bandra se purchase kar diya hai. Same day.","nx":""},{"r":"MK-WK-NMX-BAN-TA-2258","n":"NISHI MOTWANI","p":"9833660997","c":"TEHREEM ANSARI","f":1,"pl":"25/04/2026 00:00:00","a":"29/04/2026 02:07:34","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she want specific desing in ready piece only","nx":""},{"r":"MK-WK-ACX-BAN-SV-2263","n":"ANKITA CHOPRA","p":"9638941754","c":"SHRUTI VORA","f":1,"pl":"23/04/2026 00:00:00","a":"31/05/2026 23:57:53","s":"ALREADY PURCHASED FROM MK JEWELS","m":"PUR FROM MK AHMEDABAD- CONFIRMED BY RIYA","nx":""},{"r":"MK-WK-SCX-BAN-SV-2265","n":"SIMRAN CHADHA","p":"8779500330","c":"SHRUTI VORA","f":1,"pl":"23/04/2026 00:00:00","a":"26/05/2026 07:10:06","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"followed up multiple time but no response","nx":""},{"r":"MK-WK-AHX-BAN-SV-2267","n":"ANUSHKA HARLARKA","p":"8638175368","c":"SHRUTI VORA","f":1,"pl":"23/04/2026 00:00:00","a":"13/05/2026 05:38:02","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 31/05/2026 11:00\n- REMARK  : followup","nx":"31/05/2026 11:00:00"},{"r":"MK-WK-AHX-BAN-SV-2267","n":"ANUSHKA HARLARKA","p":"8638175368","c":"SHRUTI VORA","f":2,"pl":"30/05/2026 11:00:00","a":"26/05/2026 07:09:03","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 01/06/2026 11:00\n- REMARK  : already in talk with riya on whatsapp","nx":"01/06/2026 11:00"},{"r":"MK-WK-AHX-BAN-SV-2267","n":"ANUSHKA HARLARKA","p":"8638175368","c":"SHRUTI VORA","f":3,"pl":"31/05/2026 11:00:00","a":"01/06/2026 00:26:03","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 30/06/2026 11:00\n- REMARK  : ONGOING INQURY WITH RIYA","nx":"30/06/2026 11:00"},{"r":"MK-WK-ZSX-BAN-SV-2268","n":"ZAINAB SAYED","p":"9870462462","c":"SHRUTI VORA","f":1,"pl":"24/04/2026 00:00:00","a":"13/05/2026 05:37:00","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no req for now","nx":""},{"r":"MK-WK-JKX-AND-NA-2269","n":"JAYA KELWANI","p":"8828089556","c":"POOJA SHIGWAN","f":1,"pl":"23/04/2026 00:00:00","a":"29/04/2026 04:16:54","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 04/05/2026 12:00\n- REMARK  : Maam 4 ke bad ayenge store","nx":"04/05/2026 12:00:00"},{"r":"MK-WK-JKX-AND-NA-2269","n":"JAYA KELWANI","p":"8828089556","c":"NA","f":2,"pl":"03/05/2026 11:00:00","a":"15/05/2026 04:20:35","s":"ALREADY PURCHASED FROM MK JEWELS","m":"ALREADY PURCHASED","nx":""},{"r":"MK-WK-NKX-AND-NA-2271","n":"NEETU KARIA","p":"9322005948","c":"POOJA SHIGWAN","f":1,"pl":"23/04/2026 00:00:00","a":"15/05/2026 04:23:44","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 22/05/2026 14:30\n- REMARK  : na","nx":"22/05/2026 14:30:00"},{"r":"MK-WK-NKX-AND-NA-2271","n":"NEETU KARIA","p":"9322005948","c":"NA","f":2,"pl":"21/05/2026 11:00:00","a":"02/06/2026 03:45:43","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Priceing issue","nx":""},{"r":"MK-WK-PKX-AND-NA-2272","n":"POOJA KUMAR","p":"9820435904","c":"VIKAS GAUTAM","f":1,"pl":"23/04/2026 00:00:00","a":"18/05/2026 05:30:32","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"cut the call in between","nx":""},{"r":"MK-WK-RNX-AND-NA-2274","n":"RAJANI NARDARGIKAR","p":"9821254573","c":"POOJA SHIGWAN","f":1,"pl":"23/04/2026 00:00:00","a":"29/04/2026 04:20:48","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 07/05/2026 12:00\n- REMARK  : Inka order chalu hai jab ready hoga tab inko call karna hai","nx":"07/05/2026 12:00:00"},{"r":"MK-WK-RNX-AND-NA-2274","n":"RAJANI NARDARGIKAR","p":"9821254573","c":"NA","f":2,"pl":"06/05/2026 11:00:00","a":"15/05/2026 04:20:54","s":"ALREADY PURCHASED FROM MK JEWELS","m":"ALREADY PURCHASED","nx":""},{"r":"MK-WK-MAX-AND-NA-2235","n":"MONA AGARWAL","p":"9869226968","c":"BHOOMI BHAGAT","f":1,"pl":"24/04/2026 00:00:00","a":"21/04/2026 03:43:25","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"I have given price they have image photo as per same to want chain","nx":""},{"r":"MK-WK-RSX-BAN-SV-2240","n":"RESHMA SEQUEIRA","p":"9833698876","c":"SHRUTI VORA","f":1,"pl":"23/04/2026 00:00:00","a":"22/04/2026 23:22:36","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 26/04/2026 11:00\n- REMARK  : followup","nx":"26/04/2026 11:00:00"},{"r":"MK-WK-RSX-BAN-SV-2240","n":"RESHMA SEQUEIRA","p":"9833698876","c":"SHRUTI VORA","f":2,"pl":"25/04/2026 11:00:00","a":"27/05/2026 00:55:03","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Deepa maam said she will visit whenever she has requirement so close for now","nx":""},{"r":"MK-WK-RCX-BAN-SM-2243","n":"RAMESH CHAWLA","p":"9422426480","c":"SRAVANI MAHARANA","f":1,"pl":"22/04/2026 00:00:00","a":"14/05/2026 03:09:17","s":"ALREADY PURCHASED FROM MK JEWELS","m":"they gave order for chain from here","nx":""},{"r":"MK-WK-RNX-AND-NA-2253","n":"RAJANI NARDARGIKAR","p":"9821254573","c":"POOJA SHIGWAN","f":1,"pl":"22/04/2026 00:00:00","a":"15/05/2026 04:22:25","s":"ALREADY PURCHASED FROM MK JEWELS","m":"ALREADY PURCHASED","nx":""},{"r":"MK-WK-NKX-AND-NA-2254","n":"NEETU KARIA","p":"9322005948","c":"POOJA SHIGWAN","f":1,"pl":"22/04/2026 00:00:00","a":"15/05/2026 04:18:50","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 29/05/2026 02:00\n- REMARK  : na","nx":"29/05/2026 02:00:00"},{"r":"MK-WK-NKX-AND-NA-2254","n":"NEETU KARIA","p":"9322005948","c":"NA","f":2,"pl":"28/05/2026 11:00:00","a":"02/06/2026 03:49:00","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"PRICING ISSUE","nx":""},{"r":"MK-WK-JKX-BAN-TK-2207","n":"JAYA KELWANI","p":"8828089556","c":"TANYA KEDARE","f":1,"pl":"22/04/2026 00:00:00","a":"15/05/2026 00:39:03","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 16/05/2026 12:00\n- REMARK  : customer said she will visit andheri branch","nx":"16/05/2026 12:00:00"},{"r":"MK-WK-JKX-BAN-TK-2207","n":"JAYA KELWANI","p":"8828089556","c":"TANYA KEDARE","f":2,"pl":"16/05/2026 11:00:00","a":"15/05/2026 06:15:20","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 18/05/2026 12:00\n- REMARK  : she will visit andheri branch","nx":"18/05/2026 12:00"},{"r":"MK-WK-JKX-BAN-TK-2207","n":"JAYA KELWANI","p":"8828089556","c":"TANYA KEDARE","f":3,"pl":"18/05/2026 11:00:00","a":"18/05/2026 01:08:52","s":"ALREADY PURCHASED FROM MK JEWELS","m":"SHE PURCHASED FROM MK LOKHANDWALA STORE AND MOVED OUT OF COUNTRY","nx":""},{"r":"MK-WK-SSX-BAN-TK-2211","n":"SAYA SHAH","p":"9820066388","c":"TANYA KEDARE","f":1,"pl":"21/04/2026 00:00:00","a":"19/05/2026 00:32:50","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement [ their engagement is done now ]","nx":""},{"r":"MK-WK-TKX-BAN-TK-2215","n":"TIA KOTHARI","p":"8310186354","c":"TANYA KEDARE","f":1,"pl":"21/04/2026 00:00:00","a":"19/05/2026 00:33:37","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 30/05/2026 20:00\n- REMARK  : kush said no followup","nx":"30/05/2026 20:00:00"},{"r":"MK-WK-TKX-BAN-TK-2215","n":"TIA KOTHARI","p":"8310186354","c":"TANYA KEDARE","f":2,"pl":"29/05/2026 11:00:00","a":"02/06/2026 05:23:18","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 02/06/2026 20:00\n- REMARK  : coming today","nx":"02/06/2026 20:00"},{"r":"MK-WK-RLX-BAN-TK-2217","n":"RUCHITA LADH","p":"9883889111","c":"TANYA KEDARE","f":1,"pl":"22/04/2026 00:00:00","a":"01/05/2026 01:09:25","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"No requirement","nx":""},{"r":"MK-WK-SSX-BAN-SM-2225","n":"SHOBHANA S","p":"9137408673","c":"SRAVANI MAHARANA","f":1,"pl":"21/04/2026 00:00:00","a":"14/05/2026 02:58:49","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"they purchased from gehna","nx":""},{"r":"MK-WK-KNX-BAN-SM-2227","n":"KARISHMA NICHLANI","p":"8764118505","c":"SRAVANI MAHARANA","f":1,"pl":"21/04/2026 00:00:00","a":"22/05/2026 03:02:56","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she said rn they dont have any requirement whenever they need anything theyll visit the store","nx":""},{"r":"MK-WK-SSX-BAN-SM-2178","n":"SHEWTA SUDAN","p":"9920441167","c":"SRAVANI MAHARANA","f":1,"pl":"20/04/2026 00:00:00","a":"20/04/2026 00:56:14","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"THERE REQUIREMENT IS NOT AVALABLE IN OUR STORE","nx":""},{"r":"MK-WK-MMX-BAN-SM-2184","n":"MEGHNA MEHTA","p":"9820295479","c":"SRAVANI MAHARANA","f":1,"pl":"20/04/2026 00:00:00","a":"20/04/2026 00:58:16","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"SHE HAS NO REQUIREMENT RN BECAUSE SHE WANTED READY PICE","nx":""},{"r":"MK-WK-ROS-BAN-TK-2190","n":"ROSHNI","p":"7021619379","c":"TANYA KEDARE","f":1,"pl":"23/04/2026 00:00:00","a":"15/05/2026 06:22:49","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-BRX-BAN-TA-2191","n":"BHARAT ROHERA","p":"9819823273","c":"TEHREEM ANSARI","f":1,"pl":"20/04/2026 00:00:00","a":"14/05/2026 02:47:23","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-SKX-BAN-TA-2192","n":"SEJAL KANAKIA","p":"8920234609","c":"TEHREEM ANSARI","f":1,"pl":"21/04/2026 00:00:00","a":"22/04/2026 02:24:06","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased","nx":""},{"r":"MK-WK-SCX-BAN-TK-2194","n":"SIDDHARTH CHANDAN","p":"9769019754","c":"TANYA KEDARE","f":1,"pl":"20/04/2026 00:00:00","a":"19/04/2026 23:48:33","s":"ALREADY PURCHASED FROM MK JEWELS","m":"ORDER PLACED IN MK JEWELS","nx":""},{"r":"MK-WK-TDX-BAN-SM-2196","n":"TARACHAND DHOLKHERI","p":"9322519569","c":"SRAVANI MAHARANA","f":1,"pl":"20/04/2026 00:00:00","a":"20/04/2026 00:54:25","s":"ALREADY PURCHASED FROM MK JEWELS","m":"THEY PURCHASED TODAY IT SELF FROM DEEPA MAAM","nx":""},{"r":"MK-WK-LRX-AND-NA-2203","n":"LUCKY ROHIRA","p":"9870388000","c":"BHOOMI BHAGAT","f":1,"pl":"20/04/2026 00:00:00","a":"07/05/2026 21:39:21","s":"SWITCHED OFF","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-ASX-AND-NA-2208","n":"ANU SHARMA","p":"8451893417","c":"BHOOMI BHAGAT","f":1,"pl":"24/04/2026 00:00:00","a":"15/05/2026 03:35:59","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 29/05/2026 13:30\n- REMARK  : as of now out of station , will visit store once back","nx":"29/05/2026 13:30:00"},{"r":"MK-WK-RNX-AND-NA-2232","n":"RAJANI NANDARGIKAR","p":"9821254573","c":"POOJA SHIGWAN","f":1,"pl":"21/04/2026 00:00:00","a":"15/05/2026 04:14:59","s":"ALREADY PURCHASED FROM MK JEWELS","m":"ALREADY PURCHASED","nx":""},{"r":"MK-WK-MRX-AND-NA-2236","n":"MANISHA RAHUL TIWARI","p":"9819810961","c":"POOJA SHIGWAN","f":1,"pl":"21/04/2026 00:00:00","a":"21/04/2026 03:45:50","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 22/04/2026 06:06\n- REMARK  : Maam ke sath bat chal rahi hai ma'am batayenge kal parso tak","nx":"22/04/2026 06:06:00"},{"r":"MK-WK-MRX-AND-NA-2236","n":"MANISHA RAHUL TIWARI","p":"9819810961","c":"NA","f":2,"pl":"22/04/2026 11:00:00","a":"25/04/2026 00:10:21","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Maam ke sath msg me bat ho rahi hai ma'am ne jo making bola hai usme bhi ha bola maine neha ko puchke unko roj msg karti hu abhitak order confirm nhi kiya hai ma'am ne","nx":""},{"r":"MK-WK-RGX-AND-NA-2238","n":"RAZIA GHETA","p":"9702416635","c":"POOJA SHIGWAN","f":1,"pl":"21/04/2026 00:00:00","a":"21/04/2026 03:50:25","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"Yes","nx":"21/04/2026 06:00:00"},{"r":"MK-WK-RGX-AND-NA-2238","n":"RAZIA GHETA","p":"9702416635","c":"NA","f":2,"pl":"21/04/2026 11:00:00","a":"02/06/2026 03:47:02","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"bahot bar call kiya vo nhi aye kahi aur se liya unhone","nx":""},{"r":"MK-WK-NCX-BAN-TA-2154","n":"NEHA CHANDWANI","p":"9321306030","c":"TEHREEM ANSARI","f":1,"pl":"20/04/2026 00:00:00","a":"29/04/2026 02:12:40","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-MJX-BAN-SV-2165","n":"MANISH JAIN","p":"9167363309","c":"SHRUTI VORA","f":1,"pl":"19/04/2026 00:00:00","a":"13/05/2026 05:39:15","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-USH-BAN-TK-2168","n":"USHA","p":"9769422907","c":"TANYA KEDARE","f":1,"pl":"19/04/2026 00:00:00","a":"18/04/2026 23:36:49","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 21/04/2026 01:00\n- REMARK  : SHE SAID THAT SEND ME THE PRICE AND QUATATION AGAIN , I WILL LET YOU KNOW","nx":"21/04/2026 01:00:00"},{"r":"MK-WK-USH-BAN-TK-2168","n":"USHA","p":"9769422907","c":"TANYA KEDARE","f":2,"pl":"21/04/2026 11:00:00","a":"01/05/2026 02:32:21","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Hi Tanya ! \nI’ll surely come in soon. I’ll call you when I’m coming.\nThank you for reaching out","nx":""},{"r":"MK-WK-BNX-BAN-TA-2169","n":"BARIRA NAKWAAH","p":"9076299786","c":"TEHREEM ANSARI","f":1,"pl":"20/04/2026 00:00:00","a":"29/04/2026 02:40:02","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"out of town no requirement","nx":""},{"r":"MK-WK-FSX-BAN-SM-2171","n":"FIRDAUS SAYED","p":"9821638354","c":"SRAVANI MAHARANA","f":1,"pl":"19/04/2026 00:00:00","a":"20/04/2026 00:58:59","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"THEY ARE IN DUBAI NOW","nx":""},{"r":"MK-WK-JSX-BAN-SM-2176","n":"JAVED SHAIK","p":"9768262284","c":"SRAVANI MAHARANA","f":1,"pl":"19/04/2026 00:00:00","a":"20/04/2026 01:01:23","s":"ALREADY PURCHASED FROM MK JEWELS","m":"THEY TOLD THEY ALREADY GAVE THE ORDER","nx":""},{"r":"MK-WK-PMX-ZBX-NA-2231","n":"PRIYA MAHESHWARI","p":"8693869290","c":"PRATIKSHA GOHIL","f":1,"pl":"23/04/2026 00:00:00","a":"02/06/2026 03:30:01","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-PKX-BAN-TA-2142","n":"POONAM KOHLI","p":"9323315606","c":"TEHREEM ANSARI","f":1,"pl":"19/04/2026 00:00:00","a":"18/04/2026 07:27:24","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 19/04/2026 02:00\n- REMARK  : WILL VISIT ON SUNDAY","nx":"19/04/2026 02:00:00"},{"r":"MK-WK-PKX-BAN-TA-2142","n":"POONAM KOHLI","p":"9323315606","c":"TEHREEM ANSARI","f":2,"pl":"19/04/2026 11:00:00","a":"29/04/2026 02:09:19","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-DRX-AND-NA-2143","n":"DHEERAJ RAJANI","p":"9766027410","c":"POOJA SHIGWAN","f":1,"pl":"17/05/2026 00:00:00","a":"21/04/2026 03:43:31","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Sir maam bandra store visit karenge sir yaha andheri aye the to just andar aye the shop dekhane","nx":""},{"r":"MK-WK-SNX-BAN-TK-2145","n":"SNEHA NANDRAJU","p":"7700033169","c":"TANYA KEDARE","f":1,"pl":"20/04/2026 00:00:00","a":"20/04/2026 01:30:02","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"[CLOSE] BCZ SHE IS ASKING FOR 200 RUPEES MAKING WHICH IS NOT POSSIBLE","nx":""},{"r":"MK-WK-RVX-AND-NA-2146","n":"RANJANA VATKAR","p":"9821217915","c":"BHOOMI BHAGAT","f":1,"pl":"21/04/2026 00:00:00","a":"07/05/2026 21:36:57","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-SUX-BAN-TK-2147","n":"SOUMYA UPADHYAY","p":"8742028092","c":"TANYA KEDARE","f":1,"pl":"20/04/2026 00:00:00","a":"02/06/2026 05:23:35","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-NMX-BAN-TK-2148","n":"NUTAN MEHTA","p":"8452804609","c":"TANYA KEDARE","f":1,"pl":"21/04/2026 00:00:00","a":"20/04/2026 01:26:48","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 22/04/2026 12:00\n- REMARK  : SHE SAID I WILL LET YOU IN SOMETIME BCZ MY DAUGHTER IS NOT HERE RIGHT NOW I WILL ASK HER","nx":"22/04/2026 12:00:00"},{"r":"MK-WK-NMX-BAN-TK-2148","n":"NUTAN MEHTA","p":"8452804609","c":"TANYA KEDARE","f":2,"pl":"22/04/2026 11:00:00","a":"15/05/2026 06:24:10","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement at the moment","nx":""},{"r":"MK-WK-ASX-AND-NA-2149","n":"ANKUR SHARMA","p":"7715877967","c":"POOJA SHIGWAN","f":1,"pl":"18/04/2026 00:00:00","a":"03/06/2026 03:02:10","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NOT INTERESTED","nx":""},{"r":"MK-WK-AFX-BAN-TA-2152","n":"ARSHIA FAJANDAR","p":"9076090786","c":"TEHREEM ANSARI","f":1,"pl":"19/04/2026 00:00:00","a":"22/04/2026 02:31:10","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"na","nx":"29/04/2026 02:00:00"},{"r":"MK-WK-AFX-BAN-TA-2152","n":"ARSHIA FAJANDAR","p":"9076090786","c":"TEHREEM ANSARI","f":2,"pl":"28/04/2026 11:00:00","a":"29/04/2026 01:43:19","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"not interested","nx":""},{"r":"MK-WK-MMX-BAN-TA-2125","n":"MAMTA MAKAD","p":"9699959968","c":"TEHREEM ANSARI","f":1,"pl":"18/04/2026 00:00:00","a":"22/04/2026 02:38:23","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"On the follow-up call, the customer informed us that she has changed her mind and currently does not wish to proceed with the purchase. She also mentioned that she is out of town at the moment.","nx":""},{"r":"MK-WK-DDX-BAN-TA-2127","n":"DEEPIKA DHAMEJA","p":"9870212124","c":"TEHREEM ANSARI","f":1,"pl":"17/04/2026 00:00:00","a":"14/05/2026 02:48:42","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-APX-BAN-SV-2130","n":"ASFIYA PASHA","p":"9844076000","c":"SHRUTI VORA","f":1,"pl":"18/04/2026 00:00:00","a":"13/05/2026 05:43:18","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"purchased from other store","nx":""},{"r":"MK-WK-APX-AND-NA-2131","n":"ARCHANA PIMPLE","p":"9322268588","c":"RIYA MAHATO","f":1,"pl":"18/04/2026 00:00:00","a":"18/05/2026 04:32:04","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Not Interested","nx":""},{"r":"MK-WK-RSX-BAN-TA-2133","n":"RIYANA SHAIKH","p":"9820012149","c":"TEHREEM ANSARI","f":1,"pl":"16/04/2026 00:00:00","a":"22/04/2026 02:44:26","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased from mk","nx":""},{"r":"MK-WK-SBX-AND-NA-2139","n":"SARITA BABEL","p":"7738612343","c":"BHOOMI BHAGAT","f":1,"pl":"18/04/2026 00:00:00","a":"21/04/2026 04:05:42","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : NO (CLIENT NOT USING WHATSAPP)","nx":""},{"r":"MK-WK-SKX-BAN-SM-2104","n":"SIMRAN KARIRA","p":"8669900000","c":"SRAVANI MAHARANA","f":1,"pl":"16/04/2026 00:00:00","a":"20/04/2026 01:05:01","s":"ALREADY PURCHASED FROM MK JEWELS","m":"THEY PLACED ORDER FOR THE SELECTED SET","nx":""},{"r":"MK-WK-MTX-BAN-SM-2105","n":"MANISHA TEWARY","p":"9819810961","c":"SRAVANI MAHARANA","f":1,"pl":"16/04/2026 00:00:00","a":"20/04/2026 01:03:57","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"SHE SAID I FOND MAKING CHARGES  HIGH WHATS WHY I DIDN'T PURCHASE","nx":""},{"r":"MK-WK-DJX-BAN-SM-2112","n":"DIVYA JAIN","p":"9899109097","c":"SRAVANI MAHARANA","f":1,"pl":"16/04/2026 00:00:00","a":"23/04/2026 01:59:18","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"She said she has no requirement rn","nx":""},{"r":"MK-WK-RLX-BAN-TA-2114","n":"RENU LAMBA","p":"9920352065","c":"TEHREEM ANSARI","f":1,"pl":"17/04/2026 00:00:00","a":"14/05/2026 02:48:09","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-DIL-BAN-TA-2115","n":"DILSHAAD","p":"9820877863","c":"TEHREEM ANSARI","f":1,"pl":"16/04/2026 00:00:00","a":"16/04/2026 03:45:54","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"will visit tomorrow","nx":"17/04/2026 04:00:00"},{"r":"MK-WK-DIL-BAN-TA-2115","n":"DILSHAAD","p":"9820877863","c":"TEHREEM ANSARI","f":2,"pl":"17/04/2026 11:00:00","a":"22/04/2026 02:42:59","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they are out of town no requirement","nx":""},{"r":"MK-WK-SAN-BAN-SV-2116","n":"SANDHYAR","p":"8652502500","c":"SHRUTI VORA","f":1,"pl":"17/04/2026 00:00:00","a":"22/04/2026 23:23:08","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased from Ahmedabad store","nx":""},{"r":"MK-WK-SCX-BAN-SV-2117","n":"SANDHYA CHAWLA","p":"8652502500","c":"SHRUTI VORA","f":1,"pl":"17/04/2026 00:00:00","a":"13/05/2026 05:45:49","s":"ALREADY PURCHASED FROM MK JEWELS","m":"pur from Ahmedabad store","nx":""},{"r":"MK-WK-BVX-BAN-TA-2120","n":"BHAVISHA VASHI","p":"8080817817","c":"TEHREEM ANSARI","f":1,"pl":"16/04/2026 00:00:00","a":"15/05/2026 03:13:46","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-PJX-AND-NA-2136","n":"POOJA JAWAR","p":"9820221681","c":"BHOOMI BHAGAT","f":1,"pl":"18/04/2026 00:00:00","a":"21/04/2026 04:08:34","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"We don't have pendent set polki delicate they want ready peace","nx":""},{"r":"MK-WK-GKK-AND-NA-2138","n":"GOBIND K KUKREJA","p":"9702274583","c":"BHOOMI BHAGAT","f":1,"pl":"20/04/2026 00:00:00","a":"07/05/2026 21:38:17","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : NO (CLIENT NOT USING WHATSAPP)","nx":""},{"r":"MK-WK-VKX-AND-NA-2096","n":"VANEERA KATARIA","p":"9820167741","c":"BHOOMI BHAGAT","f":1,"pl":"16/04/2026 00:00:00","a":"07/05/2026 21:40:43","s":"ALREADY PURCHASED FROM MK JEWELS","m":"No","nx":""},{"r":"MK-WK-RJX-BAN-SV-2090","n":"RADHA JOSHI","p":"8369425456","c":"SHRUTI VORA","f":1,"pl":"15/04/2026 00:00:00","a":"16/04/2026 01:24:55","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 16/04/2026 07:00\n- REMARK  : Visiting today","nx":"16/04/2026 07:00:00"},{"r":"MK-WK-RJX-BAN-SV-2090","n":"RADHA JOSHI","p":"8369425456","c":"SHRUTI VORA","f":2,"pl":"16/04/2026 11:00:00","a":"04/05/2026 00:01:02","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"was looking for gifting - close","nx":""},{"r":"MK-WK-RAX-BAN-SV-2089","n":"RITU AGRAWAL","p":"9032827329","c":"SHRUTI VORA","f":1,"pl":"15/04/2026 00:00:00","a":"16/04/2026 01:21:56","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 17/04/2026 11:00\n- REMARK  : Pricing given by archana maam","nx":"17/04/2026 11:00:00"},{"r":"MK-WK-RAX-BAN-SV-2089","n":"RITU AGRAWAL","p":"9032827329","c":"SHRUTI VORA","f":2,"pl":"17/04/2026 11:00:00","a":"13/05/2026 05:45:18","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no req fro now will visit in future","nx":""},{"r":"MK-WK-ZMX-BAN-TA-2085","n":"ZAKIRA MEMON","p":"9920693807","c":"TEHREEM ANSARI","f":1,"pl":"19/04/2026 00:00:00","a":"01/06/2026 02:59:57","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-DJX-BAN-TA-2088","n":"DR. JANHVI","p":"9833093522","c":"TEHREEM ANSARI","f":1,"pl":"15/04/2026 00:00:00","a":"22/04/2026 02:45:36","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 28/04/2026 12:00\n- REMARK  : she is not free will visit once she get a time","nx":"28/04/2026 12:00:00"},{"r":"MK-WK-DJX-BAN-TA-2088","n":"DR. JANHVI","p":"9833093522","c":"TEHREEM ANSARI","f":2,"pl":"27/04/2026 11:00:00","a":"29/04/2026 05:29:10","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement have changed her mind","nx":""},{"r":"MK-WK-RLX-BAN-SV-2077","n":"RENU LAMBA","p":"9920352065","c":"SHRUTI VORA","f":1,"pl":"15/04/2026 00:00:00","a":"16/04/2026 01:20:51","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 18/04/2026 11:00\n- REMARK  : Customer visited yesterday again will visit after few days to finalize","nx":"18/04/2026 11:00:00"},{"r":"MK-WK-RLX-BAN-SV-2077","n":"RENU LAMBA","p":"9920352065","c":"SHRUTI VORA","f":2,"pl":"18/04/2026 11:00:00","a":"13/05/2026 05:41:37","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no req for now will visit in future when needed - deepa maam","nx":""},{"r":"MK-WK-MEE-BAN-SV-2075","n":"MEENU","p":"9920884035","c":"SHRUTI VORA","f":1,"pl":"15/04/2026 00:00:00","a":"16/04/2026 01:16:50","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 23/04/2026 11:00\n- REMARK  : Will visit andheri store wants to see more design","nx":"23/04/2026 11:00:00"},{"r":"MK-WK-MEE-BAN-SV-2075","n":"MEENU","p":"9920884035","c":"SHRUTI VORA","f":2,"pl":"22/04/2026 11:00:00","a":"13/05/2026 05:38:45","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement for now","nx":""},{"r":"MK-WK-RAS-BAN-TK-2074","n":"RASHI","p":"8082247334","c":"TANYA KEDARE","f":1,"pl":"20/04/2026 00:00:00","a":"15/04/2026 01:54:40","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"client want 500 rupees making charges as its impossible [ close]","nx":""},{"r":"MK-WK-APX-AND-NA-2083","n":"ARCHANA PIMPLE","p":"9322268588","c":"POOJA SHIGWAN","f":1,"pl":"14/04/2026 00:00:00","a":"15/05/2026 04:15:25","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-TAX-BAN-TK-2072","n":"TARIKH AHMED","p":"7977598114","c":"TANYA KEDARE","f":1,"pl":"20/04/2026 00:00:00","a":"20/04/2026 01:30:46","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-RRX-BAN-TK-2071","n":"RUSHALI RANE","p":"9819059194","c":"TANYA KEDARE","f":1,"pl":"20/04/2026 00:00:00","a":"20/04/2026 01:28:41","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"SHE SAID SHE IS DROPPING THE IDEA","nx":""},{"r":"MK-WK-HPX-ZBX-NA-2067","n":"HUMA PATCA","p":"9321516013","c":"PRATIKSHA GOHIL","f":1,"pl":"13/04/2026 00:00:00","a":"18/05/2026 23:24:20","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer ne bola hai app mujhe call karke inform kijiye mujhe requirement rahega to main visit kar lungi theek hai aur call cut Kar Diya","nx":""},{"r":"MK-WK-AMK-BAN-TK-2065","n":"ANAGHA MANDAR KOLI","p":"9769481681","c":"TANYA KEDARE","f":1,"pl":"15/04/2026 00:00:00","a":"15/04/2026 02:00:47","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she want 500-600 making charges , if we r giving them then she will come","nx":""},{"r":"MK-WK-KDX-ZBX-NA-2066","n":"KRISHNA DOGRA","p":"9137183398","c":"PRATIKSHA GOHIL","f":1,"pl":"17/04/2026 00:00:00","a":"21/04/2026 03:18:33","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 28/04/2026 05:30\n- REMARK  : Abhi ham log ko time Mila nahin Hai Jaise time milega vaise visit karenge","nx":"28/04/2026 05:30:00"},{"r":"MK-WK-KDX-ZBX-NA-2066","n":"KRISHNA DOGRA","p":"9137183398","c":"NA","f":2,"pl":"27/04/2026 11:00:00","a":"29/04/2026 02:31:11","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Yes ma'am I purchased from your bandra store","nx":""},{"r":"MK-WK-ISH-BAN-TK-2063","n":"ISHA","p":"9821302208","c":"TANYA KEDARE","f":1,"pl":"13/04/2026 00:00:00","a":"15/04/2026 01:39:40","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased from uss","nx":""},{"r":"MK-WK-SHA-BAN-SM-2046","n":"SHARMILA","p":"8828498183","c":"SRAVANI MAHARANA","f":1,"pl":"13/04/2026 00:00:00","a":"20/04/2026 01:08:24","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"SHE SAID SHE HAD A CHANGE IN PLAN SO SHELL BE COMING BUT NOT NOW","nx":""},{"r":"MK-WK-UNH-BAN-TA-2041","n":"UNHANA","p":"8390002220","c":"TEHREEM ANSARI","f":1,"pl":"13/04/2026 00:00:00","a":"19/05/2026 03:16:31","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"not reverting","nx":""},{"r":"MK-WK-FKX-BAN-TK-2036","n":"FATIMA KUNDA","p":"8767091874","c":"TANYA KEDARE","f":1,"pl":"19/04/2026 00:00:00","a":"20/04/2026 01:32:06","s":"ALREADY PURCHASED FROM MK JEWELS","m":"PRODUCTS DELIVERED TO HOME","nx":""},{"r":"MK-WK-KAM-BAN-SV-2028","n":"KAMNA","p":"9920544179","c":"SHRUTI VORA","f":1,"pl":"18/04/2026 00:00:00","a":"13/05/2026 05:42:40","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"will visit in future if needed","nx":""},{"r":"MK-WK-KSX-BAN-SM-2024","n":"KAJAL SHETH","p":"9324042900","c":"SRAVANI MAHARANA","f":1,"pl":"12/04/2026 00:00:00","a":"20/04/2026 01:11:55","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 21/04/2026 01:00\n- REMARK  : SHE SAID CALL ME TOMMOROW ILL LET YOU KNOW","nx":"21/04/2026 01:00:00"},{"r":"MK-WK-KSX-BAN-SM-2024","n":"KAJAL SHETH","p":"9324042900","c":"SRAVANI MAHARANA","f":2,"pl":"21/04/2026 11:00:00","a":"14/05/2026 03:06:06","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 15/05/2026 12:00\n- REMARK  : she said she is in middel of the meeting","nx":"15/05/2026 12:00"},{"r":"MK-WK-KSX-BAN-SM-2024","n":"KAJAL SHETH","p":"9324042900","c":"SRAVANI MAHARANA","f":3,"pl":"15/05/2026 11:00:00","a":"14/05/2026 04:44:48","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they dont have any requirement now","nx":""},{"r":"MK-WK-KJX-BAN-TK-2023","n":"KAVITA JAVHAR","p":"9820647736","c":"TANYA KEDARE","f":1,"pl":"13/04/2026 00:00:00","a":"15/04/2026 01:38:36","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purcahsed from mk jewels [ clode ]","nx":""},{"r":"MK-WK-AKX-BAN-TA-2021","n":"ANJU KHANDEWALA","p":"9819403756","c":"TEHREEM ANSARI","f":1,"pl":"11/04/2026 00:00:00","a":"22/04/2026 02:59:48","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 26/04/2026 12:00\n- REMARK  : i'll plan to visit soon","nx":"26/04/2026 12:00:00"},{"r":"MK-WK-AKX-BAN-TA-2021","n":"ANJU KHANDEWALA","p":"9819403756","c":"TEHREEM ANSARI","f":2,"pl":"25/04/2026 11:00:00","a":"29/04/2026 01:54:18","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-NRX-BAN-SM-2029","n":"NAFISA ROKADIA","p":"8879845850","c":"SRAVANI MAHARANA","f":1,"pl":"12/04/2026 00:00:00","a":"20/04/2026 01:15:22","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"THEYLL COME WHEN THEY HAVE REQUIREMENT","nx":""},{"r":"MK-WK-HKX-AND-NA-2030","n":"HIT KOTHARI","p":"9167302568","c":"BHOOMI BHAGAT","f":1,"pl":"12/04/2026 00:00:00","a":"21/04/2026 04:10:08","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Not now so he batati hi","nx":""},{"r":"MK-WK-JKX-AND-NA-2015","n":"JAYA KELWANI","p":"8828089556","c":"POOJA SHIGWAN","f":1,"pl":"11/04/2026 00:00:00","a":"21/04/2026 04:03:56","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Yes","nx":""},{"r":"MK-WK-AKX-BAN-TA-2010","n":"ANJU KHANDELWAL","p":"9819403756","c":"TEHREEM ANSARI","f":1,"pl":"30/04/2026 00:00:00","a":"11/04/2026 02:47:16","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"/no longer interested","nx":""},{"r":"MK-WK-LSX-BAN-TK-2005","n":"LALITA SHAH","p":"7039331331","c":"TANYA KEDARE","f":1,"pl":"10/04/2026 00:00:00","a":"15/04/2026 01:57:57","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they didn like any designs and they actually came for timepass [ close]","nx":""},{"r":"MK-WK-MSX-BAN-TA-2004","n":"MANJU SINGAL","p":"9820824497","c":"TEHREEM ANSARI","f":1,"pl":"12/04/2026 00:00:00","a":"22/04/2026 03:02:32","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-SSX-AND-NA-2016","n":"SAKINA SALEH","p":"8433605658","c":"POOJA SHIGWAN","f":1,"pl":"02/06/2026 00:00:00","a":"25/04/2026 00:08:27","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Inko jab lena hai jewellery tab ye bandra store visit karenge","nx":""},{"r":"MK-WK-DWX-BAN-TK-2014","n":"DIYA WADHWANI","p":"506681029","c":"TANYA KEDARE","f":1,"pl":"13/04/2026 00:00:00","a":"15/04/2026 02:37:33","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"already purchased from another jweller","nx":""},{"r":"MK-WK-JKX-BAN-SM-5133","n":"JASMIN KAMRA","p":"9820141883","c":"SRAVANI MAHARANA","f":1,"pl":"10/04/2026 00:00:00","a":"20/04/2026 00:46:39","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"SHE SAID SHE IS NOT INTRESTED SHE PURCHASED FROM ANOTHER JEWELLERY STORE","nx":""},{"r":"MK-WK-AAX-BAN-TA-5134","n":"ANKITA ABHICHANDANI","p":"7869675100","c":"TEHREEM ANSARI","f":1,"pl":"12/04/2026 00:00:00","a":"29/04/2026 02:57:53","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-DGX-BAN-SV-5130","n":"DIKSHA GARILLA","p":"9323304630","c":"SHRUTI VORA","f":1,"pl":"10/04/2026 00:00:00","a":"16/04/2026 00:12:24","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 23/04/2026 11:00\n- REMARK  : Customer will visit after a week will call uma or bharat","nx":"23/04/2026 11:00:00"},{"r":"MK-WK-DGX-BAN-SV-5130","n":"DIKSHA GARILLA","p":"9323304630","c":"SHRUTI VORA","f":2,"pl":"22/04/2026 11:00:00","a":"22/04/2026 23:51:11","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 14/05/2026 11:00\n- REMARK  : customer has went out of station for some work will be back after 10 to 15 days so followup then","nx":"14/05/2026 11:00"},{"r":"MK-WK-DGX-BAN-SV-5130","n":"DIKSHA GARILLA","p":"9323304630","c":"SHRUTI VORA","f":3,"pl":"13/05/2026 11:00:00","a":"13/05/2026 05:08:38","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 31/05/2026 11:00\n- REMARK  : will visit whenever possible","nx":"31/05/2026 11:00"},{"r":"MK-WK-RIS-BAN-TA-5129","n":"RISHIKESH","p":"9850100500","c":"TEHREEM ANSARI","f":1,"pl":"10/04/2026 00:00:00","a":"22/04/2026 02:54:24","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 25/04/2026 12:00\n- REMARK  : she was asleep ask to call later","nx":"25/04/2026 12:00:00"},{"r":"MK-WK-RIS-BAN-TA-5129","n":"RISHIKESH","p":"9850100500","c":"TEHREEM ANSARI","f":2,"pl":"25/04/2026 11:00:00","a":"29/04/2026 01:56:17","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"no requirements","nx":""},{"r":"MK-WK-MAX-BAN-SV-5127","n":"MANISHA AGRAWAL","p":"9558158600","c":"SHRUTI VORA","f":1,"pl":"09/04/2026 00:00:00","a":"16/04/2026 00:06:14","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 17/04/2026 11:00\n- REMARK  : Customer is busy call later","nx":"17/04/2026 11:00:00"},{"r":"MK-WK-MAX-BAN-SV-5127","n":"MANISHA AGRAWAL","p":"9558158600","c":"SHRUTI VORA","f":2,"pl":"17/04/2026 11:00:00","a":"13/05/2026 05:44:18","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"followed up multiple times but not answering - close","nx":""},{"r":"MK-WK-JMX-BAN-SV-5126","n":"JEETU MOTWANI","p":"9422294222","c":"SHRUTI VORA","f":1,"pl":"09/04/2026 00:00:00","a":"13/05/2026 05:46:41","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"followed up multiples times but no repsonse - close","nx":""},{"r":"MK-WK-BHA-BAN-TA-5125","n":"BHAVESHA","p":"85291632644","c":"TEHREEM ANSARI","f":1,"pl":"18/04/2026 00:00:00","a":"27/05/2026 00:45:16","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no response even after several follow ups","nx":""},{"r":"MK-WK-HTX-BAN-SM-5119","n":"HETKI THAKKAR","p":"9833655421","c":"SRAVANI MAHARANA","f":1,"pl":"08/04/2026 00:00:00","a":"11/04/2026 00:18:50","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"They'll come for pickup when there products will be ready","nx":""},{"r":"MK-WK-ISH-BAN-TA-5120","n":"ISHA","p":"9821302208","c":"TEHREEM ANSARI","f":1,"pl":"10/04/2026 00:00:00","a":"22/04/2026 02:52:09","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased from mk","nx":""},{"r":"MK-WK-ANX-BAN-SV-5111","n":"ARCHANA NANDWANI","p":"9822114422","c":"SHRUTI VORA","f":1,"pl":"11/04/2026 00:00:00","a":"27/05/2026 00:56:01","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 10/06/2026 11:00\n- REMARK  : She is in Haridwar cant talk right now - follow up after 15 days","nx":"10/06/2026 11:00:00"},{"r":"MK-WK-PAX-BAN-SV-5110","n":"PRIYA ARORA","p":"9930064882","c":"SHRUTI VORA","f":1,"pl":"08/04/2026 00:00:00","a":"15/04/2026 03:13:33","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer said no need for now - close","nx":""},{"r":"MK-WK-KAT-BAN-TA-5115","n":"KAMINI AMOL TAWARE","p":"9860555679","c":"TEHREEM ANSARI","f":1,"pl":"08/04/2026 00:00:00","a":"11/04/2026 02:53:13","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirementb notb interested","nx":""},{"r":"MK-WK-MNX-BAN-TA-5116","n":"MURLI NEMBHAWANI","p":"9370885000","c":"TEHREEM ANSARI","f":1,"pl":"08/04/2026 00:00:00","a":"08/04/2026 06:40:18","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchase","nx":""},{"r":"MK-WK-RKX-AND-NA-5121","n":"ROSHNI KALWANI","p":"9004611113","c":"RIYA MAHATO","f":1,"pl":"08/04/2026 00:00:00","a":"17/04/2026 06:25:02","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"She want ready pis she does not given order","nx":""},{"r":"MK-WK-HKX-BAN-SM-5107","n":"HARSH KAMDHA","p":"9769238688","c":"SRAVANI MAHARANA","f":1,"pl":"08/04/2026 00:00:00","a":"11/04/2026 00:17:37","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"They have no requirement now","nx":""},{"r":"MK-WK-GRX-BAN-SV-5102","n":"GHANSHYAM RANGANI","p":"9823135552","c":"SHRUTI VORA","f":1,"pl":"07/04/2026 00:00:00","a":"15/04/2026 03:10:28","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer wanted 20grms chain but in heavy look - close","nx":""},{"r":"MK-WK-SDX-BAN-TA-5104","n":"SINA D","p":"7738613170","c":"TEHREEM ANSARI","f":1,"pl":"09/04/2026 00:00:00","a":"28/04/2026 04:43:45","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"not interested","nx":""},{"r":"MK-WK-SKX-BAN-SM-5099","n":"SHAGUFTA KHAN","p":"9892801834","c":"SRAVANI MAHARANA","f":1,"pl":"07/04/2026 00:00:00","a":"15/04/2026 02:25:23","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"As she wanted 20 grams antique necklace set with earrings include in it we don't have It rn so we said as soon it is available we'll contact you","nx":""},{"r":"MK-WK-JAS-BAN-TA-5106","n":"JASMEENA","p":"9879545577","c":"TEHREEM ANSARI","f":1,"pl":"09/04/2026 00:00:00","a":"11/04/2026 02:57:39","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-VCX-AND-NA-5091","n":"VARSHA CHOWDHARY","p":"9920029915","c":"BHOOMI BHAGAT","f":1,"pl":"07/04/2026 00:00:00","a":"21/04/2026 04:13:05","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-KGX-BAN-SV-5089","n":"KINJAL GUPTA","p":"9999999259","c":"SHRUTI VORA","f":1,"pl":"06/04/2026 00:00:00","a":"13/05/2026 05:47:19","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"followed up multiple times by no response - riya","nx":""},{"r":"MK-WK-TSX-BAN-TK-5086","n":"TEJAL SHAH","p":"9619593051","c":"TANYA KEDARE","f":1,"pl":"07/04/2026 00:00:00","a":"01/05/2026 01:05:30","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Already placed and order in mk jewels","nx":""},{"r":"MK-WK-HKX-BAN-TA-5085","n":"HEMA KHANNA","p":"9324548135","c":"TEHREEM ANSARI","f":1,"pl":"09/04/2026 00:00:00","a":"11/04/2026 02:50:27","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 17/04/2026 12:00\n- REMARK  : they had a word with uma and said will visit after a week","nx":"17/04/2026 12:00:00"},{"r":"MK-WK-HKX-BAN-TA-5085","n":"HEMA KHANNA","p":"9324548135","c":"TEHREEM ANSARI","f":2,"pl":"16/04/2026 11:00:00","a":"15/05/2026 03:15:16","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 29/05/2026 12:00\n- REMARK  : Coordinating on whatsapp with uma mam","nx":"29/05/2026 12:00"},{"r":"MK-WK-HKX-BAN-TA-5085","n":"HEMA KHANNA","p":"9324548135","c":"TEHREEM ANSARI","f":3,"pl":"28/05/2026 11:00:00","a":"01/06/2026 03:17:03","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"HAVE DONE MORE THAN 4 FOLLOW UPS BUT NO RESPONSE FROM THERE END","nx":""},{"r":"MK-WK-MBX-BAN-TK-5092","n":"MONALI BHAYANE","p":"9833734449","c":"TANYA KEDARE","f":1,"pl":"08/04/2026 00:00:00","a":"15/04/2026 01:40:45","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased pendent from us","nx":""},{"r":"MK-WK-SHX-AND-NA-5098","n":"SAMIYA HAJURIYA","p":"9820225905","c":"BHOOMI BHAGAT","f":1,"pl":"06/04/2026 00:00:00","a":"21/04/2026 04:16:39","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Client mom out of station so she said not now  I have all stock arrange from bandra as per her requirement but not available","nx":""},{"r":"MK-WK-LNX-BAN-SM-5073","n":"LEENA NATHANI","p":"9893555000","c":"SRAVANI MAHARANA","f":1,"pl":"05/04/2026 00:00:00","a":"05/04/2026 02:30:25","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"She said she just came for browsing and she said she'll come when she will be free she said not to give follow up again","nx":""},{"r":"MK-WK-MSX-BAN-SV-5071","n":"MANJU SARDA","p":"9890292611","c":"SHRUTI VORA","f":1,"pl":"07/04/2026 00:00:00","a":"11/04/2026 00:23:45","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer want back to usa will visit in future if needed","nx":""},{"r":"MK-WK-SJX-BAN-SM-5066","n":"SUNERA JUMANI","p":"9322045358","c":"SRAVANI MAHARANA","f":1,"pl":"05/04/2026 00:00:00","a":"04/04/2026 00:57:47","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"They'll visit Andheri for thr purchase","nx":""},{"r":"MK-WK-HRX-BAN-TK-5055","n":"HARSHI RUNAWAD","p":"8080225169","c":"TANYA KEDARE","f":1,"pl":"10/04/2026 00:00:00","a":"15/04/2026 02:31:30","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"declined after introduction","nx":""},{"r":"MK-WK-ASX-BAN-TA-5064","n":"ALI SAYYED","p":"8082186195","c":"TEHREEM ANSARI","f":1,"pl":"06/04/2026 00:00:00","a":"08/04/2026 06:27:12","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-KAM-BAN-SM-4089","n":"KAMLESH","p":"0:00:00","c":"SRAVANI MAHARANA","f":1,"pl":"03/04/2026 00:00:00","a":"04/04/2026 00:26:24","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"They flew to Australia again","nx":""},{"r":"MK-WK-JMX-AND-NA-4083","n":"JAGRUTI MEHATA","p":"9004071611","c":"POOJA SHIGWAN","f":1,"pl":"02/04/2026 00:00:00","a":"15/05/2026 04:15:54","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-MAD-BAN-SV-4082","n":"MADINA","p":"9322783489","c":"SHRUTI VORA","f":1,"pl":"02/04/2026 00:00:00","a":"02/04/2026 05:05:16","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer did not liked the desgin she was gifting it too - close","nx":""},{"r":"MK-WK-SPX-BAN-TK-4078","n":"SANA PATEL","p":"9820644100","c":"TANYA KEDARE","f":1,"pl":"10/04/2026 00:00:00","a":"15/04/2026 02:35:49","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 22/04/2026 12:00\n- REMARK  : client said I'll let you know bcz i am out nd busy .","nx":"22/04/2026 12:00:00"},{"r":"MK-WK-SPX-BAN-TK-4078","n":"SANA PATEL","p":"9820644100","c":"TANYA KEDARE","f":2,"pl":"21/04/2026 11:00:00","a":"19/04/2026 23:52:38","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"SHE SAID I WILL CALL YOU LATER CALL HER MANY TIMES [ NOT INTRESTED CLOSE]","nx":""},{"r":"MK-WK-SSX-AND-NA-4085","n":"SUMAIYA SUNSARA","p":"9870000706","c":"POOJA SHIGWAN","f":1,"pl":"03/04/2026 00:00:00","a":"15/05/2026 04:16:11","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-NRX-AND-NA-4086","n":"NAFISA ROKADIA","p":"8879845850","c":"BHOOMI BHAGAT","f":1,"pl":"04/04/2026 00:00:00","a":"21/04/2026 03:40:43","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 28/04/2026 03:00\n- REMARK  : Visiting at bandra want more designs rings and set diamond delicate","nx":"28/04/2026 03:00:00"},{"r":"MK-WK-NRX-AND-NA-4086","n":"NAFISA ROKADIA","p":"8879845850","c":"NA","f":2,"pl":"27/04/2026 11:00:00","a":"07/05/2026 21:31:48","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"She want plain gold and ready peace","nx":""},{"r":"MK-WK-KVX-BAN-SV-4071","n":"KANISHKA VATYANI","p":"9970828887","c":"SHRUTI VORA","f":1,"pl":"01/04/2026 00:00:00","a":"02/04/2026 05:06:31","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 05/04/2026 11:00\n- REMARK  : will visit after few days","nx":"05/04/2026 11:00:00"},{"r":"MK-WK-KVX-BAN-SV-4071","n":"KANISHKA VATYANI","p":"9970828887","c":"SHRUTI VORA","f":2,"pl":"05/04/2026 11:00:00","a":"13/05/2026 05:47:45","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no req for now","nx":""},{"r":"MK-WK-FAI-BAN-SV-4070","n":"FAIZA","p":"9967467440","c":"SHRUTI VORA","f":1,"pl":"04/04/2026 00:00:00","a":"11/04/2026 00:17:27","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer said will visit in future if needed","nx":""},{"r":"MK-WK-YKX-BAN-TA-4069","n":"YASMEEN KHAN","p":"9930418403","c":"TEHREEM ANSARI","f":1,"pl":"02/04/2026 00:00:00","a":"08/04/2026 06:39:33","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 12/04/2026 12:00\n- REMARK  : her coordination is going on with uma on call and whatsapp","nx":"12/04/2026 12:00:00"},{"r":"MK-WK-YKX-BAN-TA-4069","n":"YASMEEN KHAN","p":"9930418403","c":"TEHREEM ANSARI","f":2,"pl":"11/04/2026 11:00:00","a":"11/04/2026 03:02:03","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 17/04/2026 12:00\n- REMARK  : in touch with uma ma'am will update after a week","nx":"17/04/2026 12:00"},{"r":"MK-WK-YKX-BAN-TA-4069","n":"YASMEEN KHAN","p":"9930418403","c":"TEHREEM ANSARI","f":3,"pl":"16/04/2026 11:00:00","a":"29/04/2026 03:02:10","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"WILL VISIT","nx":"29/04/2026 04:00"},{"r":"MK-WK-JSX-BAN-TK-4065","n":"JAYA SHEVARAMANI","p":"9833170604","c":"TANYA KEDARE","f":1,"pl":"04/04/2026 00:00:00","a":"15/04/2026 02:28:43","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she said i m busy right now can't talk [ and the bracelete she is lookig for a baby is yet to born","nx":""},{"r":"MK-WK-EBX-ZBX-NA-4061","n":"ESHA BHIVANDKER","p":"9821302208","c":"PRATIKSHA GOHIL","f":1,"pl":"07/04/2026 00:00:00","a":"29/04/2026 02:39:09","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Madam Maine purchase kar liya hai Bandra Store se","nx":""},{"r":"MK-WK-KSX-BAN-TA-4057","n":"KOMAL SHAH","p":"9820400562","c":"TEHREEM ANSARI","f":1,"pl":"20/04/2026 00:00:00","a":"14/05/2026 02:45:40","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"hung up the call in between the conversation","nx":""},{"r":"MK-WK-PKX-AND-NA-4072","n":"PRANEET KAUR","p":"9821999619","c":"BHOOMI BHAGAT","f":1,"pl":"02/04/2026 00:00:00","a":"09/04/2026 02:35:26","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Purchased bangles","nx":""},{"r":"MK-WK-TMX-ZBX-NA-4051","n":"TASNEEM MALVARI","p":"9898540107","c":"PRATIKSHA GOHIL","f":1,"pl":"04/04/2026 00:00:00","a":"15/04/2026 23:39:04","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 22/04/2026 01:00\n- REMARK  : Customer ne bola hai vah Bandra visit karne Wale Hain abhi just meri baat hui hai unse to unhone bola hai kya visit karenge.","nx":"22/04/2026 01:00:00"},{"r":"MK-WK-TMX-ZBX-NA-4051","n":"TASNEEM MALVARI","p":"9898540107","c":"NA","f":2,"pl":"21/04/2026 11:00:00","a":"16/04/2026 00:00:52","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 22/04/2026 01:00\n- REMARK  : Customer Ne bulao directly abhi pandra visit karenge unko aur stock dekhna hai iske liye","nx":"22/04/2026 01:00"},{"r":"MK-WK-TMX-ZBX-NA-4051","n":"TASNEEM MALVARI","p":"9898540107","c":"NA","f":3,"pl":"21/04/2026 11:00:00","a":"21/04/2026 03:10:30","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-VAX-BAN-TA-4050","n":"VINAY AGRAWAL","p":"8770641661","c":"TEHREEM ANSARI","f":1,"pl":"31/03/2026 00:00:00","a":"08/04/2026 06:36:45","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-NAX-ZBX-NA-4053","n":"NIDDA CHUNAWALA","p":"9920151595","c":"ANJALI MISHRA","f":1,"pl":"04/04/2026 00:00:00","a":"09/04/2026 04:58:55","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Mujha kuch chahiye hoga to me visit karungi aap log call nahi karo","nx":""},{"r":"MK-WK-MAY-BAN-TK-4055","n":"MAYANK","p":"9039038888","c":"TANYA KEDARE","f":1,"pl":"01/04/2026 00:00:00","a":"19/05/2026 00:28:31","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Not Interested","nx":""},{"r":"MK-WK-NSX-BAN-SM-4056","n":"NANKI SINGH","p":"0:00:00","c":"SRAVANI MAHARANA","f":1,"pl":"30/03/2026 00:00:00","a":"04/04/2026 02:59:30","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"sharddha maam gave her best price but she wants 5% making so she is not willing to take the product","nx":""},{"r":"MK-WK-ABX-EXH-NA-4048","n":"ABHJEET BHATACHARIYA","p":"9820047026","c":"VIKAS GAUTAM","f":1,"pl":"31/03/2026 00:00:00","a":"27/04/2026 06:16:46","s":"ALREADY PURCHASED FROM MK JEWELS","m":"His wife purchased dia ring","nx":""},{"r":"MK-WK-DRX-AND-NA-4047","n":"DEEPTI RAINA","p":"9987307771","c":"BHOOMI BHAGAT","f":1,"pl":"30/03/2026 00:00:00","a":"02/04/2026 03:32:26","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Cz ring purchased","nx":""},{"r":"MK-WK-DRX-AND-NA-4044","n":"DEEPTI RAINA","p":"9987307771","c":"BHOOMI BHAGAT","f":1,"pl":"30/03/2026 00:00:00","a":"02/04/2026 03:30:54","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Client purchased at andheri branch","nx":""},{"r":"MK-WK-PSX-BAN-SV-4043","n":"PALAK SHAH","p":"9898977920","c":"SHRUTI VORA","f":1,"pl":"31/03/2026 00:00:00","a":"31/03/2026 23:52:52","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 03/04/2026 11:00\n- REMARK  : customer will visit Ahmedabad store","nx":"03/04/2026 11:00:00"},{"r":"MK-WK-PSX-BAN-SV-4043","n":"PALAK SHAH","p":"9898977920","c":"SHRUTI VORA","f":2,"pl":"03/04/2026 11:00:00","a":"15/04/2026 02:10:24","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer visited Ahmedabad store but not purchased","nx":""},{"r":"MK-WK-RPX-BAN-TK-4040","n":"ROSHNI  PUNJABI","p":"9860608068","c":"TANYA KEDARE","f":1,"pl":"31/03/2026 00:00:00","a":"20/05/2026 01:24:40","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Client said \nHi \nWill come closer to the wedding \nMaybe August September \nAfter finalising outfits :)","nx":""},{"r":"MK-WK-ABX-AND-NA-4080","n":"ABHIJEET BHATTACHARYA","p":"9820047026","c":"VIKAS GAUTAM","f":1,"pl":"07/10/2026 00:00:00","a":"27/04/2026 06:16:21","s":"ALREADY PURCHASED FROM MK JEWELS","m":"His wife purchased dia ring","nx":""},{"r":"MK-WK-FSX-BAN-SM-4018","n":"FALGUNI SHAH","p":"9819648083","c":"SRAVANI MAHARANA","f":1,"pl":"28/03/2026 00:00:00","a":"15/04/2026 02:14:44","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Clint said your making is too high gor our preference i told them about 111 offer but she has no requirement at the moment","nx":""},{"r":"MK-WK-MPX-BAN-TK-4015","n":"MEHDI PRADHDAN","p":"9967883355","c":"TANYA KEDARE","f":1,"pl":"31/03/2026 00:00:00","a":"15/04/2026 01:50:34","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"they said our daughter  did  not approve the items , we had  chosen for her and requested us to to wait for deliveries from online stores . sorry to dissppoin you . but we throughout appreciated  the iteams you showed us and will be definitely visiting your store in near future \nand i will remember to surely recommend you and your store to my near and dear ones for their any requirement","nx":""},{"r":"MK-WK-SMX-AND-NA-4027","n":"SAROJ  MUNI","p":"8108152003","c":"BHOOMI BHAGAT","f":1,"pl":"30/03/2026 00:00:00","a":"15/05/2026 03:36:51","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-RUN-ZBX-NA-4011","n":"RUNU","p":"9437119339","c":"ANJALI MISHRA","f":1,"pl":"31/03/2026 00:00:00","a":"01/04/2026 05:51:57","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Madam hum ne aap ko that time hi inform Kiya tha ki but phum passing ho rahe the the to aap ka display dekha isliye visit kiya tha so please don't call again thank you","nx":""},{"r":"MK-WK-MUN-BAN-SM-4009","n":"MUNIRA","p":"9893077474","c":"SRAVANI MAHARANA","f":1,"pl":"27/03/2026 00:00:00","a":"06/04/2026 02:25:58","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"when i called and told her that im calling from mk Jewels she said not required and cut tyhe call","nx":""},{"r":"MK-WK-ISX-AND-NA-4013","n":"IMRAN SUNSARA","p":"9920111786","c":"POOJA SHIGWAN","f":1,"pl":"27/03/2026 00:00:00","a":"15/05/2026 04:16:29","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-DIV-BAN-SM-4000","n":"DIVISHA","p":"9820242636","c":"SRAVANI MAHARANA","f":1,"pl":"26/03/2026 00:00:00","a":"26/03/2026 00:41:50","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"costomer picked the call and also neha maam is coordinating with her for the pricing","nx":""},{"r":"MK-WK-AHX-BAN-SM-3999","n":"ARUSHA HAMIDANI","p":"9701091100","c":"SRAVANI MAHARANA","f":1,"pl":"26/03/2026 00:00:00","a":"04/04/2026 03:01:51","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"she purchased from kalyan jewelers","nx":""},{"r":"MK-WK-BMX-BAN-TA-3997","n":"BHARTI MANCHANDYA","p":"9821050767","c":"TEHREEM ANSARI","f":1,"pl":"25/03/2026 00:00:00","a":"24/03/2026 23:57:51","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"Archana ma’am will personally take the product to the customer’s home, and the final decision will be made after discussing it with his father.","nx":"25/03/2026 02:00:00"},{"r":"MK-WK-BMX-BAN-TA-3997","n":"BHARTI MANCHANDYA","p":"9821050767","c":"TEHREEM ANSARI","f":2,"pl":"25/03/2026 11:00:00","a":"26/03/2026 05:10:35","s":"ALREADY PURCHASED FROM MK JEWELS","m":"PURCHASED","nx":""},{"r":"MK-WK-SKX-BAN-SV-3995","n":"SINDHU KHATWANI","p":"9920357834","c":"SHRUTI VORA","f":1,"pl":"26/03/2026 00:00:00","a":"15/04/2026 02:03:18","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer msged no thankyou- close","nx":""},{"r":"MK-WK-NSX-BAN-TK-3998","n":"NEHA SHAIKH","p":"7900171232","c":"TANYA KEDARE","f":1,"pl":"25/03/2026 00:00:00","a":"27/03/2026 00:36:09","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 31/03/2026 12:00\n- REMARK  : She said that making charges are too high if you are giving discount that then i will think about it","nx":"31/03/2026 12:00:00"},{"r":"MK-WK-NSX-BAN-TK-3998","n":"NEHA SHAIKH","p":"7900171232","c":"TANYA KEDARE","f":2,"pl":"30/03/2026 11:00:00","a":"01/05/2026 01:11:28","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Called her many times , she is not interested [ close]","nx":""},{"r":"MK-WK-PGX-ZBX-NA-3996","n":"POOJA GOYAL","p":"9825142439","c":"PRATIKSHA GOHIL","f":1,"pl":"26/03/2026 00:00:00","a":"25/03/2026 04:23:42","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Cal evening se main unko call kar rahi hun to vah utha nahin rahe the Maine Aaj subah bhi unko call kiya to unhone uthaya but vah customer ne bola ki yah Pooja Goyal ka number nahin Hai ye mera number hai mera naam Ramesh Patel hai our me koi pooja Goyal ko nahi pehchan ta aapko Kisi Ne galat number diya hai sorry madam .","nx":""},{"r":"MK-WK-GSX-BAN-TK-3990","n":"GURLEEN SETHI","p":"9619912679","c":"TANYA KEDARE","f":1,"pl":"25/03/2026 00:00:00","a":"27/03/2026 00:32:47","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"She is came for her sister so we scheduled a  video call for them","nx":"27/03/2026 12:00:00"},{"r":"MK-WK-GSX-BAN-TK-3990","n":"GURLEEN SETHI","p":"9619912679","c":"TANYA KEDARE","f":2,"pl":"27/03/2026 11:00:00","a":"02/06/2026 05:24:12","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"buyed from another store and not happy with the service.","nx":""},{"r":"MK-WK-SSX-BAN-TK-3981","n":"SHRIYA SHETTY","p":"9833962480","c":"TANYA KEDARE","f":1,"pl":"25/03/2026 00:00:00","a":"24/03/2026 23:57:17","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 02/04/2026 01:00\n- REMARK  : She will later whenever she get time","nx":"02/04/2026 01:00:00"},{"r":"MK-WK-SSX-BAN-TK-3981","n":"SHRIYA SHETTY","p":"9833962480","c":"TANYA KEDARE","f":2,"pl":"01/04/2026 11:00:00","a":"27/03/2026 00:33:49","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 02/04/2026 12:00\n- REMARK  : She said I will let u know","nx":"02/04/2026 12:00"},{"r":"MK-WK-SSX-BAN-TK-3981","n":"SHRIYA SHETTY","p":"9833962480","c":"TANYA KEDARE","f":3,"pl":"01/04/2026 11:00:00","a":"02/05/2026 00:19:43","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Followed up more than 3/4 times [ close]","nx":""},{"r":"MK-WK-KGX-BAN-SM-3979","n":"KETKI GADA","p":"9820310605","c":"SRAVANI MAHARANA","f":1,"pl":"25/03/2026 00:00:00","a":"11/04/2026 00:21:43","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"No requirement","nx":""},{"r":"MK-WK-SJX-BAN-SM-3971","n":"SAKSHI JAIN","p":"9841817934","c":"SRAVANI MAHARANA","f":1,"pl":"23/03/2026 00:00:00","a":"25/03/2026 00:11:11","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer gave us wrong number","nx":""},{"r":"MK-WK-RDX-BAN-SM-3978","n":"RINA DHANI","p":"9284005169","c":"SRAVANI MAHARANA","f":1,"pl":"25/03/2026 00:00:00","a":"15/04/2026 02:09:34","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"She pickup the call and then in the halfwY she cut the call and said not interested","nx":""},{"r":"MK-WK-NIS-BAN-SM-3964","n":"NISHKA","p":"9167765547","c":"SRAVANI MAHARANA","f":1,"pl":"22/03/2026 00:00:00","a":"04/04/2026 03:07:17","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"out of buget","nx":""},{"r":"MK-WK-JLX-BAN-TK-3960","n":"JANHAVI LALWANI","p":"8600559282","c":"TANYA KEDARE","f":1,"pl":"24/03/2026 00:00:00","a":"21/03/2026 03:16:33","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 25/03/2026 00:00\n- REMARK  : She will visit after 2 days","nx":"25/03/2026 00:00:00"},{"r":"MK-WK-JLX-BAN-TK-3960","n":"JANHAVI LALWANI","p":"8600559282","c":"TANYA KEDARE","f":2,"pl":"24/03/2026 11:00:00","a":"27/03/2026 00:39:29","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Called her many times [ close ]","nx":""},{"r":"MK-WK-DKX-ZBX-NA-3962","n":"DOLLY KAUR","p":"9833816950","c":"PRATIKSHA GOHIL","f":1,"pl":"24/03/2026 00:00:00","a":"27/03/2026 02:38:16","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer said gold out of budget ja raha tha to daughter ne bol ki aap silver me buy kar lijiye isliye mene silver me buy kar liya 5,000/- me","nx":""},{"r":"MK-WK-SHU-ZBX-NA-3959","n":"SHUSHMA","p":"9783053366","c":"ANJALI MISHRA","f":1,"pl":"28/03/2026 00:00:00","a":"01/04/2026 05:54:20","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Hume  pasand thi but aap ne  bola ki nahi hosak ta hai to it's ok don't worry  no need for calling thank you","nx":""},{"r":"MK-WK-VMX-BAN-TA-3961","n":"VAISHALI MEHTA","p":"9819849802","c":"TEHREEM ANSARI","f":1,"pl":"28/03/2026 00:00:00","a":"29/04/2026 02:52:54","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-MGX-BAN-SV-3950","n":"MANISHA GERA","p":"9819149397","c":"SHRUTI VORA","f":1,"pl":"19/03/2026 00:00:00","a":"21/03/2026 03:40:43","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 24/03/2026 11:00\n- REMARK  : to call the customer on 24th mar","nx":"24/03/2026 11:00:00"},{"r":"MK-WK-MGX-BAN-SV-3950","n":"MANISHA GERA","p":"9819149397","c":"SHRUTI VORA","f":2,"pl":"24/03/2026 11:00:00","a":"25/03/2026 00:08:21","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 27/03/2026 11:00\n- REMARK  : shraddha maam had a word with customer she said she will call samnese if needed waiting for gold rate to go down","nx":"27/03/2026 11:00"},{"r":"MK-WK-MGX-BAN-SV-3950","n":"MANISHA GERA","p":"9819149397","c":"SHRUTI VORA","f":3,"pl":"27/03/2026 11:00:00","a":"13/05/2026 05:48:19","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer will call if needed - shraddha - close","nx":""},{"r":"MK-WK-KMX-BAN-SM-3949","n":"KHUSHBU MOTIRAMANI","p":"8866010802","c":"SRAVANI MAHARANA","f":1,"pl":"25/03/2026 00:00:00","a":"04/04/2026 03:10:44","s":"ALREADY PURCHASED FROM MK JEWELS","m":"mother in law came for the purchase","nx":""},{"r":"MK-WK-HPX-ZBX-NA-3953","n":"HANDI PAREKH","p":"9930435439","c":"ANJALI MISHRA","f":1,"pl":"22/03/2026 00:00:00","a":"21/03/2026 04:12:34","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Abhi requirement nahi hai .","nx":""},{"r":"MK-WK-NKX-BAN-SM-3944","n":"NOOR KAIRA","p":"8452084555","c":"SRAVANI MAHARANA","f":1,"pl":"23/03/2026 00:00:00","a":"24/03/2026 23:49:16","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"She wants to see designs in 40 grams as well so video call will be scheduled for her she told  I will let you know the time once my husband will be home","nx":"25/03/2026 14:00:00"},{"r":"MK-WK-NKX-BAN-SM-3944","n":"NOOR KAIRA","p":"8452084555","c":"SRAVANI MAHARANA","f":2,"pl":"25/03/2026 11:00:00","a":"06/04/2026 02:18:36","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she is not looking for sets not so rn she has no requirement for any jewellery","nx":""},{"r":"MK-WK-NAZ-BAN-SV-3943","n":"NAZIYA","p":"8147986761","c":"SHRUTI VORA","f":1,"pl":"23/03/2026 00:00:00","a":"25/03/2026 00:10:47","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 28/03/2026 11:00\n- REMARK  : customer said will visit on saturday if possible","nx":"28/03/2026 11:00:00"},{"r":"MK-WK-NAZ-BAN-SV-3943","n":"NAZIYA","p":"8147986761","c":"SHRUTI VORA","f":2,"pl":"28/03/2026 11:00:00","a":"31/03/2026 23:53:26","s":"ALREADY PURCHASED FROM MK JEWELS","m":"order placed at mk","nx":""},{"r":"MK-WK-SGX-ZBX-NA-3941","n":"SHEETAL GUPTA","p":"8669172992","c":"PRATIKSHA GOHIL","f":1,"pl":"19/03/2026 00:00:00","a":"21/03/2026 02:47:16","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"We are just browsing passing from market","nx":""},{"r":"MK-WK-SJX-ZBX-NA-3938","n":"SHIVANI JOSHI","p":"8980084978","c":"ANJALI MISHRA","f":1,"pl":"18/03/2026 00:00:00","a":"21/03/2026 04:10:29","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Purchase somewhere else right now not requirement.","nx":""},{"r":"MK-WK-PRX-BAN-TK-3934","n":"PRAKASH RAMCHANDANI","p":"9322004371","c":"TANYA KEDARE","f":1,"pl":"21/03/2026 00:00:00","a":"27/03/2026 00:43:21","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Called him before but he wants 500 rupees making charges which is impossible [ close]","nx":""},{"r":"MK-WK-RBX-BAN-SM-3931","n":"RAJEE BHAMBRI","p":"9822448377","c":"SRAVANI MAHARANA","f":1,"pl":"18/03/2026 00:00:00","a":"20/03/2026 05:27:43","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"She wants 0% making in our diamond necklace set Which don't have pink tag","nx":""},{"r":"MK-WK-RZX-BAN-SV-3921","n":"RESHMA ZAVERI","p":"7045194860","c":"SHRUTI VORA","f":1,"pl":"18/03/2026 00:00:00","a":"21/03/2026 03:40:09","s":"ALREADY PURCHASED FROM MK JEWELS","m":"order placed","nx":""},{"r":"MK-WK-RVX-BAN-SM-3915","n":"RAJANA VATKAR","p":"9821217915","c":"SRAVANI MAHARANA","f":1,"pl":"19/03/2026 00:00:00","a":"20/03/2026 05:28:47","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Will be going to Andheri store when it's ready","nx":""},{"r":"MK-WK-SPX-BAN-TK-3917","n":"SAKSHI PUNJABI","p":"9870148844","c":"TANYA KEDARE","f":1,"pl":"23/03/2026 00:00:00","a":"27/03/2026 00:41:15","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Close_  bcz she came for advertising purpose","nx":""},{"r":"MK-WK-NVX-BAN-TK-3905","n":"NIVEDA VIJAYA","p":"8226053530","c":"TANYA KEDARE","f":1,"pl":"18/03/2026 00:00:00","a":"18/03/2026 04:55:58","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 22/03/2026 01:00\n- REMARK  : she went Ahmedabad regarding her office meetings , she will try to come on weekends","nx":"22/03/2026 01:00:00"},{"r":"MK-WK-NVX-BAN-TK-3905","n":"NIVEDA VIJAYA","p":"8226053530","c":"TANYA KEDARE","f":2,"pl":"21/03/2026 11:00:00","a":"21/03/2026 03:14:21","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 24/03/2026 00:00\n- REMARK  : She will visit next week","nx":"24/03/2026 00:00"},{"r":"MK-WK-NVX-BAN-TK-3905","n":"NIVEDA VIJAYA","p":"8226053530","c":"TANYA KEDARE","f":3,"pl":"24/03/2026 11:00:00","a":"15/04/2026 02:24:28","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"[ close] took followup more than 3 times","nx":""},{"r":"MK-WK-ACX-BAN-TA-3903","n":"ASHFAQUE CHUNAWALA","p":"9833079524","c":"TEHREEM ANSARI","f":1,"pl":"17/03/2026 00:00:00","a":"21/03/2026 05:41:44","s":"ALREADY PURCHASED FROM MK JEWELS","m":"order placed at mk","nx":""},{"r":"MK-WK-SNX-BAN-TA-3913","n":"SANA NIZI","p":"9987860516","c":"TEHREEM ANSARI","f":1,"pl":"16/03/2026 00:00:00","a":"24/03/2026 23:50:29","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she said don't call me again and again i'll come if I need/ not interested","nx":""},{"r":"MK-WK-VAX-BAN-TA-3901","n":"VINAY AGRAWAL","p":"8770641661","c":"TEHREEM ANSARI","f":1,"pl":"15/03/2026 00:00:00","a":"18/03/2026 01:25:29","s":"ALREADY PURCHASED FROM MK JEWELS","m":"order placed","nx":""},{"r":"MK-WK-JAS-ZBX-NA-3919","n":"JASH","p":"8828338817","c":"ANJALI MISHRA","f":1,"pl":"21/03/2026 00:00:00","a":"21/03/2026 04:11:28","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Given wrong number","nx":""},{"r":"MK-WK-DPX-BAN-SM-3894","n":"DRUVI PANCHOLI","p":"7020089525","c":"SRAVANI MAHARANA","f":1,"pl":"31/05/2026 00:00:00","a":"02/06/2026 04:45:13","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-WK-SAL-ZBX-NA-3895","n":"SALONI","p":"9665443311","c":"PRATIKSHA GOHIL","f":1,"pl":"17/03/2026 00:00:00","a":"20/03/2026 01:19:24","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Mujha particular plan Gold ka design gifting ke liye lena hai jo mujhe nahi milega woh abhi mujhe interest nahi hai","nx":""},{"r":"MK-WK-HOX-BAN-SM-3893","n":"HITAKSHI OVHAN","p":"9987733337","c":"SRAVANI MAHARANA","f":1,"pl":"15/03/2026 00:00:00","a":"20/03/2026 05:22:23","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Uma maam gave them home delivery","nx":""},{"r":"MK-WK-MCX-BAN-SM-3881","n":"MAZIA CHANDIWALA","p":"9930767460","c":"SRAVANI MAHARANA","f":1,"pl":"24/03/2026 00:00:00","a":"04/04/2026 03:14:09","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"clint said abhi jarurat nahi hai jewellery ki jab hogi theyll come","nx":""},{"r":"MK-WK-TAX-BAN-TA-3873","n":"TRISHA AGRAWAL","p":"9619252978","c":"TEHREEM ANSARI","f":1,"pl":"14/03/2026 00:00:00","a":"18/03/2026 01:21:22","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 23/03/2026 12:00\n- REMARK  : i won't be coming at bandra will wait until the store get open","nx":"23/03/2026 12:00:00"},{"r":"MK-WK-TAX-BAN-TA-3873","n":"TRISHA AGRAWAL","p":"9619252978","c":"TEHREEM ANSARI","f":2,"pl":"22/03/2026 11:00:00","a":"24/03/2026 00:29:07","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 25/03/2026 12:00\n- REMARK  : she will purchase from andheri store only need to sent her an invitation","nx":"25/03/2026 12:00"},{"r":"MK-WK-TAX-BAN-TA-3873","n":"TRISHA AGRAWAL","p":"9619252978","c":"TEHREEM ANSARI","f":3,"pl":"25/03/2026 11:00:00","a":"24/03/2026 23:54:16","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 30/03/2026 12:00\n- REMARK  : I've invited to new andheri store but she said i won't visist today i'll let you know when i will be","nx":"30/03/2026 12:00"},{"r":"MK-WK-SGX-BAN-SV-3872","n":"SHIVANSHI GALA","p":"9004259050","c":"SHRUTI VORA","f":1,"pl":"14/03/2026 00:00:00","a":"14/03/2026 00:34:28","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"client said not intrested","nx":""},{"r":"MK-WK-HTX-BAN-TA-3869","n":"HARSHA TULANI","p":"9730071971","c":"TEHREEM ANSARI","f":1,"pl":"13/03/2026 00:00:00","a":"13/03/2026 02:53:00","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 14/03/2026 12:00\n- REMARK  : client asked not to call again, i'll update neha ma'am if i want to proceed further","nx":"14/03/2026 12:00:00"},{"r":"MK-WK-HTX-BAN-TA-3869","n":"HARSHA TULANI","p":"9730071971","c":"TEHREEM ANSARI","f":2,"pl":"14/03/2026 11:00:00","a":"21/03/2026 05:40:02","s":"ALREADY PURCHASED FROM MK JEWELS","m":"order placed at mk sp neha","nx":""},{"r":"MK-WK-NJX-BAN-SV-3864","n":"NITU JAIN","p":"8080481164","c":"SHRUTI VORA","f":1,"pl":"15/03/2026 00:00:00","a":"14/03/2026 00:33:50","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 21/03/2026 01:00\n- REMARK  : customer has some funtion so she wil visit next weekend","nx":"21/03/2026 01:00:00"},{"r":"MK-WK-NJX-BAN-SV-3864","n":"NITU JAIN","p":"8080481164","c":"SHRUTI VORA","f":2,"pl":"20/03/2026 11:00:00","a":"15/04/2026 02:00:08","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer said will come of needed to uma maam no need to call","nx":""},{"r":"MK-WK-HPX-BAN-SM-3859","n":"HUNAR PUNSHI","p":"9225517011","c":"SRAVANI MAHARANA","f":1,"pl":"12/03/2026 00:00:00","a":"11/03/2026 23:55:00","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"???","nx":"23/03/2026 12:00:00"},{"r":"MK-WK-HPX-BAN-SM-3859","n":"HUNAR PUNSHI","p":"9225517011","c":"SRAVANI MAHARANA","f":2,"pl":"22/03/2026 11:00:00","a":"02/06/2026 04:45:35","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-SLB-ZBX-NA-3854","n":"SEEMA LAVISH BHAVANI","p":"7972875768","c":"ANJALI MISHRA","f":1,"pl":"12/03/2026 00:00:00","a":"04/04/2026 05:24:05","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"I am busy so please me aap ko inform karti hu our call cut kar diya","nx":""},{"r":"MK-WK-HBX-BAN-SM-3853","n":"HEENA BHATIJA","p":"9022749053","c":"SRAVANI MAHARANA","f":1,"pl":"13/03/2026 00:00:00","a":"15/03/2026 00:36:43","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Not interested","nx":""},{"r":"MK-WK-APX-BAN-SM-3851","n":"ARIFA PETAIWALA","p":"7472578161","c":"SRAVANI MAHARANA","f":1,"pl":"11/03/2026 00:00:00","a":"12/03/2026 00:03:06","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they gave wrong number to us","nx":""},{"r":"MK-WK-ACX-BAN-TA-3852","n":"ASHFAQUE CHUNAWALA","p":"9833079524","c":"TEHREEM ANSARI","f":1,"pl":"12/03/2026 00:00:00","a":"11/03/2026 01:54:02","s":"ALREADY PURCHASED FROM MK JEWELS","m":"online purchased","nx":""},{"r":"MK-WK-SMX-BAN-TA-3856","n":"SHAGUFTA MULTANI","p":"9870400174","c":"TEHREEM ANSARI","f":1,"pl":"13/03/2026 00:00:00","a":"13/03/2026 02:54:29","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 17/03/2026 12:00\n- REMARK  : pricing discusssion is on going with uma maam will update after 2/3 days","nx":"17/03/2026 12:00:00"},{"r":"MK-WK-SMX-BAN-TA-3856","n":"SHAGUFTA MULTANI","p":"9870400174","c":"TEHREEM ANSARI","f":2,"pl":"16/03/2026 11:00:00","a":"21/03/2026 05:38:24","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 24/03/2026 20:00\n- REMARK  : customer is still thinking wants in 7% making charges we have offered 10% making charge","nx":"24/03/2026 20:00"},{"r":"MK-WK-SMX-BAN-TA-3856","n":"SHAGUFTA MULTANI","p":"9870400174","c":"TEHREEM ANSARI","f":3,"pl":"24/03/2026 11:00:00","a":"24/03/2026 00:26:07","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she is asking for 7% making charges but the best we could offer is 10%","nx":""},{"r":"MK-WK-KSX-BAN-SV-3847","n":"KAVITA SURANA","p":"9820539201","c":"SHRUTI VORA","f":1,"pl":"16/03/2026 00:00:00","a":"21/03/2026 03:39:44","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 25/03/2026 11:00\n- REMARK  : customer will visit next week","nx":"25/03/2026 11:00:00"},{"r":"MK-WK-KSX-BAN-SV-3847","n":"KAVITA SURANA","p":"9820539201","c":"SHRUTI VORA","f":2,"pl":"24/03/2026 11:00:00","a":"25/03/2026 00:06:50","s":"ALREADY PURCHASED FROM MK JEWELS","m":"order placed @mk, jay bafna","nx":""},{"r":"MK-WK-DSX-BAN-SM-3833","n":"DR SHABNAM","p":"9821294328","c":"SRAVANI MAHARANA","f":1,"pl":"09/03/2026 00:00:00","a":"20/03/2026 05:25:15","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Clint has budget issue","nx":""},{"r":"MK-WK-TMX-BAN-TK-3837","n":"TASNEEM MERCHANT","p":"982059565","c":"TANYA KEDARE","f":1,"pl":"10/03/2026 00:00:00","a":"27/03/2026 00:44:56","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"She didn't like any of designs [ close]","nx":""},{"r":"MK-WK-NUX-BAN-SV-3832","n":"NAEEMA UJJAINWALA","p":"9819884075","c":"SHRUTI VORA","f":1,"pl":"21/03/2026 00:00:00","a":"21/03/2026 00:28:09","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"purshased from dhanraj bcz her budget was 1 lac","nx":""},{"r":"MK-WK-KAD-BAN-TK-3827","n":"KAJAL ANIL DASWANEY","p":"8828031044","c":"TANYA KEDARE","f":1,"pl":"07/03/2026 00:00:00","a":"09/03/2026 05:41:56","s":"ALREADY PURCHASED FROM MK JEWELS","m":"THEY ALREADY PLACED AN ORDER","nx":""},{"r":"MK-WK-BHA-BAN-TK-3829","n":"BHAVNA","p":"981931002","c":"TANYA KEDARE","f":1,"pl":"07/03/2026 00:00:00","a":"13/03/2026 04:24:47","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer gave wrong number","nx":""},{"r":"MK-WK-KKT-ZBX-NA-3819","n":"KARAN  KK TRAVELS","p":"9028361914","c":"ANJALI MISHRA","f":1,"pl":"06/03/2026 00:00:00","a":"21/03/2026 04:08:09","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Not interested cut the call again","nx":""},{"r":"MK-WK-RSX-BAN-SM-3817","n":"RADHIKA SHETTY","p":"9819414316","c":"SRAVANI MAHARANA","f":1,"pl":"07/03/2026 00:00:00","a":"12/03/2026 00:06:22","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she only came for checking on her order shll come for order pickup","nx":""},{"r":"MK-WK-AMX-BAN-SV-3816","n":"AMIT MARWA","p":"9821871475","c":"SHRUTI VORA","f":1,"pl":"09/03/2026 00:00:00","a":"21/03/2026 00:28:57","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer wanted 0% making charges which is not possible - close","nx":""},{"r":"MK-WK-ASX-BAN-TA-3813","n":"AJINKYA SHINDE","p":"9545044444","c":"TEHREEM ANSARI","f":1,"pl":"06/03/2026 00:00:00","a":"10/03/2026 02:53:49","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 12/03/2026 12:00\n- REMARK  : will confirm later","nx":"12/03/2026 12:00:00"},{"r":"MK-WK-ASX-BAN-TA-3813","n":"AJINKYA SHINDE","p":"9545044444","c":"TEHREEM ANSARI","f":2,"pl":"12/03/2026 11:00:00","a":"11/04/2026 02:52:10","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"have been followed up with him more than 5 time from my and salespersons end there is no response","nx":""},{"r":"MK-WK-KIR-BAN-TK-3808","n":"KIRAN","p":"9822027755","c":"TANYA KEDARE","f":1,"pl":"08/03/2026 00:00:00","a":"06/03/2026 04:27:00","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"client is in meeting she will talk to us later","nx":""},{"r":"MK-WK-DSH-BAN-SV-3807","n":"DR SHABNAM HUSAIN","p":"9821294328","c":"SHRUTI VORA","f":1,"pl":"03/03/2026 00:00:00","a":"21/03/2026 00:30:14","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer wanted 22kt watch selected one but it was going out of budget also was not sure about the design, we showed from Ahmedabad store too - close","nx":""},{"r":"MK-WK-GJX-BAN-SV-3806","n":"GARGI JAIN","p":"9159491000","c":"SHRUTI VORA","f":1,"pl":"02/03/2026 00:00:00","a":"11/04/2026 00:42:45","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"No requirement","nx":""},{"r":"MK-WK-DKR-BAN-SM-3804","n":"DR KOMAL RAM","p":"7710920044","c":"SRAVANI MAHARANA","f":1,"pl":"02/03/2026 00:00:00","a":"12/03/2026 00:08:28","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she cut the call after introduction","nx":""},{"r":"MK-WK-NJM-BAN-SV-3802","n":"NAYANA J MEHTA","p":"9699491193","c":"SHRUTI VORA","f":1,"pl":"07/03/2026 00:00:00","a":"21/03/2026 00:31:45","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"too busy - dont call customer said - close","nx":""},{"r":"MK-WK-RJX-ZBX-NA-3803","n":"RICHA JAIN","p":"9987136587","c":"ANJALI MISHRA","f":1,"pl":"01/03/2026 00:00:00","a":"14/03/2026 04:26:00","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Unki shadi bhi ho gayee","nx":""},{"r":"MK-WK-FVX-BAN-SV-3797","n":"FALGUNI VORA","p":"9320747505","c":"SHRUTI VORA","f":1,"pl":"07/03/2026 00:00:00","a":"21/03/2026 00:32:39","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer wanted to exchange the bracelete but dont want to exchange it now - close","nx":""},{"r":"MK-WK-DNX-BAN-TA-3796","n":"DILIP NAGWANI","p":"9300468620","c":"TEHREEM ANSARI","f":1,"pl":"01/03/2026 00:00:00","a":"10/03/2026 02:51:40","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"went back to his town","nx":""},{"r":"MK-WK-REM-ZBX-NA-3794","n":"REMI","p":"9769525330","c":"ANJALI MISHRA","f":1,"pl":"05/03/2026 00:00:00","a":"14/03/2026 04:23:07","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Bar bar call maat  karo","nx":""},{"r":"MK-WK-MLX-BAN-SV-3792","n":"MUKTI LAUNGANI","p":"9321542200","c":"SHRUTI VORA","f":1,"pl":"06/03/2026 00:00:00","a":"21/03/2026 00:33:20","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased","nx":""},{"r":"MK-WK-KGX-BAN-TK-3790","n":"KINNARI GARG","p":"9819006659","c":"TANYA KEDARE","f":1,"pl":"02/03/2026 00:00:00","a":"06/03/2026 00:13:44","s":"ALREADY PURCHASED FROM MK JEWELS","m":"already purchased from our store","nx":""},{"r":"MK-WK-DBX-ZBX-NA-3785","n":"DHWENI BAFNA","p":"9819944707","c":"ANJALI MISHRA","f":1,"pl":"05/03/2026 00:00:00","a":"14/03/2026 04:24:40","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"I m not interested madam","nx":""},{"r":"MK-WK-NCX-BAN-SV-3779","n":"NATALI CHABLANI","p":"8806600896","c":"SHRUTI VORA","f":1,"pl":"26/02/2026 00:00:00","a":"21/03/2026 00:34:09","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no selection customer wanted ready pc - close","nx":""},{"r":"MK-WK-RSX-ZBX-NA-3780","n":"RUPAL SHAH","p":"9326561888","c":"PRATIKSHA GOHIL","f":1,"pl":"02/03/2026 00:00:00","a":"11/03/2026 00:50:20","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Just browsing we are thank you.","nx":""},{"r":"MK-WK-KBX-BAN-SV-3771","n":"KIRTI BAJAJ","p":"7875572728","c":"SHRUTI VORA","f":1,"pl":"25/02/2026 00:00:00","a":"21/03/2026 00:34:54","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement for now - close","nx":""},{"r":"MK-WK-TSX-BAN-TK-3765","n":"TANAY SHAH","p":"8591829911","c":"TANYA KEDARE","f":1,"pl":"02/03/2026 00:00:00","a":"25/02/2026 04:56:28","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 01/03/2026 12:00\n- REMARK  : they already mentioned theywill visitn next week , and now they told hw will let us know after discussing family","nx":"01/03/2026 12:00:00"},{"r":"MK-WK-TSX-BAN-TK-3765","n":"TANAY SHAH","p":"8591829911","c":"TANYA KEDARE","f":2,"pl":"28/02/2026 11:00:00","a":"21/03/2026 03:20:09","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"No requirement","nx":""},{"r":"MK-WK-PPX-BAN-SV-3763","n":"POONAM PATIL","p":"9702058568","c":"SHRUTI VORA","f":1,"pl":"26/02/2026 00:00:00","a":"21/03/2026 00:35:56","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement - close","nx":""},{"r":"MK-WK-HNX-BAN-TK-3760","n":"HONEY NEHLANI","p":"7738224142","c":"TANYA KEDARE","f":1,"pl":"25/02/2026 00:00:00","a":"21/03/2026 03:19:05","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"She have no requirement","nx":""},{"r":"MK-WK-HNX-BAN-TK-3761","n":"HONEY NEHLANI","p":"7738224142","c":"TANYA KEDARE","f":1,"pl":"25/02/2026 00:00:00","a":"18/03/2026 04:57:45","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she have no requirement right  now she will let us know if they have any requirement","nx":""},{"r":"MK-WK-SMX-BAN-TA-3756","n":"SANJAY MEHTA","p":"9820237696","c":"TEHREEM ANSARI","f":1,"pl":"23/02/2026 00:00:00","a":"26/02/2026 03:42:56","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 02/03/2026 12:00\n- REMARK  : will visit probably on tuesday 3rd march","nx":"02/03/2026 12:00:00"},{"r":"MK-WK-SMX-BAN-TA-3756","n":"SANJAY MEHTA","p":"9820237696","c":"TEHREEM ANSARI","f":2,"pl":"01/03/2026 11:00:00","a":"13/03/2026 03:01:03","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Hung up the call right after introduction","nx":""},{"r":"MK-WK-KSX-BAN-SV-3754","n":"KAVITA SURANA","p":"9820539201","c":"SHRUTI VORA","f":1,"pl":"22/02/2026 00:00:00","a":"25/02/2026 22:45:11","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased from MK","nx":""},{"r":"MK-WK-RSX-BAN-SM-3753","n":"RUBIYA SIDDIQUE","p":"9594135824","c":"SRAVANI MAHARANA","f":1,"pl":"23/02/2026 00:00:00","a":"22/02/2026 06:18:41","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement at the  moment [ close]","nx":""},{"r":"MK-WK-FAI-BAN-TK-3750","n":"FAIZAA","p":"9822819196","c":"TANYA KEDARE","f":1,"pl":"22/02/2026 00:00:00","a":"25/02/2026 04:54:13","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they already told us the requirement that 22kt plain gold sets but we dont have and they dont want to place an order so i just invited to them for pink tag sale","nx":""},{"r":"MK-WK-SAX-BAN-TK-3749","n":"SANDHYA AJITSARYA","p":"9874775794","c":"TANYA KEDARE","f":1,"pl":"23/02/2026 00:00:00","a":"25/02/2026 04:38:44","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement right now they will try visit next time [ close]","nx":""},{"r":"MK-WK-AKX-BAN-TA-3748","n":"AMITA KAPOOR","p":"9870018020","c":"TEHREEM ANSARI","f":1,"pl":"23/02/2026 00:00:00","a":"10/03/2026 02:51:01","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"we tried to call from our end several times but she is not responding and her function was on 8th march which have been done until now","nx":""},{"r":"MK-WK-RAS-BAN-TA-3742","n":"RESHMA AMIT SURVE","p":"8657096666","c":"TEHREEM ANSARI","f":1,"pl":"24/02/2026 00:00:00","a":"26/02/2026 00:36:05","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 03/03/2026 12:00\n- REMARK  : will visit later","nx":"03/03/2026 12:00:00"},{"r":"MK-WK-RAS-BAN-TA-3742","n":"RESHMA AMIT SURVE","p":"8657096666","c":"TEHREEM ANSARI","f":2,"pl":"02/03/2026 11:00:00","a":"13/03/2026 03:03:55","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"will visit soon, after giving pink tag offer","nx":"25/03/2026 12:00"},{"r":"MK-WK-DAR-LOK-NA-3741","n":"DARSHANA","p":"9768317937","c":"VIKAS GAUTAM","f":1,"pl":"31/05/2026 00:00:00","a":"23/02/2026 00:58:55","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Yess","nx":""},{"r":"MK-WK-ASX-LOK-NA-3740","n":"ANIKET SINGH","p":"9326547550","c":"VIKAS GAUTAM","f":1,"pl":"30/04/2026 00:00:00","a":"27/04/2026 04:09:29","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Not required","nx":""},{"r":"MK-WK-AMX-BAN-SM-3736","n":"ANKANSHA MEHTA","p":"8080111500","c":"SRAVANI MAHARANA","f":1,"pl":"21/02/2026 00:00:00","a":"21/02/2026 00:56:21","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"dont need follow-up","nx":"22/02/2026 12:00:00"},{"r":"MK-WK-AMX-BAN-SM-3736","n":"ANKANSHA MEHTA","p":"8080111500","c":"SRAVANI MAHARANA","f":2,"pl":"22/02/2026 11:00:00","a":"21/03/2026 00:51:37","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"dont need follow-up","nx":""},{"r":"MK-WK-HCX-BAN-TA-3091","n":"HIMAKSHI CHHABARIYA","p":"9819811766","c":"TEHREEM ANSARI","f":1,"pl":"22/02/2026 00:00:00","a":"23/02/2026 00:34:49","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 26/02/2026 12:00\n- REMARK  : we need time for consideration will get back to you shortly","nx":"26/02/2026 12:00:00"},{"r":"MK-WK-HCX-BAN-TA-3091","n":"HIMAKSHI CHHABARIYA","p":"9819811766","c":"TEHREEM ANSARI","f":2,"pl":"26/02/2026 11:00:00","a":"26/02/2026 00:25:48","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 04/03/2026 12:00\n- REMARK  : didn't mention the date but said we'll visit","nx":"04/03/2026 12:00"},{"r":"MK-WK-HCX-BAN-TA-3091","n":"HIMAKSHI CHHABARIYA","p":"9819811766","c":"TEHREEM ANSARI","f":3,"pl":"03/03/2026 11:00:00","a":"13/03/2026 02:57:36","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 16/03/2026 12:00\n- REMARK  : this is the 4th follow up and she hung up by saying i'm busy can't talk right now","nx":"16/03/2026 12:00"},{"r":"MK-WK-MAN-ZBX-NA-3090","n":"MANTASHA","p":"9836186574","c":"PRATIKSHA GOHIL","f":1,"pl":"21/02/2026 00:00:00","a":"20/02/2026 00:44:00","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Customer ne yesterday bandra store me ja kar order placed kiya hai meri bharat and CRM se baat Hui thi yesterday.","nx":""},{"r":"MK-WK-KLX-BAN-TK-3083","n":"KIARA LULLA","p":"9561674690","c":"TANYA KEDARE","f":1,"pl":"18/02/2026 00:00:00","a":"19/02/2026 23:35:48","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"She us visiting today","nx":"20/02/2026 06:00:00"},{"r":"MK-WK-KLX-BAN-TK-3083","n":"KIARA LULLA","p":"9561674690","c":"TANYA KEDARE","f":2,"pl":"20/02/2026 11:00:00","a":"25/02/2026 04:39:38","s":"ALREADY PURCHASED FROM MK JEWELS","m":"she purcahsed a necklace yesterday","nx":""},{"r":"MK-WK-NJX-BAN-TA-3082","n":"NYRAA JESWANI","p":"9827977929","c":"TEHREEM ANSARI","f":1,"pl":"18/02/2026 00:00:00","a":"18/02/2026 22:36:09","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 22/02/2026 01:00\n- REMARK  : SHE IS CONCERN ABOUT MAKING CHARGES ASK TIME TO THINK","nx":"22/02/2026 01:00:00"},{"r":"MK-WK-NJX-BAN-TA-3082","n":"NYRAA JESWANI","p":"9827977929","c":"TEHREEM ANSARI","f":2,"pl":"21/02/2026 11:00:00","a":"21/02/2026 00:54:41","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"She revisited the store on 19th June after reviewing the pricing. She mentioned that she is being offered a similar piece in CVD at the same rate from another source.","nx":""},{"r":"MK-WK-SNX-BAN-TK-3070","n":"SAVITA NANGARE","p":"9619281842","c":"TANYA KEDARE","f":1,"pl":"17/02/2026 00:00:00","a":"13/03/2026 04:33:06","s":"ALREADY PURCHASED FROM MK JEWELS","m":"already purchased from usl","nx":""},{"r":"MK-WK-SPX-BAN-TA-3068","n":"SAKIB PATEL","p":"8108795522","c":"TEHREEM ANSARI","f":1,"pl":"16/02/2026 00:00:00","a":"17/02/2026 01:21:04","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"WE'VE COORDINATE WITH THEM THROUGH CALL AND TEXT AND THEY CONFIRMED THEY HAD PURCHASED FROM SOMEWHERE ELSE EVEN SHARED THE ONE VIEW PICTURE WITH US","nx":""},{"r":"MK-WK-SMX-BAN-TA-3065","n":"SOHAIL MEMON","p":"8888480995","c":"TEHREEM ANSARI","f":1,"pl":"17/02/2026 00:00:00","a":"26/02/2026 00:28:56","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"no requirement","nx":""},{"r":"MK-WK-SMX-BAN-TA-3062","n":"SHANIL MOTIYANI","p":"8928190653","c":"TEHREEM ANSARI","f":1,"pl":"16/02/2026 00:00:00","a":"17/02/2026 02:13:01","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 19/02/2026 12:00\n- REMARK  : HER WIFE WENT TO GUJARAT WILL VISIT WITHIN 2/3 DAYS WHEN SHE'LL RETURN","nx":"19/02/2026 12:00:00"},{"r":"MK-WK-SMX-BAN-TA-3062","n":"SHANIL MOTIYANI","p":"8928190653","c":"TEHREEM ANSARI","f":2,"pl":"19/02/2026 11:00:00","a":"26/02/2026 03:40:18","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no. unavailable","nx":""},{"r":"MK-WK-PDX-BAN-TK-3066","n":"PRAVIN DALIYA","p":"9324086442","c":"TANYA KEDARE","f":1,"pl":"16/02/2026 00:00:00","a":"17/02/2026 02:49:26","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 18/02/2026 12:00\n- REMARK  : HE HAS A PRICING ISSUE","nx":"18/02/2026 12:00:00"},{"r":"MK-WK-PDX-BAN-TK-3066","n":"PRAVIN DALIYA","p":"9324086442","c":"TANYA KEDARE","f":2,"pl":"18/02/2026 11:00:00","a":"06/03/2026 00:15:04","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement [ close]","nx":""},{"r":"MK-WK-EPX-BAN-SV-3055","n":"EKTA PATEL","p":"9867288095","c":"SHRUTI VORA","f":1,"pl":"17/02/2026 00:00:00","a":"15/04/2026 01:58:52","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Followed up many times no requirement","nx":""},{"r":"MK-WK-MBX-BAN-TA-3054","n":"MEENAJ BHALLA","p":"9925017575","c":"TEHREEM ANSARI","f":1,"pl":"15/02/2026 00:00:00","a":"17/02/2026 02:14:10","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-ZHX-BAN-SV-3050","n":"ZUBER HAMIDANI","p":"9825219002","c":"SHRUTI VORA","f":1,"pl":"14/02/2026 00:00:00","a":"18/02/2026 22:57:22","s":"ALREADY PURCHASED FROM MK JEWELS","m":"PURCHASED + ORDER PICKUP","nx":""},{"r":"MK-WK-MBX-BAN-TA-3053","n":"MEENAJ BHALLA","p":"9925017575","c":"TEHREEM ANSARI","f":1,"pl":"14/02/2026 00:00:00","a":"14/02/2026 03:10:43","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"will visit today","nx":"14/02/2026 12:00:00"},{"r":"MK-WK-MBX-BAN-TA-3053","n":"MEENAJ BHALLA","p":"9925017575","c":"TEHREEM ANSARI","f":2,"pl":"14/02/2026 11:00:00","a":"23/02/2026 00:28:46","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"they were negotiating more on the making cahrges we offer which is not possible as per the product creftmanship and dsign","nx":""},{"r":"MK-WK-HSX-BAN-SV-3040","n":"HIYA SHARMA","p":"9870294309","c":"SHRUTI VORA","f":1,"pl":"16/02/2026 00:00:00","a":"18/02/2026 22:55:57","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 26/02/2026 11:00\n- REMARK  : WILL VISIT NEXT WEEK","nx":"26/02/2026 11:00:00"},{"r":"MK-WK-HSX-BAN-SV-3040","n":"HIYA SHARMA","p":"9870294309","c":"SHRUTI VORA","f":2,"pl":"25/02/2026 11:00:00","a":"21/02/2026 00:30:32","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 21/03/2026 11:00\n- REMARK  : Will visit after the boards exams of her children","nx":"21/03/2026 11:00"},{"r":"MK-WK-HSX-BAN-SV-3040","n":"HIYA SHARMA","p":"9870294309","c":"SHRUTI VORA","f":3,"pl":"20/03/2026 11:00:00","a":"13/05/2026 05:51:24","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"deepa maam followed up multiple times - no response","nx":""},{"r":"MK-WK-HSX-BAN-SV-3041","n":"HIYA SHARMA","p":"9870294309","c":"SHRUTI VORA","f":1,"pl":"16/02/2026 00:00:00","a":"17/02/2026 04:16:15","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"will visit after a week","nx":"24/02/2026 02:00:00"},{"r":"MK-WK-HSX-BAN-SV-3041","n":"HIYA SHARMA","p":"9870294309","c":"SHRUTI VORA","f":2,"pl":"23/02/2026 11:00:00","a":"25/03/2026 00:02:18","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer said we have changed our mind will let you know if needed anything","nx":""},{"r":"MK-WK-KTX-BAN-TA-3044","n":"KASHISH TOANI","p":"9840529303","c":"TEHREEM ANSARI","f":1,"pl":"14/02/2026 00:00:00","a":"18/02/2026 04:58:39","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-WK-MRX-BAN-SV-3039","n":"MUNTAHA ROKADIA","p":"8591271447","c":"SHRUTI VORA","f":1,"pl":"13/02/2026 00:00:00","a":"21/02/2026 00:34:56","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Customer wanted less than 1000rs making charges (purchased from another store)","nx":""},{"r":"MK-WK-SHX-ZBX-NA-3038","n":"SHAZIA HALAI","p":"9619359858","c":"ANJALI MISHRA","f":1,"pl":"15/02/2026 00:00:00","a":"04/04/2026 05:26:27","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 12/04/2026 01:00\n- REMARK  : Madam main jald se jald koshish Karti hun next week Bandra ya Andheri mein visit karne ke liye aur mujhe kuchh repairing ka bhi dena hai.","nx":"12/04/2026 01:00:00"},{"r":"MK-WK-SHX-ZBX-NA-3038","n":"SHAZIA HALAI","p":"9619359858","c":"NA","f":2,"pl":"11/04/2026 11:00:00","a":"15/04/2026 23:53:11","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 16/04/2026 07:30\n- REMARK  : Customer se abhi meri baat hui customer ne bola Ham Aaj evening tak Andheri store mein visit karenge to maine Bhoomi madam ko number aur Naam WhatsApp kar diya hai customer ka","nx":"16/04/2026 07:30"},{"r":"MK-WK-SHX-ZBX-NA-3038","n":"SHAZIA HALAI","p":"9619359858","c":"NA","f":3,"pl":"16/04/2026 11:00:00","a":"21/04/2026 03:13:05","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Madam humne already purchase kar liya hai Bandra Store se shradha mam ke pass se","nx":""},{"r":"MK-WK-RVX-BAN-TA-3030","n":"RITIK VORA","p":"9820767011","c":"TEHREEM ANSARI","f":1,"pl":"12/02/2026 00:00:00","a":"12/02/2026 00:01:21","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 19/02/2026 12:00\n- REMARK  : his mother is not keeping well will visit later","nx":"19/02/2026 12:00:00"},{"r":"MK-WK-RVX-BAN-TA-3030","n":"RITIK VORA","p":"9820767011","c":"TEHREEM ANSARI","f":2,"pl":"18/02/2026 11:00:00","a":"21/02/2026 00:56:51","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Her mother got a surgery recently so they've ditch the plan of any new purchasing","nx":""},{"r":"MK-WK-BDX-ZBX-NA-3027","n":"BHAVIKA DAGA","p":"9167231531","c":"ANJALI MISHRA","f":1,"pl":"13/02/2026 00:00:00","a":"04/04/2026 05:29:50","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Meto kush market aai thi to visit kiya tha but abhi kuch requirement nahi hai thank u so much","nx":""},{"r":"MK-WK-LDX-BAN-TA-3018","n":"LAILA DEWANI","p":"4033976100","c":"TEHREEM ANSARI","f":1,"pl":"11/02/2026 00:00:00","a":"18/02/2026 04:57:08","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"IT'S AN NRI NO. AND ALSO NOT AVAILABLE ON WHATSAPP","nx":""},{"r":"MK-WK-DKV-BAN-TK-3006","n":"DR KARISHMA VIJAN","p":"9664867411","c":"TANYA KEDARE","f":1,"pl":"11/02/2026 00:00:00","a":"18/03/2026 04:58:54","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she will let us know if she required  [close]","nx":""},{"r":"MK-WK-ATX-BAN-TK-3007","n":"AASIA TEBHALA","p":"9420340400","c":"TANYA KEDARE","f":1,"pl":"11/02/2026 00:00:00","a":"20/02/2026 00:20:44","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they went back to the kolhapur","nx":""},{"r":"MK-WK-BPX-BAN-TK-3001","n":"BHAVI PATEL","p":"9702008833","c":"TANYA KEDARE","f":1,"pl":"12/02/2026 00:00:00","a":"13/03/2026 04:36:53","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"not intrested","nx":""},{"r":"MK-WK-KPX-BAN-TK-2989","n":"KAVITA PUNJABI","p":"8779676592","c":"TANYA KEDARE","f":1,"pl":"10/02/2026 00:00:00","a":"21/02/2026 00:43:26","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"CURRENTLY SHE HAS NO REQUIREMENT BCZ SHE IS SAYING THAT GOLD RATES ARE INCREASING BUT STILL WE TOLD THEM THAT NOW ACTUALLY  ITS LESS THAN OTHER DAYS , SHE SAID TAKE A LITTLE MAKING CHARGES BUT I INFORMED HER ABOUT PINK TAG SALE OFFER FOR WOMENS DAY SO SHE WILL SURELY VISIT THEN [ CLOSE]","nx":""},{"r":"MK-WK-FMX-BAN-SV-2992","n":"FARHEEN MAKDA","p":"9821984885","c":"SHRUTI VORA","f":1,"pl":"10/02/2026 00:00:00","a":"25/02/2026 22:51:11","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement for now, will visit if needed","nx":""},{"r":"MK-WK-HUN-ZBX-NA-3003","n":"HUNEZA","p":"9324851288","c":"ANJALI MISHRA","f":1,"pl":"14/02/2026 00:00:00","a":"19/02/2026 04:28:39","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Mujha mera reparing ka chain de do .\nAbhi mujha kuch bhi nahi lena hai","nx":""},{"r":"MK-WK-JLX-BAN-SM-2991","n":"JYOTI LULLA","p":"9561674690","c":"SRAVANI MAHARANA","f":1,"pl":"08/02/2026 00:00:00","a":"09/02/2026 23:23:56","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 02/11/2026 13:00\n- REMARK  : Clint need time to think","nx":"02/11/2026 13:00:00"},{"r":"MK-WK-JLX-BAN-SM-2991","n":"JYOTI LULLA","p":"9561674690","c":"SRAVANI MAHARANA","f":2,"pl":"01/11/2026 11:00:00","a":"18/02/2026 03:26:56","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 19/02/2026 12:00\n- REMARK  : she already visited yesterday with her daughter but didnt finalize anything","nx":"19/02/2026 12:00"},{"r":"MK-WK-JLX-BAN-SM-2991","n":"JYOTI LULLA","p":"9561674690","c":"SRAVANI MAHARANA","f":3,"pl":"19/02/2026 11:00:00","a":"19/02/2026 00:48:49","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 01/03/2026 12:00\n- REMARK  : DEEPA MAAM IS IN TOUCH WITH THE CLIENT CLINT SAID SET IS GOOING OUT OF BUGET","nx":"01/03/2026 12:00"},{"r":"MK-WK-RSX-BAN-TA-2990","n":"RANI SACHDEV","p":"9321857500","c":"TEHREEM ANSARI","f":1,"pl":"11/02/2026 00:00:00","a":"26/02/2026 00:33:53","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-PSX-BAN-TA-2982","n":"PRATIMA SINGH","p":"7506673540","c":"TEHREEM ANSARI","f":1,"pl":"10/02/2026 00:00:00","a":"11/02/2026 04:04:42","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"a male received a call and said wrong no.","nx":""},{"r":"MK-WK-NSX-BAN-SM-2980","n":"NAZIA SIDDIQUE","p":"9802760242","c":"SRAVANI MAHARANA","f":1,"pl":"07/02/2026 00:00:00","a":"09/02/2026 23:22:02","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Clint gave us wrong number","nx":""},{"r":"MK-WK-NNX-ZBX-NA-2977","n":"NIKITA NARANG","p":"9637774416","c":"PRATIKSHA GOHIL","f":1,"pl":"08/02/2026 00:00:00","a":"19/02/2026 02:09:39","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer said they want to thosi antique bracelet in 5/7 grms but jo design hume chaiye tha woh aap ke pass nahi tha our mene online bhi check kiya tha but  mujhe jo chahiye tha woh mujhe tbz vapi me mil gaya thank you so much and cut the call","nx":""},{"r":"MK-WK-AKX-BAN-TA-2976","n":"ASHNA KHAMKER","p":"7021243474","c":"TEHREEM ANSARI","f":1,"pl":"08/02/2026 00:00:00","a":"13/03/2026 02:59:39","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-WK-RJX-ZBX-NA-2978","n":"REKHA JAIN","p":"9845292154","c":"PRATIKSHA GOHIL","f":1,"pl":"09/02/2026 00:00:00","a":"19/02/2026 02:03:15","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer said karnataka hubli me staying .\nJust browsing passing from market.","nx":""},{"r":"MK-WK-JKX-BAN-SM-2974","n":"JILANI KAPADIA","p":"9825206217","c":"SRAVANI MAHARANA","f":1,"pl":"06/02/2026 00:00:00","a":"06/02/2026 22:48:00","s":"ALREADY PURCHASED FROM MK JEWELS","m":"They came yesterday and placed an order","nx":""},{"r":"MK-WK-RSX-ZBX-NA-2972","n":"RIDDHI SHAH","p":"9819661981","c":"PRATIKSHA GOHIL","f":1,"pl":"10/02/2026 00:00:00","a":"06/02/2026 04:20:24","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 03/03/2026 01:00\n- REMARK  : Customer said they want to see ready Rainbow rush bracelet \nCustomer ko purchase nahi kar na hai.\nCustomer ko  rainbow Rush bracelet ka stone ka our gold weight chaiye.","nx":"03/03/2026 01:00:00"},{"r":"MK-WK-RSX-ZBX-NA-2972","n":"RIDDHI SHAH","p":"9819661981","c":"NA","f":2,"pl":"02/03/2026 11:00:00","a":"13/02/2026 00:32:02","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 21/02/2026 05:30\n- REMARK  : Customer said aap ke pass ye Rambo Rush bracelet ready me hoga to call kar na mujhe  dekh na hai otherwise let at be.","nx":"21/02/2026 05:30"},{"r":"MK-WK-RSX-ZBX-NA-2972","n":"RIDDHI SHAH","p":"9819661981","c":"NA","f":3,"pl":"20/02/2026 11:00:00","a":"11/03/2026 00:44:55","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer ne bola me aap ki Andheri store me jati rehti hu to please call kar ke mat  inform karo mujhe time milega ga to visit karungi thank you so much no call more.","nx":""},{"r":"MK-WK-ASX-BAN-TA-2967","n":"ALMAS SORETHIA","p":"6642627680","c":"TEHREEM ANSARI","f":1,"pl":"06/02/2026 00:00:00","a":"26/02/2026 00:33:05","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"invalid no.","nx":""},{"r":"MK-WK-SHU-BAN-MC-2960","n":"SHUBHAM","p":"9001355796","c":"MANALI CHAUDHARY","f":1,"pl":"07/02/2026 00:00:00","a":"07/02/2026 02:18:59","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"purchase done from other store","nx":""},{"r":"MK-WK-AGX-BAN-SD-2959","n":"AVANI GANDHI","p":"9820004622","c":"SONALI DUTTA","f":1,"pl":"07/02/2026 00:00:00","a":"06/02/2026 22:42:02","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Client said she already bought from other jewellers.","nx":""},{"r":"MK-WK-ADX-BAN-MC-2952","n":"ARIZ DAMANIA","p":"9769760903","c":"MANALI CHAUDHARY","f":1,"pl":"06/02/2026 00:00:00","a":"17/03/2026 01:50:37","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirements","nx":""},{"r":"MK-WK-ANU-BAN-SD-2948","n":"ANU","p":"9072393600","c":"SONALI DUTTA","f":1,"pl":"05/02/2026 00:00:00","a":"15/03/2026 23:59:42","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Client said no purchase plan at the moment, she will come next month","nx":""},{"r":"MK-WK-ATX-BAN-TK-2946","n":"AYUSHI THAKUR","p":"8390096709","c":"TANYA KEDARE","f":1,"pl":"02/02/2026 00:00:00","a":"21/02/2026 00:49:23","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"SHE  HAS NO REQUIREMENT at the moment bcz already purcahsed from another store but still invited her to visit the store","nx":""},{"r":"MK-WK-DKX-BAN-TK-2945","n":"DOLLY KANAL","p":"9820502694","c":"TANYA KEDARE","f":1,"pl":"04/02/2026 00:00:00","a":"19/02/2026 23:44:28","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"No requirement","nx":""},{"r":"MK-WK-DKX-BAN-TA-2942","n":"DIKSHIKA KHANNA","p":"7021322124","c":"TEHREEM ANSARI","f":1,"pl":"08/02/2026 00:00:00","a":"19/02/2026 02:01:25","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT CURRENTLY WLL VISIT IF NEEDED IN FUTURE","nx":""},{"r":"MK-WK-DMX-BAN-TA-2943","n":"DHARA MEHTA","p":"9930825360","c":"TEHREEM ANSARI","f":1,"pl":"07/02/2026 00:00:00","a":"19/02/2026 01:59:27","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"CUSTOMER HAD NO REQUIREMENT CURRENTLY WILL VISIT IF NEEDED IN FUTURE","nx":""},{"r":"MK-WK-JBX-BAN-TA-2934","n":"JINAL BORICHA","p":"9833500007","c":"TEHREEM ANSARI","f":1,"pl":"01/02/2026 00:00:00","a":"07/02/2026 02:30:27","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they visited for the second time and still demanding that ring with zero making charges","nx":""},{"r":"MK-WK-NAX-BAN-TA-2931","n":"NEHA AHUJA","p":"7224833323","c":"TEHREEM ANSARI","f":1,"pl":"03/02/2026 00:00:00","a":"17/02/2026 02:20:51","s":"ALREADY PURCHASED FROM MK JEWELS","m":"PURCHASED","nx":""},{"r":"MK-NWK-STE-BAN-TA-1657","n":"steve","p":"4166025077","c":"TEHREEM ANSARI","f":1,"pl":"03/02/2026 00:00:00","a":"05/02/2026 03:53:20","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-NWK-TEH-ZBX-NA-1658","n":"Tehseen","p":"9769166317","c":"ANJALI MISHRA","f":1,"pl":"30/01/2026 12:07:00","a":"20/02/2026 02:52:36","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Not interested","nx":""},{"r":"MK-NWK-RRX-ZBX-NA-1649","n":"Rehana Radiawala","p":"9321361938","c":"ANJALI MISHRA","f":1,"pl":"29/01/2026 00:00:00","a":"09/04/2026 04:53:24","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer ne bola main Kuwait mein shift ho gayi hoon.\nThank you","nx":""},{"r":"MK-NWK-JBX-BAN-TA-1647","n":"jinal boricha","p":"9833500007","c":"TEHREEM ANSARI","f":1,"pl":"31/01/2026 00:00:00","a":"05/02/2026 03:56:34","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer came for the second time but still wanted the product without making charges however our costing is 26,500 the best we gave was 29,500","nx":""},{"r":"MK-NWK-FMX-BAN-SV-1644","n":"Farzin mithaiwala","p":"7984065533","c":"SHRUTI VORA","f":1,"pl":"29/01/2026 00:00:00","a":"03/03/2026 22:16:04","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer stays in surat, no requirment for now will visit in future if needed","nx":""},{"r":"MK-NWK-FGX-BAN-SV-1650","n":"Foram Ghani","p":"7977450678","c":"SHRUTI VORA","f":1,"pl":"30/01/2026 00:00:00","a":"25/02/2026 23:05:49","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"ring she liked was not in the budget , purchased from other store","nx":""},{"r":"MK-NWK-TRX-BAN-TK-1641","n":"Tanya rohira","p":"9987578888","c":"TANYA KEDARE","f":1,"pl":"28/01/2026 19:56:00","a":"31/01/2026 06:19:29","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"HER WEDDING IS TODAY AND SHE BOUGHT IT FROM ANOTHER STORE","nx":""},{"r":"MK-NWK-DLX-BAN-TK-1637","n":"DIVYA LIHANI","p":"919819473377","c":"TANYA KEDARE","f":1,"pl":"28/01/2026 17:53:00","a":"20/02/2026 00:40:52","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement at the moment , otherwise they r our old customer ,they make purchases  from us only","nx":""},{"r":"MK-NWK-MIT-ZBX-NA-1633","n":"Mitali","p":"7821232609","c":"ANJALI MISHRA","f":1,"pl":"27/01/2026 00:00:00","a":"21/03/2026 04:04:50","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Wrong number hai","nx":""},{"r":"MK-NWK-JGX-BAN-SM-1630","n":"Jyoti gupta","p":"9930813081","c":"SRAVANI MAHARANA","f":1,"pl":"30/01/2026 00:00:00","a":"30/01/2026 02:44:07","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 05/03/2026 12:00\n- REMARK  : THEY ARE BUSY NOW A DAYS THEY WILL COME BY FEB START","nx":"05/03/2026 12:00:00"},{"r":"MK-NWK-JGX-BAN-SM-1630","n":"Jyoti gupta","p":"9930813081","c":"SRAVANI MAHARANA","f":2,"pl":"04/03/2026 11:00:00","a":"06/02/2026 05:33:38","s":"ALREADY PURCHASED FROM MK JEWELS","m":"They came today and placed order","nx":""},{"r":"MK-NWK-SSX-BAN-SV-1628","n":"Shreeya shetty","p":"9819397496","c":"SHRUTI VORA","f":1,"pl":"27/01/2026 20:09:00","a":"14/03/2026 00:26:07","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"purshased","nx":""},{"r":"MK-NWK-FBX-BAN-TK-1629","n":"falguni bhodia","p":"9821581844","c":"TANYA KEDARE","f":1,"pl":"27/01/2026 19:54:00","a":"28/01/2026 00:36:02","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 02/02/2026 12:00\n- REMARK  : she said she will visit next week","nx":"02/02/2026 12:00:00"},{"r":"MK-NWK-FBX-BAN-TK-1629","n":"falguni bhodia","p":"9821581844","c":"TANYA KEDARE","f":2,"pl":"01/02/2026 11:00:00","a":"05/02/2026 23:27:14","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she said whenever i'll have a requirement,  i will surely visit your store, thankyou for calling us","nx":""},{"r":"MK-NWK-TRX-BAN-TK-1625","n":"tanya rohira","p":"9987578888","c":"TANYA KEDARE","f":1,"pl":"27/01/2026 17:45:00","a":"05/02/2026 23:33:19","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"her wedding is done","nx":""},{"r":"MK-NWK-POO-BAN-SV-1621","n":"Pooja","p":"12673866955","c":"SHRUTI VORA","f":1,"pl":"26/01/2026 00:00:00","a":"14/03/2026 00:24:42","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirment for now","nx":""},{"r":"MK-NWK-DRX-LOK-NA-1619","n":"Deepti Raina","p":"99873 07771","c":"BHOOMI BHAGAT","f":1,"pl":"26/01/2026 00:00:00","a":"02/04/2026 03:34:13","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Already purchased at andheri branch","nx":""},{"r":"MK-NWK-BVX-BAN-TK-1617","n":"BHUMIKA VERMA","p":"9969128218","c":"TANYA KEDARE","f":1,"pl":"26/01/2026 20:24:00","a":"14/03/2026 07:05:03","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she will come to explore pink tag product","nx":""},{"r":"MK-NWK-SBX-LOK-NA-1620","n":"Santosh bang","p":"9322227040","c":"POOJA SHIGWAN","f":1,"pl":"18/02/2026 00:00:00","a":"25/03/2026 00:00:33","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Mk bandra store se purchase kiya","nx":""},{"r":"MK-NWK-MBG-LOK-NA-1608","n":"Mohammed Bilal  gahanchi","p":"7204545099","c":"BHOOMI BHAGAT","f":1,"pl":"26/01/2026 14:32:00","a":"02/04/2026 03:48:24","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Purchased at other shop","nx":""},{"r":"MK-NWK-AJX-BAN-SV-1606","n":"Afreen jumani","p":"9920274874","c":"SHRUTI VORA","f":1,"pl":"25/01/2026 20:32:00","a":"15/03/2026 02:42:57","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement for now will visit if needed","nx":""},{"r":"MK-NWK-TDX-BAN-SM-1605","n":"Tehseen Darvesh","p":"9769166317","c":"SRAVANI MAHARANA","f":1,"pl":"26/01/2026 00:00:00","a":"19/02/2026 01:57:26","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Clint gave us the non existing number","nx":""},{"r":"MK-NWK-MBX-BAN-TK-1607","n":"Mohammed bilal","p":"7204545099","c":"TANYA KEDARE","f":1,"pl":"25/01/2026 19:08:00","a":"18/02/2026 05:12:02","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"ALREADY PURCHASED FROM ANOTHER JWELLER , IN FUTURE  THEY WILL CONSIDER US THEY SAID [ CLOSE]","nx":""},{"r":"MK-NWK-VCX-BAN-TA-1603","n":"varsha chheder","p":"9987013967","c":"TEHREEM ANSARI","f":1,"pl":"27/01/2026 00:00:00","a":"19/02/2026 01:56:56","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NOT INTERS","nx":""},{"r":"MK-NWK-HGX-ZBX-NA-1602","n":"Hetal Gala","p":"9076137666","c":"ANJALI MISHRA","f":1,"pl":"25/01/2026 16:06:00","a":"06/02/2026 05:51:50","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Papa na dusra jagha sa liya","nx":""},{"r":"MK-NWK-SKX-ZBX-NA-1599","n":"Sachal kabra","p":"9987319644","c":"ANJALI MISHRA","f":1,"pl":"26/01/2026 00:00:00","a":"20/03/2026 23:30:50","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Requirement complete","nx":""},{"r":"MK-NWK-JVX-ZBX-NA-1586","n":"Jyoti vijan","p":"9920342350","c":"PRATIKSHA GOHIL","f":1,"pl":"24/01/2026 16:15:00","a":"06/02/2026 04:34:35","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Customer said we are not your regular customer we are just browsing because some one told me that ways we visit.","nx":""},{"r":"MK-NWK-TGX-BAN-TK-1583","n":"Tasneem gheewala","p":"9820495281","c":"TANYA KEDARE","f":1,"pl":"24/01/2026 00:00:00","a":"13/03/2026 04:32:07","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-NWK-KKX-LOK-NA-1579","n":"Kiran kunwar","p":"9820666333","c":"BHOOMI BHAGAT","f":1,"pl":"23/01/2026 09:05:00","a":"25/03/2026 06:26:17","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Not at this moment","nx":""},{"r":"MK-NWK-RBX-BAN-SV-1577","n":"renu bajaj","p":"7498696800","c":"SHRUTI VORA","f":1,"pl":"23/01/2026 20:24:00","a":"27/01/2026 23:38:14","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Purchased from MK","nx":""},{"r":"MK-NWK-SJX-BAN-SV-1573","n":"sonal jain","p":"9821029215","c":"SHRUTI VORA","f":1,"pl":"05/02/2026 00:00:00","a":"15/04/2026 02:00:50","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-NWK-DTX-LOK-NA-1572","n":"Dimple thagani","p":"9820474574","c":"POOJA SHIGWAN","f":1,"pl":"24/01/2026 00:00:00","a":"25/03/2026 00:02:17","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer was not interested","nx":""},{"r":"MK-NWK-SPX-BAN-TA-1565","n":"sageer patel","p":"9320792977","c":"TEHREEM ANSARI","f":1,"pl":"22/01/2026 15:10:00","a":"18/02/2026 22:38:53","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"CUSTOMER SAID WE DO HAD A UPCOMING WEDDING IN DECEMBER WE'LL VISIT PROBABLY AFTER RAMAZAN","nx":""},{"r":"MK-NWK-BAX-LOK-NA-1560","n":"Bhavna Ambani","p":"8369856585","c":"BHOOMI BHAGAT","f":1,"pl":"22/01/2026 12:57:00","a":"02/04/2026 03:52:00","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"They are not in Mumbai they want ready Mangal sutra delicate regular used...we show u on video cal at bandra also not like any design","nx":""},{"r":"MK-NWK-ISX-BAN-TK-1556","n":"Ishwar soor","p":"9082973436","c":"TANYA KEDARE","f":1,"pl":"21/01/2026 20:06:00","a":"20/02/2026 00:35:31","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"already purchased from their family jweller","nx":""},{"r":"MK-NWK-KNX-BAN-SM-1551","n":"kamal narayan","p":"7385285180","c":"SRAVANI MAHARANA","f":1,"pl":"21/01/2026 00:00:00","a":"22/01/2026 00:41:13","s":"ALREADY PURCHASED FROM MK JEWELS","m":"they purchased from us","nx":""},{"r":"MK-NWK-SON-ZBX-NA-1550","n":"Sonal","p":"9322244634","c":"ANJALI MISHRA","f":1,"pl":"21/01/2026 13:28:00","a":"06/02/2026 05:53:22","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Andheri sunil jewellers sa liya haamna","nx":""},{"r":"MK-NWK-MAN-LOK-NA-1558","n":"Manish","p":"9986692497","c":"BHOOMI BHAGAT","f":1,"pl":"21/01/2026 00:50:00","a":"02/04/2026 04:31:19","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-NWK-ASX-LOK-NA-1557","n":"Alzara sheikh","p":"9867805136","c":"VIKAS GAUTAM","f":1,"pl":"31/01/2026 00:00:00","a":"18/05/2026 05:31:26","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"She said main apni mumma se puch ke batati hu abhi to hum kuch plan nahi kar Rahe hai","nx":""},{"r":"MK-NWK-DCX-BAN-SV-1546","n":"Deepa Chanchlani","p":"7066622088","c":"SHRUTI VORA","f":1,"pl":"20/01/2026 20:07:00","a":"24/01/2026 04:37:21","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer was looking for gifting purpose but she told she had given cash instead of Bracelet ( convo with archana maam)","nx":""},{"r":"MK-NWK-RGX-LOK-NA-1543","n":"Renu gwalani","p":"9920091370","c":"BHOOMI BHAGAT","f":1,"pl":"21/01/2026 00:00:00","a":"06/04/2026 07:14:28","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-NWK-ILX-BAN-TK-1545","n":"ishika lund","p":"7066622088","c":"TANYA KEDARE","f":1,"pl":"20/01/2026 18:57:00","a":"23/01/2026 00:29:24","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 24/01/2026 01:00\n- REMARK  : she disconnected the call while introducation","nx":"24/01/2026 01:00:00"},{"r":"MK-NWK-ILX-BAN-TK-1545","n":"ishika lund","p":"7066622088","c":"TANYA KEDARE","f":2,"pl":"24/01/2026 11:00:00","a":"23/01/2026 01:32:34","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 24/01/2026 01:00\n- REMARK  : she declined the call while giving introduction","nx":"24/01/2026 01:00"},{"r":"MK-NWK-ILX-BAN-TK-1545","n":"ishika lund","p":"7066622088","c":"TANYA KEDARE","f":3,"pl":"24/01/2026 11:00:00","a":"25/02/2026 04:46:13","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"purcahsed from another jwellers and her wdding is also done so no requirement [ close]","nx":""},{"r":"MK-NWK-RAX-BAN-SM-1540","n":"rehnuma abdulla","p":"971585786925","c":"SRAVANI MAHARANA","f":1,"pl":"22/01/2026 00:00:00","a":"09/02/2026 23:25:28","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Costumer said they just came for 1 gram gold coin they don't need any jewellery at the moment","nx":""},{"r":"MK-NWK-PKX-BAN-TA-1538","n":"pallavi khanchandani","p":"9730634560","c":"TEHREEM ANSARI","f":1,"pl":"20/01/2026 00:00:00","a":"22/01/2026 23:12:17","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 26/01/2026 12:00\n- REMARK  : she said her parents might visit today coz she is busy in another wedding, if not possible today will come within a week","nx":"26/01/2026 12:00:00"},{"r":"MK-NWK-PKX-BAN-TA-1538","n":"pallavi khanchandani","p":"9730634560","c":"TEHREEM ANSARI","f":2,"pl":"25/01/2026 11:00:00","a":"28/01/2026 03:18:31","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased","nx":""},{"r":"MK-NWK-SCX-BAN-TK-1536","n":"Sneha chanjagani","p":"8849233206","c":"TANYA KEDARE","f":1,"pl":"20/01/2026 14:40:00","a":"23/02/2026 00:19:53","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"currently she have no requirement  , in future if they want to purchase they will visit","nx":""},{"r":"MK-NWK-SNX-LOK-NA-1537","n":"Simran nichani","p":"9930563532","c":"POOJA SHIGWAN","f":1,"pl":"20/01/2026 14:24:00","a":"25/03/2026 00:03:48","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Other store se purchase kiya","nx":""},{"r":"MK-NWK-RPX-BAN-SM-1535","n":"Rajesh patel","p":"14074351133","c":"SRAVANI MAHARANA","f":1,"pl":"20/01/2026 00:00:00","a":"19/02/2026 02:01:32","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"They are out of India wherever they'll visit they'll come","nx":""},{"r":"MK-NWK-DRX-BAN-TK-1532","n":"Dimple ramchandani","p":"9701561725","c":"TANYA KEDARE","f":1,"pl":"19/01/2026 19:07:00","a":"23/01/2026 00:19:23","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 25/01/2026 01:00\n- REMARK  : she said she is sick her uncle is going to visit the store we need to folllow up her uncle bcz she said that contact with my uncle","nx":"25/01/2026 01:00:00"},{"r":"MK-NWK-DRX-BAN-TK-1532","n":"Dimple ramchandani","p":"9701561725","c":"TANYA KEDARE","f":2,"pl":"25/01/2026 11:00:00","a":"23/01/2026 00:31:54","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 24/01/2026 01:00\n- REMARK  : she said she is sick , so call her uncle bcz he is going to visit the store","nx":"24/01/2026 01:00"},{"r":"MK-NWK-DRX-BAN-TK-1532","n":"Dimple ramchandani","p":"9701561725","c":"TANYA KEDARE","f":3,"pl":"24/01/2026 11:00:00","a":"18/03/2026 04:59:55","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"called her more than 3/4 times , she is declining the call [ close]","nx":""},{"r":"MK-NWK-JTX-LOK-NA-1525","n":"Juveria TAUFfique","p":"9819876333","c":"BHOOMI BHAGAT","f":1,"pl":"19/01/2026 00:00:00","a":"15/05/2026 03:37:12","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-NWK-ASX-LOK-NA-1516","n":"Aniket Singh","p":"9326547550","c":"VIKAS GAUTAM","f":1,"pl":"20/01/2026 00:00:00","a":"27/04/2026 06:17:14","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"No requirenment","nx":""},{"r":"MK-NWK-STX-BAN-SM-1519","n":"swati thakkar","p":"9727878505","c":"SRAVANI MAHARANA","f":1,"pl":"19/01/2026 00:00:00","a":"18/01/2026 22:34:56","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"CLIENT SAID SHE DONT NEED ANY FOLLOW-UP SHE WILL INFORM US WHEN SHE WILL BE COMING STRICTLY NO FOLLOW-UP","nx":""},{"r":"MK-NWK-SHX-BAN-TA-1524","n":"sharmina hamid","p":"9619502297","c":"TEHREEM ANSARI","f":1,"pl":"22/01/2026 00:00:00","a":"23/02/2026 00:37:25","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"called and texted the client more than 5 times still no response","nx":""},{"r":"MK-NWK-ABX-BAN-TA-1529","n":"abhishek bharara","p":"9930585957","c":"TEHREEM ANSARI","f":1,"pl":"19/01/2026 00:00:00","a":"18/01/2026 23:09:47","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 25/01/2026 12:00\n- REMARK  : Hung up the call without having a word","nx":"25/01/2026 12:00:00"},{"r":"MK-NWK-ABX-BAN-TA-1529","n":"abhishek bharara","p":"9930585957","c":"TEHREEM ANSARI","f":2,"pl":"24/01/2026 11:00:00","a":"24/01/2026 00:22:50","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased","nx":""},{"r":"MK-NWK-RCX-BAN-TK-1506","n":"ravina chawla","p":"7030266600","c":"TANYA KEDARE","f":1,"pl":"18/01/2026 19:19:00","a":"22/01/2026 23:05:38","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"her friend purchased from other store","nx":""},{"r":"MK-NWK-NJX-BAN-TK-1505","n":"Nadiya JEWAni","p":"9769040306","c":"TANYA KEDARE","f":1,"pl":"18/01/2026 17:39:00","a":"19/02/2026 23:42:00","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"She lost her earring so she came before but at the moment she don't have any requirement but surely she visit to explore the store [ close]","nx":""},{"r":"MK-NWK-PBX-LOK-NA-1500","n":"Pranav bothra","p":"9578056789","c":"BHOOMI BHAGAT","f":1,"pl":"18/01/2026 15:10:00","a":"25/03/2026 06:24:08","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"He is Jewellers","nx":""},{"r":"MK-NWK-DBX-LOK-NA-1511","n":"Dawood bhura","p":"9829142492","c":"POOJA SHIGWAN","f":1,"pl":"18/01/2026 00:00:00","a":"25/03/2026 00:05:10","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Other jewellers se purchase kiya","nx":""},{"r":"MK-NWK-KJX-BAN-SM-1494","n":"Kiran jogra","p":"7715014383","c":"SRAVANI MAHARANA","f":1,"pl":"17/01/2026 00:00:00","a":"24/01/2026 01:50:52","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased from us","nx":""},{"r":"MK-NWK-SCX-ZBX-NA-1490","n":"Seema chouhan","p":"9867672555","c":"ANJALI MISHRA","f":1,"pl":"17/01/2026 17:10:00","a":"21/03/2026 04:02:41","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Abhi kuch nahi chahiye requirement complete.phir offer baariya wo kuch aaye ga","nx":""},{"r":"MK-NWK-SJX-ZBX-NA-1489","n":"Sangeeta jain","p":"9819579295","c":"PRATIKSHA GOHIL","f":1,"pl":"17/01/2026 16:45:00","a":"19/02/2026 00:53:40","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Just We are browsing because I am also jewellers  sorry and cut the call not requirement.","nx":""},{"r":"MK-NWK-AMX-BAN-TK-1485","n":"Ankita mahipal","p":"9323272696","c":"TANYA KEDARE","f":1,"pl":"17/01/2026 14:59:00","a":"16/01/2026 04:20:11","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 23/01/2026 02:00\n- REMARK  : Customer is busy with an event and will visit the Bandra store next Sunday (25/01/2026) to discuss making charges, GST, and stone charges.","nx":"23/01/2026 02:00:00"},{"r":"MK-NWK-AMX-BAN-TK-1485","n":"Ankita mahipal","p":"9323272696","c":"TANYA KEDARE","f":2,"pl":"22/01/2026 11:00:00","a":"22/01/2026 22:56:52","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she had a conversation with neelam mam , currently she have no requirement,  also his husband is not oky right now and they are looking for plain gold which we dont keep they want  only for a investment purpose","nx":""},{"r":"MK-NWK-NSX-BAN-SM-1493","n":"Neetu santani","p":"9867376687","c":"SRAVANI MAHARANA","f":1,"pl":"17/01/2026 14:39:00","a":"17/01/2026 00:57:30","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"she will visit lokhand wala store after 2 days means on monday 19th jan","nx":"19/01/2026 11:00:00"},{"r":"MK-NWK-NSX-BAN-SM-1493","n":"Neetu santani","p":"9867376687","c":"SRAVANI MAHARANA","f":2,"pl":"19/01/2026 11:00:00","a":"21/02/2026 02:08:02","s":"ALREADY PURCHASED FROM MK JEWELS","m":"thay placed order from lokhandwala store","nx":""},{"r":"MK-NWK-NSX-LOK-NA-1496","n":"Neetu santani","p":"9867376687","c":"POOJA SHIGWAN","f":1,"pl":"16/01/2026 00:00:00","a":"25/03/2026 00:06:30","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Bandra store se purchase kiya","nx":""},{"r":"MK-NWK-YNX-BAN-SV-1484","n":"Yash Narayan","p":"8879603150","c":"SHRUTI VORA","f":1,"pl":"16/01/2026 20:49:00","a":"19/01/2026 00:12:14","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer said no requirement for now","nx":""},{"r":"MK-NWK-KMX-LOK-NA-1481","n":"Kajal mulchandani","p":"9987451590","c":"BHOOMI BHAGAT","f":1,"pl":"17/01/2026 00:00:00","a":"18/01/2026 01:52:40","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 20/01/2026 02:00\n- REMARK  : Client little busy as per her scdule she will visit.","nx":"20/01/2026 02:00:00"},{"r":"MK-NWK-KMX-LOK-NA-1481","n":"Kajal mulchandani","p":"9987451590","c":"NA","f":2,"pl":"20/01/2026 11:00:00","a":"15/05/2026 03:40:11","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-NWK-MDX-BAN-SM-1477","n":"MALINI DAVE","p":"01 224 623 1316","c":"SRAVANI MAHARANA","f":1,"pl":"18/01/2026 00:00:00","a":"17/01/2026 00:47:28","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer is currently working on a budget so she said she'll  come once she is stable with her budget","nx":""},{"r":"MK-NWK-RPX-LOK-NA-1480","n":"Rima PUNJAWANI","p":"9819065931","c":"POOJA SHIGWAN","f":1,"pl":"16/01/2026 14:33:00","a":"15/05/2026 04:17:53","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-NWK-GSX-LOK-NA-1472","n":"Gurpreet suri","p":"9892075890","c":"BHOOMI BHAGAT","f":1,"pl":"15/01/2026 10:37:00","a":"02/04/2026 04:26:43","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-NWK-SSX-BAN-TA-1468","n":"sohail sawani","p":"9825640584","c":"TEHREEM ANSARI","f":1,"pl":"15/01/2026 00:00:00","a":"15/01/2026 04:05:07","s":"ALREADY PURCHASED FROM MK JEWELS","m":"PURCHASED","nx":""},{"r":"MK-NWK-AKX-BAN-TK-1464","n":"Aleena khatib","p":"9503676092","c":"TANYA KEDARE","f":1,"pl":"15/01/2026 15:40:00","a":"18/03/2026 05:01:00","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"followed up many times , not answering the call","nx":""},{"r":"MK-NWK-PFX-ZBX-NA-1467","n":"Priti fala","p":"9930450635","c":"ANJALI MISHRA","f":1,"pl":"15/01/2026 15:05:00","a":"19/02/2026 04:10:16","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Mai na wo din he le liya tha aapko last time boli to","nx":""},{"r":"MK-NWK-ZSX-BAN-TA-1462","n":"ZARA SIDDIQUE","p":"9819252667","c":"TEHREEM ANSARI","f":1,"pl":"16/01/2026 00:00:00","a":"19/02/2026 01:54:05","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-NWK-ESX-BAN-TA-1460","n":"ESHMEET SIAN","p":"9892588889","c":"TEHREEM ANSARI","f":1,"pl":"22/01/2026 00:00:00","a":"24/01/2026 02:23:31","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer said currently she doesn't need the ring whenever she want she'll reach out to us","nx":""},{"r":"MK-NWK-FGX-LOK-NA-1457","n":"Foramen Gani","p":"7977450678","c":"BHOOMI BHAGAT","f":1,"pl":"16/01/2026 00:00:00","a":"02/04/2026 04:40:16","s":"RINGING / NOT ANSWERED","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-NWK-AJX-BAN-SV-1456","n":"Ali junaid","p":"9930287723","c":"SHRUTI VORA","f":1,"pl":"15/01/2026 00:00:00","a":"24/01/2026 03:00:50","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 26/01/2026 01:00\n- REMARK  : Customer will visit on Monday","nx":"26/01/2026 01:00:00"},{"r":"MK-NWK-AJX-BAN-SV-1456","n":"Ali junaid","p":"9930287723","c":"SHRUTI VORA","f":2,"pl":"26/01/2026 11:00:00","a":"18/02/2026 22:54:21","s":"ALREADY PURCHASED FROM MK JEWELS","m":"PURCHASED DIAMOND BRACELET","nx":""},{"r":"MK-NWK-DJX-ZBX-NA-1459","n":"Deepchand jewellers","p":"7700024191","c":"ANJALI MISHRA","f":1,"pl":"14/01/2026 15:05:00","a":"19/02/2026 04:38:58","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Ram sir na na bola hai call karna \n\nCall pe ya bola ki requirement complete","nx":""},{"r":"MK-NWK-PSX-LOK-NA-1452","n":"Preeya shah","p":"7738370101","c":"POOJA SHIGWAN","f":1,"pl":"13/01/2026 00:00:00","a":"13/03/2026 04:59:49","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Purchase kiya other jewels se","nx":""},{"r":"MK-NWK-RMX-BAN-TA-1449","n":"reshma memon","p":"9870666936","c":"TEHREEM ANSARI","f":1,"pl":"13/01/2026 00:00:00","a":"13/01/2026 22:52:42","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 18/01/2026 12:00\n- REMARK  : client ask ony message no call to me","nx":"18/01/2026 12:00:00"},{"r":"MK-NWK-RMX-BAN-TA-1449","n":"reshma memon","p":"9870666936","c":"TEHREEM ANSARI","f":2,"pl":"17/01/2026 11:00:00","a":"15/01/2026 00:34:13","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 20/01/2026 12:00\n- REMARK  : customer strictly ask no call only text as I usually be busy","nx":"20/01/2026 12:00"},{"r":"MK-NWK-RMX-BAN-TA-1449","n":"reshma memon","p":"9870666936","c":"TEHREEM ANSARI","f":3,"pl":"19/01/2026 11:00:00","a":"23/02/2026 00:24:22","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-NWK-INS-ZBX-NA-1443","n":"Inshaa","p":"9702300370","c":"PRATIKSHA GOHIL","f":1,"pl":"13/01/2026 17:55:00","a":"20/03/2026 01:22:24","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer africa se aai the mene 3/5 call kiya hai but pickup nahi kar rhe hai","nx":""},{"r":"MK-NWK-DSX-BAN-TA-1436","n":"dipti shah","p":"6352091923","c":"TEHREEM ANSARI","f":1,"pl":"13/01/2026 00:00:00","a":"19/02/2026 01:52:31","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-NWK-SJX-BAN-SV-1432","n":"sugandh jain","p":"9920809375","c":"SHRUTI VORA","f":1,"pl":"25/01/2026 00:00:00","a":"18/01/2026 23:45:26","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she just came to explore the collection no requirement for now","nx":""},{"r":"MK-NWK-ALX-BAN-SM-1430","n":"Arva lakdawala","p":"9833232152","c":"SRAVANI MAHARANA","f":1,"pl":"12/01/2026 00:00:00","a":"14/01/2026 04:31:23","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they gave there product for melting and now asking when they will get it back","nx":""},{"r":"MK-NWK-MKX-BAN-TK-1426","n":"Mehzabeen Kapadia","p":"9167378090","c":"TANYA KEDARE","f":1,"pl":"11/01/2026 18:11:00","a":"23/01/2026 00:09:16","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they came here only for their repair pickup nnot for any purchase","nx":""},{"r":"MK-NWK-JLX-LOK-NA-1424","n":"Jyoti lopes","p":"9870251922","c":"BHOOMI BHAGAT","f":1,"pl":"11/01/2026 17:20:00","a":"02/04/2026 04:22:54","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Client want plain sets kalkatti work purchased some other shop","nx":""},{"r":"MK-NWK-RDX-LOK-NA-1421","n":"Ritika Darekas","p":"7776910486","c":"VIKAS GAUTAM","f":1,"pl":"12/01/2026 00:00:00","a":"23/02/2026 01:09:13","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Already purchase","nx":""},{"r":"MK-NWK-SZX-BAN-TK-1419","n":"Siya zende","p":"7710984409","c":"TANYA KEDARE","f":1,"pl":"11/01/2026 15:14:00","a":"19/02/2026 23:39:47","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Its her parents anniversary so she already purchased from another store","nx":""},{"r":"MK-NWK-AKX-BAN-TK-1414","n":"Anita khatri","p":"9405556135","c":"TANYA KEDARE","f":1,"pl":"10/01/2026 19:40:00","a":"11/01/2026 23:23:27","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 12/02/2026 12:00\n- REMARK  : She resides in Sangli and has returned to her village. She did not make a purchase during this visit and mentioned that she might consider it when she plans to visit Mumbai again next month.","nx":"12/02/2026 12:00:00"},{"r":"MK-NWK-AKX-BAN-TK-1414","n":"Anita khatri","p":"9405556135","c":"TANYA KEDARE","f":2,"pl":"11/02/2026 11:00:00","a":"25/02/2026 04:43:46","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement right now and stays in sangli","nx":""},{"r":"MK-NWK-CKX-BAN-TK-1407","n":"CHANDA KHATOR","p":"9937099440","c":"TANYA KEDARE","f":1,"pl":"10/01/2026 17:21:00","a":"15/01/2026 22:19:42","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they are from odisa so they went back to odisa","nx":""},{"r":"MK-NWK-RJX-ZBX-NA-1406","n":"Reena jain","p":"9824008857","c":"PRATIKSHA GOHIL","f":1,"pl":"10/01/2026 17:10:00","a":"19/02/2026 01:57:58","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer said kisine aap ko wrong number diya hai me Reena jain nahi hu  sorry and cut the call.","nx":""},{"r":"MK-NWK-SHX-BAN-TA-1409","n":"SANAM HARCHANDANI","p":"8888444400","c":"TEHREEM ANSARI","f":1,"pl":"12/01/2026 00:00:00","a":"17/01/2026 23:39:33","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Neither required the piece they shortlist last time nor any other requirement","nx":""},{"r":"MK-NWK-DSX-BAN-SM-1410","n":"Drishti seth","p":"9372704482","c":"SRAVANI MAHARANA","f":1,"pl":"10/01/2026 00:00:00","a":"14/01/2026 04:35:12","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 15/01/2026 12:00\n- REMARK  : she said she is looking in other stores too she will let us know when she will be coming","nx":"15/01/2026 12:00:00"},{"r":"MK-NWK-DSX-BAN-SM-1410","n":"Drishti seth","p":"9372704482","c":"SRAVANI MAHARANA","f":2,"pl":"15/01/2026 11:00:00","a":"19/02/2026 02:03:32","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Costumer purchased from Kalyan Jewellers","nx":""},{"r":"MK-NWK-ZEM-LOK-NA-1416","n":"Zemani","p":"8976065816","c":"POOJA SHIGWAN","f":1,"pl":"10/01/2026 00:00:00","a":"02/06/2026 03:47:51","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"WANT PLAIN GOLD","nx":""},{"r":"MK-NWK-AFS-LOK-NA-1389","n":"Afsheen zehra","p":"9568324988","c":"BHOOMI BHAGAT","f":1,"pl":"08/01/2026 00:00:00","a":"14/01/2026 04:03:24","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"She want kalkati design bangles Plain gold so we r not going for Plain gold","nx":""},{"r":"MK-NWK-HJX-JBX-NA-1397","n":"Heena johari","p":"9930484408","c":"PRATIKSHA GOHIL","f":1,"pl":"09/01/2026 00:00:00","a":"06/02/2026 04:49:17","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 14/02/2026 01:30\n- REMARK  : Thoda rate stable ho ne do fi to kuch soch paaenge.","nx":"14/02/2026 01:30:00"},{"r":"MK-NWK-HJX-JBX-NA-1397","n":"Heena johari","p":"9930484408","c":"NA","f":2,"pl":"13/02/2026 11:00:00","a":"13/02/2026 00:35:48","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 27/02/2026 04:30\n- REMARK  : Customer ne bola ki right now I have some work will visit as soon as possible thank you","nx":"27/02/2026 04:30"},{"r":"MK-NWK-HJX-JBX-NA-1397","n":"Heena johari","p":"9930484408","c":"NA","f":3,"pl":"26/02/2026 11:00:00","a":"20/03/2026 00:58:18","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer ne bola ki mujhe jo design pasand hai\nwoh ho leni hai our order se nahi banana hay thank you","nx":""},{"r":"MK-NWK-AMX-BAN-SV-1402","n":"anu motiwala","p":"9825564555","c":"SHRUTI VORA","f":1,"pl":"10/01/2026 00:00:00","a":"22/01/2026 00:50:12","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer said to not call her \nIf she wants to purchase anything she will visit\nCustomer is irritated by the repetitive calls","nx":""},{"r":"MK-NWK-MJX-JBX-NA-1398","n":"Manisha jain","p":"8898838000","c":"ANJALI MISHRA","f":1,"pl":"09/01/2026 17:30:00","a":"06/02/2026 05:25:35","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 16/02/2026 02:00\n- REMARK  : New design aaya to call karna","nx":"16/02/2026 02:00:00"},{"r":"MK-NWK-MJX-JBX-NA-1398","n":"Manisha jain","p":"8898838000","c":"NA","f":2,"pl":"15/02/2026 11:00:00","a":"20/02/2026 02:54:30","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Mai na le liya hai allready","nx":""},{"r":"MK-NWK-VAX-BAN-TA-1391","n":"Vinay agrawal","p":"993730222","c":"TEHREEM ANSARI","f":1,"pl":"09/01/2026 14:30:00","a":"17/01/2026 23:55:59","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased","nx":""},{"r":"MK-NWK-MKX-LOK-NA-1380","n":"Mitesh kalthe","p":"9833484204","c":"BHOOMI BHAGAT","f":1,"pl":"09/01/2026 00:00:00","a":"15/01/2026 02:53:25","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 17/01/2026 02:00\n- REMARK  : We give her best price and total details in WhatsApp. She want to sold  old earing we have check purity very less she don't want to melt this earing..so she think and decide","nx":"17/01/2026 02:00:00"},{"r":"MK-NWK-MKX-LOK-NA-1380","n":"Mitesh kalthe","p":"9833484204","c":"NA","f":2,"pl":"17/01/2026 11:00:00","a":"02/04/2026 03:56:47","s":"RINGING / NOT ANSWERED","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-NWK-RPX-JBX-NA-1370","n":"Rupal parmar","p":"9969758751","c":"PRATIKSHA GOHIL","f":1,"pl":"08/01/2026 17:55:00","a":"19/02/2026 01:55:43","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer said Abhi hi  hum town puche hai 1 month se town nahi they. \nPuch hoga to visit karenge please call kiya isliye thank you but hoga to visit karenge other ways please no call from your side se because we are also jewellers.","nx":""},{"r":"MK-NWK-DRX-LOK-NA-1362","n":"Deepti Raina","p":"998730771","c":"BHOOMI BHAGAT","f":1,"pl":"09/01/2026 00:00:00","a":"15/05/2026 03:37:38","s":"ALREADY PURCHASED FROM MK JEWELS","m":"ALREADY PURCHASED","nx":""},{"r":"MK-NWK-SHX-LOK-NA-1361","n":"Sapna harchandani","p":"9029884587","c":"BHOOMI BHAGAT","f":1,"pl":"09/01/2026 00:00:00","a":"02/04/2026 04:34:43","s":"RINGING / NOT ANSWERED","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : NO (CLIENT NOT USING WHATSAPP)","nx":""},{"r":"MK-NWK-DRX-LOK-NA-1360","n":"Deepti Raina","p":"998730771","c":"BHOOMI BHAGAT","f":1,"pl":"09/01/2026 00:00:00","a":"14/01/2026 04:09:38","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 15/01/2026 12:00\n- REMARK  : Tomorrow I will call her for revisit .","nx":"15/01/2026 12:00:00"},{"r":"MK-NWK-DRX-LOK-NA-1360","n":"Deepti Raina","p":"998730771","c":"NA","f":2,"pl":"15/01/2026 11:00:00","a":"15/01/2026 02:25:15","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-NWK-NJX-BAN-SM-1379","n":"Naveen jain","p":"7781000901","c":"SRAVANI MAHARANA","f":1,"pl":"10/01/2026 00:00:00","a":"09/01/2026 00:32:15","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"- TYPE OF APPOINTMENT : STORE VISIT\n- MENTION DATE AND TIME FOR CLIENT VIDEO CALL APPOINTMENT / STORE VISIT: 09/01/2026 03:00\n- ASSIGNED TO SALES PERSON  : NEHA JAISWAL\n- REMARK: they returned to ranchi they dont need followup now clearly mentioned","nx":"09/01/2026 03:00:00"},{"r":"MK-NWK-NJX-BAN-SM-1379","n":"Naveen jain","p":"7781000901","c":"SRAVANI MAHARANA","f":2,"pl":"09/01/2026 11:00:00","a":"21/02/2026 02:05:22","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"we have called more then 7 times costomer is not reciving the call its alsways showing busy","nx":""},{"r":"MK-NWK-ZPX-BAN-TA-1365","n":"Zaida patel","p":"8433718903","c":"TEHREEM ANSARI","f":1,"pl":"09/01/2026 00:00:00","a":"24/01/2026 00:23:40","s":"ALREADY PURCHASED FROM MK JEWELS","m":"purchased","nx":""},{"r":"MK-NWK-PNX-BAN-SM-1376","n":"puneet narula","p":"9870313686","c":"SRAVANI MAHARANA","f":1,"pl":"08/01/2026 00:00:00","a":"08/01/2026 02:25:55","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 01/10/2026 00:00\n- REMARK  : She shortlisted the products are will be coming once she is free","nx":"01/10/2026 00:00:00"},{"r":"MK-NWK-PNX-BAN-SM-1376","n":"puneet narula","p":"9870313686","c":"SRAVANI MAHARANA","f":2,"pl":"30/09/2026 11:00:00","a":"13/01/2026 23:31:19","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they will be coming by sep to purchase","nx":""},{"r":"MK-NWK-CBX-BAN-SM-1378","n":"Charishama barai","p":"9821422399","c":"SRAVANI MAHARANA","f":1,"pl":"14/01/2026 00:00:00","a":"19/02/2026 02:05:52","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer not receiving calls and also is not available in whatsapp tried connecting but incoming is off","nx":""},{"r":"MK-NWK-DAR-LOK-NA-1363","n":"Darshana","p":"9768317937","c":"VIKAS GAUTAM","f":1,"pl":"10/01/2026 00:00:00","a":"23/02/2026 01:10:13","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"She want plain Gold","nx":""},{"r":"MK-NWK-MSS-JBX-NA-1353","n":"Miloni Smit shah","p":"9619507046","c":"PRATIKSHA GOHIL","f":1,"pl":"06/01/2026 00:00:00","a":"19/02/2026 02:15:11","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Madam meri wife ka problem ho hai ki woh 10 shop me dekhegi our mera mobile no deti hai but usko jaha se lena hai waha se thi woh purchase kar ti hai woh always tanishq purchase karti hai sorry for that we are not interested","nx":""},{"r":"MK-NWK-RVX-BAN-SM-1348","n":"Riddhi Vichare","p":"7977086441","c":"SRAVANI MAHARANA","f":1,"pl":"06/01/2026 00:00:00","a":"17/01/2026 00:06:58","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"Customer took te product from kalyan Jeweler","nx":""},{"r":"MK-NWK-VTX-JBX-NA-1354","n":"Vandana thakur","p":"7045111681","c":"PRATIKSHA GOHIL","f":1,"pl":"06/01/2026 16:15:00","a":"19/02/2026 01:48:35","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 02/03/2026 01:00\n- REMARK  : Customer said we are famous in MK JEWELS we will always visited at don't worry dear abhi kuch lenTo nahi hI but march month me hum visit karenge.","nx":"02/03/2026 01:00:00"},{"r":"MK-NWK-VTX-JBX-NA-1354","n":"Vandana thakur","p":"7045111681","c":"NA","f":2,"pl":"01/03/2026 11:00:00","a":"14/03/2026 04:27:53","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 14/05/2026 12:00\n- REMARK  : 2 months badme visit karega","nx":"14/05/2026 12:00"},{"r":"MK-NWK-VTX-JBX-NA-1354","n":"Vandana thakur","p":"7045111681","c":"NA","f":3,"pl":"13/05/2026 11:00:00","a":"20/03/2026 01:16:55","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 21/05/2026 01:30\n- REMARK  : Aap mujhe after 2 month ke baad call karna abhi kuch requirement nahi hai thank you","nx":"21/05/2026 01:30"},{"r":"MK-NWK-RSX-BAN-SM-1347","n":"Ritika singh","p":"9820134079","c":"SRAVANI MAHARANA","f":1,"pl":"06/01/2026 00:00:00","a":"17/01/2026 00:10:40","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"shell come tommorow","nx":"18/01/2026 14:00:00"},{"r":"MK-NWK-RSX-BAN-SM-1347","n":"Ritika singh","p":"9820134079","c":"SRAVANI MAHARANA","f":2,"pl":"18/01/2026 11:00:00","a":"21/02/2026 02:12:13","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"called multiple times but didn't recived the call","nx":""},{"r":"MK-NWK-DAX-BAN-TA-1339","n":"DIMPLE ANANDPARA","p":"9821414557","c":"TEHREEM ANSARI","f":1,"pl":"06/01/2026 13:00:00","a":"19/02/2026 01:50:46","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"NO REQUIREMENT","nx":""},{"r":"MK-NWK-JMX-BAN-SM-1335","n":"Juverie mansuri","p":"7045513524","c":"SRAVANI MAHARANA","f":1,"pl":"05/01/2026 00:00:00","a":"17/01/2026 00:19:31","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"costomer leaves far from bandra they said they'll be coming after few month's","nx":""},{"r":"MK-NWK-AAX-BAN-SV-1329","n":"Anam ahmed","p":"9227004969","c":"SHRUTI VORA","f":1,"pl":"05/01/2026 00:00:00","a":"22/01/2026 00:48:51","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer is not able to find the bill do not wish to exchange it for now maybe in future if needed they will visit","nx":""},{"r":"MK-NWK-SSX-BAN-SV-1328","n":"Sana shaikh","p":"9833880088","c":"SHRUTI VORA","f":1,"pl":"04/01/2026 00:00:00","a":"21/01/2026 00:12:19","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer phone is not getting connected and its not there on whstapp too tried contacting more than 5 times","nx":""},{"r":"MK-NWK-RSX-JBX-NA-1340","n":"Rajni shah","p":"9029417261","c":"PRATIKSHA GOHIL","f":1,"pl":"04/01/2026 18:11:00","a":"21/03/2026 02:52:36","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer given wrong number.","nx":""},{"r":"MK-NWK-MAF-BAN-TK-1320","n":"Maffren","p":"NA","c":"TANYA KEDARE","f":1,"pl":"04/01/2026 16:39:00","a":"23/02/2026 00:11:25","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"not intrested [ close]","nx":""},{"r":"MK-NWK-AHX-BAN-SM-1323","n":"ASIya halai","p":"9833277728","c":"SRAVANI MAHARANA","f":1,"pl":"04/01/2026 05:30:00","a":"17/01/2026 05:20:19","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"she'll go to Lokhandwala store on 18th jan","nx":"18/01/2026 15:00:00"},{"r":"MK-NWK-AHX-BAN-SM-1323","n":"ASIya halai","p":"9833277728","c":"SRAVANI MAHARANA","f":2,"pl":"18/01/2026 11:00:00","a":"21/02/2026 02:10:40","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she is from ahamdabad she said shell be visiting after ramzan","nx":""},{"r":"MK-NWK-LGX-BAN-SM-1330","n":"Latina gandhi","p":"9850552552","c":"SRAVANI MAHARANA","f":1,"pl":"06/01/2026 00:00:00","a":"06/01/2026 00:53:48","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 07/01/2026 01:00\n- REMARK  : they said they are busy today","nx":"07/01/2026 01:00:00"},{"r":"MK-NWK-LGX-BAN-SM-1330","n":"Latina gandhi","p":"9850552552","c":"SRAVANI MAHARANA","f":2,"pl":"07/01/2026 11:00:00","a":"05/02/2026 04:03:51","s":"ALREADY PURCHASED FROM MK JEWELS","m":"Did the purchase form us","nx":""},{"r":"MK-NWK-ATX-BAN-TK-1327","n":"Ankita tiwari","p":"7020242254","c":"TANYA KEDARE","f":1,"pl":"04/01/2026 12:27:00","a":"14/01/2026 06:03:21","s":"ALREADY PURCHASED FROM MK JEWELS","m":"No requirement right now","nx":""},{"r":"MK-NWK-ASX-BAN-TK-1316","n":"anubhav sharma","p":"8177845435","c":"TANYA KEDARE","f":1,"pl":"03/01/2026 19:02:00","a":"15/01/2026 22:21:16","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer went back to the canada","nx":""},{"r":"MK-NWK-PSX-BAN-TA-1314","n":"pankti shah","p":"9820082478","c":"TEHREEM ANSARI","f":1,"pl":"03/01/2026 17:30:00","a":"18/01/2026 23:11:43","s":"ALREADY PURCHASED FROM MK JEWELS","m":"already purchased","nx":""},{"r":"MK-NWK-DVX-BAN-TA-1311","n":"darshana vasa","p":"8369507731","c":"TEHREEM ANSARI","f":1,"pl":"03/01/2026 15:15:00","a":"05/02/2026 04:06:02","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-NWK-HPX-BAN-TK-1315","n":"harsh parekh","p":"7977496778","c":"TANYA KEDARE","f":1,"pl":"03/01/2026 14:48:00","a":"15/01/2026 22:23:31","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"his father bought ring from his family jewels","nx":""},{"r":"MK-NWK-SAX-BAN-SV-1297","n":"Sangeeta ahuja","p":"8830658906","c":"SHRUTI VORA","f":1,"pl":"02/01/2026 19:24:00","a":"18/01/2026 23:02:53","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 22/01/2026 11:00\n- REMARK  : customer is out of town, she will video call us after 21st to finalize","nx":"22/01/2026 11:00:00"},{"r":"MK-NWK-SAX-BAN-SV-1297","n":"Sangeeta ahuja","p":"8830658906","c":"SHRUTI VORA","f":2,"pl":"21/01/2026 11:00:00","a":"26/01/2026 23:10:31","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 28/01/2026 02:00\n- REMARK  : customer visitng tomorrow","nx":"28/01/2026 02:00"},{"r":"MK-NWK-SAX-BAN-SV-1297","n":"Sangeeta ahuja","p":"8830658906","c":"SHRUTI VORA","f":3,"pl":"28/01/2026 11:00:00","a":"03/03/2026 22:17:50","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement for now","nx":""},{"r":"MK-NWK-AAV-BAN-SV-1294","n":"Aavya","p":"9833007171","c":"SHRUTI VORA","f":1,"pl":"03/01/2026 05:30:00","a":"13/01/2026 03:01:12","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"hangup the call after the introduction of mk jewels and said not intrested","nx":""},{"r":"MK-NWK-KMX-BAN-TA-1295","n":"kushboo mathur","p":"449158185","c":"TEHREEM ANSARI","f":1,"pl":"06/01/2026 05:30:00","a":"19/02/2026 01:45:51","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"THEY WENT BACK TO ABROAD","nx":""},{"r":"MK-NWK-ANA-BAN-TK-1291","n":"anamta","p":"9867251167","c":"TANYA KEDARE","f":1,"pl":"01/01/2026 19:21:00","a":"20/02/2026 00:26:45","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"her friend or cousin who came along with her already purcahsesd from somewhere else","nx":""},{"r":"MK-NWK-TLX-BAN-TA-1292","n":"tara lund","p":"4087442668","c":"TEHREEM ANSARI","f":1,"pl":"05/01/2026 05:30:00","a":"19/02/2026 01:50:03","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"WENT BACK TO ABROAD","nx":""},{"r":"MK-NWK-ATX-BAN-SM-1284","n":"Avantika tekchandani","p":"9769697976","c":"SRAVANI MAHARANA","f":1,"pl":"02/01/2026 05:30:00","a":"06/01/2026 01:04:10","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 07/01/2026 03:00\n- REMARK  : client said they are still thinking about the product they are not sure when they'll be visiting","nx":"07/01/2026 03:00:00"},{"r":"MK-NWK-ATX-BAN-SM-1284","n":"Avantika tekchandani","p":"9769697976","c":"SRAVANI MAHARANA","f":2,"pl":"07/01/2026 11:00:00","a":"19/02/2026 02:11:20","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Called multiple times customer not receiving the calls and also not responding to the WhatsApp massages","nx":""},{"r":"MK-NWK-JKX-BAN-TK-1282","n":"JANVI KHILNANI","p":"9665311700","c":"TANYA KEDARE","f":1,"pl":"31/12/2025 05:30:00","a":"15/01/2026 22:27:35","s":"ALREADY PURCHASED FROM MK JEWELS","m":"same day she purchased from mk jewels","nx":""},{"r":"MK-NWK-STX-BAN-TK-1280","n":"sunanda tipriwala","p":"9930099631","c":"TANYA KEDARE","f":1,"pl":"31/12/2025 19:29:46","a":"20/01/2026 00:27:15","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Hello Tanya,\nThank you so much, will let u know if any requirement is there","nx":""},{"r":"MK-NWK-MDX-BAN-TA-1278","n":"Manisha dulani","p":"9881829098","c":"TEHREEM ANSARI","f":1,"pl":"02/01/2026 05:30:00","a":"19/02/2026 01:49:22","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-NWK-KAX-BAN-TA-1276","n":"Kashish amesar","p":"9892172277","c":"TEHREEM ANSARI","f":1,"pl":"02/01/2026 05:30:00","a":"13/01/2026 00:11:37","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement & Thank you for calling customer replied","nx":""},{"r":"MK-NWK-ALI-BAN-TK-1272","n":"Alimda","p":"9004256904","c":"TANYA KEDARE","f":1,"pl":"04/01/2026 05:30:00","a":"20/01/2026 00:31:45","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"She said ok i will let you now if any requirement will be there","nx":""},{"r":"MK-NWK-DSX-BAN-SV-1271","n":"Divya sarda","p":"9004455522","c":"SHRUTI VORA","f":1,"pl":"04/01/2026 05:30:00","a":"13/01/2026 02:50:42","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 27/01/2026 11:00\n- REMARK  : she has a demise at her place will resume shopping after 2 weeks","nx":"27/01/2026 11:00:00"},{"r":"MK-NWK-DSX-BAN-SV-1271","n":"Divya sarda","p":"9004455522","c":"SHRUTI VORA","f":2,"pl":"26/01/2026 11:00:00","a":"21/03/2026 00:36:58","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer said no requirement- close","nx":""},{"r":"MK-NWK-DAS-BAN-TK-1265","n":"das","p":"7400433535","c":"TANYA KEDARE","f":1,"pl":"30/12/2025 12:00:00","a":"19/04/2026 23:51:06","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"ALREADY PURCHASED FROM ANOTHER JEWELS","nx":""},{"r":"MK-NWK-MKX-BAN-HS-1250","n":"mukesh kewelramawi","p":"9322267927","c":"HUDA SHAIKH","f":1,"pl":"29/12/2025 12:00:00","a":"18/03/2026 03:53:39","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Invalid No","nx":""},{"r":"MK-NWK-MRX-BAN-KY-1251","n":"Mittin rattin","p":"7123430350","c":"KAJAL YADAV","f":1,"pl":"29/12/2025 12:00:00","a":"02/06/2026 05:26:37","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-NWK-VJX-BAN-SV-1255","n":"Vanita Jain","p":"9769656146","c":"SHRUTI VORA","f":1,"pl":"29/12/2025 12:00:00","a":"18/01/2026 22:58:12","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 09/02/2026 11:00\n- REMARK  : She mentioned that she will visit our store to check out the new collection; however, she will finalise the set only after visiting the Bridal Asia exhibition.","nx":"09/02/2026 11:00:00"},{"r":"MK-NWK-VJX-BAN-SV-1255","n":"Vanita Jain","p":"9769656146","c":"SHRUTI VORA","f":2,"pl":"08/02/2026 11:00:00","a":"25/02/2026 22:57:23","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"will visit in future, no requirment for necklaceset at the moment, had informed about the pinktag offer too","nx":""},{"r":"MK-NWK-SGX-BAN-HS-1256","n":"SANJAY GANDHI","p":"9819483233","c":"HUDA SHAIKH","f":1,"pl":"29/12/2025 12:00:00","a":"18/03/2026 03:53:56","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"No Requirement","nx":""},{"r":"MK-NWK-AMX-BAN-TK-1261","n":"ashna motwani","p":"9987855955","c":"TANYA KEDARE","f":1,"pl":"29/12/2025 12:00:00","a":"13/03/2026 04:18:55","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-NWK-RDX-BAN-SM-1232","n":"RANGAMA Dhanaya","p":"692514193","c":"SRAVANI MAHARANA","f":1,"pl":"28/12/2025 12:00:00","a":"24/01/2026 01:56:19","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"they went back to france so they said whenever they fly back to india theyll come to our store","nx":""},{"r":"MK-NWK-MJX-BAN-SM-1235","n":"Mr Jurani","p":"8888871255","c":"SRAVANI MAHARANA","f":1,"pl":"28/12/2025 12:00:00","a":"19/02/2026 01:20:19","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"THEY WANTED FOR GIFTING SO THEY PURCHASED FROM ANOTHER STORE","nx":""},{"r":"MK-NWK-KSX-BAN-HS-1236","n":"khushbu shah","p":"9821108000","c":"HUDA SHAIKH","f":1,"pl":"28/12/2025 12:00:00","a":"02/06/2026 05:27:08","s":"SWITCHED OFF","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-NWK-CKX-BAN-SM-1237","n":"Chandni kanal","p":"9082348252","c":"SRAVANI MAHARANA","f":1,"pl":"28/12/2025 12:00:00","a":"14/01/2026 05:26:44","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement rn becuz client is out of town","nx":""},{"r":"MK-NWK-VSX-BAN-SV-1240","n":"Virali shah","p":"7021818549","c":"SHRUTI VORA","f":1,"pl":"28/12/2025 12:00:00","a":"13/01/2026 02:34:18","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 14/01/2026 11:00\n- REMARK  : need to send quotation on whatsapp with the customer then she will finilaze","nx":"14/01/2026 11:00:00"},{"r":"MK-NWK-VSX-BAN-SV-1240","n":"Virali shah","p":"7021818549","c":"SHRUTI VORA","f":2,"pl":"14/01/2026 11:00:00","a":"19/01/2026 00:39:37","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 20/01/2026 11:00\n- REMARK  : to send quotation on whatsapp","nx":"20/01/2026 11:00"},{"r":"MK-NWK-VSX-BAN-SV-1240","n":"Virali shah","p":"7021818549","c":"SHRUTI VORA","f":3,"pl":"20/01/2026 11:00:00","a":"14/03/2026 00:11:18","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"call cut after introduction","nx":""},{"r":"MK-NWK-KSX-BAN-SV-1242","n":"krisha shah","p":"9969697286","c":"SHRUTI VORA","f":1,"pl":"28/12/2025 12:00:00","a":"13/01/2026 02:23:42","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement at the moment","nx":""},{"r":"MK-NWK-DRX-BAN-HS-1243","n":"Deepak Ramani","p":"9850029800","c":"HUDA SHAIKH","f":1,"pl":"28/12/2025 12:00:00","a":"18/03/2026 06:51:46","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"No requirement as of now","nx":""},{"r":"MK-NWK-YDX-BAN-HS-1244","n":"Yash darak","p":"8275765190","c":"HUDA SHAIKH","f":1,"pl":"28/12/2025 12:00:00","a":"18/03/2026 03:52:53","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"No Requirement","nx":""},{"r":"MK-NWK-BKM-BAN-HS-1245","n":"Bina Kiran mehta","p":"8169638572","c":"HUDA SHAIKH","f":1,"pl":"28/12/2025 12:00:00","a":"18/03/2026 03:53:11","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"No Requirement","nx":""},{"r":"MK-NWK-HJX-BAN-KY-1247","n":"HARKRISHIM JAIDANI","p":"9819537789","c":"KAJAL YADAV","f":1,"pl":"28/12/2025 12:00:00","a":"02/06/2026 05:27:37","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-NWK-NSX-BAN-SV-1248","n":"Nida Supariwala","p":"8850925152","c":"SHRUTI VORA","f":1,"pl":"28/12/2025 12:00:00","a":"13/01/2026 02:28:21","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 14/01/2026 11:00\n- REMARK  : customer said to call back","nx":"14/01/2026 11:00:00"},{"r":"MK-NWK-NSX-BAN-SV-1248","n":"Nida Supariwala","p":"8850925152","c":"SHRUTI VORA","f":2,"pl":"14/01/2026 11:00:00","a":"18/01/2026 23:51:08","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 21/01/2026 11:00\n- REMARK  : need to send quotation in AD on whatsapp (riya)","nx":"21/01/2026 11:00"},{"r":"MK-NWK-NSX-BAN-SV-1248","n":"Nida Supariwala","p":"8850925152","c":"SHRUTI VORA","f":3,"pl":"21/01/2026 11:00:00","a":"14/03/2026 00:12:01","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"wanted 700 making charges - close","nx":""},{"r":"MK-NWK-NSX-BAN-SV-1220","n":"Neha sujan","p":"8452097650","c":"SHRUTI VORA","f":1,"pl":"27/12/2025 12:00:00","a":"13/01/2026 02:20:59","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 05/02/2026 11:00\n- REMARK  : she is out of town will be back next month","nx":"05/02/2026 11:00:00"},{"r":"MK-NWK-NSX-BAN-SV-1220","n":"Neha sujan","p":"8452097650","c":"SHRUTI VORA","f":2,"pl":"04/02/2026 11:00:00","a":"21/03/2026 00:38:25","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"will visit if required- close","nx":""},{"r":"MK-NWK-RBX-BAN-HS-1222","n":"RITIKA BATHEJA","p":"9930442471","c":"HUDA SHAIKH","f":1,"pl":"27/12/2025 12:00:00","a":"18/03/2026 06:31:42","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"She have no requirement right now , but she will surely visit to explore pink tag products","nx":""},{"r":"MK-NWK-SSX-BAN-SM-1224","n":"Sameer sharda","p":"9821149910","c":"SRAVANI MAHARANA","f":1,"pl":"27/12/2025 12:00:00","a":"24/01/2026 01:59:33","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"they said they customized earring chains from local small store","nx":""},{"r":"MK-NWK-JGX-BAN-KY-1225","n":"Jyoti gupta","p":"9930813081","c":"KAJAL YADAV","f":1,"pl":"27/12/2025 12:00:00","a":"15/05/2026 00:43:35","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO REQUIREMENT","nx":""},{"r":"MK-NWK-FSA-BAN-TA-1227","n":"firdause s amlani","p":"9223342663","c":"TEHREEM ANSARI","f":1,"pl":"27/12/2025 12:00:00","a":"12/01/2026 23:19:04","s":"ALREADY PURCHASED FROM MK JEWELS","m":"customer came to receive repair at that time the updated walkin was not initiated","nx":""},{"r":"MK-NWK-HNX-BAN-KY-1230","n":"hayana nara","p":"7774990066","c":"KAJAL YADAV","f":1,"pl":"27/12/2025 12:00:00","a":"02/06/2026 05:28:01","s":"SWITCHED OFF","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-NWK-ZCX-BAN-SM-1231","n":"Zabeen chunawala","p":"9833307587","c":"SRAVANI MAHARANA","f":1,"pl":"27/12/2025 12:00:00","a":"24/01/2026 02:03:05","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 26/01/2026 11:00\n- REMARK  : she said they live in mumbai central and she'll come to our store whe they'll come for shopping but they are not sure of specific date","nx":"26/01/2026 11:00:00"},{"r":"MK-NWK-ZCX-BAN-SM-1231","n":"Zabeen chunawala","p":"9833307587","c":"SRAVANI MAHARANA","f":2,"pl":"26/01/2026 11:00:00","a":"19/02/2026 01:53:03","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Customer is not interested right now","nx":""},{"r":"MK-NWK-ARX-BAN-SM-1210","n":"Arshika rohora","p":"9769313696","c":"SRAVANI MAHARANA","f":1,"pl":"26/12/2025 12:00:00","a":"19/02/2026 01:18:43","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"THEY GAVE US THE NON EXSISTING NUMBER","nx":""},{"r":"MK-NWK-TLX-BAN-SM-1212","n":"Tofik Lakhani","p":"9426148310","c":"SRAVANI MAHARANA","f":1,"pl":"26/12/2025 12:00:00","a":"14/01/2026 06:02:15","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"thay said they took from another store because our prices are too high","nx":""},{"r":"MK-NWK-FKX-BAN-TA-1215","n":"FAIZA KOKNI","p":"9881786111","c":"TEHREEM ANSARI","f":1,"pl":"26/12/2025 12:00:00","a":"05/02/2026 03:58:59","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"no requirement","nx":""},{"r":"MK-NWK-PUR-BAN-KY-1217","n":"purva","p":"7020824748","c":"KAJAL YADAV","f":1,"pl":"26/12/2025 12:00:00","a":"02/06/2026 05:28:33","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-NWK-MFW-BAN-TA-1218","n":"Mahjabeen furniture wala","p":"9821210887","c":"TEHREEM ANSARI","f":1,"pl":"26/12/2025 12:00:00","a":"19/02/2026 01:44:18","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NOT RECEIVING THE CALL NEITHER RESPONDING TO MESSAGES WE'VE TRIED MORE THAN 5 TIMES FROM OUR END","nx":""},{"r":"MK-NWK-AGX-BAN-SM-1219","n":"Achal gangwani","p":"9763122111","c":"SRAVANI MAHARANA","f":1,"pl":"26/12/2025 12:00:00","a":"24/01/2026 02:11:54","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"they got better deal from other store and also got 0% making thats why they purchased from them","nx":""},{"r":"MK-NWK-MHX-BAN-SM-1197","n":"Mr hemlani","p":"9152111972","c":"SRAVANI MAHARANA","f":1,"pl":"25/12/2025 12:00:00","a":"19/02/2026 01:08:38","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"THEY SAID THEY WERE LOOKING FOR 22KT CHAIN THAT DAY IT SELF FOR GIFTING AND THEY PURCHASED FROM ANOTHER STORE THAT DAY IT SELF","nx":""},{"r":"MK-NWK-VAN-BAN-TK-1198","n":"vandana","p":"9819429830","c":"TANYA KEDARE","f":1,"pl":"25/12/2025 12:00:00","a":"18/03/2026 05:01:36","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she has no requirement [ close]","nx":""},{"r":"MK-NWK-SAX-BAN-SM-1200","n":"Soniya Arora","p":"9619060022","c":"SRAVANI MAHARANA","f":1,"pl":"25/12/2025 12:00:00","a":"19/02/2026 01:48:41","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Called more then 7 times also messaged them on whatsapp no response","nx":""},{"r":"MK-NWK-ARV-BAN-SM-1201","n":"Arvind","p":"9158934669","c":"SRAVANI MAHARANA","f":1,"pl":"25/12/2025 12:00:00","a":"22/01/2026 01:04:17","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"he said he's out of the town","nx":""},{"r":"MK-NWK-YEX-BAN-SM-1202","n":"Yuki Ellias","p":"9820948874","c":"SRAVANI MAHARANA","f":1,"pl":"25/12/2025 12:00:00","a":"19/02/2026 01:00:47","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"COSTOMER SAID GOLD RATES ARE HIGH THEY'LL COME WHEN GOLD RATE DICREESES","nx":""},{"r":"MK-NWK-ILX-BAN-TA-1203","n":"Ishika lund","p":"7066622088","c":"TEHREEM ANSARI","f":1,"pl":"25/12/2025 12:00:00","a":"15/01/2026 04:07:57","s":"ALREADY PURCHASED FROM MK JEWELS","m":"-","nx":""},{"r":"MK-NWK-NSX-BAN-SV-1186","n":"Nisha shah","p":"7710840121","c":"SHRUTI VORA","f":1,"pl":"24/12/2025 16:39:42","a":"12/01/2026 23:48:22","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 20/01/2026 12:00\n- REMARK  : deepa maam has connected on whatsapp customer said stuck with some work will visit later on","nx":"20/01/2026 12:00:00"},{"r":"MK-NWK-NSX-BAN-SV-1186","n":"Nisha shah","p":"7710840121","c":"SHRUTI VORA","f":2,"pl":"19/01/2026 11:00:00","a":"19/01/2026 00:14:00","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 20/01/2026 11:00\n- REMARK  : call back","nx":"20/01/2026 11:00"},{"r":"MK-NWK-NSX-BAN-SV-1186","n":"Nisha shah","p":"7710840121","c":"SHRUTI VORA","f":3,"pl":"20/01/2026 11:00:00","a":"27/05/2026 01:05:30","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Will visit in future","nx":""},{"r":"MK-NWK-KSX-BAN-SV-1177","n":"kausar saiyed","p":"9833020684","c":"SHRUTI VORA","f":1,"pl":"24/12/2025 00:50:00","a":"18/01/2026 22:40:07","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"PURCHASED FROM OTHER STORE PLATINUM RING","nx":""},{"r":"MK-NWK-AAX-BAN-TA-1188","n":"Ayesha Ajmal","p":"7045550254","c":"TEHREEM ANSARI","f":1,"pl":"24/12/2025 12:00:00","a":"18/01/2026 23:14:09","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"not requirement","nx":""},{"r":"MK-NWK-PJX-BAN-TA-1189","n":"Pragnesh joshi","p":"423100016","c":"TEHREEM ANSARI","f":1,"pl":"24/12/2025 12:00:00","a":"13/01/2026 00:58:44","s":"ALREADY PURCHASED FROM MK JEWELS","m":"hand mangalsutra purchased","nx":""},{"r":"MK-NWK-KRX-BAN-SM-1192","n":"Komal rohira","p":"9820688388","c":"SRAVANI MAHARANA","f":1,"pl":"24/12/2025 12:00:00","a":"15/01/2026 01:17:41","s":"NO (CLIENT ASKED FOR APPOINTMENT)","m":"they are coming to store","nx":"22/01/2026 12:00:00"},{"r":"MK-NWK-KRX-BAN-SM-1192","n":"Komal rohira","p":"9820688388","c":"SRAVANI MAHARANA","f":2,"pl":"21/01/2026 11:00:00","a":"21/02/2026 01:24:54","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"they purchased from hydrabad","nx":""},{"r":"MK-NWK-AIX-BAN-SV-1194","n":"Anisha Idnani","p":"7083778000","c":"SHRUTI VORA","f":1,"pl":"24/12/2025 12:00:00","a":"19/01/2026 01:02:43","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 23/01/2026 11:00\n- REMARK  : she will visit this week","nx":"23/01/2026 11:00:00"},{"r":"MK-NWK-AIX-BAN-SV-1194","n":"Anisha Idnani","p":"7083778000","c":"SHRUTI VORA","f":2,"pl":"22/01/2026 11:00:00","a":"25/03/2026 00:04:53","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"customer had came yesterday to place repair, no requirement for now","nx":""},{"r":"MK-NWK-NKX-BAN-SV-1175","n":"neha kataria","p":"8451037666","c":"SHRUTI VORA","f":1,"pl":"23/12/2025 20:38:05","a":"12/01/2026 23:38:19","s":"ALREADY PURCHASED FROM MK JEWELS","m":"order placed at MK jewels","nx":""},{"r":"MK-NWK-MBX-BAN-SM-1171","n":"Mehrin baig","p":"9969383160","c":"SRAVANI MAHARANA","f":1,"pl":"23/12/2025 19:39:34","a":"14/01/2026 06:16:48","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 16/01/2026 15:00\n- REMARK  : she is busy today and tomorrow that why she told me to call on 16th of jan","nx":"16/01/2026 15:00:00"},{"r":"MK-NWK-MBX-BAN-SM-1171","n":"Mehrin baig","p":"9969383160","c":"SRAVANI MAHARANA","f":2,"pl":"16/01/2026 11:00:00","a":"17/01/2026 00:41:02","s":"YES (CLIENT NEED FOLLOW-UP)","m":"- WHEN SHOULD WE FOLLOW UP: 19/01/2026 11:20\n- REMARK  : customer said she'll let us know when she'll be coming","nx":"19/01/2026 11:20"},{"r":"MK-NWK-MBX-BAN-SM-1171","n":"Mehrin baig","p":"9969383160","c":"SRAVANI MAHARANA","f":3,"pl":"19/01/2026 11:00:00","a":"18/02/2026 22:50:16","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"No requirement in the moment","nx":""},{"r":"MK-NWK-GSX-BAN-KY-1168","n":"gunjan saloja","p":"9987666010","c":"KAJAL YADAV","f":1,"pl":"23/12/2025 17:50:36","a":"02/06/2026 05:28:52","s":"NO (CALL NOT CONNECTED)","m":"- DID YOU SEND MESSAGE ON WHATSAPP?  : YES (WHATSAPP MESSAGE SENT)","nx":""},{"r":"MK-NWK-NSX-BAN-KY-1167","n":"Neha Sachdev","p":"9323864848","c":"KAJAL YADAV","f":1,"pl":"23/12/2025 17:35:45","a":"15/05/2026 00:48:16","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"As of now NO REQUIREMENT  as customer is out of town","nx":""},{"r":"MK-NWK-GSX-BAN-SM-1166","n":"Geeta Shah","p":"9594390030","c":"SRAVANI MAHARANA","f":1,"pl":"23/12/2025 17:21:02","a":"14/01/2026 06:18:08","s":"ALREADY PURCHASED FROM MK JEWELS","m":"they purchased and dont need any further followup","nx":""},{"r":"MK-NWK-SAC-BAN-SV-1165","n":"Sachi","p":"9035740189","c":"SHRUTI VORA","f":1,"pl":"23/12/2025 17:09:33","a":"12/01/2026 23:37:38","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"test","nx":""},{"r":"MK-NWK-KAX-BAN-SM-1164","n":"Kavita Agrawal","p":"7400447593","c":"SRAVANI MAHARANA","f":1,"pl":"23/12/2025 17:04:39","a":"14/01/2026 06:21:51","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she said gold rates are going too high so right now they dont have any requirement","nx":""},{"r":"MK-NWK-MMX-BAN-TA-1156","n":"Manav mehta","p":"9833299881","c":"TEHREEM ANSARI","f":1,"pl":"22/12/2025 19:30:16","a":"18/02/2026 22:43:17","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"NO. DOES NOT EXIST","nx":""},{"r":"MK-NWK-MAX-BAN-TK-1154","n":"Manoj Amarani","p":"9029651529","c":"TANYA KEDARE","f":1,"pl":"22/12/2025 18:52:41","a":"19/04/2026 23:50:20","s":"ALREADY PURCHASED FROM MK JEWELS","m":"ALREADY PURCHASED A BRACELETE FROM MK","nx":""},{"r":"MK-NWK-NBX-BAN-SM-1152","n":"Neetu bhojwani","p":"971505850780","c":"SRAVANI MAHARANA","f":1,"pl":"22/12/2025 18:38:23","a":"19/02/2026 00:58:48","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"CLIENT DON'T LEAVE IN INDIA THEY WENT TO THERE COUNTRY WHEN THEY'LL COME TO INDIA THEY'LL VISIT THE STORE","nx":""},{"r":"MK-NWK-SAX-BAN-SV-1151","n":"Sapna Amdavadi","p":"9586660100","c":"SHRUTI VORA","f":1,"pl":"22/12/2025 17:14:46","a":"12/01/2026 22:57:48","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"CUSTOMER HIMSELF IS JEWELLER","nx":""},{"r":"MK-NWK-MPX-BAN-TK-1149","n":"Meena panjwani","p":"7007156430","c":"TANYA KEDARE","f":1,"pl":"22/12/2025 16:07:21","a":"23/01/2026 00:02:30","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"client said [ i'm out of mumbai so won't be visiting thsnkyou]","nx":""},{"r":"MK-NWK-TAX-BAN-TK-1143","n":"trisha agarwala","p":"9619252978","c":"TANYA KEDARE","f":1,"pl":"21/12/2025 17:13:56","a":"19/01/2026 23:47:22","s":"ALREADY PURCHASED FROM MK JEWELS","m":"I have already  placed order  in your  Lokhandwala branch","nx":""},{"r":"MK-NWK-SMX-BAN-SM-1142","n":"Sushma mulchandani","p":"9920111899","c":"SRAVANI MAHARANA","f":1,"pl":"21/12/2025 16:52:33","a":"14/01/2026 06:34:08","s":"ALREADY PURCHASED FROM ANOTHER JEWELLER","m":"she purchased from original brand which she wanted so now she has no requirement","nx":""},{"r":"MK-NWK-SAX-BAN-TK-1140","n":"sudha agrwal","p":"9833873883","c":"TANYA KEDARE","f":1,"pl":"21/12/2025 12:22:49","a":"14/03/2026 06:59:19","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"no requirement","nx":""},{"r":"MK-NWK-STX-BAN-KY-1138","n":"srushti tulani","p":"8976653048","c":"KAJAL YADAV","f":1,"pl":"20/12/2025 18:20:32","a":"02/06/2026 05:29:17","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she was traveling so she said not to call","nx":""},{"r":"MK-NWK-MSX-BAN-SM-1132","n":"Meena sadharangani","p":"17329477176","c":"SRAVANI MAHARANA","f":1,"pl":"19/12/2025 20:00:36","a":"16/01/2026 23:44:46","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"she is out of india when shell be coming to india shell let us know","nx":""},{"r":"MK-NWK-TKX-BAN-TA-1129","n":"Tehseen kapadiya","p":"971506569129","c":"TEHREEM ANSARI","f":1,"pl":"19/12/2025 14:57:16","a":"03/04/2026 01:41:55","s":"NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)","m":"Not required","nx":""}];
}

function getLegacyNbFollowupPlannedRows_() {
  return [{"r":"MK-WK-JAX-BAN-US-2292","pl":"04/06/2026 00:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-PDX-BAN-US-2299","pl":"30/06/2026 00:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-DCX-BAN-DB-2300","pl":"04/06/2026 00:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-TKX-BAN-US-2281","pl":"04/06/2026 00:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-SMX-BAN-AW-2287","pl":"07/06/2026 00:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-SSX-BAN-DB-2271","pl":"25/06/2026 00:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-SMX-BAN-AC-2272","pl":"03/06/2026 00:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-SBX-BAN-DB-2278","pl":"02/06/2026 00:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-MTX-BAN-US-2264","pl":"02/06/2026 00:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-SKX-BAN-DB-2265","pl":"04/06/2026 00:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-BBX-BAN-AC-2241","pl":"04/06/2026 00:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-PCX-BAN-US-2246","pl":"30/06/2026 00:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-UVX-BAN-US-2227","pl":"06/06/2026 00:00:00","c":"TANYA KEDARE"},{"r":"MK-WK-SNX-BAN-BS-2220","pl":"01/06/2026 11:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-VKX-AND-BB-2216","pl":"28/05/2026 00:00:00","c":"BHOOMI BHAGAT"},{"r":"MK-WK-MVX-BAN-US-2174","pl":"30/06/2026 11:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-MGX-BAN-BS-2181","pl":"25/05/2026 00:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-PJX-BAN-US-2184","pl":"25/05/2026 00:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-MGX-BAN-NA-2185","pl":"25/05/2026 00:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-MSX-BAN-US-2163","pl":"07/06/2026 11:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-SMX-BAN-NJ-2164","pl":"02/06/2026 11:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-SSX-BAN-US-2168","pl":"07/06/2026 11:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-SHI-BAN-BS-2158","pl":"30/05/2026 11:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-MKX-BAN-BS-2160","pl":"31/05/2026 11:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-RMX-BAN-BS-2153","pl":"31/05/2026 11:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-SCX-AND-BB-2145","pl":"22/05/2026 00:00:00","c":"BHOOMI BHAGAT"},{"r":"MK-WK-RSX-BAN-BS-2132","pl":"20/05/2026 00:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-SMX-BAN-AC-2115","pl":"16/06/2026 11:00:00","c":"TANYA KEDARE"},{"r":"MK-WK-SMX-BAN-AC-2116","pl":"16/06/2026 11:00:00","c":"TANYA KEDARE"},{"r":"MK-WK-ASX-BAN-BS-2121","pl":"05/06/2026 11:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-AHX-BAN-AW-2123","pl":"18/05/2026 00:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-FSA-BAN-AW-2126","pl":"18/05/2026 00:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-NMX-BAN-DB-2100","pl":"30/05/2026 11:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-RPX-BAN-NA-2083","pl":"16/06/2026 11:00:00","c":"TANYA KEDARE"},{"r":"MK-WK-SKX-BAN-TA-2539","pl":"14/06/2026 11:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-IJX-AND-BB-2064","pl":"06/06/2026 11:00:00","c":"NA"},{"r":"MK-WK-SCX-BAN-SV-2516","pl":"29/06/2026 11:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-MPX-BAN-SV-2498","pl":"17/05/2026 11:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-NZX-BAN-TA-2483","pl":"02/06/2026 11:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-SKX-BAN-SV-2465","pl":"14/06/2026 11:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-PTX-BAN-SV-2428","pl":"17/05/2026 11:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-SPX-BAN-SV-2429","pl":"09/06/2026 11:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-ZSX-BAN-SV-2430","pl":"17/05/2026 11:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-VSX-BAN-TA-2379","pl":"18/06/2026 11:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-VIS-BAN-SM-2353","pl":"16/06/2026 11:00:00","c":"SRAVANI MAHARANA"},{"r":"MK-WK-AMJ-BAN-SV-2355","pl":"09/06/2026 11:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-ESX-BAN-TA-2357","pl":"31/05/2026 11:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-DRX-AND-NA-2305","pl":"30/05/2026 11:00:00","c":"NA"},{"r":"MK-WK-OLI-BAN-TA-2313","pl":"03/09/2026 11:00:00","c":"TEHREEM ANSARI"},{"r":"MK-WK-TKX-BAN-TK-2215","pl":"02/06/2026 11:00:00","c":"TANYA KEDARE"},{"r":"MK-WK-ASX-AND-NA-2208","pl":"28/05/2026 11:00:00","c":"NA"},{"r":"MK-WK-MGX-BAN-SV-2118","pl":"15/05/2026 00:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-ANX-BAN-SV-5111","pl":"09/06/2026 11:00:00","c":"SHRUTI VORA"},{"r":"MK-WK-AHX-BAN-SM-3892","pl":"01/11/2026 00:00:00","c":"SRAVANI MAHARANA"},{"r":"MK-WK-RNX-BAN-SV-3876","pl":"01/05/2026 00:00:00","c":"SHRUTI VORA"}];
}

function normalizeNbImportedDateOnly_(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const dd = String(m[1]).padStart(2, '0');
    const mm = String(m[2]).padStart(2, '0');
    const yyyy = m[3];
    return yyyy + '-' + mm + '-' + dd;
  }
  return normalizeFilterDate_(text);
}

function normalizeNbImportedDateTime_(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const dd = String(m[1]).padStart(2, '0');
    const mm = String(m[2]).padStart(2, '0');
    const yyyy = m[3];
    const hh = String(m[4] || '00').padStart(2, '0');
    const mi = String(m[5] || '00').padStart(2, '0');
    const ss = String(m[6] || '00').padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + mi + ':' + ss;
  }
  const d = parseDateSafe_(text);
  return d ? Utilities.formatDate(d, NB_FOLLOWUP_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss') : text;
}

function mapLegacyNbFollowupStatus_(value) {
  const s = upperTrim_(value);
  if (!s || s === 'PENDING') return 'PENDING';
  if (s === 'YES (CLIENT NEED FOLLOW-UP)') return 'INTERESTED - NEED FOLLOW UP';
  if (s === 'NO (CLIENT ASKED FOR APPOINTMENT)') return 'VISIT PLANNED';
  if (s === 'NO (CALL NOT CONNECTED)' || s === 'RINGING / NOT ANSWERED' || s === 'SWITCHED OFF' || s === 'BUSY / DECLINED') return 'CALL NOT PICKED';
  return s;
}

function applyLegacyNotBoughtFollowupsFromUploadedCsv_() {
  initializeNotBoughtFollowupSystem();

  const state = readNbFollowupMasterState_();
  const headers = state.headers;
  const refMap = {};
  state.rows.forEach(rec => {
    const ref = upperTrim_(rec.obj['REFERENCE NUMBER']);
    if (ref) refMap[ref] = rec;
  });

  const hist = getNbFollowupSheet_(NB_FOLLOWUP_CONFIG.SHEETS.HISTORY);
  const histValues = hist.getDataRange().getValues();
  const histHeaders = histValues[0] || getNbFollowupHistoryHeaders_();
  const existingHistory = new Set();
  for (let i = 1; i < histValues.length; i++) {
    const h = rowToHeaderMap_(histHeaders, histValues[i]);
    existingHistory.add([
      upperTrim_(h['REFERENCE NUMBER']),
      asText_(h['FOLLOW UP DATE']).trim(),
      upperTrim_(h['NEW STATUS']),
      asText_(h['REMARK']).trim()
    ].join('|'));
  }

  let plannedUpdated = 0;
  getLegacyNbFollowupPlannedRows_().forEach(item => {
    const rec = refMap[upperTrim_(item.r)];
    if (!rec) return;
    const obj = Object.assign({}, rec.obj);
    if (isNbDoneStatus_(obj['FOLLOW UP STATUS']) || isNbDoneStatus_(obj['FINAL OUTCOME'])) return;
    if (Number(obj['FOLLOW UP COUNT'] || 0) > 0) return;
    const plannedDate = normalizeNbImportedDateOnly_(item.pl);
    if (!plannedDate) return;
    if (asText_(obj['NEXT FOLLOW UP DATE']).trim() !== plannedDate) {
      obj['NEXT FOLLOW UP DATE'] = plannedDate;
      obj['UPDATED ON'] = nowTs_();
      state.sheet.getRange(rec.rowIndex, 1, 1, headers.length).setValues([headers.map(h => obj[h] != null ? obj[h] : '')]);
      rec.obj = obj;
      plannedUpdated++;
    }
  });

  const rows = getLegacyNbFollowupTakenRows_().slice().sort((a, b) => {
    const da = parseDateSafe_(normalizeNbImportedDateTime_(a.a || a.pl)) || new Date(0);
    const db = parseDateSafe_(normalizeNbImportedDateTime_(b.a || b.pl)) || new Date(0);
    return da - db;
  });

  const rowsToAppend = [];
  let updated = 0;
  let historyAdded = 0;
  let skippedMissing = 0;

  rows.forEach(item => {
    const rec = refMap[upperTrim_(item.r)];
    if (!rec) { skippedMissing++; return; }

    const obj = Object.assign({}, rec.obj);
    const oldStatus = asText_(obj['FOLLOW UP STATUS']).trim() || 'PENDING';
    const newStatus = mapLegacyNbFollowupStatus_(item.s);
    const followDate = normalizeNbImportedDateOnly_(item.a || item.pl) || getTodayNbDateString_();
    const followTs = normalizeNbImportedDateTime_(item.a || item.pl) || nowTs_();
    const nextDate = normalizeNbImportedDateOnly_(item.nx);
    const remark = asText_(item.m).trim();
    const actionPoint = asText_(obj['ACTION POINT']).trim();
    const histKey = [upperTrim_(item.r), followDate, upperTrim_(newStatus), remark].join('|');

    if (!existingHistory.has(histKey)) {
      rowsToAppend.push([
        followTs,
        asText_(obj['CLIENT ID']).trim(),
        asText_(obj['REFERENCE NUMBER']).trim(),
        asText_(obj['CLIENT NAME']).trim() || item.n || '',
        asText_(obj['PRIMARY PHONE']).trim() || asText_(obj['BILLING PHONE']).trim() || item.p || '',
        upperTrim_(item.c || obj['CRM NAME']),
        oldStatus,
        newStatus,
        followDate,
        isNbDoneStatus_(newStatus) ? '' : (nextDate || asText_(obj['NEXT FOLLOW UP DATE']).trim()),
        upperTrim_(item.s),
        remark,
        actionPoint,
        upperTrim_(item.c || obj['CRM NAME']) || 'LEGACY CSV IMPORT'
      ]);
      existingHistory.add(histKey);
      historyAdded++;
    }

    obj['UPDATED ON'] = nowTs_();
    obj['CRM NAME'] = upperTrim_(item.c || obj['CRM NAME']) || obj['CRM NAME'];
    obj['FOLLOW UP STATUS'] = newStatus;
    obj['LAST FOLLOW UP DATE'] = followDate;
    obj['FOLLOW UP COUNT'] = Math.max(Number(obj['FOLLOW UP COUNT'] || 0), Number(item.f || 1));
    obj['LAST FOLLOW UP REMARK'] = remark || obj['LAST FOLLOW UP REMARK'];
    if (isNbDoneStatus_(newStatus)) {
      obj['NEXT FOLLOW UP DATE'] = '';
      obj['FINAL OUTCOME'] = newStatus;
    } else if (nextDate) {
      obj['NEXT FOLLOW UP DATE'] = nextDate;
    }

    state.sheet.getRange(rec.rowIndex, 1, 1, headers.length).setValues([headers.map(h => obj[h] != null ? obj[h] : '')]);
    rec.obj = obj;
    updated++;
  });

  appendRowsIfAny_(hist, rowsToAppend);
  return { ok: true, updated, historyAdded, plannedUpdated, skippedMissing };
}

function importLegacyNotBoughtFollowupsManual() {
  const res = applyLegacyNotBoughtFollowupsFromUploadedCsv_();
  SpreadsheetApp.getUi().alert(
    'Legacy Not Bought follow-ups imported.\n\n' +
    'Master records updated: ' + res.updated + '\n' +
    'History rows added: ' + res.historyAdded + '\n' +
    'Pending planned dates updated: ' + res.plannedUpdated + '\n' +
    'Missing references skipped: ' + res.skippedMissing
  );
}

function initializeNotBoughtFollowupSystemManual() {
  const res = initializeNotBoughtFollowupSystem();
  SpreadsheetApp.getUi().alert(res.message);
}

function syncNotBoughtFollowupsFromWalkinManual() {
  const res = syncNotBoughtFollowupsFromWalkin();
  SpreadsheetApp.getUi().alert(res.message);
}

function cleanupNotBoughtBlankRowsManual() {
  const res = cleanupNotBoughtBlankRows_();
  SpreadsheetApp.getUi().alert(
    'Blank rows removed.\n\n' +
    'Active follow-up: ' + res.activeMasterDeleted + '\n' +
    'Active history: ' + res.activeHistoryDeleted + '\n' +
    'Closed follow-up: ' + res.closedMasterDeleted + '\n' +
    'Closed history: ' + res.closedHistoryDeleted
  );
}


/**************************************************************
 * ADD-ON MODULE: REFERRALS CALLING FOLLOW UP SYSTEM
 * Added without changing old CRM / Not Bought logic.
 * Purpose:
 * - Import referrals given by clients from WALKIN source REFERRALS sheet
 * - Import already-done referral calling from REFERENCES GIVEN BY CLIENT > FMS
 * - Maintain one master REFERRALS sheet + full REFERRALS HISTORY sheet
 * - Show who gave the referral so CRM knows the source client while calling
 **************************************************************/
const REFERRAL_CALLING_CONFIG = {
  // If this ID is incomplete/invalid, code will auto-find the file by name below.
  SPREADSHEET_ID: '1v7eeF9sYqxQtiqMf1zVfvbmiydC3npAK76Libs',
  SPREADSHEET_NAME: 'REFERENCES GIVEN BY CLIENT',
  RAW_SHEET_NAME: 'REFERRALS',
  FMS_SHEET_NAME: 'FMS',
  HISTORY_SHEET_NAME: 'REFERRALS HISTORY',
  TIMEZONE: CRM_CONFIG.TIMEZONE,
  ACTIVE_STATUSES: [
    'PENDING',
    'FOLLOW REQUIRED',
    'CALL NOT PICKED',
    'NOT ANSWERED',
    'CALL CONNECTED',
    'YES INTERESTED',
    'INTERESTED - NEED FOLLOW UP',
    'VISIT PLANNED',
    'WHATSAPP SENT'
  ],
  DONE_STATUSES: [
    'CONVERTED TO CLIENT',
    'ALREADY PURCHASED FROM MK JEWELS',
    'NOT INTERESTED',
    'NO REQUIREMENT AT THE MOMENT',
    'WRONG NUMBER',
    'DO NOT CALL'
  ]
};

function getReferralMasterHeaders_() {
  return [
    'CREATED ON',
    'UPDATED ON',
    'REFERRAL KEY',
    'SOURCE',
    'CRM NAME',
    'SALESPERSON',
    'REFERRAL GIVEN BY CLIENT',
    'REFERRAL NAME',
    'REFERRAL NUMBER',
    'ASSIGNED CRM / DOER',
    'FOLLOW UP STATUS',
    'NEXT FOLLOW UP DATE',
    'LAST FOLLOW UP DATE',
    'FOLLOW UP COUNT',
    'LAST FOLLOW UP REMARK',
    'CONVERTED CLIENT ID',
    'CONVERTED ON',
    'ACTION POINT'
  ];
}

function getReferralHistoryHeaders_() {
  return [
    'TIMESTAMP',
    'REFERRAL KEY',
    'REFERRAL GIVEN BY CLIENT',
    'REFERRAL NAME',
    'REFERRAL NUMBER',
    'CRM NAME',
    'OLD STATUS',
    'NEW STATUS',
    'FOLLOW UP DATE',
    'NEXT FOLLOW UP DATE',
    'CALL RESPONSE',
    'REMARK',
    'ENTERED BY',
    'SOURCE'
  ];
}

function getReferralSpreadsheet_() {
  /************************************************************
   * Robust open logic for REFERENCES GIVEN BY CLIENT file.
   * Earlier sync failed with: Illegal spreadsheet id or key.
   * This happens when the pasted ID is incomplete/invalid.
   * So we first try the configured ID, and if Google rejects it,
   * we auto-find the spreadsheet by exact file name in Drive.
   ************************************************************/
  const configuredId = String(REFERRAL_CALLING_CONFIG.SPREADSHEET_ID || '').trim();

  if (configuredId) {
    try {
      return SpreadsheetApp.openById(configuredId);
    } catch (err) {
      Logger.log('Referral spreadsheet openById failed: ' + err);
    }
  }

  const fileName = String(REFERRAL_CALLING_CONFIG.SPREADSHEET_NAME || 'REFERENCES GIVEN BY CLIENT').trim();
  const files = DriveApp.getFilesByName(fileName);

  while (files.hasNext()) {
    const file = files.next();
    try {
      if (file.getMimeType() === MimeType.GOOGLE_SHEETS) {
        return SpreadsheetApp.openById(file.getId());
      }
    } catch (e) {
      Logger.log('Referral spreadsheet open by Drive file failed: ' + e);
    }
  }

  throw new Error(
    'REFERENCES GIVEN BY CLIENT spreadsheet not found. ' +
    'Please make sure the Apps Script owner has access to the Google Sheet named "' + fileName + '".'
  );
}

function getReferralSheet_(sheetName, headers) {
  const ss = getReferralSpreadsheet_();
  let sh = ss.getSheetByName(sheetName);
  if (!sh) sh = ss.insertSheet(sheetName);

  const existing = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  const mismatch = headers.some((h, i) => String(existing[i] || '').trim() !== h);
  if (sh.getLastRow() === 0 || mismatch) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function getReferralMasterSheet_() {
  return getReferralSheet_(REFERRAL_CALLING_CONFIG.RAW_SHEET_NAME, getReferralMasterHeaders_());
}

function getReferralHistorySheet_() {
  return getReferralSheet_(REFERRAL_CALLING_CONFIG.HISTORY_SHEET_NAME, getReferralHistoryHeaders_());
}

function initializeReferralCallingSystem() {
  getReferralMasterSheet_();
  getReferralHistorySheet_();
  return { ok: true, message: 'Referral Calling sheets initialized.' };
}

function referralClean_(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function referralUpper_(value) {
  return referralClean_(value).toUpperCase();
}

function referralPhone_(value) {
  return String(value || '').replace(/\D/g, '');
}

function referralLast10_(value) {
  const d = referralPhone_(value);
  return d ? d.slice(-10) : '';
}

function referralKey_(referralName, referralNumber, givenBy) {
  const phone = referralLast10_(referralNumber);
  const name = referralUpper_(referralName).replace(/[^A-Z0-9]/g, '');
  const by = referralUpper_(givenBy).replace(/[^A-Z0-9]/g, '').slice(0, 20);
  return (phone || name || 'REF') + '|' + name + '|' + by;
}

function referralDateToday_() {
  return Utilities.formatDate(new Date(), REFERRAL_CALLING_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function referralNow_() {
  return Utilities.formatDate(new Date(), REFERRAL_CALLING_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

function isReferralDoneStatus_(status) {
  const s = referralUpper_(status);
  return REFERRAL_CALLING_CONFIG.DONE_STATUSES.map(referralUpper_).indexOf(s) >= 0;
}

function normalizeReferralStatusFromFms_(status) {
  const s = referralUpper_(status);
  if (!s) return 'PENDING';
  if (s.indexOf('NOT INTERESTED') >= 0) return 'NOT INTERESTED';
  if (s.indexOf('YES INTEREST') >= 0) return 'YES INTERESTED';
  if (s.indexOf('FOLLOW') >= 0) return 'FOLLOW REQUIRED';
  if (s.indexOf('WRONG') >= 0) return 'WRONG NUMBER';
  if (s.indexOf('CONVERT') >= 0) return 'CONVERTED TO CLIENT';
  return s;
}

function buildReferralActionPoint_(obj) {
  const status = referralUpper_(obj.status || obj.followUpStatus);
  if (status.indexOf('YES INTEREST') >= 0 || status.indexOf('INTEREST') >= 0) {
    return 'Referral Interested: Call again, introduce MK Jewels with referral giver name, understand occasion/budget/category, share catalogue on WhatsApp, and book store visit.';
  }
  if (status.indexOf('FOLLOW') >= 0 || status.indexOf('PENDING') >= 0) {
    return 'Referral Follow Up: Call using referral giver name for trust, confirm jewellery requirement, note occasion/budget, and set next follow-up date.';
  }
  return 'Referral Calling: Politely call the referral, mention who referred them, explain MK Jewels, understand requirement, and update status with remark.';
}

function readReferralMasterState_() {
  const sh = getReferralMasterSheet_();
  const values = sh.getDataRange().getValues();
  const headers = values[0] || getReferralMasterHeaders_();
  const map = new Map();
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const obj = rowToHeaderMap_(headers, values[i]);
    const key = referralClean_(obj['REFERRAL KEY']) || referralKey_(obj['REFERRAL NAME'], obj['REFERRAL NUMBER'], obj['REFERRAL GIVEN BY CLIENT']);
    if (!key || key === 'REF||') continue;
    map.set(key, { rowIndex: i + 1, obj });
    rows.push({ rowIndex: i + 1, obj });
  }
  return { sheet: sh, headers, map, rows };
}

function updateReferralMasterRow_(state, rec, obj) {
  obj['UPDATED ON'] = referralNow_();
  state.sheet.getRange(rec.rowIndex, 1, 1, state.headers.length)
    .setValues([state.headers.map(h => obj[h] != null ? obj[h] : '')]);
  rec.obj = obj;
}

function appendReferralHistory_(row) {
  const sh = getReferralHistorySheet_();
  appendRowsIfAny_(sh, [row]);
}

function readReferralRowsFromWalkinSource_() {
  const out = [];
  let sh = null;
  try { sh = getWalkinSpreadsheet_().getSheetByName(REFERRAL_CALLING_CONFIG.RAW_SHEET_NAME); } catch (e) { sh = null; }
  if (!sh || sh.getLastRow() < 2) return out;

  const values = sh.getDataRange().getValues();
  const headers = values[0].map(cleanHeader_);
  const idx = function(names, fallback) {
    for (let i = 0; i < names.length; i++) {
      const p = cleanHeader_(names[i]);
      const found = headers.indexOf(p);
      if (found >= 0) return found;
    }
    return fallback;
  };

  const cCrm = idx(['CRM NAME'], 0);
  const cSales = idx(['SALES PERSON', 'SALESPERSON'], 1);
  const cGivenBy = idx(['REFERENCE GIVEN BY', 'REFERRAL GIVEN BY', 'CLIENT NAME', 'REFERENCE GIVEN BY CLIENT'], 2);
  const cName = idx(['REFERRAL NAME', 'NAME OF THE REFERENCE', 'NAME OF THE REFRENCE', 'NAME OF THE REFERRAL'], 3);
  const cNo = idx(['REFERRAL NUMBER', 'NUMBER OF THE REFERENCE', 'NUMBER OF REFERENCE'], 4);

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const referralName = referralUpper_(row[cName]);
    const referralNumber = referralPhone_(row[cNo]);
    if (!referralName && !referralNumber) continue;
    out.push({
      source: 'WALKIN REFERRALS',
      crmName: referralUpper_(row[cCrm]),
      salesperson: referralUpper_(row[cSales]),
      givenBy: referralUpper_(row[cGivenBy]),
      referralName,
      referralNumber,
      assignedCrm: referralUpper_(row[cCrm]),
      status: 'PENDING',
      nextFollowUpDate: referralDateToday_(),
      followUpDate: '',
      callResponse: '',
      remark: '',
      enteredBy: 'SYSTEM IMPORT'
    });
  }
  return out;
}

function readReferralRowsFromFms_() {
  const out = [];
  let sh = null;
  try { sh = getReferralSpreadsheet_().getSheetByName(REFERRAL_CALLING_CONFIG.FMS_SHEET_NAME); } catch (e) { sh = null; }
  if (!sh || sh.getLastRow() < 8) return out;

  const values = sh.getDataRange().getValues();
  const headerRowIndex = 6; // row 7 in sheet
  const headers = (values[headerRowIndex] || []).map(cleanHeader_);
  const idx = function(names, fallback) {
    for (let i = 0; i < names.length; i++) {
      const p = cleanHeader_(names[i]);
      const found = headers.indexOf(p);
      if (found >= 0) return found;
    }
    return fallback;
  };

  const cTs = idx(['TIMESTAMP'], 0);
  const cCrm = idx(['NAME OF THE CRM', 'CRM NAME'], 1);
  const cSales = idx(['NAME OF SALESPERSON', 'NAME OF THE SALESPERSON', 'SALESPERSON'], 2);
  const cGivenBy = idx(['REFERENCE GIVEN BY', 'REFERRAL GIVEN BY'], 3);
  const cName = idx(['NAME OF THE REFERENCE', 'NAME OF THE REFRENCE', 'REFERRAL NAME'], 4);
  const cNo = idx(['NUMBER OF THE REFERENCE', 'REFERRAL NUMBER'], 5);
  const cDoer = idx(['DOER'], 10);
  const cActual = idx(['ACTUAL TIME'], 11);
  const cStatus = idx(['STATUS'], 13);
  const cRemark = idx(['REMARK'], 14);

  for (let r = headerRowIndex + 1; r < values.length; r++) {
    const row = values[r];
    const referralName = referralUpper_(row[cName]);
    const referralNumber = referralPhone_(row[cNo]);
    if (!referralName && !referralNumber) continue;
    const status = normalizeReferralStatusFromFms_(row[cStatus]);
    const actualDate = normalizeFilterDate_(row[cActual]) || normalizeFilterDate_(row[cTs]) || referralDateToday_();
    out.push({
      source: 'FMS OLD CALLING',
      crmName: referralUpper_(row[cCrm]),
      salesperson: referralUpper_(row[cSales]),
      givenBy: referralUpper_(row[cGivenBy]),
      referralName,
      referralNumber,
      assignedCrm: referralUpper_(row[cDoer]) || referralUpper_(row[cCrm]),
      status,
      nextFollowUpDate: isReferralDoneStatus_(status) ? '' : referralDateToday_(),
      followUpDate: actualDate,
      callResponse: status,
      remark: referralClean_(row[cRemark]),
      enteredBy: referralUpper_(row[cDoer]) || 'FMS IMPORT'
    });
  }
  return out;
}

function findConvertedClientIdByReferralPhone_(phone) {
  const last = referralLast10_(phone);
  if (!last) return '';
  try {
    const sh = getCrmSheet_(CRM_CONFIG.SHEETS.MASTER);
    const values = sh.getDataRange().getValues();
    if (values.length < 2) return '';
    const headers = values[0].map(cleanHeader_);
    const cId = headers.indexOf('CLIENT ID');
    const cPrimary = headers.indexOf('PRIMARY PHONE');
    const cSecondary = headers.indexOf('SECONDARY PHONE');
    const cBilling = headers.indexOf('BILLING PHONE');
    const cOther = headers.indexOf('OTHER KNOWN PHONES');
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const phones = [row[cPrimary], row[cSecondary], row[cBilling], row[cOther]].join(' ');
      if (referralPhone_(phones).indexOf(last) >= 0) return String(row[cId] || '').trim();
    }
  } catch (e) {}
  return '';
}

function syncReferralCallingData() {
  initializeReferralCallingSystem();
  initializeCrmSystem(false);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return { ok: false, message: 'Another Referral Calling sync is already running. Please wait and try again.' };
  }

  try {
    const state = readReferralMasterState_();
    const sourceRows = readReferralRowsFromWalkinSource_().concat(readReferralRowsFromFms_());
    const out = [];
    let added = 0, updated = 0, historyAdded = 0, converted = 0;

    sourceRows.forEach(item => {
      const key = referralKey_(item.referralName, item.referralNumber, item.givenBy);
      if (!key) return;
      const convertedClientId = findConvertedClientIdByReferralPhone_(item.referralNumber);
      const now = referralNow_();
      const existing = state.map.get(key);

      if (!existing) {
        let status = item.status || 'PENDING';
        let convertedOn = '';
        if (convertedClientId && !isReferralDoneStatus_(status)) {
          status = 'CONVERTED TO CLIENT';
          convertedOn = referralDateToday_();
          converted++;
        }
        const obj = {
          'CREATED ON': now,
          'UPDATED ON': now,
          'REFERRAL KEY': key,
          'SOURCE': item.source,
          'CRM NAME': item.crmName || item.assignedCrm || '',
          'SALESPERSON': item.salesperson || '',
          'REFERRAL GIVEN BY CLIENT': item.givenBy || '',
          'REFERRAL NAME': item.referralName || '',
          'REFERRAL NUMBER': item.referralNumber || '',
          'ASSIGNED CRM / DOER': item.assignedCrm || item.crmName || '',
          'FOLLOW UP STATUS': status,
          'NEXT FOLLOW UP DATE': isReferralDoneStatus_(status) ? '' : (item.nextFollowUpDate || referralDateToday_()),
          'LAST FOLLOW UP DATE': item.followUpDate || '',
          'FOLLOW UP COUNT': item.followUpDate || item.remark ? 1 : 0,
          'LAST FOLLOW UP REMARK': item.remark || '',
          'CONVERTED CLIENT ID': convertedClientId || '',
          'CONVERTED ON': convertedOn,
          'ACTION POINT': buildReferralActionPoint_(item)
        };
        out.push(getReferralMasterHeaders_().map(h => obj[h] != null ? obj[h] : ''));
        state.map.set(key, { rowIndex: state.sheet.getLastRow() + out.length, obj });
        added++;

        if (item.followUpDate || item.remark || item.source === 'FMS OLD CALLING') {
          appendReferralHistory_([now, key, item.givenBy, item.referralName, item.referralNumber, item.assignedCrm || item.crmName, '', status, item.followUpDate || referralDateToday_(), obj['NEXT FOLLOW UP DATE'], item.callResponse || status, item.remark || 'Imported from FMS.', item.enteredBy || 'SYSTEM IMPORT', item.source]);
          historyAdded++;
        }
        if (convertedClientId) {
          appendReferralHistory_([now, key, item.givenBy, item.referralName, item.referralNumber, item.assignedCrm || item.crmName, status, 'CONVERTED TO CLIENT', referralDateToday_(), '', 'AUTO DETECTED', 'Referral number found in CLIENT DATABASE MASTER as ' + convertedClientId, 'SYSTEM AUTO CONVERT', 'AUTO CONVERSION CHECK']);
          historyAdded++;
        }
      } else {
        const obj = Object.assign({}, existing.obj);
        const oldStatus = referralClean_(obj['FOLLOW UP STATUS']) || 'PENDING';
        let changed = false;
        ['CRM NAME','SALESPERSON','REFERRAL GIVEN BY CLIENT','REFERRAL NAME','REFERRAL NUMBER','ASSIGNED CRM / DOER'].forEach(h => {
          const map = {
            'CRM NAME': item.crmName || item.assignedCrm,
            'SALESPERSON': item.salesperson,
            'REFERRAL GIVEN BY CLIENT': item.givenBy,
            'REFERRAL NAME': item.referralName,
            'REFERRAL NUMBER': item.referralNumber,
            'ASSIGNED CRM / DOER': item.assignedCrm || item.crmName
          };
          if (!referralClean_(obj[h]) && referralClean_(map[h])) { obj[h] = map[h]; changed = true; }
        });
        if (item.source && String(obj['SOURCE'] || '').indexOf(item.source) < 0) { obj['SOURCE'] = mergeCsvField_(obj['SOURCE'], item.source); changed = true; }
        if (item.source === 'FMS OLD CALLING' && item.remark) {
          obj['FOLLOW UP STATUS'] = item.status || oldStatus;
          obj['LAST FOLLOW UP DATE'] = item.followUpDate || obj['LAST FOLLOW UP DATE'];
          obj['LAST FOLLOW UP REMARK'] = item.remark;
          obj['FOLLOW UP COUNT'] = Math.max(Number(obj['FOLLOW UP COUNT'] || 0), 1);
          if (!isReferralDoneStatus_(obj['FOLLOW UP STATUS'])) obj['NEXT FOLLOW UP DATE'] = referralDateToday_();
          else obj['NEXT FOLLOW UP DATE'] = '';
          changed = true;
          appendReferralHistory_([referralNow_(), key, item.givenBy, item.referralName, item.referralNumber, item.assignedCrm || item.crmName, oldStatus, obj['FOLLOW UP STATUS'], item.followUpDate || referralDateToday_(), obj['NEXT FOLLOW UP DATE'], item.callResponse || item.status, item.remark, item.enteredBy || 'FMS IMPORT', item.source]);
          historyAdded++;
        }
        if (convertedClientId && !referralClean_(obj['CONVERTED CLIENT ID'])) {
          obj['CONVERTED CLIENT ID'] = convertedClientId;
          obj['CONVERTED ON'] = referralDateToday_();
          obj['FOLLOW UP STATUS'] = 'CONVERTED TO CLIENT';
          obj['NEXT FOLLOW UP DATE'] = '';
          changed = true;
          converted++;
          appendReferralHistory_([referralNow_(), key, obj['REFERRAL GIVEN BY CLIENT'], obj['REFERRAL NAME'], obj['REFERRAL NUMBER'], obj['ASSIGNED CRM / DOER'] || obj['CRM NAME'], oldStatus, 'CONVERTED TO CLIENT', referralDateToday_(), '', 'AUTO DETECTED', 'Referral number found in CLIENT DATABASE MASTER as ' + convertedClientId, 'SYSTEM AUTO CONVERT', 'AUTO CONVERSION CHECK']);
          historyAdded++;
        }
        if (changed) { updateReferralMasterRow_(state, existing, obj); updated++; }
      }
    });

    appendRowsIfAny_(state.sheet, out);

    return { ok: true, added, updated, historyAdded, converted, message: 'Referral Calling sync completed. Added: ' + added + ', Updated: ' + updated + ', History added: ' + historyAdded + ', Converted detected: ' + converted + '.' };
  } finally {
    lock.releaseLock();
  }
}

function getReferralCallingBootstrap() {
  initializeReferralCallingSystem();
  const crmSet = new Set();
  const state = readReferralMasterState_();
  state.rows.forEach(r => {
    const a = referralUpper_(r.obj['ASSIGNED CRM / DOER'] || r.obj['CRM NAME']);
    if (a) crmSet.add(a);
  });
  getAllCrmNames_().forEach(c => crmSet.add(c));
  return { ok: true, crmNames: Array.from(crmSet).sort(), activeStatuses: REFERRAL_CALLING_CONFIG.ACTIVE_STATUSES, doneStatuses: REFERRAL_CALLING_CONFIG.DONE_STATUSES, today: referralDateToday_() };
}

function referralObjToClient_(obj, historyCountMap) {
  const key = referralClean_(obj['REFERRAL KEY']);
  return {
    createdOn: referralClean_(obj['CREATED ON']),
    updatedOn: referralClean_(obj['UPDATED ON']),
    referralKey: key,
    source: referralClean_(obj['SOURCE']),
    crmName: referralClean_(obj['CRM NAME']),
    salesperson: referralClean_(obj['SALESPERSON']),
    givenBy: referralClean_(obj['REFERRAL GIVEN BY CLIENT']),
    referralName: referralClean_(obj['REFERRAL NAME']),
    referralNumber: referralClean_(obj['REFERRAL NUMBER']),
    assignedCrm: referralClean_(obj['ASSIGNED CRM / DOER']),
    followUpStatus: referralClean_(obj['FOLLOW UP STATUS']),
    nextFollowUpDate: referralClean_(obj['NEXT FOLLOW UP DATE']),
    lastFollowUpDate: referralClean_(obj['LAST FOLLOW UP DATE']),
    followUpCount: Number(obj['FOLLOW UP COUNT']) || 0,
    lastFollowUpRemark: referralClean_(obj['LAST FOLLOW UP REMARK']),
    convertedClientId: referralClean_(obj['CONVERTED CLIENT ID']),
    convertedOn: referralClean_(obj['CONVERTED ON']),
    actionPoint: referralClean_(obj['ACTION POINT']),
    historyCount: historyCountMap[key] || 0
  };
}

function getReferralHistoryCountMap_() {
  const sh = getReferralHistorySheet_();
  const values = sh.getDataRange().getValues();
  const map = {};
  if (values.length < 2) return map;
  const headers = values[0];
  for (let i = 1; i < values.length; i++) {
    const obj = rowToHeaderMap_(headers, values[i]);
    const key = referralClean_(obj['REFERRAL KEY']);
    if (!key) continue;
    map[key] = (map[key] || 0) + 1;
  }
  return map;
}

function getReferralCallingRows(filter) {
  initializeReferralCallingSystem();
  const f = filter || {};
  const tab = referralUpper_(f.tab || 'TODAY');
  const crmFilter = referralUpper_(f.crmName || '');
  const q = referralUpper_(f.query || '');
  const today = referralDateToday_();

  const state = readReferralMasterState_();
  const histMap = getReferralHistoryCountMap_();
  let rows = state.rows.map(r => referralObjToClient_(r.obj, histMap));

  if (crmFilter && crmFilter !== 'ALL') {
    rows = rows.filter(r => referralUpper_(r.assignedCrm || r.crmName) === crmFilter);
  }
  if (q) {
    const qDigits = referralPhone_(q);
    rows = rows.filter(r => {
      const text = [r.givenBy, r.referralName, r.referralNumber, r.assignedCrm, r.crmName, r.followUpStatus, r.lastFollowUpRemark].join(' ').toUpperCase();
      return text.indexOf(q) >= 0 || (qDigits && referralPhone_(r.referralNumber).indexOf(qDigits) >= 0);
    });
  }

  if (tab === 'DONE') {
    rows = rows.filter(r => isReferralDoneStatus_(r.followUpStatus));
  } else if (tab === 'INPROCESS') {
    rows = rows.filter(r => !isReferralDoneStatus_(r.followUpStatus) && (Number(r.followUpCount || 0) > 0 || referralUpper_(r.followUpStatus) !== 'PENDING'));
  } else if (tab === 'PENDING') {
    rows = rows.filter(r => !isReferralDoneStatus_(r.followUpStatus));
  } else if (tab === 'CONVERTED') {
    rows = rows.filter(r => !!r.convertedClientId || referralUpper_(r.followUpStatus) === 'CONVERTED TO CLIENT');
  } else {
    rows = rows.filter(r => !isReferralDoneStatus_(r.followUpStatus) && (!normalizeFilterDate_(r.nextFollowUpDate) || normalizeFilterDate_(r.nextFollowUpDate) === today));
  }

  rows.sort((a, b) => {
    const da = parseDateSafe_(a.updatedOn) || parseDateSafe_(a.nextFollowUpDate) || new Date(0);
    const db = parseDateSafe_(b.updatedOn) || parseDateSafe_(b.nextFollowUpDate) || new Date(0);
    return db - da;
  });
  return { ok: true, rows, today };
}

function saveReferralFollowup(payload) {
  initializeReferralCallingSystem();
  const p = payload || {};
  const key = referralClean_(p.referralKey);
  if (!key) throw new Error('REFERRAL KEY IS REQUIRED.');

  const state = readReferralMasterState_();
  const rec = state.map.get(key);
  if (!rec) throw new Error('Referral record not found.');

  const obj = Object.assign({}, rec.obj);
  const oldStatus = referralClean_(obj['FOLLOW UP STATUS']) || 'PENDING';
  const newStatus = referralUpper_(p.followUpStatus || oldStatus);
  const callResponse = referralUpper_(p.callResponse || 'CONNECTED');
  const remark = referralClean_(p.remark || '');
  const nextDate = normalizeFilterDate_(p.nextFollowUpDate) || '';
  const enteredBy = referralUpper_(p.enteredBy || obj['ASSIGNED CRM / DOER'] || obj['CRM NAME'] || 'CRM');

  if (!newStatus) throw new Error('FOLLOW UP STATUS IS REQUIRED.');
  if (!isReferralDoneStatus_(newStatus) && !nextDate) throw new Error('NEXT FOLLOW UP DATE IS REQUIRED.');
  if (!isReferralDoneStatus_(newStatus) && !remark) throw new Error('FOLLOW UP REMARK IS REQUIRED.');

  obj['FOLLOW UP STATUS'] = newStatus;
  obj['LAST FOLLOW UP DATE'] = referralDateToday_();
  obj['NEXT FOLLOW UP DATE'] = isReferralDoneStatus_(newStatus) ? '' : nextDate;
  obj['FOLLOW UP COUNT'] = Number(obj['FOLLOW UP COUNT'] || 0) + 1;
  obj['LAST FOLLOW UP REMARK'] = remark;
  if (newStatus === 'CONVERTED TO CLIENT') {
    obj['CONVERTED CLIENT ID'] = obj['CONVERTED CLIENT ID'] || findConvertedClientIdByReferralPhone_(obj['REFERRAL NUMBER']) || 'MANUAL CONVERTED';
    obj['CONVERTED ON'] = obj['CONVERTED ON'] || referralDateToday_();
  }
  updateReferralMasterRow_(state, rec, obj);

  appendReferralHistory_([
    referralNow_(),
    key,
    obj['REFERRAL GIVEN BY CLIENT'] || '',
    obj['REFERRAL NAME'] || '',
    obj['REFERRAL NUMBER'] || '',
    obj['ASSIGNED CRM / DOER'] || obj['CRM NAME'] || '',
    oldStatus,
    newStatus,
    referralDateToday_(),
    obj['NEXT FOLLOW UP DATE'] || '',
    callResponse,
    remark,
    enteredBy,
    'CRM FOLLOW UP FORM'
  ]);

  return { ok: true, message: 'Referral follow-up saved successfully.' };
}

function getReferralHistory(referralKey) {
  initializeReferralCallingSystem();
  const key = referralClean_(referralKey);
  const sh = getReferralHistorySheet_();
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return { ok: true, history: [] };
  const headers = values[0];
  const history = values.slice(1).map(r => rowToHeaderMap_(headers, r))
    .filter(obj => referralClean_(obj['REFERRAL KEY']) === key)
    .map(obj => ({
      timestamp: referralClean_(obj['TIMESTAMP']),
      oldStatus: referralClean_(obj['OLD STATUS']),
      newStatus: referralClean_(obj['NEW STATUS']),
      followUpDate: referralClean_(obj['FOLLOW UP DATE']),
      nextFollowUpDate: referralClean_(obj['NEXT FOLLOW UP DATE']),
      callResponse: referralClean_(obj['CALL RESPONSE']),
      remark: referralClean_(obj['REMARK']),
      enteredBy: referralClean_(obj['ENTERED BY']),
      source: referralClean_(obj['SOURCE'])
    }))
    .sort((a, b) => (parseDateSafe_(b.timestamp) || new Date(0)) - (parseDateSafe_(a.timestamp) || new Date(0)));
  return { ok: true, history };
}


