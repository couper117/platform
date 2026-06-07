import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';

/**
 * Subscribes to real-time updates for a single fixture.
 *
 * Listens on two channels for resilience against the backend's exact emit shape:
 *   - global `live-scores`  → `liveUpdate` { fixtureId, homeScore, awayScore, minute, status }
 *   - per-match `match-{id}` → `scoreUpdate` | `event` | `statusUpdate`
 *
 * Any field present in a payload is merged into live state; `event` payloads are
 * prepended to the events list. Returns null-safe defaults when Pusher is not configured.
 *
 * @param {string|number} fixtureId
 * @param {object} initial  initial fixture object from the REST API
 */
export default function useLiveMatch(fixtureId, initial) {
  const [live, setLive] = useState({
    homeScore: initial?.homeScore ?? 0,
    awayScore: initial?.awayScore ?? 0,
    minute: initial?.minute ?? initial?.liveState?.minute ?? 0,
    status: initial?.status ?? 'SCHEDULED',
    events: initial?.events ?? [],
    lastUpdate: null,
  });
  const [connected, setConnected] = useState(false);
  const seenEventIds = useRef(new Set((initial?.events || []).map((e) => e.id)));

  // Re-seed when the REST payload arrives/changes.
  useEffect(() => {
    if (!initial) return;
    seenEventIds.current = new Set((initial.events || []).map((e) => e.id));
    setLive((prev) => ({
      ...prev,
      homeScore: initial.homeScore ?? prev.homeScore ?? 0,
      awayScore: initial.awayScore ?? prev.awayScore ?? 0,
      minute: initial.minute ?? initial.liveState?.minute ?? prev.minute ?? 0,
      status: initial.status ?? prev.status,
      events: initial.events ?? prev.events,
    }));
  }, [initial]);

  useEffect(() => {
    const key = import.meta.env.VITE_PUSHER_KEY;
    if (!fixtureId || !key) return undefined;

    let pusher;
    try {
      pusher = new Pusher(key, { cluster: import.meta.env.VITE_PUSHER_CLUSTER });
    } catch {
      return undefined;
    }

    pusher.connection.bind('connected', () => setConnected(true));
    pusher.connection.bind('disconnected', () => setConnected(false));
    pusher.connection.bind('error', () => setConnected(false));

    const mergeScore = (u = {}) => {
      setLive((prev) => ({
        ...prev,
        homeScore: u.homeScore ?? prev.homeScore,
        awayScore: u.awayScore ?? prev.awayScore,
        minute: u.minute ?? prev.minute,
        status: u.status ?? prev.status,
        lastUpdate: Date.now(),
      }));
    };

    const addEvent = (evt) => {
      if (!evt) return;
      if (evt.id != null && seenEventIds.current.has(evt.id)) return;
      if (evt.id != null) seenEventIds.current.add(evt.id);
      setLive((prev) => ({
        ...prev,
        events: [evt, ...(prev.events || [])],
        minute: evt.minute ?? prev.minute,
        lastUpdate: Date.now(),
      }));
    };

    // Global ticker channel (filter to this fixture)
    const global = pusher.subscribe('live-scores');
    global.bind('liveUpdate', (u) => {
      if (String(u.fixtureId) === String(fixtureId)) mergeScore(u);
    });

    // Dedicated per-match channel
    const matchChan = pusher.subscribe(`match-${fixtureId}`);
    matchChan.bind('scoreUpdate', mergeScore);
    matchChan.bind('statusUpdate', mergeScore);
    matchChan.bind('event', addEvent);

    return () => {
      try {
        pusher.unsubscribe('live-scores');
        pusher.unsubscribe(`match-${fixtureId}`);
        pusher.disconnect();
      } catch {
        /* noop */
      }
    };
  }, [fixtureId]);

  return { live, connected };
}
