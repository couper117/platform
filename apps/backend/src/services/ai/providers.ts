/**
 * The AI providers the platform can talk to.
 *
 * ONE SHAPE, MANY VENDORS. Every provider exposes exactly two operations —
 * `listModels` and `chat` — so the rest of the system never learns that Gemini
 * puts the key in a query string and Anthropic puts it in a header, or that one
 * calls the field `maxOutputTokens` and another `max_tokens`. Swapping provider
 * in the admin console is a settings change, not a code change.
 *
 * NO SDKs. Six vendor SDKs would be six dependency trees, six release cadences
 * and six ways to break `npm install`, to send what is in every case one JSON
 * POST. Node 18+ has `fetch` built in, which is the only thing any of them
 * actually needs.
 *
 * `listModels` is why the admin never has to know a model ID. The console asks
 * the provider what the key can actually reach and shows that list; if the
 * chosen model later disappears — vendors retire them on their own schedule —
 * `pickFallbackModel` finds the nearest live equivalent from the same list
 * rather than leaving the assistant dead until someone notices.
 *
 * Errors are normalised into one Error carrying `.statusCode` (what the API
 * should answer), `.provider`, and `.code` where the cause is known
 * ('MISSING_KEY', 'BAD_KEY', 'MODEL_NOT_FOUND', 'RATE_LIMITED', 'TIMEOUT'), so
 * the console can say "that key was rejected" instead of "500".
 */

/**
 * Generous, deliberately. Measured against the live Gemini API the same one-word
 * request came back in 1.6s and, minutes later, in 51s — the variance is the
 * provider and the link to it, not the size of the prompt. A ceiling tight
 * enough to look tidy turns a slow-but-working answer into an error, and the
 * widget is already showing a typing indicator while it waits. Listing models
 * keeps its own much shorter limit: nobody watches that one.
 */
const DEFAULT_TIMEOUT_MS = 60_000;

// ── Error helper ────────────────────────────────────────────────────────────

const providerError = (message, { statusCode = 502, code = null, provider = null } = {}) => {
  const error: any = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.provider = provider;
  error.isProviderError = true;
  return error;
};

/**
 * Map an upstream HTTP status onto the reason an administrator needs to see.
 * 401/403 is nearly always the key; 404 on a model path is nearly always the
 * model, and that distinction is what makes automatic fallback possible.
 */
const classify = (status, body) => {
  const text = typeof body === 'string' ? body : JSON.stringify(body || {});
  const looksLikeModel = /model|not found|does not exist|unsupported|deprecat/i.test(text);
  // Google answers a bad key with 400, not 401, so the status alone would file
  // "your API key is wrong" under "the provider misbehaved" — and the console
  // would tell an administrator to check the wrong thing.
  const looksLikeKey = /api[ _-]?key|unauthori|authentication|credential|permission denied|invalid.{0,12}token/i.test(text);

  if (status === 401 || status === 403) return 'BAD_KEY';
  if (status === 400 && looksLikeKey) return 'BAD_KEY';
  if (status === 404 && looksLikeModel) return 'MODEL_NOT_FOUND';
  if (status === 400 && looksLikeModel) return 'MODEL_NOT_FOUND';
  if (status === 429) return 'RATE_LIMITED';
  // 503 from these APIs means "this model is swamped right now", not "the
  // service is down" — a different model on the same key usually answers.
  if (status === 503) return 'UNAVAILABLE';
  return null;
};

/**
 * Some providers name their own replacement in the refusal: Gemini's 404 reads
 * "no longer available to new users. Please update your code to use
 * models/gemini-3.6-flash". Taking them at their word beats guessing from a
 * hand-written preference list that was accurate when it was written.
 */
const suggestedModelFrom = (message) => {
  const match = /(?:use|to)\s+(?:models\/)?([a-z0-9][a-z0-9._-]{4,60})/i.exec(String(message || ''));
  return match ? match[1].replace(/[.,)]$/, '') : null;
};

/** Pull the most useful sentence out of whatever shape the vendor returned. */
const messageFrom = (body, fallback) => {
  if (!body) return fallback;
  if (typeof body === 'string') return body.slice(0, 400) || fallback;
  return (
    body.error?.message ||
    body.error?.msg ||
    body.message ||
    body.detail ||
    fallback
  );
};

// ── HTTP ────────────────────────────────────────────────────────────────────

/**
 * One JSON request, with a hard timeout.
 *
 * A hung upstream must not hold an Express handler open until the client gives
 * up: every call gets an AbortController, and a timeout is reported as a timeout
 * rather than as an unexplained network error.
 */
