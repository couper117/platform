/**
 * Unit tests for the AI provider register — no server, no database, no network.
 * Only the pure decisions: which models count as chat models, which one replaces
 * a dead one, and whether a provider's own suggestion can be read out of its
 * error message. Run via `npm run test:unit`.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  PROVIDERS,
  DEFAULT_PROVIDER,
  listProviders,
  getProvider,
  isKnownProvider,
  isChatModel,
  pickFallbackModel,
  suggestedModelFrom,
} = require('../../src/services/ai/providers');

// ── the register ──

test('gemini is the default provider and is registered', () => {
  assert.equal(DEFAULT_PROVIDER, 'gemini');
  assert.equal(isKnownProvider('gemini'), true);
  assert.equal(getProvider('gemini').id, 'gemini');
});

test('an unknown provider is refused, not defaulted', () => {
  assert.equal(isKnownProvider('skynet'), false);
  assert.throws(() => getProvider('skynet'), /Unknown AI provider "skynet"/);
});

test('every provider can list models and chat, and declares how it is keyed', () => {
  for (const [id, provider] of Object.entries(PROVIDERS) as any) {
    assert.equal(typeof provider.listModels, 'function', `${id} cannot list models`);
    assert.equal(typeof provider.chat, 'function', `${id} cannot chat`);
    assert.equal(typeof provider.defaultModel, 'string', `${id} has no default model`);
    assert.ok(provider.defaultModel.length > 0, `${id} has an empty default model`);
    assert.equal(typeof provider.requiresKey, 'boolean', `${id} does not say whether it needs a key`);
    // A provider that needs a key must name the environment variable it reads,
    // or the deployment fallback silently does nothing.
    if (provider.requiresKey) assert.ok(provider.keyEnv, `${id} needs a key but names no env var`);
  }
});

test('the catalogue sent to the console carries no credentials', () => {
  const listed = listProviders();
  assert.equal(listed.length, Object.keys(PROVIDERS).length);
  for (const p of listed) {
    // keyEnv is the NAME of a variable, which is not a secret; a value would be.
    assert.equal('apiKey' in p, false);
    assert.equal('key' in p, false);
  }
  assert.equal(listed.filter((p) => p.isDefault).length, 1);
});

// ── which models are chat models ──

test('text models are offered and other modalities are not', () => {
  for (const id of ['gemini-3.6-flash', 'gpt-4o-mini', 'claude-haiku-4-5-20251001', 'llama-3.3-70b-versatile']) {
    assert.equal(isChatModel(id), true, `${id} should be offered`);
  }
  for (const id of [
    'text-embedding-004', 'gemini-2.5-flash-preview-tts', 'gemini-3.1-flash-image',
    'imagen-3.0-generate', 'dall-e-3', 'whisper-1', 'omni-moderation-latest',
    'gemini-3.5-transcribe', 'lyria-3-pro-preview', 'gemini-2.5-computer-use-preview-10-2025',
  ]) {
    assert.equal(isChatModel(id), false, `${id} is not a chat model`);
  }
});

test('a missing or empty model id is never a chat model', () => {
  assert.equal(isChatModel(''), false);
  assert.equal(isChatModel(null), false);
  assert.equal(isChatModel(undefined), false);
});

// ── choosing a replacement ──

const ids = (list) => list.map((id) => ({ id }));

test('the preference order decides when several models are available', () => {
  const available = ids(['gemini-2.5-pro', 'gemini-3.6-flash', 'gemini-1.5-flash']);
  assert.equal(pickFallbackModel('gemini', available), 'gemini-3.6-flash');
});

test('a preferred name also matches a dated or suffixed variant', () => {
  // 'gemini-2.0-flash' is on the wish-list; only '-001' is actually served.
  const available = ids(['gemini-2.0-flash-001', 'gemma-4-31b-it']);
  assert.equal(pickFallbackModel('gemini', available), 'gemini-2.0-flash-001');
});

test('a model that has just failed is never chosen to replace itself', () => {
  // The exact case the live Gemini API produces: the endpoint lists an ID that
  // is no longer served, so without the exclusion the "fallback" is the failure.
  const available = ids(['gemini-2.5-flash', 'gemini-3.6-flash']);
  assert.equal(
    pickFallbackModel('gemini', available, 'gemini-2.5-flash', ['gemini-2.5-flash']),
    'gemini-3.6-flash',
  );
});

test('an unknown model falls back to its own family before anything else', () => {
  const available = ids(['zephyr-9b', 'gemini-4.2-flash', 'gemma-4-31b-it']);
  const picked = pickFallbackModel('gemini', available, 'gemini-4.2-flash-preview', ['gemini-4.2-flash-preview']);
  assert.equal(picked, 'gemini-4.2-flash');
});

test('anything usable beats going dark', () => {
  const picked = pickFallbackModel('gemini', ids(['some-unheard-of-model']), 'gemini-3.6-flash');
  assert.equal(picked, 'some-unheard-of-model');
});

test('no usable model means no answer, not a wrong one', () => {
  assert.equal(pickFallbackModel('gemini', [], 'gemini-3.6-flash'), null);
  // A list of image models is not a list of chat models.
  assert.equal(pickFallbackModel('gemini', ids(['imagen-3.0', 'text-embedding-004'])), null);
  assert.equal(pickFallbackModel('gemini', ids(['gemini-3.6-flash']), 'gemini-3.6-flash', ['gemini-3.6-flash']), null);
});

test('bare strings are accepted as well as model objects', () => {
  assert.equal(pickFallbackModel('gemini', ['gemini-3.6-flash', 'gemini-2.5-pro']), 'gemini-3.6-flash');
});

// ── reading the provider's own advice ──

test("a provider naming its successor is taken at its word", () => {
  // Verbatim from the live Gemini API.
  const message = 'This model models/gemini-2.5-flash is no longer available to new users. '
    + 'Please update your code to use models/gemini-3.6-flash for the latest features and improvements.';
  assert.equal(suggestedModelFrom(message), 'gemini-3.6-flash');
});

test('an error that suggests nothing yields nothing', () => {
  assert.equal(suggestedModelFrom('API key not valid. Please pass a valid API key.'), null);
  assert.equal(suggestedModelFrom(''), null);
  assert.equal(suggestedModelFrom(null), null);
});
