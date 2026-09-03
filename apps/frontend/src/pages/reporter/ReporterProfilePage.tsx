import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  UserSquare2, MapPin, Radio, CalendarClock, Check, Camera, Trash2, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import { uploadMyAvatar, removeMyAvatar } from '../../api/endpoints/reporter';
import downscaleImage from '../../utils/downscaleImage';
import useAuthStore from '../../store/authStore';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { Avatar, Button, ErrorState, Field, Input, Skeleton, cn } from '../../components/ui';

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

/* ── the reporter's photograph ───────────────────────────────────────────── */

/** The 8MB the server accepts, mirrored here so a doomed upload never starts. */
const MAX_UPLOAD = 8 * 1024 * 1024;

/**
 * ONE CONTROL, AND IT APPLIES IMMEDIATELY.
 *
 * The rest of this page is a form: type, then Save. A photograph is not — it is
 * chosen from a picker in one gesture, and there is nothing to review afterwards
 * that looking at it does not already tell you. So it uploads on selection and
 * says so, rather than sitting as an unsaved change the reporter has to remember
 * to commit alongside their availability.
 *
 * WHY IT IS WORTH HAVING AT ALL. `User.avatar` was read in three places and
 * written in none: the directory a league admin picks reporters from, the
 * "reported by" credit on the public match page, and this portal's own account
 * menu. Every reporter was a permanent set of initials — including on the page
 * crediting them for ninety minutes of work.
 *
 * THE PHOTO IS SHRUNK BEFORE IT IS SENT. A phone camera produces 3–12MB; the
 * avatar is rendered at 40px. `downscaleImage` makes that roughly 40KB of WebP
 * in the browser, which matters on a mobile connection and also means the common
 * "photo too large" failure mostly stops happening.
 */
const PhotoPanel = ({ user, name }: { user: any; name: string }) => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const syncUser = useAuthStore((s) => s.syncUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  // The chosen file, shown while it uploads. Without it the avatar keeps the old
  // photograph for as long as the request takes, which on 3G reads as a tap that
  // did nothing.
  const [preview, setPreview] = useState<string | null>(null);

  // An object URL is a live handle on a blob; dropping the component without
  // revoking it leaks the whole image for the life of the tab.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const clearPreview = () => setPreview((url) => { if (url) URL.revokeObjectURL(url); return null; });

  const settle = async () => {
    // The photo lives on the User, so the account menu and the sidebar read it
    // from the auth store rather than from this query. Both have to be told.
    await syncUser();
    qc.invalidateQueries({ queryKey: ['reporter-me'] });
    clearPreview();
  };

  const upload = useMutation({
    mutationFn: async (file: File) => uploadMyAvatar(await downscaleImage(file)),
    onSuccess: settle,
    onError: (e: any) => {
      clearPreview();
      setError(e?.response?.data?.message || t('reporter.photo_failed', 'Could not upload that photo. Check your connection and try again.'));
    },
  });

  const remove = useMutation({
    mutationFn: removeMyAvatar,
    onSuccess: settle,
    onError: (e: any) => setError(e?.response?.data?.message || t('reporter.photo_remove_failed', 'Could not remove the photo.')),
  });

  const busy = upload.isPending || remove.isPending;

  const choose = (file?: File | null) => {
    setError('');
    if (!file) return;
    // Both checks are the browser being helpful, not the browser being trusted —
    // the server re-checks the type and enforces the same limit.
    if (!file.type.startsWith('image/')) {
      return setError(t('reporter.photo_not_image', 'That file is not an image.'));
    }
    if (file.size > MAX_UPLOAD) {
      // Only reachable when downscaling cannot run at all; it normally lands far
      // under this. Said in megabytes because "8388608 bytes" helps nobody.
      return setError(t('reporter.photo_too_large', 'That photo is larger than 8MB. Try a smaller one.'));
    }
    setPreview(URL.createObjectURL(file));
    upload.mutate(file);
  };

  const src = preview || (user?.avatar as string | undefined);

  return (
    <Panel
      title={t('reporter.photo', 'Photo')}
      hint={t('reporter.photo_hint', 'League admins pick reporters from a directory, and the match page credits you by name. A face makes both easier to read.')}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative shrink-0">
          {/* Bigger than the 40px it is used at, because this is the one screen
              where the reporter is judging the photograph itself. */}
          <Avatar
            src={src}
            name={name}
            size="lg"
            className={cn('h-20 w-20 text-xl', busy && 'opacity-50')}
          />
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <Loader2 size={20} className="animate-spin text-brand-text" />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              icon={Camera}
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {user?.avatar
                ? t('reporter.photo_change', 'Change photo')
                : t('reporter.photo_add', 'Add a photo')}
            </Button>
            {user?.avatar && (
              <Button
                type="button"
                variant="ghost"
                icon={Trash2}
                disabled={busy}
                onClick={() => remove.mutate()}
                className="text-danger-text hover:bg-danger/10 hover:text-danger-text"
              >
                {t('common.remove', 'Remove')}
              </Button>
            )}
          </div>
          <p className="text-xs text-tertiary">
            {t('reporter.photo_formats', 'JPG, PNG or WebP. Large photos are shrunk on this device before they are sent.')}
          </p>
        </div>
      </div>

      {/* The input is the real control; the button above only clicks it. A styled
          `<label>` would work too, but a button keeps the disabled state honest
          while an upload is in flight. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={t('reporter.photo_add', 'Add a photo')}
        onChange={(e) => {
          choose(e.target.files?.[0]);
          // Reset, so choosing the SAME file again still fires a change event —
          // which is exactly what someone does after a failed upload.
          e.target.value = '';
        }}
      />

      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-danger-text">{error}</p>
      )}
    </Panel>
  );
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

  // One title, not two halves. The `title` + `accent` pair is a leftover of the
  // old two-tone heading, and split across an i18n boundary it produced "My
  // Profile" in English and word salad anywhere the two languages order those
  // words differently.
  const header = (
    <PageHeader
      title={t('portal.nav_my_profile')}
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
          {/* The photograph sits above the form but is not part of it: it saves
              on selection, so it cannot be left unsaved by someone who came here
              only to flip their availability and then left. */}
          <PhotoPanel user={data} name={String(data?.fullName || '')} />

          {/* Availability first among the FIELDS: it is the one that changes most
              often and the one a league admin is actually reading. */}
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
            <Button type="submit" loading={save.isPending}>
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
