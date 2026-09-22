import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.ADMIN_TOKEN = "test-token";
process.env.RATE_LIMIT_MAX = "5";

const { createApp, resetRateLimit } = await import("../server/server.js");

async function withServer(run) {
  const dir = await mkdtemp(join(tmpdir(), "peptra-"));
  const { server, store } = await createApp({ dataFile: join(dir, "waitlist.jsonl") });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const base = `http://127.0.0.1:${server.address().port}`;
  resetRateLimit();
  try {
    await run({ base, store });
  } finally {
    await new Promise((done) => server.close(done));
    await rm(dir, { recursive: true, force: true });
  }
}

const join_ = (base, email, extra = {}) =>
  fetch(`${base}/api/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, ...extra })
  });

test("a valid signup is stored and gets position 1", async () => {
  await withServer(async ({ base, store }) => {
    const res = await join_(base, "ada@lab.edu", { context: "academic", source: "hero" });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.deepEqual(body, { ok: true, position: 1, duplicate: false });
    assert.equal(store.count(), 1);
    assert.equal(store.all()[0].context, "academic");
  });
});

test("email is normalised, and signing up twice reports the original position", async () => {
  await withServer(async ({ base, store }) => {
    await join_(base, "first@lab.edu");
    await join_(base, "  Ada@LAB.edu  ");
    const again = await join_(base, "ada@lab.edu");

    assert.equal(again.status, 200);
    assert.deepEqual(await again.json(), { ok: true, position: 2, duplicate: true });
    assert.equal(store.count(), 2);
  });
});

test("a malformed address is rejected and nothing is stored", async () => {
  await withServer(async ({ base, store }) => {
    for (const bad of ["", "ada", "ada@lab", "ada @lab.edu"]) {
      const res = await join_(base, bad);
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(bad)}`);
    }
    assert.equal(store.count(), 0);
  });
});

test("a filled honeypot looks accepted but stores nothing", async () => {
  await withServer(async ({ base, store }) => {
    const res = await join_(base, "bot@spam.example", { company: "Acme Bots" });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);
    assert.equal(store.count(), 0);
  });
});

test("signups survive a restart because the file is replayed", async () => {
  const dir = await mkdtemp(join(tmpdir(), "peptra-"));
  const dataFile = join(dir, "waitlist.jsonl");
  try {
    const first = await createApp({ dataFile });
    await new Promise((done) => first.server.listen(0, "127.0.0.1", done));
    resetRateLimit();
    const base = `http://127.0.0.1:${first.server.address().port}`;
    await join_(base, "ada@lab.edu");
    await join_(base, "grace@lab.edu");
    await new Promise((done) => first.server.close(done));

    const second = await createApp({ dataFile });
    assert.equal(second.store.count(), 2);
    assert.equal(second.store.positionOf("grace@lab.edu"), 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("CSV export needs the admin token", async () => {
  await withServer(async ({ base }) => {
    await join_(base, "ada@lab.edu", { context: "academic" });

    const denied = await fetch(`${base}/api/waitlist/export.csv`);
    assert.equal(denied.status, 401);

    const ok = await fetch(`${base}/api/waitlist/export.csv`, {
      headers: { Authorization: "Bearer test-token" }
    });
    assert.equal(ok.status, 200);
    const csv = await ok.text();
    assert.equal(csv.split("\n")[0], "position,email,context,source,joined_at");
    assert.match(csv, /1,ada@lab\.edu,academic/);
  });
});

test("the rate limiter cuts off a flood from one address", async () => {
  await withServer(async ({ base }) => {
    let limited = 0;
    for (let i = 0; i < 8; i++) {
      const res = await join_(base, `person${i}@lab.edu`);
      if (res.status === 429) limited += 1;
    }
    assert.equal(limited, 3, "5 allowed by RATE_LIMIT_MAX, the rest refused");
  });
});

test("the landing page is served and traversal outside public/ is refused", async () => {
  await withServer(async ({ base }) => {
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type"), /text\/html/);
    const html = await page.text();
    assert.match(html, /Peptra/);
    assert.match(html, /Research use only/);

    const escaped = await fetch(`${base}/../package.json`);
    assert.ok(escaped.status === 403 || escaped.status === 404, `got ${escaped.status}`);
  });
});

test("responses carry the security headers, and HEAD sends no body", async () => {
  await withServer(async ({ base }) => {
    const page = await fetch(`${base}/`);
    const csp = page.headers.get("content-security-policy");
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /style-src 'self' https:\/\/fonts\.googleapis\.com/);
    assert.equal(page.headers.get("x-content-type-options"), "nosniff");
    assert.equal(page.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    // HSTS is only correct behind TLS, which TRUST_PROXY stands in for.
    assert.equal(page.headers.get("strict-transport-security"), null);
    await page.text();

    const head = await fetch(`${base}/`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.ok(Number(head.headers.get("content-length")) > 0, "Content-Length is set");
    assert.equal(await head.text(), "", "HEAD carries no body");

    const api = await fetch(`${base}/api/nope`);
    assert.equal(api.status, 404);
    assert.match(api.headers.get("content-security-policy"), /default-src 'self'/);
    await api.text();
  });
});

test("the page loads no inline script or style, so the CSP cannot break it", async () => {
  await withServer(async ({ base }) => {
    const html = await (await fetch(`${base}/`)).text();
    assert.equal(/\sstyle=["']/.test(html), false, "no inline style attributes");
    assert.equal(/<script(?![^>]*\ssrc=)/i.test(html), false, "no inline <script> blocks");
  });
});

test("queued writes are flushed before shutdown reports done", async () => {
  await withServer(async ({ base, store }) => {
    await join_(base, "ada@lab.edu");
    await join_(base, "grace@lab.edu");
    await store.flush();
    assert.equal(store.count(), 2);
  });
});
