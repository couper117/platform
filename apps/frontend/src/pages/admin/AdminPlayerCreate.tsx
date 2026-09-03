import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Camera, Trash2, UserPlus, Users } from 'lucide-react';
import apiClient from '../../api/client';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { Button, IconButton, Field, Input, Select, Avatar, cn } from '../../components/ui';
import useSportScope from '../../hooks/useSportScope';
import useUiStore from '../../store/uiStore';

/**
 * Registering a player, on a page of its own.
 *
 * WHY NOT THE MODAL IT REPLACES. A licence record is a record, and a modal is
 * usually right for those — but this one carries fourteen fields, a photograph
 * and three rules that can reject it, crammed into a 600px dialog with no URL to
 * return to and one stray Escape between an operator and everything they typed.
 * Registering a squad is twenty-five of these in a row; it deserves a room.
 *
 * `/admin/players/create` is linkable, survives a refresh, and Back does what
 * Back should. The access gate needed no change: isAdminPathAllowed matches by
 * prefix, so the new path inherits players.write from /admin/players.
 *
 * TWO COLUMNS, THE PERSON AND THEIR PLACE. The left is who this is — the details
 * that go on a licence. The right is where they are going: the photograph as it
 * will actually appear, and the squad they are joining.
 *
 * WHY THE SQUAD PANEL EXISTS. The API refuses a duplicate jersey number, a full
 * squad and an over-quota foreign signing with a 422, and the old modal learned
 * about all three only after submitting a completed form. The squad is already
 * readable here, so the numbers already taken are shown while the number is being
 * chosen, and a clash is caught before the form is sent. The server still
 * enforces every rule — this only spares the operator a round trip.
 */

const EMPTY = {
  teamId: '', fullName: '', dateOfBirth: '', nationality: 'Rwandan', gender: 'MALE',
  position: '', jerseyNumber: '', skillLevel: 'AMATEUR', idNumber: '', licenseNo: '',
  height: '', weight: '', bio: '',
};

/** The fields that describe the person, cleared between two players of one club. */
const PERSON_FIELDS = ['fullName', 'dateOfBirth', 'position', 'jerseyNumber', 'idNumber', 'licenseNo', 'height', 'weight', 'bio'];

const CONTROL =
  'w-full rounded-input border border-hairline bg-surface px-4 py-3 text-primary placeholder:text-tertiary ' +
  'transition-colors duration-150 ease-standard hover:border-brand/40 focus:border-brand focus:outline-none';

/** Whole years, counted the way a birthday is. */
const ageFrom = (iso: string) => {
  if (!iso) return null;
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years -= 1;
  return years;
};

/** The example position for a sport reads differently in each one. */
const positionExample = (label: string) =>
  label === 'Weight Category' ? '-73kg'
    : label === 'Specialty' ? 'Sprinter'
      : label === 'Discipline' ? 'Singles'
        : 'Goalkeeper';

const AdminPlayerCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [params] = useSearchParams();
  const scope = useSportScope();
  const p = scope.profile;
  const rosterOne = p?.roster || 'Player';
  const rosterMany = p?.rosterPlural || 'Players';
  const posLabel = p?.rosterField || 'Position';
  const teamLabel = p?.competitor || 'Team';

  // Arriving from a club's own page pre-selects it, so registering a squad does
  // not mean picking the same club twenty-five times.
  const [form, setForm] = useState({ ...EMPTY, teamId: params.get('teamId') || '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  // Set by whichever button was pressed, read once the save resolves.
  const againRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const { data: teams } = useQuery({
    queryKey: ['admin-teams-forplayers', scope.key],
    queryFn: async () => {
      const { data } = await apiClient.get('/teams', { params: { status: 'VERIFIED', ...scope.params } });
      return data.data;
    },
  });

  // The squad this player is joining. Only fetched once a club is chosen, and it
  // is the whole squad — /players returns an unpaginated list when no page or
  // limit is asked for, so the numbers below are all of them.
  const { data: squad, isLoading: squadLoading } = useQuery({
    queryKey: ['admin-team-squad', form.teamId],
    enabled: !!form.teamId,
    queryFn: async () => {
      const { data } = await apiClient.get('/players', { params: { teamId: form.teamId } });
      return data.data;
    },
  });

  // Object URLs are a resource, not a string: released when the choice changes or
  // the operator leaves, so a long registration session does not leak every
  // photograph tried.
  useEffect(() => {
    if (!photoFile) { setPhotoPreview(null); return; }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const takenJerseys = useMemo(
    () => new Set<number>((squad || []).map((s: any) => s.jerseyNumber).filter((n: any) => n != null)),
    [squad]
  );
  const jerseyClash = form.jerseyNumber !== '' && takenJerseys.has(Number(form.jerseyNumber));

  const team = useMemo(
    () => (teams || []).find((t: any) => String(t.id) === String(form.teamId)),
    [teams, form.teamId]
  );

  const age = ageFrom(form.dateOfBirth);

  const set = (k: string) => (e: any) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    // The message about a field goes away as soon as the field is touched; leaving
    // it up while someone corrects it says the correction did not count.
    setErrors((prev) => (prev[k] ? { ...prev, [k]: '' } : prev));
  };

  const create = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v != null) fd.append(k, String(v)); });
      if (photoFile) fd.append('photo', photoFile);
      const { data } = await apiClient.post('/players', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data.data;
    },
    onSuccess: (player: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-players'] });
      queryClient.invalidateQueries({ queryKey: ['admin-team-squad', form.teamId] });
      pushToast(`${player?.fullName || rosterOne} registered`, 'success');

      if (!againRef.current) { navigate('/admin/players'); return; }

      // Same club, next player: the club, the nationality and the level are
      // shared across a squad, so only the person is cleared.
      setForm((f) => ({ ...f, ...Object.fromEntries(PERSON_FIELDS.map((k) => [k, ''])) }));
      setPhotoFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setErrors({});
      setError('');
      nameRef.current?.focus();
    },
    onError: (e: any) => setError(e.response?.data?.message || `Could not register this ${rosterOne.toLowerCase()}`),
  });

  const submit = (again: boolean) => (e: React.FormEvent) => {
    e.preventDefault();
    againRef.current = again;
    setError('');

    const next: Record<string, string> = {};
    if (!form.teamId) next.teamId = `Choose the ${teamLabel.toLowerCase()} they are registered with`;
    if (!form.fullName.trim()) next.fullName = 'A full name is required';
    else if (form.fullName.trim().length < 2) next.fullName = 'That is too short to be a name';
    if (age !== null && age < 0) next.dateOfBirth = 'That date is in the future';
    if (jerseyClash) next.jerseyNumber = `Number ${form.jerseyNumber} is already worn in this squad`;

    setErrors(next);
    if (Object.keys(next).length) return;
    create.mutate();
  };

  return (
    <form onSubmit={submit(false)}>
      <Link
        to="/admin/players"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
      >
        <ChevronLeft size={14} aria-hidden="true" /> {rosterMany}
      </Link>

      <PageHeader
        title={`Register a ${rosterOne.toLowerCase()}`}
        subtitle={`They join the registry immediately, and appear on the public squad page once their paperwork is verified.`}
        actions={
          <>
            <Button to="/admin/players" variant="secondary" size="sm">Cancel</Button>
            <Button type="submit" size="sm" icon={UserPlus} loading={create.isPending && !againRef.current}>
              Register
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Who this is */}
        <div className="space-y-4">
          <Panel title="Identity" hint="As it appears on the document that proves it.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" required error={errors.fullName} className="sm:col-span-2">
                {(f: any) => (
                  <input
                    {...f}
                    ref={nameRef}
                    value={form.fullName}
                    onChange={set('fullName')}
                    placeholder="Given name and family name"
                    autoComplete="off"
                    // The name is the one thing on this page worth setting in the
                    // type it will be read in.
                    className={cn(
                      CONTROL,
                      'font-display text-lg font-bold tracking-[-0.01em]',
                      errors.fullName && 'border-danger'
                    )}
                  />
                )}
              </Field>

              <Field
                label="Date of birth"
                error={errors.dateOfBirth}
                hint={age !== null && age >= 0 ? `${age} years old` : 'Decides which age category they may play in.'}
              >
                {(f: any) => (
                  <Input
                    {...f}
                    type="date"
                    invalid={!!errors.dateOfBirth}
                    value={form.dateOfBirth}
                    onChange={set('dateOfBirth')}
                  />
                )}
              </Field>

              <Field label="Gender">
                {(f: any) => (
                  <Select
                    {...f}
                    size="md"
                    value={form.gender}
                    onChange={set('gender')}
                    options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }]}
                  />
                )}
              </Field>

              <Field label="Nationality" hint="Non-Rwandan players count against the foreign quota.">
                {(f: any) => <Input {...f} value={form.nationality} onChange={set('nationality')} placeholder="Rwandan" />}
              </Field>

              <Field label="National ID / passport" hint="Held for verification only. Never shown publicly.">
                {(f: any) => <Input {...f} value={form.idNumber} onChange={set('idNumber')} placeholder="ID or passport number" />}
              </Field>
            </div>
          </Panel>

          <Panel title="Registration" hint="Where they play, and under which licence.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={teamLabel} required error={errors.teamId} className="sm:col-span-2">
                {(f: any) => (
                  <Select
                    {...f}
                    size="md"
                    invalid={!!errors.teamId}
                    value={form.teamId}
                    onChange={set('teamId')}
                    placeholder={`Select ${teamLabel.toLowerCase()}…`}
                    options={(teams || []).map((tm: any) => ({ value: tm.id, label: tm.name }))}
                  />
                )}
              </Field>

              <Field label={posLabel}>
                {(f: any) => (
                  <Input
                    {...f}
                    value={form.position}
                    onChange={set('position')}
                    placeholder={`e.g. ${positionExample(posLabel)}`}
                  />
                )}
              </Field>

              <Field
                label="Jersey number"
                error={errors.jerseyNumber}
                hint={jerseyClash ? undefined : 'Must be unique within the squad.'}
              >
                {(f: any) => (
                  <Input
                    {...f}
                    type="number"
                    min="0"
                    invalid={!!errors.jerseyNumber || jerseyClash}
                    value={form.jerseyNumber}
                    onChange={set('jerseyNumber')}
                    placeholder="10"
                    className="tabular-nums"
                  />
                )}
              </Field>

              <Field label="Licence number" hint="Issued by the federation.">
                {(f: any) => <Input {...f} value={form.licenseNo} onChange={set('licenseNo')} placeholder="Federation licence" />}
              </Field>

              <Field label="Level">
                {(f: any) => (
                  <Select
                    {...f}
                    size="md"
                    value={form.skillLevel}
                    onChange={set('skillLevel')}
                    options={[
                      { value: 'AMATEUR', label: 'Amateur' },
                      { value: 'SEMI_PROFESSIONAL', label: 'Semi-professional' },
                      { value: 'PROFESSIONAL', label: 'Professional' },
                      { value: 'ELITE', label: 'Elite' },
                    ]}
                  />
                )}
              </Field>
            </div>
          </Panel>

          <Panel title="Profile" hint="Optional. This is what the public profile page shows.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Height (cm)">
                {(f: any) => (
                  <Input
                    {...f}
                    type="number"
                    min="0"
                    value={form.height}
                    onChange={set('height')}
                    placeholder="180"
                    className="tabular-nums"
                  />
                )}
              </Field>
              <Field label="Weight (kg)">
                {(f: any) => (
                  <Input
                    {...f}
                    type="number"
                    min="0"
                    value={form.weight}
                    onChange={set('weight')}
                    placeholder="75"
                    className="tabular-nums"
                  />
                )}
              </Field>
              <Field label="Biography" className="sm:col-span-2">
                {(f: any) => (
                  <textarea
                    {...f}
                    rows={4}
                    value={form.bio}
                    onChange={set('bio')}
                    placeholder="Where they came from, what they have won."
                    className={cn(CONTROL, 'resize-y leading-relaxed')}
                  />
                )}
              </Field>
            </div>
          </Panel>
        </div>

        {/* Where they are going */}
        <div className="space-y-4">
          <Panel title="Photograph">
            <div className="space-y-4">
              {/* Round, because Avatar is round: the silhouette says "a person"
                  before anything is read. */}
              <div className="flex flex-col items-center gap-3 py-2">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="h-28 w-28 rounded-pill object-cover" />
                ) : (
                  <Avatar name={form.fullName} size="lg" className="h-28 w-28 text-2xl" />
                )}
                <div className="min-w-0 max-w-full text-center">
                  <p className="truncate font-display text-base font-bold text-primary">
                    {form.fullName.trim() || `New ${rosterOne.toLowerCase()}`}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-tertiary">
                    {[team?.name, form.position, form.jerseyNumber !== '' ? `No. ${form.jerseyNumber}` : null]
                      .filter(Boolean)
                      .join(' · ') || `No ${teamLabel.toLowerCase()} chosen yet`}
                  </p>
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex items-center justify-center gap-2">
                <Button type="button" variant="secondary" size="sm" icon={Camera} onClick={() => fileRef.current?.click()}>
                  {photoFile ? 'Replace' : 'Choose photo'}
                </Button>
                {photoFile && (
                  <IconButton
                    icon={Trash2}
                    size="sm"
                    variant="danger"
                    label="Remove the chosen photo"
                    onClick={() => { setPhotoFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  />
                )}
              </div>
              {/* Says what the reader will see, not what the uploader accepts. */}
              <p className="text-center text-xs text-tertiary">
                Head and shoulders. It is cropped to a circle everywhere it appears.
              </p>
            </div>
          </Panel>

          {/* The squad they are joining — the rule that can refuse this form, shown
              while it is being filled in rather than after it is sent. */}
          {form.teamId && (
            <Panel title={`${team?.name || teamLabel} squad`}>
              {squadLoading ? (
                <p className="text-sm text-tertiary">Reading the squad…</p>
              ) : (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-sm text-secondary">
                    <Users size={15} aria-hidden="true" className="text-tertiary" />
                    <span className="font-semibold tabular-nums text-primary">{(squad || []).length}</span>
                    registered {((squad || []).length === 1 ? rosterOne : rosterMany).toLowerCase()}
                  </p>

                  {takenJerseys.size > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs text-tertiary">Numbers already worn</p>
                      <div className="flex flex-wrap gap-1">
                        {[...takenJerseys].sort((a, b) => a - b).map((n) => (
                          <span
                            key={n}
                            className={cn(
                              'inline-flex min-w-[1.75rem] justify-center rounded-control px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                              Number(form.jerseyNumber) === n
                                ? 'bg-danger/10 text-danger-text'
                                : 'bg-surface-2 text-secondary'
                            )}
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Panel>
          )}

          {error && (
            <p role="alert" className="rounded-card bg-danger/10 px-4 py-3 text-sm text-danger-text">
              {error}
            </p>
          )}

          {/* A squad is registered one player after another, so this is the button
              that gets pressed twenty-four times. */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            block
            loading={create.isPending && againRef.current}
            onClick={submit(true) as any}
          >
            Register and add another
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AdminPlayerCreate;
