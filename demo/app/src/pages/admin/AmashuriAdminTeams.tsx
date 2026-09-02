import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users, Pencil, EyeOff, Eye } from 'lucide-react';
import { getAkcTeams, updateAkcTeam, setAkcTeamActive } from '../../api/endpoints/amashuri';
import ClubCrest from '../../components/ui/ClubCrest';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import { Skeleton, EmptyState } from '../../components/ui';

const GENDERS = ['MALE', 'FEMALE', 'MIXED', 'INCLUSIVE'];
const AGES = ['U13', 'U15', 'U17', 'U20', 'OPEN'];

/** Amashuri Admin → Teams: edit and hide teams registered by schools. */
const AmashuriAdminTeams = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ coachName: '', gender: 'MALE', ageCategory: 'U17' });

  const { data, isLoading } = useQuery({ queryKey: ['aa-teams'], queryFn: () => getAkcTeams() });
  const teams = data?.data || [];
  const refresh = () => qc.invalidateQueries({ queryKey: ['aa-teams'] });

  const save = useMutation({ mutationFn: () => updateAkcTeam(editing.id, form), onSuccess: () => { setEditing(null); refresh(); } });
  const toggle = useMutation({ mutationFn: ({ id, active }: any) => setAkcTeamActive(id, active), onSuccess: refresh });

  const openEdit = (tm) => { setEditing(tm); setForm({ coachName: tm.coachName || '', gender: tm.gender || 'MALE', ageCategory: tm.ageCategory || 'U17' }); };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('aadmin.teams_title')} <span className="text-red">{t('aadmin.teams_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('aadmin.teams_sub')}</p>
      </div>
      {isLoading ? <Skeleton type="card" count={3} />
        : teams.length === 0 ? <EmptyState icon={Users} title={t('aadmin.none_teams')} hint={t('aadmin.none_teams_hint')} />
        : (
          <AdminTable headers={[t('aadmin.col_team'), t('aadmin.col_category'), t('aadmin.col_coach'), t('admin.col_actions')]}>
            {teams.map((tm) => (
              <tr key={tm.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><ClubCrest team={tm.school} size="md" /><span className="text-sm font-semibold text-primary">{tm.school?.name}</span></div></td>
                <td className="px-6 py-4 text-xs uppercase tracking-wider text-secondary">{tm.gender} · {tm.ageCategory}</td>
                <td className="px-6 py-4 text-sm text-tertiary">{tm.coachName || '—'}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEdit(tm)} className="text-tertiary hover:text-primary" aria-label={t('aadmin.edit_team')}><Pencil size={15} /></button>
                    <button onClick={() => toggle.mutate({ id: tm.id, active: !tm.active })} className="text-tertiary hover:text-red" aria-label={tm.active ? t('aadmin.hide') : t('aadmin.show')}>{tm.active ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        )}

      <AdminModal isOpen={!!editing} onClose={() => setEditing(null)} title={t('aadmin.edit_team')}>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
          <label className="block space-y-1"><span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">{t('aadmin.f_coach')}</span>
            <input value={form.coachName} onChange={(e) => setForm({ ...form, coachName: e.target.value })} className={inputCls} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1"><span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">{t('aadmin.f_gender')}</span>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputCls}>{GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
            <label className="block space-y-1"><span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">{t('aadmin.f_age')}</span>
              <select value={form.ageCategory} onChange={(e) => setForm({ ...form, ageCategory: e.target.value })} className={inputCls}>{AGES.map((a) => <option key={a} value={a}>{a}</option>)}</select></label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-secondary">{t('aadmin.cancel')}</button>
            <button type="submit" disabled={save.isPending} className="rounded-lg bg-red px-4 py-2 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50">{t('aadmin.save')}</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

const inputCls = 'w-full rounded-lg border border-hairline bg-surface px-3 py-2.5 text-sm text-primary outline-none focus-visible:border-brand';

export default AmashuriAdminTeams;
