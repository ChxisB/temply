# v2: the new brand in Temply

Source of truth: the **Temply Brand Pack**, a Design canvas, <https://claude.ai/artifact/FRcH5hvTLYk8AQELfAkwvv>.
Eight of its pages are copied, markup only, into `board/` (`Logo`, `Logo-Variants`, `App-Icons`, `Colour`, `Contrast`, `Typography`, `Product`, `Collateral`). Read those, not the live canvas. Measurements in the step files come from them. The 60 files the pack ships are listed with ids in [assets.md](assets.md); only 11 come into the repo (decision B6).

Written 2026-10-07 against HEAD `e68fc98`. Progress is recorded in [Current.md](Current.md). The redesign plan this follows is one directory up (`../README.md`) and is finished; v2 does not edit it.

## What the pack changes, and what it leaves alone

| | Today | Pack |
| --- | --- | --- |
| Mark | Three tapering bars in a violet rounded tile (`client/components/brand-mark.tsx`, `client/app/mark.tsx`) | A T cut by one slanted slice, one path, gradient coral `#FF6B4A` to pink `#FF3D8F` to purple `#A855FF` |
| Wordmark | Live text "Temply" in Bricolage Grotesque beside the mark (sidebar, header, auth) | Inter ExtraBold, outlined to paths, shipped inside the lockup image. "Don't retype the name in another font" |
| App icon, favicon | Violet tile, drawn by satori routes and two SVGs | Six tiles, gradient is the default; PNGs at 1024 to 16 |
| Social card | `temply-email-editor.png`, an editor picture | A tagline card, "Build the email. We handle the HTML." |
| Logo in emails | `/brand/mark.png`, a violet tile, referenced by starters | The gradient mark |

**Left alone, by the pack's own words** ([board/Contrast.dc.html](board/Contrast.dc.html), "Where the app sits"): the app keeps its violet for every control, so no `--ds-*` token changes. The pack's values for surface, accent, accent ink, wash and rail (`#FAF9FE`, `#5B45E0`, `#3B2C9E`, `#E8E3FF`, `#0B1220`) are the ones already in `client/app/globals.css`. App type stays Figtree, Bricolage Grotesque and JetBrains Mono ("moving the app to Inter is a separate decision"). Dark mode and the editor canvas are not touched.

This **reverses one v1 call**. Commit `059cda8` made the brand follow the app accent and added `client/scripts/brand-colour.test.ts` to enforce it. In v2 the brand has its own colours and the accent is only the app's. That test is rewritten in step 2, not weakened.

## Where things stand

| Step | What | State |
| --- | --- | --- |
| 1 | `--brand-*` tokens and a gradient `BrandMark`: [step-01](step-01-tokens-and-mark.md) | Committed `856eeb2`: [Current.md](Current.md) |
| 2 | Favicon, touch icon, manifest, error page, the accent guard: [step-02](step-02-icons-and-manifest.md) | Committed `f807197`: [Current.md](Current.md) |
| 3 | The lockup in the sidebar, header, auth and 404: [step-03](step-03-lockup-in-the-app.md) | Committed `f8d4766`: [Current.md](Current.md) |
| 4 | Social card and SEO: [step-04](step-04-social-card-and-seo.md) | Committed `2faf242`: [Current.md](Current.md) |
| 5 | The logo in customers' emails: [step-05](step-05-logo-in-emails.md) | Committed `e79eb33`: [Current.md](Current.md) |
| 6 | Sweep, outside-the-repo list, close-out: [step-06](step-06-sweep-and-close.md) | Partly done: gates, greps and the guideline sweep (`e5ba82c`); review and the signed-in pass open. Close-out: [completion doc](../../completions/2026-10-07-brand-v2.md) |

Open calls, each with a default so nothing blocks: [decisions.md](decisions.md).

## Order

```
Wave A      Wave B (parallel, disjoint files)        Wave C
step 1  ->   step 2  icons, manifest, guard      ->   step 6
             step 3  lockup in the app
             step 4  social card, SEO
             step 5  email logo
```

- Step 1 first and alone: 3 depends on `BrandMark` and the tokens, 2 and 4 on the token names.
- 2, 3, 4 and 5 touch different files. The few shared places have one owner:

