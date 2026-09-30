# Tender Tracker

A public-procurement tracker built on AmanaDB, used as a showcase for the database. Read these before any task:

- `docs/spec.md`: behaviour, data model, flows, acceptance criteria
- `docs/design-brief.md`: visual rules, screens, components, copy rules
- `docs/screen-map.md`: each screen name with its Figma frame link

The spec decides what the app does. The brief and the Figma file decide how it looks. If they conflict, stop and ask; do not pick one silently.

## Working rules

1. **One task at a time.** Work on the screen or component named in the task. Do not build ahead.
2. **Read the design before writing UI.** For every screen or component, fetch the Figma frame with the Figma MCP tools (design context, variables, screenshot) before writing code. Do not work from memory of the brief alone.
3. **Tokens only.** All colours, font families, font sizes, spacing, radii and shadows come from `src/styles/tokens.css`. Never write a hard-coded hex value, pixel spacing or font name in a component. If a needed token is missing, add it to the tokens file with the Figma variable name and say so.
4. **Reuse before creating.** Check `src/components/` first. Build a new component only if none fits, and match the Figma component's name and variants.
5. **No new design decisions.** If the design does not show something (a state, a breakpoint, a message), do not improvise. List it as a question at the end of the task.
6. **Copy comes from the design.** Use the exact text in the Figma frame. Follow the brief's copy rules: sentence case, plain verbs, no "blockchain", "on-chain" or "immutable" in interface text.
7. **Data access goes through `src/services/amanadb.ts` only.** No component or route imports the AmanaDB SDK directly.

## Design rules that are easy to break

Do not add any of the following, even if they look nicer to you:

- Rounded cards, drop shadows or gradients where the design shows ruled rows and flat sheets
- All-caps or letter-spaced labels
- Icons that are not in the design
- Entrance animations, hover lifts or shimmer effects
- Middle-dot separators or trailing arrows on links and buttons
- Illustrations, hero sections, taglines or marketing copy

Radius values are 0 (tables, records), 4 (inputs, buttons), 8 (modals, drawers). Use them by role, not by preference.

## Definition of done for a UI task

A screen is not finished until all of these hold:

1. It matches the Figma frame at the widths the frame exists for (1440 desktop; 390 mobile where a mobile frame exists).
2. It has every state the design shows: default, hover, focus, disabled, loading, empty, error.
3. You rendered it in a browser, took screenshots at those widths, and compared them with the Figma screenshot.
4. You listed every remaining difference (spacing, type, colour, alignment) with a reason, or said there are none.
5. Keyboard focus is visible, text contrast is at least 4.5:1, and status is shown with an icon and a word, never colour alone.

Do not say a screen is done without steps 3 and 4.

## Conventions

- Stack: Next.js (App Router), TypeScript, `@amanadb/sdk`. AmanaDB is the only database, including users and roles. Do not add SQLite, an ORM or any other data store.
- The SDK and project credential are server-only. Import them only in `src/services/amanadb.ts` (which starts with `import "server-only"`). Never import them in a client component, and never use a `NEXT_PUBLIC_` variable for secrets.
- Pages that show verification, bid or evaluation state must not be cached (`dynamic = "force-dynamic"` or `no-store`).
- Use Server Components by default; add `"use client"` only where interaction needs it.
- Components live in `src/components/`, named to match Figma (`StatusLabel`, `FingerprintChip`, `VerificationMark`, `SpineNode`, `RuledTable`).
- Log anything AmanaDB could not do cleanly in `GAPS.md` and do not work around it in app code.
- Keep changes small and reviewable. Commit after each component or screen.
