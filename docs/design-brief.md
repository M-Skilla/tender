# Tender Tracker: Figma design brief

For the Figma agent. Behaviour and data live in `tender-tracker-showcase-spec.md`. This document decides how it looks and what each screen is for. Where this brief is specific, follow it exactly. Where it is silent, do not fall back on a generic default; make a choice that fits the subject and note it.

## 1. What this is, and the one idea

A public register of procurement case files. Procuring entities publish tenders, bidders submit sealed bids, bids are opened, a committee scores them, an award is recorded. Anyone can check that the record has not been altered.

**The design idea: every tender is a case file, and the file has a spine.** The tender detail screen is built around a continuous vertical rule with each event hung from it (published, bids received, opened, scored, awarded). Each event carries its version and its fingerprint, and shows whether it still matches the record. This spine is the one memorable element. Everything else stays quiet, flat and document-like so the spine can carry the product.

The audience is public officers, committee members, bidders and auditors in Tanzania. They read documents, compare figures and sign things. They are not looking at a startup dashboard. Design for careful reading on office laptops and mid-range phones.

## 2. Decisions

### Colour

Cool, paper-like, with a pen-blue accent. Not cream, not terracotta, not black-with-a-neon.

| Name | Hex | Use |
|---|---|---|
| Paper | #F6F7F9 | App background |
| Sheet | #FFFFFF | Document surfaces, tables, forms |
| Ink | #22283A | Text (a blue-slate, deliberately not black) |
| Pen blue | #1F3A93 | Primary actions, links, selected state |
| Rule | #C7CCD6 | Dividers, table lines, input borders |
| Highlighter | #F5D547 | One job only: marking what changed since the previous version |
| Pine | #1E6B4B | Verified |
| Wax red | #B8321E | Mismatch, tamper, cancelled, destructive |
| Amber | #9A5B00 | Awaiting action, closing soon |

Secondary text is Ink at 70 percent. Each status colour also has a 10 percent tint for banner backgrounds. Status is never colour alone: always an icon and a word.

### Type

Two families, clearly different roles.

- **Source Serif 4** for page titles, section titles and record headings. It reads as an official document without being a broadsheet cliché. Title 30/38 semibold, Section 22/30 semibold, Record 18/26 semibold.
- **Public Sans** for everything else (it was designed for government services, which is the honest reason to use it). Body 15/24, Table 14/20 with tabular figures on, Small 13/20, Field label 13/18 medium.
- **Source Code Pro**, only for fingerprints (hash strings), 13/20. It is not used for any other label, tag or metadata.

All labels are sentence case. No all-caps labels, no letter-spaced eyebrows above headings. Prose lines stay under 75 characters.

### Shape and surface

- Flat. Documents are white sheets on the paper background, separated by whitespace and rules rather than card boxes. Do not chop content into rows of identical rounded cards.
- Radius has a reason: 0 for tables and record rows (they are ruled documents), 4 for inputs and buttons, 8 for modals and drawers only.
- Elevation exists only on modals, drawers and toasts. One shadow style.
- Structural devices must encode something. Rules separate records. Numbers appear only where the content is a real sequence (the bid stepper, the timeline). No decorative numbering, no gradient washes, no icons in coloured circles.

### Icons

Use few and only where they carry status or action: check (verified), alert triangle (mismatch), lock (sealed), copy, filter, download, chevron. 1.5 px stroke, 18 px. No decorative icon rows.

### Layout

Left-aligned throughout. Content column max 720 for reading; tables can span the 1200 content width. 12-column grid, 80 px margins, 24 px gutters on desktop. Mobile 4 columns, 16 px margins.

## 3. Things not to do

- Do not build a dashboard of big-number summary cards. The officer dashboard is a worklist (see H1).
- Do not put a hero with a headline, tagline and gradient on the public home. The home is the list of tenders, because that is what people came for.
- Do not add marketing copy, feature blurbs or taglines anywhere.
- Do not join metadata with middle dots or append arrows to links and buttons. Use labelled fields.
- Do not use stock illustrations, blockchain imagery (chains, blocks, coins, nodes) or a shield-with-a-check logo.
- Do not use the same component treatment for everything. A table is a table, a record is a record, a form is a form.
- Do not add entrance animations, hover lifts or shimmer effects.

## 4. The signature component: the spine

Vertical line, 2 px Rule, running the height of the tender detail page. Each event is a node on it.

Node anatomy (left to right): marker on the spine, event name (Record 18), date and time, actor role, version (`v2`), fingerprint chip, and a small verification mark.

