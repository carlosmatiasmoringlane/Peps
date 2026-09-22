# Naming

## The name: Peptra

**Peptra** — two syllables, `PEP-truh`.

`pept-` is the only morpheme in the category that needs no explanation: anyone
in the market reads "peptide" on sight. `-ra` closes it short and clinically,
the way a reagent brand closes rather than the way a supplement brand does
(`-vive`, `-genix`, `-max`). The result spells itself after one hearing, takes a
possessive cleanly ("Peptra's release spec"), has no plural problem, and reads
as a noun rather than a claim — which matters in a category where the regulator
reads your name along with everything else.

It also leaves room. Nothing in it says "peptides only", so a second product
line — assay services, a COA registry — doesn't require a rename.

### Alternates, in the order I'd rank them

| Name | Read | Trade-off |
| --- | --- | --- |
| **Sequenta** | Sequence + the `-a` ending of a lab brand | Softer, more European; less obviously peptide |
| **Corva Bio** | Corvid; short, hard consonants, memorable | Says nothing about the category on its own |
| **Kestrel Bio** | Precision, a bird that holds dead still before it strikes | "Kestrel" is well used in biotech already — check carefully |
| **Halcyon Peptides** | Descriptive, calm, trustworthy | Literal; harder to own, and pins you to one product line |

### Before you commit

None of this was verifiable from the build environment — outbound DNS and RDAP
are blocked here, so **every availability claim below is unchecked**:

- `peptra.com` and `getpeptra.com` — check registration, and check who holds
  them if taken.
- USPTO TESS, Class 1 (chemicals for scientific use) and Class 5. "Pep-" marks
  are dense; a clearance search by an attorney is cheap next to a rebrand.
- Handles on X, LinkedIn and Instagram.
- A Google search for `peptra` — the failure mode is an existing company in an
  adjacent field, not an identical one.

## Voice

The brand thesis is one sentence: **the certificate comes before the order.**

Everything on the page is downstream of it. Consequences for copy:

- **Publish numbers, not adjectives.** "99.21 % by area at 214 nm" everywhere
  "high purity" would sit.
- **Never make a therapeutic claim**, imply a human use, or publish dosing. Not
  as a matter of caution — it is the difference between a research reagent
  supplier and an unapproved drug distributor.
- **Say what you are not.** "We are not a synthesis house and don't pretend to
  be" earns more trust from a working scientist than any claim of scale.
- Second person, active voice, British-neutral spelling as set on the page
  ("lyophilised", "normalisation") — pick one and hold it.

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
sits in the same family as the page it's on.

**Type**: Archivo (display, 600/700, tight tracking) · Source Sans 3 (body) ·
IBM Plex Mono (data, lot numbers, section marks). The mono face is doing real
work — it is the typeface of the instrument printout the whole page imitates.

**Layout**: a certificate of analysis. Hairline rules, numbered sections (`§ 01`),
tabular figures, and data set right-aligned in columns that actually line up.
