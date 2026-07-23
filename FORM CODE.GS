/************************************
 * MK JEWELS — CLIENT WALK-IN FORM
 * Backend: Code.gs (FULL)
 ************************************/

/** ====== CONFIG ====== **/
// IMPORTANT: Use fixed source spreadsheet ID for Web App edit mode.
// SpreadsheetApp.getActiveSpreadsheet() can point to the wrong file in some deployments/copies.
const SPREADSHEET_ID   = '1ILCK8wTd_njc6CHy53ujqYgJQkkd5DC4_Iv6YgL8LB4'; // 01 WALKIN DATA
const RESPONSES_SHEET  = "WALKIN DATASET";
const FORM_DATA_SHEET  = "FORM DATA";
const ENTRY_LOG_SHEET  = "CLIENT ENTRY LOG";
const REFERRALS_SHEET  = "REFERRALS";
const UPLOAD_FOLDER_ID = "1djfPTc0a300ZP030KhVlANmmCGs419DO"; // your folder id

// Used for editing old walk-in rows safely
const WALKIN_REFERENCE_HEADER = "REFERENCE NUMBER";
const WALKIN_REFERENCE_PREFIX = "MK-WK";
const WALKIN_REFERENCE_SERIAL_PROP = "MK_WALKIN_REFERENCE_LAST_SERIAL";
const WALKIN_REFERENCE_SERIAL_START = 2001;

// FINAL RULE: WALKIN DATASET REFERENCE NUMBER = column DY / 129.
// Old builds used DS / 123, so edit/search helpers also check legacy DS for old rows.
const WALKIN_REFERENCE_COL = 129; // DY
const WALKIN_LEGACY_REFERENCE_COLS = [123]; // DS old reference location

const CRM_SOURCE_SPREADSHEET_ID = '1Vsg2jXyDL1JuKv57z7QFa1OO3X6E7JsxSij1hvWAAeE';
const CRM_MASTER_SHEET_NAME = 'CLIENT DATABASE MASTER';



/** ====== SERVE HTML ====== **/
function doGet(e) {
  const t = HtmlService.createTemplateFromFile("HTML FORM");

  t.SERVER_MODE = (e && e.parameter && e.parameter.mode)
    ? String(e.parameter.mode).trim().toUpperCase()
    : "";

  t.SERVER_CLIENT_ID = (e && e.parameter && e.parameter.clientId)
    ? String(e.parameter.clientId).trim()
    : "";

  t.SERVER_TOKEN = (e && e.parameter && e.parameter.token)
    ? String(e.parameter.token).trim()
    : "";

  // Used when CRM timeline opens old walk-in entry for edit
  t.SERVER_REFERENCE_NUMBER = (e && e.parameter && e.parameter.referenceNumber)
    ? String(e.parameter.referenceNumber).trim()
    : "";

  return t.evaluate()
    .setTitle("MK JEWELS — CLIENT WALK-IN FORM")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


/** ====== QUEUE / ENTRY LOG HELPERS ====== **/
function getEntryLogHeaders_() {
  return [
    "ENTRY TIMESTAMP",
    "TOKEN",
    "CLIENT NAME",
    "MOBILE",
    "BRANCH",
    "ASSIGNED CRM",
    "STATUS",
    "FULL FORM TIMESTAMP",
    "CLIENT ID",
    "REMARK"
  ];
}


function getReferralsHeaders_() {
  return [
    "TIMESTAMP",
    "CRM NAME",
    "SALES PERSON NAME",
    "REFERENCE GIVEN BY CLIENT NAME",
    "REFERRAL NAME",
    "REFERRAL NUMBER"
  ];
}



function getOrCreateEntryLogSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(ENTRY_LOG_SHEET);
  if (!sh) sh = ss.insertSheet(ENTRY_LOG_SHEET);
  ensureHeaderRow_(sh, getEntryLogHeaders_());
  return sh;
}


function getOrCreateReferralsSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(REFERRALS_SHEET);
  if (!sh) sh = ss.insertSheet(REFERRALS_SHEET);
  ensureHeaderRow_(sh, getReferralsHeaders_());
  return sh;
}


function getEntryByToken(token) {
  const tk = String(token || "").trim();
  if (!tk) return null;

  const sh = getOrCreateEntryLogSheet_();
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return null;

  const headers = values[0].map(h => String(h || "").trim().toUpperCase());
  const rows = values.slice(1);

  const col = (name) => headers.indexOf(String(name || "").trim().toUpperCase());

  const idxToken = col("TOKEN");
  const idxClientName = col("CLIENT NAME");
  const idxMobile = col("MOBILE");
  const idxBranch = col("BRANCH");
  const idxAssignedCrm = col("ASSIGNED CRM");
  const idxStatus = col("STATUS");
  const idxClientId = col("CLIENT ID");

  if (idxToken < 0) return null;

  const found = rows.find(r => String(r[idxToken] || "").trim() === tk);
  if (!found) return null;

  const status = idxStatus >= 0 ? String(found[idxStatus] || "").trim().toUpperCase() : "";
  if (status && status !== "PENDING") return null;

  return {
    token: tk,
    name: idxClientName >= 0 ? String(found[idxClientName] || "").trim() : "",
    mobile: idxMobile >= 0 ? String(found[idxMobile] || "").trim() : "",
    branch: idxBranch >= 0 ? String(found[idxBranch] || "").trim() : "",
    crm: idxAssignedCrm >= 0 ? String(found[idxAssignedCrm] || "").trim() : "",
    clientId: idxClientId >= 0 ? String(found[idxClientId] || "").trim() : ""
  };
}

function markEntryComplete_(token) {
  const tk = String(token || "").trim();
  if (!tk) return false;

  const sh = getOrCreateEntryLogSheet_();
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return false;

  const headers = values[0].map(h => String(h || "").trim().toUpperCase());
  const col = (name) => headers.indexOf(String(name || "").trim().toUpperCase());

  const idxToken = col("TOKEN");
  const idxStatus = col("STATUS");
  const idxFullTs = col("FULL FORM TIMESTAMP");

  if (idxToken < 0 || idxStatus < 0 || idxFullTs < 0) return false;

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idxToken] || "").trim() === tk) {
      sh.getRange(r + 1, idxStatus + 1).setValue("COMPLETED");
      sh.getRange(r + 1, idxFullTs + 1).setValue(
        Utilities.formatDate(
          new Date(),
          Session.getScriptTimeZone() || "Asia/Kolkata",
          "yyyy-MM-dd HH:mm:ss"
        )
      );
      return true;
    }
  }

  return false;
}








function markEntryCompleteAndUpdateClient_(token, clientId, mobile) {
  const tk = String(token || "").trim();
  const cid = String(clientId || "").trim();
  const targetMobile = normalizeMobileForClientId_(mobile || "");

  // Earlier code stopped here when token was blank.
  // New logic: token first, mobile fallback second.
  if (!tk && !targetMobile) return false;

  const sh = getOrCreateEntryLogSheet_();
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return false;

  const headers = values[0].map(h => String(h || "").trim().toUpperCase());
  const col = (name) => headers.indexOf(String(name || "").trim().toUpperCase());

  const idxToken = col("TOKEN");
  const idxStatus = col("STATUS");
  const idxFullTs = col("FULL FORM TIMESTAMP");
  const idxClientId = col("CLIENT ID");
  const idxMobile = col("MOBILE");

  if (idxStatus < 0 || idxFullTs < 0 || idxClientId < 0) {
    throw new Error("STATUS / FULL FORM TIMESTAMP / CLIENT ID COLUMN NOT FOUND IN CLIENT ENTRY LOG.");
  }

  let targetRow = -1;

  // 1) Exact token match. Search latest to oldest.
  if (tk && idxToken >= 0) {
    for (let r = values.length - 1; r >= 1; r--) {
      if (String(values[r][idxToken] || "").trim() === tk) {
        targetRow = r + 1;
        break;
      }
    }
  }

  // 2) Mobile fallback when token is missing/not found.
  if (targetRow < 0 && targetMobile && idxMobile >= 0) {
    // Prefer latest same mobile where CLIENT ID is still blank.
    for (let r = values.length - 1; r >= 1; r--) {
      const rowMobile = normalizeMobileForClientId_(values[r][idxMobile]);
      const rowClientId = String(values[r][idxClientId] || "").trim();

      if (rowMobile && rowMobile === targetMobile && !rowClientId) {
        targetRow = r + 1;
        break;
      }
    }

    // If no blank row found, update latest same mobile row.
    if (targetRow < 0) {
      for (let r = values.length - 1; r >= 1; r--) {
        const rowMobile = normalizeMobileForClientId_(values[r][idxMobile]);

        if (rowMobile && rowMobile === targetMobile) {
          targetRow = r + 1;
          break;
        }
      }
    }
  }

  if (targetRow < 0) return false;

  sh.getRange(targetRow, idxStatus + 1).setValue("COMPLETED");
  sh.getRange(targetRow, idxFullTs + 1).setValue(
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() || "Asia/Kolkata",
      "yyyy-MM-dd HH:mm:ss"
    )
  );

  if (cid) {
    sh.getRange(targetRow, idxClientId + 1).setValue(cid);
  }

  return true;
}


