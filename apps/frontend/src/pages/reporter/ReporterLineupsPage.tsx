import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangle, ArrowLeft, Check, ClipboardList, Clock3, MapPin, Star, Users } from 'lucide-react';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { MatchIdentity, MatchRow, MatchStatusChip, Tabs } from '../../components/reporter/ReporterUI';
import { getMatch, getTeam, saveLineup, type LineupRow } from '../../api/endpoints/reporter';
import { authorLabel, authorName, sheetAuthor } from '../../lib/teamSheet';
import useReporterFixtures from '../../hooks/useReporterFixtures';
import { surfaceFor } from '../../config/playingSurfaces';
import { Button, EmptyState, ErrorState, Field, Input, Select, Skeleton, StatusPill, cn } from '../../components/ui';
import useUiStore from '../../store/uiStore';

/**
 * Team sheets — what each coach submitted, recorded by the reporter.
 *
 * THE COACH DECIDES. THE REPORTER TRANSCRIBES. That distinction is the whole
 * design of this page and it is what the first version got wrong: it opened
 * straight into an editable squad with a formation picker, which invited a
 * reporter to choose a shape and an eleven on the coach's behalf. Nobody at a
 * touchline has the standing to do that, and a match record that contains a
 * reporter's guess at a formation is worse than one that contains nothing.
 *
 * So the page has two states per team, and the FIRST one is the normal one:
 *
 *   Sheet on file → read it and move on. `SheetOnFile` renders exactly what the
 *                   coach filed from the club portal. Correcting it is a
 *                   deliberate second action behind a quiet button, for the case
 *                   where paper at the ground disagrees with the app.
 *   No sheet yet  → say whose job it was, then hand over the pen. The reporter
 *                   copies the paper sheet the coach gave them, as written.
 *
 * WHY THE REPORTER CAN DO IT AT ALL. They hold `fixtures.lineups`, and at a
 * district ground the coach frequently has not used the portal. Without a way to
 * record the sheet, the console shows an empty player dropdown and every goal
 * that afternoon is credited to nobody — it never reaches a scorer's tally or a
 * player page. The pen exists for that, and only for that.
 *
 * THE INTERACTION is lifted from pages/team/TeamLineupsPage (tap a player to
 * cycle Out → Starting → Bench, a star for the one captain) because that part is
 * proven; the styling is not, because that page is still on the pre-redesign
 * `font-display uppercase tracking-tighter` shell this portal was moved off.
 *
 * IT CAN NOW SAY WHO. `MatchTeamSheet.submittedById` records the author, so this
 * screen distinguishes a sheet the coach filed from the club portal — which the
 * reporter should leave alone — from one a reporter transcribed, which may be
 * theirs to check. A sheet written before that column existed reads "on file",
 * which is the honest answer and not a claim about anybody.
 *
 * THE ERROR HANDLING IS THE FEATURE. The server refuses a whole sheet BY NAME in
 * two cases — a player from another squad (400) and a player serving a ban (409,
 * with the offending ids in `suspended`). Both messages are written to be read
 * aloud at a touchline, so they are surfaced verbatim and the named players are
 * marked on their own rows. A generic "Something went wrong" here would cost the
 * reporter the one piece of information they need.
 *
 * NO FALSE LOCK. The server locks a sheet once the match is LIVE or COMPLETED
 * only for a TEAM_MANAGER; a reporter may still fix one mid-match, which is
 * exactly what a late announced change requires. So nothing here greys out after
 * kick-off — showing a lock that does not exist would send a reporter looking
 * for an admin they do not need.
 */

type Role = 'OUT' | 'STARTER' | 'BENCH';

/** One team's unsaved sheet. Kept per team so switching tabs loses nothing. */
type Draft = {
  formation: string;
  coachName: string;
  roles: Record<number, Role>;
  captain: number | null;
};

const EMPTY_DRAFT: Draft = { formation: '', coachName: '', roles: {}, captain: null };

/** Out → Starting → Bench → Out. One tap per change, no menu to open. */
const NEXT_ROLE: Record<Role, Role> = { OUT: 'STARTER', STARTER: 'BENCH', BENCH: 'OUT' };

const ROLE_LABEL: Record<Role, string> = { OUT: 'Out', STARTER: 'Starting', BENCH: 'Bench' };

