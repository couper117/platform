import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Newspaper, Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import apiClient from '../../api/client';
import {
  Button, IconButton,
  EmptyState, ErrorState, Skeleton, SkeletonList, cn,
} from '../../components/ui';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import useUiStore from '../../store/uiStore';

/**
 * Super Admin → News publisher: the list of what has been written.
 *
 * WRITING HAPPENS ELSEWHERE. This screen used to carry the composer in a modal —
 * a six-row textarea in a 600px dialog, with no URL, no Back, and one stray
 * Escape between a writer and several lost paragraphs. An article is a piece of
 * writing rather than a record, so it gets a page: /admin/news/new to write one
 * and /admin/news/:id/edit to change it. Both buttons here are links now.
 */

/** Backend enums are SHOUTED; an operator reads these all day, so they are not. */
const sentence = (v: string) => v.charAt(0) + v.slice(1).toLowerCase();

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

  const { data: news, isLoading, isError } = useQuery({
    queryKey: ['admin-news'],
    queryFn: async () => {
      const { data } = await apiClient.get('/news');
      return data.data;
    },
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


  const HEADERS = ['Article', 'Category', 'Views', 'Date', 'Status'];

  return (
    <div>
      <PageHeader
        title="News publisher"
        subtitle="Manage platform-wide announcements and news."
        actions={
          <Button to="/admin/news/new" size="sm" icon={Plus}>
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
                          to={`/admin/news/${article.id}/edit`}
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
              <Button to="/admin/news/new" size="sm" icon={Plus}>
                Write article
              </Button>
            }
          />
        )}
      </Panel>

      {/* Write/edit article */}
    </div>
  );
};

export default AdminNewsPage;
