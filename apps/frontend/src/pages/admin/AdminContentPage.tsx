import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LayoutTemplate, ChevronUp, ChevronDown, Check, Save } from 'lucide-react';
import apiClient from '../../api/client';
import { Button, IconButton, Skeleton, SkeletonList, cn } from '../../components/ui';
import { PageHeader, Panel } from '../../components/admin/AdminUI';

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
    <div>
      <PageHeader
        title={`${t('admin.content.title')} ${t('admin.content.title_accent')}`}
        subtitle={t('admin.content.subtitle')}
        actions={
          <Button
            size="sm"
            icon={saved ? Check : Save}
            loading={save.isPending}
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {saved ? t('admin.content.saved') : t('admin.content.save')}
          </Button>
        }
      />

      {/* No panel title: the page header already names this screen, and a second
          "Content" heading three lines under the first is noise. */}
      <Panel className="max-w-2xl" flush>
        {isLoading ? (
          <SkeletonList count={5}>
            <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
              <Skeleton className="h-8 w-4 shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-11 shrink-0 rounded-pill" />
            </div>
          </SkeletonList>
        ) : (
          <ul>
            {sections.map((s, i) => (
              <li
                key={s.id}
                className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0"
              >
                {/* Reorder sits at the row's leading edge, where the eye starts —
                    the order of the list IS what this control changes. */}
                <span className="flex shrink-0 flex-col">
                  <IconButton
                    icon={ChevronUp}
                    label={t('admin.content.move_up')}
                    size="sm"
                    className="h-5 w-6"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  />
                  <IconButton
                    icon={ChevronDown}
                    label={t('admin.content.move_down')}
                    size="sm"
                    className="h-5 w-6"
                    disabled={i === sections.length - 1}
                    onClick={() => move(i, 1)}
                  />
                </span>

                <LayoutTemplate size={16} className="shrink-0 text-tertiary" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">
                  {t(`admin.content.section_${s.id}`, s.id)}
                </span>

                {/* Green means ON and nothing else on this screen, so the switch is
                    the only coloured thing in the row. */}
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  role="switch"
                  aria-checked={s.on}
                  aria-label={String(t(`admin.content.section_${s.id}`, s.id))}
                  className={cn(
                    'relative h-6 w-11 shrink-0 rounded-pill transition-colors duration-150 ease-standard',
                    s.on ? 'bg-brand' : 'bg-surface-2 border border-hairline'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 h-5 w-5 rounded-pill bg-surface shadow-sm',
                      'transition-transform duration-150 ease-standard',
                      s.on ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};

export default AdminContentPage;
