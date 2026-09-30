# Kickoff prompt 1: tokens and primitives

Read `CLAUDE.md`, `docs/design-brief.md` and `docs/screen-map.md` first. This task is only the design foundation. Do not build any screens yet.

Figma file: https://www.figma.com/design/fDxmmTV6IGXNi3Dnk4M0pM/Untitled?node-id=0-1&p=f&t=yoflVJWb91O5WAEc-0

**Part A: tokens and fonts**

1. Use the Figma MCP tools to read the file's variables (colour, spacing, radius, type).
2. Create `src/styles/tokens.css` with CSS custom properties named after the Figma variables. Include text styles as classes or custom properties (family, size, line height, weight).
3. Set up the three fonts: Source Serif 4, Public Sans, Source Code Pro, using `next/font` (self-hosted at build time) and exposing them as CSS variables used by the tokens. If a font is unavailable, stop and tell me instead of substituting.
4. Compare the tokens file with the palette and type scale in `docs/design-brief.md`. List any mismatch between Figma and the brief. Do not fix mismatches yourself.

**Part B: primitives**

Build these components in `src/components/`, each matching its Figma component and variants:

1. Button (primary, secondary, text, destructive; default, hover, focus, disabled, loading)
2. Field (input, select, textarea; default, focus, error, disabled)
3. StatusLabel (all statuses in the design)
4. FingerprintChip (truncated value, copy action, copied state, full value on hover and focus)
5. VerificationMark (matches, does not match, checking; inline and banner sizes)

For each component, fetch its Figma component first, then build it. Use tokens only.

**Part C: a review page**

Create a development-only page at `/dev/components` (`src/app/dev/components/page.tsx`, unavailable in production builds) that shows every component in every variant and state on the Paper background, so I can compare against Figma side by side.

**Verify before you report back**

1. Render `/dev/components` in a browser and take screenshots.
2. Take the matching Figma screenshots.
3. List every difference in spacing, type, colour and alignment, or say there are none.
4. List any state or behaviour the design does not show, as questions.

Stop after this task. Do not start on the spine node, tables or any screen. I will review and then give you the next task.

---

## Later kickoff prompts (same pattern)

Each one should name a single frame, then follow the same verify step.

- **Task 2:** SpineNode and RuledTable components, plus DiffLine and Stepper.
- **Task 3:** Screen P2 (tender detail with spine). Give it the frame link from the screen map.
- **Task 4:** H3 (bid opening), C3 (version conflict), A1 (audit log), A2 (tamper case), one per prompt.
- **Task 5:** Remaining desktop screens, then mobile frames.

Template for any screen task:

> Read `CLAUDE.md` first. Build screen `<ID and name>` from this Figma frame: `<frame link>`. Fetch the frame's design context and screenshot before writing code. Reuse existing components. Wire data through `src/services/amanadb.ts` as described in `docs/spec.md`. When finished, render at every width the design exists for, compare with the Figma screenshot, list every remaining difference, and list any state or behaviour the design does not cover as questions. Do not add anything the design does not show.
