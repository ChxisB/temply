# Decisions

Nothing here blocks the work. Every open call has a default the step files already use, and each says what it costs to change later. Reply to any of them and the step files get edited before an agent starts.

**A** is what the brand pack itself decides. **B** is what the pack leaves open and this plan had to pick.

## A. The pack's own calls, awaiting your yes

| # | Call | Why | Cost to reverse |
| --- | --- | --- | --- |
| A1 | App controls, links and focus stay violet `#5B45E0`. Brand colours go on the mark, artwork and display type only | The pack's Contrast board says so, and its numbers match `globals.css` exactly. White on coral, pink and purple fails 4.5:1 | **Large.** Moving the accent to coral or purple retunes every `--ds-accent*` token, both themes and all four contrast gates, and every button label would turn navy |
| A2 | App type stays Figtree, Bricolage Grotesque, JetBrains Mono. Inter is the brand face for the logo and brand artwork | The pack: "Moving the app to Inter is a separate decision". The 2026-10-03 redesign chose the friendlier fonts on purpose | **Medium.** One swap in `layout.tsx` and the three `--font-*` tokens, then every layout spec, because Inter is wider |
| A3 | App neutrals stay violet-leaning (`--ds-*`); brand artwork uses slate. The rail stays `#0B1220`, a hair from brand navy `#0B1020` | Mixing two neutral families on one surface reads as a mistake; the rail change would ripple through the contrast gates for no visible gain | **Small.** One token and a gate run |

## B. New decisions, with defaults

### B1. The wordmark becomes an image

Today the sidebar (`client/components/dashboard/sidebar.tsx:75-80`), the header (`client/components/header.tsx:253-256`) and the auth layout (`client/app/(auth)/layout.tsx:18`) set "Temply" as live text in Bricolage. The pack forbids retyping the name in another font, and the wordmark is Inter ExtraBold outlined to paths.

**Default.** Replace the text with the horizontal lockup as an `<img alt="Temply">`: `temply-logo-horizontal-on-dark.svg` in the rail (always graphite), the colour lockup elsewhere. The link's accessible name stays "Temply", so these pins hold: `header.e2e.ts:298,380,417`, `shell.e2e.ts:255`, `sidebar.test.tsx:54,70,124,125`.

**What it costs.** The header wordmark `truncate`s today so a narrow bar never overflows, and an image cannot truncate. At the 280px width the header comment describes, the lockup runs at its 24px-tall minimum (91px wide), about what the mark plus text take now; step 3 measures it at 280. Reversing is two components.

### B2. The in-app mark is the gradient

`BrandMark` becomes the new single-path mark. **Default:** gradient, with a `mono` variant that takes `currentColor` for any place that must be one colour. The call sites that pass `text-accent` today (sidebar, header, 404) stop needing it.

### B3. Brand tokens: a small static set in `globals.css`

The pack ships `temply-brand.css` with `--brand-*` variables. **Default:** add only what the mark needs, `--brand-coral`, `--brand-pink`, `--brand-purple`, `--brand-violet`, `--brand-navy` and `--brand-gradient-primary`, in a block marked static. Gray, light, line and white are left out because `--ds-*` already covers them. A guard test fails if a `--brand-*` token is used for text, a border or a fill under text outside an allow-list (the mark, marketing artwork). **Cost:** small; the block and one test.

### B4. The manifest's `theme_color`

The gradient tile has no single colour. **Default:** keep `#5B45E0`, the app accent, which is what the browser chrome shows today, so nothing visible moves. The manifest cannot read a CSS variable, so the rewritten guard ties it to `--ds-accent`. **Option:** brand navy `#0B1020`. **Cost:** one line either way.

### B5. The social image gets a new URL

Social platforms cache an image per URL, so swapping the picture behind `/temply-email-editor.png` would leave old previews for days.

**Default.** The card lives at `/brand/temply-social-card-1200x630.png`; `lib/seo.ts` points at it; `/temply-email-editor.png` and `/og-image.png` both 301 to it (the second already redirects, `next.config.mjs:138`). The old PNG is deleted. `temply-email-editor.webp` stays: `client/core/blocks/headers.tsx:131` uses it as a header block's cover and `seo.e2e.ts:96` pins it. `seo.e2e.ts` lines 34 and 90-101 change in step 4, in the same commit.

**What it costs.** The card's picture changes everywhere the old URL was already shared. Re-scraping shared links (LinkedIn, X, Slack) is yours, outside the repo.

### B6. What ships in the repo

**Default.** 11 of the pack's 60 files, marked "yes" in [assets.md](assets.md): the two horizontal lockups, the mark (SVG and PNG), the gradient app icon (SVG and four PNGs) and the social card. The other 49 (stacked and tagline lockups, one-colour variants, the five other icon colourways, the two token files) stay in the pack, which you own. **Cost:** re-download when a surface needs one.

### B7. Tagline copy

The card says "Build the email. We handle the HTML." The social image's alt in `lib/seo.ts:45` says "Write the email." **Default:** the alt follows the card. The home page's hero and meta copy are not touched; the pack does not ask for a rewrite, and `seo.e2e.ts` pins their lengths. **Open, not default:** using the tagline as the hero headline.

### B8. Emails already sent keep their logo

`server/src/render/engine.tsx:301-312` makes `/brand/mark.png` absolute (`NEXT_PUBLIC_APP_URL` + path), so every rendered email hot-links the file. Commit `059cda8` re-rendered it in place, which already changed the logo in mail people had received.

**Default.** Do not overwrite `mark.png` or `logo.png` again. New content (starter templates, the editor's default document) points at a new file, `/brand/temply-mark-email.png`. The two old files stay exactly as they are until the 30-day pinned-version retention has passed, then can go. Templates a customer made before v2 keep the violet-tile logo until they swap it; migrating customer content is a data change and out of scope.

**What it costs.** Two stale PNGs stay public for a while. **Option:** overwrite in place, which is simpler and rebrands every old email on its next image load, at the price of changing mail that was already sent.

### B9. `CLAUDE.md` gains the third theme set

The repo's `CLAUDE.md` says two theme systems never touch. **Default:** step 6 adds a short paragraph that the brand tokens are a third, static set and where they may appear. The edit is shown to you in the completion doc before it is committed.

## Also noted

- **Memory.** `redesign-2026-10.md` says the brand follows the accent. Step 6 rewrites that line.
- **Nothing needs a server change.** `engine.tsx` is read, not edited. If an agent concludes otherwise it stops and says so.
- **`.claude/.planning/v2/` is untracked**, like its parent. Its fate after step 6 is yours.
