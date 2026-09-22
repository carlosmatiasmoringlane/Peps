/**
 * Regenerates the catalogue table in public/index.html from catalog.json.
 *
 * Prices and stock change constantly, so the table is generated rather than
 * hand-edited: update catalog.json, run `npm run catalog`. A test checks the
 * two have not drifted apart.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const START = "<!-- catalog:start -->";
const END = "<!-- catalog:end -->";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ESCAPES[c]);

const money = (n) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function renderRows(catalog) {
  return catalog.items.map((item) => {
    const anywhere = item.stock.some(Boolean);
    const perVial = item.price / item.vials;
    const where = catalog.warehouses.filter((_, i) => item.stock[i]);

    const chips = catalog.warehouses.map((w, i) =>
      `<span class="wh${item.stock[i] ? " wh-in" : ""}">${esc(w)}</span>`
    ).join("");

    const availability = anywhere
      ? `In stock at ${where.join(", ")}`
      : "Out of stock at every warehouse";

    return `        <tr class="cat-row${anywhere ? "" : " cat-oos"}"` +
      ` data-search="${esc((item.code + " " + item.name + " " + item.label).toLowerCase())}"` +
      ` data-stock="${item.stock.map((s) => (s ? 1 : 0)).join("")}">
          <th scope="row" class="mono">${esc(item.code)}</th>
          <td>${esc(item.name)}${item.note ? ` <abbr class="cat-flag" title="${esc(item.note)}">?</abbr>` : ""}</td>
          <td class="mono cat-format">${esc(item.format)}</td>
          <td class="num">${money(item.price)}</td>
          <td class="num cat-unit">${"$" + perVial.toFixed(2)}</td>
          <td class="cat-stock"><span class="vh">${esc(availability)}</span><span aria-hidden="true">${chips}</span></td>
        </tr>`;
  }).join("\n");
}

const catalog = JSON.parse(await readFile(join(ROOT, "catalog.json"), "utf8"));
const file = join(ROOT, "public", "index.html");
const html = await readFile(file, "utf8");

const a = html.indexOf(START);
const b = html.indexOf(END);
if (a === -1 || b === -1) throw new Error(`markers ${START} / ${END} not found in index.html`);

const next = html.slice(0, a + START.length) + "\n" + renderRows(catalog) + "\n        " + html.slice(b);
await writeFile(file, next, "utf8");

const live = catalog.items.filter((i) => i.stock.some(Boolean)).length;
console.log(`catalogue: ${catalog.items.length} rows written, ${live} in stock somewhere`);
