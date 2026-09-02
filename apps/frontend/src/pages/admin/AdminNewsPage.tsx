import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Newspaper, Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import apiClient from '../../api/client';
import {
  Button, IconButton, Modal, Field, Input, Select,
  EmptyState, ErrorState, Skeleton, SkeletonList, cn,
} from '../../components/ui';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import useUiStore from '../../store/uiStore';

/**
 * Super Admin → News publisher. Platform-wide articles: write, edit, unpublish,
 * delete. Presentation only — the queries, the multipart upload and the mutation
 * keys are untouched; the screen just speaks the admin kit's vocabulary now.
 */

const CATEGORIES = ['NEWS', 'ANNOUNCEMENT', 'RESULT', 'TRANSFER', 'INJURY', 'OTHER'];

/** Backend enums are SHOUTED; an operator reads these all day, so they are not. */
const sentence = (v: string) => v.charAt(0) + v.slice(1).toLowerCase();

const emptyForm = { title: '', category: 'NEWS', excerpt: '', body: '', published: true, coverImage: null };

/** Textarea and file inputs have no primitive yet, so they borrow Input's shell. */
const CONTROL =
  'w-full rounded-input border border-hairline bg-surface px-4 py-3 text-primary placeholder:text-tertiary ' +
  'transition-colors duration-150 ease-standard hover:border-brand/40 focus:border-brand focus:outline-none';

/**
 * A cover thumbnail that always occupies the same box. A news list where some
 * rows have an image and some do not used to jump around; a fixed aspect ratio
 * plus a fallback glyph means a missing OR broken source costs no layout.
 */
const Thumb = ({ src, alt }: { src?: string | null; alt?: string }) => {
  const [broken, setBroken] = useState(false);
  const show = src && !broken;
  return (
    <div className="relative aspect-[16/10] w-16 shrink-0 overflow-hidden rounded-control bg-surface-2">
      {show ? (
        <img
          src={src as string}
          alt={alt || ''}
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-tertiary">
          <ImageIcon size={14} aria-hidden="true" />
        </span>
      )}
    </div>
  );
};

const AdminNewsPage = () => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const { data: news, isLoading, isError } = useQuery({
    queryKey: ['admin-news'],
    queryFn: async () => {
      const { data } = await apiClient.get('/news');
      return data.data;
    },
  });

  const toFormData = (data) => {
    const fd = new FormData();
    fd.append('title', data.title);
    fd.append('category', data.category);
    fd.append('excerpt', data.excerpt);
    fd.append('body', data.body);
    fd.append('published', data.published);
    if (data.coverImage) fd.append('coverImage', data.coverImage);
    return fd;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/news', toFormData(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      closeModal();
      pushToast('Article published!', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to publish article'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      await apiClient.put(`/news/${id}`, toFormData(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      closeModal();
      pushToast('Article updated!', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to update article'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: any) => {
      await apiClient.delete(`/news/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      pushToast('Article deleted', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to delete article'),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingArticle(null);
    setFormData(emptyForm);
  };

  const openCreate = () => {
    setEditingArticle(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title || '',
      category: article.category || 'NEWS',
      excerpt: article.excerpt || '',
      body: article.body || '',
      published: !!article.published,
      coverImage: null,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const HEADERS = ['Article', 'Category', 'Views', 'Date', 'Status'];

  return (
    <div>
      <PageHeader
        title="News publisher"
        subtitle="Manage platform-wide announcements and news."
        actions={
          <Button size="sm" icon={Plus} onClick={openCreate}>
            Write article
          </Button>
        }
      />

      <Panel title="Articles" flush>
        {isLoading ? (
          <SkeletonList count={5}>
            <div className="flex items-center gap-4 border-b border-hairline px-4 py-3">
              <Skeleton className="aspect-[16/10] w-16 shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20 shrink-0" />
              <Skeleton className="h-5 w-16 shrink-0 rounded-pill" />
            </div>
          </SkeletonList>
        ) : isError ? (
          <ErrorState
            title="Couldn't load articles"
            hint="Something went wrong fetching news. Try refreshing the page."
          />
        ) : news?.length ? (
          <TableWrap>
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr>
                  {HEADERS.map((h) => (
                    <Th key={h} align={h === 'Views' ? 'right' : 'left'}>
                      {h}
                    </Th>
                  ))}
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {news.map((article) => (
                  <tr
                    key={article.id}
                    className="transition-colors duration-150 ease-standard hover:bg-surface-2"
                  >
                    <Td className="text-primary">
                      <div className="flex items-center gap-3">
                        <Thumb src={article.coverImage} alt={article.title} />
                        <span className="line-clamp-2 max-w-[22rem] font-medium">{article.title}</span>
                      </div>
                    </Td>
                    <Td>{sentence(String(article.category || ''))}</Td>
                    <Td align="right">{article.views ?? 0}</Td>
                    <Td className="whitespace-nowrap tabular-nums">
                      {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : '—'}
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          'inline-flex rounded-pill px-2 py-0.5 text-xs font-semibold',
                          article.published
                            ? 'bg-brand-tint text-brand-text'
                            : 'bg-surface-2 text-tertiary'
                        )}
                      >
                        {article.published ? 'Published' : 'Draft'}
                      </span>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={Edit2}
                          label={`Edit ${article.title}`}
                          size="sm"
                          onClick={() => openEdit(article)}
                        />
                        <IconButton
                          icon={Trash2}
                          label={`Delete ${article.title}`}
                          size="sm"
                          variant="danger"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete "${article.title}"?`)) deleteMutation.mutate(article.id);
                          }}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState
            icon={Newspaper}
            title="No articles yet"
            hint="Write your first story to keep fans updated."
            action={
              <Button size="sm" icon={Plus} onClick={openCreate}>
                Write article
              </Button>
            }
          />
        )}
      </Panel>

      {/* Write/edit article */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingArticle ? 'Edit article' : 'Publish new article'}
        size="lg"
        footer={
          <Button
            block
            loading={isSaving}
            disabled={!formData.title.trim() || isSaving}
            onClick={handleSubmit}
          >
            {editingArticle ? 'Save changes' : 'Publish story'}
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Article title">
            {({ invalid, ...p }) => (
              <Input
                {...p}
                placeholder="Headline here…"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              {(p) => (
                <Select
                  {...p}
                  size="md"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={CATEGORIES.map((c) => ({ value: c, label: sentence(c) }))}
                />
              )}
            </Field>

            <Field label="Cover image" hint="JPG or PNG, landscape works best.">
              {({ invalid, ...p }) => (
                <input
                  {...p}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.files?.[0] || null })}
                  className={cn(
                    CONTROL,
                    'min-h-tap py-2.5 text-sm',
                    'file:mr-3 file:rounded-pill file:border-0 file:bg-brand-tint file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-text'
                  )}
                />
              )}
            </Field>
          </div>

          <Field label="Short excerpt">
            {({ invalid, ...p }) => (
              <textarea
                {...p}
                rows={2}
                placeholder="Brief summary…"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className={CONTROL}
              />
            )}
          </Field>

          <Field label="Main content" hint="HTML or plain text.">
            {({ invalid, ...p }) => (
              <textarea
                {...p}
                placeholder="Full story…"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className={cn(CONTROL, 'min-h-[200px]')}
              />
            )}
          </Field>

          <label className="flex min-h-tap cursor-pointer items-center gap-3 text-sm text-secondary">
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="h-4 w-4 accent-brand"
            />
            Publish immediately
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default AdminNewsPage;
