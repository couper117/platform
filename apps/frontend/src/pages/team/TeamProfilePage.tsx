import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera, Check, Loader2, Facebook, Instagram, Youtube, Ticket, ShoppingBag, Globe,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { updateMyTeam } from '../../api/endpoints/team';
import useMyTeam from '../../hooks/useMyTeam';
import downscaleImage from '../../utils/downscaleImage';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { Fact } from '../../components/team/TeamUI';
import {
  Button, ClubCrest, ErrorState, Field, Input, Skeleton, StatusPill, cn,
} from '../../components/ui';

/**
 * Club portal → Club profile.
 *
 * THE CLUB'S OWN RECORD, and only the club's. The coach as a person lives on
 * /team/account; the squad lives on /team/players. This page is the organisation:
 * what it is called, where it plays, how to reach it, and where it lives on the
 * rest of the internet.
 *
 * WHAT CHANGED. The page was the last of the pre-redesign club screens — a
 * `font-display uppercase tracking-tighter` heading with `text-red` accents, its
 * own hand-rolled inputs at `rounded-xl` with a `shadow-red/20` save button, and a
 * black status card. It now speaks the same language as the admin and reporter
 * portals: `PageHeader` + `Panel`, sentence case, hairline borders, no resting
 * shadows. Nothing it could do was taken away.
 *
 * WHAT IT DELIBERATELY CANNOT DO. `PUT /teams/:id` reads exactly this list off
 * the body — name, shortName, foundedYear, homeVenue, city, province,
 * description, email, phone, website, socials, and the logo file. `district`,
 * `primaryColor`, `secondaryColor` and `registrationNo` are columns on Team that
 * the controller never reads, so no input for them appears here: a field that
 * silently discards what you typed is worse than a field that is missing.
 *
 * `status`, the sport and league membership are shown, not edited — a coach
 * cannot verify their own club or enter their own competition. They render as
 * facts with a line naming who does change them, rather than as disabled inputs,
 * because a greyed-out control invites a person to hunt for the way to enable it.
 */

/* ── the crest ───────────────────────────────────────────────────────────── */

/** The 8MB multer accepts on this route, mirrored so a doomed upload never starts. */
const MAX_UPLOAD = 8 * 1024 * 1024;

/**
 * A CREST IS NOT AN AVATAR.
 *
 * It renders through `ClubCrest`, not `Avatar`, and that is a decision rather
 * than a detail: round means a person and squared means an organisation
 * throughout this product, so a coach's photograph on /team/account and their
 * club's badge here are shaped differently on purpose. A circular club badge
 * beside a circular face would make a mixed list — scorers beside their clubs —
 * unreadable at a glance.
 *
 * WHERE IT DIFFERS FROM THE REPORTER'S PhotoPanel, which it is otherwise a copy
 * of. A photograph has its own endpoint (`PUT /auth/me/avatar`) so it applies the
 * moment it is chosen. A crest does not: it rides along on the same multipart
 * `PUT /teams/:id` that carries the name and the venue, so it is a pending change
 * like every other field on this page and lands when Save does. The copy says so,
 * because a picture that visibly updated but had not been saved would be a lie.
 *
 * THERE IS NO REMOVE. The controller only replaces the logo when a file is
 * present on the request; it has no path that clears the column. Offering a
 * Remove button that quietly did nothing would be worse than not offering one.
 */
