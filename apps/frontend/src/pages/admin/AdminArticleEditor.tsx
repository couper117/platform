import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Image as ImageIcon, Trash2, Eye, Send, Save } from 'lucide-react';
import apiClient from '../../api/client';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { Button, IconButton, Field, Input, Select, ErrorState, Skeleton, cn } from '../../components/ui';
import useUiStore from '../../store/uiStore';

/**
 * Writing an article, on a page of its own.
 *
 * WHY NOT THE MODAL IT REPLACED. Everything else in the admin is a record you fill
 * in — a fixture, a licence, a squad number — and a modal is right for those. An
 * article is not a record, it is a piece of writing: it is long, it is drafted
 * rather than entered, and the writer needs to see how it will read. A 600px dialog
 * with a six-row textarea in it is the wrong shape for that, and it traps the
 * writer: no back button, no URL to return to, and one stray Escape from losing
 * several paragraphs.
 *
 * So: `/admin/news/new` and `/admin/news/:id/edit`. Both are linkable, both survive
 * a refresh, and Back does what Back should.
 *
 * TWO COLUMNS, WRITING AND PUBLISHING. The left is the article; the right is
 * everything that decides where it goes. Keeping them apart means the cover image
 * and the category are never between a writer and the next paragraph.
 */

const CATEGORIES = ['NEWS', 'ANNOUNCEMENT', 'RESULT', 'TRANSFER', 'INJURY', 'OTHER'];

/** Backend enums are SHOUTED; an operator reads these all day, so they are not. */
const sentence = (v: string) => v.charAt(0) + v.slice(1).toLowerCase();

const CONTROL =
  'w-full rounded-input border border-hairline bg-surface px-4 py-3 text-primary placeholder:text-tertiary ' +
  'transition-colors duration-150 ease-standard hover:border-brand/40 focus:border-brand focus:outline-none';

const EMPTY = { title: '', category: 'NEWS', excerpt: '', body: '', published: true };

/** Roughly how long this takes to read, at the 200wpm a newsroom assumes. */
const readingTime = (body: string) => {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / 200)) };
};

const AdminArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const isEdit = !!id;

  const [form, setForm] = useState(EMPTY);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Editing loads the article from the list the admin already has, falling back to
  // a fetch on a hard refresh — the public endpoint is keyed by slug, so there is
  // no by-id route to call here.
  const { data: articles, isLoading, isError } = useQuery({
    queryKey: ['admin-news'],
    queryFn: async () => (await apiClient.get('/news')).data.data,
  });

  const article = useMemo(
    () => (isEdit ? (articles || []).find((a: any) => String(a.id) === String(id)) : null),
    [articles, id, isEdit]
  );

  useEffect(() => {
    if (!article) return;
    setForm({
      title: article.title || '',
      category: article.category || 'NEWS',
      excerpt: article.excerpt || '',
      body: article.body || '',
      published: article.published ?? true,
    });
    setCoverPreview(article.coverImage || null);
  }, [article]);

  // Object URLs are a resource, not a string: released when the choice changes or
  // the writer leaves, so a long editing session does not leak every image tried.
  useEffect(() => {
    if (!coverFile) return;
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toFormData = () => {
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('category', form.category);
    fd.append('excerpt', form.excerpt);
    fd.append('body', form.body);
    fd.append('published', String(form.published));
    if (coverFile) fd.append('coverImage', coverFile);
    return fd;
  };

  const save = useMutation({
    mutationFn: async () => {
      if (isEdit) await apiClient.put(`/news/${id}`, toFormData());
      else await apiClient.post('/news', toFormData());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      pushToast(isEdit ? 'Article updated' : 'Article published', 'success');
      navigate('/admin/news');
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Could not save this article'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('An article needs a headline');
    if (!form.body.trim()) return setError('An article needs a body');
    save.mutate();
  };

  const { words, minutes } = readingTime(form.body);

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-card" />
      </div>
    );
  }

  if (isEdit && (isError || (!article && articles))) {
    return (
      <div className="space-y-4">
        <ErrorState
          title="Article not found"
          hint="It may have been deleted since this page was opened."
        />
        <div className="flex justify-center">
          <Button to="/admin/news" variant="secondary" size="sm">Back to news</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <Link
        to="/admin/news"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
      >
        <ChevronLeft size={14} aria-hidden="true" /> News
      </Link>

      <PageHeader
        title={isEdit ? 'Edit article' : 'Write an article'}
        subtitle={
          isEdit
            ? 'Changes go live the moment you save.'
            : 'Published articles appear on the public site and in the app immediately.'
        }
        actions={
          <>
            {isEdit && article?.slug && (
              <Button to={`/news/${article.slug}`} variant="secondary" size="sm" icon={Eye}>
                View
              </Button>
            )}
            <Button type="submit" size="sm" icon={isEdit ? Save : Send} loading={save.isPending}>
              {isEdit ? 'Save changes' : form.published ? 'Publish' : 'Save draft'}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* The writing */}
        <div className="space-y-4">
          <Panel>
            <div className="space-y-4">
              <Field label="Headline" required>
                {(p: any) => (
                  <input
                    {...p}
                    value={form.title}
                    onChange={set('title')}
                    placeholder="What happened?"
                    // The headline is the one thing on this page that should look
                    // like a headline while it is being written.
                    className={cn(CONTROL, 'font-display text-xl font-bold tracking-[-0.01em]')}
                  />
                )}
              </Field>

              <Field
                label="Standfirst"
                hint="One or two sentences. This is what shows in the news list and when the article is shared."
              >
                {(p: any) => (
                  <textarea
                    {...p}
                    rows={2}
                    value={form.excerpt}
                    onChange={set('excerpt')}
                    placeholder="The story in a sentence."
                    className={cn(CONTROL, 'resize-y')}
                  />
                )}
              </Field>
            </div>
          </Panel>

          <Panel
            title="Article"
            hint={form.body.trim() ? `${words.toLocaleString()} words · about ${minutes} min to read` : undefined}
          >
            <Field label="Body" required className="[&>label]:sr-only">
              {(p: any) => (
                <textarea
                  {...p}
                  value={form.body}
                  onChange={set('body')}
                  placeholder="Write the article…"
                  // Sized by viewport rather than by rows: 22 rows is a good desk
                  // canvas and a thousand pixels of empty box on a phone, which
                  // pushes the cover image and the publish switch out of reach.
                  className={cn(CONTROL, 'min-h-[18rem] resize-y leading-relaxed lg:min-h-[32rem]')}
                />
              )}
            </Field>
          </Panel>
        </div>

        {/* Everything that decides where it goes */}
        <div className="space-y-4">
          <Panel title="Cover image">
            <div className="space-y-3">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-control bg-surface-2">
                {coverPreview ? (
                  <img src={coverPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-tertiary">
                    <ImageIcon size={20} aria-hidden="true" />
                    <span className="text-xs">No cover yet</span>
                  </span>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                  {coverPreview ? 'Replace' : 'Choose image'}
                </Button>
                {coverFile && (
                  <IconButton
                    icon={Trash2}
                    size="sm"
                    variant="danger"
                    label="Remove the chosen image"
                    onClick={() => { setCoverFile(null); setCoverPreview(article?.coverImage || null); }}
                  />
                )}
              </div>
              {/* Says what the reader will see, not what the uploader accepts. */}
              <p className="text-xs text-tertiary">
                Shown at the top of the article and beside it in every list. Landscape works best.
              </p>
            </div>
          </Panel>

          <Panel title="Publishing">
            <div className="space-y-4">
              <Field label="Category">
                {(p: any) => (
                  <Select
                    {...p}
                    size="md"
                    value={form.category}
                    onChange={set('category')}
                    options={CATEGORIES.map((c) => ({ value: c, label: sentence(c) }))}
                  />
                )}
              </Field>

              {/* A switch, not a checkbox: this is the difference between the whole
                  country reading it and nobody reading it, so it says which it is. */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary">
                    {form.published ? 'Visible to everyone' : 'Draft'}
                  </p>
                  <p className="mt-0.5 text-xs text-tertiary">
                    {form.published
                      ? 'Appears on the public site as soon as you save.'
                      : 'Only administrators can see it.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.published}
                  aria-label="Publish this article"
                  onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
                  className={cn(
                    'relative mt-0.5 h-6 w-11 shrink-0 rounded-pill transition-colors duration-150 ease-standard',
                    form.published ? 'bg-brand' : 'bg-surface-3'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-surface transition-transform duration-150 ease-standard',
                      form.published ? 'translate-x-[22px]' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            </div>
          </Panel>

          {error && (
            <p role="alert" className="rounded-card bg-danger/10 px-4 py-3 text-sm text-danger-text">
              {error}
            </p>
          )}
        </div>
      </div>
    </form>
  );
};

export default AdminArticleEditor;
