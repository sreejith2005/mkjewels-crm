# Legacy parity audit

**Audit date:** 2026-07-27
**Scope:** read-only comparison of the literal legacy sources in `WEB APP/`—`CRM CODE.GS`, `CRM INDEX.HTML`, `FORM CODE.GS`, and `FROM INDEX.HTML`—against the current Next.js implementation in the same checkout. The filename `FROM INDEX.HTML` is intentionally preserved: it is the tracked legacy file named in the request as `FROM_INDEX.HTML`.

## Method and status vocabulary

The four legacy files were re-read in full for this audit. Line references below are current physical source lines. **PARITY** means the same user-facing item and material behavior exists; **GAP** means the legacy item is absent; **MISMATCH** means an item exists but its displayed value or behavior differs. A current database column alone is not treated as UI parity.

## 1. Not Bought Follow-Up

### Legacy list, in exact order

Legacy UI renders these 12 table headers, in this exact text and order (`CRM INDEX.HTML:4697-4708`). Each row is produced by `renderNotBoughtFollowups` (`CRM INDEX.HTML:4606-4717`); values come from `getNotBoughtFollowupRows` and `nbMasterObjToClientObject_` (`CRM CODE.GS:4380-4458`, `4461-4491`).

| # | Legacy label / value logic | Current implementation | Status |
|---:|---|---|---|
| 1 | `CRM NAME` — `obj['CRM NAME']` (`CRM CODE.GS:4473`), display `r.crmName` (`CRM INDEX.HTML:4623`) | Not rendered in the table; loaded as `crm_name` (`app/(crm)/followups/page.tsx:5-8`). | GAP |
| 2 | `CLIENT NAME` — `obj['CLIENT NAME']` (`4469`), also shows status pill, `FU: followUpCount`, and `HIST: historyCount` (`4624-4630`). | Client name and phone only (`components/followup-queue.tsx:9-10`). No visible status, FU, or HIST badge. | GAP |
| 3 | `NUMBER` — primary phone, otherwise billing phone (`4470-4471`, `4632`). | Phone is displayed below client name (`followup-queue.tsx:9-10`). | PARITY |
| 4 | `CLIENT VISIT DATE` — `EVENT DATE` / `eventDate` (`4475`, `4633`). | Loaded as `visit_date` but not rendered (`followups/page.tsx:7`; `followup-queue.tsx:9-10`). | GAP |
| 5 | `NEXT FOLLOW UP` — `NEXT FOLLOW UP DATE` (`4484`, `4634`). | Rendered (`followup-queue.tsx:9-10`). | PARITY |
| 6 | `REASON` — `NOT BOUGHT REASON` (`4478`, `4635`). | Rendered, composed from visit-form reason + other reason (`followups/page.tsx:7`; `followup-queue.tsx:9-10`). | MISMATCH — current composition may add text not present in the legacy master value. |
| 7 | `SEEN CATEGORIES` — `SEEN CATEGORIES` (`4476`, `4636`). | Loaded but not rendered (`followups/page.tsx:7`; `followup-queue.tsx:9-10`). | GAP |
| 8 | `PRODUCT REQUIREMENT` — `PRODUCT REQUIREMENT` (`4477`, `4637`). | Loaded but not rendered (`followups/page.tsx:7`; `followup-queue.tsx:9-10`). | GAP |
| 9 | `REMARK / PRODUCT SEEN` — `LAST WALKIN REMARK` (`4481`, `4638`). | Not supplied to / rendered by the current queue. | GAP |
| 10 | `FOLLOW UP REMARK` — `LAST FOLLOW UP REMARK` (`4487`, `4639`). | Loaded as `remark`, but not rendered in the list (`followups/page.tsx:7`; `followup-queue.tsx:9-10`). | GAP |
| 11 | `ACTION POINT` — `ACTION POINT` (`4482`, `4640`). | Not supplied to / rendered by the current queue. | GAP |
| 12 | `ACTION` — `OPEN PROFILE`, `FOLLOW UP FORM`, `VIEW HISTORY` (`4617-4619`, `4641-4646`). | Client link and `FOLLOW UP FORM` exist (`followup-queue.tsx:10`); no separate `VIEW HISTORY` action. | GAP |

