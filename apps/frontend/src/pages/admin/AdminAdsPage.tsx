import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import apiClient from '../../api/client';
import {
  Button, IconButton, Modal, Field, Input, Select,
  EmptyState, ErrorState, Skeleton, SkeletonList, cn,
} from '../../components/ui';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import useUiStore from '../../store/uiStore';

/**
 * Super Admin → Sponsorship centre. Ad banners and where they run. Presentation
 * only: the /ads queries, the create payload and the delete mutation are exactly
 * as they were — the screen just uses the admin kit now.
 */

const POSITIONS = ['HOME_BANNER', 'SIDEBAR', 'MATCH_DAY', 'NEWS_FEED'];

/** Backend enums are SHOUTED; an operator reads these all day, so they are not. */
const placement = (v: string) =>
  String(v || '').replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

/**
 * The creative itself, in a fixed box. A banner list without the artwork makes an
 * operator open every row to find the one they meant; a fixed aspect ratio plus a
 * fallback glyph means a dead image URL costs no layout.
 */
const Creative = ({ src, alt }: { src?: string | null; alt?: string }) => {
  const [broken, setBroken] = useState(false);
  const show = src && !broken;
  return (
    <div className="relative aspect-[16/9] w-20 shrink-0 overflow-hidden rounded-control bg-surface-2">
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

const AdminAdsPage = () => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', imageUrl: '', targetUrl: '', position: 'HOME_BANNER' });

  const { data: ads, isLoading, isError } = useQuery({
    queryKey: ['admin-ads'],
    queryFn: async () => {
      const { data } = await apiClient.get('/ads');
      return data.data;
    },
  });

  const createAdMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/ads', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      setIsModalOpen(false);
      setFormData({ title: '', imageUrl: '', targetUrl: '', position: 'HOME_BANNER' });
      pushToast('Ad banner created successfully!', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to create ad banner'),
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: any) => {
      await apiClient.delete(`/ads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      pushToast('Ad banner deleted!', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to delete ad banner'),
  });

  const canSubmit = formData.title.trim() && formData.imageUrl.trim() && formData.position;

  return (
    <div>
      <PageHeader
        title="Sponsorship centre"
        subtitle="Manage advertising banners for the platform."
        actions={
          <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
            New banner
          </Button>
        }
      />

      <Panel title="Banners" flush>
        {isLoading ? (
          <SkeletonList count={4}>
            <div className="flex items-center gap-4 border-b border-hairline px-4 py-3">
              <Skeleton className="aspect-[16/9] w-20 shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24 shrink-0" />
              <Skeleton className="h-5 w-16 shrink-0 rounded-pill" />
            </div>
          </SkeletonList>
        ) : isError ? (
          <ErrorState
            title="Couldn't load banners"
            hint="Something went wrong fetching ad banners. Try refreshing the page."
          />
        ) : ads?.length ? (
          <TableWrap>
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr>
                  <Th>Banner</Th>
                  <Th>Placement</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td className="text-primary">
                      <div className="flex items-center gap-3">
                        <Creative src={ad.imageUrl} alt={ad.title} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{ad.title}</p>
                          {ad.targetUrl && (
                            <p className="truncate text-xs text-tertiary">{ad.targetUrl}</p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td>{placement(ad.position)}</Td>
                    <Td>
                      {/* Read the record. This said "Active" on every row regardless
                          of `ad.active` — while the dashboard's Active Ads count
                          filters on that same flag, so the two screens disagreed
                          about which banners were running. */}
                      <span className={cn(
                        'inline-flex rounded-pill px-2 py-0.5 text-xs font-semibold',
                        ad.active ? 'bg-brand-tint text-brand-text' : 'bg-surface-2 text-tertiary'
                      )}>
                        {ad.active ? 'Active' : 'Paused'}
                      </span>
                    </Td>
                    <Td align="right">
                      <IconButton
                        icon={Trash2}
                        label={`Delete ${ad.title}`}
                        size="sm"
                        variant="danger"
                        disabled={deleteAdMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete banner "${ad.title}"?`)) deleteAdMutation.mutate(ad.id);
                        }}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState
            icon={Megaphone}
            title="No ad banners yet"
            hint="Create your first sponsorship banner to start monetizing platform placements."
            action={
              <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
                New banner
              </Button>
            }
          />
        )}
      </Panel>

      {/* New banner */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload sponsorship banner"
        footer={
          <Button
            block
            loading={createAdMutation.isPending}
            disabled={!canSubmit || createAdMutation.isPending}
            onClick={() => createAdMutation.mutate(formData)}
          >
            Publish banner
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Banner title">
            {({ invalid, ...p }) => (
              <Input
                {...p}
                placeholder="e.g. Inyange summer campaign"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            )}
          </Field>

          <Field label="Image URL">
            {({ invalid, ...p }) => (
              <Input
                {...p}
                placeholder="Cloudinary/image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            )}
          </Field>

          {/* The creative as it will actually be cropped, so a wrong URL is caught
              here rather than on the live homepage. */}
          {formData.imageUrl.trim() !== '' && (
            <div className="flex items-center gap-3 rounded-card border border-hairline bg-surface-2 p-3">
              {/* Keyed on the URL so retyping a fixed address clears the broken
                  fallback instead of leaving the tile stuck on the glyph. */}
              <Creative key={formData.imageUrl} src={formData.imageUrl} alt="" />
              <p className="text-xs text-tertiary">Preview</p>
            </div>
          )}

          <Field label="Target URL" hint="Where the banner links to. Optional.">
            {({ invalid, ...p }) => (
              <Input
                {...p}
                placeholder="https://…"
                value={formData.targetUrl}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
              />
            )}
          </Field>

          <Field label="Placement">
            {(p) => (
              <Select
                {...p}
                size="md"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                options={POSITIONS.map((x) => ({ value: x, label: placement(x) }))}
              />
            )}
          </Field>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAdsPage;
