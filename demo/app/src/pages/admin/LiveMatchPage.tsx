import React, { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Settings, Circle, Send, Link2, Square, ChevronDown, X,
} from 'lucide-react';
import { getFixture } from '../../api/endpoints/fixtures';
import useAuthStore from '../../store/authStore';
import ClubCrest from '../../components/ui/ClubCrest';

/**
 * LIVE MATCH — the reporter's live-scoring console. Fully interactive on mock
 * data: publishing a Goal updates the scoreboard AND prepends to the live feed;
 * cards/subs/text updates prepend too; the stream URL is validated and saved.
 * Dark-first and one-handed by design — SPEED over decoration (see the brief).
 * In production these publish over WebSocket so viewers get them in real time.
 */

const EVENT_META = {
  GOAL: { icon: '⚽', label: 'Goal!', color: 'text-[#2fd778]' },
  YELLOW_CARD: { icon: '🟨', label: 'Yellow Card', color: 'text-[#eab308]' },
  RED_CARD: { icon: '🟥', label: 'Red Card', color: 'text-red-500' },
  SUBSTITUTION: { icon: '🔄', label: 'Substitution', color: 'text-blue-400' },
  TEXT_UPDATE: { icon: '📝', label: 'Live Update', color: 'text-white/70' },
  OTHER: { icon: '•••', label: 'Match Event', color: 'text-white/70' },
};

const Field = ({ label, children }) => (
  <label className="block"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/40">{label}</span>{children}</label>
);
const inputCls = 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#2fd778]';

const LiveMatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuthStore();

  const { data } = useQuery({ queryKey: ['live-match', id], queryFn: () => getFixture(id || 101) });
  const m = data?.data || {};
  const home = m.homeTeam || { name: 'Home' };
  const away = m.awayTeam || { name: 'Away' };
  const homePlayers = (m.lineups || []).filter((l) => l.teamId === m.homeTeamId);
  const awayPlayers = (m.lineups || []).filter((l) => l.teamId === m.awayTeamId);

  const [score, setScore] = useState({ home: m.homeScore ?? 1, away: m.awayScore ?? 1 });
  const [events, setEvents] = useState([
    { id: 1, minute: "45+2'", type: 'GOAL', side: 'home', player: 'O. Niyonzima', ago: '2 min ago' },
    { id: 2, minute: "42'", type: 'YELLOW_CARD', side: 'away', player: 'Y. Mukunzi', ago: '2 min ago' },
    { id: 3, minute: "38'", type: 'SUBSTITUTION', side: 'home', player: 'I. Nshuti', ago: '5 min ago' },
  ]);
  const [tab, setTab] = useState('feed');
  const [form, setForm] = useState(null); // null | goal | card | sub | other
  const [side, setSide] = useState('home');
  const [player, setPlayer] = useState('');
  const [minute, setMinute] = useState("45+2");
  const [cardType, setCardType] = useState('YELLOW_CARD');
  const [text, setText] = useState('');
  const [stream, setStream] = useState(m.streamUrl || '');
  const [toast, setToast] = useState('');

  React.useEffect(() => { if (m.homeScore != null) setScore({ home: m.homeScore, away: m.awayScore }); }, [m.homeScore, m.awayScore]);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200); };
  const nextId = () => (events[0]?.id || 0) + 1 + Math.floor((minute.length + text.length) % 7);
  const prepend = (ev) => setEvents((e) => [{ id: nextId(), ago: 'now', ...ev }, ...e]);

  const publishGoal = () => { setScore((s) => ({ ...s, [side]: s[side] + 1 })); prepend({ minute: `${minute}'`, type: 'GOAL', side, player: player || undefined }); flash('Goal published'); setForm(null); setPlayer(''); };
  const publishCard = () => { prepend({ minute: `${minute}'`, type: cardType, side, player: player || undefined }); flash('Card published'); setForm(null); setPlayer(''); };
  const publishSub = () => { prepend({ minute: `${minute}'`, type: 'SUBSTITUTION', side, player: player || undefined }); flash('Substitution published'); setForm(null); setPlayer(''); };
  const publishUpdate = () => { if (!text.trim()) return; prepend({ minute: '', type: 'TEXT_UPDATE', side, text: text.trim() }); flash('Update published'); setText(''); };
  const saveStream = () => { if (stream && !/^https?:\/\/.+/.test(stream)) return flash('Enter a valid URL'); flash(stream ? 'Stream link saved' : 'Stream removed'); };

  if (role !== 'MATCH_REPORTER') return <Navigate to="/auth/login" replace />;

  const players = side === 'home' ? homePlayers : awayPlayers;
  const teamName = (s) => (s === 'home' ? home.name : away.name);

  return (
    <div className="min-h-screen bg-[#080b09] pb-28 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-white/10 bg-[#080b09]/95 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate('/reporter/dashboard')} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/5"><ArrowLeft size={18} /></button>
        <h1 className="font-display text-lg uppercase tracking-tight">Live Match</h1>
        <div className="flex items-center gap-2">
          <button aria-label="Settings" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/5"><Settings size={17} /></button>
          <span className="inline-flex items-center gap-1 rounded-md bg-[#2fd778]/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2fd778]"><Circle size={7} className="animate-pulse fill-[#2fd778]" /> Live</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4">
        {/* Scoreboard */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 flex-col items-center gap-2"><ClubCrest team={home} size="lg" /><span className="max-w-[90px] truncate text-sm font-bold">{home.shortName || home.name}</span></div>
            <div className="text-center">
              <p className="font-display text-4xl font-bold tabular-nums">{score.home} <span className="text-white/40">-</span> {score.away}</p>
              <p className="mt-1 font-display text-sm tabular-nums text-[#2fd778]">45:00</p>
              <p className="text-[11px] uppercase tracking-widest text-white/40">First Half</p>
            </div>
            <div className="flex flex-1 flex-col items-center gap-2"><ClubCrest team={away} size="lg" /><span className="max-w-[90px] truncate text-sm font-bold">{away.shortName || away.name}</span></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[['feed', 'Live Feed'], ['events', 'Events'], ['stats', 'Stats'], ['lineups', 'Lineups']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`relative flex-1 py-3 text-xs font-bold uppercase tracking-wider ${tab === k ? 'text-white' : 'text-white/40'}`}>
              {l}{tab === k && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#2fd778]" />}
            </button>
          ))}
        </div>

        {tab === 'feed' && (
          <>
            {/* Quick event buttons */}
            <input readOnly placeholder="What's happening on the pitch?" onFocus={() => setForm('other')} className={inputCls + ' cursor-pointer'} />
            <div className="grid grid-cols-4 gap-2">
              {[['goal', '⚽', 'Goal', 'border-[#2fd778]/40'], ['card', '🟨', 'Card', 'border-[#eab308]/40'], ['sub', '🔄', 'Sub', 'border-blue-400/40'], ['other', '•••', 'Other', 'border-white/15']].map(([k, ic, lb, bd]) => (
                <button key={k} onClick={() => { setForm(k); setSide('home'); }} className={`flex flex-col items-center gap-1 rounded-xl border ${bd} bg-white/[0.03] py-3 text-xs font-bold hover:bg-white/[0.07]`}>
                  <span className="text-lg" aria-hidden="true">{ic}</span>{lb}
                </button>
              ))}
            </div>

            {/* Event form */}
            {form && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-lg uppercase tracking-tight">{form === 'goal' ? 'Goal' : form === 'card' ? 'Card' : form === 'sub' ? 'Substitution' : 'Match Event'}</h3>
                  <button onClick={() => setForm(null)} aria-label="Close" className="text-white/40 hover:text-white"><X size={18} /></button>
                </div>
                <div className="space-y-3">
                  <Field label="Team">
                    <div className="grid grid-cols-2 gap-2">
                      {['home', 'away'].map((s) => (
                        <button key={s} onClick={() => { setSide(s); setPlayer(''); }} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${side === s ? 'border-[#2fd778] bg-[#2fd778]/10 text-[#2fd778]' : 'border-white/10 text-white/70'}`}>{teamName(s)}</button>
                      ))}
                    </div>
                  </Field>
                  {form === 'card' && (
                    <Field label="Card">
                      <div className="grid grid-cols-2 gap-2">
                        {[['YELLOW_CARD', 'Yellow', 'border-[#eab308] bg-[#eab308]/10 text-[#eab308]'], ['RED_CARD', 'Red', 'border-red-500 bg-red-500/10 text-red-400']].map(([v, lb, on]) => (
                          <button key={v} onClick={() => setCardType(v)} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${cardType === v ? on : 'border-white/10 text-white/70'}`}>{lb}</button>
                        ))}
                      </div>
                    </Field>
                  )}
                  <Field label={form === 'sub' ? 'Player (out → in)' : 'Player'}>
                    <div className="relative">
                      <select value={player} onChange={(e) => setPlayer(e.target.value)} className={inputCls + ' appearance-none'}>
                        <option value="">Select player</option>
                        {players.map((p) => <option key={p.id} value={p.player?.fullName}>{p.jerseyNo ? `#${p.jerseyNo} ` : ''}{p.player?.fullName}</option>)}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
                    </div>
                  </Field>
                  <Field label="Minute"><input value={minute} onChange={(e) => setMinute(e.target.value)} className={inputCls} /></Field>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => setForm(null)} className="rounded-xl border border-white/15 py-2.5 text-sm font-bold text-white/70">Cancel</button>
                  <button onClick={form === 'goal' ? publishGoal : form === 'card' ? publishCard : form === 'sub' ? publishSub : () => { prepend({ minute: `${minute}'`, type: 'OTHER', side, player: player || undefined }); flash('Event published'); setForm(null); }} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#12b76a] py-2.5 text-sm font-bold text-white">
                    <Send size={14} /> Publish
                  </button>
                </div>
              </div>
            )}

            {/* Add live update */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="mb-2 font-display text-lg uppercase tracking-tight">Add Live Update</h3>
              <div className="relative">
                <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 200))} placeholder="Describe what's happening..." rows={3} className={inputCls + ' resize-none'} />
                <span className="absolute bottom-2 right-3 text-[10px] text-white/30">{text.length}/200</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => setText('')} className="rounded-xl border border-white/15 py-2.5 text-sm font-bold text-white/70">Cancel</button>
                <button onClick={publishUpdate} disabled={!text.trim()} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#12b76a] py-2.5 text-sm font-bold text-white disabled:opacity-40"><Send size={14} /> Publish Update</button>
              </div>
            </div>

            {/* Stream link */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-display text-lg uppercase tracking-tight">Stream Link</h3>
              <p className="mb-2 text-xs text-white/40">Add or update live stream URL</p>
              <div className="relative">
                <input value={stream} onChange={(e) => setStream(e.target.value)} placeholder="https://example.com/live-stream" className={inputCls + ' pr-9'} />
                <Link2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
              </div>
              <button onClick={saveStream} className="mt-3 w-full rounded-xl bg-[#12b76a] py-2.5 text-sm font-bold text-white">Save Stream Link</button>
            </div>

            {/* Live feed */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="mb-3 font-display text-lg uppercase tracking-tight">Recent Updates</h3>
              <div className="space-y-2">
                {events.map((e) => {
                  const meta = EVENT_META[e.type] || EVENT_META.OTHER;
                  return (
                    <div key={e.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2fd778]/30 text-[11px] font-bold tabular-nums text-[#2fd778]">{e.minute || '—'}</span>
                      <span className="text-lg" aria-hidden="true">{meta.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold ${meta.color}`}>{meta.label}</p>
                        <p className="truncate text-[11px] text-white/50">{e.text || `${teamName(e.side)}${e.player ? ` · ${e.player}` : ''}`}</p>
                      </div>
                      {e.type === 'GOAL' && <span className="shrink-0 font-display text-sm font-bold tabular-nums text-[#2fd778]">{score.home} - {score.away}</span>}
                      <span className="shrink-0 text-[10px] text-white/30">{e.ago}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab !== 'feed' && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/40">
            {tab === 'events' ? 'Full event log' : tab === 'stats' ? 'Match statistics' : 'Team line-ups'} — available in the live match view.
          </div>
        )}
      </div>

      {/* Sticky end-reporting */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#080b09]/95 p-3 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <button onClick={() => { if (confirm('Finish Match? This marks it completed and stops live reporting.')) { flash('Live reporting ended'); navigate('/reporter/dashboard'); } }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-sm font-bold text-red-400">
            <Square size={15} /> End Live Reporting
          </button>
        </div>
      </div>

      {toast && <div role="status" className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#12b76a] px-4 py-2 text-sm font-bold text-white shadow-lg">{toast}</div>}
    </div>
  );
};

export default LiveMatchPage;
