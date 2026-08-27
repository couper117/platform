import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Plus, RefreshCw, Megaphone, AlertTriangle, CalendarOff, ShieldCheck, Pencil, Users,
} from 'lucide-react';
import {
  getUmugandaDays, getUmugandaConflicts, createUmugandaDay, updateUmugandaDay,
  generateUmugandaDates, createUmugandaAnnouncement,
} from '../../api/endpoints/umuganda';
import AdminTable from '../../components/admin/AdminTable';
import { Modal, Button } from '../../components/ui';
import Skeleton from '../../components/shared/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import useUiStore from '../../store/uiStore';
import { useDateFormat } from '../../i18n/dateLocale';
import useEnumLabel from '../../i18n/enums';
import UmugandaConflictDialog from '../../components/umuganda/UmugandaConflictDialog';
import UmugandaMark from '../../components/umuganda/UmugandaMark';
import cn from '../../components/ui/cn';

/**
 * Umuganda Management (§7).
 *
 * The calculation proposes; this page is where a human disposes. Everything the
 * generator produced arrives as EXPECTED and stays that way until an
 * administrator confirms, moves or disables it — and once they touch a row, the
 * generator never reclaims it.
 */

const STATUSES = ['EXPECTED', 'CONFIRMED', 'MOVED', 'DISABLED'];

const StatusChip = ({ status }: { status: string }) => {
  const enumLabel = useEnumLabel();
  const s = String(status).toUpperCase();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        s === 'CONFIRMED' && 'border-brand/40 text-brand-text',
        s === 'EXPECTED' && 'border-hairline text-secondary',
        s === 'MOVED' && 'border-hairline text-primary',
        s === 'DISABLED' && 'border-hairline text-tertiary line-through'
      )}
    >
      {enumLabel('umuganda_status', s)}
    </span>
  );
};

