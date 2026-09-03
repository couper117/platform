/**
 * Where the assistant's configuration lives, and what each audience is allowed
 * to see of it.
 *
 * STORED IN `Setting`, NOT IN A NEW TABLE. The platform already has a settings
 * store with an admin capability guarding writes and an activity log recording
 * them; a parallel `AiConfig` table would have meant a migration, a second
 * audit path and a second thing to back up, to hold eleven rows.
 *
 * EVERY ai.* ROW IS PRIVATE (`isPublic: false`). The public `GET /settings`
 * endpoint returns whole rows by that flag, so a public row here would put the
 * model name and persona on an unauthenticated endpoint by accident. What the
 * chat widget legitimately needs — is it on, what should it greet with — is
 * hand-picked by `publicConfig()` and served from `GET /ai/status`, so the list
 * of things visitors can see is written down in one place rather than implied by
 * a boolean column.
 *
 * ── The three views ──
 *   serverConfig()  the real thing, decrypted API key included. Never leaves
 *                   the process — only chat.service.ts calls it.
 *   adminConfig()   what the console renders: settings, plus per-provider key
 *                   *status* (configured / where from / last four characters).
 *   publicConfig()  what a visitor's browser gets: on/off, name, greeting,
 *                   suggested questions. No provider, no model, no key.
 */

const prisma = require('../../config/db');
const env = require('../../config/env');
const { encryptSecret, decryptSecret, maskSecret } = require('./secrets');
const { PROVIDERS, DEFAULT_PROVIDER, isKnownProvider, getProvider } = require('./providers');

const KEY_PREFIX = 'ai.';
const API_KEY_PREFIX = 'ai.apiKey.';

/**
 * Gemini is the default because it is what the platform is provisioned with,
 * and because its free tier is the one that survives a Rwandan public-sector
 * budget cycle. Everything else here is chosen for a support assistant that
 * quotes records back to people: low temperature, short answers.
 */
const DEFAULTS = {
  enabled: true,
  provider: DEFAULT_PROVIDER,
  model: '',                 // empty = the provider's own default
  baseUrl: '',               // self-hosted providers only
  temperature: 0.3,          // it reads out records; invention is the failure mode
  // Measured, not guessed: "which matches are live?" against real seeded data
  // returned ten fixtures and was cut off mid-link at 900. A reasoning model
  // also spends 200-300 of this allowance thinking before it writes, so the
  // usable output is well under the number shown. 1400 clears a full list.
  maxTokens: 1400,
  historyDepth: 8,           // turns of conversation carried into each request
  assistantName: 'RwaSport Assistant',
  greeting:
    "Hello! I'm the **RwaSport Assistant**. Ask me about sports, clubs, athletes, fixtures, results, standings, school competitions or how to use this platform.",
  suggestions: [
    'What matches are coming up?',
    'Which sports are on the platform?',
    'How does a club register?',
    'Show me the current league standings',
  ],
  persona: '',               // extra house style, appended to the system prompt
  groundingDepth: 'standard', // 'lean' | 'standard' | 'rich' — how much data to attach
};

const NUMBER_KEYS = { temperature: true, maxTokens: true, historyDepth: true };
const BOOLEAN_KEYS = { enabled: true };
const JSON_KEYS = { suggestions: true };

const LABELS = {
  enabled: 'AI assistant enabled',
  provider: 'AI provider',
  model: 'AI model',
  baseUrl: 'AI provider base URL',
  temperature: 'AI temperature',
  maxTokens: 'AI maximum reply length',
  historyDepth: 'AI conversation memory (turns)',
  assistantName: 'AI assistant name',
  greeting: 'AI greeting message',
  suggestions: 'AI suggested questions',
  persona: 'AI house style',
  groundingDepth: 'AI grounding depth',
};

// ── Reading ─────────────────────────────────────────────────────────────────

const parseValue = (key, raw) => {
  if (raw === null || raw === undefined) return DEFAULTS[key];
  if (BOOLEAN_KEYS[key]) return raw === 'true' || raw === '1';
  if (NUMBER_KEYS[key]) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : DEFAULTS[key];
  }
  if (JSON_KEYS[key]) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : DEFAULTS[key];
    } catch {
      return DEFAULTS[key];
    }
  }
  return raw;
};

