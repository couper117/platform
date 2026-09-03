import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertTriangle, Check, ChevronLeft, Lock, Send, Sparkles, Star, Trash2, Users,
} from 'lucide-react';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { FixtureRow, OpponentLine } from '../../components/team/TeamUI';
import FormationBoard, { buildBoard } from '../../components/team/FormationBoard';
import {
  Avatar, Button, EmptyState, ErrorState, Modal, Skeleton, StatusPill, cn,
} from '../../components/ui';
import useMyTeam, { useTeamFixtures } from '../../hooks/useMyTeam';
import { getMatch, saveLineup } from '../../api/endpoints/team';
import { surfaceFor } from '../../config/playingSurfaces';
import { roleAffinity, roleName } from '../../lib/formation';
import { isSheetLocked, sheetFor, timeUntil } from '../../lib/coachMatch';
import { sheetAuthor } from '../../lib/teamSheet';
import useUiStore from '../../store/uiStore';

/**
 * The formation board — where a coach picks a side, on the surface it is played
 * on, and sends it to the match.
 *
 * IT IS THE CLUB'S ONLY TEAM-SHEET SCREEN. There used to be a second, a
 * list-based editor at /team/lineups, and the two wrote the same sheet through
 * the same endpoint — a coach had to learn which of two pages to open for one
 * job. That page is gone and this one carries what was only there: the suspended
 * players the server names in its 409 are marked in the picker, not just recited
 * in a sentence a coach then has to match against a squad of twenty-five.
 *
 * The REPORTER keeps a list-shaped editor of their own at /reporter/lineups, and
 * should: it is used from a touchline in the rain to transcribe paper, which is
 * the one place a tactics board would be the wrong tool.
 *
 * IT SAVES THROUGH `PUT /fixtures/:id/lineup`, so "send to the match" is not a
 * separate concept a coach has to learn: filing a side here IS filing the team
 * sheet, and the reporter sees it the moment it lands, credited to the club.
 *
 * TAPPING A SLOT SHOWS THE PLAYERS WHO PLAY THERE. `roleAffinity` scores every
 * squad member against the slot's role — exact for a listed position, then the
 * same area of the surface, then everyone else — so tapping the point guard spot
 * puts the point guards at the top. It ORDERS, it never restricts: coaches play
 * people out of position constantly and a tool that argued would be wrong.
 *
 * IT WORKS FOR SPORTS THAT ARE NOT FOOTBALL, because the surface, the shape and
 * the roles all come from config/playingSurfaces and lib/formation. Basketball
 * gets five slots on a court labelled PG/SG/SF/PF/C and no formation picker,
 * because five on court is five on court. A sport with no surface at all gets
 * told so rather than shown a pitch it does not play on.
 */

/* ── the player picker ───────────────────────────────────────────────────── */

const PlayerRow = ({
  player,
  placedAt,
  isSuspended,
  onPick,
}: {
  player: any;
  /** The role this player already occupies, if any — placing them moves them. */
  placedAt: string | null;
  /** The server named them in its last refusal; they cannot be on this sheet. */
  isSuspended: boolean;
  onPick: () => void;
}) => (
  <button
    type="button"
    onClick={onPick}
    className={cn(
      'flex min-h-tap w-full items-center gap-3 rounded-control border bg-surface px-3 py-2 text-left',
      'transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2',
      isSuspended ? 'border-l-2 border-l-danger bg-danger/5' : 'border-hairline'
    )}
  >
    <span className="w-7 shrink-0 text-center font-display text-sm font-bold tabular-nums text-tertiary">
      {player.jerseyNumber ?? '—'}
    </span>
    <Avatar src={player.photo} name={player.fullName} size="md" />
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium text-primary">{player.fullName}</span>
      <span className="block truncate text-xs text-tertiary">
        {player.position || 'Position not set'}
        {placedAt && <span className="text-live"> · already at {placedAt}</span>}
      </span>
    </span>
    {isSuspended && <StatusPill status="SUSPENDED" className="shrink-0" />}
  </button>
);

/* ── the page ────────────────────────────────────────────────────────────── */

