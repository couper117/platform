import React, { useEffect, useState } from 'react';
import { Trash2, Plus, Search, Calendar, Trophy, WifiOff } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { knownClubColors } from '../../config/clubColors';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ClubCrest,
  EmptyState,
  ErrorState,
  IconButton,
  SectionHeading,
  Skeleton,
  SkeletonText,
  StatusPill,
} from '../../components/ui';

/**
 * Living styleguide at /design-system.
 *
 * Token values are READ FROM THE DOM at runtime, not duplicated here, so this
 * page cannot drift from styles/tokens.css — if a token changes, this updates.
 * Contrast ratios are computed live too, which is how the light theme gets kept
 * honest without hand-checking every pair.
 *
 * Phases 2 and 3 append their primitives and domain components below. When a
 * screen later looks off, diff it against this page instead of hunting.
 */

/* ─── colour maths ──────────────────────────────────────────────────── */

/** "23 23 26" → [23,23,26] */
const channels = (raw) => raw.trim().split(/\s+/).map(Number);

const toHex = (raw) => {
  const [r, g, b] = channels(raw);
  if ([r, g, b].some(Number.isNaN)) return '—';
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
};

/** WCAG relative luminance. */
const luminance = ([r, g, b]) => {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};

const contrast = (rawA, rawB) => {
  const [la, lb] = [luminance(channels(rawA)), luminance(channels(rawB))];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

/** Read every token off :root so the page always shows the real values. */
const readTokens = () => {
  const cs = getComputedStyle(document.documentElement);
  const names = [
    'bg', 'surface', 'surface-2', 'hairline',
    'text', 'text-2', 'text-3', 'text-disabled',
    'live', 'on-live', 'danger', 'danger-text', 'on-danger', 'success',
  ];
  return names.reduce((acc, n) => {
    acc[n] = cs.getPropertyValue(`--${n}`);
    return acc;
  }, {});
};

/* ─── page furniture ────────────────────────────────────────────────── */

const Section = ({ title, note, children }) => (
  <section className="border-t border-hairline pt-6">
    <h2 className="font-display text-lg font-semibold">{title}</h2>
    {note && <p className="mt-1 max-w-2xl text-sm text-secondary">{note}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

// Mobile-first: the label stacks above its content at 360px and only becomes a
// fixed-width gutter from md up. A styleguide that overflows on a phone is not
// one you can trust to police mobile layouts.
const Row = ({ label, value, children }) => (
  <div className="border-b border-hairline py-3 last:border-0 md:flex md:items-baseline md:gap-4">
    <code className="block text-xs text-secondary md:w-44 md:shrink-0">{label}</code>
    <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 md:mt-0 md:flex-1">
      {children}
      {value && (
        <span className="ml-auto shrink-0 text-xs tabular-nums text-tertiary">{value}</span>
      )}
    </div>
  </div>
);

const Ratio = ({ value, large = false, nonText = false }) => {
  // AA: 4.5:1 for body text, 3:1 for 18px+/600 or larger. `nonText` tokens are
  // exempt by contract — they must never carry readable information.
  if (nonText) {
    return (
      <span className="rounded-pill border border-hairline px-2 py-0.5 text-xs tabular-nums text-tertiary">
        {value.toFixed(2)}:1 non-text
      </span>
    );
  }
  const floor = large ? 3 : 4.5;
  const pass = value >= floor;
  return (
    <span
      className={`rounded-pill border px-2 py-0.5 text-xs tabular-nums ${
        pass ? 'border-success/40 text-success' : 'border-danger/40 text-danger-text'
      }`}
    >
      {value.toFixed(2)}:1 {pass ? 'AA' : 'FAIL'}
    </span>
  );
};

/* ─── page ──────────────────────────────────────────────────────────── */

const TYPE_SCALE = [
  { cls: 'text-2xl', px: 28, label: 'Display / score' },
  { cls: 'text-xl', px: 22, label: 'Screen title' },
  { cls: 'text-lg', px: 18, label: 'Section heading' },
  { cls: 'text-base', px: 15, label: 'Body (default)' },
  { cls: 'text-sm', px: 13, label: 'Secondary / meta' },
  { cls: 'text-xs', px: 11, label: 'Label / pill' },
];

const SPACING = [
  ['1', 4], ['2', 8], ['3', 12], ['4', 16], ['6', 24], ['8', 32],
];

const RADII = [
  ['rounded-none', '0', 'accent bars'],
  ['rounded-control', '4px', 'inputs, buttons'],
  ['rounded-card', '8px', 'cards, rows'],
  ['rounded-pill', '999px', 'badges, pills'],
];

const DesignSystemPage = () => {
  const theme = useTheme();
  const [tokens, setTokens] = useState({});

  // Re-read after every theme flip so the swatches and ratios follow.
  useEffect(() => {
    const read = () => setTokens(readTokens());
    read();
    const id = requestAnimationFrame(read);
    return () => cancelAnimationFrame(id);
  }, [theme?.dark]);

  const surfaces = ['bg', 'surface', 'surface-2', 'hairline'];
  const texts = [
    { n: 'text', sample: 'Primary copy — the quick brown fox' },
    { n: 'text-2', sample: 'Secondary copy — the quick brown fox' },
    { n: 'text-3', sample: '20:00 · Huye Stadium · Matchday 12' },
    { n: 'text-disabled', sample: 'Disabled control — never real content' },
  ];
  const ready = Object.keys(tokens).length > 0;

  return (
    <div className="min-h-screen bg-page px-4 py-10 text-primary sm:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-tertiary">RwaSport</p>
          <h1 className="font-display text-2xl font-semibold">Design system</h1>
          <p className="max-w-2xl text-sm text-secondary">
            Every token, read live from <code>styles/tokens.css</code>. Dark is the default and
            the theme that must be pixel-right; light is authored and kept correct but is not the
            QA gate. Primitives land here in Phase 2, domain components in Phase 3.
          </p>
          <button
            onClick={theme?.toggle}
            className="rounded-control border border-hairline px-3 py-2 text-sm transition-colors duration-150 ease-standard hover:bg-surface-2"
          >
            Toggle theme — currently {theme?.dark ? 'dark' : 'light'}
          </button>
        </header>

        {!ready ? (
          <p className="text-sm text-secondary">Reading tokens…</p>
        ) : (
          <>
            <Section
              title="Surfaces"
              note="Four levels, 1px hairline borders, no shadows and no gradients. Depth is
                    communicated by surface level alone."
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {surfaces.map((n) => (
                  <div key={n} className="overflow-hidden rounded-card border border-hairline">
                    <div className="h-16" style={{ background: `rgb(${tokens[n]})` }} />
                    <div className="space-y-0.5 bg-surface p-2">
                      <code className="block text-xs">--{n}</code>
                      <span className="block text-xs tabular-nums text-tertiary">
                        {toHex(tokens[n])}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title="Text on surface"
              note="Live contrast against --surface — cards and rows, not the page. Anything quoted
                    against --bg flatters. All four graded at 4.5:1, because metadata appears at
                    11px: --text-3 clears it and is safe anywhere, --text-disabled does not and
                    must never carry information a user needs to read."
            >
              {texts.map(({ n, sample }) => (
                <Row key={n} label={`--${n}`}>
                  <span className="text-base" style={{ color: `rgb(${tokens[n]})` }}>
                    {sample}
                  </span>
                  <span className="ml-auto flex items-center gap-3">
                    <span className="text-xs tabular-nums text-tertiary">{toHex(tokens[n])}</span>
                    <Ratio
                      value={contrast(tokens[n], tokens.surface)}
                      nonText={n === 'text-disabled'}
                    />
                  </span>
                </Row>
              ))}
            </Section>

            <Section
              title="Semantic colour — as text"
              note="Live orange appears nowhere except live state. Danger is red cards and
                    rejections only. Nothing here is decorative. Graded at 4.5:1, because these
                    do appear at small sizes — which is exactly why danger needs two tokens."
            >
              {[
                ['live', 'LIVE 67’'],
                ['danger-text', 'Rejected — document not accepted'],
                ['success', 'Verified'],
              ].map(([n, sample]) => (
                <Row key={n} label={`--${n}`}>
                  <span className="text-base" style={{ color: `rgb(${tokens[n]})` }}>
                    {sample}
                  </span>
                  <span className="ml-auto flex items-center gap-3">
                    <span className="text-xs tabular-nums text-tertiary">{toHex(tokens[n])}</span>
                    <Ratio value={contrast(tokens[n], tokens.surface)} />
                  </span>
                </Row>
              ))}
              <Row label="--danger (as text)">
                <span className="text-base" style={{ color: `rgb(${tokens.danger})` }}>
                  Rejected — wrong token for this
                </span>
                <span className="ml-auto flex items-center gap-3">
                  <span className="text-xs tabular-nums text-tertiary">{toHex(tokens.danger)}</span>
                  <Ratio value={contrast(tokens.danger, tokens.surface)} />
                </span>
              </Row>
              <p className="mt-3 text-sm text-secondary">
                That last row is the trap: <code>--danger</code> is a <em>fill</em> colour and fails
                as small text. Red text uses <code>--danger-text</code>.
              </p>
            </Section>

            <Section
              title="Semantic colour — as fill"
              note="Label-on-fill pairings are pinned as tokens so nobody re-decides them per
                    component. Graded against the fill they sit on."
            >
              <Row label="--live + --on-live">
                <span
                  className="inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-xs font-semibold uppercase tracking-wider"
                  style={{ background: `rgb(${tokens.live})`, color: `rgb(${tokens['on-live']})` }}
                >
                  <span className="h-1.5 w-1.5 animate-live-pulse rounded-pill bg-current" />
                  Live 67’
                </span>
                <span className="ml-auto">
                  <Ratio value={contrast(tokens['on-live'], tokens.live)} />
                </span>
              </Row>
              <Row label="--danger + --on-danger">
                <span
                  className="inline-flex items-center rounded-control px-3 py-2 text-base font-semibold"
                  style={{
                    background: `rgb(${tokens.danger})`,
                    color: `rgb(${tokens['on-danger']})`,
                  }}
                >
                  Delete team
                </span>
                <span className="ml-auto">
                  <Ratio value={contrast(tokens['on-danger'], tokens.danger)} large />
                </span>
              </Row>
              <p className="mt-3 text-sm text-secondary">
                The danger fill tops out at 4.43:1 — the best pairing available, but short of AA for
                small text. So a filled danger control needs its label at 14px+/600 (graded at 3:1
                above). The default rejected / red-card chip therefore has no fill:
              </p>
              <span
                className="mt-2 inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider"
                style={{
                  borderColor: `rgb(${tokens.danger})`,
                  color: `rgb(${tokens['danger-text']})`,
                }}
              >
                Red card
              </span>
              <span className="ml-3 align-middle">
                <Ratio value={contrast(tokens['danger-text'], tokens.surface)} />
              </span>
            </Section>

            <Section
              title="Type scale"
              note="Archivo, self-hosted, one variable file. 28 / 22 / 18 / 15 / 13 / 11 — body 15.
                    Form controls are pinned to 16px so iOS does not zoom on focus."
            >
              {TYPE_SCALE.map(({ cls, px, label }) => (
                <Row key={cls} label={cls} value={`${px}px`}>
                  <span className={cls}>{label}</span>
                </Row>
              ))}
            </Section>

            <Section
              title="Width axis"
              note="Body and display are the same font file at different widths — no second
                    download. Display is wdth 125% (“Archivo Expanded”) at weight 600."
            >
              <Row label="font-sans">
                <span className="text-xl">Amavubi 2 — 1 Rayon Sports</span>
              </Row>
              <Row label="font-display font-semibold">
                <span className="font-display text-xl font-semibold">
                  Amavubi 2 — 1 Rayon Sports
                </span>
              </Row>
            </Section>

            <Section
              title="Tabular numerals"
              note="Every numeral in the product is tabular. Proportional digits shift column
                    width as a score changes, which is the most visible defect in the old UI."
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-card border border-danger/40 p-3">
                  <p className="mb-2 text-xs uppercase tracking-wider text-danger">
                    Proportional — wrong
                  </p>
                  <div style={{ fontVariantNumeric: 'proportional-nums' }}>
                    {['11', '10', '19', '41', '17'].map((n, i) => (
                      <div key={i} className="font-display text-xl font-semibold">
                        {n} : 0{i}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-card border border-success/40 p-3">
                  <p className="mb-2 text-xs uppercase tracking-wider text-success">
                    Tabular — correct
                  </p>
                  <div className="numerals">
                    {['11', '10', '19', '41', '17'].map((n, i) => (
                      <div key={i} className="text-xl">
                        {n} : 0{i}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Spacing" note="4px base. Only these steps: 4 8 12 16 24 32.">
              <div className="flex items-end gap-3">
                {SPACING.map(([k, px]) => (
                  <div key={k} className="text-center">
                    <div className="bg-surface-2" style={{ width: px, height: px }} />
                    <code className="mt-1 block text-xs text-tertiary">{px}</code>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Radius" note="Four values, and zero on single-sided accent bars.">
              <div className="flex flex-wrap gap-4">
                {RADII.map(([cls, px, use]) => (
                  <div key={cls} className="text-center">
                    <div className={`h-16 w-16 border border-hairline bg-surface-2 ${cls}`} />
                    <code className="mt-1 block text-xs">{px}</code>
                    <span className="block text-xs text-tertiary">{use}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title="Layout metrics"
              note="Named in tailwind.config.js so screens cannot drift from them."
            >
              <Row label="h-row" value="68px">
                <div className="h-row w-full rounded-card border border-hairline bg-surface" />
              </Row>
              <Row label="w-rail" value="56px">
                <div className="h-8 w-rail rounded-card border border-hairline bg-surface" />
              </Row>
              <Row label="min-h-tap / min-w-tap" value="44px">
                <div className="min-h-tap min-w-tap rounded-control border border-hairline bg-surface-2" />
              </Row>
            </Section>

            <Section
              title="Club identity"
              note="Runtime data, applied as an inline --club variable and a 3px left bar. Teams
                    with no known colour get a neutral hairline — never an invented hue."
            >
              <div className="space-y-2">
                {knownClubColors().map((c) => (
                  <div
                    key={c.key}
                    style={{ '--club': c.color }}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 border-l-[3px] border-l-[var(--club)] bg-surface px-3 py-2"
                  >
                    <span className="text-base">{c.label}</span>
                    <code className="text-xs tabular-nums text-tertiary">{c.color}</code>
                    <span className="ml-auto text-xs text-tertiary">
                      confidence: {c.confidence}
                    </span>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-l-[3px] border-l-hairline bg-surface px-3 py-2">
                  <span className="text-base text-secondary">Unknown club — neutral fallback</span>
                  <span className="ml-auto text-xs text-tertiary">no colour data</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-secondary">
                Stopgap: <code>src/config/clubColors.js</code>. Deletes cleanly once
                <code> Team.primaryColor</code> ships — see DESIGN.md.
              </p>
            </Section>
          </>
        )}

        {ready && (
          <>
            <Section
              title="Button"
              note="No brand accent exists to spend — live is reserved for live state, danger for
                    destruction. So primary is an inversion: the text colour as a fill. It is the
                    highest-contrast thing on screen and can never be mistaken for a status."
            >
              <Row label="primary / secondary / ghost">
                <Button>Register team</Button>
                <Button variant="secondary">Cancel</Button>
                <Button variant="ghost">Skip</Button>
              </Row>
              <Row label="danger">
                <Button variant="danger" icon={Trash2}>
                  Delete team
                </Button>
                <span className="text-sm text-secondary">
                  label is 15px/600 — clears the 4.43:1 fill
                </span>
              </Row>
              <Row label="sizes" value="36 / 44 / 52px">
                <Button size="sm" variant="secondary">
                  sm — admin only
                </Button>
                <Button size="md" variant="secondary">
                  md
                </Button>
                <Button size="lg" variant="secondary">
                  lg
                </Button>
              </Row>
              <Row label="icon / loading / disabled">
                <Button icon={Plus}>Add player</Button>
                <Button loading>Saving</Button>
                <Button disabled>Unavailable</Button>
              </Row>
              <Row label="block" value="mobile default">
                <Button block size="lg">
                  Confirm registration
                </Button>
              </Row>
            </Section>

            <Section
              title="IconButton"
              note="`label` is a required prop, not an optional attribute — it becomes aria-label
                    and the tooltip, and warns in dev when missing. The old codebase had 81 buttons
                    and 9 aria-labels; this fixes that structurally rather than by review."
            >
              <Row label="ghost / secondary / danger">
                <IconButton icon={Search} label="Search" />
                <IconButton icon={Calendar} label="Pick a date" variant="secondary" />
                <IconButton icon={Trash2} label="Delete" variant="danger" />
              </Row>
              <Row label="sizes" value="36 / 44px">
                <IconButton icon={Search} label="Search, dense" size="sm" variant="secondary" />
                <IconButton icon={Search} label="Search" size="md" variant="secondary" />
              </Row>
            </Section>

            <Section
              title="Badge vs StatusPill"
              note="Badge carries a fact and is never coloured. StatusPill is the one place a
                    backend enum becomes colour, mapped in a single table so no screen re-decides
                    what SUSPENDED looks like."
            >
              <Row label="Badge — facts">
                <Badge>Matchday 12</Badge>
                <Badge>U17</Badge>
                <Badge>Quarter-final</Badge>
                <Badge>National ID</Badge>
              </Row>
              <Row label="StatusPill — states">
                <StatusPill status="LIVE" label="Live 67’" />
                <StatusPill status="VERIFIED" />
                <StatusPill status="PENDING" />
                <StatusPill status="REJECTED" />
                <StatusPill status="POSTPONED" />
                <StatusPill status="COMPLETED" />
              </Row>
              <p className="mt-3 text-sm text-secondary">
                Live is the only filled pill — it is the one state a fan scans a list for. Rejected
                stays an outline because a <code>--danger</code> fill cannot carry an 11px label at
                AA.
              </p>
            </Section>

            <Section
              title="Identity — shape carries meaning"
              note="Round is a person, squared is an organisation. A mixed list (scorers beside
                    their clubs) is legible before a word is read. Absence of a club colour is a
                    valid state and renders as a plain hairline, never an invented hue."
            >
              <Row label="Avatar — person">
                <Avatar name="Jacques Tuyisenge" size="sm" />
                <Avatar name="Jacques Tuyisenge" size="md" />
                <Avatar name="Jacques Tuyisenge" size="lg" />
              </Row>
              <Row label="ClubCrest — known colour">
                <ClubCrest team={{ name: 'Rayon Sports' }} size="sm" />
                <ClubCrest team={{ name: 'Rayon Sports' }} size="md" />
                <ClubCrest team={{ name: 'APR FC' }} size="md" />
                <ClubCrest team={{ name: 'Police FC' }} size="md" />
              </Row>
              <Row label="ClubCrest — unknown">
                <ClubCrest team={{ name: 'Gasogi United' }} size="md" />
                <span className="text-sm text-secondary">hairline, not a guess</span>
              </Row>
            </Section>

            <Section
              title="Card & SectionHeading"
              note="One surface level, one hairline, 8px radius. No shadow and no hover lift — a
                    translate encodes nothing and never fires on touch. Interactive cards change
                    surface instead."
            >
              <div className="space-y-3">
                <SectionHeading title="Upcoming fixtures" action="All" actionTo="/fixtures" />
                <Card className="p-3">
                  <p className="text-base">Static card</p>
                  <p className="text-sm text-secondary">Surface, hairline, 8px.</p>
                </Card>
                <Card to="/fixtures" className="p-3">
                  <p className="text-base">Interactive card</p>
                  <p className="text-sm text-secondary">Hover changes surface, nothing moves.</p>
                </Card>
              </div>
            </Section>

            <Section
              title="Skeleton"
              note="Skeletons everywhere, spinners nowhere. Primitives only — each domain component
                    ships its own skeleton built from these and sharing its metrics, so the two
                    cannot drift apart the way a typed `Skeleton type='card'` did."
            >
              <Row label="blocks">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8" circle />
                <Skeleton className="h-8 w-8" />
              </Row>
              <Row label="SkeletonText">
                <div className="w-full max-w-sm">
                  <SkeletonText lines={3} />
                </div>
              </Row>
            </Section>

            <Section
              title="Empty vs Error"
              note="35 screens ran queries and 4 handled isError — the rest showed an empty list on
                    a failed request, which says “no fixtures” when the truth is “we could not reach
                    the server”. Opposite meanings, and common on a flaky connection."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Card>
                  <EmptyState
                    icon={Trophy}
                    title="No fixtures yet"
                    hint="Matches appear here once the league publishes its schedule."
                  />
                </Card>
                <Card>
                  <ErrorState
                    title="Could not load fixtures"
                    hint="Check your connection and try again."
                    onRetry={() => {}}
                  />
                </Card>
              </div>
              <Row label="offline, with action">
                <div className="w-full">
                  <EmptyState
                    icon={WifiOff}
                    title="You are offline"
                    hint="Scores will catch up as soon as you reconnect."
                    action={
                      <Button variant="secondary" size="md">
                        Retry now
                      </Button>
                    }
                  />
                </div>
              </Row>
            </Section>
          </>
        )}

        <footer className="border-t border-hairline pt-6 text-sm text-tertiary">
          Phase 2 — primitives, batch 1. Forms (Field, Input, Select, Textarea, Checkbox, Radio) and
          composites (Tabs, SegmentedControl, Modal, BottomSheet, Toast, DataTable) land next, then
          domain components in Phase 3.
        </footer>
      </div>
    </div>
  );
};

export default DesignSystemPage;
