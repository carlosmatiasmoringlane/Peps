# Peptra

Landing page and waitlist for **Peptra**, a research peptide supplier whose
premise is that the certificate of analysis is published before the order, not
after the customer asks for it.

Naming rationale, voice and design tokens: [`brand/naming.md`](brand/naming.md).

> **Read [Before you launch](#before-you-launch) first.** The catalogue figures
> and the compliance copy are drafts written to be correct in form; they need a
> real review against your suppliers' COAs and a lawyer's eye before this goes
> public.

## Run it

No dependencies to install. Node 18 or newer:

```bash
npm start           # http://localhost:3000
npm run dev         # same, restarting on change
npm test            # 8 tests, no network
```

## What's here

```
public/         the landing page — index.html, styles.css, app.js
server/         waitlist API and static file server (no dependencies)
test/           node:test suite covering the API end to end
brand/          naming rationale, voice, design tokens
data/           waitlist.jsonl lands here (gitignored)
```

The hero chromatogram is drawn on a canvas from four Gaussian peaks defined in
`public/app.js`. The purity figure on the page is the main peak's share of total
integrated area computed from those same peaks — so the picture and the number
cannot drift apart. If you change the peaks, update the integration table in
`index.html` to match.

## The waitlist

Double opt-in. Signing up records a **pending** subscriber and emails a
confirmation link; **nobody joins the list and no position is assigned until
that link is clicked.** The address you hold is therefore always one someone
proved they control.

```
POST /api/waitlist        {"email":"you@lab.edu","context":"academic"}
  -> 201 {"ok":true,"state":"pending","resent":false}
  -> 200 {"ok":true,"state":"pending","resent":true}          already pending
  -> 200 {"ok":true,"state":"already_confirmed","position":4}  no second email

GET  /confirm?token=...       assigns the next position, renders the result
GET  /unsubscribe?token=...   removes them, renders the result
POST /unsubscribe?token=...   RFC 8058 one-click, returns {"ok":true}
```

Storage is an **append-only event log** — `signup`, `confirm`, `unsubscribe`,
one JSON object per line, replayed in order at boot. Nothing is ever rewritten,
so a torn write costs at most the last event, the file stays readable with
`tail` and `grep`, and the record of who confirmed when is the consent evidence
you may later have to produce.

What it does for you:

- **Assigns positions on confirmation, not signup**, so an unconfirmed address
  can't sit on place #1 forever. Positions are never reused.
- **Never emails a confirmed address again** from the form. Re-submitting is how
  a signup form gets turned into an outbound spam cannon.
- **Resends the original link** when someone pending signs up again, so the
  earlier email keeps working.
- **Reports a send failure honestly** (502) instead of saying "check your inbox"
  when nothing was sent. The address is kept, so a retry resends.
- **Rate limits** to 8 requests per IP per 10 minutes, checked before any work.
- **Catches bots** with a hidden `company` field — a filled honeypot gets a
  cheerful `200`, stores nothing and sends nothing.
- **Treats unsubscribe as sacred**: idempotent, works on an unknown token, and
  never makes someone trying to leave feel they failed.

### Email

Set `MAIL_PROVIDER` to `postmark` or `resend` (both over plain `fetch`, no
dependency) and `PUBLIC_URL` to the real domain. The default, `console`, prints
the confirmation link to the log and sends nothing — which is what you want in
development, and which the server warns loudly about if it sees `NODE_ENV=production`.

Every message carries `List-Unsubscribe` and `List-Unsubscribe-Post`, which
Gmail and Yahoo require of bulk senders. Adding a provider is one adapter in
`server/mailer.js`.

### Getting the list out

```bash
ADMIN_TOKEN=$(openssl rand -hex 24) npm start
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3000/api/waitlist/export.csv -o waitlist.csv
```

The export is **confirmed subscribers only** — pending and unsubscribed rows are
left out rather than waiting for a careless send to pick them up. `?all=1`
returns everything with a `status` column, for auditing.

Cells beginning `=`, `+`, `-` or `@` are prefixed with an apostrophe, because
those characters are legal in an address local part and a spreadsheet would
otherwise treat the cell as a formula.

`data/waitlist.jsonl` is gitignored — it is personal data, and it must not end
up in the repository.

### Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3000` | Listen port |
| `ADMIN_TOKEN` | *unset* | Bearer token for CSV export; export is off while unset |
| `WAITLIST_FILE` | `data/waitlist.jsonl` | Where signups are appended |
| `TRUST_PROXY` | `0` | Set to `1` to read the client IP from `X-Forwarded-For` |
| `RATE_LIMIT_MAX` | `8` | Signup attempts per IP per window |
| `RATE_LIMIT_WINDOW_MS` | `600000` | Rate limit window |
| `PUBLIC_URL` | `http://localhost:$PORT` | Base for links in email — **must** be your real domain |
| `MAIL_PROVIDER` | `console` | `console`, `postmark` or `resend` |
| `MAIL_FROM` | `Peptra <hello@peptra.com.co>` | Envelope sender |
| `POSTMARK_TOKEN` / `RESEND_API_KEY` | *unset* | Required by the matching provider |

## Deploying

**Copy-paste commands for Fly.io, Render and plain Docker: [`DEPLOY.md`](DEPLOY.md).**

`Dockerfile`, `fly.toml` and `render.yaml` are checked in and ready. There is no
build step. Three things are not optional:

1. **A persistent volume at `/data`**, or every redeploy wipes the waitlist.
2. **`TRUST_PROXY=1`** behind TLS, so the rate limiter sees real client
   addresses instead of your proxy's — and so HSTS is sent.
3. **`ADMIN_TOKEN`** set to a random secret, or CSV export stays disabled.

Responses carry a strict `Content-Security-Policy` (the page loads no inline
script or style), plus `nosniff`, `Referrer-Policy` and `Permissions-Policy`.
`SIGTERM` drains in-flight requests and flushes queued writes before exit, so a
redeploy cannot drop an acknowledged signup.

### When to replace the flat file

The JSONL store is honest about its limits. Move to Postgres when any of these
becomes true:

- **More than one instance.** Both the store and the rate limiter are per
  process; two instances means two half-lists and double the real rate limit.
- **No persistent disk.** Most container platforms give you an ephemeral
  filesystem by default.
- **Past ~50k signups.** The whole file is replayed into memory at boot.

`server/store.js` is the whole surface to reimplement: `add`, `count`,
`positionOf`, `all`, `toCsv`. Nothing else touches storage.

### Still to build

Double opt-in, one-click unsubscribe and the consent log are in place. What is
left is account setup, not code:

- **A sending provider account** (Postmark or Resend) and its token.
- **SPF, DKIM and DMARC** on the sending domain, or your launch announcement
  lands in spam. Both providers walk you through the records.

Nothing on the page tracks anyone today; add analytics if you want to know which
section converts.

## Before you launch

Four things on this page are placeholders that look like facts. They have to be
made true or removed:

1. **The catalogue figures.** Molecular formulas and weights in `§ 03` are drawn
   from commonly cited reference values, not from a supplier COA. Check every
   row against your actual manufacturer's documentation.
2. **The release specification.** `§ 02` describes a QC programme — independent
   ISO/IEC 17025 re-assay of every lot, published COAs, cold-chain handling.
   That is the entire promise of the brand. Either fund it or change the copy;
   publishing it before it exists is the one mistake this business cannot
   survive.
3. **The compliance copy.** `§ 06` is drafted for a **research-use-only**
   supplier. That framing is load-bearing: it is what separates this from
   distributing unapproved drugs. A business selling peptides for human use is a
   different company — it needs a licensed compounding pharmacy or a
   telehealth-and-prescriber structure, and none of this copy applies. Have a
   regulatory attorney read the page against the jurisdictions you intend to
   ship to.
4. **`hello@peptra.com.co`** in the footer. The domain is registered, but the
   mailbox has to exist before anyone writes to it — set up forwarding at the
   registrar if nothing else.
