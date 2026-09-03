import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Camera, Trash2, Loader2, ChevronRight, Shield, Users } from 'lucide-react';
import { uploadMyAvatar, removeMyAvatar } from '../../api/endpoints/account';
import downscaleImage from '../../utils/downscaleImage';
import useAuthStore from '../../store/authStore';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { Fact } from '../../components/team/TeamUI';
import { Avatar, Button, cn } from '../../components/ui';

/**
 * Club portal → My account.
 *
 * THE COACH AS A PERSON, which is a different record from the club. /team/profile
 * edits `Team`; this edits `User`. Keeping them apart matters because the two are
 * constantly confused: a coach who wants to change "our email" means the club's
 * contact address, and one who wants to change "my photo" means the face on the
 * account menu. Two pages, and each says which it is.
 *
 * IT IS DELIBERATELY SMALL, and honest about why. Exactly one thing on this
 * screen can be changed from here, because exactly one endpoint exists for an
 * account to write about itself: `PUT`/`DELETE /auth/me/avatar`. There is no
 * endpoint for an account to change its own name, username, email or phone — so
 * those are facts with a line naming who does change them, not disabled inputs
 * that would have a coach hunting for the way to enable them.
 */

/** The 8MB the server accepts, mirrored here so a doomed upload never starts. */
const MAX_UPLOAD = 8 * 1024 * 1024;

/**
 * THE SAME CONTROL AS THE REPORTER'S, ON PURPOSE.
 *
 * `User.avatar` belongs to the account, not to a role — which is why the endpoint
 * lives in api/endpoints/account.ts and not in reporter.ts, where it first
 * shipped behind `reporters.profile` and so said in effect that only a match
 * reporter may have a face. Two portals, one behaviour: choose a photo and it
 * applies, because there is nothing to review afterwards that looking at it does
 * not already tell you, and nothing else on this page to save it alongside.
 *
 * WHY IT IS WORTH HAVING HERE. A coach's photograph is read in the club's own
 * account menu and sidebar, and on the team sheet author line a reporter sees —
 * the same place a coach reads a reporter's face on their own fixture page. Until
 * it could be written, every coach was a permanent set of initials.
 *
 * ROUND, BECAUSE THIS IS A PERSON. The club's badge on /team/profile is squared
 * through `ClubCrest` for exactly the same reason in reverse.
 */
const PhotoPanel = ({ user }: { user: any }) => {
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
    // from the auth store rather than from any query — which is what makes this
    // update without a reload. The club query carries the manager too.
    await syncUser();
    qc.invalidateQueries({ queryKey: ['team-my'] });
    clearPreview();
  };

  const upload = useMutation({
    mutationFn: async (file: File) => uploadMyAvatar(await downscaleImage(file)),
    onSuccess: settle,
    onError: (e: any) => {
      clearPreview();
      setError(e?.response?.data?.message || t('reporter.photo_failed'));
    },
  });

  const remove = useMutation({
    mutationFn: removeMyAvatar,
    onSuccess: settle,
    onError: (e: any) => setError(e?.response?.data?.message || t('reporter.photo_remove_failed')),
  });

  const busy = upload.isPending || remove.isPending;

  const choose = (file?: File | null) => {
    setError('');
    if (!file) return;
    // Both checks are the browser being helpful, not the browser being trusted —
    // the server re-checks the type and enforces the same limit.
    if (!file.type.startsWith('image/')) {
      return setError(t('reporter.photo_not_image'));
    }
    if (file.size > MAX_UPLOAD) {
      // Only reachable when downscaling cannot run at all; it normally lands far
      // under this. Said in megabytes because "8388608 bytes" helps nobody.
      return setError(t('reporter.photo_too_large'));
    }
    setPreview(URL.createObjectURL(file));
    upload.mutate(file);
  };

  const src = preview || (user?.avatar as string | undefined);

  return (
    <Panel
      title={t('reporter.photo')}
      hint="Your photo appears wherever the platform credits you — the account menu, and the team sheets your club files."
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative shrink-0">
          {/* Bigger than the 40px it is used at, because this is the one screen
              where the photograph itself is what is being judged. */}
          <Avatar
            src={src}
            name={String(user?.fullName || '')}
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
              {user?.avatar ? t('reporter.photo_change') : t('reporter.photo_add')}
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
                {t('common.remove')}
              </Button>
            )}
          </div>
          <p className="text-xs text-tertiary">{t('reporter.photo_formats')}</p>
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
        aria-label={t('reporter.photo_add')}
        onChange={(e) => {
          choose(e.target.files?.[0]);
          // Reset, so choosing the SAME file again still fires a change event —
          // which is exactly what someone does after a failed upload.
          e.target.value = '';
        }}
      />

      {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger-text">{error}</p>}
    </Panel>
  );
};

/* ── across the portal ───────────────────────────────────────────────────── */

const CrossLink = ({
  to,
  icon: Icon,
  title,
  hint,
}: {
  to: string;
  icon: any;
  title: string;
  hint: string;
}) => (
  <Link
    to={to}
    className="group flex min-h-tap items-center gap-3 rounded-card border border-hairline bg-surface p-3 transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2"
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-2 text-tertiary">
      <Icon size={16} aria-hidden="true" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium text-primary">{title}</span>
      <span className="block text-xs text-tertiary">{hint}</span>
    </span>
    <ChevronRight
      size={18}
      className="shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5"
      aria-hidden="true"
    />
  </Link>
);

/* ── the page ────────────────────────────────────────────────────────────── */

const TeamAccountPage = () => {
  const { t } = useTranslation();
  // Read from the store rather than fetching: `syncUser()` runs on app mount and
  // again after every photo change, so this is the same record `/auth/me` would
  // return — without a request that would only flash a skeleton on every visit.
  const user = useAuthStore((s) => s.user);

  const header = <PageHeader title={t('portal.nav_account')} subtitle="You, rather than your club." />;

  // TeamLayout already sends a signed-out or wrong-role visitor to the login
  // page, so an absent user here means the store is mid-sync rather than absent.
  if (!user) {
    return (
      <div>
        {header}
        <p className="text-sm text-tertiary">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div>
      {header}

      <div className="max-w-3xl space-y-4">
        <PhotoPanel user={user} />

        <Panel
          title="Your details"
          hint="A league admin changes these — there is no way to edit them from here."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Fact label="Full name" value={user.fullName} />
            <Fact label="Username" value={user.username} />
            <Fact label="Email" value={user.email} />
            <Fact label="Phone" value={user.phone as React.ReactNode} />
            {/* `enums.role.TEAM_MANAGER` exists; the raw enum is the fallback for
                any role this portal is not expecting to see. */}
            <Fact label="Role" value={t(`enums.role.${user.role}`, String(user.role))} />
          </div>
          <p className="mt-4 text-sm text-secondary">
            Ask your league admin to correct anything wrong here. Your photo is the one thing
            on this page you can change yourself.
          </p>
        </Panel>

        <Panel title="Elsewhere in your portal">
          <div className="space-y-2">
            <CrossLink
              to="/team/profile"
              icon={Shield}
              title="Your club"
              hint="The name, the crest, the ground and the club's public links."
            />
            <CrossLink
              to="/team/players"
              icon={Users}
              title="Your squad"
              hint="The athletes you can name on a team sheet."
            />
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default TeamAccountPage;
