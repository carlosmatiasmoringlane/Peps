# Plainsight — Visual Assets

Built on the same identity as the episode animation
(`../animation/README.md`). One system, so the channel page and the
videos look like the same thing.

> **Verify dimensions before producing finals.** These are the
> long-standing YouTube specs, but they could not be checked live from
> the environment this was written in (YouTube is network-blocked).
> Confirm in Studio first.

## Palette

| Token | Hex | Use |
|---|---|---|
| Paper | `#F4F1EA` | Background, everywhere |
| Charcoal | `#1F1F1F` | Line work, type, silhouettes |
| Signal | `#E2572B` | **The one thing being looked at** |

**One accent per composition.** If two things are orange, the image has
failed. This single rule does more for the brand than anything else here.

## Type

One geometric sans, two weights (Medium for the wordmark, Regular for
everything else). Avoid anything with visible personality — the objects
carry the character, the type stays quiet.

Wordmark: **plainsight**, lowercase, tight tracking, charcoal. Lowercase
because the channel is about things beneath notice; a shouty capitalised
logotype fights the premise.

---

## Avatar — 800 × 800 px

Renders as a circle, usually at **98 px**, sometimes as small as 24 px in
comments. Design for 24 px and it will work everywhere.

**The mark:** a solid orange rectangle, centred, sitting on a thin
charcoal horizontal line. Paper background.

That's it. An object on a plinth — the museum premise of the channel,
abstracted. It reads as "a thing being looked at" rather than "a shipping
container," so it doesn't tie the brand to episode one.

- Rectangle: roughly 2:1, occupying ~40% of the circle's width
- Plinth line: 2–3 px at 800 px, extending slightly past the rectangle
  on both sides
- Generous margin — the circle crop is unforgiving
- **No letterforms.** A "P" is illegible at 24 px and says nothing

Export PNG. Test it at 24 px before committing; almost every avatar that
fails, fails there.

## Banner — 2560 × 1440 px

Only the centre **1546 × 423** is guaranteed visible on every device.
Everything outside it is decoration that many viewers never see.

**Inside the safe area:**
- Wordmark, charcoal, left-of-centre
- Tagline beneath, smaller, regular weight: *The hidden logic of ordinary
  things.*
- Upload cadence, small, low-contrast: *New episode every other week*

**Outside the safe area (desktop and TV):**
- Continue the plinth line horizontally across the full width
- Space charcoal outline objects along it — a screw, a pallet, a plug, a
  container, a railway sleeper
- **Exactly one** in orange, roughly a third in from the left

The payoff: on a phone you see a clean wordmark; on desktop the line
extends into a row of ordinary objects. The brand rewards the bigger
screen instead of merely surviving it.

Max 6 MB.

## Video watermark — 150 × 150 px

The avatar mark alone, charcoal only, no orange, transparent background.
It sits over footage, so it must never compete with the accent colour in
the shot underneath. Set to show from the start of every video.

---

## Thumbnails — 1280 × 720 px

One template, used without exception. On a channel this young,
recognisability beats per-video cleverness.

**The rules:**
1. **One object, centred, large.** Filling roughly half the frame.
2. **Paper background.** Never a photo, never a gradient, never a scene.
3. **One orange element** — the object, or a single number.
4. **Four words maximum**, and only when the image can't carry it alone.
   Charcoal, bottom-left, never over the object.
5. **No faces. No arrows. No circles. No open mouths.** The entire visual
   strategy is looking like a museum object in a feed of shouting.

**Episode 01:** a container, centred, orange. A single price tag: `$0.16`.
**Episode 02:** one road splitting into two identical lanes, a car on
each side facing the viewer, both orange — because the point is that
neither is correct.

Keep under 2 MB. Check every thumbnail at **210 px wide**, which is the
size it actually appears at in a sidebar. If the object isn't instantly
readable there, the thumbnail is wrong regardless of how it looks at
full size.

### Shorts covers — 1080 × 1920 px

Same rules, vertical. Keep the object in the middle third — the top is
covered by UI and the bottom by the title and channel handle.

---

## Production note

Every asset here can be generated through the same pipeline as the
episode shots (`../animation/generate.sh`), since the style clause is
identical. The `higgsfield-youtube-thumbnail` skill installed alongside
the CLI is purpose-built for the thumbnail sizes.

For the wordmark, set it in real type rather than generating it. Image
models are unreliable with lettering, and the logo is the one asset that
has to be pixel-exact and reproducible at every size.
