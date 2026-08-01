# 02 — Scorecard

Scored by the orchestrator against the per-principle anchors. Rules applied: score the **worst
instance**, not the mean; when uncertain between two levels, take the **lower**; no weights, no
bonuses.

Per decision D2 (full-surface scope), each principle records which surface its worst instance
came from — **M** = marketing (`/`, `/playground`, `/editor`), **A** = app
(`/dashboard*`, `/templates*`), **X** = cross-cutting.

---

**1. Good design is innovative — Score: 0/3 · worst instance: M+A (whole product)**
Evidence: C2, C3 — Temply is a rebrand of the upstream `maily.to` editor, shipping unmodified
upstream assets (`core/blocks/footers.tsx:203-235`), the upstream author's personal social URLs,
their name in the preview dialog (`components/preview-email-dialog.tsx:88,90`), their CDN, and
their MIT copyright.
Justification: not 1 ("imitates with minor variation") because the editor — the product's
substance — is the upstream design carried over wholesale rather than reinterpreted; the
original contribution is a conventional dashboard/billing shell that advances nothing.

**2. Good design makes a product useful — Score: 1/3 · worst instance: A**
Evidence: D5, D6, A7, E3.
Justification: not 2 ("primary task completes but adjacent surface adds steps") because the
detours are inside the primary task, not adjacent to it — sending requires an API key
configured in a dialog the flow never points to (D5), the app-surface task costs 9 interactions
across 4 routes (D6), and below 768px the "get an API key" step is unreachable at all because
no navigation exists (A7). Not 0 only because on a desktop mouse session both tasks do complete.

**3. Good design is aesthetic — Score: 0/3 · worst instance: M (`/editor` dark)**
Evidence: B1, B2, B3, B5, A2, A3.
Justification: not 1 ("3–5 inconsistencies OR one jarring violation") because the count far
exceeds it — 17 spacing steps with 7 grid-breaking orphans, two different type scales across
surfaces plus a non-Tailwind 15px, 25 rendered colours of which **zero** are the two declared
tokens, two parallel UI kits, and a shared Button used once against ten hand-copies — and a
jarring violation exists on top (three controls rendering black-on-black). The visible
coherence is incidental to Tailwind defaults, not a system anyone can point at.

**4. Good design makes a product understandable — Score: 1/3 · worst instance: X**
Evidence: C7, C9, C5, B6, E7, C8.
Justification: not 2 ("1 control needs a tooltip") by a wide margin — the shipped default
template instructs every new user to look at a panel that does not exist (C7), the auth gate
names a different product (C9), free-plan restrictions carry the "included" checkmark (C5),
`/editor` has no h1 and no `main` (E7), and seven different product descriptions circulate
(C8). Not 0 because the primary actions themselves ("New Template", "Send") are correctly
labelled and identifiable. The decisive item is B6: a failed fetch renders as an empty state,
so the interface cannot be read as a truthful report of system state.

**5. Good design is unobtrusive — Score: 2/3 · worst instance: M (`/`)**
Evidence: A-series (chrome inventory); `app/(marketing)/page.tsx:50-51` dual radial gradients,
`:38-41` 17 decorative chips, `:153-173` duplicate CTA section.
Justification: 2 not 3 because the marketing page carries decoration that competes mildly
(gradient glows, gradient headline, a chip wall, a second CTA repeating the first); 2 not 1
because nothing dominates — the dashboard, editor and playground chrome all recede properly
and let content be the figure.

**6. Good design is honest — Score: 0/3 · worst instance: X · LOAD-BEARING**
Evidence: C1, C2, C5, C6, C4, B6.
Justification: 0 is reached on the anchor's own terms ("any deceptive flow") several times over.
The decisive items: a headline feature claim that the code actively contradicts — "Built-in
dark mode handling out of the box" against `server/src/render/engine.tsx:192-198` declaring
`color-scheme: light` and `supported-color-schemes: light` (C1); a labelled Downgrade control
with no handler while every spend-increasing path is wired (C6); restrictions displayed as
included benefits (C5); and a social-links feature that inserts a stranger's personal accounts
into users' outgoing mail (C2).

