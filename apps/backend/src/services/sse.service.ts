/**
 * Server-Sent Events hub — a zero-dependency real-time transport.
 *
 * Pusher (realtime.service) is the production push channel, but it no-ops without
 * hosted keys. SSE gives the same push over plain HTTP with nothing to configure,
 * so live scores work on a laptop with no external service. Both run side by side:
 * realtime.service fans every emit out to Pusher AND to the SSE subscribers here.
 *
 * In-memory registry of open response streams, keyed by channel
 * (`fixture-<id>` and the global `live-scores`). A single Node process backs the
 * dev/demo deployment, so a process-local map is exactly right; a multi-instance
 * deployment would lean on Pusher instead.
 */
const channels = new Map(); // channel -> Set<res>

const addClient = (channel, res) => {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel).add(res);
};

const removeClient = (channel, res) => {
  const set = channels.get(channel);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) channels.delete(channel);
};

const publish = (channel, event, data) => {
  const set = channels.get(channel);
  if (!set || set.size === 0) return;
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try {
      res.write(frame);
    } catch {
      /* a dead socket is cleaned up on its own 'close' handler */
    }
  }
};

module.exports = { addClient, removeClient, publish };
