# Figma file vs design brief

Findings from task 1 (tokens and primitives). The Figma file (`fDxmmTV6IGXNi3Dnk4M0pM`) has one page of 27 frames, **no variables and no components**, so tokens were read from the frames and named after the brief. Nothing below has been fixed in either source; `src/styles/tokens.css` follows the frames.

## Tokens: where Figma and the brief disagree

| Area | Brief | Figma frames | Tokens use |
|---|---|---|---|
| Line heights | Title 30/38, Section 22/30, Record 18/26, Body 15/24, Table 14/20, Small 13/20, Label 13/18, Mono 13/20 | "normal" everywhere, except 22px on wrapping banner and preview text | Figma ("normal", 22px, and 16px for mono to match Figma's render) |
| Field label | 13/18 medium | 14 semibold (H2), 13 semibold (B1) | 14 semibold (H2) |
| Page title | 30 semibold | 30 semibold (H3, B2); 32 **bold** (H2) | 30 semibold |
| Status label size | Not in the type scale | 12 semibold | 12 semibold (`--size-tag`) |
| Nav, table cell size | Table 14/20 with tabular figures | 14, no tabular-figure setting visible | 14; tabular figures not applied |
| Content width | 1200 | 1280 (1440 frame minus 80px margins) | 1280 |
| Colours not in the palette | — | `#F0F1F4` disabled field fill; Ink 30% disabled text; Ink 40% (Closed label fill, copy icon); Ink 6% (Withdrawn fill); Ink 45% modal scrim | Added as tokens |
| Icon size | 18px, 1.5px stroke | 12, 14, 16, 18, 20, 24px; 12px icons use a 2px stroke | Figma sizes as drawn |

## Inconsistencies between frames

- **Font family:** B1, B2 (and likely the other bidder frames) are set in Inter throughout, not Source Serif 4 / Public Sans / Source Code Pro. B2's fingerprints are Inter, not monospace.
- **Button padding:** 16/10 (C3, H2 cancel), 20/10 (H5 destructive), 20/12 at 15px (H3 "Open all bids"), 24/10 (H2 publish, P1 search), 24/12 (B1). The component uses 16/10 at 14px.
- **Field padding:** 12 all round (H2) vs 14/10 (B1); label gap 8 (H2) vs 6 (B1).
- **Banner icon:** 18px with 12px gap (P2) vs 24px with 16px gap (A2).
- **Card radius:** B1's sign-in card uses 8px; the brief reserves 8 for modals and drawers.

### Found in task 2 (spine, ruled table, diff line, stepper)

- **Middle dots:** spine meta lines join time and actor with " · " (P2, A2), which CLAUDE.md forbids. SpineNode sets them as separate items with a 12px gap.
- **Upcoming text contrast:** P2 and A2 set upcoming events at Ink 40 percent (2.3:1 on Paper). Raised to Ink 70 percent; the hollow marker and the word "Upcoming" carry the state. The sealed lock is raised the same way.
- **Lock marker placement:** P2 puts the lock on "Awarded" and labels it "Upcoming". The brief reserves the lock for sealed events (bids before opening). SpineNode's sealed state says "Sealed"; which events are sealed is decided per screen.
- **Stepper numbers:** the brief says the stepper is numbered; B3 draws empty circles and draws completed and upcoming steps the same.
- **Diff highlight extent:** the brief puts Highlighter "on the new value"; C3, A1 and P3 highlight the whole line. The component follows the frames.
- **Diff layouts:** three variants in the frames: C3 (12px padding, 120px label), A1 (10px padding, 160px label), P3 (stacked, arrow between values).
- **Table cell padding:** 16px (P1, H3, B2) and 12px (P2 detail, A1). Both are supported as densities.
- **Row borders:** H3 gives every row a full border, so rows meet with doubled 2px lines; P1 uses one bottom rule. The component uses P1's single rule.
- **Highlighter on a table row:** A2 marks the mismatched bid row with Highlighter, which the brief reserves for "what changed since the previous version". To settle when A2 is built (task 4).
- **Status word:** A2 adds a "Tampered" status label (Wax red, alert triangle), now in StatusLabel.
- **Pagination:** P1 shows Previous, numbers, Next; A1 shows Previous and Next only, with a transparent Previous that reads as disabled.

### Found in task 3 (P2 tender detail)

- **"Bids received" version:** P2 shows `v6` on the grouped bids event. AmanaDB versions belong to single records, so the grouped event shows a group fingerprint (SHA-256 over the bids' fingerprints) and no version.
- **Event actor:** P2 labels bids "System"; the brief's wireframe says "Bidders". The node shows the bidder count ("6 bidders").
- **Detail text width:** P2's description wraps at a very narrow width (a min-content sizing error in the frame). It uses the detail column's width, capped at the 720px reading width.
- **Opened and Awarded markers:** P2 puts the lock on Awarded. The page follows the brief: Opened is sealed (lock, "Sealed", closing date) until the closing time; later events are upcoming.
- **Table row alignment:** P2 top-aligns row text; P1, H3 and A1 centre it. Rows are centred everywhere (text sits 3px lower than in P2).
- **Brand gap:** the logo sits 4px from the name in P2, H3 and A1, 8px in P1 and the bidder frames. The navigation bar uses 4px.
- **Serif optical size:** Figma renders Source Serif 4 with optical sizing; the font is loaded with its `opsz` axis so titles match.
- **Month format:** ICU's en-GB data writes "Sept"; dates use fixed three-letter months to match the brief ("30 Sep 2026").

### Found in task 4 (sign-in and H3)

- **B1 card radius:** 8px as drawn, although the brief reserves 8 for modals and drawers (following the "as drawn" choice made for A2).
- **B1 fields:** B1 draws 13px labels and 14/10 padding; the shared Field (H2's values: 14px labels, 12px padding) is reused.
- **Signed-in navigation:** B2 shows an empty grey circle before the user's name; it carries no information and is left out. A "Sign out" text button follows the name.
- **H3 button size:** H3 draws "Open all bids" at 15px with 20/12 padding; the shared primary button is 14px with 16/10.
- **H3 after opening:** the frame still shows "Open all bids" beside revealed amounts; after opening the button is removed, since opening happens once.

### Found in task 4 (C2 and C3)

- **C2 built early:** C3 is raised by C2's Save, so C2 was built with C3 (the kickoff lists C2 in task 5).
- **C2 bid summary:** the frame shows a delivery timeline, technical approach, equipment list and document names that the data model does not hold. The summary shows real data only: revealed amount, sealed fingerprint with its reveal result, and the bid document's fingerprint.
- **C3 fields vs C2 fields:** C3 compares "Price score", "Technical score" and "Comment"; C2 has five weighted criteria and no comment. The form keeps C2's criteria and adds one comment field (C3's third row).
- **C2 copy:** "COMMITTEE" badge in capitals (left out), "Bid Summary", "Evaluation & Scoring", "Running Total" and "Evaluation Queue" in title case, "Score (1-20)", and a bullet between bidder and reference. Sentence case, "Score (1 to 20)", and separate items instead.
- **C2 footer:** "Changes saved locally. Draft." is not true (nothing is saved locally). It reads "Unsaved changes" (amber dot) or "All changes saved" (pine dot).
- **C2 Save button:** black text on pen blue in the frame (2.1:1); white, like every primary button.
- **C2 bidder line:** set in Source Code Pro in the frame; mono is for fingerprints only, so Public Sans.
- **C3 column titles:** capitals in the frame; sentence case.
- **C3 label column:** C3's 120px labels would wrap C2's longer criterion names and misalign the two columns; the modal uses the 160px label column.

### Found in task 4 (A1)

- **"CHANGED FIELDS"** in capitals: sentence case.
- **Date format:** A1 writes "30 Sep 2026 14:02" (no comma); the app's format elsewhere is "30 Sep 2026, 14:02".
- **Date-range pill:** A1 draws it with the funnel and no chevron; the Actor and Action pills have chevrons. Followed.
- **Pagination:** A1 shows only Previous and Next; followed. The total ("of 1,842 operations") is real: the whole log is read (GAPS open item 1).
- **"Verified" rows by "System":** A1 shows verification entries; the app does not write verification records (checks run on each page load), so there are none.

### Found in task 4 (A2)

- **A2 alert copy:** "Security alert: database mismatch" and "differ in content hash from the original ledger receipt … may have been tampered with or corrupted" use words the brief bans and guess at the cause. It reads "Stored document does not match" and "The document submitted with Kilimo Works Ltd's bid on 22 Sep 2026, 11:20 no longer matches the fingerprint recorded when the bid was revealed. The recorded bid is unchanged."
- **A2 table heading:** "Fingerprint Status" (title case); "Fingerprint", with the mark beside the chip as drawn.
- **Highlighter on the tampered row:** kept as drawn (user's choice), although the brief reserves Highlighter for changes between versions.

### Found in task 5 (P1)

- **Table header:** P1 draws the header row on Paper outside the white sheet; the shared ruled table keeps it inside the sheet, as in H3, A1 and P2.
- **Copy:** "Tender Title", "Procuring Entity", "Budget Ceiling", "Closing Date", "Category: All Procurement" in title case; sentence case and "Category: All".
- **Search placeholder:** the trailing "..." is dropped.
- **Pagination:** shown only when there is more than one page; the summary always shows.
- **Closed status:** a published tender past its closing time shows Closed before its record changes at opening.

### Found in task 5 (H2)

- **Copy:** "Publish to Ledger", "on the verified registry ledger", "Live Ledger Notice Preview" (capitals) and "Notice will generate cryptographic hash upon block publication" become "Publish tender", "Publish a new public procurement notice.", "Notice preview" and "A fingerprint of the notice is recorded when you publish." Title-case labels become sentence case.
- **Title:** H2 draws 32px bold; the page title style (30px semibold) is used, as on every other page.
- **"Officer Portal" button** in the navigation: replaced by the signed-in name and "Sign out".
- **Publishing confirmation (brief):** "Publish tender" opens a confirmation that the record is permanent and can be amended but not erased; publishing lands on the case file with "Tender published".
- **Reference and entity:** read-only, as drawn; the reference is the next free TND-year-number, the entity comes from the admin's account.
- **Closing time:** entered in East Africa Time; at least one hour ahead.
- **Document:** one PDF up to 10 MB, stored on disk under its SHA-256; only the hash goes to AmanaDB.

### Found in task 5 (B3 and B4)

- **B3 context line:** "SUBMIT BID FOR TENDER: TND-2026-0142" in capitals; "Submit a bid for TND-2026-0142".
- **B3 review fields:** delivery timeline, technical approach and equipment list are not in the data model; the review shows tender, amount, document, document fingerprint and closing time.
- **B3 steps 1 and 3** are not drawn: they use the review step's sheet, notice and action row. The bid document is hashed in the browser and not uploaded until the bid is opened (B5).
- **B4 subtitle:** "Official proof of cryptographic submission." becomes "Your sealed bid has been recorded."
- **B4 fingerprint:** drawn untruncated with "Copied"; the shared chip shows the first 4 and last 3 characters and its own copied state.
- **Bid reference:** a readable "BID-2026-0143-001" is stored on the bid (an added field).

### Found in task 5 (B5)

- **Sheet title:** "Decryption and verification results" becomes "Verification result". Nothing is encrypted; the bid is a commitment that is recomputed.
- **Fingerprints:** drawn as 25 characters; the shared chip shows the first 4 and last 3 characters, with the full value in its tooltip. A recomputed fingerprint that differs uses the chip's wax red tone.
- **Steps before the result** are not drawn. Step 1 loads the B4 receipt and the bid document, step 2 confirms the tender, amount and fingerprint, step 3 is the drawn result. They use B3's stepper and sheet.
- **Who may open:** only the signed-in bidder who sealed the bid, only after closing, once per bid. Each refusal is a wax red banner in step 2: "This receipt belongs to another bidder's bid…", "Bids can be revealed only after the closing time…", "This bid has already been revealed. A reveal cannot be replaced."
- **Mismatch:** "Your bid does not match. The amount, document or code you revealed does not recompute to the fingerprint sealed at submission. Contact the procuring entity." The reveal is still recorded, so H3 shows the bid as failing.

### Found in task 5 (B2)

- **Navigation:** B2 draws only the public links with Tenders active. Bidders get "My bids" as their first link (like Worklist, Evaluation queue and Audit log for staff), active on B2; nothing else in the app leads to B2.
- **Withdrawn label:** drawn without an icon; it keeps its icon so the state is never shown by colour alone.
- **Row actions (not drawn):** a sealed bid on an open tender has "Withdraw" next to its label; a sealed bid on a closed tender has "Open your bid" (B5). Both are inline text links, so rows keep their 56px height.
- **Withdraw confirmation (not drawn):** the destructive modal (as H5): "Withdraw this bid?", the tender, "The bid leaves the tender and will not be opened. Its record and fingerprint stay in the audit history. You can seal a new bid before the closing time.", "Keep bid" and "Withdraw bid". Done shows "Bid withdrawn"; refusals (closed, not yours, changed) show a wax red line above the table.
- **Opened states:** "Opened, matches" and "Opened, does not match" follow the bidder's own reveal (B5), whether or not the procuring entity has opened the tender yet.
- **Empty:** "You have not submitted any bids. Bids you seal appear here with their fingerprint." with "Browse tenders".

### Found in task 5 (C1)

- **Subtitle:** "You are assigned to evaluate the following active tender procedures." The app has no per-tender committee assignment (every committee member sees every opened tender), so it reads "Opened tenders waiting for the committee's scores."
- **Row padding:** C1 draws rows at 18px padding and the header at 16px, which puts row text 2px right of its header. Rows keep 18px above and below and 16px at the sides (a "relaxed" table density).
- **Which tenders:** opened, not awarded or cancelled. Finished reviews stay, sorted last, until the award.
- **Bids to score:** bids whose reveal recomputes to the sealed fingerprint. A bid that was not revealed, or does not match, cannot be scored.
- **Scored:** every criterion has a score. The action goes to the first bid not fully scored, in order of submission: "Start scoring" (tinted, as drawn) when none is scored, "Continue scoring" otherwise, "Review complete" (pine tag, no link) when all are.
- **No valid bids (not drawn):** "No bids to score" in Ink 70 in the action column.
- **Empty (not drawn):** "No tenders are waiting for evaluation. Tenders appear here once the procuring entity opens their bids." with "Browse tenders".

### Found in task 5 (H1)

- **Title:** drawn 32px bold, as in H2; the page title style (30px semibold) is used.
- **Subtitle:** "Procuring officer dashboard. Review, publish, evaluate, and award outstanding tenders." becomes "<Entity>: tenders to open, score, award or watch as they close."
- **"Officer Portal" button:** replaced by the signed-in name and "Sign out", as in H2.
- **Publish tender (not drawn):** a primary button at the right of the title row, the only way to H2.
- **Whose tenders:** the admin's procuring entity (from their account, else from tenders they published).
- **Waiting for scores:** "4 of 6 scored by evaluation panel" becomes "1 of 5 scored by the committee", counting only bids that can be scored (as C1). "View evaluations" becomes "View tender" (P2), since there is no evaluation summary page for the procuring entity.
- **Ready to award:** "All evaluations completed and validated" becomes "All N bids scored". Nothing in the data validates an evaluation beyond its scores.
- **Empty sections (not drawn):** every section stays, with one Ink 70 line: "No closed tenders are waiting to be opened.", "No opened tenders are waiting for the committee.", "No tenders have all their bids scored yet.", "No tenders close in the next seven days."

### Found in task 5 (H4)

- **Title and navigation:** 32px bold and "Officer Portal", as in H1 and H2; same replacements.
- **Copy:** "Evaluate and record final award for…" becomes "Record the award for…". "Select Winner" and "Justification for Selection" become "Winning bid" and "Justification". "Decisions must comply with public procurement guidelines and will be logged permanently." becomes "The award is recorded permanently and published with the tender."
- **Scores:** C2 scores five criteria out of 20. H4's columns are points out of 100: price is "Price competitiveness" (15), technical is the other four (85), each a score times its weight over 20. Every value is a multiple of 0.25, so two decimals are shown and the columns add up exactly.
- **Rank:** by total, a tie going to the lower price. Only bids whose reveal matches are ranked.
- **Confirmation (brief, not drawn):** "Record this award?" with the winner, amount and its rank if not first; "The award and the tender's Awarded status are permanent. Every bidder and the public can see the award and its justification." Recording lands on P4 with "Award recorded".
- **Validation:** "Give the reason for this award in at least 20 characters." A tender that changed since the page loaded is refused: "This tender changed since you opened the page. Reload it and check before you record the award."
- **Not ready (not drawn):** a sheet in place of the form. "Bids are not opened yet", "Scoring is not finished" (with the count), "No bid can be awarded" or "This tender is cancelled", with "Back to worklist". An awarded tender goes to P4.

### Found in task 5 (P4)

- **Copy:** "Award Record", "Procurement transaction documentation for public auditability.", "Tender Award Details — Road Rehabilitation", title-case labels, "Matches Cryptographic Fingerprint", "Print Document" and "Verify Transaction" become "Award record", "The procuring entity's award decision, as recorded.", the tender's title, sentence-case labels, the shared "Matches" mark, "Print" and "Check this fingerprint" (P5 with the award's fingerprint).
- **Decision body:** "Evaluation Committee, Ministry of Works". The award is written by the procuring entity admin (spec), so it reads "Procuring entity, Ministry of Works".
- **Decision time:** drawn with "EAT"; every other time in the app is shown without a zone suffix and in East Africa Time.
- **Fingerprint:** drawn as 48 characters; the shared chip (first 4 and last 3, full value in the tooltip). It turns wax red when the record does not match.
- **Added (not drawn):** "View case file" (text button) back to P2; "Award recorded" toast after H4. Printing hides the buttons.
- **Route and Awards link:** P4 is `/tenders/<key>/award`; a tender without an award is not found. No frame draws an awards list, so "Awards" in the navigation opens P1 filtered to Awarded.

### Found in task 5 (P5)

- **Intro copy:** "unique cryptographic fingerprint based on the system state", "immutable document identifier" and "upload any signed verification document" describe things the app does not do. Rewritten to say what a fingerprint is (SHA-256 of a record version, kept in AmanaDB's audit trail; documents and sealed bids have them too) and what the check shows.
- **Document check:** the frame's "upload" becomes "Or choose a document to fingerprint it on this computer". The file is hashed in the browser and only its fingerprint is sent (a GET of `/check?fingerprint=`), so no file is uploaded.
- **What it finds:** a version of any tender, bid, reveal, evaluation or award record (latest matching version), a tender notice document, a revealed bid document, or a sealed bid (the B4 receipt fingerprint).
- **Banner:** "Fingerprint matches a valid system state" / "This transaction is authentic…" becomes "Fingerprint matches a recorded version" (or "…a tender document", "…a bid document", "…a sealed bid") and one plain sentence: which record, version and time, and whether it is still the current version.
- **Details sheet:** "Associated Record Meta-Data" becomes "Record details", with "Open case file". "Last Actor" becomes "Recorded by" (the person at that version, as in A1); "Status Log: Verified State" becomes "Current record" with the shared mark (re-hash plus audit trail, as on P2); documents show whether the procuring entity's stored copy still matches.
- **Not found (not drawn):** wax red banner, "No record has this fingerprint", saying a changed document has a different fingerprint.
- **Invalid (not drawn):** "Enter a fingerprint of 64 characters, 0 to 9 and a to f." under the field.
- **Button:** "Verify Fingerprint" becomes "Check fingerprint".

## Copy in the frames that breaks the brief's rules

- All-caps labels: "Your changes", "Latest saved (v4)" (C3); "Live Ledger Notice Preview" (H2).
- Banned or off-brief words: "Publish to Ledger", "Publish a new public procurement notice on the verified registry ledger.", "Notice will generate cryptographic hash upon block publication." (H2). Layer names elsewhere include "Matches Cryptographic Fingerprint", "Verify Transaction", "Integrity Verified" (to check when those screens are built).
- Title case instead of sentence case: "Tender Title", "Reference Number (Auto)", "Procuring Entity", "Budget Ceiling (TZS)", "Closing Date & Time", "Brief Description", "Supporting Documents" (H2); "Tender Title", "Closing Date", "Category: All Procurement" (P1).
- Status shown without an icon: Withdrawn label (B2).
- Found in task 2: "CHANGED FIELDS" in capitals (A1); "Field Changed: Closing Date" and "Record History" in title case (P3); "SUBMIT BID FOR TENDER" in capitals (B3); "Security alert: database mismatch" and "differ in content hash from the original ledger receipt" (A2).

## Decisions for states the design does not show

Agreed after the task 1 review ("insert your own appropriate states"). Later tasks follow these unless the Figma file adds its own.

| Question | Decision |
|---|---|
| Button hover | Colour only, no lift or shadow. Primary and destructive darken 20 percent (`--color-pen-blue-hover`, `--color-wax-red-hover`); secondary fills Paper; text fills Ink 6 percent and turns Ink. |
| Button disabled | One look for every variant: `--color-field-disabled` fill, Rule border, Ink 70 percent text (5.2:1), not-allowed cursor. |
| Button loading | Keeps the variant colours and replaces the label with the present-tense verb (`loadingLabel`, for example "Opening bids"). No spinner: the brief allows motion only for bid opening and the conflict modal. Disabled underneath, so repeat submits are blocked without JavaScript. |
| Field error | Wax red border plus a 13px message with the 16px warning icon, linked by `aria-describedby`. |
| Fingerprint full value | Ink tooltip above the chip on hover and keyboard focus, in Source Code Pro, selectable, Escape dismisses it. No shadow (elevation is for overlays). |
| Fingerprint copied | For 2 seconds the value becomes "Copied" with a Pine check-circle, or "Failed" with a Wax red warning; the chip keeps its width and a live region announces the result. |
| Disabled field contrast | Text raised from Ink 30 percent (1.8:1) to Ink 70 percent (5.2:1). |
| Control border contrast | Inputs, selects and textareas use `--color-control-border` (Ink 55 percent, 3.5:1 on Sheet) instead of Rule (1.6:1). Table rules, chips and secondary buttons keep Rule because their text identifies them. |
| Copy icon contrast | Ink 40 percent (2.4:1) raised to Ink 70 percent (5.5:1). |
| Draft and Opened labels | Draft: neutral (Ink 6 percent fill, Ink 70 percent text) with a dashed circle. Opened: Ink 6 percent fill, Ink text, open lock. Withdrawn gains a minus-circle icon. New icons follow the exported set's weights. |
| Checking | Inline: Ink 70 percent, dashed 16px circle, "Checking". Banner: Ink 6 percent fill, Rule border, Ink text, dashed 18px circle, no action. Static, no animation. |
| Fonts | Source Serif 4, Public Sans and Source Code Pro everywhere. The Inter in B1 and B2 is treated as a drawing error. |
| Line heights | Interface text keeps the frames' "normal" line heights so components match Figma's sizes. Multi-line prose (descriptions, help text) uses the brief's 15/24 via `.text-prose`. |

### Task 2 decisions

| Question | Decision |
|---|---|
| Spine node hover and selection | A selectable node is a link on its title whose hit area covers the whole record; hover underlines the title. The fingerprint chip sits above the link and keeps its copy action. `aria-current="true"` marks the selected node. |
| Spine node not selected | Current: pen blue ring, plain text. Mismatch: wax red ring and wax red title, mismatch-tone chip. |
| Ring markers over the rule | Ring markers sit on a Paper disc so the rule does not show inside the ring. |
| Stepper numbers and completed steps | Numbers inside the circles (12px semibold). Current: white on Pen blue. Completed: Pen blue on the Pen blue tint, label in Ink. Upcoming: Ink 70 percent on Ink 6 percent. Screen readers hear "Step 2: Review" and ", completed". |
| Table row hover | Paper fill, the same fill A1 uses for an expanded row. |
| Expandable row control | A1 shows no control. A 14px chevron button at the row's end (brief icon list), `aria-expanded`, rotated when open. 44px on mobile. |
| Table skeleton | Static Ink 6 percent bars, no shimmer. Caption says "Loading records". |
| Table empty state | One sentence in Ink 70 percent and one action below it, inside the sheet. |
| Table on mobile | Below 600px each row becomes a stacked record: field name (13px Ink 70 percent) beside the value. |
| Pagination | P1's layout. Unavailable Previous or Next uses the shared disabled look. More than seven pages shows first, last and the current page's neighbours with an ellipsis. |
| Inside strokes | Table rules, diff list borders and separators are inset outlines or shadows, so rows keep Figma's heights (48, 39, 40, 36px). |

### Task 3 decisions

| Question | Decision |
|---|---|
| Selecting a spine node | A link to `?event=<id>`; works without JavaScript and each view has its own address. Default: the current event (Bids received when bids exist), otherwise Published. |
| "Check again" | A GET form that reloads the same view; the page is dynamic, so every load re-runs every check. |
| Published record panel (not in the frames) | Title, one sentence, and the notice's fields as B3's ruled label/value list on a sheet, ending with the tender document and the record's fingerprint, each with a verification mark. |
| Bids panel when a bid fails | Every row shows its mark; the failed row's chip turns wax red. No Highlighter row (the brief reserves Highlighter for version changes; A2 is to be settled in task 4). |
| Banner wording when a record fails | "1 of 7 records does not match its recorded fingerprint. Checked …". A failed document uses A2's sentence. No "Check again" on a failed banner (as A2). |
| Current event | The latest event that has happened gets the pen blue ring, unless it failed, in which case no earlier event is marked current. |
| Loading | The neutral checking banner: "Checking the tender record." |
| Not found | "Tender not found", one sentence, and "Go to tenders". |
| Error (service down or not configured) | "The tender record could not be loaded", "The record service did not respond. Try again in a few minutes.", and "Try again". |

### Task 4 decisions (sign-in and H3)

| Question | Decision |
|---|---|
| Sign-in order | Built before H3 (H3's action needs a signed-in procuring entity admin). Users live in AmanaDB with scrypt hashes; the session is an encrypted cookie. |
| Sign-in errors | On the field, in words: "Enter your email address.", "Enter your password.", and one message for a wrong email or password so accounts cannot be probed. A deactivated account says so. |
| Forgot password | No reset flow in the spec: a page saying who resets passwords, and a link back. |
| Wrong role | "This page is not available to your account", one sentence, "Go to tenders". |
| Reveal and opening model | Bidders reveal after the closing time (B5); the server recomputes the commitment and stores the reveal. "Open all bids" publishes all reveals at once and records `openedAt`. |
| H3 before the closing time | Title, "Closes …. Bids can be opened after the closing time.", an amber lock with the time left (Countdown), Sealed rows, no reveal column, no button. |
| H3 closed, not opened | The frame's subtitle plus "6 of 6 bidders have submitted their reveal."; amounts read "Hidden until opening" or "Not revealed"; rows are Sealed. |
| H3 opened | Amounts and marks as drawn; a bid with no reveal reads "Not revealed" and stays Sealed. The only transition: revealed cells fade in over 240ms when just opened (none with reduced motion). |
| Toast | Fixed bottom right, overlay shadow and radius, pine check and the verb: "Bids opened". No slide-in. |
| Countdown | Days and hours ("27 days, 1 hour left"), "Less than 1 hour left", or "Closed"; computed on each load. |
| Reveal mismatch vs tampering | A reveal that does not recompute to its sealed bid is a bid problem: shown on H3 and the bid row, not counted as record tampering on P2. |
| A2 highlighted row | As drawn (user's choice): the tampered bid row keeps the Highlighter. |

### Task 4 decisions (C2 and C3)

| Question | Decision |
|---|---|
| Who edits an evaluation | One shared evaluation per bid (`eval-<bid key>`), created empty (version 1) when a committee member first opens it; every save is an update at the version the person started from. |
| Conflict detection | AmanaDB's version check (HTTP 409) raises C3. The "version you started from" is read from AmanaDB's record history, not from the browser. |
| C3 rows | Only fields either side changed. Left: the reader's values, on Highlighter where they differ from the starting version. Right: the latest values, old value struck through where the other person changed it. |
| C3 buttons | Cancel (back to the form, edits kept; Escape does the same), Copy my changes (plain text to the clipboard, button reads "Copied"), Load latest version (reloads the form with the latest version). No overwrite. |
| Score validation | Whole numbers 1 to 20, or empty for not scored: "Enter a whole number from 1 to 20." on the row. |
| Version banner | "Version N, last saved by Name (date, time)", or "Version 1, not scored yet". |
| Before opening | "Bids can be scored after they are opened", with the closing time. |
| Save confirmation | "Evaluation saved" toast, lifted above the sticky footer. |

### Task 4 decisions (A1)

| Question | Decision |
|---|---|
| Collections | All records, Tenders, Bids (sealed bids and reveals), Evaluations, Awards. The users collection is never listed. |
| Actor | The person from the record's data at that version, with their role: "Joseph Mwangi (Procuring entity)", "Zuri Civil (Bidder)", "Amina Mussa (Committee)"; an evaluation's automatic first version is "System". |
| Action | Plain verbs from the collection and the change: Published, Opened bids, Amended tender, Cancelled tender, Submitted bid, Withdrew bid, Revealed bid, Started evaluation, Saved evaluation, Recorded award, Changed access. |
| Actor filter | By role (Procuring entity, Committee, Bidders, System), since every ledger entry has the same credential. |
| Action filter | Created, Changed, Deleted (the ledger actions). |
| Row expansion | "Changed fields" against the previous version, or "Recorded fields" for a first version, from AmanaDB history; a soft delete says the earlier versions remain; the transaction id below. Internal ids and the reveal's salt are left out. |
| Empty | "No operations match these filters. Clear the filters to see the whole log." with "Clear filters". |
| Export | CSV of the filtered view: time (ISO), actor, action, collection, record, version, full fingerprint, transaction id. Auditors and procuring entity admins only. |
| Access | Auditors and procuring entity admins; others see "This page is not available to your account"; export returns 403. |

### Task 4 decisions (A2)

| Question | Decision |
|---|---|
| What A2 detects | After opening, each revealed bid's document (`storage/documents/<fingerprint>/`) is re-hashed on every load. A copy that no longer matches the fingerprint recorded at reveal fails that bid's row, the "Bids received" node and the page (Tampered, A2's banner). AmanaDB's records are unchanged. |
| Detail panel | The alert takes the place of the "Bids received" heading, as drawn; the table follows with the tampered row on Highlighter, a wax red chip and "Does not match". |
| Tamper demo | `pnpm tamper-demo` (optionally `TAMPER_BIDDER="Zuri Civil"`) appends a line to a revealed bid's stored document and keeps a backup; `pnpm tamper-demo:restore` puts it back byte for byte. |
