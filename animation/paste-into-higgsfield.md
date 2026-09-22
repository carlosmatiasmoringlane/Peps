# Paste Into Higgsfield — Episode 01

Every prompt below is **complete and self-contained**. The style clause is
already baked into each one, so you can copy a single block straight into
the Higgsfield prompt box with nothing to fill in.

Generated from `prompts/ep01.tsv` — edit that file and regenerate rather
than editing this one by hand, so the web prompts and `generate.sh` can't
drift apart.

## How to run it

**Work in two passes.** Do every still first, approve them as a set, then
animate. Video is the expensive stage and the stills are what lock the
style — approving them together is how you catch drift before you've paid
to animate it.

**Start with just two: `s01` and `s08b`.** s01 sets the framing that s12
has to match, and s08b is both the hardest shot and the episode's thesis
image. If the style holds on those, the rest are variations. If it
doesn't, you've spent two generations finding out instead of nineteen.

### Stage 1 settings (stills)

| Setting | Value |
|---|---|
| Model | **GPT Image 2.5** |
| Aspect ratio | **16:9** (use 9:16 for Shorts) |
| Resolution | **2k** |

### Stage 2 settings (animation)

| Setting | Value |
|---|---|
| Model | **Seedance 2.5** |
| Start / reference image | the approved still from stage 1 |
| Aspect ratio | **16:9** |
| Resolution | **1080p** |
| Duration | per shot, listed below |

Durations cap at 30s, which is the Seedance 2.5 ceiling. Script sections
longer than that are split into `a`/`b` takes and joined in the edit.

### The one rule

**Exactly one orange element per frame.** If two things are orange, the
shot has failed — regenerate it. `s10a` and `s10b` are the deliberate
exception: they have *no* orange at all, because that's the section about
the dockworkers who lost their jobs, and it should feel colder than the
rest of the episode.

---

# STAGE 1 — Stills (GPT Image 2.5, 16:9, 2k)

### s01 — Hook — the container as museum object

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. A single shipping container sits dead centre on an empty background, lit like a museum artifact on a plinth. Perfectly still and symmetrical. The container is the only orange object in frame. Locked-off camera, no movement.
```

### s02a — Break-bulk chaos (1 of 2)

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. Cross-section of a 1940s cargo ship hold. Dozens of charcoal silhouette figures hand-stack mismatched cargo: sacks, barrels, crates of every different size, loose timber. Deliberately chaotic, no two objects alike, no grid or order anywhere. Slow lateral camera drift left to right.
```

### s02b — Break-bulk chaos (2 of 2)

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. Continued cross-section of a crowded ship hold, charcoal silhouette dockworkers fitting irregular cargo by hand like puzzle pieces. Overlapping continuous motion, cluttered and disordered. Slow lateral camera drift.
```

### s03 — The ship that never moves

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. Wide side view of a cargo ship moored at a dock. A stylised sun arcs across the sky behind it repeatedly, the arcs speeding up. The ship itself does not move at all. Orange accent on the ship hull only. Locked-off camera.
```

### s04a — Cost is at the edges (1 of 2)

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. A horizontal route diagram across the frame: a dock segment, then an open ocean segment, then another dock segment. The ocean segment is thin and pale. Both dock segments swell thick and orange until they dwarf the voyage between them. Locked-off camera.
```

### s04b — Cost is at the edges (2 of 2)

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. A horizontal cost diagram where the two end segments are massive and orange and the long middle segment is thin and pale, emphasising that the edges cost more than the journey. Gentle pulsing on the thick segments. Locked-off camera.
```

### s05 — McLean's observation — double handling

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. Side view: a truck parked beside a cargo ship. Charcoal silhouette figures carry goods out of the truck and into the ship one item at a time in a repeating loop. The walking figures fade to low opacity and the path they walk illuminates in orange, revealing redundant double handling. Locked-off camera.
```

### s06 — Ideal-X, 1956 — the grid reveal

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. A converted tanker at a dock. One orange shipping container lifts smoothly from a truck chassis and lands on the deck. The camera pulls back steadily to reveal fifty-eight identical containers already aligned in a perfect grid. One smooth continuous pull-back, no cuts.
```

