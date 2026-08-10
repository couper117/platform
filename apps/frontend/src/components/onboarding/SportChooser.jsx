import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { getSports } from '../../api/endpoints/sports';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import SportIcon from '../shared/SportIcon';
import cn from '../ui/cn';

/**
 * First-run sport chooser.
 *
 * CARD ANATOMY comes from the reference's "experience selector": a real radio kept
 * off-screen, a 2px neutral border, and a green border over a green tint once
 * checked. Using genuine radios rather than styled divs means arrow-key navigation,
 * the correct announcement to a screen reader, and form semantics for free.
 *
 * IT IS DISMISSIBLE, and that is deliberate even though it is a first-run gate. An
 * un-skippable interstitial is the fastest way to make someone leave — and plenty
 * of visitors arrive wanting the whole platform, not one sport. "Show me
 * everything" records that answer so they are never asked twice.
 *
 * Nothing is written until Continue is pressed, so idly tapping cards commits
 * nothing.
 */
const SportChooser = ({ open, onChoose, onSkip }) => {
  const [selected, setSelected] = useState(null);

  // Query copied verbatim from the header — same key, so it is already warm here.
  const { data: sportsRes, isLoading } = useQuery({
    queryKey: ['nav-sports'],
    queryFn: getSports,
    staleTime: 300000,
  });
  const sports = sportsRes?.data ?? [];

  return (
    <Modal
      open={open}
      onClose={onSkip}
      title="Which sport do you follow?"
      description="We'll open RwaSport on your sport every time. You can change this whenever you like."
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-tap text-sm font-semibold text-secondary underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Show me everything instead
          </button>
          <Button
            onClick={() => selected && onChoose(selected)}
            disabled={!selected}
            size="lg"
            className="sm:min-w-[13rem]"
          >
            {selected ? 'Continue' : 'Pick a sport'}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : sports.length === 0 ? (
        // No sports means nothing to choose. Don't strand the visitor in a dialog
        // whose only valid answer is to leave.
        <div className="py-6 text-center">
          <p className="text-base font-semibold text-primary">No sports published yet</p>
          <p className="mt-1 text-sm text-secondary">
            Competitions appear here as federations set them up.
          </p>
        </div>
      ) : (
        <fieldset>
          <legend className="sr-only">Choose your favourite sport</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {sports.map((s) => {
              const active = selected === s.slug;
              return (
                <label
                  key={s.id}
                  className={cn(
                    'relative flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 p-4 text-center',
                    'transition-all duration-200 ease-standard',
                    active
                      ? 'border-brand bg-brand-tint'
                      : 'border-hairline bg-surface hover:border-brand/40 hover:bg-brand-tint/50'
                  )}
                >
                  <input
                    type="radio"
                    name="favourite-sport"
                    value={s.slug}
                    checked={active}
                    onChange={() => setSelected(s.slug)}
                    className="sr-only"
                    data-autofocus={s === sports[0] ? '' : undefined}
                  />
                  {active && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-pill bg-brand text-white">
                      <Check size={12} strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                  <SportIcon
                    slug={s.slug}
                    size={26}
                    className={active ? 'text-brand' : 'text-tertiary'}
                  />
                  <span className="text-sm font-bold leading-tight text-primary">{s.name}</span>
                  <span className="text-xs text-tertiary">
                    {s._count?.leagues ?? 0} {s._count?.leagues === 1 ? 'league' : 'leagues'}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </Modal>
  );
};

export default SportChooser;