const TeamFormationPage = () => {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const rawFixture = params.get('fixture');
  const fixtureId = rawFixture && /^\d+$/.test(rawFixture) ? Number(rawFixture) : null;

  const { data: team, isLoading: teamLoading, isError: teamError, refetch } = useMyTeam();
  const teamId = team?.id ?? null;
  const fixtures = useTeamFixtures(teamId);

  const match = useQuery({
    queryKey: ['match-details', fixtureId],
    queryFn: () => getMatch(fixtureId!),
    enabled: !!fixtureId,
    retry: false,
  });

  const surface = surfaceFor(team?.sport);
  const formations = surface?.formations ?? [];

  const [formation, setFormation] = useState<string>('');
  /** slot index → player. The board's whole state, plus the bench and captain. */
  const [placed, setPlaced] = useState<Record<number, any>>({});
  const [bench, setBench] = useState<any[]>([]);
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  /**
   * Player ids the server named as suspended, from the 409 on the last save.
   *
   * Carried over from the sheet editor this page replaced. The refusal message
   * names them in a sentence, but a coach then has to find those names again in
   * a squad of twenty-five — so the picker marks them too.
   */
  const [suspended, setSuspended] = useState<number[]>([]);

  const squad: any[] = team?.players || [];
  const locked = match.data ? isSheetLocked(match.data) : false;

  /**
   * Seed from whatever is already filed, once per fixture.
   *
   * Guarded by a ref rather than a dependency list: the match query refetches,
   * and re-seeding on every refetch would throw away a side a coach is halfway
   * through picking.
   */
  const seeded = useRef<string | null>(null);
  useEffect(() => {
    if (!match.data || !teamId || !surface) return;
    const key = `${match.data.id}:${teamId}`;
    if (seeded.current === key) return;
    seeded.current = key;

    const sheet = sheetFor(match.data, teamId);
    const shape = sheet.meta?.formation || '';
    setFormation(shape);

    const byId = new Map(squad.map((p: any) => [p.id, p]));
    const starters = sheet.starters
      .map((row: any) => byId.get(row.playerId))
      .filter(Boolean);
    const next: Record<number, any> = {};
    starters.slice(0, surface.starters).forEach((p: any, i: number) => { next[i] = p; });
    setPlaced(next);
    setBench(sheet.bench.map((row: any) => byId.get(row.playerId)).filter(Boolean));
    setCaptainId(sheet.rows.find((r: any) => r.isCaptain)?.playerId ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.data, teamId, surface, squad.length]);

  const slots = useMemo(
    () => (surface ? buildBoard(surface, formation, placed) : []),
    [surface, formation, placed]
  );

  const onBoard = useMemo(() => new Set(Object.values(placed).map((p: any) => p.id)), [placed]);
  const onBench = useMemo(() => new Set(bench.map((p: any) => p.id)), [bench]);
  const placedCount = Object.keys(placed).length;

  /** Where a player already is, so the picker can say "already at Midfielder". */
  const whereIs = (playerId: number) => {
    const entry = slots.find((s) => s.player?.id === playerId);
    return entry ? roleName(entry.role) : null;
  };

  const assign = (index: number, player: any) => {
    setPlaced((prev) => {
      const next = { ...prev };
      // Moving somebody already on the board vacates the spot they left, rather
      // than cloning them into two places.
      Object.keys(next).forEach((k) => {
        if (next[Number(k)]?.id === player.id) delete next[Number(k)];
      });
      next[index] = player;
      return next;
    });
    setBench((prev) => prev.filter((p) => p.id !== player.id));
    setActiveIndex(null);
  };

  const clearSlot = (index: number) => {
    setPlaced((prev) => {
      const next = { ...prev };
      const gone = next[index];
      delete next[index];
      if (gone && gone.id === captainId) setCaptainId(null);
      return next;
    });
    setActiveIndex(null);
  };

  const toggleBench = (player: any) => {
    setBench((prev) =>
      prev.some((p) => p.id === player.id) ? prev.filter((p) => p.id !== player.id) : [...prev, player]);
    setPlaced((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[Number(k)]?.id === player.id) delete next[Number(k)];
      });
      return next;
    });
  };

  /**
   * Fill the empty spots with the best available fit.
   *
   * Greedy, and deliberately so: it walks the slots in order and takes the
   * highest-scoring unplaced player for each. A coach checks and changes it —
   * this saves the twenty taps that get a sheet to something worth editing, it
   * does not claim to pick a team.
   */
  const autoFill = () => {
    if (!surface) return;
    setPlaced((prev) => {
      const next = { ...prev };
      const taken = new Set(Object.values(next).map((p: any) => p.id));
      slots.forEach((slot) => {
        if (next[slot.index]) return;
        const candidate = squad
          .filter((p) => !taken.has(p.id) && !onBench.has(p.id))
          .sort((a, b) =>
            roleAffinity(b.position, slot.role) - roleAffinity(a.position, slot.role) ||
            (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99))[0];
        if (candidate) {
          next[slot.index] = candidate;
          taken.add(candidate.id);
        }
      });
      return next;
    });
  };

  const clearAll = () => {
    setPlaced({});
    setBench([]);
    setCaptainId(null);
    setActiveIndex(null);
  };

  const save = useMutation({
    mutationFn: () => {
      const players = [
        ...Object.entries(placed).map(([index, p]: any) => ({
          playerId: p.id,
          position: slots.find((s) => s.index === Number(index))?.role || p.position || null,
          jerseyNo: p.jerseyNumber ?? null,
          isStarter: true,
          isCaptain: p.id === captainId,
        })),
        ...bench.map((p: any) => ({
          playerId: p.id,
          position: p.position ?? null,
          jerseyNo: p.jerseyNumber ?? null,
          isStarter: false,
          isCaptain: p.id === captainId,
        })),
      ];
      return saveLineup(fixtureId!, {
        teamId: teamId!,
        formation: formation || null,
        coachName: team?.officials?.find((o: any) => o.role === 'HEAD_COACH')?.fullName || null,
        published: true,
        players,
      });
    },
    onSuccess: () => {
      setError('');
      setSuspended([]);
      queryClient.invalidateQueries({ queryKey: ['match-details', fixtureId] });
      queryClient.invalidateQueries({ queryKey: ['team-fixtures'] });
      pushToast('Team sheet sent — the reporter can see it now.', 'success');
    },
    /**
     * Verbatim. The server refuses a whole sheet BY NAME — a player from another
     * squad, one serving a ban, or a sheet locked at kick-off — and each of those
     * has a different fix. A generic failure has none.
     */
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Could not send this team sheet. Check your connection and try again.');
      // A ban that does not stop somebody playing is not a ban, which is why the
      // server refuses the WHOLE sheet rather than quietly dropping the player —
      // and why the names have to reach the coach, not just a status code.
      const ids = err?.response?.data?.suspended;
      setSuspended(Array.isArray(ids) ? ids : []);
    },
  });

  /* ── states before the board ─────────────────────────────────────────── */

  const header = (
    <PageHeader
      title="Formation"
      subtitle="Pick your shape, place your side, and send it to the match."
    />
  );

  if (teamLoading) {
    return (
      <div>
        {header}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="aspect-[2/3] w-full rounded-card" />
          <Skeleton className="h-96 w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (teamError) {
    return <div>{header}<ErrorState title="Could not load your club" onRetry={() => refetch()} /></div>;
  }

  if (!team) {
    return (
      <div>
        {header}
        <EmptyState
          icon={Users}
          title="No club on this account"
          hint="A league admin attaches a manager to a club."
        />
      </div>
    );
  }

  // A sport with nothing to lay players out on. Judo, cycling, chess — drawing
  // them a pitch would be the exact mistake config/playingSurfaces exists to stop.
  if (!surface) {
    return (
      <div>
        {header}
        <Panel>
          <EmptyState
            icon={Users}
            title={`${team.sport?.name || 'This sport'} has no playing surface`}
            hint="A formation board only means something where players line up on a field or a court. Name your side on the team sheet instead."
            action={<Button to="/team/players">Go to your squad</Button>}
          />
        </Panel>
      </div>
    );
  }

  /* ── screen 1: pick a match ──────────────────────────────────────────── */

  if (!fixtureId) {
    const upcoming = fixtures.active;
    return (
      <div>
        {header}
        <Panel title="Which match?" hint="A shape belongs to a fixture, and sending it files that match's team sheet.">
          {fixtures.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-card" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No matches to prepare"
              hint="Fixtures appear here as soon as the league publishes them."
            />
          ) : (
            <div className="space-y-2">
              {upcoming.map((f: any) => (
                <FixtureRow
                  key={f.id}
                  fixture={f}
                  teamId={teamId}
                  to={`/team/formation?fixture=${f.id}`}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>
    );
  }

  if (match.isLoading) {
    return (
      <div>
        {header}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="aspect-[2/3] w-full rounded-card" />
          <Skeleton className="h-96 w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (match.isError || !match.data) {
    return (
      <div>
        {header}
        <ErrorState
          title="Could not load that match"
          onRetry={() => match.refetch()}
        />
      </div>
    );
  }

  const fixture = match.data;
  const ours = fixture.homeTeamId === teamId || fixture.awayTeamId === teamId;
  if (!ours) {
    return (
      <div>
        {header}
        <ErrorState
          title="That match is not yours"
          hint="Your club is not playing in it, so there is no side of it for you to name."
        />
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setParams({})}>Pick another match</Button>
        </div>
      </div>
    );
  }

  const filed = sheetFor(fixture, teamId);
  const active = activeIndex != null ? slots.find((s) => s.index === activeIndex) : null;

  /** The picker's list: who plays here first, then the rest of the squad. */
  const candidates = active
    ? [...squad]
      .filter((p) => !onBench.has(p.id))
      .map((p) => ({ p, score: roleAffinity(p.position, active.role) }))
      .sort((a, b) => b.score - a.score || (a.p.jerseyNumber ?? 99) - (b.p.jerseyNumber ?? 99))
    : [];
  const suited = candidates.filter((c) => c.score > 0);
  const others = candidates.filter((c) => c.score === 0);

  return (
    <div>
      <PageHeader
        title="Formation"
        subtitle="Pick your shape, place your side, and send it to the match."
        actions={
          <Button variant="secondary" icon={ChevronLeft} onClick={() => setParams({})}>
            Change match
          </Button>
        }
      />

      {/* The fixture this shape belongs to. */}
      <section className="rounded-card border border-hairline bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <OpponentLine fixture={fixture} teamId={teamId} size="lg" />
          <div className="text-right">
            <StatusPill status={fixture.status} />
            {fixture.matchDate && (
              <p className="mt-1 text-xs tabular-nums text-tertiary">
                {format(new Date(fixture.matchDate), 'EEE d MMM, HH:mm')}
                {fixture.status === 'SCHEDULED' && ` · ${timeUntil(fixture.matchDate)}`}
              </p>
            )}
          </div>
        </div>

        {filed.filed && (
          <p className="mt-3 flex items-center gap-2 border-t border-hairline pt-3 text-sm text-secondary">
            <Check size={14} className="shrink-0 text-brand-text" aria-hidden="true" />
            {sheetAuthor(filed.meta) === 'reporter'
              ? 'A reporter recorded a sheet for this match from paper. Sending a new one replaces it.'
              : 'A sheet is already filed for this match. Sending a new one replaces it.'}
          </p>
        )}
      </section>

      {/* The one rule that is the server's, not this screen's. */}
      {locked && (
        <p className="mt-3 flex items-start gap-2 rounded-card border border-hairline bg-surface-2 p-3 text-sm text-secondary">
          <Lock size={15} className="mt-0.5 shrink-0 text-tertiary" aria-hidden="true" />
          <span>
            The match has started, so your team sheet is locked. You can still move players around here to
            plan, but a late change on the day is recorded by the reporter at the ground.
          </span>
        </p>
      )}

      {/* THE TOOLBAR. Shape on the left, the two actions that touch the whole
          board on the right. Both used to live inside a side panel that also
          doubled as the player picker, which cost the board a third of the screen
          for a list nobody was reading, and put the picker nowhere near the spot
          it was filling. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {formations.length > 0 && (
          <>
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-tertiary">Shape</span>
            {formations.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormation(f)}
                aria-pressed={formation === f}
                className={cn(
                  'min-h-9 rounded-pill border px-3 text-sm font-semibold tabular-nums transition-colors duration-150 ease-standard',
                  formation === f
                    ? 'border-brand bg-brand-tint text-brand-text'
                    : 'border-hairline text-secondary hover:bg-surface-2 hover:text-primary'
                )}
              >
                {f}
              </button>
            ))}
          </>
        )}

        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="secondary" icon={Sparkles} onClick={autoFill}>Fill by position</Button>
          {(placedCount > 0 || bench.length > 0) && (
            <Button variant="ghost" onClick={clearAll}>Clear</Button>
          )}
        </div>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <FormationBoard
          surface={surface}
          slots={slots}
          captainId={captainId}
          activeIndex={activeIndex}
          onPick={setActiveIndex}
        />

        <div className="space-y-4">
          <Panel
            title="Bench"
            hint={`${placedCount} of ${surface.starters} placed`}
          >
            <div className="flex flex-wrap gap-1.5">
              {squad
                .filter((p: any) => !onBoard.has(p.id))
                .map((p: any) => {
                  const on = onBench.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleBench(p)}
                      aria-pressed={on}
                      className={cn(
                        'inline-flex min-h-9 items-center gap-1.5 rounded-pill border px-2.5 text-xs font-medium',
                        'transition-colors duration-150 ease-standard',
                        on
                          ? 'border-brand bg-brand-tint text-brand-text'
                          : 'border-hairline text-secondary hover:bg-surface-2 hover:text-primary'
                      )}
                    >
                      <span className="tabular-nums">{p.jerseyNumber ?? '—'}</span>
                      <span className="max-w-[12ch] truncate">{p.fullName}</span>
                      {on && <Check size={11} aria-hidden="true" />}
                    </button>
                  );
                })}
              {squad.filter((p: any) => !onBoard.has(p.id)).length === 0 && (
                <p className="text-sm text-tertiary">Everyone is on the board.</p>
              )}
            </div>
          </Panel>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-card border border-danger/40 bg-danger/5 p-3"
            >
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-danger-text" aria-hidden="true" />
              <p className="min-w-0 text-sm text-danger-text">{error}</p>
            </div>
          )}

          <div className="rounded-card border border-hairline bg-surface p-4">
            <p className="text-sm text-secondary">
              <span className="font-semibold tabular-nums text-primary">{placedCount}</span> of{' '}
              <span className="tabular-nums">{surface.starters}</span> placed
              {bench.length > 0 && <> · <span className="tabular-nums">{bench.length}</span> on the bench</>}
            </p>
            {placedCount === 0 && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-secondary">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-live" aria-hidden="true" />
                Nobody is on the board. You can still send it, but a goal for your club will not be able to
                name the player who scored it.
              </p>
            )}
            <Button
              block
              icon={Send}
              className="mt-3"
              loading={save.isPending}
              disabled={save.isPending || locked}
              onClick={() => save.mutate()}
            >
              Send to the match
            </Button>
            <p className="mt-2 text-center text-xs text-tertiary">
              {locked
                ? 'Locked at kick-off. The reporter records changes from here.'
                : 'Files this as your team sheet. The reporter sees it immediately.'}
            </p>
          </div>
        </div>
      </div>

      {/* THE PICKER, over the board rather than beside it.
          `Modal` already owns the scrim, the scroll lock, Escape, the focus trap
          and returning focus to the slot that opened it — all of which a bespoke
          side panel would have had to reimplement, and did not. */}
      <Modal
        open={!!active}
        onClose={() => setActiveIndex(null)}
        title={active ? `Who plays ${roleName(active.role)}?` : ''}
        description={
          active?.player
            ? `Currently ${active.player.fullName}`
            : 'Tap a player to put them in this position.'
        }
      >
        {active && (
          <>
            {/* What can be done to whoever is already standing here. */}
            {active.player && (
              <div className="mb-3 flex flex-wrap gap-2 border-b border-hairline pb-3">
                <Button
                  variant={active.player.id === captainId ? 'primary' : 'secondary'}
                  icon={Star}
                  onClick={() => setCaptainId(active.player.id === captainId ? null : active.player.id)}
                >
                  {active.player.id === captainId ? 'Captain' : 'Make captain'}
                </Button>
                <Button
                  variant="ghost"
                  icon={Trash2}
                  className="text-danger-text hover:bg-danger/10 hover:text-danger-text"
                  onClick={() => clearSlot(active.index)}
                >
                  Take off
                </Button>
              </div>
            )}

            {suited.length > 0 && (
              <>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-tertiary">
                  Plays here
                </p>
                <div className="space-y-1.5">
                  {suited.map(({ p }) => (
                    <PlayerRow
                      key={p.id}
                      player={p}
                      placedAt={whereIs(p.id)}
                      isSuspended={suspended.includes(p.id)}
                      onPick={() => assign(active.index, p)}
                    />
                  ))}
                </div>
              </>
            )}

            {others.length > 0 && (
              <>
                <p className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-tertiary">
                  {suited.length ? 'Rest of the squad' : 'Squad'}
                </p>
                <div className="space-y-1.5">
                  {others.map(({ p }) => (
                    <PlayerRow
                      key={p.id}
                      player={p}
                      placedAt={whereIs(p.id)}
                      isSuspended={suspended.includes(p.id)}
                      onPick={() => assign(active.index, p)}
                    />
                  ))}
                </div>
              </>
            )}

            {candidates.length === 0 && (
              <EmptyState
                icon={Users}
                title="Nobody left to place"
                hint="Everyone in the squad is already on the board or named on the bench."
              />
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default TeamFormationPage;
