/**
 * Generates the directory and one page per product from catalog.json.
 *
 * public/index.html is hand-maintained; everything under public/products/
 * and public/catalogue.html is generated. Run `npm run build` after editing
 * catalog.json. A test fails if the two have drifted.
 */
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public");

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ESCAPES[c]);
const money = (n) => "$" + n.toLocaleString("en-US");

const CATEGORY = {
  sequence: "Single sequence",
  blend: "Blend",
  ancillary: "Ancillary"
};

/* ---------------------------------------------------------------- *
 * Shared chrome. `up` is the prefix back to public/ — "" at the root,
 * "../" one level down.
 * ---------------------------------------------------------------- */

function head({ title, description, up }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2300726E'/%3E%3Cpath d='M4 23h6.5l3.5-14 3.5 14H28' fill='none' stroke='white' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<meta name="theme-color" content="#00726E" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0A1113" media="(prefers-color-scheme: dark)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${up}styles.css">
<script src="${up}gate.js"></script>
</head>
<body>`;
}

export function gate() {
  return `
<div class="gate" id="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
  <div class="gate-card">
    <p class="wordmark gate-mark"><span class="mark" aria-hidden="true"></span>Peptra</p>
    <h1 class="h2" id="gate-title">Confirm before you continue.</h1>
    <p class="gate-lede">
      Peptra supplies peptides as research reagents. Two confirmations are required
      before the catalogue can be shown.
    </p>
    <div class="gate-checks">
      <label class="gate-check" for="gate-age">
        <input type="checkbox" id="gate-age">
        <span>I am <strong>21 years of age or older</strong>.</span>
      </label>
      <label class="gate-check" for="gate-use">
        <input type="checkbox" id="gate-use">
        <span>
          I am acquiring these materials <strong>for laboratory research use only</strong>.
          I understand they are not for human or veterinary use, are not drugs, foods or
          supplements, and are not for diagnostic or therapeutic use.
        </span>
      </label>
    </div>
    <button class="btn btn-primary gate-enter" id="gate-enter" type="button" disabled>
      Confirm and enter
    </button>
    <p class="gate-fine">
      Both boxes must be ticked. If you cannot confirm either statement, please close
      this tab.
    </p>
    <noscript>
      <p class="gate-fine gate-noscript">
        JavaScript is required to record your confirmation and continue.
      </p>
    </noscript>
  </div>
</div>
`;
}

export function header(up, here) {
  const link = (href, label, key, extra = "") =>
    `<a class="btn btn-quiet btn-sm${extra}${here === key ? " is-here" : ""}"${here === key ? ' aria-current="page"' : ""} href="${up}${href}">${label}</a>`;
  return `
<header class="site-header" inert>
  <div class="wrap">
    <a class="wordmark" href="${up}index.html"><span class="mark" aria-hidden="true"></span>Peptra</a>
    <span class="chip">Research use only</span>
    <span class="spacer"></span>
    ${link("catalogue.html", "Catalogue", "catalogue")}
    ${link("index.html#contact", "Contact", "contact", " nav-secondary")}
  </div>
</header>`;
}

export function footer(up) {
  return `
<footer class="site-footer" inert>
  <div class="wrap">
    <a class="wordmark" href="${up}index.html"><span class="mark" aria-hidden="true"></span>Peptra</a>
    <span class="spacer"></span>
    <span class="copy-line">
      <span class="addr mono" id="footer-address">hello@peptra.com.co</span>
      <button class="btn btn-quiet btn-sm" data-copy="footer-address" type="button">Copy</button>
    </span>
    <p class="legal">© 2026 Peptra · Research use only · Not for human or veterinary use</p>
  </div>
</footer>
<script src="${up}app.js"></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- *
 * Directory
 * ---------------------------------------------------------------- */

function stockChips(item, warehouses) {
  return warehouses
    .map((w, i) => `<span class="wh${item.stock[i] ? " wh-in" : ""}">${esc(w)}</span>`)
    .join("");
}

export function directoryPage(catalog) {
  const rows = catalog.items.map((item) => {
    const anywhere = item.stock.some(Boolean);
    const where = catalog.warehouses.filter((_, i) => item.stock[i]);
    return `        <tr class="cat-row${anywhere ? "" : " cat-oos"}" data-category="${item.category}"` +
      ` data-search="${esc((item.code + " " + item.name + " " + item.label).toLowerCase())}"` +
      ` data-stock="${item.stock.map((s) => (s ? 1 : 0)).join("")}">
          <th scope="row" class="mono"><a href="products/${esc(item.code)}.html">${esc(item.code)}</a></th>
          <td><a class="cat-name" href="products/${esc(item.code)}.html">${esc(item.name)}</a></td>
          <td class="mono cat-format">${esc(item.format)}</td>
          <td class="num">${money(item.price)}</td>
          <td class="num cat-unit">$${(item.price / item.vials).toFixed(2)}</td>
          <td class="cat-stock"><span class="vh">${anywhere ? "In stock at " + where.join(", ") : "Out of stock at every warehouse"}</span><span aria-hidden="true">${stockChips(item, catalog.warehouses)}</span></td>
        </tr>`;
  }).join("\n");

  return `${head({
    title: "Catalogue · Peptra",
    description: "Every Peptra research peptide, with price per box of ten vials and stock at each warehouse.",
    up: ""
  })}${gate()}${header("", "catalogue")}

<main id="top">
  <section class="section section-first">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">Catalogue</p>
        <div class="head-copy">
          <h1 class="h2">${catalog.items.length} products, three warehouses.</h1>
          <p class="lede">
            Every price is for a box of ten vials. Stock is held at three separate US
            warehouses and each ships on its own — an order spanning two warehouses is
            two orders. Select a code for full details.
          </p>
        </div>
      </div>

      <div class="cat-controls">
        <div class="cat-field">
          <label for="cat-search">Filter</label>
          <input id="cat-search" type="search" placeholder="Name or code — e.g. BPC, GHK, TR30"
                 autocomplete="off" spellcheck="false">
        </div>
        <div class="cat-field">
          <label for="cat-category">Type</label>
          <select id="cat-category">
            <option value="">All</option>
            <option value="sequence">Single sequences</option>
            <option value="blend">Blends</option>
            <option value="ancillary">Ancillary</option>
          </select>
        </div>
        <div class="cat-field">
          <label for="cat-warehouse">Warehouse</label>
          <select id="cat-warehouse">
            <option value="">Any</option>
            <option value="0">W1</option>
            <option value="1">W2</option>
            <option value="2">W3</option>
          </select>
        </div>
        <label class="cat-toggle" for="cat-instock">
          <input type="checkbox" id="cat-instock">
          In stock only
        </label>
        <p class="cat-count mono" id="cat-count" role="status">${catalog.items.length} of ${catalog.items.length} products</p>
      </div>

      <div class="table-scroll">
        <table class="catalog" id="cat-table">
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col">Product</th>
              <th scope="col">Format</th>
              <th scope="col">Box of 10</th>
              <th scope="col">Per vial</th>
              <th scope="col">Stock</th>
            </tr>
          </thead>
          <tbody id="cat-body">
${rows}
          </tbody>
        </table>
      </div>

      <p class="cat-empty" id="cat-empty" hidden>Nothing matches that filter.</p>

      <p class="catalog-note mono">
        Shipping $35 flat · free over $${catalog.shipping.freeOverUsd} ·
        separate order per warehouse · prices in USD and subject to change
      </p>
    </div>
  </section>
</main>
${footer("")}`;
}

/* ---------------------------------------------------------------- *
 * One page per product
 * ---------------------------------------------------------------- */

export function productPage(item, catalog) {
  const anywhere = item.stock.some(Boolean);
  const where = catalog.warehouses.filter((_, i) => item.stock[i]);
  const perVial = (item.price / item.vials).toFixed(2);

  return `${head({
    title: `${item.name} · ${item.code} · Peptra`,
    description: `${item.name}, ${item.format}, ${money(item.price)} per box. Research use only.`,
    up: "../"
  })}${gate()}${header("../", "catalogue")}

<main id="top">
  <section class="section section-first">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="../catalogue.html">Catalogue</a>
        <span aria-hidden="true">/</span>
        <span class="mono">${esc(item.code)}</span>
      </nav>

      <div class="product">
        <div class="product-main">
          <p class="eyebrow">${CATEGORY[item.category]} · ${esc(item.label)}</p>
          <h1 class="display product-title">${esc(item.name)}</h1>

          <dl class="product-specs">
            <div><dt>Catalogue number</dt><dd class="mono">${esc(item.code)}</dd></div>
            <div><dt>Format</dt><dd class="mono">${esc(item.format)}</dd></div>
            <div><dt>Vials per box</dt><dd class="mono">${item.vials}</dd></div>
            <div><dt>Availability</dt><dd>${anywhere ? `<span class="mono">${where.join(", ")}</span>` : "Out of stock"}</dd></div>
          </dl>

          ${item.note ? `<p class="product-note">${esc(item.note)}</p>` : ""}

          <p class="product-ruo">
            Sold as a research reagent for laboratory use by qualified personnel.
            Not for human or veterinary use. Not a drug, food, cosmetic or dietary
            supplement. No therapeutic claim is made and no dosing guidance is given.
          </p>
        </div>

        <aside class="product-buy">
          <p class="buy-price">${money(item.price)}</p>
          <p class="buy-unit mono">$${perVial} per vial · box of ${item.vials}</p>

          <div class="buy-stock">
            <p class="contact-label">Warehouse stock</p>
            <p class="mono buy-chips">${stockChips(item, catalog.warehouses)}</p>
            <p class="note">${anywhere
              ? `Ships from ${where.join(", ")}. Each warehouse ships separately.`
              : "Currently unavailable at every warehouse. Ask to be told when it returns."}</p>
          </div>

          <div class="buy-contact">
            <p class="contact-label">To order or request the lot certificate</p>
            <p class="copy-line">
              <span class="addr mono" id="buy-address">hello@peptra.com.co</span>
              <button class="btn btn-quiet btn-sm" data-copy="buy-address" type="button">Copy</button>
            </p>
            <p class="note">Quote <span class="mono">${esc(item.code)}</span> and the quantity.</p>
          </div>

          <p class="buy-ship mono">
            $${catalog.shipping.flatRateUsd} shipping · free over $${catalog.shipping.freeOverUsd}
          </p>
        </aside>
      </div>

      <p class="product-back"><a href="../catalogue.html">← All ${catalog.items.length} products</a></p>
    </div>
  </section>
</main>
${footer("../")}`;
}

/* ---------------------------------------------------------------- */

const catalog = JSON.parse(await readFile(join(ROOT, "catalog.json"), "utf8"));

await writeFile(join(OUT, "catalogue.html"), directoryPage(catalog), "utf8");

const dir = join(OUT, "products");
await rm(dir, { recursive: true, force: true });
await mkdir(dir, { recursive: true });
for (const item of catalog.items) {
  await writeFile(join(dir, `${item.code}.html`), productPage(item, catalog), "utf8");
}

console.log(`built catalogue.html and ${catalog.items.length} product pages`);
