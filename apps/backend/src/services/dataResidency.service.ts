/**
 * Where this deployment stores personal data, and whether it is allowed to.
 *
 * Law N° 058/2021:
 *   Art. 50  Personal data may be stored outside Rwanda only where the controller
 *            or processor holds a valid registration certificate from the
 *            supervisory authority (NCSA).
 *   Art. 48  A transfer outside Rwanda needs authorisation, the data subject's
 *            consent, or one of the listed grounds.
 *   Art. 49  Transfers must be governed by a written contract.
 *
 * The platform used to have no idea where its database was. `.env.example`
 * pointed production at Supabase `eu-central-1` — Frankfurt — and nothing in the
 * code noticed. This makes the answer explicit and checkable: the operator has to
 * declare the residency, and if they declare offshore they have to name the
 * certificate that permits it.
 *
 * A configuration check cannot make an offshore deployment lawful. What it can do
 * is stop one happening silently.
 */

// Hosts that are definitely not in Rwanda. Not exhaustive — it does not need to
// be, because an undeclared host is treated as unverified either way. These
// simply catch the common case of a copy-pasted connection string.
const KNOWN_OFFSHORE = [
  { pattern: /\.pooler\.supabase\.com$/i, name: 'Supabase' },
  { pattern: /\.supabase\.co$/i, name: 'Supabase' },
  { pattern: /\.rds\.amazonaws\.com$/i, name: 'AWS RDS' },
  { pattern: /\.neon\.tech$/i, name: 'Neon' },
  { pattern: /\.render\.com$/i, name: 'Render' },
  { pattern: /\.azure\.com$/i, name: 'Azure' },
  { pattern: /\.googleapis\.com$/i, name: 'Google Cloud' },
];

type Level = 'ok' | 'warn' | 'block';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'host.docker.internal', 'db', 'postgres'];

/** Region hints some providers put in the hostname, e.g. aws-0-eu-central-1... */
const regionHint = (host: string) => {
  const m = host.match(/\b((?:af|ap|ca|eu|il|me|sa|us)-[a-z]+-\d)\b/i);
  return m ? m[1] : null;
};

const hostOf = (url: any) => {
  try {
    return new URL(String(url)).hostname;
  } catch {
    return '';
  }
};

/**
 * Classify where the database lives, from the connection string alone.
 * Returns { host, placement: 'local' | 'offshore' | 'unverified', provider, region }.
 */
const classifyDatabase = (databaseUrl: any) => {
  const host = hostOf(databaseUrl);
  if (!host) return { host: '', placement: 'unverified' as const, provider: null, region: null };

  if (LOCAL_HOSTS.includes(host)) {
    return { host, placement: 'local' as const, provider: null, region: null };
  }

  const known = KNOWN_OFFSHORE.find((k) => k.pattern.test(host));
  if (known) {
    return { host, placement: 'offshore' as const, provider: known.name, region: regionHint(host) };
  }

  // A .rw host is a reasonable signal, but not proof — still only "unverified".
  return { host, placement: 'unverified' as const, provider: null, region: regionHint(host) };
};

/**
 * Assess the deployment against arts. 48–50.
 *
 * `declared` is what the operator asserts (DATA_RESIDENCY), `certificate` is the
 * NCSA registration number that permits offshore storage.
 *
 * Returns { ok, level, messages } where level is 'ok' | 'warn' | 'block'.
 * 'block' means the deployment should not run in production.
 */
const assessResidency = ({ databaseUrl, declared, certificate, nodeEnv }: any) => {
  const db = classifyDatabase(databaseUrl);
  const messages: string[] = [];
  const production = nodeEnv === 'production';
  const residency = String(declared || '').trim().toLowerCase();
  const cert = String(certificate || '').trim();

  // Local development is never a residency question.
  if (db.placement === 'local') {
    return { ok: true, level: 'ok' as const, db, messages: [] };
  }

  // Severity only ever climbs: ok → warn → block. Returned rather than mutated in
  // place so the type stays honest to the compiler.
  const RANK: Record<Level, number> = { ok: 0, warn: 1, block: 2 };
  const raise = (current: Level, next: Level): Level => (RANK[next] > RANK[current] ? next : current);
  let level: Level = 'ok';

  const where = `${db.provider ? `${db.provider} ` : ''}${db.host}${db.region ? ` (region ${db.region})` : ''}`;

  if (!residency) {
    messages.push(
      `DATA_RESIDENCY is not set, but the database is remote: ${where}. `
      + 'Law N° 058/2021 art. 50 requires a valid NCSA registration certificate to store personal data outside Rwanda. '
      + 'Set DATA_RESIDENCY=rwanda or DATA_RESIDENCY=offshore.'
    );
    level = raise(level, production ? 'block' : 'warn');
    return { ok: level !== 'block', level, db, messages };
  }

  if (residency === 'offshore') {
    if (!cert) {
      messages.push(
        `DATA_RESIDENCY=offshore but NCSA_REGISTRATION_NUMBER is empty. `
        + `Art. 50 permits storing personal data outside Rwanda only under a valid registration certificate. `
        + `Database: ${where}.`
      );
      level = raise(level, production ? 'block' : 'warn');
    } else {
      messages.push(
        `Personal data is stored outside Rwanda (${where}) under NCSA registration ${cert}. `
        + 'Art. 49 also requires a written contract with each processor — see docs/DATA_PROTECTION.md.'
      );
      level = raise(level, 'warn');
    }
    return { ok: level !== 'block', level, db, messages };
  }

  if (residency === 'rwanda') {
    if (db.placement === 'offshore') {
      messages.push(
        `DATA_RESIDENCY=rwanda contradicts the configured database: ${where} is not in Rwanda. `
        + 'Either host in Rwanda, or set DATA_RESIDENCY=offshore and supply NCSA_REGISTRATION_NUMBER (art. 50).'
      );
      level = raise(level, production ? 'block' : 'warn');
    } else {
      messages.push(
        `DATA_RESIDENCY=rwanda declared for remote host ${where}. `
        + 'Confirm with the hosting provider that the data actually resides in Rwanda — this cannot be verified from the connection string.'
      );
      level = raise(level, 'warn');
    }
    return { ok: level !== 'block', level, db, messages };
  }

  messages.push(`DATA_RESIDENCY="${declared}" is not recognised. Use "rwanda" or "offshore".`);
  level = raise(level, production ? 'block' : 'warn');
  return { ok: level !== 'block', level, db, messages };
};

/**
 * Run the check at boot and report it. In production a 'block' result stops the
 * process: storing children's data offshore without the certificate the law
 * requires is not something to start up and hope nobody notices.
 */
const checkResidencyAtStartup = (env: any, { exit = true } = {}) => {
  const result = assessResidency({
    databaseUrl: env.DATABASE_URL,
    declared: env.DATA_RESIDENCY,
    certificate: env.NCSA_REGISTRATION_NUMBER,
    nodeEnv: env.NODE_ENV,
  });

  for (const message of result.messages) {
    console[result.level === 'block' ? 'error' : 'warn'](
      `${result.level === 'block' ? 'Data residency — REFUSING TO START' : 'Data residency'}: ${message}`
    );
  }

  if (result.level === 'block' && exit) {
    console.error('See docs/DATA_PROTECTION.md §6.1. Set DATA_RESIDENCY and NCSA_REGISTRATION_NUMBER, or host in Rwanda.');
    process.exit(1);
  }

  return result;
};

module.exports = { classifyDatabase, assessResidency, checkResidencyAtStartup, KNOWN_OFFSHORE };