function getExistingClientPrefill(clientId) {
  const id = String(clientId || "").trim();
  if (!id) {
    return { ok: false, message: "CLIENT ID IS REQUIRED." };
  }

  const ss = SpreadsheetApp.openById(CRM_SOURCE_SPREADSHEET_ID);
  const sh = ss.getSheetByName(CRM_MASTER_SHEET_NAME);
  if (!sh) {
    return { ok: false, message: "CRM MASTER SHEET NOT FOUND." };
  }

  const values = sh.getDataRange().getValues();
  if (!values || values.length < 2) {
    return { ok: false, message: "CRM MASTER HAS NO DATA." };
  }

  const headers = values[0].map(h => String(h || "").trim().toUpperCase());
  const rows = values.slice(1);

  const col = (name) => headers.indexOf(String(name).trim().toUpperCase());

  const idxClientId       = col("CLIENT ID");
  const idxPrimaryName    = col("PRIMARY NAME");
  const idxPrimaryPhone   = col("PRIMARY PHONE");
  const idxBillingPhone   = col("BILLING PHONE");
  const idxGender         = col("GENDER");
  const idxOccupation     = col("OCCUPATION");
  const idxOccupationOther = col("OCCUPATION (OTHER)");
  const idxBridalStatus   = col("BRIDAL / NON BRIDAL");
  const idxWeddingMonth   = col("MONTH OF WEDDING");
  const idxWeddingYear    = col("YEAR OF WEDDING");
  const idxCommunication  = col("COMMUNICATION PREFERENCE");
  const idxCountry        = col("COUNTRY");
  const idxState          = col("STATE");
  const idxCity           = col("CITY");
  const idxCityOther      = col("CITY OTHER");
  const idxPincode        = col("PINCODE");
  const idxAddress        = col("ADDRESS");
  const idxCommunity      = col("COMMUNITY");
  const idxCommunityOther = col("COMMUNITY OTHER");
  const idxDob            = col("DOB");
  const idxAnniversary    = col("ANNIVERSARY");
  const idxBeverage       = col("BEVERAGE");
  const idxSugar          = col("SUGAR");
  const idxSnack          = col("SNACK");
  const idxPotential      = col("CLIENT POTENTIAL CATEGORY");
  const idxHighPotential  = col("HIGH POTENTIAL REASON");

  if (idxClientId < 0) {
    return { ok: false, message: "CLIENT ID COLUMN NOT FOUND IN CRM MASTER." };
  }

  const found = rows.find(r => String(r[idxClientId] || "").trim() === id);
  if (!found) {
    return { ok: false, message: "CLIENT NOT FOUND." };
  }

  return {
    ok: true,
    data: {
      client_id: id,
      client_name: idxPrimaryName >= 0 ? String(found[idxPrimaryName] || "").trim() : "",
      client_phone: idxPrimaryPhone >= 0 ? String(found[idxPrimaryPhone] || "").trim() : "",
      billing_phone: idxBillingPhone >= 0 ? String(found[idxBillingPhone] || "").trim() : "",
      gender: idxGender >= 0 ? String(found[idxGender] || "").trim().toUpperCase() : "",
      occupation: idxOccupation >= 0 ? String(found[idxOccupation] || "").trim().toUpperCase() : "",
      occupation_other: idxOccupationOther >= 0 ? String(found[idxOccupationOther] || "").trim().toUpperCase() : "",
      bridal_status: idxBridalStatus >= 0 ? String(found[idxBridalStatus] || "").trim().toUpperCase() : "",
      wedding_month: idxWeddingMonth >= 0 ? String(found[idxWeddingMonth] || "").trim().toUpperCase() : "",
      wedding_year: idxWeddingYear >= 0 ? String(found[idxWeddingYear] || "").trim().toUpperCase() : "",
      communication_preference: idxCommunication >= 0 ? String(found[idxCommunication] || "").trim().toUpperCase() : "",
      country: idxCountry >= 0 ? String(found[idxCountry] || "").trim().toUpperCase() : "",
      state: idxState >= 0 ? String(found[idxState] || "").trim().toUpperCase() : "",
      city: idxCity >= 0 ? String(found[idxCity] || "").trim().toUpperCase() : "",
      city_other: idxCityOther >= 0 ? String(found[idxCityOther] || "").trim().toUpperCase() : "",
      pincode: idxPincode >= 0 ? String(found[idxPincode] || "").trim() : "",
      address: idxAddress >= 0 ? String(found[idxAddress] || "").trim().toUpperCase() : "",
      caste: idxCommunity >= 0 ? String(found[idxCommunity] || "").trim().toUpperCase() : "",
      caste_other: idxCommunityOther >= 0 ? String(found[idxCommunityOther] || "").trim().toUpperCase() : "",
      dob: idxDob >= 0 ? formatDateForInput_(found[idxDob]) : "",
      anniversary: idxAnniversary >= 0 ? formatDateForInput_(found[idxAnniversary]) : "",
      beverage: idxBeverage >= 0 ? String(found[idxBeverage] || "").trim().toUpperCase() : "",
      sugar: idxSugar >= 0 ? String(found[idxSugar] || "").trim().toUpperCase() : "",
      snack: idxSnack >= 0 ? String(found[idxSnack] || "").trim().toUpperCase() : "",
      client_potential_category: idxPotential >= 0 ? String(found[idxPotential] || "").trim().toUpperCase() : "",
      high_potential_reason: idxHighPotential >= 0 ? String(found[idxHighPotential] || "").trim().toUpperCase() : ""
    }
  };
}




/** ====== DROPDOWN OPTIONS LOADER (FORM DATA) ====== **/
function getFormDataOptions() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(FORM_DATA_SHEET);
  if (!sh) throw new Error(`FORM DATA sheet not found: ${FORM_DATA_SHEET}`);

  const values = sh.getDataRange().getValues();
  if (!values || values.length < 2) return {};

  const headers = values[0].map(h => String(h || "").trim().toUpperCase());
  const rows = values.slice(1);

  const col = (name) => headers.indexOf(String(name).trim().toUpperCase());

  const uniqueList = (idx) => {
    if (idx < 0) return [];
    const out = [];
    const seen = new Set();
    rows.forEach(r => {
      const v = String(r[idx] || "").trim();
      if (!v) return;
      const key = v.toUpperCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(key);
    });
    return out;
  };

  return {
    crmNames: uniqueList(col("CRM NAME")),
    salespersons: uniqueList(col("SALESPERSON")),
    relations: uniqueList(col("RELATIONS")),
    productCategories: uniqueList(col("PRODUCT CATEGORIES")),
    notBoughtReasons: uniqueList(col("REASON FOR NOT BOUGHT")),
    beverages: uniqueList(col("BEVERAGES")),
    sugarOptions: uniqueList(col("SUGAR OPTION")),
    snackOptions: uniqueList(col("SNACK OPTION")),
    giftOptions: uniqueList(col("GIFT OPTION")),
    sources: uniqueList(col("SOURCE OF LEAD")),
    clientPotentialCategories: uniqueList(col("CLIENT POTENTIAL CATEGORY")),
    highPotentialReasons: uniqueList(col("WHY IS THIS CLIENT A HIGH-POTENTIAL BUYER?")),
    castes: uniqueList(col("CASTE")),
    branches: uniqueList(col("BRANCH")),

  };
}

/** ====== HEADERS (WALKIN DATASET) ====== **/
function getExpectedHeaders_() {
  const H = [
  "TIMESTAMP",
  "CRM CLIENT ID",

  // client details
  "CLIENT VISIT DATE",
  "CLIENT TYPE",
  "SOURCE OF LEAD",
    "SOURCE (OTHER)",
    "REFERENCE NAME",
    "REFERENCE PHONE",
    "BRANCH",
    "CRM NAME",
    "CLIENT NAME",
    "GENDER",
    "CLIENT PHONE",
    "BILLING PHONE",
    "COUNTRY",
    "STATE",
    "CITY",
    "CITY (OTHER)",
    "PINCODE",
    "ADDRESS",
    "COMMUNITY",
    "COMMUNITY (OTHER)",
    "DOB",
    "ANNIVERSARY",
    "SALESPERSON",

    // companions
    "COMPANIONS COUNT"
  ];

  for (let i = 1; i <= 10; i++) {
    H.push(`COMPANION ${i} NAME`);
    H.push(`COMPANION ${i} MOBILE`);
    H.push(`COMPANION ${i} RELATION`);
  }

  // visit status
  H.push("CLIENT BOUGHT ANY PRODUCT?");

  // not bought / repair / seen / bought / order
  H.push(
    "NOT BOUGHT REASONS",
    "NOT BOUGHT REASON (OTHER TEXT)",
    "REPAIR/ORDER APPROACH",
    "NEW THINGS CHOICE",
    "NEW THINGS SALESPERSON",

    "SEEN CATEGORIES",
    "SEEN PRODUCTS COUNT",
    "SEEN TAGS (COMBINED)",
    "SEEN OTHER TEXT",

    "BOUGHT CATEGORIES",
    "BOUGHT PRODUCTS COUNT",
    "BOUGHT TAGS (COMBINED)",
    "BOUGHT OTHER TEXT",

    "ORDER/NEW THINGS CATEGORIES",
    "ORDER/NEW THINGS COUNT",
    "ORDER/NEW THINGS TAGS (COMBINED)",
    "ORDER/NEW THINGS OTHER TEXT",

    "OTHER ORDER"
  );

  // CRM approach (incl instagram 3 fields)
  H.push(
    "MARKETING MESSAGE",

    "INSTAGRAM FOLLOW ASKED",
    "INSTAGRAM FOLLOW - NO REASON",
    "INSTAGRAM FOLLOW - PROOF URL",

    "GOOGLE REVIEW ASKED",
    "GOOGLE REVIEW - NO REASON",
    "GOOGLE REVIEW - SCREENSHOT URL",

    "TESTIMONIAL ASKED",
    "TESTIMONIAL - NO REASON",
    "TESTIMONIAL - MEDIA URL",

    "FEEDBACK FORM ASKED",
    "FEEDBACK FORM - NO REASON",
    "FEEDBACK FORM - SCREENSHOT URL",

    "THANK-YOU NOTE GIVEN",
    "THANK-YOU NOTE - NO REASON",
    "THANK-YOU NOTE - PHOTO URL",

    "REFERRALS ASKED",
    "REFERRALS - NO REASON",
    "REFERRALS - PROOF URL",

    "BEVERAGE",
    "BEVERAGE (OTHER)",
    "SUGAR",
    "SUGAR (OTHER)",
    "SNACK",
    "SNACK (OTHER)",
    "GIFT GIVEN",
    "GIFT (OTHER)",

    "NEXT VISIT DATE",
    "CLIENT POTENTIAL CATEGORY",
    "WHY IS THIS CLIENT A HIGH-POTENTIAL BUYER?",
    "REMARK",

    "UPLOAD",
        "PRODUCT REQUIREMENT",

    "OTHER STORE CLIENT WANTS TO VISIT",
    "WHICH CATEGORIES CLIENT WANT TO SEE MORE",

    "OCCUPATION",
    "OCCUPATION (OTHER)",
    "BRIDAL / NON BRIDAL",
    "MONTH OF WEDDING",
    "YEAR OF WEDDING",
    "COMMUNICATION PREFERENCE"
  );

  /************************************************************
   * IMPORTANT:
   * REFERENCE NUMBER must be fixed at DY / column 129.
   *
   * Current business logic:
   * - Project 1 walk-in form writes reference to DY / 129
   * - Project 2 CRM sync reads reference from DY / 129
   * - CLIENT TIMELINE column N stores the same reference number
   *
   * So we reserve blank/system columns until column 128,
   * then put REFERENCE NUMBER at column 129.
   ************************************************************/
  while (H.length < 128) {
    H.push("RESERVED COLUMN " + (H.length + 1));
  }

  H.push("REFERENCE NUMBER"); // DY / column 129

  return H;
}


function getCountryPhoneRules_() {
  return {
    "AFGHANISTAN": { min: 9, max: 9 },
    "ALBANIA": { min: 9, max: 9 },
    "ALGERIA": { min: 9, max: 9 },
    "ARGENTINA": { min: 10, max: 10 },
    "AUSTRALIA": { min: 9, max: 9 },
    "AUSTRIA": { min: 10, max: 13 },
    "BANGLADESH": { min: 10, max: 10 },
    "BELGIUM": { min: 9, max: 10 },
    "BRAZIL": { min: 10, max: 11 },
    "CANADA": { min: 10, max: 10 },
    "CHILE": { min: 9, max: 9 },
    "CHINA": { min: 11, max: 11 },
    "COLOMBIA": { min: 10, max: 10 },
    "DENMARK": { min: 8, max: 8 },
    "EGYPT": { min: 10, max: 10 },
    "FINLAND": { min: 9, max: 12 },
    "FRANCE": { min: 9, max: 9 },
    "GERMANY": { min: 10, max: 13 },
    "GREECE": { min: 10, max: 10 },
    "INDIA": { min: 9, max: 10 },
    "INDONESIA": { min: 9, max: 12 },
    "IRAN": { min: 10, max: 10 },
    "IRAQ": { min: 10, max: 10 },
    "IRELAND": { min: 9, max: 9 },
    "ISRAEL": { min: 9, max: 9 },
    "ITALY": { min: 9, max: 10 },
    "JAPAN": { min: 10, max: 11 },
    "KENYA": { min: 9, max: 10 },
    "MALAYSIA": { min: 9, max: 10 },
    "MEXICO": { min: 10, max: 10 },
    "NETHERLANDS": { min: 9, max: 9 },
    "NEW ZEALAND": { min: 8, max: 10 },
    "NIGERIA": { min: 10, max: 10 },
    "NORWAY": { min: 8, max: 8 },
    "PAKISTAN": { min: 10, max: 10 },
    "PERU": { min: 9, max: 9 },
    "PHILIPPINES": { min: 10, max: 10 },
    "POLAND": { min: 9, max: 9 },
    "PORTUGAL": { min: 9, max: 9 },
    "ROMANIA": { min: 9, max: 10 },
    "RUSSIA": { min: 10, max: 10 },
    "SAUDI ARABIA": { min: 9, max: 9 },
    "SINGAPORE": { min: 8, max: 8 },
    "SOUTH AFRICA": { min: 9, max: 10 },
    "SOUTH KOREA": { min: 9, max: 11 },
    "SPAIN": { min: 9, max: 9 },
    "SWEDEN": { min: 9, max: 10 },
    "SWITZERLAND": { min: 9, max: 9 },
    "THAILAND": { min: 9, max: 10 },
    "TURKEY": { min: 10, max: 10 },
    "UKRAINE": { min: 9, max: 10 },
    "UNITED ARAB EMIRATES": { min: 9, max: 9 },
    "UNITED KINGDOM": { min: 10, max: 11 },
    "UNITED STATES": { min: 10, max: 10 },
    "VIETNAM": { min: 9, max: 10 }
  };
}

