# Decisions

Nothing here blocks the work. Every open call has a default the step files already use, and each says what it costs to change later. Reply to any of them and the step files get edited before the agent starts.

Two parts: **A** calls the orchestrator already made (the paste), which you have not confirmed. **B** new ones this plan surfaced.

## A. Calls already made, awaiting your yes

| # | Call | Why | Cost to reverse |
| --- | --- | --- | --- |
| A1 | Template delete has **no Undo** | The server hard-deletes, the dialog says "cannot be undone", and `templates.e2e.ts:40-44` pins that | **High.** A real Undo needs soft-delete on the server plus a migration (expand, then contract), then the spec changes. A client-only "Undo" toast would be a lie, so it is not an option |
| A2 | Sidebar trial bar still measures **API usage**; the board's bar shows trial time elapsed | The binding trial limit is calls. `trialEndsAt` and `trialDaysLeft` exist and the card already shows days left | **Small**, client only. Swap the bar's value to elapsed days, or show both. The card text does not change |
| A3 | Theme toggle and account menu are **gone from the editor header**, reachable only from the dashboard | Matches the board. The canvas ignores app dark mode anyway | **Small.** Re-add to the header. Check `header.e2e.ts` for a pin before relying on this |
| A4 | The anonymous **playground stays in the old style** | The board only shows the signed-in editor; `marketing.e2e.ts:116` pins its heading | **Medium.** Restyling the `!framed` paths of the library, aside and header is a step of its own |
| A5 | Where the board conflicts with something an e2e spec pins, **the pin wins** | A spec weakened to fit a mockup is how regressions ship | **Per case.** Edit the spec and the component together. The step files list each conflict (for example the seat stepper's "Increase seats" against the board's "Add a user") |
| A6 | Landmark **"Add content" becomes "Components"** in step 7, spec pins updated | It is the board's word, and the rename is mechanical | **Trivial.** One string and `template-workspace.e2e.ts:88-89` |

## B. New decisions, with defaults

### D1. Next-step banner

The home page gets one card that says what to do next. The old five-step `GetStarted` checklist goes.

**Default.** The banner picks, in priority order: a template **in sign-off** (`waiting`), then one **in staging** (including "Sent back"), then the most recently edited template that has unpublished changes or is a draft. It is **hidden** when every template is live, and when there are no templates (the starter chips are the first-run path).

Priority is `sortByStage` in `client/lib/template-stage.ts`; the first row of the sorted list wins, unless it is `live`.

Copy, by what the banner picked:

| Picked | Title | Detail | Button |
| --- | --- | --- | --- |
| In sign-off, admin | "{title} is ready for your sign-off" | "Moved to sign-off {relative time}" | **Review** to `/templates/{id}/review` |
| In sign-off, not admin | "{title} is waiting for sign-off" | "Moved to sign-off {relative time}" | **View sign-off** to the same route |
| In staging | "{title} is in staging" | "Staged {relative time}. Ask for sign-off when it is ready." | **Open** to `/templates/{id}/review` |
| Sent back | "{title} was sent back" | "Sent back {relative time}. Make the changes, then ask for sign-off again." | **Open** to `/templates/{id}/review` |
| Draft or unpublished changes | "{title} has unpublished changes" | "Edited {relative time}." | **Open** to `/templates/{id}` (the editor) |

Rules behind the table:

- The button always **navigates**; it never mutates. `nextStep` returns labels like "Move to staging" and "Ask for sign-off" that are actions, and a dashboard button that says that and then only opens a page would mislead. Use `nextStep`'s label only when its action is `review`; otherwise "Open".
- No names. `review_requested_by` is an id; resolving it is a server change and is out of scope.
- Banner copy and pill words must agree with the list. The pill comes from `templatePill`, so "In sign-off", "In staging" and "Sent back" mean the same everywhere.

**What this costs.** `GetStarted` was onboarding: a visible five-step path for a new account. The banner plus the seven starter chips replaces it, but a brand-new workspace no longer sees a checklist (connect your app, invite a teammate). That is a visible loss. `get-started.tsx` is in git history, so reversing is a restore plus one import, but the page order then needs rethinking.

### D2. Usage tiles

**Default.** Four tiles: API calls, Templates, **Storage** (new, from `billing.usage.storageBytes`), and **Members** (kept). The board shows three (no Members). `dashboard-home.e2e.ts:57-67` pins the "Members" label, so by A5 it stays. If Storage adds a third "no limit" for Enterprise, the spec count changes and the report says so.

**To change.** Drop Members and edit those spec lines. One tile and one assertion.

### D3. Editor rails

