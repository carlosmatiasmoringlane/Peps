/**
 * The confirm and unsubscribe landing pages.
 *
 * Rendered server-side because they carry a position number, but built from
 * the site's own stylesheet and tokens so they don't feel like a different
 * website at the one moment a new subscriber is paying attention. No inline
 * style or script, so the Content-Security-Policy needs no exception.
 */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

function shell({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} · Peptra</title>
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a class="wordmark" href="/"><span class="mark" aria-hidden="true"></span>Peptra</a>
    <span class="chip">Research use only</span>
  </div>
</header>
<main class="result-main">
  <div class="wrap">
    <div class="result-card">
${body}
    </div>
  </div>
</main>
</body>
</html>`;
}

const fineprint = `      <p class="result-fineprint">
        Peptra materials are sold for laboratory research use only. Not for human
        or veterinary use.
      </p>`;

export function confirmedPage({ position, email, already }) {
  return shell({
    title: already ? "Already confirmed" : "You're on the list",
    body: `      <p class="eyebrow">Waitlist · confirmed</p>
      <h1 class="h2">${already ? "You were already confirmed." : "That's it — you're on the list."}</h1>
      <p class="result-position">#${esc(position)}</p>
      <p class="result-lede">
        ${esc(email)} holds position ${esc(position)}. Founding accounts open in
        waitlist order, and we'll write to you once when they do.
      </p>
      <p>
        Nothing else will arrive in the meantime. Every email we send carries a
        one-click unsubscribe.
      </p>
      <div class="result-actions">
        <a class="btn btn-quiet" href="/">Back to the site</a>
      </div>
${fineprint}`
  });
}

export function confirmFailedPage({ reason }) {
  const copy = reason === "unsubscribed"
    ? {
        title: "You've left the list",
        heading: "That address has unsubscribed.",
        detail: "This link belongs to an address that asked to be removed. If that was a mistake, sign up again and we'll send a fresh confirmation."
      }
    : {
        title: "Link not recognised",
        heading: "This confirmation link isn't valid.",
        detail: "It may have been truncated by an email client, or it belongs to a signup that has since been replaced. Signing up again sends a fresh link."
      };

  return shell({
    title: copy.title,
    body: `      <p class="eyebrow">Waitlist</p>
      <h1 class="h2">${copy.heading}</h1>
      <p class="result-lede">${copy.detail}</p>
      <div class="result-actions">
        <a class="btn btn-primary" href="/#waitlist">Sign up again</a>
        <a class="btn btn-quiet" href="/">Back to the site</a>
      </div>
${fineprint}`
  });
}

export function unsubscribedPage({ email, unknown }) {
  return shell({
    title: "Unsubscribed",
    body: `      <p class="eyebrow">Waitlist · removed</p>
      <h1 class="h2">${unknown ? "That address isn't on the list." : "You're off the list."}</h1>
      <p class="result-lede">${
        unknown
          ? "Either the link was truncated in transit, or the address has already been removed. Either way, nothing further will reach you."
          : `We won't email ${esc(email)} again.`
      }</p>
      <p>
        If you change your mind, the waitlist is still open and you can join
        again at any time.
      </p>
      <div class="result-actions">
        <a class="btn btn-quiet" href="/">Back to the site</a>
      </div>
${fineprint}`
  });
}