- Marker: filled circle for completed events, hollow for upcoming, a lock-marked circle for events still sealed (bids before opening).
- Verification mark: Pine check with the word "Matches" when the recomputed fingerprint equals the stored one. Wax red triangle with "Does not match" when not. Placed on the node, not floating in a corner.
- A changed value between versions is set on a Highlighter background in the record view.
- Selecting a node shows its record on the right (see wireframe). On mobile the spine moves to the left edge of a single column and the record opens as a full-screen sheet.

## 5. Wireframes (desktop, 1440 wide)

**Tender detail**

```
Tender Tracker    Tenders   Awards   Check a record                         Sign in
─────────────────────────────────────────────────────────────────────────────────
Road rehabilitation, Dodoma to Mtera section                    [Published]

Reference      Entity            Budget ceiling        Closes
TND-2026-0142  Ministry of Works TZS 2,450,000,000     28 Oct 2026, 14:00

▌ All 14 records match. Checked 30 Sep 2026, 14:02.                 [Check again]
─────────────────────────────────────────────────────────────────────────────────
 │                                     Selected: Bids received
 ●  Published                          ┌─────────────────────────────────────
 │  30 Sep 2026, 09:12                 │ 6 sealed bids. Amounts are hidden
 │  Procuring entity   v1  a3f9…c21 ✓  │ until the closing time.
 │                                     │
 ●  Bids received                      │ Bidder            Received     Fingerprint
 │  6 sealed                           │ Kilimo Works Ltd  02 Oct, 11:40  7be1…90d
 │  Bidders         v6  7be1…90d ✓     │ ...
 │                                     └─────────────────────────────────────
 ◌  Opened (28 Oct)
 │
 ○  Scored
 ○  Awarded
```

**Version conflict (modal, 960 wide)**

```
Someone saved this evaluation before you                                    [x]
Amina M. saved version 4 at 15:31. You started from version 3.

  Your changes                          Latest saved (v4)
  Price score      38   [highlight]     Price score      35
  Technical score  41                   Technical score  41   [highlight on 41→44]
  Comment          "Meets spec"         Comment          "Meets spec, delivery risk"

  [Load latest version]   [Copy my changes]                               [Cancel]
```
No option to overwrite. Buttons are ordered by safety.

**Bid opening**

```
Open bids for TND-2026-0142
Closed 28 Oct 2026, 14:00. Opening is allowed.

Bidder            Fingerprint at submission   Revealed amount        Result
Kilimo Works Ltd  7be1…90d                    TZS 2,310,000,000      ✓ Matches
Mtera Builders    c410…2af                    TZS 2,260,500,000      ✓ Matches
Zuri Civil        91dd…e07                    TZS 1,980,000,000      ▲ Does not match

                                                                  [Open all bids]
```
Before the closing time this screen shows the lock, the remaining time and no reveal column at all.

## 6. Screens

Desktop for all. **M** marks screens that also need a 390 x 844 version.

Public
- **P1 Tender list (M).** Search, a filter row (status, category, entity, closing soon), then a ruled table: title, entity, budget ceiling, closes, status. Empty, loading and no-results states.
- **P2 Tender detail with spine (M).** As in section 5.
- **P3 Record history drawer.** Right drawer, version list, each version shows its changed fields on Highlighter.
- **P4 Award record.** Winning bid, amount, justification, decided by, time, verification mark.
- **P5 Check a record.** A plain page where someone pastes a fingerprint or reference and sees whether it matches. Two paragraphs of explanation at most, no diagram of chains.

Bidder
- **B1 Sign in (M).** One form on a plain page.
- **B2 My bids (M).** Ruled table: tender, submitted, fingerprint, state (Sealed, Opened and matches, Opened and does not match, Withdrawn).
- **B3 Submit bid (M).** Stepper with three steps (a real sequence): Bid details, Review, Seal and submit. The review step states exactly what will be stored: "Only a fingerprint of your bid is stored until the closing time."
- **B4 Receipt (M).** Bid reference, fingerprint with copy, time. A plain instruction: "Keep this receipt. You need it to open your bid."
- **B5 Open your bid (M).** Load receipt, confirm, result.

