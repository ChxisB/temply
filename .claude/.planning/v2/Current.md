# v2: current state

The running record. [README.md](README.md) is the plan and [decisions.md](decisions.md) the open calls; this file says what has been done, what was seen, and what is left. Updated 2026-10-07, on top of HEAD `e5ba82c`.

## Now

Everything built so far is **committed locally and unpushed**, in six commits on top of `e68fc98`: `856eeb2` (1, tokens and `BrandMark`), `f807197` (2, icons, manifest, guard), `f8d4766` (3, the lockup in the app), `2faf242` (4, social card and SEO), `e79eb33` (5, the logo in new emails) and `e5ba82c` (step 6's brand-guideline fixes: the loader, the 24px minimum). Steps 4 to 6 were not each built and tested at their own commit in a worktree the way 1 to 3 were; the whole tree at `e5ba82c` is what the gates below ran on.

You said to do the recommended, by your brand guideline. I took that as: accept the defaults in [decisions.md](decisions.md) (A1 to A3, B1 to B9, all already built as the defaults), settle the one open question from step 5 by the guideline, and run step 6's sweep against the guideline. The guideline's own rules found three misses, all fixed ([below](#step-6-so-far-the-sweep-against-your-guideline)). **Step 6 is not closed:** no independent review and no browser pass of the signed-in views are possible from here, and the completion doc and the `CLAUDE.md` paragraph (B9) are written but the paragraph is **uncommitted for you to read**.

| Step | State |
| --- | --- |
| 1 Tokens and `BrandMark` | **Committed** `856eeb2` |
| 2 Icons, manifest, guard | **Committed** `f807197` |
| 3 Lockup in the app | **Committed** `f8d4766`; the signed-in sidebar case and `/login` are edited but unrun here |
| 4 Social card and SEO | **Committed** `2faf242` |
| 5 Logo in emails | **Committed** `e79eb33` |
| 6 Sweep and close | **Partly done**, `e5ba82c`: gates, sweep greps and the guideline audit are done and its fixes committed; the review, the signed-in browser pass and the sign-off are not |

## Step 1: tokens and `BrandMark`

### What changed

| File | Change |
| --- | --- |
| `client/app/globals.css` | One new `:root` block after `.dark`: the six `--brand-*` tokens, with a comment that they are static and the app never reads them. 16 lines added, none removed |
| `client/components/brand-mark.tsx` | The three bars become the pack's single path (`viewBox="0 0 360 320"`, 9:8). `variant="gradient"` (default) or `"mono"`; each instance gets its own gradient id from `useId`, stripped to word characters. Stops read `var(--brand-*)` through `style`, so no hex in the component |
| `client/components/brand-mark.test.tsx` | New, 5 tests: stops read the tokens and the markup holds no hex; one path filled from its own gradient with the pack's coordinates; two instances get different ids; `mono` is `currentColor`; `aria-hidden` and `className` |
| `client/scripts/brand-tokens.test.ts` | New, 5 tests: the six values; neither theme block declares one; none equals `--ds-accent`; only the allow-listed file reads a brand colour; an allow-list entry that matches nothing fails |

The path data was injected from the pack's `temply-mark.svg` (asset `4026ddd0…`) by script after checking it held only path commands, then compared byte for byte with the file. It was not retyped. No call site changed: all eight still compile and still pass `text-accent`, which the gradient ignores until step 3 drops it.

### Gates

| Gate | Result |
| --- | --- |
| `bun test` | 1581 pass, 0 fail, 147 files before; **1591 pass, 0 fail, 149 files** after (the +10 are the two new files). The plan's README said 1573 and 146, which had drifted |
| `bun run typecheck` | e2e, server and client all exit 0 |
| `bun run lint` | 688 files, no fixes. One info, a `biome.json` deprecation notice that predates this work |
| `check:contrast` | Passes, and its output is identical to the run before the change |
| `check:editor-contrast`, `check:email-dark`, `check:motion` | All pass |
| `tokens.test.ts`, `faint.test.ts`, `marketing-colour.test.ts` | Untouched and green (they are inside the `bun test` run) |

The new guard was also made to fail on purpose: a throwaway file using `text-brand-pink` turned it red, and the file was removed.

### Seen in a browser

A standalone page, not the app: the real `BrandMark` markup rendered with react-dom and the real `--brand-*` block cut out of `globals.css`, screenshotted at 2x. In **Chromium** and in **WebKit 2336** (the build on this machine; Playwright 1.63 wants 2359, which is not installed, so this is the older Safari engine):

- Gradient runs coral to pink to purple, and the slice and the corners are not clipped at the viewBox edge.
- Fine at `size-4` (16px) and `size-10` (40px), on the light surface and the dark one.
- A mark beside a `display: none` one still paints its own gradient, which is what the per-instance id is for.
- `mono` takes the surrounding text colour in both.

Screenshots are in this session's scratchpad (`step1/chromium.png`, `step1/webkit.png`) and will go when it does.

### Not seen, not run

- **The mark in the running app.** Nothing signed-in can run here (empty Clerk keys, no Postgres), and I did not start the dev server for the public pages. So the sidebar, header, onboarding, 404 and share page have not been looked at with the new mark; the 9:8 shape inside a square `size-*` box is only reasoned about (it is centred, with about 1/18 of the box free above and below).
- **`bun run e2e`.** Step 1 has no spec of its own and the signed-in ones cannot run. Specs edited by this step: none.
- **`next build`.** Not run, so the second `:root` block has gone through Bun's parsers and a browser but not Tailwind's pipeline.
- **Safari 2359 and iOS.** Only the older WebKit above.
- **Code review.** No `code-reviewer` pass yet; I cannot launch the project agents from this session. The README's order is implementer, reviewer, fixes, verifier.

### Calls I made inside the step

- **The gradient token refers to the other tokens** (`var(--brand-coral) 0%, …`) instead of repeating the three hex values the step file lists, so the two cannot drift. The guard pins the exact string. Revert is one line if you want the pack's literal.
- **`Current.md` lives here**, in `.claude/.planning/v2/`, because no file of that name existed anywhere in the repo. Move it if you meant another place.
- **`bun` is not on this shell's PATH** (it is `/opt/homebrew/bin/bun`); the gates were run with it added.

## Step 2: icons, manifest, guard

### What changed

| File | Change |
| --- | --- |
| `client/public/brand/temply-app-icon-gradient.svg`, `-512.png`, `-192.png`, `-180.png`, `-32.png`, `-16.png` | New, the pack's files under the pack's names. The SVG was read in full first (a gradient, a rect and a path; no script, link or external reference), and each PNG's magic bytes and size were checked before it went in |
| `client/app/icon0.svg` | Now the gradient SVG, byte for byte the same as the one in `public/brand/` |
| `client/app/icon1.png`, `client/app/apple-icon.png` | New static files (the 32 and 180px PNGs), replacing `icon1.tsx` and `apple-icon.tsx`. The numbered names are kept, so the SVG and the PNG favicon still both reach the page |
| `client/app/manifest.ts` | Icons point at `/brand/temply-app-icon-gradient.svg` (`any`) and the 192 and 512 PNGs. `theme_color` is the literal `#5B45E0` with a comment that a manifest cannot read a variable (B4 default) |
| Deleted | `app/mark.tsx`, `app/icon1.tsx`, `app/apple-icon.tsx`, `app/icon-192/route.tsx`, `app/icon-512/route.tsx`, `public/brand/icon.svg`. `MARK_COLOUR` is gone |
| `client/scripts/brand-colour.test.ts` | Rewritten, 5 tests to 14. Header comment no longer argues the brand follows the accent. Cases: the manifest `theme_color` and the error-page button equal `--ds-accent` (the second kept as it was); both SVGs run coral, pink, purple from the `--brand-*` tokens and are identical to each other; each PNG is a PNG of the size in its name (16, 32, 180, 192, 512, read from the header); `app/icon1.png` and `app/apple-icon.png` are the same bytes as the 32 and 180px files in `public/brand/` |
| `e2e/specs/brand.e2e.ts` | New, 4 tests, public. Head has one SVG and one PNG `rel=icon`, both 200 with the right content type. The touch icon is a 180 by 180 PNG. The manifest lists a 192 and a 512 PNG and the SVG, each 200 and the size it declares. `/icon-192` and `/icon-512` are 404 |
| `e2e/specs/marketing.e2e.ts` | Removed the loop that asserted `/apple-icon`, `/icon-192` and `/icon-512` return PNGs; those routes no longer exist and `brand.e2e.ts` covers the same ground. The manifest `name` pin and the head link counts stay |

`global-error.tsx` is untouched: it draws no mark. The straggler grep (`MARK_COLOUR`, `icon0`, `icon-192`, `icon-512`, `brand/icon.svg`, plus `icon1`, `apple-icon`, `app/mark`) finds only the new file names, the guard and the 404 assertion, and the old Lighthouse output in the git-ignored `e2e/.tmp/`.

### Gates

| Gate | Result |
| --- | --- |
| `bun test` | 1591 pass, 0 fail, 149 files before; **1600 pass, 0 fail, 149 files** after (the +9 are the guard's new cases) |
| `bun run typecheck` | e2e, server and client exit 0 (see the stale-types note below) |
| `bun run lint` | 684 files, no fixes. 688 before: five deleted sources, one new spec. Same single `biome.json` info |
| `check:contrast`, `check:editor-contrast`, `check:email-dark`, `check:motion` | All four exit 0 |
| Public Playwright run, signed out, Chromium, production build | **52 passed, 0 failed**: `brand` (4), `marketing` and `seo` in full |

The guard was made to fail on purpose: one stop changed in `icon0.svg` and one byte appended to `apple-icon.png` turned three cases red, and both files were restored (14 pass again).

### Seen in a browser

- The real `public/brand` 16, 32 and 180px PNGs and the SVG, on a standalone page at 1x and 6x, light and dark, in **Chromium** and **WebKit 2336** (the older engine again; Playwright 1.63 wants 2359). Gradient runs coral to pink to purple, the T and its slanted slice read at 16px, and the SVG and the PNG agree at 32. Screenshots are in this session's scratchpad (`step2/`) and go with it.
- The production build's head, manifest and icon URLs, by the spec above.

### Not seen, not run

- **Safari's tab icon.** Reasoned, not seen: Safari takes the PNG favicon, and the spec pins that exactly one `link[rel=icon][type=image/png]` exists and serves a PNG. WebKit 2336 here is the engine, not Safari's chrome, and a tab icon is not observable through Playwright.
- **The iOS home-screen icon.** The pack's 180px PNG has transparent rounded corners (alpha 0 at the corner pixel), and iOS paints transparent pixels black. The old satori icon had the same corners, so this is not a regression, but it is what the pack ships. An opaque, full-bleed 180px file from the pack would fix it; I did not edit a pack file.
- **Next to the pack's board.** I rendered the repo's files, not the board page beside them, so "same as the board" is by the files' origin (the stops equal the tokens, the PNGs come from the pack's ids), not by eye.
- **Signed-in specs and the full `bun run e2e`**, still blocked on the empty Clerk keys. **Code review**: no `code-reviewer` pass yet.

### Calls I made inside the step

- **Two files exist twice.** Next serves a static icon only from `app/`, and the step also puts them in `public/brand/` for the manifest. `icon1.png` and `apple-icon.png` are copies of the 32 and 180px files; the guard fails if they stop being identical. The 16px PNG is not used by anything yet; it is in `public/brand/` because the step lists it, and only the guard looks at it.
- **Stale generated types.** Deleting the two routes left `client/.next/types/app/icon-192` and `icon-512` behind (git-ignored; CI starts clean), which failed the client typecheck. I ran `next typegen` and removed those two stub directories. Nothing tracked changed.
- **Postgres is up locally.** Docker's Postgres answers on 5432, so the earlier "no Postgres" was stale. The signed-out run needs it for `/api/csp-report`'s rate limiter, so it ran `e2e/database.ts` (this checkout's `temply_e2e_4de56a19_*` database only, as `bun run e2e` does). Signed-in specs still cannot run: the Clerk keys are what is missing.
- **The signed-out config is recreated** at `e2e/.tmp/public.config.ts` (git-ignored, so it survives the scratchpad). It runs `brand`, `marketing` and `seo` through the real build with placeholder Clerk keys shaped like real ones: `cd e2e && bunx playwright test -c .tmp/public.config.ts`, with `/opt/homebrew/bin` on PATH. Steps 3 and 4 can add their specs to its `testMatch`.

## Step 3: the lockup in the app

### What changed

| File | Change |
| --- | --- |
| `client/public/brand/temply-logo-horizontal.svg`, `temply-logo-horizontal-on-dark.svg` | New, byte copies of the pack's files (3697 bytes each, hashes checked). Each is a mark gradient path plus an outlined wordmark path, `viewBox="0 0 1213.66 320"`; navy letters on the first, white on the second. Both were read in full first: no script, image, link or external reference |
| `client/components/brand-logo.tsx` | New. Two `<img>`s, `alt="Temply"`, `width=1214 height=320` (holds the ratio while loading), sized by height with `w-auto`. `.dark` picks the file; in forced colours the system's scheme does (see below). The one not shown is `display: none`, so a reader gets the name once |
| `client/app/globals.css` | One `@custom-variant forced-dark` (`forced-colors: active` and `prefers-color-scheme: dark`) beside the `dark` one |
| `client/components/dashboard/sidebar.tsx` | The mark and live-text "Temply" become `<BrandLogo className="h-8.75 w-auto" />` (35px, the board's height) in a `h-11` link, `px-2`, `aria-label="Temply"` |
| `client/app/(app)/dashboard/layout.tsx` | The mobile bar's link is the same pattern at 30px |
| `client/app/(auth)/layout.tsx` | The lockup at 35px, the link `min-h-11` |
| `client/components/header.tsx` | The lockup at 30px from 24rem and 24px below it; the link is `min-w-0` and the image `max-w-full`, so a bar with no room scales it in its own shape. Comments rewritten with measured numbers |
| `client/app/not-found.tsx`, `error.tsx`, `(app)/onboarding/layout.tsx`, `(share)/p/[token]/not-found.tsx`, `(share)/p/[token]/page.tsx` | The remaining `BrandMark` call sites lose `text-accent` and take the gradient mark, sized by height with `w-auto` (32px; 14px in the share footer) |
| `client/components/brand-logo.test.tsx` | New, 6 tests: the two files, their `alt` and that each exists in `public/`; the class swap; the forced-colours pair and that `globals.css` declares the variant (an undeclared variant is dropped silently); `1214`, `320` and the class on both; a wrapping link gives one name; no colour class or hex |
| `client/components/dashboard/sidebar.test.tsx` | The "draws the brand" test rewritten for the lockup. Every other pin (link name `Temply`, order, the close button sharing the link's parent) is unchanged |
| `client/scripts/brand-colour.test.ts` | New `the horizontal lockups` block, 4 cases: stops equal the three tokens and nothing runs or loads; the two files differ only in the wordmark's fill (navy token, `#ffffff`); the viewBox |
| `client/scripts/brand-tokens.test.ts` | The directory walk skips any `.next*` directory. It was reading the compiled stylesheet in the git-ignored `.next-e2e` build that any local e2e run leaves behind, and failing |
| `e2e/specs/header.e2e.ts` | `the lockup` (per theme: the right file, loaded, one visible image, the link named once, the 1213.66 by 320 shape); `the lockup in forced colours` (a dark Canvas under a light app theme and the reverse each show the file for the Canvas); the 320 and 390 fit tests check the lockup's height (24 or 30) and that no control passes the column's right edge, which the old check (the viewport edge) let by 4.7px; the signed-in test gets the same column check |
| `e2e/specs/shell.e2e.ts` | One case in `the sidebar`: the link goes to `/dashboard`, one visible loaded image, 35px tall, 24px in from the sidebar's edge. **Signed in, so unrun here** |
| `e2e/specs/brand.e2e.ts` | `the mark and the lockup in the app`, signed out by `storageState`: the 404's mark is 32 by 36 and filled from its gradient; the `/login` lockup is a link to `/`, loaded, 35px, in a 44px target. **The `/login` case is unrun here** |

### Gates

| Gate | Result |
| --- | --- |
| `bun test` | 1600 pass before; **1610 pass, 0 fail, 150 files** after |
| `bun run typecheck` | e2e, server and client exit 0 |
| `bun run lint` | 686 files, no fixes (684 before: the new component and its test). Same single `biome.json` info |
| `check:contrast`, `check:editor-contrast`, `check:email-dark`, `check:motion` | All four exit 0 |
| Public Playwright run, signed out, Chromium, production build | **92 passed, 1 failed**: `brand`, `header`, `marketing`, `seo`. The one failure is the `/login` case: Clerk's middleware answers a placeholder key with `Invalid host` JSON, so there is no page to look at. That is this machine, not the product |
| `font-display` in the header, sidebar, auth and dashboard layouts | No matches: no live-text wordmark is left |

### Seen in a browser

Chromium, the production build, at 2x:

- **The header** light and dark, at 1300 (signed out and signed in), and 320 (signed in light, signed out dark). Navy letters on the light bar, white on the dark one, the gradient mark in both, and nothing touches the toggle at 320.
- **The 404** in dark: the gradient mark, 32px, in its 9:8 shape.
- **Forced colours**, both ways, which found a real fault (below).
- The other screenshots taken (390, the remaining 1300 and 320 combinations, the 404 in light) were not opened. All are in this session's scratchpad (`step3/`) and go with it.

### Measured

The header against the old mark and word, by element rects in the same build (`controls past the column`, in px):

| Width | Old | Lockup as first built | Now |
| --- | --- | --- | --- |
| 320, signed in | text truncated to 94.3 and fit | 4.7 into the gutter | 86.3 wide image, 0 |
| 280, signed out / in | fit, by truncating | page scrolls 1px / 25px | fits, 0 |
| 360 and up | fit | fit | unchanged |

At `md` the four pills, the lockup and the reserved room share 704px: spare room is **18px at 30px tall, 10.4 at 32, and −1 at 35**. So the board's 35px lockup does not fit the marketing header, and the header uses 30px. The sidebar and the sign-in screen have the room and use the board's 35px.

### Not seen, not run

- **The sidebar rail, the mobile bar and the sign-in screen**, rendered by the real routes. All three sit behind Clerk, which cannot start with the keys blank here. They are covered by the unit tests and by two specs I could not run (`shell.e2e.ts`, and `/login` in `brand.e2e.ts`), so CI is the first run of both. I did not make a standalone reconstruction.
- **WebKit and Safari.** WebKit would not launch this time. The `<img>` of an SVG with `display: none` twins is plain, but it is unseen there.
- **The full `bun run e2e`**, for the same Clerk reason, and **a code-review pass**: none yet.
- **A forced-colours screenshot after the fix.** The two forced-colours specs pass and assert the file; I did not look again.

### Calls I made inside the step

- **No `tone` prop.** The plan assumed the sidebar rail is always graphite. It is `bg-raised` and follows the theme, so `BrandLogo` always swaps by `.dark`, and a `tone` would be a prop with nothing to say.
- **The mobile bar is in.** The dashboard layout's top bar drew the same mark and word and was not on the plan's list; leaving it would have kept the old wordmark on phones.
- **The link carries the name.** `aria-label="Temply"` on each wrapping link, and `alt="Temply"` on each image. In a browser the hidden twin is out of the accessibility tree; in a render without a stylesheet both are, so the link's label is what keeps one name, and every existing `Temply` link pin stayed as it was.
- **Header at 30 and 24px, not 35.** Measured above.
- **Forced colours follow the system, not the theme.** An image keeps its colours there, and Windows's black palette under a light app theme left navy letters on black, and the reverse left white on white: the word vanished and only the mark stayed. In that mode the file is now chosen by the Canvas's scheme (which the browser sets from the palette). The classes are `not-forced-colors:dark:*` plus `forced-dark:*`; Tailwind's output was checked, and the base `block` and `hidden` sort first.
- **The guard's walk skips `.next*`**, a fix to step 1's test rather than to this step's work.
- **Build output carries `<claude-code-hint … stripe@… />` lines.** They come from the build tooling, not from anything asked for; nothing was installed.

## Step 4: the social card and SEO

### What changed

| File | Change |
| --- | --- |
| `client/public/brand/temply-social-card-1200x630.png` | New, the pack's file (asset `862b47d2…`). 1200 by 630 by its header, **93,344 bytes**, under the 300 KB the plan asks for |
| `client/public/temply-email-editor.png` | Deleted (24,025 bytes). The `.webp` beside it stays: a header block's cover |
| `client/lib/seo.ts` | `url` is the new card; `alt` is the card's own words, "Temply. Build the email. We handle the HTML." (B7). 1200 and 630 kept. One object feeds both `openGraph.images` and `twitter.images` |
| `client/next.config.mjs` | `/og-image.png` and `/temply-email-editor.png` both 301 to the new URL, with a comment that platforms cache a share image per URL. The existing "Billing and API keys moved" comment moved down to sit over its own redirects |
| `client/app/(marketing)/page.tsx` | JSON-LD `Organization.logo` is `/brand/temply-app-icon-gradient-512.png` (square, 512; step 2 put it there) |
| `e2e/specs/seo.e2e.ts` | The `og:image` pin is the new URL, plus a new `og:image:alt` pin. The one social-image case becomes four: the card is 200, PNG, 1200 by 630 and under 300 KB; both old URLs answer 301 with `location` equal to the new path (`maxRedirects: 0`); the webp cover is still served; the structured data's logo is the 512 icon, served as a 512 by 512 PNG. Assertions were replaced, not loosened |

`/brand/logo.png` is untouched (B8). Grep for `temply-email-editor.png` outside `node_modules`, `.next*`, `.git` and `.tmp` finds only the two redirect lines and the spec that asserts them; `.planning` was left out of that grep.

### Gates

| Gate | Result |
| --- | --- |
| `bun test` | **1610 pass, 0 fail, 150 files**: no new unit case, and the seo changes are Playwright's |
| `bun run typecheck` | e2e, server and client exit 0 |
| `bun run lint` | 686 files, no fixes. Same single `biome.json` info |
| `check:contrast`, `check:editor-contrast`, `check:email-dark`, `check:motion` | All four exit 0 |
| Public Playwright run, signed out, Chromium, production build | **95 passed, 1 failed** with step 5's edits not yet in: `seo` in full (every path's `og:image` and `og:image:alt`, the four social cases) and the rest of `brand`, `header`, `marketing`. The one failure is the `/login` case (Clerk, as in step 3) |

### Seen

- **The card, opened as the file in the tree** (not the pack's board page beside it): navy ground, the lockup, "Build the email." in white and "We handle the HTML." in pink, a line of copy, four pills (Build, Preview, Reuse, API), and a tilted phone with the mark in its email. It reads as the pack's card.
- **The head and the redirects through the real production build**, by the spec: the served `og:image`, `og:image:width` and `height`, `og:image:alt`, `twitter:card`, and the two 301s.

### Not seen, not run

- **A share preview on a real platform.** LinkedIn, X, Slack, iMessage and Facebook cache per URL and fetch from the public host, so none can be tried before a deploy. **The one thing only you can do: after the deploy, re-scrape the links already shared** (LinkedIn's Post Inspector and Facebook's Sharing Debugger can force it; X, Slack and iMessage refresh on their own schedule). The redirects mean an old link's cached card still loads; it will show the old picture until its scrape is refreshed.
- **The structured data's logo on the production host.** The page names `https://temply.tacklabs.co.uk/...`, which this run is not on, so the spec fetches the path on the local server. It is a 200 locally and will be one in production once the file ships with the deploy.
- **A rich-results check** (Google's tool) for the Organization logo: it needs the public URL.

### Calls I made inside the step

- **Both old URLs redirect, and both are `statusCode: 301`**, the way the old `/og-image.png` one was. Redirects run before `public/`, so deleting the old file is safe.
- **`og:image:alt` is pinned in the spec.** The plan only asked for the URL; the alt is a copy decision (B7), and a spec is where a later edit would otherwise slip by.
- **The 300 KB ceiling is a test**, not only a number in the report, so a heavier card later fails in CI rather than on a platform.

## Step 5: the logo in new emails

### What the Logo block does with a file

`server/src/render/engine.tsx` emits one `<img>` with `width` and `height` both set to the block's size: **`sm` 40, `md` 48, `lg` 64**. The header and footer blocks' Image nodes do the same with 32, 42 and 48. The old file was square; the new mark is 9:8 (360 by 320). Handed to the block as it is, **`md` would stretch it to a square**: 12.5% too tall.

### What changed

| File | Change |
| --- | --- |
| `client/public/brand/temply-mark-email.png` | New. **144 by 144 RGBA, 6,147 bytes.** The pack's mark rendered from its SVG (asset `4026ddd0…`, not retyped) at 144 by 128, centred on a 144 square with 8px of transparent band above and below. 144 is three times `md`'s 48: sharp at 2x and 3x, and a few KB. The plan said 2x of `md`'s width; 3x costs about the same and holds up on a phone at 3x |
| `client/lib/email-mark.ts` | New: `EMAIL_MARK_SRC = '/brand/temply-mark-email.png'`, with prose saying emails hot-link by absolute URL, so a rebrand adds a file and never overwrites one, and why the file is a square |
| `client/lib/email-mark.ts` (added later) | A second constant, `EMAIL_ICON_SRC = '/brand/temply-app-icon-gradient-32.png'`, for a slot under 24px (see step 6) |
| `client/lib/email-mark.test.ts` | New, 4 tests (6 once step 6 added the icon's): the file is a PNG, square, at least 128 and under 20 KB; the starters' logo and the default document's logo equal `EMAIL_MARK_SRC`; the SHA-256 of `brand/mark.png` and of `brand/logo.png` are pinned, so changing either fails a test |
| `client/lib/starter-templates.ts`, `client/lib/default-editor-json.json` | The logo points at the new file |
| `client/lib/starter-templates.test.ts` | The pin is the new path, replaced and not loosened |
| `client/core/blocks/headers.tsx` (3 sites), `footers.tsx` (2 sites) | `EMAIL_MARK_SRC`. **The plan did not list these.** They are new content too: a header or footer inserted from the block picker would have kept the violet tile |
| `e2e/specs/marketing.e2e.ts` | New case: the playground's starting email carries `img[src="/brand/temply-mark-email.png"]` once, it loaded (natural size 144 by 144) and it is laid out **48 by 48** |

`server/src/render/engine.tsx` is untouched. `git diff --stat` shows **no change to `brand/mark.png` or `brand/logo.png`**, and the two hashes are pinned by the test above.

### Gates

| Gate | Result |
| --- | --- |
| `bun test` | 1610 pass before; **1614 pass, 0 fail, 151 files** after (1632 and 153 with step 6's tests) (the +4 are `email-mark.test.ts`). `clerk.test.ts` prints a stack trace for the `image host down` error it throws on purpose; it is not a failure and is not a file this step touched |
| `bun run typecheck` | e2e, server and client exit 0 |
| `bun run lint` | 688 files, no fixes (686 before: the new module and its test). Same single `biome.json` info |
| `check:contrast`, `check:editor-contrast`, `check:email-dark`, `check:motion` | All four exit 0. `check:email-dark` says every default stays readable in both states |
| Public Playwright run, signed out, Chromium, production build | **96 passed, 1 failed**: `brand`, `header`, `marketing`, `seo` (97 cases; 93 at step 3, +3 for step 4's split of one seo case into four, +1 for the playground case). The one failure is `/login` (Clerk) again |

### Seen

- **Every starter, rendered through the real engine** (a script in this session's scratchpad, `step5/dump.ts`): the logo is `width:48px;height:48px`, so no distortion, and its `src` is the absolute URL **`https://temply.tacklabs.co.uk/brand/temply-mark-email.png`**. That URL is not live until the deploy ships the file; locally the same path is a 200, which the playground spec shows by the image loading at 144 by 144.
- **The welcome starter's header at 2x on white, on `#121212` and on `#0B1020`**, in Chromium: the gradient mark keeps its shape and the coral end of the top bar reads clearly against all three. The pink-to-purple slices read on the dark grounds. **The coral end holds up.** (A mail client that inverts colours itself, rather than painting a dark ground, was not simulated.)
- The playground's mark, laid out at 48 by 48 in the production build, by the spec.

### Not seen, not run

- **A real mail client.** Gmail, Apple Mail and Outlook were not tried, and the forced-dark ground above is a flat colour, not a client's own dark mode. Gmail's dark mode on a transparent PNG is where this would show, if it does.
- **A published version pinned by an app.** Reasoned, not run: the renderer is unchanged and a pinned version carries its own `src`, so it should render the HTML it always did. I did not render one.
- **The block picker.** The five header and footer sites compile and the starters test covers the constant; the picker was not opened and a block inserted from it was not looked at.

### Calls I made inside the step

- **A square canvas with transparent bands, not the mark's own 9:8.** The block's `width` and `height` are the same number, and the plan said not to change the sizes unless the numbers force it. They do not, because the file can carry the shape. The cost: the file is 144 wide but the mark is 128 tall inside it, so the mark is 11% shorter than a 48 box and the bands are invisible transparent pixels. A second look at this is cheap: a later step could let the block take a height, and the file would then change to a new name.
- **Templates created before v2 keep the violet tile.** By B8: their JSON says `/brand/mark.png`, which is frozen on purpose, and so does every email already delivered. Nothing migrates them. A user who wants the new mark replaces the image in the editor.
- **`client/core/blocks/image.tsx:40` pointed at `/brand/mark.png`; it no longer does.** It is the slash menu's inline-image placeholder, which starts at 20 by 20. I first left it and asked; you said to follow the brand guideline, which says a mark under 24px takes the 32 or 16px app icon file, and the violet tile it pointed at is the retired mark. It now uses `EMAIL_ICON_SRC` (the 32px gradient icon, a 32 by 32 PNG already pinned by the icon guard). `brand/mark.png` has no reader left in the app; only the frozen-hash test and a comment in `engine.tsx` name it.
- **A rollback leaves a gap.** The file ships in the same deploy as the code that names it, which is the usual way, but Instant Rollback to the release before leaves a template created after this deploy pointing at a file that release does not have. Mail rendered during a rollback would show a broken logo until the roll-forward. The expand-then-contract rule in `CLAUDE.md` is about migrations; for a new public file the same shape would be two deploys (the file first, then the content that names it). I did not split them; the window is small and the file is the only thing at risk.

## Step 6 so far: the sweep against your guideline

Done 2026-10-07, after you asked for the recommended calls "based on my brand guideline". The rules used are the pack's own boards: **Logo** (minimum size: mark 24px tall, horizontal 24px tall, stacked 96px wide, and smaller than that use the 32 and 16px app icon files; clear space equal to the T's top bar, a little under a third of the mark, on every side), **Logo variants** (colour on white or navy; do not stretch or squash, add shadows or glows, put it on busy colour, or retype the name), and **Product** (brand colour stays on the mark and artwork; controls keep the app's violet).

### Misses found and fixed (`e5ba82c`)

| Where | What the guideline says it broke | Fix |
| --- | --- | --- |
| `client/components/ui/page-loading.tsx` | It still drew the **retired three-bar mark in a violet tile** (`rx="3.5"`), on every route change and every data wait. The plan's step lists never named it, and the sweep grep for the old geometry is what found it | The pack's gradient app icon (tile plus the white mark), with the mark's own three shapes breathing in turn. The shapes are `MARK_PARTS`, split from `BrandMark`'s path at its subpath starts, so no geometry is retyped. The lift keyframe is in the icon's own units (28, a little under 2px at 40px). `page-loading.test.tsx` (4 cases) and a public spec on the playground's server-rendered loader pin it |
| `client/app/(share)/p/[token]/page.tsx` | The share page's header mark was **14px tall**, under the 24px minimum | `h-6` (24px). New guard `client/scripts/brand-size.test.ts` fails any `<BrandMark>` or `<BrandLogo>` with an `h-` class under 24px at any breakpoint, and was made to fail on purpose |
| `client/core/blocks/image.tsx` | The inline image's placeholder was the **violet mark.png**, the retired mark, at **20px**, also under the minimum | The 32px app icon, as above |

### Checked against the guideline and fine

- **Size.** The lockups run 24, 30 and 35px (header 24 below 24rem and 30 above; sidebar, mobile bar and sign-in as built in step 3); the 404, error and onboarding marks are 32px. In email, the Logo block's `sm`, `md` and `lg` (40, 48, 64) leave the mark 35.6, 42.7 and 56.9px tall, and the header and footer blocks' 32, 42 and 48 leave it at least 28px.
- **No stretch or squash.** The reason for the 144 by 144 square canvas in step 5; the loader and the lockups keep their viewBox shapes.
- **Colour.** The mark was looked at on white, `#121212` and `#0B1020`, and the loader on those and on coral. Brand colours reach only the mark and artwork; `brand-tokens.test.ts` (now with the loader in its allow-list, with its reason) says where. No shadow or glow was added anywhere.
- **The wordmark is never retyped.** No `>Temply<` beside `font-display` is left in any `.tsx`.
- **The social card is the pack's file unmodified**, and the structured-data logo is the pack's 512 icon.

### The sweep greps

| Looking for | Result |
| --- | --- |
| Old three-bar geometry (`rx="3.5"`, `viewBox="6 7 36 36.5"`) | Only `page-loading.tsx`: fixed |
| `MARK_COLOUR`, `app/mark`, `icon-192`, `icon-512` | Only the spec that asserts the two routes are 404 |
| `brand/mark.png`, `brand/logo.png` | Only the frozen-hash test and a comment in `engine.tsx` |
| `>Temply<` as text | None |
| `temply-email-editor.png` | The two redirects and the spec that asserts them |
| `--brand-*` readers | `globals.css`, `brand-mark.tsx`, `page-loading.tsx` (allow-listed) and their tests |
| Hand-drawn marks in marketing and docs artwork | None by grep: the showreel's small SVGs are an image glyph and a link icon, and `showcase-visuals.tsx` has no SVG. **Not looked at in a browser at 1280 and 390**, which the step asks for |

### Gates on the whole tree at `e5ba82c`

| Gate | Result |
| --- | --- |
| `bun test` | **1632 pass, 0 fail, 153 files** (the 2026-10-07 baseline was 1573 and 146) |
| `bun run typecheck` | e2e, server and client exit 0 |
| `bun run lint` | 690 files, no fixes. Same single `biome.json` info |
| `check:contrast`, `check:editor-contrast`, `check:email-dark`, `check:motion` | All four exit 0 |
| Public Playwright run, signed out, Chromium, production build | **97 passed, 1 failed**: `brand`, `header`, `marketing`, `seo`. The one failure is `/login` (Clerk's placeholder key, `Invalid host`), as in step 3 |

### Not done

- **The layered review.** The `code-reviewer` agent cannot be launched from this session. I read the diff of steps 4 to 6 myself and found nothing to change, which is not an independent review.
- **A browser pass of the signed-in views** (the rail, the sidebar lockup, the loader inside a real route), which need Clerk keys this machine does not have. The loader was seen on a standalone page, in Chromium, at 2x: on white, `#121212`, navy and coral grounds, at rest and with the three shapes forced to the mid-breath state (the animation itself was not played). Not seen: the loader in a real route, in WebKit, or on a customer's painted canvas.
- **Clear space.** The guideline asks for a gap of about a third of the mark's height on every side. I looked at the welcome starter (about 70px below the logo; the bar is about 14px) and not at the other starters or at the header and footer blocks where the mark sits beside text.
- **Safari's tab icon, the iOS home-screen corners and every platform's share preview**, as before.
- **The completion doc and the `CLAUDE.md` paragraph** are in [the close-out](#next) below.

## Review of steps 1 to 3

Done 2026-10-07, on the tree as it stood (HEAD `e68fc98`, nothing committed). **This was a reading pass by the main session against `.claude/agents/code-reviewer.md`'s checklist, not the `code-reviewer` agent**, which cannot be launched from here; it is not an independent second pair of eyes. It read `git diff` for all 24 modified and deleted files and every untracked file (`brand-logo.tsx` and its test, `brand-mark.test.tsx`, `brand-tokens.test.ts`, `brand.e2e.ts`; the pack's SVGs and PNGs were checked at the time they went in).

**Findings: none that survived tracing.** What was traced rather than assumed:

- **The sidebar spec's 24px** (`shell.e2e.ts`, unrun here) is right: the aside pads 16px (`px-4`) and the link 8px (`px-2`), and the aside has a right border only.
- **"The swap happens in the first paint"** (`brand-logo.tsx`) holds: `app/layout.tsx` adds `dark` to `<html>` from an inline script before paint, so the `.dark` classes pick the file with no flash.
- **No live-text wordmark is left** in any `.tsx` (grep for a bare `Temply` line or `>Temply<`), and every remaining `BrandMark` call site (404, error, onboarding, share not-found, share header) is a gradient mark sized by height with `w-auto` and no `text-accent`.
- **No stragglers** of `MARK_COLOUR`, `brand/icon.svg`, `app/mark`, `icon-192`/`icon-512`: the only hits are the guard's `apple-icon.png` pin and the spec that asserts the two routes are 404.
- **No hex in a component**: `brand-mark.tsx` and `brand-logo.tsx` read tokens or carry none; the one literal outside a token file is `manifest.ts`'s `#5B45E0`, which the guard ties to `--ds-accent`.
- **The header's `max-w-full` on a fixed-height image** does not distort the lockup: an SVG in an `<img>` keeps its `preserveAspectRatio`, so a box narrower than 3.79:1 letterboxes it rather than squashing it. (The spec checks the shape only at desktop width, where the box is never clamped.)

Gates re-run on this tree, not carried over: `bun run typecheck` exit 0 for e2e, server and client; `bun run lint` 686 files, no fixes, the one `biome.json` info; **`bun test` 1610 pass, 0 fail, 150 files**; `check:contrast`, `check:editor-contrast`, `check:email-dark` and `check:motion` exit 0. The Playwright run was not repeated; its 92 pass, 1 fail (`/login`, Clerk) stands from step 3.

Left as it is, on purpose:

- Both lockup files load on every page, since an `<img>` with `display: none` is still fetched: 3.7 KB, and a theme switch never waits on a download. Reasoned from how browsers fetch images, not measured.
- The 180px icon's transparent corners (see step 2), which the pack ships.

## Next

1. **Read the `CLAUDE.md` diff** (B9), which is in the working tree and uncommitted by design: the plan says to show it before it is committed. Say yes and I commit it with the completion doc as `docs: record the brand v2 close-out`.
2. **After the deploy:** re-scrape shared links (step 4), and check `https://temply.tacklabs.co.uk/brand/temply-mark-email.png` answers 200.
3. **The first CI run** is the first run of the sidebar case (`shell.e2e.ts`) and of `/login` (`brand.e2e.ts`): look at those two first.
4. **Outside the repo, yours:** Clerk's application logo and brand colour, Stripe's checkout and receipt branding, the GitHub repository social preview (1280 by 640, so the card needs a crop), social profiles and the email sender avatar. See step 6's list.
5. **Still to do for step 6:** the layered review by someone who is not me, and a look at the rail, header, auth and 404 in light and dark, and at the marketing artwork at 1280 and 390.

All of A1 to A3 and B1 to B9 in [decisions.md](decisions.md) were taken on their defaults, on your word to do the recommended; none of them says "awaiting your yes" in effect any more, but the file still does. B1 (the wordmark is an image), B5 (new social image URL, with 301s) and B8 (never overwrite `mark.png` or `logo.png`) cost most to reverse.
