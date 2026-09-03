import React from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  ClipboardList,
  Lock,
  RotateCcw,
  ShieldAlert,
  Timer,
  Users,
  WifiOff,
} from 'lucide-react';

import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { Button } from '../../components/ui';

/**
 * Reporter → Reporting guide.
 *
 * WHY THIS EXISTS. Many of these reporters are volunteers covering their first
 * season, and the rules of this system were learnable only by making mistakes
 * live during a match: typing a minute the server was going to overwrite, hunting
 * for a score field that does not exist, publishing a goal against a team with no
 * sheet and losing it from the scorer's record. None of that is discoverable from
 * the console; all of it is written down here.
 *
 * WHAT IS ALLOWED ON THIS PAGE. Only statements that are true of the code as it
 * stands — every claim below was read out of apps/backend/src (matchClock.logic,
 * matchEvents.service, fixtures.controller, capabilities.rules) or out of
 * src/lib/reporterMatch.ts. A reference a reporter trusts and is then let down by
 * in the 80th minute is worse than no reference, so nothing here is aspirational:
 * notably, there is no offline queue, and this page says so rather than implying
 * one.
 *
 * NO HERO, NO MARKETING TONE. This is opened mid-match with cold hands. Short
 * headings, short lines, one idea per paragraph, and the section list at the top
 * so nobody scrolls looking for the card rules.
 */

/* ── the section index ───────────────────────────────────────────────────── */

const SECTIONS: Array<[string, string]> = [
  ['clock', 'The clock runs itself'],
  ['score', 'You never type the score'],
  ['events', 'What each event means'],
  ['sheets', 'Team sheets first'],
  ['suspended', 'A suspended player cannot be named'],
  ['permissions', 'What you can and cannot do'],
  ['checklist', 'Before you travel'],
  ['offline', 'When the signal drops'],
];

/** One section, anchored. `scroll-mt` keeps the heading clear of the app chrome. */
const Section = ({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon: any;
  children: React.ReactNode;
}) => {
  const Icon = icon;
  return (
    <div id={id} className="scroll-mt-6">
      <Panel
        title={
          <span className="flex items-center gap-2">
            <Icon size={16} className="shrink-0 text-tertiary" aria-hidden="true" />
            {title}
          </span>
        }
      >
        <div className="space-y-3 text-sm leading-relaxed text-secondary">{children}</div>
      </Panel>
    </div>
  );
};

/** A term and what it does. Stacked on a phone, two columns from `sm` up. */
const Term = ({ term, children }: { term: string; children: React.ReactNode }) => (
  <div className="grid gap-0.5 border-b border-hairline py-2 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-3">
    <dt className="font-semibold text-primary">{term}</dt>
    <dd className="text-secondary">{children}</dd>
  </div>
);

/** A checklist line: what to have, and what it costs to arrive without it. */
const CheckItem = ({
  label,
  required,
  children,
}: {
  label: string;
  required: boolean;
  children: React.ReactNode;
}) => (
  <li className="border-b border-hairline py-2 last:border-0">
    <p className="flex flex-wrap items-center gap-2 font-medium text-primary">
      {label}
      <span
        className={
          required
            ? 'rounded-pill border border-live/40 px-2 py-0.5 text-xs text-live'
            : 'rounded-pill border border-hairline px-2 py-0.5 text-xs text-tertiary'
        }
      >
        {required ? 'Required' : 'Optional'}
      </span>
    </p>
    <p className="mt-0.5 text-secondary">{children}</p>
  </li>
);

/* ── the page ────────────────────────────────────────────────────────────── */

