import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { getSports } from '../../api/endpoints/sports';
import cn from '../ui/cn';

/**
 * Sport scope control for the header.
 *
 * A DISCLOSURE, NOT A MODAL. Tapping the pill expands a row of sport pills
 * directly beneath the header — no overlay, no scrim, no focus trap, and the
 * content behind it stays visible so you keep your place. The old version of this
 * was a full-height right-hand drawer holding a 2-column grid of sports plus
 * browse links, theme and language: everything two taps deep behind a hamburger.
 *
 * Sports are horizontally scrollable rather than wrapped, because the list grows
 * as MINISPORTS adds federations and a wrapping grid would push content down by
 * an unpredictable amount.
 */
const SportSwitcher = ({ activeSlug }) => {
  const [open, setOpen] = useState(false);

  // Query copied verbatim from the old Navbar — same key, so it shares cache
  // with anything else that already fetched the sports list.
  const { data: sportsRes } = useQuery({ queryKey: ['nav-sports'], queryFn: getSports, staleTime: 300000 });
  const sports = sportsRes?.data || [];

  const active = sports.find((s) => s.slug === activeSlug);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="sport-scope"
        className={cn(
          'inline-flex h-9 max-w-[9rem] items-center gap-1 rounded-pill border border-hairline px-3',
          'text-sm text-secondary transition-colors duration-150 ease-standard',
          'hover:bg-surface-2 hover:text-primary',
          open && 'bg-surface-2 text-primary'
        )}
      >
        <span className="truncate">{active?.name || 'All sports'}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn('shrink-0 transition-transform duration-150 ease-standard', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          id="sport-scope"
          className="absolute inset-x-0 top-full border-b border-hairline bg-surface"
        >
          <div className="scroll-contain flex gap-2 overflow-x-auto px-3 py-2">
            <NavLink
              to="/fixtures"
              onClick={() => setOpen(false)}
              className={cn(
                'shrink-0 rounded-pill border px-3 py-1.5 text-sm',
                !activeSlug
                  ? 'border-primary bg-primary text-page'
                  : 'border-hairline text-secondary'
              )}
            >
              All sports
            </NavLink>
            {sports.map((s) => (
              <NavLink
                key={s.id}
                to={`/sports/${s.slug}`}
                onClick={() => setOpen(false)}
                className={cn(
                  'shrink-0 rounded-pill border px-3 py-1.5 text-sm',
                  s.slug === activeSlug
                    ? 'border-primary bg-primary text-page'
                    : 'border-hairline text-secondary'
                )}
              >
                {s.name}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default SportSwitcher;
