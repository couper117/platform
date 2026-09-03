import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
} from 'lucide-react';

import { PageHeader, StatCard, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { MatchRow } from '../../components/reporter/ReporterUI';
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  Modal,
  Skeleton,
  SkeletonList,
  StatusPill,
  cn,
} from '../../components/ui';
import useReporterFixtures from '../../hooks/useReporterFixtures';
import { closeoutSummary } from '../../lib/reporterMatch';
import { getMatch, saveResult } from '../../api/endpoints/reporter';
import useUiStore from '../../store/uiStore';

/**
 * Reporter → Results & sign-off.
 *
 * WHY THIS EXISTS. A reporter's finished work was invisible to them. The console
 * filtered assignments to SCHEDULED + LIVE and threw the rest away, so the moment
 * a match ended it vanished from the portal — including the matches whose
 * half-time score, attendance or statistics were never filled in. Nobody could
 * see the gap, so nobody closed it. This page is the archive AND the outstanding
 * paperwork, because separating them is what produced the gap in the first place.
 *
 * It speaks the admin vocabulary (PageHeader / StatCard / Panel / TableWrap) on a
 * pointer and the reporter vocabulary (MatchRow) on a phone, because those are
 * the two ways this screen is actually read: at a desk on Monday, and standing in
 * a car park ten minutes after full time.
 */

/* ── what the LIST can honestly say is missing ───────────────────────────── */

/**
 * The outstanding items a match's LIST ROW is entitled to claim.
 *
 * closeoutSummary() also scores match statistics, and statistics live in
 * `fixture.stats` — a relation GET /fixtures does not include (it includes only
 * homeTeam, awayTeam, league and competition). Running the full summary here
 * would read an absent relation as an empty one and mark every single match
 * "statistics missing" on the strength of a field that was never fetched.
 *
 * So the list scores only the three scalar columns it really holds, and the
 * statistics question waits until the match is opened and the full fixture is in
 * hand. A tile that claims to know something it cannot is worse than one that
 * does not claim it.
 */
const listOutstanding = (fixture: any): string[] => {
  // Only a COMPLETED match owes this paperwork. An abandoned or postponed
  // fixture has no half-time score to be missing, and dressing it in warnings
  // would send a reporter looking for work that does not exist.
  if (fixture?.status !== 'COMPLETED') return [];

  const missing: string[] = [];
  if (fixture.homeScore == null || fixture.awayScore == null) missing.push('Final score');
  if (fixture.homeScoreHt == null || fixture.awayScoreHt == null) missing.push('Half-time score');
  if (fixture.attendance == null) missing.push('Attendance');
  return missing;
};

const teamName = (team: any) => team?.shortName || team?.name || '—';
const matchTitle = (f: any) => `${teamName(f?.homeTeam)} v ${teamName(f?.awayTeam)}`;
const hasScore = (f: any) => f?.homeScore != null && f?.awayScore != null;

/* ── small pieces ────────────────────────────────────────────────────────── */

/** The final score, or an em dash where the reporter never confirmed one. */
const ScoreTag = ({ fixture }: { fixture: any }) => (
  <span className="shrink-0 font-display text-base font-bold tabular-nums text-primary">
    {hasScore(fixture) ? `${fixture.homeScore}–${fixture.awayScore}` : '—'}
  </span>
);

/**
 * What a match still owes, as chips.
 *
 * An outstanding item is the only thing here that carries a warning colour: it is
 * the only one that costs the reporter anything. "Signed off" is deliberately
 * quiet — it is finished, it does not need attention.
 */
