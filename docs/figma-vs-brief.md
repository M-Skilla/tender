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
