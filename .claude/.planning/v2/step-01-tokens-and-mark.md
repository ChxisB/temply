# Step 1: Brand tokens and the new `BrandMark`

Board: [board/Colour.dc.html](board/Colour.dc.html), [board/Logo.dc.html](board/Logo.dc.html). Runs **first and alone**: steps 2 to 5 read the token names and `BrandMark`.

## Goal

Give the brand colours a home in the token layer and replace the three-bar glyph with the pack's mark, without changing a single `--ds-*` token and without breaking any current call site.

## Files

| File | Change |
| --- | --- |
| `client/app/globals.css` | Add the static `--brand-*` block (below). Nothing else |
| `client/components/brand-mark.tsx` | New geometry and a `variant` prop |
| `client/components/brand-mark.test.tsx` | New |
| `client/scripts/brand-tokens.test.ts` | New guard |

## Work

### 1. Tokens

Add one block to `globals.css`, outside `:root` light and `.dark`, because the values are the same in both. Say in its comment that it is static and that app UI never reads it:

```
--brand-coral:   #ff6b4a;
--brand-pink:    #ff3d8f;
--brand-purple:  #a855ff;
--brand-violet:  #7a1eff;   /* middle stop of the dark gradient only */
--brand-navy:    #0b1020;
--brand-gradient-primary: linear-gradient(135deg, #ff6b4a 0%, #ff3d8f 50%, #a855ff 100%);
```

Values are from the pack's `temply-brand.css`. Gray, light, line and white are deliberately absent (decision B3). Check `client/scripts/tokens.test.ts` and `check-contrast.ts` for anything that enumerates every custom property; if one fails on the new block, exempt the `--brand-` prefix with the reason "brand artwork, never text" in the script, not by editing the tokens.

### 2. `BrandMark`

The mark is **one path** (`viewBox="0 0 360 320"`): a rounded top bar, then the stem as two parts split by a slanted slice. Take the path data from `temply-mark.svg` ([assets.md](assets.md), id `4026ddd0…`), never retype it.

- `variant="gradient"` (default): fill is a `linearGradient`, `gradientUnits="userSpaceOnUse"`, `x1=0 y1=30 x2=290 y2=250`, stops at 0, 0.45 and 1 reading `var(--brand-coral)`, `var(--brand-pink)`, `var(--brand-purple)` through `style`.
- `variant="mono"`: `fill="currentColor"`, no gradient.
- Each instance needs its own gradient id: several marks share a page (header, sidebar, 404). Use `useId`; React's ids contain colons, so strip them rather than rely on `url(#:r1:)` resolving everywhere (check it in Safari).
- Keep `aria-hidden` and the `className` prop. The viewBox hugs the shape, as the old one did, so the box is the glyph and sits on the gutter beside it.
- The aspect is **9:8**, not square. Call sites sized with `size-6.5` still render (the SVG keeps its ratio inside the box), and step 3 re-sizes them by height.
- Rewrite the file's doc comment: it currently describes three bars and `currentColor`.

### 3. Guard

`brand-tokens.test.ts` (new, next to `brand-colour.test.ts`):

- The six tokens equal the values above.
- `--brand-*` is not referenced by a text, border or `bg-` utility outside an allow-list (`brand-mark.tsx`; marketing artwork if step 6 finds any). The allow-list entries carry a reason, and an entry that matches nothing fails, as in `marketing-colour.test.ts`.
- `--ds-accent` is not one of the brand colours. This documents A1: the app accent and the brand are different on purpose.

## Pins to keep

- `tokens.test.ts`, `faint.test.ts`, `marketing-colour.test.ts` untouched and green.
- Nothing in `client/app/globals.css` outside the new block changes. `git diff` shows only additions.

## States

`BrandMark` has no interactive state. Check it in light, in `.dark`, at `size-4` (the smallest in use) and at `size-10`, and that the gradient is not clipped at the viewBox edge.

## Done when

- Gates pass; counts reported before and after. `check:contrast` still reports the same pairs as before.
- `BrandMark` unit test covers: gradient stops read the tokens, two instances have different ids, `mono` is `currentColor`, `aria-hidden` set.
- No existing call site had to change to compile.
- Report lists, plainly, that nothing was looked at in a browser unless it was.
