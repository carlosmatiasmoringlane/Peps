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

`POST /api/waitlist`

```json
{ "email": "you@lab.edu", "context": "academic", "source": "hero" }
```

Replies `201 {"ok":true,"position":1,"duplicate":false}`, or `200` with
`"duplicate":true` if the address is already in. Errors come back as
`{"error":"..."}` with a 400, 429 or 500.

What it does for you:

- **Deduplicates** on the lowercased address, and tells a repeat signup their
  original position instead of pretending it worked.
- **Rate limits** to 8 requests per IP per 10 minutes (`RATE_LIMIT_MAX`,
  `RATE_LIMIT_WINDOW_MS`).
- **Catches bots** with a hidden `company` field. A filled honeypot gets a
  cheerful `200` and is silently discarded, so scrapers learn nothing.
- **Survives restarts.** Records append to `data/waitlist.jsonl`, one JSON
  object per line, replayed into memory at boot. A torn final line from an
  interrupted write is skipped rather than crashing the process.

### Getting the list out

```bash
ADMIN_TOKEN=$(openssl rand -hex 24) npm start
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3000/api/waitlist/export.csv -o waitlist.csv
```

Export is disabled entirely until `ADMIN_TOKEN` is set. `data/waitlist.jsonl`
is gitignored — it is personal data, and it must not end up in the repository.

### Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3000` | Listen port |
| `ADMIN_TOKEN` | *unset* | Bearer token for CSV export; export is off while unset |
| `WAITLIST_FILE` | `data/waitlist.jsonl` | Where signups are appended |
| `TRUST_PROXY` | `0` | Set to `1` to read the client IP from `X-Forwarded-For` |
| `RATE_LIMIT_MAX` | `8` | Signup attempts per IP per window |
| `RATE_LIMIT_WINDOW_MS` | `600000` | Rate limit window |

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

Collecting signups works today. **Sending to them does not** — there is no mail
provider wired in, and the page already promises a launch email and a one-click
unsubscribe. Before any broadcast you need double opt-in, `List-Unsubscribe`,
and SPF/DKIM/DMARC on the sending domain. See
[`DEPLOY.md`](DEPLOY.md#still-required-before-you-send-email).

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
4. **`hello@peptra.com`** in the footer, and the domain itself. Neither was
   verified — outbound DNS is blocked in the environment this was built in.
