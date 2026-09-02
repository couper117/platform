import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users, Pencil, EyeOff, Eye } from 'lucide-react';
import { getAkcTeams, updateAkcTeam, setAkcTeamActive } from '../../api/endpoints/amashuri';
import ClubCrest from '../../components/ui/ClubCrest';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  Badge, Button, Field, IconButton, Input, Modal, Select,
  Skeleton, SkeletonList, EmptyState,
} from '../../components/ui';

const GENDERS = ['MALE', 'FEMALE', 'MIXED', 'INCLUSIVE'];
const AGES = ['U13', 'U15', 'U17', 'U20', 'OPEN'];

const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

/** Amashuri Admin → Teams: edit and hide teams registered by schools. */
const AmashuriAdminTeams = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ coachName: '', gender: 'MALE', ageCategory: 'U17' });

  const { data, isLoading } = useQuery({ queryKey: ['aa-teams'], queryFn: () => getAkcTeams() });
  const teams = data?.data || [];
  const refresh = () => qc.invalidateQueries({ queryKey: ['aa-teams'] });

  const save = useMutation({ mutationFn: () => updateAkcTeam(editing.id, form), onSuccess: () => { setEditing(null); refresh(); } });
  const toggle = useMutation({ mutationFn: ({ id, active }: any) => setAkcTeamActive(id, active), onSuccess: refresh });

  const openEdit = (tm) => { setEditing(tm); setForm({ coachName: tm.coachName || '', gender: tm.gender || 'MALE', ageCategory: tm.ageCategory || 'U17' }); };

  return (
    <div>
      <PageHeader
        title={`${t('aadmin.teams_title')} ${t('aadmin.teams_accent')}`}
        subtitle={t('aadmin.teams_sub')}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={5} className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
          </SkeletonList>
        ) : teams.length === 0 ? (
          <EmptyState icon={Users} title={t('aadmin.none_teams')} hint={t('aadmin.none_teams_hint')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr>
                  <Th>{t('aadmin.col_team')}</Th>
                  <Th>{t('aadmin.col_category')}</Th>
                  <Th>{t('aadmin.col_coach')}</Th>
                  <Th align="right">{t('admin.col_actions')}</Th>
                </tr>
              </thead>
              <tbody>
                {teams.map((tm) => (
                  <tr key={tm.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <div className="flex items-center gap-3">
                        <ClubCrest team={tm.school} size="md" />
                        <span className="font-medium text-primary">{tm.school?.name}</span>
                        {!tm.active && <Badge>{t('aadmin.hidden')}</Badge>}
                      </div>
                    </Td>
                    <Td>{tm.gender} · {tm.ageCategory}</Td>
                    <Td>{tm.coachName || '—'}</Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton icon={Pencil} label={t('aadmin.edit_team')} size="sm" onClick={() => openEdit(tm)} />
                        <IconButton
                          icon={tm.active ? EyeOff : Eye}
                          label={tm.active ? t('aadmin.hide') : t('aadmin.show')}
                          size="sm"
                          onClick={() => toggle.mutate({ id: tm.id, active: !tm.active })}
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title={t('aadmin.edit_team')} size="sm">
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
          <Field label={t('aadmin.f_coach')}>
            {(p) => <Input {...p} value={form.coachName} onChange={(e) => setForm({ ...form, coachName: e.target.value })} />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('aadmin.f_gender')}>
              {(p) => (
                <Select
                  {...p}
                  size="md"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  options={toOptions(GENDERS)}
                />
              )}
            </Field>
            <Field label={t('aadmin.f_age')}>
              {(p) => (
                <Select
                  {...p}
                  size="md"
                  value={form.ageCategory}
                  onChange={(e) => setForm({ ...form, ageCategory: e.target.value })}
                  options={toOptions(AGES)}
                />
              )}
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(null)}>{t('aadmin.cancel')}</Button>
            <Button type="submit" size="sm" loading={save.isPending}>{t('aadmin.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AmashuriAdminTeams;
