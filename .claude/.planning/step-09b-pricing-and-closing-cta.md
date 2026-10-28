# Step 9b: Pricing section and "Ready when you are" band

Board: [board/marketing-home.html](board/marketing-home.html). Route: `/`, the `#pricing` section and the band after it.
**Waits for [9a](step-08-09a-marketing-verify.md).** Both edit `client/app/(marketing)/home-client.tsx`, so one agent in it at a time. Use 9a's hand-off notes (shared `container`, `Kicker`, section rhythm).

## Goal

Restyle the pricing section and add the closing CTA band to the board, **without changing what the pricing says** (the numbers come from `shared/plans.ts`) and without breaking the pinned seat stepper.

## The board

### Pricing section

Background sunken, padding 88.

- Centred header: "Pricing" pill, h2 48px "One price per person, after a free trial", p 19px "Every workspace gets 14 days free, no card needed. After that you pay for the people on the team, and the calls, templates and history most teams need come with them."
- **Team card** (flex 1.5): white, radius 32, padding 36.
  - "Team" with an "After the trial" pill.
  - "$5" at 80px display, "per user a month".
  - Seat stepper row: "3 users x $5 = $15 a month" with 44px minus and plus buttons.
  - Five checks: 10,000 live API calls a month; Then $1 per 1,000 calls, pro rata, on the next invoice; 10 templates, 10 versions of each; 1 GB of storage; 5 live keys and 5 brands.
  - 56px "Start your free trial" button, then a fine-print line.
- **Enterprise card** (flex 1): 1.5px border. "Custom" at 48px. "For high volume, longer history, or a contract of your own." Four items: Unlimited templates; 100 versions of each; API volume agreed with you; Unlimited keys, brands and storage. "Contact sales" secondary button.
- **Template pack strip**: butter wash. "Template pack" with an "Add to Team" pill. "+10 templates for each pack, and with any pack every template keeps its last 50 versions instead of 10." "$5 per pack a month".
- **Footnote**: "Every render counts as a call, repeats included. Render a broadcast once and send the same HTML to everyone. Prices are in US dollars, before tax. Payments are processed by Stripe."

### Closing band

Section padding 88 / 72. Lavender box, radius 48, padding 72 / 40, centred. Decorative: a peach circle 200px at bottom-left (-40 / -60) and a mint rounded square 180px rotated 14 degrees at top-right. h2 52px "Ready when you are". p 19px "14 days free, no card needed. Start from a receipt, welcome email or password reset and make it yours." 56px "Start your free trial" button with an arrow.

## Numbers come from code, not the board

Every figure is formatted from `shared/plans.ts`. Never type "$5", "10,000", "10", "50" or "1 GB" in JSX.

| Board text | Source |
| --- | --- |
| $5 per user | `PRICES_USD.seat` through `formatUsd` |
| $1 per 1,000 calls | `PRICES_USD.overagePer1000Calls` |
| 10,000 calls, 10 templates, 10 versions | `INCLUDED` (`apiCalls`, `templates`, `versionsPerTemplate`) |
| $5 per pack, +10 templates, last 50 versions | `PRICES_USD.templatePack`, `TEMPLATE_PACK` |
| 14 days free | `TRIAL_DAYS` |
| 1 GB, 5 live keys, 5 brands | the paid plan's limits (`maxStorageBytes` through `formatBytes`, `maxApiKeys`, `maxBrands`); read them from the same helper the page already uses |

If a board figure disagrees with the code (it should not), the code wins and the difference goes in the report. Do not edit `shared/plans.ts` in this step.

## Work

1. **Restyle the pricing section** to the board using the shared `container`, `Kicker` and section rhythm from 9a. Three blocks in this order: Team and Enterprise side by side (stacked on phone), the pack strip, the footnote.
2. **Seat stepper keeps its labels.** The board says "Add a user" / "Remove a user"; the spec pins `'Increase seats'` / `'Decrease seats'` and a group named 'Users' (`marketing.e2e.ts:155-178`). The pin wins: keep the accessible names, the visible UI follows the board.
3. **Group names via the `tier-*` ids.** Groups 'Team', 'Enterprise' and 'Template pack' stay addressable (`marketing.e2e.ts:251`). Keep the ids and the `aria-labelledby` wiring.
4. **Closing band** as a new section after pricing. Decorative shapes are `aria-hidden`, the box has `overflow-hidden` so nothing scrolls sideways at 320px. Button gets the same CTA target as the hero.
5. **Contact section position.** Default ([decisions.md](decisions.md#d4-marketing)): keep `#contact` and its form between the closing band and the footer. Check the board does not show it; if the board omits it, still keep it (it is the only way a visitor reaches sales for Enterprise).
6. **Three "Start your free trial" links** now exist on the page (hero, Team card, closing band). Update the locators in the specs that use that name so none trips strict mode: scope to a section or use `.first()` with a comment on why.
7. **Footnote link.** The 'How to cache' link stays inside the footnote (`marketing.e2e.ts:142`), after "Render a broadcast once and send the same HTML to everyone."

## States

- No-JS: pricing and band fully visible (the spec at the no-JS test must still pass). The stepper's value renders server-side at its default of 3.
- Seat stepper: minimum 1 (minus disabled at the minimum), a sensible maximum, the total updates and is announced (`aria-live="polite"` on the total, as it is today if present).
- Hover and focus on both cards and all three buttons; visible focus ring from the global style.
- Reduced motion: nothing on the band animates; the shapes are static.
- Phone 390 and 320: cards stack Team first; the 80px "$5" and 48px "Custom" still fit; no sideways scroll; buttons full width, 44px or taller.
- Dark, if the marketing site supports it: pastel washes come from tokens.

## Pins this step must meet

| Pin | Where |
| --- | --- |
| Pricing copy lines | `marketing.e2e.ts:24-26` |
| Footnote, 'How to cache' link | `marketing.e2e.ts:136-142` |
| Seat stepper: 'Increase seats', 'Decrease seats', group 'Users', totals | `marketing.e2e.ts:155-178` |
| Groups 'Team', 'Enterprise', 'Template pack' | `marketing.e2e.ts:251` |
| No-JS visibility | the no-JS test in `marketing.e2e.ts` |
| Homepage SEO limits and JSON-LD (offers and prices) | `seo.e2e.ts`; if JSON-LD lists prices, they must still agree with `PRICES_USD` |
| No hex in components | `marketing-colour.test.ts` |
| `[data-anchor]` scroll margin on `#pricing` | keep the attribute |

Read lines 24-26, 136-178 and 251 before editing. If the board's copy differs from what a pin asserts, change the board's copy, not the pin, and list it.

## Tests

Add to `marketing.e2e.ts`: the closing band is present with its h2 "Ready when you are" and one CTA; the three trial CTAs all point at the sign-up route; no horizontal scroll at 320 (the page `scrollWidth` equals the viewport). Unit-test any new helper that formats the stepper totals.

## Out of scope

Changing prices or limits. Stripe wiring. The in-app billing page (that is the sweep in step 10).

## Done when

- Gates in the README pass.
- `marketing` and `seo` specs run signed-out through the public config and seen passing.
- Browser-checked at 1280, 768, 390 and 320.
- Report: files changed, every pin met, which numbers are code-driven, specs seen passing vs unrun.
