import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { School, MapPin, Plus, Pencil, EyeOff, Eye } from 'lucide-react';
import { getSchools, createAkcSchool, updateAkcSchool, setAkcSchoolActive } from '../../api/endpoints/amashuri';
import ClubCrest from '../../components/ui/ClubCrest';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import { Skeleton, EmptyState } from '../../components/ui';

const CATEGORIES = ['PRIMARY', 'SECONDARY', 'TVET'];
const empty = { name: '', code: '', category: 'SECONDARY', sector: '' };

/** Amashuri Admin â†’ Schools: register, edit and hide schools. */
const AmashuriAdminSchools = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['aa-schools'], queryFn: () => getSchools() });
  const schools = data?.data || [];
  const refresh = () => qc.invalidateQueries({ queryKey: ['aa-schools'] });

  const save = useMutation({
    mutationFn: () => (editing ? updateAkcSchool(editing.id, form) : createAkcSchool(form)),
    onSuccess: () => { setModal(false); refresh(); },
    onError: (e: any) => setErr(e.response?.data?.message || 'Failed'),
  });
  const toggle = useMutation({ mutationFn: ({ id, active }: any) => setAkcSchoolActive(id, active), onSuccess: refresh });

  const openAdd = () => { setEditing(null); setForm(empty); setErr(''); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name || '', code: s.code || '', category: s.category || 'SECONDARY', sector: s.sector || '' }); setErr(''); setModal(true); };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">{t('aadmin.schools_title')} <span className="text-red">{t('aadmin.schools_accent')}</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('aadmin.schools_sub')}</p>
        </div>
        <button onClick={openAdd} className="inline-flex w-fit items-center gap-2 rounded-lg bg-red px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white"><Plus size={16} /> {t('aadmin.add_school')}</button>
      </div>

      {isLoading ? <Skeleton type="card" count={3} />
        : schools.length === 0 ? <EmptyState icon={School} title={t('aadmin.none_schools')} hint={t('aadmin.none_schools_hint')} />
        : (
          <AdminTable headers={[t('aadmin.col_school'), t('aadmin.col_category'), t('aadmin.col_location'), t('aadmin.col_team'), t('admin.col_actions')]}>
            {schools.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><ClubCrest team={s} size="md" /><span className="text-sm font-semibold text-primary">{s.name}</span></div></td>
                <td className="px-6 py-4 text-xs uppercase tracking-wider text-secondary">{s.category}</td>
                <td className="px-6 py-4 text-sm text-tertiary"><span className="inline-flex items-center gap-1"><MapPin size={12} /> {s.sector || 'â€”'}</span></td>
                <td className="px-6 py-4 text-sm tabular-nums text-secondary">{s._count?.teams ?? 0}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEdit(s)} className="text-tertiary hover:text-primary" aria-label={t('aadmin.edit_school')}><Pencil size={15} /></button>
                    <button onClick={() => toggle.mutate({ id: s.id, active: !s.active })} className="text-tertiary hover:text-red" aria-label={s.active ? t('aadmin.hide') : t('aadmin.show')}>{s.active ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        )}

      <AdminModal isOpen={modal} onClose={() => setModal(false)} title={editing ? t('aadmin.edit_school') : t('aadmin.add_school')}>
        <form onSubmit={(e) => { e.preventDefault(); if (!form.name.trim()) { setErr(t('aadmin.required')); return; } save.mutate(); }} className="space-y-4">
          <Field label={t('aadmin.f_name')}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
          <Field label={t('aadmin.f_code')}><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} /></Field>
          <Field label={t('aadmin.f_category')}>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label={t('aadmin.f_sector')}><input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className={inputCls} /></Field>
          {err && <p className="text-xs text-red">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-secondary">{t('aadmin.cancel')}</button>
            <button type="submit" disabled={save.isPending} className="rounded-lg bg-red px-4 py-2 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50">{t('aadmin.save')}</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

const inputCls = 'w-full rounded-lg border border-hairline bg-surface px-3 py-2.5 text-sm text-primary outline-none focus-visible:border-brand';
const Field = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">{label}</span>
    {children}
  </label>
);

export default AmashuriAdminSchools;