| Question | Default |
| --- | --- |
| Where do the theme panel and "Connect your app" go? | Below the five email fields in the right rail, in that order. The board is silent; both exist today and must not vanish (`design.e2e.ts` pins the theme panel) |
| Where does preflight live? | The board's "All clear" card **is** the preflight summary, a button toggling the existing `preflightExpanded`. `PreflightPanel` stays where `checks.e2e.ts` expects it |
| "...or drag it onto the email" | Dropped from the hint unless drag works. Click-to-insert is real, so the hint says only that. Do not ship a claim the product cannot meet |
| How are the eleven blocks grouped? | CONTENT: Text, Heading, Subheading, Image, Logo, Button. LAYOUT: Columns, Divider, Spacer, Section, Repeating list. Nothing removed; the collapsed strip shows all eleven |
| Does collapsed state persist? | Yes, per rail, in `localStorage` (try/catch, works without it). Restoring on load does not animate |
| Collapse on tablet and phone? | No. The collapse buttons are hidden below `lg` where the layout stacks |
| The `@` "Make it personal" tip | Kept, inside the hint callout |
| A rail left collapsed on a hard reload | Paints open, then snaps shut once after hydration (the height cap adds a small second snap on the rail's lower part). **Accepted for now by the user, 2026-10-06.** A cookie read server-side is the fix if it bothers anyone later. Client navigation from the dashboard is unaffected |

**To change.** All of these are inside `components-rail` and `email-settings-rail`; none touches the canvas or the server.

### D4. Marketing

- **Contact form.** The board has no `#contact` section. Default: **keep it**, between the closing band and the footer. It is how a visitor reaches sales for Enterprise ("Contact sales" targets it). Removing it is a product call and breaks the footer's Contact link.
- **`#blocks` and the "Blocks" nav entry** stay; `marketing.e2e.ts` pins them. The board's workflow bento uses different words, so the section keeps its anchor and the card inside takes the board's copy.
- **Seat stepper names** stay "Increase seats", "Decrease seats" and the group "Users", not the board's "Add a user" and "Remove a user" (A5).
- **Free trial card stays.** Decided by the user 2026-10-06. The board has no Free trial card and the first 9b pass removed it and its pinned group (`marketing.e2e.ts`, the four-card radius loop). The 14-day trial is part of the offer, so the card, its pin and the line saying the workspace turns read-only when the trial ends are restored, with every figure from the trial limits in `shared/plans.ts`. The step 9b brief's pin list had left 'Free trial' out; that was the brief's omission, not the implementer's.
- **Three "Start your free trial" links** will exist (hero, Team card, closing band). The specs get scoped locators. The links do not get renamed to dodge strict mode.
- **Mobile menu button keeps the name Menu** (the HEAD pin); the redesign's "Open menu" had no decision behind it.

### D5. Commit strategy

About 91 changed entries are uncommitted, across all the redesign steps. You decide when to commit, and nothing here commits or pushes.

**Default (recommended), after step 10:** layered commits, so each one reviews and reverts on its own, in this order, each passing `typecheck` and `lint` by itself:

1. `feat(ui): ...` tokens and primitives (everything else depends on them)
2. `feat(shell): ...` sidebar, nav, user menu, trial card
3. `feat(templates): ...` list, pills, thumbnails, menu
4. `feat(dashboard): ...` step 5
5. `feat(editor): ...` frame, header, rails
6. `feat(marketing): ...` header, footer, hero, pricing, closing band
7. `test(e2e): ...` spec changes with the layer that needs them, so a spec ships beside what it tests (the repo rule), not as a final lump

Use `git add -p` or path lists per layer. The risk: a file shared by two layers (`globals.css`, `home-client.tsx`) has to be split by hunk, which is fiddly.

**Alternative:** one `feat: redesign` squash. Faster, one revert, no hunk-splitting, but a 91-file diff to review and bisect.

**Either way:** conventional prefixes, and no push.

### D6. The design bundle

`.claude/Temply redesign.html` is untracked and 2.4 MB, a packed copy of the Claude Design board.

**Default.** Do not commit it. Keep it on disk, and hide it from `git status` with `.git/info/exclude` (local only, no repo change). The readable pages the work needed already live in `.claude/.planning/board/` (about 70 KB, markup only), which is enough to implement from.

**Options.** Commit it (a 2.4 MB blob in history forever, and the board will drift from the product); commit only `board/` (small, readable, but a second source of truth); delete it once step 10 closes.

When step 10 closes, `.claude/.planning/` itself is yours to keep as the record, move under `.claude/completions/`, or delete.

## Also noted

- **Memory.** `redesign-2026-10.md` is stale and contradicts itself on Undo. Step 10 rewrites it. Until then, this file and the README are the authority.
- **Nothing here needs a server change.** If an agent concludes it does, it stops and says so rather than starting one.
