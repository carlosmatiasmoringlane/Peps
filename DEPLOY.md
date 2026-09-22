# Deploying Peptra

Three files in `public/` — no build step, no server, no database.

## Cloudflare Workers (what this repo is set up for)

The repo is connected to a Worker called **peps**, so every push builds and
deploys automatically. `wrangler.jsonc` is what makes that work:

```jsonc
{
  "name": "peps",
  "compatibility_date": "2026-09-22",
  "assets": { "directory": "./public" }
}
```

There is deliberately **no `main`**. A Worker with `assets` and no entry script
serves the directory as a static site and runs no code — which is exactly what
this is. Without this file, Workers Builds has nothing to deploy and fails in
about a second.

If the dashboard asks for build settings:

- Build command: `npm run build` (a no-op) or leave empty
- Deploy command: `npx wrangler deploy`
- Root directory: leave as the repo root, **not** `public`

### Custom domain

Worker → **Settings → Domains & Routes → Add → Custom domain** →
`peptra.com.co`. If the domain's DNS is already at Cloudflare, the record and
the certificate are created for you. If it is registered elsewhere, move its
nameservers to Cloudflare first — custom domains on Workers require it.

### Response headers

`public/_headers` sets a strict `Content-Security-Policy` plus `nosniff`,
`Referrer-Policy` and `Permissions-Policy`. The page loads no inline style or
script, and a test enforces that, so the policy cannot quietly break the site.

Confirm it is actually applied once deployed — support for `_headers` on
Workers static assets is newer than on Pages:

```bash
curl -sSI https://peptra.com.co/ | grep -i content-security-policy
```

If nothing comes back, the file is being ignored; move the headers into a small
Worker script, or switch the project to Cloudflare Pages, which has supported
`_headers` for years.

## Alternatives

**Cloudflare Pages** — same company, older product, `_headers` definitely
works. Build command empty, output directory `public`.

**Netlify** — *Add new site → Import an existing project*, publish directory
`public`, build command empty. Reads the same `_headers` file.

**GitHub Pages** — free and simple, and `.github/workflows/pages.yml` deploys
to it on every push to `main`. It **cannot set response headers at all**, so
`public/_headers` is ignored there and the CSP does not apply.

Its one real advantage: the build runs in GitHub Actions, so when it breaks the
log is readable in the Actions tab rather than behind a vendor dashboard.

**Enable it before merging**, or the workflow fails for want of a configured
Pages source: Settings → Pages → Source → **GitHub Actions**.

## The mailboxes have to exist

The page shows two addresses and nothing else collects enquiries, so a message
that bounces is a customer lost silently:

- `hello@peptra.com.co`
- `coa@peptra.com.co`

Forwarding is enough to start. Cloudflare Email Routing is free and takes about
five minutes. **Send a test message to both before you point anyone at the
site.**