### Exact history and badge logic

`getNbHistoryCountMap_` reads the entire Not Bought history sheet, returns an empty map for fewer than two rows, maps each data row by its header row, and increments **both** the `(CLIENT ID, REFERENCE NUMBER)` key and the client-only `CLIENT ID|` key (`CRM CODE.GS:4494-4507`). `nbMasterObjToClientObject_` maps all legacy master columns literally and uses `histMap[key] || histMap[clientHistoryKey] || 0` for `historyCount` (`4461-4491`). The list displays `FU: r.followUpCount` and `HIST: r.historyCount` next to Client Name (`CRM INDEX.HTML:4624-4630`).

Current code computes per-follow-up history rows and a client-level fallback count (`app/(crm)/followups/page.tsx:6-7`), but it displays neither badge. **GAP.**

### Tabs, sync, and save form

Legacy controls: `SYNC NOT BOUGHT DATA`, `REFRESH`; `TODAY FOLLOW UP`, `ALL PENDING FOLLOW UP`, `INPROCESS FOLLOW UP`, `ALL DONE`; `CRM NAME`, `ALL CRM`, `SEARCH CLIENT / PHONE / REFERENCE`, `APPLY`, `CLEAR` (`CRM INDEX.HTML:2802-2829`). The current queue has the four tabs, CRM filter, and search (`components/followup-queue.tsx:10`), but no visible sync or refresh control. **GAP: explicit sync/refresh controls.**

Legacy backend automatically calls `maybeAutoSyncNotBoughtFollowups_` before reading: eligible rows are `CLIENT BOUGHT ANY PRODUCT? / FINAL STATUS = NO`, plus repair/order rows with `REPAIR/ORDER APPROACH = YES` and products seen; it prevents duplicate references (`CRM CODE.GS:4380-4387`). The manual sync button exists because `syncNotBoughtFollowups` is callable from the client. Current queue fetches only already-created DB rows (`app/(crm)/followups/page.tsx:5-8`); there is no current UI sync. **GAP.**

Legacy tab filters are literal: Done accepts done follow-up or final outcome; Inprocess is open and has count > 0 or non-`PENDING` status; Pending is all open; Today is open and blank, today, **or overdue** next date, then sorts oldest first (`CRM CODE.GS:4424-4456`). Current shared filter treats Today as an open row with `next_followup_date <= today` and requires a non-null date (`lib/followup-logic.ts:19-26`). **MISMATCH: blank-date legacy Today records are intentionally visible; current ones are not.**

Legacy follow-up form fields, in order: `FOLLOW UP STATUS`, `NEXT FOLLOW UP DATE`, `CALL RESPONSE` (`CONNECTED`, `NOT PICKED`, `SWITCHED OFF`, `WHATSAPP ONLY`, `WRONG NUMBER`), `ENTERED BY`, `FOLLOW UP REMARK`, `SAVE FOLLOW UP` (`CRM INDEX.HTML:4654-4681`). Its browser requires a remark only for non-done statuses (`4770-4789`) and calls `saveNotBoughtFollowup`; backend updates master fields, increments count, appends a complete history row, de-duplicates same submissions in the prior 25 history rows within three minutes, and moves done records to closed leads (`CRM CODE.GS:4511-4628`).

Current form fields are outcome, next date, reason, optional other reason, remark, and `SAVE` (`components/followup-queue.tsx:10`), calling `update_not_bought_followup` and then `update_not_bought_reason`. There is no visible status selector, `ENTERED BY`, or action-point field; it also exposes reason editing which is not a legacy follow-up form control. **GAP: status/entered-by/action-point controls. MISMATCH: form control contract and call-response vocabulary.**

## 2. Referrals Calling

### Legacy list, in exact order

`renderReferralRows` produces these exact 10 headers (`CRM INDEX.HTML:4961-4988`); source mapping is `referralObjToClient_` (`CRM CODE.GS:5349-5371`).

