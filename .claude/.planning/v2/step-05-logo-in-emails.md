# Step 5: The logo in customers' emails

Wave B, after step 1. The riskiest step to get wrong, because the file is hot-linked from mail already delivered. Read [decision B8](decisions.md#b8-emails-already-sent-keep-their-logo) first.

## Goal

New templates start with the new mark. Mail and templates that already exist are not changed behind anyone's back.

## What is there now

| Place | Today |
| --- | --- |
| `client/lib/starter-templates.ts:35` | A `logo` node, `src: '/brand/mark.png'`, `size: 'md'`, left aligned |
| `client/lib/default-editor-json.json:7` | The editor's default document, same `src` |
| `client/lib/starter-templates.test.ts:31` | Pins `'/brand/mark.png'` for the personalised welcome starter |
| `server/src/render/engine.tsx:301-312` | `absoluteSrc` makes a root-relative `src` absolute with the app's origin, so every render hot-links the file. **Read only; do not edit** |
| `client/core/editor/nodes/logo/logo.ts`, `logo-view.tsx` | The Logo block: sizes `sm`, `md`, `lg` |
| `client/public/brand/mark.png`, `logo.png` | The v1 violet tile, 512 by 512. Frozen |

## Work

1. **Find out how the Logo block sizes its image.** Read `logo.ts`, `logo-view.tsx` and where the renderer emits the `<img>` (a width, a height, or both). The old file was square (512 by 512); the new mark is **9:8** (360 by 320). Report what `md` renders as: if it sets only a width, the logo gets shorter; if it sets both, it distorts. Pick the file's pixel size so `md` looks right at 2x, and do not change the block's sizes unless the numbers force it, in which case stop and say so.
2. **Fetch** `temply-mark.png` ([assets.md](assets.md), "Step 5"). It is 1024 px wide, which is heavy for an email. Re-render it at twice the `md` width (transparent background) and save it as **`client/public/brand/temply-mark-email.png`**. Say its byte size; aim for a few KB.
3. **Point new content at it**: `starter-templates.ts:35`, `default-editor-json.json:7`, and the pin in `starter-templates.test.ts:31` (replaced with the new path, not loosened). Add a comment where the path is set, in prose, that emails hot-link this file by absolute URL, so a rebrand adds a new file and the old ones stay as they were sent.
4. **Leave `mark.png` and `logo.png` byte for byte unchanged.** `git diff` must show no change to either. Step 4 stops using `logo.png` for JSON-LD; that does not make it deletable yet.
5. **Check the dark-client gate.** The gradient mark sits on whatever the mail client paints. Run `check:email-dark`; look at the starters rendered on white and on a forced-dark ground and report whether the coral end holds up. Logos are exempt from WCAG contrast, but a mark that vanishes in dark mail is still a bug.

## Pins to keep

- `starter-templates.test.ts`: every starter still validates and personalises; only the logo path changes.
- The renderer's `absoluteSrc` behaviour, unchanged. If an existing render test asserts the old path, it asserts it for an old document and stays.
- No change to the Logo block's public sizes (`sm`, `md`, `lg`) without a decision.

## States

New workspace (starters), a template made before v2 (still shows the violet tile: expected, report it), the editor's default document, and a published version pinned by an app (renders the same HTML it did).

## Done when

- Gates pass with counts, including `check:email-dark`.
- `git diff --stat` shows `mark.png` and `logo.png` untouched.
- A rendered starter, as HTML, shows an absolute URL ending `/brand/temply-mark-email.png` that returns 200; the report shows the string.
- The report says plainly that templates created before v2 keep the old logo and that this is by [decision B8](decisions.md#b8-emails-already-sent-keep-their-logo).
