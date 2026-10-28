# Step 4: Social card and SEO

Board: [board/Collateral.dc.html](board/Collateral.dc.html). Wave B, after step 1. Public, so `seo.e2e.ts` runs locally.

## Goal

A shared link to Temply shows the pack's card, at a new URL so platforms do not serve the old picture ([decision B5](decisions.md#b5-the-social-image-gets-a-new-url)), and the search-engine logo is the new icon.

## What is there now

| Place | Today |
| --- | --- |
| `client/lib/seo.ts:41-46` | `url: '/temply-email-editor.png'`, 1200 by 630, alt "Temply visual email editor. Write the email. We handle the HTML." Feeds both `openGraph.images` and `twitter.images` |
| `client/next.config.mjs:138` | 301 from `/og-image.png` to `/temply-email-editor.png` |
| `client/app/(marketing)/page.tsx:13` | JSON-LD `Organization.logo` is `${PRODUCTION_SITE_URL}/brand/logo.png` |
| `client/public/temply-email-editor.png` | The current card |
| `client/public/temply-email-editor.webp` | A header block's cover (`client/core/blocks/headers.tsx:131`) and pinned by `seo.e2e.ts:96`. **Stays** |
| `e2e/specs/seo.e2e.ts:34, 90-101` | Pins `og:image` to `/temply-email-editor.png`, 1200 by 630, content-type PNG, the webp, and the `/og-image.png` 301 |

## Work

1. **Fetch** `temply-social-card-1200x630.png` ([assets.md](assets.md), "Step 4") into `client/public/brand/`. Confirm with the PNG header that it is 1200 by 630. If it is over about 300 KB, say so; platforms refuse very large images.
2. **`lib/seo.ts`**: `url` becomes `/brand/temply-social-card-1200x630.png`; `alt` becomes the card's own words, "Temply. Build the email. We handle the HTML." ([B7](decisions.md#b7-tagline-copy)). Keep the 1200 and 630 numbers.
3. **`next.config.mjs`**: `/og-image.png` and `/temply-email-editor.png` both 301 to the new URL. Redirects run before `public/`, so deleting the old file is safe. Delete `public/temply-email-editor.png`; keep the webp.
4. **JSON-LD logo** in `(marketing)/page.tsx:13`: point at step 2's `/brand/temply-app-icon-gradient-512.png` (square, 512, well over the 112px floor search engines ask for). That file arrives in step 2, which runs alongside; if it is not there when this step finishes, the report says the logo URL is unverified.
5. **Do not touch** `/brand/logo.png`: it stays as the frozen v1 file ([B8](decisions.md#b8-emails-already-sent-keep-their-logo)).
6. **Update `seo.e2e.ts`** in the same commit:
   - line 34: `og:image` is `${origin}/brand/temply-social-card-1200x630.png`;
   - lines 90-101: the new URL returns 200, PNG, 1200 by 630; the webp case stays as it is; **both** `/og-image.png` and `/temply-email-editor.png` return 301 to the new URL;
   - a case that the JSON-LD `logo` URL returns 200.
   Assertions are replaced, not loosened.

## Pins to keep

- `seo.e2e.ts`: homepage title and description inside the length limits (`2fea0a5`), one h1, canonical, JSON-LD parses, `robots` rules, the 404 for a missing page.
- The `twitter:card` stays `summary_large_image`.

## Done when

- Gates pass with counts. `seo.e2e.ts` seen passing through the signed-out config.
- Opening the new image URL shows the pack's card; the report says whether that was looked at.
- Nothing in the tree still references `temply-email-editor.png` (grep, excluding `.next*` and `node_modules`), except the two redirects.
- The report tells the user the one thing only they can do: re-scrape shared links after deploy.
