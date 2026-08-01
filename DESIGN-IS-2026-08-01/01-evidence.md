# 01 — Evidence

Consolidated from five parallel evidence subagents (structural, visual, copy & honesty,
weight & friction, accessibility) plus orchestrator-run browser and build measurement.
Every entry carries a `file:line`, a capture-file field, or a command output.

**Orchestrator corrections applied to subagent reports** are marked **[CORRECTED]**.

---

## A. Structural

**A1. `/editor` is an orphan route.** `grep` for `href="/editor"` / `push('/editor')` across
the whole `client/` tree returns zero hits. It is a second, structurally distinct email
editor (`app/(marketing)/editor/page.tsx:59-182`) duplicating the purpose of `/playground`,
reachable only by typing the URL.

**A2. The shared `Button` component is used once.** `components/ui/button.tsx:6-31` defines
`buttonVariants`/`Button`; its only consumer is `components/email-preview-iframe.tsx:100-108`.
Ten other CTAs re-implement the same black/white treatment inline:
`components/header.tsx:28`, `app/(marketing)/page.tsx:76`, `app/(marketing)/page.tsx:166`,
`components/dashboard/new-template-button.tsx:36`, `app/(app)/dashboard/api-keys/page.tsx:90`,
`app/(app)/dashboard/api-keys/page.tsx:240`, `app/(app)/dashboard/billing/page.tsx:229`,
`components/email-editor-sandbox.tsx:32-33`, `components/version-history-dialog.tsx:122`,
`components/copy-email-html.tsx:58`.

**A3. Two parallel UI kits.** `components/ui/*` vs `core/editor/components/*` (`mly:`-prefixed):
- `components/ui/select.tsx:1-73` vs `core/editor/components/ui/select.tsx:1-97` — near
  line-for-line duplicates; the app copy still carries leftover `mly-` classes
  (`components/ui/select.tsx:41-42,49,63-64`), evidencing copy-paste.
- `components/ui/button.tsx` vs `core/editor/components/base-button.tsx:1-63`
- `components/ui/dropdown-menu.tsx` vs `core/editor/components/ui/dropdown-menu.tsx`
- `components/ui/tooltip.tsx` vs `core/editor/components/ui/tooltip.tsx`
- `components/ui/input.tsx` vs `core/editor/components/input.tsx`
- `components/skeleton/color-picker.tsx` vs `core/editor/components/ui/color-picker.tsx`

**A4. Duplicated empty-state markup**, hand-coded three times:
`app/(app)/dashboard/page.tsx:98-107`, `app/(app)/dashboard/templates/page.tsx:33-42`,
`app/(app)/dashboard/api-keys/page.tsx:125-131`.

**A5. Duplicated card styling** (`rounded-xl border border-gray-200 bg-white … dark:bg-white/[0.03]`)
inline at `app/(app)/dashboard/page.tsx:43,55,69`, `api-keys/page.tsx:98,202`,
`billing/page.tsx:118,169`, `components/email-editor-sandbox.tsx:160,195,224,299`.

**A6. Dead code.**
- `components/google-analytics.tsx:1` — `isDev` computed, never used; component returns `null`
  (`:3-5`) yet is still mounted at `app/layout.tsx:47`.
- `components/dashboard/sidebar.tsx:17,18` — `disabled: false` props never read.
- `components/preview-text-info.tsx:1-26` — exported, never imported anywhere.
- `app/(app)/templates/page.tsx:1-6` — redirect-only route; its sole inbound reference
  (`components/delete-email-dialog.tsx:35` → `router.push('/templates')`) immediately bounces
  again. A redirect to a redirect.
- `app/(app)/dashboard/settings/page.tsx:7,10-16` — `isDark` state tracked but never
  referenced in the Clerk `appearance` object.

**A7. No mobile navigation below 768px.** `app/(app)/dashboard/layout.tsx:10` renders the
sidebar as `hidden w-60 shrink-0 md:block`. `grep -rn "md:hidden|lg:hidden|Sheet|Drawer|MobileNav|hamburger"`
across `app/` and `components/` returns **zero matches**. Consequence: on a narrow viewport a
signed-in user on any of the five dashboard routes cannot move between sections, cannot reach
the `UserMenu` (sign-out lives only in `sidebar.tsx:56`), and cannot return to `/dashboard`
except via the URL bar or browser back.