| # | Legacy label / value logic | Current implementation | Status |
|---:|---|---|---|
| 1 | `CRM / DOER` — `ASSIGNED CRM / DOER`, fallback `CRM NAME` (`5361`, `4970`). | `CRM/DOER` shown from `crm_name` only (`components/referral-queue.tsx:3-4`). | MISMATCH — no assigned-doer field/fallback is rendered. |
| 2 | `GIVEN BY CLIENT` — `REFERRAL GIVEN BY CLIENT`, plus `HIST` badge (`5358`, `4971`). | Given-by client link exists (`referral-queue.tsx:4`); no HIST badge. | GAP |
| 3 | `REFERRAL NAME` — `REFERRAL NAME` (`5359`, `4972`). | Rendered (`referral-queue.tsx:4`). | PARITY |
| 4 | `REFERRAL NUMBER` — `REFERRAL NUMBER` (`5360`, `4973`). | Rendered (`referral-queue.tsx:4`). | PARITY |
| 5 | `SALESPERSON` — `SALESPERSON` (`5357`, `4974`). | Rendered (`referral-queue.tsx:4`). | PARITY |
| 6 | `STATUS` — `FOLLOW UP STATUS` (`5362`, `4975`). | Rendered (`referral-queue.tsx:4`). | PARITY |
| 7 | `NEXT FOLLOW UP` — `NEXT FOLLOW UP DATE` (`5363`, `4976`). | Rendered (`referral-queue.tsx:4`). | PARITY |
| 8 | `LAST REMARK` — `LAST FOLLOW UP REMARK` (`5366`, `4977`). | Rendered as `remark` (`referral-queue.tsx:4`). | PARITY |
| 9 | `CONVERTED CLIENT` — `CONVERTED CLIENT ID` / `NO` (`5367`, `4978`). | `OPEN CLIENT` link / em dash (`referral-queue.tsx:4`). | PARITY |
| 10 | `ACTION` — `FOLLOW UP FORM`, `VIEW HISTORY` (`4980-4983`). | Both exist; current additionally exposes `CONVERT TO CLIENT` (`referral-queue.tsx:4`). | MISMATCH — extra explicit conversion action changes the legacy UI contract. |

`getReferralHistoryCountMap_` reads the referral history sheet, ignores blank referral keys, and increments only the `REFERRAL KEY` count (`CRM CODE.GS:5374-5386`). `referralObjToClient_` maps created/updated/source/CRM/salesperson/given-by/name/number/assigned CRM/status/dates/count/remark/converted fields/action point and sets `historyCount: historyCountMap[key] || 0` (`5349-5371`). The legacy badge is `HIST: historyCount` in Given By Client (`CRM INDEX.HTML:4971`). Current loads history remarks but does not display a count badge (`app/(crm)/referrals/page.tsx:5`; `components/referral-queue.tsx:4`). **GAP.**

Legacy controls are `SYNC REFERRALS DATA`, `REFRESH`, tabs `TODAY FOLLOW UP`, `ALL PENDING`, `INPROCESS`, `ALL DONE`, `CONVERTED TO CLIENT`, CRM/DOER filter, and search/apply/clear (`CRM INDEX.HTML:2858-2870`, `2873-2914`). Current has all five tabs and live filter/search but no Sync or Refresh control (`components/referral-queue.tsx:3-4`). **GAP: explicit sync/refresh.**

Legacy filters: Done is done status; Inprocess is open with history/status activity; Pending is all open; Converted is a converted ID or `CONVERTED TO CLIENT`; Today is open and has a blank next date or a next date **equal to today** (`CRM CODE.GS:5412-5429`). Current shared Today filtering includes past-due dated rows (`lib/followup-logic.ts:19-26`). **MISMATCH.**

Legacy referral follow-up form fields in order: `FOLLOW UP STATUS`, `CALL RESPONSE` (`CONNECTED`, `CALL NOT PICKED`, `NOT ANSWERED`, `WRONG NUMBER`, `WHATSAPP SENT`), `NEXT FOLLOW UP DATE`, `ENTERED BY`, `FOLLOW UP REMARK`, read-only `ACTION POINT`, `SAVE FOLLOW UP` (`CRM INDEX.HTML:4991-5026`). `saveReferralFollowup` requires status and, if not done, next date and remark; it updates the master, increments count, fills converted client/on for `CONVERTED TO CLIENT`, and appends history (`CRM CODE.GS:5432-5482`). Current exposes outcome, next date, remark, and save only (`components/referral-queue.tsx:4`). **GAP: status, entered-by, and action-point UI. MISMATCH: call-response vocabulary and status control are absent.**

