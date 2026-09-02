import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import apiClient from '../../api/client';

/**
 * Notifications for whoever is here — signed in or not.
 *
 * A visitor who followed a club without an account still gets told their match
 * has started; the API accepts this browser's anonymous token. Showing the bell
 * only to registered users would make the anonymous follow half a feature.
 *
 * Hidden entirely when there is nothing and never has been, so it does not sit
 * in the header as permanent furniture for someone who follows nobody.
 */
const NotificationBell = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await apiClient.get('/notifications')).data,
    // Matches are the thing being announced, so a minute is soon enough to hear
    // about one and slow enough not to poll the API for every open tab.
    refetchInterval: 60_000,
  });

  const items = data?.data || [];
  const unread = data?.unread || 0;

  const markAll = useMutation({
    mutationFn: () => apiClient.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markOne = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Close on an outside click or Escape — a panel that traps you is worse than
  // no panel.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!items.length && !unread) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('notifications.title', 'Notifications')}
        aria-expanded={open}
        className="relative rounded-full p-2 text-secondary transition-colors hover:text-primary"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold tabular-nums text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-tertiary">
              {t('notifications.title', 'Notifications')}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-text"
              >
                <CheckCheck size={12} /> {t('notifications.mark_all', 'Mark all read')}
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-tertiary">
                {t('notifications.none', 'Nothing yet.')}
              </li>
            ) : (
              items.map((n: any) => {
                const Row = (
                  <>
                    <p className={`text-sm ${n.readAt ? 'text-secondary' : 'font-semibold text-primary'}`}>{n.title}</p>
                    {n.body && <p className="mt-0.5 truncate text-xs text-tertiary">{n.body}</p>}
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-tertiary">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </>
                );
                return (
                  <li key={n.id} className={`border-b border-hairline/50 last:border-0 ${n.readAt ? '' : 'bg-brand/5'}`}>
                    {n.link ? (
                      <Link
                        to={n.link}
                        onClick={() => { if (!n.readAt) markOne.mutate(n.id); setOpen(false); }}
                        className="block px-4 py-3 transition-colors hover:bg-surface-2"
                      >
                        {Row}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => !n.readAt && markOne.mutate(n.id)}
                        className="block w-full px-4 py-3 text-left transition-colors hover:bg-surface-2"
                      >
                        {Row}
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