function digitsOnly_(value) {
  return String(value || "").replace(/\D/g, "");
}

/**
 * Country code is added by the HTML into the SAME phone field.
 * For validation we remove the selected country's calling code first,
 * then validate only the local/mobile digits.
 */
function getCountryCallingCode_(country) {
  const map = {
    "AFGHANISTAN":"+93","ALBANIA":"+355","ALGERIA":"+213","ARGENTINA":"+54","AUSTRALIA":"+61","AUSTRIA":"+43",
    "BANGLADESH":"+880","BELGIUM":"+32","BRAZIL":"+55","CANADA":"+1","CHILE":"+56","CHINA":"+86","COLOMBIA":"+57",
    "DENMARK":"+45","EGYPT":"+20","FINLAND":"+358","FRANCE":"+33","GERMANY":"+49","GREECE":"+30","INDIA":"+91",
    "INDONESIA":"+62","IRAN":"+98","IRAQ":"+964","IRELAND":"+353","ISRAEL":"+972","ITALY":"+39","JAPAN":"+81",
    "KENYA":"+254","MALAYSIA":"+60","MEXICO":"+52","NETHERLANDS":"+31","NEW ZEALAND":"+64","NIGERIA":"+234",
    "NORWAY":"+47","PAKISTAN":"+92","PERU":"+51","PHILIPPINES":"+63","POLAND":"+48","PORTUGAL":"+351","ROMANIA":"+40",
    "RUSSIA":"+7","SAUDI ARABIA":"+966","SINGAPORE":"+65","SOUTH AFRICA":"+27","SOUTH KOREA":"+82","SPAIN":"+34",
    "SWEDEN":"+46","SWITZERLAND":"+41","THAILAND":"+66","TURKEY":"+90","UKRAINE":"+380","UNITED ARAB EMIRATES":"+971",
    "UNITED KINGDOM":"+44","UNITED STATES":"+1","VIETNAM":"+84"
  };
  return map[String(country || "").trim().toUpperCase()] || "";
}

function localPhoneDigits_(value, country) {
  let digits = digitsOnly_(value);
  const codeDigits = digitsOnly_(getCountryCallingCode_(country));

  const rules = getCountryPhoneRules_();
  const key = String(country || "").trim().toUpperCase();
  const rule = rules[key] || { min: 6, max: 15 };

  /*
   * Do NOT remove 91 from a normal 10 digit Indian mobile like 9136248543.
   * Remove country code only when full number length is more than allowed
   * local length, e.g. +919136248543 / 919136248543 = 12 digits.
   */
  if (codeDigits && digits.startsWith(codeDigits) && digits.length > rule.max) {
    const withoutCode = digits.slice(codeDigits.length);

    if (withoutCode.length >= rule.min && withoutCode.length <= rule.max) {
      digits = withoutCode;
    }
  }

  return digits;
}
function formatPhoneForSheet_(value, country) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const code = getCountryCallingCode_(country);
  const local = localPhoneDigits_(raw, country);

  if (!local) return "";

  // Save country code in the same output column. No extra country-code column is created.
  if (code) return code + local;

  // Fallback for countries not in map.
  if (raw.startsWith("+")) return "+" + digitsOnly_(raw);
  return digitsOnly_(raw);
}

function validatePhoneField_(value, country, required, label) {
  const digits = localPhoneDigits_(value, country);

  if (!digits) {
    if (required) throw new Error(label + " IS REQUIRED.");
    return;
  }

  const rules = getCountryPhoneRules_();
  const key = String(country || "").trim().toUpperCase();
  const rule = rules[key] || { min: 6, max: 15 };

  if (digits.length < rule.min || digits.length > rule.max) {
    if (rule.min === rule.max) {
      throw new Error(label + " MUST BE EXACTLY " + rule.min + " DIGITS FOR " + key + ".");
    } else {
      throw new Error(label + " MUST BE BETWEEN " + rule.min + " AND " + rule.max + " DIGITS FOR " + key + ".");
    }
  }
}






function formatDateForInput_(value) {
  if (!value) return "";

  let d = value;
  if (Object.prototype.toString.call(value) !== "[object Date]") {
    d = new Date(value);
  }

  if (!d || isNaN(d.getTime())) return "";

  return Utilities.formatDate(d, Session.getScriptTimeZone() || "Asia/Kolkata", "yyyy-MM-dd");
}



function saveReferrals_(formDataObj) {
  const asked = String((formDataObj && formDataObj.referrals_asked) || "").trim().toUpperCase();
  if (asked !== "YES") return;

  const countRaw = String((formDataObj && formDataObj.referrals_count) || "").trim();
  const count = parseInt(countRaw, 10);
  if (!count || count < 1) return;

  const sh = getOrCreateReferralsSheet_();

  const crmName = String((formDataObj && formDataObj.crm_name) || "").trim().toUpperCase();
  const salesperson = String((formDataObj && formDataObj.salesperson) || "").trim().toUpperCase();
  const referenceGivenByClientName = String((formDataObj && formDataObj.client_name) || "").trim().toUpperCase();

  // One common submission timestamp for all referrals entered in the same form.
  const submissionTimestamp = new Date();

  const rows = [];

  for (let i = 1; i <= count; i++) {
    const referralName = String((formDataObj && formDataObj[`referral_name_${i}`]) || "").trim().toUpperCase();
    const referralNumber = String((formDataObj && formDataObj[`referral_number_${i}`]) || "").replace(/\D/g, "").trim();

    if (!referralName && !referralNumber) continue;

    rows.push([
      submissionTimestamp,
      crmName,
      salesperson,
      referenceGivenByClientName,
      referralName,
      referralNumber
    ]);
  }

  if (rows.length) {
    const startRow = sh.getLastRow() + 1;
    sh.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);

    // Display timestamp in a readable format while keeping it as a real date/time value.
    sh.getRange(startRow, 1, rows.length, 1).setNumberFormat("dd/MM/yyyy HH:mm:ss");
  }
}

/** ====== NEW REQUIRED CLIENT DETAIL VALIDATION ====== **/
function validateNewRequiredClientFields_(formDataObj) {
  const d = formDataObj || {};
  const clean = (key) => String(d[key] || "").trim();
  const upper = (key) => clean(key).toUpperCase();

  const occupation = upper("occupation");
  const occupationOther = clean("occupation_other");
  const bridalStatus = upper("bridal_status");
  const weddingMonth = clean("wedding_month");
  const weddingYear = clean("wedding_year");
  const communicationPreference = upper("communication_preference");

  if (!occupation) {
    throw new Error("OCCUPATION IS REQUIRED.");
  }

  if ((occupation === "OTHER" || occupation.indexOf("OTHER") === 0) && !occupationOther) {
    throw new Error("OTHER OCCUPATION IS REQUIRED.");
  }

  if (!bridalStatus) {
    throw new Error("BRIDAL / NON BRIDAL IS REQUIRED.");
  }

  if (bridalStatus === "BRIDAL") {
    if (!weddingMonth) {
      throw new Error("MONTH OF WEDDING IS REQUIRED FOR BRIDAL CLIENT.");
    }
    if (!weddingYear) {
      throw new Error("YEAR OF WEDDING IS REQUIRED FOR BRIDAL CLIENT.");
    }
  }

  if (!communicationPreference) {
    throw new Error("COMMUNICATION PREFERENCE IS REQUIRED.");
  }
}




/************************************************************
 * CLIENT ID ENGINE
 * Rule:
 * Same mobile number = same CLIENT ID in every walk-in entry.
 * New mobile number = new MKC ID.
 ************************************************************/

function normalizeMobileForClientId_(value) {
  let d = String(value || "").replace(/\D/g, "");

  // For India / country-code numbers, keep last 10 digits for matching.
  if (d.length > 10) d = d.slice(-10);

  return d;
}

function getMaxClientIdSerialFromWalkin_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(RESPONSES_SHEET);
  if (!sh || sh.getLastRow() < 2) return 102558;

  const lastCol = Math.max(sh.getLastColumn(), 2);
  const values = sh.getRange(1, 1, sh.getLastRow(), lastCol).getValues();
  const headers = values[0].map(h => String(h || "").trim().toUpperCase());

  const idxClientId = headers.indexOf("CRM CLIENT ID");
  if (idxClientId < 0) return 102558;

  let maxNo = 102558;

  for (let r = 1; r < values.length; r++) {
    const cid = String(values[r][idxClientId] || "").trim().toUpperCase();
    const m = cid.match(/^MKC-(\d+)$/);
    if (m) {
      const n = Number(m[1]);
      if (n > maxNo) maxNo = n;
    }
  }

  return maxNo;
}

function getMaxClientIdSerialFromEntryLog_() {
  const sh = getOrCreateEntryLogSheet_();
  if (!sh || sh.getLastRow() < 2) return 102558;

  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h || "").trim().toUpperCase());
  const idxClientId = headers.indexOf("CLIENT ID");

  if (idxClientId < 0) return 102558;

  let maxNo = 102558;

  for (let r = 1; r < values.length; r++) {
    const cid = String(values[r][idxClientId] || "").trim().toUpperCase();
    const m = cid.match(/^MKC-(\d+)$/);
    if (m) {
      const n = Number(m[1]);
      if (n > maxNo) maxNo = n;
    }
  }

  return maxNo;
}

function generateNextClientId_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const props = PropertiesService.getScriptProperties();
    const key = "MK_CLIENT_ID_LAST_SERIAL";

    const sheetMax = getMaxClientIdSerialFromWalkin_();
    const logMax = getMaxClientIdSerialFromEntryLog_();
    const propMax = Number(props.getProperty(key) || 0);

    let last = Math.max(sheetMax, logMax, propMax, 102558);
    last++;

    props.setProperty(key, String(last));

    return "MKC-" + last;
  } finally {
    lock.releaseLock();
  }
}

function findExistingClientIdByMobileInWalkin_(mobile) {
  const target = normalizeMobileForClientId_(mobile);
  if (!target) return "";

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(RESPONSES_SHEET);
  if (!sh || sh.getLastRow() < 2) return "";

  const lastCol = Math.max(sh.getLastColumn(), 2);
  const values = sh.getRange(1, 1, sh.getLastRow(), lastCol).getValues();
  const headers = values[0].map(h => String(h || "").trim().toUpperCase());

  const idxClientId = headers.indexOf("CRM CLIENT ID");
  const idxClientPhone = headers.indexOf("CLIENT PHONE");
  const idxBillingPhone = headers.indexOf("BILLING PHONE");

  if (idxClientId < 0) return "";

  // Search from latest row to oldest row.
  for (let r = values.length - 1; r >= 1; r--) {
    const cid = String(values[r][idxClientId] || "").trim();
    if (!cid) continue;

    const clientPhone = idxClientPhone >= 0
      ? normalizeMobileForClientId_(values[r][idxClientPhone])
      : "";

    const billingPhone = idxBillingPhone >= 0
      ? normalizeMobileForClientId_(values[r][idxBillingPhone])
      : "";

    if (clientPhone && clientPhone === target) return cid;
    if (billingPhone && billingPhone === target) return cid;
  }

  return "";
}

