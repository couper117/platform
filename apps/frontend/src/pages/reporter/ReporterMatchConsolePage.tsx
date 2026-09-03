import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertTriangle, ArrowLeft, Check, ChevronLeft, Clock, Link2, Play, Send, Undo2, UserX, X,
} from 'lucide-react';

import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { MatchIdentity, MatchStatusChip, Tabs, Fact } from '../../components/reporter/ReporterUI';
import { Button, IconButton, Input, Field, ClubCrest, ErrorState, Skeleton, cn } from '../../components/ui';
import {
  getMatch,
  setClock,
  addEvent as postEvent,
  removeEvent,
  saveStats,
  saveResult,
  updateMatchDetail,
} from '../../api/endpoints/reporter';
import {
  CLOCK_EVENTS, CLOSED_STATUSES, closeoutSummary, readinessSummary, timeUntil,
} from '../../lib/reporterMatch';
import {
  actionsForSport, statFieldsForSport, EVENT_LABEL, eventTone,
  type EventVariant, type SportAction,
} from '../../config/sportEvents';
import { PERIOD_LABEL, stampClock, tickClock } from '../../utils/matchClock';
import useUiStore from '../../store/uiStore';

/**
 * The match console — /reporter/match/:id.
 *
 * WHY THIS IS A ROUTE. The live-reporting body below is ported from
 * pages/admin/LiveReportingPage, where the chosen match lived in component state.
 * That meant a refresh in the 70th minute — a phone locking, a tab reloading on a
 * flaky connection — dumped the reporter back to a picker with the clock still
 * running. Here the URL *is* the match, so refresh, the back button and a deep
 * link from any list all land on the same console. `useParams()` is the only
 * source of truth for which fixture this is.
 *
 * ONE SCREEN, THREE PHASES, driven entirely by `fixture.status`:
 *   SCHEDULED → Prepare   (checklist, correctable detail, kick-off)
 *   LIVE      → Report    (sticky clock, tabs, the feed)
 *   closed    → Sign off  (close-out checklist, the official result)
 * The reporter never chooses the phase; the match does. There is no mode switch
 * to get wrong at 15:00.
 *
 * IT IS USED ONE-HANDED, STANDING, AT THE SIDE OF A PITCH. Every control clears
 * the 44px tap floor, which is why nothing here uses the admin-dense `sm` button.
 * Speed matters more than decoration: a reporter is watching the game, not the UI.
 *
 * THE SCORE IS NEVER TYPED WHILE LIVE. The server derives it from goal events, so
 * a mistyped tap is corrected by removing the event rather than by editing a
 * number that has already drifted from its own history. The one place a score is
 * typed is the sign-off panel, and that is a deliberate, separate act.
 *
 * COLOUR. Design tokens only. The event palette matches shared/matchEventMeta:
 * brand green scores, --danger dismisses, --live cautions. `--live` orange is also
 * the running clock and the live pill — the console is the one place in the portal
 * where that orange belongs, and it is not spent on anything else here.
 */

/* ── shared vocabulary, ported from the source console ───────────────────── */

/**
 * How an event reads in the feed.
 *
 * Derived from config/sportEvents rather than written out here, because this used
 * to be a hand-kept football table: a three-pointer logged on a basketball match
 * fell through to "Update" in grey, and a set win read as commentary. The label
 * and the colour now come from the same place the capture sheet gets them, so a
 * new sport cannot be half-added.
 */
const metaFor = (type: string) => ({ label: EVENT_LABEL[type] || 'Update', ...eventTone(type) });


const CLOCK_LABEL: Record<string, string> = {
  start: 'Match is live',
  halftime: 'Half time',
  resume: 'Second half under way',
  fulltime: 'Full time',
};

const textareaCls =
  'w-full rounded-input border border-hairline bg-surface px-4 py-3 text-primary placeholder:text-tertiary transition-colors duration-150 ease-standard focus:border-brand focus:outline-none';

/**
 * A labelled group for controls that are NOT a single form element — the team
 * chooser and the card chooser are grids of buttons, and wrapping those in a
 * `<label>` (as the source console did) points a label at nothing. Styled to match
 * the ui `Field` label exactly, so a form mixing the two reads as one form.
 */

/** The console's loading state. Skeletons everywhere, spinners nowhere. */
const ConsoleSkeleton = () => (
  <div className="mx-auto max-w-3xl space-y-3">
    <Skeleton className="h-9 w-48" />
    {Array.from({ length: 3 }, (_, i) => (
      <Skeleton key={i} className="h-28 w-full rounded-card" />
    ))}
  </div>
);

const lineupsHref = (matchId: number | string) => `/reporter/lineups?fixture=${matchId}`;

const teamLabel = (team: any) => team?.shortName || team?.name || '—';

/* ── match detail a reporter may correct ─────────────────────────────────── */

/**
 * Venue, referee and the stream link — the three facts a reporter standing at the
 * ground knows better than whoever typed the fixture in.
 *
 * IT DELIBERATELY CANNOT SEND `matchDate` OR `status`. The PATCH endpoint accepts
 * both, but rescheduling and abandoning a match are the league admin's decisions,
 * not the reporter's, and a control that quietly moved a fixture would be the one
 * thing on this screen a reporter could not undo. See the comment on
 * `updateMatchDetail` in api/endpoints/reporter.ts — the two ends agree.
 *
 * Used by BOTH the prepare phase and the live Details tab, so a correction made
 * before kick-off and one made at half time go through identical code.
 */
const MatchDetailsForm = ({ fixture, matchId }: { fixture: any; matchId: number }) => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const [venue, setVenue] = useState(fixture?.venue || '');
  const [referee, setReferee] = useState(fixture?.referee || '');
  const [stream, setStream] = useState(fixture?.streamUrl || '');

  // Re-seed only when the SERVER's value changes — a co-reporter's edit arriving
  // on the 15s poll should land here, but the poll must not wipe what the
  // reporter is halfway through typing.
  useEffect(() => { setVenue(fixture?.venue || ''); }, [fixture?.venue]);
  useEffect(() => { setReferee(fixture?.referee || ''); }, [fixture?.referee]);
  useEffect(() => { setStream(fixture?.streamUrl || ''); }, [fixture?.streamUrl]);

  const save = useMutation({
    mutationFn: () =>
      updateMatchDetail(matchId, {
        venue: venue.trim() || null,
        referee: referee.trim() || null,
        streamUrl: stream.trim() || null,
        // The public match page only surfaces the player while the link is set.
        streamActive: !!stream.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-details', matchId] });
      pushToast('Match details saved', 'success');
    },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not save the match details'),
  });

  return (
    <div className="space-y-4">
      <Field label="Venue" hint="Shown on the public match page and on every fixture list.">
        {(p: any) => (
          <Input {...p} value={venue} onChange={(e: any) => setVenue(e.target.value)} placeholder="Amahoro Stadium" />
        )}
      </Field>

      <Field label="Referee">
        {(p: any) => (
          <Input {...p} value={referee} onChange={(e: any) => setReferee(e.target.value)} placeholder="Name of the match official" />
        )}
      </Field>

      <Field label="Stream link" hint="Shown on the public match page while the match is live.">
        {(p: any) => (
          <div className="relative">
            <Input
              {...p}
              value={stream}
              onChange={(e: any) => setStream(e.target.value)}
              placeholder="https://example.com/live"
              className="pr-10"
            />
            <Link2 size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-tertiary" aria-hidden="true" />
          </div>
        )}
      </Field>

      <Button block loading={save.isPending} onClick={() => save.mutate()}>
        Save match details
      </Button>
    </div>
  );
};

