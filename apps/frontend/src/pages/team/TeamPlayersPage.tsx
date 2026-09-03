import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, ArrowRight, Camera, Edit2, FilterX, LayoutGrid, List, Loader2, Plus,
  Search, SearchX, Trash2, Users, X,
} from 'lucide-react';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  Avatar, Button, EmptyState, ErrorState, Field, IconButton, Input, Modal, Select,
  Skeleton, SkeletonList, StatusPill, cn, initials,
} from '../../components/ui';
import useMyTeam from '../../hooks/useMyTeam';
import {
  createPlayer, deletePlayer, getDocumentRequirements, updatePlayer,
} from '../../api/endpoints/team';
import { missingDocuments } from '../../lib/coachMatch';
import downscaleImage from '../../utils/downscaleImage';
import responsiveImage from '../../utils/responsiveImage';
import useUiStore from '../../store/uiStore';

/**
 * Club portal → Squad. Everyone this club can name on a team sheet, and the only
 * place a coach can add to it.
 *
 * A SQUAD SHOULD LOOK LIKE A SQUAD. This page used to be a text table: six
 * columns of enum values, one 40px avatar per row, and a coach scanning for the
 * left back read names rather than recognised a face. Every squad list a coach
 * has ever used — the team sheet on the dressing-room wall, the sticker album,
 * the club's own website — is a wall of photographs with numbers on them, so the
 * default here is now a grid of large portraits and the table is the option.
 *
 * THE TABLE IS STILL THE OPTION, AND THE CHOICE IS REMEMBERED. Faces are how you
 * FIND somebody; a table is how you AUDIT twenty-four of them — checking nobody
 * shares a number, that everyone has a position. Both are real jobs, so the
 * toggle persists in localStorage: a coach who works from the table should not
 * re-choose it every visit.
 *
 * A PHOTOGRAPH IS ADDED WHERE THE GAP IS SEEN. The player profile can also take
 * one, but a coach registering a squad has twenty faces to add and should not
 * open twenty pages to do it — so the card that shows a missing photograph is
 * the card that takes it, one tap, uploaded immediately.
 *
 * NOTHING HERE IS INVENTED. The squad comes from `GET /teams/my` — which already
 * returns every active player WITH their documents for the club's own manager,
 * so this page costs no request `useMyTeam` has not already made — the required
 * document types from `GET /documents/requirements`, and the writes are the
 * three a TEAM_MANAGER holds: POST /players, PUT /players/:id, DELETE
 * /players/:id.
 *
 * THE FILTERS ARE CLIENT-SIDE, DELIBERATELY. A squad is twenty-odd rows already
 * in memory; a round trip per keystroke would be slower and would fail on a
 * flaky connection. `/players?search=` exists for the admin registry, which is a
 * league of thousands — a different problem.
 */

/* ── the register form ─────────────────────────────────────────────────── */

/** Server enums, not free text — these are the values `Player.skillLevel` accepts. */
const SKILL_LEVELS = ['AMATEUR', 'SEMI_PROFESSIONAL', 'PROFESSIONAL', 'ELITE'];
const GENDERS = ['MALE', 'FEMALE'];

const label = (value: string) =>
  value.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

const emptyForm = {
  fullName: '',
  nationality: 'Rwandan',
  position: '',
  jerseyNumber: '',
  dateOfBirth: '',
  height: '',
  skillLevel: 'AMATEUR',
  gender: 'MALE',
};

/* ── photographs ───────────────────────────────────────────────────────── */

/** The 8MB multer accepts on this route, mirrored so a doomed upload never starts. */
const MAX_UPLOAD = 8 * 1024 * 1024;

/**
 * Vet a chosen file and shrink it, or say in one sentence why it cannot be sent.
 *
 * Both checks are the browser being helpful, not the browser being trusted — the
 * server re-checks the mime type, enforces the same ceiling and resizes to
 * 400x400 itself. Doing it here means a coach on a district ground's mobile
 * connection learns about a 20MB photograph now rather than after the wait.
 */
const acceptPhoto = async (file: File): Promise<{ file?: File; error?: string }> => {
  if (!file.type.startsWith('image/')) return { error: `${file.name} is not an image.` };
  // Said in megabytes because "8388608 bytes" helps nobody.
  if (file.size > MAX_UPLOAD) {
    return { error: `${file.name} is larger than 8MB. Photograph them again at a lower resolution.` };
  }
  // A 12MB camera JPEG becomes roughly 40KB of WebP — the difference between a
  // moment and a minute on 3G, for an image the server shrinks to 400px anyway.
  return { file: await downscaleImage(file) };
};

/**
 * A player's photograph, filling whatever square it is given.
 *
 * SQUARE, WHERE THE REST OF THE PRODUCT IS ROUND. `Avatar` is circular because
 * round means a person and squared means an organisation — a rule that earns its
 * keep in MIXED lists, where a scorer sits beside their club. A squad grid holds
 * nothing but people, so the rule has nothing to disambiguate, and at 160px a
 * circle throws away the corners of a photograph somebody stood still for.
 *
 * The fallback is the same initials `Avatar` falls back to, from the same helper
 * — twenty identical person glyphs are unreadable, twenty sets of initials are
 * still scannable — just at a size that suits the tile.
 */