function findExistingClientIdByMobileInEntryLog_(mobile) {
  const target = normalizeMobileForClientId_(mobile);
  if (!target) return "";

  const sh = getOrCreateEntryLogSheet_();
  if (!sh || sh.getLastRow() < 2) return "";

  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h || "").trim().toUpperCase());

  const idxMobile = headers.indexOf("MOBILE");
  const idxClientId = headers.indexOf("CLIENT ID");

  if (idxMobile < 0 || idxClientId < 0) return "";

  // Search from latest row to oldest row.
  for (let r = values.length - 1; r >= 1; r--) {
    const cid = String(values[r][idxClientId] || "").trim();
    if (!cid) continue;

    const mobileInLog = normalizeMobileForClientId_(values[r][idxMobile]);

    if (mobileInLog && mobileInLog === target) return cid;
  }

  return "";
}

function getOrCreateClientIdForForm_(formDataObj) {
  formDataObj = formDataObj || {};

  // 1. Existing client opened from CRM URL
  let cid = String(formDataObj.client_id || "").trim();
  if (cid) return cid;

  const billingPhone = formDataObj.billing_phone || "";
  const clientPhone = formDataObj.client_phone || "";

  // 2. Match billing phone first
  cid =
    findExistingClientIdByMobileInWalkin_(billingPhone) ||
    findExistingClientIdByMobileInEntryLog_(billingPhone);

  if (cid) return cid;

  // 3. Match client phone second
  cid =
    findExistingClientIdByMobileInWalkin_(clientPhone) ||
    findExistingClientIdByMobileInEntryLog_(clientPhone);

  if (cid) return cid;

  // 4. New client
  return generateNextClientId_();
}

/************************************************************
 * ONE-TIME BACKFILL
 * Run this once manually after replacing Code.gs.
 * It fills blank CLIENT ID in CLIENT ENTRY LOG using same mobile.
 ************************************************************/
function backfillClientIdsInEntryLog() {
  const sh = getOrCreateEntryLogSheet_();
  if (!sh || sh.getLastRow() < 2) return;

  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h || "").trim().toUpperCase());

  const idxMobile = headers.indexOf("MOBILE");
  const idxClientId = headers.indexOf("CLIENT ID");

  if (idxMobile < 0 || idxClientId < 0) {
    throw new Error("MOBILE OR CLIENT ID COLUMN NOT FOUND IN CLIENT ENTRY LOG.");
  }

  const idByMobile = {};

  // First pass: collect existing IDs by mobile.
  for (let r = 1; r < values.length; r++) {
    const mobile = normalizeMobileForClientId_(values[r][idxMobile]);
    const cid = String(values[r][idxClientId] || "").trim();
    if (mobile && cid && !idByMobile[mobile]) {
      idByMobile[mobile] = cid;
    }
  }

  // Second pass: fill blank IDs.
  const output = [];
  for (let r = 1; r < values.length; r++) {
    const mobile = normalizeMobileForClientId_(values[r][idxMobile]);
    let cid = String(values[r][idxClientId] || "").trim();

    if (!cid && mobile) {
      cid = idByMobile[mobile] ||
        findExistingClientIdByMobileInWalkin_(mobile) ||
        generateNextClientId_();

      idByMobile[mobile] = cid;
    }

    output.push([cid]);
  }

  sh.getRange(2, idxClientId + 1, output.length, 1).setValues(output);
}

/************************************************************
 * ONE-TIME BACKFILL
 * Run this once manually after replacing Code.gs.
 * It fills blank CRM CLIENT ID in WALKIN DATASET using same mobile.
 ************************************************************/
function backfillClientIdsInWalkinDataset() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(RESPONSES_SHEET);
  if (!sh || sh.getLastRow() < 2) return;

  const lastCol = Math.max(sh.getLastColumn(), 2);
  const values = sh.getRange(1, 1, sh.getLastRow(), lastCol).getValues();
  const headers = values[0].map(h => String(h || "").trim().toUpperCase());

  const idxClientId = headers.indexOf("CRM CLIENT ID");
  const idxClientPhone = headers.indexOf("CLIENT PHONE");
  const idxBillingPhone = headers.indexOf("BILLING PHONE");

  if (idxClientId < 0) {
    throw new Error("CRM CLIENT ID COLUMN NOT FOUND IN WALKIN DATASET.");
  }

  const idByMobile = {};

  // First pass: collect existing IDs by client/billing mobile.
  for (let r = 1; r < values.length; r++) {
    const cid = String(values[r][idxClientId] || "").trim();
    if (!cid) continue;

    const p1 = idxClientPhone >= 0 ? normalizeMobileForClientId_(values[r][idxClientPhone]) : "";
    const p2 = idxBillingPhone >= 0 ? normalizeMobileForClientId_(values[r][idxBillingPhone]) : "";

    if (p1 && !idByMobile[p1]) idByMobile[p1] = cid;
    if (p2 && !idByMobile[p2]) idByMobile[p2] = cid;
  }

  // Second pass: fill blank IDs.
  const output = [];
  for (let r = 1; r < values.length; r++) {
    let cid = String(values[r][idxClientId] || "").trim();

    const p1 = idxClientPhone >= 0 ? normalizeMobileForClientId_(values[r][idxClientPhone]) : "";
    const p2 = idxBillingPhone >= 0 ? normalizeMobileForClientId_(values[r][idxBillingPhone]) : "";
    const mainMobile = p2 || p1;

    if (!cid && mainMobile) {
      cid = idByMobile[p2] || idByMobile[p1] || findExistingClientIdByMobileInEntryLog_(mainMobile) || generateNextClientId_();

      if (p1 && !idByMobile[p1]) idByMobile[p1] = cid;
      if (p2 && !idByMobile[p2]) idByMobile[p2] = cid;
    }

    output.push([cid]);
  }

  sh.getRange(2, idxClientId + 1, output.length, 1).setValues(output);
}

function backfillAllClientIds() {
  backfillClientIdsInWalkinDataset();
  backfillClientIdsInEntryLog();
}


/** ====== MAIN SUBMIT ====== **/
function submitForm(formDataObj, filesPayload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = getOrCreateSheet_(ss, RESPONSES_SHEET);

  const HEADERS = getExpectedHeaders_();
  ensureHeaderRow_(sh, HEADERS);

  formDataObj = formDataObj || {};

  const isEditMode =
    String(formDataObj.form_mode || "").trim().toUpperCase() === "EDIT_WALKIN_ENTRY" ||
    String(formDataObj.edit_reference_number || "").trim() !== "";

  const country = String(formDataObj.country || "").trim().toUpperCase();

  validateNewRequiredClientFields_(formDataObj);

  validatePhoneField_(formDataObj.client_phone, country, false, "CLIENT PHONE");
  validatePhoneField_(formDataObj.billing_phone, country, true, "BILLING PHONE");
  validatePhoneField_(formDataObj.reference_phone, country, false, "REFERENCE PHONE");

  for (let i = 1; i <= 10; i++) {
    validatePhoneField_(formDataObj[`companion_phone_${i}`], country, false, `COMPANION MOBILE ${i}`);
  }

  let targetRowNumber = 0;
  let oldRow = null;

  if (isEditMode) {
    const ref = String(
      formDataObj.edit_reference_number ||
      formDataObj.reference_number ||
      ""
    ).trim();

    if (!ref) {
      throw new Error("REFERENCE NUMBER IS REQUIRED FOR EDIT.");
    }

    const found = findWalkinRowByReference_(sh, ref);
    if (!found) {
      throw new Error("WALK-IN ENTRY NOT FOUND FOR EDIT: " + ref);
    }

    targetRowNumber = found.rowNumber;
    oldRow = found.row;

    formDataObj.reference_number = ref;

    // In edit mode, preserve same client id if already available in old row.
    const clientIdIdx = HEADERS.indexOf("CRM CLIENT ID");
    const oldClientId = clientIdIdx >= 0 && oldRow
      ? String(oldRow[clientIdIdx] || "").trim()
      : "";

    if (oldClientId && !String(formDataObj.client_id || "").trim()) {
      formDataObj.client_id = oldClientId;
    }
  } else {
    if (!String(formDataObj.reference_number || "").trim()) {
      formDataObj.reference_number = generateUniqueWalkinReference_(sh, formDataObj);
    }
  }

  // Generate or reuse same CLIENT ID before building row.
  const finalClientId = getOrCreateClientIdForForm_(formDataObj);
  formDataObj.client_id = finalClientId;

  // 1) Save new uploaded files to Drive
  const fileUrlByField = saveUploads_(filesPayload || []);

  // 2) Create upload summary doc if new uploads exist
  const uploadsDocUrl = createUploadsDoc_(formDataObj, fileUrlByField);

  // 3) Build fresh row from form
  let row = buildRow_(formDataObj, fileUrlByField, uploadsDocUrl, HEADERS);

  // Force CLIENT ID into WALKIN DATASET column "CRM CLIENT ID".
  const clientIdColIndex = HEADERS.indexOf("CRM CLIENT ID");
  if (clientIdColIndex >= 0) {
    row[clientIdColIndex] = finalClientId;
  }

  if (isEditMode) {
    // Preserve old upload URLs when user does not upload new files during edit
    row = mergeOldWalkinValuesForEdit_(HEADERS, oldRow, row, fileUrlByField, uploadsDocUrl);

    // Keep original entry timestamp during edit
    const tsIdx = HEADERS.indexOf("TIMESTAMP");
    if (tsIdx >= 0 && oldRow && oldRow[tsIdx]) {
      row[tsIdx] = oldRow[tsIdx];
    }

    // Keep CLIENT ID after merge also.
    if (clientIdColIndex >= 0) {
      row[clientIdColIndex] = finalClientId;
    }

    // Update same original row only
    sh.getRange(targetRowNumber, 1, 1, HEADERS.length).setValues([row]);

    return {
      ok: true,
      mode: "EDIT_WALKIN_ENTRY",
      referenceNumber: formDataObj.reference_number,
      clientId: finalClientId,
      updatedRow: targetRowNumber
    };
  }

  // 4) New entry append
  sh.appendRow(row);

  // 5) Save referrals only for new submission.
  // Edit mode must not duplicate referral rows.
  saveReferrals_(formDataObj);

  // 6) Mark queue entry complete + save same client id in CLIENT ENTRY LOG.
  // Token is used first. If token is missing, mobile fallback is used.
  const entryToken = String(formDataObj.entry_token || "").trim();
  const entryMobile = formDataObj.billing_phone || formDataObj.client_phone || "";
  markEntryCompleteAndUpdateClient_(entryToken, finalClientId, entryMobile);

  return {
    ok: true,
    mode: "NEW_WALKIN_ENTRY",
    referenceNumber: formDataObj.reference_number,
    clientId: finalClientId
  };
}

/************************************************************
 * EDIT OLD WALK-IN ENTRY HELPERS
 ************************************************************/