---

## B. Visual

**B1. Spacing scale — 17 distinct steps, 7 orphans.**
`/` 6,8,12,16,24,32,40,64,96,128,160 · `/playground` 2,6,8,10,12,16,20,24,32,40 ·
`/editor` 4,6,8,10,12,16,20,24,32,40,50,80.
Union: 2,4,6,8,10,12,16,20,24,32,40,50,64,80,96,128,160. Values 2, 10, 20, 50 break any 8px grid.
Source: `captures/{root,playground,editor}__light.json` → `audit.spacingScale`.

**B2. Type scale — 9 sizes, two different scales per surface.**
`/` 14,16,18,20,36,72 · `/playground` 12,14,15,18,20,30 · `/editor` 14,15,18,30.
The `15px` value is non-Tailwind and comes from `core/styles/_editor.css:94`
(`p:not(…) { font-size: 15px; margin-bottom: 20px; }`), sitting 1px from both `text-sm` (14)
and `text-base` (16) — three near-duplicate steps.

**B3. 25 rendered colours, zero of them tokens.** Union across all captures: 15 text, 10
background, 5 border → 25 unique hex. `app/globals.css:6-8` declares exactly two theme colours
(`--color-soft-gray: #f4f5f6`, `--color-midnight-gray: #333333`) and **neither hex appears in
any captured surface**. 100% of rendered colour is ad-hoc Tailwind utility classes.

**B4. Contrast failures (measured).**

| Route/theme | Ratio | Pair | Element | Source |
|---|---|---|---|---|
| `/` light | **2.47** / **2.37** | `#00bc7d`/`#00b8db` on `#ffffff` | H1 gradient span (72px/700, needs 3.0) | `app/(marketing)/page.tsx:61` |
| `/` dark | 10.83 / 11.6 | emerald-400/cyan-400 on `#000000` | same span | PASS |
| `/` dark | 4.35 | `#71717b` on `#000000` | footer copyright | `app/(marketing)/page.tsx:176,178` |
| `/` dark | 4.35 | `#71717b` on `#000000` | footer "GitHub" link | `app/(marketing)/page.tsx:176,183` |
| `/playground` light | **2.60** | `#99a1af` on `#ffffff` | h2 "Email Details" | `components/email-editor-sandbox.tsx:225` |
| `/playground` light | **2.60** | `#99a1af` on `#ffffff` | button "+ Add" | `components/email-editor-sandbox.tsx:268` |
| `/playground` light | 4.36 | `#e7000b` on `#fef2f2` | "Delete" | `components/delete-email-dialog.tsx:35,41` |
| `/playground` dark | 4.35 | `#71717b` on `#000000` | h2 "Email Details" | `components/email-editor-sandbox.tsx:225` |
| `/playground` dark | 4.35 | `#71717b` on `#000000` | button "+ Add" | `components/email-editor-sandbox.tsx:268` |
| `/editor` dark | **1.00** | `#000000` on `#000000` | 3× `<select>` (Font/Fallback/Size) | `components/skeleton/select-native.tsx:13` |

**[CORRECTED]** The capture recorded the `/` H1 at ratio 1.00 in both themes. That figure is a
tooling artifact: `bg-clip-text` + `text-transparent` makes `getComputedStyle().color` resolve
to the backdrop, not the painted gradient. The orchestrator recomputed the real gradient stop
colours (`scratchpad/grad.mjs`, output at `captures/_token-contrast.txt`): light mode is
**2.47:1 (emerald-500) and 2.37:1 (cyan-500) against white — both fail the 3.0 large-text
threshold**; dark mode passes at 10.83/11.6. The finding stands; the ratio does not.

Note also that `text-gray-400` (2.60) and its dark replacement `dark:text-zinc-500` (4.35)
**both** fail AA — the dark-mode variant is not a fix.

