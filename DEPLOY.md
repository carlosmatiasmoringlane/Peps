# Deploying Peptra

Three files in `public/` — no build step, no server, no database. Any static
host will serve it, most of them free.

## Cloudflare Pages (recommended)

Sensible default if your domain is already at Cloudflare, since DNS is then
one click rather than a record you copy by hand.

1. **Workers & Pages → Create → Pages → Connect to Git**, pick this repository.
2. Build settings:
   - Framework preset: **None**
   - Build command: *leave empty*
   - Build output directory: **`public`**
3. **Save and Deploy.** You get a `*.pages.dev` URL in about a minute.
4. **Custom domains → Set up a domain →** `peptra.com.co`. Cloudflare adds the
   DNS record itself and issues the certificate.

Every push to `main` redeploys. Pull requests get their own preview URL.

## GitHub Pages

No extra account, but it serves from the repository root, so `public/` needs
publishing as the site root via an action rather than a branch setting.

1. **Settings → Pages → Source: GitHub Actions.**
2. Add `.github/workflows/pages.yml`:

```yaml
name: Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: public
      - id: deploy
        uses: actions/deploy-pages@v4
```

3. **Settings → Pages → Custom domain →** `peptra.com.co`, then add the
   `CNAME` record it shows you at your registrar.

## Netlify

**Add new site → Import an existing project.** Publish directory `public`,
build command empty. Custom domain under **Domain management**.

## Headers worth setting

The page loads no inline style or script, so a strict policy costs nothing and
is enforced by the test suite. On Cloudflare Pages, add `public/_headers`:

```
/*
  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data:; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Netlify reads the same file. GitHub Pages cannot set headers at all — a reason
to prefer one of the other two.

## The mailboxes have to exist

The page shows two addresses and nothing else collects enquiries, so a message
that bounces is a customer lost silently:

- `hello@peptra.com.co`
- `coa@peptra.com.co`

Forwarding is enough to start. Cloudflare Email Routing is free and takes about
five minutes; most registrars offer something similar. **Send a test message to
both before you point anyone at the site.**
