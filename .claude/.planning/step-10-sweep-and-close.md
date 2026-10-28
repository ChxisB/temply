# Step 10: Sweep, review, close

Runs **last**, on a tree where steps 5, 7, 9a and 9b have all reported. Nothing in this step starts until they have.

Order inside the step: A gates, B sweep, C review, D fixes, E browser verification, F close-out (docs, memory, dead code, commit plan).

## A. Gates on the whole tree

From the root: `bun run typecheck`, `bun run lint`, `bun test`.
From `client/`: `check:contrast`, `check:editor-contrast`, `check:email-dark`, `check:motion`.
Then `bun run e2e` for everything that can run locally (see below).

State the results as counts, not "green": test totals before and after (the last known are root 1282 and client 746), and any gate that did not run with the reason.

## B. Sweep the surfaces nobody has restyled

Steps 1 to 9 gave the tokens, primitives, shell, templates list, editor frame, dashboard, rails and marketing. Anything built from those primitives has already moved. This sweep finds what **has not**: surfaces with hand-rolled controls, hard-coded sizes, or old radii.

Surfaces, each at 1280 and 390, light and dark:

| Area | Notes |
| --- | --- |
| Brands, Assets | Lists, upload states, empty and error |
| Connect your app (template tab and standalone) | Code blocks stay on the `rail-*` code-window tokens |
| Settings, Plan, billing | In-app pricing must agree with the marketing band (same constants) |
| Team, API keys, Admin | Tables on narrow screens; destructive actions use `ConfirmDialog` |
| Template workspace tabs | Variables, Versions, Review & release (step 6 did the tab row, not the bodies) |
| Dialogs, popovers, toasts | Radius, shadow rung, motion tokens |
| Auth pages | Clerk components carry the app theme |
| Docs, Privacy, Terms | Long-form type ramp, link and focus styles |
| Anonymous playground | **Stays old style** (product call 4). Check only that it still looks coherent on the new tokens: no broken colour, no missing font |

Rules for fixes in the sweep:

- Token or primitive fixes only. A fix that edits one component's colour is wrong; the repo shipped broken contrast three times that way.
- A surface that needs a **redesign** (new layout, new pattern) is not fixed here. It goes on a backlog list in the completion doc with a one-line description.
- Every fix that a customer sees gets its case in `e2e/specs`.

## C. Layered review of the whole redesign diff

About 91 changed entries are uncommitted. A single review of that is not review. Use `code-reviewer` in layers, each with its own file list, each reporting before the next starts:

1. Tokens and primitives: `client/app/globals.css`, `client/components/ui/*`, `shared/` contrast maths.
2. Shell and templates list: sidebar, mobile nav, user menu, template list, row, thumbnails, actions.
3. Dashboard home (step 5).
4. Editor frame and rails (steps 6 and 7).
5. Marketing (steps 8, 9a, 9b).
6. Specs and unit tests: assertions not weakened, locators scoped, no `waitForTimeout` that hides a race (three of the recent fix commits were exactly that).

The repo has no `redesign-diff.sh`. Build each layer's list from `git status --short` and review with `git diff HEAD -- <paths>`; for untracked files read them in full. The reviewer reports and does not edit.

Reviewer brief for every layer: bugs first, then repo-rule breaks (hex in a component, a number or `cubic-bezier` in a class list, a snapping show/hide, an icon-only button without a label, a destructive action without `ConfirmDialog`, empty state used for an error), then simplification.

## D. Fix what review found

`implementer` fixes, one layer at a time. Re-run gates after each. Anything the reviewer calls a product decision comes back to the main session, not guessed.

## E. Browser verification

`browser-verifier` for each changed spec (below), then by hand for states no spec reaches.

**Clerk workspace switcher geometry.** Done in code, never seen in a browser. Check: 44px rows, 14px radius, 1.5px border, 12.5px inset, 12px avatar gap, in light and dark, open and closed, with one and with several workspaces. This needs a signed-in session, which cannot exist locally (empty Clerk keys, no Postgres). Two ways out, user's pick:

- The user opens it in their own browser and reports.
- CI's signed-in run covers `shell.e2e.ts`, and a screenshot step is added to it.

Do not mark this done on the strength of a unit test.

## Specs edited but never seen to pass

Signed-in specs cannot run here (no Clerk keys, no Postgres), so each of these has been edited without being observed passing. Update this table as steps report; at the end of step 10 it goes into the completion doc and into the user's hands.

