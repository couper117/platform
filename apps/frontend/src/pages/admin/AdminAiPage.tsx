import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, Save, KeyRound, Cpu, Loader2, CheckCircle2, AlertCircle, RefreshCw,
  ExternalLink, ShieldCheck, Power, Eye, EyeOff, Wand2,
} from 'lucide-react';
import {
  getAiConfig, getAiProviders, saveAiConfig, listAiModels, testAiConnection,
} from '../../api/endpoints/ai';
import useUiStore from '../../store/uiStore';
import { Skeleton } from '../../components/ui';

/**
 * Super Admin → AI Configuration.
 *
 * ── The one rule this screen is built around ──
 * AN API KEY GOES IN AND NEVER COMES OUT. The server returns each provider's key
 * *status* — configured or not, from the console or the environment, and its
 * last four characters — and never the key itself. So the password field starts
 * empty on every load, and empty means "leave what is stored alone", not "clear
 * it". Clearing is a separate, explicit button, because those two intentions
 * look identical in an empty text box and one of them takes the assistant down.
 *
 * ── Why the model is a dropdown and not a text field ──
 * Nobody should have to know that Google renamed a model last month. "Fetch
 * available models" asks the provider what this key can actually reach and lists
 * it. The list is not decoration: the same call is what the server's automatic
 * fallback uses when a saved model stops being served.
 *
 * ── Test before save ──
 * The test button sends whatever is currently typed, including a key that has
 * not been saved. Finding out a key is wrong should not require overwriting a
 * working one first.
 */

const FIELD = 'w-full rounded-input border border-hairline bg-surface px-3 py-2.5 text-sm text-primary outline-none transition-colors focus:border-brand/60';
const LABEL = 'text-[10px] font-bold uppercase tracking-[0.2em] text-tertiary';
const CARD = 'rounded-2xl border border-hairline bg-surface p-5 space-y-5';

const Section = ({ icon: Icon, title, hint, children }) => (
  <section className={CARD}>
    <header className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-text">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-base uppercase tracking-tight text-primary">{title}</h2>
        {hint && <p className="mt-0.5 text-[12px] leading-snug text-tertiary">{hint}</p>}
      </div>
    </header>
    {children}
  </section>
);

