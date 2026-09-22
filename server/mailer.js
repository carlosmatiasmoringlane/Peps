/**
 * Transactional email.
 *
 * Two providers over plain fetch, so the zero-dependency property holds.
 * The default is `console`, which prints the confirmation link instead of
 * sending it — that is what you want in development, and it is loud enough
 * that nobody ships it to production by accident (the server logs a warning
 * at boot).
 */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

export class MailError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "MailError";
    this.status = status;
    this.body = body;
  }
}

/* ------------------------------------------------------------------ *
 * Templates
 * ------------------------------------------------------------------ */

export function confirmationEmail({ confirmUrl, unsubscribeUrl, from }) {
  const subject = "Confirm your place on the Peptra waitlist";

  const text = [
    "You asked to join the Peptra waitlist.",
    "",
    "Confirm that it was you, and we'll hold your place:",
    confirmUrl,
    "",
    "If you didn't request this, ignore this email — nothing happens without",
    "that click, and we won't write to you again.",
    "",
    "— Peptra",
    "Research use only. Not for human or veterinary use.",
    "",
    "Unsubscribe: " + unsubscribeUrl
  ].join("\n");

  // Deliberately plain: a table-free, image-free, single-column message
  // renders the same everywhere and is far less likely to be filtered.
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#F2F5F4;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0D1A1B;line-height:1.6">
  <div style="max-width:520px;margin:0 auto">
    <p style="font:600 20px/1.2 Helvetica,Arial,sans-serif;margin:0 0 20px">Peptra</p>
    <p style="margin:0 0 16px">You asked to join the Peptra waitlist.</p>
    <p style="margin:0 0 24px">Confirm that it was you, and we'll hold your place.</p>
    <p style="margin:0 0 24px">
      <a href="${escapeHtml(confirmUrl)}"
         style="display:inline-block;background:#00726E;color:#fff;text-decoration:none;padding:12px 20px;border-radius:3px;font-weight:600">
        Confirm my place
      </a>
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#55686A">
      If you didn't request this, ignore this email — nothing happens without that
      click, and we won't write to you again.
    </p>
    <p style="margin:0 0 8px;font-size:12px;color:#7D8F90;border-top:1px solid #D3DDDC;padding-top:16px">
      Research use only. Not for human or veterinary use.
    </p>
    <p style="margin:0;font-size:12px;color:#7D8F90">
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#7D8F90">Unsubscribe</a>
    </p>
  </div>
</body></html>`;

  return { subject, text, html, from };
}

/* ------------------------------------------------------------------ *
 * Providers
 * ------------------------------------------------------------------ */

function consoleProvider() {
  return {
    name: "console",
    async send({ to, subject, text }) {
      const link = (text.match(/https?:\/\/\S*confirm\S*/) || [])[0];
      console.log("\n──────── email (not sent: MAIL_PROVIDER=console) ────────");
      console.log(`  to      : ${to}`);
      console.log(`  subject : ${subject}`);
      if (link) console.log(`  confirm : ${link}`);
      console.log("─────────────────────────────────────────────────────────\n");
      return { id: "console" };
    }
  };
}

function postmarkProvider(token) {
  return {
    name: "postmark",
    async send({ to, from, subject, text, html, unsubscribeUrl }) {
      const res = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: {
          "X-Postmark-Server-Token": token,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          From: from,
          To: to,
          Subject: subject,
          TextBody: text,
          HtmlBody: html,
          MessageStream: "outbound",
          Headers: [
            { Name: "List-Unsubscribe", Value: `<${unsubscribeUrl}>` },
            { Name: "List-Unsubscribe-Post", Value: "List-Unsubscribe=One-Click" }
          ]
        })
      });
      if (!res.ok) {
        throw new MailError("Postmark rejected the message", {
          status: res.status,
          body: await res.text().catch(() => "")
        });
      }
      return { id: (await res.json().catch(() => ({}))).MessageID };
    }
  };
}

function resendProvider(apiKey) {
  return {
    name: "resend",
    async send({ to, from, subject, text, html, unsubscribeUrl }) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text,
          html,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
          }
        })
      });
      if (!res.ok) {
        throw new MailError("Resend rejected the message", {
          status: res.status,
          body: await res.text().catch(() => "")
        });
      }
      return { id: (await res.json().catch(() => ({}))).id };
    }
  };
}

/**
 * Picks a provider from the environment. Unknown or misconfigured
 * providers fail at boot rather than at the first signup.
 */
export function createMailer(env = process.env) {
  const choice = (env.MAIL_PROVIDER || "console").toLowerCase();
  const from = env.MAIL_FROM || "Peptra <hello@peptra.com>";

  let provider;
  if (choice === "console") {
    provider = consoleProvider();
  } else if (choice === "postmark") {
    if (!env.POSTMARK_TOKEN) throw new Error("MAIL_PROVIDER=postmark requires POSTMARK_TOKEN");
    provider = postmarkProvider(env.POSTMARK_TOKEN);
  } else if (choice === "resend") {
    if (!env.RESEND_API_KEY) throw new Error("MAIL_PROVIDER=resend requires RESEND_API_KEY");
    provider = resendProvider(env.RESEND_API_KEY);
  } else {
    throw new Error(`Unknown MAIL_PROVIDER "${choice}" — use console, postmark or resend`);
  }

  return {
    name: provider.name,
    from,
    async sendConfirmation({ to, confirmUrl, unsubscribeUrl }) {
      const message = confirmationEmail({ confirmUrl, unsubscribeUrl, from });
      return provider.send({ ...message, to, unsubscribeUrl });
    }
  };
}
