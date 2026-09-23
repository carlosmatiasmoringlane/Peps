# Peptra

Static landing page for **Peptra**, a research peptide supplier whose premise is
that the certificate of analysis is published before the order, not after the
customer asks for it.

Live domain: **peptra.com.co** · Naming rationale, voice and design tokens:
[`brand/naming.md`](brand/naming.md)

> **Read [`LAUNCH-CHECKLIST.md`](LAUNCH-CHECKLIST.md) before the domain goes
> live.** Four items in the catalogue carry risk that differs in kind from the
> rest, and two sections of the page describe a business this catalogue is not.
> Every deploy prints that checklist into its run summary.
>
> **Also read [Before you launch](#before-you-launch).** The catalogue figures
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
catalog.json         every product, price and per-warehouse stock — the source of truth
tools/build-site.mjs generates the directory and the product pages
public/index.html    the home page — hand-maintained
public/catalogue.html  the directory — GENERATED
public/products/     one page per product — GENERATED
public/app.js        chromatogram, catalogue filtering, gate, copy buttons
public/gate.js       the age and use gate's head script — must stay render-blocking
public/CNAME         the custom domain; a deploy without it can unset peptra.com.co
test/                checks on the built site
brand/               naming rationale, voice, design tokens
```

## Pages

| Page | Source |
| --- | --- |
| `/` | `public/index.html`, hand-maintained |
| `/catalogue.html` | generated — the filterable directory of all products |
| `/products/<CODE>.html` | generated — one per catalogue item |

**Never hand-edit `catalogue.html` or anything in `products/`** — the next build
overwrites them. Change `catalog.json` and run `npm run build`. A test
regenerates both and fails if what is committed differs.

## Updating prices and stock

Edit `catalog.json`, then:

```bash
npm run build    # regenerates catalogue.html and every product page
npm test         # fails if what is committed differs from what the build produces
```

Prices are what a customer acts on, so the drift test is not optional.

Adding a product means adding one object to `catalog.json` — `code`, `name`,
`label`, `format`, `vials`, `price`, `stock` (one boolean per warehouse) and
`category` (`sequence`, `blend` or `ancillary`). The build does the rest.

Categories are **structural, not functional**. A grouping like "recovery" or
"metabolic" would imply a use, which is precisely what the research-use framing
cannot carry.

There is no server, no database and nothing to operate. Enquiries arrive by
email; the page shows two addresses with copy buttons rather than a form.

## The age and use gate

Every visitor confirms two things before the catalogue is shown: that they are
21 or over, and that they are acquiring the materials for laboratory research
use only. The confirmation is remembered per browser.

It is built to fail closed:

- The overlay is **in the HTML**, not built by script. If `app.js` fails to
  load, the gate stays up rather than the catalogue being exposed.
- The button carries `disabled` in the markup, so it is never clickable before
  the script runs.
- `public/gate.js` is **render-blocking in `<head>`** so a returning visitor
  never sees the gate flash. Do not add `defer` or `async` — a test enforces
  this.
- The header, main and footer are marked `inert` in the markup, so the page
  behind is out of the tab order and the accessibility tree rather than just
  covered.
- Storage access is wrapped in try/catch; a private window throws, the gate
  shows, which is the right direction to fail.

To force everyone to confirm again — if the wording changes, say — bump `KEY`
in `gate.js` and `GATE_KEY` in `app.js` to `peptra.gate.v2`. **They must match.**

A client-side gate is a statement of terms, not access control. It records that
the visitor was asked and answered; it does not stop anyone determined.

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