const PlayerPhoto = ({ src, name, className }: { src?: string; name?: string; className?: string }) => {
  if (src) {
    return (
      <img
        {...responsiveImage(src, {
          widths: [200, 400],
          sizes: '(min-width: 1280px) 220px, (min-width: 640px) 33vw, 50vw',
        })}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn('h-full w-full object-cover', className)}
      />
    );
  }
  return (
    // The name is printed under the tile, so the initials are decorative here —
    // hiding them from assistive tech avoids reading the name twice.
    <span
      aria-hidden="true"
      className={cn(
        'flex h-full w-full items-center justify-center font-display text-2xl font-bold text-tertiary',
        className
      )}
    >
      {initials(name)}
    </span>
  );
};

/**
 * The one-tap camera.
 *
 * HAND-ROLLED RATHER THAN `IconButton`, for one reason: the glyph has to become a
 * spinner while the file is in flight, and `IconButton` renders its icon with no
 * hook to spin it. Everything else about it — the 44px target, the required
 * accessible name — matches what `IconButton` would have given.
 *
 * DECLARED AT MODULE LEVEL, not inside the page. A component defined during
 * render is a new type on every render, so React unmounts and remounts it — which
 * loses focus mid-upload, exactly when the spinner appears.
 */
const PhotoButton = ({
  player,
  busy,
  onPick,
  size = 'md',
  variant = 'ghost',
  className,
}: {
  player: any;
  busy: boolean;
  onPick: () => void;
  /** `sm` is a pointer target and belongs only in the md-and-up table. */
  size?: 'sm' | 'md';
  /** `overlay` reads on top of a photograph; `ghost` sits among other icon buttons. */
  variant?: 'ghost' | 'overlay';
  className?: string;
}) => {
  const name = player.photo
    ? `Replace ${player.fullName}'s photograph`
    : `Add a photograph of ${player.fullName}`;

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={busy}
      aria-busy={busy || undefined}
      aria-label={name}
      title={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-pill',
        'transition-colors duration-150 ease-standard',
        'disabled:pointer-events-none disabled:opacity-60',
        size === 'sm' ? 'h-9 w-9' : 'h-tap w-tap',
        variant === 'overlay'
          ? 'border border-hairline bg-surface/90 text-secondary backdrop-blur-sm hover:bg-surface-2 hover:text-primary'
          : 'text-secondary hover:bg-surface-2 hover:text-primary',
        className
      )}
    >
      {busy
        ? <Loader2 size={size === 'sm' ? 16 : 18} className="animate-spin" aria-hidden="true" />
        : <Camera size={size === 'sm' ? 16 : 18} aria-hidden="true" />}
    </button>
  );
};

/* ── the remembered layout ─────────────────────────────────────────────── */

type View = 'grid' | 'list';
const VIEW_KEY = 'rnsp-squad-view';

/**
 * Reading and writing localStorage both throw in a private window and in a
 * browser set to block site data, and an exception here would take the whole
 * page down over a display preference. So every access is wrapped, and the
 * failure mode is simply that the choice is not remembered.
 */
const readView = (): View => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
};

const rememberView = (view: View) => {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {
    /* nowhere to remember it; the toggle still works for this visit */
  }
};

/**
 * Shared empty arrays for "not loaded yet" and "the league has published
 * nothing". A fresh `[]` on every render is a new identity, which would re-run
 * every memo below on every keystroke — react-hooks/exhaustive-deps says so out
 * loud, and it is right.
 */
const NO_PLAYERS: any[] = [];
const NO_REQUIREMENTS: string[] = [];

/* ── filtering ─────────────────────────────────────────────────────────── */

/**
 * What the search box looks at: the three things printed on every card — a shirt
 * number, a name and a position — so a coach typing what they can see finds it.
 */
const haystack = (p: any) =>
  [p?.fullName, p?.position, p?.jerseyNumber != null ? `#${p.jerseyNumber}` : null, p?.jerseyNumber]
    .filter((v) => v !== null && v !== undefined && v !== '')
    .join(' ')
    .toLowerCase();

/** A squad is read by shirt number. Nobody numbered yet sorts to the end, by name. */
const bySquadOrder = (a: any, b: any) => {
  const an = a?.jerseyNumber ?? Number.POSITIVE_INFINITY;
  const bn = b?.jerseyNumber ?? Number.POSITIVE_INFINITY;
  if (an !== bn) return an - bn;
  return String(a?.fullName || '').localeCompare(String(b?.fullName || ''));
};

/* ── one figure in the summary band ────────────────────────────────────── */