**B5. Dark-mode invisible-control defects.** Root cause pattern: a light-only colour with no
`dark:` counterpart on a surface whose background does go dark.
1. `components/skeleton/select-native.tsx:13` — `text-black`, no `dark:`, and no `bg-*` at all
   (`appearance-none`), so `body{dark:bg-black}` (`app/globals.css:24-26`) shows through:
   black text on black. Three live instances via `app/(marketing)/editor/page.tsx:672-702`
   (Font / Fallback / Size). **Measured 1.00.**
2. `components/ui/input.tsx:11` — hardcoded `bg-white`, no `dark:bg-*`, no explicit text colour;
   used at `components/api-key-config-dialog.tsx:12,122` inside a `dark:bg-zinc-900` dialog
   (`components/ui/dialog.tsx:35`) that inherits `dark:text-white` → **white text on white**.
3. `components/api-key-config-dialog.tsx:109` — raw `<select>` with `bg-white`, no `dark:`.
4. `components/skeleton/color-picker.tsx:49,59` — `bg-white`, no `dark:`.
5. `components/ui/tooltip.tsx:17` and `components/ui/popover.tsx:24` — `bg-white`/`text-black`
   with no `dark:` at all; internally legible but never adapt.
6. `components/delete-email-dialog.tsx:64` — Cancel `bg-gray-100`, no `dark:`.

Excluded as intentional: `mly:bg-white`/`mly:text-black` inside `#mly-editor`
(`core/editor/nodes/html/html-view.tsx:50`, `core/editor/components/content-menu.tsx:135,151`) —
the email canvas is deliberately always-light to mirror email-client rendering.

**B6. Error states are swallowed and rendered as empty states.**
- `app/(app)/dashboard/templates/page.tsx:16` —
  `const { templates = [] } = res.ok ? await res.json() : { templates: [] };`
  A failed fetch renders the "No templates yet" empty state (`:33-42`), indistinguishable from
  a genuinely empty account.
- `app/(app)/dashboard/page.tsx:19,22-23` — same pattern.
- `app/(app)/dashboard/api-keys/page.tsx:38` — `const { data, isLoading } = useQuery(...)`;
  no `isError`. A failed query falls through to the empty state at `:124`.
- `app/(app)/dashboard/billing/page.tsx:75,97` — same; a failed query renders the user as
  **free tier** regardless of what they actually pay.

**B7. Loading state missing** on `/dashboard` (`page.tsx:10-22`) and `/dashboard/templates`
(`page.tsx:10-16`) — server components awaiting with no Suspense fallback. Present on
`/dashboard/api-keys` (`:120-123`) and `/dashboard/billing` (`:101-107`).

**B8. Fonts.** `app/layout.tsx:41-46` loads Inter render-blocking from Google Fonts across the
full variable axis space (roman + italic, opsz 14–32, wght 100–900) on **every** route.
Captured `fontFamilies` is `["ui-sans-serif"]` on `/` and `/playground`, and
`["ui-sans-serif","Inter"]` only on `/editor`. Inter is applied solely inside the `#mly-editor`
canvas. A **second, independent Inter** is loaded from a different CDN for the canvas
(`app/(marketing)/editor/page.tsx:203-205`, jsdelivr), and a **third** Google Fonts stylesheet
is written into the preview iframe (`components/email-preview-iframe.tsx:34`).

---

## C. Copy & honesty

**C1. "Dark Mode Support" is false — the product opts out of dark mode.**
Landing claim (`app/(marketing)/page.tsx:16-19`): *"Templates that respect reader preferences.
Built-in dark mode handling out of the box."*
Reality: `server/src/render/engine.tsx:192-198` sets
`{ name: 'color-scheme', content: 'light' }` and
`{ name: 'supported-color-schemes', content: 'light' }` in `DEFAULT_META_TAGS`, explicitly
declaring light-only support to email clients. `grep` for `prefers-color-scheme` across
`server/src/render/` and `shared/` returns **zero** matches. The only `prefers-color-scheme`
in the repo is `app/layout.tsx:54`, which themes the app's own UI and has no effect on
exported email HTML.