| Shared place | Owner | Others |
| --- | --- | --- |
| `client/app/globals.css` | Step 1 only | Anyone needing a token stops and says which |
| `client/public/brand/` | Each step adds its own files | Deletes only what it orphans; never touch `mark.png` or `logo.png` (B8) |
| `e2e/specs/brand.e2e.ts` (new) | Step 2 | Nobody else edits it |
| `e2e/specs/header.e2e.ts`, `shell.e2e.ts` | Step 3 | |
| `e2e/specs/seo.e2e.ts` | Step 4 | |

- **File names.** Every file keeps its pack name, so it traces back to [assets.md](assets.md). Step 2 puts the icons at `client/public/brand/temply-app-icon-gradient-{512,192,180,32,16}.png` and `temply-app-icon-gradient.svg`; step 3 the lockups at `temply-logo-horizontal.svg` and `temply-logo-horizontal-on-dark.svg`; step 4 `temply-social-card-1200x630.png`. Step 4's JSON-LD points at step 2's 512 icon by that name, which is why the names are fixed here.
- 6 runs last, on a tree where 2 to 5 have reported.

## Rules every step inherits

From the repo's `CLAUDE.md`, restated where they bite:

- Bun only. Colours live in the token layer: no hex in a component. `marketing-colour.test.ts` and the contrast gates exist because that shipped broken three times.
- Two theme systems never touch (app `.dark` and `--ds-*`; the editor canvas and `--mly-*`). The brand tokens are a **third, static set**: the same in light and dark, read by neither theme system and never by the email canvas.
- Nothing pops, every state is designed, reuse `Card`/`Badge`/`EmptyState`/`ErrorState`/`ConfirmDialog`, `aria-label` on icon-only buttons. Motion timing from the `duration-*` and `ease-*` tokens only.
- A change a customer sees ships with its case in `e2e/specs`. Where a spec pins something the pack conflicts with, the pin holds until the user decides; each step lists its pins.
- Commit prefixes are conventional. Push is the user's call: never ask, never run it.

Brand rules from the pack, which every step enforces:

- **Brand colours are for the mark, artwork and display type.** Never a button, link, focus ring or small text. White on coral is 2.82:1, on pink 3.32:1, on purple 3.88:1; text on those colours is navy `#0B1020` (6.72, 5.69, 4.88:1). Gradients never sit under small text.
- The logo is never stretched, recoloured, shadowed, rotated, put on busy colour or retyped in another font. Clear space is the height of the T's top bar (about a third of the mark) on every side. Minimum: mark and horizontal lockup 24px tall, stacked lockup 96px wide; smaller, use the 32 and 16px icon files.
- One neutral family per surface: app surfaces use `--ds-*` (violet-leaning), brand artwork uses the pack's slate.
- Copy: sentence case, plain verbs, the same word from button to toast.

## Gates (a step is not done until all pass)

From the root: `bun run typecheck`, `bun run lint`, `bun test`. From `client/`: `bun run check:contrast`, `check:editor-contrast`, `check:email-dark`, `check:motion`. Then the step's own spec: `bun run e2e -- <spec>`.

Last recorded counts (2026-10-07, after the redesign): `bun test` 1573 pass, 0 fail across 146 files; lint 685 files. A step reports its own before and after as counts, never "green".

## What cannot run here

`e2e/.env` and `client/.env` have empty Clerk keys and there is no local Postgres, so every signed-in spec fails at setup. Public specs run through a signed-out Playwright config in the session scratchpad; the recipe is in `../README.md` ("What cannot run here"). Of the specs v2 touches, `brand`, `seo`, `marketing` and the signed-out half of `header` can run; `shell` cannot. Each step ends with two plain lists: specs seen passing, and specs edited but unrun.

## Who does what

The project agents in `.claude/agents/`: `implementer` builds a step from its file and this README, runs the gates and does not commit; `code-reviewer` reviews the diff and never edits; `browser-verifier` runs the spec and drives Chrome at 1280 and 390 wide, light and dark. Order per step: implementer, code-reviewer, fixes, browser-verifier. The main session decides, commits and summarises.