### s07a — The box alone doesn't work (1 of 2)

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. One orange shipping container at centre. Around it in a ring, five charcoal outline shapes: a crane, a ship slot, a truck chassis, a rail car, a port gate. Each shape in turn tries to accept the container and visibly fails to fit, too wide or too tall each time. Locked-off camera.
```

### s07b — The box alone doesn't work (2 of 2)

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. An orange container repeatedly failing to fit into mismatched charcoal outline receptacles of different proportions, each mismatch flashing briefly. Rhythmic, mechanical repetition. Locked-off camera.
```

### s08a — The argument — conflicting dimensions

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. Four shipping containers of visibly different dimensions sit in a row, each outlined in a different shade of charcoal. Measurement lines and dimension arrows extend from each, overlapping into a conflicting tangle. Locked-off camera.
```

### s08b — The argument resolves — two sizes survive

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. A tangle of conflicting dimension lines slowly resolves as mismatched containers shrink away until exactly two remain, one short and one exactly twice its length. Both turn orange. The one-to-two length ratio reads instantly. Locked-off camera.
```

### s09a — The box as interface (1 of 2)

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. A single orange shipping container passes in one unbroken horizontal motion through charcoal silhouette systems: a crane, then a ship. Each accepts it without pausing or adjusting. Smooth, mechanical, rhythmic. Camera tracks alongside at constant speed.
```

### s09b — The box as interface (2 of 2)

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. A single orange shipping container continues in unbroken horizontal motion through a charcoal silhouette train and then a truck, each accepting it seamlessly. Hypnotic constant rhythm. Camera tracks alongside at constant speed.
```

### s10a — The human cost (1 of 2)

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. A dense crowd of charcoal silhouette dockworkers fills the frame. One by one they fade out from the edges inward. No orange accent anywhere in this shot, only charcoal and off-white. Slow unhurried fades. Locked-off camera.
```

### s10b — The human cost (2 of 2)

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. An almost empty dock, the last charcoal silhouette figures fading away until only a single automated crane moves alone in the frame. Entirely charcoal and off-white, no accent colour at all. Cold and still. Locked-off camera.
```

### s11a — The pattern everywhere — three that fit

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. Three objects appear in sequence at the same centre position, each replacing the last with a clean cut: a screw thread, a wooden pallet, a railway track gauge. Each settles cleanly into a matching orange socket or receptacle. Locked-off camera.
```

### s11b — The plug that doesn't fit

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. An electrical plug appears at centre and does not fit its socket, sitting there unmatched and slightly askew while the socket stays stubbornly the wrong shape. Held long and unresolved. Locked-off camera.
```

### s12 — Outro — return to the opening frame

```
Flat 2D vector animation still, warm off-white background #F4F1EA, charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform line weight with a slight hand-drawn wobble, simple faceless charcoal silhouettes for people, minimal and museum-like, no text, no lettering, no watermark, no logo. A single shipping container centred on a plinth, completely still, framed identically to an opening museum shot. Absolute stillness held throughout. Locked-off camera.
```

---

# STAGE 2 — Animation (Seedance 2.5, 1080p, 16:9)

Each one needs its approved stage-1 still attached as the start image.

### s01 — 12s — attach `s01` still

```
A single shipping container sits dead centre on an empty background, lit like a museum artifact on a plinth. Perfectly still and symmetrical. The container is the only orange object in frame. Locked-off camera, no movement. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s02a — 17s — attach `s02a` still

```
Cross-section of a 1940s cargo ship hold. Dozens of charcoal silhouette figures hand-stack mismatched cargo: sacks, barrels, crates of every different size, loose timber. Deliberately chaotic, no two objects alike, no grid or order anywhere. Slow lateral camera drift left to right. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s02b — 16s — attach `s02b` still

```
Continued cross-section of a crowded ship hold, charcoal silhouette dockworkers fitting irregular cargo by hand like puzzle pieces. Overlapping continuous motion, cluttered and disordered. Slow lateral camera drift. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s03 — 20s — attach `s03` still

```
Wide side view of a cargo ship moored at a dock. A stylised sun arcs across the sky behind it repeatedly, the arcs speeding up. The ship itself does not move at all. Orange accent on the ship hull only. Locked-off camera. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s04a — 23s — attach `s04a` still