const Tally = ({
  dot,
  value,
  label: text,
  to,
  warn = false,
}: {
  dot: string;
  value: number;
  label: string;
  to?: string;
  warn?: boolean;
}) => {
  const body = (
    <>
      <span className={cn('h-2 w-2 shrink-0 rounded-pill', dot)} aria-hidden="true" />
      <p className={cn('text-sm', warn ? 'text-live' : 'text-secondary')}>
        <span
          className={cn('font-display font-bold tabular-nums', warn ? 'text-live' : 'text-primary')}
        >
          {value}
        </span>{' '}
        {text}
      </p>
      {to && <ArrowRight size={13} className="shrink-0 text-tertiary" aria-hidden="true" />}
    </>
  );

  // Only the figure that is a QUESTION links, and only that one is allowed the
  // warn tone. A squad screen carrying a permanent alarm teaches a coach to stop
  // seeing it, which costs the one moment it genuinely matters.
  return to ? (
    <Link
      to={to}
      className="flex min-h-tap items-center gap-2 rounded-control transition-colors duration-150 ease-standard hover:text-primary"
    >
      {body}
    </Link>
  ) : (
    <div className="flex min-h-tap items-center gap-2">{body}</div>
  );
};

/* ── the page ──────────────────────────────────────────────────────────── */

