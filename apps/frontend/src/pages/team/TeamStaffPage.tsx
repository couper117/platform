import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users2, Plus, Pencil, Trash2, Phone, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getOfficials, createOfficial, updateOfficial, deleteOfficial,
} from '../../api/endpoints/team';
import useMyTeam from '../../hooks/useMyTeam';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import {
  Button, EmptyState, ErrorState, Field, IconButton, Input, Modal, Select, Skeleton,
} from '../../components/ui';

/**
 * Club portal → Staff.
 *
 * THE PEOPLE BEHIND THE CLUB, which is a different list from the squad. A coach
 * has always been able to register athletes; the officials table — the head
 * coach, the doctor, the secretary — had no screen at all in this portal, so the
 * only way a league admin learned who to telephone about a postponed match was to
 * already know.
 *
 * WHAT THIS LIST IS FOR, in the two places it is actually read:
 *   · the head coach is the name a club puts on its team sheets, and
 *   · the phone number is how a league admin reaches the club on a match day.
 * Neither is automatic — the team sheet's coach is typed on the sheet itself, and
 * this page does not fill it in. So the copy says "who you put on a team sheet",
 * not "this appears on your team sheet", which would be a promise the server does
 * not keep.
 *
 * THE OWNERSHIP RULE IS THE SERVER'S. `canManageTeam` in
 * controllers/officials.controller confines a TEAM_MANAGER to their own club and
 * answers 403 "Not authorized to manage this team" otherwise. That message is
 * shown verbatim rather than flattened into "something went wrong": it is the one
 * failure here whose cause is worth reading.
 */

/**
 * `role` IS A REAL PRISMA ENUM, not a free string.
 *
 * `TeamOfficial.role` is typed `OfficialRole` in schema.prisma with exactly these
 * nine members and a default of OTHER. The server takes whatever is in the body
 * and hands it straight to Prisma, so a value outside this list is not stored as
 * text — it fails validation and comes back as a 500. That rules out the usual
 * "Other, which reveals a text box" pattern: there is nowhere for the typed value
 * to go. A closed Select is the honest control, and OTHER is the escape hatch the
 * schema itself provides.
 *
 * The order is by how often a coach reaches for it, not alphabetically — the head
 * coach is the entry nearly every club adds first. The list is re-sorted the same
 * way on display, because the server returns them ordered by the enum's own
 * alphabetical order.
 */
const ROLES = [
  { value: 'HEAD_COACH', label: 'Head coach' },
  { value: 'ASSISTANT_COACH', label: 'Assistant coach' },
  { value: 'TEAM_DOCTOR', label: 'Team doctor' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'PRESIDENT', label: 'President' },
  { value: 'VICE_PRESIDENT', label: 'Vice president' },
  { value: 'SECRETARY', label: 'Secretary' },
  { value: 'TREASURER', label: 'Treasurer' },
  { value: 'OTHER', label: 'Other' },
];

const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));
const ROLE_ORDER: Record<string, number> = Object.fromEntries(ROLES.map((r, i) => [r.value, i]));

const EMPTY = { role: 'HEAD_COACH', fullName: '', phone: '', email: '' };

/** The server's own message when it has one; a plain sentence when it does not. */
const messageOf = (error: any, fallback: string) =>
  error?.response?.data?.message || fallback;

/* ── one person ──────────────────────────────────────────────────────────── */

