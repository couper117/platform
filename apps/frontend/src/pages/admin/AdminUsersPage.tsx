import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users2, Search, ShieldCheck, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

const ROLES = ['SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'AMASHURI_ADMIN', 'MATCH_REPORTER', 'TEAM_MANAGER', 'PUBLIC'];

/**
 * Super Admin â†’ Users. Every platform account with its role and active flag, both
 * editable inline. Wired to GET /admin/users and PATCH /admin/users/:id; the
 * backend guards the last active super admin from being locked out.
 */
const AdminUsersPage = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user: me } = useAuthStore();
  const [q, setQ] = useState('');

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
        <AdminTable headers={[t('admin.users.col_user'), t('admin.users.col_email'), t('admin.users.col_role'), t('admin.col_status'), t('admin.users.col_joined')]}>
          {users.map((u) => {
            const isSelf = me?.id === u.id;
            return (
              <tr key={u.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
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
                <td className="px-6 py-4 text-sm tabular-nums text-tertiary">{u.createdAt ? format(new Date(u.createdAt), 'd MMM yyyy') : 'â€”'}</td>
              </tr>
            );
          })}
        </AdminTable>
      )}
    </div>
  );
};

export default AdminUsersPage;