**C2. "Social Links" ships another person's identity into users' emails. [CORRECTED]**
The copy & honesty subagent reported this feature as "not implemented — fabricated claim."
That is **wrong**. It is implemented, and the actual state is worse:
`client/core/blocks/footers.tsx:203-235` defines LinkedIn / YouTube / Twitter social blocks whose
- icons hotlink to **`https://cdn.usemaily.com/images/icons/{linkedin,youtube,twitter}.png`** —
  the upstream project's CDN, a third-party domain Temply does not control; and
- links are hardcoded to the **upstream author's personal accounts**:
  `https://www.linkedin.com/in/arikchakma/` (`:207`),
  `https://www.youtube.com/arikchakma` (`:221`),
  `https://x.com/imarikchakma` (`:235`).
Any user who inserts a footer block sends a stranger's social profiles to their own recipients.

**C3. Un-scrubbed upstream fork artifacts.** 8 occurrences of `usemaily`/`arikchakma` across
`client/`:
- `components/preview-email-dialog.tsx:88,90` — the Preview Email dialog always renders sender
  avatar "AC" and name **"Arik Chakma"**, regardless of the actual user.
- `core/editor/extensions/slash-command/default-slash-commands.tsx:64` — block preview image
  from `https://cdn.usemaily.com/previews/header-preview-xyz.png`.
- `core/blocks/footers.tsx:203-235` — see C2.
- `core/editor/utils/variable.ts:33` — references `github.com/arikchakma/maily.to`.
- Root `license` — MIT, "Copyright (c) Arik Chakma".

**C4. Unsubstantiated claims.**
- `app/(marketing)/page.tsx:69` — "Open-source, privacy-first". No privacy policy or
  data-handling disclosure exists in the repo. The Resend API key is stored in an `HttpOnly`
  cookie (`server/src/routes/config.ts:22`) with no encryption at rest.
  **[CORRECTED]** — `components/google-analytics.tsx:3-5` returns `null`, so no analytics ship;
  the "privacy-first" claim is unsubstantiated, not contradicted by GA.
- `app/(marketing)/page.tsx:180` — footer GitHub link is the bare placeholder
  `https://github.com`, while the hero badge (`:56`) reads "Open-source email builder". Nothing
  in the app links to an actual repository.
- `lib/default-editor-json.json:66` — *"Templates render cleanly across all major email clients,
  including Outlook."* No Outlook or client-rendering regression tests exist in the repo.

**C5. Free-plan limitations render as "included".**
`app/(app)/dashboard/billing/page.tsx:28-35` declares
`{ text: '0 API keys', included: true }` and `{ text: 'No versioning', included: true }`.
Render logic at `:192-196` maps `included: true` → green `CheckIcon`, `false` → grey `XIcon`.
Result: two hard restrictions display with the same green checkmark as the genuine benefit
"3 templates". Only "API access" gets the X.

**C6. The "Downgrade" control is inert.** `app/(app)/dashboard/billing/page.tsx:212-217` —
the `isDowngrade` branch renders a `<button>` with `className` only and **no `onClick`**.
The sibling branches all wire behaviour: `Current Plan` is `disabled` (`:206-211`),
`Switch Plan` calls `createPortal()` (`:219-224`), `Upgrade` calls `createCheckout()`
(`:226-236`). Every path that increases spend works; the labelled downgrade path does nothing.
Cancellation remains reachable only via "Manage Subscription" (`:150-157`).

**C7. The shipped default template misdirects every new user.**
`lib/default-editor-json.json:40` — *"Everything you see here is built from components on the
left."* This body ships into `/editor` (`app/(marketing)/editor/page.tsx:138`), `/playground`,
`/templates/[id]` (`components/email-editor-sandbox.tsx:23,119`), and every newly created
template (`components/dashboard/new-template-button.tsx:8,21`). In `/editor` the settings panel
is on the **right** (`app/(marketing)/editor/page.tsx:149`, `border-l` panel after the `grow`
content); in `/playground` and `/templates/[id]` there is **no side panel at all** — blocks are
inserted via an inline `/` slash-command menu.

**C8. Seven distinct product descriptions.**
1. `app/layout.tsx:9` — "Temply - Beautiful email templates, built fast"
2. `app/layout.tsx:11` — "…drag-and-drop email template builder that makes crafting stunning,
   responsive emails effortless."
