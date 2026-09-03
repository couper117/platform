import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, Send, RotateCcw, AlertCircle, ChevronDown } from 'lucide-react';
import { getAiStatus, askAi } from '../../api/endpoints/ai';
import AssistantMarkdown from './AssistantMarkdown';
import cn from '../ui/cn';

/**
 * The floating assistant — one launcher, one panel, on every page of the app.
 *
 * MOUNTED ONCE, ABOVE THE ROUTER. It lives in App.tsx outside <Routes>, so a
 * conversation survives navigation: someone can ask "where do I find the table",
 * follow the link it gives them, and come back to the same thread. That is also
 * why nothing is written to storage — the state lives exactly as long as the tab
 * does, and a refresh is a fresh start.
 *
 * TWO SHAPES, NOT ONE RESPONSIVE COMPROMISE. On a phone it is a full-height
 * sheet, because a 400px card floating over a 360px screen with the keyboard up
 * leaves about four visible lines. On a laptop it is a docked card in the
 * corner, so the page behind it stays readable and usable.
 *
 * IT CLEARS THE FURNITURE. The public shell has a 56px bottom tab bar and a home
 * indicator below it; the launcher sits above both. Getting this wrong puts a
 * green circle on top of the last nav item on every mobile screen — which is
 * exactly the bug the React Query devtools launcher caused here before.
 *
 * IT NEVER BREAKS A PAGE. If the status call fails, or the assistant is switched
 * off in the admin console, nothing renders at all.
 */

const SUGGESTION_FALLBACK = [
  'What matches are coming up?',
  'Which sports are on the platform?',
  'How does a club register?',
];

/** The chrome owns these routes; a floating bubble over a sign-in form is noise. */
const HIDDEN_ON = ['/auth', '/design-system'];