Legacy conversion is primarily sync/status driven: sync detects an existing client by referral phone and marks `CONVERTED TO CLIENT`; save also marks when that status is selected (`CRM CODE.GS:5204-5224`, `5242-5325`, `5459-5461`). Current has a separate confirmation button that invokes `convert_referral_to_client` and opens the created client (`components/referral-queue.tsx:4`). This is the conversion mismatch recorded above.

## 3. Client Database

### Legacy master column list, in exact order

`getMasterHeaders_` defines the literal Client Database Master schema (`CRM CODE.GS:204-255`):

`CLIENT ID`, `PHONE KEY`, `NAME KEY`, `PRIMARY NAME`, `OTHER NAMES`, `PRIMARY PHONE`, `SECONDARY PHONE`, `BILLING PHONE`, `OTHER KNOWN PHONES`, `GENDER`, `COUNTRY`, `STATE`, `CITY`, `CITY OTHER`, `PINCODE`, `ADDRESS`, `COMMUNITY`, `COMMUNITY OTHER`, `DOB`, `ANNIVERSARY`, `BEVERAGE`, `SUGAR`, `SNACK`, `GIFT HISTORY`, `FIRST VISIT DATE`, `LAST VISIT DATE`, `TOTAL VISITS`, `TOTAL PURCHASE VISITS`, `TOTAL NON PURCHASE VISITS`, `TOTAL REPAIR VISITS`, `TOTAL ORDER VISITS`, `LAST BUY STATUS`, `LAST BRANCH`, `LAST CRM`, `LAST SALESPERSON`, `LAST REMARK`, `LAST PRODUCT REQUIREMENT`, `LAST SEEN CATEGORIES`, `LAST BOUGHT CATEGORIES`, `LAST ORDER CATEGORIES`, `CLIENT POTENTIAL CATEGORY`, `HIGH POTENTIAL REASON`, `INSTAGRAM STATUS`, `GOOGLE REVIEW STATUS`, `TESTIMONIAL STATUS`, `REFERRAL STATUS`, `NEXT VISIT DATE`, `PROFILE LAST UPDATED ON`, `PROFILE UPDATED BY`.

The legacy search-result table itself is `CLIENT ID`, `NAME`, `PHONE`, `CITY`, `STATE`, `TOTAL VISITS`, `LAST VISIT`, `LAST STATUS`, `ACTION` (`CRM INDEX.HTML:2963-2972`). `searchClients` reads those master values and maps `LAST BUY STATUS` to `lastStatus` (`CRM CODE.GS:2626-2658`). Current table is `Client ID`, `Name`, `Phone`, **`Potential`**, `City`, `State`, `Total visits`, `Last visit date`, `Last status`, `Actions` (`components/client-database.tsx:69-71`). All legacy search columns remain represented; Potential is an additive current column. **PARITY for the legacy result fields.**

### Last Status / Last Buy Status finding

Legacy does **not** collapse status to a yes/no boolean. `normalizeBuyStatus_` retains normalized raw compound values when they are not one of its direct map entries (`CRM CODE.GS:787-806`), and legacy grouping explicitly recognizes: `STORE_VISIT`, `ORDER_PLACED`, `ORDER_PICKUP`, `REPAIR_PLACED`, `REPAIR_PICKUP`, `PRODUCT_RETURN`, `PRODUCT_EXCHANGE`, `PRICE_CALCULATION`, `YES`, `NO`, plus compounds including `YES_AND_ORDER_PLACED`, `ORDER_PLACED_AND_BUYING_NEW_PRODUCT`, `ORDER_PLACED_AND_MAKING_NEW_ORDER`, `ORDER_PICKUP_AND_BUYING_NEW_PRODUCT`, `ORDER_PICKUP_AND_MAKING_NEW_ORDER`, `REPAIR_PLACED_AND_BUYING_NEW_PRODUCT`, `REPAIR_PLACED_AND_MAKING_NEW_ORDER`, `REPAIR_PICKUP_AND_BUYING_NEW_PRODUCT`, and `REPAIR_PICKUP_AND_MAKING_NEW_ORDER` (`CRM CODE.GS:1183-1245`).

