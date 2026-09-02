import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Trophy, Plus, Edit2, Trash2, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEnumLabel } from '../../i18n/enums';
import { useDateFormat } from '../../i18n/dateLocale';
import {
  getChampionships, createChampionship, updateChampionship, deleteChampionship,
} from '../../api/endpoints/amashuri';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  Button, IconButton, Modal, Field, Input, Select, StatusPill, EmptyState, Skeleton, SkeletonList,
} from '../../components/ui';

/**
 * Amashuri championships — create, edit and retire a competition.
 *
 * Presentation is the admin kit (PageHeader / Panel / TableWrap): the page used to
 * carry its own 4xl display heading, its own `statusStyle()` colour map and a
 * hand-rolled form, none of which agreed with the rest of the portal. Status now
 * goes through StatusPill, which is the one place a backend enum becomes a colour.
 */

const LEVELS = ['CELL', 'SECTOR', 'DISTRICT', 'PROVINCE', 'NATIONAL'];
const STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];

// Format an ISO date for an <input type="date"> default value.
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const AdminChampionshipsPage = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const formatDate = useDateFormat();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-championships'],
    queryFn: () => getChampionships(),
    retry: false,
  });
  const championships = data?.data || [];

  // Populate the form when opening for create vs edit.
  useEffect(() => {
    if (!isModalOpen) return;
    reset(editing
      ? {
          name: editing.name || '',
          edition: editing.edition || '',
          level: editing.level || 'NATIONAL',
          status: editing.status || 'UPCOMING',
          gender: editing.gender || 'mixed',
          ageCategory: editing.ageCategory || 'Open',
          venue: editing.venue || '',
          startDate: toDateInput(editing.startDate),
          endDate: toDateInput(editing.endDate),
          description: editing.description || '',
        }
      : {
          name: '', edition: '', level: 'NATIONAL', status: 'UPCOMING',
          gender: 'mixed', ageCategory: 'Open', venue: '', startDate: '', endDate: '', description: '',
        });
  }, [isModalOpen, editing, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      editing ? updateChampionship(editing.id, payload) : createChampionship(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-championships'] });
      queryClient.invalidateQueries({ queryKey: ['amashuri-championships'] });
      setIsModalOpen(false);
      setEditing(null);
    },
    onError: (err: any) => alert(err.response?.data?.message || t('admin.championships.save_failed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: any) => deleteChampionship(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-championships'] });
      queryClient.invalidateQueries({ queryKey: ['amashuri-championships'] });
    },
    onError: (err: any) => alert(err.response?.data?.message || t('admin.championships.delete_failed')),
  });

  const openCreate = () => { setEditing(null); setIsModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setIsModalOpen(true); };
  const onSubmit = (form) => saveMutation.mutate(form);

  return (
    <div>
      <PageHeader
        title={`${t('admin.championships.title')} ${t('admin.championships.title_accent')}`}
        subtitle={t('admin.championships.subtitle')}
        actions={
          <Button size="sm" icon={Plus} onClick={openCreate}>
            {t('admin.championships.new')}
          </Button>
        }
      />

      {isLoading ? (
        <Panel flush>
          <SkeletonList count={5} className="space-y-2 p-4">
            <Skeleton className="h-12 w-full" />
          </SkeletonList>
        </Panel>
      ) : championships.length > 0 ? (
        <Panel flush>
          <TableWrap>
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr>
                  <Th>{t('admin.championships.col_name')}</Th>
                  <Th>{t('admin.championships.col_level')}</Th>
                  <Th>{t('admin.championships.col_window')}</Th>
                  <Th align="right">{t('nav.fixtures')}</Th>
                  <Th>{t('admin.col_status')}</Th>
                  <Th align="right">{t('admin.col_actions')}</Th>
                </tr>
              </thead>
              <tbody>
                {championships.map((c) => (
                  <tr key={c.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-tint text-brand-text">
                          <Trophy size={16} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <span className="block text-sm font-medium text-primary">{c.name}</span>
                          {c.edition && <span className="block text-xs text-tertiary">{c.edition}</span>}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5">
                        <Layers size={13} className="text-tertiary" aria-hidden="true" />
                        {enumLabel('level', c.level)}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap tabular-nums">
                      {formatDate(c.startDate, 'd MMM yy') || '—'}
                      {c.endDate ? ` – ${formatDate(c.endDate, 'd MMM yy')}` : ''}
                    </Td>
                    <Td align="right">{c._count?.fixtures ?? 0}</Td>
                    <Td>
                      <StatusPill status={c.status} label={enumLabel('championship_status', c.status)} />
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={Edit2}
                          label={t('common.edit')}
                          size="sm"
                          onClick={() => openEdit(c)}
                        />
                        <IconButton
                          icon={Trash2}
                          label={t('common.delete')}
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (window.confirm(t('admin.championships.delete_confirm', { name: c.name }))) {
                              deleteMutation.mutate(c.id);
                            }
                          }}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      ) : (
        <Panel>
          <EmptyState
            icon={Trophy}
            title={t('amashuri.championships_page.none')}
            action={
              <Button size="sm" icon={Plus} onClick={openCreate}>
                {t('admin.championships.create_first')}
              </Button>
            }
          />
        </Panel>
      )}

      {/* Create / Edit modal */}
      {isModalOpen && (
        <Modal
          open
          size="lg"
          onClose={() => { setIsModalOpen(false); setEditing(null); }}
          title={editing ? t('admin.championships.modal_edit') : t('admin.championships.new')}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label={t('admin.championships.name_label')}
                error={errors.name ? t('admin.championships.name_required') : undefined}
                className="md:col-span-2"
              >
                {(p) => (
                  <Input
                    {...p}
                    {...register('name', { required: true })}
                    placeholder={t('admin.championships.name_placeholder')}
                  />
                )}
              </Field>

              <Field label={t('admin.championships.edition')}>
                {(p) => (
                  <Input {...p} {...register('edition')} placeholder={t('admin.championships.edition_placeholder')} />
                )}
              </Field>
              <Field label={t('admin.fixtures.col_venue')}>
                {(p) => (
                  <Input {...p} {...register('venue')} placeholder={t('admin.championships.venue_placeholder')} />
                )}
              </Field>

              <Field label={t('admin.championships.col_level')}>
                {(p) => (
                  <Select
                    {...p}
                    {...register('level')}
                    size="md"
                    options={LEVELS.map((l) => ({ value: l, label: enumLabel('level', l) }))}
                  />
                )}
              </Field>
              <Field label={t('admin.col_status')}>
                {(p) => (
                  <Select
                    {...p}
                    {...register('status')}
                    size="md"
                    options={STATUSES.map((s) => ({ value: s, label: enumLabel('championship_status', s) }))}
                  />
                )}
              </Field>

              <Field label={t('admin.leagues.gender')}>
                {(p) => (
                  <Select
                    {...p}
                    {...register('gender')}
                    size="md"
                    options={[
                      { value: 'mixed', label: t('enums.gender.MIXED') },
                      { value: 'male', label: t('enums.gender.BOYS') },
                      { value: 'female', label: t('enums.gender.GIRLS') },
                    ]}
                  />
                )}
              </Field>
              <Field label={t('admin.championships.age_category')}>
                {(p) => (
                  <Input {...p} {...register('ageCategory')} placeholder={t('admin.championships.age_placeholder')} />
                )}
              </Field>

              <Field label={t('admin.championships.start_date')}>
                {(p) => <Input {...p} type="date" {...register('startDate')} />}
              </Field>
              <Field label={t('admin.championships.end_date')}>
                {(p) => <Input {...p} type="date" {...register('endDate')} />}
              </Field>

              <Field label={t('admin.championships.description')} className="md:col-span-2">
                {({ invalid, ...p }) => (
                  <textarea
                    {...p}
                    {...register('description')}
                    rows={3}
                    placeholder={t('admin.championships.description_placeholder')}
                    className="w-full rounded-input border border-hairline bg-surface px-4 py-3 text-primary placeholder:text-tertiary transition-colors duration-150 ease-standard hover:border-brand/40 focus:border-brand focus:outline-none"
                  />
                )}
              </Field>
            </div>

            <Button type="submit" size="sm" block loading={saveMutation.isPending}>
              {editing ? t('common.save_changes') : t('admin.championships.create')}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminChampionshipsPage;
