import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity, Play, Loader2, ChevronRight, ChevronDown, ArrowLeft, Circle,
  Send, Link2, Square, X, Clock, Undo2,
} from 'lucide-react';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import Skeleton from '../../components/shared/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ClubCrest from '../../components/ui/ClubCrest';
import { tickClock, stampClock, PERIOD_LABEL } from '../../utils/matchClock';

/**
 * Pitch-side live reporting.
 *
 * Two screens: pick an assigned match, then report it. The reporting console is
 * built for one hand on a phone at the side of a pitch in daylight — dark,
 * large targets, and the actions that happen most often reachable first. Speed
 * matters more than decoration here; a reporter is watching the game, not the UI.
 *
 * Every action writes through the API immediately. The score is never set from
 * this screen: the server derives it from goal events, so a mistyped tap is
 * corrected by removing the event rather than by editing a number that has
 * already drifted from its own history.
 */

const EVENT_META = {
  GOAL: { label: 'Goal', tone: 'text-[#2fd778]', ring: 'border-[#2fd778]/30' },
  PENALTY: { label: 'Penalty', tone: 'text-[#2fd778]', ring: 'border-[#2fd778]/30' },
  OWN_GOAL: { label: 'Own goal', tone: 'text-[#2fd778]', ring: 'border-[#2fd778]/30' },
  YELLOW_CARD: { label: 'Yellow card', tone: 'text-[#eab308]', ring: 'border-[#eab308]/30' },
  RED_CARD: { label: 'Red card', tone: 'text-red-400', ring: 'border-red-500/30' },
  SUBSTITUTION: { label: 'Substitution', tone: 'text-blue-400', ring: 'border-blue-400/30' },
  COMMENTARY: { label: 'Update', tone: 'text-white/70', ring: 'border-white/15' },
  KICKOFF: { label: 'Kick-off', tone: 'text-white/70', ring: 'border-white/15' },
  HALFTIME: { label: 'Half time', tone: 'text-white/70', ring: 'border-white/15' },
  FULLTIME: { label: 'Full time', tone: 'text-white/70', ring: 'border-white/15' },
  INJURY: { label: 'Injury', tone: 'text-orange-400', ring: 'border-orange-400/30' },
  VAR: { label: 'VAR', tone: 'text-white/70', ring: 'border-white/15' },
  EXTRA_TIME: { label: 'Extra time', tone: 'text-white/70', ring: 'border-white/15' },
};