/**
 * Role as a chip. Out is quiet because most of a squad is out and a list of
 * loud chips says nothing; Starting takes the brand green, which on this page is
 * the state that matters; Bench is neutral — named, but not on the field.
 */
const ROLE_CHIP: Record<Role, string> = {
  OUT: 'border-hairline text-tertiary',
  STARTER: 'border-brand/40 bg-brand-tint text-brand-text font-semibold',
  BENCH: 'border-hairline bg-surface-2 text-secondary',
};

const teamName = (team: any) => team?.shortName || team?.name || 'Team';

/* ── a sheet that has already been filed ─────────────────────────────────── */

/**
 * WHAT THE COACH SUBMITTED, READ ONLY.
 *
 * This is the state the page should be in most of the time, and it is the state
 * the page did not have. Whoever picks a formation and an eleven is the coach —
 * it is their decision, made in the dressing room, and the club portal is where
 * they file it. A reporter who is shown an editable squad list is being invited
 * to make that decision on the coach's behalf, which is not their job and is not
 * something the match record should ever contain.
 *
 * So when a sheet exists, the reporter reads it and moves on. Correcting it is
 * still possible — a coach hands over paper at the ground, or names a late
 * change — but it is a deliberate second action behind a quiet button, not the
 * default posture of the screen.
 */