const CrestPanel = ({
  team,
  file,
  onPick,
}: {
  team: any;
  file: File | null;
  onPick: (file: File | null) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  // Downscaling is a decode plus a canvas pass; on a mid-range phone with a 12MP
  // photograph it is long enough to need saying so.
  const [working, setWorking] = useState(false);

  // An object URL is a live handle on a blob; dropping the component without
  // revoking it leaks the whole image for the life of the tab.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const choose = async (picked?: File | null) => {
    setError('');
    if (!picked) return;
    // Both checks are the browser being helpful, not the browser being trusted —
    // multer re-checks the mime type and enforces the same 8MB itself.
    if (!picked.type.startsWith('image/')) {
      setError('That file is not an image.');
      return;
    }
    if (picked.size > MAX_UPLOAD) {
      // Said in megabytes because "8388608 bytes" helps nobody.
      setError('That image is larger than 8MB. Try a smaller one.');
      return;
    }

    setWorking(true);
    try {
      // Shrink BEFORE it is held in state, so what is previewed is exactly what
      // will be sent. A 12MB camera JPEG becomes roughly 40KB of WebP, which is
      // the difference between a moment and a minute on a district ground's
      // mobile connection — and the server resizes to 200x200 regardless.
      const small = await downscaleImage(picked);
      setPreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(small); });
      onPick(small);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Panel
      title="Crest"
      hint="Your badge on fixtures, tables and your public club page."
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative shrink-0">
          {/* Far bigger than the 32px it is used at, because this is the one
              screen where the artwork itself is what is being judged. Spreading
              the team keeps the club's colour resolving while previewing. */}
          <ClubCrest
            team={preview ? { ...team, logo: preview } : team}
            size="lg"
            className={cn('h-20 w-20 rounded-card text-xl', working && 'opacity-50')}
          />
          {working && (
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
              disabled={working}
              onClick={() => inputRef.current?.click()}
            >
              {team?.logo || file ? 'Change crest' : 'Add a crest'}
            </Button>
          </div>
          <p className="text-xs text-tertiary">
            {file
              ? 'Chosen. It is uploaded when you save this page.'
              : 'JPG, PNG or WebP. Large images are shrunk on this device before they are sent.'}
          </p>
        </div>
      </div>

      {/* The input is the real control; the button above only clicks it. A styled
          `<label>` would work too, but a button keeps the disabled state honest
          while the downscale is running. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Choose a crest"
        onChange={(e) => {
          choose(e.target.files?.[0]);
          // Reset, so choosing the SAME file again still fires a change event —
          // which is exactly what someone does after a rejected file.
          e.target.value = '';
        }}
      />

      {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger-text">{error}</p>}
    </Panel>
  );
};

/* ── the club's links ────────────────────────────────────────────────────── */

/**
 * The same six networks as components/admin/TeamSocialsModal, so an admin and a
 * coach editing the same club see the same list. The server accepts a seventh
 * (`tiktok`) that neither surface offers yet; adding it here alone would put a
 * link on the public page that an admin could not then see or correct.
 */
const NETWORKS = [
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/…' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/…' },
  { key: 'x', label: 'X', icon: Globe, placeholder: 'https://x.com/…' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@…' },
  { key: 'tickets', label: 'Tickets', icon: Ticket, placeholder: 'https://…' },
  { key: 'store', label: 'Store', icon: ShoppingBag, placeholder: 'https://…' },
];

/**
 * Mirrors the server's own rule. `cleanSocials` keeps only values matching
 * `^https?://` and drops the rest in silence, so without this check a coach types
 * "facebook.com/ourclub", saves, sees no error, and finds the link gone. The
 * server keeps its check — this one only makes the rejection visible where it
 * can still be fixed.
 */
const isUrl = (v: string) => !v.trim() || /^https?:\/\//i.test(v.trim());

/* ── the page ────────────────────────────────────────────────────────────── */

const EMPTY = {
  name: '', shortName: '', foundedYear: '', homeVenue: '', city: '', province: '',
  description: '', email: '', phone: '', website: '',
};

const TeamProfilePage = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: team, isLoading, isError, refetch } = useMyTeam();

  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);

  // Seed once, and never again: re-seeding whenever the query refetches — and it
  // refetches on window focus — would wipe whatever is half-typed.
  useEffect(() => {
    if (!team || form) return;
    setForm({
      name: team.name || '',
      shortName: team.shortName || '',
      foundedYear: team.foundedYear ?? '',
      homeVenue: team.homeVenue || '',
      city: team.city || '',
      province: team.province || '',
      description: team.description || '',
      email: team.email || '',
      phone: team.phone || '',
      website: team.website || '',
    });
    const s = team.socials || {};
    setSocials(Object.fromEntries(NETWORKS.map((n) => [n.key, s[n.key] || ''])));
  }, [team, form]);

  const save = useMutation({
    mutationFn: () =>
      updateMyTeam(
        team.id,
        {
          ...form,
          // `foundedYear ? parseInt(…) : undefined` on the server means an empty
          // string is a no-op rather than a clear — so send it only when it has a
          // value, and never pretend a year can be removed here.
          foundedYear: form?.foundedYear === '' ? undefined : form?.foundedYear,
          // One JSON field, because multipart has no nested objects. Always sent,
          // so emptying a box really does remove that link.
          socials: JSON.stringify(socials),
        },
        logo
      ),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setLogo(null);
      // Five club screens read this one query; the crest in particular is in the
      // sidebar and on every fixture row.
      qc.invalidateQueries({ queryKey: ['team-my'] });
    },
  });

  const header = (
    <PageHeader
      title="Club profile"
      subtitle="Your club's own record — the name, the ground and the links that appear on its public page."
    />
  );

  // `!form` covers the frame between the club arriving and the seeding effect
  // running, so the page never flashes an empty form on its way in.
  if (isLoading || (!isError && !form)) {
    return (
      <div>
        {header}
        <div role="status" aria-busy="true" aria-live="polite" className="max-w-3xl space-y-4">
          <span className="sr-only">{t('common.loading')}</span>
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-80 w-full rounded-card" />
          <Skeleton className="h-56 w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div>
        {header}
        <ErrorState
          title="Could not load your club"
          hint="Check your connection and try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!form) return null;

  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const badUrls = [form.website, ...Object.values(socials)].some((v) => !isUrl(v || ''));
  const canSave = form.name.trim().length > 0 && !badUrls && !save.isPending;

  const leagues = (team.leagues || [])
    .map((entry: any) => entry?.league?.name)
    .filter(Boolean);

  return (
    <div>
      {header}

      <form
        className="max-w-3xl space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) save.mutate();
        }}
      >
        <CrestPanel team={team} file={logo} onPick={setLogo} />

        <Panel title="Club details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Club name"
              required
              error={form.name.trim() ? undefined : 'A club needs a name.'}
              className="sm:col-span-2"
            >
              {(p: any) => (
                <Input {...p} value={form.name} onChange={(e: any) => set('name', e.target.value)} />
              )}
            </Field>

            <Field label="Short code" hint="Up to 10 characters. Used where a full name will not fit.">
              {(p: any) => (
                <Input
                  {...p}
                  maxLength={10}
                  placeholder="e.g. APR"
                  value={form.shortName}
                  onChange={(e: any) => set('shortName', e.target.value)}
                />
              )}
            </Field>

            <Field label="Founded" hint="Once set, a league admin has to clear it.">
              {(p: any) => (
                <Input
                  {...p}
                  type="number"
                  min={1850}
                  max={new Date().getFullYear()}
                  placeholder="1963"
                  value={form.foundedYear}
                  onChange={(e: any) => set('foundedYear', e.target.value)}
                  className="tabular-nums"
                />
              )}
            </Field>

            <Field label="Home ground" className="sm:col-span-2">
              {(p: any) => (
                <Input
                  {...p}
                  placeholder="e.g. Kigali Pele Stadium"
                  value={form.homeVenue}
                  onChange={(e: any) => set('homeVenue', e.target.value)}
                />
              )}
            </Field>

            <Field label="City">
              {(p: any) => (
                <Input {...p} placeholder="Kigali" value={form.city} onChange={(e: any) => set('city', e.target.value)} />
              )}
            </Field>

            <Field label="Province">
              {(p: any) => (
                <Input {...p} placeholder="Kigali City" value={form.province} onChange={(e: any) => set('province', e.target.value)} />
              )}
            </Field>

            <Field label="Contact email" hint="How a league admin reaches the club, not you personally.">
              {(p: any) => (
                <Input
                  {...p}
                  type="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(e: any) => set('email', e.target.value)}
                />
              )}
            </Field>

            <Field label="Phone">
              {(p: any) => (
                <Input
                  {...p}
                  type="tel"
                  inputMode="tel"
                  placeholder="+250 …"
                  value={form.phone}
                  onChange={(e: any) => set('phone', e.target.value)}
                  className="tabular-nums"
                />
              )}
            </Field>

            <Field label="About the club" className="sm:col-span-2">
              {(p: any) => (
                <textarea
                  {...p}
                  rows={4}
                  value={form.description}
                  onChange={(e: any) => set('description', e.target.value)}
                  className="w-full rounded-input border border-hairline bg-surface px-4 py-3 text-primary transition-colors duration-150 ease-standard placeholder:text-tertiary hover:border-brand/40 focus:border-brand focus:outline-none"
                />
              )}
            </Field>
          </div>
        </Panel>

        <Panel
          title="Links"
          hint="These appear on your public club page. Clear a box to remove that link."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('team.official_site')}
              error={isUrl(form.website) ? undefined : 'Must start with http:// or https://'}
              className="sm:col-span-2"
            >
              {(p: any) => (
                <Input
                  {...p}
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={form.website}
                  onChange={(e: any) => set('website', e.target.value)}
                />
              )}
            </Field>

            {NETWORKS.map((n) => (
              <Field
                key={n.key}
                label={
                  <span className="flex items-center gap-1.5">
                    <n.icon size={13} className="text-tertiary" aria-hidden="true" />
                    {n.label}
                  </span>
                }
                error={isUrl(socials[n.key] || '') ? undefined : 'Must start with http:// or https://'}
              >
                {(p: any) => (
                  <Input
                    {...p}
                    type="url"
                    inputMode="url"
                    placeholder={n.placeholder}
                    value={socials[n.key] || ''}
                    onChange={(e: any) => setSocials((s) => ({ ...s, [n.key]: e.target.value }))}
                  />
                )}
              </Field>
            ))}
          </div>
        </Panel>

        {/* The save row sits directly under the last thing it saves rather than in
            the header: on a 360px screen the header has scrolled away long before
            anyone finishes typing, and a button you cannot see is a form people
            leave unsaved. */}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={save.isPending} disabled={!canSave}>
            {save.isPending ? 'Saving' : 'Save changes'}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text">
              <Check size={13} aria-hidden="true" /> Saved
            </span>
          )}
          {save.isError && (
            <span role="alert" className="text-sm font-semibold text-danger-text">
              {(save.error as any)?.response?.data?.message || 'Could not save your club. Check your connection and try again.'}
            </span>
          )}
        </div>
      </form>

      {/* ── what the club cannot change about itself ───────────────────────── */}
      <Panel
        title="Set by the league"
        hint="A league admin changes these. Ask yours if something here is wrong."
        className="mt-4 max-w-3xl"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Fact label="Status" value={<StatusPill status={team.status} />} />
          <Fact label="Sport" value={team.sport?.name} />
          <Fact
            label="Competitions"
            value={leagues.length ? leagues.join(' · ') : 'Not entered in one yet'}
          />
        </div>
        {team.status !== 'VERIFIED' && (
          <p className="mt-4 text-sm text-secondary">
            A club is verified once its athletes' documents are approved. Until then it cannot
            be entered into official competition.
          </p>
        )}
      </Panel>
    </div>
  );
};

export default TeamProfilePage;
