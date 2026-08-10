const pusher = require('../config/pusher');

// Fire-and-forget: a real-time push must never crash the request or the
// process. Swallow rejections (Pusher returns a rejected promise on any API
// error) and no-op when Pusher isn't configured.
const safeTrigger = (channel, event, data) => {
  if (!pusher) return;
  Promise.resolve(pusher.trigger(channel, event, data)).catch((err) => {
    console.warn(`[realtime] Pusher trigger failed (${event}): ${err.message}`);
  });
};

const emitMatchUpdate = (fixtureId, data) => {
  safeTrigger(`fixture-${fixtureId}`, 'matchUpdate', data);
  // Also emit global live update for ticker
  safeTrigger('live-scores', 'liveUpdate', { fixtureId, ...data });
};

const emitMatchEvent = (fixtureId, event) => {
  safeTrigger(`fixture-${fixtureId}`, 'matchEvent', event);
};

module.exports = { emitMatchUpdate, emitMatchEvent };