/** Every ai.* row, as a plain `{ skey: sval }` map. */
const readRows = async () => {
  const rows = await prisma.setting.findMany({ where: { skey: { startsWith: KEY_PREFIX } } });
  return Object.fromEntries(rows.map((r) => [r.skey, r.sval]));
};

/**
 * Where this provider's key comes from, in the order the platform trusts them.
 *
 * The database wins over the environment, because an administrator who typed a
 * new key into the console has made a deliberate, later decision than whoever
 * set the deployment variable — and if that were not true, changing a key would
 * appear to work and silently do nothing.
 */
const resolveKey = (providerId, rows) => {
  const stored = rows[`${API_KEY_PREFIX}${providerId}`];
  const opened = stored ? decryptSecret(stored) : null;
  if (opened) return { key: opened, source: 'database' };

  const provider: any = PROVIDERS[providerId];
  const fromEnv = provider?.keyEnv ? env[provider.keyEnv] : null;
  if (fromEnv) return { key: fromEnv, source: 'environment' };

  // A row exists but would not open — a rotated JWT_SECRET, usually. Say so,
  // rather than reporting "no key configured" and sending someone to look in
  // the wrong place.
  if (stored) return { key: null, source: 'unreadable' };
  return { key: null, source: null };
};

const settingsFrom = (rows) => {
  const config: any = {};
  Object.keys(DEFAULTS).forEach((key) => {
    config[key] = parseValue(key, rows[`${KEY_PREFIX}${key}`]);
  });

  // A provider that was removed from the code must not brick the assistant.
  if (!isKnownProvider(config.provider)) config.provider = DEFAULT_PROVIDER;

  return config;
};

/**
 * The full configuration, decrypted. Server-side only — this is the one function
 * that returns a usable credential, and only chat.service.ts and the connection
 * test call it.
 */
const serverConfig = async () => {
  const rows = await readRows();
  const config = settingsFrom(rows);
  const provider: any = getProvider(config.provider);
  const { key, source } = resolveKey(config.provider, rows);

  return {
    ...config,
    model: config.model || provider.defaultModel,
    baseUrl: config.baseUrl || provider.defaultBaseUrl || null,
    apiKey: key,
    keySource: source,
    /** Whether a request could actually be made right now. */
    ready: Boolean(config.enabled && (key || !provider.requiresKey)),
  };
};

/** What the admin console renders. Settings in full; keys as status only. */
const adminConfig = async () => {
  const rows = await readRows();
  const config = settingsFrom(rows);

  const keys = Object.values(PROVIDERS).map((provider: any) => {
    const { key, source } = resolveKey(provider.id, rows);
    return {
      provider: provider.id,
      configured: Boolean(key),
      source,
      // Enough to tell two keys apart, never enough to use one.
      masked: maskSecret(key),
      // A key set in the environment cannot be cleared from the console — say so
      // in the UI rather than offering a delete button that does nothing.
      editable: source !== 'environment',
      required: provider.requiresKey,
    };
  });

  const active = keys.find((k) => k.provider === config.provider);

  return {
    ...config,
    resolvedModel: config.model || getProvider(config.provider).defaultModel,
    keys,
    ready: Boolean(config.enabled && (active?.configured || !getProvider(config.provider).requiresKey)),
  };
};

/** What an anonymous browser is allowed to know. Deliberately four fields. */
const publicConfig = async () => {
  const config = await serverConfig();
  return {
    enabled: Boolean(config.enabled),
    ready: Boolean(config.ready),
    assistantName: config.assistantName,
    greeting: config.greeting,
    suggestions: config.suggestions,
  };
};

// ── Writing ─────────────────────────────────────────────────────────────────

const serialise = (key, value) => {
  if (JSON_KEYS[key]) return JSON.stringify(Array.isArray(value) ? value : DEFAULTS[key]);
  if (BOOLEAN_KEYS[key]) return value ? 'true' : 'false';
  return String(value);
};

const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/**
 * Validate a patch before it is stored.
 *
 * Bounds are enforced here and not only in the browser: `maxTokens: 900000` is a
 * bill, not a typo, and `temperature: 9` produces an assistant that invents
 * fixtures — which is the one thing this feature must never do.
 */