const AdminUmugandaPage = () => {
  const { t } = useTranslation();
  const fmt = useDateFormat();
  const enumLabel = useEnumLabel();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s: any) => s.pushToast);

  const [dateModal, setDateModal] = useState<any>(null);
  const [announceFor, setAnnounceFor] = useState<any>(null);
  const [conflictFor, setConflictFor] = useState<any>(null);

  const { data: daysData, isLoading } = useQuery({
    queryKey: ['umuganda', 'admin', 'days'],
    queryFn: () => getUmugandaDays({ months: 12 }),
  });

  const { data: conflictsData, isLoading: loadingConflicts } = useQuery({
    queryKey: ['umuganda', 'admin', 'conflicts'],
    queryFn: () => getUmugandaConflicts(12),
  });

  const days = daysData?.data?.days || [];
  const next = daysData?.data?.next;
  const conflicts = conflictsData?.data || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['umuganda'] });

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      payload.id ? updateUmugandaDay(payload.id, payload.body) : createUmugandaDay(payload.body),
    onSuccess: () => {
      invalidate();
      setDateModal(null);
      pushToast(t('umuganda.saved'), 'success');
    },
    onError: (e: any) => pushToast(e?.response?.data?.message || t('umuganda.saveFailed')),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateUmugandaDates(12),
    onSuccess: (res: any) => {
      invalidate();
      pushToast(t('umuganda.generated', { count: res?.data?.created ?? 0 }), 'success');
    },
    onError: (e: any) => pushToast(e?.response?.data?.message || t('umuganda.saveFailed')),
  });

  const announceMutation = useMutation({
    mutationFn: (payload: any) => createUmugandaAnnouncement(payload.id, payload.body),
    onSuccess: () => {
      invalidate();
      setAnnounceFor(null);
      pushToast(t('umuganda.announcementPublished'), 'success');
    },
    onError: (e: any) => pushToast(e?.response?.data?.message || t('umuganda.saveFailed')),
  });

  const totalConflicts = useMemo(
    () => conflicts.reduce((n: number, c: any) => n + (c.events?.length || 0), 0),
    [conflicts]
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold text-primary">
            <Users size={18} className="text-brand-text" aria-hidden="true" />
            {t('umuganda.management')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-secondary">{t('umuganda.managementIntro')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-hairline px-4 text-sm text-secondary transition-colors duration-150 ease-standard hover:border-brand/40 hover:text-brand-text disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(generateMutation.isPending && 'animate-spin')} aria-hidden="true" />
            {t('umuganda.generateDates')}
          </button>
          <button
            type="button"
            onClick={() => setDateModal({ body: { date: '', title: '', description: '', status: 'CONFIRMED', startTime: '08:00', endTime: '11:00' } })}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-pill bg-brand-strong px-4 text-sm font-semibold text-brand-on transition-colors duration-150 ease-standard hover:bg-brand-hover"
          >
            <Plus size={14} aria-hidden="true" />
            {t('umuganda.addDate')}
          </button>
        </div>
      </div>

      {/* ── Summary ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-card border border-brand/25 bg-brand/[0.06] p-4">
          <p className="text-xs uppercase tracking-wide text-tertiary">{t('umuganda.thisMonthDate')}</p>
          <p className="mt-1 font-display text-lg font-semibold text-primary">
            {next ? fmt(next.date, 'EEEE d MMMM') : '—'}
          </p>
          {next && <div className="mt-2"><StatusChip status={next.status} /></div>}
        </div>
        <div className="rounded-card border border-hairline bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-tertiary">{t('umuganda.conflictingEvents')}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-primary">{totalConflicts}</p>
        </div>
        <div className="rounded-card border border-hairline bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-tertiary">{t('umuganda.upcomingDates')}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-primary">{days.length}</p>
        </div>
      </div>

      {/* ── Conflicts (§7 "View conflicting events") ── */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-primary">
          <AlertTriangle size={15} className="text-secondary" aria-hidden="true" />
          {t('umuganda.conflictingEvents')}
        </h2>

        {loadingConflicts ? (
          <Skeleton className="h-24 w-full rounded-card" />
        ) : conflicts.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title={t('umuganda.noConflicts')}
            hint={t('umuganda.noConflictsHint')}
          />
        ) : (
          conflicts.map((group: any) => (
            <div key={group.umugandaDay.id} className="rounded-card border border-hairline bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-primary">
                  {fmt(group.umugandaDay.date, 'EEEE d MMMM yyyy')}
                </p>
                <UmugandaMark size="sm" />
              </div>

              <div className="mt-3 space-y-2">
                {group.events.map((ev: any) => (
                  <div
                    key={`${ev.kind}-${ev.id}`}
                    className="flex flex-wrap items-center gap-3 rounded-card border border-hairline bg-surface-2 px-3 py-2"
                  >
                    <span className="w-12 shrink-0 font-display text-sm text-secondary">
                      {ev.matchDate ? fmt(ev.matchDate, 'HH:mm') : t('common.tbd')}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-primary">
                      {ev.homeTeam?.name} <span className="text-tertiary">v</span> {ev.awayTeam?.name}
                    </span>
                    <span className="text-xs text-tertiary">{enumLabel('match_status', ev.status)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setConflictFor({
                          kind: ev.kind === 'AMASHURI' ? 'amashuri' : 'league',
                          fixture: ev,
                          umugandaDay: group.umugandaDay,
                        })
                      }
                      className="min-h-9 shrink-0 rounded-pill border border-hairline px-3 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:border-brand/40 hover:text-brand-text"
                    >
                      {t('umuganda.decide')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* ── Dates table ── */}
      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold text-primary">
          {t('umuganda.upcomingDates')}
        </h2>

        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-card" />
        ) : days.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title={t('umuganda.noDates')}
            hint={t('umuganda.noDatesHint')}
          />
        ) : (
          <AdminTable
            headers={[
              t('umuganda.date'),
              t('umuganda.statusLabel'),
              t('umuganda.source'),
              t('umuganda.window'),
              '',
            ]}
          >
            {days.map((d: any) => (
              <tr key={d.id} className="border-b border-hairline last:border-0">
                <td className="px-4 py-3">
                  <Link to="/calendar" className="text-sm font-medium text-primary hover:text-brand-text">
                    {fmt(d.date, 'EEE d MMM yyyy')}
                  </Link>
                </td>
                <td className="px-4 py-3"><StatusChip status={d.status} /></td>
                <td className="px-4 py-3 text-xs text-tertiary">
                  {d.overridden ? t('umuganda.sourceOverridden') : enumLabel('umuganda_source', d.source)}
                </td>
                <td className="px-4 py-3 text-xs text-tertiary">{d.startTime}–{d.endTime}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setDateModal({
                          id: d.id,
                          body: {
                            date: String(d.date).slice(0, 10),
                            title: d.title || '',
                            description: d.description || '',
                            status: d.status,
                            startTime: d.startTime,
                            endTime: d.endTime,
                          },
                        })
                      }
                      aria-label={t('umuganda.editDate')}
                      className="flex h-9 w-9 items-center justify-center rounded-pill border border-hairline text-secondary transition-colors duration-150 ease-standard hover:border-brand/40 hover:text-brand-text"
                    >
                      <Pencil size={13} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnnounceFor({ id: d.id, body: { title: '', body: '' } })}
                      aria-label={t('umuganda.createAnnouncement')}
                      className="flex h-9 w-9 items-center justify-center rounded-pill border border-hairline text-secondary transition-colors duration-150 ease-standard hover:border-brand/40 hover:text-brand-text"
                    >
                      <Megaphone size={13} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        )}
      </section>

      {/* ── Add / edit date ── */}
      {dateModal && (
        <Modal
          open
          onClose={() => setDateModal(null)}
          title={dateModal.id ? t('umuganda.editDate') : t('umuganda.addDate')}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDateModal(null)}>
                {t('common.close')}
              </Button>
              <Button
                size="sm"
                loading={saveMutation.isPending}
                onClick={() => saveMutation.mutate(dateModal)}
              >
                {t('common.save_changes')}
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm text-secondary">{t('umuganda.date')}</span>
              <input
                type="date"
                required
                value={dateModal.body.date}
                onChange={(e) => setDateModal({ ...dateModal, body: { ...dateModal.body, date: e.target.value } })}
                className="w-full rounded-card border border-hairline bg-surface px-3 py-2 text-sm text-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-secondary">{t('umuganda.statusLabel')}</span>
              <select
                value={dateModal.body.status}
                onChange={(e) => setDateModal({ ...dateModal, body: { ...dateModal.body, status: e.target.value } })}
                className="w-full rounded-card border border-hairline bg-surface px-3 py-2 text-sm text-primary"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{enumLabel('umuganda_status', s)}</option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-tertiary">{t('umuganda.statusHint')}</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-sm text-secondary">{t('umuganda.startTime')}</span>
                <input
                  type="time"
                  value={dateModal.body.startTime}
                  onChange={(e) => setDateModal({ ...dateModal, body: { ...dateModal.body, startTime: e.target.value } })}
                  className="w-full rounded-card border border-hairline bg-surface px-3 py-2 text-sm text-primary"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-secondary">{t('umuganda.endTime')}</span>
                <input
                  type="time"
                  value={dateModal.body.endTime}
                  onChange={(e) => setDateModal({ ...dateModal, body: { ...dateModal.body, endTime: e.target.value } })}
                  className="w-full rounded-card border border-hairline bg-surface px-3 py-2 text-sm text-primary"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm text-secondary">{t('umuganda.titleField')}</span>
              <input
                value={dateModal.body.title}
                onChange={(e) => setDateModal({ ...dateModal, body: { ...dateModal.body, title: e.target.value } })}
                className="w-full rounded-card border border-hairline bg-surface px-3 py-2 text-sm text-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-secondary">{t('umuganda.descriptionField')}</span>
              <textarea
                rows={3}
                value={dateModal.body.description}
                onChange={(e) => setDateModal({ ...dateModal, body: { ...dateModal.body, description: e.target.value } })}
                className="w-full rounded-card border border-hairline bg-surface px-3 py-2 text-sm text-primary"
              />
            </label>
          </div>
        </Modal>
      )}

      {/* ── Announcement ── */}
      {announceFor && (
        <Modal
          open
          onClose={() => setAnnounceFor(null)}
          title={t('umuganda.createAnnouncement')}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAnnounceFor(null)}>
                {t('common.close')}
              </Button>
              <Button
                size="sm"
                loading={announceMutation.isPending}
                onClick={() => announceMutation.mutate(announceFor)}
              >
                {t('umuganda.publish')}
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm text-secondary">{t('umuganda.titleField')}</span>
              <input
                required
                value={announceFor.body.title}
                onChange={(e) => setAnnounceFor({ ...announceFor, body: { ...announceFor.body, title: e.target.value } })}
                className="w-full rounded-card border border-hairline bg-surface px-3 py-2 text-sm text-primary"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-secondary">{t('umuganda.message')}</span>
              <textarea
                required
                rows={4}
                value={announceFor.body.body}
                onChange={(e) => setAnnounceFor({ ...announceFor, body: { ...announceFor.body, body: e.target.value } })}
                className="w-full rounded-card border border-hairline bg-surface px-3 py-2 text-sm text-primary"
              />
            </label>
          </div>
        </Modal>
      )}

      {/* ── Decision ── */}
      {conflictFor && (
        <UmugandaConflictDialog
          open
          onClose={() => setConflictFor(null)}
          kind={conflictFor.kind}
          fixture={conflictFor.fixture}
          umugandaDay={conflictFor.umugandaDay}
        />
      )}
    </div>
  );
};

export default AdminUmugandaPage;
