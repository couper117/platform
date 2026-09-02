import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserSquare2, MapPin, Radio, CalendarClock, Check } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import { Skeleton } from '../../components/ui';

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

const TONE = {
  AVAILABLE: 'border-brand bg-brand text-white',
  BUSY: 'border-gold bg-gold/15 text-primary',
  UNAVAILABLE: 'border-hairline bg-surface-2 text-tertiary',
};

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

  if (isLoading || !form) return <Skeleton type="card" count={3} />;
  if (isError) {
    return (
      <div className="py-16 text-center opacity-50 font-display uppercase tracking-widest">
        {t('admin.users.load_error', 'Could not load')}
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">
          {t('reporter.profile_title', 'My')} <span className="text-red">{t('reporter.profile_accent', 'Profile')}</span>
        </h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">
          {t('reporter.profile_subtitle', 'What you cover, and whether you are free')}
        </p>
      </div>

      <form
        className="grid gap-6 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({
            ...form,
            yearsActive: form.yearsActive === '' ? null : Number(form.yearsActive),
            busyUntil: form.availability === 'BUSY' && form.busyUntil ? new Date(form.busyUntil).toISOString() : null,
          });
        }}
      >
        <div className="space-y-6 lg:col-span-2">
          {/* Availability first: it is the field that changes most often and the
              one a league admin is actually reading. */}
          <section className="rounded-2xl border border-hairline bg-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
              <Radio size={15} className="text-brand" /> {t('reporter.availability', 'Availability')}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {AVAILABILITY.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setForm((f: any) => ({ ...f, availability: a.value }))}
                  className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    form.availability === a.value ? TONE[a.value] : 'border-hairline text-tertiary hover:text-primary'
                  }`}
                >
                  {t(a.labelKey, a.fallback)}
                </button>
              ))}
            </div>
            {form.availability === 'BUSY' && (
              <label className="mt-4 block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">
                  {t('reporter.free_again', 'Free again')}
                </span>
                <input
                  type="datetime-local"
                  value={form.busyUntil}
                  onChange={(e) => setForm((f: any) => ({ ...f, busyUntil: e.target.value }))}
                  className="mt-1 w-full max-w-xs rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-primary outline-none focus-visible:border-brand"
                />
              </label>
            )}
          </section>

          <section className="rounded-2xl border border-hairline bg-surface p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
              {t('reporter.sports_covered', 'Sports you cover')}
            </h2>
            <p className="mt-1 text-xs text-tertiary">
              {t('reporter.sports_hint', 'Leave empty if you will cover anything.')}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(sports || []).map((s: any) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSport(s.id)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    form.sportIds.includes(s.id)
                      ? 'border-brand bg-brand/15 text-brand-text'
                      : 'border-dashed border-hairline text-tertiary/70'
                  }`}
                >
                  {form.sportIds.includes(s.id) && <Check size={10} className="mr-1 inline" />}
                  {s.name}
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 rounded-2xl border border-hairline bg-surface p-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">
                {t('reporter.location', 'Based in')}
              </span>
              <input
                value={form.location}
                onChange={(e) => setForm((f: any) => ({ ...f, location: e.target.value }))}
                placeholder="Kigali"
                className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-primary outline-none focus-visible:border-brand"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">
                {t('reporter.years_active', 'Years reporting')}
              </span>
              <input
                type="number"
                min={0}
                max={80}
                value={form.yearsActive}
                onChange={(e) => setForm((f: any) => ({ ...f, yearsActive: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-primary outline-none focus-visible:border-brand"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">
                {t('reporter.bio', 'About you')}
              </span>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm((f: any) => ({ ...f, bio: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-primary outline-none focus-visible:border-brand"
              />
            </label>
          </section>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-lg bg-brand px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white disabled:opacity-40"
            >
              {save.isPending ? t('common.saving', 'Saving') : t('common.save', 'Save')}
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-text">
                <Check size={13} /> {t('common.saved', 'Saved')}
              </span>
            )}
            {save.isError && (
              <span className="text-xs text-danger-text">
                {(save.error as any)?.response?.data?.message || t('common.error', 'Something went wrong')}
              </span>
            )}
          </div>
        </div>

        {/* What they are down for — the question a reporter opens this page with. */}
        <aside className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
            <CalendarClock size={15} className="text-brand" /> {t('reporter.my_matches', 'My matches')}
          </h2>
          {upcoming.length === 0 ? (
            <p className="rounded-xl border border-dashed border-hairline p-4 text-xs text-tertiary">
              {t('reporter.no_matches', 'Nothing assigned to you yet.')}
            </p>
          ) : (
            upcoming.map((a: any) => (
              <div key={a.id} className="rounded-xl border border-hairline bg-surface p-3">
                <p className="text-sm font-semibold text-primary">
                  {a.fixture.homeTeam?.name} v {a.fixture.awayTeam?.name}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-tertiary">
                  {a.fixture.matchDate && <span className="tabular-nums">{format(new Date(a.fixture.matchDate), 'EEE d MMM, HH:mm')}</span>}
                  <span>·</span>
                  <span>{a.fixture.status}</span>
                </p>
                {a.league?.name && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-tertiary">
                    <MapPin size={10} /> {a.league.name}
                  </p>
                )}
              </div>
            ))
          )}
          {data.hasProfile === false && (
            <p className="flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-xs text-tertiary">
              <UserSquare2 size={14} className="mt-0.5 shrink-0 text-brand" />
              {t('reporter.no_profile_hint', 'You have not filled this in yet. Until you do, league admins cannot tell what you cover or whether you are free.')}
            </p>
          )}
        </aside>
      </form>
    </div>
  );
};

export default ReporterProfilePage;
