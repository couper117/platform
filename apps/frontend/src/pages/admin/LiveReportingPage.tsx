import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity, Play, ChevronRight, ArrowLeft, Circle,
  Send, Link2, Square, X, Clock, Undo2,
} from 'lucide-react';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import { PageHeader } from '../../components/admin/AdminUI';
import {
  Button, IconButton, Input, Select, EmptyState, Skeleton, ClubCrest, cn,
} from '../../components/ui';
import { tickClock, stampClock, PERIOD_LABEL } from '../../utils/matchClock';

/**
 * Pitch-side live reporting.
 *
 * Two screens: pick an assigned match, then report it. The reporting console is
 * built for one hand on a phone at the side of a pitch — large targets, and the
 * actions that happen most often reachable first. Speed matters more than
 * decoration here; a reporter is watching the game, not the UI. Every control on
 * this screen clears the 44px tap floor, which is why nothing here uses the
 * admin-dense `sm` button.
 *
 * Every action writes through the API immediately. The score is never set from
 * this screen: the server derives it from goal events, so a mistyped tap is
 * corrected by removing the event rather than by editing a number that has
 * already drifted from its own history.
 *
 * COLOUR. The console used to paint itself with hard-coded hexes on a near-black
 * slab of its own. It is on the design tokens now, so it follows the reporter's
 * theme, and the event palette matches shared/matchEventMeta: brand green scores,
 * --danger dismisses, --live cautions. `--live` orange is also the running clock —
 * this screen is the one place in the portal where it belongs.
 */

const EVENT_META = {
  GOAL: { label: 'Goal', tone: 'text-brand-text', ring: 'border-brand/30' },
  PENALTY: { label: 'Penalty', tone: 'text-brand-text', ring: 'border-brand/30' },
  OWN_GOAL: { label: 'Own goal', tone: 'text-danger-text', ring: 'border-danger/30' },
  YELLOW_CARD: { label: 'Yellow card', tone: 'text-live', ring: 'border-live/30' },
  RED_CARD: { label: 'Red card', tone: 'text-danger-text', ring: 'border-danger/30' },
  SUBSTITUTION: { label: 'Substitution', tone: 'text-secondary', ring: 'border-hairline' },
  COMMENTARY: { label: 'Update', tone: 'text-secondary', ring: 'border-hairline' },
  KICKOFF: { label: 'Kick-off', tone: 'text-secondary', ring: 'border-hairline' },
  HALFTIME: { label: 'Half time', tone: 'text-secondary', ring: 'border-hairline' },
  FULLTIME: { label: 'Full time', tone: 'text-secondary', ring: 'border-hairline' },
  INJURY: { label: 'Injury', tone: 'text-live', ring: 'border-live/30' },
  VAR: { label: 'VAR', tone: 'text-secondary', ring: 'border-hairline' },
  EXTRA_TIME: { label: 'Extra time', tone: 'text-secondary', ring: 'border-hairline' },
};

const CLOCK_LABEL = {
  start: 'Match is live',
  halftime: 'Half time',
  resume: 'Second half under way',
  fulltime: 'Full time',
};

const textareaCls =
  'w-full rounded-input border border-hairline bg-surface px-4 py-3 text-primary placeholder:text-tertiary transition-colors duration-150 ease-standard focus:border-brand focus:outline-none';

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-secondary">{label}</span>
    {children}
  </label>
);

/** The console's loading state, on both screens. */
const ConsoleSkeleton = () => (
  <div className="space-y-3 p-4 sm:p-6">
    {Array.from({ length: 3 }, (_, i) => (
      <Skeleton key={i} className="h-24 w-full rounded-card" />
    ))}
  </div>
);

// Mirrors CLOCK_EVENTS on the server: these come from the clock, not the reporter.
const CLOCK_EVENTS = ['KICKOFF', 'HALFTIME', 'FULLTIME', 'EXTRA_TIME'];

const ACTIVE_STATUSES = ['SCHEDULED', 'LIVE'];

const LiveReportingPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const [fixtureId, setFixtureId] = useState(null);
  const [now, setNow] = useState(() => Date.now());   // drives the ticking display
  const [addedInput, setAddedInput] = useState('');
  const [form, setForm] = useState(null);           // null | goal | card | sub | other
  const [side, setSide] = useState('home');
  const [playerId, setPlayerId] = useState('');
  const [player2Id, setPlayer2Id] = useState('');   // substitution: coming off
  const [cardType, setCardType] = useState('YELLOW_CARD');
  const [text, setText] = useState('');
  const [stream, setStream] = useState('');

  // Matches this reporter is assigned to, directly or through their league.
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['reporter-assignments', user?.id],
    queryFn: async () => (await apiClient.get('/fixtures', { params: { reporterId: user.id } })).data.data,
    enabled: !!user?.id,
  });

  const { data: fixture, isLoading: fixtureLoading } = useQuery({
    queryKey: ['match-details', fixtureId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/fixtures/${fixtureId}`);
      // Stamp the moment this arrived, so the browser extrapolates from a known
      // point rather than trusting its own wall clock to match the server's.
      return { ...data.data, clock: stampClock(data.data.clock) };
    },
    enabled: !!fixtureId,
    // The console is the source of truth while reporting, but a co-reporter or an
    // admin may also be writing; a slow poll keeps the feed honest without
    // fighting the reporter's own optimistic view.
    refetchInterval: fixtureId ? 15000 : false,
  });

  useEffect(() => { setStream(fixture?.streamUrl || ''); }, [fixture?.streamUrl]);
  useEffect(() => { setAddedInput(String(fixture?.liveState?.addedMinutes ?? '')); }, [fixture?.liveState?.addedMinutes]);

  // The server hands back the kick-off timestamp; the minute is recomputed here
  // every second from that, so the display ticks without a request per second and
  // still agrees with every other screen showing this match.
  useEffect(() => {
    if (!fixture?.clock?.running) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [fixture?.clock?.running]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['match-details', fixtureId] });
  const closeForm = () => { setForm(null); setPlayerId(''); setPlayer2Id(''); };

  const post = (path, body) => apiClient.post(`/fixtures/${fixtureId}${path}`, body);

  // Kick-off goes through the clock endpoint: it stamps the start time, writes the
  // KICKOFF event and flips the fixture to LIVE in one call, so the clock and the
  // feed can never disagree about when the match began.
  const startMatch = useMutation({
    mutationFn: () => post('/clock', { action: 'start' }),
    onSuccess: () => { refresh(); queryClient.invalidateQueries({ queryKey: ['reporter-assignments'] }); pushToast('Match is live', 'success'); },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not start the match'),
  });

  const addEvent = useMutation({
    mutationFn: (body: any) => post('/events', body),
    onSuccess: (_d, body: any) => {
      refresh();
      closeForm();
      pushToast(`${EVENT_META[body.eventType]?.label || 'Event'} published`, 'success');
    },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not publish that event'),
  });

  const saveStream = useMutation({
    mutationFn: () => apiClient.patch(`/fixtures/${fixtureId}`, { streamUrl: stream || null, streamActive: !!stream }),
    onSuccess: () => { refresh(); pushToast(stream ? 'Stream link saved' : 'Stream link removed', 'success'); },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not save the stream link'),
  });

  const clock = useMutation({
    mutationFn: (body: any) => post('/clock', body),
    onSuccess: (_d, body: any) => {
      refresh();
      pushToast(body.action ? CLOCK_LABEL[body.action] : `Added time set to ${body.addedMinutes}'`, 'success');
    },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not update the clock'),
  });

  // Undo. The server puts back the score, the scorer's tally and any suspension
  // the card caused, so this button is safe to reach for the moment a tap lands
  // on the wrong team — which is the whole reason it exists.
  const undoEvent = useMutation({
    mutationFn: (eventId: number) => apiClient.delete(`/fixtures/${fixtureId}/events/${eventId}`),
    onSuccess: () => { refresh(); pushToast('Event removed', 'success'); },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not remove that event'),
  });

  const endMatch = useMutation({
    mutationFn: () => post('/clock', { action: 'fulltime' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reporter-assignments'] }); pushToast('Live reporting ended', 'success'); setFixtureId(null); },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not finish the match'),
  });

  if (isLoading) return <ConsoleSkeleton />;

  // ── Screen 1: pick a match ──
  if (!fixtureId) {
    const upcoming = (assignments || [])
      .filter((f) => ACTIVE_STATUSES.includes(f.status))
      .sort((a, b) => +new Date(a.matchDate) - +new Date(b.matchDate));

    return (
      <div className="p-4 sm:p-6">
        <PageHeader
          title="Pitch-side reporting"
          subtitle="Select an assigned match to begin live updates"
        />

        {upcoming.length === 0 ? (
          <EmptyState icon={Activity} title="No assigned matches" hint="You'll see fixtures here once a league admin assigns you to report on them." />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {upcoming.map((f) => (
              <button
                key={f.id}
                onClick={() => setFixtureId(f.id)}
                className="group flex min-h-tap items-center justify-between gap-3 rounded-card border border-hairline bg-surface p-4 text-left transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ClubCrest team={f.homeTeam} size="lg" />
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold text-primary">
                      {f.homeTeam?.name} <span className="mx-1 text-sm font-normal text-tertiary">v</span> {f.awayTeam?.name}
                    </p>
                    <p className="text-xs text-tertiary">
                      {f.league?.name} · {new Date(f.matchDate).toLocaleString()}
                      {f.status === 'LIVE' && <span className="ml-1 font-semibold text-live">· live</span>}
                    </p>
                  </div>
                  <ClubCrest team={f.awayTeam} size="lg" />
                </div>
                <ChevronRight size={20} className="shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (fixtureLoading || !fixture) return <ConsoleSkeleton />;

  const home = fixture.homeTeam || {};
  const away = fixture.awayTeam || {};
  const teamIdFor = (s) => (s === 'home' ? fixture.homeTeamId : fixture.awayTeamId);
  const teamNameFor = (s) => (s === 'home' ? home.name : away.name);
  const squad = (fixture.lineups || []).filter((l) => l.teamId === teamIdFor(side));
  const events = [...(fixture.events || [])].sort((a, b) => (b.minute || 0) - (a.minute || 0));
  const isScheduled = fixture.status === 'SCHEDULED';
  const live = tickClock(fixture.clock, now);

  const publish = () => {
    // No minute sent — the server stamps it from the running clock.
    const base = { teamId: teamIdFor(side), playerId: playerId || undefined };
    if (form === 'goal') return addEvent.mutate({ ...base, eventType: 'GOAL' });
    if (form === 'card') return addEvent.mutate({ ...base, eventType: cardType });
    if (form === 'sub') return addEvent.mutate({ ...base, eventType: 'SUBSTITUTION', player2Id: player2Id || undefined });
    return addEvent.mutate({ ...base, eventType: 'COMMENTARY', description: text.trim() || undefined });
  };

  const playerOptions = squad.map((l) => ({
    value: l.playerId,
    label: `${l.jerseyNo ? `#${l.jerseyNo} ` : ''}${l.player?.fullName || ''}`,
  }));

  return (
    <div className="min-h-screen bg-page pb-28 text-primary">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-hairline bg-page/95 px-3 py-2 backdrop-blur">
        <IconButton icon={ArrowLeft} label="Back to matches" onClick={() => setFixtureId(null)} />
        <h1 className="font-display text-lg font-semibold text-primary">Live match</h1>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold',
            fixture.status === 'LIVE' ? 'bg-live/10 text-live' : 'bg-surface-2 text-secondary'
          )}
        >
          {fixture.status === 'LIVE' && <Circle size={7} className="animate-pulse fill-current" aria-hidden="true" />}
          {fixture.status === 'LIVE' ? 'Live' : fixture.status}
        </span>
      </header>

      <div className="mx-auto max-w-2xl space-y-3 p-4">
        {/* Scoreboard — read-only. The score follows the goal events. */}
        <div className="rounded-card border border-hairline bg-surface p-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 flex-col items-center gap-2">
              <ClubCrest team={home} size="lg" />
              <span className="max-w-[100px] truncate text-sm font-semibold text-primary">{home.shortName || home.name}</span>
            </div>
            <div className="text-center">
              <p className="font-display text-4xl font-bold tabular-nums text-primary">
                {fixture.homeScore ?? 0} <span className="text-tertiary">-</span> {fixture.awayScore ?? 0}
              </p>
              <p className="mt-1 text-xs text-tertiary">{fixture.venue || 'Venue TBD'}</p>
            </div>
            <div className="flex flex-1 flex-col items-center gap-2">
              <ClubCrest team={away} size="lg" />
              <span className="max-w-[100px] truncate text-sm font-semibold text-primary">{away.shortName || away.name}</span>
            </div>
          </div>
        </div>

        {isScheduled ? (
          <Button
            block
            size="lg"
            icon={Play}
            loading={startMatch.isPending}
            onClick={() => startMatch.mutate()}
            className="min-h-[64px] text-lg"
          >
            Start match
          </Button>
        ) : (
          <>
            {/* The clock runs itself from kick-off; every event below takes its
                minute from it, so there is nothing here to keep correcting. */}
            <div className="rounded-card border border-hairline bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold tabular-nums text-live">{live.display}</span>
                    <span className="text-sm tabular-nums text-tertiary">{live.mmss}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-secondary">
                    {PERIOD_LABEL[live.period] || live.period}
                    {live.addedMinutes > 0 && <span className="font-semibold text-live"> · +{live.addedMinutes} added</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  {live.period === 'FIRST_HALF' && (
                    <Button
                      variant="secondary"
                      disabled={clock.isPending}
                      onClick={() => clock.mutate({ action: 'halftime' })}
                    >
                      Half time
                    </Button>
                  )}
                  {live.period === 'HALF_TIME' && (
                    <Button
                      disabled={clock.isPending}
                      onClick={() => clock.mutate({ action: 'resume' })}
                    >
                      Start 2nd half
                    </Button>
                  )}
                </div>
              </div>

              {/* Stoppage the referee held up on the board. */}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
                <Clock size={15} className="shrink-0 text-tertiary" aria-hidden="true" />
                <span className="text-sm text-secondary">Added time</span>
                <Input
                  type="number" min={0} max={30} value={addedInput}
                  onChange={(e) => setAddedInput(e.target.value)}
                  placeholder="0"
                  aria-label="Added minutes"
                  className="w-16 px-2 text-center tabular-nums"
                />
                <div className="flex gap-1">
                  {[1, 2, 3, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => { setAddedInput(String(n)); clock.mutate({ addedMinutes: n }); }}
                      className="min-h-tap min-w-[44px] rounded-control border border-hairline px-3 text-sm font-semibold text-secondary transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-primary"
                    >
                      +{n}
                    </button>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  className="ml-auto px-5"
                  disabled={clock.isPending}
                  onClick={() => clock.mutate({ addedMinutes: Math.max(0, parseInt(addedInput, 10) || 0) })}
                >
                  Set
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                ['goal', 'Goal', 'border-brand/40 text-brand-text'],
                ['card', 'Card', 'border-live/40 text-live'],
                ['sub', 'Sub', 'border-hairline text-secondary'],
                ['other', 'Update', 'border-hairline text-secondary'],
              ].map(([k, label, tone]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => { setForm(k); setSide('home'); setPlayerId(''); setPlayer2Id(''); }}
                  aria-pressed={form === k}
                  className={cn(
                    'min-h-tap rounded-card border bg-surface py-4 text-sm font-semibold',
                    'transition-colors duration-150 ease-standard hover:bg-surface-2',
                    tone
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {form && (
              <div className="rounded-card border border-hairline bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-primary">
                    {form === 'goal' ? 'Goal' : form === 'card' ? 'Card' : form === 'sub' ? 'Substitution' : 'Live update'}
                  </h2>
                  <IconButton icon={X} label="Close" onClick={closeForm} />
                </div>

                <div className="space-y-3">
                  <Field label="Team">
                    <div className="grid grid-cols-2 gap-2">
                      {['home', 'away'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { setSide(s); setPlayerId(''); setPlayer2Id(''); }}
                          aria-pressed={side === s}
                          className={cn(
                            'min-h-tap truncate rounded-control border px-3 text-sm font-semibold',
                            'transition-colors duration-150 ease-standard',
                            side === s ? 'border-brand bg-brand-tint text-brand-text' : 'border-hairline text-secondary hover:bg-surface-2'
                          )}
                        >
                          {teamNameFor(s)}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {form === 'card' && (
                    <Field label="Card">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ['YELLOW_CARD', 'Yellow', 'border-live bg-live/10 text-live'],
                          ['RED_CARD', 'Red', 'border-danger bg-danger/10 text-danger-text'],
                        ].map(([v, label, on]) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setCardType(v)}
                            aria-pressed={cardType === v}
                            className={cn(
                              'min-h-tap rounded-control border px-3 text-sm font-semibold',
                              'transition-colors duration-150 ease-standard',
                              cardType === v ? on : 'border-hairline text-secondary hover:bg-surface-2'
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </Field>
                  )}

                  {form === 'other' ? (
                    <Field label="What is happening">
                      <div className="relative">
                        <textarea
                          value={text} onChange={(e) => setText(e.target.value.slice(0, 200))} rows={3}
                          placeholder="Describe the passage of play…"
                          className={cn(textareaCls, 'resize-none pb-7')}
                        />
                        <span className="absolute bottom-3 right-3 text-xs tabular-nums text-tertiary">{text.length}/200</span>
                      </div>
                    </Field>
                  ) : (
                    <>
                      <Field label={form === 'sub' ? 'Coming on' : 'Player'}>
                        <Select
                          size="md"
                          value={playerId}
                          onChange={(e) => setPlayerId(e.target.value)}
                          placeholder={squad.length ? 'Select player (optional)' : 'No line-up published for this team'}
                          options={playerOptions}
                        />
                      </Field>

                      {form === 'sub' && (
                        <Field label="Coming off">
                          <Select
                            size="md"
                            value={player2Id}
                            onChange={(e) => setPlayer2Id(e.target.value)}
                            placeholder="Select player"
                            options={playerOptions.filter((o) => String(o.value) !== String(playerId))}
                          />
                        </Field>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={closeForm}>Cancel</Button>
                  <Button
                    icon={Send}
                    loading={addEvent.isPending}
                    disabled={addEvent.isPending || (form === 'other' && !text.trim())}
                    onClick={publish}
                  >
                    Publish
                  </Button>
                </div>
              </div>
            )}

            {/* Stream link */}
            <div className="rounded-card border border-hairline bg-surface p-4">
              <h2 className="font-display text-base font-semibold text-primary">Stream link</h2>
              <p className="mb-2 text-xs text-tertiary">Shown on the public match page while the match is live</p>
              <div className="relative">
                <Input
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  placeholder="https://example.com/live"
                  aria-label="Stream link"
                  className="pr-10"
                />
                <Link2 size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-tertiary" aria-hidden="true" />
              </div>
              <Button block className="mt-3" loading={saveStream.isPending} onClick={() => saveStream.mutate()}>
                Save stream link
              </Button>
            </div>

            {/* Everything published so far, newest first. */}
            <div className="rounded-card border border-hairline bg-surface p-4">
              <h2 className="mb-3 font-display text-base font-semibold text-primary">Match feed</h2>
              {events.length === 0 ? (
                <p className="py-6 text-center text-sm text-tertiary">Nothing published yet.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((e) => {
                    const meta = EVENT_META[e.eventType] || EVENT_META.COMMENTARY;
                    const team = e.teamId === fixture.homeTeamId ? home.name : e.teamId === fixture.awayTeamId ? away.name : null;
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
                        {/* Clock markers are owned by the clock controls, so they
                            offer no undo here — removing one would leave the period
                            and the feed telling different stories. */}
                        {!CLOCK_EVENTS.includes(e.eventType) && (
                          <IconButton
                            icon={Undo2}
                            label={`Undo ${meta.label}`}
                            disabled={undoEvent.isPending}
                            onClick={() => { if (window.confirm(`Remove this ${meta.label.toLowerCase()}?`)) undoEvent.mutate(e.id); }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!isScheduled && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-page/95 p-3 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            <Button
              variant="secondary"
              block
              icon={Square}
              loading={endMatch.isPending}
              onClick={() => { if (window.confirm('Finish this match? It will be marked completed and live reporting stops.')) endMatch.mutate(); }}
              className="border-danger/40 text-danger-text hover:border-danger/60 hover:bg-danger/10 hover:text-danger-text"
            >
              End live reporting
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveReportingPage;
