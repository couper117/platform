import apiClient from '../client';

/**
 * The assistant's API surface.
 *
 * Note what is NOT here: nothing that sends, receives or stores an API key
 * beyond the moment an administrator types one into the configuration form. The
 * key never comes back from the server — `getAiConfig` returns each provider's
 * key *status* (configured, where from, last four characters) and nothing more —
 * so there is no path by which a credential reaches a browser that did not just
 * enter it.
 */

// ── Public: the floating assistant ──────────────────────────────────────────

/** Whether the assistant is on and ready, plus its greeting and starter questions. */
export const getAiStatus = async () => {
  const { data } = await apiClient.get('/ai/status');
  return data.data;
};

/**
 * Ask a question. `history` is the conversation so far — the server keeps none
 * of it, so the browser is what remembers, and the server trims it to the
 * configured depth.
 */
export const askAi = async ({ message, history = [] }) => {
  const { data } = await apiClient.post('/ai/chat', { message, history });
  return data.data;
};

// ── Admin: AI Configuration ─────────────────────────────────────────────────

export const getAiProviders = async () => {
  const { data } = await apiClient.get('/ai/providers');
  return data.data;
};

export const getAiConfig = async () => {
  const { data } = await apiClient.get('/ai/config');
  return data.data;
};

export const saveAiConfig = async (patch) => {
  const { data } = await apiClient.put('/ai/config', patch);
  return data.data;
};

/**
 * Ask the provider which models this key can actually reach.
 *
 * POST, not GET, and `apiKey` is optional: passing one lets the console list
 * models for a key that has been typed but not yet saved, without that key ever
 * appearing in a URL, an access log or browser history.
 */
export const listAiModels = async ({ provider, apiKey, baseUrl }) => {
  const { data } = await apiClient.post('/ai/models', { provider, apiKey, baseUrl });
  return data.data;
};

/** End-to-end check: list models, then send a real one-word completion. */
export const testAiConnection = async ({ provider, apiKey, model, baseUrl }) => {
  const { data } = await apiClient.post('/ai/test', { provider, apiKey, model, baseUrl });
  return data.data;
};
