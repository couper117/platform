const pusher = require('../config/pusher');
const sse = require('./sse.service');

// Fire-and-forget: a real-time push must never crash the request or the
// process. Swallow rejections (Pusher returns a rejected promise on any API
// error) and no-op when Pusher isn't configured.
const safeTrigger = (channel, event, data) => {
  if (!pusher) return;
  Promise.resolve(pusher.trigger(channel, event, data)).catch((err) => {
    console.warn(`[realtime] Pusher trigger failed (${event}): ${err.message}`);
  });
};

// Every emit fans out to BOTH transports: Pusher (production) and the in-process
// SSE hub (works with zero configuration locally). Consumers pick one.
const emitMatchUpdate = (fixtureId, data) => {
  safeTrigger(`fixture-${fixtureId}`, 'matchUpdate', data);
  // Also emit global live update for ticker
  safeTrigger('live-scores', 'liveUpdate', { fixtureId, ...data });
  sse.publish(`fixture-${fixtureId}`, 'matchUpdate', data);
  sse.publish('live-scores', 'liveUpdate', { fixtureId, ...data });
};

const emitMatchEvent = (fixtureId, event) => {
  safeTrigger(`fixture-${fixtureId}`, 'matchEvent', event);
  sse.publish(`fixture-${fixtureId}`, 'matchEvent', event);
};

// Per-team match statistics (possession, shots, xG…). Only per-match
// subscribers care, so this stays off the global ticker. Payload:
// { teamId, stat } where `stat` is the full MatchStat row.
const emitMatchStats = (fixtureId, data) => {
  safeTrigger(`fixture-${fixtureId}`, 'matchStats', data);
  sse.publish(`fixture-${fixtureId}`, 'matchStats', data);
};

module.exports = { emitMatchUpdate, emitMatchEvent, emitMatchStats };
