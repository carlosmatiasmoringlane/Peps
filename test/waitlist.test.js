import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.ADMIN_TOKEN = "test-token";
process.env.RATE_LIMIT_MAX = "5";
process.env.PUBLIC_URL = "https://peptra.test";

const { createApp, resetRateLimit } = await import("../server/server.js");

/** Collects what would have been sent, and can be made to fail on demand. */
function fakeMailer() {
  const sent = [];
  let failWith = null;
  return {
    name: "fake",
    from: "Peptra <hello@peptra.test>",
    sent,
    failNext(error) { failWith = error; },
    async sendConfirmation(message) {
      if (failWith) { const e = failWith; failWith = null; throw e; }
      sent.push(message);
      return { id: "fake" };
    },
    /** The token out of the most recent confirmation link. */
    lastToken() {
      const last = sent[sent.length - 1];
      return last ? new URL(last.confirmUrl).searchParams.get("token") : null;
    }
  };
}

async function withServer(run) {
  const dir = await mkdtemp(join(tmpdir(), "peptra-"));
  const mailer = fakeMailer();
  const { server, store } = await createApp({ dataFile: join(dir, "waitlist.jsonl"), mailer });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const base = `http://127.0.0.1:${server.address().port}`;
  resetRateLimit();
  try {
    await run({ base, store, mailer });
  } finally {
    await new Promise((done) => server.close(done));
    await rm(dir, { recursive: true, force: true });
  }
}

