# 00 — Scope Lock

**Audit date:** 2026-08-01
**Repo:** `/Users/jacky/Documents/Side Projects/temply` (branch `feature/development`, HEAD `44d537a`)
**Method:** Dieter Rams ten-principle audit (`claude-mem:design-is`), evidence-first.

---

## What is being audited

All 11 user-facing routes of the Temply Next.js client (`client/`). Scope was
deliberately set to the **full surface** (user override of a narrower
recommendation); the mitigation is that every principle score in
`02-scorecard.md` tags which surface its worst instance came from.

| # | Route | Source | Surface |
|---|-------|--------|---------|
| 1 | `/` | `client/app/(marketing)/page.tsx` (191 L) | marketing |
| 2 | `/playground` | `client/app/(marketing)/playground/page.tsx` + `playground-client.tsx` | marketing |
| 3 | `/editor` | `client/app/(marketing)/editor/page.tsx` | marketing |
| 4 | `/login` | `client/app/(auth)/login/[[...rest]]/page.tsx` | auth |
| 5 | `/dashboard` | `client/app/(app)/dashboard/page.tsx` (134 L) | app |
| 6 | `/dashboard/templates` | `.../dashboard/templates/page.tsx` (72 L) | app |
| 7 | `/dashboard/api-keys` | `.../dashboard/api-keys/page.tsx` (251 L) | app |
| 8 | `/dashboard/billing` | `.../dashboard/billing/page.tsx` (254 L) | app |
| 9 | `/dashboard/settings` | `.../dashboard/settings/page.tsx` (39 L) | app |
| 10 | `/templates` | `client/app/(app)/templates/page.tsx` | app |
| 11 | `/templates/[id]` | `client/app/(app)/templates/[id]/page.tsx` + `components/email-editor.tsx` + `core/editor/*` | app (editor) |

Shared chrome in scope: `components/header.tsx`, `components/dashboard/sidebar.tsx`,
`components/ui/*`, `components/skeleton/*`, `app/layout.tsx`, `app/globals.css`,
`core/styles/*`.

## Out of scope

- Any UI/CSS/component code change (this audit ends at a `/make-plan` handoff)
- `/make-plan` and `/do` execution
- Server / API / DB layers except where they determine user-facing behaviour
- Copy rewriting (flagged only, not rewritten)
- Git handling of `.agents/`, `.claude/`, `skills-lock.json`
- Clerk's own hosted UI internals (flagged as a branding/ownership finding, not restyled)

---

## Primary users and primary tasks

Two pairs, scored in separate columns (user decision D3):

**A. Marketing surface → non-technical user (marketer / founder)**
Primary task: understand what Temply is, and build one email without touching code.
Routes 1–3.

**B. App surface → developer sending transactional email**
Primary task: create a template, obtain an API key or HTML, and send from their own app.
Routes 5–11.

This split is itself under test: pricing (`client/app/(app)/dashboard/billing/page.tsx:25-59`)
sells developer features (API keys, API call quotas, versioning) while the landing
copy (`client/app/(marketing)/page.tsx:68-70`) sells "without touching code".

## Constraints

- Next.js 15.5.20, React 19, Tailwind CSS v4, Clerk 7.5 (keyless dev mode), TanStack Query 5, Elysia server
- Existing design tokens: `client/app/globals.css` is 27 lines; `@theme` declares exactly
  two custom colours (`--color-soft-gray: #f4f5f6`, `--color-midnight-gray: #333333`).
  There is no type scale, no spacing scale, and no semantic colour token.
- Editor internals are a vendored Maily-style tree (`mly:`-prefixed utility classes) under `client/core/`.

## Reference / competitor designs

None supplied by the user. Peer set used for principle #1 judgement: Resend,
Postmark templates, Mailchimp, Beefree, react-email preview.

---

## Input materials and how evidence was collected

**Live instance.** `bun run dev` — client on `:9000`, Elysia server on `:3001`,
Clerk in keyless mode. Production build run separately for bundle numbers.

**Rendered capture.** Chrome (via extension), light and dark, per public route.
Per-route JSON captures in
`<scratchpad>/captures/*.json` — each holds computed type scale, spacing scale,
radii, colour inventory, full WCAG contrast table (oklch-aware), focus-style probe,
landmark/heading inventory, interactive-element and unlabelled-control counts.

**Build measurement.** `next build` route table — see `01-evidence.md` §Weight.

## Known gaps (declared, not hidden)

1. **App surface not rendered.** Routes 5–11 sit behind Clerk. The auditor is
   barred from creating accounts or entering credentials, so no authenticated
   session was available at capture time. Evidence for those routes is
   **source-derived and marked `INFERRED`** unless the user signs in and a
   rendered pass is added.
2. **Viewport locked at 2048×1001 CSS px** (dpr 2). `resize_window` did not change
   `innerWidth`, so no narrower breakpoint was rendered. All responsive findings
   (notably the mobile navigation gap) are **source-derived**.
3. **Keyboard focus traversal not exercised.** Synthetic `Tab` events from the
   extension did not move focus into the page. Focus-state findings are derived
   from stylesheet/source analysis plus a programmatic-focus probe, not from real
   keyboard traversal.
4. **Dark-mode screenshots** captured for `/`, `/playground`, `/editor`; `/login`
   is data-only (its surface is almost entirely Clerk-owned DOM).
5. Clerk's keyless dev widget and `cl-*` DOM are excluded from all counts.
