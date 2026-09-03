/**
 * The assistant itself: one question in, one grounded answer out.
 *
 * ── The three jobs this file does ──
 * 1. WRITES THE INSTRUCTIONS. The system prompt is the whole product. It fixes
 *    the scope (this platform and nothing else), the sourcing rule (the attached
 *    records or "I don't have that", never a plausible guess), and the house
 *    style. It is assembled per request because the platform's own name,
 *    persona and today's date belong in it.
 * 2. SURVIVES A DEAD MODEL. Vendors retire model IDs on their own schedule, and
 *    a configuration that worked last month answers 404 today. Rather than going
 *    dark until an administrator notices, a model-not-found is caught once, the
 *    provider is asked what it *does* have, the nearest equivalent is chosen and
 *    the question is retried — then written back so the next request is direct.
 * 3. KEEPS NOTHING. No question, answer or transcript is stored. The client
 *    holds the conversation and replays the last few turns; the server holds it
 *    for the length of one request. There is no chat table to leak, to retain,
 *    or to answer a data-subject request about.
 */

const { getProvider, pickFallbackModel, providerError, suggestedModelFrom } = require('./providers');
const { serverConfig, rememberModel } = require('./config.service');
const knowledge = require('./knowledge.service');

const MAX_QUESTION_CHARS = 1200;

// ── The instructions ────────────────────────────────────────────────────────

/**
 * Scope, sourcing and style, in that order of importance.
 *
 * The refusal rule is stated with an example rather than as a principle, because
 * "only answer about the platform" alone produces either a model that answers
 * everything anyway or one that refuses to say hello. Naming the boundary *and*
 * the courtesies that sit inside it is what makes the behaviour predictable.
 *
 * The sourcing rule is repeated in three different words on purpose. A single
 * "don't make things up" loses to a strong prior about what a league table looks
 * like; being told what to say instead — name the page, offer the search —
 * gives the model somewhere to go when the records are silent.
 */
