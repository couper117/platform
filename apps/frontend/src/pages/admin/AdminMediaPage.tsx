import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon, Copy, Check } from 'lucide-react';
import apiClient from '../../api/client';
import { Skeleton, EmptyState } from '../../components/ui';

/**
 * Super Admin → Media Library. Every uploaded image referenced across the platform
 * (news covers, club crests, sport covers, player photos), aggregated by GET
 * /admin/media, filterable by source, with one-click URL copy.
 */
const SOURCES = ['all', 'news', 'team', 'sport', 'player'];

const AdminMediaPage = () => {
  const { t } = useTranslation();
  const [source, setSource] = useState('all');
  const [copied, setCopied] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-media'],
    queryFn: async () => (await apiClient.get('/admin/media')).data.data,
  });

  const media = (data || []).filter((m) => source === 'all' || m.source === source);

  const copy = (url) => {
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => { setCopied(url); setTimeout(() => setCopied(null), 1500); });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('admin.media.title')} <span className="text-red">{t('admin.media.title_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('admin.media.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`rounded-pill border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${source === s ? 'border-brand bg-brand-tint text-brand-text' : 'border-hairline text-secondary hover:text-primary'}`}
          >
            {t(`admin.media.src_${s}`, s)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : isError ? (
        <div className="py-16 text-center opacity-50 font-display uppercase tracking-widest">{t('admin.media.load_error')}</div>
      ) : media.length === 0 ? (
        <EmptyState icon={ImageIcon} title={t('admin.media.none_title')} hint={t('admin.media.none_hint')} />
      ) : (
        <>
          <p className="text-xs text-tertiary">{t('admin.media.count', { count: media.length })}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {media.map((m, i) => (
              <div key={i} className="group overflow-hidden rounded-xl border border-hairline bg-surface">
                <div className="relative aspect-square bg-surface-2">
                  <img src={m.url} alt={m.label} loading="lazy" className="h-full w-full object-cover" />
                  <button
                    onClick={() => copy(m.url)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={t('admin.media.copy_url')}
                  >
                    {copied === m.url ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="p-2">
                  <p className="truncate text-[11px] font-semibold text-primary">{m.label}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-tertiary">{String(t(`admin.media.src_${m.source}`, m.source))}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminMediaPage;
