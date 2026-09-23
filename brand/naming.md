# Naming

## The name: Peakline

**Peakline** — `PEEK-line`.

It comes from the page's own hero: a chromatogram is a baseline with one
dominant peak, and the whole premise of the business is that you can see that
trace before you buy. The name says the thesis rather than the category.

Practical reasons it was chosen over another `pept-` word:

- **It is outside the crowded morpheme.** Almost every peptide supplier is
  built on `pept-`, `pep-` or `-tide`. That thicket is where collisions live,
  and it is where the last name died.
- **It is two ordinary English words**, so it spells itself after one hearing
  and survives being read aloud down a phone line.
- **It is not descriptive of the goods**, which makes it a stronger mark than
  "Halcyon Peptides" would be. Descriptive marks are cheap to adopt and hard
  to defend.
- **It does not pin the product line.** Assay services or a certificate
  registry fit under it without a rename.

## Why the previous name was abandoned

The company was called **Peptra** until `peptra.com` turned out to be an
operating US telehealth business selling doctor-prescribed peptides —
tirzepatide and semaglutide among them, which are also in this catalogue — with
a ™ on its wordmark.

Same name, same goods, overlapping customers. That is the ordinary test for
likelihood of confusion, not a technicality.

**The lesson, recorded because it cost a rename:** the risk was never an
identical name in an unrelated field. It was an existing company in an adjacent
one, which is exactly what this document warned about and what nobody checked.
Clearance comes before the domain, and the domain comes before the build.

## Before you commit to Peakline

**None of this has been verified.** The build environment has no outbound
network — DNS, RDAP and the web are all blocked — so every line below is an
action for you, not a claim by me. That is precisely the gap that let the last
name through.

- [ ] **USPTO TESS**, Class 1 (chemicals for scientific use) and Class 5. A
      clearance search by an attorney, not a keyword search by you.
- [ ] **A plain Google search** for the name plus "peptide", "bio", "labs".
      Look for an operating company in an adjacent field, which is the failure
      mode that actually bites.
- [ ] **The domain.** `peakline.com` first; a country or `.co` second best.
- [ ] **Handles** on X, LinkedIn and Instagram.

Only then set `name` and `domain` in `brand.json` and run `npm run build`.

## Alternates, if Peakline does not clear

| Name | Read | Trade-off |
| --- | --- | --- |
| **Basepeak** | Chromatography term of art: the most intense peak | Closer to jargon; may read as opaque outside the lab |
| **Retention** | Retention time — when a compound comes off the column | Common English word, so harder to own |
| **Corva Bio** | Corvid; short, hard consonants | Close to Corvus Pharmaceuticals — check carefully |
| **Kestrel Bio** | Precision; a bird that holds still before it strikes | "Kestrel" is well used in biotech already |

Earlier drafts listed **Sequenta**, which should not be used: it is close to a
genomics company of that name. Its presence in an earlier version of this file
is itself the point — a list of names nobody had cleared.

## Voice

The brand thesis is one sentence: **the certificate comes before the order.**

Everything on the site is downstream of it:

- **Publish numbers, not adjectives.** "99.21 % by area at 214 nm" everywhere
  "high purity" would sit.
- **Never make a therapeutic claim**, imply a human use, or publish dosing.
  Not caution — it is the difference between a research reagent supplier and
  an unapproved drug distributor. A test enforces it on every page.
- **Say what you are not.** "We are not a synthesis house and don't pretend to
  be" earns more from a working scientist than any claim of scale.
- Second person, active voice, British-neutral spelling as set on the site
  ("lyophilised", "normalisation").

## Design tokens

Set in `public/styles.css` under `:root`, with a full dark-theme redefinition.

| Role | Light | Dark |
| --- | --- | --- |
| Ground | `#F2F5F4` | `#0A1113` |
| Surface | `#FFFFFF` | `#111A1C` |
| Ink | `#0D1A1B` | `#E6EEEE` |
| Muted ink | `#55686A` | `#93A5A7` |
| Rule | `#D3DDDC` | `#223033` |
| Trace (accent) | `#00726E` | `#38D6C9` |
| Amber (secondary data) | `#8F5400` | `#E0A04A` |

The neutrals are biased toward the teal rather than pure grey, so the accent
sits in the same family as the page it is on.

**Type**: Archivo (display) · Source Sans 3 (body) · IBM Plex Mono (data, lot
numbers, section marks). The mono face does real work — it is the typeface of
the instrument printout the whole site imitates.

**Layout**: a certificate of analysis. Hairline rules, numbered sections
(`§ 01`), tabular figures, data right-aligned in columns that line up.
