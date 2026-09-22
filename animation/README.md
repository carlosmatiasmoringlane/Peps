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

---

## The generation pipeline

`generate.sh` runs the whole episode against the Higgsfield CLI. Prompts
live in `prompts/ep01.tsv` (shot id, duration, prompt) so you can edit
wording without touching the script.

**Two stages per shot:**

1. `gpt_image_2_5` → a still keyframe at 2k. This is the documented
   default for flat graphic/vector work.
2. `seedance_2_5` → animates that keyframe via `--start-image`.

Generating the still *first* is the important part. It locks the style
before any motion exists, which is what keeps 19 clips looking like one
episode rather than 19 unrelated videos. Going straight to text-to-video
gives you 19 different drawing styles.

```bash
./generate.sh --probe          # s01 + s08b only — run this first
./generate.sh --stills-only    # all keyframes, no video (cheap review)
./generate.sh                  # full episode
./generate.sh --only s06       # single shot
./generate.sh --vertical       # 9:16 for the Shorts
```

Results download to `animation/out/` (gitignored) with a `manifest.tsv`
of source URLs. Existing keyframes are skipped on re-run, so a failed
shot can be retried without regenerating everything.

**Start with `--probe`.** It generates s01 (sets the framing s12 must
match) and s08b (the hardest shot, and the episode's thesis image). If
the style holds on those two, the rest are variations. If it doesn't,
you've spent two generations instead of nineteen finding out.

Then `--stills-only` to review all 19 keyframes as images before paying
for video. Video is the expensive stage; approve the stills first.

### Shot durations

Capped at 30s, the `seedance_2_5` ceiling. Script sections longer than
that are split into `a`/`b` takes (s02a/s02b, s04a/s04b, and so on) and
joined in the edit. 19 clips cover the 7-minute episode.

### Status: not yet run

**The script has never been executed against the live API.** Every
Higgsfield host is blocked at the network layer in the environment where
it was written, so no shot has been generated and no output verified.

What *was* verified:
- `bash -n` syntax check passes.
- Full logic tested against a mock CLI: auth gate, TSV parsing, two-stage
  chaining, URL extraction, download, manifest writes, skip-if-exists,
  and the `--probe` filter all behave correctly.

What could **not** be verified, and where breakage is most likely:
- **The response JSON shape.** `extract_url` scrapes the first media URL
  out of the response rather than reading a named field, because the
  real shape was never observed. If it returns nothing, run one command
  by hand with `--json`, look at the output, and fix that one function.
- Exact parameter names accepted by each model. If a flag is rejected,
  `higgsfield model get <model> --json` prints the real schema.
- Whether `gpt_image_2_5` holds the flat-vector style tightly enough
  across 19 prompts. That's what `--probe` is for.

Treat the first run as a smoke test, not a batch job.
