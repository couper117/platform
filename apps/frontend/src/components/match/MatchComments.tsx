import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send } from 'lucide-react';
import Field from '../ui/Field';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import useAuthStore from '../../store/authStore';
import cn from '../ui/cn';

/**
 * MatchComments — a client-side comment thread for one fixture.
 *
 * THERE IS NO COMMENTS API. Every comment lives in this browser's localStorage,
 * keyed by match id, and the UI says so plainly rather than implying a shared
 * conversation — same honesty rule `useFavouriteSport` follows for its own
 * client-only preference. Every read/write is wrapped in try/catch: private
 * browsing throws on storage access, and a comment a fan just typed should
 * never vanish behind an unhandled error because of that.
 */

type Comment = { id: string; author: string; text: string; createdAt: number };

const AUTHOR_KEY = 'rnsp-comment-author';
const COMMENTS_KEY = (matchId: string | number) => `rnsp-match-comments-${matchId}`;
const MAX_LEN = 500;

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / storage full — the comment still shows for this session */
  }
};

const relativeTime = (t: (k: string, opts?: any) => string, createdAt: number) => {
  const diff = Date.now() - createdAt;
  const minute = 60000;
  const hour = 3600000;
  const day = 86400000;
  if (diff < minute) return t('match.time_just_now');
  if (diff < hour) return t('match.time_minutes_ago', { count: Math.max(1, Math.floor(diff / minute)) });
  if (diff < day) return t('match.time_hours_ago', { count: Math.floor(diff / hour) });
  return t('match.time_days_ago', { count: Math.floor(diff / day) });
};

const MatchComments = ({ matchId, className }: { matchId: string | number; className?: string }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');

  // Load this match's thread (and any remembered display name) once per
  // matchId — never blocked by a storage failure.
  useEffect(() => {
    setComments(readJson<Comment[]>(COMMENTS_KEY(matchId), []));
    setAuthor(readJson<string>(AUTHOR_KEY, '') || user?.fullName || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const name = author.trim() || t('match.comments_guest');
    const comment: Comment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author: name,
      text: trimmed,
      createdAt: Date.now(),
    };

    const next = [comment, ...comments];
    setComments(next);
    writeJson(COMMENTS_KEY(matchId), next);
    writeJson(AUTHOR_KEY, name);
    setText('');
  };

  return (
    <div className={cn('rounded-card border border-hairline bg-surface p-4 sm:p-6', className)}>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-primary">
          {t('match.comments')}
          {comments.length > 0 && (
            <span className="ml-2 text-sm font-normal text-tertiary">
              {t('match.comments_count', { count: comments.length })}
            </span>
          )}
        </h3>
      </div>
      <p className="mb-5 text-xs text-tertiary">{t('match.comments_local_note')}</p>

      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <Field label={t('match.comments_name_label')}>
          {(p: any) => (
            <input
              {...p}
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={40}
              placeholder={t('match.comments_name_placeholder')}
              className="min-h-tap w-full rounded-input border border-hairline bg-surface px-4 text-primary placeholder:text-tertiary transition-colors duration-150 ease-standard focus:border-brand focus:outline-none"
            />
          )}
        </Field>

        <Field label={t('match.comments_message_label')}>
          {(p: any) => (
            <textarea
              {...p}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_LEN}
              rows={3}
              placeholder={t('match.comments_message_placeholder')}
              className="min-h-tap w-full resize-none rounded-input border border-hairline bg-surface px-4 py-2.5 text-primary placeholder:text-tertiary transition-colors duration-150 ease-standard focus:border-brand focus:outline-none"
            />
          )}
        </Field>

        <div className="flex justify-end">
          <Button type="submit" variant="secondary" icon={Send} disabled={!text.trim()}>
            {t('match.comments_post')}
          </Button>
        </div>
      </form>

      {comments.length === 0 ? (
        <EmptyState icon={MessageCircle} title={t('match.comments_empty')} hint={t('match.comments_empty_hint')} />
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-3">
              <Avatar name={c.author} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="truncate text-sm font-semibold text-primary">{c.author}</span>
                  <span className="text-xs text-tertiary">{relativeTime(t, c.createdAt)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-secondary">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MatchComments;