function getWalkinEntryForEdit(referenceNumber) {
  const ref = String(referenceNumber || '').trim().toUpperCase();

  if (!ref) {
    return {
      ok: false,
      message: 'REFERENCE NUMBER IS REQUIRED.'
    };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(RESPONSES_SHEET);

  if (!sh) {
    return {
      ok: false,
      message: 'WALKIN DATASET SHEET NOT FOUND.'
    };
  }

  const found = findWalkinRowByReference_(sh, ref);

  if (!found) {
    return {
      ok: false,
      message: 'WALK-IN ENTRY NOT FOUND.',
      searchedReference: ref,
      sheetName: sh.getName(),
      spreadsheetId: ss.getId()
    };
  }

  const data = convertWalkinRowToFormData_(found.headers, found.row);

  data.form_mode = 'EDIT_WALKIN_ENTRY';
  data.edit_reference_number = ref;
  data.reference_number = ref;
  data.source_row_number = found.rowNumber;

  return {
    ok: true,
    referenceNumber: ref,
    rowNumber: found.rowNumber,
    referenceColumn: found.referenceColumn || '',
    data: data
  };
}

function normalizeWalkinReferenceForSearch_(value) {
  // Make matching safe for hidden spaces, non-breaking spaces, en-dash, copied text, etc.
  return String(value || '')
    .toUpperCase()
    .replace(/[–—]/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/[^A-Z0-9-]/g, '')
    .trim();
}

function getReferenceColumnIndexes_(sh) {
  // Final system rule: REFERENCE NUMBER is DY / column 129.
  // Also check legacy/wrong columns and header-detected columns so edit keeps working
  // even if the sheet layout was manually changed again.
  const lastCol = Math.max(sh.getLastColumn(), WALKIN_REFERENCE_COL);
  const cols = [
    WALKIN_REFERENCE_COL,       // DY / 129 current
    123,                        // DS old
    107                         // DC very old/wrong migration backup
  ].concat(WALKIN_LEGACY_REFERENCE_COLS || []);

  // Detect any column whose header says REFERENCE NUMBER in row 1, row 2, or row 3.
  [1, 2, 3].forEach(rowNo => {
    if (sh.getMaxRows() < rowNo) return;
    const headerRow = sh.getRange(rowNo, 1, 1, lastCol).getDisplayValues()[0];
    headerRow.forEach((h, i) => {
      const header = String(h || '').trim().toUpperCase();
      if (header === 'REFERENCE NUMBER') cols.push(i + 1);
    });
  });

  const seen = {};
  return cols.filter(c => {
    const n = Number(c || 0);
    if (!n || n < 1 || n > lastCol || seen[n]) return false;
    seen[n] = true;
    return true;
  });
}

function getWalkinHeadersForEdit_(sh, lastCol) {
  // Prefer the script's expected headers because your sheet has display headers on rows 1/2/3.
  // This guarantees convertWalkinRowToFormData_ maps the row correctly.
  const expected = getExpectedHeaders_();
  while (expected.length < lastCol) expected.push('');
  return expected.slice(0, lastCol);
}

function findWalkinRowByReference_(sh, referenceNumber) {
  const target = normalizeWalkinReferenceForSearch_(referenceNumber);
  if (!target) return null;

  const DATA_START_ROW = 2;
  const searchCols = getReferenceColumnIndexes_(sh);

  const lastRow = sh.getLastRow();
  const lastCol = Math.max(sh.getLastColumn(), WALKIN_REFERENCE_COL, 132);

  if (lastRow < DATA_START_ROW) return null;

  // 1) Fast search in known/reference columns: DY, DS, DC, and header-detected columns.
  for (let c = 0; c < searchCols.length; c++) {
    const REF_COL = searchCols[c];
    const refs = sh
      .getRange(DATA_START_ROW, REF_COL, lastRow - DATA_START_ROW + 1, 1)
      .getDisplayValues();

    for (let i = 0; i < refs.length; i++) {
      const ref = normalizeWalkinReferenceForSearch_(refs[i][0]);

      if (ref === target) {
        const rowNumber = DATA_START_ROW + i;
        const headers = getWalkinHeadersForEdit_(sh, lastCol);
        const row = sh.getRange(rowNumber, 1, 1, lastCol).getValues()[0];

        // If old DS/DC reference was found and DY is blank, copy it to DY safely.
        if (REF_COL !== WALKIN_REFERENCE_COL) {
          const dyCell = sh.getRange(rowNumber, WALKIN_REFERENCE_COL);
          if (!String(dyCell.getValue() || '').trim()) {
            dyCell.setValue(String(refs[i][0] || '').trim().toUpperCase());
            row[WALKIN_REFERENCE_COL - 1] = String(refs[i][0] || '').trim().toUpperCase();
          }
        }

        return {
          rowNumber: rowNumber,
          headers: headers,
          row: row,
          referenceColumn: REF_COL
        };
      }
    }
  }

  // 2) Last safety fallback: scan full displayed sheet for the exact reference text.
  // This solves cases where reference was manually moved to another column.
  const displayData = sh.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, lastCol).getDisplayValues();
  for (let r = 0; r < displayData.length; r++) {
    for (let c = 0; c < displayData[r].length; c++) {
      if (normalizeWalkinReferenceForSearch_(displayData[r][c]) === target) {
        const rowNumber = DATA_START_ROW + r;
        const foundCol = c + 1;
        const headers = getWalkinHeadersForEdit_(sh, lastCol);
        const row = sh.getRange(rowNumber, 1, 1, lastCol).getValues()[0];

        // Copy found reference to DY if DY is blank.
        const dyCell = sh.getRange(rowNumber, WALKIN_REFERENCE_COL);
        if (!String(dyCell.getValue() || '').trim()) {
          dyCell.setValue(String(displayData[r][c] || '').trim().toUpperCase());
          row[WALKIN_REFERENCE_COL - 1] = String(displayData[r][c] || '').trim().toUpperCase();
        }

        return {
          rowNumber: rowNumber,
          headers: headers,
          row: row,
          referenceColumn: foundCol
        };
      }
    }
  }

  return null;
}


function convertWalkinRowToFormData_(headers, row) {
  const idx = {};
  headers.forEach((h, i) => idx[String(h || "").trim().toUpperCase()] = i);

  const val = (header) => {
    const i = idx[String(header || "").trim().toUpperCase()];
    if (i == null || i < 0) return "";
    return row[i] == null ? "" : String(row[i]).trim();
  };

  const csv = (header) => splitCsv_(val(header));

  const data = {
    reference_number: val("REFERENCE NUMBER"),
    edit_reference_number: val("REFERENCE NUMBER"),

    client_id: val("CRM CLIENT ID"),
    visit_date: formatDateForInput_(val("CLIENT VISIT DATE")),
    client_type: val("CLIENT TYPE"),
    source: val("SOURCE OF LEAD"),
    source_other: val("SOURCE (OTHER)"),
    reference_name: val("REFERENCE NAME"),
    reference_phone: val("REFERENCE PHONE"),
    branch: val("BRANCH"),
    crm_name: val("CRM NAME"),
    client_name: val("CLIENT NAME"),
    gender: val("GENDER"),
    occupation: val("OCCUPATION"),
    occupation_other: val("OCCUPATION (OTHER)"),
    bridal_status: val("BRIDAL / NON BRIDAL"),
    wedding_month: val("MONTH OF WEDDING"),
    wedding_year: val("YEAR OF WEDDING"),
    communication_preference: val("COMMUNICATION PREFERENCE"),
    client_phone: val("CLIENT PHONE"),
    billing_phone: val("BILLING PHONE"),
    country: val("COUNTRY"),
    state: val("STATE"),
    city: val("CITY"),
    city_other: val("CITY (OTHER)"),
    pincode: val("PINCODE"),
    address: val("ADDRESS"),
    caste: val("COMMUNITY"),
    caste_other: val("COMMUNITY (OTHER)"),
    dob: formatDateForInput_(val("DOB")),
    anniversary: formatDateForInput_(val("ANNIVERSARY")),
    salesperson: val("SALESPERSON"),

    companions_count: val("COMPANIONS COUNT"),

    buy_status: normalizeBuyStatusForForm_(val("CLIENT BOUGHT ANY PRODUCT?")),
    not_bought_reason: csv("NOT BOUGHT REASONS"),
    not_bought_other_text: val("NOT BOUGHT REASON (OTHER TEXT)"),

    repair_approach: val("REPAIR/ORDER APPROACH"),
    new_things_choice: val("NEW THINGS CHOICE"),
    new_things_salesperson: val("NEW THINGS SALESPERSON"),

    seen_categories: csv("SEEN CATEGORIES"),
    seen_count: val("SEEN PRODUCTS COUNT"),
    seen_other_text: val("SEEN OTHER TEXT"),

    bought_categories: csv("BOUGHT CATEGORIES"),
    bought_count: val("BOUGHT PRODUCTS COUNT"),
    bought_other_text: val("BOUGHT OTHER TEXT"),

    order_categories: csv("ORDER/NEW THINGS CATEGORIES"),
    order_count: val("ORDER/NEW THINGS COUNT"),
    order_other_text: val("ORDER/NEW THINGS OTHER TEXT"),

    other_order: val("OTHER ORDER"),

    marketing_message: val("MARKETING MESSAGE"),

    instagram_follow_asked: val("INSTAGRAM FOLLOW ASKED"),
    instagram_follow_no_reason: val("INSTAGRAM FOLLOW - NO REASON"),

    google_review_asked: val("GOOGLE REVIEW ASKED"),
    google_review_no_reason: val("GOOGLE REVIEW - NO REASON"),

    testimonial_asked: val("TESTIMONIAL ASKED"),
    testimonial_no_reason: val("TESTIMONIAL - NO REASON"),

    feedback_asked: val("FEEDBACK FORM ASKED"),
    feedback_no_reason: val("FEEDBACK FORM - NO REASON"),

    thankyou_note: val("THANK-YOU NOTE GIVEN"),
    thankyou_note_no_reason: val("THANK-YOU NOTE - NO REASON"),

    referrals_asked: val("REFERRALS ASKED"),
    referrals_no_reason: val("REFERRALS - NO REASON"),

    beverage: val("BEVERAGE"),
    sugar: val("SUGAR"),
    snack: val("SNACK"),
    gift: csv("GIFT GIVEN"),

    next_visit_date: formatDateForInput_(val("NEXT VISIT DATE")),
    client_potential_category: val("CLIENT POTENTIAL CATEGORY"),
    high_potential_reason: val("WHY IS THIS CLIENT A HIGH-POTENTIAL BUYER?"),
    remark: val("REMARK"),

    product_requirement: val("PRODUCT REQUIREMENT"),
    other_store_visit: val("OTHER STORE CLIENT WANTS TO VISIT"),
    more_design_categories: csv("WHICH CATEGORIES CLIENT WANT TO SEE MORE")
  };

  for (let i = 1; i <= 10; i++) {
    data[`companion_name_${i}`] = val(`COMPANION ${i} NAME`);
    data[`companion_phone_${i}`] = val(`COMPANION ${i} MOBILE`);
    data[`companion_relation_${i}`] = val(`COMPANION ${i} RELATION`);
  }

  applyCsvTagsToData_(data, "seen_product_tag_", val("SEEN TAGS (COMBINED)"));
  applyCsvTagsToData_(data, "bought_product_tag_", val("BOUGHT TAGS (COMBINED)"));
  applyCsvTagsToData_(data, "order_tag_", val("ORDER/NEW THINGS TAGS (COMBINED)"));

  // For repair/order came-for data, Project 1 stores came-for values in BOUGHT columns.
  if (
    data.buy_status === "REPAIR_PLACED" ||
    data.buy_status === "REPAIR_PICKUP" ||
    data.buy_status === "ORDER_PLACED" ||
    data.buy_status === "ORDER_PICKUP" ||
    data.buy_status === "PRODUCT_RETURN" ||
    data.buy_status === "PRODUCT_EXCHANGE"
  ) {
    data.camefor_categories = csv("BOUGHT CATEGORIES");
    data.camefor_count = val("BOUGHT PRODUCTS COUNT");
    data.camefor_other_text = val("BOUGHT OTHER TEXT");
    applyCsvTagsToData_(data, "camefor_tag_", val("BOUGHT TAGS (COMBINED)"));

    data.new_things_categories = csv("ORDER/NEW THINGS CATEGORIES");
    data.new_things_count = val("ORDER/NEW THINGS COUNT");
    data.new_things_other_text = val("ORDER/NEW THINGS OTHER TEXT");
    applyCsvTagsToData_(data, "new_things_tag_", val("ORDER/NEW THINGS TAGS (COMBINED)"));
  }

  return data;
}

function splitCsv_(value) {
  return String(value || "")
    .split(",")
    .map(s => String(s || "").trim())
    .filter(Boolean);
}