3. `app/(marketing)/page.tsx:60-64` (H1) — "Email templates, built with blocks."
4. `app/(marketing)/page.tsx:67-70` — "…drag-and-drop email editor…without touching code."
5. `app/(marketing)/playground/playground-client.tsx:10` (H1) — "Email Editor"
6. `app/(app)/templates/[id]/page.tsx:11` — "Template | Temply"
7. `/editor` — no H1 and no route metadata; falls back to (1) while never using that phrase.

**C9. The auth gate names a different product.** `app/(auth)/login/[[...rest]]/page.tsx:14`
renders a bare `<SignIn signUpForceRedirectUrl="/templates" />` with no `appearance` or
`localization` prop, and `ClerkProvider` (`app/layout.tsx:38`) passes none either. Clerk's
default card title renders as **"Sign in to My Application"** — confirmed by the orchestrator in
the browser on both `/login` and the middleware redirect target. Additionally,
`middleware.ts:3-9` calls `auth.protect()` with no `unauthenticatedUrl`/`signInUrl`, so
signed-out users hitting `/dashboard` are sent to Clerk's **hosted domain**
(`wired-tortoise-89.accounts.dev`) rather than the app's own `/login` route — observed directly.

**C10. Positioning contradiction.** Copy targets non-coders ("without touching code",
`page.tsx:69`; "No coding", `:101`) while the paid tiers sell developer capabilities —
API keys, API call quotas, versioning (`app/(app)/dashboard/billing/page.tsx:36-59`).

**C11. Verified-true claim.** "Resend Integration — send straight from the editor"
(`page.tsx:32-34`) works end to end, including for signed-out `/playground` users:
`components/api-key-config-dialog.tsx` → `POST /api/v1/config` → `server/src/routes/config.ts:12-24`
(HttpOnly cookie, no auth check) → `components/email-editor-sandbox.tsx:131-145` →
`server/src/routes/emails.ts:15-32` → `new Resend(config.apiKey).emails.send(...)`.

---

## D. Weight & friction

**D1. Bundle (production `next build`, Next 15.5.20).** Shared baseline 103 kB.
`/` 107 kB · `/dashboard` 123 kB · `/dashboard/templates` 120 kB · `/dashboard/api-keys` 127 kB ·
`/dashboard/billing` 127 kB · `/dashboard/settings` 147 kB · `/login` 150 kB ·
`/playground` 155 kB · `/templates/[id]` 155 kB · **`/editor` 407 kB** (260 kB route-specific,
+304 kB over baseline, 252 kB more than the next-heaviest route). Middleware 90.2 kB.

**D2. Six declared dependencies are never imported anywhere in `client/`:**
`@antfu/utils`, `csstype`, `entities`, `isbot`, `tiny-invariant`, `zustand`.
`yjs` is a seventh edge case — declared as a direct dependency (`client/package.json:66`) but
never imported by name; it is only reachable transitively as `y-prosemirror`'s peer.
`y-prosemirror` itself is used for exactly one function pair
(`core/editor/plugins/drag-handle/drag-handle-plugin.ts:19-22`) in a single-user editor with no
`Y.Doc` or provider instantiated anywhere.

**D3. External origins on `/`.** `fonts.googleapis.com` (preconnect `app/layout.tsx:41` +
render-blocking stylesheet `:43-46`) and `fonts.gstatic.com` (preconnect `:42`, second hop).
**[CORRECTED]** — the weight subagent listed Google Analytics as a third origin without reading
the component. `components/google-analytics.tsx:3-5` returns `null`; no analytics request is made.

**D4. Motion is never gated.** `grep -rn "prefers-reduced-motion"` across all of `client/`
returns **zero** matches. Animations that do run — `animate-spin` loaders in 14 files, Radix
`animate-in fade-in-0 zoom-in-95` on tooltip/dialog/dropdown content, tippy.js transitions
(`drag-handle-plugin.ts:421`), `nprogress` (`components/navigation-loader.tsx`) — all run
unconditionally. Idle-screen animation count is 0 on every captured route
(`captures/*.json` → `audit.idleAnimations`).

