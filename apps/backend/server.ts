const app = require('./src/app');
const env = require('./src/config/env');
const { ensureRuleSettings } = require('./src/services/eligibility.service');

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 RNSP API running in ${env.NODE_ENV} mode on http://localhost:${PORT}`);
  // Seed configurable competition rules if missing (idempotent).
  ensureRuleSettings().catch((e) => console.log(`Rule seed skipped: ${e.message}`));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
