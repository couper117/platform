import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LayoutTemplate, ChevronUp, ChevronDown, Check, Save } from 'lucide-react';
import apiClient from '../../api/client';
import { Skeleton } from '../../components/ui';

/**
 * Super Admin → Website Content. Enable/disable and reorder the public homepage
 * sections. Persisted as a single JSON Setting (`homepage.sections`) via the real
 * settings API — presentation config only, never operational sports data.
 */
const SETTING_KEY = 'homepage.sections';
const DEFAULT = [
  { id: 'hero', on: true }, { id: 'live', on: true }, { id: 'sports', on: true },
  { id: 'matches', on: true }, { id: 'championships', on: false }, { id: 'ads', on: true }, { id: 'cta', on: true },
];

const AdminContentPage = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [sections, setSections] = useState(DEFAULT);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings-all'],
    queryFn: async () => (await apiClient.get('/settings/all')).data.data,
  });

  useEffect(() => {
    const row = (data || []).find((s) => s.skey === SETTING_KEY);
    if (row?.sval) {
      try {
        const parsed = JSON.parse(row.sval);
        if (Array.isArray(parsed) && parsed.length) setSections(parsed);
      } catch { /* keep default */ }
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => apiClient.put('/settings', [{ skey: SETTING_KEY, sval: JSON.stringify(sections) }]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings-all'] }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const toggle = (id) => setSections((s) => s.map((x) => (x.id === id ? { ...x, on: !x.on } : x)));
  const move = (i, dir) => setSections((s) => {
    const j = i + dir;
    if (j < 0 || j >= s.length) return s;
    const next = [...s];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">{t('admin.content.title')} <span className="text-red">{t('admin.content.title_accent')}</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('admin.content.subtitle')}</p>
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-red px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          {saved ? <Check size={16} /> : <Save size={16} />} {saved ? t('admin.content.saved') : t('admin.content.save')}
        </button>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={2} />
      ) : (
        <div className="max-w-2xl space-y-2">
          {sections.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-hairline bg-surface p-3.5">
              <span className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-tertiary hover:text-primary disabled:opacity-30" aria-label={t('admin.content.move_up')}><ChevronUp size={15} /></button>
                <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="text-tertiary hover:text-primary disabled:opacity-30" aria-label={t('admin.content.move_down')}><ChevronDown size={15} /></button>
              </span>
              <LayoutTemplate size={16} className="text-tertiary" />
              <span className="min-w-0 flex-1 text-sm font-semibold text-primary">{t(`admin.content.section_${s.id}`, s.id)}</span>
              <button
                type="button"
                onClick={() => toggle(s.id)}
                role="switch"
                aria-checked={s.on}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${s.on ? 'bg-brand' : 'bg-surface-2'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${s.on ? 'left-0.5 translate-x-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminContentPage;