Current schema has the same full `BuyStatus` enum, including all of the above (`prisma/schema.prisma:574-595`), and the Client Database displays the raw `last_buy_status` value, not `did_buy` (`components/client-database.tsx:17`, `69-71`). **PARITY.** The walk-in payload separately derives `did_buy` from `visit_status === "YES"` (`components/walk-in-form.tsx:333-340`), but that boolean is not what the Client Database Last status cell displays.

Legacy buttons are `ADD WALKIN ENTRY`, `RUN INCREMENTAL SYNC`, search `SEARCH`, and `CLEAR` (`CRM INDEX.HTML:2930-2947`). Current has `Register Client` (queue entry) and Search (`components/client-database.tsx:50-65`), but no user-facing incremental sync or clear button. The current page states data is live (`45-48`), so this is a **GAP: legacy incremental sync button/workflow**, not a claim that a sync is architecturally needed.

## 4. Walk-In Form — proof image upload handling

### Legacy behavior

The legacy form declares these proof controls: `instagram_follow_proof` (image), `google_review_screenshot` (image), `testimonial_media` (**image or video**), `feedback_screenshot` (image), `thankyou_note_photo` (image), and dynamic `remark_photo_1` through `_10`; referral proof is also included in the server-side upload summary (`FROM INDEX.HTML:1082-1165`, `FORM CODE.GS:1914-1924`). Browser submission base64-encodes file payloads and calls `submitForm`; `submitForm` saves uploads before writing the row, creates a single upload-summary Google Doc, stores individual file URLs in the appropriate URL columns, stores the Doc URL in `UPLOAD`, and preserves old URLs when editing without replacement files (`FORM CODE.GS:1113-1212`, `1587-1620`, `1622-1863`).

`saveUploads_` accepts any item with `base64`, decodes it, creates a blob using supplied MIME type/name, calls `DriveApp.getFolderById(UPLOAD_FOLDER_ID).createFile(blob)`, and returns `file.getUrl()` by field name (`FORM CODE.GS:1881-1902`). There is no extension, content-type, image-size, or file-size validation in that backend function. `createUploadsDoc_` creates `WALKIN_UPLOADS_<safe client name>_<timestamp>`, writes labelled clickable Drive URLs, adds the Doc to the same Drive folder, removes it from Drive root if possible, and returns the Doc URL (`1904-1972`). The legacy source specifies a fixed Drive folder ID at `FORM CODE.GS:14`.

### Current behavior and comparison

Current `uploadProof` permits only `image/*`, rejects non-images, enforces 10 MB maximum, replaces a prior proof for the same key, writes directly to the `crm-documents` Supabase Storage bucket at `<proposedClientId>/<proposedTimelineId>/<uuid>_<sanitized filename>`, with `upsert: false`, and retains storage path/name/MIME metadata (`components/walk-in-form.tsx:231-305`). Submission blocks if a Yes engagement has no ready image, sends `documents` metadata to `submit_walkin_visit`, and deletes uploaded objects if that RPC fails (`323-405`).

| Legacy capability | Current comparison | Status |
|---|---|---|
| Individual Drive file URLs + one generated Google Doc containing clickable labelled links | Storage object paths plus document metadata; no summary Doc. | MISMATCH |
| `testimonial_media` accepts video as well as image | All proof inputs are rejected unless `image/*`. | GAP |
| No server-side type/size validation in `saveUploads_` | Client validates image type and 10 MB; storage writes direct. | MISMATCH (stronger but materially different contract) |
| Preserve existing Drive URL fields when editing with no replacement | Current form is a new queue-completion flow; no legacy reference-number edit/upload preservation path is exposed here. | GAP |

## 5. Other legacy-only items encountered

The following literal items were encountered in the four legacy files and do not appear to exist in the current app as the described capability. Each is an additional **GAP**.

