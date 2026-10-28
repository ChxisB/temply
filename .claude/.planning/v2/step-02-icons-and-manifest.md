# Step 2: Favicon, touch icon, manifest, error page, and the accent guard

Board: [board/App-Icons.dc.html](board/App-Icons.dc.html). Runs in wave B, after step 1. Public route work, so its spec runs locally.

## Goal

Every icon a browser, phone or install prompt asks for shows the gradient tile, and the code that drew the old violet tile is gone.

## What is there now

| File | Role |
| --- | --- |
| `client/app/icon0.svg` | Favicon for Chrome and Firefox (a violet 48 box, three white bars) |
| `client/app/icon1.tsx` | Same mark as a 48px PNG through satori, because **Safari ignores SVG favicons** and showed no tab icon |
| `client/app/apple-icon.tsx` | 180px home-screen icon through satori |
| `client/app/icon-192/route.tsx`, `icon-512/route.tsx` | Manifest icons through satori |
| `client/app/mark.tsx` | The satori drawing, with `MARK_COLOUR = '#5B45E0'` |
| `client/app/manifest.ts` | Icons plus `theme_color: MARK_COLOUR` |
| `client/app/global-error.tsx` | Renders when the layout, and with it the stylesheet, did not: it cannot read a CSS variable |
| `client/public/brand/icon.svg` | Duplicate of `icon0.svg`, listed in the manifest |
| `client/scripts/brand-colour.test.ts` | Fails when any of the above drifts from `--ds-accent` |

Constraints the code comments record, which the new setup must keep: an SVG favicon **and** a PNG favicon; Next's numbered `icon0`/`icon1` convention exists because a plain `icon.svg` and `icon.tsx` shadow each other.

## Work

1. **Fetch** the gradient icon files from the pack ([assets.md](assets.md), "Step 2" rows): `temply-app-icon-gradient.svg` and the 512, 192, 180, 32 and 16 PNGs. Put them in `client/public/brand/` under those names. The new names differ from anything that is cached today, so no browser or phone keeps the old icon through a stale URL.
2. **Replace the satori drawing with the files.** The new mark is a gradient path, and re-implementing it in satori boxes would be a second copy of the geometry. Serve static files instead:
   - `app/icon0.svg` becomes the gradient SVG; `app/icon1.tsx` becomes a static `app/icon1.png` (the 32px file). Keep the numbered names.
   - `app/apple-icon.tsx` becomes `app/apple-icon.png` (the 180px file).
   - `manifest.ts` icons point at `/brand/temply-app-icon-gradient-192.png` and `-512.png`, plus the SVG as `any`.
   - Delete `app/mark.tsx`, `app/icon-192/`, `app/icon-512/`, and `public/brand/icon.svg`. Delete, do not comment out.
   If a Next constraint forces a route (for example a cache header the static file cannot get), keep that one route and say why.
3. **`theme_color`**: keep `#5B45E0` as a literal ([decision B4](decisions.md#b4-the-manifests-theme_color)). With `mark.tsx` gone there is no `MARK_COLOUR` to import, so the literal sits in `manifest.ts` with a comment that a manifest cannot read a CSS variable and the guard ties it to `--ds-accent`.
4. **`global-error.tsx`**: its button is an app control, so it stays violet and the guard still pins it. It draws no mark. Leave it unless the grep below finds one.
5. **Rewrite `brand-colour.test.ts`** (do not delete cases to make it pass). New cases:
   - The gradient SVG's stops equal `--brand-coral`, `--brand-pink`, `--brand-purple` from `globals.css`.
   - `manifest.ts` `theme_color` equals `--ds-accent`.
   - `global-error.tsx`'s button background equals `--ds-accent` (this case is kept as it is).
   - Each PNG's header dimensions match its name (16, 32, 180, 192, 512), read as the SEO spec reads the social image (`png.readUInt32BE(16)` and `(20)`).
   Update the file's header comment: it argues the brand follows the accent, which v2 reverses.
6. **Grep for stragglers**: `grep -rn "MARK_COLOUR\|icon0\|icon-192\|icon-512\|brand/icon.svg" client e2e` outside `node_modules` and `.next*`; every hit is updated or deleted.

## Pins to keep

- `marketing.e2e.ts:82`: the manifest's `name` is `Temply`.
- `seo.e2e.ts` and `marketing.e2e.ts` fetch the manifest or head icons in places; run both and read what they assert before deleting a route.
- The tab icon must still appear in Safari. Say in the report whether this was seen in Safari or only reasoned about.

## The spec

New `e2e/specs/brand.e2e.ts`, public, no sign-in. This step owns the file; step 3 does not add to it.

- `/` head carries a `link[rel=icon]` of type SVG and one of type PNG; each URL returns 200 with the right content-type.
- `link[rel=apple-touch-icon]` returns a PNG that is 180 by 180.
- `/manifest.webmanifest` lists 192 and 512 icons; each returns 200 and a PNG of that size.
- `/icon-192` and `/icon-512` no longer exist (404), so a deleted route is not silently re-added.

## Done when

- Gates pass with counts. `brand.e2e.ts` and `marketing.e2e.ts` seen passing through the signed-out config.
- The old drawing is gone from the tree (the grep is empty).
- The report states what was seen: ideally the 16, 32 and 180px icons rendered next to the pack's board, and whether any was only reasoned about.
