import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { School, MapPin, Plus, Pencil, EyeOff, Eye, ArrowRight } from 'lucide-react';
import { getSchools, createAkcSchool, updateAkcSchool, setAkcSchoolActive } from '../../api/endpoints/amashuri';
import ClubCrest from '../../components/ui/ClubCrest';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  Badge, Button, Field, IconButton, Input, Modal, Select,
  Skeleton, SkeletonList, EmptyState,
} from '../../components/ui';

const CATEGORIES = ['PRIMARY', 'SECONDARY', 'TVET'];
const empty = { name: '', code: '', category: 'SECONDARY', sector: '' };

/** Amashuri Admin → Schools: register, edit and hide schools. */
const AmashuriAdminSchools = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['aa-schools'], queryFn: () => getSchools() });
  const schools = data?.data || [];
  const refresh = () => qc.invalidateQueries({ queryKey: ['aa-schools'] });

  const save = useMutation({
    mutationFn: () => (editing ? updateAkcSchool(editing.id, form) : createAkcSchool(form)),
    onSuccess: () => { setModal(false); refresh(); },
    onError: (e: any) => setErr(e.response?.data?.message || 'Failed'),
  });
  const toggle = useMutation({ mutationFn: ({ id, active }: any) => setAkcSchoolActive(id, active), onSuccess: refresh });

  const openAdd = () => { setEditing(null); setForm(empty); setErr(''); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name || '', code: s.code || '', category: s.category || 'SECONDARY', sector: s.sector || '' }); setErr(''); setModal(true); };

  return (
    <div>
      <PageHeader
        title={`${t('aadmin.schools_title')} ${t('aadmin.schools_accent')}`}
        subtitle={t('aadmin.schools_sub')}
        actions={<Button size="sm" icon={Plus} onClick={openAdd}>{t('aadmin.add_school')}</Button>}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={6} className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
          </SkeletonList>
        ) : schools.length === 0 ? (
          <EmptyState
            icon={School}
            title={t('aadmin.none_schools')}
            hint={t('aadmin.none_schools_hint')}
            action={<Button size="sm" icon={Plus} onClick={openAdd}>{t('aadmin.add_school')}</Button>}
          />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr>
                  <Th>{t('aadmin.col_school')}</Th>
                  <Th>{t('aadmin.col_category')}</Th>
                  <Th>{t('aadmin.col_location')}</Th>
                  <Th align="right">{t('aadmin.col_team')}</Th>
                  <Th align="right">{t('admin.col_actions')}</Th>
                </tr>
              </thead>
              <tbody>
                {schools.map((s) => (
                  <tr key={s.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <div className="flex items-center gap-3">
                        <ClubCrest team={s} size="md" />
                        <span className="font-medium text-primary">{s.name}</span>
                        {!s.active && <Badge>{t('aadmin.hidden')}</Badge>}
                      </div>
                    </Td>
                    <Td>{s.category}</Td>
                    <Td className="text-tertiary">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} aria-hidden="true" /> {s.sector || '—'}
                      </span>
                    </Td>
                    <Td align="right">{s._count?.teams ?? 0}</Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/amashuri/school/${s.id}`}
                          className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
                        >
                          {t('aadmin.manage')}
                          <ArrowRight size={13} aria-hidden="true" />
                        </Link>
                        <IconButton icon={Pencil} label={t('aadmin.edit_school')} size="sm" onClick={() => openEdit(s)} />
                        <IconButton
                          icon={s.active ? EyeOff : Eye}
                          label={s.active ? t('aadmin.hide') : t('aadmin.show')}
                          size="sm"
                          onClick={() => toggle.mutate({ id: s.id, active: !s.active })}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? t('aadmin.edit_school') : t('aadmin.add_school')}
        size="sm"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.name.trim()) { setErr(t('aadmin.required')); return; } save.mutate(); }}
          className="space-y-4"
        >
          <Field label={t('aadmin.f_name')}>
            {(p) => <Input {...p} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
          </Field>
          <Field label={t('aadmin.f_code')}>
            {(p) => <Input {...p} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />}
          </Field>
          <Field label={t('aadmin.f_category')}>
            {(p) => (
              <Select
                {...p}
                size="md"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            )}
          </Field>
          <Field label={t('aadmin.f_sector')}>
            {(p) => <Input {...p} value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />}
          </Field>
          {err && <p role="alert" className="text-sm font-semibold text-danger-text">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModal(false)}>{t('aadmin.cancel')}</Button>
            <Button type="submit" size="sm" loading={save.isPending}>{t('aadmin.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AmashuriAdminSchools;
