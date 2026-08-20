import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserSquare2, CheckCircle2, Clock, Plus, EyeOff, Eye } from 'lucide-react';
import { getAkcAthletes, getAkcTeams, createAkcAthlete, setAkcAthleteActive } from '../../api/endpoints/amashuri';
import Avatar from '../../components/ui/Avatar';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import { Skeleton, EmptyState } from '../../components/ui';

const empty = { teamId: '', fullName: '', gender: 'MALE', ageCategory: 'U17', position: '', jersey: '', idNumber: '' };

/** Amashuri Admin â†’ Athletes: register, hide and verify student athletes. */
const AmashuriAdminAthletes = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['aa-athletes'], queryFn: () => getAkcAthletes() });
  const { data: teamsRes } = useQuery({ queryKey: ['aa-teams'], queryFn: () => getAkcTeams() });
  const athletes = data?.data || [];
  const teams = teamsRes?.data || [];
  const refresh = () => qc.invalidateQueries({ queryKey: ['aa-athletes'] });

  const create = useMutation({
    mutationFn: () => createAkcAthlete(form),
    onSuccess: () => { setModal(false); refresh(); },
    onError: (e: any) => setErr(e.response?.data?.message || 'Failed'),
  });
  const toggle = useMutation({ mutationFn: ({ id, active }: any) => setAkcAthleteActive(id, active), onSuccess: refresh });

  const openAdd = () => { setForm(empty); setErr(''); setModal(true); };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">{t('aadmin.athletes_title')} <span className="text-red">{t('aadmin.athletes_accent')}</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('aadmin.athletes_sub')}</p>
        </div>
        <button onClick={openAdd} className="inline-flex w-fit items-center gap-2 rounded-lg bg-red px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white"><Plus size={16} /> {t('aadmin.add_athlete')}</button>
      </div>
      {isLoading ? <Skeleton type="card" count={3} />
        : athletes.length === 0 ? <EmptyState icon={UserSquare2} title={t('aadmin.none_athletes')} hint={t('aadmin.none_athletes_hint')} />
        : (
          <AdminTable headers={[t('aadmin.col_athlete'), t('aadmin.col_team'), t('aadmin.col_category'), t('aadmin.col_docs'), t('admin.col_actions')]}>
            {athletes.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={a.fullName} size="sm" /><span className="text-sm font-semibold text-primary">{a.fullName}</span></div></td>
                <td className="px-6 py-4 text-sm text-secondary">{a.team?.school?.name}</td>
                <td className="px-6 py-4 text-xs uppercase tracking-wider text-tertiary">{a.gender} Â· {a.ageCategory}</td>
                <td className="px-6 py-4">
                  {a.docVerified
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-text"><CheckCircle2 size={11} /> {t('aadmin.verified')}</span>
                    : <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold"><Clock size={11} /> {t('aadmin.unverified')}</span>}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => toggle.mutate({ id: a.id, active: !a.active })} className="text-tertiary hover:text-red" aria-label={a.active ? t('aadmin.hide') : t('aadmin.show')}>{a.active ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </td>
              </tr>
            ))}
          </AdminTable>
        )}

      <AdminModal isOpen={modal} onClose={() => setModal(false)} title={t('aadmin.add_athlete')}>
        <form onSubmit={(e) => { e.preventDefault(); if (!form.fullName.trim() || !form.teamId) { setErr(t('aadmin.required')); return; } create.mutate(); }} className="space-y-4">
          <label className="block space-y-1"><span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">{t('aadmin.f_name')}</span>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} /></label>
          <label className="block space-y-1"><span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">{t('aadmin.f_school')}</span>
            <select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })} className={inputCls}>
              <option value="">â€”</option>
              {teams.map((tm) => <option key={tm.id} value={tm.id}>{tm.school?.name} Â· {tm.gender} {tm.ageCategory}</option>)}
            </select></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1"><span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">{t('aadmin.f_position')}</span>
              <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={inputCls} /></label>
            <label className="block space-y-1"><span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">{t('aadmin.f_id')}</span>
              <input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} className={inputCls} /></label>
          </div>
          {err && <p className="text-xs text-red">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-secondary">{t('aadmin.cancel')}</button>
            <button type="submit" disabled={create.isPending} className="rounded-lg bg-red px-4 py-2 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50">{t('aadmin.save')}</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

const inputCls = 'w-full rounded-lg border border-hairline bg-surface px-3 py-2.5 text-sm text-primary outline-none focus-visible:border-brand';

export default AmashuriAdminAthletes;
