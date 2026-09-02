/**
 * The serverless entry point.
 *
 * Vercel never runs server.ts — it imports a handler and invokes it per request,
 * so everything server.ts does at boot simply did not happen in production: the
 * data-residency check, the competition rule seeding and the Umuganda calendar.
 * The residency check is the one that matters most, because it exists to refuse a
 * deployment that stores children's data outside Rwanda without the certificate
 * art. 50 requires — and Vercel is outside Rwanda. The guard was bypassed on
 * precisely the platform it was written for.
 *
 * The work runs once per cold start, not once per request, and never blocks the
 * response: a serverless function that awaits a calendar rebuild before its first
 * reply is a function that times out.
 */

const app = require('../src/app');
const env = require('../src/config/env');
const { checkResidencyAtStartup } = require('../src/services/dataResidency.service');
const { ensureRuleSettings } = require('../src/services/eligibility.service');

/**
 * Refusing to serve, rather than exiting.
 *
 * `process.exit(1)` is right for a long-running server — it fails to start and
 * somebody notices. In a serverless function it kills one invocation and the
 * next request starts a fresh one, so the platform would keep serving while
 * appearing to crash at random. Holding the verdict and answering every request
 * with it is both honest and impossible to miss.
 */
const residency = checkResidencyAtStartup(env, { exit: false });
const blocked = residency.level === 'block';

let warmed = false;
const warmUp = () => {
  if (warmed) return;
  warmed = true;
  // Fire and forget — the first request must not wait for it, and a failure here
  // is a degraded deployment rather than a broken one.
  ensureRuleSettings().catch((e) => console.log(`Rule seed skipped: ${e.message}`));
};

module.exports = (req: any, res: any) => {
  if (blocked) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      message: 'This deployment stores personal data outside Rwanda without a declared NCSA certificate, '
        + 'which Law N° 058/2021 arts. 48-50 does not permit. Set DATA_RESIDENCY and '
        + 'NCSA_REGISTRATION_NUMBER, or host in Rwanda. See docs/DATA_PROTECTION.md §6.1.',
      residency: residency.messages,
    }));
  }
  warmUp();
  return app(req, res);
};
