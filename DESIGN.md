# RwaSport design system

The living reference is the **`/design-system`** route — it reads token values out
of the DOM at runtime, so it cannot drift from the code. This document explains
the rules and the *why*; that page shows the truth. When a screen looks off,
diff it against `/design-system` instead of hunting through other screens.

Status: **Phase 1 (foundation) complete.** Primitives land in Phase 2, domain
components in Phase 3.

---

## Colour

All colour lives in `apps/frontend/src/styles/tokens.css` and is exposed through
`tailwind.config.js`. **No hex values anywhere else** — not in JSX, not as
arbitrary Tailwind values like `bg-[#17171A]`.

| Token | Tailwind | Dark | Light | Use |
|---|---|---|---|---|
| `--bg` | `page` | `#0D0D0F` | `#F4F4F1` | Page background |
| `--surface` | `surface` | `#17171A` | `#FFFFFF` | Cards, rows |
| `--surface-2` | `surface-2` | `#1F1F23` | `#EFEFEB` | Inset areas, ad slots, skeletons |
| `--hairline` | `hairline` | `#2A2A30` | `#DCDCD5` | 1px borders, dividers |
| `--text` | `primary` | `#F2F2F0` | `#17171A` | Primary text |
| `--text-2` | `secondary` | `#9A9A96` | `#5E5E5C` | Secondary text |
| `--text-3` | `tertiary` | `#82827E` | `#767671` | Metadata — times, venues |
| `--text-disabled` | `disabled` | `#5E5E5C` | `#9E9E99` | ⚠ Non-text only |
| `--live` | `live` | `#E8590C` | `#C2410C` | **Live state only** |
| `--on-live` | `live-on` | `#0D0D0F` | `#FFFFFF` | Label on a live fill |
| `--danger` | `danger` | `#D64545` | `#B93232` | Danger **fills**, borders |
| `--danger-text` | `danger-text` | `#E86A6A` | `#B93232` | Danger **as text** |
| `--on-danger` | `danger-on` | `#0D0D0F` | `#FFFFFF` | Label on a danger fill |
| `--success` | `success` | `#3FA37A` | `#2F7D5C` | Verified, approved |

`--bg` is exposed as `page` (so `bg-page`, not `bg-bg`). That is the only place a
token name and its utility name differ.

**Tokens are stored as sRGB channels, not hex** — `--surface: 23 23 26` — so
Tailwind can compose alpha: `rgb(var(--surface) / <alpha-value>)` makes
`bg-surface/50` work. The canonical hex sits in a comment beside each value.

### Rules that are not negotiable

- **Live orange appears nowhere except live state.** Not as an accent, not as a
  brand colour, not on a hover.
- **Danger red is red cards and rejections only.**
- **No shadows. No gradients.** Depth comes from surface level and a 1px
  hairline. There is no `shadow-*` in swept code.
- **No decoration that doesn't encode information.**

### Contrast

`/design-system` recomputes every ratio live against `--surface`. **Never
hand-estimate these — check that page.** Measured:

| Token | Dark | Light | Verdict |
|---|---|---|---|
| `--text` | 15.96:1 | 17.89:1 | AA any size |
| `--text-2` | 6.33:1 | 6.50:1 | AA any size |
| `--text-3` | 4.64:1 | 4.57:1 | AA any size |
| `--text-disabled` | 2.75:1 | 2.69:1 | ⚠ **non-text only** |
| `--live` | 5.00:1 | 5.18:1 | AA any size |
| `--danger-text` | 5.71:1 | 5.89:1 | AA any size |
| `--danger` | **4.09:1** | 5.89:1 | ⚠ **fill only** in dark |
| `--success` | 5.73:1 | 4.99:1 | AA any size |

Label-on-fill pairings, graded against the fill:

| Pairing | Dark | Verdict |
|---|---|---|
| `--on-live` on `--live` | 5.42:1 | AA any size (white would be 3.58) |
| `--on-danger` on `--danger` | **4.43:1** | ⚠ 14px+/600 only |

### Three rules that fall out of this