const ReporterGuidePage = () => (
  <div className="max-w-3xl">
    <PageHeader
      title="Reporting guide"
      subtitle="How this system behaves during a match, and what it expects from you"
    />

    {/*
      The index is shown at every width, not only on `lg`. A phone is where this
      page is read under time pressure and where the scroll is longest, so hiding
      the one control that shortens it would be exactly backwards.
    */}
    <nav aria-label="Sections" className="mb-4 rounded-card border border-hairline bg-surface p-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {SECTIONS.map(([id, label]) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="text-sm text-secondary underline-offset-4 transition-colors duration-150 ease-standard hover:text-brand-text hover:underline"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>

    <div className="space-y-4">
      <Section id="clock" title="The clock runs itself" icon={Timer}>
        <p>
          Kick-off stamps the start time. From then on the minute is worked out from that one
          timestamp, so every screen showing this match — yours, an admin's, a follower's — reads the
          same number.
        </p>
        <p>
          <span className="font-semibold text-primary">You never type a minute.</span> Every event you
          publish takes its minute from the clock at the moment you tap publish.
        </p>
        <p>
          Past 45, and again past 90, the minute stops climbing and the excess shows as stoppage: the
          47th minute of a first half reads{' '}
          <span className="font-semibold tabular-nums text-primary">45+2'</span>, the way a broadcast
          writes it.
        </p>
        <p>
          Half time stops the clock. Anything you log during the interval is attributed to 45', not to
          whatever the first half ran to.
        </p>
        <p>
          If a period is left running, the stoppage stops at +15 and the match is flagged as stalled —
          a clock that has clearly been forgotten, rather than one still quietly counting.
        </p>
      </Section>

      <Section id="score" title="You never type the score" icon={RotateCcw}>
        <p>
          The score is derived from goal events. There is no score box to type into during a match:
          publish the goal and the score follows.
        </p>
        <p>
          An own goal counts for the opposing team, and is not credited to any scorer. Log it against
          the player who put it in their own net and the arithmetic works out.
        </p>
        <p>
          <span className="font-semibold text-primary">To fix a wrong score, remove the event.</span>{' '}
          Undo puts back the score, the scorer's tally, and any suspension the card caused. It is safe
          to reach for the moment a tap lands on the wrong team.
        </p>
        <p>
          One limit worth knowing: a suspension the player has already partly served is left in place.
          Matches have been missed, and unwinding that is an administrator's decision, not a side
          effect of your undo.
        </p>
        <p>
          Once you sign off the result, the server stops recounting from the events — the figure on
          the sign-off form becomes the official one.{' '}
          <Link to="/reporter/results" className="font-semibold text-brand-text underline-offset-4 hover:underline">
            Results
          </Link>{' '}
          is where that is done.
        </p>
      </Section>

      <Section id="events" title="What each event means" icon={ClipboardList}>
        <dl>
          <Term term="Goal">
            Counts for the team it is logged against, and adds to the named player's goal tally.
          </Term>
          <Term term="Penalty">
            A goal from the spot. Counts and credits the scorer exactly as a goal does.
          </Term>
          <Term term="Own goal">
            Counts for the <span className="font-semibold text-primary">opposing</span> team, and is
            credited to no scorer.
          </Term>
          <Term term="Yellow card">
            Recorded against the player. Once the league's accumulation threshold is reached, the ban
            follows on its own.
          </Term>
          <Term term="Red card">
            Recorded against the player, and produces a suspension arising from this match.
          </Term>
          <Term term="Substitution">Carries two players — the one going off and the one coming on.</Term>
          <Term term="Update">
            Free-text commentary. It carries no scoring or disciplinary meaning: only what you write.
          </Term>
          <Term term="Injury">Noted in the feed. It changes neither the score nor a player's record.</Term>
          <Term term="VAR">A review, recorded in the feed. It carries no scoring effect by itself.</Term>
        </dl>
        <p className="pt-2">
          Kick-off, half time, full time and extra time are written{' '}
          <span className="font-semibold text-primary">by the clock</span>, not by you — which is why
          they carry no undo button. The server refuses to delete them and points you back at the
          clock controls, so the period and the feed can never disagree about when the match turned.
        </p>
      </Section>

      <Section id="sheets" title="Team sheets first" icon={Users}>
        <p>
          Publish both team sheets before kick-off. Without a sheet, a goal cannot name a player — and
          a goal credited to nobody never reaches that player's record or the top-scorer table. The
          match looks reported and the work quietly evaporates.
        </p>
        <p>
          Only players belonging to that team may be listed. If one does not, the server refuses the
          sheet and names them.
        </p>
        <Button variant="secondary" to="/reporter/lineups" icon={Users} className="mt-1">
          Team sheets
        </Button>
      </Section>

      <Section id="suspended" title="A suspended player cannot be named" icon={ShieldAlert}>
        <p>
          A player serving a ban may not appear on a sheet. Submit one that lists them and the server
          refuses{' '}
          <span className="font-semibold text-primary">the whole sheet</span> and tells you who —
          nothing is saved in part.
        </p>
        <p>
          Take the named player out and submit again. Checking this before you travel is quicker than
          discovering it in the tunnel.
        </p>
      </Section>

      <Section id="permissions" title="What you can and cannot do" icon={Lock}>
        <p>
          You report the matches you are assigned to — directly, or through a league you cover. On
          those matches you control the clock, the events, the team sheets, the statistics, the
          result, and the venue, referee and stream link.
        </p>
        <p>
          You cannot create a fixture, move one to another date, or cancel one; and you cannot touch a
          match you are not assigned to. Those belong to the league administrator, who is also the
          person to ask if a match is missing from your list.
        </p>
      </Section>

      <Section id="checklist" title="Before you travel" icon={ClipboardCheck}>
        <p>The portal shows this checklist on every assigned match. It is worth clearing it early.</p>
        <ul className="mt-1">
          <CheckItem label="Home team sheet" required>
            Without it, goals and cards for that team cannot name a player.
          </CheckItem>
          <CheckItem label="Away team sheet" required>
            The same, for the visiting side.
          </CheckItem>
          <CheckItem label="Venue confirmed" required={false}>
            Followers see “Venue TBD” on the public match page until it is set.
          </CheckItem>
          <CheckItem label="Stream link" required={false}>
            Only needed if this match is being broadcast.
          </CheckItem>
        </ul>
      </Section>

      <Section id="offline" title="When the signal drops" icon={WifiOff}>
        <p>
          Every action is written to the server the moment you tap it. Nothing is held on your phone
          for later.
        </p>
        <p>
          <span className="font-semibold text-primary">If a tap fails, the event is not saved.</span>{' '}
          You will see a message saying so. Publish it again once you have signal — there is no
          offline queue behind this app, and pretending otherwise would cost you a goal.
        </p>
        <p>
          The clock is the one thing that survives a bad connection on its own: it is worked out from
          the kick-off time held on the server, so when you reconnect it is showing the right minute
          without any catching up.
        </p>
      </Section>
    </div>
  </div>
);

export default ReporterGuidePage;
