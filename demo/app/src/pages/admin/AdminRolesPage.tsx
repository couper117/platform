import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Minus, KeyRound } from 'lucide-react';
import { ADMIN_PAGES } from '../../lib/adminAccess';

/**
 * Super Admin → Roles & Permissions. A read-only matrix of which role can reach
 * which admin section, derived from the SAME ADMIN_PAGES access list that drives
 * the sidebar and mirrors the backend authorize() — so this is the single source
 * of truth, never a hand-maintained copy that could drift.
 */
const ROLES = ['SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'AMASHURI_ADMIN'];

const AdminRolesPage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('admin.roles.title')} <span className="text-red">{t('admin.roles.title_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('admin.roles.subtitle')}</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-hairline text-[10px] font-bold uppercase tracking-widest text-tertiary">
              <th className="px-5 py-3">{t('admin.roles.col_section')}</th>
              {ROLES.map((r) => (
                <th key={r} className="px-4 py-3 text-center">{t(`roles.${r}`, r.replace(/_/g, ' '))}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ADMIN_PAGES.map((page) => (
              <tr key={page.path} className="border-b border-hairline/50 last:border-0">
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-primary">
                    <KeyRound size={13} className="text-tertiary" /> {page.label}
                  </span>
                  <span className="text-[11px] text-tertiary">{page.path}</span>
                </td>
                {ROLES.map((r) => (
                  <td key={r} className="px-4 py-3 text-center">
                    {page.roles.includes(r)
                      ? <Check size={16} className="mx-auto text-brand" aria-label={t('admin.roles.allowed')} />
                      : <Minus size={14} className="mx-auto text-tertiary/40" aria-label={t('admin.roles.denied')} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="flex items-center gap-2 rounded-xl bg-surface-2 p-3 text-xs text-tertiary">
        <KeyRound size={14} className="shrink-0 text-brand" /> {t('admin.roles.note')}
      </p>
    </div>
  );
};

export default AdminRolesPage;
