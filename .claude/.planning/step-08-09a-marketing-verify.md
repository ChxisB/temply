# Steps 8 and 9a: Marketing header, footer, hero, workflow (verify)

Board: [board/marketing-home.html](board/marketing-home.html). Routes: `/` and the other `(marketing)` pages.

## Status

The edits are **in the working tree and unverified**. They are about 15 files across `client/app/(marketing)/` and `client/components/marketing/` plus `client/components/header.tsx`. Nobody has compared them to the board in a browser, and the public specs have not been run on them.

This step is a **verification pass, not a rewrite**. The agent compares, runs, and fixes only what is wrong. It does not restyle things that already match.

Runs in parallel with 5 and 7. Must finish before 9b starts: both edit `client/app/(marketing)/home-client.tsx`.

## What the board says (the part this step owns)

| Area | Check |
| --- | --- |
| Header | Sticky, 46px "Start free trial" CTA, nav, sign-in link. Mobile menu (check the sheet at 390 opens, closes on route change, traps focus, has `aria-expanded`) |
| Hero | h1 68px, support text, primary and secondary CTA, the 520 x 560 showreel card, the line "14 days free, then $5 per person a month." (the number must come from `PRICES_USD`, not typed) |
| Workflow | The bento "A clear path from idea to inbox", including the "Build emails with blocks" card. Section keeps the `#blocks` anchor and the 'Blocks' nav entry |
| Footer | Links: Docs, Try the editor, Pricing, Contact, Terms, Privacy |

Pricing band and closing CTA are step 9b, not this one. If this step finds them half-edited, note it and leave them.

## Work

1. **Compare to the board** at 1280 and 390, light and dark where the marketing site has a dark mode (check; if it has none, say so). Take screenshots into the scratchpad and list each difference as: matches / differs and where / differs on purpose (a pin).
2. **Run the public specs.** Build the signed-out Playwright config (the earlier session's `verify-s89/` pattern: no Clerk, no Postgres, `baseURL` at the Next dev server) and run `marketing`, `seo`, and the signed-out parts of `header` and `design`. Report each as seen passing or failing. If the scratchpad config is gone, recreate it in this session's scratchpad, not in the repo.
3. **Fix** only real failures or real board mismatches. Tokens and primitives, not one-off component colours.
4. **Report for 9b**, written into the report: the shared `container` (`client/components/marketing/container.ts`, `max-w-280 px-5 md:px-8`), the `Kicker` component, and the vertical section rhythm (padding values between sections). 9b matches them rather than reinventing.

## Pins to keep

- `marketing.e2e.ts`: the playground section ('Your email' heading, line 116), the `#blocks` section and 'Blocks' nav, the no-JS visibility test, 'How to cache' link in the pricing footnote (9b), and the heading and link roles the spec already asserts. Do not weaken any assertion; if the board conflicts, the pin wins and the difference goes in the report.
- `seo.e2e.ts`: homepage title and description inside the length limits (commit `2fea0a5` fitted them), one h1, canonical, JSON-LD parses.
- `header.e2e.ts`: sticky header behaviour and the signed-in vs signed-out CTA states (the signed-in half cannot run locally; list it as unrun).
- `marketing-colour.test.ts`: no hex literals in marketing components.

## States

- Header: signed out, signed in (CTA becomes "Dashboard" or equivalent), menu open on phone.
- Hero: no-JS (content visible without hydration), reduced motion (showreel does not animate).
- Phone 390 and small 320: no horizontal scroll anywhere; the 68px h1 wraps and stays inside the gutter; showreel scales down.
- Scroll anchors: `[data-anchor]` scroll margin keeps a deep link clear of the sticky header (commit `ab3375d` fixed this once; do not regress it).

## Out of scope

Pricing section and closing band ([step 9b](step-09b-pricing-and-closing-cta.md)). New copy beyond what the board shows. The anonymous playground's styling.

## Done when

- Gates in the README pass.
- Public specs run and results listed (seen passing / failing / unrun).
- Differences vs the board listed, with each one fixed or marked "on purpose, pinned by X".
- 9b hand-off notes included.
- Report: files changed, screenshots taken, specs seen passing vs edited-but-unrun.