const OutstandingChips = ({ items }: { items: string[] }) => {
  if (!items.length) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-tertiary">
        <Check size={12} aria-hidden="true" />
        Signed off
      </span>
    );
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((label) => (
        <li key={label}>
          <span className="inline-flex items-center gap-1 rounded-pill border border-live/40 px-2 py-0.5 text-xs text-live">
            <AlertTriangle size={11} aria-hidden="true" />
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
};

/* ── the sign-off dialog ─────────────────────────────────────────────────── */

/**
 * Blank stays blank: an untouched optional field must not be sent as 0.
 *
 * KNOWN SERVER BEHAVIOUR, NOT WORKED AROUND HERE. The result endpoint stores the
 * optional fields as `homeScoreHt ? parseInt(homeScoreHt) : null`, so a genuine
 * 0–0 half time — and an attendance of 0 — is written as null and will keep
 * showing as outstanding. That is a backend truthiness bug; fixing it belongs in
 * fixtures.controller, not in a form that lies about what it sent.
 */
const toOptionalInt = (raw: string): number | null => {
  const trimmed = String(raw ?? '').trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const seedFrom = (fixture: any) => ({
  homeScore: fixture?.homeScore != null ? String(fixture.homeScore) : '',
  awayScore: fixture?.awayScore != null ? String(fixture.awayScore) : '',
  homeScoreHt: fixture?.homeScoreHt != null ? String(fixture.homeScoreHt) : '',
  awayScoreHt: fixture?.awayScoreHt != null ? String(fixture.awayScoreHt) : '',
  attendance: fixture?.attendance != null ? String(fixture.attendance) : '',
});

/**
 * Signing off one match.
 *
 * WHY THIS IS NOT THE CLOCK'S FULL-TIME WHISTLE. The clock's `fulltime` ends the
 * reporting session and lets the event log speak for the score. This calls
 * POST /fixtures/:id/result, and the server responds by running
 * completeFixture(..., { recount: false }) — it stops recomputing the score from
 * the events at that point. So this is the reporter signing off on the OFFICIAL
 * line: after it, the number on this form is the number the league carries, and
 * a goal added or undone later will not quietly move it.
 *
 * The form offers exactly the fields POST /fixtures/:id/result accepts —
 * homeScore, awayScore, homeScoreHt, awayScoreHt, attendance, status — and
 * nothing else. Statistics have their own endpoint and their own tab, and this
 * page links to it rather than growing a second copy of that form.
 */
const SignOffModal = ({ fixture, onClose }: { fixture: any; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  // The list row carries every scalar this form edits, but not `stats` — so the
  // full fixture is fetched to answer the statistics half of the checklist.
  const { data: match, isLoading, isError, refetch } = useQuery({
    queryKey: ['reporter-match', fixture.id],
    queryFn: () => getMatch(fixture.id),
  });

  // Seeded once, from the fetched fixture rather than the list row, and only
  // after it lands — so there is no window in which a reporter types into a form
  // that is about to be overwritten by a slower response.
  const [form, setForm] = useState<ReturnType<typeof seedFrom> | null>(null);
  useEffect(() => {
    if (match && !form) setForm(seedFrom(match));
  }, [match, form]);

  const set = (key: string) => (e: any) => setForm((f) => ({ ...(f as any), [key]: e.target.value }));

  // The server's validator requires both full-time scores; everything else is
  // genuinely optional. Blocking here means the reporter is told before the
  // round trip rather than by a 400.
  const fullTimeMissing =
    !!form && (toOptionalInt(form.homeScore) === null || toOptionalInt(form.awayScore) === null);

  const mutation = useMutation({
    mutationFn: () =>
      saveResult(fixture.id, {
        homeScore: toOptionalInt(form!.homeScore) as number,
        awayScore: toOptionalInt(form!.awayScore) as number,
        homeScoreHt: toOptionalInt(form!.homeScoreHt),
        awayScoreHt: toOptionalInt(form!.awayScoreHt),
        attendance: toOptionalInt(form!.attendance),
        // Send back the status the fixture already carries. The endpoint defaults
        // an omitted status to COMPLETED, which would silently turn an abandoned
        // or postponed match into a played one the moment a reporter tidied up
        // its attendance figure.
        status: match?.status || fixture.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reporter-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['reporter-match', fixture.id] });
      // The live console holds the same fixture under its own key; a result saved
      // here must not leave that screen showing the old one.
      queryClient.invalidateQueries({ queryKey: ['match-details', fixture.id] });
      pushToast('Result saved.', 'success');
      onClose();
    },
    onError: (e: any) => pushToast(e.response?.data?.message || 'Could not save the result.'),
  });

  const closeout = closeoutSummary(match);
  const when = fixture?.matchDate ? format(new Date(fixture.matchDate), 'EEE d MMM yyyy') : null;
  const competition = fixture?.competition?.name || fixture?.league?.name || null;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Sign off ${matchTitle(fixture)}`}
      description={[when, competition].filter(Boolean).join(' · ') || undefined}
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!form || fullTimeMissing}
          >
            Save result
          </Button>
        </div>
      }
    >
      {isLoading || !form ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load this match"
          hint="The result form needs the match first. Check your connection and try again."
          onRetry={refetch}
        />
      ) : (
        <div className="space-y-6">
          {/* What is still outstanding — the full checklist, statistics included,
              because here the whole fixture is in hand. */}
          <section>
            <h3 className="text-sm font-semibold text-primary">Still needed</h3>
            <ul className="mt-2 space-y-2">
              {closeout.items.map((item: any) => (
                <li key={item.key} className="flex items-center gap-2">
                  {item.done ? (
                    <CheckCircle2 size={15} className="shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <AlertTriangle size={15} className="shrink-0 text-live" aria-hidden="true" />
                  )}
                  <span className={cn('text-sm', item.done ? 'text-tertiary' : 'text-primary')}>
                    {item.label}
                  </span>
                  {/* Statistics are a different endpoint and a different form.
                      This page points at it rather than duplicating it. */}
                  {item.key === 'stats' && !item.done && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={BarChart3}
                      to={`/reporter/match/${fixture.id}`}
                      className="ml-auto"
                    >
                      Stats tab
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-primary">Full time</h3>
            <p className="mt-0.5 text-xs text-tertiary">
              Saved here, this is the official score. The server stops recounting the events once it
              is in.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field
                label={teamName(match?.homeTeam || fixture?.homeTeam)}
                required
                error={fullTimeMissing && form.homeScore.trim() === '' ? 'Required' : undefined}
              >
                {(p: any) => (
                  <Input
                    {...p}
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={form.homeScore}
                    onChange={set('homeScore')}
                    className="tabular-nums"
                  />
                )}
              </Field>
              <Field
                label={teamName(match?.awayTeam || fixture?.awayTeam)}
                required
                error={fullTimeMissing && form.awayScore.trim() === '' ? 'Required' : undefined}
              >
                {(p: any) => (
                  <Input
                    {...p}
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={form.awayScore}
                    onChange={set('awayScore')}
                    className="tabular-nums"
                  />
                )}
              </Field>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-primary">Half time</h3>
            <p className="mt-0.5 text-xs text-tertiary">Optional. Leave blank if you did not record it.</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label={teamName(match?.homeTeam || fixture?.homeTeam)}>
                {(p: any) => (
                  <Input
                    {...p}
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={form.homeScoreHt}
                    onChange={set('homeScoreHt')}
                    className="tabular-nums"
                  />
                )}
              </Field>
              <Field label={teamName(match?.awayTeam || fixture?.awayTeam)}>
                {(p: any) => (
                  <Input
                    {...p}
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={form.awayScoreHt}
                    onChange={set('awayScoreHt')}
                    className="tabular-nums"
                  />
                )}
              </Field>
            </div>
          </section>

          <Field label="Attendance" hint="People through the gate. Optional.">
            {(p: any) => (
              <Input
                {...p}
                type="number"
                min="0"
                inputMode="numeric"
                value={form.attendance}
                onChange={set('attendance')}
                className="tabular-nums"
              />
            )}
          </Field>
        </div>
      )}
    </Modal>
  );
};

/* ── the page ────────────────────────────────────────────────────────────── */

const ReporterResultsPage = () => {
  const { closed, completed, isLoading, isError, refetch } = useReporterFixtures();
  const [signOff, setSignOff] = useState<any>(null);

  // useReporterFixtures already sorts `closed` byNewest — the archive reads from
  // the last whistle backwards, which is the order a reporter remembers in.
  const rows = closed || [];

  /**
   * The tiles count COMPLETED matches only, and only the paperwork the list
   * genuinely holds (see listOutstanding). "Fully signed off" therefore means
   * "score, half-time score and attendance are in" — statistics stay unknown
   * until a match is opened, and the tile does not pretend otherwise.
   */
  const tally = useMemo(() => {
    const done = (completed || []).filter((f: any) => listOutstanding(f).length === 0).length;
    return { total: (completed || []).length, done, attention: (completed || []).length - done };
  }, [completed]);

  return (
    <div>
      <PageHeader title="Results" subtitle="Matches you have reported, and what each one still needs" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {isLoading ? (
          <>
            <StatCard.Skeleton />
            <StatCard.Skeleton />
            <StatCard.Skeleton />
          </>
        ) : (
          <>
            <StatCard icon={ClipboardCheck} value={tally.total} label="Completed" />
            <StatCard
              icon={CheckCircle2}
              value={tally.done}
              label="Fully signed off"
              tone="brand"
              hint="Score, half-time score and attendance"
            />
            <StatCard
              icon={AlertTriangle}
              value={tally.attention}
              label="Needing attention"
              tone={tally.attention > 0 ? 'warn' : 'default'}
              hint="Statistics are checked when you open a match"
              // Deliberately plain tiles, not links: there is no filtered view
              // behind them yet, and a tile that navigates nowhere is worse than
              // one that does not offer.
            />
          </>
        )}
      </div>

      {isLoading ? (
        <SkeletonList count={5} className="space-y-2">
          <div className="flex items-center gap-3 rounded-card border border-hairline bg-surface p-4">
            <Skeleton className="h-9 w-9" circle />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        </SkeletonList>
      ) : isError ? (
        <Panel>
          <ErrorState
            title="Could not load your matches"
            hint="Check your connection and try again."
            onRetry={refetch}
          />
        </Panel>
      ) : rows.length === 0 ? (
        <Panel>
          <EmptyState
            icon={ClipboardCheck}
            title="Nothing reported yet"
            hint="Matches you finish appear here."
          />
        </Panel>
      ) : (
        <>
          {/* Phone: cards. The row itself opens the match console — that is where
              statistics and the feed live — and the sign-off dialog sits beside it
              as its own 44px control, because a button nested inside a link is
              neither valid markup nor reachable with a keyboard. */}
          <ul className="space-y-2 md:hidden">
            {rows.map((f: any) => {
              const missing = listOutstanding(f);
              return (
                <li key={f.id} className="flex items-stretch gap-2">
                  <MatchRow
                    fixture={f}
                    to={`/reporter/match/${f.id}`}
                    className="min-w-0 flex-1"
                    trailing={<ScoreTag fixture={f} />}
                    meta={
                      f.status === 'COMPLETED' ? (
                        <OutstandingChips items={missing} />
                      ) : (
                        <StatusPill status={f.status} />
                      )
                    }
                  />
                  <IconButton
                    icon={ClipboardCheck}
                    variant="secondary"
                    label={`Sign off ${matchTitle(f)}`}
                    onClick={() => setSignOff(f)}
                    className="h-auto self-stretch"
                  />
                </li>
              );
            })}
          </ul>

          {/* Pointer: the same list as a table. Wide, so it scrolls inside
              TableWrap and never takes the page sideways with it. */}
          <Panel flush className="hidden md:block">
            <TableWrap>
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr>
                    <Th>Match</Th>
                    <Th>Date</Th>
                    <Th align="right">Score</Th>
                    <Th>Competition</Th>
                    <Th>Outstanding</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f: any) => {
                    const missing = listOutstanding(f);
                    return (
                      <tr
                        key={f.id}
                        onClick={() => setSignOff(f)}
                        className="cursor-pointer transition-colors duration-150 ease-standard hover:bg-surface-2"
                      >
                        <Td className="font-medium text-primary">
                          {teamName(f.homeTeam)} <span className="font-normal text-tertiary">v</span>{' '}
                          {teamName(f.awayTeam)}
                        </Td>
                        <Td className="tabular-nums">
                          {f.matchDate ? format(new Date(f.matchDate), 'd MMM yyyy') : '—'}
                        </Td>
                        <Td align="right" className="font-semibold text-primary">
                          {hasScore(f) ? `${f.homeScore}–${f.awayScore}` : '—'}
                        </Td>
                        <Td>{f.competition?.name || f.league?.name || '—'}</Td>
                        <Td>
                          {f.status === 'COMPLETED' ? (
                            <OutstandingChips items={missing} />
                          ) : (
                            <StatusPill status={f.status} />
                          )}
                        </Td>
                        <Td align="right">
                          {/* The row click is a convenience for a pointer; these
                              are the affordances a keyboard and a screen reader
                              actually get. */}
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e: any) => {
                                e.stopPropagation();
                                setSignOff(f);
                              }}
                            >
                              Sign off
                            </Button>
                            <IconButton
                              icon={ExternalLink}
                              size="sm"
                              variant="ghost"
                              label={`Open ${matchTitle(f)} in the console`}
                              to={`/reporter/match/${f.id}`}
                              onClick={(e: any) => e.stopPropagation()}
                            />
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          </Panel>
        </>
      )}

      {/* Keyed on the fixture so switching matches remounts the form rather than
          carrying one match's scores into another's. */}
      {signOff && (
        <SignOffModal key={signOff.id} fixture={signOff} onClose={() => setSignOff(null)} />
      )}
    </div>
  );
};

export default ReporterResultsPage;
