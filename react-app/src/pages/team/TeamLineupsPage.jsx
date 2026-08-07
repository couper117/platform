import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Loader2, Users, Star, Shield, Lock, ClipboardList } from 'lucide-react';
import apiClient from '../../api/client';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';

const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2', '4-1-4-1'];
const LOCKED = ['LIVE', 'COMPLETED'];

const TeamLineupsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // fixture being edited
  const [formation, setFormation] = useState('4-3-3');
  const [coachName, setCoachName] = useState('');
  const [roles, setRoles] = useState({}); // playerId -> 'STARTER' | 'BENCH' | 'OUT'
  const [captain, setCaptain] = useState(null);
  const [error, setError] = useState('');

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team-my'],
    queryFn: async () => (await apiClient.get('/teams/my')).data.data,
  });
  const teamId = team?.id;

  const { data: fixtures, isLoading: fxLoading } = useQuery({
    queryKey: ['team-fixtures', teamId],
    queryFn: async () => (await apiClient.get('/fixtures', { params: { teamId, limit: 100 } })).data.data,
    enabled: !!teamId,
  });

  const roster = team?.players || [];
  const starters = useMemo(() => Object.values(roles).filter((r) => r === 'STARTER').length, [roles]);

  const openEditor = async (fixture) => {
    setError('');
    setEditing(fixture);
    // Prefill from any existing team sheet / lineup for this team.
    const detail = (await apiClient.get(`/fixtures/${fixture.id}`)).data.data;
    const sheet = (detail.teamSheets || []).find((s) => s.teamId === teamId);
    const mine = (detail.lineups || []).filter((l) => l.teamId === teamId);
    setFormation(sheet?.formation || '4-3-3');
    setCoachName(sheet?.coachName || '');
    const r = {};
    let cap = null;
    for (const l of mine) {
      r[l.playerId] = l.isStarter ? 'STARTER' : 'BENCH';
      if (l.isCaptain) cap = l.playerId;
    }
    setRoles(r);
    setCaptain(cap);
  };

  const cycleRole = (pid) => {
    setRoles((prev) => {
      const cur = prev[pid] || 'OUT';
      const next = cur === 'OUT' ? 'STARTER' : cur === 'STARTER' ? 'BENCH' : 'OUT';
      return { ...prev, [pid]: next };
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const players = roster
        .filter((p) => roles[p.id] && roles[p.id] !== 'OUT')
        .map((p) => ({
          playerId: p.id,
          position: p.position,
          jerseyNo: p.jerseyNumber,
          isStarter: roles[p.id] === 'STARTER',
          isCaptain: captain === p.id,
        }));
      await apiClient.put(`/fixtures/${editing.id}/lineup`, { teamId, formation, coachName, published: true, players });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-fixtures', teamId] });
      setEditing(null);
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to save lineup'),
  });

  const submit = () => {
    setError('');
    if (starters === 0) return setError('Select at least one starter');
    if (captain && roles[captain] === 'OUT') return setError('Captain must be in the squad');
    saveMutation.mutate();
  };

  const opponentOf = (f) => (f.homeTeamId === teamId ? f.awayTeam : f.homeTeam);
  const homeAway = (f) => (f.homeTeamId === teamId ? 'H' : 'A');

  if (teamLoading) return <div className="py-10"><Skeleton type="card" count={3} /></div>;
  if (!team) return <p className="opacity-50 py-10">{t('team.no_team')}</p>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter flex items-center gap-3">
          <ClipboardList className="text-red" /> {t('nav.fixtures')} <span className="text-red">{t('match.lineups')}</span>
        </h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('team.lineups_subtitle')}</p>
      </div>

      {fxLoading ? (
        <Skeleton type="card" count={3} />
      ) : !fixtures?.length ? (
        <p className="opacity-50 py-10">{t('team.no_matches')}</p>
      ) : (
        <div className="space-y-3">
          {fixtures.map((f) => {
            const opp = opponentOf(f);
            const locked = LOCKED.includes(f.status);
            return (
              <div key={f.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-white/5 border border-surface-3 dark:border-white/10 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-surface-2 dark:bg-white/10 shrink-0">{homeAway(f)}</div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm uppercase tracking-tight truncate">vs {opp?.name || t('common.tbd')}</p>
                    <p className="text-[10px] opacity-40 uppercase tracking-widest truncate">
                      {f.matchDate ? new Date(f.matchDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Date TBD'} · {f.status}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !locked && openEditor(f)}
                  disabled={locked}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-display text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shrink-0 ${locked ? 'opacity-40 cursor-not-allowed bg-surface-2 dark:bg-white/5' : 'bg-red text-white hover:bg-red-dark'}`}
                >
                  {locked ? <><Lock size={14} /> {t('team.locked')}</> : <><Users size={14} /> {t('team.manage_lineup')}</>}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AdminModal isOpen={!!editing} onClose={() => setEditing(null)} title={editing ? `Lineup vs ${opponentOf(editing)?.name || ''}` : ''}>
        <div className="space-y-5">
          {error && <div className="bg-red/10 border border-red/20 p-3 rounded-xl text-red text-xs font-bold uppercase tracking-wider">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('team.formation')}</label>
              <select value={formation} onChange={(e) => setFormation(e.target.value)} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-3 rounded-xl outline-none">
                {FORMATIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('amashuri.school_profile.coach')}</label>
              <input value={coachName} onChange={(e) => setCoachName(e.target.value)} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-3 rounded-xl outline-none" placeholder="Head coach name" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest opacity-60">
            <span>{t('team.squad_hint')}</span>
            <span className="text-red">{t('team.starter_count', { count: starters })}</span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {roster.map((p) => {
              const role = roles[p.id] || 'OUT';
              const badge = role === 'STARTER' ? 'bg-green text-white' : role === 'BENCH' ? 'bg-gold/80 text-white' : 'bg-surface-3 dark:bg-white/10 opacity-60';
              return (
                <div key={p.id} className="flex items-center justify-between bg-surface-2 dark:bg-white/5 rounded-xl px-3 py-2">
                  <button onClick={() => cycleRole(p.id)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                    <span className={`text-[8px] font-bold px-2 py-1 rounded uppercase w-14 text-center shrink-0 ${badge}`}>{role}</span>
                    <span className="text-xs font-bold uppercase tracking-tight truncate">{p.jerseyNumber ? `${p.jerseyNumber}. ` : ''}{p.fullName}</span>
                    <span className="text-[9px] opacity-40 uppercase shrink-0 hidden sm:inline">{p.position || ''}</span>
                  </button>
                  <button
                    onClick={() => setCaptain(captain === p.id ? null : p.id)}
                    disabled={role === 'OUT'}
                    title={t('team.captain')}
                    className={`p-2 rounded-lg transition-colors ${captain === p.id ? 'text-gold' : 'opacity-30 hover:opacity-70'} ${role === 'OUT' ? 'invisible' : ''}`}
                  >
                    <Star size={16} fill={captain === p.id ? 'currentColor' : 'none'} />
                  </button>
                </div>
              );
            })}
            {!roster.length && <p className="opacity-40 text-xs py-4">No players on your roster yet.</p>}
          </div>

          <button onClick={submit} disabled={saveMutation.isPending} className="w-full bg-red text-white font-display text-lg uppercase tracking-widest py-3.5 rounded-xl hover:bg-red-dark transition-all flex items-center justify-center disabled:opacity-50">
            {saveMutation.isPending ? <Loader2 className="animate-spin" /> : <><Shield size={18} className="mr-2" /> Publish Lineup</>}
          </button>
        </div>
      </AdminModal>
    </div>
  );
};

export default TeamLineupsPage;