function applyCsvTagsToData_(data, prefix, value) {
  const arr = splitCsv_(value);
  arr.forEach((v, i) => {
    if (i < 10) data[prefix + (i + 1)] = v;
  });
}

function normalizeBuyStatusForForm_(value) {
  const v = String(value || "").trim().toUpperCase();
  if (!v) return "";

  // If future CRM combined statuses are used, keep only the first form status.
  if (v.indexOf(" AND ") > -1) {
    return v.split(" AND ")[0].trim();
  }

  return v;
}

function mergeOldWalkinValuesForEdit_(headers, oldRow, newRow, fileUrlByField, uploadsDocUrl) {
  if (!oldRow) return newRow;

  const keepOldIfNewBlank = [
    "INSTAGRAM FOLLOW - PROOF URL",
    "GOOGLE REVIEW - SCREENSHOT URL",
    "TESTIMONIAL - MEDIA URL",
    "FEEDBACK FORM - SCREENSHOT URL",
    "THANK-YOU NOTE - PHOTO URL",
    "REFERRALS - PROOF URL",
    "UPLOAD"
  ];

  keepOldIfNewBlank.forEach(header => {
    const idx = headers.indexOf(header);
    if (idx < 0) return;

    const newVal = String(newRow[idx] || "").trim();
    const oldVal = String(oldRow[idx] || "").trim();

    if (!newVal && oldVal) {
      newRow[idx] = oldVal;
    }
  });

  const refIdx = headers.indexOf("REFERENCE NUMBER");
  if (refIdx >= 0 && oldRow[refIdx]) {
    newRow[refIdx] = oldRow[refIdx];
  }

  return newRow;
}


/** ====== BUILD ROW ====== **/
function buildRow_(d, fileUrlByField, uploadsDocUrl, HEADERS) {
  const tz = Session.getScriptTimeZone() || "Asia/Kolkata";
  const now = new Date();

  const upper = (s) => String(s || "").trim().toUpperCase();
  const v = (k) => (d && d[k] != null) ? String(d[k]).trim() : "";

  const cleanPhone = (s) => {
  const x = String(s || "").trim();
  if (!x) return "";
  return x.replace(/\D/g, "");
};

  const cleanPhoneWithCountry = (s) => formatPhoneForSheet_(s, v("country"));

  const arrJoin = (key, sep) => {
    const val = d[key];
    if (Array.isArray(val)) return val.filter(Boolean).map(x => upper(x)).join(sep || ", ");
    if (typeof val === "string") return upper(val);
    return "";
  };

  const tags = (prefix) => combineDynamicTags_(d, prefix, 10, ", ");

  const buy_status = upper(v("buy_status"));
  const other_order = upper(v("other_order"));
  const repair_approach = upper(v("repair_approach"));
  const new_things_choice = upper(v("new_things_choice"));

  // ✅ FIX: include PRODUCT_RETURN in repair-like set (your HTML includes it)
  const isRepairOrder =
    buy_status === "REPAIR_PLACED" ||
    buy_status === "REPAIR_PICKUP" ||
    buy_status === "ORDER_PLACED" ||
    buy_status === "ORDER_PICKUP" ||
    buy_status === "PRODUCT_RETURN";

  // outputs
  let outSeenCats = "", outSeenCount = "", outSeenTags = "", outSeenOther = "";
  let outBoughtCats = "", outBoughtCount = "", outBoughtTags = "", outBoughtOther = "";
  let outOrderCats = "", outOrderCount = "", outOrderTags = "", outOrderOther = "";

  // =========================
  // ✅ PRODUCT EXCHANGE FLOW (NEW)
  // =========================
  if (buy_status === "PRODUCT_EXCHANGE") {
    // 1) Came For -> store in BOUGHT columns (same as your repair mapping rule)
    outBoughtCats  = arrJoin("camefor_categories", ", ");
    outBoughtCount = upper(v("camefor_count"));
    outBoughtTags  = tags("camefor_tag_");
    outBoughtOther = upper(v("camefor_other_text"));

    // 2) Seen
    outSeenCats  = arrJoin("seen_categories", ", ");
    outSeenCount = upper(v("seen_count"));
    outSeenTags  = tags("seen_product_tag_");
    outSeenOther = upper(v("seen_other_text"));

    // 3) New Things DETAILS is directly shown (no new_things_choice needed)
    outOrderCats  = arrJoin("new_things_categories", ", ");
    outOrderCount = upper(v("new_things_count"));
    outOrderTags  = tags("new_things_tag_");
    outOrderOther = upper(v("new_things_other_text"));
  }

  // YES flow
  if (buy_status === "YES") {
    outSeenCats  = arrJoin("seen_categories", ", ");
    outSeenCount = upper(v("seen_count"));
    outSeenTags  = tags("seen_product_tag_");
    outSeenOther = upper(v("seen_other_text"));

    outBoughtCats  = arrJoin("bought_categories", ", ");
    outBoughtCount = upper(v("bought_count"));
    outBoughtTags  = tags("bought_product_tag_");
    outBoughtOther = upper(v("bought_other_text"));

    if (other_order === "YES") {
      outOrderCats  = arrJoin("order_categories", ", ");
      outOrderCount = upper(v("order_count"));
      outOrderTags  = tags("order_tag_");
      outOrderOther = upper(v("order_other_text"));
    }
  }

  // NO flow
  if (buy_status === "NO") {
    outSeenCats  = arrJoin("seen_categories", ", ");
    outSeenCount = upper(v("seen_count"));
    outSeenTags  = tags("seen_product_tag_");
    outSeenOther = upper(v("seen_other_text"));
  }

  // REPAIR/ORDER/PICKUP + PRODUCT_RETURN flow (camefor goes to BOUGHT columns)
  if (isRepairOrder) {
  outBoughtCats  = arrJoin("camefor_categories", ", ");
  outBoughtCount = upper(v("camefor_count"));
  outBoughtTags  = tags("camefor_tag_");
  outBoughtOther = upper(v("camefor_other_text"));

    if (repair_approach === "YES") {
    outSeenCats  = arrJoin("seen_categories", ", ");
    outSeenCount = upper(v("seen_count"));
    outSeenTags  = tags("seen_product_tag_");
    outSeenOther = upper(v("seen_other_text"));

    if (new_things_choice === "BUYING_NEW_PRODUCT" || new_things_choice === "MAKING_NEW_ORDER") {
      outOrderCats  = arrJoin("new_things_categories", ", ");
      outOrderCount = upper(v("new_things_count"));
      outOrderTags  = tags("new_things_tag_");
      outOrderOther = upper(v("new_things_other_text"));
    }
  } else if (repair_approach === "NO") {
    outSeenCats = outSeenCount = outSeenTags = outSeenOther = "";
    outOrderCats = outOrderCount = outOrderTags = outOrderOther = "";
  } else {
    outSeenCats = outSeenCount = outSeenTags = outSeenOther = "";
    outOrderCats = outOrderCount = outOrderTags = outOrderOther = "";
  }
}

  // file urls
  const instaProofUrl = fileUrlByField["instagram_follow_proof"] || "";
  const googleUrl = fileUrlByField["google_review_screenshot"] || "";
  const testiUrl  = fileUrlByField["testimonial_media"] || "";
  const feedUrl   = fileUrlByField["feedback_screenshot"] || "";
  const noteUrl   = fileUrlByField["thankyou_note_photo"] || "";

  const rowByHeader = {};

  rowByHeader["TIMESTAMP"] = Utilities.formatDate(now, tz, "yyyy-MM-dd HH:mm:ss");
  rowByHeader["CRM CLIENT ID"] = upper(v("client_id"));

  rowByHeader["CLIENT VISIT DATE"] = v("visit_date");
  rowByHeader["CLIENT TYPE"] = upper(v("client_type"));
  rowByHeader["SOURCE OF LEAD"] = upper(v("source"));
  rowByHeader["SOURCE (OTHER)"] = upper(v("source_other"));
  rowByHeader["REFERENCE NAME"] = upper(v("reference_name"));
  rowByHeader["REFERENCE PHONE"] = cleanPhone(v("reference_phone"));
  rowByHeader["BRANCH"] = upper(v("branch"));
  rowByHeader["CRM NAME"] = upper(v("crm_name"));
  rowByHeader["CLIENT NAME"] = upper(v("client_name"));
  rowByHeader["GENDER"] = upper(v("gender"));
  rowByHeader["OCCUPATION"] = upper(v("occupation"));
  rowByHeader["OCCUPATION (OTHER)"] = upper(v("occupation_other"));
  rowByHeader["BRIDAL / NON BRIDAL"] = upper(v("bridal_status"));
  rowByHeader["MONTH OF WEDDING"] = upper(v("wedding_month"));
  rowByHeader["YEAR OF WEDDING"] = upper(v("wedding_year"));
  rowByHeader["COMMUNICATION PREFERENCE"] = upper(v("communication_preference"));
  rowByHeader["CLIENT PHONE"] = cleanPhoneWithCountry(v("client_phone"));
  rowByHeader["BILLING PHONE"] = cleanPhoneWithCountry(v("billing_phone"));
  rowByHeader["COUNTRY"] = upper(v("country"));
  rowByHeader["STATE"] = upper(v("state"));
  rowByHeader["CITY"] = upper(v("city"));
  rowByHeader["CITY (OTHER)"] = upper(v("city_other"));
  rowByHeader["PINCODE"] = upper(v("pincode"));
  rowByHeader["ADDRESS"] = upper(v("address"));
  rowByHeader["COMMUNITY"] = upper(v("caste"));
  rowByHeader["COMMUNITY (OTHER)"] = upper(v("caste_other"));
  rowByHeader["DOB"] = v("dob");
  rowByHeader["ANNIVERSARY"] = v("anniversary");
  rowByHeader["SALESPERSON"] = upper(v("salesperson"));

  rowByHeader["COMPANIONS COUNT"] = v("companions_count");
  for (let i = 1; i <= 10; i++) {
    rowByHeader[`COMPANION ${i} NAME`] = upper(v(`companion_name_${i}`));
    rowByHeader[`COMPANION ${i} MOBILE`] = cleanPhone(v(`companion_phone_${i}`));
    rowByHeader[`COMPANION ${i} RELATION`] = upper(v(`companion_relation_${i}`));
  }

  rowByHeader["CLIENT BOUGHT ANY PRODUCT?"] = buy_status;

  rowByHeader["NOT BOUGHT REASONS"] = arrJoin("not_bought_reason", ", ");
  rowByHeader["NOT BOUGHT REASON (OTHER TEXT)"] = upper(v("not_bought_other_text"));
  rowByHeader["REPAIR/ORDER APPROACH"] = upper(v("repair_approach"));
  rowByHeader["NEW THINGS CHOICE"] = upper(v("new_things_choice"));
  rowByHeader["NEW THINGS SALESPERSON"] = upper(v("new_things_salesperson"));

  rowByHeader["SEEN CATEGORIES"] = outSeenCats;
  rowByHeader["SEEN PRODUCTS COUNT"] = outSeenCount;
  rowByHeader["SEEN TAGS (COMBINED)"] = outSeenTags;
  rowByHeader["SEEN OTHER TEXT"] = outSeenOther;

  rowByHeader["BOUGHT CATEGORIES"] = outBoughtCats;
  rowByHeader["BOUGHT PRODUCTS COUNT"] = outBoughtCount;
  rowByHeader["BOUGHT TAGS (COMBINED)"] = outBoughtTags;
  rowByHeader["BOUGHT OTHER TEXT"] = outBoughtOther;

  rowByHeader["ORDER/NEW THINGS CATEGORIES"] = outOrderCats;
  rowByHeader["ORDER/NEW THINGS COUNT"] = outOrderCount;
  rowByHeader["ORDER/NEW THINGS TAGS (COMBINED)"] = outOrderTags;
  rowByHeader["ORDER/NEW THINGS OTHER TEXT"] = outOrderOther;

  rowByHeader["OTHER ORDER"] = upper(v("other_order"));

  // CRM approach
  rowByHeader["MARKETING MESSAGE"] = upper(v("marketing_message"));

  // Instagram 3 fields
  rowByHeader["INSTAGRAM FOLLOW ASKED"] = upper(v("instagram_follow_asked"));
  rowByHeader["INSTAGRAM FOLLOW - NO REASON"] = upper(v("instagram_follow_no_reason"));
  rowByHeader["INSTAGRAM FOLLOW - PROOF URL"] = instaProofUrl;

  // existing CRM items
  rowByHeader["GOOGLE REVIEW ASKED"] = upper(v("google_review_asked"));
  rowByHeader["GOOGLE REVIEW - NO REASON"] = upper(v("google_review_no_reason"));
  rowByHeader["GOOGLE REVIEW - SCREENSHOT URL"] = googleUrl;

  rowByHeader["TESTIMONIAL ASKED"] = upper(v("testimonial_asked"));
  rowByHeader["TESTIMONIAL - NO REASON"] = upper(v("testimonial_no_reason"));
  rowByHeader["TESTIMONIAL - MEDIA URL"] = testiUrl;

  rowByHeader["FEEDBACK FORM ASKED"] = upper(v("feedback_asked"));
  rowByHeader["FEEDBACK FORM - NO REASON"] = upper(v("feedback_no_reason"));
  rowByHeader["FEEDBACK FORM - SCREENSHOT URL"] = feedUrl;

  rowByHeader["THANK-YOU NOTE GIVEN"] = upper(v("thankyou_note"));
  rowByHeader["THANK-YOU NOTE - NO REASON"] = upper(v("thankyou_note_no_reason"));
  rowByHeader["THANK-YOU NOTE - PHOTO URL"] = noteUrl;

  rowByHeader["REFERRALS ASKED"] = upper(v("referrals_asked"));
  rowByHeader["REFERRALS - NO REASON"] = upper(v("referrals_no_reason"));
  rowByHeader["REFERRALS - PROOF URL"] = "";

  // preferences
  rowByHeader["BEVERAGE"] = upper(v("beverage"));
  rowByHeader["BEVERAGE (OTHER)"] = upper(v("beverage_other"));
  rowByHeader["SUGAR"] = upper(v("sugar"));
  rowByHeader["SUGAR (OTHER)"] = upper(v("sugar_other"));
  rowByHeader["SNACK"] = upper(v("snack"));
  rowByHeader["SNACK (OTHER)"] = upper(v("snack_other"));
  rowByHeader["GIFT GIVEN"] = arrJoin("gift", ", ");
  rowByHeader["GIFT (OTHER)"] = upper(v("gift_other"));

  // remark
  rowByHeader["NEXT VISIT DATE"] = v("next_visit_date");
  rowByHeader["CLIENT POTENTIAL CATEGORY"] = upper(v("client_potential_category"));
  rowByHeader["WHY IS THIS CLIENT A HIGH-POTENTIAL BUYER?"] = upper(v("high_potential_reason"));
  rowByHeader["REMARK"] = upper(v("remark"));

  // uploads doc
  rowByHeader["UPLOAD"] = uploadsDocUrl || "";

  // ✅ NEW FIELDS (ADD HERE)
  // ✅ NEW FIELDS
    rowByHeader["PRODUCT REQUIREMENT"] = upper(v("product_requirement"));
  rowByHeader["OTHER STORE CLIENT WANTS TO VISIT"] = upper(v("other_store_visit"));

  const moreDesignCats = arrJoin("more_design_categories", ", ");
  const moreDesignOther = upper(v("more_design_other_text"));
  rowByHeader["WHICH CATEGORIES CLIENT WANT TO SEE MORE"] =
    [moreDesignCats, moreDesignOther].filter(Boolean).join(", ");

  rowByHeader["REFERENCE NUMBER"] = upper(v("reference_number"));

  return HEADERS.map(h => (rowByHeader[h] != null ? rowByHeader[h] : ""));
}