const request = async (url, { method = 'GET', headers = {}, body = null, provider = null, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw providerError('The AI provider did not respond in time.', { statusCode: 504, code: 'TIMEOUT', provider });
    }
    throw providerError(`Could not reach the AI provider: ${error?.message || 'network error'}`, { statusCode: 502, code: 'NETWORK', provider });
  } finally {
    clearTimeout(timer);
  }

  const raw = await response.text();
  let parsed: any = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = raw;
  }

  if (!response.ok) {
    const code = classify(response.status, parsed);
    throw providerError(messageFrom(parsed, `The AI provider returned HTTP ${response.status}.`), {
      // What OUR API should answer, which is not what theirs did. A rejected key
      // is a configuration fault (400) whatever status the vendor chose for it;
      // everything else upstream is a bad gateway from where our caller stands.
      statusCode: code === 'BAD_KEY' ? 400 : (response.status === 429 ? 429 : 502),
      code,
      provider,
    });
  }

  return parsed;
};

// ── Shared helpers ──────────────────────────────────────────────────────────

const requireKey = (apiKey, provider) => {
  if (!apiKey) {
    throw providerError('No API key is configured for this provider.', { statusCode: 400, code: 'MISSING_KEY', provider });
  }
  return apiKey;
};

// Model IDs that are not text chat. Vendors list every modality from the same
// endpoint, and an image or speech model in a chat dropdown looks identical
// until it is chosen and every reply fails.
const NON_CHAT = /embed|moderation|whisper|-tts|audio|imagen|image|dall-e|rerank|guard|transcribe|robotics|lyria|nano-banana|computer-use|veo-|video/i;

const isChatModel = (id) => typeof id === 'string' && id.length > 0 && !NON_CHAT.test(id);

/**
 * The OpenAI wire format, which OpenAI, Groq, Mistral, OpenRouter, DeepSeek and
 * a dozen gateways all speak. Written once and parameterised by base URL so
 * adding another compatible vendor is four lines of configuration.
 */
const openAiCompatible = ({ id, label, description, baseUrl, keyEnv, keyHint, docsUrl, defaultModel, preferred, requiresKey = true, extraHeaders = () => ({}) }) => ({
  id,
  label,
  description,
  keyEnv,
  keyHint,
  docsUrl,
  requiresKey,
  configurableBaseUrl: false,
  defaultModel,
  preferred,

  async listModels({ apiKey, baseUrl: overrideBase } = {} as any) {
    if (requiresKey) requireKey(apiKey, id);
    const root = overrideBase || baseUrl;
    const body = await request(`${root}/models`, {
      headers: { ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}), ...extraHeaders() },
      provider: id,
      timeoutMs: 20_000,
    });

    return (body?.data || body?.models || [])
      .map((m) => ({
        id: m.id || m.name,
        label: m.name && m.id && m.name !== m.id ? m.name : (m.id || m.name),
        description: m.description || null,
        contextWindow: m.context_length || m.context_window || m.max_context_length || null,
      }))
      .filter((m) => isChatModel(m.id));
  },

  async chat({ apiKey, baseUrl: overrideBase } = {} as any, { model, system, messages, temperature, maxTokens }) {
    if (requiresKey) requireKey(apiKey, id);
    const root = overrideBase || baseUrl;

    const body = await request(`${root}/chat/completions`, {
      method: 'POST',
      headers: { ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}), ...extraHeaders() },
      provider: id,
      body: {
        model,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        ],
        temperature,
        max_tokens: maxTokens,
      },
    });

    const text = body?.choices?.[0]?.message?.content;
    if (!text) throw providerError('The AI provider returned an empty answer.', { statusCode: 502, code: 'EMPTY', provider: id });

    return {
      text,
      model: body?.model || model,
      truncated: body?.choices?.[0]?.finish_reason === 'length',
      usage: body?.usage ? { input: body.usage.prompt_tokens, output: body.usage.completion_tokens } : null,
    };
  },
});

// ── Gemini ──────────────────────────────────────────────────────────────────

/**
 * Google's own wire format — not OpenAI-compatible on this endpoint.
 *
 * Three differences worth naming, because each one is a silent failure if
 * missed: the key goes in the query string (`?key=`), the assistant's turns are
 * called `model` rather than `assistant`, and the system prompt is a separate
 * `systemInstruction` field rather than a first message.
 */
