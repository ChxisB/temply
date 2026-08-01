# 03 — Verdict

## REDESIGN

**Temply scores 8/30 and fails the load-bearing honesty principle outright, because the product
ships claims its own code contradicts, another project's identity inside its users' emails, and
an interface that reports failure as emptiness — none of which a restyling pass can reach.**

### How the rule was applied

The Phase 3 rule is mechanical: **REDESIGN** if total < 20 **or** any load-bearing principle
(#2 useful, #4 understandable, #6 honest) scores 0. Both triggers fire independently:

- Total = **8/30**, less than half the REFINE threshold of 20.
- **#6 honest = 0**, a load-bearing principle.

There is no reading of the scorecard that lands on REFINE. Three principles scored 0
(#1 innovative, #3 aesthetic, #6 honest); the highest score anywhere is a 2, on #5 unobtrusive.

### Why redesign and not refine

REFINE presupposes that the bones are sound and the defects are surface. Here the defects
originate below the surface, in four decisions that no amount of restyling touches:

1. **The fork was never reconciled.** Temply is `maily.to` with a new name on top. It still
   ships the upstream author's LinkedIn, YouTube and X URLs inside the social footer blocks
   users insert into real mail (`core/blocks/footers.tsx:203-235`), their name as the permanent
   sender in the preview dialog (`components/preview-email-dialog.tsx:88,90`), and their CDN as
   an image host Temply does not control. This is an identity problem, not a styling one.
2. **There is no design system to refine.** `app/globals.css:6-8` declares two colour tokens
   and **neither appears in any of the 25 colours actually rendered**. Spacing runs to 17 steps
   with 7 grid-breaking orphans; type runs to two different scales plus a non-Tailwind 15px.
   Refining an un-codified surface means re-deciding it, which is redesign by another name.
3. **The interface misreports system state.** A failed fetch is coerced into an empty result
   and drawn as the empty state on all four data-backed routes
   (`app/(app)/dashboard/templates/page.tsx:16` and the `useQuery` sites at
   `api-keys/page.tsx:38`, `billing/page.tsx:75`). On billing this renders a paying user as
   free tier. The fix is a data-flow decision, not a visual one.
4. **The headline interaction has no keyboard path.** A product sold as "drag, drop, and
   arrange content blocks" implements that exclusively through mouse events
   (`drag-handle-plugin.ts:338-374,474-518`), and the block menu only materialises on
   `mousemove`. Retrofitting this is an interaction-model change.

### Preserve from the current design

- **The restrained chrome.** #5 scored 2: the dashboard, editor and playground shells recede
  and let content be the figure. Keep that posture.
- **The black / white / emerald core** and the plain typographic base — it is legible and
  unfashionable in the good sense; it is the *undocumented* parts around it that failed.
- **`components/ui/button.tsx:6-31`** — the `cva` variant structure is a sound primitive. It was
  scored against because it is used once, not because it is wrong.
- **`core/editor/components/base-button.tsx:31`** — the editor engine's focus-ring treatment is
  correctly designed. Use it as the template for the shell rather than inventing a new one.
- **Radix dialog usage** at `components/api-key-config-dialog.tsx:82-149` and
  `components/delete-email-dialog.tsx:39-87` — correct focus-trapped modal pattern already in
  the codebase.
- **The empty states themselves** (`dashboard/page.tsx:98-107`, `templates/page.tsx:33-42`,
  `api-keys/page.tsx:125-131`) — present, considered, well-worded. They need a sibling error
  state, not replacement.
- **The Resend send path** — verified working end to end, including for signed-out playground
  users (`01-evidence.md` C11).
- **`app/layout.tsx:52-58`** — the blocking theme-bootstrap script prevents a flash of wrong
  theme. Keep it.

### Discard

- **The un-reconciled fork identity layer.** `core/blocks/footers.tsx:203-235`,
  `components/preview-email-dialog.tsx:88,90`,
  `core/editor/extensions/slash-command/default-slash-commands.tsx:64`,
  `core/editor/utils/variable.ts:33`. Caused #1 = 0 and contributed to #6 = 0.
- **Tailwind-utilities-as-design-system.** 25 ad-hoc colours, 17 spacing steps, two type scales,
  zero tokens in use (`01-evidence.md` B1–B3). Caused #3 = 0.
- **The dual UI kit.** `components/ui/*` against `core/editor/components/*`, with
  `select.tsx` duplicated near line-for-line (`01-evidence.md` A3). Caused #3 = 0, #10 = 1.
- **The orphan `/editor` route** (`app/(marketing)/editor/page.tsx`) — a second editor with no
  inbound link anywhere, duplicating `/playground`. Caused #10 = 1.
- **The swallow-errors-into-empty-state data pattern** (`01-evidence.md` B6).
  Caused #4 = 1 and #8 = 1.
- **`hidden md:block` as the entire mobile navigation strategy**
  (`app/(app)/dashboard/layout.tsx:10`, with zero fallback anywhere). Caused #2 = 1.

---

## Top 5 moves

**1. (#6 honest) Make every user-facing claim match the code, or delete the claim.**
Either emit real dark-mode CSS from the render engine or remove the "Dark Mode Support" feature
card — today `server/src/render/engine.tsx:192-198` declares `color-scheme: light` and
`supported-color-schemes: light` while `app/(marketing)/page.tsx:16-19` sells the opposite.
In the same pass: strip every upstream identity artifact (C2, C3), wire or remove the inert
Downgrade control (`app/(app)/dashboard/billing/page.tsx:212-217`), and render restrictions as
restrictions rather than green checkmarks (`billing/page.tsx:28-35,192-196`).
Evidence: `01-evidence.md` C1, C2, C3, C5, C6.

**2. (#4 understandable) Make the interface tell the truth about system state.**
Give every data-backed route a distinct error state, separate from empty. Today a failed fetch
is silently coerced to an empty result and drawn as "you have nothing" — and on billing, as
"you are on the free plan".
Evidence: `01-evidence.md` B6 — `app/(app)/dashboard/templates/page.tsx:16`,
`app/(app)/dashboard/page.tsx:19,22-23`, `api-keys/page.tsx:38`, `billing/page.tsx:75,97`.

**3. (#3 aesthetic) Establish one token layer and drive every surface from it.**
Colour, type and spacing scales declared once in `app/globals.css` and consumed everywhere —
which also eliminates the invisible-control bug class at its root, since a semantic token
cannot be light-only the way `text-black` at
`components/skeleton/select-native.tsx:13` is. Collapse the two UI kits onto that layer.
Evidence: `01-evidence.md` B1, B2, B3, B5, A2, A3.

**4. (#2 useful) Give the app surface navigation that survives a phone, and one API-key flow.**
Below 768px the sidebar is removed with no replacement and a signed-in user cannot move between
dashboard sections or sign out. Separately, the editor's key dialog and the key-management page
share no link and no state, so a first-time Send fails with only a toast.
Evidence: `01-evidence.md` A7, D5, D6.

**5. (#2 useful / #8 thorough) Give block manipulation a keyboard path and every control a name.**
Drag-and-drop is registered on mouse events only and the block menu appears solely on
`mousemove`, so the product's headline interaction is unreachable without a mouse. The entire
client tree contains one `aria-label`.
Evidence: `01-evidence.md` E1, E2, E3, E4.
