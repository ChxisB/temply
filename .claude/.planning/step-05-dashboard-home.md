# Step 5: Dashboard home

Board: [board/app-home.html](board/app-home.html). Route: `/dashboard`.
Starts now. Depends only on the templates list (step 4, done).

## Goal

Bring the signed-in home to the board: greeting and New template, a next-step banner, starter chips, recent templates as cards, usage as tiles.

Today it is `PageHeader`, then the five-step `GetStarted` card, then `RecentTemplates`, then `UsageSection`.

## The board, in order

Main column: padding 44 / 52 / 56, gap 36.

| Block | Spec |
| --- | --- |
| Header | h1 44px / 1.05 display "Welcome back, {first name}"; 18px muted line "Your emails, your team, and a clear next step."; right: **New template** pill, 52px tall, plus icon, lifted accent shadow |
| Next step | `section` labelled "Next step". Lavender wash, radius 28, padding 24 / 28. 56px white icon tile (radius 18, shield-check). Eyebrow "NEXT STEP" 13px / 700 / 0.08em. Title 24px display. Detail 15px. Primary button 48px |
| Starters | h2 24px "Start from a starter". Pill chips, 44px tall, white, 1.5px border, violet plus icon, 15px / 600. Seven: Blank, Welcome, Verify email, Password reset, Receipt, Team invite, Product update |
| Recent templates | h2 24px + "View all →" (min 44px tall). Grid `repeat(auto-fit, minmax(240px, 1fr))`, gap 18. Card: white, radius 24, padding 12 / 12 / 18, lifts 3px on hover. 140px thumbnail (radius 16, pastel wash, mini email). Title 18px / 700. Pill (dot + label, 28px) left, relative time right |
| Usage | h2 24px + "This month". Tiles: radius 24, padding 22. Label 15px muted. Value 34px display with "of N" in 15px muted. 10px bar, pastel track, solid fill: lavender, mint, peach |

Sidebar and trial card are step 3 and already done.

## What exists to build on

| Need | Use |
| --- | --- |
| Pill words and tones | `templatePill(row)` in `client/lib/template-stage.ts`. The templates list already uses it, so a template in sign-off reads "In sign-off" on both. `recent-templates.tsx` currently uses `templateStatus` and `TEMPLATE_STATUS_BADGE` only, so it cannot show "In sign-off" or "In staging". Switch it |
| Which template needs a look | `stageOf(row)` and `nextStep(stage, isAdmin)` in the same file. `sortByStage` already ranks waiting, staging, draft, live |
| The seven starters | `STARTER_TEMPLATES` in `client/lib/starter-templates.ts` has exactly the board's seven, ids `blank`, `welcome`, `verify-email`, `password-reset`, `receipt`, `invite`, `announcement` |
| Create from a starter | The mutation inside `NewTemplateButton` (`httpPost('/api/v1/templates', …)` then open). Extract it to a hook both use. Do not copy it |
| Relative time | `client/lib/relative-time.ts` (new, untracked, already tested) |
| Review destination | `/templates/{id}/review` exists |

## Work

