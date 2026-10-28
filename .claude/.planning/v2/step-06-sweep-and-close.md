# Step 6: Sweep, outside-the-repo list, close-out

Runs **last**, on a tree where steps 2 to 5 have reported. Order: A gates, B sweep, C review, D fixes, E browser, F close-out.

## A. Gates on the whole tree

Root: `bun run typecheck`, `bun run lint`, `bun test`. `client/`: `check:contrast`, `check:editor-contrast`, `check:email-dark`, `check:motion`. Then every spec that can run locally. Report counts against the 2026-10-07 baseline (1573 pass, 0 fail, 146 files; lint 685 files) and any gate that did not run, with the reason.

## B. Sweep for what the steps missed

Greps, each run outside `node_modules` and `.next*`; every hit is fixed, deleted, or listed with a reason:

| Looking for | Grep |
| --- | --- |
| The old three-bar geometry | `rx="3.5"`, `viewBox="6 7 36 36.5"` |
| The satori mark and its constant | `MARK_COLOUR`, `app/mark`, `icon-192`, `icon-512` |
| Frozen files still referenced by new work | `brand/mark.png`, `brand/logo.png` (only the frozen-by-design references may remain) |
| Wordmark typed as text | `>Temply<` next to `font-display` |
| The old social image | `temply-email-editor.png` (only the two redirects may remain) |
| Brand colour used as a UI colour | `--brand-` outside `brand-mark.tsx` and the guard's allow-list |
| Hex in components | the existing `marketing-colour.test.ts` and `brand-tokens.test.ts` do this; read their output |

Also look, at 1280 and 390, light and dark, for any place a hand-drawn mark appears in marketing artwork (`client/components/marketing/hero-showreel.tsx`, `showcase-visuals.tsx`, the docs figures): a picture of the product showing the old mark is wrong now. Pictures are fixed through the same `BrandMark`, not a copy of the path.

Rules for fixes: token or shared-component fixes only. A surface that needs a redesign goes on the backlog in the completion doc with a one-line description.

## C. Layered review

Use `code-reviewer`, one layer at a time, each reporting before the next: (1) tokens, `BrandMark`, guards; (2) icons, manifest, error page; (3) lockup in the app; (4) social card and SEO; (5) email logo; (6) specs and unit tests: assertions replaced rather than loosened, locators scoped, no `waitForTimeout` hiding a race. Build each list from `git status --short` and review with `git diff HEAD -- <paths>`; read new files in full. Brief for every layer: bugs first, then repo-rule breaks (a hex in a component, a number or `cubic-bezier` in a class list, an icon-only button without a label), then simplification, plus the brand rules in the [README](README.md#rules-every-step-inherits).

## D. Fixes

`implementer`, one layer at a time, gates re-run after each. Anything the reviewer calls a product decision comes back to the main session.

## E. Browser verification

`browser-verifier` for `brand`, `seo`, `marketing` and the signed-out half of `header`. By hand, for states no spec reaches: the rail, header, auth and 404 in light and dark; the tab icon in Chrome and Safari; the manifest in Chrome's Application panel; a starter email rendered on white and dark. The signed-in views need a session this machine cannot have (empty Clerk keys, no Postgres), so either you look, or CI's signed-in run does. Do not mark them verified from a unit test.

## F. Close-out

1. **Dead code**: confirm the grep table above is clean. Delete, do not comment out.
2. **Completion doc**: `.claude/completions/2026-10-xx-brand-v2.md` (the real date), in the shape of `2026-10-07-redesign.md`: what changed by step, decisions taken with links to [decisions.md](decisions.md), gate counts, the specs-unrun tally, the sweep backlog, what the user must do next.
3. **`CLAUDE.md`** ([B9](decisions.md#b9-claudemd-gains-the-third-theme-set)): add a short paragraph under "Two theme systems that never touch" saying the brand tokens are a third, static set, never read by the app UI or the canvas, and used only for the mark and artwork. Show the diff to the user before committing.
4. **Memory** (main session): rewrite the line in `redesign-2026-10.md` that says the brand follows the accent via `brand-colour.test.ts`; record the v2 outcome.
5. **Commit plan**, one per layer so each reviews and reverts alone, each passing `typecheck` and `lint` by itself: `feat(brand): add brand tokens and the new mark` (1), `feat(brand): replace the favicon, touch icon and manifest icons` (2), `feat(brand): show the lockup in the app` (3), `feat(seo): use the new social card` (4), `feat(brand): point new emails at the new mark` (5), then `docs: record the brand v2 close-out`. Specs ship with the layer they test. Push is the user's: never run it, never ask.
6. **`.claude/.planning/v2/`**: yours to keep as the record, move under `.claude/completions/`, or delete.

## What only you can do (outside the repo)

None of these is in the codebase, and none is assumed to exist. Check each you use:

- **Clerk dashboard**: the application logo and brand colour for hosted sign-in, verification emails and the account portal.
- **Stripe**: the checkout and receipt logo, icon and brand colour (the pack has the 512 icon).
- **Vercel and Supabase**: project icons, if you set them.
- **GitHub**: the repository social preview (1280 by 640; the card is 1200 by 630, so it needs a crop or an extra frame).
- **Social profiles, email sender avatar** and any listing that carries a Temply logo.
- **Re-scrape shared links** with each platform's debugger after deploy, so they stop showing the old card.

## Specs edited, and whether they ran

| Spec | Edited in | Runs locally | Seen passing |
| --- | --- | --- | --- |
| `brand.e2e.ts` (new) | 2 | Yes, public | Filled from step 2's report |
| `seo.e2e.ts` | 4 | Yes, public | Filled from step 4's report |
| `marketing.e2e.ts` | 2 (read; edit only if a pin moves) | Yes, public | Filled from the run |
| `header.e2e.ts` | 3 | Signed-out half | Filled from step 3's report |
| `shell.e2e.ts` | 3 | No | No |

Update the table as steps report; at the end it goes into the completion doc and into your hands. The best resolution is you pushing and reading CI's signed-in run, which is your call.

## Done when

- All gates pass with stated counts.
- The sweep greps are clean or each hit is listed with a reason; the backlog is written down.
- Every review layer has reported and its findings are resolved or listed.
- The completion doc is written, dead code gone, memory updated, `CLAUDE.md` diff shown.
- The final report says plainly: what was seen working, what was only edited, and what only CI or you can confirm.