**7. Good design is long-lasting — Score: 1/3 · worst instance: M (`/`)**
Evidence: `app/(marketing)/page.tsx:61` gradient clip-text headline, `:50-51` dual radial
gradient glows, emerald-on-black accent, `rounded-xl` card language.
Justification: 1 ("2–3 dated markers") — the landing page reads as a specific 2024–25
Tailwind/shadcn-era look. Not 0 because the underlying black/white typographic core is plain
enough to survive; not 2 because there are three distinct trend markers, not one.

**8. Good design is thorough down to the last detail — Score: 1/3 · worst instance: A**
Evidence: B6, B7, E6, E9, D4, E5, E8, A6.
Justification: 1 ("2–3 states missing") — error is missing on all four data-backed routes and
silently substituted by the empty state, loading is missing on two, and focus falls back to
browser default across the whole app shell. Not 0 because empty, success and disabled states
are genuinely present and considered. The surrounding detail failures (no skip link, no
reduced-motion, a modal that is not a dialog, unlabelled fields, five pieces of dead code)
weigh against the score but do not add missing states.

**9. Good design is environmentally friendly — Score: 1/3 · worst instance: M (`/editor`)**
Evidence: D1, D2, D4, B8.
Justification: the anchors split on two axes and this lands between them. Bundle size satisfies
the level-2 test (all routes under 500 kB; heaviest is `/editor` at 407 kB) but level 2 also
requires motion to be gated, and `prefers-reduced-motion` appears nowhere in the codebase (D4)
— so level 2 is not earned. Compounding waste: Inter fetched render-blocking on every route
across its entire variable axis space while applied only inside the editor canvas, plus two
further Inter loads from two more origins (B8), and six dependencies shipped that nothing
imports (D2). Uncertainty between 1 and 2 resolves downward per the tie-breaker.

**10. Good design is as little design as possible — Score: 1/3 · worst instance: X**
Evidence: A1, A2, A3, A6, D2.
Justification: 1 ("3–5 removable elements") — a whole orphan `/editor` route duplicating
`/playground` with no inbound link, a redirect route whose only caller redirects again, a dead
exported component, six unimported dependencies, and a duplicate marketing CTA section. Not 0
because no individual audited screen is dominated by decoration or duplicated affordances; the
duplication is structural rather than on-screen. Not 2 because the removable set is well past two.

---

## Total: **8 / 30**

| # | Principle | Score | Worst-instance surface |
|---|---|---|---|
| 1 | innovative | 0 | M+A |
| 2 | useful | 1 | A |
| 3 | aesthetic | 0 | M (`/editor` dark) |
| 4 | understandable | 1 | X |
| 5 | unobtrusive | 2 | M (`/`) |
| 6 | honest | **0** | X (load-bearing) |
| 7 | long-lasting | 1 | M (`/`) |
| 8 | thorough | 1 | A |
| 9 | environmentally friendly | 1 | M (`/editor`) |
| 10 | as little design as possible | 1 | X |

**Surface split (D2 mitigation).** The marketing surface owns the aesthetic and longevity
failures; the app surface owns the usefulness and thoroughness failures; the honesty,
understandability and duplication failures are cross-cutting and originate in decisions that
predate either surface — chiefly the un-reconciled fork and the absence of any token layer.
Neither half is materially healthier than the other.

**Confidence note.** Seven of eleven routes were never rendered (see `01-evidence.md` §F.1).
Their evidence is source-derived. Because the audit scores the worst instance and every
load-bearing failure above is anchored in *measured* or *directly read* evidence rather than
inference, a rendered pass on the authenticated routes could lower individual scores but is
unlikely to raise them.
