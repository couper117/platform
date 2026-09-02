import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUmugandaDays } from '../../api/endpoints/umuganda';
import { dayKey, kigaliDayKey } from '../../utils/umuganda';

/**
 * Look up whether a given instant lands on an Umuganda day, without a round trip
 * per keystroke.
 *
 * Loads the next 12 months once (they change rarely, so a long staleTime is
 * right) and indexes them by Kigali day key. The server still re-checks on save
 * — this exists purely so the admin sees the warning while they are picking the
 * date, not after they submit.
 */
export const useUmugandaLookup = (months = 12) => {
  const { data } = useQuery({
    queryKey: ['umuganda', 'lookup', months],
    queryFn: () => getUmugandaDays({ months }),
    staleTime: 10 * 60_000,
  });

  const index = useMemo(() => {
    const m = new Map<string, any>();
    for (const d of data?.data?.days || []) {
      if (String(d.status).toUpperCase() === 'DISABLED') continue;
      m.set(dayKey(d.date), d);
    }
    return m;
  }, [data]);

  return useMemo(
    () => ({
      /** The UmugandaDay this instant falls on, or null. */
      lookup: (instant: any) => {
        const key = kigaliDayKey(instant);
        return key ? index.get(key) || null : null;
      },
      count: index.size,
    }),
    [index]
  );
};

export default useUmugandaLookup;
