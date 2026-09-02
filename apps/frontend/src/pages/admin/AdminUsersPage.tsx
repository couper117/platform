import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users2, Search, ShieldCheck, Check, X, KeyRound, Plus, Minus, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Button, Input, Select, EmptyState, ErrorState, Skeleton, SkeletonList, cn } from '../../components/ui';

const ROLES = [
  'SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'AMASHURI_ADMIN',
  'MATCH_REPORTER', 'TEAM_MANAGER', 'SCHOOL_COORDINATOR', 'PUBLIC',
];

/**
 * Per-account capability editor.
 *
 * A role is a sensible default, not a straitjacket: one reporter also writes the
 * match report, one league administrator is trusted with suspensions and another
 * is not. Without this the only way to say so is to invent a role for one
 * person, and roles invented for one person are how a permissions model rots.
 *
 * Three states per capability, and the difference matters: held because the role
 * grants it, added for this account, or taken away from this account. An editor
 * that showed only a tick could not express "everyone else with this role has
 * this, and they deliberately do not".
 *
 * The three states are carried by fill, not by a legend nobody reads twice: a
 * role default is a brand tint, an account-only grant is the solid brand, and a
 * revocation is struck through in danger. Each chip still names its state in the
 * title attribute, because colour alone is not an accessible answer.
 */