const signup = (base, email, extra = {}) =>
  fetch(`${base}/api/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, ...extra })
  });

const confirm = (base, token) =>
  fetch(`${base}/confirm?token=${encodeURIComponent(token ?? "")}`);

/* ---------------------------------------------------------------- *
 * Double opt-in
 * ---------------------------------------------------------------- */

test("a signup is pending and holds no position until it is confirmed", async () => {
  await withServer(async ({ base, store, mailer }) => {
    const res = await signup(base, "ada@lab.edu", { context: "academic", source: "hero" });
    assert.equal(res.status, 201);
    assert.deepEqual(await res.json(), { ok: true, state: "pending", resent: false });

    assert.equal(store.counts().pending, 1);
    assert.equal(store.counts().confirmed, 0);
    assert.equal(store.get("ada@lab.edu").position, null);

    assert.equal(mailer.sent.length, 1);
    assert.equal(mailer.sent[0].to, "ada@lab.edu");
    assert.match(mailer.sent[0].confirmUrl, /^https:\/\/peptra\.test\/confirm\?token=/);
    assert.match(mailer.sent[0].unsubscribeUrl, /^https:\/\/peptra\.test\/unsubscribe\?token=/);
  });
});

test("confirming assigns the next position and shows it", async () => {
  await withServer(async ({ base, store, mailer }) => {
    await signup(base, "ada@lab.edu");
    const page = await confirm(base, mailer.lastToken());

    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type"), /text\/html/);
    const html = await page.text();
    assert.match(html, /#1/);
    assert.match(html, /ada@lab\.edu/);

    assert.equal(store.counts().confirmed, 1);
    assert.equal(store.get("ada@lab.edu").position, 1);
  });
});

test("positions are handed out in confirmation order, not signup order", async () => {
  await withServer(async ({ base, store, mailer }) => {
    await signup(base, "first@lab.edu");
    const firstToken = mailer.lastToken();
    await signup(base, "second@lab.edu");
    const secondToken = mailer.lastToken();

    await confirm(base, secondToken);   // the later signup confirms first
    await confirm(base, firstToken);

    assert.equal(store.get("second@lab.edu").position, 1);
    assert.equal(store.get("first@lab.edu").position, 2);
  });
});

test("clicking a confirmation link twice is harmless", async () => {
  await withServer(async ({ base, store, mailer }) => {
    await signup(base, "ada@lab.edu");
    const token = mailer.lastToken();

    await confirm(base, token);
    const second = await confirm(base, token);

    assert.equal(second.status, 200);
    assert.match(await second.text(), /already confirmed/i);
    assert.equal(store.get("ada@lab.edu").position, 1, "position did not move");
    assert.equal(store.counts().confirmed, 1);
  });
});

test("an unknown or truncated token gets an explanation, not a stack trace", async () => {
  await withServer(async ({ base }) => {
    for (const token of ["", "nonsense", "a".repeat(43)]) {
      const res = await confirm(base, token);
      assert.equal(res.status, 400);
      const html = await res.text();
      assert.match(html, /isn't valid/);
      assert.match(html, /Sign up again/);
    }
  });
});

test("signing up again while pending resends the same link", async () => {
  await withServer(async ({ base, store, mailer }) => {
    await signup(base, "ada@lab.edu");
    const first = mailer.lastToken();

    const again = await signup(base, "ada@lab.edu");
    assert.equal(again.status, 200);
    assert.deepEqual(await again.json(), { ok: true, state: "pending", resent: true });

    assert.equal(mailer.lastToken(), first, "the earlier email still works");
    assert.equal(mailer.sent.length, 2);
    assert.equal(store.counts().pending, 1);
  });
});

test("a confirmed address is told so, and is not emailed again", async () => {
  await withServer(async ({ base, mailer }) => {
    await signup(base, "ada@lab.edu");
    await confirm(base, mailer.lastToken());
    const sentSoFar = mailer.sent.length;

    const res = await signup(base, "ada@lab.edu");
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, state: "already_confirmed", position: 1 });
    assert.equal(mailer.sent.length, sentSoFar, "no second email — the form is not a spam cannon");
  });
});

test("when the confirmation email fails, the caller is told rather than reassured", async () => {
  await withServer(async ({ base, store, mailer }) => {
    mailer.failNext(new Error("provider down"));

    const res = await signup(base, "ada@lab.edu");
    assert.equal(res.status, 502);
    assert.match((await res.json()).error, /couldn't send the confirmation/);

    // The address is kept, so a retry resends rather than starting over.
    assert.equal(store.counts().pending, 1);
    const retry = await signup(base, "ada@lab.edu");
    assert.equal((await retry.json()).resent, true);
  });
});

/* ---------------------------------------------------------------- *
 * Unsubscribe
 * ---------------------------------------------------------------- */

test("unsubscribe works by link and by one-click POST", async () => {
  await withServer(async ({ base, store, mailer }) => {
    await signup(base, "ada@lab.edu");
    await confirm(base, mailer.lastToken());
    const token = mailer.lastToken();

    const page = await fetch(`${base}/unsubscribe?token=${token}`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /off the list/i);
    assert.equal(store.get("ada@lab.edu").status, "unsubscribed");

    // RFC 8058 one-click, which Gmail and Yahoo require of bulk senders.
    const oneClick = await fetch(`${base}/unsubscribe?token=${token}`, { method: "POST" });
    assert.equal(oneClick.status, 200);
    assert.deepEqual(await oneClick.json(), { ok: true });
  });
});

test("an unknown unsubscribe token still reports success", async () => {
  await withServer(async ({ base }) => {
    // Never make someone trying to leave feel they failed.
    const res = await fetch(`${base}/unsubscribe?token=nonsense`);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /isn't on the list/i);
  });
});

test("an unsubscribed address cannot be confirmed by an old link", async () => {
  await withServer(async ({ base, mailer }) => {
    await signup(base, "ada@lab.edu");
    const token = mailer.lastToken();
    await fetch(`${base}/unsubscribe?token=${token}`);

    const res = await confirm(base, token);
    assert.equal(res.status, 400);
    assert.match(await res.text(), /unsubscribed/i);
  });
});

/* ---------------------------------------------------------------- *
 * Storage, export, and the rest
 * ---------------------------------------------------------------- */

test("the event log replays every state across a restart", async () => {
  const dir = await mkdtemp(join(tmpdir(), "peptra-"));
  const dataFile = join(dir, "waitlist.jsonl");
  try {
    const mailer = fakeMailer();
    const first = await createApp({ dataFile, mailer });
    await new Promise((done) => first.server.listen(0, "127.0.0.1", done));
    resetRateLimit();
    const base = `http://127.0.0.1:${first.server.address().port}`;

    await signup(base, "confirmed@lab.edu");
    await confirm(base, mailer.lastToken());
    await signup(base, "pending@lab.edu");
    await signup(base, "gone@lab.edu");
    await fetch(`${base}/unsubscribe?token=${mailer.lastToken()}`);

    await first.store.flush();
    await new Promise((done) => first.server.close(done));

    const second = await createApp({ dataFile, mailer: fakeMailer() });
    assert.deepEqual(second.store.counts(), { pending: 1, confirmed: 1, unsubscribed: 1, total: 3 });
    assert.equal(second.store.get("confirmed@lab.edu").position, 1);
    assert.equal(second.store.get("gone@lab.edu").status, "unsubscribed");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("CSV export covers confirmed subscribers only unless asked for everything", async () => {
  await withServer(async ({ base, mailer }) => {
    await signup(base, "confirmed@lab.edu", { context: "academic" });
    await confirm(base, mailer.lastToken());
    await signup(base, "pending@lab.edu");

    const denied = await fetch(`${base}/api/waitlist/export.csv`);
    assert.equal(denied.status, 401);
    await denied.text();

    const auth = { Authorization: "Bearer test-token" };
    const csv = await (await fetch(`${base}/api/waitlist/export.csv`, { headers: auth })).text();
    assert.equal(csv.split("\n")[0], "position,email,status,context,source,joined_at,confirmed_at");
    assert.match(csv, /confirmed@lab\.edu,confirmed,academic/);
    assert.doesNotMatch(csv, /pending@lab\.edu/, "unconfirmed addresses are not mailable");

    const all = await (await fetch(`${base}/api/waitlist/export.csv?all=1`, { headers: auth })).text();
    assert.match(all, /pending@lab\.edu,pending/);
  });
});

test("a malformed address is rejected and no email goes out", async () => {
  await withServer(async ({ base, store, mailer }) => {
    const bads = [
      "", "ada", "ada@lab", "ada @lab.edu",
      "a<img/src=x/onerror=alert(1)>@lab.edu",  // markup is not an address
      "ada@lab..edu", "ada@-lab.edu", "ada@lab.edu.", ".ada@lab.edu", "ada..b@lab.edu"
    ];
    for (const bad of bads) {
      // Rate limiting runs before validation (deliberately — refuse a flood
      // before doing any work), so clear it between probes.
      resetRateLimit();
      const res = await signup(base, bad);
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(bad)}`);
      await res.json();
    }
    assert.equal(store.counts().total, 0);
    assert.equal(mailer.sent.length, 0);
  });
});

test("addresses that are unusual but legal are still accepted", async () => {
  await withServer(async ({ base, store }) => {
    const goods = ["o'brien@lab.edu", "ada+waitlist@lab.co.uk", "a.b.c@sub.lab.edu", "x=y@lab.edu"];
    for (const good of goods) {
      resetRateLimit();
      const res = await signup(base, good);
      assert.equal(res.status, 201, `expected 201 for ${good}`);
      await res.json();
    }
    assert.equal(store.counts().pending, goods.length);
  });
});

test("a CSV cell cannot become a spreadsheet formula", async () => {
  await withServer(async ({ base, mailer }) => {
    // `=` is legal in a local part, so this address is accepted — and must
    // not execute when someone opens the export in Excel.
    await signup(base, "=cmd@lab.edu");
    await confirm(base, mailer.lastToken());

    const csv = await (await fetch(`${base}/api/waitlist/export.csv`, {
      headers: { Authorization: "Bearer test-token" }
    })).text();

    assert.match(csv, /,'=cmd@lab\.edu,/, "the leading = is defused with an apostrophe");
    assert.doesNotMatch(csv, /,=cmd@lab\.edu,/);
  });
});

test("addresses are normalised before they are compared", async () => {
  await withServer(async ({ base, store }) => {
    await signup(base, "  Ada@LAB.edu  ");
    const again = await signup(base, "ada@lab.edu");
    assert.equal((await again.json()).resent, true);
    assert.equal(store.counts().total, 1);
  });
});

test("a filled honeypot looks accepted but stores nothing and sends nothing", async () => {
  await withServer(async ({ base, store, mailer }) => {
    const res = await signup(base, "bot@spam.example", { company: "Acme Bots" });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);
    assert.equal(store.counts().total, 0);
    assert.equal(mailer.sent.length, 0);
  });
});

test("the rate limiter cuts off a flood from one address", async () => {
  await withServer(async ({ base }) => {
    let limited = 0;
    for (let i = 0; i < 8; i++) {
      const res = await signup(base, `person${i}@lab.edu`);
      if (res.status === 429) limited += 1;
      await res.json();
    }
    assert.equal(limited, 3, "5 allowed by RATE_LIMIT_MAX, the rest refused");
  });
});

test("the landing page is served and traversal outside public/ is refused", async () => {
  await withServer(async ({ base }) => {
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Peptra/);
    assert.match(html, /Research use only/);

    const escaped = await fetch(`${base}/../package.json`);
    assert.ok(escaped.status === 403 || escaped.status === 404, `got ${escaped.status}`);
    await escaped.text();
  });
});

test("responses carry the security headers, and HEAD sends no body", async () => {
  await withServer(async ({ base }) => {
    const page = await fetch(`${base}/`);
    const csp = page.headers.get("content-security-policy");
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.equal(page.headers.get("x-content-type-options"), "nosniff");
    assert.equal(page.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.equal(page.headers.get("strict-transport-security"), null);
    await page.text();

    const head = await fetch(`${base}/`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.ok(Number(head.headers.get("content-length")) > 0);
    assert.equal(await head.text(), "");
  });
});

test("the confirm page carries the security headers and loads no inline style", async () => {
  await withServer(async ({ base, mailer }) => {
    await signup(base, "ada@lab.edu");
    const res = await confirm(base, mailer.lastToken());
    assert.match(res.headers.get("content-security-policy"), /default-src 'self'/);
    const html = await res.text();
    assert.equal(/\sstyle=["']/.test(html), false, "no inline style attributes");
    assert.equal(/<script/i.test(html), false, "no script at all");
    assert.match(html, /<meta name="robots" content="noindex">/);
  });
});

test("the landing page loads no inline script or style, so the CSP cannot break it", async () => {
  await withServer(async ({ base }) => {
    const html = await (await fetch(`${base}/`)).text();
    assert.equal(/\sstyle=["']/.test(html), false, "no inline style attributes");
    assert.equal(/<script(?![^>]*\ssrc=)/i.test(html), false, "no inline <script> blocks");
  });
});
