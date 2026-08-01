# 04 — `/make-plan` Handoff

Copy everything inside the fence into a fresh session. It is self-contained — the next session
does not need this audit directory to act on it.

````
/make-plan Redesign the Temply web client (Next.js 15 / React 19 / Tailwind v4, repo root `client/`). Current design failed a Dieter Rams ten-principle audit at 8/30, with 0 scores on principles #1 innovative, #3 aesthetic, and #6 honest, and 1 scores on #2 useful, #4 understandable, #7 long-lasting, #8 thorough, #9 environmentally friendly, and #10 as little design as possible.

Verdict paragraph (quoted from the audit):
> Temply scores 8/30 and fails the load-bearing honesty principle outright, because the product ships claims its own code contradicts, another project's identity inside its users' emails, and an interface that reports failure as emptiness — none of which a restyling pass can reach.

Why redesign and not refine: principle #6 (honest) scored 0, which is load-bearing, and the total of 8 is well under the REFINE threshold of 20. The defects originate below the visual surface — an un-reconciled upstream fork, the absence of any token layer actually in use, a data pattern that renders failure as emptiness, and a headline interaction with no keyboard path. Restyling cannot reach any of the four.

Preserve from current design:
- The restrained chrome posture — principle #5 scored 2/3; dashboard, editor and playground shells recede and let content be the figure.
- The black / white / emerald core palette and plain typographic base — legible and unfashionable in the good sense.
- `client/components/ui/button.tsx:6-31` — the `cva` variant structure is a sound primitive; it was scored against only because it is used exactly once in the whole app.
- `client/core/editor/components/base-button.tsx:31` — the editor engine's focus-ring treatment is correctly designed; use it as the template for the shell rather than inventing a new one.
- Radix dialog usage at `client/components/api-key-config-dialog.tsx:82-149` and `client/components/delete-email-dialog.tsx:39-87` — correct focus-trapped modal pattern already present.
- The three empty states (`client/app/(app)/dashboard/page.tsx:98-107`, `.../templates/page.tsx:33-42`, `.../api-keys/page.tsx:125-131`) — present, considered, well-worded; they need a sibling error state, not replacement.
- The Resend send path — verified working end to end, including for signed-out playground users: `client/components/api-key-config-dialog.tsx` → `POST /api/v1/config` → `server/src/routes/config.ts:12-24` → `client/components/email-editor-sandbox.tsx:131-145` → `server/src/routes/emails.ts:15-32`.
- `client/app/layout.tsx:52-58` — the blocking theme-bootstrap script prevents a flash of wrong theme.

Discard:
- The un-reconciled fork identity layer. Evidence: `client/core/blocks/footers.tsx:203-235` (social blocks whose icons hotlink `https://cdn.usemaily.com/...` and whose links point at `linkedin.com/in/arikchakma/`, `youtube.com/arikchakma`, `x.com/imarikchakma`), `client/components/preview-email-dialog.tsx:88,90` (hardcoded sender "Arik Chakma"), `client/core/editor/extensions/slash-command/default-slash-commands.tsx:64`, `client/core/editor/utils/variable.ts:33`. Caused failure on principles #1 and #6.
- Tailwind-utilities-as-design-system. Evidence: `client/app/globals.css:6-8` declares exactly two colour tokens (`--color-soft-gray: #f4f5f6`, `--color-midnight-gray: #333333`) and neither hex appears in any of the 25 colours actually rendered; spacing runs to 17 steps with 7 grid-breaking orphans (2, 4, 10, 20, 50, 80 among them); type runs to two different scales across surfaces plus a non-Tailwind 15px from `client/core/styles/_editor.css:94`. Caused failure on principle #3.
- The dual UI kit. Evidence: `client/components/ui/select.tsx:1-73` versus `client/core/editor/components/ui/select.tsx:1-97` are near line-for-line duplicates, with leftover `mly-` prefixed classes still in the app copy at `client/components/ui/select.tsx:41-42,49,63-64`. Same duplication for button, input, tooltip, dropdown-menu and color-picker. Caused failure on principles #3 and #10.
- The orphan `/editor` route. Evidence: `client/app/(marketing)/editor/page.tsx:59-182` is a second, structurally distinct editor duplicating `/playground`; grep for `href="/editor"` or `push('/editor')` across the whole client tree returns zero hits. Caused failure on principle #10.
- The swallow-errors-into-empty-state data pattern. Evidence: `client/app/(app)/dashboard/templates/page.tsx:16` (`const { templates = [] } = res.ok ? await res.json() : { templates: [] };`), `client/app/(app)/dashboard/page.tsx:19,22-23`, and the `useQuery` sites at `client/app/(app)/dashboard/api-keys/page.tsx:38` and `client/app/(app)/dashboard/billing/page.tsx:75,97` which destructure only `data, isLoading` with no `isError`. Caused failure on principles #4 and #8.
- `hidden md:block` as the entire mobile navigation strategy. Evidence: `client/app/(app)/dashboard/layout.tsx:10`; grep for `md:hidden|lg:hidden|Sheet|Drawer|MobileNav|hamburger` across `app/` and `components/` returns zero matches. Caused failure on principle #2.

