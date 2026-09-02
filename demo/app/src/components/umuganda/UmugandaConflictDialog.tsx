import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, RefreshCw, Clock, Flag } from 'lucide-react';
import { setUmugandaDecision } from '../../api/endpoints/umuganda';
import { useDateFormat } from '../../i18n/dateLocale';
import { DECISION_NEEDS_DATE } from '../../utils/umuganda';
import { Modal, Button, Field, Input } from '../ui';
import UmugandaMark from './UmugandaMark';
import cn from '../ui/cn';

/**
 * The administrator's Umuganda decision (§2, §3).
 *
 * The platform's job stops at asking the question. It offers four rulings and
 * NEVER cancels a match — "Cancel" is deliberately absent from this list; an
 * admin who wants that uses the ordinary status control, and owns the decision.
 *
 * Moving a match preserves the original date on the server (written once), so
 * the public "originally / now" line stays truthful through later edits.
 */

const OPTIONS = [
  { value: 'CONTINUE', icon: Check, key: 'continue' },
  { value: 'MOVED', icon: RefreshCw, key: 'move' },
  { value: 'AFTER_UMUGANDA', icon: Clock, key: 'after' },
  { value: 'AFFECTED', icon: Flag, key: 'affected' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  /** 'league' | 'amashuri' */
  kind: 'league' | 'amashuri';
  fixture: any;
  umugandaDay?: any;
};

/** Turns a Date into the value an <input type="datetime-local"> expects. */
const toLocalInput = (value: any) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const UmugandaConflictDialog = ({ open, onClose, kind, fixture, umugandaDay }: Props) => {
  const { t } = useTranslation();
  const fmt = useDateFormat();
  const queryClient = useQueryClient();

  const [decision, setDecision] = useState('CONTINUE');
  const [newDate, setNewDate] = useState(() => toLocalInput(fixture?.matchDate));
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const needsDate = DECISION_NEEDS_DATE.includes(decision);

  const mutation = useMutation({
    mutationFn: () =>
      setUmugandaDecision(kind, fixture.id, {
        decision,
        // Sent as an ISO instant so the server is never guessing the offset.
        newDate: needsDate && newDate ? new Date(newDate).toISOString() : null,
        reason: reason.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['umuganda'] });
      queryClient.invalidateQueries({ queryKey: ['fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['adminFixtures'] });
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.message || t('umuganda.decisionFailed'));
    },
  });

  const submit = () => {
    setError(null);
    if (needsDate && !newDate) {
      setError(t('umuganda.newDateRequired'));
      return;
    }
    mutation.mutate();
  };

  const pairing = `${fixture?.homeTeam?.name || t('common.tbd')} v ${fixture?.awayTeam?.name || t('common.tbd')}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('umuganda.conflictTitle')}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
          <Button size="sm" onClick={submit} loading={mutation.isPending}>
            {t('umuganda.saveDecision')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* The warning itself — §2's wording. */}
        <div className="flex gap-3 rounded-card border border-hairline bg-surface-2 p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm text-primary">{t('umuganda.conflictWarning')}</p>
            <p className="mt-1.5 truncate text-sm font-semibold text-primary">{pairing}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-tertiary">
              {fmt(fixture?.matchDate, 'EEEE d MMMM, HH:mm')}
              {umugandaDay && (
                <>
                  <span aria-hidden="true">·</span>
                  <UmugandaMark size="sm" />
                </>
              )}
            </p>
          </div>
        </div>

        {/* Four options, never a cancel. */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-primary">
            {t('umuganda.chooseDecision')}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = decision === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDecision(opt.value)}
                  aria-pressed={active}
                  className={cn(
                    'flex min-h-tap items-start gap-2.5 rounded-card border p-3 text-left',
                    'transition-colors duration-150 ease-standard',
                    active
                      ? 'border-brand bg-brand/[0.07]'
                      : 'border-hairline bg-surface hover:border-brand/30'
                  )}
                >
                  <Icon
                    size={15}
                    className={cn('mt-0.5 shrink-0', active ? 'text-brand-text' : 'text-tertiary')}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-primary">
                      {t(`umuganda.decision.${opt.key}`)}
                    </span>
                    <span className="mt-0.5 block text-xs text-secondary">
                      {t(`umuganda.decision.${opt.key}Hint`)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {needsDate && (
          <Field label={t('umuganda.newDateTime')} required>
            {(p: any) => (
              <Input
                {...p}
                type="datetime-local"
                value={newDate}
                onChange={(e: any) => setNewDate(e.target.value)}
                data-autofocus
              />
            )}
          </Field>
        )}

        <Field label={t('umuganda.reason')} hint={t('umuganda.reasonHint')}>
          {(p: any) => (
            <Input
              {...p}
              value={reason}
              onChange={(e: any) => setReason(e.target.value)}
              maxLength={500}
              placeholder={t('umuganda.reasonPlaceholder')}
            />
          )}
        </Field>

        {/* What the public will be told, before it is told to them. */}
        {fixture?.matchDate && needsDate && newDate && (
          <div className="rounded-card border border-brand/25 bg-brand/[0.06] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
              {t('umuganda.publicPreview')}
            </p>
            <p className="mt-1.5 text-sm text-secondary">
              <span className="text-tertiary line-through">
                {fmt(fixture.matchDate, 'EEE d MMM, HH:mm')}
              </span>
              <span className="mx-2 text-tertiary" aria-hidden="true">→</span>
              <span className="font-semibold text-primary">
                {fmt(new Date(newDate), 'EEE d MMM, HH:mm')}
              </span>
            </p>
          </div>
        )}

        {error && <p className="text-sm text-danger-text">{error}</p>}
      </div>
    </Modal>
  );
};

export default UmugandaConflictDialog;
