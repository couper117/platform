import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, Ban, BarChart3, Camera, Check, ChevronLeft, ClipboardList, Clock3,
  History, Loader2, Plus, Trash2, UserMinus, X,
} from 'lucide-react';
import { format } from 'date-fns';
import { Panel } from '../../components/admin/AdminUI';
import PlayerStatsModal from '../../components/admin/PlayerStatsModal';
import { Fact } from '../../components/team/TeamUI';
import {
  Avatar, Button, ErrorState, Field, Input, Modal, Select, Skeleton, StatusPill, cn,
} from '../../components/ui';
import {
  deletePlayer, getDocumentRequirements, getPlayer, updatePlayer,
  uploadDocument,
} from '../../api/endpoints/team';
import downscaleImage from '../../utils/downscaleImage';
import useMyTeam from '../../hooks/useMyTeam';
import useUiStore from '../../store/uiStore';

/**
 * Club portal → one player: /team/players/:id.
 *
 * WHY THIS IS A PAGE AND NOT THE EDIT MODAL ON THE SQUAD LIST. The modal can only
 * ever be a form, and the most valuable thing a coach can learn about a player is
 * not a field they can type into — it is whether the player may be named on
 * Saturday. Two things decide that, they live in different places, and neither
 * was visible anywhere in this portal:
 *
 *   · AN ACTIVE SUSPENSION. `GET /players/:id` includes `suspensions` filtered to
 *     the active ones, and a TEAM_MANAGER is in the server's PERSONAL_DATA_ROLES
 *     so the record arrives unredacted. THIS IS THE ONLY PLACE A CLUB CAN SEE A
 *     BAN: `GET /suspensions` is gated on `suspensions.read`, a capability a coach
 *     does not hold, so without this screen the first they hear of it is
 *     `PUT /fixtures/:id/lineup` refusing the whole sheet by name — at filing
 *     time, which is usually the night before the match.
 *   · DOCUMENT CLEARANCE. The same response carries the player's `documents`, and
 *     the league's required types come from `GET /documents/requirements`. A
 *     player without every required type APPROVED is not cleared to play.
 *
 * So "Can this player play?" sits directly under the hero, above the form. The
 * form is the errand; the answer is the reason for the visit.
 *
 * NOTHING HERE IS INVENTED. Every field, section and write is read off
 * apps/backend/src/controllers/players.controller.ts:
 *   · the profile is `GET /players/:id` — player, team, documents, active
 *     suspensions, career, plus the derived `season`, `form` and `recordedSeason`
 *   · the details form offers exactly what `updatePlayer` destructures off the
 *     body, and nothing else
 *   · the season editor is the EXISTING PlayerStatsModal, which takes its field
 *     spec from `GET /players/:id/stats`; a coach holds `players.write`, so it
 *     works for them unchanged
 *   · career is READ-ONLY because no endpoint on this platform writes a
 *     `PlayerCareer` row — see the section's own comment
 *   · the photograph can be CHANGED but not removed, because the controller has
 *     no path that clears `Player.photo` — see PhotoBlock
 */

/* ── vocabulary ──────────────────────────────────────────────────────────── */

/** The 8MB the upload middleware accepts, mirrored so a doomed upload never starts. */
const MAX_UPLOAD = 8 * 1024 * 1024;

/** Server enums, not free text — the values `Player.skillLevel` and `.gender` accept. */
const SKILL_LEVELS = ['AMATEUR', 'SEMI_PROFESSIONAL', 'PROFESSIONAL', 'ELITE'];
const GENDERS = ['MALE', 'FEMALE'];

/** SCREAMING_ENUM → "Screaming enum". */
const label = (value: string) =>
  String(value || '').replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

/**
 * The same five document types TeamDocumentsPage names, spelled out again rather
 * than shared. The map is five lines and lives privately in each page; hoisting
 * it into a module would be the wrong abstraction to save ten lines, and this
 * file is not allowed to edit that one.
 */
const DOC_LABEL: Record<string, string> = {
  BIRTH_CERTIFICATE: 'Birth certificate',
  PASSPORT: 'Passport',
  NATIONAL_ID: 'National ID',
  MEDICAL: 'Medical',
  OTHER: 'Other',
};

const docLabel = (type: string) => DOC_LABEL[type] || label(type);

const SUSPENSION_REASON: Record<string, string> = {
  RED_CARD: 'Red card',
  YELLOW_ACCUMULATION: 'Accumulated yellow cards',
  MISCONDUCT: 'Misconduct',
  OTHER: 'Disciplinary ban',
};

/**
 * The state of one required document type for this player.
 *
 * IDENTICAL RULE TO TeamDocumentsPage: an approved file wins over a later upload,
 * otherwise the most recent upload is the live one. The two screens are read
 * minutes apart and must never disagree about whether a player is cleared.
 */
const stateFor = (documents: any[], type: string) => {
  const ofType = (documents || []).filter((d: any) => d.docType === type);
  if (!ofType.length) return { status: 'MISSING', doc: null as any };
  const approved = ofType.find((d: any) => d.status === 'APPROVED');
  if (approved) return { status: 'APPROVED', doc: approved };
  const latest = [...ofType].sort(
    (a, b) => +new Date(b.uploadedAt || 0) - +new Date(a.uploadedAt || 0)
  )[0];
  return { status: latest.status || 'PENDING', doc: latest };
};

const DOC_STATE: Record<string, { icon: any; text: string; ink: string }> = {
  APPROVED: { icon: Check, text: 'Approved', ink: 'text-brand-text' },
  PENDING: { icon: Clock3, text: 'In review with the league', ink: 'text-secondary' },
  REJECTED: { icon: AlertTriangle, text: 'Rejected', ink: 'text-danger-text' },
  MISSING: { icon: Plus, text: 'Not uploaded', ink: 'text-live' },
};