Procuring entity
- **H1 Worklist.** Not cards. Grouped lists under plain headings: "Ready to open", "Waiting for scores", "Ready to award", "Closing this week", each row with tender, deadline and the one action available.
- **H2 Create tender.** Form left, a read-only preview of the published notice right. Publishing confirmation says the published record is permanent and can be amended but not erased.
- **H3 Bid opening.** As in section 5, including the locked state.
- **H4 Award decision.** Scores ranked in a table, a winner selector, justification field, confirmation.
- **H5 Cancel tender.** Destructive modal. States that the tender and its history remain visible with status Cancelled.

Committee
- **C1 Evaluation queue.** Rows with progress as text ("3 of 6 bids scored"), no ring charts.
- **C2 Evaluation form.** Bid summary left, criteria scores right with weights and a running total, version shown in the header ("Version 3, last saved by Amina M."), Save in a sticky footer.
- **C3 Version conflict.** As in section 5.

Oversight
- **A1 Audit log.** Collection selector as a segmented control, filters (date range, actor, action), ruled table: time, actor, action, record, version, fingerprint. Row expansion shows the changed fields on Highlighter. Export button.
- **A2 Tamper case.** P2 with a failed verification: wax red banner, the affected node marked, and one sentence: "The stored copy of this document no longer matches its recorded fingerprint. The recorded version is unchanged."

## 7. Components to build

Only what the screens need, each with real states.

- **Button:** primary (pen blue), secondary (outlined), text, destructive (wax red). States default, hover, focus, disabled, loading.
- **Field:** input, select, textarea, file drop. States default, focus, error with specific message, disabled.
- **Status label:** rectangular, 4 radius, tinted background, word plus icon. Set: Draft, Published, Closed, Awarded, Cancelled, Sealed, Opened, Withdrawn.
- **Fingerprint chip:** first 4 and last 3 characters in Source Code Pro with an ellipsis, copy action, copied state, full value on hover and focus.
- **Version mark:** plain text `v3`, with a "latest" variant in pen blue.
- **Verification mark:** Matches (pine), Does not match (wax red), Checking. Also a banner size.
- **Spine node:** completed, sealed, current, upcoming, mismatch.
- **Ruled table:** header, row, hover, selected (a pen-blue left edge, not a fill), expandable row, empty, skeleton, pagination.
- **Diff line:** unchanged, changed (Highlighter on the new value, old value struck through in secondary text).
- **Stepper:** three steps, numbered because it is a sequence.
- **Modal, drawer, toast:** standard and destructive variants.
- **Countdown:** days and hours, plus a Closed state.
- **Empty state:** one sentence and one action. No illustration.

## 8. Copy rules

- Sentence case everywhere. Plain verbs. A control names what it does: "Publish tender", "Seal and submit", "Open all bids", "Load latest version". The toast repeats the same verb: "Tender published", "Bids opened".
- Say "fingerprint" in the interface. Say "hash" only inside the Check a record page's help text, once. Do not use "blockchain", "on-chain", "immutable" or "decentralised" in any interface copy.
- Errors say what happened and what to do, and do not apologise. Example: "Your bid could not be sealed because the tender closed at 14:00. Contact the procuring entity."
- Empty states are prompts: "No bids yet. Bids appear here once bidders submit them."
- Content is realistic Tanzanian public-sector data. Entities such as Ministry of Works, Dodoma City Council, Muhimbili National Hospital. Amounts in TZS with thousands separators. Dates like 28 Oct 2026, 24-hour times. Tenders such as road rehabilitation, school desks, laboratory equipment, ICT hardware, borehole drilling. Fictional bidder names. Do not use lorem ipsum.

## 9. Motion (prototype)

Almost none. Two transitions only, both in answer to the user's action:
1. Bid opening: sealed rows change to revealed rows and the verification mark appears per row.
2. Conflict modal: opens with the two columns already aligned; no slide-in flourish.

Everything else is an instant state change.

## 10. Accessibility

Text at least 4.5:1 on its background. Focus ring is 2 px pen blue with 2 px offset on every interactive element. Tap targets at least 44 px on mobile. Tables become stacked records on mobile, with the field names kept. Verification and status always use icon and word.

## 11. Order of work, and a check before you finish

1. Variables, text styles, then the spine node, ruled table, fingerprint chip and verification mark.
2. P2, H3, C3, A1, A2. These carry the demo.
3. Remaining desktop screens, then mobile, then prototype connections for: publish a tender, submit a bid, open and score, verify a record.

Before finishing, look at the file and remove anything that reads as a default: an unexplained icon, a card that could be a ruled row, a label in capitals, a decorative colour, a sentence that sells instead of explains. If the spine is not the most distinctive thing on P2, simplify what surrounds it.
