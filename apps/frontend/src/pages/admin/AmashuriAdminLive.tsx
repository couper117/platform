import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Radio } from 'lucide-react';
import { format } from 'date-fns';
import { getAkcFixtures } from '../../api/endpoints/amashuri';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { Skeleton, SkeletonList, EmptyState, StatusPill, cn } from '../../components/ui';

/** A backend enum read as a sentence: THIRD_PLACE → "Third place". */
const sentence = (value: string) => {
  const words = String(value || '').replace(/_/g, ' ').toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : '';
};

/**
 * Amashuri Admin → Live Matches: school matches currently in progress.
 *
 * A CONSOLE, NOT A LIST. This is the one Amashuri screen someone stands in front
 * of while matches are running, so each match is a card with the score at a size
 * you can read across a room — not a row in a table that scrolls sideways. Live
 * is the single state that gets to shout, so it is the only place `--live` (the
 * orange) appears in this section.
 *
 * The grid caps its columns at the number of matches. A real matchday here is one
 * or two games; three fixed columns would leave a lone card stranded at the left
 * of an empty row.
 */
const AmashuriAdminLive = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-live'], queryFn: () => getAkcFixtures(), refetchInterval: 20000 });
  const live = (data?.data || []).filter((f) => f.status === 'ONGOING');

  const grid = cn(
    'grid gap-3',
    live.length > 1 && 'sm:grid-cols-2',
    live.length > 2 && 'xl:grid-cols-3'
  );

  return (
    <div>
      <PageHeader
        title={`${t('aadmin.live_title')} ${t('aadmin.live_accent')}`}
        subtitle={t('aadmin.live_sub')}
      />

      {isLoading ? (
        <SkeletonList count={2} className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-36 w-full rounded-card" />
        </SkeletonList>
      ) : live.length === 0 ? (
        <Panel>
          <EmptyState icon={Radio} title={t('aadmin.none_live')} hint={t('aadmin.none_live_hint')} />
        </Panel>
      ) : (
        <div className={grid}>
          {live.map((f) => (
            <article key={f.id} className="rounded-card border border-live/40 bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <StatusPill status="LIVE" />
                <span className="text-xs tabular-nums text-tertiary">
                  {f.matchDate ? format(new Date(f.matchDate), 'd MMM · HH:mm') : '—'}
                </span>
              </div>

              <div className="mt-4 flex items-start gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="truncate text-sm font-medium text-primary">{f.homeTeam?.school?.name}</p>
                  <p className="truncate text-sm font-medium text-primary">{f.awayTeam?.school?.name}</p>
                </div>
                <div className="shrink-0 space-y-2 text-right font-display text-xl font-bold tabular-nums leading-none text-live">
                  <p>{f.homeScore ?? 0}</p>
                  <p>{f.awayScore ?? 0}</p>
                </div>
              </div>

              <p className="mt-4 border-t border-hairline pt-3 text-xs text-tertiary">
                {[sentence(f.stage), f.venue].filter(Boolean).join(' · ') || '—'}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AmashuriAdminLive;
