const app = require('./src/app');
const env = require('./src/config/env');

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 RNSP API running in ${env.NODE_ENV} mode on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
