# Temply

A block editor for transactional email. Build the email without code, keep
templates and brands in a workspace, and pull the rendered HTML into your
own application through an API. Your app sends the mail; Temply hands you
the markup.

## Stack

| Part | What it is |
|---|---|
| `client/` | Next.js 15 (App Router). Marketing site, docs, the editor and the dashboard behind Clerk. Proxies `/api/*` to the API server. |
| `server/` | Bun + Elysia API on `:3001`. SQLite through Drizzle, the email renderer (`src/render/engine.tsx`), Stripe billing, Resend, ImageKit. |
| `shared/` | Types, plan limits, theme and contrast maths, preflight checks — imported by both sides. |

Bun is the package manager and runtime for everything. Never npm, yarn or
pnpm.

## Setup

```bash
bun install
cp .env.example client/.env     # then keep only the client block
cp .env.example server/.env     # then keep only the server block
```

`.env.example` is one file with two blocks; each side loads only its own
file. Where a key appears in both blocks the values must match
(`INTERNAL_API_SECRET`, `NEXT_PUBLIC_APP_URL`, the Clerk keys).

What you need before the app is useful:

| Service | Keys | Used for |
|---|---|---|
| [Clerk](https://clerk.com) | publishable + secret | Sign-in, organizations, team membership. Enable **Organizations** in the Clerk dashboard. |
| [Stripe](https://stripe.com) | secret, a Pro price id, webhook secret | Plans and billing. Checkout sells Pro only; Enterprise is by hand. |
| [Resend](https://resend.com) | API key, a verified sender | Test sends from the editor, contact-form delivery. |
| [ImageKit](https://imagekit.io) | public + private key, URL endpoint | Image uploads. Without it, images are URL-only. |
| [Sentry](https://sentry.io) | DSN | Error reports. Optional; nothing is sent without a DSN. |

`INTERNAL_API_SECRET` is a random string that proves a request to the API
came from the Next.js proxy. Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Running it

### Local

```bash
bun run dev
```

Client on http://localhost:9000, API on http://127.0.0.1:3001. The API
binds to loopback only: everything reaches it through the Next.js proxy.

### On a phone, same Wi-Fi

Open `http://<your LAN IP>:9000`. The LAN address must be in
`allowedDevOrigins` in `client/next.config.mjs` (one is there already;
change it to yours), or Next refuses the phone's asset requests. Note
that a plain-HTTP LAN origin is not a secure context: browser APIs like
`crypto.randomUUID` are missing there, so anything that needs them has a
fallback.

### Public address — for webhooks and testing from anywhere

```bash
bun run dev:public
```

This starts a [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/downloads/)
quick tunnel to `:9000`, writes the address into both env files as
`NEXT_PUBLIC_APP_URL`, re-points the Stripe webhook endpoint through the
API, prints the Clerk endpoint URL for you to paste into the Clerk
dashboard, then runs `bun run dev`. One address then serves the site, the
API and both webhooks — the same shape as production.

A quick tunnel's address changes every time it starts, which is why the
script does the re-pointing. Flags:

- `--url <address>` — reuse an address instead of starting a tunnel (a
  tunnel already up, or a named tunnel on your own domain, which is the
  way to make the address stop changing).
- `--no-dev` — configure only; the dev servers are already running.

Neither `bun --watch` nor `next dev` re-reads `.env`. After changing an
env file, restart the servers.

Set both webhooks up once:

- **Clerk** → Webhooks → add endpoint `<address>/api/webhooks/clerk` for
  `organization.deleted` and `user.deleted`; put the signing secret in
  `CLERK_WEBHOOK_SIGNING_SECRET`. A deleted workspace is purged and its
  subscription cancelled.
- **Stripe** → `<address>/api/webhooks/stripe` for
  `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`; secret in `STRIPE_WEBHOOK_SECRET`. The
  script creates this one for you if it does not exist. Stripe also needs
  a Customer Portal configuration (Settings → Billing → Customer portal)
  before "Manage subscription" works.

Test cards: `4242 4242 4242 4242` with any future expiry and any CVC.

## Gates

Every one of these before a change is done:

```bash
bun run typecheck            # client, server, shared
bun test                     # server + shared, 340-odd tests
cd client
bun run check:contrast       # every token pair meets its contrast threshold
bun run check:editor-contrast
bun run check:email-dark     # rendered email stays readable when a client forces dark mode
bun run check:motion         # every transition and shadow sits on a token
```

Then look at it in a browser — there is no DOM component test
infrastructure, so the browser is the test for UI. CI (`.github/workflows/ci.yml`)
runs the same list plus both production builds.

## Building

```bash
cd client && bun run build   # Next.js production build → .next
cd server && bun run build   # bundles src/index.ts → dist/
```

`next build` writes to the same `.next` the dev server uses and will
knock a running `next dev` over; restart it afterwards.

## Production

The API is a single Bun process with a SQLite file, so it runs on one
machine (a VPS, Fly, Railway — not serverless). Two ways to arrange it:

1. **One host.** Next.js and the API on the same machine; the API stays on
   loopback and Next proxies to it. One domain serves everything, and both
   webhooks point at `https://<domain>/api/webhooks/...`.
2. **Split.** Next.js on Vercel with `API_URL` pointing at the API's own
   host. The API must then bind to a reachable address; the proxy's
   `x-internal-token` is what keeps forwarded identities trustworthy.

Either way:

- Set every value in `.env.example` for production: live Clerk instance,
  live Stripe keys and price, `NEXT_PUBLIC_APP_URL=https://<domain>`,
  Resend with a verified domain, the Sentry DSNs.
- Point a health check at `GET /api/health` — 200 when the database is
  reachable, 503 when it is not.
- Back the database up. `bun run db:backup` (in `server/`) takes an
  online-safe snapshot and prunes old ones; run it from cron and ship the
  directory off the machine. `server/litestream.yml` is the continuous
  alternative.
- Confirm the facts in `client/lib/legal.ts` (operator, contact address,
  governing law) before the terms and privacy pages go live.

## Layout worth knowing

```
client/
  app/                  routes: (marketing) (auth) (app) (share), api proxy
  components/           UI; ui/ holds the primitives and surfaces vocabulary
  core/editor/          the tiptap editor
  lib/site.ts           SITE_URL and friends — the only place the domain lives
  scripts/check-*.ts    the design gates
server/
  src/routes/           one file per resource; webhooks/ for Stripe and Clerk
  src/render/           the email renderer
  src/plugins/db.ts     SQLite schema and the boot-time migrations
  scripts/backup-db.ts
shared/
  schema.ts plans.ts theme.ts preflight.ts
scripts/dev-public.ts   the tunnel workflow
```

Two theme systems that never touch: the app UI themes through the `.dark`
class and `--ds-*` tokens; the editor canvas is painted from the
template's own theme and ignores app dark mode. Colours belong in the
token layer, which is what the contrast gates enforce. `CLAUDE.md` has the
rest of the working conventions.
