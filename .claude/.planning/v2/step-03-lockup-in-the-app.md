# Step 3: The lockup in the sidebar, header, auth and 404

Board: [board/Product.dc.html](board/Product.dc.html), [board/Logo.dc.html](board/Logo.dc.html), [board/Logo-Variants.dc.html](board/Logo-Variants.dc.html). Wave B, after step 1. This is the step a customer sees most.

## Goal

Everywhere the product says "Temply" with the old mark plus live text, it shows the pack's horizontal lockup instead ([decision B1](decisions.md#b1-the-wordmark-becomes-an-image)), at the sizes the board uses, in light, in `.dark`, and at 280px wide.

## Where it is today

Start with `grep -rn "BrandMark" client --include='*.tsx' | grep -v test`: the survey found these, and there may be more.

| Surface | File | Today |
| --- | --- | --- |
| Dashboard rail | `client/components/dashboard/sidebar.tsx:69-80` | `BrandMark` `size-6.5 text-accent` plus "Temply" in `font-display text-2xl`, inside a `h-11` row inset 8px so the mark sits on the column's gutter |
| Header (marketing and app) | `client/components/header.tsx:249-256` | Mark `size-5.5`, `min-[24rem]:size-6.5`, plus a `truncate` wordmark, one step smaller on narrow screens |
| Auth screens | `client/app/(auth)/layout.tsx:18` | Text link only, no mark |
| 404 | `client/app/not-found.tsx:14` | `BrandMark size-6 text-accent` above the heading |
| Mobile nav drawer | the sidebar in a drawer | Pinned by `shell.e2e.ts:255` |

## What the board says

[board/Product.dc.html](board/Product.dc.html): the rail (`#0B1220`, padding 24 16) holds `temply-logo-horizontal-on-dark.svg` at **132 by 35**, `margin-left: 8px`. That is the same inset the sidebar already uses. A small mark appears at 18 by 16 beside content. The lockup is 480 by 127 at its native aspect (3.78 : 1).

## Work

1. **Fetch** the two lockups ([assets.md](assets.md), "Step 3"): `temply-logo-horizontal.svg` and `temply-logo-horizontal-on-dark.svg` into `client/public/brand/`.
2. **A shared `BrandLogo` component** beside `BrandMark`, so five surfaces do not each hand-roll an `<img>`:
   - Props: `tone: 'rail' | 'surface'`, `className`. `rail` renders the on-dark file only. `surface` renders **both** files and shows one by theme (`dark:hidden` and `hidden dark:block`); a `display: none` image leaves the accessibility tree, so the link still has the one name.
   - Both images carry `alt="Temply"`. Only the one that is displayed is exposed, so the link has exactly one name; assert that in the unit test (one `img` named Temply is reachable, not two).
   - Explicit `width` and `height` from the aspect so nothing shifts while it loads. If the image fails, the alt text shows and the link still works.
   - Use whatever the repo does for static images (`grep -rn "<img\b\|next/image" client/components`). If `next/image` needs `unoptimized` for SVG, use it; if lint's `no-img-element` fires, follow the repo's existing way of silencing or avoiding it, not a new one.
3. **Sidebar**: replace mark plus text with `<BrandLogo tone="rail">` at 132 by 35 in the same `h-11` row and the same 8px inset. Keep the DOM relationship `sidebar.test.tsx:124` asserts (the close button shares the link's parent).
4. **Header**: `tone="surface"`. At or above `min-[24rem]` use the board's 132 by 35 if it fits; below that, the 24px-tall minimum (91 by 24). No `truncate`: measure the signed-in, three-target case at 280 and 390 wide and report the numbers. If it does not fit at 280, the fallback is the mark alone at 24px, and the report says so.
5. **Auth**: the lockup in place of the text link, centred, 132 by 35, still a link to `/`.
6. **404**: the gradient `BrandMark`, `size` by height (about 32px tall), no `text-accent`.
7. **Every other `BrandMark` call site** the grep finds: gradient by default; use `variant="mono"` only where a surface is single-colour on purpose, and say which.
8. **Clear space** (the T's top-bar height on every side) holds in each: check the rail and header do not crowd the lockup with neighbouring controls.

## Pins to keep

- Link name `Temply`: `header.e2e.ts:298,380,417`, `shell.e2e.ts:255` (the link inside the drawer has `y >= 4`), `sidebar.test.tsx:54,70,124,125`.
- Header behaviour in `header.e2e.ts`: sticky bar, signed-in and signed-out CTA states, the menu button named Menu.
- The two theme systems never touch: the lockup swap uses the app's `dark:` variant and nothing from `--mly-*`.

## States

- Image loading and image failed (alt text, no layout jump).
- Light, `.dark`, and the always-graphite rail.
- Signed out, signed in, mobile menu open.
- 1280, 390 and 280 wide. Check whether the marketing site has a dark mode at all and say so if it has none.
- Keyboard: the link shows the global focus ring around the image, not clipped.
- `forced-colors`: the lockup stays visible (it is an image, so it should; look).

## The spec

- `header.e2e.ts`: a signed-out case that the logo link contains an image with `naturalWidth > 0` (a broken image has 0) and that its accessible name is `Temply`. Runs locally.
- `shell.e2e.ts`: the same for the rail's lockup. Signed-in, so **edited but unrun** here; say so.

## Done when

- Gates pass with counts. `header.e2e.ts` signed-out half seen passing; `shell.e2e.ts` listed as unrun.
- `grep -rn "font-display" client/components/header.tsx client/components/dashboard/sidebar.tsx "client/app/(auth)/layout.tsx"` shows no wordmark text left.
- A screenshot of the rail, the header and the auth screen, in light and dark, exists in the scratchpad, or the report says none was taken.