const SheetOnFile = ({
  team,
  sheet,
  rows,
  onCorrect,
}: {
  team: any;
  sheet: any;
  rows: any[];
  onCorrect: () => void;
}) => {
  const starters = rows.filter((r) => r.isStarter);
  const bench = rows.filter((r) => !r.isStarter);

  const group = (label: string, list: any[]) =>
    list.length > 0 && (
      <div>
        <p className="mb-1.5 text-xs font-semibold text-tertiary">
          {label} <span className="tabular-nums">({list.length})</span>
        </p>
        <ul className="space-y-1">
          {list.map((row) => (
            <li key={row.playerId} className="flex items-center gap-3 rounded-control bg-surface-2 px-3 py-2">
              <span className="w-7 shrink-0 text-center text-sm font-semibold tabular-nums text-tertiary">
                {row.jerseyNo ?? '—'}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">
                {row.player?.fullName || 'Unnamed player'}
              </span>
              {row.isCaptain && (
                <span className="shrink-0 rounded-pill border border-hairline px-1.5 text-[10px] font-bold text-tertiary">
                  C
                </span>
              )}
              {row.position && <span className="shrink-0 text-xs text-tertiary">{row.position}</span>}
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <Panel
      title={`${teamName(team)} — ${authorLabel(sheet, 'reporter').toLowerCase()}`}
      hint={
        <span className="inline-flex flex-wrap items-center gap-x-2">
          {sheet?.formation && <span className="tabular-nums">{sheet.formation}</span>}
          {sheet?.coachName && <span>Coach {sheet.coachName}</span>}
          {sheet?.updatedAt && (
            <span className="tabular-nums">Filed {format(new Date(sheet.updatedAt), 'd MMM, HH:mm')}</span>
          )}
        </span>
      }
    >
      {/* WHOSE SHEET THIS IS decides what the reporter should do with it. One the
          coach filed from the club portal is the club's decision and wants
          leaving alone; one a reporter transcribed is worth a second look against
          the paper. Before `submittedById` existed both read the same. */}
      <div className="mb-3 flex items-center gap-2 rounded-control border border-hairline bg-surface-2 px-3 py-2">
        <Check size={15} className="shrink-0 text-brand-text" aria-hidden="true" />
        <p className="text-sm text-secondary">
          {sheetAuthor(sheet) === 'coach'
            ? `The coach filed this from the club portal${authorName(sheet) ? ` (${authorName(sheet)})` : ''} — nothing to do here.`
            : sheetAuthor(sheet) === 'reporter'
              ? `Recorded at the ground${authorName(sheet) ? ` by ${authorName(sheet)}` : ''}. Worth a check against the paper sheet.`
              : 'This team is named, so goals and cards can be credited to a player.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {group('Starting', starters)}
        {group('Substitutes', bench)}
      </div>

      {/* Quiet on purpose. Correcting a filed sheet is the exception, and a
          prominent Edit button would make it read like the reporter's to change. */}
      <Button variant="ghost" className="mt-4" onClick={onCorrect}>
        Doesn&rsquo;t match the paper sheet? Correct it
      </Button>
    </Panel>
  );
};

/* ── no sheet yet ────────────────────────────────────────────────────────── */

/**
 * The other honest state: the coach has not filed anything.
 *
 * It says whose job this was before offering the reporter the pen, because the
 * fix is often a phone call rather than typing — and because a reporter who
 * understands they are copying, not choosing, copies more carefully.
 */
const NoSheetYet = ({ team, onRecord }: { team: any; onRecord: () => void }) => (
  <Panel title={`${teamName(team)} — no sheet yet`}>
    <p className="text-sm text-secondary">
      The coach files this from the club portal, and it has not arrived. If they handed you a
      paper sheet at the ground, copy it in below — exactly as written. Nothing on it is your
      call to make.
    </p>
    <p className="mt-2 flex items-start gap-1.5 text-xs text-tertiary">
      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-live" aria-hidden="true" />
      Until this team is named, a goal or a card for them cannot reach a player&rsquo;s record.
    </p>
    <Button className="mt-4" onClick={onRecord}>
      Record the coach&rsquo;s sheet
    </Button>
  </Panel>
);

/* ── one player, one row ─────────────────────────────────────────────────── */

/**
 * A squad member. The whole row is the role control — a reporter naming
 * eighteen players standing up should not have to find a 20px chip — and the
 * captain star is the only other target on it.
 */
const PlayerRow = ({
  player,
  role,
  isCaptain,
  isSuspended,
  onCycle,
  onCaptain,
}: {
  player: any;
  role: Role;
  isCaptain: boolean;
  isSuspended: boolean;
  onCycle: () => void;
  onCaptain: () => void;
}) => (
  <li
    className={cn(
      'flex items-stretch gap-1 border-b border-hairline last:border-b-0',
      // The server named this player in its refusal. The sentence above the save
      // button says why; this says WHICH, so the reporter does not have to read
      // three names back out of a paragraph.
      isSuspended && 'border-l-2 border-l-danger bg-danger/5'
    )}
  >
    <button
      type="button"
      onClick={onCycle}
      aria-label={`${player.fullName}, currently ${ROLE_LABEL[role].toLowerCase()}. Change role.`}
      className="flex min-h-tap flex-1 items-center gap-3 px-4 py-2 text-left transition-colors duration-150 ease-standard hover:bg-surface-2"
    >
      <span className="w-7 shrink-0 text-sm font-semibold tabular-nums text-tertiary">
        {player.jerseyNumber ?? '—'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-primary">{player.fullName}</span>
        <span className="block truncate text-xs text-tertiary">{player.position || 'Position not set'}</span>
      </span>
      {isSuspended && <StatusPill status="SUSPENDED" className="shrink-0" />}
      <span className={cn('shrink-0 rounded-pill border px-2.5 py-1 text-xs', ROLE_CHIP[role])}>
        {ROLE_LABEL[role]}
      </span>
    </button>
    <button
      type="button"
      onClick={onCaptain}
      aria-pressed={isCaptain}
      aria-label={isCaptain ? `${player.fullName} is captain. Remove the armband.` : `Make ${player.fullName} captain.`}
      // Hidden rather than disabled for a player who is out: a captain who is not
      // on the sheet is not a captain, and an inert control invites a second tap.
      className={cn(
        'flex min-h-tap w-11 shrink-0 items-center justify-center transition-colors duration-150 ease-standard',
        role === 'OUT' ? 'invisible' : isCaptain ? 'text-brand-text' : 'text-tertiary hover:text-primary'
      )}
    >
      <Star size={18} fill={isCaptain ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  </li>
);

/* ── the page ────────────────────────────────────────────────────────────── */

const ReporterLineupsPage = () => {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  // The selected match lives in the URL, not in state: a refresh at a windy
  // touchline keeps the reporter where they were, and the console's "no sheet"
  // prompt can deep-link straight into the right editor.
  const rawFixture = params.get('fixture');
  const fixtureId = rawFixture && /^\d+$/.test(rawFixture) ? Number(rawFixture) : null;

  const [tab, setTab] = useState<'home' | 'away'>('home');
  /**
   * Which teams the reporter has explicitly opened for correction.
   *
   * Editing is opt-in per team, never the landing state. A filed sheet is the
   * coach's, and the page has to say so by showing it rather than by offering to
   * change it.
   */
  const [editing, setEditing] = useState<Record<number, boolean>>({});
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  /** The server's refusal, verbatim, per team. */
  const [errors, setErrors] = useState<Record<number, string>>({});
  /** Player ids the server named as suspended, per team. */
  const [suspended, setSuspended] = useState<Record<number, number[]>>({});

  const assignments = useReporterFixtures();

  const matchQuery = useQuery({
    queryKey: ['reporter-match', fixtureId],
    queryFn: () => getMatch(fixtureId!),
    enabled: !!fixtureId,
  });
  const match = matchQuery.data;

  const homeQuery = useQuery({
    queryKey: ['team', match?.homeTeamId],
    queryFn: () => getTeam(match!.homeTeamId),
    enabled: !!match?.homeTeamId,
  });
  const awayQuery = useQuery({
    queryKey: ['team', match?.awayTeamId],
    queryFn: () => getTeam(match!.awayTeamId),
    enabled: !!match?.awayTeamId,
  });

  /**
   * Seed each draft from the sheet already stored, once.
   *
   * Once per fixture-and-team, tracked by a ref: the match query refetches (the
   * reporter may have the console open in another tab), and re-seeding on every
   * refetch would silently throw away half-typed changes.
   */
  const seeded = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!match) return;
    for (const team of [homeQuery.data, awayQuery.data]) {
      if (!team?.id) continue;
      const key = `${match.id}:${team.id}`;
      if (seeded.current.has(key)) continue;
      seeded.current.add(key);

      const sheet = (match.teamSheets || []).find((s: any) => s.teamId === team.id);
      const roles: Record<number, Role> = {};
      let captain: number | null = null;
      for (const row of (match.lineups || []).filter((l: any) => l.teamId === team.id)) {
        roles[row.playerId] = row.isStarter ? 'STARTER' : 'BENCH';
        if (row.isCaptain) captain = row.playerId;
      }
      setDrafts((prev) => ({
        ...prev,
        [team.id]: {
          formation: sheet?.formation || '',
          coachName: sheet?.coachName || '',
          roles,
          captain,
        },
      }));
    }
  }, [match, homeQuery.data, awayQuery.data]);

  const activeTeam = tab === 'home' ? homeQuery.data : awayQuery.data;
  const activeTeamId: number | null = activeTeam?.id ?? null;
  const draft = (activeTeamId != null && drafts[activeTeamId]) || EMPTY_DRAFT;

  /** Shirt order, because that is the order the paper sheet is written in. */
  const squad = useMemo(() => {
    const players = [...((activeTeam?.players as any[]) || [])];
    return players.sort((a, b) => {
      const an = a.jerseyNumber ?? 999;
      const bn = b.jerseyNumber ?? 999;
      return an - bn || String(a.fullName).localeCompare(String(b.fullName));
    });
  }, [activeTeam]);

  const countFor = (team: any) => {
    const d = team?.id != null ? drafts[team.id] : null;
    const roles = Object.values(d?.roles || {});
    return {
      starters: roles.filter((r) => r === 'STARTER').length,
      bench: roles.filter((r) => r === 'BENCH').length,
    };
  };
  const counts = countFor(activeTeam);

  /**
   * What is already on file for a team, straight from the fixture.
   *
   * Read from `match.lineups` rather than from the draft, because these two
   * answer different questions: the draft is what the reporter is typing, and
   * this is what the coach filed. Conflating them is how the first version came
   * to present an empty draft as though it were the team sheet.
   */
  const filedFor = (teamId?: number | null) =>
    teamId == null ? [] : (match?.lineups || []).filter((l: any) => l.teamId === teamId);
  const sheetMetaFor = (teamId?: number | null) =>
    teamId == null ? null : (match?.teamSheets || []).find((sh: any) => sh.teamId === teamId) || null;

  /** The badge, and the tab label's promise: what that team currently shows. */
  const tabCountFor = (team: any) => {
    if (team?.id != null && editing[team.id]) {
      const d = countFor(team);
      return `${d.starters} + ${d.bench}`;
    }
    const rows = filedFor(team?.id);
    if (!rows.length) return '—';
    return `${rows.filter((r: any) => r.isStarter).length} + ${rows.filter((r: any) => !r.isStarter).length}`;
  };

  const filedRows = filedFor(activeTeamId);
  const showEditor = activeTeamId != null && !!editing[activeTeamId];
  const openEditor = () => activeTeamId != null && setEditing((prev) => ({ ...prev, [activeTeamId]: true }));

  /**
   * A shape only means something where the sport expresses one as a number
   * string. Football and rugby do; basketball and volleyball do not — five on
   * court is five on court, and offering a basketball coach "4-3-3" is the same
   * mistake as drawing them a football pitch. Where there are none, the field is
   * not rendered at all rather than rendered empty.
   */
  const surface = surfaceFor(activeTeam?.sport);
  const formations = surface?.formations ?? [];
  const expectedStarters = surface?.starters ?? null;

  const patchDraft = (teamId: number, patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) =>
    setDrafts((prev) => {
      const current = prev[teamId] || EMPTY_DRAFT;
      const next = typeof patch === 'function' ? patch(current) : patch;
      return { ...prev, [teamId]: { ...current, ...next } };
    });

  const cycleRole = (playerId: number) => {
    if (activeTeamId == null) return;
    patchDraft(activeTeamId, (d) => {
      const next = NEXT_ROLE[d.roles[playerId] || 'OUT'];
      return {
        roles: { ...d.roles, [playerId]: next },
        // Dropping the captain from the sheet drops the armband with them,
        // rather than sending a captain the server will not find.
        captain: next === 'OUT' && d.captain === playerId ? null : d.captain,
      };
    });
  };

  // Exactly one armband: setting a new captain clears the old by construction,
  // because the draft holds a single id rather than a flag per player.
  const toggleCaptain = (playerId: number) => {
    if (activeTeamId == null) return;
    patchDraft(activeTeamId, (d) => ({ captain: d.captain === playerId ? null : playerId }));
  };

  const save = useMutation({
    mutationFn: (teamId: number) => {
      const d = drafts[teamId] || EMPTY_DRAFT;
      const roster: any[] = (teamId === homeQuery.data?.id ? homeQuery.data : awayQuery.data)?.players || [];
      const players: LineupRow[] = roster
        .filter((p) => (d.roles[p.id] || 'OUT') !== 'OUT')
        .map((p) => ({
          playerId: p.id,
          position: p.position ?? null,
          jerseyNo: p.jerseyNumber ?? null,
          isStarter: d.roles[p.id] === 'STARTER',
          isCaptain: d.captain === p.id,
        }));
      return saveLineup(fixtureId!, {
        teamId,
        formation: d.formation || null,
        coachName: d.coachName || null,
        published: true,
        players,
      });
    },
    onSuccess: (_data, teamId) => {
      setErrors((prev) => ({ ...prev, [teamId]: '' }));
      setSuspended((prev) => ({ ...prev, [teamId]: [] }));
      // Back to reading it. Transcription is a one-off act, not a mode the
      // reporter lives in — leaving the editor open would keep suggesting the
      // sheet is theirs to keep changing.
      setEditing((prev) => ({ ...prev, [teamId]: false }));
      queryClient.invalidateQueries({ queryKey: ['reporter-match', fixtureId] });
      queryClient.invalidateQueries({ queryKey: ['reporter-assignments'] });
      pushToast('Team sheet saved.', 'success');
    },
    onError: (err: any, teamId) => {
      // Verbatim, because the server writes these to be read out: "Not in this
      // squad: …" and "Suspended, cannot be named: … (2 matches of a red card
      // ban left)". A ban that does not stop someone playing is not a ban, which
      // is why the server refuses the whole sheet instead of quietly dropping
      // the player — and why this must say who and why, not "please try again".
      const message =
        err?.response?.data?.message || 'Could not save this sheet. Check your connection and try again.';
      setErrors((prev) => ({ ...prev, [teamId]: message }));
      const ids = err?.response?.data?.suspended;
      setSuspended((prev) => ({ ...prev, [teamId]: Array.isArray(ids) ? ids : [] }));
    },
  });

  /* ── screen 1: pick a match ─────────────────────────────────────────────── */

  if (!fixtureId) {
    return (
      <>
        <PageHeader
          title="Team sheets"
          subtitle="Check that both coaches have filed a sheet. Where one has not, you can record it."
        />
        {assignments.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-card" />
            ))}
          </div>
        ) : assignments.isError ? (
          <ErrorState
            title="Could not load your matches"
            hint="Check your connection and try again."
            onRetry={() => assignments.refetch()}
          />
        ) : !assignments.active.length ? (
          <EmptyState
            icon={ClipboardList}
            title="No matches to prepare"
            hint="Scheduled and live matches assigned to you appear here, ready for their team sheets."
          />
        ) : (
          <div className="space-y-3">
            {assignments.active.map((fixture: any) => (
              <MatchRow
                key={fixture.id}
                fixture={fixture}
                // Same route, new query param: the choice survives a refresh and
                // the browser's back button returns to this list.
                to={`/reporter/lineups?fixture=${fixture.id}`}
                meta={<MatchStatusChip fixture={fixture} />}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  /* ── screen 2: the editor ───────────────────────────────────────────────── */

  const loading = matchQuery.isLoading || homeQuery.isLoading || awayQuery.isLoading;
  const failed = matchQuery.isError || homeQuery.isError || awayQuery.isError;

  const clearFixture = () => {
    setParams({}, { replace: false });
    setTab('home');
  };

  const teamError = activeTeamId != null ? errors[activeTeamId] : '';
  const teamSuspended = (activeTeamId != null && suspended[activeTeamId]) || [];

  return (
    <>
      <PageHeader
        title="Team sheets"
        subtitle="What each coach submitted. You record it — you do not pick it."
        actions={
          /* Full-size targets, not the admin-dense `sm`: this header is tapped
             with a thumb, so it stays on the 44px floor and wraps instead. */
          <>
            <Button variant="ghost" icon={ArrowLeft} onClick={clearFixture}>
              Change match
            </Button>
            <Button variant="secondary" to={`/reporter/match/${fixtureId}`}>
              Open the match
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-96 w-full rounded-card" />
        </div>
      ) : failed || !match ? (
        <ErrorState
          title="Could not load this match"
          hint="Check your connection and try again."
          onRetry={() => {
            matchQuery.refetch();
            homeQuery.refetch();
            awayQuery.refetch();
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Which match this is. Crest-first, because a reporter recognises a
              crest faster than a name they are reading upside down. */}
          <section className="rounded-card border border-hairline bg-surface p-4">
            <MatchIdentity fixture={match} size="lg" showScore={false} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-tertiary">
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock3 size={12} aria-hidden="true" />
                {match.matchDate
                  ? format(new Date(match.matchDate), 'EEE d MMM, HH:mm')
                  : 'Date to be confirmed'}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} aria-hidden="true" />
                {match.venue || 'Venue to be confirmed'}
              </span>
              <MatchStatusChip fixture={match} />
            </div>
            {/* Honest about the one rule that differs by role: the server locks a
                sheet after kick-off for a club manager, never for a reporter. */}
            {['LIVE', 'COMPLETED'].includes(match.status) && (
              <p className="mt-3 text-center text-xs text-secondary">
                The match is under way. You can still correct a sheet — the kick-off lock applies to club
                managers, not to reporters.
              </p>
            )}
          </section>

          {/* Two squads, one at a time. Both side by side is unreadable at 360px,
              and this is used standing up on a phone. */}
          <Tabs
            tabs={[
              { id: 'home', label: teamName(match.homeTeam), badge: tabCountFor(homeQuery.data) },
              { id: 'away', label: teamName(match.awayTeam), badge: tabCountFor(awayQuery.data) },
            ]}
            value={tab}
            onChange={(id) => setTab(id as 'home' | 'away')}
          />

          {/* READING IS THE DEFAULT, editing is the exception. A reporter opening
              this page should nearly always be checking that a sheet arrived, not
              composing one. */}
          {!showEditor && filedRows.length > 0 && (
            <SheetOnFile
              team={activeTeam}
              sheet={sheetMetaFor(activeTeamId)}
              rows={filedRows}
              onCorrect={openEditor}
            />
          )}

          {!showEditor && filedRows.length === 0 && (
            <NoSheetYet team={activeTeam} onRecord={openEditor} />
          )}

          {showEditor && (
          <>
          <div className="rounded-card border border-hairline bg-surface p-4">
            <p className="text-sm font-semibold text-primary">
              Recording {teamName(activeTeam)}&rsquo;s sheet
            </p>
            <p className="mt-1 text-sm text-secondary">
              Copy the coach&rsquo;s sheet exactly as it is written. If something is not on it —
              a formation, an armband — leave it blank rather than deciding it here.
            </p>
          </div>

          <div className={cn('grid gap-4', formations.length ? 'sm:grid-cols-2' : 'sm:grid-cols-1')}>
            {formations.length > 0 && (
              <Field label="Formation as written" hint="Leave blank if the coach did not give one.">
                {(p: any) => (
                  <Select
                    {...p}
                    size="md"
                    value={draft.formation}
                    onChange={(e: any) => activeTeamId != null && patchDraft(activeTeamId, { formation: e.target.value })}
                    placeholder="Not recorded"
                    options={formations.map((f) => ({ value: f, label: f }))}
                  />
                )}
              </Field>
            )}
            <Field label="Coach's name as written">
              {(p: any) => (
                <Input
                  {...p}
                  value={draft.coachName}
                  onChange={(e: any) => activeTeamId != null && patchDraft(activeTeamId, { coachName: e.target.value })}
                  placeholder="As signed on the sheet"
                />
              )}
            </Field>
          </div>

          <Panel
            title={`${teamName(activeTeam)} squad`}
            hint="Mark each player as the coach's sheet has them. Tap to move between out, starting and the bench; the star is the armband as marked."
            flush
          >
            {!squad.length ? (
              <EmptyState
                icon={Users}
                title="No players registered"
                hint="This club has not registered a squad yet, so there is nobody to name. Report it to the league admin."
              />
            ) : (
              <ul>
                {squad.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    role={draft.roles[player.id] || 'OUT'}
                    isCaptain={draft.captain === player.id}
                    isSuspended={teamSuspended.includes(player.id)}
                    onCycle={() => cycleRole(player.id)}
                    onCaptain={() => toggleCaptain(player.id)}
                  />
                ))}
              </ul>
            )}
          </Panel>

          {/* The count, and a warning that never blocks. The server enforces no
              squad size — a seven-a-side youth fixture and a fifteen-man rugby
              team are both valid — so hard-coding eleven would be wrong for most
              of the sports on this platform. The note says what is usual for THIS
              sport and lets the reporter overrule it. */}
          <div className="rounded-card border border-hairline bg-surface p-4">
            <p className="text-sm text-primary">
              <span className="font-semibold tabular-nums">{counts.starters}</span> starting ·{' '}
              <span className="font-semibold tabular-nums">{counts.bench}</span> on the bench
            </p>
            {counts.starters === 0 && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-secondary">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-live" aria-hidden="true" />
                Nobody is marked as starting. You can still save, but goals for this team will not be able to
                name a player.
              </p>
            )}
            {expectedStarters != null && counts.starters > 0 && counts.starters !== expectedStarters && (
              <p className="mt-1.5 text-xs text-secondary">
                {activeTeam?.sport?.name || 'This sport'} usually starts{' '}
                <span className="tabular-nums">{expectedStarters}</span>. Save it as it stands if that is what
                the referee's sheet says.
              </p>
            )}

            {teamError && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-card border border-danger/40 bg-danger/5 p-3"
              >
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-danger-text" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm text-danger-text">{teamError}</p>
                  {teamSuspended.length > 0 && (
                    <p className="mt-1 text-xs text-secondary">
                      They are marked in the squad above. Take them out of the sheet and save again.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <Button
                block
                /* Scoped to the team in flight, so saving the home sheet does not
                   spin the away button when the reporter switches tabs. */
                loading={save.isPending && save.variables === activeTeamId}
                disabled={activeTeamId == null}
                onClick={() => activeTeamId != null && save.mutate(activeTeamId)}
              >
                Save {teamName(activeTeam)}&rsquo;s sheet
              </Button>
              {/* A way back that does not save. Someone who opened the editor to
                  check a filed sheet against paper, and found it correct, should
                  be able to leave without writing anything. */}
              <Button
                variant="secondary"
                disabled={save.isPending}
                onClick={() => activeTeamId != null && setEditing((prev) => ({ ...prev, [activeTeamId]: false }))}
              >
                Cancel
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-tertiary">
              Saved as {teamName(activeTeam)}&rsquo;s sheet for this match. The coach can still replace it
              from the club portal. Each team is saved on its own.
            </p>
          </div>
          </>
          )}
        </div>
      )}
    </>
  );
};

export default ReporterLineupsPage;