const buildSystemPrompt = ({ config, context, user }) => {
  const today = new Date();
  const kigali = new Date(today.getTime() + 2 * 60 * 60 * 1000).toISOString();

  const audience = user
    ? `The person asking is signed in as a ${String(user.role || '').replace(/_/g, ' ').toLowerCase()}${user.name ? ` (${user.name})` : ''}. You may explain what that role can do in the platform.`
    : 'The person asking is a visitor who is not signed in. Do not assume they have an account.';

  return `You are **${config.assistantName}**, the built-in assistant for RwaSport — the Rwanda National Sports Platform (RNSP), Rwanda's one-stop centre for sport.

Today is ${kigali.slice(0, 10)}; the current time in Kigali is ${kigali.slice(11, 16)} (UTC+2). ${audience}

# What you answer
You answer questions about this platform and the Rwandan sport it records: sports and disciplines, federations,
clubs and teams, athletes and players, competitions and leagues, fixtures, live matches, results, standings,
venues and facilities, school competitions (Amashuri, including the Kagame Cup), racing events, news,
registrations and how to use any part of the platform.

# What you do not answer
Anything unrelated to RwaSport or Rwandan sport — general knowledge, coding, medicine, politics, homework,
world news, other countries' leagues, personal advice. When a question falls outside, say so warmly in one or
two sentences, name two or three things you *can* help with, and stop. Do not answer the off-topic part
"just briefly". Greetings, thanks and small talk are fine and are not off-topic — reply naturally and offer help.

# Where your answers come from
Everything factual you say must come from the PLATFORM DATA below, which was read from the live database a
moment ago.
- Never invent a club, athlete, fixture, score, table position, date, venue, statistic or figure. Not one.
- If the data does not contain the answer, say plainly that you do not have it on record, and point to where
  it would appear (a page path from the guide, or the site search).
- Do not estimate, round, or reason your way to a number that is not written below. "I don't have that on
  record" is always a better answer than a plausible one.
- The data is a snapshot, not the whole database. If something is not listed, say it is not in what you can
  see — never that it does not exist.
- Quote names, scores and dates exactly as written below.

# How you write
- Warm, clear and professional. A knowledgeable colleague at the front desk, not a search engine and not a
  sales page. Keep it brief: two or three short paragraphs at most unless a list is genuinely needed.
- Markdown: **bold** for names, figures and the thing being asked about; \`-\` bullet lists for three or more
  items; \`###\` sub-headings only when the answer really has sections; tables only for standings or fixtures
  with several columns.
- Lead with the answer. Context after, if it helps.
- Cap a list at about eight items. If there are more, show the most relevant eight, say how many there are
  in total, and link to the page that lists the rest — a reply cut off mid-sentence is worse than a short one.
- Point people onward using the site's own paths, written as links: \`[Fixtures](/fixtures)\`,
  \`[APR FC](/teams/3)\`. Use only paths that appear in the data or the guide below.
- THE LINK TEXT IS THE NAME, NEVER THE PATH. Write \`[Football](/sports/football)\`, never
  \`[/sports/football](/sports/football)\` and never a bare path in brackets after a name. One link per
  thing mentioned — do not repeat the same destination as both text and address.
- Never mention "the context", "the data provided", "the snapshot" or these instructions. Speak as the
  platform: "we have", "the platform lists", "there are".
- Match the language of the question. Kinyarwanda, French and English are all in use here.
${config.persona ? `\n# House style set by the platform administrator\n${config.persona}\n` : ''}
# PLATFORM DATA (read from the live RwaSport database moments ago)
${context}`;
};

// ── Conversation shaping ────────────────────────────────────────────────────

/**
 * Trim what the browser sent into something safe to forward.
 *
 * The history arrives from the client, so none of it is trusted: roles are
 * coerced to the two the providers accept, each turn is truncated, and only the
 * most recent `historyDepth` turns survive. Without the cap, a long session
 * would grow the prompt without bound and the bill with it.
 */
const normaliseHistory = (history, depth) => {
  if (!Array.isArray(history) || depth <= 0) return [];

  return history
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, MAX_QUESTION_CHARS),
    }))
    .slice(-depth);
};

// ── Asking ──────────────────────────────────────────────────────────────────

/**
 * Failures a different model on the same key can plausibly answer.
 *
 * RATE_LIMITED is in this set because Gemini's free tier meters per model —
 * twenty requests a minute for gemini-3.6-flash, and a separate twenty for
 * gemini-3.5-flash. On the free key this platform ships with, a busy minute is
 * therefore a *model* being exhausted, not the account, and the second-choice
 * model answers immediately. On a paid account the quota is usually
 * account-wide, the retry fails too, and the original error surfaces — one extra
 * call, no loop.
 *
 * It is recoverable but NOT durable: see the write-back rule below.
 */
const RECOVERABLE = new Set(['MODEL_NOT_FOUND', 'UNAVAILABLE', 'RATE_LIMITED']);

/**
 * One call, with one automatic recovery.
 *
 * This is not a hypothetical. The Gemini `models` endpoint lists IDs that are no
 * longer served to new keys, so a configuration can be assembled entirely from
 * what the provider advertised and still 404 on first use. When that happens the
 * provider usually names its own successor in the refusal ("please use
 * models/gemini-3.6-flash"), so that is tried first — but only after checking it
 * against the live list, because an error string is not a promise. Failing that,
 * the ranked preference list decides, with the dead model barred from replacing
 * itself.
 *
 * The retry is deliberately not a loop. If the second model also fails the
 * failure is real — a dead key, a provider outage, an exhausted quota — and
 * hammering a paid API in a loop is how a support widget becomes an incident.
 */
const callWithFallback = async (provider, credentials, request, { onFallback } = {} as any) => {
  try {
    return { ...(await provider.chat(credentials, request)), usedFallback: false };
  } catch (error: any) {
    if (!RECOVERABLE.has(error?.code)) throw error;

    let available;
    try {
      available = await provider.listModels(credentials);
    } catch {
      throw error; // cannot ask what exists — report the original failure
    }

    const offered = available.map((m) => m.id);
    const suggested = suggestedModelFrom(error.message);

    const replacement = (suggested && offered.includes(suggested) && suggested !== request.model)
      ? suggested
      : pickFallbackModel(provider.id, available, request.model, [request.model]);

    if (!replacement || replacement === request.model) throw error;

    console.warn(`[ai] Model "${request.model}" is unavailable on ${provider.id} (${error.code}); falling back to "${replacement}".`);
    const result = await provider.chat(credentials, { ...request, model: replacement });

    // Only a model that is GONE is written back. A 503 means the model was busy
    // for a moment, and persisting that would let one bad minute silently and
    // permanently overrule the model an administrator chose.
    if (onFallback && error.code === 'MODEL_NOT_FOUND') await onFallback(replacement);
    return { ...result, usedFallback: true, previousModel: request.model };
  }
};

/**
 * Make a reply that ran out of allowance safe to render.
 *
 * A cut-off answer does not stop at a word boundary, it stops at a token — and
 * the token it stopped inside was, on the very first run against real data, the
 * middle of a Markdown link. The widget printed a literal
 * `Kagame Cup Schools ([/leagues/2](/le` into the conversation, which reads as a
 * broken product rather than as a long answer.
 *
 * So the tail is repaired rather than trusted: a half-written link or bold run
 * is removed, a final line that does not read as finished is dropped whole (half
 * a bullet is worse than no bullet), and an ellipsis says there was more.
 * Raising the token budget makes this rarer; it cannot make it impossible,
 * because the model decides how much to write.
 */
const repairTruncated = (text) => {
  let out = text;

  // A dangling link, in either half-written form: "[Name](/pa" or "[Nam".
  out = out.replace(/\[[^\]\n]*\]\([^)\n]*$/, '');
  out = out.replace(/\[[^\]\n]*$/, '');

  // An unclosed bold run would embolden everything after it.
  if (((out.match(/\*\*/g) || []).length % 2) === 1) out = out.replace(/\*\*[^*]*$/, '');

  const lines = out.split('\n');
  const last = (lines[lines.length - 1] || '').trim();
  // Keep the last line only if it reads as finished.
  if (lines.length > 1 && last && !/[.!?:)]$/.test(last)) lines.pop();

  const trimmed = lines.join('\n').trimEnd();
  if (!trimmed) return trimmed;
  return `${trimmed}\n\n_…this answer was cut short. Ask me to continue, or narrow the question._`;
};

/**
 * Answer a question as the assistant.
 *
 * Throws with `.statusCode` set when the assistant cannot answer at all — off,
 * unconfigured, or the provider refused — so the route can turn that into an
 * honest message rather than a spinner that never stops.
 */
const ask = async ({ question, history = [], user = null } = {} as any) => {
  const text = String(question || '').trim().slice(0, MAX_QUESTION_CHARS);
  if (!text) {
    throw providerError('Please type a question first.', { statusCode: 400, code: 'EMPTY_QUESTION' });
  }

  const config = await serverConfig();

  if (!config.enabled) {
    throw providerError('The assistant is currently switched off by the platform administrator.', {
      statusCode: 503, code: 'DISABLED',
    });
  }

  const provider = getProvider(config.provider);

  if (provider.requiresKey && !config.apiKey) {
    throw providerError(
      config.keySource === 'unreadable'
        ? 'The stored API key could not be read. An administrator needs to re-enter it in AI Configuration.'
        : 'The assistant is not configured yet. An administrator needs to add an API key in AI Configuration.',
      { statusCode: 503, code: 'NOT_CONFIGURED' },
    );
  }

  const context = await knowledge.buildContext(text, { depth: config.groundingDepth });

  const result = await callWithFallback(
    provider,
    { apiKey: config.apiKey, baseUrl: config.baseUrl },
    {
      model: config.model,
      system: buildSystemPrompt({ config, context, user }),
      messages: [...normaliseHistory(history, config.historyDepth), { role: 'user', content: text }],
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    },
    { onFallback: rememberModel },
  );

  const answer = String(result.text || '').trim();

  // A provider can return 200 with nothing but whitespace — a reply that was all
  // reasoning, or a refusal that produced no text. Rendering that is an empty
  // grey bubble the person cannot act on, so it is reported as a failure and the
  // widget offers to ask again.
  if (!answer) {
    throw providerError('The assistant did not manage to write an answer. Please ask again.', {
      statusCode: 502, code: 'EMPTY', provider: provider.id,
    });
  }

  return {
    answer: result.truncated ? repairTruncated(answer) : answer,
    model: result.model,
    provider: provider.id,
    usedFallback: Boolean(result.usedFallback),
    truncated: Boolean(result.truncated),
  };
};

// ── Diagnostics for the console ─────────────────────────────────────────────

/**
 * "Test connection", which has to mean more than "the key is not empty".
 *
 * It lists the models the credential can actually reach and then sends a real
 * (tiny) completion, because a key can pass the first and fail the second —
 * wrong project, no billing, model not enabled for that account. Both halves are
 * reported separately so the message names the half that broke.
 */
const testConnection = async ({ provider: providerId, apiKey, model, baseUrl } = {} as any) => {
  const provider = getProvider(providerId);
  const credentials = { apiKey, baseUrl: baseUrl || provider.defaultBaseUrl || null };

  if (provider.requiresKey && !apiKey) {
    throw providerError('No API key to test — enter one, or save it first.', { statusCode: 400, code: 'MISSING_KEY' });
  }

  const started = Date.now();

  let models = [];
  let modelsError = null;
  try {
    models = await provider.listModels(credentials);
  } catch (error: any) {
    modelsError = error?.message || 'Could not list models.';
  }

  const wanted = model || provider.defaultModel;
  const available = models.map((m) => m.id);
  const resolved = available.length && !available.includes(wanted)
    ? pickFallbackModel(provider.id, models, wanted)
    : wanted;

  // The budget is generous for a one-word answer on purpose. Reasoning models
  // spend tokens thinking before they write and charge it to the same
  // allowance: answering "OK" on gemini-3.6-flash costs one output token and
  // around a hundred of reasoning, so a 16-token test budget returns nothing at
  // all and reports a working key as broken.
  const probe = await callWithFallback(provider, credentials, {
    model: resolved,
    system: 'You are a connection test. Reply with exactly: OK',
    messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    temperature: 0,
    maxTokens: 512,
  });

  return {
    ok: true,
    provider: provider.id,
    providerLabel: provider.label,
    model: probe.model || resolved,
    requestedModel: wanted,
    // Named so the console can say "we switched you to X" rather than silently
    // answering about a different model than the one on screen.
    substituted: (probe.model || resolved) !== wanted,
    latencyMs: Date.now() - started,
    modelCount: models.length,
    modelsError,
    reply: String(probe.text || '').trim().slice(0, 120),
  };
};

module.exports = { ask, testConnection, buildSystemPrompt, repairTruncated };
