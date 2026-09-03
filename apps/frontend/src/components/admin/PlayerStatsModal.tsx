import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { Modal, Button, Input, Field, Select, Skeleton } from '../ui';

/**
 * Recording a player's season.
 *
 * THE FIELDS COME FROM THE SERVER, NOT FROM HERE. `GET /players/:id/stats` returns
 * the stat spec for that player's sport alongside the saved seasons, so a
 * basketball player is asked for points, rebounds and assists and a footballer for
 * goals, appearances and cards — and adding a stat to the spec makes it enterable
 * here without touching this file. A second copy of that table in the frontend
 * would have drifted the first time a sport gained a column.
 *
 * A BLANK FIELD MEANS "NOT RECORDED", NOT ZERO. The two are different claims: zero
 * says a player took the floor and scored none, blank says nobody has counted. The
 * server drops blanks, and the profile omits the row entirely rather than printing
 * a nought — so clearing a field here removes the stat, and clearing them all
 * deletes the season.
 */

/** Sensible default when a club has no season recorded yet. */
const currentSeason = () => {
  const now = new Date();
  // A season that starts in the second half of the year spans two: Sep 2026 is
  // "2026/2027", March 2026 is "2025/2026".
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}/${start + 1}`;
};

const PlayerStatsModal = ({
  player,
  open,
  onClose,
}: {
  player: any;
  open: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [season, setSeason] = useState(currentSeason());
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['player-stats', player?.id],
    enabled: open && !!player?.id,
    queryFn: async () => (await apiClient.get(`/players/${player.id}/stats`)).data.data,
  });

  const spec = data?.spec ?? [];
  const seasons = data?.seasons ?? [];

  // Seasons already on file, plus the current one so a first entry is possible.
  const options = useMemo(() => {
    const known = seasons.map((s: any) => s.season);
    return [...new Set([...known, currentSeason()])].sort().reverse();
  }, [seasons]);

  // Load whichever season is selected into the form.
  useEffect(() => {
    if (!open) return;
    const row = seasons.find((s: any) => s.season === season);
    const stats = row?.stats ?? {};
    setValues(Object.fromEntries(spec.map((f: any) => [f.key, stats[f.key] ?? ''])));
  }, [open, season, data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Default to the most recent recorded season once the data arrives.
  useEffect(() => {
    if (open && seasons.length > 0) setSeason(seasons[0].season);
  }, [open, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async () => {
      const { data: res } = await apiClient.put(`/players/${player.id}/stats`, { season, stats: values });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-stats', player.id] });
      // The public profile reads these through GET /players/:id.
      queryClient.invalidateQueries({ queryKey: ['player', String(player.id)] });
      onClose();
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Could not save these figures'),
  });

  if (!player) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${player.fullName} — season statistics`}
      description="Recorded figures appear on the public profile. Leave a field blank if it has not been counted."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={save.isPending} onClick={() => { setError(''); save.mutate(); }}>
            Save season
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Field renders through a function child so it can wire htmlFor,
              aria-describedby and aria-invalid into whichever control it is given. */}
          <Field label="Season">
            {(p: any) => (
              <Select
                {...p}
                value={season}
                onChange={(e: any) => setSeason(e.target.value)}
                options={options.map((s: string) => ({ value: s, label: s }))}
                size="md"
              />
            )}
          </Field>

          {spec.length === 0 ? (
            <p className="text-sm text-tertiary">
              No statistics are defined for this sport yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {spec.map((f: any) => (
                <Field key={f.key} label={t(`player.stat.${f.label}`)}>
                  {(p: any) => (
                    <Input
                      {...p}
                      type="number"
                      inputMode="decimal"
                      step={f.decimal ? '0.1' : '1'}
                      min="0"
                      value={values[f.key] ?? ''}
                      onChange={(e: any) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  )}
                </Field>
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-control bg-danger/10 px-3 py-2 text-sm text-danger-text">{error}</p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default PlayerStatsModal;
