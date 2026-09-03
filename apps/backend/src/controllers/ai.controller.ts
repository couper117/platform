const logActivity = require('../utils/activityLogger');
const { listProviders, getProvider, pickFallbackModel } = require('../services/ai/providers');
const {
  publicConfig, adminConfig, saveConfig, resolveKey, readRows,
} = require('../services/ai/config.service');
const { ask, testConnection } = require('../services/ai/chat.service');

/**
 * Failures whose upstream wording is meant for the account holder, restated for
 * the person in the chat window. Anything not listed here is passed through: the
 * provider usually explains itself better than a generic apology would.
 */
const PUBLIC_MESSAGE = {
  RATE_LIMITED: 'The assistant is handling a lot of questions right now. Please try again in a minute.',
  BAD_KEY: 'The assistant is not set up correctly at the moment. Please try again later.',
  TIMEOUT: 'That took longer than expected. Please ask again.',
  NETWORK: 'I could not reach the assistant service just now. Please try again in a moment.',
};

/**
 * Use the key the caller typed, or the one already on file.
 *
 * The console needs to test and list models for a key that has been entered but
 * not yet saved — otherwise "test before you commit" is impossible and the only
 * way to find out a key works is to save a broken one over a working one. A key
 * arriving in the body is used for that one call and never stored.
 */
const credentialsFor = async (providerId, suppliedKey) => {
  if (suppliedKey) return { apiKey: String(suppliedKey).trim(), source: 'request' };
  const { key, source } = resolveKey(providerId, await readRows());
  return { apiKey: key, source };
};

// @desc    Whether the assistant is available, and what it should greet with
// @route   GET /api/v1/ai/status
// @access  Public
const getStatus = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: await publicConfig() });
  } catch (error) {
    // The widget must never break a page. A status call that fails means "no
    // assistant today", not a red error on the site.
    console.error('[ai] status failed:', error?.message);
    res.status(200).json({ success: true, data: { enabled: false, ready: false } });
  }
};

// @desc    Ask the assistant a question
// @route   POST /api/v1/ai/chat
// @access  Public (rate limited; identified when signed in)
const postChat = async (req, res, next) => {
  try {
    const { message, history } = req.body || {};

    const result = await ask({
      question: message,
      history,
      // attachUser has already resolved this when a token was sent. Only the two
      // fields the prompt actually uses are passed on.
      user: req.user ? { role: req.user.role, name: req.user.name } : null,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    // A provider failure is not a platform failure — answer with the reason and
    // a status the widget can act on, rather than falling through to the generic
    // 500 handler and a stack trace.
    if (error?.isProviderError) {
      return res.status(error.statusCode || 502).json({
        success: false,
        // Some upstream messages are written for whoever holds the account, not
        // for a visitor: Google's quota error quotes billing pages and usage
        // dashboards. Those are replaced with something a member of the public
        // can act on; the full text still reaches the server log.
        message: PUBLIC_MESSAGE[error.code] || error.message,
        code: error.code || null,
      });
    }
    next(error);
  }
};

// @desc    The providers this platform can be pointed at
// @route   GET /api/v1/ai/providers
// @access  Private (ai.configure)
const getProviders = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: listProviders() });
  } catch (error) {
    next(error);
  }
};

// @desc    The AI configuration, with API keys reduced to their status
// @route   GET /api/v1/ai/config
// @access  Private (ai.configure)
const getConfig = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: await adminConfig() });
  } catch (error) {
    next(error);
  }
};

// @desc    Update the AI configuration
// @route   PUT /api/v1/ai/config
// @access  Private (ai.configure)
const updateConfig = async (req, res, next) => {
  try {
    const patch = req.body || {};
    const data = await saveConfig(patch);

    // What changed, never what it changed to: an audit line reading
    // "apiKey: sk-live-..." would put the credential in a second table.
    const changed = Object.keys(patch).filter((k) => k !== 'apiKey');
    if (patch.apiKey !== undefined) changed.push(patch.apiKey ? 'apiKey (set)' : 'apiKey (cleared)');

    await logActivity({
      userId: req.user.id,
      action: 'Update AI configuration',
      detail: `Changed: ${changed.join(', ') || 'nothing'}`,
      module: 'ai',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'AI configuration saved.', data });
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Ask a provider which models this key can actually use
// @route   POST /api/v1/ai/models
// @access  Private (ai.configure)
//
// POST rather than GET so a not-yet-saved key travels in the body — a key in a
// query string ends up in access logs, browser history and any proxy in between.
const listModels = async (req, res, next) => {
  try {
    const { provider: providerId, apiKey, baseUrl } = req.body || {};
    const provider = getProvider(providerId);
    const { apiKey: key } = await credentialsFor(provider.id, apiKey);

    if (provider.requiresKey && !key) {
      return res.status(400).json({
        success: false,
        message: 'Enter an API key first — the model list comes from the provider.',
        code: 'MISSING_KEY',
      });
    }

    const models = await provider.listModels({ apiKey: key, baseUrl: baseUrl || provider.defaultBaseUrl });

    res.status(200).json({
      success: true,
      data: {
        provider: provider.id,
        models,
        // What the platform would choose on this account, so the console can
        // pre-select something that works instead of an ID that may be retired.
        recommended: pickFallbackModel(provider.id, models, provider.defaultModel),
      },
    });
  } catch (error: any) {
    if (error?.isProviderError) {
      return res.status(error.statusCode || 502).json({ success: false, message: error.message, code: error.code || null });
    }
    next(error);
  }
};

// @desc    Verify a provider, key and model end to end
// @route   POST /api/v1/ai/test
// @access  Private (ai.configure)
const testProvider = async (req, res, next) => {
  try {
    const { provider: providerId, apiKey, model, baseUrl } = req.body || {};
    const provider = getProvider(providerId);
    const { apiKey: key } = await credentialsFor(provider.id, apiKey);

    const result = await testConnection({ provider: provider.id, apiKey: key, model, baseUrl });

    await logActivity({
      userId: req.user.id,
      action: 'Test AI connection',
      detail: `${provider.label} / ${result.model} — ${result.latencyMs}ms`,
      module: 'ai',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.isProviderError) {
      return res.status(200).json({
        // 200 with ok:false, not an HTTP error: a failed test is a successful
        // diagnosis, and the console needs the reason rendered in the panel
        // rather than swallowed by the global 401/403 toast interceptor.
        success: true,
        data: { ok: false, message: error.message, code: error.code || null, provider: req.body?.provider || null },
      });
    }
    next(error);
  }
};

module.exports = {
  getStatus,
  postChat,
  getProviders,
  getConfig,
  updateConfig,
  listModels,
  testProvider,
};
