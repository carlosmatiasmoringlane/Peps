/**
 * Waitlist storage.
 *
 * Append-only JSON Lines. One line per signup, never rewritten, so a
 * half-finished write can only ever cost the last record — and the file
 * stays readable with `tail`, `grep` and `wc -l` when something looks
 * wrong at 2am.
 */
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(value) {
  return value.length <= 254 && EMAIL_RE.test(value);
}

export async function createStore({ file }) {
  const entries = [];
  const byEmail = new Map();

  await mkdir(dirname(file), { recursive: true });

  if (existsSync(file)) {
    const raw = await readFile(file, "utf8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      let record;
      try {
        record = JSON.parse(line);
      } catch {
        continue; // a torn final line from an interrupted write
      }
      if (!record || typeof record.email !== "string") continue;
      if (byEmail.has(record.email)) continue;
      entries.push(record);
      byEmail.set(record.email, entries.length);
    }
  }

  // Serialises appends so two concurrent requests cannot interleave lines.
  let writeQueue = Promise.resolve();

  return {
    count() {
      return entries.length;
    },

    positionOf(email) {
      return byEmail.get(email) ?? null;
    },

    all() {
      return entries.slice();
    },

    /**
     * Returns { position, duplicate }. Duplicates are not an error: a
     * researcher who signs up twice should be told they are already in.
     */
    async add({ email, context = "", source = "", ip = "", userAgent = "" }) {
      const existing = byEmail.get(email);
      if (existing) return { position: existing, duplicate: true };

      const record = {
        email,
        context: String(context).slice(0, 40),
        source: String(source).slice(0, 40),
        ip: String(ip).slice(0, 45),
        userAgent: String(userAgent).slice(0, 200),
        joinedAt: new Date().toISOString()
      };

      entries.push(record);
      const position = entries.length;
      byEmail.set(email, position);

      writeQueue = writeQueue.then(() =>
        appendFile(file, JSON.stringify(record) + "\n", "utf8")
      );
      await writeQueue;

      return { position, duplicate: false };
    },

    toCsv() {
      const escape = (value) => {
        const text = String(value ?? "");
        return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
      };
      const header = "position,email,context,source,joined_at";
      const rows = entries.map((entry, index) =>
        [index + 1, entry.email, entry.context, entry.source, entry.joinedAt].map(escape).join(",")
      );
      return [header, ...rows].join("\n") + "\n";
    }
  };
}