const TeamPlayersPage = () => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const { data: team, isLoading, isError, refetch } = useMyTeam();
  const players: any[] = team?.players || NO_PLAYERS;

  /**
   * The league's required document types. Shared query key and a long stale time
   * because this is a platform-wide constant — it changes when the league changes
   * its rules, not while a coach is typing.
   */
  const { data: requirements } = useQuery({
    queryKey: ['document-requirements'],
    queryFn: getDocumentRequirements,
    staleTime: 10 * 60 * 1000,
  });
  const requiredDocTypes: string[] = requirements?.requiredDocTypes || NO_REQUIREMENTS;

  /* ── what the squad owes ────────────────────────────────────────────── */

  const verified = players.filter((p) => p.status === 'VERIFIED').length;

  /**
   * Counted by PLAYER, not by document, and through the shared helper rather
   * than a second copy of the arithmetic: this figure and the one on
   * the player profile are the same claim, and two implementations of one claim
   * eventually disagree on one screen. `missingDocuments` counts APPROVED
   * paperwork only — a pending upload is not clearance to play.
   */
  const short = useMemo(
    () => missingDocuments(players, requiredDocTypes),
    [players, requiredDocTypes]
  );

  /** playerId → how many required documents are still outstanding. */
  const gapsById = useMemo(
    () => new Map<number, number>(short.players.map((row: any) => [row.player.id, row.gaps.length])),
    [short]
  );

  /* ── filters and layout ─────────────────────────────────────────────── */

  const [view, setView] = useState<View>(readView);
  const chooseView = (next: View) => {
    setView(next);
    rememberView(next);
  };

  const [q, setQ] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState('');
  const filtering = q.trim().length > 0 || position !== '' || status !== '';
  const clearFilters = () => {
    setQ('');
    setPosition('');
    setStatus('');
  };

  /**
   * Both filters are built from the squad itself. A fixed list of every position
   * would offer "Goalkeeper" to a club that has not registered one, and a fixed
   * list of every PlayerStatus would offer "Suspended" to a club with nobody
   * suspended — an option that can only ever empty the list is a control that
   * teaches the wrong thing.
   */
  const positionOptions = useMemo(() => {
    const seen = Array.from(new Set(players.map((p) => p.position).filter(Boolean))).sort();
    return seen.map((p: any) => ({ value: p, label: String(p) }));
  }, [players]);

  const statusOptions = useMemo(() => {
    const seen = Array.from(new Set(players.map((p) => p.status).filter(Boolean))).sort();
    return seen.map((s: any) => ({ value: s, label: label(String(s)) }));
  }, [players]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return players
      .filter((p) => {
        if (status && p.status !== status) return false;
        if (position && p.position !== position) return false;
        return !term || haystack(p).includes(term);
      })
      .sort(bySquadOrder);
  }, [players, q, position, status]);

  /* ── the quick photograph ───────────────────────────────────────────── */

  /**
   * ONE file input for the whole page, remembering which player opened it — the
   * same trick the documents page uses, and the whole reason adding a photograph
   * is one tap rather than a dialog with a Save button.
   */
  const quickRef = useRef<HTMLInputElement>(null);
  const quickTarget = useRef<any>(null);
  /** Player ids with an upload in flight, so several cards can spin at once. */
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  /** The page-level failure line, above the squad where it cannot be missed. */
  const [pageError, setPageError] = useState('');

  const photoMutation = useMutation({
    // An empty field set: the photo is the only thing changing, and the server
    // leaves every column alone whose key is absent. It also means the write
    // never touches `jerseyNumber` or `nationality`, so it cannot trip the
    // eligibility rules and be refused for something the coach did not do.
    mutationFn: ({ id, file }: { id: number; file: File }) => updatePlayer(id, {}, file),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['team-my'] });
      // And that player's own profile, which keys on the id as a STRING — the
      // shape TeamPlayerPage builds from `useParams`. Without this a coach could
      // add a photo here, open the profile, and be shown the old one from cache.
      queryClient.invalidateQueries({ queryKey: ['team-player', String(id)] });
      pushToast('Photograph added.', 'success');
    },
    // Verbatim. The endpoint refuses by name — not your club, player not found,
    // the file was rejected — and each has a different fix. "Upload failed" has
    // none.
    onError: (err: any) =>
      setPageError(
        err?.response?.data?.message
          || 'Could not upload that photograph. Check your connection and try again.'
      ),
    onSettled: (_d, _e, vars) =>
      setUploading((prev) => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      }),
  });

  const pickPhotoFor = (player: any) => {
    setPageError('');
    quickTarget.current = player;
    quickRef.current?.click();
  };

  const onQuickFile = async (file?: File | null) => {
    const player = quickTarget.current;
    if (!file || !player) return;
    const { file: small, error } = await acceptPhoto(file);
    if (error || !small) return setPageError(error || 'That file could not be read.');
    setUploading((prev) => ({ ...prev, [player.id]: true }));
    photoMutation.mutate({ id: player.id, file: small });
  };

  /* ── the add / edit dialog ──────────────────────────────────────────── */

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formPhoto, setFormPhoto] = useState<File | null>(null);
  const [formPreview, setFormPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const formPhotoRef = useRef<HTMLInputElement>(null);

  /**
   * The server's own words, kept.
   *
   * POST/PUT /players answer 422 with `{ message, issues }` when a write breaks
   * an eligibility rule — jersey number already taken, squad full, foreign-player
   * quota reached. Those are three different situations with three different
   * fixes, and the server has already written the sentence that says which one it
   * is. Flattening them into "Could not add player" would leave a coach guessing
   * which of their fields is wrong, so `message` is shown verbatim next to the
   * form and `issues` beneath it when the write broke more than one rule.
   */
  const [formError, setFormError] = useState<string | null>(null);
  const [formIssues, setFormIssues] = useState<string[]>([]);

  const releasePreview = () => setFormPreview((old) => {
    if (old) URL.revokeObjectURL(old);
    return null;
  });

  const resetForm = () => {
    setFormData(emptyForm);
    setFormPhoto(null);
    releasePreview();
    setPhotoError('');
    setFormError(null);
    setFormIssues([]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlayer(null);
    resetForm();
  };

  const openCreate = () => {
    setEditingPlayer(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (player: any) => {
    setEditingPlayer(player);
    resetForm();
    setFormData({
      fullName: player.fullName || '',
      nationality: player.nationality || 'Rwandan',
      position: player.position || '',
      jerseyNumber: player.jerseyNumber ?? '',
      // The record carries a full timestamp; the control takes a calendar day.
      dateOfBirth: player.dateOfBirth ? String(player.dateOfBirth).slice(0, 10) : '',
      height: player.height ?? '',
      skillLevel: player.skillLevel || 'AMATEUR',
      gender: player.gender || 'MALE',
    });
    setIsModalOpen(true);
  };

  const chooseFormPhoto = async (picked?: File | null) => {
    setPhotoError('');
    if (!picked) return;
    const { file, error } = await acceptPhoto(picked);
    if (error || !file) return setPhotoError(error || 'That file could not be read.');
    // Shrink BEFORE it is held in state, so what is previewed is exactly what
    // will be sent.
    setFormPhoto(file);
    setFormPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  };

  /**
   * `team-my` is the squad's home. The old club dashboard still keeps its own
   * copy under `team-dashboard-data`, so both are dropped — a coach who registers
   * a player and taps back to the dashboard should not be shown yesterday's count.
   */
  const invalidateTeam = (playerId?: number) => {
    queryClient.invalidateQueries({ queryKey: ['team-my'] });
    queryClient.invalidateQueries({ queryKey: ['team-dashboard-data'] });
    // Editing a player here changes what their profile page shows too.
    if (playerId != null) {
      queryClient.invalidateQueries({ queryKey: ['team-player', String(playerId)] });
    }
  };

  const onWriteError = (err: any, fallback: string) => {
    const data = err?.response?.data;
    setFormError(data?.message || fallback);
    setFormIssues(Array.isArray(data?.issues) ? data.issues : []);
  };

  const createMutation = useMutation({
    mutationFn: ({ fields, photo }: any) => createPlayer({ ...fields, teamId: team.id }, photo),
    onSuccess: () => {
      invalidateTeam();
      closeModal();
      pushToast('Player added to your squad.', 'success');
    },
    onError: (err: any) =>
      onWriteError(err, 'Could not add this player. Check your connection and try again.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fields, photo }: any) => updatePlayer(id, fields, photo),
    onSuccess: (_data, { id }: any) => {
      invalidateTeam(id);
      closeModal();
      pushToast('Player updated.', 'success');
    },
    onError: (err: any) =>
      onWriteError(err, 'Could not save these changes. Check your connection and try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePlayer(id),
    onSuccess: (_data, id) => {
      invalidateTeam(id);
      pushToast('Player removed from your squad.', 'success');
    },
    // A delete happens from the list, not from a form, so its refusal has nowhere
    // to sit but a toast — still the server's sentence rather than a generic one.
    onError: (err: any) =>
      pushToast(err?.response?.data?.message || 'Could not remove this player. Try again.'),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const submit = () => {
    setFormError(null);
    setFormIssues([]);
    if (editingPlayer) {
      updateMutation.mutate({ id: editingPlayer.id, fields: formData, photo: formPhoto });
    } else {
      createMutation.mutate({ fields: formData, photo: formPhoto });
    }
  };

  const removePlayer = (player: any) => {
    if (window.confirm(`Remove ${player.fullName} from your squad?`)) deleteMutation.mutate(player.id);
  };

  /* ── shared row pieces ──────────────────────────────────────────────── */

  /**
   * How much paperwork this player still owes, phrased for a coach.
   *
   * Null when the league has published no requirements: a checklist with nothing
   * on it would render as "cleared", which claims something the platform has not
   * been told. The documents page makes the same distinction.
   */
  const documentsFor = (player: any) => {
    if (!requiredDocTypes.length) return null;
    const gaps = gapsById.get(player.id) ?? 0;
    return { gaps, done: requiredDocTypes.length - gaps, total: requiredDocTypes.length };
  };

  /* ── render ─────────────────────────────────────────────────────────── */

  // Shaped like whichever layout is about to arrive — a squared photograph and
  // two lines, or a row — so the page does not rearrange itself under the coach.
  const skeletons = () =>
    view === 'grid' ? (
      <SkeletonList count={10} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <div className="overflow-hidden rounded-card border border-hairline bg-surface">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-24 max-w-full" />
            <Skeleton className="h-3 w-16 max-w-full" />
          </div>
        </div>
      </SkeletonList>
    ) : (
      <SkeletonList count={6} className="space-y-2">
        <div className="flex min-h-tap items-center gap-3 rounded-card border border-hairline bg-surface p-3 sm:p-4">
          <Skeleton circle className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-3 w-24 max-w-full" />
          </div>
          <Skeleton className="h-5 w-20 shrink-0 rounded-pill" />
        </div>
      </SkeletonList>
    );

  const body = () => {
    if (isLoading) return skeletons();

    if (isError) {
      return (
        <Panel>
          <ErrorState
            title="Could not load your squad"
            hint="Your players are still registered. Check your connection and try again."
            onRetry={() => refetch()}
          />
        </Panel>
      );
    }

    // Two different kinds of nothing. A club with no squad needs to be told to
    // register somebody; a coach who typed three letters needs to be told to
    // delete them. One shared placeholder would give each of them the unhelpful
    // half of the truth.
    if (!players.length) {
      return (
        <Panel>
          <EmptyState
            icon={Users}
            title="No players yet"
            hint="Add your first player and they can be named on a team sheet as soon as their documents are approved."
            action={
              <Button type="button" icon={Plus} onClick={openCreate} disabled={!team?.id}>
                Add player
              </Button>
            }
          />
        </Panel>
      );
    }

    if (!shown.length) {
      return (
        <Panel>
          <EmptyState
            icon={SearchX}
            title="No players match that filter"
            hint="Nobody in your squad matches what you are filtering by. Clearing it brings them back."
            action={
              <Button type="button" variant="secondary" icon={FilterX} onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        </Panel>
      );
    }

    if (view === 'grid') {
      return (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((player) => {
            const busy = !!uploading[player.id];
            const docs = documentsFor(player);
            return (
              // `group` sits on the list item, not the link, because the camera is
              // a SIBLING of the link: an interactive control nested inside an
              // anchor is invalid and unreachable by keyboard.
              <li key={player.id} className="group relative">
                <Link
                  to={`/team/players/${player.id}`}
                  className={cn(
                    'block overflow-hidden rounded-card border border-hairline bg-surface',
                    'transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2'
                  )}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
                    <PlayerPhoto src={player.photo} name={player.fullName} />
                    {/* The shirt number, on the photograph where it is on the
                        shirt. It is the fastest thing to find a player by and it
                        would cost the name a line if it sat underneath. */}
                    {player.jerseyNumber != null && (
                      <span className="absolute left-1.5 top-1.5 rounded-pill bg-page/85 px-2 py-0.5 font-display text-sm font-bold tabular-nums text-primary backdrop-blur-sm">
                        {player.jerseyNumber}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5">
                    <p className="truncate text-sm font-medium text-primary">{player.fullName}</p>
                    <p className="mt-0.5 truncate text-xs text-tertiary">
                      {player.position || 'No position set'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <StatusPill status={player.status} />
                      {/* The one thing a wall of faces cannot say on its own:
                          this player cannot be picked yet. Only ever shown when
                          it is true, so it stays worth noticing. */}
                      {docs && docs.gaps > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-live">
                          <AlertTriangle size={11} aria-hidden="true" />
                          {docs.done}/{docs.total}
                          <span className="sr-only"> required documents approved</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {busy && (
                  // Over the photograph rather than in a corner: the card itself
                  // is what is changing, and several may be in flight at once.
                  <span
                    className="pointer-events-none absolute inset-x-0 top-0 flex aspect-square items-center justify-center bg-page/70"
                    aria-hidden="true"
                  >
                    <Loader2 size={22} className="animate-spin text-secondary" />
                  </span>
                )}

                {/* VISIBLE ON TOUCH, REVEALED ON HOVER. Hiding it until hover is
                    right for a pointer — twenty-four cameras on a wall of faces
                    is noise — and impossible on a phone, where there is no hover
                    and the control would simply never exist. Focus reveals it
                    too, so a keyboard never tabs to something invisible. */}
                <PhotoButton
                  player={player}
                  busy={busy}
                  onPick={() => pickPhotoFor(player)}
                  variant="overlay"
                  className={cn(
                    'absolute right-1.5 top-1.5',
                    'md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100',
                    busy && 'md:opacity-100'
                  )}
                />
              </li>
            );
          })}
        </ul>
      );
    }

    return (
      <>
        {/* PHONE: cards. A seven-column table on a 360px screen either scrolls
            sideways for every row or shrinks the name to nothing. The row itself
            opens the player, so the profile is not a 24px target. */}
        <ul className="space-y-2 md:hidden">
          {shown.map((player) => {
            const docs = documentsFor(player);
            return (
              <li
                key={player.id}
                className="flex items-center gap-0.5 rounded-card border border-hairline bg-surface p-2 pr-0.5"
              >
                <Link
                  to={`/team/players/${player.id}`}
                  className="flex min-h-tap min-w-0 flex-1 items-center gap-2.5 rounded-control p-1 transition-colors duration-150 ease-standard hover:bg-surface-2"
                >
                  <Avatar src={player.photo} name={player.fullName} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-primary">
                      {player.jerseyNumber != null && (
                        <span className="tabular-nums text-tertiary">{player.jerseyNumber} · </span>
                      )}
                      {player.fullName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-tertiary">
                      {player.position || 'No position set'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <StatusPill status={player.status} />
                      {docs && docs.gaps > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-live">
                          <AlertTriangle size={11} aria-hidden="true" />
                          {docs.done}/{docs.total} documents
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <PhotoButton
                  player={player}
                  busy={!!uploading[player.id]}
                  onPick={() => pickPhotoFor(player)}
                />
                <IconButton
                  icon={Edit2}
                  label={`Edit ${player.fullName}`}
                  onClick={() => openEdit(player)}
                />
                <IconButton
                  icon={Trash2}
                  variant="danger"
                  label={`Remove ${player.fullName}`}
                  disabled={deleteMutation.isPending}
                  onClick={() => removePlayer(player)}
                />
              </li>
            );
          })}
        </ul>

        {/* TABLET AND UP: the table, and the only place `size="sm"` controls are
            allowed — a pointer target, not a thumb target. The scroll lives inside
            TableWrap, so a narrow window scrolls the table and never the page. */}
        <Panel flush className="hidden md:block">
          <TableWrap>
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr>
                  <Th align="right" className="w-16">No.</Th>
                  <Th>Player</Th>
                  <Th>Position</Th>
                  <Th>Status</Th>
                  <Th>Documents</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {shown.map((player) => {
                  const docs = documentsFor(player);
                  return (
                    <tr
                      key={player.id}
                      className="transition-colors duration-150 ease-standard hover:bg-surface-2"
                    >
                      <Td align="right" className="font-medium text-primary">
                        {player.jerseyNumber ?? '—'}
                      </Td>
                      <Td>
                        <Link
                          to={`/team/players/${player.id}`}
                          className="flex items-center gap-3 transition-colors duration-150 ease-standard hover:text-brand-text"
                        >
                          <Avatar src={player.photo} name={player.fullName} size="lg" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-primary">{player.fullName}</p>
                            <p className="truncate text-xs text-tertiary">
                              {[player.nationality, player.skillLevel ? label(String(player.skillLevel)) : null]
                                .filter(Boolean)
                                .join(' · ') || '—'}
                            </p>
                          </div>
                        </Link>
                      </Td>
                      <Td>{player.position || '—'}</Td>
                      <Td>
                        <StatusPill status={player.status} />
                      </Td>
                      <Td>
                        {/* The paperwork column is the one a coach reads down,
                            looking for the people who cannot be picked. */}
                        {!docs ? (
                          <span className="text-tertiary">—</span>
                        ) : docs.gaps === 0 ? (
                          <span className="text-brand-text">Cleared</span>
                        ) : (
                          <Link
                            to="/team/players"
                            className="inline-flex items-center gap-1 tabular-nums text-live transition-colors duration-150 ease-standard hover:text-primary"
                          >
                            <AlertTriangle size={12} aria-hidden="true" />
                            {docs.done} of {docs.total}
                          </Link>
                        )}
                      </Td>
                      <Td align="right">
                        <div className="flex items-center justify-end gap-1">
                          {/* The same one-tap camera the cards carry: a coach who
                              works from the table is adding the same twenty
                              photographs and should not have to switch layout to
                              do it. */}
                          <PhotoButton
                            player={player}
                            busy={!!uploading[player.id]}
                            onPick={() => pickPhotoFor(player)}
                            size="sm"
                          />
                          <IconButton
                            icon={Edit2}
                            size="sm"
                            label={`Edit ${player.fullName}`}
                            onClick={() => openEdit(player)}
                          />
                          <IconButton
                            icon={Trash2}
                            size="sm"
                            variant="danger"
                            label={`Remove ${player.fullName}`}
                            disabled={deleteMutation.isPending}
                            onClick={() => removePlayer(player)}
                          />
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      </>
    );
  };

  return (
    <div>
      <PageHeader
        title="Squad"
        subtitle="Everyone this club can name on a team sheet"
        actions={
          // Every write posts to this club's id, so the action is only offered
          // once the club has actually loaded — a coach whose club failed to load
          // should be reading the retry below, not filling in a form that cannot
          // be sent.
          <Button type="button" icon={Plus} onClick={openCreate} disabled={!team?.id}>
            Add player
          </Button>
        }
      />

      {/* THE SUMMARY BAND, in the shape of the documents page's. The headline is
          the squad, and underneath it the two facts that decide whether these
          people can actually be picked. The second of them is a question rather
          than a fact — "three are not cleared" — so it is the one that links, and
          its answer is another page. */}
      {isLoading ? (
        <Skeleton className="h-28 w-full rounded-card" />
      ) : (
        <section className="rounded-card border border-hairline bg-surface p-4 sm:p-5">
          <div className="min-w-0">
            <p className="font-display text-3xl font-bold tabular-nums leading-none text-primary">
              {players.length}
            </p>
            <p className="mt-1.5 text-sm text-secondary">
              {players.length === 1 ? 'player registered' : 'players registered'}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-6 border-t border-hairline pt-1">
            <Tally dot="bg-success" value={verified} label="verified by the league" />
            {/* Hidden entirely when the league has published no requirements:
                "0 not cleared" would claim a clearance nobody has been asked for. */}
            {requiredDocTypes.length > 0 && (
              <Tally
                dot={short.players.length > 0 ? 'bg-live' : 'bg-tertiary'}
                value={short.players.length}
                label="not cleared to play"
                to="/team/players"
                warn={short.players.length > 0}
              />
            )}
          </div>
        </section>
      )}

      {/* The toolbar is hidden until there is a list worth filtering: four
          controls above an empty panel are four controls that cannot do
          anything. */}
      {!isLoading && !isError && players.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[10rem] flex-1">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary"
            />
            <Input
              value={q}
              onChange={(e: any) => setQ(e.target.value)}
              placeholder="Name, jersey or position"
              aria-label="Filter your squad by name, jersey number or position"
              className="pl-9 text-sm"
            />
          </div>

          {/* Faces or a table. Both are real jobs — one is how you find a player,
              the other is how you audit a squad — so neither is hidden in a menu,
              and the choice is remembered for next time. */}
          <div
            role="group"
            aria-label="Squad layout"
            className="flex shrink-0 items-center rounded-pill border border-hairline"
          >
            {([
              ['grid', LayoutGrid, 'Show photographs'],
              ['list', List, 'Show a list'],
            ] as Array<[View, any, string]>).map(([id, Icon, name]) => (
              <button
                key={id}
                type="button"
                onClick={() => chooseView(id)}
                aria-pressed={view === id}
                aria-label={name}
                title={name}
                className={cn(
                  // A thumb target, so the pair is exactly as tall as the search
                  // box beside it.
                  'inline-flex h-tap w-tap items-center justify-center rounded-pill',
                  'transition-colors duration-150 ease-standard',
                  view === id
                    ? 'bg-brand-tint text-brand-text'
                    : 'text-tertiary hover:bg-surface-2 hover:text-primary'
                )}
              >
                <Icon size={17} aria-hidden="true" />
              </button>
            ))}
          </div>

          {positionOptions.length > 1 && (
            <Select
              id="team-squad-position"
              label="Position"
              size="md"
              value={position}
              onChange={(e: any) => setPosition(e.target.value)}
              placeholder="All positions"
              options={positionOptions}
              className="min-w-0 flex-1 basis-40"
            />
          )}
          {statusOptions.length > 1 && (
            <Select
              id="team-squad-status"
              label="Status"
              size="md"
              value={status}
              onChange={(e: any) => setStatus(e.target.value)}
              placeholder="All statuses"
              options={statusOptions}
              className="min-w-0 flex-1 basis-40"
            />
          )}

          {filtering && (
            <Button type="button" variant="ghost" icon={FilterX} onClick={clearFilters}>
              Clear
            </Button>
          )}
          <span className="ml-auto shrink-0 text-xs tabular-nums text-tertiary">
            {shown.length} of {players.length}
          </span>
        </div>
      )}

      {pageError && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-card border border-danger/40 bg-danger/5 p-3 text-sm text-danger-text"
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">{pageError}</span>
          {/* Negative margins so a real 44px target does not inflate the line it
              sits on. */}
          <button
            type="button"
            onClick={() => setPageError('')}
            aria-label="Dismiss"
            className="-my-1.5 -mr-1.5 inline-flex h-tap w-tap shrink-0 items-center justify-center rounded-control transition-colors duration-150 ease-standard hover:bg-danger/10"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </p>
      )}

      {/* One hidden input behind every camera on the page. */}
      <input
        ref={quickRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          onQuickFile(e.target.files?.[0]);
          // Reset, so choosing the SAME file again still fires a change event —
          // which is exactly what someone does after a rejected file.
          e.target.value = '';
        }}
      />

      <div className="mt-4">{body()}</div>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingPlayer ? 'Edit player' : 'Add player'}
        description={
          editingPlayer
            ? 'Changes apply to every team sheet this player has not yet been named on.'
            : 'A new player starts as pending and is cleared once their documents are approved.'
        }
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submit}
              loading={isSaving}
              disabled={!formData.fullName.trim() || isSaving}
            >
              {editingPlayer ? 'Save changes' : 'Add player'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && (
            /* role="alert" so the refusal is announced when it appears rather than
               when the next field happens to be focused. The server's sentence is
               the heading; anything else it objected to is listed under it. */
            <div
              role="alert"
              className="rounded-input border border-danger/40 bg-danger/10 p-3 text-sm text-danger-text"
            >
              <p className="font-semibold">{formError}</p>
              {formIssues.length > 1 && (
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                  {formIssues.slice(1).map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* The photograph is offered FIRST, because it is the field a coach has
              in their hand: they are looking at the player. It rides along on the
              same multipart request as the rest of the form, so it lands when Save
              does — which is why the copy under it does not claim otherwise. */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-card border border-hairline bg-surface-2">
              <PlayerPhoto
                src={formPreview || editingPlayer?.photo}
                name={formData.fullName || editingPlayer?.fullName}
                className="text-lg"
              />
            </div>
            <div className="min-w-0">
              <Button
                type="button"
                variant="secondary"
                icon={Camera}
                onClick={() => formPhotoRef.current?.click()}
              >
                {formPreview || editingPlayer?.photo ? 'Change photograph' : 'Add a photograph'}
              </Button>
              <p className="mt-1.5 text-xs text-tertiary">
                Optional, and saved with the rest of the form. Up to 8MB.
              </p>
              {photoError && (
                <p role="alert" className="mt-1 text-xs font-semibold text-danger-text">
                  {photoError}
                </p>
              )}
            </div>
            <input
              ref={formPhotoRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Choose a photograph"
              onChange={(e) => {
                chooseFormPhoto(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>

          <Field label="Full name" required>
            {(p: any) => (
              <Input
                {...p}
                value={formData.fullName}
                onChange={(e: any) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="As it appears on their documents"
              />
            )}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Position">
              {(p: any) => (
                <Input
                  {...p}
                  value={formData.position}
                  onChange={(e: any) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Goalkeeper, winger…"
                />
              )}
            </Field>

            <Field
              label="Jersey number"
              hint="Two players in one squad cannot share a number."
            >
              {(p: any) => (
                <Input
                  {...p}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="tabular-nums"
                  value={formData.jerseyNumber}
                  onChange={(e: any) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                />
              )}
            </Field>

            <Field label="Date of birth" hint="Age limits are checked against this.">
              {(p: any) => (
                <Input
                  {...p}
                  type="date"
                  className="tabular-nums"
                  value={formData.dateOfBirth}
                  onChange={(e: any) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              )}
            </Field>

            <Field
              label="Nationality"
              hint="The league caps how many foreign players a squad may hold."
            >
              {(p: any) => (
                <Input
                  {...p}
                  value={formData.nationality}
                  onChange={(e: any) => setFormData({ ...formData, nationality: e.target.value })}
                />
              )}
            </Field>

            <Field label="Height" hint="In centimetres.">
              {(p: any) => (
                <Input
                  {...p}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="tabular-nums"
                  value={formData.height}
                  onChange={(e: any) => setFormData({ ...formData, height: e.target.value })}
                />
              )}
            </Field>

            <Field label="Gender">
              {(p: any) => (
                <Select
                  {...p}
                  size="md"
                  value={formData.gender}
                  onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })}
                  options={GENDERS.map((g) => ({ value: g, label: label(g) }))}
                />
              )}
            </Field>

            <Field label="Level" className="sm:col-span-2">
              {(p: any) => (
                <Select
                  {...p}
                  size="md"
                  value={formData.skillLevel}
                  onChange={(e: any) => setFormData({ ...formData, skillLevel: e.target.value })}
                  options={SKILL_LEVELS.map((s) => ({ value: s, label: label(s) }))}
                />
              )}
            </Field>
          </div>

          {/* SAID OUT LOUD BECAUSE THE SERVER WILL NOT SAY IT. `PUT /players/:id`
              reads a blank number, date or height as "leave this alone" — only
              those three, because only those three are parsed before they are
              written. A coach who empties the jersey field, saves, and finds the
              number still there would have been told the write worked. */}
          {editingPlayer && (
            <p className="text-xs text-tertiary">
              Clearing the jersey number, date of birth or height leaves whatever is already recorded.
              Ask a league admin to remove one of those.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TeamPlayersPage;