/**
 * Age in whole years, by the calendar rather than by dividing milliseconds.
 *
 * A raw date of birth is a fact a coach has to do arithmetic on, and it is also
 * restricted personal data they are seeing because of an eligibility duty — so
 * the page leads with the number that duty actually needs. The subtraction is
 * calendar-based because "has this year's birthday happened yet" is the whole
 * question a leap year gets wrong.
 */
const ageFrom = (dob?: string | null) => {
  if (!dob) return null;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - born.getFullYear();
  const monthGap = now.getMonth() - born.getMonth();
  if (monthGap < 0 || (monthGap === 0 && now.getDate() < born.getDate())) years -= 1;
  return years >= 0 && years < 130 ? years : null;
};

/**
 * A date the record may or may not hold, and may hold badly.
 *
 * `format` throws a RangeError on an invalid date rather than returning a dash,
 * which would take the whole page down over one malformed timestamp. Returning
 * null lets each caller simply omit the line.
 */
const dateText = (value: any) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : format(d, 'd MMM yyyy');
};

/** `cleanSheets` → "Clean sheets". The season keys are the server's own. */
const statLabel = (key: string) =>
  key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, (c) => c.toUpperCase());

const statValue = (value: any) =>
  typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : String(value);

/** W / D / L on tokens, the same mapping the public profile uses. */
const RESULT_TONE: Record<string, string> = {
  W: 'bg-brand-tint text-brand-text',
  D: 'bg-surface-3 text-secondary',
  L: 'bg-danger/10 text-danger-text',
};

/* ── an inline failure ───────────────────────────────────────────────────── */

/**
 * The server refuses by name and every refusal has a different fix, so the
 * message is shown VERBATIM. "Could not save" has no fix in it.
 */
const Alert = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    role="alert"
    className={cn(
      'flex items-start gap-2 rounded-card border border-danger/40 bg-danger/5 p-3 text-sm text-danger-text',
      className
    )}
  >
    <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

/* ── the photograph ──────────────────────────────────────────────────────── */

/**
 * ONE CONTROL, AND IT APPLIES IMMEDIATELY — the same shape as the reporter's own
 * PhotoPanel, for the same reason: a photograph is chosen in one gesture and
 * there is nothing to review afterwards that looking at it does not already tell
 * you. It must not sit as an unsaved change alongside the details form below,
 * where a coach who came to fix a shirt number would lose it.
 *
 * It writes the PLAYER's photo, not the account's: `PUT /players/:id` runs through
 * `upload.single('photo')`, so the file rides on the same multipart request the
 * details form uses — which is why `updatePlayer` is always multipart and there is
 * no second code path that only runs when a file is attached.
 *
 * THE PHOTO IS SHRUNK BEFORE IT IS SENT. A phone camera produces 3–12MB and the
 * server stores 400x400; downscaling in the browser makes that roughly 40KB of
 * WebP, which matters at a training ground on a mobile connection.
 *
 * THERE IS NO REMOVE CONTROL, DELIBERATELY. `updatePlayer` sets `photo` only from
 * `req.file` — it starts from `player.photo` and there is no body field that
 * clears it — so a "Remove photo" button could not do anything the server would
 * honour. A control that silently no-ops is worse than its absence; replacing the
 * photograph is the operation the API actually offers, so that is the only one
 * offered here.
 */
