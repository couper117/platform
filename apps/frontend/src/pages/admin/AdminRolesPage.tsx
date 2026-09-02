import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Check, Minus, KeyRound } from 'lucide-react';
import apiClient from '../../api/client';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { ErrorState, Skeleton, SkeletonList } from '../../components/ui';

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
    <div>
      <PageHeader
        title={`${t('admin.roles.title')} ${t('admin.roles.title_accent')}`}
        subtitle={t('admin.roles.subtitle')}
      />

      {isLoading ? (
        <Panel flush>
          <SkeletonList count={8}>
            <div className="flex items-center gap-4 border-b border-hairline px-4 py-3 last:border-0">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </SkeletonList>
        </Panel>
      ) : isError ? (
        <Panel>
          <ErrorState title={t('admin.users.load_error', 'Could not load')} />
        </Panel>
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr>
                  <Th>{t('admin.roles.col_section', 'Capability')}</Th>
                  {roles.map((r) => (
                    <Th key={r} className="text-center">
                      {t(`roles.${r}`, r.replace(/_/g, ' '))}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groups).map(([group, entries]: any) => (
                  <React.Fragment key={group}>
                    {/* The group is a divider, not a row of data — it takes the
                        recessed surface so the eye reads it as a section break
                        while scanning a column of ticks. */}
                    <tr className="bg-surface-2">
                      <td colSpan={roles.length + 1} className="border-b border-hairline px-4 py-2 text-xs font-semibold text-tertiary">
                        {group}
                      </td>
                    </tr>
                    {entries.map((cap) => (
                      <tr key={cap.name} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                        <Td>
                          <span className="flex items-center gap-2 text-sm font-medium text-primary">
                            <KeyRound size={13} className="shrink-0 text-tertiary" aria-hidden="true" /> {cap.description}
                          </span>
                          <span className="text-xs text-tertiary">{cap.name}</span>
                        </Td>
                        {roles.map((r) => (
                          <Td key={r} className="text-center">
                            {data.roles[r].includes(cap.name)
                              ? <Check size={16} className="mx-auto text-brand-text" aria-label={t('admin.roles.allowed')} />
                              : <Minus size={14} className="mx-auto text-tertiary/40" aria-label={t('admin.roles.denied')} />}
                          </Td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}

      <p className="mt-4 flex items-start gap-2 rounded-card border border-hairline bg-surface-2 p-4 text-xs text-tertiary">
        <KeyRound size={14} className="mt-0.5 shrink-0 text-brand-text" aria-hidden="true" />
        {t('admin.roles.note')}
      </p>
    </div>
  );
};

export default AdminRolesPage;
