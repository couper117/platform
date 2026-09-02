import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Check, Minus, KeyRound } from 'lucide-react';
import apiClient from '../../api/client';
import { Skeleton } from '../../components/ui';

/**
 * Super Admin → Roles & Permissions.
 *
 * A read-only matrix of what each role can do, fetched from GET
 * /admin/capabilities — the same policy object the server enforces with. It used
 * to be built from a role table kept in the frontend, which is precisely the
 * copy that drifts: this page's job is to answer "who can do what", and an
 * answer maintained separately from the thing doing the deciding is a guess.
 *
 * Per-account grants and revocations are not shown here. This is the shape of
 * the roles; exceptions belong to the account that has them, on the Users page.
 */
const ROLE_ORDER = [
  'SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'AMASHURI_ADMIN',
  'MATCH_REPORTER', 'TEAM_MANAGER', 'SCHOOL_COORDINATOR',
];

const AdminRolesPage = () => {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-capabilities'],
    queryFn: async () => (await apiClient.get('/admin/capabilities')).data.data,
    staleTime: 5 * 60 * 1000, // policy changes with a deploy, not within a session
  });

  const roles = ROLE_ORDER.filter((r) => data?.roles?.[r]);
  const groups = data?.groups || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">
          {t('admin.roles.title')} <span className="text-red">{t('admin.roles.title_accent')}</span>
        </h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('admin.roles.subtitle')}</p>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : isError ? (
        <div className="py-16 text-center opacity-50 font-display uppercase tracking-widest">
          {t('admin.users.load_error', 'Could not load')}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-hairline text-[10px] font-bold uppercase tracking-widest text-tertiary">
                <th className="px-5 py-3">{t('admin.roles.col_section', 'Capability')}</th>
                {roles.map((r) => (
                  <th key={r} className="px-3 py-3 text-center">
                    {t(`roles.${r}`, r.replace(/_/g, ' '))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groups).map(([group, entries]: any) => (
                <React.Fragment key={group}>
                  <tr className="bg-surface-2">
                    <td colSpan={roles.length + 1} className="px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-tertiary">
                      {group}
                    </td>
                  </tr>
                  {entries.map((cap) => (
                    <tr key={cap.name} className="border-b border-hairline/50 last:border-0">
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 text-sm font-medium text-primary">
                          <KeyRound size={13} className="shrink-0 text-tertiary" /> {cap.description}
                        </span>
                        <span className="text-[11px] text-tertiary">{cap.name}</span>
                      </td>
                      {roles.map((r) => (
                        <td key={r} className="px-3 py-3 text-center">
                          {data.roles[r].includes(cap.name)
                            ? <Check size={16} className="mx-auto text-brand" aria-label={t('admin.roles.allowed')} />
                            : <Minus size={14} className="mx-auto text-tertiary/40" aria-label={t('admin.roles.denied')} />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="flex items-center gap-2 rounded-xl bg-surface-2 p-3 text-xs text-tertiary">
        <KeyRound size={14} className="shrink-0 text-brand" />
        {t('admin.roles.note')}
      </p>
    </div>
  );
};

export default AdminRolesPage;