const sanitise = (patch) => {
  const clean: any = {};

  if (patch.enabled !== undefined) clean.enabled = Boolean(patch.enabled);

  if (patch.provider !== undefined) {
    if (!isKnownProvider(patch.provider)) {
      const error: any = new Error(`Unknown AI provider "${patch.provider}".`);
      error.statusCode = 400;
      throw error;
    }
    clean.provider = patch.provider;
  }

  if (patch.model !== undefined) clean.model = String(patch.model || '').trim().slice(0, 120);
  if (patch.baseUrl !== undefined) clean.baseUrl = String(patch.baseUrl || '').trim().slice(0, 300);
  if (patch.temperature !== undefined) clean.temperature = clamp(patch.temperature, 0, 1, DEFAULTS.temperature);
  // The floor is 400, not 200: a reasoning model spends roughly a hundred
  // tokens of this allowance thinking before it writes a word, so a budget that
  // looks like "a short answer" can produce no answer at all.
  if (patch.maxTokens !== undefined) clean.maxTokens = Math.round(clamp(patch.maxTokens, 400, 4000, DEFAULTS.maxTokens));
  if (patch.historyDepth !== undefined) clean.historyDepth = Math.round(clamp(patch.historyDepth, 0, 20, DEFAULTS.historyDepth));
  if (patch.assistantName !== undefined) clean.assistantName = String(patch.assistantName || '').trim().slice(0, 80) || DEFAULTS.assistantName;
  if (patch.greeting !== undefined) clean.greeting = String(patch.greeting || '').trim().slice(0, 800) || DEFAULTS.greeting;
  if (patch.persona !== undefined) clean.persona = String(patch.persona || '').trim().slice(0, 2000);

  if (patch.groundingDepth !== undefined) {
    clean.groundingDepth = ['lean', 'standard', 'rich'].includes(patch.groundingDepth)
      ? patch.groundingDepth
      : DEFAULTS.groundingDepth;
  }

  if (patch.suggestions !== undefined) {
    clean.suggestions = (Array.isArray(patch.suggestions) ? patch.suggestions : [])
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  return clean;
};

const upsert = (skey, sval, label) =>
  prisma.setting.upsert({
    where: { skey },
    update: { sval, label, grp: 'ai', isPublic: false },
    create: { skey, sval, label, grp: 'ai', isPublic: false },
  });

/**
 * Apply a patch. Only the fields present are touched, so the console can save
 * one section without resending the rest.
 *
 * `apiKey` is handled apart from everything else: it is sealed on the way in,
 * an empty string means "forget the stored key" (falling back to the
 * environment, if there is one), and it is never echoed back.
 */
const saveConfig = async (patch) => {
  const clean = sanitise(patch || {});

  const writes = Object.entries(clean).map(([key, value]) =>
    upsert(`${KEY_PREFIX}${key}`, serialise(key, value), LABELS[key] || key),
  );

  if (patch.apiKey !== undefined) {
    const providerId = clean.provider || settingsFrom(await readRows()).provider;
    if (!isKnownProvider(providerId)) {
      const error: any = new Error(`Unknown AI provider "${providerId}".`);
      error.statusCode = 400;
      throw error;
    }

    const raw = String(patch.apiKey || '').trim();
    const skey = `${API_KEY_PREFIX}${providerId}`;

    if (raw === '') {
      // Deleting the row rather than storing "" so resolveKey falls through to
      // the environment variable, which is the behaviour "clear this" implies.
      writes.push(prisma.setting.deleteMany({ where: { skey } }));
    } else {
      writes.push(upsert(skey, encryptSecret(raw), `API key (${providerId})`));
    }
  }

  if (writes.length) await prisma.$transaction(writes);

  return adminConfig();
};

/**
 * Record the configured model after an automatic fallback, so the next request
 * does not repeat the failed call. Written directly rather than through
 * saveConfig because it is the system correcting itself, not an admin edit.
 */
const rememberModel = async (model) => {
  try {
    await upsert(`${KEY_PREFIX}model`, String(model), LABELS.model);
  } catch (error) {
    console.warn('[ai] Could not persist the fallback model:', error?.message);
  }
};

module.exports = {
  DEFAULTS,
  API_KEY_PREFIX,
  serverConfig,
  adminConfig,
  publicConfig,
  saveConfig,
  rememberModel,
  resolveKey,
  readRows,
};