1. **Legacy walk-in edit by reference number** — `EDIT_WALKIN_ENTRY`, `edit_reference_number`, lookup across current DY / legacy DS / full sheet, preserve original timestamp and uploads (`FORM CODE.GS:1122-1212`, `1248-1420`). Current new-visit route only accepts a non-complete queue row (`app/(crm)/visits/new/page.tsx:6-12`).
2. **Legacy client-type check by existing phone before submission** — `checkClientTypeByPhone` searches CRM Master and Walkin Dataset and returns existing/new client classification (`FORM CODE.GS:2232-2329`). No equivalent current pre-submit client-type result was found.
3. **Legacy reference-number generator/backfill/migration tooling** — generated `MK-WK-...` reference, fixed DY/129 placement, missing-reference backfill and DS-to-DY migration (`FORM CODE.GS:2011-2213`, `2425-2505`). Current creates UUID-oriented client/timeline identifiers; no operator controls for these legacy reference maintenance actions were found.
4. **Legacy CRM availability roster editing includes rename/move/delete** — UI explicitly says `EDIT` changes CRM name or moves branch and `DELETE` removes it (`CRM INDEX.HTML:2660-2684`). Current Allocation supports add, deactivate/reactivate, and daily availability, not rename/move/delete (`components/allocation-manager.tsx:17`).
5. **Legacy walk-in form fields absent from the current form:** `CLIENT TYPE`, `OCCUPATION`, `OCCUPATION (OTHER)`, `BRIDAL / NON BRIDAL`, `MONTH OF WEDDING`, `YEAR OF WEDDING`, `COMMUNICATION PREFERENCE`, `MARKETING MESSAGE`, `OTHER STORE CLIENT WANTS TO VISIT`, `WHICH CATEGORIES CLIENT WANT TO SEE MORE`, `NEW THINGS CHOICE`, `NEW THINGS SALESPERSON`, and `OTHER ORDER` (legacy headers `FORM CODE.GS:417-540`; controls `FROM INDEX.HTML:427-559`, `903-1043`, `1061-1062`, `1299-1319`).
6. **Legacy engagement answer vocabulary** beyond yes/no: Instagram `CLIENT NOT INTERESTED`/`CLIENT ALREADY FOLLOWING US`; Google `ALREADY DONE BY CLIENT IN PAST`/`CLIENT NOT INTERESTED`; testimonial/feedback `CLIENT NOT INTERESTED`; referrals `CLIENT NOT INTERESTED` (`FROM INDEX.HTML:1073-1176`). Current engagement state is boolean `asked` with a free-text no-reason (`components/walk-in-form.tsx:364-371`, `679-756`).
7. **Legacy dynamic remark-photo controls (up to ten)** and their labelled entries in the upload summary document (`FROM INDEX.HTML:1319-1330`; `FORM CODE.GS:1921-1924`). No corresponding current control exists.

## Prioritized GAP and MISMATCH register

Counts are based on individual absent legacy fields/actions plus distinct behavioral differences: **41 GAPs** and **9 MISMATCHes**. The 13 literal missing walk-in fields in Section 5 are counted individually; compound controls are otherwise counted as one operational surface.

1. **GAP — Not Bought Follow-Up table loses eight operational columns plus status/FU/HIST context** (Section 1). This is the most direct daily calling workflow loss.
2. **GAP — Not Bought follow-up form lacks status, entered-by, action point, and a visible history action** (Section 1).
3. **GAP — Legacy explicit Not Bought and Referral sync controls/workflows are absent** (Sections 1–2).
4. **GAP — Referral follow-up form lacks status, entered-by, and action-point controls; Referral HIST badge is absent** (Section 2).
5. **MISMATCH — Legacy/current Today tab semantics differ for both queues**: Not Bought blank dates disappear in current; Referrals overdue records appear in current (Sections 1–2).
6. **GAP — Current walk-in proof flow rejects legacy-supported testimonial video and has no legacy edit-time URL preservation** (Section 4).
7. **MISMATCH — Current referral conversion is explicit-button/RPC driven, rather than legacy sync/status driven** (Section 2).
8. **GAP — Legacy reference-number edit, lookup, and maintenance workflow is absent** (Section 5).
9. **GAP — Legacy walk-in business fields and answer vocabularies listed in Section 5 are absent** (Section 5).
10. **GAP — Legacy CRM roster rename/move/delete actions are absent** (Section 5).
11. **MISMATCH — Proof persistence is Drive URL + generated summary Doc in legacy versus validated Storage objects/metadata in current** (Section 4).
12. **GAP — Legacy Client Database incremental-sync button/workflow is absent** (Section 3).
