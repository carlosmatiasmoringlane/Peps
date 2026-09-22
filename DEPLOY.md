# Deploying Peptra

No build step and no dependencies. The only stateful thing is
`data/waitlist.jsonl`, which **must** sit on a persistent volume — without one,
every redeploy silently wipes the waitlist.

## Fly.io

Cheapest path with a real volume. Roughly $3–5/month.

```bash
fly launch --copy-config --no-deploy      # reads fly.toml; pick your app name
fly volumes create peptra_data --size 1 --region iad
fly secrets set ADMIN_TOKEN=$(openssl rand -hex 24)
fly deploy
fly open
```

Then point the domain at it:

```bash
fly certs add peptra.com
fly certs add www.peptra.com
# Fly prints the A/AAAA (or CNAME) records to add at your registrar.
fly certs show peptra.com                  # re-check until it says Ready
```

## Render

```bash
# Push the branch, then: Dashboard > New > Blueprint > pick this repo.
# render.yaml provisions the service, the 1 GB disk at /data, and a
# generated ADMIN_TOKEN.
```

Add the domain under **Settings > Custom Domains** and copy the records it
gives you to your registrar.

## Any Docker host

```bash
docker build -t peptra .
docker volume create peptra_data
docker run -d --name peptra -p 80:3000 \
  -v peptra_data:/data \
  -e TRUST_PROXY=1 \
  -e ADMIN_TOKEN="$(openssl rand -hex 24)" \
  peptra
```

Put TLS in front of it (Caddy, nginx, a load balancer). `TRUST_PROXY=1` tells
the app to read the visitor's address from `X-Forwarded-For`; leave it unset if
nothing is proxying, or the rate limiter will treat everyone as one client.

## After the first deploy — check these

```bash
curl -fsS https://peptra.com/healthz                       # {"ok":true,...}
curl -fsSI https://peptra.com/ | grep -i strict-transport  # HSTS present
curl -fsS -X POST https://peptra.com/api/waitlist \
  -H 'Content-Type: application/json' -d '{"email":"you@yours.com"}'
```

Then pull the list back:

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://peptra.com/api/waitlist/export.csv -o waitlist.csv
```

## Still required before you send email

The page promises "one email when we open" and one-click unsubscribe. Neither
exists yet — there is no mail provider wired in. Collecting addresses is fine
today; **broadcasting to them is not**, until you add:

1. **Double opt-in.** One click currently adds any address, so anyone can enter
   someone else's. A confirmation email is what makes the list lawful under
   GDPR and what keeps you out of spam folders.
2. **One-click unsubscribe**, with the `List-Unsubscribe` header. Required by
   Gmail and Yahoo for bulk senders.
3. **SPF, DKIM and DMARC** on the sending domain, or your launch announcement
   lands in spam.

Postmark, Resend or SES all cover this. `server/store.js` is the only file that
touches storage, so adding a `confirmed` flag is a contained change.
