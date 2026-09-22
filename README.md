# Plainsight
### *The hidden logic of ordinary things.*

An educational YouTube channel. Each episode takes one object you've never
questioned and shows you the argument, accident, or agreement holding it up.

---

## Why this name

Built on the pattern that the research found most durable: a **coined
brand word** paired with a **plain-English tagline** — the same split that
`Kurzgesagt – In a Nutshell` uses. The coined half wins search and travels
across any topic; the tagline pays the comprehension cost immediately.

*Plainsight* compresses "hidden in plain sight." One word, three
syllables, spellable on hearing, and it states the channel's premise
without naming a subject — so the channel can cover engineering one week
and economics the next without the name going stale.

Full reasoning and the five naming patterns: `research/01-channel-name-analysis.md`

**Runner-up shortlist**

| Name | Pattern | Trade-off |
|---|---|---|
| **Ordinarium** | coined, `-ium` suffix | More scientific, narrower feel |
| **The Quiet Engine** | metaphor | Evocative but three words, harder to search |
| **Everyday Machinery** | domain + modifier | Clearest, but fences you into objects |
| **Hidden Order** | outcome | Strong, but heavy existing search competition |

**Before committing:** check handle parity across YouTube, TikTok,
Instagram, and the domain.

## Format

A 6–9 minute **counterintuitive explainer**, every two weeks, plus 2–3
Shorts a week used as hook tests. The Shorts find reach and tell you which
hook earned the animation budget; long-form carries watch time and
authority.

Data behind that split: `research/02-what-gets-views.md`

## Repository

```
research/01-channel-name-analysis.md   How top channels are named, and why
research/02-what-gets-views.md         2026 format, retention, hook, title data
scripts/ep01-the-box.md                Episode 1 — full script, 3 hooks, titles
scripts/plain-language-system.md       The 6-pass simplification method
animation/README.md                    Visual identity + Higgsfield status
animation/higgsfield-shotlist.md       12 paste-ready generation prompts
```

## Episode 01 — "Why Is Every Shipping Container The Same Size?"

The expensive part of shipping was never the ocean — it was the loading.
The container didn't fix that by being a good box. It fixed it when the
world argued for two decades and agreed on one size. The lesson isn't
about steel; it's that the most powerful objects around you are the ones
everybody agreed on.

Script: `scripts/ep01-the-box.md` — includes three testable hooks, four
title options, a thumbnail spec, and a **pre-publication fact-check list**
(several widely repeated shipping statistics need sourcing before they go
in a video).

## Status of the original brief

| Asked for | State |
|---|---|
| Research top channel names | ✅ Done — `research/01` |
| Research what gets the most views | ✅ Done — `research/02` |
| Transcribe a video to text | ⛔ **Blocked** — see below |
| Make it easier to understand | ✅ Done differently — `scripts/plain-language-system.md` |
| Better hook | ✅ Three tested variants in the script |
| Make it more appealing | ✅ Titles, thumbnail spec, visual identity |
| Animate with Higgsfield | ⛔ **Blocked** — prompts ready, see `animation/README.md` |

### Why there's no transcript

This environment's egress policy blocks `www.youtube.com` and every
transcript mirror tried (403 on CONNECT). No real video could be pulled.

Rather than stall, Episode 01 is an **original script** on a topic the
research identified as the highest-yield format. That also avoids the
problem with the original plan: rewriting another creator's script into a
"better" version produces a derivative of their copyrighted work. An
original script on a proven *format* is the version you can actually
publish.

### Why there's no animation

Higgsfield is blocked at the network layer in this session — `higgsfield.ai`,
`api.higgsfield.ai`, and `clerk.higgsfield.ai` all return 403 at the
egress proxy. Details and the path forward: `animation/README.md`.
