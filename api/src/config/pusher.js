const Pusher = require('pusher');
const env = require('./env');

// Only construct a real Pusher client when all credentials are present.
// When they're missing (e.g. local dev), export null so the realtime layer
// safely no-ops instead of throwing at require time.
const isConfigured = Boolean(
  env.PUSHER_APP_ID && env.PUSHER_KEY && env.PUSHER_SECRET && env.PUSHER_CLUSTER
);

const pusher = isConfigured
  ? new Pusher({
      appId: env.PUSHER_APP_ID,
      key: env.PUSHER_KEY,
      secret: env.PUSHER_SECRET,
      cluster: env.PUSHER_CLUSTER,
      useTLS: true,
    })
  : null;

if (!isConfigured) {
  console.warn('[pusher] credentials not configured — real-time events disabled.');
}

module.exports = pusher;