/** ====== UPLOADS: SAVE FILES TO DRIVE ====== **/
function saveUploads_(filesPayload) {
  const out = {};
  if (!filesPayload || !filesPayload.length) return out;

  const folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);

  filesPayload.forEach(item => {
    if (!item || !item.base64) return;

    const bytes = Utilities.base64Decode(item.base64);
    const blob = Utilities.newBlob(
      bytes,
      item.mimeType || "application/octet-stream",
      item.fileName || "upload"
    );

    const file = folder.createFile(blob);
    out[item.fieldName] = file.getUrl();
  });

  return out;
}

/** Creates ONE Google Doc with all file links (clickable). */
function createUploadsDoc_(formDataObj, fileUrlByField) {
  const folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);

  const items = [];
  const addIf = (label, fieldName) => {
    const url = fileUrlByField[fieldName];
    if (url) items.push({ label, url });
  };

addIf("INSTAGRAM FOLLOW PROOF", "instagram_follow_proof");
addIf("GOOGLE REVIEW SCREENSHOT", "google_review_screenshot");
addIf("TESTIMONIAL MEDIA", "testimonial_media");
addIf("FEEDBACK SCREENSHOT", "feedback_screenshot");
addIf("THANK-YOU NOTE PHOTO", "thankyou_note_photo");
addIf("REFERRALS PROOF", "referrals_proof");

  for (let i = 1; i <= 10; i++) {
    const k = `remark_photo_${i}`;
    if (fileUrlByField[k]) items.push({ label: `REMARK PHOTO ${i}`, url: fileUrlByField[k] });
  }

  if (items.length === 0) return "";

  const tz = Session.getScriptTimeZone() || "Asia/Kolkata";
  const ts = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd_HH-mm-ss");
  const clientName = String((formDataObj && formDataObj.client_name) ? formDataObj.client_name : "").trim();
  const safeName = (clientName ? clientName.replace(/[^\w\s-]/g, "").trim() : "CLIENT").substring(0, 40);

  const docName = `WALKIN_UPLOADS_${safeName}_${ts}`;
  const doc = DocumentApp.create(docName);
  const body = doc.getBody();

  body.appendParagraph("MK JEWELS — WALK-IN FORM UPLOADS")
    .setHeading(DocumentApp.ParagraphHeading.HEADING1);

  if (clientName) body.appendParagraph(`CLIENT: ${clientName.toUpperCase()}`);

  const visitDate = String((formDataObj && formDataObj.visit_date) ? formDataObj.visit_date : "").trim();
  if (visitDate) body.appendParagraph(`VISIT DATE: ${visitDate}`);

  body.appendParagraph("");
  body.appendParagraph("UPLOAD LINKS")
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);

  items.forEach(it => appendClickableLinkLine_(body, it.label, it.url));

  doc.saveAndClose();

  const docFile = DriveApp.getFileById(doc.getId());
  folder.addFile(docFile);
  try { DriveApp.getRootFolder().removeFile(docFile); } catch (e) {}

  return docFile.getUrl();
}

function appendClickableLinkLine_(body, label, url) {
  if (!url) return;

  const p = body.appendParagraph(`${label}: ${url}`);
  const text = p.editAsText();
  const full = text.getText();

  const start = full.indexOf(url);
  if (start >= 0) {
    const end = start + url.length - 1;
    text.setLinkUrl(start, end, url);
  }
}

/** ====== HELPERS ====== **/
function combineDynamicTags_(d, prefix, max, sep) {
  const out = [];
  for (let i = 1; i <= max; i++) {
    const key = prefix + i;
    const val = (d && d[key] != null) ? String(d[key]).trim() : "";
    if (val) out.push(val.toUpperCase());
  }
  return out.join(sep || ", ");
}

function getOrCreateSheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function ensureHeaderRow_(sh, headers) {
  const lastCol = headers.length;

  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, lastCol).setValues([headers]);
    sh.setFrozenRows(1);
    return;
  }

  const existing = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const isBlank = existing.every(x => String(x || "").trim() === "");
  const mismatch = existing.some((v, i) => String(v || "").trim() !== headers[i]);

  if (isBlank || mismatch) {
    sh.getRange(1, 1, 1, lastCol).setValues([headers]);
    sh.setFrozenRows(1);
  }
}

/************************************************************
 * WALK-IN REFERENCE NUMBER GENERATOR
 ************************************************************/

function generateUniqueWalkinReference_(sh, formDataObj) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const headers = getExpectedHeaders_();
    ensureHeaderRow_(sh, headers);

    const REF_COL = WALKIN_REFERENCE_COL; // DY / 129
    const DATA_START_ROW = 2;

    const existingSet = new Set();
    const lastRow = sh.getLastRow();

    if (lastRow >= DATA_START_ROW) {
      const refValues = sh
        .getRange(DATA_START_ROW, REF_COL, lastRow - DATA_START_ROW + 1, 1)
        .getValues()
        .flat();

      refValues.forEach(v => {
        const ref = String(v || "").trim().toUpperCase();
        if (ref) existingSet.add(ref);
      });
    }

    const props = PropertiesService.getScriptProperties();

    let serial = Number(props.getProperty(WALKIN_REFERENCE_SERIAL_PROP) || 0);
    if (!serial || isNaN(serial)) {
      serial = WALKIN_REFERENCE_SERIAL_START - 1;
    }

    const nameCode = extractReferenceCode_(formDataObj.client_name || "CLIENT", 3);
    const branchCode = extractReferenceCode_(formDataObj.branch || "BRANCH", 3);
    const salesCode = extractSalesReferenceCode_(
      formDataObj.salesperson || formDataObj.crm_name || "CRM"
    );

    let ref = "";

    do {
      serial++;
      ref = `${WALKIN_REFERENCE_PREFIX}-${nameCode}-${branchCode}-${salesCode}-${serial}`;
    } while (existingSet.has(ref));

    props.setProperty(WALKIN_REFERENCE_SERIAL_PROP, String(serial));

    return ref;

  } finally {
    lock.releaseLock();
  }
}


function extractReferenceCode_(value, len) {
  let text = String(value || "").trim().toUpperCase();

  text = text
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "X".repeat(len);

  const parts = text.split(" ").filter(Boolean);

  let code = "";

  if (parts.length >= 2) {
    code = parts.map(p => p[0]).join("").substring(0, len);
  } else {
    code = text.replace(/[^A-Z0-9]/g, "").substring(0, len);
  }

  return (code + "X".repeat(len)).substring(0, len);
}

function extractSalesReferenceCode_(value) {
  let text = String(value || "").trim().toUpperCase();

  text = text
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "XX";

  const parts = text.split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).substring(0, 2);
  }

  return (text.replace(/[^A-Z0-9]/g, "").substring(0, 2) + "XX").substring(0, 2);
}


/**
 * Run this once after adding REFERENCE NUMBER header.
 * It fills REFERENCE NUMBER for old walk-in rows.
 */