```
A horizontal route diagram across the frame: a dock segment, then an open ocean segment, then another dock segment. The ocean segment is thin and pale. Both dock segments swell thick and orange until they dwarf the voyage between them. Locked-off camera. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s04b — 22s — attach `s04b` still

```
A horizontal cost diagram where the two end segments are massive and orange and the long middle segment is thin and pale, emphasising that the edges cost more than the journey. Gentle pulsing on the thick segments. Locked-off camera. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s05 — 30s — attach `s05` still

```
Side view: a truck parked beside a cargo ship. Charcoal silhouette figures carry goods out of the truck and into the ship one item at a time in a repeating loop. The walking figures fade to low opacity and the path they walk illuminates in orange, revealing redundant double handling. Locked-off camera. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s06 — 20s — attach `s06` still

```
A converted tanker at a dock. One orange shipping container lifts smoothly from a truck chassis and lands on the deck. The camera pulls back steadily to reveal fifty-eight identical containers already aligned in a perfect grid. One smooth continuous pull-back, no cuts. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s07a — 25s — attach `s07a` still

```
One orange shipping container at centre. Around it in a ring, five charcoal outline shapes: a crane, a ship slot, a truck chassis, a rail car, a port gate. Each shape in turn tries to accept the container and visibly fails to fit, too wide or too tall each time. Locked-off camera. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s07b — 25s — attach `s07b` still

```
An orange container repeatedly failing to fit into mismatched charcoal outline receptacles of different proportions, each mismatch flashing briefly. Rhythmic, mechanical repetition. Locked-off camera. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s08a — 25s — attach `s08a` still

```
Four shipping containers of visibly different dimensions sit in a row, each outlined in a different shade of charcoal. Measurement lines and dimension arrows extend from each, overlapping into a conflicting tangle. Locked-off camera. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s08b — 25s — attach `s08b` still

```
A tangle of conflicting dimension lines slowly resolves as mismatched containers shrink away until exactly two remain, one short and one exactly twice its length. Both turn orange. The one-to-two length ratio reads instantly. Locked-off camera. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s09a — 25s — attach `s09a` still

```
A single orange shipping container passes in one unbroken horizontal motion through charcoal silhouette systems: a crane, then a ship. Each accepts it without pausing or adjusting. Smooth, mechanical, rhythmic. Camera tracks alongside at constant speed. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s09b — 25s — attach `s09b` still

```
A single orange shipping container continues in unbroken horizontal motion through a charcoal silhouette train and then a truck, each accepting it seamlessly. Hypnotic constant rhythm. Camera tracks alongside at constant speed. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s10a — 23s — attach `s10a` still

```
A dense crowd of charcoal silhouette dockworkers fills the frame. One by one they fade out from the edges inward. No orange accent anywhere in this shot, only charcoal and off-white. Slow unhurried fades. Locked-off camera. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s10b — 22s — attach `s10b` still

```
An almost empty dock, the last charcoal silhouette figures fading away until only a single automated crane moves alone in the frame. Entirely charcoal and off-white, no accent colour at all. Cold and still. Locked-off camera. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s11a — 23s — attach `s11a` still

```
Three objects appear in sequence at the same centre position, each replacing the last with a clean cut: a screw thread, a wooden pallet, a railway track gauge. Each settles cleanly into a matching orange socket or receptacle. Locked-off camera. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s11b — 22s — attach `s11b` still

```
An electrical plug appears at centre and does not fit its socket, sitting there unmatched and slightly askew while the socket stays stubbornly the wrong shape. Held long and unresolved. Locked-off camera. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

### s12 — 20s — attach `s12` still

```
A single shipping container centred on a plinth, completely still, framed identically to an opening museum shot. Absolute stillness held throughout. Locked-off camera. Slow deliberate motion. Locked-off camera unless a drift is described. No zoom, no camera shake, no push-in.
```

---

## After generating

Download each clip as `s01.mp4`, `s02a.mp4` and so on. The numbering is
the edit order — dropped onto a timeline in filename order they assemble
into the episode, and the timecodes in `../scripts/ep01-the-box.md` tell
you where the voiceover sits against each one.

Two shots to watch in review:

- **s06** — the pull-back revealing the container grid is the emotional
  beat of the first half. If the reveal feels rushed, regenerate rather
  than fixing it with a slow-down in the edit.
- **s12** — has to match `s01` almost exactly. If it doesn't, reuse the
  s01 still as the start image for s12 instead of its own.