const CLOCK_LABEL = {
  start: 'Match is live',
  halftime: 'Half time',
  resume: 'Second half under way',
  fulltime: 'Full time',
};

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#2fd778]';

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/40">{label}</span>
    {children}
  </label>
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

  if (isLoading) return <div className="p-8"><Skeleton type="card" count={3} /></div>;

  // ── Screen 1: pick a match ──
  if (!fixtureId) {
    const upcoming = (assignments || [])
      .filter((f) => ACTIVE_STATUSES.includes(f.status))
      .sort((a, b) => +new Date(a.matchDate) - +new Date(b.matchDate));

    return (
      <div className="p-6 sm:p-10 space-y-10 animate-in fade-in duration-500">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Pitch-Side <span className="text-red">Reporting</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Select an assigned match to begin live updates</p>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState icon={Activity} title="No assigned matches" hint="You'll see fixtures here once a league admin assigns you to report on them." />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {upcoming.map((f) => (
              <button
                key={f.id}
                onClick={() => setFixtureId(f.id)}
                className="group flex items-center justify-between rounded-3xl border border-surface-3 bg-white p-6 transition-all hover:border-red/20 dark:border-white/5 dark:bg-surface-dark2"
              >
                <div className="flex items-center gap-5">
                  <ClubCrest team={f.homeTeam} size="lg" />
                  <div className="text-left">
                    <p className="font-display text-xl uppercase tracking-tight">
                      {f.homeTeam?.name} <span className="mx-2 text-sm opacity-20">vs</span> {f.awayTeam?.name}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                      {f.league?.name} · {new Date(f.matchDate).toLocaleString()}
                      {f.status === 'LIVE' && <span className="ml-2 text-red">· live</span>}
                    </p>
                  </div>
                  <ClubCrest team={f.awayTeam} size="lg" />
                </div>
                <ChevronRight size={20} className="opacity-20 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (fixtureLoading || !fixture) return <div className="p-8"><Skeleton type="card" count={3} /></div>;

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

  return (
    <div className="-m-4 min-h-screen bg-[#080b09] pb-28 text-white sm:-m-6 md:-m-8">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-white/10 bg-[#080b09]/95 px-4 py-3 backdrop-blur">
        <button onClick={() => setFixtureId(null)} aria-label="Back to matches" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/5">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display text-lg uppercase tracking-tight">Live Match</h1>
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${fixture.status === 'LIVE' ? 'bg-[#2fd778]/15 text-[#2fd778]' : 'bg-white/10 text-white/60'}`}>
          {fixture.status === 'LIVE' && <Circle size={7} className="animate-pulse fill-[#2fd778]" />}
          {fixture.status === 'LIVE' ? 'Live' : fixture.status}
        </span>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4">
        {/* Scoreboard — read-only. The score follows the goal events. */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 flex-col items-center gap-2">
              <ClubCrest team={home} size="lg" />
              <span className="max-w-[100px] truncate text-sm font-bold">{home.shortName || home.name}</span>
            </div>
            <div className="text-center">
              <p className="font-display text-4xl font-bold tabular-nums">
                {fixture.homeScore ?? 0} <span className="text-white/40">-</span> {fixture.awayScore ?? 0}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-widest text-white/40">{fixture.venue || 'Venue TBD'}</p>
            </div>
            <div className="flex flex-1 flex-col items-center gap-2">
              <ClubCrest team={away} size="lg" />
              <span className="max-w-[100px] truncate text-sm font-bold">{away.shortName || away.name}</span>
            </div>
          </div>
        </div>

        {isScheduled ? (
          <button
            onClick={() => startMatch.mutate()}
            disabled={startMatch.isPending}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#12b76a] py-6 font-display text-2xl uppercase tracking-widest text-white disabled:opacity-50"
          >
            {startMatch.isPending ? <Loader2 className="animate-spin" /> : <Play size={24} fill="currentColor" />}
            Start match
          </button>
        ) : (
          <>
            {/* The clock runs itself from kick-off; every event below takes its
                minute from it, so there is nothing here to keep correcting. */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="flex items-baseline gap-2">
                    <span className="font-display text-3xl tabular-nums text-[#2fd778]">{live.display}</span>
                    <span className="text-sm tabular-nums text-white/40">{live.mmss}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-widest text-white/40">
                    {PERIOD_LABEL[live.period] || live.period}
                    {live.addedMinutes > 0 && <span className="text-[#eab308]"> · +{live.addedMinutes} added</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  {live.period === 'FIRST_HALF' && (
                    <button onClick={() => clock.mutate({ action: 'halftime' })} disabled={clock.isPending}
                      className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/70 hover:bg-white/5 disabled:opacity-40">
                      Half time
                    </button>
                  )}
                  {live.period === 'HALF_TIME' && (
                    <button onClick={() => clock.mutate({ action: 'resume' })} disabled={clock.isPending}
                      className="rounded-xl bg-[#12b76a] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40">
                      Start 2nd half
                    </button>
                  )}
                </div>
              </div>

              {/* Stoppage the referee held up on the board. */}
              <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                <Clock size={14} className="shrink-0 text-white/40" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Added time</span>
                <input
                  type="number" min={0} max={30} value={addedInput}
                  onChange={(e) => setAddedInput(e.target.value)}
                  placeholder="0"
                  className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-sm tabular-nums text-white outline-none focus:border-[#2fd778]"
                />
                <div className="flex gap-1">
                  {[1, 2, 3, 5].map((n) => (
                    <button key={n} onClick={() => { setAddedInput(String(n)); clock.mutate({ addedMinutes: n }); }}
                      className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-white/60 hover:bg-white/5">+{n}</button>
                  ))}
                </div>
                <button
                  onClick={() => clock.mutate({ addedMinutes: Math.max(0, parseInt(addedInput, 10) || 0) })}
                  disabled={clock.isPending}
                  className="ml-auto rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/15 disabled:opacity-40"
                >
                  Set
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                ['goal', 'Goal', 'border-[#2fd778]/40'],
                ['card', 'Card', 'border-[#eab308]/40'],
                ['sub', 'Sub', 'border-blue-400/40'],
                ['other', 'Update', 'border-white/15'],
              ].map(([k, label, border]) => (
                <button
                  key={k}
                  onClick={() => { setForm(k); setSide('home'); setPlayerId(''); setPlayer2Id(''); }}
                  className={`rounded-xl border ${border} bg-white/[0.03] py-4 text-xs font-bold uppercase tracking-wider hover:bg-white/[0.07]`}
                >
                  {label}
                </button>
              ))}
            </div>

            {form && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-lg uppercase tracking-tight">
                    {form === 'goal' ? 'Goal' : form === 'card' ? 'Card' : form === 'sub' ? 'Substitution' : 'Live update'}
                  </h3>
                  <button onClick={closeForm} aria-label="Close" className="text-white/40 hover:text-white"><X size={18} /></button>
                </div>

                <div className="space-y-3">
                  <Field label="Team">
                    <div className="grid grid-cols-2 gap-2">
                      {['home', 'away'].map((s) => (
                        <button
                          key={s}
                          onClick={() => { setSide(s); setPlayerId(''); setPlayer2Id(''); }}
                          className={`truncate rounded-xl border px-3 py-2.5 text-sm font-semibold ${side === s ? 'border-[#2fd778] bg-[#2fd778]/10 text-[#2fd778]' : 'border-white/10 text-white/70'}`}
                        >
                          {teamNameFor(s)}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {form === 'card' && (
                    <Field label="Card">
                      <div className="grid grid-cols-2 gap-2">
                        {[['YELLOW_CARD', 'Yellow', 'border-[#eab308] bg-[#eab308]/10 text-[#eab308]'], ['RED_CARD', 'Red', 'border-red-500 bg-red-500/10 text-red-400']].map(([v, label, on]) => (
                          <button key={v} onClick={() => setCardType(v)} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${cardType === v ? on : 'border-white/10 text-white/70'}`}>{label}</button>
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
                          className={`${inputCls} resize-none`}
                        />
                        <span className="absolute bottom-2 right-3 text-[10px] text-white/30">{text.length}/200</span>
                      </div>
                    </Field>
                  ) : (
                    <>
                      <Field label={form === 'sub' ? 'Coming on' : 'Player'}>
                        <div className="relative">
                          <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className={`${inputCls} appearance-none`}>
                            <option value="">
                              {squad.length ? 'Select player (optional)' : 'No line-up published for this team'}
                            </option>
                            {squad.map((l) => (
                              <option key={l.id} value={l.playerId}>
                                {l.jerseyNo ? `#${l.jerseyNo} ` : ''}{l.player?.fullName}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
                        </div>
                      </Field>

                      {form === 'sub' && (
                        <Field label="Coming off">
                          <div className="relative">
                            <select value={player2Id} onChange={(e) => setPlayer2Id(e.target.value)} className={`${inputCls} appearance-none`}>
                              <option value="">Select player</option>
                              {squad.filter((l) => String(l.playerId) !== String(playerId)).map((l) => (
                                <option key={l.id} value={l.playerId}>
                                  {l.jerseyNo ? `#${l.jerseyNo} ` : ''}{l.player?.fullName}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
                          </div>
                        </Field>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={closeForm} className="rounded-xl border border-white/15 py-2.5 text-sm font-bold text-white/70">Cancel</button>
                  <button
                    onClick={publish}
                    disabled={addEvent.isPending || (form === 'other' && !text.trim())}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#12b76a] py-2.5 text-sm font-bold text-white disabled:opacity-40"
                  >
                    {addEvent.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publish
                  </button>
                </div>
              </div>
            )}

            {/* Stream link */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-display text-lg uppercase tracking-tight">Stream link</h3>
              <p className="mb-2 text-xs text-white/40">Shown on the public match page while the match is live</p>
              <div className="relative">
                <input value={stream} onChange={(e) => setStream(e.target.value)} placeholder="https://example.com/live" className={`${inputCls} pr-9`} />
                <Link2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
              </div>
              <button onClick={() => saveStream.mutate()} disabled={saveStream.isPending} className="mt-3 w-full rounded-xl bg-[#12b76a] py-2.5 text-sm font-bold text-white disabled:opacity-40">
                {saveStream.isPending ? 'Saving…' : 'Save stream link'}
              </button>
            </div>

            {/* Everything published so far, newest first. */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="mb-3 font-display text-lg uppercase tracking-tight">Match feed</h3>
              {events.length === 0 ? (
                <p className="py-6 text-center text-sm text-white/40">Nothing published yet.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((e) => {
                    const meta = EVENT_META[e.eventType] || EVENT_META.COMMENTARY;
                    const team = e.teamId === fixture.homeTeamId ? home.name : e.teamId === fixture.awayTeamId ? away.name : null;
                    return (
                      <div key={e.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${meta.ring} text-[11px] font-bold tabular-nums text-white/80`}>
                          {e.minute != null ? `${e.minute}${e.extraTime ? `+${e.extraTime}` : ''}'` : '—'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-bold ${meta.tone}`}>{meta.label}</p>
                          <p className="truncate text-[11px] text-white/50">
                            {e.description || [team, e.player?.fullName].filter(Boolean).join(' · ') || '—'}
                            {e.player2?.fullName && ` ↔ ${e.player2.fullName}`}
                          </p>
                        </div>
                        {/* Clock markers are owned by the clock controls, so they
                            offer no undo here — removing one would leave the period
                            and the feed telling different stories. */}
                        {!CLOCK_EVENTS.includes(e.eventType) && (
                          <button
                            onClick={() => { if (window.confirm(`Remove this ${meta.label.toLowerCase()}?`)) undoEvent.mutate(e.id); }}
                            disabled={undoEvent.isPending}
                            aria-label={`Undo ${meta.label}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white/80 disabled:opacity-30"
                          >
                            <Undo2 size={15} />
                          </button>
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
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#080b09]/95 p-3 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => { if (window.confirm('Finish this match? It will be marked completed and live reporting stops.')) endMatch.mutate(); }}
              disabled={endMatch.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-sm font-bold text-red-400 disabled:opacity-50"
            >
              {endMatch.isPending ? <Loader2 size={15} className="animate-spin" /> : <Square size={15} />} End live reporting
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveReportingPage;