| Spec | Edited in | Runs locally | Seen passing |
| --- | --- | --- | --- |
| `design.e2e.ts` | steps 1 to 9 | Public parts only | No |
| `editor-desktop.e2e.ts` | step 6 | No | No |
| `header.e2e.ts` | step 8 | Signed-out half | No |
| `shell.e2e.ts` | step 3 | No | No |
| `signoff.e2e.ts` | staged pipeline, step 4 | No | No |
| `template-workspace.e2e.ts` | step 6; step 7 adds the "Components" rename | No | No |
| `templates.e2e.ts` | step 4 | No | No |
| `redesign-primitives.e2e.ts` (new) | step 2 | Check: may be public | No |
| `dashboard-home.e2e.ts` | step 5: section order is now header, starters, recent, usage; Enterprise expects `no limit` three times (Storage adds one); new cases for a starter chip creating a template and for a sign-off banner seeded through `/stage` then `/request-signoff` | No | No |
| `marketing.e2e.ts` | steps 9a, 9b (adds) | Yes, signed-out | Added by 9a and 9b |
| `editor-rails` or `template-workspace` additions | step 7 (adds) | No | Added by step 7 |

Rows marked "added" are filled in from each step's report. Specs that **can** run locally (`marketing`, `seo`, the signed-out parts of `header` and `design`, and `redesign-primitives` if it is public) must be run and recorded as seen passing here, not left in the unrun column.

The best resolution is the user pushing to CI and reading its signed-in run. That is the user's call; this step never pushes and never asks to.

## F. Close-out

1. **Dead code.** `GetStarted` (`client/components/dashboard/get-started.tsx`) is imported only by `client/app/(app)/dashboard/page.tsx` and has no spec pins; step 5 removes the import and the file. Confirm it is gone. Then look for anything else the redesign orphaned (old status helpers, `showcase-row.tsx` is already deleted, old nav items, unused tokens). Delete, do not comment out.
2. **Completion doc**: `.claude/completions/2026-10-xx-redesign.md` (use the real date). Follows the shape of `2026-10-03-redesign-handoff.md` and `2026-10-05-staged-release-pipeline-handoff.md`: what changed by step, the decisions taken (with [decisions.md](decisions.md) links), gate results, the unrun tally above, the backlog from the sweep, what the user must do next. Short, facts first.
3. **Memory rewrite** (main session, not an agent): `redesign-2026-10.md` is stale and contradicts itself.
   - It says "single accent #0B5FFF". The redesign is violet (#5B45E0 on the board; tokens are the source).
   - It says "delete gets client-side Undo" in one paragraph and "NO Undo on template delete" in another. The product call is **no Undo**.
   - Its step numbering (planner's 10) is not the pasted numbering (3 for shell, 4 for templates, 6 for the editor frame, 5 and 7 remaining). Use the pasted numbering.
   - "Local limits" lists failures that may no longer exist: five `stripe.test.ts` failures and a `stripe-setup.ts` typecheck failure. Last status shows typecheck and root tests green. Re-run and keep only what is still true.
   - It lists SEO leftovers (robots `Disallow: /api/`, `SITE_NOINDEX`, home as a server page, shared footer, JSON-LD, OG image, brand PNGs). Check each against the tree and keep only what is open.
   - It says the canvas font is an open decision held by a `test.fixme` in `design.e2e.ts`. There is no `fixme` there now; confirm and drop or update.
   - Replace the long progress log with the current state and link [[staged-pipeline]] and [[deployment-target]].
4. **`.claude/Temply redesign.html`** (2.4 MB, untracked): see [decisions.md](decisions.md#d6-the-design-bundle).
5. **Commit plan**: see [decisions.md](decisions.md#d5-commit-strategy). Commits use conventional prefixes. Push is the user's: never run it, never ask.

## Done when

- All gates pass with stated counts.
- Sweep surfaces checked and fixed, with a backlog for the rest.
- Every review layer reported and its findings resolved or listed.
- The unrun tally is accurate and handed to the user.
- Completion doc written, dead code gone, memory rewritten, the bundle's fate decided.
- Final report says plainly: what was seen working, what was only edited, and what only CI or the user can confirm.

## Outcome (2026-10-07)

Ran A to F. The tally above is superseded by the one in [the completion doc](../completions/2026-10-07-redesign.md#specs-edited-but-never-seen-to-pass): `marketing`, `redesign-primitives` and the signed-out halves of `header`, `design` and `seo` were run and seen passing through the signed-out config (206 passed, 14 Clerk-key failures); every signed-in spec is still unrun. The workspace switcher check in E is handed to the user. The design bundle is excluded locally per D6; the commit plan is in the completion doc and nothing was committed.
