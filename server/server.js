/**
 * Peptra — static site + waitlist API.
 *
 * Deliberately dependency-free: it runs on any machine with Node 18+ and
 * nothing installed, which keeps the launch path short. Swap the store for
 * Postgres when the list outgrows a flat file (see README).
 */
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createStore, isValidEmail, normalizeEmail } from "./store.js";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PUBLIC_DIR = join(ROOT, "public");
const DATA_FILE = process.env.WAITLIST_FILE || join(ROOT, "data", "waitlist.jsonl");
const PORT = Number(process.env.PORT || 3000);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const TRUST_PROXY = process.env.TRUST_PROXY === "1";

const MAX_BODY_BYTES = 4 * 1024;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8"
};

/* ------------------------------------------------------------------ *
 * Rate limiting — fixed window per IP, in memory.
 *
 * Good enough for one box. Behind more than one instance, move this to
 * Redis or let the CDN do it; an in-memory limiter per instance silently
 * multiplies the real limit by the instance count.
 * ------------------------------------------------------------------ */

const RATE_LIMIT = {
  max: Number(process.env.RATE_LIMIT_MAX || 8),
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000)
};
const hits = new Map();

/** Test hook: the limiter is process-wide, so suites must clear it. */
export function resetRateLimit() {
  hits.clear();
}

function rateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT.max;
}

// Keep the map from growing without bound on a long-running process.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) if (now > entry.resetAt) hits.delete(ip);
}, 60 * 1000).unref();

/* ------------------------------------------------------------------ */

function clientIp(req) {
  if (TRUST_PROXY) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length) {
      return forwarded.split(",")[0].trim();
    }
  }
  return req.socket.remoteAddress || "unknown";
}

/**
 * Applied to every response. The CSP is tight because the page loads no
 * inline script or style: everything but the Google Fonts stylesheet and
 * its font files comes from this origin.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data:",
  "script-src 'self'",
  "connect-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com"
].join("; ");

function securityHeaders() {
  const headers = {
    "Content-Security-Policy": CSP,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  };
  // Only meaningful behind TLS, which TRUST_PROXY implies. Sending it over
  // plain http on localhost would pin the dev machine to https.
  if (TRUST_PROXY) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }
  return headers;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...securityHeaders(),
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolvePromise, rejectPromise) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        rejectPromise(Object.assign(new Error("Body too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!chunks.length) return resolvePromise({});
      try {
        resolvePromise(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        rejectPromise(Object.assign(new Error("Malformed JSON"), { status: 400 }));
      }
    });
    req.on("error", rejectPromise);
  });
}

async function serveStatic(req, res, pathname) {
  const relative = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, "");
  const target = join(PUBLIC_DIR, relative === "" ? "index.html" : relative);

  // Refuse anything that normalises outside public/.
  if (target !== PUBLIC_DIR && !target.startsWith(PUBLIC_DIR + sep)) {
    res.writeHead(403, securityHeaders()).end("Forbidden");
    return;
  }

  let info;
  try {
    info = await stat(target);
  } catch {
    res.writeHead(404, { ...securityHeaders(), "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
    return;
  }

  let file = target;
  if (info.isDirectory()) {
    file = join(target, "index.html");
    try {
      info = await stat(file);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
  }

  const type = MIME[extname(file).toLowerCase()] || "application/octet-stream";
  const cacheable = extname(file) !== ".html";

  res.writeHead(200, {
    ...securityHeaders(),
    "Content-Type": type,
    "Content-Length": info.size,
    "Cache-Control": cacheable ? "public, max-age=3600" : "no-cache"
  });

  // A HEAD response carries the headers and no body.
  if (req.method === "HEAD") {
    res.end();
    return;
  }

  createReadStream(file).on("error", () => res.destroy()).pipe(res);
}

export async function createApp({ dataFile = DATA_FILE } = {}) {
  const store = await createStore({ file: dataFile });

  const handler = async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const { pathname } = url;

    if (pathname === "/healthz") {
      return sendJson(res, 200, { ok: true, signups: store.count() });
    }

    if (pathname === "/api/waitlist" && req.method === "POST") {
      const ip = clientIp(req);
      if (rateLimited(ip)) {
        return sendJson(res, 429, { error: "Too many attempts. Try again shortly." });
      }

      let body;
      try {
        body = await readJsonBody(req);
      } catch (error) {
        return sendJson(res, error.status || 400, { error: error.message });
      }

      // Honeypot: real people never fill this in. Answer as if accepted so
      // a bot gets no signal about why it failed.
      if (typeof body.company === "string" && body.company.trim() !== "") {
        return sendJson(res, 200, { ok: true, position: null, duplicate: false });
      }

      const email = normalizeEmail(body.email);
      if (!isValidEmail(email)) {
        return sendJson(res, 400, { error: "Enter a valid email address." });
      }

      try {
        const result = await store.add({
          email,
          context: body.context,
          source: body.source,
          ip,
          userAgent: req.headers["user-agent"] || ""
        });
        return sendJson(res, result.duplicate ? 200 : 201, { ok: true, ...result });
      } catch (error) {
        console.error("[waitlist] write failed:", error);
        return sendJson(res, 500, { error: "Could not save your signup. Please try again." });
      }
    }

    if (pathname === "/api/waitlist/export.csv" && req.method === "GET") {
      if (!ADMIN_TOKEN) {
        return sendJson(res, 503, { error: "Export is disabled: set ADMIN_TOKEN." });
      }
      const header = req.headers.authorization || "";
      if (header !== `Bearer ${ADMIN_TOKEN}`) {
        res.writeHead(401, { "WWW-Authenticate": "Bearer" });
        return res.end("Unauthorized");
      }
      const csv = store.toCsv();
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Length": Buffer.byteLength(csv),
        "Content-Disposition": 'attachment; filename="peptra-waitlist.csv"',
        "Cache-Control": "no-store"
      });
      return res.end(csv);
    }

    if (pathname.startsWith("/api/")) {
      return sendJson(res, 404, { error: "Unknown endpoint" });
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
      return;
    }

    return serveStatic(req, res, pathname);
  };

  return { server: createServer((req, res) => {
    handler(req, res).catch((error) => {
      console.error("[server] unhandled:", error);
      if (!res.headersSent) sendJson(res, 500, { error: "Internal error" });
      else res.destroy();
    });
  }), store };
}

const isEntrypoint = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  const { server, store } = await createApp();

  server.listen(PORT, () => {
    console.log(`Peptra listening on http://localhost:${PORT}`);
    console.log(`  waitlist file : ${DATA_FILE} (${store.count()} signups)`);
    console.log(`  CSV export    : ${ADMIN_TOKEN ? "enabled" : "disabled (set ADMIN_TOKEN)"}`);
    console.log(`  proxy headers : ${TRUST_PROXY ? "trusted" : "ignored (set TRUST_PROXY=1 behind TLS)"}`);
  });

  // Container platforms send SIGTERM and kill the process shortly after.
  // Stop taking connections, let in-flight requests finish, and make sure
  // every acknowledged signup has actually reached disk.
  let shuttingDown = false;
  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`\n${signal} received — draining`);

      const forced = setTimeout(() => {
        console.error("drain timed out after 10s — exiting anyway");
        process.exit(1);
      }, 10_000);
      forced.unref();

      server.close(async () => {
        try {
          await store.flush();
          console.log(`drained — ${store.count()} signups safe on disk`);
          process.exit(0);
        } catch (error) {
          console.error("flush failed on shutdown:", error);
          process.exit(1);
        }
      });
    });
  }
}
