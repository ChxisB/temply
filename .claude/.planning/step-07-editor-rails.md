# Step 7: Editor rails

Boards: [board/editor.html](board/editor.html) (both rails open), [board/editor-collapsed.html](board/editor-collapsed.html) (both at 72px).
Starts now, in parallel with 5 and 9a. Depends on step 6 (editor frame), which is done.

## Goal

The framed editor gets a **Components** rail on the left and an **Email settings** rail on the right, each collapsible to a 72px icon strip.

Today the left rail is the old `BlockLibrary` ("Add content") and the right is `SettingsAside` ("Make it yours", an "Email details" card, the theme panel, a "Connect your app" card).

## The board

### Components rail (left, open)

- 264px wide, padding 20 / 16 / 24, `border-right` 1.5px.
- Header row: h2 "Components" 22px / 700, and a 44px round collapse button on the right (`aria-label="Collapse components panel"`, `aria-expanded="true"`).
- Two groups with eyebrows CONTENT and LAYOUT (13px / 700 / 0.08em). Each is a 2-column grid, gap 10.
- Chip: 92px tall, radius 18, 1.5px border, 36px icon tile (radius 12; lavender for content, sky for layout), label 15px / 600 under it.
- Bottom hint, lavender, radius 18: "Click a component to add it below the selected block, or drag it onto the email."

### Email settings rail (right, open)

- 320px wide, padding 20 / 24 / 24, `border-left` 1.5px.
- Header row: the 44px collapse button on the **left** (margin-left -12), then h2 "Email settings" 22px / 700.
- Fields: Subject, From name, To, Reply to, Inbox preview text. Labels 14px / 700. Inputs 48px, radius 14, 1.5px border (the step 2 `Input`). Helper under preview text: "The grey line after the subject in most inboxes."
- Bottom, mint "All clear" card: radius 22, padding 16 / 18, 36px white check circle, "All clear" 16px / 700, "0 errors · 0 warnings" beneath.

### Collapsed (both rails 72px)

- Column, centred, gap 12, padding 20 / 0 / 24.
- 44px expand button, `aria-label` "Expand components panel" / "Expand email settings panel", `aria-expanded="false"`.
- 32 x 1.5 divider, 4px margin.
- 48 x 48 chips, radius 16, 1.5px border, icon only. Left rail labels: "Add text", "Add heading", "Add image", "Add button", "Add columns", "Add divider" (violet icons for content, blue for layout). Right rail: one chip "Email settings: subject, sender and preview text".
- Right rail bottom (`margin-top: auto`): a 48px mint circle, `role="img"`, `aria-label="All clear, 0 errors, 0 warnings"`.
- The canvas simply gets wider. The email inside is not scaled.

## What exists to build on

| Need | Where |
| --- | --- |
| Rail widths | `desktop-layout.tsx` drives the slots from `--rail-left` / `--rail-right`; `railSlot` already has `transition-[width] duration-base ease-out motion-reduce:transition-none`. Collapsing is setting the variable to `4.5rem`, so the width animation is free |
| Block list and insert logic | `block-library.tsx`. `common = ['Text','Heading 1','Heading 2','Button','Image','Logo','Divider','Spacer','Columns','Section','Repeat']`, display names Heading 1 to "Heading", Heading 2 to "Subheading", Repeat to "Repeating list". Reads `DEFAULT_SLASH_COMMANDS[0].commands`. Insert is `insertContentAt` + `block.command` + `revealInsertedBlock` |
| Right rail content | `SettingsAside` in `email-editor-sandbox.tsx` |
| Preflight data | `preflight.issues`, and the existing `preflightExpanded` toggle that opens `PreflightPanel` |
| Disclosure pattern | `TemplateThemePanel` (already a grid-rows disclosure) |

## Work