/* ── the feed ────────────────────────────────────────────────────────────── */

/**
 * Everything published so far, newest first.
 *
 * `onUndo` is omitted once the match is closed: after full time the feed is the
 * record, and un-picking it belongs to the person who can also re-open the match.
 */
const MatchFeed = ({
  fixture,
  onUndo,
  undoing,
}: {
  fixture: any;
  onUndo?: (eventId: number) => void;
  undoing?: boolean;
}) => {
  const events = [...(fixture.events || [])].sort((a: any, b: any) => (b.minute || 0) - (a.minute || 0));
  if (!events.length) return <p className="py-6 text-center text-sm text-tertiary">Nothing published yet.</p>;

  return (
    <div className="space-y-2">
      {events.map((e: any) => {
        const meta = metaFor(e.eventType);
        const team =
          e.teamId === fixture.homeTeamId ? teamLabel(fixture.homeTeam)
            : e.teamId === fixture.awayTeamId ? teamLabel(fixture.awayTeam)
              : null;
        return (
          <div key={e.id} className="flex items-center gap-3 rounded-control bg-surface-2 p-2.5">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border text-xs font-semibold tabular-nums text-secondary', meta.ring)}>
              {e.minute != null ? `${e.minute}${e.extraTime ? `+${e.extraTime}` : ''}'` : '—'}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-semibold', meta.tone)}>{meta.label}</p>
              <p className="truncate text-xs text-tertiary">
                {e.description || [team, e.player?.fullName].filter(Boolean).join(' · ') || '—'}
                {e.player2?.fullName && ` ↔ ${e.player2.fullName}`}
              </p>
            </div>
            {/* Clock markers are owned by the clock controls, so they offer no undo
                here — removing one would leave the period and the feed telling
                different stories. */}
            {onUndo && !CLOCK_EVENTS.includes(e.eventType) && (
              <IconButton
                icon={Undo2}
                label={`Undo ${meta.label}`}
                disabled={undoing}
                onClick={() => { if (window.confirm(`Remove this ${meta.label.toLowerCase()}?`)) onUndo(e.id); }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── line-ups, read only ─────────────────────────────────────────────────── */

/** One team's published sheet. Editing lives on /reporter/lineups; this only reads. */
const TeamSheet = ({ fixture, teamId, team }: { fixture: any; teamId: number; team: any }) => {
  const sheet = (fixture.teamSheets || []).find((s: any) => s.teamId === teamId);
  const rows = (fixture.lineups || []).filter((l: any) => l.teamId === teamId);
  const starters = rows.filter((r: any) => r.isStarter !== false);
  const bench = rows.filter((r: any) => r.isStarter === false);

  const line = (r: any) => (
    <li key={r.id ?? r.playerId} className="flex items-center gap-2 py-1 text-sm text-secondary">
      <span className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums text-tertiary">
        {r.jerseyNo != null ? r.jerseyNo : '—'}
      </span>
      <span className="min-w-0 flex-1 truncate text-primary">{r.player?.fullName || 'Unnamed player'}</span>
      {r.isCaptain && <span className="shrink-0 rounded-pill border border-hairline px-1.5 text-[11px] font-semibold text-secondary">C</span>}
      {r.position && <span className="shrink-0 text-xs text-tertiary">{r.position}</span>}
    </li>
  );

  return (
    <div className="min-w-0">
      <p className="font-display text-sm font-semibold text-primary">{teamLabel(team)}</p>
      <p className="mt-0.5 text-xs text-tertiary">
        {sheet?.formation ? <span className="tabular-nums">{sheet.formation}</span> : 'No formation'}
        {sheet?.coachName ? ` · ${sheet.coachName}` : ''}
        {sheet && !sheet.published ? ' · draft' : ''}
      </p>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-live">No team sheet published.</p>
      ) : (
        <>
          <p className="mt-3 text-xs font-semibold text-tertiary">Starting {starters.length}</p>
          <ul className="mt-1">{starters.map(line)}</ul>
          {bench.length > 0 && (
            <>
              <p className="mt-3 text-xs font-semibold text-tertiary">Bench</p>
              <ul className="mt-1">{bench.map(line)}</ul>
            </>
          )}
        </>
      )}
    </div>
  );
};

/* ── statistics ──────────────────────────────────────────────────────────── */

/**
 * Which of MatchStat's columns this sport can answer, from config/sportEvents.
 *
 * The form used to ask every reporter for corners, offsides and goalkeeper
 * saves — five of its eight fields are unanswerable at a basketball game, and
 * possession is meaningless at a volleyball one. Anything the table holds but a
 * touchline cannot count (xG, shots inside the box) stays out for every sport:
 * that is an analyst's job, not a reporter's with a phone in one hand.
 */

const seedStats = (rows: any[], teamId: number, fields: Array<{ key: string }>) => {
  const row = (rows || []).find((s: any) => s.teamId === teamId);
  return Object.fromEntries(fields.map((f) => [f.key, row?.[f.key] ?? '']));
};

/**
 * Per-team statistics, laid out home | label | away so the two teams read against
 * each other the way they do on a broadcast graphic — a reporter checking that
 * possession sums to 100 should not have to scroll between two stacked forms.
 *
 * Normally filled twice: once at half time, once at full time. That is why it
 * stays reachable after the whistle, and why each team saves independently —
 * `saveStats` upserts one team's row per call, and losing the home figures
 * because the away ones were still blank would be its own kind of defect.
 */
const StatsTab = ({ fixture, matchId }: { fixture: any; matchId: number }) => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  // The sport decides which columns are worth asking about; every other column
  // stays null, which is what it would have been if the reporter left it blank.
  const fields = statFieldsForSport(fixture.league?.sport?.slug);
  const [home, setHome] = useState<any>(() => seedStats(fixture.stats, fixture.homeTeamId, fields));
  const [away, setAway] = useState<any>(() => seedStats(fixture.stats, fixture.awayTeamId, fields));

  // Re-seed when the poll brings a row saved elsewhere (an admin, a second device).
  useEffect(() => { setHome(seedStats(fixture.stats, fixture.homeTeamId, fields)); }, [fixture.stats, fixture.homeTeamId]);  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setAway(seedStats(fixture.stats, fixture.awayTeamId, fields)); }, [fixture.stats, fixture.awayTeamId]);  // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: ({ teamId, values }: { teamId: number; values: any }) => saveStats(matchId, { teamId, ...values }),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['match-details', matchId] });
      pushToast(`${vars.teamId === fixture.homeTeamId ? teamLabel(fixture.homeTeam) : teamLabel(fixture.awayTeam)} statistics saved`, 'success');
    },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not save those statistics'),
  });

  const cell = (
    values: any,
    setValues: (fn: any) => void,
    key: string,
    label: string,
    percent: boolean,
    team: any
  ) => (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      max={percent ? 100 : undefined}
      value={values[key] ?? ''}
      onChange={(e: any) => setValues((prev: any) => ({ ...prev, [key]: e.target.value }))}
      aria-label={`${teamLabel(team)} — ${label}`}
      placeholder="—"
      className="px-2 text-center tabular-nums"
    />
  );

  const pendingFor = (teamId: number) => save.isPending && save.variables?.teamId === teamId;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-2">
        <p className="truncate text-center text-sm font-semibold text-primary">{teamLabel(fixture.homeTeam)}</p>
        <span aria-hidden="true" />
        <p className="truncate text-center text-sm font-semibold text-primary">{teamLabel(fixture.awayTeam)}</p>

        {fields.map(({ key, label, percent }) => (
          <React.Fragment key={key}>
            {cell(home, setHome, key, label, !!percent, fixture.homeTeam)}
            <span className="px-1 text-center text-xs text-tertiary">{label}</span>
            {cell(away, setAway, key, label, !!percent, fixture.awayTeam)}
          </React.Fragment>
        ))}
      </div>

      {/* One save per team: the endpoint upserts a single team's row. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant="secondary"
          loading={pendingFor(fixture.homeTeamId)}
          onClick={() => save.mutate({ teamId: fixture.homeTeamId, values: home })}
        >
          Save {teamLabel(fixture.homeTeam)}
        </Button>
        <Button
          variant="secondary"
          loading={pendingFor(fixture.awayTeamId)}
          onClick={() => save.mutate({ teamId: fixture.awayTeamId, values: away })}
        >
          Save {teamLabel(fixture.awayTeam)}
        </Button>
      </div>
    </div>
  );
};

/* ── the official result ─────────────────────────────────────────────────── */

/**
 * The reporter signing off on the official line.
 *
 * WHY THIS IS NOT THE SAME THING AS THE CLOCK'S `fulltime`. Ending the clock stops
 * the reporting session and leaves the score derived from the event log — which is
 * right while a match is being reported, because every goal has a matching event.
 * Saving a RESULT tells the server to stop recounting events: from here the score
 * is the number below, not a tally. It is a separate, deliberate act for exactly
 * that reason, and it is also the only place on this screen a score is typed.
 *
 * `status` is echoed back unchanged. The endpoint defaults a missing status to
 * COMPLETED, which would silently promote an abandoned or postponed match into a
 * finished one — a status change this portal has no business making.
 */
const ResultForm = ({ fixture, matchId }: { fixture: any; matchId: number }) => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const str = (v: any) => (v == null ? '' : String(v));
  const [homeScore, setHomeScore] = useState(str(fixture.homeScore));
  const [awayScore, setAwayScore] = useState(str(fixture.awayScore));
  const [homeHt, setHomeHt] = useState(str(fixture.homeScoreHt));
  const [awayHt, setAwayHt] = useState(str(fixture.awayScoreHt));
  const [attendance, setAttendance] = useState(str(fixture.attendance));

  useEffect(() => { setHomeScore(str(fixture.homeScore)); }, [fixture.homeScore]);
  useEffect(() => { setAwayScore(str(fixture.awayScore)); }, [fixture.awayScore]);

  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  const complete = homeScore.trim() !== '' && awayScore.trim() !== '';

  const save = useMutation({
    mutationFn: () =>
      saveResult(matchId, {
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        homeScoreHt: num(homeHt),
        awayScoreHt: num(awayHt),
        attendance: num(attendance),
        status: fixture.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-details', matchId] });
      queryClient.invalidateQueries({ queryKey: ['reporter-assignments'] });
      pushToast('Result confirmed', 'success');
    },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not save the result'),
  });

  const scoreInput = (value: string, set: (v: string) => void, label: string) => (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      value={value}
      onChange={(e: any) => set(e.target.value)}
      aria-label={label}
      placeholder="0"
      className="px-2 text-center tabular-nums"
    />
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-sm font-bold text-primary">Full-time score</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {scoreInput(homeScore, setHomeScore, `${teamLabel(fixture.homeTeam)} full-time score`)}
          <span className="text-sm text-tertiary">–</span>
          {scoreInput(awayScore, setAwayScore, `${teamLabel(fixture.awayTeam)} full-time score`)}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-bold text-primary">Half-time score</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {scoreInput(homeHt, setHomeHt, `${teamLabel(fixture.homeTeam)} half-time score`)}
          <span className="text-sm text-tertiary">–</span>
          {scoreInput(awayHt, setAwayHt, `${teamLabel(fixture.awayTeam)} half-time score`)}
        </div>
      </div>

      <Field label="Attendance" hint="Leave blank if the gate was not counted.">
        {(p: any) => (
          <Input
            {...p}
            type="number"
            inputMode="numeric"
            min={0}
            value={attendance}
            onChange={(e: any) => setAttendance(e.target.value)}
            placeholder="0"
            className="tabular-nums"
          />
        )}
      </Field>

      <Button block loading={save.isPending} disabled={!complete || save.isPending} onClick={() => save.mutate()}>
        Confirm the result
      </Button>
      {!complete && (
        <p className="text-xs text-tertiary">Both full-time scores are needed before the result can be confirmed.</p>
      )}
    </div>
  );
};

/* ── the clock, and its one next step ────────────────────────────────────── */

/**
 * AT ANY MOMENT A MATCH HAS EXACTLY ONE NEXT CLOCK STEP.
 *
 * The console used to scatter them: "Half time" and "Start 2nd half" sat in a
 * panel near the top of the Live tab, while full time was a red bar pinned to
 * the bottom of the screen for the entire ninety minutes, labelled "End live
 * reporting" as though it were an exit from the software rather than the last
 * step of the match.
 *
 * It is not an exit. `fulltime` goes through the very same clock endpoint as
 * `halftime` and `resume` — it is the third transition in a sequence of three.
 * So all three live here, in one place, next to the clock they move, and only
 * ever one is on screen. That also means the destructive one CANNOT be reached
 * at 20 minutes: full time simply does not exist until the second half is under
 * way, which no amount of confirm-dialog wording achieves as reliably.
 */
const NEXT_STEP: Record<string, { action: 'halftime' | 'resume' | 'fulltime'; label: string; primary: boolean; confirm?: string }> = {
  FIRST_HALF: { action: 'halftime', label: 'Half time', primary: false },
  HALF_TIME: { action: 'resume', label: 'Start second half', primary: true },
  SECOND_HALF: {
    action: 'fulltime',
    label: 'Full time',
    primary: false,
    confirm: 'Blow the final whistle? The match is marked completed and live reporting stops.',
  },
};

const ClockStrip = ({
  live,
  addedInput,
  setAddedInput,
  onClock,
  pending,
}: {
  live: any;
  addedInput: string;
  setAddedInput: (v: string) => void;
  onClock: (body: any) => void;
  pending: boolean;
}) => {
  // A period this table does not name must still be endable. A live match with no
  // way to blow the whistle would strand the fixture, the standings and the
  // reporter alike, so anything past kick-off falls back to full time.
  const step = NEXT_STEP[live.period] || (live.period === 'PRE' ? undefined : NEXT_STEP.SECOND_HALF);

  return (
    <div className="rounded-card border border-hairline bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-secondary">
          {PERIOD_LABEL[live.period] || live.period}
          {live.addedMinutes > 0 && (
            <span className="font-semibold text-live"> · +{live.addedMinutes} added</span>
          )}
        </p>
        {step && (
          <Button
            variant={step.primary ? 'primary' : 'secondary'}
            disabled={pending}
            onClick={() => {
              if (step.confirm && !window.confirm(step.confirm)) return;
              onClock({ action: step.action });
            }}
          >
            {step.label}
          </Button>
        )}
      </div>

      {/* Stoppage the referee held up on the board. It belongs with the clock and
          not with the events: it is a reading taken off a board, not something
          that happened in the match. */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
        <Clock size={15} className="shrink-0 text-tertiary" aria-hidden="true" />
        <span className="text-sm text-secondary">Added time</span>
        <Input
          type="number" min={0} max={30} value={addedInput}
          onChange={(e: any) => setAddedInput(e.target.value)}
          placeholder="0"
          aria-label="Added minutes"
          className="w-16 px-2 text-center tabular-nums"
        />
        <div className="flex gap-1">
          {[1, 2, 3, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => { setAddedInput(String(n)); onClock({ addedMinutes: n }); }}
              className="min-h-tap min-w-[44px] rounded-control border border-hairline px-3 text-sm font-semibold tabular-nums text-secondary transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-primary"
            >
              +{n}
            </button>
          ))}
        </div>
        <Button
          variant="secondary"
          className="ml-auto px-5"
          disabled={pending}
          onClick={() => onClock({ addedMinutes: Math.max(0, parseInt(addedInput, 10) || 0) })}
        >
          Set
        </Button>
      </div>
    </div>
  );
};

/* ── logging what just happened ──────────────────────────────────────────── */

/**
 * THE THUMB BAR.
 *
 * What used to live pinned at the bottom of this screen was the one action a
 * reporter performs ONCE in ninety minutes. What they perform twenty or thirty
 * times — log a goal, a card, a substitution, a note — was up the page, above a
 * feed that grows all match, so by the 70th minute the buttons had scrolled away
 * and every event began with a scroll back up.
 *
 * The frequency ordering is now the physical ordering: the four things that keep
 * happening are the thing under the thumb, and they stay there.
 */
const ActionButtons = ({
  actions,
  onPick,
  className,
}: {
  actions: SportAction[];
  onPick: (id: string) => void;
  className?: string;
}) => (
  // The column count follows the sport. Football, volleyball, handball and rugby
  // field four actions; basketball needs five, because a foul and a timeout are
  // both things that happen constantly and neither is a card. Five 56px targets
  // and their gaps still fit inside a 360px screen's gutters.
  <div className={cn('grid gap-2', actions.length >= 5 ? 'grid-cols-5' : 'grid-cols-4', className)}>
    {actions.map((a) => (
      <button
        key={a.id}
        type="button"
        onClick={() => onPick(a.id)}
        className={cn(
          'flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-card border bg-surface',
          'text-sm font-semibold transition-colors duration-150 ease-standard hover:bg-surface-2 active:bg-surface-2',
          a.tone
        )}
      >
        <a.icon size={18} aria-hidden="true" />
        {a.label}
      </button>
    ))}
  </div>
);

/**
 * ONE SET OF ACTIONS, TWO PLACES TO PUT THEM.
 *
 * On a phone they dock: the thumb zone is real estate, the feed grows all match,
 * and buttons that scroll away mean every event starts with a scroll back. On a
 * desktop none of that is true — there is no thumb, the viewport is tall enough
 * to hold the clock, the actions and the feed at once, and a bar stretched across
 * the foot of a 1440px window is a phone gesture stranded on furniture that has
 * no use for it. So above `lg` the same four buttons simply sit in the flow,
 * under the clock they belong to.
 *
 * They share `ACTIONS` and `ActionButtons`, so the two placements cannot drift
 * into being two different sets of actions.
 */
const ActionDock = ({ actions, onPick }: { actions: SportAction[]; onPick: (id: string) => void }) => (
  <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/95 p-3 backdrop-blur lg:hidden">
    <ActionButtons actions={actions} onPick={onPick} className="mx-auto max-w-3xl" />
  </div>
);

/* ── the capture sheet ───────────────────────────────────────────────────── */

/** One squad member, as a target big enough to hit while watching the pitch. */
const PlayerButton = ({ row, onPick }: { row: any; onPick: () => void }) => (
  <button
    type="button"
    onClick={onPick}
    className="flex min-h-tap w-full items-center gap-3 rounded-control border border-hairline bg-surface px-3 py-2 text-left transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2 active:bg-surface-2"
  >
    <span className="w-8 shrink-0 text-center font-display text-sm font-bold tabular-nums text-tertiary">
      {row.jerseyNo != null ? row.jerseyNo : '—'}
    </span>
    <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">
      {row.player?.fullName || 'Unnamed player'}
    </span>
    {row.isCaptain && (
      <span className="shrink-0 rounded-pill border border-hairline px-1.5 text-[10px] font-bold text-tertiary">C</span>
    )}
    {!row.isStarter && <span className="shrink-0 text-xs text-tertiary">Bench</span>}
  </button>
);

/**
 * A variant chip that says what it is worth, where the label does not already.
 *
 * "3 points" needs no suffix; "Try" and "Conversion" very much do — the whole
 * reason rugby's score cannot be a count of events is that its four scoring acts
 * are worth 5, 3, 3 and 2, and a reporter should be able to see that at the
 * moment they choose one rather than infer it from the scoreboard afterwards.
 */
const variantLabel = (v: EventVariant) =>
  v.points && v.points > 1 && !/\d/.test(v.label) ? `${v.label} · ${v.points}` : v.label;

/**
 * EVENT CAPTURE, AS TAPS RATHER THAN AS A FORM, AND IN THE SPORT'S OWN WORDS.
 *
 * The old flow was a form: choose a team from a segmented control, choose a
 * player from a native select, then find and press Publish. Four interactions and
 * a scroll for a goal, on a screen where the person holding the phone is trying
 * to watch a match at the same time.
 *
 * This is a sequence of single taps, and the LAST tap is the publish — after
 * choosing the scorer there is nothing left to decide. A goal is two taps (team,
 * scorer) or three where the sport has more than one kind; a card is three; a
 * substitution is three; a volleyball set or a timeout is one, because neither
 * belongs to a player.
 *
 * THE STEPS COME FROM THE SPORT. `action.kind` decides the sequence and
 * `action.variants` fills the first step, both from config/sportEvents. Nothing
 * about football is written into this component any more: it was the reason a
 * basketball reporter was offered "Own goal" and no way to say "three-pointer".
 *
 * WHAT IS NOT SACRIFICED FOR SPEED. Every step is reversible with the back arrow
 * before the last tap lands, and after it lands the feed's Undo removes the event
 * server-side along with the score, the tally and any suspension it caused. The
 * player is still optional — "Player unknown" publishes the event unattributed —
 * and where a team has no sheet at all the sheet says so and offers the way to
 * fix it rather than presenting an empty list.
 *
 * A BOTTOM SHEET ON TOUCH, A CENTRED DIALOG ON A DESKTOP. The inline form pushed
 * the feed down, so publishing an event moved everything the reporter had just
 * been reading. A sheet overlays it and closes back to the same scroll position.
 */
const EventSheet = ({
  action,
  fixture,
  minuteLabel,
  periodLabel,
  matchId,
  publishing,
  onPublish,
  onClose,
}: {
  action: SportAction | null;
  fixture: any;
  minuteLabel: string;
  periodLabel: string;
  matchId: number;
  publishing: boolean;
  onPublish: (body: any) => void;
  onClose: () => void;
}) => {
  const [step, setStep] = useState('');
  const [side, setSide] = useState<'home' | 'away'>('home');
  const [variant, setVariant] = useState('');
  const [offId, setOffId] = useState<number | null>(null);
  const [text, setText] = useState('');

  const kind = action?.kind;
  const variants = action?.variants || [];
  // A sport with one way to score does not need a step to choose between them.
  const needsVariantStep = kind === 'discipline' && variants.length > 1;

  // Opening the sheet is a fresh capture every time. Carrying the last goal's
  // team over would be a convenience exactly until the first time the other side
  // scores, which is the one occasion it would be wrong and go unnoticed.
  useEffect(() => {
    if (!action) return;
    setStep(action.kind === 'note' ? 'text' : needsVariantStep ? 'variant' : 'team');
    setSide('home');
    setVariant(action.variants?.[0]?.value || action.eventType || '');
    setOffId(null);
    setText('');
  }, [action, needsVariantStep]);

  if (!action) return null;

  const home = fixture.homeTeam || {};
  const away = fixture.awayTeam || {};
  const teamIdFor = (s: string) => (s === 'home' ? fixture.homeTeamId : fixture.awayTeamId);
  const teamOf = (s: string) => (s === 'home' ? home : away);
  const teamName = (s: string) => teamOf(s).shortName || teamOf(s).name || '—';
  const squad = (fixture.lineups || []).filter((l: any) => l.teamId === teamIdFor(side));

  const publish = (playerId?: number | null, player2Id?: number | null) => {
    const base: any = { teamId: teamIdFor(side), eventType: variant };
    if (playerId) base.playerId = playerId;
    if (kind === 'sub') return onPublish({ ...base, eventType: 'SUBSTITUTION', player2Id: player2Id || undefined });
    return onPublish(base);
  };

  const afterTeam = () => (kind === 'team' ? null : kind === 'sub' ? 'off' : 'player');

  const back = () => {
    if (step === 'player' || step === 'off') return needsVariantStep ? setStep('variant') : setStep('team');
    if (step === 'on') return setStep('off');
    if (step === 'team' && needsVariantStep) return setStep('variant');
    return onClose();
  };
  const firstStep = step === 'variant' || step === 'text' || (step === 'team' && !needsVariantStep);

  /** Two crests, full width, because the team is chosen while looking elsewhere. */
  const teamStep = (label: string) => (
    <>
      {/* A score with more than one value picks it here rather than in a step of
          its own: the team and the value are one decision to a reporter watching
          a basket go in, and splitting them costs a tap on the commonest action. */}
      {kind === 'score' && variants.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {variants.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => setVariant(v.value)}
              aria-pressed={variant === v.value}
              className={cn(
                'min-h-9 flex-1 rounded-pill border px-3 text-sm font-semibold transition-colors duration-150 ease-standard',
                variant === v.value
                  ? 'border-brand bg-brand-tint text-brand-text'
                  : 'border-hairline text-secondary hover:bg-surface-2'
              )}
            >
              {variantLabel(v)}
            </button>
          ))}
        </div>
      )}
      <p className="mb-2 text-sm font-medium text-secondary">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {(['home', 'away'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSide(s);
              const next = afterTeam();
              if (next) setStep(next);
              // Nothing else to say — a set or a timeout belongs to a team and
              // to nobody in it, so the team tap is the publish.
              else onPublish({ teamId: teamIdFor(s), eventType: action.eventType || variant });
            }}
            className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-card border border-hairline bg-surface p-3 transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2 active:bg-surface-2"
          >
            <ClubCrest team={teamOf(s)} size="md" />
            <span className="max-w-full truncate text-sm font-semibold text-primary">{teamName(s)}</span>
          </button>
        ))}
      </div>
    </>
  );

  /** The squad, tap-to-publish. `onPick` is the last interaction in the flow. */
  const playerStep = (label: string, onPick: (playerId: number) => void, exclude?: number | null) => {
    const rows = squad.filter((l: any) => l.playerId !== exclude);
    return (
      <>
        <p className="mb-2 text-sm font-medium text-secondary">{label}</p>
        {rows.length === 0 ? (
          <div className="rounded-card border border-hairline bg-surface-2 p-4 text-center">
            <p className="text-sm font-semibold text-primary">No sheet from {teamName(side)} yet</p>
            <p className="mt-1 text-sm text-secondary">
              Their coach files it from the club portal. Until it arrives this event cannot name a
              player, and an unattributed score never reaches a player&rsquo;s record — so record the
              paper sheet if you were handed one.
            </p>
            <Button variant="secondary" block className="mt-3" to={lineupsHref(matchId)}>
              Record the coach&rsquo;s sheet
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {rows.map((l: any) => (
              <PlayerButton key={l.playerId} row={l} onPick={() => onPick(l.playerId)} />
            ))}
          </div>
        )}
        {/* The player has always been optional on the server. Saying so out loud
            is what stops a reporter freezing over a name they did not catch. */}
        {kind !== 'sub' && (
          <button
            type="button"
            onClick={() => publish(null)}
            className="mt-2 flex min-h-tap w-full items-center justify-center gap-2 rounded-control border border-dashed border-hairline text-sm font-semibold text-secondary transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-primary"
          >
            <UserX size={15} aria-hidden="true" />
            {rows.length === 0 ? 'Publish without a player' : 'Player unknown'}
          </button>
        )}
      </>
    );
  };

  const scored = variants.find((v) => v.value === variant);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={action.label}
      className="fixed inset-0 z-[120] lg:flex lg:items-center lg:justify-center lg:p-6"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Anchored to the bottom edge where a thumb reaches it, centred where a
          pointer does. Centred with FLEX, not `translate`: `animate-in` animates
          the element's transform back to none, so transform-based centring would
          drop the dialog into a corner the moment the 200ms enter finished. */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex max-h-[86vh] flex-col rounded-t-card border-t border-hairline bg-surface shadow-nav',
          'animate-in slide-in-from-bottom duration-200',
          'lg:relative lg:inset-auto lg:max-h-[80vh] lg:w-full lg:max-w-md lg:rounded-card lg:border',
          'lg:slide-in-from-bottom-2 lg:zoom-in-95'
        )}
      >
        <div className="flex items-center gap-2 border-b border-hairline px-3 py-2.5">
          <IconButton
            icon={firstStep ? X : ChevronLeft}
            label={firstStep ? 'Close' : 'Back'}
            onClick={back}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-semibold text-primary">
              {scored && kind === 'score' ? variantLabel(scored) : action.label}
            </p>
            {/* What minute this will be stamped with. The reporter never types it,
                so this is the only place they can see what the clock will write. */}
            <p className="truncate text-xs tabular-nums text-tertiary">{minuteLabel} · {periodLabel}</p>
          </div>
        </div>

        <div className="scroll-contain min-h-0 flex-1 overflow-y-auto p-3">
          {step === 'variant' && (
            <>
              <p className="mb-2 text-sm font-medium text-secondary">{action.prompt || 'Which one?'}</p>
              <div className={cn('grid gap-2', variants.length > 2 ? 'grid-cols-3' : 'grid-cols-2')}>
                {variants.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => { setVariant(v.value); setStep('team'); }}
                    className={cn(
                      'flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-card border px-2 text-sm font-semibold',
                      'transition-colors duration-150 ease-standard active:opacity-90',
                      v.tone || 'border-hairline text-secondary'
                    )}
                  >
                    <span className="max-w-full truncate">{variantLabel(v)}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'team' && teamStep(
            kind === 'sub' ? 'Which team is substituting?'
              : kind === 'team' ? `Which team? This publishes ${EVENT_LABEL[action.eventType || ''] || action.label.toLowerCase()} straight away.`
                : variant === 'OWN_GOAL' ? 'Which team does it count for?'
                  : kind === 'score' ? 'Which team scored?'
                    : 'Which team?'
          )}

          {step === 'player' && playerStep(
            kind === 'score' ? 'Who scored?' : 'Who was it?',
            (pid) => publish(pid)
          )}

          {step === 'off' && playerStep('Who is coming off?', (pid) => { setOffId(pid); setStep('on'); })}
          {step === 'on' && playerStep('Who is coming on?', (pid) => publish(pid, offId), offId)}

          {step === 'text' && (
            <>
              <p className="mb-2 text-sm font-medium text-secondary">What is happening?</p>
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 200))}
                  rows={4}
                  aria-label="What is happening"
                  placeholder="Describe the passage of play…"
                  className={cn(textareaCls, 'resize-none pb-7')}
                />
                <span className="absolute bottom-3 right-3 text-xs tabular-nums text-tertiary">{text.length}/200</span>
              </div>
              {/* A note is the one event with no team and no player, so it is also
                  the one that still needs a deliberate send. */}
              <Button
                block
                icon={Send}
                className="mt-3"
                loading={publishing}
                disabled={publishing || !text.trim()}
                onClick={() => onPublish({ eventType: 'COMMENTARY', description: text.trim() })}
              >
                Publish update
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── the console ─────────────────────────────────────────────────────────── */

