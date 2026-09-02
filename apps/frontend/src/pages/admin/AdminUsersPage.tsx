import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users2, Search, ShieldCheck, Check, X, KeyRound, Plus, Minus, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

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

  return (
    <div className="space-y-4 rounded-xl border border-hairline bg-surface-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs text-tertiary">
            <KeyRound size={13} className="text-brand" />
            {t('admin.users.caps_hint', 'Click to add or remove. Everything else follows the role')}
            <strong className="text-secondary">{user.role.replace(/_/g, ' ')}</strong>.
          </p>
          <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-tertiary">
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-brand/40 bg-brand/10" /> {t('admin.users.cap_role', 'From the role')}</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-brand bg-brand" /> {t('admin.users.cap_granted', 'Given to this account only')}</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-danger bg-danger/15" /> {t('admin.users.cap_revoked', 'Taken away from this account')}</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-dashed border-hairline" /> {t('admin.users.cap_none', 'Not held')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(granted.length > 0 || revoked.length > 0) && (
            <button type="button" onClick={reset}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-tertiary hover:text-primary">
              <RotateCcw size={12} /> {t('admin.users.caps_reset', 'Clear exceptions')}
            </button>
          )}
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => onSave({ grantedCapabilities: granted, revokedCapabilities: revoked })}
            className="rounded-lg bg-brand px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white disabled:opacity-40"
          >
            {saving ? t('common.saving', 'Saving') : t('common.save', 'Save')}
          </button>
        </div>
      </div>

      {orderedGroups.map(([group, entries]: any) => (
        <div key={group} className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-tertiary">{group}</p>
          <div className="flex flex-wrap gap-1.5">
            {entries.map((cap) => {
              const fromRole = roleDefaults.includes(cap.name);
              const isRevoked = revoked.includes(cap.name);
              const isGranted = granted.includes(cap.name);
              const held = holds(cap.name);

              const tone = isRevoked
                ? 'border-danger bg-danger/15 text-danger-text line-through'
                : isGranted
                  ? 'border-brand bg-brand text-white'
                  : held
                    ? 'border-brand/40 bg-brand/10 text-brand-text'
                    : 'border-dashed border-hairline bg-transparent text-tertiary/70';

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
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${tone}`}
                >
                  {isGranted ? <Plus size={10} /> : isRevoked ? <Minus size={10} /> : held ? <Check size={10} /> : null}
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
 * Super Admin â†’ Users. Every platform account with its role and active flag, both
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('admin.users.title')} <span className="text-red">{t('admin.users.title_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('admin.users.subtitle')}</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('admin.users.search')}
          className="w-full rounded-lg border border-hairline bg-surface py-2.5 pl-9 pr-3 text-sm text-primary outline-none focus-visible:border-brand"
        />
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : isError ? (
        <div className="py-16 text-center opacity-50 font-display uppercase tracking-widest">{t('admin.users.load_error')}</div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users2} title={t('admin.users.none_title')} hint={t('admin.users.none_hint')} />
      ) : (
        <AdminTable headers={[t('admin.users.col_user'), t('admin.users.col_email'), t('admin.users.col_role'), t('admin.col_status'), t('admin.users.col_joined'), t('admin.users.col_permissions', 'Permissions')]}>
          {users.map((u) => {
            const isSelf = me?.id === u.id;
            return (
              <React.Fragment key={u.id}>
              <tr className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-primary">{u.fullName || u.username}</p>
                  <p className="text-[11px] text-tertiary">@{u.username}</p>
                </td>
                <td className="px-6 py-4 text-sm text-secondary">{u.email}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-brand" />
                    <select
                      value={u.role}
                      disabled={isSelf || mutate.isPending}
                      onChange={(e) => mutate.mutate({ id: u.id, patch: { role: e.target.value } })}
                      className="rounded-md border border-hairline bg-surface px-2 py-1 text-xs font-semibold text-primary outline-none disabled:opacity-50"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{t(`roles.${r}`, r.replace(/_/g, ' '))}</option>)}
                    </select>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    disabled={isSelf || mutate.isPending}
                    onClick={() => mutate.mutate({ id: u.id, patch: { active: !u.active } })}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 ${u.active ? 'bg-brand/10 text-brand-text' : 'bg-red/10 text-red'}`}
                  >
                    {u.active ? <><Check size={11} /> {t('admin.users.active')}</> : <><X size={11} /> {t('admin.users.inactive')}</>}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm tabular-nums text-tertiary">{u.createdAt ? format(new Date(u.createdAt), 'd MMM yyyy') : '\u2014'}</td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === u.id ? null : u.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1 text-[11px] font-semibold text-secondary hover:border-brand hover:text-brand-text"
                  >
                    <KeyRound size={12} />
                    {exceptionCount(u) > 0
                      ? t('admin.users.caps_n', '{{count}} exception', { count: exceptionCount(u) })
                      : t('admin.users.caps_edit', 'Permissions')}
                  </button>
                </td>
              </tr>
              {openId === u.id && (
                <tr>
                  <td colSpan={6} className="px-6 pb-5">
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
        </AdminTable>
      )}
    </div>
  );
};

export default AdminUsersPage;
