import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Plus, RefreshCw, Megaphone, AlertTriangle, CalendarOff, CalendarDays, ShieldCheck, Pencil,
} from 'lucide-react';
import {
  getUmugandaDays, getUmugandaConflicts, createUmugandaDay, updateUmugandaDay,
  generateUmugandaDates, createUmugandaAnnouncement,
} from '../../api/endpoints/umuganda';
import { PageHeader, StatCard, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  Modal, Button, IconButton, Field, Input, Select, EmptyState, Skeleton,
} from '../../components/ui';
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
 *
 * Presentation is the shared admin kit (PageHeader / StatCard / Panel / TableWrap).
 * The one hand-built tile is the next Umuganda date: its headline is a date, not a
 * number, so it borrows StatCard's shell rather than its 3xl numeral.
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
  // Memoised rather than a bare `|| []`: the fallback would be a new array on
  // every render, defeating the totalConflicts memo below.
  const conflicts = useMemo(() => conflictsData?.data || [], [conflictsData]);

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
    <div>
      <PageHeader
        title={t('umuganda.management')}
        subtitle={t('umuganda.managementIntro')}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={generateMutation.isPending}
              onClick={() => generateMutation.mutate()}
            >
              {t('umuganda.generateDates')}
            </Button>
            <Button
              size="sm"
              icon={Plus}
              onClick={() => setDateModal({ body: { date: '', title: '', description: '', status: 'CONFIRMED', startTime: '08:00', endTime: '11:00' } })}
            >
              {t('umuganda.addDate')}
            </Button>
          </>
        }
      />

      {/* ── Summary ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Same shell as StatCard; the headline is a date, so it takes a size a
            long weekday name can survive. */}
        <div className="rounded-card border border-hairline bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-lg font-bold leading-tight text-primary">
              {next ? fmt(next.date, 'EEEE d MMMM') : '—'}
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-tint text-brand-text">
              <CalendarDays size={16} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-sm font-medium text-primary">{t('umuganda.thisMonthDate')}</p>
          {next && <div className="mt-2"><StatusChip status={next.status} /></div>}
        </div>

        <StatCard
          icon={AlertTriangle}
          value={totalConflicts}
          label={t('umuganda.conflictingEvents')}
          tone={totalConflicts > 0 ? 'warn' : 'default'}
        />
        <StatCard
          icon={CalendarDays}
          value={days.length}
          label={t('umuganda.upcomingDates')}
        />
      </div>

      {/* ── Conflicts (§7 "View conflicting events") ── */}
      <div className="mt-4 grid gap-4">
        <Panel title={t('umuganda.conflictingEvents')}>
          {loadingConflicts ? (
            <Skeleton className="h-24 w-full" />
          ) : conflicts.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title={t('umuganda.noConflicts')}
              hint={t('umuganda.noConflictsHint')}
            />
          ) : (
            <div className="space-y-3">
              {conflicts.map((group: any) => (
                <div key={group.umugandaDay.id} className="rounded-control border border-hairline bg-surface-2 p-3">
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
                        className="flex flex-wrap items-center gap-3 rounded-control border border-hairline bg-surface px-3 py-2"
                      >
                        <span className="w-12 shrink-0 text-sm tabular-nums text-secondary">
                          {ev.matchDate ? fmt(ev.matchDate, 'HH:mm') : t('common.tbd')}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-primary">
                          {ev.homeTeam?.name} <span className="text-tertiary">v</span> {ev.awayTeam?.name}
                        </span>
                        <span className="text-xs text-tertiary">{enumLabel('match_status', ev.status)}</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setConflictFor({
                              kind: ev.kind === 'AMASHURI' ? 'amashuri' : 'league',
                              fixture: ev,
                              umugandaDay: group.umugandaDay,
                            })
                          }
                        >
                          {t('umuganda.decide')}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* ── Dates table ── */}
        <Panel title={t('umuganda.upcomingDates')} flush>
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : days.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={CalendarOff}
                title={t('umuganda.noDates')}
                hint={t('umuganda.noDatesHint')}
              />
            </div>
          ) : (
            <TableWrap>
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr>
                    <Th>{t('umuganda.date')}</Th>
                    <Th>{t('umuganda.statusLabel')}</Th>
                    <Th>{t('umuganda.source')}</Th>
                    <Th>{t('umuganda.window')}</Th>
                    <Th align="right" />
                  </tr>
                </thead>
                <tbody>
                  {days.map((d: any) => (
                    <tr key={d.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                      <Td>
                        <Link
                          to="/calendar"
                          className="text-sm font-medium text-primary transition-colors duration-150 ease-standard hover:text-brand-text"
                        >
                          {fmt(d.date, 'EEE d MMM yyyy')}
                        </Link>
                      </Td>
                      <Td><StatusChip status={d.status} /></Td>
                      <Td className="text-tertiary">
                        {d.overridden ? t('umuganda.sourceOverridden') : enumLabel('umuganda_source', d.source)}
                      </Td>
                      <Td className="whitespace-nowrap tabular-nums text-tertiary">{d.startTime}–{d.endTime}</Td>
                      <Td align="right">
                        <div className="flex justify-end gap-1">
                          <IconButton
                            icon={Pencil}
                            label={t('umuganda.editDate')}
                            size="sm"
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
                          />
                          <IconButton
                            icon={Megaphone}
                            label={t('umuganda.createAnnouncement')}
                            size="sm"
                            onClick={() => setAnnounceFor({ id: d.id, body: { title: '', body: '' } })}
                          />
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>
      </div>

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
          <div className="space-y-4">
            <Field label={t('umuganda.date')} required>
              {(p) => (
                <Input
                  {...p}
                  type="date"
                  value={dateModal.body.date}
                  onChange={(e) => setDateModal({ ...dateModal, body: { ...dateModal.body, date: e.target.value } })}
                />
              )}
            </Field>

            <Field label={t('umuganda.statusLabel')} hint={t('umuganda.statusHint')}>
              {(p) => (
                <Select
                  {...p}
                  size="md"
                  value={dateModal.body.status}
                  onChange={(e) => setDateModal({ ...dateModal, body: { ...dateModal.body, status: e.target.value } })}
                  options={STATUSES.map((s) => ({ value: s, label: enumLabel('umuganda_status', s) }))}
                />
              )}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('umuganda.startTime')}>
                {(p) => (
                  <Input
                    {...p}
                    type="time"
                    value={dateModal.body.startTime}
                    onChange={(e) => setDateModal({ ...dateModal, body: { ...dateModal.body, startTime: e.target.value } })}
                  />
                )}
              </Field>
              <Field label={t('umuganda.endTime')}>
                {(p) => (
                  <Input
                    {...p}
                    type="time"
                    value={dateModal.body.endTime}
                    onChange={(e) => setDateModal({ ...dateModal, body: { ...dateModal.body, endTime: e.target.value } })}
                  />
                )}
              </Field>
            </div>

            <Field label={t('umuganda.titleField')}>
              {(p) => (
                <Input
                  {...p}
                  value={dateModal.body.title}
                  onChange={(e) => setDateModal({ ...dateModal, body: { ...dateModal.body, title: e.target.value } })}
                />
              )}
            </Field>

            <Field label={t('umuganda.descriptionField')}>
              {({ invalid, ...p }) => (
                <textarea
                  {...p}
                  rows={3}
                  value={dateModal.body.description}
                  onChange={(e) => setDateModal({ ...dateModal, body: { ...dateModal.body, description: e.target.value } })}
                  className="w-full rounded-input border border-hairline bg-surface px-4 py-3 text-primary placeholder:text-tertiary transition-colors duration-150 ease-standard hover:border-brand/40 focus:border-brand focus:outline-none"
                />
              )}
            </Field>
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
          <div className="space-y-4">
            <Field label={t('umuganda.titleField')} required>
              {(p) => (
                <Input
                  {...p}
                  value={announceFor.body.title}
                  onChange={(e) => setAnnounceFor({ ...announceFor, body: { ...announceFor.body, title: e.target.value } })}
                />
              )}
            </Field>
            <Field label={t('umuganda.message')} required>
              {({ invalid, ...p }) => (
                <textarea
                  {...p}
                  rows={4}
                  value={announceFor.body.body}
                  onChange={(e) => setAnnounceFor({ ...announceFor, body: { ...announceFor.body, body: e.target.value } })}
                  className="w-full rounded-input border border-hairline bg-surface px-4 py-3 text-primary placeholder:text-tertiary transition-colors duration-150 ease-standard hover:border-brand/40 focus:border-brand focus:outline-none"
                />
              )}
            </Field>
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
