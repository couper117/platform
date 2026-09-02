import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Trophy, Plus, Edit2, Trash2, Loader2, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEnumLabel } from '../../i18n/enums';
import { useDateFormat } from '../../i18n/dateLocale';
import {
  getChampionships, createChampionship, updateChampionship, deleteChampionship,
} from '../../api/endpoints/amashuri';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';

const LEVELS = ['CELL', 'SECTOR', 'DISTRICT', 'PROVINCE', 'NATIONAL'];
const STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];

const statusStyle = (s) => {
  switch (s) {
    case 'ONGOING': return 'bg-green/5 text-green border-green/10';
    case 'COMPLETED': return 'bg-rwanda-blue/5 text-rwanda-blue border-rwanda-blue/10';
    case 'CANCELLED': return 'bg-red/5 text-red border-red/10';
    default: return 'bg-gold/5 text-gold border-gold/10';
  }
};

// Format an ISO date for an <input type="date"> default value.
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const inputCls = 'w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl focus:border-rwanda-blue outline-none';
const labelCls = 'text-[10px] uppercase font-bold tracking-widest opacity-40';

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
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">
            {t('admin.championships.title')} <span className="text-rwanda-blue">{t('admin.championships.title_accent')}</span>
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">
            {t('admin.championships.subtitle')}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-rwanda-blue text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-rwanda-blue/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus size={20} />
          <span>{t('admin.championships.new')}</span>
        </button>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : championships.length > 0 ? (
        <AdminTable headers={[t('admin.championships.col_name'), t('admin.championships.col_level'), t('admin.championships.col_window'), t('nav.fixtures'), t('admin.col_status'), t('admin.col_actions')]}>
          {championships.map((c) => (
            <tr key={c.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-rwanda-blue/10 text-rwanda-blue flex items-center justify-center shrink-0">
                    <Trophy size={16} />
                  </span>
                  <div>
                    <span className="block font-bold text-sm uppercase tracking-tight">{c.name}</span>
                    {c.edition && <span className="block text-[10px] opacity-40 uppercase tracking-widest">{c.edition}</span>}
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">
                <span className="inline-flex items-center gap-1"><Layers size={12} className="text-rwanda-blue" />{enumLabel('level', c.level)}</span>
              </td>
              <td className="px-6 py-5 text-[11px] opacity-50">
                {formatDate(c.startDate, 'dd MMM yy') || '—'}
                {c.endDate ? ` – ${formatDate(c.endDate, 'dd MMM yy')}` : ''}
              </td>
              <td className="px-6 py-5 text-sm tabular-nums">{c._count?.fixtures ?? 0}</td>
              <td className="px-6 py-5">
                <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase ${statusStyle(c.status)}`}>{enumLabel('championship_status', c.status)}</span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(c)} className="p-2 hover:bg-rwanda-blue/10 text-rwanda-blue rounded-lg transition-colors cursor-pointer" title={t('common.edit')}>
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm(t('admin.championships.delete_confirm', { name: c.name }))) deleteMutation.mutate(c.id); }}
                    className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors cursor-pointer"
                    title={t('common.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      ) : (
        <div className="py-24 text-center border-2 border-dashed border-surface-3 dark:border-white/5 rounded-3xl space-y-4">
          <Trophy size={48} className="mx-auto text-rwanda-blue/40" />
          <p className="font-display text-2xl uppercase tracking-widest opacity-40">{t('amashuri.championships_page.none')}</p>
          <button onClick={openCreate} className="text-[11px] font-bold uppercase tracking-widest text-rwanda-blue hover:underline cursor-pointer">
            {t('admin.championships.create_first')}
          </button>
        </div>
      )}

      {/* Create / Edit modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditing(null); }}
        title={editing ? t('admin.championships.modal_edit') : t('admin.championships.new')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className={labelCls}>{t('admin.championships.name_label')}</label>
              <input {...register('name', { required: true })} className={inputCls} placeholder={t('admin.championships.name_placeholder')} />
              {errors.name && <span className="text-[10px] text-red uppercase tracking-widest">{t('admin.championships.name_required')}</span>}
            </div>

            <div className="space-y-2">
              <label className={labelCls}>{t('admin.championships.edition')}</label>
              <input {...register('edition')} className={inputCls} placeholder={t('admin.championships.edition_placeholder')} />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>{t('admin.fixtures.col_venue')}</label>
              <input {...register('venue')} className={inputCls} placeholder={t('admin.championships.venue_placeholder')} />
            </div>

            <div className="space-y-2">
              <label className={labelCls}>{t('admin.championships.col_level')}</label>
              <select {...register('level')} className={inputCls}>
                {LEVELS.map((l) => <option key={l} value={l}>{enumLabel('level', l)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelCls}>{t('admin.col_status')}</label>
              <select {...register('status')} className={inputCls}>
                {STATUSES.map((s) => <option key={s} value={s}>{enumLabel('championship_status', s)}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>{t('admin.leagues.gender')}</label>
              <select {...register('gender')} className={inputCls}>
                <option value="mixed">{t('enums.gender.MIXED')}</option>
                <option value="male">{t('enums.gender.BOYS')}</option>
                <option value="female">{t('enums.gender.GIRLS')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelCls}>{t('admin.championships.age_category')}</label>
              <input {...register('ageCategory')} className={inputCls} placeholder={t('admin.championships.age_placeholder')} />
            </div>

            <div className="space-y-2">
              <label className={labelCls}>{t('admin.championships.start_date')}</label>
              <input type="date" {...register('startDate')} className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>{t('admin.championships.end_date')}</label>
              <input type="date" {...register('endDate')} className={inputCls} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className={labelCls}>{t('admin.championships.description')}</label>
              <textarea {...register('description')} rows={3} className={inputCls} placeholder={t('admin.championships.description_placeholder')} />
            </div>
          </div>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full bg-rwanda-blue text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
          >
            {saveMutation.isPending ? <Loader2 className="animate-spin" /> : <span>{editing ? t('common.save_changes') : t('admin.championships.create')}</span>}
          </button>
        </form>
      </AdminModal>
    </div>
  );
};

export default AdminChampionshipsPage;
