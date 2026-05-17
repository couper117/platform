const pusher = require('../config/pusher');

const emitMatchUpdate = (fixtureId, data) => {
  pusher.trigger(`fixture-${fixtureId}`, 'matchUpdate', data);
  // Also emit global live update for ticker
  pusher.trigger('live-scores', 'liveUpdate', { fixtureId, ...data });
};

const emitMatchEvent = (fixtureId, event) => {
  pusher.trigger(`fixture-${fixtureId}`, 'matchEvent', event);
};

module.exports = { emitMatchUpdate, emitMatchEvent };
