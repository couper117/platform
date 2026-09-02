import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Trophy, Plus, Check, X, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton } from '../../components/ui';
import { SPORT_PROFILES } from '../../config/sportProfiles';
import { useCan } from '../../hooks/useCan';

/**
 * Super Admin → Sports.
 *
 * The API to add and configure a sport existed; nothing in the admin used it, so
 * adding one meant a database session. This is that page.
 *
 * `type` is the field that matters and the one easiest to get wrong: it decides
 * the terminology and the competition formats every other admin page offers, so
 * a cycling tour is not asked for a "starting XI". Choosing it here shows what
 * each type actually changes rather than leaving four enum values to guess at.
 */
const CATEGORIES = ['FIELD', 'COURT', 'COMBAT', 'WATER', 'ATHLETICS', 'MIND', 'OTHER'];
const TYPES = Object.keys(SPORT_PROFILES);

const blank = { name: '', type: 'TEAM', category: 'OTHER', icon: '', description: '', sortOrder: 0 };

const AdminSportsPage = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState('');

  // A sport is governed by its federation, which keeps its description current.
  // Whether the platform recognises a sport at all, and how it is competed, are
  // central decisions — the type reshapes terminology and competition formats
  // across every other admin page.
  const central = useCan('sports.write');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sports'],
    queryFn: async () => (await apiClient.get('/sports', { params: { includeInactive: true } })).data.data,
  });

  const save = useMutation({
    mutationFn: (s: any) => (s.id ? apiClient.put(`/sports/${s.id}`, s) : apiClient.post('/sports', s)),
    onSuccess: () => { setForm(null); setError(''); qc.invalidateQueries({ queryKey: ['admin-sports'] }); },
    onError: (e: any) => setError(e.response?.data?.message || 'Could not save that sport.'),
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/sports/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-sports'] }),
    onError: (e: any) => setError(e.response?.data?.message || 'Could not remove that sport.'),
  });

  const sports = data || [];
  const profile = form ? SPORT_PROFILES[form.type] : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">
            {t('admin.sports.title', 'Sports')} <span className="text-red">{t('admin.sports.title_accent', 'Management')}</span>
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">
            {t('admin.sports.subtitle', 'Every sport the platform runs, and how each one is competed')}
          </p>
        </div>
        {central && (
          <button
            type="button"
            onClick={() => { setForm({ ...blank }); setError(''); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white"
          >
            <Plus size={14} /> {t('admin.sports.add', 'Add a sport')}
          </button>
        )}
      </div>

      {form && (
        <div className="space-y-4 rounded-2xl border border-hairline bg-surface p-5">
          {!central && (
            <p className="rounded-lg bg-surface-2 p-3 text-xs text-tertiary">
              {t('admin.sports.federation_scope',
                 'You maintain how your federation\u2019s sport is described. Its name, category and how it is competed are set centrally.')}
            </p>
          )}

          <div className={`grid gap-4 sm:grid-cols-2 ${central ? '' : 'hidden'}`}>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">{t('admin.sports.name', 'Name')}</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Basketball"
                className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-primary outline-none focus-visible:border-brand"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">{t('admin.sports.category', 'Category')}</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-primary outline-none"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <div className={central ? '' : 'hidden'}>
            <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">
              {t('admin.sports.type', 'How it is competed')}
            </span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {TYPES.map((key) => {
                const p = SPORT_PROFILES[key];
                const on = form.type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, type: key })}
                    className={`rounded-xl border p-3 text-left transition-colors ${on ? 'border-brand bg-brand/10' : 'border-hairline hover:border-brand/40'}`}
                  >
                    <p className={`text-sm font-semibold ${on ? 'text-brand-text' : 'text-primary'}`}>{p.label}</p>
                    <p className="mt-0.5 text-[11px] text-tertiary">{p.competitorPlural} · {p.rosterPlural}</p>
                  </button>
                );
              })}
            </div>
            {/* What the choice actually changes, so it is not four enum values to guess at. */}
            {profile && (
              <p className="mt-2 rounded-lg bg-surface-2 p-3 text-xs text-tertiary">
                {t('admin.sports.type_note', 'Admin pages will say')}{' '}
                <strong className="text-secondary">{profile.competitor}</strong>,{' '}
                <strong className="text-secondary">{profile.roster}</strong> and{' '}
                <strong className="text-secondary">{profile.event}</strong>, record a{' '}
                <strong className="text-secondary">{profile.result}</strong>, and offer{' '}
                {profile.formats.map((f: any) => f.label).join(', ')}.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">{t('admin.sports.order', 'Sort order')}</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-primary outline-none focus-visible:border-brand"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">{t('admin.sports.description', 'Description')}</span>
              <input
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-primary outline-none focus-visible:border-brand"
              />
            </label>
          </div>

          {error && <p className="text-xs text-danger-text">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={save.isPending || (central && form.name.trim().length < 2)}
              onClick={() => save.mutate(central ? form : { id: form.id, description: form.description, icon: form.icon })}
              className="rounded-lg bg-brand px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white disabled:opacity-40"
            >
              {save.isPending ? t('common.saving', 'Saving') : t('common.save', 'Save')}
            </button>
            <button
              type="button"
              onClick={() => { setForm(null); setError(''); }}
              className="rounded-lg border border-hairline px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-secondary"
            >
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : (
        <AdminTable headers={[
          t('admin.sports.col_sport', 'Sport / governing federation'),
          t('admin.sports.col_type', 'Competed as'),
          t('admin.sports.col_usage', 'In use'),
          t('admin.col_status', 'Status'),
          '',
        ]}>
          {sports.map((s: any) => {
            const p = SPORT_PROFILES[s.type] || SPORT_PROFILES.TEAM;
            // A sport with competitions or clubs behind it cannot simply be
            // deleted — say so on the button rather than after the click.
            const inUse = (s._count?.leagues || 0) + (s._count?.teams || 0) + (s._count?.federations || 0);
            return (
              <tr key={s.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-primary">{s.icon} {s.name}</p>
                  {/* A sport is governed by its federation — naming it here is
                      the difference between a registry and a list of who is
                      responsible for what. */}
                  <p className="text-[11px] text-tertiary">
                    {s.federations?.length
                      ? s.federations.map((f: any) => f.abbreviation || f.name).join(', ')
                      : t('admin.sports.no_federation', 'No federation yet')}
                    {' · '}{s.category}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-secondary">{p.label}</td>
                <td className="px-6 py-4 text-[12px] text-tertiary">
                  {s._count?.federations || 0} fed · {s._count?.leagues || 0} comp · {s._count?.teams || 0} club · {s._count?.matches || 0} match
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.active ? 'bg-brand/10 text-brand-text' : 'bg-surface-2 text-tertiary'}`}>
                    {s.active ? <><Check size={11} /> {t('admin.users.active', 'Active')}</> : <><X size={11} /> {t('admin.users.inactive', 'Inactive')}</>}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setForm({ ...s }); setError(''); }}
                      className="rounded-lg border border-hairline px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary hover:border-brand hover:text-brand-text"
                    >
                      {t('common.edit', 'Edit')}
                    </button>
                    {central && (
                    <button
                      type="button"
                      onClick={() => save.mutate({ ...s, active: !s.active })}
                      className="rounded-lg border border-hairline px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary hover:border-brand hover:text-brand-text"
                    >
                      {s.active ? t('admin.sports.deactivate', 'Deactivate') : t('admin.sports.activate', 'Activate')}
                    </button>
                    )}
                    {central && (
                    <button
                      type="button"
                      disabled={inUse > 0 || remove.isPending}
                      title={inUse > 0 ? t('admin.sports.in_use', 'Has federations, competitions or clubs — deactivate it instead') : undefined}
                      onClick={() => remove.mutate(s.id)}
                      className="rounded-lg border border-danger/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-danger-text disabled:opacity-30"
                    >
                      <Trash2 size={12} />
                    </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      )}

      <p className="flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-xs text-tertiary">
        <Trophy size={14} className="mt-0.5 shrink-0 text-brand" />
        {t('admin.sports.note', 'Each sport is governed by its federation, which maintains how the sport is described. Creating a sport, deleting one and changing how it is competed stay central, because the type reshapes terminology and competition formats across every admin page. A sport with federations, competitions or clubs behind it can be deactivated but not deleted — removing it would orphan everything recorded under it.')}
      </p>
    </div>
  );
};

export default AdminSportsPage;
