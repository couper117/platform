import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Trophy, Plus, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  Button, IconButton, Input, Select, Field, StatusPill, EmptyState, Skeleton, SkeletonList, cn,
} from '../../components/ui';
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
 *
 * Presentation comes from the admin kit (PageHeader / Panel / TableWrap) and the
 * design-system primitives — nothing on this page invents a card, a heading or a
 * table shell of its own.
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
    <div>
      <PageHeader
        title={`${t('admin.sports.title', 'Sports')} ${t('admin.sports.title_accent', 'Management')}`}
        subtitle={t('admin.sports.subtitle', 'Every sport the platform runs, and how each one is competed')}
        actions={central && (
          <Button size="sm" icon={Plus} onClick={() => { setForm({ ...blank }); setError(''); }}>
            {t('admin.sports.add', 'Add a sport')}
          </Button>
        )}
      />

      {form && (
        <Panel className="mb-4">
          <div className="space-y-4">
            {!central && (
              <p className="rounded-control bg-surface-2 p-3 text-xs text-tertiary">
                {t('admin.sports.federation_scope',
                   'You maintain how your federation’s sport is described. Its name, category and how it is competed are set centrally.')}
              </p>
            )}

            <div className={cn('grid gap-4 sm:grid-cols-2', !central && 'hidden')}>
              <Field label={t('admin.sports.name', 'Name')}>
                {(p) => (
                  <Input
                    {...p}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Basketball"
                  />
                )}
              </Field>
              <Field label={t('admin.sports.category', 'Category')}>
                {(p) => (
                  <Select
                    {...p}
                    size="md"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  />
                )}
              </Field>
            </div>

            <div className={central ? '' : 'hidden'}>
              <p className="text-sm font-bold text-primary">
                {t('admin.sports.type', 'How it is competed')}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {TYPES.map((key) => {
                  const p = SPORT_PROFILES[key];
                  const on = form.type === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setForm({ ...form, type: key })}
                      className={cn(
                        'rounded-control border p-3 text-left transition-colors duration-150 ease-standard',
                        on ? 'border-brand bg-brand-tint' : 'border-hairline hover:border-brand/40'
                      )}
                    >
                      <p className={cn('text-sm font-semibold', on ? 'text-brand-text' : 'text-primary')}>{p.label}</p>
                      <p className="mt-0.5 text-xs text-tertiary">{p.competitorPlural} · {p.rosterPlural}</p>
                    </button>
                  );
                })}
              </div>
              {/* What the choice actually changes, so it is not four enum values to guess at. */}
              {profile && (
                <p className="mt-2 rounded-control bg-surface-2 p-3 text-xs text-tertiary">
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
              <Field label={t('admin.sports.order', 'Sort order')}>
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  />
                )}
              </Field>
              <Field label={t('admin.sports.description', 'Description')}>
                {(p) => (
                  <Input
                    {...p}
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                )}
              </Field>
            </div>

            {error && <p role="alert" className="text-xs font-semibold text-danger-text">{error}</p>}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={save.isPending || (central && form.name.trim().length < 2)}
                onClick={() => save.mutate(central ? form : { id: form.id, description: form.description, icon: form.icon })}
              >
                {save.isPending ? t('common.saving', 'Saving') : t('common.save', 'Save')}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setForm(null); setError(''); }}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
            </div>
          </div>
        </Panel>
      )}

      <Panel flush>
        {isLoading ? (
          <div className="p-4">
            <SkeletonList count={5} className="space-y-3">
              <Skeleton className="h-10 w-full" />
            </SkeletonList>
          </div>
        ) : sports.length === 0 ? (
          <EmptyState icon={Trophy} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr>
                  <Th>{t('admin.sports.col_sport', 'Sport / governing federation')}</Th>
                  <Th>{t('admin.sports.col_type', 'Competed as')}</Th>
                  <Th>{t('admin.sports.col_usage', 'In use')}</Th>
                  <Th>{t('admin.col_status', 'Status')}</Th>
                  <Th align="right" />
                </tr>
              </thead>
              <tbody>
                {sports.map((s: any) => {
                  const p = SPORT_PROFILES[s.type] || SPORT_PROFILES.TEAM;
                  // A sport with competitions or clubs behind it cannot simply be
                  // deleted — say so on the button rather than after the click.
                  const inUse = (s._count?.leagues || 0) + (s._count?.teams || 0) + (s._count?.federations || 0);
                  return (
                    <tr key={s.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                      <Td>
                        <p className="text-sm font-medium text-primary">{s.icon} {s.name}</p>
                        {/* A sport is governed by its federation — naming it here is
                            the difference between a registry and a list of who is
                            responsible for what. */}
                        <p className="text-xs text-tertiary">
                          {s.federations?.length
                            ? s.federations.map((f: any) => f.abbreviation || f.name).join(', ')
                            : t('admin.sports.no_federation', 'No federation yet')}
                          {' · '}{s.category}
                        </p>
                      </Td>
                      <Td>{p.label}</Td>
                      <Td className="text-xs tabular-nums text-tertiary">
                        {s._count?.federations || 0} fed · {s._count?.leagues || 0} comp · {s._count?.teams || 0} club · {s._count?.matches || 0} match
                      </Td>
                      <Td>
                        <StatusPill
                          status={s.active ? 'ACTIVE' : 'INACTIVE'}
                          label={s.active ? t('admin.users.active', 'Active') : t('admin.users.inactive', 'Inactive')}
                        />
                      </Td>
                      <Td align="right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => { setForm({ ...s }); setError(''); }}
                          >
                            {t('common.edit', 'Edit')}
                          </Button>
                          {central && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => save.mutate({ ...s, active: !s.active })}
                            >
                              {s.active ? t('admin.sports.deactivate', 'Deactivate') : t('admin.sports.activate', 'Activate')}
                            </Button>
                          )}
                          {central && (
                            <IconButton
                              icon={Trash2}
                              size="sm"
                              variant="danger"
                              disabled={inUse > 0 || remove.isPending}
                              {...(inUse > 0
                                ? { title: t('admin.sports.in_use', 'Has federations, competitions or clubs — deactivate it instead') }
                                : {})}
                              onClick={() => remove.mutate(s.id)}
                              label={t('admin.sports.delete_sport', 'Delete {{name}}', { name: s.name })}
                            />
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      <p className="mt-4 flex items-start gap-2 rounded-card bg-surface-2 p-3 text-xs text-tertiary">
        <Trophy size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
        {t('admin.sports.note', 'Each sport is governed by its federation, which maintains how the sport is described. Creating a sport, deleting one and changing how it is competed stay central, because the type reshapes terminology and competition formats across every admin page. A sport with federations, competitions or clubs behind it can be deactivated but not deleted — removing it would orphan everything recorded under it.')}
      </p>
    </div>
  );
};

export default AdminSportsPage;
