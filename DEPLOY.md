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
fly certs add peptra.com.co
fly certs add www.peptra.com.co
# Fly prints the A/AAAA (or CNAME) records to add at your registrar.
fly certs show peptra.com.co                  # re-check until it says Ready
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
curl -fsS https://peptra.com.co/healthz                       # {"ok":true,...}
curl -fsSI https://peptra.com.co/ | grep -i strict-transport  # HSTS present
curl -fsS -X POST https://peptra.com.co/api/waitlist \
  -H 'Content-Type: application/json' -d '{"email":"you@yours.com"}'
```

Then pull the list back:

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://peptra.com.co/api/waitlist/export.csv -o waitlist.csv
```

## Email setup

Double opt-in, one-click unsubscribe and the consent log are built. Two things
are account setup rather than code:

**1. A sending provider.** Postmark or Resend; both are one token.

```bash
fly secrets set MAIL_PROVIDER=postmark POSTMARK_TOKEN=xxxxx
fly secrets set PUBLIC_URL=https://peptra.com.co
```

`PUBLIC_URL` is not optional — it is the base for every confirmation link, and
the server warns at boot if it is unset in production. Leave `MAIL_PROVIDER`
on its `console` default and links are printed to the log and never delivered,
so nobody can confirm and the waitlist silently collects nothing.

**2. SPF, DKIM and DMARC** on the sending domain. Your provider generates the
records; add them at your registrar alongside the A/AAAA records. Without them
the launch announcement lands in spam. Start DMARC at `p=none` and tighten once
the reports look clean:

```
_dmarc.peptra.com.co  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@peptra.com.co"
```

### Verify the round trip on the real domain

```bash
curl -fsS -X POST https://peptra.com.co/api/waitlist \
  -H 'Content-Type: application/json' -d '{"email":"you@yours.com"}'
# -> {"ok":true,"state":"pending","resent":false}
```

Then click the link in the inbox. You should land on a page showing position
#1, and `https://peptra.com.co/healthz` should report one confirmed subscriber.
Check the message's raw headers for `List-Unsubscribe` while you are there.