const CapabilityEditor = ({ user, catalogue, onSave, saving }) => {
  const { t } = useTranslation();
  const [granted, setGranted] = useState(user.grantedCapabilities || []);
  const [revoked, setRevoked] = useState(user.revokedCapabilities || []);

  const roleDefaults = catalogue?.roles?.[user.role] || [];
  const dirty =
    JSON.stringify([...granted].sort()) !== JSON.stringify([...(user.grantedCapabilities || [])].sort()) ||
    JSON.stringify([...revoked].sort()) !== JSON.stringify([...(user.revokedCapabilities || [])].sort());

  // Cycles default → exception → back. A revoke only makes sense for something
  // the role grants, and a grant only for something it does not, so each
  // capability has exactly one exception available to it.
  const toggle = (name) => {
    const fromRole = roleDefaults.includes(name);
    if (fromRole) {
      setRevoked((r) => (r.includes(name) ? r.filter((c) => c !== name) : [...r, name]));
    } else {
      setGranted((g) => (g.includes(name) ? g.filter((c) => c !== name) : [...g, name]));
    }
  };

  const reset = () => { setGranted([]); setRevoked([]); };

  const holds = (name) =>
    (roleDefaults.includes(name) && !revoked.includes(name)) || granted.includes(name);

  // Sorting is done on the role's defaults rather than on live edits, so a
  // capability does not jump across the list the moment it is clicked.
  const settled = (name) => roleDefaults.includes(name) || (user.grantedCapabilities || []).includes(name);
  const orderedGroups = Object.entries(catalogue?.groups || {})
    .map(([group, entries]: any) => [group, [...entries].sort((a, b) => Number(settled(b.name)) - Number(settled(a.name)))])
    .sort((a: any, b: any) => b[1].filter((c) => settled(c.name)).length - a[1].filter((c) => settled(c.name)).length);

  const LEGEND = [
    ['bg-brand-tint border-brand/40', t('admin.users.cap_role', 'From the role')],
    ['bg-brand-strong border-brand-strong', t('admin.users.cap_granted', 'Given to this account only')],
    ['bg-danger/15 border-danger/40', t('admin.users.cap_revoked', 'Taken away from this account')],
    ['border-dashed border-hairline', t('admin.users.cap_none', 'Not held')],
  ];

  return (
    <div className="space-y-4 rounded-card border border-hairline bg-surface-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="flex flex-wrap items-center gap-1.5 text-xs text-secondary">
            <KeyRound size={13} className="text-brand-text" aria-hidden="true" />
            {t('admin.users.caps_hint', 'Click to add or remove. Everything else follows the role')}
            <strong className="font-semibold text-primary">{user.role.replace(/_/g, ' ')}</strong>.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-tertiary">
            {LEGEND.map(([swatch, label]) => (
              <span key={String(label)} className="inline-flex items-center gap-1.5">
                <span className={cn('h-2.5 w-2.5 rounded-badge border', swatch)} />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(granted.length > 0 || revoked.length > 0) && (
            <Button type="button" variant="ghost" size="sm" icon={RotateCcw} onClick={reset}>
              {t('admin.users.caps_reset', 'Clear exceptions')}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={!dirty || saving}
            loading={saving}
            onClick={() => onSave({ grantedCapabilities: granted, revokedCapabilities: revoked })}
          >
            {saving ? t('common.saving', 'Saving') : t('common.save', 'Save')}
          </Button>
        </div>
      </div>

      {orderedGroups.map(([group, entries]: any) => (
        <div key={group} className="space-y-1.5">
          <p className="text-xs font-semibold text-tertiary">{group}</p>
          <div className="flex flex-wrap gap-1.5">
            {entries.map((cap) => {
              const isRevoked = revoked.includes(cap.name);
              const isGranted = granted.includes(cap.name);
              const held = holds(cap.name);

              const tone = isRevoked
                ? 'border-danger/40 bg-danger/15 text-danger-text line-through'
                : isGranted
                  ? 'border-brand-strong bg-brand-strong text-brand-on'
                  : held
                    ? 'border-brand/40 bg-brand-tint text-brand-text'
                    : 'border-dashed border-hairline text-tertiary';

              const why = isRevoked
                ? t('admin.users.cap_revoked', 'Taken away from this account')
                : isGranted
                  ? t('admin.users.cap_granted', 'Given to this account only')
                  : held
                    ? t('admin.users.cap_role', 'From the role')
                    : t('admin.users.cap_none', 'Not held');

              return (
                <button
                  key={cap.name}
                  type="button"
                  onClick={() => toggle(cap.name)}
                  title={`${cap.description} — ${why}`}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-control border px-2 py-1 text-xs font-medium',
                    'transition-colors duration-150 ease-standard',
                    tone
                  )}
                >
                  {isGranted ? <Plus size={10} aria-hidden="true" />
                    : isRevoked ? <Minus size={10} aria-hidden="true" />
                      : held ? <Check size={10} aria-hidden="true" /> : null}
                  {cap.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Super Admin → Users. Every platform account with its role and active flag, both
 * editable inline. Wired to GET /admin/users and PATCH /admin/users/:id; the
 * backend guards the last active super admin from being locked out.
 */
const exceptionCount = (u) =>
  (u.grantedCapabilities?.length || 0) + (u.revokedCapabilities?.length || 0);

const AdminUsersPage = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user: me } = useAuthStore();
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);

  const { data: catalogue } = useQuery({
    queryKey: ['admin-capabilities'],
    queryFn: async () => (await apiClient.get('/admin/capabilities')).data.data,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await apiClient.get('/admin/users')).data.data,
  });

  const mutate = useMutation({
    mutationFn: ({ id, patch }: any) => apiClient.patch(`/admin/users/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users = (data || []).filter((u) => {
    const s = q.toLowerCase();
    return !s || u.fullName?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.username?.toLowerCase().includes(s);
  });

  const roleOptions = ROLES.map((r) => ({ value: r, label: t(`roles.${r}`, r.replace(/_/g, ' ')) }));

  return (
    <div>
      <PageHeader
        title={`${t('admin.users.title')} ${t('admin.users.title_accent')}`}
        subtitle={t('admin.users.subtitle')}
        actions={
          <div className="relative w-64 max-w-full">
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('admin.users.search')}
              aria-label={t('admin.users.search')}
              className="pl-9 text-sm"
            />
          </div>
        }
      />

      {isLoading ? (
        <Panel flush>
          <SkeletonList count={6}>
            <div className="flex items-center gap-4 border-b border-hairline px-4 py-3 last:border-0">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </SkeletonList>
        </Panel>
      ) : isError ? (
        <Panel>
          <ErrorState title={t('admin.users.load_error')} />
        </Panel>
      ) : users.length === 0 ? (
        <Panel>
          <EmptyState icon={Users2} title={t('admin.users.none_title')} hint={t('admin.users.none_hint')} />
        </Panel>
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr>
                  <Th>{t('admin.users.col_user')}</Th>
                  <Th>{t('admin.users.col_email')}</Th>
                  <Th>{t('admin.users.col_role')}</Th>
                  <Th>{t('admin.col_status')}</Th>
                  <Th>{t('admin.users.col_joined')}</Th>
                  <Th align="right">{t('admin.users.col_permissions', 'Permissions')}</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = me?.id === u.id;
                  return (
                    <React.Fragment key={u.id}>
                      <tr className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                        <Td className="text-primary">
                          <p className="font-medium text-primary">{u.fullName || u.username}</p>
                          <p className="text-xs text-tertiary">@{u.username}</p>
                        </Td>
                        <Td>{u.email}</Td>
                        <Td>
                          <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck size={13} className="shrink-0 text-tertiary" aria-hidden="true" />
                            <Select
                              id={`role-${u.id}`}
                              value={u.role}
                              label={t('admin.users.col_role')}
                              disabled={isSelf || mutate.isPending}
                              onChange={(e) => mutate.mutate({ id: u.id, patch: { role: e.target.value } })}
                              options={roleOptions}
                            />
                          </span>
                        </Td>
                        <Td>
                          {/* The status IS the control: clicking the pill flips the
                              account, so the state and the way to change it are the
                              same target. Disabled on your own row — the backend
                              refuses it anyway. */}
                          <button
                            type="button"
                            disabled={isSelf || mutate.isPending}
                            onClick={() => mutate.mutate({ id: u.id, patch: { active: !u.active } })}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-semibold',
                              'transition-colors duration-150 ease-standard disabled:opacity-50',
                              u.active ? 'bg-brand-tint text-brand-text' : 'bg-danger/10 text-danger-text'
                            )}
                          >
                            {u.active
                              ? <><Check size={11} aria-hidden="true" /> {t('admin.users.active')}</>
                              : <><X size={11} aria-hidden="true" /> {t('admin.users.inactive')}</>}
                          </button>
                        </Td>
                        <Td className="tabular-nums">{u.createdAt ? format(new Date(u.createdAt), 'd MMM yyyy') : '—'}</Td>
                        <Td align="right">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={KeyRound}
                            aria-expanded={openId === u.id}
                            onClick={() => setOpenId(openId === u.id ? null : u.id)}
                          >
                            {exceptionCount(u) > 0
                              ? t('admin.users.caps_n', '{{count}} exception', { count: exceptionCount(u) })
                              : t('admin.users.caps_edit', 'Permissions')}
                          </Button>
                        </Td>
                      </tr>
                      {openId === u.id && (
                        <tr>
                          <td colSpan={6} className="border-b border-hairline px-4 pb-4">
                            <CapabilityEditor
                              user={u}
                              catalogue={catalogue}
                              saving={mutate.isPending}
                              onSave={(patch) => mutate.mutate({ id: u.id, patch })}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}
    </div>
  );
};

export default AdminUsersPage;
