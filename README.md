# Peptra

Static landing page for **Peptra**, a research peptide supplier whose premise is
that the certificate of analysis is published before the order, not after the
customer asks for it.

Live domain: **peptra.com.co** · Naming rationale, voice and design tokens:
[`brand/naming.md`](brand/naming.md)

> **Read [Before you launch](#before-you-launch) first.** The catalogue figures
> and the compliance copy are drafts written to be correct in form; they need a
> real review against your suppliers' COAs and a lawyer's eye before this goes
> public.

## Run it

Three files, no dependencies, no build step. Open `public/index.html` in a
browser, or serve it properly:

```bash
npm start      # npx serve public
npm test       # 7 checks on the page itself, no network
```

## What's here

```
catalog.json    every product, price and per-warehouse stock — the source of truth
tools/          build-catalog.mjs, which renders catalog.json into the page
public/         the entire site — index.html, styles.css, app.js
test/           checks on the built page
brand/          naming rationale, voice, design tokens
```

## Updating prices and stock

Edit `catalog.json`, then:

```bash
npm run catalog    # regenerates the table in public/index.html
npm test           # fails if the two have drifted apart
```

Never hand-edit the rows between `<!-- catalog:start -->` and
`<!-- catalog:end -->` — the next build overwrites them. Prices are what a
customer acts on, so a test asserts the rendered table matches `catalog.json`
exactly.

There is no server, no database and nothing to operate. Enquiries arrive by
email; the page shows two addresses with copy buttons rather than a form.

## The chromatogram

The hero trace is drawn on a canvas from four Gaussian peaks defined at the top
of `public/app.js`. The purity figure is the main peak's share of total
integrated area computed from those same peaks, so the picture and the number
cannot drift apart.

The integration table in `index.html` is written out by hand from the same
data. `npm test` checks the two agree — the areas sum to 100 % and the main
peak matches the headline figure — because that number is the entire claim of
the page. **If you change the peaks, update the table.**

## Deploying

Connected to a Cloudflare Worker named **peps**; every push to `main` deploys.
`wrangler.jsonc` declares `assets: { directory: "./public" }` and no `main`, so
Cloudflare serves the directory as a static site and runs no Worker code.

Custom domains, response headers and the alternatives (Cloudflare Pages,
Netlify, GitHub Pages) are in [`DEPLOY.md`](DEPLOY.md).

`public/_headers` carries a strict `Content-Security-Policy`. The page loads no
inline style or script — enforced by a test — so the policy costs nothing.

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
4. **The mailboxes.** `hello@peptra.com.co` and `coa@peptra.com.co` are the only
   way anyone can reach you. Set up forwarding and send a test to both before
   pointing anyone at the site.

## History

A waitlist with double opt-in, an append-only consent log and a Node server
lived here until it was removed in favour of a static page. Nothing is lost —
it is all in the history under `server/`, and `git log` explains why each part
worked the way it did, if it is ever wanted back.