1. **Widen the row projection.** `client/app/(app)/dashboard/page.tsx:64-73` trims each template to seven fields before it crosses into the client. `stageOf` needs `staged_at`, `review_requested_at` and `returned_at`, and `live_version` is read by `GetStarted`. Carry them. Everything else still stays out of the RSC payload (no content, no theme).
2. **Next-step banner** (`client/components/dashboard/next-step-banner.tsx`, pure, props in). Pick the template by `sortByStage` priority, first of: waiting, staging, draft with unpublished changes. Copy by stage, default table in [decisions.md](decisions.md#d1-next-step-banner). Button goes to the template's review or editor route. Hidden when nothing needs attention (everything is live). Names are not available: `review_requested_by` is an id, so the detail says "Moved to sign-off {relative time}", not "Priya moved it". Resolving names is a server change and out of scope.
3. **Starter chips** (`starter-chips.tsx`). Seven chips from `STARTER_TEMPLATES`, each creates the template and opens it, with a pending state per chip and the same error toast as the gallery. Disabled when `atLimit` or `readOnly`. Still shown when the templates fetch failed (they need no list).
4. **Recent templates as cards.** Rework `recent-templates.tsx` rows into the board's cards. Keep `role="region"` named "Recent templates", `listitem` rows containing the title, "View all" going to the whole list, and the five-most-recent cap. Thumbnails: reuse `template-thumbnail.tsx` from step 4; wash colour from the pill tone.
5. **Usage tiles.** Restyle `usage-section.tsx` as tiles. Add **Storage** from `billing.usage.storageBytes` against the plan's storage limit (check `limits` for the field). Keep **Members**: a spec pins it. Four tiles at `minmax(220px, 1fr)`.
6. **Order** on the page: header, banner, starters, recent, usage.
7. **Retire `GetStarted`** per [decisions.md](decisions.md#d1-next-step-banner), and delete `get-started.tsx` if nothing else imports it.

## States (all designed)

- Loading: `dashboard/loading.tsx` matches the new order (banner block, chip row, three card skeletons, tiles).
- Templates fetch failed: `ErrorState` in Recent (not the empty state). Banner hidden, starters still shown.
- Billing fetch failed: usage section says so for itself, as today. Banner and starters unaffected.
- Empty account: no banner. Recent shows `EmptyState` pointing at the starters. First-run path is the chips.
- Read-only (lapsed) or at the template limit: New template and chips disabled; the billing banner already explains why, so the page does not repeat it.
- Enterprise: counts with "no limit" and no bar, as the spec pins.
- Phone (390): header wraps, chips wrap, cards one column, tiles stack, every control 44px or taller.
- Dark: pastel washes come from tokens; check the banner and tiles in `.dark`.

## Pins this step must meet

| Pin | Where |
| --- | --- |
| h1 matches `/^Welcome back/` | `dashboard-home.e2e.ts:52`, `auth.e2e.ts:45`, `fixtures/session.ts:36` |
| Regions "Usage" and "Recent templates" | `dashboard-home.e2e.ts:13-14` |
| "Live API calls this month", "Templates", "Members" labels; `no limit` twice; no `progressbar` for Enterprise | `dashboard-home.e2e.ts:57-67` |
| Status words match the templates list | `dashboard-home.e2e.ts:93-107` |
| Five most recent, last-touched first | `dashboard-home.e2e.ts:109` |
| "View all" goes to the list; no sideways scroll; calls and templates tiles side by side on desktop, stacked on phone | `dashboard-home.e2e.ts:131-160` |
| 44px touch targets on phone | `dashboard-home.e2e.ts:162` |

Adding a Storage tile for an Enterprise workspace may add a third "no limit". If it does, change the count in the spec and say so in the report. Do not hide the text.

## Tests to add or change

- Unit: `next-step-banner.test.tsx` (each stage, admin vs not, hidden when live, copy), `starter-chips.test.tsx` (seven, disabled states, pending), update `recent-templates.test.tsx`, `usage-section.test.tsx`, `page.test.tsx`.
- e2e, in `dashboard-home.e2e.ts`: section order by bounding box (banner, starters, recent, usage); banner for a template in sign-off (seed through the API the way `signoff.e2e.ts` does); a starter chip creates a template and opens the editor; Storage tile present.

## Out of scope

Server changes. Names of who requested sign-off. Per-template check counts and "Needs a look" (needs a server change, deferred earlier).

## Done when

- Gates in the README pass.
- `bun run e2e -- dashboard-home` is green. If it cannot run here, the report says so and lists the spec as edited-but-unrun.
- Checked at 1280 and 390, light and dark.
- Report: files changed, pins met, decisions taken from `decisions.md`, specs run vs unrun.

## Outcome (2026-10-06)

Built by the implementer, reviewed by the code-reviewer, three must-fix findings applied by the main session. Nothing committed.

**Seen passing, run from this checkout after the fixes:** `bun run typecheck`, `bun run lint`, `bun test` (1352 pass, 0 fail), and the four client gates (`check:contrast`, `check:editor-contrast`, `check:email-dark`, `check:motion`).

**Not run:**
- `bun run e2e -- dashboard-home`. `client/.env` and `e2e/.env` have empty Clerk keys and `DATABASE_URL`, and nothing listens on 5432. A stale `bun serve.ts` (pid 11421, orphaned, from 14:03) also holds `e2e/.tmp/run.lock`; it was left alone.
- The 1280 and 390 check, light and dark. Three pins rest on unit tests alone: tiles side by side on desktop and stacked on phone, no sideways scroll, 44px targets on phone.

**Fixed after review.** A 200-character title no longer pushes the banner past the page edge (`break-words`). The banner action is the primary button at `md`. The banner and chip icons use `text-accent-ink`, since `text-accent` on the raised fill measured 2.71:1 in dark. `live_version` is no longer projected on the dashboard. `locale-date.ts` and its test are deleted. The contrast-gate and hook comments say what they do.

**Calls made that `decisions.md` does not cover:** the banner picks from the whole list and hides when the list fetch fails; tile minimum 13rem rather than 220px; banner radius is the `rounded-card` token, not 28px; recent grid is `auto-fill`; tile bar fills use the `-ink` colours, with three new pairs in `check-contrast.ts`.

**Open, for the user or step 10:**
- Storage warns at 80% on the home and 90% on `settings/plan/page.tsx:400`. The reviewer's view is that the plan page should move to `usageTone`; that is a file outside this step.
- A starter chip's busy state is held per surface after the response. Another surface (the New template dialog) is free between the response and the redirect, and if the route never changes the pick stays held until unmount. The hook's comments now say so. A shared "navigating" flag would close it.
- Wash tracks sit at about 1.01 to 1.29:1 against the raised card, so an empty bar is nearly invisible. The reviewer suggests `bg-track` or a hairline.
- `statBarTones` in `surfaces.tsx` repeats `TONE_FILL` in `usage-tone.ts`.
- `dashboard-home.e2e.ts:81-83` clicks "Blank" straight after `goto`, before hydration. Low risk; `templates.e2e.ts:23` has the same pattern.
- Design drift: header New template is 48px against the board's 52px; eyebrow tracking is 0.1em against 0.08em; `loading.tsx` draws three tile skeletons where Team has four.
- A never-published draft reads "has unpublished changes", as D1 is written.
- Step 3's layout has 44px bottom padding against the board's 56px.
