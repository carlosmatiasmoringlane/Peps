/**
 * Checks on the built page itself. There is no server any more, so these
 * read the files straight off disk.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const html = await readFile(join(PUBLIC, "index.html"), "utf8");

test("the page carries no inline style or script", async () => {
  // Static hosts let you set a Content-Security-Policy; keeping the page
  // free of inline style and script means it never needs unsafe-inline.
  assert.equal(/\sstyle=["']/.test(html), false, "inline style attribute found");
  assert.equal(/<script(?![^>]*\ssrc=)/i.test(html), false, "inline <script> found");
});

test("every local file the page references exists", async () => {
  const refs = [...html.matchAll(/(?:href|src)="(\.\/[^"]+|\/[^/][^"]*)"/g)].map((m) => m[1]);
  assert.ok(refs.length >= 2, "expected the stylesheet and script to be referenced");

  for (const ref of refs) {
    const target = join(PUBLIC, ref.replace(/^\.\//, "").replace(/^\//, ""));
    await assert.doesNotReject(access(target), `missing file for ${ref}`);
  }
});

test("every in-page anchor points at something that exists", async () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);

  assert.ok(anchors.length > 0, "expected in-page navigation");
  for (const anchor of anchors) {
    assert.ok(ids.has(anchor), `href="#${anchor}" has no matching id`);
  }
});

test("each copy button names an element that holds an address", async () => {
  const targets = [...html.matchAll(/data-copy="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(targets.length >= 3, "expected the hero, both contact cards and the footer");

  for (const id of targets) {
    const block = html.match(new RegExp(`id="${id}"[^>]*>([^<]+)<`));
    assert.ok(block, `no element with id="${id}"`);
    assert.match(block[1].trim(), /^[^\s@]+@[^\s@]+\.[^\s@]+$/, `id="${id}" is not an address`);
  }
});

test("the chromatogram's integration table agrees with the purity figure", async () => {
  // The page's central claim. If the table and the headline number ever
  // drift apart, the whole premise of the site is undermined.
  const areas = [...html.matchAll(/<td>(\d+\.\d\d)<\/td>\s*<\/tr>/g)].map((m) => Number(m[1]));
  assert.equal(areas.length, 4, "expected four integrated peaks");

  const total = areas.reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(total - 100) < 0.01, `area percentages sum to ${total}, not 100`);

  const main = Math.max(...areas);
  const headline = Number(html.match(/<span class="v hero-figure">([\d.]+) %/)[1]);
  assert.equal(main, headline, "the main peak's area % differs from the stated purity");
});

test("the research-use-only framing is still on the page", async () => {
  // Load-bearing: it is what separates a reagent supplier from a drug
  // distributor. A copy edit must not quietly drop it.
  assert.match(html, /Research use only/i);
  assert.match(html, /For laboratory research use only/i);
  assert.match(html, /Not for human or veterinary use/i);
});

test("no waitlist remnants survive", async () => {
  const [css, js] = await Promise.all([
    readFile(join(PUBLIC, "styles.css"), "utf8"),
    readFile(join(PUBLIC, "app.js"), "utf8")
  ]);
  for (const [name, source] of [["html", html], ["css", css], ["js", js]]) {
    assert.equal(/waitlist/i.test(source), false, `waitlist reference left in ${name}`);
  }
  assert.equal(/<form/i.test(html), false, "a form survived");
});

test("the rendered catalogue matches catalog.json exactly", async () => {
  // Prices are the one thing on this page a customer acts on, so the
  // generated table must never drift from its source. Regenerate with
  // `npm run catalog` after editing catalog.json.
  const { renderRows } = await import("../tools/build-catalog.mjs");
  const catalog = JSON.parse(await readFile(join(ROOT, "catalog.json"), "utf8"));

  const between = html.slice(
    html.indexOf("<!-- catalog:start -->") + "<!-- catalog:start -->".length,
    html.indexOf("<!-- catalog:end -->")
  ).trim();

  assert.equal(between, renderRows(catalog).trim(), "run `npm run catalog`");
});

test("every catalogue row carries a price, a format and stock data", async () => {
  const catalog = JSON.parse(await readFile(join(ROOT, "catalog.json"), "utf8"));

  for (const item of catalog.items) {
    assert.ok(item.price > 0, `${item.code} has no price`);
    assert.ok(item.format, `${item.code} has no format`);
    assert.equal(item.stock.length, catalog.warehouses.length, `${item.code} stock/warehouse mismatch`);
    assert.ok(item.stock.every((s) => typeof s === "boolean"), `${item.code} has non-boolean stock`);
  }

  const codes = catalog.items.map((i) => i.code);
  assert.equal(new Set(codes).size, codes.length, "duplicate product codes");

  // Everything the filter reads must be present on every row.
  const rows = [...html.matchAll(/<tr class="cat-row[^"]*"([^>]*)>/g)].map((m) => m[1]);
  assert.equal(rows.length, catalog.items.length);
  for (const attrs of rows) {
    assert.match(attrs, /data-search="[^"]+"/);
    assert.match(attrs, /data-stock="[01]{3}"/);
  }
});

test("the catalogue makes no therapeutic or dosing claim", async () => {
  // The research-use-only framing is what the whole page rests on. A price
  // list is exactly where a treatment claim tends to creep in.
  const forbidden = [
    /\bdos(e|ing|age)\b/i, /\btreats?\b/i, /\bcures?\b/i, /\btherapy\b/i,
    /\bweight loss\b/i, /\bfat loss\b/i, /\banti-aging\b/i, /\bprescri/i,
    /\binject/i, /\bpatient/i
  ];
  const section = html.slice(html.indexOf('id="catalogue"'), html.indexOf('§ 04'));
  for (const pattern of forbidden) {
    assert.equal(pattern.test(section), false, `catalogue contains ${pattern}`);
  }
});