Top 5 moves from the audit (verbatim):
1. (#6 honest) Make every user-facing claim match the code, or delete the claim. Either emit real dark-mode CSS from the render engine or remove the "Dark Mode Support" feature card — today `server/src/render/engine.tsx:192-198` declares `color-scheme: light` and `supported-color-schemes: light` while `client/app/(marketing)/page.tsx:16-19` sells "Built-in dark mode handling out of the box". In the same pass: strip every upstream identity artifact, wire or remove the inert Downgrade control at `client/app/(app)/dashboard/billing/page.tsx:212-217` (it renders a `<button>` with className only and no `onClick`, while the sibling Upgrade and Switch Plan branches at `:219-236` are both wired), and render restrictions as restrictions rather than green checkmarks (`client/app/(app)/dashboard/billing/page.tsx:28-35` marks `'0 API keys'` and `'No versioning'` as `included: true`, and `:192-196` maps `included: true` to a green CheckIcon).
2. (#4 understandable) Make the interface tell the truth about system state. Give every data-backed route a distinct error state, separate from empty. Today a failed fetch is silently coerced to an empty result and drawn as "you have nothing" — and on billing, as "you are on the free plan". Evidence: `client/app/(app)/dashboard/templates/page.tsx:16`, `client/app/(app)/dashboard/page.tsx:19,22-23`, `client/app/(app)/dashboard/api-keys/page.tsx:38`, `client/app/(app)/dashboard/billing/page.tsx:75,97`.
3. (#3 aesthetic) Establish one token layer and drive every surface from it. Colour, type and spacing scales declared once in `client/app/globals.css` and consumed everywhere — which also eliminates the invisible-control bug class at its root, since a semantic token cannot be light-only the way `text-black` at `client/components/skeleton/select-native.tsx:13` is. That single class currently renders three `<select>` controls (Font, Fallback, Size) as black text on a black background in dark mode, measured contrast 1.00. Collapse the two UI kits onto that layer.
4. (#2 useful) Give the app surface navigation that survives a phone, and one API-key flow. Below 768px the sidebar is removed with no replacement and a signed-in user cannot move between dashboard sections or sign out (sign-out lives only inside the sidebar, `client/components/dashboard/sidebar.tsx:56`). Separately, the editor's `ApiKeyConfigDialog` and the `/dashboard/api-keys` management page share no link and no state, so a first-time Send fails with only a toast (`client/components/email-editor-sandbox.tsx:133`).
5. (#2 useful / #8 thorough) Give block manipulation a keyboard path and every control a name. Drag-and-drop is registered on mouse events only (`client/core/editor/plugins/drag-handle/drag-handle-plugin.ts:338-374,474-518` — `dragstart`/`dragend` and `mousemove`/`mouseleave`, no `keydown`), and the block menu appears solely on `mousemove` (`:486-517`), so the product's headline interaction is unreachable without a mouse. The entire client tree contains exactly one `aria-label` (`client/components/theme-toggle.tsx:24`); `/editor` has 18 of 27 interactive elements with no accessible name.

Redesign principles in priority order:
1. Honest (#6) — success is that every claim on the marketing surface is traceable to shipped behaviour, every label maps 1:1 to what its control does, and no third party's identity appears in a Temply user's output.
2. Understandable (#4) — success is that a first-time user names every primary control correctly, the auth gate says "Temply" rather than Clerk's default "Sign in to My Application" (`client/app/(auth)/login/[[...rest]]/page.tsx:14` passes no `appearance`, and `client/middleware.ts:3-9` calls `auth.protect()` with no `signInUrl`, so signed-out users land on Clerk's hosted domain), and the interface never reports a failure as an absence.
3. Aesthetic (#3) — success is that spacing, type and colour obey one declared system with no orphan styles, and no control is invisible in either theme.
4. Useful (#2) — success is that both primary tasks complete without detours, at any viewport, with a keyboard.
5. As little design as possible (#10) — success is that no route, component kit, or dependency exists that nothing reaches.

Two primary users to design against (they are currently in tension, and resolving that tension is part of this work):
- Marketing surface → non-technical user. Primary task: understand what Temply is and build one email without touching code.
- App surface → developer sending transactional email. Primary task: create a template, obtain an API key, send from their own app.
The tension: landing copy sells "without touching code" (`client/app/(marketing)/page.tsx:69`, `:101`) while every paid tier sells developer capability — API keys, API call quotas, versioning (`client/app/(app)/dashboard/billing/page.tsx:36-59`). Pick a position rather than inheriting both.

Deliverables for the plan:
- New information architecture, not derived from the current route tree — decide explicitly whether `/editor` and `/playground` remain two things, and whether `/templates` survives as a redirect.
- New primary flow for each of the two users, low-fi and labelled, shown side by side against the current flow (current app-surface flow costs 9 discrete interactions across 4 routes).
- Token decisions: type scale, spacing scale, and a colour count cap — current state is 25 rendered colours, 17 spacing steps, 9 type sizes, and 2 declared tokens that nothing uses.
- States checklist per route: empty, loading, error, success, focus, disabled — error is the one currently missing everywhere and is the highest-value addition.
- A responsive contract with an explicit narrow-viewport navigation model.
- Keyboard contract for the block editor, including how block insertion, reordering, duplication and deletion are reachable without a mouse.
- Honesty audit on every user-facing string before ship, checked against actual behaviour rather than intent.
- Migration path for users on the current design, and cutover criteria for retiring it.

Anti-patterns to guard against:
- Porting the old structure under new styling — particularly re-creating the dual UI kit under new class names.
- Keeping both designs behind a flag indefinitely.
- Redesigning toward a current trend rather than the principles above; the present landing page already carries three trend markers (gradient clip-text headline at `client/app/(marketing)/page.tsx:61`, dual radial gradient glows at `:50-51`, emerald-on-black accent) which is why #7 scored 1.
- Treating the Preserve list as optional — principle #5 scored 2/3 and that restraint is the one thing the current design gets right.

Known gaps in the audit this plan should close early: seven of eleven routes (`/dashboard`, `/dashboard/templates`, `/dashboard/api-keys`, `/dashboard/billing`, `/dashboard/settings`, `/templates`, `/templates/[id]`) were never rendered because the auditor could not authenticate, so their evidence is source-derived. Render them before finalising the plan. Also note the audit's contrast walker does not evaluate native `<select>`/`<option>` text, so measured contrast-failure counts undercount on any route with native form controls.
````