1. **`--text-disabled` must never carry information a user needs to read.**
   Disabled controls, decorative glyphs, separators — nothing else. Real
   metadata (kickoff times, venues, matchday) uses `--text-3`, which clears
   4.5:1 and is safe at 11px.

2. **Danger has a fill colour and a text colour, and they are not the same.**
   `--danger` (#D64545) is 4.09:1 — a fill, border and chip outline, never small
   text on a dark surface. Red *text* is `--danger-text` (#E86A6A, 5.71:1).

3. **The danger fill can't carry a small label.** `--on-danger` at 4.43:1 is the
   best pairing available (near-black beats white's 4.38), still short of AA. So
   a filled danger control needs its label at **14px+/600**. The default
   rejected / red-card chip has **no fill** — `--danger-text` on `--surface`
   with a `--danger` hairline, which passes at any size.

The LIVE pill inverts to a near-black label because that pairing is 5.42:1 while
white is only 3.58:1. Pinned as `--on-live` so it isn't re-decided per component.

---

## Theming

**Dark is the default and the theme that must be pixel-right.** Light is
authored for every token and kept correct, but no phase is gated on light mode
looking perfect. QA fan screens in both; admin screens in dark only for now.

This exists because the app is used outdoors: a reporter pitchside for 90
minutes, a fan checking a score walking down the street at midday. Dark UI in
direct sun is materially harder to read, and that door stays open.

### Why the CSS looks inverted

`:root` carries the **dark** values and `html:not(.dark)` overrides them for
light. That is deliberate: it keys the tokens to the very same `.dark` class
Tailwind's legacy `dark:` variants respond to, so tokenised and un-swept screens
can never disagree about which theme is on. Once the sweep removes the last
`dark:` variant this can flip to a conventional `[data-theme]` attribute
**without changing a single token value**.

---

## Typography

**Archivo, self-hosted, one variable file** —
`@fontsource-variable/archivo/wdth.css` (`wght` 100–900, `wdth` 62–125%). Body
and display are the same download at different widths, so display costs no extra
request.

- `font-sans` — Archivo at natural width. Body copy, labels, everything.
- `font-display` — the same file at `wdth 125%` (“Archivo Expanded”). Scores and
  display type, at weight 600 (`font-semibold`).
- `.numerals` — display + semibold + tabular, for scores.

**Never load fonts from a CDN.** The extra RTT is felt on Rwandan mobile
networks. Before Phase 1 this app declared Bebas Neue and DM Sans and loaded
neither, so every `font-display` class was a no-op and the whole product
rendered in system sans.

### Scale

28 / 22 / 18 / 15 / 13 / 11, body 15 — mapped onto `text-2xl` … `text-xs`, so
existing `text-sm` / `text-lg` usages snap onto the scale automatically.

| Class | Size | Use |
|---|---|---|
| `text-2xl` | 28px | Display, scores |
| `text-xl` | 22px | Screen title |
| `text-lg` | 18px | Section heading |
| `text-base` | 15px | **Body default** |
| `text-sm` | 13px | Secondary, meta |
| `text-xs` | 11px | Labels, pills |

**Form controls are pinned to 16px** in the base layer, above the 15px body
size, because iOS zooms the viewport when a focused input is under 16px.

### Tabular numerals

**Every numeral in the product is tabular.** Proportional digits change column
width as a score changes, which was the most visible correctness defect in the
old UI. `th`, `td`, `time`, `output` and `[data-numeric]` get it in the base
layer; `.tnum` and `.numerals` are available for anything else. `/design-system`
shows a side-by-side of the failure.

Headings default to the display face but are **not** forced uppercase — screens
that want caps say `uppercase` explicitly, and most already do.

---

## Spacing, radius, metrics

- **Spacing** — 4px base, only these steps: `4 8 12 16 24 32`
  (`1 2 3 4 6 8`).
- **Radius** — `rounded-card` 8px, `rounded-control` 4px, `rounded-pill` 999px,
  `rounded-none` on single-sided accent bars. Nothing else.
- **Borders** — 1px, always `border-hairline`.

Named layout metrics, so screens cannot drift from them:

| Class | Value | Meaning |
|---|---|---|
| `h-row` | 68px | Uniform match row. **Live rows are not taller.** |
| `w-rail` | 56px | Status rail; also bottom-nav height |
| `min-h-tap` / `min-w-tap` | 44px | Minimum interactive target |

---

## Layout rules

- **Mobile-first.** Author base styles at 360px, add `md:` upward. Never the
  reverse.
- Match rows are a uniform **68px**; status sits in a fixed **56px** right-hand
  rail, with scores right-aligned in a fixed column before it, so every score
  digit in a list lands on the same vertical line.
- Bottom nav: four destinations — Home, Matches, Leagues, News. 56px plus
  `env(safe-area-inset-bottom)`. Account behind a header avatar. No “More”.
- Primary actions in the bottom third. Nothing important top-right.
- Ad slots declare fixed heights via `aspect-ratio` so a late ad never shifts
  content.
- Standings never scroll horizontally — collapse to pos / crest / name / P / GD /
  Pts and expand rows inline.
- `.scroll-contain` (`overscroll-behavior: contain`) on scroll containers, so
  pull-to-refresh can't fight a live list.
- `.pb-safe` clears the bottom nav and the home indicator in installed mode.

## Motion

Functional only: score changes, live pulse, route transitions. One easing —
`ease-standard`. `prefers-reduced-motion: reduce` is honoured globally in
`index.css`, not per component.

---

## Club identity colour

Club colour is **runtime data**, applied as an inline CSS variable and a 3px
left bar — never a hardcoded class:

```jsx
<div style={{ '--club': color }} className="border-l-[3px] border-l-[var(--club)]">
```

A team with **no known colour gets a neutral hairline, never an invented hue.** A
wrong club colour is worse than no colour: Rwandan fans know these clubs, and an
arbitrary hue on a familiar crest reads as a bug rather than as missing data.

### ⚠️ Stopgap: `src/config/clubColors.js`

The API does not expose club colour yet. `Team` has no `primaryColor`;
`jerseyHome`/`jerseyAway` exist but are written by nothing, read by nothing, and
badly named — **do not build on them.**

So `clubColors.js` holds a small hand-entered map, containing **only colours
that are genuinely known** (currently 5, each tagged with a confidence level).
Every other club falls back to the hairline. The remaining clubs are listed in a
TODO block in that file for someone with real kit references to fill in; each
addition is inert until it lands and needs no component change.

**To migrate when the backend ships** — one commit, no component changes:

1. Backend adds `Team.primaryColor` / `Team.secondaryColor` plus admin fields.
2. Pass `team.primaryColor` into `ClubCrest` / the identity bar, which already
   take an optional colour. `clubColor()` already prefers it if present.
3. Delete `clubColors.js` and its import.

---

## Images

Use `utils/responsiveImage.js` — it returns `{ src, srcSet, sizes }` to spread
onto an `<img>`, so a 360px phone fetches a 640px file instead of a 1920px one.
It transforms Unsplash (`w=`, `auto=format`) and Cloudinary
(`f_auto,q_auto,c_limit,w_*`) URLs, and passes unknown hosts through untouched
with no `srcSet` rather than fetching the same file four times.

Sport hero backdrops in `config/sportThemes.js` no longer hardcode a width. To
move them off Unsplash entirely, upload to Cloudinary and swap the URLs — the
helper recognises Cloudinary already and needs no change.

---

## Deprecated, pending sweep

These exist only so un-swept screens keep building. **Do not add new uses.** The
final cleanup commit deletes them.

- **Legacy palette** in `tailwind.config.js`: `red`, `gold`, `green`, `cyan`,
  `rwanda.*`, `surface.3`, `surface.dark`, `surface.dark2`.
- **`dark:` variants** — 414 of them across 57 files at the start of the sweep.
  Each collapses into a single token class (`bg-white dark:bg-surface-dark2` →
  `bg-surface`).
- **`animate-progress` / `animate-ticker`** keyframes in `index.css`, used by
  `PageLoader`, `SplashScreen` and the legacy ticker markup.
- **`shadow-*` and `bg-gradient-*`** usages inherited from the old design.
