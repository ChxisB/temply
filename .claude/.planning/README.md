# Redesign: remaining work

Source of truth for the design is `.claude/Temply redesign.html` (a packed bundle).
The four pages these steps need are unpacked, markup only, in `board/`:
`app-home.html`, `editor.html`, `editor-collapsed.html`, `marketing-home.html`.
Read those, not the bundle. Measurements in the step files are copied from them.

Last reconciled with the tree: 2026-10-07. 110 changed files, 4 deleted, 66 new, none committed. The close-out is `.claude/completions/2026-10-07-redesign.md`.

## Where things stand

| Step | What | State |
| --- | --- | --- |
| 1 | Tokens: neutrals, colours, type steps, 3px focus ring | Done, gates green |
| 2 | Primitives: Button, Input, Card, Badge, segmented control | Done, gates green |
| 3 | App shell: 248px sidebar, 44px nav rows, trial card | Done, gates green |
| 4 | Templates list: pills, thumbnails, menu, search | Done, gates green |
| 6 | Editor frame: header, tab row, canvas card | Done, gates green; signed-in e2e never seen passing |
| 8, 9a | Marketing header, footer, hero, workflow | Done; public specs seen passing: [step-08-09a](step-08-09a-marketing-verify.md) |
| 5 | Dashboard home | Built, reviewed, fixes applied. Unit gates green; e2e unrun and no browser check (no Clerk or Postgres here): [step-05](step-05-dashboard-home.md#outcome-2026-10-06) |
| 7 | Editor rails (Components, Email settings, 72px collapse) | Done, gates green; `editor-rails` spec never seen passing: [step-07](step-07-editor-rails.md) |
| 9b | Pricing band, "Ready when you are" band | Done; `marketing` spec seen passing: [step-09b](step-09b-pricing-and-closing-cta.md) |
| 10 | Sweep, review, completion doc, memory rewrite | Done 2026-10-07: [completion doc](../completions/2026-10-07-redesign.md) |

Open product calls, with a default for each so nothing blocks: [decisions.md](decisions.md).

## Order

```
Wave A (parallel, disjoint files)     Wave B           Wave C
  step 5   dashboard home               step 9b    ->    step 10
  step 7   editor rails                 (after 9a)
  step 9a  marketing verify  ---------->
```

- 5, 7 and 9a touch different files and can run at once.
- 9b waits for 9a. Both edit `client/app/(marketing)/home-client.tsx`; two agents in it at once is how edits get lost.
- 10 runs last, on a tree where every step has reported.
- **Tokens.** `client/app/globals.css` is the one file all steps could touch. None of 5, 7, 9a, 9b should need a new token (the pastel washes and pill tones already exist). If one does, the agent stops and says which, and the edit is made once, alone, before anything else resumes, then `check:contrast` runs.

## Rules every step inherits (from the repo's CLAUDE.md)

- Bun only. Never npm or yarn.
- Colours live in the token layer. No hex in a component; `marketing-colour.test.ts` and the contrast gates exist because that shipped broken three times.
- Two theme systems never touch: app UI (`.dark`, `--ds-*`) and the editor canvas (`RendererThemeOptions`, `--mly-*`). The email inside the canvas is painted from the template and ignores app dark mode.
- Nothing pops. Anything that appears, disappears or resizes transitions, with `motion-reduce:transition-none`. Timing from the `duration-*` and `ease-*` tokens, never a number or a `cubic-bezier` in a class list (`check:motion` fails on it).
- Every state is designed: loading, empty, error (distinct from empty, `ErrorState`), disabled, narrow viewport.
- Reuse `Card`, `Badge`, `EmptyState`, `ErrorState`, `PageHeader`, `ConfirmDialog` before inventing.
- `aria-expanded` on disclosures, `aria-label` on icon-only buttons, `aria-hidden` on collapsed content.
- Copy: plain verbs, sentence case, the same word for an action from button to toast, counts and units over sentences.
- Where the board conflicts with something an e2e spec pins, the pin wins and the spec is not weakened. Each step file lists the pins it meets.
- A change a customer sees ships with its case in `e2e/specs`. Edit the spec in the same step.
- Commit prefixes are conventional. Push is the user's call: never ask, never run it.

## Gates (a step is not done until all pass)

From the repo root: `bun run typecheck`, `bun run lint`, `bun test`.
From `client/`: `bun run check:contrast`, `check:editor-contrast`, `check:email-dark`, `check:motion`.
Then the step's own spec: `bun run e2e -- <spec>`.

## What cannot run here

- `bun run e2e` for every signed-in spec fails at setup: `e2e/.env` and `client/.env` have empty Clerk keys, and there is no local Postgres. CI has the `E2E_CLERK_*` secrets.
- Public specs (marketing, seo, the signed-out parts of header and design) do run locally through a signed-out Playwright config. The earlier session built one; its runs are in `verify-s89/` under that session's scratchpad (`4f71814e-…`). Recreate it if the scratchpad is gone.
- So each step ends with two lists, stated plainly: specs seen passing, and specs edited but unrun. Never "should pass". The running tally is in [step-10](step-10-sweep-and-close.md#specs-edited-but-never-seen-to-pass).

## Who does what

Use the project agents in `.claude/agents/`.

| Role | Agent | Brief |
| --- | --- | --- |
| Build a step | `implementer` | The step file, this README's rules, the board page. Runs the gates, does not commit. |
| Review a step's diff | `code-reviewer` | The step's file list. Bugs first, then repo consistency. Reports, never edits. |
| Check where a customer meets it | `browser-verifier` | Runs the step's spec; drives Chrome at 1280 and 390 wide, light and dark, for states no spec reaches. |

The main session decides, commits and summarises. Order per step: implementer, code-reviewer, fixes, browser-verifier.
