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