const AdminAiPage = () => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const [form, setForm] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<any>(null);

  const { data: providers = [] } = useQuery({ queryKey: ['ai-providers'], queryFn: getAiProviders });
  const { data: config, isLoading } = useQuery({ queryKey: ['ai-config'], queryFn: getAiConfig });

  // The server's copy seeds the form once, and again after every save, so the
  // screen always reflects what is actually stored rather than what was typed.
  useEffect(() => { if (config) setForm({ ...config }); }, [config]);

  const provider = useMemo(
    () => providers.find((p) => p.id === form?.provider) || null,
    [providers, form?.provider],
  );

  const keyStatus = useMemo(
    () => (config?.keys || []).find((k) => k.provider === form?.provider) || null,
    [config, form?.provider],
  );

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  // Switching provider invalidates everything that was about the old one.
  const changeProvider = (id) => {
    set({ provider: id, model: '' });
    setApiKey('');
    setModels([]);
    setTestResult(null);
  };

  const fetchModels = useMutation({
    mutationFn: () => listAiModels({ provider: form.provider, apiKey: apiKey || undefined, baseUrl: form.baseUrl }),
    onSuccess: (data) => {
      setModels(data.models || []);
      if (!data.models?.length) pushToast('That key reached the provider but returned no usable models.', 'info');
      // Pre-select what the platform would pick anyway, so "fetch, save" is a
      // working configuration without a second decision.
      else if (!form.model && data.recommended) set({ model: data.recommended });
    },
    onError: (error: any) => pushToast(error?.response?.data?.message || 'Could not list models.', 'error'),
  });

  const test = useMutation({
    mutationFn: () => testAiConnection({
      provider: form.provider,
      apiKey: apiKey || undefined,
      model: form.model,
      baseUrl: form.baseUrl,
    }),
    onSuccess: (data) => {
      setTestResult(data);
      // The server answers a failed test with 200 + ok:false — a diagnosis is a
      // successful request. Only the payload says whether it worked.
      if (data.ok && data.substituted) set({ model: data.model });
    },
    onError: (error: any) => setTestResult({ ok: false, message: error?.response?.data?.message || 'The test could not be run.' }),
  });

  const save = useMutation({
    mutationFn: (extra: any = {}) => saveAiConfig({
      enabled: form.enabled,
      provider: form.provider,
      model: form.model,
      baseUrl: form.baseUrl,
      temperature: form.temperature,
      maxTokens: form.maxTokens,
      historyDepth: form.historyDepth,
      groundingDepth: form.groundingDepth,
      assistantName: form.assistantName,
      greeting: form.greeting,
      suggestions: form.suggestions,
      persona: form.persona,
      ...extra,
    }),
    onSuccess: () => {
      setApiKey('');
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
      // The public widget caches its status; without this an administrator
      // switching the assistant on has to reload to see it appear.
      queryClient.invalidateQueries({ queryKey: ['ai-status'] });
      pushToast('AI configuration saved.', 'success');
    },
    onError: (error: any) => pushToast(error?.response?.data?.message || 'Could not save the configuration.', 'error'),
  });

  if (isLoading || !form) return <div className="p-2"><Skeleton type="card" count={3} /></div>;

  const busy = save.isPending || test.isPending || fetchModels.isPending;
  const modelOptions = models.length
    ? models
    : (form.model ? [{ id: form.model, label: form.model }] : []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Heading ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">
            AI <span className="text-red">Configuration</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
            The assistant that answers visitors' questions about the platform
          </p>
        </div>
        <button
          type="button"
          onClick={() => save.mutate(apiKey ? { apiKey } : {})}
          disabled={busy}
          className="flex items-center gap-3 rounded-xl bg-red px-8 py-3 font-display text-lg uppercase tracking-widest text-white shadow-xl shadow-red/20 transition-all hover:bg-red-dark disabled:opacity-50"
        >
          {save.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save configuration
        </button>
      </div>

      {/* ── Live status strip ───────────────────────────────────────────── */}
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider ${
        config.ready ? 'bg-brand/10 text-brand-text' : 'bg-live/10 text-live'
      }`}>
        {config.ready ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        <span>
          {config.enabled
            ? (config.ready ? 'Assistant is live' : 'Assistant is on, but has no usable API key')
            : 'Assistant is switched off'}
        </span>
        <span className="font-normal normal-case tracking-normal opacity-70">
          {provider?.label || config.provider} · {config.resolvedModel}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">

          {/* ── Provider ─────────────────────────────────────────────── */}
          <Section
            icon={Sparkles}
            title="AI provider"
            hint="Which service answers the questions. Gemini is the platform default; the others need only their own key."
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {providers.map((p) => {
                const status = (config.keys || []).find((k) => k.provider === p.id);
                const selected = form.provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => changeProvider(p.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      selected ? 'border-brand bg-brand-tint' : 'border-hairline bg-surface hover:border-brand/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">{p.label}</span>
                      {p.isDefault && <span className="rounded-badge bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-text">Default</span>}
                      {status?.configured && <CheckCircle2 size={13} className="ml-auto shrink-0 text-brand" />}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-tertiary">{p.description}</p>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── Credential ───────────────────────────────────────────── */}
          <Section
            icon={KeyRound}
            title="API key"
            hint={`Stored encrypted on the server and never sent back to a browser. ${provider?.keyHint || ''}`}
          >
            {provider?.requiresKey === false ? (
              <div className="space-y-2">
                <label className={LABEL}>Server address</label>
                <input
                  className={FIELD}
                  value={form.baseUrl || ''}
                  placeholder={provider.defaultBaseUrl || 'http://localhost:11434'}
                  onChange={(e) => set({ baseUrl: e.target.value })}
                />
                <p className="text-[11px] text-tertiary">This provider runs on your own hardware — no key, and no data leaves your network.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-[12px]">
                  {keyStatus?.configured ? (
                    <>
                      <ShieldCheck size={15} className="text-brand" />
                      <span className="font-semibold text-primary">Key in place</span>
                      <code className="font-mono text-tertiary">{keyStatus.masked}</code>
                      <span className="text-tertiary">
                        · from {keyStatus.source === 'environment' ? 'a server environment variable' : 'this console'}
                      </span>
                    </>
                  ) : keyStatus?.source === 'unreadable' ? (
                    <>
                      <AlertCircle size={15} className="text-live" />
                      <span className="text-primary">A stored key could not be decrypted — re-enter it below.</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={15} className="text-live" />
                      <span className="text-primary">No key configured for {provider?.label}.</span>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <label className={LABEL}>{keyStatus?.configured ? 'Replace the key' : 'Enter the key'}</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKey ? 'text' : 'password'}
                        className={`${FIELD} pr-10 font-mono`}
                        value={apiKey}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={keyStatus?.configured ? 'Leave blank to keep the current key' : 'Paste the API key'}
                        onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((v) => !v)}
                        aria-label={showKey ? 'Hide the key' : 'Show the key'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-tertiary hover:text-primary"
                      >
                        {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {keyStatus?.configured && keyStatus.editable && (
                      <button
                        type="button"
                        onClick={() => { if (window.confirm('Remove the stored key for this provider?')) save.mutate({ apiKey: '' }); }}
                        className="shrink-0 rounded-input border border-hairline px-3 text-[12px] font-bold text-live hover:bg-live/5"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {provider?.docsUrl && (
                    <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-text hover:underline">
                      Get a key from {provider.label} <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </>
            )}
          </Section>

          {/* ── Model ────────────────────────────────────────────────── */}
          <Section
            icon={Cpu}
            title="Model"
            hint="Fetch the list rather than typing an ID. If the chosen model is ever withdrawn, the platform moves to the closest working one by itself."
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className={`${FIELD} flex-1`}
                value={form.model || ''}
                onChange={(e) => set({ model: e.target.value })}
              >
                <option value="">Provider default ({provider?.defaultModel})</option>
                {modelOptions.map((m) => (
                  <option key={m.id} value={m.id}>{m.label || m.id}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => fetchModels.mutate()}
                disabled={busy}
                className="flex shrink-0 items-center justify-center gap-2 rounded-input border border-hairline bg-surface px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-primary transition-colors hover:border-brand/40 hover:bg-brand-tint disabled:opacity-50"
              >
                {fetchModels.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Fetch models
              </button>
            </div>
            {models.length > 0 && (
              <p className="text-[11px] text-tertiary">
                {models.length} model{models.length === 1 ? '' : 's'} available to this key.
              </p>
            )}
          </Section>

          {/* ── Behaviour ────────────────────────────────────────────── */}
          <Section
            icon={Wand2}
            title="Behaviour"
            hint="How the assistant answers. The defaults are tuned for accuracy over flourish — it quotes records, so invention is the failure that matters."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className={LABEL}>Creativity — {Number(form.temperature).toFixed(2)}</label>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={form.temperature}
                  onChange={(e) => set({ temperature: Number(e.target.value) })}
                  className="w-full accent-[rgb(var(--brand))]"
                />
                <p className="text-[11px] text-tertiary">Lower sticks closer to the records. 0.30 is recommended.</p>
              </div>

              <div className="space-y-2">
                <label className={LABEL}>Longest reply — {form.maxTokens} tokens</label>
                <input
                  type="range" min="400" max="4000" step="100"
                  value={form.maxTokens}
                  onChange={(e) => set({ maxTokens: Number(e.target.value) })}
                  className="w-full accent-[rgb(var(--brand))]"
                />
                {/* Not `tokens * 0.75`. Reasoning models spend a large share of
                    this allowance thinking before they write — measured at over
                    two thirds on Gemini — so quoting the raw conversion promises
                    an answer three times longer than the one that arrives. */}
                <p className="text-[11px] text-tertiary">
                  Around {Math.round(form.maxTokens * 0.28)} words of answer; the rest of the
                  allowance is spent on the model's own reasoning.
                </p>
              </div>

              <div className="space-y-2">
                <label className={LABEL}>Conversation memory</label>
                <select className={FIELD} value={form.historyDepth} onChange={(e) => set({ historyDepth: Number(e.target.value) })}>
                  <option value={0}>No memory — each question stands alone</option>
                  <option value={4}>Short — last 4 turns</option>
                  <option value={8}>Standard — last 8 turns</option>
                  <option value={16}>Long — last 16 turns</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className={LABEL}>Platform data attached</label>
                <select className={FIELD} value={form.groundingDepth} onChange={(e) => set({ groundingDepth: e.target.value })}>
                  <option value="lean">Lean — cheapest, less context</option>
                  <option value="standard">Standard — recommended</option>
                  <option value="rich">Rich — most context, higher cost</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className={LABEL}>House style (optional)</label>
              <textarea
                rows={3}
                className={`${FIELD} resize-y`}
                value={form.persona || ''}
                placeholder="Extra instructions — e.g. always answer in Kinyarwanda first, or always mention the federation's contact page."
                onChange={(e) => set({ persona: e.target.value })}
              />
            </div>
          </Section>
        </div>

        {/* ── Right column ──────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* On/off */}
          <section className={CARD}>
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${form.enabled ? 'bg-brand/10 text-brand-text' : 'bg-surface-2 text-tertiary'}`}>
                <Power size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base uppercase tracking-tight text-primary">Assistant</h2>
                <p className="text-[12px] text-tertiary">{form.enabled ? 'Visible on every page' : 'Hidden from visitors'}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.enabled}
                aria-label="Enable the AI assistant"
                onClick={() => set({ enabled: !form.enabled })}
                className={`relative h-6 w-11 shrink-0 rounded-pill transition-colors ${form.enabled ? 'bg-brand-strong' : 'bg-hairline'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${form.enabled ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          </section>

          {/* Test */}
          <Section
            icon={ShieldCheck}
            title="Test connection"
            hint="Lists the models this key can reach, then sends a real request. Uses whatever is typed above, saved or not."
          >
            <button
              type="button"
              onClick={() => { setTestResult(null); test.mutate(); }}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-input border border-brand/40 bg-brand-tint px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-brand-text transition-colors hover:bg-brand/15 disabled:opacity-50"
            >
              {test.isPending ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
              Run the test
            </button>

            {testResult && (
              <div className={`space-y-1.5 rounded-xl border p-3 text-[12px] ${
                testResult.ok ? 'border-brand/30 bg-brand/5' : 'border-live/30 bg-live/5'
              }`}>
                <p className="flex items-center gap-2 font-bold text-primary">
                  {testResult.ok ? <CheckCircle2 size={15} className="text-brand" /> : <AlertCircle size={15} className="text-live" />}
                  {testResult.ok ? 'Connection working' : 'Connection failed'}
                </p>
                {testResult.ok ? (
                  <ul className="space-y-0.5 text-tertiary">
                    <li>Model: <span className="font-mono text-primary">{testResult.model}</span></li>
                    <li>Round trip: {testResult.latencyMs} ms</li>
                    <li>{testResult.modelCount} models reachable</li>
                    {testResult.substituted && (
                      <li className="text-brand-text">
                        <strong>{testResult.requestedModel}</strong> was not available — switched to <strong>{testResult.model}</strong>.
                      </li>
                    )}
                  </ul>
                ) : (
                  // `break-words`: provider errors quote documentation URLs and
                  // metric names with no spaces in them, which otherwise run
                  // straight out of the panel and get clipped mid-word.
                  <p className="break-words leading-snug text-secondary">{testResult.message}</p>
                )}
              </div>
            )}
          </Section>

          {/* Presentation */}
          <Section icon={Sparkles} title="What visitors see" hint="The name, the opening message and the starter questions in the chat window.">
            <div className="space-y-2">
              <label className={LABEL}>Assistant name</label>
              <input className={FIELD} value={form.assistantName || ''} onChange={(e) => set({ assistantName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className={LABEL}>Greeting</label>
              <textarea rows={3} className={`${FIELD} resize-y`} value={form.greeting || ''} onChange={(e) => set({ greeting: e.target.value })} />
              <p className="text-[11px] text-tertiary">Markdown works here — **bold** and bullet lists render in the chat.</p>
            </div>
            <div className="space-y-2">
              <label className={LABEL}>Suggested questions</label>
              {(form.suggestions || []).map((s, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className={FIELD}
                    value={s}
                    onChange={(e) => set({ suggestions: form.suggestions.map((v, i) => (i === index ? e.target.value : v)) })}
                  />
                  <button
                    type="button"
                    aria-label="Remove this suggestion"
                    onClick={() => set({ suggestions: form.suggestions.filter((_, i) => i !== index) })}
                    className="shrink-0 rounded-input border border-hairline px-3 text-tertiary hover:text-live"
                  >
                    ×
                  </button>
                </div>
              ))}
              {(form.suggestions || []).length < 6 && (
                <button
                  type="button"
                  onClick={() => set({ suggestions: [...(form.suggestions || []), ''] })}
                  className="text-[11px] font-bold uppercase tracking-wider text-brand-text hover:underline"
                >
                  + Add a suggestion
                </button>
              )}
            </div>
          </Section>

          <p className="px-1 text-[11px] leading-relaxed text-tertiary">
            Questions and answers are <strong className="text-secondary">not stored</strong> by the platform. Each
            question is answered against records read from this database at that moment, and only what the public
            site already publishes is sent to the provider — never identity documents, contact details, or the
            Amashuri athletes' records.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAiPage;