const AssistantWidget = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // [{ role, content, error? }]
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bodyOverflow = useRef('');

  const { data: status } = useQuery({
    queryKey: ['ai-status'],
    queryFn: getAiStatus,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Both, not just `enabled`. A launcher that opens onto an assistant with no
  // API key is worse than no launcher: it invites a question it cannot answer.
  // `ready` is the server's own verdict on whether a request could be made.
  const available = Boolean(status?.enabled && status?.ready);
  const suggestions = status?.suggestions?.length ? status.suggestions : SUGGESTION_FALLBACK;
  const name = status?.assistantName || 'RwaSport Assistant';

  // Keep the newest message in view, including while one is being written.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending, open]);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 220);
    return () => clearTimeout(t);
  }, [open]);

  // Escape closes it, from anywhere — including from inside the textarea.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /**
   * Lock the page behind the sheet on mobile only. On a desktop the panel is a
   * card in the corner and the page behind it is still the thing being read —
   * freezing its scroll there would be a bug, not a modal.
   */
  useEffect(() => {
    if (!open || typeof window === 'undefined' || window.innerWidth >= 768) return undefined;
    bodyOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = bodyOverflow.current; };
  }, [open]);

  const send = useCallback(async (text) => {
    const question = String(text || '').trim();
    if (!question || sending) return;

    // The history sent is what was on screen BEFORE this question — the server
    // adds the question itself, and sending it twice makes the model answer the
    // previous turn.
    const history = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setDraft('');
    // The composer grows with what is typed, so it has to be shrunk back by
    // hand — clearing the value alone leaves a four-line-tall empty box.
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setSending(true);

    try {
      const result = await askAi({ message: question, history });
      setMessages((prev) => [...prev, { role: 'assistant', content: result.answer }]);
    } catch (error: any) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        error: true,
        content: error?.response?.data?.message
          || 'I could not reach the assistant just now. Please try again in a moment.',
      }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [messages, sending]);

  const onKeyDown = (e) => {
    // Enter sends, Shift+Enter breaks the line. The IME check matters for
    // Kinyarwanda and French keyboards: composing a character raises Enter too,
    // and without it a half-typed accent gets sent as a question.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault();
      send(draft);
    }
  };

  if (!available || HIDDEN_ON.some((prefix) => pathname.startsWith(prefix))) return null;

  const empty = messages.length === 0;

  return (
    <>
      {/* ── Launcher ──────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? `Close ${name}` : `Open ${name}`}
        aria-expanded={open}
        className={cn(
          'fixed right-4 z-[120] flex h-14 w-14 items-center justify-center rounded-full',
          'bg-brand-strong text-brand-on shadow-brand transition-all duration-200 ease-standard',
          'hover:bg-brand-hover hover:-translate-y-0.5 active:translate-y-0',
          'md:right-6 md:h-[60px] md:w-[60px]',
          // Above the mobile tab bar and the home indicator; a comfortable
          // corner inset on desktop, where there is no tab bar.
          'bottom-[calc(theme(spacing.rail)+env(safe-area-inset-bottom)+12px)] md:bottom-6',
          // On a phone the open panel is full-screen and carries its own close
          // button, so the launcher would be a green circle floating on top of
          // the composer. On a laptop it stays: it is the panel's toggle.
          open && 'hidden md:flex md:scale-100',
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown size={24} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sparkles size={24} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Panel ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="assistant-panel"
            role="dialog"
            aria-label={name}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0.2, 1] }}
            className={cn(
              'fixed z-[119] flex flex-col overflow-hidden bg-surface',
              // Phone: a sheet that owns the screen, stopping above the tab bar.
              'inset-x-0 bottom-0 top-0 rounded-none',
              // Laptop: a docked card that leaves the page visible.
              'md:inset-auto md:bottom-[92px] md:right-6 md:top-auto md:h-[min(640px,calc(100vh-140px))] md:w-[400px]',
              'md:rounded-card md:border md:border-hairline md:shadow-lg',
            )}
          >
            {/* Header */}
            <header className="flex shrink-0 items-center gap-3 border-b border-hairline bg-surface px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)] md:pt-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-strong text-brand-on">
                <Sparkles size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-primary">{name}</p>
                <p className="flex items-center gap-1.5 text-[11px] text-tertiary">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', status?.ready ? 'bg-success' : 'bg-live')} />
                  {/* Truncated, not wrapped: at 360px this line shares its row
                      with two icon buttons, and wrapping left the status dot
                      stranded above its own caption. */}
                  <span className="truncate">
                    {status?.ready ? 'Ready to help with the platform' : 'Not configured yet'}
                  </span>
                </p>
              </div>
              {!empty && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  aria-label="Start a new conversation"
                  title="Start a new conversation"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-tertiary transition-colors hover:bg-surface-2 hover:text-primary"
                >
                  <RotateCcw size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close the assistant"
                className="flex h-9 w-9 items-center justify-center rounded-full text-tertiary transition-colors hover:bg-surface-2 hover:text-primary"
              >
                <X size={18} />
              </button>
            </header>

            {/* Conversation */}
            {/* aria-live so an answer is announced when it arrives: the reply
                appears without focus moving, which a screen reader would
                otherwise pass over in silence. */}
            <div
              ref={scrollRef}
              aria-live="polite"
              aria-atomic="false"
              className="flex-1 space-y-3 overflow-y-auto bg-alt px-4 py-4"
            >
              {empty && (
                <div className="space-y-4">
                  <div className="rounded-2xl rounded-tl-sm border border-hairline bg-surface px-3.5 py-3 text-[13px] text-secondary">
                    <AssistantMarkdown text={status?.greeting || `Hello! I'm the **${name}**. Ask me anything about Rwandan sport on this platform.`} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tertiary">Try asking</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => send(s)}
                          className="rounded-pill border border-hairline bg-surface px-3 py-2 text-left text-[12px] font-medium text-secondary transition-colors hover:border-brand/40 hover:bg-brand-tint hover:text-brand-text"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((m, index) => (
                <div key={index} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[88%] px-3.5 py-2.5 text-[13px]',
                      m.role === 'user'
                        ? 'rounded-2xl rounded-br-sm bg-brand-strong text-brand-on'
                        : m.error
                          ? 'flex items-start gap-2 rounded-2xl rounded-tl-sm border border-live/30 bg-live/5 text-secondary'
                          : 'rounded-2xl rounded-tl-sm border border-hairline bg-surface text-secondary',
                    )}
                  >
                    {m.error && <AlertCircle size={15} className="mt-0.5 shrink-0 text-live" />}
                    {m.role === 'user' ? <span className="whitespace-pre-wrap">{m.content}</span> : <AssistantMarkdown text={m.content} />}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start" aria-label="The assistant is typing">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-hairline bg-surface px-4 py-3.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-brand"
                        style={{ animationDelay: `${i * 0.18}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="shrink-0 border-t border-hairline bg-surface px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] md:pb-3">
              <div className="flex items-end gap-2 rounded-input border border-hairline bg-surface-2 px-3 py-2 focus-within:border-brand/50">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    // Grow with the text, up to five lines, then scroll.
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 110)}px`;
                  }}
                  onKeyDown={onKeyDown}
                  maxLength={1200}
                  placeholder="Ask about sports, clubs, fixtures…"
                  aria-label="Your question"
                  className="max-h-[110px] flex-1 resize-none bg-transparent text-[13px] text-primary outline-none placeholder:text-tertiary"
                />
                <button
                  type="button"
                  onClick={() => send(draft)}
                  disabled={!draft.trim() || sending}
                  aria-label="Send"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-strong text-brand-on transition-all hover:bg-brand-hover disabled:opacity-30"
                >
                  <Send size={15} />
                </button>
              </div>
              <p className="mt-2 px-1 text-center text-[10px] leading-tight text-tertiary">
                Answers come from RwaSport's own records. Double-check anything critical.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AssistantWidget;
