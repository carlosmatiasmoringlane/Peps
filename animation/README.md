# Animation — Higgsfield

## Status: blocked in this session

Higgsfield was set up as far as this environment allows, and then hit a
hard network wall.

**What worked**

- `npm i -g @higgsfield/cli` → installed, **v1.1.26** (verified on the
  npm registry as `higgsfield-ai/cli` before installing).
- `npx skills add higgsfield-ai/skills` → installed 8 skills, including
  `higgsfield-video-explainer` and `higgsfield-youtube-thumbnail`, both
  directly useful here. They are in `.agents/skills/` and **gitignored**
  — third-party code, not committed into this repo. The container is
  ephemeral, so they will need reinstalling in a future session anyway.

**What did not**

- `higgsfield auth login` could not complete, for two independent reasons:

  1. **Loopback callback.** The CLI uses OAuth 2.0 PKCE with
     `redirect_uri=http://localhost:8765/callback`. That callback lands on
     *this container's* localhost. A browser on your machine cannot reach
     it, so the flow can never hand the token back here. The CLI also
     writes its sign-in page to a `file://` path on this container, which
     your browser likewise cannot open.
  2. **The API is blocked outright.** Every Higgsfield host returns 403 at
     the egress proxy on CONNECT:
     `higgsfield.ai`, `api.higgsfield.ai`, `clerk.higgsfield.ai`,
     `higgsfield.com`.

Reason 2 is the decisive one. Even with a token pasted in by hand, the CLI
could not reach the API to generate a single frame from this session. This
is an organization egress-policy denial, not a bug and not something to
retry or work around.

**The MCP server is also unavailable** — `ListConnectors` shows only Gmail
and Google Drive; `SearchMcpRegistry` returns no Higgsfield entry.

So no shots were generated. What's here instead is
`higgsfield-shotlist.md`: every shot of Episode 01 written as a
paste-ready generation prompt, so the moment Higgsfield is reachable the
work is mechanical rather than creative.

## To run it

1. Connect Higgsfield at claude.ai → Settings → Connectors, and enable it
   for the chat.
2. Re-run in a fresh session: *"Generate the shots in
   `animation/higgsfield-shotlist.md` with Higgsfield."*
3. Shots are numbered to match the script timecodes in
   `../scripts/ep01-the-box.md`.

If Higgsfield isn't in the directory for this account, the same prompts
work in any image/video generation tool — they're written as plain
descriptions, not tool-specific syntax.

## Visual identity — original to this channel

Deliberately **not** an imitation of any existing science channel. The
look is built around the premise: ordinary objects, treated like museum
pieces.

- **Palette:** warm off-white background (#F4F1EA), one charcoal
  (#1F1F1F) for line work, one accent orange (#E2572B) reserved for *the
  single thing the viewer should be looking at.* One accent only. If two
  things are orange, the shot has failed.
- **Line:** clean vector, uniform weight, slight hand-drawn wobble so it
  doesn't read as corporate infographic.
- **Figures:** simple charcoal silhouettes. No faces, no expressions.
  They are scale references and labour, not characters.
- **Camera:** locked off or slow lateral drift. No zooms, no shake.
  Stillness is the brand — it contrasts with the frantic pacing of the
  niche.
- **Type:** one geometric sans, two weights, used sparingly.
- **Motion rule:** one thing moves at a time. The eye should never have
  to choose.

## Per-shot prompt template

> [SHOT] — [duration]. Flat 2D vector animation, warm off-white
> background #F4F1EA, charcoal #1F1F1F line work, single accent orange
> #E2572B on [the one subject]. [Action.] [Camera.] No text overlay.
> Clean, minimal, museum-like. 16:9.

Keep the style clause identical across every shot — that repetition is
what makes the episode look like one piece rather than twelve.
