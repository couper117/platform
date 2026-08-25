const app = require('./src/app');
const env = require('./src/config/env');
const { ensureRuleSettings } = require('./src/services/eligibility.service');
const { checkResidencyAtStartup } = require('./src/services/dataResidency.service');

// Refuse to run a production deployment that stores personal data outside Rwanda
// without the NCSA certificate art. 50 requires. Runs before the port is bound.
checkResidencyAtStartup(env);

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 RNSP API running in ${env.NODE_ENV} mode on http://localhost:${PORT}`);
  // Seed configurable competition rules if missing (idempotent).
  ensureRuleSettings().catch((e) => console.log(`Rule seed skipped: ${e.message}`));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
