import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserSquare2, Plus, EyeOff, Eye } from 'lucide-react';
import { getAkcAthletes, getAkcTeams, createAkcAthlete, setAkcAthleteActive } from '../../api/endpoints/amashuri';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  Avatar, Badge, Button, Field, IconButton, Input, Modal, Select, StatusPill,
  Skeleton, SkeletonList, EmptyState,
} from '../../components/ui';

const empty = { teamId: '', fullName: '', gender: 'MALE', ageCategory: 'U17', position: '', jersey: '', idNumber: '' };

/** Amashuri Admin → Athletes: register, hide and verify student athletes. */
const AmashuriAdminAthletes = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['aa-athletes'], queryFn: () => getAkcAthletes() });
  const { data: teamsRes } = useQuery({ queryKey: ['aa-teams'], queryFn: () => getAkcTeams() });
  const athletes = data?.data || [];
  const teams = teamsRes?.data || [];
  const refresh = () => qc.invalidateQueries({ queryKey: ['aa-athletes'] });

  const create = useMutation({
    mutationFn: () => createAkcAthlete(form),
    onSuccess: () => { setModal(false); refresh(); },
    onError: (e: any) => setErr(e.response?.data?.message || 'Failed'),
  });
  const toggle = useMutation({ mutationFn: ({ id, active }: any) => setAkcAthleteActive(id, active), onSuccess: refresh });

  const openAdd = () => { setForm(empty); setErr(''); setModal(true); };

  const teamOptions = teams.map((tm) => ({
    value: tm.id,
    label: `${tm.school?.name} · ${tm.gender} ${tm.ageCategory}`,
  }));

  return (
    <div>
      <PageHeader
        title={`${t('aadmin.athletes_title')} ${t('aadmin.athletes_accent')}`}
        subtitle={t('aadmin.athletes_sub')}
        actions={<Button size="sm" icon={Plus} onClick={openAdd}>{t('aadmin.add_athlete')}</Button>}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={6} className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
          </SkeletonList>
        ) : athletes.length === 0 ? (
          <EmptyState icon={UserSquare2} title={t('aadmin.none_athletes')} hint={t('aadmin.none_athletes_hint')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr>
                  <Th>{t('aadmin.col_athlete')}</Th>
                  <Th>{t('aadmin.col_team')}</Th>
                  <Th>{t('aadmin.col_category')}</Th>
                  <Th>{t('aadmin.col_docs')}</Th>
                  <Th align="right">{t('admin.col_actions')}</Th>
                </tr>
              </thead>
              <tbody>
                {athletes.map((a) => (
                  <tr key={a.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={a.fullName} size="sm" />
                        <span className="font-medium text-primary">{a.fullName}</span>
                        {!a.active && <Badge>{t('aadmin.hidden')}</Badge>}
                      </div>
                    </Td>
                    <Td>{a.team?.school?.name}</Td>
                    <Td className="text-tertiary">{a.gender} · {a.ageCategory}</Td>
                    <Td>
                      <StatusPill
                        status={a.docVerified ? 'VERIFIED' : 'PENDING'}
                        label={a.docVerified ? t('aadmin.verified') : t('aadmin.unverified')}
                      />
                    </Td>
                    <Td align="right">
                      <IconButton
                        icon={a.active ? EyeOff : Eye}
                        label={a.active ? t('aadmin.hide') : t('aadmin.show')}
                        size="sm"
                        onClick={() => toggle.mutate({ id: a.id, active: !a.active })}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      <Modal open={modal} onClose={() => setModal(false)} title={t('aadmin.add_athlete')} size="sm">
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.fullName.trim() || !form.teamId) { setErr(t('aadmin.required')); return; } create.mutate(); }}
          className="space-y-4"
        >
          <Field label={t('aadmin.f_name')}>
            {(p) => <Input {...p} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />}
          </Field>
          <Field label={t('aadmin.f_school')}>
            {(p) => (
              <Select
                {...p}
                size="md"
                value={form.teamId}
                onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                placeholder="—"
                options={teamOptions}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('aadmin.f_position')}>
              {(p) => <Input {...p} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />}
            </Field>
            <Field label={t('aadmin.f_id')}>
              {(p) => <Input {...p} value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} />}
            </Field>
          </div>
          {err && <p role="alert" className="text-sm font-semibold text-danger-text">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModal(false)}>{t('aadmin.cancel')}</Button>
            <Button type="submit" size="sm" loading={create.isPending}>{t('aadmin.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AmashuriAdminAthletes;
