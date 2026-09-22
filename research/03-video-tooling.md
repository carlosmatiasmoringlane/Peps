# Video Tooling — What To Actually Animate With

Research pass: 2026-09-22.

## Read this before using anything below

Vendor pricing and terms pages were **blocked by the network** during
this research. The split matters:

- **Open-source licenses below are VERIFIED** — read directly from the
  projects' own LICENSE files on GitHub, which was reachable.
- **Every commercial AI vendor figure below is UNVERIFIED** — credit
  counts, clip lengths, watermark policy and commercial-use rights all
  come from search-result snippets, mostly affiliate blogs. That is
  exactly the source type not to trust for this.

**Do not act on any AI-vendor claim here without opening their own
pricing and terms page yourself.** Commercial-use rights are the field
where being wrong is expensive, and it's the field that could be
verified least.

## Three findings

### 1. Nothing generates a 7-minute video in one pass

Free AI video is 5-10 second clips. The 19-clip assembly plan in
`../animation/` is the correct and only workable approach.

Products advertising "long-form AI video" are stock-footage-and-voiceover
slideshow assemblers. They produce precisely the look this channel's
visual identity rules out.

### 2. Mainstream free AI tiers fail on two counts at once

Reportedly — **all unverified** — Kling, Runway, Pika, Luma, Hailuo,
PixVerse and Vidu each watermark free output *and* restrict it to
non-commercial use, selling commercial rights with the paid tier.

For a monetized channel that isn't an inconvenience, it rules the whole
category out. One snippet claimed Pika's terms bar retroactively
commercialising free-tier output even after upgrading — unverified, but
the kind of clause worth reading for yourself.

### 3. AI video is the wrong tool for this style

This is the finding that matters, and it points away from the pipeline
already built.

Diffusion video models can't hold a flat vector aesthetic. Line weight
wobbles between frames, crisp geometric edges soften, colour drifts off
the single accent, and consistency across 19 separately-generated clips
is fundamentally unreliable — each generation is a fresh roll.

The style spec — flat fills, locked-off camera, one accent colour, one
thing moving at a time — is exactly what deterministic animation tools do
perfectly, and exactly what diffusion models fight.

## Recommended

### Motion Canvas — primary

**MIT licence (verified).** Free, no watermark, unrestricted commercial
use, no signup. Built specifically for informative vector animation timed
to voice-over — the channel's format, described by its own repo.

The decisive property: **style lives in reusable components, not in a
prompt.** All 19 clips are consistent by construction rather than by
luck. `s12` matches `s01` because it reuses the same component, not
because a model reproduced it. Re-rendering a clip after a script change
takes seconds and costs nothing.

It also removes the two-stage keyframe workflow entirely. There's no
style to "lock" because the style is deterministic.

### Remotion — second

Video authored in React. Its licence was read word-for-word: free for an
individual, a for-profit with **up to 3 employees**, or a non-profit —
and free-licence holders may use it *commercially* for creating videos.
A monetised YouTube channel run by one person is covered. Re-check if the
channel ever becomes a company with 4+ employees.

Pick this over Motion Canvas only if React is already familiar.

### DaVinci Resolve (free) — assembly layer, either way

Something has to lay 19 clips on a timeline with the voiceover. Resolve
free does that plus audio and colour at UHD. Its Fusion page can also
originate flat-vector motion if a GUI is preferable to code.

*Commercial-use wording unverified — blackmagicdesign.com was blocked.*

### If AI stays in the pipeline

The only free route that is both watermark-free and commercially safe is
**self-hosted open-weight models** — Wan 2.2 (**Apache 2.0, verified**)
through ComfyUI (**GPL-3.0, verified**). Supports image-to-video from a
keyframe; needs a 24GB consumer GPU for the 5B model; ~5s per clip.

Worth it for occasional organic texture. Not for the 19 core clips — it
still won't render clean flat vector.

## Also verified free and commercially usable

| Tool | Licence | Note |
|---|---|---|
| Manim | MIT (verified) | Excellent for geometric/diagrammatic beats; weaker for silhouettes |
| Synfig Studio | GPL-3.0 (verified) | Purpose-built vector tweening |
| LTX-Video | OpenRAIL-M | States commercial use, but **carries behavioural restrictions — read them** |

## What this means for the Higgsfield work

The shot list, durations, timings and visual identity are
**tool-independent** — they describe what each shot contains, not how
it's rendered, so they carry over to Motion Canvas unchanged.

What becomes redundant is the two-stage still-then-clip pipeline
(`animation/generate.sh`) and the prompt files, which exist only to
coax consistency out of a generative model. That problem disappears with
a deterministic tool.

Keeping both is fine — Higgsfield remains a reasonable option for
one-off organic shots. But the 19 core clips are better served by code.

## Could not verify

- Every AI vendor's credits, clip length, resolution, watermark policy
  and commercial rights (all vendor domains blocked)
- Whether *any* free AI tier grants both no-watermark and commercial
  rights — snippets directly contradicted each other on Runway and Pika
- A claimed "Seedance 2.0" free tier with no watermark — appeared in one
  search and nowhere else; treat as unconfirmed
- Whether card details are required at signup for any AI tool
- Hugging Face Spaces rate limits for free Wan/LTX inference
- DaVinci Resolve free commercial-use wording
- Blender Grease Pencil, OpenToonz, Krita, Inkscape, Kdenlive — plausible
  fits, sites blocked. Grease Pencil in particular is worth a look.
