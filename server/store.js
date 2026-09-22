/**
 * Waitlist storage — an append-only event log.
 *
 * A subscriber moves through pending -> confirmed -> unsubscribed, so the
 * file records what happened rather than the current state: one JSON object
 * per line, replayed in order at boot. Nothing is ever rewritten, which
 * means a torn write can only cost the last event, the file stays readable
 * with `tail` and `grep`, and the history of who confirmed when is evidence
 * of consent you may later need to produce.
 */
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

/**
 * The HTML5 email production, narrowed to require a dotted domain.
 * The previous `[^\s@]+@[^\s@]+` shape accepted anything without a space,
 * including markup, which meant undeliverable junk reached the send queue
 * and the export.
 */
const EMAIL_RE =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(value) {
  return value.length <= 254 && EMAIL_RE.test(value);
}

export function newToken() {
  return randomBytes(32).toString("base64url");
}

export async function createStore({ file }) {
  const byEmail = new Map();   // email -> subscriber
  const byToken = new Map();   // token -> email
  let highestPosition = 0;

  await mkdir(dirname(file), { recursive: true });

  /**
   * Fold one event into memory. Replay and live writes both go through
   * here, so a restart can never disagree with a running process.
   */
  function apply(event) {
    const email = event.email;
    if (typeof email !== "string" || !email) return;

    if (event.type === "signup") {
      const previous = byEmail.get(email);
      if (previous) byToken.delete(previous.token);
      const subscriber = {
        email,
        context: event.context || "",
        source: event.source || "",
        token: event.token,
        status: "pending",
        position: null,
        joinedAt: event.at,
        confirmedAt: null,
        unsubscribedAt: null
      };
      byEmail.set(email, subscriber);
      byToken.set(event.token, email);
      return;
    }

    const subscriber = byEmail.get(email);
    if (!subscriber) return;

    if (event.type === "confirm") {
      subscriber.status = "confirmed";
      subscriber.position = event.position;
      subscriber.confirmedAt = event.at;
      if (event.position > highestPosition) highestPosition = event.position;
    } else if (event.type === "unsubscribe") {
      subscriber.status = "unsubscribed";
      subscriber.unsubscribedAt = event.at;
      // The position is kept. Numbers are never reused, so a confirmed
      // subscriber's place cannot shift because someone ahead left.
    }
  }

  if (existsSync(file)) {
    const raw = await readFile(file, "utf8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        apply(JSON.parse(line));
      } catch {
        continue; // a torn final line from an interrupted write
      }
    }
  }

  // Serialises appends so concurrent requests cannot interleave lines.
  let writeQueue = Promise.resolve();

  function append(event) {
    apply(event);
    writeQueue = writeQueue.then(() =>
      appendFile(file, JSON.stringify(event) + "\n", "utf8")
    );
    return writeQueue;
  }

  return {
    counts() {
      let pending = 0, confirmed = 0, unsubscribed = 0;
      for (const s of byEmail.values()) {
        if (s.status === "pending") pending += 1;
        else if (s.status === "confirmed") confirmed += 1;
        else unsubscribed += 1;
      }
      return { pending, confirmed, unsubscribed, total: byEmail.size };
    },

    get(email) {
      return byEmail.get(email) ?? null;
    },

    getByToken(token) {
      if (typeof token !== "string" || !token) return null;
      const email = byToken.get(token);
      return email ? byEmail.get(email) ?? null : null;
    },

    all() {
      return [...byEmail.values()];
    },

    /**
     * Record a signup and return the token whose confirmation link must be
     * emailed. Nobody joins the list here — only confirming does that.
     *
     * - already confirmed -> say so, send nothing, leak no position change
     * - still pending     -> reuse the existing token so older emails keep working
     * - previously left   -> a fresh signup with a fresh token
     */
    async add({ email, context = "", source = "" }) {
      const existing = byEmail.get(email);

      if (existing && existing.status === "confirmed") {
        return { state: "already_confirmed", position: existing.position, token: existing.token };
      }

      if (existing && existing.status === "pending") {
        return { state: "pending", token: existing.token, resent: true };
      }

      const token = newToken();
      await append({
        type: "signup",
        email,
        context: String(context).slice(0, 40),
        source: String(source).slice(0, 40),
        token,
        at: new Date().toISOString()
      });
      return { state: "pending", token, resent: false };
    },

    /** Idempotent: people click confirmation links twice. */
    async confirm(token) {
      const subscriber = this.getByToken(token);
      if (!subscriber) return { ok: false, reason: "unknown" };
      if (subscriber.status === "confirmed") {
        return { ok: true, position: subscriber.position, email: subscriber.email, already: true };
      }
      if (subscriber.status === "unsubscribed") {
        return { ok: false, reason: "unsubscribed" };
      }

      const position = highestPosition + 1;
      await append({ type: "confirm", email: subscriber.email, position, at: new Date().toISOString() });
      return { ok: true, position, email: subscriber.email, already: false };
    },

    /** Idempotent, and deliberately never fails loudly — an unsubscribe
     *  link must work on the first click, every time. */
    async unsubscribe(token) {
      const subscriber = this.getByToken(token);
      if (!subscriber) return { ok: false, reason: "unknown" };
      if (subscriber.status === "unsubscribed") {
        return { ok: true, email: subscriber.email, already: true };
      }
      await append({ type: "unsubscribe", email: subscriber.email, at: new Date().toISOString() });
      return { ok: true, email: subscriber.email, already: false };
    },

    /** Await queued appends — used on shutdown so a container restart
     *  cannot drop an event that was acknowledged to the browser. */
    async flush() {
      await writeQueue;
    },

    /** Confirmed subscribers only, in position order: the list you may
     *  actually mail. Pending and unsubscribed rows are excluded by
     *  default rather than left for a careless export to pick up. */
    toCsv({ includeAll = false } = {}) {
      // A leading = + - @ tab or CR makes a spreadsheet treat the cell as a
      // formula, and `=` is a legal character in an address local part. The
      // apostrophe is the standard defusing prefix; it is visible to whoever
      // opens the file, which is the point.
      const escape = (value) => {
        let text = String(value ?? "");
        if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
        return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
      };
      const rows = this.all()
        .filter((s) => includeAll || s.status === "confirmed")
        .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));

      const header = "position,email,status,context,source,joined_at,confirmed_at";
      const lines = rows.map((s) =>
        [s.position ?? "", s.email, s.status, s.context, s.source, s.joinedAt, s.confirmedAt ?? ""]
          .map(escape).join(",")
      );
      return [header, ...lines].join("\n") + "\n";
    }
  };
}