const ReporterMatchConsolePage = () => {
  const { id } = useParams();
  const matchId = Number(id);
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const [now, setNow] = useState(() => Date.now());   // drives the ticking display
  const [tab, setTab] = useState('live');
  const [addedInput, setAddedInput] = useState('');
  // Which capture sheet is open, if any. Everything the sheet is collecting lives
  // inside it: the console does not need to know that a card is half-chosen, and
  // keeping it here is what let the old form reopen pre-filled with the last
  // event's team.
  const [sheet, setSheet] = useState<string | null>(null);

  const {
    data: fixture,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['match-details', matchId],
    queryFn: async () => {
      const data = await getMatch(matchId);
      // Stamp the moment this arrived, so the browser extrapolates from a known
      // point rather than trusting its own wall clock to match the server's.
      return { ...data, clock: stampClock(data.clock) };
    },
    enabled: Number.isFinite(matchId),
    // A 403 or a 404 is an ANSWER, not a blip: this reporter is not on this match,
    // or the match is gone. Retrying three times only delays telling them.
    retry: false,
    // The console is the source of truth while reporting, but a co-reporter or an
    // admin may also be writing; a slow poll keeps the feed honest without
    // fighting the reporter's own optimistic view. Only while the match is live —
    // a scheduled fixture has nothing to poll for.
    refetchInterval: (query: any) => (query.state.data?.status === 'LIVE' ? 15000 : false),
  });

  useEffect(() => { setAddedInput(String(fixture?.liveState?.addedMinutes ?? '')); }, [fixture?.liveState?.addedMinutes]);

  // The server hands back the kick-off timestamp; the minute is recomputed here
  // every second from that, so the display ticks without a request per second and
  // still agrees with every other screen showing this match. The interval only
  // runs while the clock is running — at half time there is nothing to count.
  //
  // Before kick-off the same `now` drives the countdown, but at 30s: a reporter
  // watching "in 38 min" does not need the second hand, and a one-second timer on
  // a phone sitting in a pocket for forty minutes is a battery cost for nothing.
  const running = !!fixture?.clock?.running;
  const counting = fixture?.status === 'SCHEDULED' && !!fixture?.matchDate;
  useEffect(() => {
    if (!running && !counting) return undefined;
    const t = setInterval(() => setNow(Date.now()), running ? 1000 : 30000);
    return () => clearInterval(t);
  }, [running, counting]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['match-details', matchId] });
  const closeSheet = () => setSheet(null);

  const scrollToDetails = () => {
    const el = document.getElementById('match-details');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* -- mutations. Every one reports on success AND on failure: the server refuses
        a lineup or a suspended player BY NAME, and that sentence is the only thing
        that tells a reporter what to do next. ------------------------------- */

  // Kick-off goes through the clock endpoint: it stamps the start time, writes the
  // KICKOFF event and flips the fixture to LIVE in one call, so the clock and the
  // feed can never disagree about when the match began.
  const startMatch = useMutation({
    mutationFn: () => setClock(matchId, { action: 'start' }),
    onSuccess: () => {
      refresh();
      queryClient.invalidateQueries({ queryKey: ['reporter-assignments'] });
      setTab('live');
      pushToast('Match is live', 'success');
    },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not start the match'),
  });

  const clock = useMutation({
    mutationFn: (body: any) => setClock(matchId, body),
    onSuccess: (_d, body: any) => {
      refresh();
      // Full time changes which bucket this fixture sits in for every other
      // screen in the portal — Today stops calling it live, My matches moves it
      // to Completed — so it is the one transition that invalidates the shared
      // assignments query as well as this match.
      if (body.action === 'fulltime') queryClient.invalidateQueries({ queryKey: ['reporter-assignments'] });
      pushToast(body.action ? CLOCK_LABEL[body.action] : `Added time set to ${body.addedMinutes}'`, 'success');
    },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not update the clock'),
  });

  const addEvent = useMutation({
    mutationFn: (body: any) => postEvent(matchId, body),
    onSuccess: (_d, body: any) => {
      refresh();
      closeSheet();
      pushToast(`${EVENT_LABEL[body.eventType] || 'Event'} published`, 'success');
    },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not publish that event'),
  });

  // Undo. The server puts back the score, the scorer's tally and any suspension
  // the card caused, so this button is safe to reach for the moment a tap lands
  // on the wrong team — which is the whole reason it exists.
  const undoEvent = useMutation({
    mutationFn: (eventId: number) => removeEvent(matchId, eventId),
    onSuccess: () => { refresh(); pushToast('Event removed', 'success'); },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not remove that event'),
  });


  /* -- states before the console can render ----------------------------- */

  if (!Number.isFinite(matchId)) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState title="That is not a match" hint="The link you followed does not name a fixture." />
        <div className="flex justify-center">
          <Button variant="secondary" to="/reporter/matches">Back to my matches</Button>
        </div>
      </div>
    );
  }

  if (isLoading) return <ConsoleSkeleton />;

  if (isError || !fixture) {
    const httpStatus = (error as any)?.response?.status;
    const notMine = httpStatus === 403;
    const missing = httpStatus === 404;
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          title={notMine ? 'This match is not yours to report' : missing ? 'That match no longer exists' : 'Could not load this match'}
          hint={
            notMine
              ? 'A league admin has to assign you to a fixture, or to its league, before you can report on it.'
              : missing
                ? 'It may have been removed by a league admin. Your other assignments are unaffected.'
                : 'Check your connection and try again.'
          }
          // Retrying a 403 or a 404 asks the same question and gets the same
          // answer; only a transport failure is worth another go.
          onRetry={notMine || missing ? undefined : () => refetch()}
        />
        <div className="flex justify-center">
          <Button variant="secondary" to="/reporter/matches">Back to my matches</Button>
        </div>
      </div>
    );
  }

  /* -- derived ---------------------------------------------------------- */

  const home = fixture.homeTeam || {};
  const away = fixture.awayTeam || {};
  const isLive = fixture.status === 'LIVE';
  const isClosed = CLOSED_STATUSES.includes(fixture.status);
  const phase = isLive ? 'live' : isClosed ? 'closed' : 'prepare';

  const live = tickClock(fixture.clock, now);

  /**
   * The vocabulary this match is reported in.
   *
   * `GET /fixtures/:id` includes `league.sport` with its slug precisely so a
   * client can do this — the comment on that include says the lineup view has to
   * know which surface to draw, and the same is true of which words to offer.
   * An unknown or missing sport falls back to a generic set rather than to
   * football's, because football's is the one most likely to be actively wrong.
   */
  const actions = actionsForSport(fixture.league?.sport?.slug);
  const openAction = sheet ? actions.find((a) => a.id === sheet) || null : null;
  const readinessState = readinessSummary(fixture);
  const closeout = closeoutSummary(fixture);


  const tabs =
    phase === 'live'
      ? [
        { id: 'live', label: 'Live' },
        { id: 'lineups', label: 'Line-ups' },
        { id: 'stats', label: 'Stats' },
        { id: 'details', label: 'Details' },
      ]
      : [
        { id: 'signoff', label: 'Sign off', badge: closeout.outstanding || undefined },
        { id: 'lineups', label: 'Line-ups' },
        { id: 'stats', label: 'Stats' },
        { id: 'details', label: 'Details' },
      ];
  // The tab is derived rather than reset by an effect: when full time flips the
  // phase, "live" simply stops existing and the first tab of the new phase wins.
  const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;

  const kickOff = fixture.matchDate ? new Date(fixture.matchDate) : null;
  const heading = phase === 'prepare' ? 'Prepare' : phase === 'live' ? 'Report' : 'Sign off';
  const subheading =
    phase === 'prepare'
      ? 'Everything that has to be true before you can report this match.'
      : phase === 'live'
        ? 'The clock is running. Every event is published the moment you send it.'
        : 'Confirm the official line and finish the paperwork.';

  const lineupsTab = (
    <Panel
      title="Published team sheets"
      hint="Read-only here — the sheet editor owns changes, so one screen cannot overwrite the other."
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TeamSheet fixture={fixture} teamId={fixture.homeTeamId} team={home} />
        <TeamSheet fixture={fixture} teamId={fixture.awayTeamId} team={away} />
      </div>
      <Button variant="secondary" block className="mt-5" to={lineupsHref(matchId)}>
        Edit team sheets
      </Button>
    </Panel>
  );

  return (
    // No outer page padding and no `min-h-screen bg-page`: the reporter layout owns
    // the ground and the gutter. The bottom padding only exists where the action
    // bar does — on the other tabs there is nothing overlapping the last card.
    <div className={cn(isLive && activeTab === 'live' && 'pb-28 lg:pb-0')}>
      <div className="mx-auto max-w-3xl">
        <Link
          to="/reporter/matches"
          className="mb-2 inline-flex min-h-tap items-center gap-1.5 text-sm text-secondary transition-colors duration-150 ease-standard hover:text-primary"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          All matches
        </Link>

        <PageHeader
          title={heading}
          subtitle={subheading}
          actions={<MatchStatusChip fixture={fixture} minute={isLive ? live.display : undefined} />}
        />

        {phase === 'prepare' && (
          <div className="space-y-3">
            {/* Who, when, where — the four facts a reporter checks on arrival. */}
            <section className="rounded-card border border-hairline bg-surface p-5">
              <MatchIdentity fixture={fixture} size="lg" />
              <p className="mt-4 text-center text-sm text-secondary">
                {kickOff ? (
                  <>
                    <span className="tabular-nums">{format(kickOff, 'EEE d MMM, HH:mm')}</span>
                    <span className="text-tertiary"> · {timeUntil(fixture.matchDate, now)}</span>
                  </>
                ) : (
                  'Kick-off time to be confirmed'
                )}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-hairline pt-4 sm:grid-cols-4">
                <Fact label="Venue" value={fixture.venue || 'Not set'} />
                <Fact label="Referee" value={fixture.referee || 'Not set'} />
                <Fact label="Competition" value={fixture.competition?.name || fixture.league?.name} />
                <Fact label="Matchday" value={<span className="tabular-nums">{fixture.matchday ?? '—'}</span>} />
              </div>
            </section>

            {/* The checklist, with a way out of every item it flags. The version a
                reporter saw on Monday and the one the console shows on Saturday are
                the same function — see lib/reporterMatch. */}
            <Panel
              title="Before kick-off"
              hint={<span className="tabular-nums">{readinessState.done} of {readinessState.total} done</span>}
            >
              <ul className="divide-y divide-hairline">
                {readinessState.items.map((item) => {
                  const isSheet = item.key === 'home-sheet' || item.key === 'away-sheet';
                  return (
                    <li key={item.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border',
                          item.done ? 'border-hairline text-tertiary' : item.optional ? 'border-hairline text-secondary' : 'border-live/40 text-live'
                        )}
                      >
                        {item.done ? <Check size={15} aria-hidden="true" /> : <AlertTriangle size={15} aria-hidden="true" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-primary">{item.label}</p>
                        {!item.done && <p className="mt-0.5 text-xs text-tertiary">{item.why}</p>}
                      </div>
                      {!item.done && (
                        isSheet ? (
                          <Button variant="secondary" className="shrink-0 px-4" to={lineupsHref(matchId)}>
                            Add
                          </Button>
                        ) : (
                          <Button variant="secondary" className="shrink-0 px-4" onClick={scrollToDetails}>
                            Edit
                          </Button>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>

            {/* KICK-OFF IS NEVER BLOCKED BY PAPERWORK. A console that refused to
                start because a team sheet was missing would fail at the single
                moment it cannot afford to — the whistle has already gone and the
                reporter cannot make a coach hand over a sheet. So the cost is
                stated plainly and the decision is left with the person at the
                ground. */}
            <div className="pt-1">
              {readinessState.blocking.length > 0 && (
                <p className="mb-2 flex items-start gap-2 text-sm text-live">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    {readinessState.blocking.length === 1
                      ? readinessState.blocking[0].label
                      : `${readinessState.blocking.length} team sheets`}{' '}
                    missing — you can still start, but goals cannot be credited to a player.
                  </span>
                </p>
              )}
              <Button
                block
                size="lg"
                icon={Play}
                loading={startMatch.isPending}
                onClick={() => startMatch.mutate()}
                className="min-h-[64px] text-lg"
              >
                Kick off
              </Button>
            </div>

            {/* The anchor sits on the wrapper, not the Panel: Panel takes a fixed
                set of props and forwards nothing, and the readiness rows above
                scroll to this id. */}
            <div id="match-details" className="scroll-mt-4">
              <Panel
                title="Match details"
                hint="Correct what you can see from the ground. The date and the status stay with the league admin."
              >
                <MatchDetailsForm fixture={fixture} matchId={matchId} />
              </Panel>
            </div>
          </div>
        )}

        {phase !== 'prepare' && (
          <>
            {/* THE STICKY BAR IS THE POINT OF THE LAYOUT. Score, minute and period
                stay on screen while the feed scrolls, so a reporter checking what
                they published two minutes ago never loses the clock. */}
            {/* `top-14`, not `top-0`: the portal bar this layout mounts is
                `sticky top-0 z-40` and 56px tall, so a bar pinned to the viewport
                top would slide underneath it and disappear exactly when it is
                needed. */}
            <div className="sticky top-14 z-20 mb-3 rounded-card border border-hairline bg-surface px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary">
                    {teamLabel(home)}
                    <span className="mx-1.5 font-normal text-tertiary">v</span>
                    {teamLabel(away)}
                  </p>
                  <p className="font-display text-2xl font-bold tabular-nums leading-tight text-primary">
                    {fixture.homeScore ?? 0} <span className="text-tertiary">-</span> {fixture.awayScore ?? 0}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="flex items-baseline justify-end gap-2">
                    <span className={cn('font-display text-2xl font-bold tabular-nums', isLive ? 'text-live' : 'text-secondary')}>
                      {live.display}
                    </span>
                    <span className="text-xs tabular-nums text-tertiary">{live.mmss}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-secondary">
                    {PERIOD_LABEL[live.period] || live.period}
                    {live.addedMinutes > 0 && <span className="font-semibold text-live"> · +{live.addedMinutes} added</span>}
                  </p>
                </div>
              </div>
            </div>

            <Tabs tabs={tabs} value={activeTab} onChange={setTab} className="mb-3" />

            {activeTab === 'live' && (
              <div className="space-y-3">
                {/* The clock runs itself from kick-off; every event below takes its
                    minute from it, so there is nothing here to keep correcting. The
                    only clock control on screen is whichever transition comes next. */}
                <ClockStrip
                  live={live}
                  addedInput={addedInput}
                  setAddedInput={setAddedInput}
                  onClock={(body) => clock.mutate(body)}
                  pending={clock.isPending}
                />

                {/* The desktop half of the pair above — hidden on a phone, where
                    the dock at the foot of the screen is doing this job. */}
                <ActionButtons actions={actions} onPick={setSheet} className="hidden lg:grid" />

                {/* The feed is now the whole of the Live tab, because with capture
                    moved to the thumb bar it is the only thing left to read — and
                    reading back what was just published is how a reporter catches
                    their own mistakes while there is still time to undo them. */}
                <Panel title="Match feed" hint="Newest first. Undo puts back the score, the tally and any suspension.">
                  <MatchFeed fixture={fixture} onUndo={(eid) => undoEvent.mutate(eid)} undoing={undoEvent.isPending} />
                </Panel>
              </div>
            )}

            {activeTab === 'signoff' && (
              <div className="space-y-3">
                <section className="rounded-card border border-hairline bg-surface p-5">
                  <MatchIdentity fixture={fixture} size="lg" />
                  <p className="mt-3 text-center text-xs text-tertiary">
                    {fixture.venue || 'Venue not recorded'}
                    {kickOff && <span className="tabular-nums"> · {format(kickOff, 'EEE d MMM')}</span>}
                  </p>
                </section>

                <Panel
                  title="Still to do"
                  hint={closeout.outstanding === 0 ? 'Everything is filed.' : <span className="tabular-nums">{closeout.outstanding} outstanding</span>}
                >
                  <ul className="divide-y divide-hairline">
                    {closeout.items.map((item) => (
                      <li key={item.key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                        <span
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border',
                            item.done ? 'border-hairline text-tertiary' : 'border-live/40 text-live'
                          )}
                        >
                          {item.done ? <Check size={14} aria-hidden="true" /> : <AlertTriangle size={14} aria-hidden="true" />}
                        </span>
                        <p className={cn('flex-1 text-sm', item.done ? 'text-tertiary' : 'text-primary')}>{item.label}</p>
                        {item.key === 'stats' && !item.done && (
                          <Button variant="secondary" className="shrink-0 px-4" onClick={() => setTab('stats')}>
                            Fill in
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </Panel>

                <Panel
                  title="Confirm the result"
                  hint="The official line. Once saved, the score no longer follows the event log."
                >
                  <ResultForm fixture={fixture} matchId={matchId} />
                </Panel>

                <Panel title="Match feed" hint="The record of the match, as reported.">
                  <MatchFeed fixture={fixture} />
                </Panel>
              </div>
            )}

            {activeTab === 'lineups' && lineupsTab}

            {activeTab === 'stats' && (
              <Panel
                title="Match statistics"
                hint="Usually filled at half time and again at full time. Each team saves on its own."
              >
                <StatsTab fixture={fixture} matchId={matchId} />
              </Panel>
            )}

            {activeTab === 'details' && (
              <Panel
                title="Match details"
                hint="Correct what you can see from the ground. The date and the status stay with the league admin."
              >
                <MatchDetailsForm fixture={fixture} matchId={matchId} />
              </Panel>
            )}
          </>
        )}
      </div>

      {/* The thumb zone now belongs to the four things that happen twenty times a
          match, not to the one that happens once. Full time moved to the clock,
          where it is the next step rather than an exit — see NEXT_STEP. */}
      {isLive && activeTab === 'live' && <ActionDock actions={actions} onPick={setSheet} />}

      <EventSheet
        action={isLive ? openAction : null}
        fixture={fixture}
        minuteLabel={live.display}
        periodLabel={PERIOD_LABEL[live.period] || live.period}
        matchId={matchId}
        publishing={addEvent.isPending}
        onPublish={(body) => addEvent.mutate(body)}
        onClose={closeSheet}
      />
    </div>
  );
};

export default ReporterMatchConsolePage;
