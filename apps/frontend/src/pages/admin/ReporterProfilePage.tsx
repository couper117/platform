import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserSquare2, MapPin, Radio, CalendarClock, Check } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { Button, ErrorState, Field, Input, Skeleton, cn } from '../../components/ui';

/**
 * Reporter → My Profile.
 *
 * What a reporter covers, where they are, and whether they are free. A league
 * admin choosing who to send to a match had none of this: assigning someone
 * meant knowing their email address and typing it in, with no way to see that
 * they cover cycling rather than football, or that they are already out on
 * another match. This is the half of that the reporter owns.
 */
const AVAILABILITY = [
  { value: 'AVAILABLE', labelKey: 'reporter.available', fallback: 'Available' },
  { value: 'BUSY', labelKey: 'reporter.busy', fallback: 'Busy' },
  { value: 'UNAVAILABLE', labelKey: 'reporter.unavailable', fallback: 'Unavailable' },
];

const ReporterProfilePage = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reporter-me'],
    queryFn: async () => (await apiClient.get('/reporters/me')).data.data,
  });

  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => (await apiClient.get('/sports')).data.data,
    staleTime: 10 * 60 * 1000,
  });

  // Seed the form once the profile arrives, and never again — re-seeding on
  // every render would wipe whatever is being typed.
  useEffect(() => {
    if (data && !form) {
      setForm({
        sportIds: data.sportIds || [],
        location: data.location || '',
        bio: data.bio || '',
        yearsActive: data.yearsActive ?? '',
        availability: data.availability || 'AVAILABLE',
        busyUntil: data.busyUntil ? data.busyUntil.slice(0, 16) : '',
      });
    }
  }, [data, form]);

  const save = useMutation({
    mutationFn: (payload: any) => apiClient.put('/reporters/me', payload),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      qc.invalidateQueries({ queryKey: ['reporter-me'] });
    },
  });

  const header = (
    <PageHeader
      title={`${t('reporter.profile_title', 'My')} ${t('reporter.profile_accent', 'Profile')}`}
      subtitle={t('reporter.profile_subtitle', 'What you cover, and whether you are free')}
    />
  );

  if (isLoading || !form) {
    return (
      <div>
        {header}
        <div role="status" aria-busy="true" aria-live="polite" className="grid gap-4 lg:grid-cols-3">
          <span className="sr-only">{t('common.loading')}</span>
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-32 w-full rounded-card" />
            <Skeleton className="h-40 w-full rounded-card" />
            <Skeleton className="h-56 w-full rounded-card" />
          </div>
          <Skeleton className="h-48 w-full rounded-card" />
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div>
        {header}
        <ErrorState title={t('admin.users.load_error', 'Could not load')} />
      </div>
    );
  }

  const toggleSport = (id: number) =>
    setForm((f: any) => ({
      ...f,
      sportIds: f.sportIds.includes(id) ? f.sportIds.filter((s: number) => s !== id) : [...f.sportIds, id],
    }));

  const upcoming = (data.assignments || []).filter((a: any) => a.fixture);

  return (
    <div>
      {header}

      <form
        className="grid items-start gap-4 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({
            ...form,
            yearsActive: form.yearsActive === '' ? null : Number(form.yearsActive),
            busyUntil: form.availability === 'BUSY' && form.busyUntil ? new Date(form.busyUntil).toISOString() : null,
          });
        }}
      >
        <div className="space-y-4 lg:col-span-2">
          {/* Availability first: it is the field that changes most often and the
              one a league admin is actually reading. */}
          <Panel
            title={
              <span className="flex items-center gap-2">
                <Radio size={15} className="text-brand-text" aria-hidden="true" />
                {t('reporter.availability', 'Availability')}
              </span>
            }
          >
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setForm((f: any) => ({ ...f, availability: a.value }))}
                  aria-pressed={form.availability === a.value}
                  className={cn(
                    'min-h-9 rounded-pill border px-3 text-sm font-semibold transition-colors duration-150 ease-standard',
                    form.availability === a.value
                      ? 'border-brand bg-brand-tint text-brand-text'
                      : 'border-hairline text-secondary hover:bg-surface-2 hover:text-primary'
                  )}
                >
                  {t(a.labelKey, a.fallback)}
                </button>
              ))}
            </div>
            {form.availability === 'BUSY' && (
              <Field label={t('reporter.free_again', 'Free again')} className="mt-4 max-w-xs">
                {(p) => (
                  <Input
                    {...p}
                    type="datetime-local"
                    value={form.busyUntil}
                    onChange={(e) => setForm((f: any) => ({ ...f, busyUntil: e.target.value }))}
                  />
                )}
              </Field>
            )}
          </Panel>

          <Panel
            title={t('reporter.sports_covered', 'Sports you cover')}
            hint={t('reporter.sports_hint', 'Leave empty if you will cover anything.')}
          >
            <div className="flex flex-wrap gap-1.5">
              {(sports || []).map((s: any) => {
                const on = form.sportIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSport(s.id)}
                    aria-pressed={on}
                    className={cn(
                      'inline-flex min-h-9 items-center gap-1 rounded-pill border px-3 text-sm font-medium transition-colors duration-150 ease-standard',
                      on
                        ? 'border-brand bg-brand-tint text-brand-text'
                        : 'border-hairline text-secondary hover:bg-surface-2 hover:text-primary'
                    )}
                  >
                    {on && <Check size={12} aria-hidden="true" />}
                    {s.name}
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('reporter.location', 'Based in')}>
                {(p) => (
                  <Input
                    {...p}
                    value={form.location}
                    onChange={(e) => setForm((f: any) => ({ ...f, location: e.target.value }))}
                    placeholder="Kigali"
                  />
                )}
              </Field>
              <Field label={t('reporter.years_active', 'Years reporting')}>
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    min={0}
                    max={80}
                    value={form.yearsActive}
                    onChange={(e) => setForm((f: any) => ({ ...f, yearsActive: e.target.value }))}
                    className="tabular-nums"
                  />
                )}
              </Field>
              <Field label={t('reporter.bio', 'About you')} className="sm:col-span-2">
                {(p) => (
                  <textarea
                    {...p}
                    rows={3}
                    value={form.bio}
                    onChange={(e) => setForm((f: any) => ({ ...f, bio: e.target.value }))}
                    className="w-full rounded-input border border-hairline bg-surface px-4 py-3 text-primary transition-colors duration-150 ease-standard placeholder:text-tertiary hover:border-brand/40 focus:border-brand focus:outline-none"
                  />
                )}
              </Field>
            </div>
          </Panel>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" loading={save.isPending}>
              {save.isPending ? t('common.saving', 'Saving') : t('common.save', 'Save')}
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text">
                <Check size={13} aria-hidden="true" /> {t('common.saved', 'Saved')}
              </span>
            )}
            {save.isError && (
              <span role="alert" className="text-sm font-semibold text-danger-text">
                {(save.error as any)?.response?.data?.message || t('common.error', 'Something went wrong')}
              </span>
            )}
          </div>
        </div>

        {/* What they are down for — the question a reporter opens this page with. */}
        <aside className="space-y-4">
          <Panel
            title={
              <span className="flex items-center gap-2">
                <CalendarClock size={15} className="text-brand-text" aria-hidden="true" />
                {t('reporter.my_matches', 'My matches')}
              </span>
            }
          >
            {upcoming.length === 0 ? (
              <p className="py-2 text-sm text-tertiary">
                {t('reporter.no_matches', 'Nothing assigned to you yet.')}
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((a: any) => (
                  <li key={a.id} className="rounded-control border border-hairline bg-surface-2 p-3">
                    <p className="text-sm font-medium text-primary">
                      {a.fixture.homeTeam?.name} v {a.fixture.awayTeam?.name}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-tertiary">
                      {a.fixture.matchDate && (
                        <span className="tabular-nums">{format(new Date(a.fixture.matchDate), 'EEE d MMM, HH:mm')}</span>
                      )}
                      <span>·</span>
                      <span>{a.fixture.status}</span>
                    </p>
                    {a.league?.name && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-tertiary">
                        <MapPin size={10} aria-hidden="true" /> {a.league.name}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {data.hasProfile === false && (
            <p className="flex items-start gap-2 rounded-card border border-hairline bg-surface-2 p-3 text-sm text-secondary">
              <UserSquare2 size={15} className="mt-0.5 shrink-0 text-brand-text" aria-hidden="true" />
              {t('reporter.no_profile_hint', 'You have not filled this in yet. Until you do, league admins cannot tell what you cover or whether you are free.')}
            </p>
          )}
        </aside>
      </form>
    </div>
  );
};

export default ReporterProfilePage;