function generateMissingWalkinReferenceNumbers() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = getOrCreateSheet_(ss, RESPONSES_SHEET);

  const headers = getExpectedHeaders_();
  ensureHeaderRow_(sh, headers);

  const REF_COL = WALKIN_REFERENCE_COL; // DY / 129
  const DATA_START_ROW = 2;

  const lastRow = sh.getLastRow();
  const lastCol = Math.max(sh.getLastColumn(), REF_COL);

  if (lastRow < DATA_START_ROW) {
    SpreadsheetApp.getUi().alert("No data rows found.");
    return;
  }

  const numRows = lastRow - DATA_START_ROW + 1;
  const values = sh.getRange(DATA_START_ROW, 1, numRows, lastCol).getValues();

  const headerRow = sh
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(h => String(h || "").trim().toUpperCase());

  const idx = {};
  headerRow.forEach((h, i) => {
    if (h && idx[h] == null) idx[h] = i;
  });

  const existingSet = new Set();

  values.forEach(row => {
    const ref = String(row[REF_COL - 1] || "").trim().toUpperCase();
    if (ref) existingSet.add(ref);
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const props = PropertiesService.getScriptProperties();

    let serial = Number(props.getProperty(WALKIN_REFERENCE_SERIAL_PROP) || 0);
    if (!serial || isNaN(serial)) {
      serial = WALKIN_REFERENCE_SERIAL_START - 1;
    }

    const output = [];
    let created = 0;

    values.forEach(row => {
      const existingRef = String(row[REF_COL - 1] || "").trim().toUpperCase();

      if (existingRef) {
        output.push([existingRef]);
        return;
      }

      const hasAnyData = row.some(v => String(v || "").trim() !== "");
      if (!hasAnyData) {
        output.push([""]);
        return;
      }

      const clientName = String(row[idx["CLIENT NAME"]] || "").trim();
      const branch = String(row[idx["BRANCH"]] || "").trim();
      const salesperson = String(
        row[idx["SALESPERSON"]] ||
        row[idx["CRM NAME"]] ||
        ""
      ).trim();

      if (!clientName || !branch || !salesperson) {
        output.push([""]);
        return;
      }

      const nameCode = extractReferenceCode_(clientName, 3);
      const branchCode = extractReferenceCode_(branch, 3);
      const salesCode = extractSalesReferenceCode_(salesperson);

      let ref = "";

      do {
        serial++;
        ref = `${WALKIN_REFERENCE_PREFIX}-${nameCode}-${branchCode}-${salesCode}-${serial}`;
      } while (existingSet.has(ref));

      existingSet.add(ref);
      output.push([ref]);
      created++;
    });

    props.setProperty(WALKIN_REFERENCE_SERIAL_PROP, String(serial));

    sh.getRange(DATA_START_ROW, REF_COL, output.length, 1).setValues(output);

    SpreadsheetApp.getUi().alert(
      "Missing reference numbers generated only in DY / column 129.\n\n" +
      "Created: " + created
    );

  } finally {
    lock.releaseLock();
  }
}




/************************************************************
 * CLIENT TYPE AUTO CHECK BY PHONE
 * If client/billing phone exists in CRM MASTER or WALKIN DATASET,
 * return OLD CLIENT. Otherwise return NEW CLIENT.
 ************************************************************/
function checkClientTypeByPhone(clientPhone, billingPhone) {
  const phones = [clientPhone, billingPhone]
    .map(v => last10DigitsForClientCheck_(v))
    .filter(Boolean);

  if (!phones.length) {
    return { ok: true, clientType: "NEW CLIENT", found: false };
  }

  const targets = new Set(phones);

  if (phoneExistsInCrmMaster_(targets) || phoneExistsInWalkinDataset_(targets)) {
    return { ok: true, clientType: "OLD CLIENT", found: true };
  }

  return { ok: true, clientType: "NEW CLIENT", found: false };
}

function last10DigitsForClientCheck_(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function phoneExistsInCrmMaster_(targets) {
  try {
    const ss = SpreadsheetApp.openById(CRM_SOURCE_SPREADSHEET_ID);
    const sh = ss.getSheetByName(CRM_MASTER_SHEET_NAME);
    if (!sh) return false;

    const values = sh.getDataRange().getValues();
    if (!values || values.length < 2) return false;

    const headers = values[0].map(h => String(h || "").trim().toUpperCase());
    const col = (name) => headers.indexOf(String(name || "").trim().toUpperCase());

    const phoneCols = [
      col("PRIMARY PHONE"),
      col("BILLING PHONE"),
      col("CLIENT PHONE"),
      col("OTHER KNOWN PHONES")
    ].filter(i => i >= 0);

    if (!phoneCols.length) return false;

    for (let r = 1; r < values.length; r++) {
      for (const c of phoneCols) {
        const cellText = String(values[r][c] || "");
        const allNumbers = cellText.split(/[,;|\/\n\r\t ]+/).filter(Boolean);
        allNumbers.push(cellText);

        for (const n of allNumbers) {
          const last10 = last10DigitsForClientCheck_(n);
          if (last10 && targets.has(last10)) return true;
        }
      }
    }
  } catch (err) {
    Logger.log("phoneExistsInCrmMaster_ error: " + err);
  }

  return false;
}

function phoneExistsInWalkinDataset_(targets) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(RESPONSES_SHEET);
    if (!sh || sh.getLastRow() < 2) return false;

    const lastCol = sh.getLastColumn();
    const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0]
      .map(h => String(h || "").trim().toUpperCase());
    const col = (name) => headers.indexOf(String(name || "").trim().toUpperCase());

    const phoneCols = [
      col("CLIENT PHONE"),
      col("BILLING PHONE")
    ].filter(i => i >= 0);

    if (!phoneCols.length) return false;

    const values = sh.getRange(2, 1, sh.getLastRow() - 1, lastCol).getValues();

    for (const row of values) {
      for (const c of phoneCols) {
        const last10 = last10DigitsForClientCheck_(row[c]);
        if (last10 && targets.has(last10)) return true;
      }
    }
  } catch (err) {
    Logger.log("phoneExistsInWalkinDataset_ error: " + err);
  }

  return false;
}



/************************************************************
 * ONE-TIME HEADER FIX FOR NEW CLIENT DETAIL FIELDS
 * Run this once after replacing Code.gs if your sheet still shows
 * RESERVED COLUMN after "WHICH CATEGORIES CLIENT WANT TO SEE MORE".
 * It writes the six new headers at the end without moving old logic.
 ************************************************************/
function fixNewClientDetailFieldsHeadersAtLast() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = getOrCreateSheet_(ss, RESPONSES_SHEET);
  const headers = getExpectedHeaders_();

  // Main script header row
  ensureHeaderRow_(sh, headers);

  const newHeaders = [
    "OCCUPATION",
    "OCCUPATION (OTHER)",
    "BRIDAL / NON BRIDAL",
    "MONTH OF WEDDING",
    "YEAR OF WEDDING",
    "COMMUNICATION PREFERENCE"
  ];

  const afterHeader = "WHICH CATEGORIES CLIENT WANT TO SEE MORE";
  const headerRow = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), headers.length)).getValues()[0]
    .map(h => String(h || "").trim().toUpperCase());

  let afterCol = headerRow.indexOf(afterHeader) + 1; // 1-based
  if (afterCol <= 0) {
    afterCol = headers.indexOf(afterHeader) + 1;
  }
  if (afterCol <= 0) {
    throw new Error("Header not found: " + afterHeader);
  }

  const startCol = afterCol + 1;

  // Row 1 actual script headers
  sh.getRange(1, startCol, 1, newHeaders.length).setValues([newHeaders]);

  // If your sheet has manual display headers on row 3 like the screenshot,
  // write the same names there also. This does not change old submit logic.
  if (sh.getMaxRows() >= 3) {
    sh.getRange(3, startCol, 1, newHeaders.length).setValues([newHeaders]);
  }

  // If row 2 has serial numbers, continue them for easy checking.
  if (sh.getMaxRows() >= 2) {
    const nums = [];
    for (let i = 0; i < newHeaders.length; i++) nums.push(startCol + i);
    sh.getRange(2, startCol, 1, newHeaders.length).setValues([nums]);
  }

  SpreadsheetApp.getUi().alert(
    "Done. New fields headers added after: " + afterHeader +
    "\nStart column number: " + startCol
  );
}

function authTest_Docs(){
  const d = DocumentApp.create("MK AUTH TEST");
  DriveApp.getFileById(d.getId()).setTrashed(true);
}

function debugFindWalkinEntryForEdit() {
  const ref = 'MK-WK-PMX-BAN-TK-2479'; // change this if needed

  const result = getWalkinEntryForEdit(ref);

  Logger.log(JSON.stringify(result, null, 2));

  SpreadsheetApp.getUi().alert(
    'FOUND: ' + result.ok + '\n' +
    'REFERENCE: ' + ref + '\n' +
    'ROW: ' + (result.rowNumber || '') + '\n' +
    'MESSAGE: ' + (result.message || '')
  );
}


/************************************************************
 * ONE-TIME SAFE CLEANUP / MIGRATION
 *
 * Correct reference column:
 * DY = column 129
 *
 * Legacy / wrong reference columns:
 * DS = column 123
 * DC = column 107
 *
 * This function:
 * 1. Copies DS/DC reference to DY only where DY is blank.
 * 2. Clears MK references from DC only.
 * 3. Does not clear DS automatically, so old data remains safe.
 ************************************************************/
function migrateReferencesToDY() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(RESPONSES_SHEET);

  if (!sh) {
    throw new Error("WALKIN DATASET sheet not found.");
  }

  const WRONG_REF_COL_DC = 107;
  const LEGACY_REF_COL_DS = 123;
  const CORRECT_REF_COL_DY = WALKIN_REFERENCE_COL;
  const START_ROW = 2;

  const lastRow = sh.getLastRow();

  if (lastRow < START_ROW) {
    SpreadsheetApp.getUi().alert("No data rows found.");
    return;
  }

  const numRows = lastRow - START_ROW + 1;

  const dcRange = sh.getRange(START_ROW, WRONG_REF_COL_DC, numRows, 1);
  const dsRange = sh.getRange(START_ROW, LEGACY_REF_COL_DS, numRows, 1);
  const dyRange = sh.getRange(START_ROW, CORRECT_REF_COL_DY, numRows, 1);

  const dcValues = dcRange.getValues();
  const dsValues = dsRange.getValues();
  const dyValues = dyRange.getValues();

  let copiedDsToDy = 0;
  let copiedDcToDy = 0;
  let clearedDc = 0;

  const looksLikeReference = (value) => {
    const v = String(value || "").trim().toUpperCase();
    return v && (v.startsWith("MK-WK") || v.startsWith("MK-"));
  };

  for (let i = 0; i < numRows; i++) {
    const dcVal = String(dcValues[i][0] || "").trim().toUpperCase();
    const dsVal = String(dsValues[i][0] || "").trim().toUpperCase();
    const dyVal = String(dyValues[i][0] || "").trim().toUpperCase();

    if (!dyVal && looksLikeReference(dsVal)) {
      dyValues[i][0] = dsVal;
      copiedDsToDy++;
    } else if (!dyVal && looksLikeReference(dcVal)) {
      dyValues[i][0] = dcVal;
      copiedDcToDy++;
    }

    if (looksLikeReference(dcVal)) {
      dcValues[i][0] = "";
      clearedDc++;
    }
  }

  if (copiedDsToDy > 0 || copiedDcToDy > 0) {
    dyRange.setValues(dyValues);
  }

  if (clearedDc > 0) {
    dcRange.setValues(dcValues);
  }

  SpreadsheetApp.getUi().alert(
    "Reference migration completed.\n\n" +
    "Copied DS to DY where DY was blank: " + copiedDsToDy + "\n" +
    "Copied DC to DY where DY was blank: " + copiedDcToDy + "\n" +
    "Cleared wrong DC references: " + clearedDc + "\n\n" +
    "Final reference column is DY / column 129."
  );
}

// Backward-compatible name for old menu/manual runs.
function fixWrongDCReferencesAndKeepDS() {
  migrateReferencesToDY();
}

function checkEditReferenceLookupNow() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('CHECK EDIT WALK-IN REFERENCE', 'Enter REFERENCE NUMBER to check:', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;

  const ref = String(res.getResponseText() || '').trim();
  const result = getWalkinEntryForEdit(ref);

  ui.alert(
    'FOUND: ' + result.ok + '\n' +
    'REFERENCE: ' + ref + '\n' +
    'ROW: ' + (result.rowNumber || '') + '\n' +
    'REF COL: ' + (result.referenceColumn || '') + '\n' +
    'MESSAGE: ' + (result.message || '')
  );
}