**D5. Two disconnected API-key surfaces.** The editor's `ApiKeyConfigDialog`
(`components/api-key-config-dialog.tsx`, client-side cookie config, provider defaults to
`'resend'` at `:50`) and the server-managed `/dashboard/api-keys` page share no query key and
no cross-link. A first-time user can press Send and fail with only a toast
(`components/email-editor-sandbox.tsx:133`) and no prior indication that configuration was required.

**D6. Steps to complete the primary tasks.**
- **A (marketing):** `/` → "Try the Editor" (`page.tsx:75`) → `/playground` → Subject + From + To
  (`email-editor-sandbox.tsx:230-262`) → Send (`:186-189`). Minimum **4 interactions**, but the
  send fails unless an API key was separately configured in a dialog the flow never points to.
- **B (app):** sign in → "New Template" (single click, zero fields,
  `new-template-button.tsx:20-25`) → navigate to `/dashboard/api-keys` → "Create Key" → name →
  "Create" → copy (shown once only, `api-keys/page.tsx:103`) → back to `/templates/[id]` →
  three fields → Send. **9 discrete interactions across 4 routes.**

---

## E. Accessibility

**E1. One `aria-label` in the entire client tree** — `components/theme-toggle.tsx:24`.
Icon-only controls throughout the editor rely on Radix `Tooltip`, which wires
`aria-describedby` (a *description*), not an accessible *name*. Confirmed instances with empty
accessible names: `core/editor/components/content-menu.tsx:132-140` (add node),
`:148-160` (node actions / drag handle),
`core/editor/components/text-menu/turn-into-block.tsx:38-45`,
and the shared `core/editor/components/bubble-menu-button.tsx:10-21` factory used across the
text, column, image, inline-image, repeat, section, spacer and variable bubble menus.

**E2. `/editor`: 18 of 27 interactive elements have no accessible name**
(`captures/editor__light.json` → `audit.unlabeledInteractive`). All from the sidebar panel:
6 colour-swatch buttons (`components/skeleton/color-picker.tsx:32-42`), 6 `HexColorInput`
fields, 6 `NumberInput` fields (`app/(marketing)/editor/page.tsx:628-666`). In each case a
visible `<label>` sits in a sibling `<div>` with no `htmlFor`/`id` pairing.

**E3. Drag-and-drop has no keyboard path.** `core/editor/plugins/drag-handle/drag-handle-plugin.ts:338-374,474-518`
registers only `dragstart`/`dragend` and `mousemove`/`mouseleave`; there is no `keydown` handler.
The content menu (add / duplicate / delete block) only becomes visible and positioned on
`mousemove` (`:486-517`), so a keyboard-only user cannot summon it at all. The product's
headline interaction — "drag, drop, and arrange content blocks" (`app/(marketing)/page.tsx:8-9`)
— is mouse-only.

**E4. DOM order diverges from visual order in the editor.**
- The content menu container is appended once to `editor.view.dom.parentElement`
  (`drag-handle-plugin.ts:407-409`) and repositioned visually via tippy on every `mousemove`
  (`:486-517`) — fixed tab position, floating visual position.
- `core/editor/components/text-menu/text-bubble-menu.tsx:41-43` only overrides tippy's
  `appendTo` if a caller supplies one; otherwise it defaults to `document.body`, placing
  formatting controls at the very end of the tab order while they visually sit at the cursor.
No positive `tabIndex` values exist anywhere (only `-1` and one `0`).

**E5. The "Create API Key" modal is not a dialog.**
`app/(app)/dashboard/api-keys/page.tsx:215-248` is a plain `<div className="fixed inset-0…">`
with no `role="dialog"`, no `aria-modal`, no focus trap and no Escape handler — Tab escapes to
the page behind the overlay. The same codebase builds other modals correctly on Radix
(`components/api-key-config-dialog.tsx:82-149`, `components/delete-email-dialog.tsx:39-87`).