const OfficialRow = ({
  official,
  onEdit,
  onDelete,
}: {
  official: any;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <li className="flex items-start gap-3 rounded-card border border-hairline bg-surface p-3 sm:p-4">
    <div className="min-w-0 flex-1">
      <p className="text-xs text-tertiary">{ROLE_LABEL[official.role] || official.role}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-primary">{official.fullName}</p>
      {/* Wraps rather than truncates: a phone number cut off mid-digit is worse
          than a second line, and this is the field the page exists for. */}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-tertiary">
        {official.phone && (
          <a
            href={`tel:${official.phone}`}
            className="inline-flex items-center gap-1 tabular-nums hover:text-brand-text"
          >
            <Phone size={11} aria-hidden="true" />
            {official.phone}
          </a>
        )}
        {official.email && (
          <a
            href={`mailto:${official.email}`}
            className="inline-flex min-w-0 items-center gap-1 hover:text-brand-text"
          >
            <Mail size={11} aria-hidden="true" />
            <span className="truncate">{official.email}</span>
          </a>
        )}
        {!official.phone && !official.email && <span>No contact details</span>}
      </div>
    </div>
    {/* Full 44px targets: this list is used one-handed on a touchline, not at a
        desk, so the dense admin size does not apply. */}
    <div className="flex shrink-0 items-center gap-1">
      <IconButton icon={Pencil} label={`Edit ${official.fullName}`} onClick={onEdit} />
      <IconButton icon={Trash2} label={`Remove ${official.fullName}`} variant="danger" onClick={onDelete} />
    </div>
  </li>
);

/* ── the page ────────────────────────────────────────────────────────────── */

const TeamStaffPage = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: team, isLoading: teamLoading, isError: teamError, refetch: refetchTeam } = useMyTeam();
  const teamId = team?.id as number | undefined;

  const [editing, setEditing] = useState<any>(null); // the official, or {} for a new one
  const [form, setForm] = useState(EMPTY);
  const [confirming, setConfirming] = useState<any>(null);

  /**
   * Read through `getOfficials` rather than off `team.officials`.
   *
   * `/teams/my` does include the officials, but it is cached for a minute and
   * shared by five screens; after adding somebody here the list has to be right
   * immediately. Its own query key means a mutation invalidates exactly this.
   */
  const officialsQuery = useQuery({
    queryKey: ['team-officials', teamId],
    queryFn: () => getOfficials(teamId!),
    enabled: !!teamId,
  });

  const officials = useMemo(
    () =>
      [...(officialsQuery.data || [])].sort(
        (a: any, b: any) =>
          (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99) ||
          String(a.fullName).localeCompare(String(b.fullName))
      ),
    [officialsQuery.data]
  );

  // Seed the form whenever the dialog opens on somebody different.
  useEffect(() => {
    if (!editing) return;
    setForm({
      role: editing.role || 'HEAD_COACH',
      fullName: editing.fullName || '',
      phone: editing.phone || '',
      email: editing.email || '',
    });
  }, [editing]);

  const settle = () => {
    qc.invalidateQueries({ queryKey: ['team-officials', teamId] });
    // The club record carries the same list, and the dashboard reads it.
    qc.invalidateQueries({ queryKey: ['team-my'] });
  };

  const save = useMutation({
    mutationFn: () => {
      // `idNumber` is a column the server accepts and this form does not send.
      // PATCH only writes the keys it is given, so an id recorded elsewhere
      // survives an edit made here rather than being blanked.
      const body = {
        role: form.role,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      };
      return editing?.id ? updateOfficial(editing.id, body) : createOfficial({ ...body, teamId });
    },
    onSuccess: () => {
      settle();
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteOfficial(id),
    onSuccess: () => {
      settle();
      setConfirming(null);
    },
  });

  // Clearing the mutation on the way in and out matters: without it, reopening
  // the dialog after a 403 shows last time's error above an untouched form.
  const openCreate = () => { save.reset(); setEditing({}); };
  const openEdit = (official: any) => { save.reset(); setEditing(official); };
  const closeEdit = () => { save.reset(); setEditing(null); };
  const closeConfirm = () => { remove.reset(); setConfirming(null); };

  const header = (
    <PageHeader
      title={t('portal.nav_staff')}
      subtitle="Your coaching staff and club officials — the head coach you put on a team sheet, and the people a league admin calls about a match."
      actions={
        teamId ? (
          <Button icon={Plus} onClick={openCreate}>
            Add someone
          </Button>
        ) : undefined
      }
    />
  );

  if (teamLoading || (!team && !teamError)) {
    return (
      <div>
        {header}
        <div role="status" aria-busy="true" aria-live="polite" className="max-w-3xl space-y-2">
          <span className="sr-only">{t('common.loading')}</span>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (teamError || !team) {
    return (
      <div>
        {header}
        <ErrorState
          title="Could not load your club"
          hint="Check your connection and try again."
          onRetry={() => refetchTeam()}
        />
      </div>
    );
  }

  return (
    <div>
      {header}

      <div className="max-w-3xl">
        {officialsQuery.isLoading ? (
          <div role="status" aria-busy="true" aria-live="polite" className="space-y-2">
            <span className="sr-only">{t('common.loading')}</span>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-card" />
            ))}
          </div>
        ) : officialsQuery.isError ? (
          <ErrorState
            title="Could not load your staff"
            hint={messageOf(officialsQuery.error, 'Check your connection and try again.')}
            onRetry={() => officialsQuery.refetch()}
          />
        ) : officials.length === 0 ? (
          <Panel>
            <EmptyState
              icon={Users2}
              title="Nobody listed yet"
              hint="Start with your head coach — that is the name a club puts on its team sheets, and the one a league admin looks for when a match has to move."
              action={
                <Button icon={Plus} onClick={openCreate}>
                  Add someone
                </Button>
              }
            />
          </Panel>
        ) : (
          <ul className="space-y-2">
            {officials.map((official: any) => (
              <OfficialRow
                key={official.id}
                official={official}
                onEdit={() => openEdit(official)}
                onDelete={() => { remove.reset(); setConfirming(official); }}
              />
            ))}
          </ul>
        )}
      </div>

      {/* ── add / edit ─────────────────────────────────────────────────────── */}
      <Modal
        open={!!editing}
        onClose={closeEdit}
        title={editing?.id ? 'Edit this person' : 'Add someone to your staff'}
        size="sm"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary" onClick={closeEdit}>
              Cancel
            </Button>
            <Button
              loading={save.isPending}
              disabled={!form.fullName.trim() || save.isPending}
              onClick={() => save.mutate()}
            >
              {editing?.id ? 'Save changes' : 'Add to staff'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Role">
            {(p: any) => (
              <Select
                {...p}
                size="md"
                value={form.role}
                options={ROLES}
                onChange={(e: any) => setForm((f) => ({ ...f, role: e.target.value }))}
              />
            )}
          </Field>

          <Field
            label="Full name"
            required
            error={form.fullName.trim() ? undefined : 'A name is required.'}
          >
            {(p: any) => (
              <Input
                {...p}
                data-autofocus
                value={form.fullName}
                placeholder="e.g. Jean Damascene"
                onChange={(e: any) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            )}
          </Field>

          <Field label="Phone" hint="How a league admin reaches them on a match day.">
            {(p: any) => (
              <Input
                {...p}
                type="tel"
                inputMode="tel"
                placeholder="+250 …"
                value={form.phone}
                onChange={(e: any) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="tabular-nums"
              />
            )}
          </Field>

          <Field label="Email">
            {(p: any) => (
              <Input
                {...p}
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(e: any) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            )}
          </Field>

          {/* Verbatim. A 403 here says "Not authorized to manage this team", which
              tells a coach exactly what went wrong; "Something went wrong" would
              send them to support instead. */}
          {save.isError && (
            <p role="alert" className="rounded-control bg-danger/10 px-3 py-2 text-sm font-semibold text-danger-text">
              {messageOf(save.error, 'Could not save this person. Check your connection and try again.')}
            </p>
          )}
        </div>
      </Modal>

      {/* ── delete, behind a confirm ───────────────────────────────────────── */}
      <Modal
        open={!!confirming}
        onClose={closeConfirm}
        title="Remove from staff?"
        description={
          confirming
            ? `${confirming.fullName} will be taken off your club's staff list. This cannot be undone.`
            : undefined
        }
        size="sm"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              disabled={remove.isPending}
              onClick={() => confirming && remove.mutate(confirming.id)}
            >
              {t('common.remove')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-secondary">
          Removing somebody does not change any team sheet you have already filed.
        </p>
        {remove.isError && (
          <p role="alert" className="mt-3 rounded-control bg-danger/10 px-3 py-2 text-sm font-semibold text-danger-text">
            {messageOf(remove.error, 'Could not remove this person. Check your connection and try again.')}
          </p>
        )}
      </Modal>
    </div>
  );
};

export default TeamStaffPage;
