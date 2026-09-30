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

## Copy in the frames that breaks the brief's rules

- All-caps labels: "Your changes", "Latest saved (v4)" (C3); "Live Ledger Notice Preview" (H2).
- Banned or off-brief words: "Publish to Ledger", "Publish a new public procurement notice on the verified registry ledger.", "Notice will generate cryptographic hash upon block publication." (H2). Layer names elsewhere include "Matches Cryptographic Fingerprint", "Verify Transaction", "Integrity Verified" (to check when those screens are built).
- Title case instead of sentence case: "Tender Title", "Reference Number (Auto)", "Procuring Entity", "Budget Ceiling (TZS)", "Closing Date & Time", "Brief Description", "Supporting Documents" (H2); "Tender Title", "Closing Date", "Category: All Procurement" (P1).
- Status shown without an icon: Withdrawn label (B2).