1. **Extract the insert helper** from `BlockLibrary` into a function both the old library and the new rail call. One implementation of "insert this block below the selection and reveal it".
2. **`ComponentsRail`** (new, framed editor only). Open and collapsed variants. `BlockLibrary` stays as is for the anonymous playground (`!framed`), per the product call that the playground keeps the old style.
   - Default grouping, see [decisions.md](decisions.md#d3-editor-rails): CONTENT = Text, Heading, Subheading, Image, Logo, Button. LAYOUT = Columns, Divider, Spacer, Section, Repeating list. Nothing is removed from the old list, and the collapsed strip carries all eleven.
   - Hint callout: keep the board line, and keep the `@` "Make it personal" tip from the old library inside it. Do **not** claim drag and drop works unless it does; if it does not, the line reads "Click a component to add it below the selected block." Chips use `cursor-pointer`.
3. **`EmailSettingsRail`** reshaped inside `SettingsAside`: the five fields, board styling, helper line. Keep every field `id` (specs and labels use them). Below the fields keep `TemplateThemePanel` and the "Connect your app" card, in that order, as disclosures or cards that fit the 320px rail. The "Make it yours" intro heading is replaced by the board header.
4. **Status card, driven by data.** Counts and tone from `preflight.issues`: success ("All clear", "0 errors · 0 warnings"), warn (warnings only), danger (any error). It is a `button` that toggles the existing `preflightExpanded`, so `PreflightPanel` stays where it is and keeps working (`checks.e2e.ts` pins it). Counts use plural-aware units: "1 error", "2 warnings". The collapsed dot carries the same tone and an `aria-label` built from the same counts.
5. **Collapse behaviour.**
   - A small hook, `useRailCollapse(side)`, owns `collapsed`, the toggle, and persistence.
   - Persist per rail in `localStorage`, try/catch around every read and write, and render correctly without it. Restoring on first paint must not animate (set the variable before the transition class applies, or skip the transition on mount).
   - Crossfade: both variants stay mounted while the width transitions. The one not shown gets `aria-hidden` and `inert`, opacity transitions with `duration-base`, so nothing pops and nothing hidden is focusable.
   - Collapse controls are hidden below `lg`, where the layout stacks and the rails are not columns.
   - The `aria-expanded` button moves between the two variants; focus must land on the equivalent control after a toggle, not on `body`.
6. **Chip insertion while collapsed** works the same as open: click a 48px chip, the block lands below the selection and is revealed.

## States

- Open, collapsed, and mid-transition (no jump, no clipped text).
- Preflight: clear, warnings, errors, and the preflight panel open. Tone never reuses one colour for two jobs.
- Read-only or a viewer who cannot edit: chips disabled with a reason, fields read-only. Match how the old library and aside behave today.
- Narrow: tablet and phone keep the stacked layout. The rail content must not overflow at 768 and 390.
- Dark: the rails are app chrome and follow `.dark`. The canvas does **not** (two theme systems never touch). Check the canvas stays on its own theme when the app is dark.
- Keyboard: tab order is collapse button, chips, then the canvas. Visible focus from the global ring. Escape is not captured.

## Pins this step must meet

| Pin | Where |
| --- | --- |
| Landmark `complementary` named "Email settings" | `template-workspace.e2e.ts:88-89` |
| Landmark "Add content" becomes "Components" (product call 6; update the spec) | `template-workspace.e2e.ts:88-89` |
| The 'Subheading' button | `template-workspace.e2e.ts:88-89` |
| Slash menu group 'Components' | `editor-desktop.e2e.ts:67`, check it is the slash menu and not this rail |
| `PreflightPanel` stays and opens from the card | `checks.e2e.ts` |
| Theme panel behaviour | `design.e2e.ts` |
| Stacked layout at tablet and phone | `editor-tablet.e2e.ts`, `editor-phone.e2e.ts` |
| Playground 'Your email' heading | `marketing.e2e.ts:116` (stays old style) |

Naming clash to watch: the slash menu already has a group called "Components". Role-based locators in the specs must scope to the landmark, not a bare name.

## Tests to add

- Unit: `components-rail.test.tsx` (groups, labels, click inserts, collapsed chips carry `aria-label`s, disabled), `email-settings-rail.test.tsx` (fields, status card tones and counts), `use-rail-collapse.test.ts` (toggle, persistence, storage throwing, first-paint restore).
- e2e, in `template-workspace.e2e.ts` or a new `editor-rails.e2e.ts`: collapse and expand each rail; collapsed width about 72px; canvas gets wider; a chip inserts a block while collapsed; collapsed state survives a reload; status counts match a template with a known warning; `aria-expanded` flips.

## Out of scope

Real drag and drop from the rail. Reordering or hiding components per workspace. Any change to the playground editor. Any change to the canvas rendering or `RendererThemeOptions`.

## Done when

- Gates in the README pass, including `check:editor-contrast` and `check:email-dark` (the canvas must be untouched by this work, and they prove it).
- `bun run e2e -- template-workspace` (and any new spec) green, or reported as edited-but-unrun.
- Browser-verified at 1280 (open, collapsed, mixed), 768 and 390, light and dark.
- Report: files, pins, decisions used, specs run vs unrun.