**E6. Focus-visible coverage is a two-tier split.** Of 128 `.tsx` files under `app/`,
`components/`, `core/`, only **31 (24%)** contain any `focus:`/`focus-visible:` class; 20 of
those 31 live under `core/editor/**`. Zero matches in all ten app-chrome files checked:
`app/(marketing)/page.tsx`, `components/header.tsx`, `components/dashboard/sidebar.tsx`,
`app/(app)/dashboard/page.tsx`, `app/(app)/dashboard/billing/page.tsx`,
`app/(app)/dashboard/templates/page.tsx`, `components/theme-toggle.tsx`,
`components/dashboard/user-menu.tsx`, `components/dashboard/new-template-button.tsx`,
`components/dashboard/template-actions.tsx`. Defined at `components/ui/button.tsx:7`,
`components/ui/input.tsx:11`, `core/editor/components/base-button.tsx:31`.
The editor engine has designed focus states; the shell that wraps it does not.

**Methodology note.** The orchestrator's programmatic focus probe reported
`visibleFocusRing: false` for every element on every route (7/7, 15/15, 27/27). That probe is
**unreliable** — `.focus()` does not trigger `:focus-visible`. Synthetic `Tab` events from the
browser extension also failed to move focus into the page. The two-tier conclusion above is
source-grounded, not probe-grounded.

**E7. Landmarks and headings.**
`/` → `header`, `footer`, **no `main`** (`app/(marketing)/page.tsx:46` uses a bare `<div>`).
`/playground` → `header`, `main`. `/editor` → `header` only, **and `h1Count: 0`**.
`/templates/[id]` (INFERRED) → `header` only, no `main`, no h1.
Dashboard routes (INFERRED) → `aside`, `nav`, `main`, **no banner/`header`**.
`/` has duplicate heading text "Pre-Built Components" at both `H3`
(`app/(marketing)/page.tsx:22,117`) and `H2` (`:132-134`).

**E8. Form labels.** Associated: Subject / From / To / Reply-To
(`components/email-editor-sandbox.tsx:230-283`, `<Label htmlFor>` + `id`), and the
`ApiKeyConfigDialog` fields (wrapping `<Label>`).
**Not associated:** Preview Text (`components/email-editor-sandbox.tsx:288-294` — plain
`<label>`, no `htmlFor`, input has no `id`); the "Create Key" name field
(`app/(app)/dashboard/api-keys/page.tsx:222-229` — **no label at all**, placeholder only);
and 12 fields in the `/editor` sidebar (`app/(marketing)/editor/page.tsx:359-616`).

**E9. No skip link on any route** (`captures/*.json` → `audit.skipLink: false`; `grep -ri
"skip.*content|skip-link"` returns nothing).

---

## F. Known gaps

1. **The seven authenticated routes were never rendered.** The auditor is barred from creating
   accounts or entering credentials, and the user did not sign in during the audit window. All
   findings for `/dashboard`, `/dashboard/templates`, `/dashboard/api-keys`,
   `/dashboard/billing`, `/dashboard/settings`, `/templates`, `/templates/[id]` are
   source-derived and marked `INFERRED`. No measured contrast, computed colour, or real DOM
   order exists for them.
2. **`/login` capture is near-empty** (`totalVisibleEls: 3`, `interactiveCount: 0`) — the Clerk
   widget had not painted into the scanned DOM. Its branding defect was confirmed visually by
   screenshot instead. No light-mode `/login` capture exists.
3. **The contrast walker misses native form-control text.** `/editor` captures report
   `contrastFailCount: 0` in both themes despite the confirmed black-on-black `<select>`.
   `contrastFailures[]` is therefore **undercounting** on any route with native form controls.
4. **Viewport locked at 2048×1001** — `resize_window` did not change `innerWidth`. All
   responsive findings (A7) are source-derived.
5. **Keyboard traversal never exercised** — see E6 methodology note.
6. **Conditionally-rendered surfaces were never open during capture**: colour-picker popovers,
   `ApiKeyConfigDialog`, delete confirmations, version history. Their dark-mode defects (B5
   items 2–6) are source-confirmed only.
7. Dependency-usage claims (D2) were scoped to `client/`; a dependency consumed via re-export
   from `@temply/shared` would not have been caught.