const PhotoBlock = ({
  player,
  onDone,
}: {
  player: any;
  onDone: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  // The chosen file, shown while it uploads. Without it the portrait keeps the
  // old photograph for as long as the request takes, which on 3G reads as a tap
  // that did nothing.
  const [preview, setPreview] = useState<string | null>(null);

  // An object URL is a live handle on a blob; dropping the component without
  // revoking it leaks the whole image for the life of the tab.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const clearPreview = () => setPreview((url) => { if (url) URL.revokeObjectURL(url); return null; });

  const upload = useMutation({
    mutationFn: async (file: File) => updatePlayer(player.id, {}, await downscaleImage(file)),
    onSuccess: () => { clearPreview(); onDone(); },
    onError: (e: any) => {
      clearPreview();
      setError(e?.response?.data?.message || 'Could not upload that photo. Check your connection and try again.');
    },
  });

  const choose = (file?: File | null) => {
    setError('');
    if (!file) return;
    // Both checks are the browser being helpful, not the browser being trusted —
    // the server re-checks the type and enforces the same ceiling.
    if (!file.type.startsWith('image/')) return setError('That file is not an image.');
    if (file.size > MAX_UPLOAD) {
      // Only reachable when downscaling cannot run at all; it normally lands far
      // under this. Said in megabytes because "8388608 bytes" helps nobody.
      return setError('That photo is larger than 8MB. Try a smaller one.');
    }
    setPreview(URL.createObjectURL(file));
    upload.mutate(file);
  };

  const src = preview || player.photo;

  return (
    <div className="flex shrink-0 flex-col items-start gap-3">
      <div className="relative">
        {/* Far bigger than the 40px a roster row uses: this is the one screen
            where the coach is judging the photograph itself. */}
        <Avatar
          src={src}
          name={player.fullName}
          size="lg"
          className={cn('h-24 w-24 text-2xl sm:h-28 sm:w-28', upload.isPending && 'opacity-50')}
        />
        {upload.isPending && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <Loader2 size={22} className="animate-spin text-brand-text" />
          </span>
        )}
      </div>

      <Button
        type="button"
        variant="secondary"
        icon={Camera}
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {player.photo ? 'Change photo' : 'Add a photo'}
      </Button>

      {/* The input is the real control; the button above only clicks it. A styled
          `<label>` would work too, but a button keeps the disabled state honest
          while an upload is in flight. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={player.photo ? 'Change photo' : 'Add a photo'}
        onChange={(e) => {
          choose(e.target.files?.[0]);
          // Reset, so choosing the SAME file again still fires a change event —
          // which is exactly what somebody does after a failed upload.
          e.target.value = '';
        }}
      />

      {error && <Alert className="max-w-xs">{error}</Alert>}
    </div>
  );
};

/* ── the details form ────────────────────────────────────────────────────── */

/**
 * The exact keys `updatePlayer` destructures off the request body, minus `active`.
 *
 * `active` IS DELIBERATELY ABSENT. Setting it to false is precisely what
 * `DELETE /players/:id` does, and two controls for one effect — one of them an
 * innocuous-looking switch buried in a form — is how a squad loses a player by
 * accident. Removing somebody is a decision, so it gets the confirmation at the
 * foot of this page and nothing else.
 *
 * `status`, `verifiedAt` and `verifiedBy` are absent because the endpoint ignores
 * them: verification is the league's judgement on a club's paperwork, not a field
 * the club fills in about itself.
 */
const emptyForm = {
  fullName: '',
  jerseyNumber: '',
  position: '',
  dateOfBirth: '',
  nationality: '',
  gender: 'MALE',
  skillLevel: 'AMATEUR',
  height: '',
  weight: '',
  idNumber: '',
  licenseNo: '',
  bio: '',
};

type FormShape = typeof emptyForm;

/**
 * Fields the controller CANNOT clear.
 *
 * It writes them as `value ? coerce(value) : undefined`, and `undefined` means
 * "leave alone" to Prisma — so sending a blank jersey number does not free the
 * shirt, it silently changes nothing. Blanking one of these is therefore reported
 * to the coach at the field rather than sent and quietly dropped, because a save
 * that reports success while ignoring half the form is the worst of both.
 */
const UNCLEARABLE = new Set<keyof FormShape>(['dateOfBirth', 'jerseyNumber', 'height', 'weight']);

const seedForm = (player: any): FormShape => ({
  fullName: player.fullName ?? '',
  jerseyNumber: player.jerseyNumber == null ? '' : String(player.jerseyNumber),
  position: player.position ?? '',
  // <input type="date"> speaks yyyy-mm-dd; the API sends an ISO timestamp.
  dateOfBirth: player.dateOfBirth ? String(player.dateOfBirth).slice(0, 10) : '',
  nationality: player.nationality ?? '',
  gender: player.gender ?? 'MALE',
  skillLevel: player.skillLevel ?? 'AMATEUR',
  height: player.height == null ? '' : String(player.height),
  weight: player.weight == null ? '' : String(player.weight),
  idNumber: player.idNumber ?? '',
  licenseNo: player.licenseNo ?? '',
  bio: player.bio ?? '',
});

/* ── the page ────────────────────────────────────────────────────────────── */

const TeamPlayerPage = () => {
  // The document upload's own input and its target row — one input for the whole
  // clearance list, so a tap on a gap goes straight to the file picker.
  const docInputRef = useRef<HTMLInputElement>(null);
  const docTargetRef = useRef<string | null>(null);
  const [docBusy, setDocBusy] = useState<Record<string, boolean>>({});
  const [docError, setDocError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  // `/team/players/abc` is a typo, not a request. Deciding it here keeps a
  // pointless `GET /players/NaN` off a mobile connection.
  const playerId = Number(id);
  const validId = !!id && Number.isInteger(playerId) && playerId > 0;

  const { data: team, isLoading: teamLoading, isError: teamError, refetch: refetchTeam } = useMyTeam();

  const {
    data: player, isPending, isError, error, refetch,
  } = useQuery({
    // Its own key, NOT the public page's `['player', id]`: that one caches the
    // whole `{ success, data }` envelope, and two shapes under one key is a
    // rendering bug waiting for whichever page mounts second.
    queryKey: ['team-player', String(id)],
    queryFn: () => getPlayer(playerId),
    enabled: validId,
    retry: false,
  });

  /**
   * The league's required document types — a platform-wide constant that changes
   * when the league changes its rules, so it shares a key and a long stale time
   * with the squad and documents screens.
   */
  const { data: requirements } = useQuery({
    queryKey: ['document-requirements'],
    queryFn: getDocumentRequirements,
    staleTime: Infinity,
  });
  const requiredDocTypes: string[] = requirements?.requiredDocTypes || [];

  const [form, setForm] = useState<FormShape>(emptyForm);
  const [seeded, setSeeded] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Seed once, and never again — re-seeding on every render would wipe whatever
  // is being typed the moment a background refetch lands.
  useEffect(() => {
    if (player && !seeded) {
      setForm(seedForm(player));
      setSeeded(true);
    }
  }, [player, seeded]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['team-player', String(id)] });
    // The squad list and the documents matrix both read the same player out of
    // `GET /teams/my`; leaving that cache stale is how two screens disagree.
    queryClient.invalidateQueries({ queryKey: ['team-my'] });
  };

  const save = useMutation({
    mutationFn: (fields: Record<string, any>) => updatePlayer(playerId, fields),
    onSuccess: (updated: any) => {
      if (updated) {
        // Fold the saved row straight into the cache before the refetch lands.
        // The PUT returns the player WITHOUT its relations, so the fields are
        // merged over the existing record rather than replacing it — otherwise
        // the suspensions and documents above would blink out for a moment.
        queryClient.setQueryData(['team-player', String(id)], (old: any) =>
          (old ? { ...old, ...updated } : old));
        // Re-seed from what the SERVER stored, not from what was typed: it
        // coerces numbers and trims, so the form should show the record.
        setForm(seedForm(updated));
      }
      refresh();
      pushToast('Player details saved.', 'success');
    },
  });

  /**
   * Send one of this player's documents.
   *
   * MOVED HERE FROM THE STANDALONE DOCUMENTS PAGE, which showed the same
   * clearance this block already shows and was the only place a club could
   * actually upload. Keeping the display in two places and the action in one was
   * the repetition; the fix is for the row that reports a gap to be the control
   * that closes it.
   *
   * The row already knows the player and the document type, so choosing a file
   * IS the confirmation — there is nothing left to decide.
   */
  const sendDoc = useMutation({
    mutationFn: ({ docType, file }: { docType: string; file: File }) => {
      const body = new FormData();
      body.append('file', file);
      body.append('playerId', String(playerId));
      body.append('docType', docType);
      return uploadDocument(body);
    },
    onSuccess: (_d, { docType }) => {
      refresh();
      pushToast(`${docLabel(docType)} sent for review.`, 'success');
    },
    onSettled: (_d, _e, { docType }) =>
      setDocBusy((prev) => {
        const next = { ...prev };
        delete next[docType];
        return next;
      }),
    // Verbatim: the endpoint refuses by name — no file, not your club, player
    // not found — and each of those has a different fix.
    onError: (e: any) =>
      setDocError(e?.response?.data?.message || 'Could not upload that file. Check your connection and try again.'),
  });

  const pickDoc = (docType: string) => {
    setDocError('');
    docTargetRef.current = docType;
    docInputRef.current?.click();
  };

  const onDocFile = (file?: File | null) => {
    const docType = docTargetRef.current;
    if (!file || !docType) return;
    // The server's own ceiling, mirrored so a doomed upload never starts.
    if (file.size > 8 * 1024 * 1024) {
      return setDocError(`${file.name} is larger than 8MB. Photograph the page at a lower resolution, or send a PDF.`);
    }
    setDocBusy((prev) => ({ ...prev, [docType]: true }));
    sendDoc.mutate({ docType, file });
  };

  const remove = useMutation({
    mutationFn: () => deletePlayer(playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-my'] });
      pushToast(`${player?.fullName} was removed from your squad.`, 'success');
      navigate('/team/players');
    },
    onError: (e: any) =>
      pushToast(e?.response?.data?.message || 'Could not remove this player. Try again.', 'error'),
  });

  /* ── derived ─────────────────────────────────────────────────────────── */

  const suspensions: any[] = player?.suspensions || [];
  const documents: any[] = player?.documents || [];
  const career: any[] = player?.career || [];
  const form5: any[] = player?.form || [];

  // Not memoised: this is a map over the five document types the league asks for,
  // and memoising it would cost a dependency array on two values that are rebuilt
  // every render anyway.
  const docRows = requiredDocTypes.map((type) => ({ type, ...stateFor(documents, type) }));
  const docGaps = docRows.filter((r) => r.status !== 'APPROVED');

  const season: Record<string, any> = player?.season || {};
  const seasonEntries = Object.entries(season).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );

  /** Which blanked fields the server would silently ignore, named at the field. */
  const ignoredBlanks = useMemo(() => {
    if (!player) return new Set<string>();
    const before = seedForm(player);
    return new Set(
      [...UNCLEARABLE].filter((key) => form[key] === '' && before[key] !== '')
    );
  }, [player, form]);

  const changed = useMemo(() => {
    if (!player) return {} as Record<string, any>;
    const before = seedForm(player);
    const out: Record<string, any> = {};
    (Object.keys(emptyForm) as Array<keyof FormShape>).forEach((key) => {
      if (form[key] === before[key]) return;
      // Never send a blank the server would drop — see UNCLEARABLE.
      if (form[key] === '' && UNCLEARABLE.has(key)) return;
      out[key] = form[key];
    });
    return out;
  }, [player, form]);

  const dirty = Object.keys(changed).length > 0;

  /* ── states before the page ──────────────────────────────────────────── */

  const back = (
    <Link
      to="/team/players"
      className="mb-4 inline-flex min-h-tap items-center gap-1 text-sm text-secondary transition-colors duration-150 ease-standard hover:text-primary"
    >
      <ChevronLeft size={16} aria-hidden="true" />
      Back to your squad
    </Link>
  );

  if (!validId) {
    return (
      <div className="max-w-4xl">
        {back}
        <ErrorState
          title="That is not a player"
          hint="The address is missing a player number. Open a player from your squad list instead."
        />
      </div>
    );
  }

  if (isPending || teamLoading) {
    return (
      <div className="max-w-4xl" role="status" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading this player</span>
        {back}
        <Skeleton className="h-44 w-full rounded-card" />
        <Skeleton className="mt-4 h-56 w-full rounded-card" />
        <Skeleton className="mt-4 h-72 w-full rounded-card" />
      </div>
    );
  }

  const status = (error as any)?.response?.status;

  if (isError || !player) {
    return (
      <div className="max-w-4xl">
        {back}
        {status === 404 ? (
          <ErrorState
            title="No such player"
            hint="They may already have been removed from the squad. Your squad list shows everyone currently registered."
          />
        ) : (
          <ErrorState
            title="Could not load this player"
            hint="Their record is safe. This is a connection problem."
            onRetry={() => refetch()}
          />
        )}
      </div>
    );
  }

  if (teamError || !team) {
    return (
      <div className="max-w-4xl">
        {back}
        <ErrorState
          title="Could not load your club"
          hint="This page has to know which club you run before it can show you a player. This is a connection problem."
          onRetry={() => refetchTeam()}
        />
      </div>
    );
  }

  /**
   * SOMEBODY ELSE'S PLAYER.
   *
   * `GET /players/:id` carries `attachUser`, not a club scope — it is the public
   * profile endpoint, and it hands the UNREDACTED record to anyone in
   * PERSONAL_DATA_ROLES, which includes every TEAM_MANAGER on the platform. So an
   * edited URL loads a rival club's player, complete with their date of birth and
   * national ID, and the form below would offer to edit them. The writes would be
   * refused — `canManageTeam` gates both PUT and DELETE — but the reading has
   * already happened by then, and a form that can only fail is a lie about what
   * this account may do.
   *
   * It is an error state rather than a read-only view for the same reason: this
   * portal has no business rendering another club's private record at all.
   */
  if (player.teamId !== team.id) {
    return (
      <div className="max-w-4xl">
        {back}
        <ErrorState
          title="This player is not in your squad"
          hint="They are registered to another club, so their record is not yours to see or change."
        />
      </div>
    );
  }

  const age = ageFrom(player.dateOfBirth);
  const banned = suspensions.length > 0;
  const cleared = !banned && requiredDocTypes.length > 0 && docGaps.length === 0;

  const saveError = (save.error as any)?.response?.data;
  const saveIssues: string[] = Array.isArray(saveError?.issues) ? saveError.issues : [];

  const set = (key: keyof FormShape) => (e: any) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="max-w-4xl">
      {back}

      {/*
        ── 1 · who they are ────────────────────────────────────────────

        THE HERO IS THE PAGE HEADER. A detail page about one person does not get
        a PageHeader printing the name above a card printing it again — two
        headings with identical text is a screen reader reading the player twice
        and a phone losing a third of the fold to nothing.
      */}

      <section className="rounded-card border border-hairline bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <PhotoBlock player={player} onDone={refresh} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="font-display text-xl font-bold tracking-[-0.01em] text-primary sm:text-2xl">
                {player.fullName}
              </h1>
              {/* The league's verdict on this player's registration — its own
                  vocabulary, so it is rendered by the component that owns it. */}
              {player.status && <StatusPill status={player.status} />}
            </div>

            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-secondary">
              {player.jerseyNumber != null && (
                <span className="tabular-nums">Shirt {player.jerseyNumber}</span>
              )}
              {player.jerseyNumber != null && player.position && <span aria-hidden="true">·</span>}
              {player.position && <span>{player.position}</span>}
              {!player.position && player.jerseyNumber == null && (
                <span className="text-tertiary">No shirt number or position recorded</span>
              )}
            </p>

            {/* Four facts, two abreast at 360px. Age rather than a date of birth:
                see ageFrom. Height carries its unit because a bare "184" on a
                club screen could be centimetres or a licence number. */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              <Fact label="Age" value={age == null ? 'Not recorded' : <span className="tabular-nums">{age} years</span>} />
              <Fact label="Nationality" value={player.nationality || 'Not recorded'} />
              <Fact
                label="Height"
                value={player.height ? <span className="tabular-nums">{player.height} cm</span> : 'Not recorded'}
              />
              <Fact label="Level" value={player.skillLevel ? label(player.skillLevel) : 'Not recorded'} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2 · can this player play? ─────────────────────────────────── */}

      <Panel
        className="mt-4"
        title="Can this player play?"
        hint="A ban and a missing document both stop a name going on a team sheet, and neither shows up anywhere else in this portal."
      >
        {/* THE ANSWER FIRST. A coach opening this block is asking one question,
            and everything under this line is the working. */}
        <p
          className={cn(
            'flex items-start gap-2 text-sm font-semibold',
            banned ? 'text-danger-text' : cleared ? 'text-brand-text' : 'text-live'
          )}
        >
          {banned ? <Ban size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            : cleared ? <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              : <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />}
          <span className="min-w-0">
            {banned
              ? 'Suspended — this player cannot be named on a team sheet.'
              : cleared
                ? 'Cleared to play. Every required document is approved and there is no ban.'
                : docGaps.length > 0
                  ? `Not cleared — ${docGaps.length} required ${docGaps.length === 1 ? 'document is' : 'documents are'} outstanding.`
                  : 'No ban on file. The league has not published any document requirements.'}
          </span>
        </p>

        {/* ── active suspensions ─────────────────────────────────────── */}

        <h3 className="mt-5 text-xs font-semibold text-tertiary">Suspensions</h3>
        {banned ? (
          <ul className="mt-2 space-y-2">
            {suspensions.map((s: any) => {
              const total = Number(s.matches) || 0;
              const served = Number(s.matchesServed) || 0;
              const left = Math.max(total - served, 0);
              return (
                <li key={s.id} className="rounded-card border border-danger/40 bg-danger/5 p-3">
                  <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-danger-text">
                    <Ban size={14} className="shrink-0" aria-hidden="true" />
                    {SUSPENSION_REASON[s.reason] || label(s.reason)}
                    {dateText(s.createdAt) && (
                      <span className="text-xs font-normal tabular-nums text-secondary">
                        issued {dateText(s.createdAt)}
                      </span>
                    )}
                  </p>
                  <p className="mt-1.5 text-sm text-danger-text">
                    <span className="font-semibold tabular-nums">{served} of {total}</span>
                    {' '}
                    {total === 1 ? 'match' : 'matches'} served.
                    {' '}
                    {/* SAID PLAINLY, because the alternative is finding out from a
                        rejected team sheet the night before the match. */}
                    <strong className="font-semibold">
                      {player.fullName} cannot be named in a team sheet until {left === 1
                        ? 'one more match'
                        : `${left} more matches`} {left === 1 ? 'has' : 'have'} been served.
                    </strong>
                  </p>
                  {s.note && <p className="mt-1.5 text-sm text-secondary">{s.note}</p>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 flex items-center gap-2 text-sm text-secondary">
            <Check size={14} className="shrink-0 text-brand-text" aria-hidden="true" />
            No active suspension. Nothing on the disciplinary record is stopping this player.
          </p>
        )}

        {/* ── document clearance ─────────────────────────────────────── */}

        <div className="mt-5 flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold text-tertiary">Document clearance</h3>
          <span className="shrink-0 text-xs text-tertiary">Tap a gap to send the file</span>
        </div>

        {/* One input for the whole list. `accept` matches what the server can
            actually store — a scanned certificate is usually a PDF. */}
        <input
          ref={docInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            onDocFile(e.target.files?.[0]);
            // Reset, so choosing the SAME file again still fires a change event —
            // which is exactly what happens after a failed upload.
            e.target.value = '';
          }}
        />

        {docError && (
          <p
            role="alert"
            className="mt-2 flex items-start gap-2 rounded-card border border-danger/40 bg-danger/5 p-3 text-sm text-danger-text"
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">{docError}</span>
            <button type="button" onClick={() => setDocError('')} aria-label="Dismiss" className="shrink-0">
              <X size={15} aria-hidden="true" />
            </button>
          </p>
        )}

        {requiredDocTypes.length === 0 ? (
          // The league decides what a club owes. With nothing published there is
          // no checklist to draw, and a list of empty slots would read as "you
          // are missing everything" — the opposite of the truth.
          <p className="mt-2 flex items-start gap-2 text-sm text-secondary">
            <ClipboardList size={14} className="mt-0.5 shrink-0 text-tertiary" aria-hidden="true" />
            The league has not set any document requirements, so nothing is required of this player yet.
          </p>
        ) : (
          <ul className="mt-2 overflow-hidden rounded-card border border-hairline">
            {docRows.map(({ type, status: docStatus, doc }) => {
              const meta = DOC_STATE[docStatus] || DOC_STATE.MISSING;
              const busy = !!docBusy[type];
              const Icon = busy ? Loader2 : meta.icon;
              // Only the two states a club can act on are controls. An approved
              // document needs nothing and a pending one is the league's move.
              const actionable = docStatus === 'MISSING' || docStatus === 'REJECTED';
              const line = (
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-primary">{docLabel(type)}</span>
                  <span className={cn('inline-flex shrink-0 items-center gap-1.5 text-xs font-medium', meta.ink)}>
                    <Icon size={13} className={cn(busy && 'animate-spin')} aria-hidden="true" />
                    {busy ? 'Sending' : actionable ? `${meta.text} — send` : meta.text}
                  </span>
                </div>
              );
              return (
                <li key={type} className="border-b border-hairline last:border-0">
                  {actionable ? (
                    <button
                      type="button"
                      onClick={() => pickDoc(type)}
                      disabled={busy}
                      className="flex min-h-tap w-full flex-col px-3 py-2.5 text-left transition-colors duration-150 ease-standard hover:bg-surface-2"
                    >
                      {line}
                    </button>
                  ) : (
                    <div className="px-3 py-2.5">{line}</div>
                  )}
                  <div className={cn(actionable ? 'px-3 pb-2.5' : 'px-3 pb-2.5')}>
                  {/* THE REJECTION NOTE IS THE POINT OF A REJECTION — the reviewer
                      writes it to say what is wrong. Without it the club uploads
                      the same file and is refused again. */}
                  {docStatus === 'REJECTED' && (
                    <p className="flex items-start gap-1.5 text-xs text-danger-text">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span className="min-w-0">
                        {doc?.reviewNote || 'No reason was recorded. Send a clear, complete copy.'}
                      </span>
                    </p>
                  )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* ── 3 · details ───────────────────────────────────────────────── */}

      <Panel
        className="mt-4"
        title="Details"
        hint="Exactly the fields the league's player record accepts. Whether they are verified is the league's decision, not a field here."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.reset();
            save.mutate(changed);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required className="sm:col-span-2">
              {(p: any) => (
                <Input {...p} value={form.fullName} onChange={set('fullName')} maxLength={200} autoComplete="off" />
              )}
            </Field>

            <Field
              label="Shirt number"
              hint={ignoredBlanks.has('jerseyNumber')
                ? 'Left blank, the number stays as it is — the league record has no way to free a shirt from here.'
                : 'The league refuses two players in one squad on the same number.'}
            >
              {(p: any) => (
                <Input
                  {...p}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={99}
                  value={form.jerseyNumber}
                  onChange={set('jerseyNumber')}
                  className="tabular-nums"
                />
              )}
            </Field>

            <Field label="Position">
              {(p: any) => (
                <Input {...p} value={form.position} onChange={set('position')} maxLength={100} placeholder="Goalkeeper" />
              )}
            </Field>

            <Field
              label="Date of birth"
              hint={ignoredBlanks.has('dateOfBirth')
                ? 'Left blank, the recorded date stays as it is.'
                : 'Used for age eligibility. Only the league and your club can see it.'}
            >
              {(p: any) => (
                <Input {...p} type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
              )}
            </Field>

            <Field
              label="Nationality"
              hint="Counted against the league's limit on foreign players."
            >
              {(p: any) => (
                <Input {...p} value={form.nationality} onChange={set('nationality')} maxLength={100} placeholder="Rwandan" />
              )}
            </Field>

            <Field label="Gender">
              {(p: any) => (
                <Select
                  {...p}
                  size="md"
                  value={form.gender}
                  onChange={set('gender')}
                  options={GENDERS.map((g) => ({ value: g, label: label(g) }))}
                />
              )}
            </Field>

            <Field label="Level">
              {(p: any) => (
                <Select
                  {...p}
                  size="md"
                  value={form.skillLevel}
                  onChange={set('skillLevel')}
                  options={SKILL_LEVELS.map((s) => ({ value: s, label: label(s) }))}
                />
              )}
            </Field>

            <Field
              label="Height (cm)"
              hint={ignoredBlanks.has('height') ? 'Left blank, the recorded height stays as it is.' : undefined}
            >
              {(p: any) => (
                <Input
                  {...p}
                  type="number"
                  inputMode="numeric"
                  min={100}
                  max={260}
                  value={form.height}
                  onChange={set('height')}
                  className="tabular-nums"
                />
              )}
            </Field>

            <Field
              label="Weight (kg)"
              hint={ignoredBlanks.has('weight') ? 'Left blank, the recorded weight stays as it is.' : undefined}
            >
              {(p: any) => (
                <Input
                  {...p}
                  type="number"
                  inputMode="numeric"
                  min={30}
                  max={200}
                  value={form.weight}
                  onChange={set('weight')}
                  className="tabular-nums"
                />
              )}
            </Field>

            <Field
              label="National ID or passport number"
              hint="Restricted personal data. Held for eligibility checks and never shown publicly."
            >
              {(p: any) => (
                <Input {...p} value={form.idNumber} onChange={set('idNumber')} maxLength={60} autoComplete="off" />
              )}
            </Field>

            <Field label="Federation licence number">
              {(p: any) => (
                <Input {...p} value={form.licenseNo} onChange={set('licenseNo')} maxLength={60} autoComplete="off" />
              )}
            </Field>

            <Field label="Notes" className="sm:col-span-2">
              {(p: any) => (
                <textarea
                  {...p}
                  rows={3}
                  value={form.bio}
                  onChange={set('bio')}
                  className="w-full rounded-input border border-hairline bg-surface px-4 py-3 text-primary transition-colors duration-150 ease-standard placeholder:text-tertiary hover:border-brand/40 focus:border-brand focus:outline-none"
                />
              )}
            </Field>
          </div>

          {/*
            THE 422 IS SHOWN VERBATIM. The eligibility rules refuse by name —
            "Jersey number 9 is already taken", "Squad is full", "Foreign player
            quota exceeded" — and each has a completely different fix. The
            controller sends `message` (which is `issues[0]`) alongside the whole
            `issues` array, so the list is rendered when there is more than one
            and the message alone when there is not. Flattening either into
            "Could not save" throws away the only useful part of the response.
          */}
          {save.isError && (
            <Alert className="mt-4">
              {saveIssues.length > 1 ? (
                <ul className="list-disc space-y-1 pl-4">
                  {saveIssues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
              ) : (
                saveError?.message || saveIssues[0] || 'Could not save these details. Check your connection and try again.'
              )}
            </Alert>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="submit" loading={save.isPending} disabled={!dirty}>
              {save.isPending ? 'Saving' : 'Save details'}
            </Button>
            {dirty && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => { save.reset(); setForm(seedForm(player)); }}
              >
                Discard changes
              </Button>
            )}
            {!dirty && !save.isPending && (
              <span className="text-sm text-tertiary">Nothing to save.</span>
            )}
          </div>
        </form>
      </Panel>

      {/* ── 4 · season ────────────────────────────────────────────────── */}

      <Panel
        className="mt-4"
        title={
          <span className="flex items-center gap-2">
            <BarChart3 size={15} className="text-brand-text" aria-hidden="true" />
            {player.recordedSeason || 'This season'}
          </span>
        }
        hint="These figures appear on the player's public profile."
      >
        {/* A BLANK FIGURE IS NOT A ZERO. The server returns an empty season rather
            than a row of noughts precisely so this can say "nobody has counted"
            instead of claiming the player played and did nothing. */}
        {seasonEntries.length === 0 ? (
          <p className="text-sm text-secondary">
            Nothing has been recorded for this player yet — no appearances derived from team sheets,
            and no figures entered by hand.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {seasonEntries.map(([key, value]) => (
              <div key={key} className="rounded-card border border-hairline bg-surface-2 p-3">
                {/* The figure leads and the label sits under it — the same order
                    as AdminUI's StatCard, so a number reads the same everywhere
                    in the product. Plain elements rather than a <dl>: a
                    definition list requires the term BEFORE the description, and
                    reversing them for looks would be invalid markup. */}
                <p className="font-display text-2xl font-bold tabular-nums leading-none text-primary">
                  {statValue(value)}
                </p>
                <p className="mt-1.5 text-xs text-tertiary">{statLabel(key)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent form, from the same response: the five most recent completed
            matches, newest first. The link goes to the CLUB's match page rather
            than the public one, because that is the copy of the fixture this
            portal owns. */}
        {form5.length > 0 && (
          <>
            <h3 className="mt-5 text-xs font-semibold text-tertiary">Recent form</h3>
            <ul className="mt-2 overflow-hidden rounded-card border border-hairline">
              {form5.map((f: any) => (
                <li key={f.fixtureId} className="border-b border-hairline last:border-0">
                  <Link
                    to={`/team/match/${f.fixtureId}`}
                    className="flex min-h-tap items-center gap-3 px-3 py-2.5 transition-colors duration-150 ease-standard hover:bg-surface-2"
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-pill text-xs font-bold',
                        RESULT_TONE[f.result] || RESULT_TONE.D
                      )}
                    >
                      {f.result}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-primary">
                        {f.home ? 'v ' : 'away to '}{f.opponent?.shortName || f.opponent?.name || 'Unknown club'}
                      </span>
                      {dateText(f.date) && (
                        <span className="block text-xs tabular-nums text-tertiary">
                          {dateText(f.date)}
                        </span>
                      )}
                    </span>
                    {f.contribution?.value > 0 && (
                      <span className="shrink-0 rounded-pill bg-brand-tint px-2 py-0.5 text-xs font-semibold text-brand-text">
                        <span className="tabular-nums">{f.contribution.value}</span> {f.contribution.label}
                      </span>
                    )}
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{f.score}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* THE EXISTING EDITOR, NOT A SECOND ONE. PlayerStatsModal builds its
            fields from `GET /players/:id/stats`, which returns the stat spec for
            this player's sport — so a basketballer is asked for points and
            rebounds and a footballer for goals and cards, and adding a stat to
            the server's spec makes it enterable here without touching this file.
            A second copy of that table would have drifted the first time a sport
            gained a column. Both its routes sit behind `players.write`, which a
            TEAM_MANAGER holds. */}
        <Button
          type="button"
          variant="secondary"
          icon={BarChart3}
          className="mt-4"
          onClick={() => setStatsOpen(true)}
        >
          {seasonEntries.length === 0 ? 'Record a season' : 'Edit these figures'}
        </Button>
      </Panel>

      {/* ── 5 · career ────────────────────────────────────────────────── */}

      {/*
        READ-ONLY, AND NOT FOR WANT OF TRYING. `PlayerCareer` is returned by
        `GET /players/:id` — ordered current-first then by year descending, which
        is the newest-first order below — and NO endpoint on this platform writes
        one: there is no career route, and neither `createPlayer` nor
        `updatePlayer` touches the relation. Rows arrive with the record.

        So there is no editor here. Building one would mean either inventing an
        endpoint that does not exist or writing a form whose Save button could
        only ever fail, and a control that cannot work is worse than its absence.
        If a club needs a spell corrected, that is a request to the league.
      */}
      {career.length > 0 && (
        <Panel
          className="mt-4"
          title={
            <span className="flex items-center gap-2">
              <History size={15} className="text-brand-text" aria-hidden="true" />
              Career
            </span>
          }
          hint="Held by the league. Ask them to correct a spell — no club endpoint writes these."
          flush
        >
          <ol>
            {career.map((c: any) => (
              <li key={c.id} className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0">
                <span
                  aria-hidden="true"
                  className={cn('h-2 w-2 shrink-0 rounded-pill', c.current ? 'bg-brand' : 'bg-surface-3')}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">{c.club}</p>
                  {c.country && <p className="text-xs text-tertiary">{c.country}</p>}
                </div>
                <span className="shrink-0 text-sm tabular-nums text-secondary">
                  {c.current
                    ? c.fromYear ? `Since ${c.fromYear}` : 'Current club'
                    : [c.fromYear, c.toYear].filter(Boolean).join('–') || '—'}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {/* ── 6 · remove from the squad ─────────────────────────────────── */}

      <Panel
        className="mt-4"
        title="Remove from the squad"
        hint="The last thing on the page, because it is the last thing a coach should reach for."
      >
        <p className="text-sm text-secondary">
          Removing {player.fullName} takes them off your squad list and out of every future team sheet.
        </p>
        <Button
          type="button"
          variant="secondary"
          icon={UserMinus}
          // Every hover utility is restated, not just the resting ones: the
          // secondary variant turns its label brand-green on hover, and twMerge
          // only resolves a conflict within the same modifier group.
          className="mt-3 border-danger/40 text-danger-text hover:border-danger/60 hover:bg-danger/10 hover:text-danger-text"
          onClick={() => setConfirmRemove(true)}
        >
          Remove from squad
        </Button>
      </Panel>

      {/*
        WHAT THE CONTROLLER ACTUALLY DOES. `deletePlayer` is a SOFT DEACTIVATE —
        `prisma.player.update({ data: { active: false } })`. Nothing is erased: the
        appearances, the events and the results this player is part of all stay,
        which is the only way last season's table still adds up.

        But the record does leave this portal for good. `GET /teams/my` includes
        only `active: true` players and `GET /players/:id` 404s on an inactive one,
        so a coach cannot see them again, and cannot undo this themselves. The
        confirmation says exactly that rather than the softer half of it.
      */}
      <Modal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={`Remove ${player.fullName}?`}
        description="They come off your squad list and can no longer be named on a team sheet."
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmRemove(false)} disabled={remove.isPending}>
              Keep them
            </Button>
            <Button variant="danger" icon={Trash2} loading={remove.isPending} onClick={() => remove.mutate()}>
              Remove from squad
            </Button>
          </div>
        }
      >
        <p className="text-sm text-secondary">
          Their history stays on the platform — every appearance, goal and card they are part of is kept,
          so past results still add up.
        </p>
        <p className="mt-3 text-sm text-secondary">
          You will not be able to see or restore this player from the club portal afterwards. If they come
          back to {team.name}, ask the league to reinstate the record rather than registering them twice.
        </p>
      </Modal>

      <PlayerStatsModal
        player={player}
        open={statsOpen}
        onClose={() => {
          setStatsOpen(false);
          // The modal invalidates its own key and the public profile's; this page
          // reads the same figures under a different one, so it refetches itself.
          refresh();
        }}
      />
    </div>
  );
};

export default TeamPlayerPage;