const gemini = {
  id: 'gemini',
  label: 'Google Gemini',
  description: 'Google AI Studio. Fast, generous free tier — the platform default.',
  keyEnv: 'GEMINI_API_KEY',
  keyHint: 'Usually starts with "AIza" — create one at aistudio.google.com/apikey',
  docsUrl: 'https://aistudio.google.com/apikey',
  requiresKey: true,
  configurableBaseUrl: false,
  defaultModel: 'gemini-3.6-flash',
  // Preference order for automatic fallback: fast and cheap first, because this
  // is a support assistant answering short grounded questions, not a reasoner.
  // Google retires and adds IDs constantly and no two API keys see the same
  // list, so this is a ranked wish-list rather than a promise — anything absent
  // is skipped, and a family prefix catches a successor nobody has heard of yet.
  preferred: [
    'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview',
    'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash',
    'gemini-pro-latest', 'gemini-2.5-pro',
  ],

  async listModels({ apiKey } = {} as any) {
    requireKey(apiKey, 'gemini');
    const body = await request(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=200`,
      { provider: 'gemini', timeoutMs: 20_000 },
    );

    return (body?.models || [])
      // Only models that can actually answer a prompt. The same endpoint lists
      // embedding and token-counting models, which would look identical in a
      // dropdown and fail the moment they were chosen.
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => ({
        id: String(m.name || '').replace(/^models\//, ''),
        label: m.displayName || String(m.name || '').replace(/^models\//, ''),
        description: m.description || null,
        contextWindow: m.inputTokenLimit || null,
      }))
      .filter((m) => isChatModel(m.id));
  },

  /**
   * Cap the reasoning, because it is charged to the same allowance as the answer.
   *
   * Measured against this platform's own prompt on gemini-3.5-flash with
   * maxOutputTokens 1400: reasoning consumed 1082 tokens and the reply got 314
   * before it was cut off mid-sentence. With this cap the same question finished
   * cleanly in less than half the time. Raising maxOutputTokens does not fix it —
   * the model simply thinks longer.
   *
   * 128 rather than 0: zero is rejected outright by gemini-3.6-flash, which
   * requires some reasoning. This is a hint, not a hard limit — the model still
   * spent ~660 tokens — but it is enough to leave room for an answer.
   */
  thinkingBudget: 128,

  async chat({ apiKey } = {} as any, { model, system, messages, temperature, maxTokens }) {
    requireKey(apiKey, 'gemini');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const payload = (thinkingConfig) => ({
      method: 'POST' as const,
      provider: 'gemini',
      body: {
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          ...(thinkingConfig ? { thinkingConfig } : {}),
        },
      },
    });

    let body;
    try {
      body = await request(url, payload({ thinkingBudget: gemini.thinkingBudget }));
    } catch (error: any) {
      // Older Gemini models and the Gemma family reject the field outright. One
      // retry without it, so a model that predates reasoning still answers
      // rather than failing on a parameter meant to help it.
      const unsupported = error?.statusCode === 502 && /thinking|invalid.{0,20}argument|unknown name/i.test(error?.message || '');
      if (!unsupported) throw error;
      body = await request(url, payload(null));
    }

    const candidate = body?.candidates?.[0];
    const text = (candidate?.content?.parts || []).map((p) => p.text).filter(Boolean).join('');

    if (!text) {
      // Two different 200-with-no-text failures, and they need different advice.
      //
      // MAX_TOKENS here does NOT mean the answer was cut short — it means the
      // reply budget was spent before a single word was written. Gemini 3.x
      // models reason internally and charge that to the same allowance, so a
      // budget that looks generous for a one-word answer can produce nothing at
      // all. Anyone told "empty answer" would go looking for a bug in the prompt.
      //
      // A blocked prompt also comes back 200 with a reason, and that is a safety
      // filter, not a fault to debug either.
      const reason = candidate?.finishReason || body?.promptFeedback?.blockReason;
      throw providerError(
        reason === 'MAX_TOKENS'
          ? 'Gemini used the whole reply allowance on internal reasoning before writing anything. Raise "Longest reply" in AI Configuration.'
          : reason
            ? `Gemini returned no text (${reason}).`
            : 'Gemini returned an empty answer.',
        { statusCode: 502, code: reason === 'MAX_TOKENS' ? 'BUDGET_TOO_SMALL' : 'EMPTY', provider: 'gemini' },
      );
    }

    return {
      text,
      model,
      // The reply ran out of allowance mid-sentence. Reported rather than
      // silently returned, because half a Markdown link renders as raw syntax.
      truncated: candidate?.finishReason === 'MAX_TOKENS',
      usage: body?.usageMetadata
        ? { input: body.usageMetadata.promptTokenCount, output: body.usageMetadata.candidatesTokenCount }
        : null,
    };
  },
};

// ── Anthropic ───────────────────────────────────────────────────────────────

const anthropic = {
  id: 'anthropic',
  label: 'Anthropic Claude',
  description: 'Claude models. Strong instruction-following and long context.',
  keyEnv: 'ANTHROPIC_API_KEY',
  keyHint: 'Starts with "sk-ant-" — create one at console.anthropic.com',
  docsUrl: 'https://console.anthropic.com/settings/keys',
  requiresKey: true,
  configurableBaseUrl: false,
  defaultModel: 'claude-haiku-4-5-20251001',
  preferred: ['claude-haiku-4-5', 'claude-sonnet-5', 'claude-opus-5', 'claude-fable-5-1'],

  async listModels({ apiKey } = {} as any) {
    requireKey(apiKey, 'anthropic');
    const body = await request('https://api.anthropic.com/v1/models?limit=100', {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      provider: 'anthropic',
      timeoutMs: 20_000,
    });

    return (body?.data || []).map((m) => ({
      id: m.id,
      label: m.display_name || m.id,
      description: null,
      contextWindow: null,
    })).filter((m) => isChatModel(m.id));
  },

  async chat({ apiKey } = {} as any, { model, system, messages, temperature, maxTokens }) {
    requireKey(apiKey, 'anthropic');

    const body = await request('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      provider: 'anthropic',
      body: {
        model,
        system,
        messages: messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        max_tokens: maxTokens,
        temperature,
      },
    });

    const text = (body?.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    if (!text) throw providerError('Claude returned an empty answer.', { statusCode: 502, code: 'EMPTY', provider: 'anthropic' });

    return {
      text,
      model: body?.model || model,
      truncated: body?.stop_reason === 'max_tokens',
      usage: body?.usage ? { input: body.usage.input_tokens, output: body.usage.output_tokens } : null,
    };
  },
};

// ── Ollama (self-hosted) ────────────────────────────────────────────────────

/**
 * Local/self-hosted models. Included because data-sovereignty is a live
 * constraint for this platform (Law N° 058/2021): an institution that may not
 * send questions offshore can point this at a machine it owns and the assistant
 * keeps working, with no key and no third party.
 */
const ollama = {
  id: 'ollama',
  label: 'Ollama (self-hosted)',
  description: 'A model running on your own server. No API key, no data leaves your network.',
  keyEnv: null,
  keyHint: null,
  docsUrl: 'https://ollama.com',
  requiresKey: false,
  configurableBaseUrl: true,
  defaultBaseUrl: 'http://localhost:11434',
  defaultModel: 'llama3.1',
  preferred: ['llama3.1', 'llama3', 'qwen2.5', 'mistral', 'gemma2', 'phi3'],

  async listModels({ baseUrl } = {} as any) {
    const root = (baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    const body = await request(`${root}/api/tags`, { provider: 'ollama', timeoutMs: 15_000 });
    return (body?.models || []).map((m) => ({
      id: m.name,
      label: m.name,
      description: m.details?.parameter_size ? `${m.details.parameter_size} parameters` : null,
      contextWindow: null,
    }));
  },

  async chat({ baseUrl } = {} as any, { model, system, messages, temperature, maxTokens }) {
    const root = (baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    const body = await request(`${root}/api/chat`, {
      method: 'POST',
      provider: 'ollama',
      body: {
        model,
        stream: false,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        ],
        options: { temperature, num_predict: maxTokens },
      },
    });

    const text = body?.message?.content;
    if (!text) throw providerError('The local model returned an empty answer.', { statusCode: 502, code: 'EMPTY', provider: 'ollama' });
    return { text, model: body?.model || model, truncated: body?.done_reason === 'length', usage: null };
  },
};

// ── The register ────────────────────────────────────────────────────────────

const PROVIDERS = {
  gemini,

  openai: openAiCompatible({
    id: 'openai',
    label: 'OpenAI',
    description: 'GPT models through the OpenAI API.',
    baseUrl: 'https://api.openai.com/v1',
    keyEnv: 'OPENAI_API_KEY',
    keyHint: 'Starts with "sk-" — create one at platform.openai.com/api-keys',
    docsUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-4o-mini',
    preferred: ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4.1', 'gpt-3.5-turbo'],
  }),

  anthropic,

  openrouter: openAiCompatible({
    id: 'openrouter',
    label: 'OpenRouter',
    description: 'One key, hundreds of models from many vendors — including free tiers.',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyEnv: 'OPENROUTER_API_KEY',
    keyHint: 'Starts with "sk-or-" — create one at openrouter.ai/keys',
    docsUrl: 'https://openrouter.ai/keys',
    defaultModel: 'google/gemini-2.0-flash-001',
    preferred: ['google/gemini-2.0-flash-001', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-haiku', 'meta-llama/llama-3.1-8b-instruct'],
    extraHeaders: () => ({ 'X-Title': 'RwaSport Assistant' }),
  }),

  groq: openAiCompatible({
    id: 'groq',
    label: 'Groq',
    description: 'Open models served very fast. Good when replies must feel instant.',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyEnv: 'GROQ_API_KEY',
    keyHint: 'Starts with "gsk_" — create one at console.groq.com/keys',
    docsUrl: 'https://console.groq.com/keys',
    defaultModel: 'llama-3.3-70b-versatile',
    preferred: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  }),

  mistral: openAiCompatible({
    id: 'mistral',
    label: 'Mistral AI',
    description: 'European models, hosted in the EU.',
    baseUrl: 'https://api.mistral.ai/v1',
    keyEnv: 'MISTRAL_API_KEY',
    keyHint: 'Create one at console.mistral.ai',
    docsUrl: 'https://console.mistral.ai/api-keys',
    defaultModel: 'mistral-small-latest',
    preferred: ['mistral-small-latest', 'open-mistral-nemo', 'mistral-large-latest'],
  }),

  deepseek: openAiCompatible({
    id: 'deepseek',
    label: 'DeepSeek',
    description: 'Low-cost models with an OpenAI-compatible API.',
    baseUrl: 'https://api.deepseek.com/v1',
    keyEnv: 'DEEPSEEK_API_KEY',
    keyHint: 'Starts with "sk-" — create one at platform.deepseek.com',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    defaultModel: 'deepseek-chat',
    preferred: ['deepseek-chat', 'deepseek-reasoner'],
  }),

  ollama,
};

const DEFAULT_PROVIDER = 'gemini';

const listProviders = () =>
  Object.values(PROVIDERS).map((p: any) => ({
    id: p.id,
    label: p.label,
    description: p.description,
    keyEnv: p.keyEnv,
    keyHint: p.keyHint,
    docsUrl: p.docsUrl,
    requiresKey: p.requiresKey,
    configurableBaseUrl: p.configurableBaseUrl,
    defaultBaseUrl: p.defaultBaseUrl || null,
    defaultModel: p.defaultModel,
    isDefault: p.id === DEFAULT_PROVIDER,
  }));

const getProvider = (id) => {
  const provider = PROVIDERS[id];
  if (!provider) {
    throw providerError(`Unknown AI provider "${id}".`, { statusCode: 400, code: 'UNKNOWN_PROVIDER' });
  }
  return provider;
};

const isKnownProvider = (id) => Object.prototype.hasOwnProperty.call(PROVIDERS, id);

/**
 * Choose a replacement when the configured model is gone.
 *
 * Preference order first — a hand-written list per provider, cheapest-and-fastest
 * first, matched as a prefix so `gemini-2.0-flash` also accepts
 * `gemini-2.0-flash-001` when the plain name is retired. Then a same-family
 * guess, which is what rescues a model the preference list has never heard of
 * (a new `gemini-3-*`, say): the family prefix of the dead model still matches
 * its successor. Only then the first chat model on offer, so the assistant
 * answers with *something* rather than staying dark.
 */
const pickFallbackModel = (providerId, available, currentModel = null, exclude = []) => {
  const barred = new Set(exclude.filter(Boolean));
  const ids = (available || [])
    .map((m) => (typeof m === 'string' ? m : m.id))
    .filter(isChatModel)
    // A model the provider has just refused is not a candidate for replacing
    // itself — Gemini lists retired IDs that then 404 on first use, so without
    // this the "fallback" is the failure again.
    .filter((id) => !barred.has(id));
  if (!ids.length) return null;

  const provider: any = PROVIDERS[providerId];
  for (const wanted of provider?.preferred || []) {
    const exact = ids.find((id) => id === wanted);
    if (exact) return exact;
    const prefixed = ids.find((id) => id.startsWith(wanted));
    if (prefixed) return prefixed;
  }

  if (currentModel) {
    // "gemini-2.5-flash-preview" → try "gemini-2.5", then "gemini".
    const parts = String(currentModel).split(/[-/]/);
    for (let take = parts.length - 1; take >= 1; take -= 1) {
      const stem = parts.slice(0, take).join('-');
      if (stem.length < 3) break;
      const near = ids.find((id) => id.startsWith(stem));
      if (near) return near;
    }
  }

  return ids[0];
};

module.exports = {
  PROVIDERS,
  suggestedModelFrom,
  DEFAULT_PROVIDER,
  listProviders,
  getProvider,
  isKnownProvider,
  pickFallbackModel,
  providerError,
  isChatModel,
};
