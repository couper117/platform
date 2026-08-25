import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { School, Users2, KeyRound, Plus, Loader2, ChevronLeft, ShieldCheck, Clock, UserX, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import {
  getSchool, getAkcAthletes, downloadRosterForm, importAkcPlayers,
  getSchoolCoordinators, createSchoolCoordinator, setCoordinatorActive,
  getSchoolConsentStatus, downloadConsentForm, importConsentForm,
} from '../../api/endpoints/amashuri';
import RosterWorkbench from '../../components/amashuri/RosterWorkbench';
import ConsentPanel from '../../components/amashuri/ConsentPanel';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import { Skeleton, EmptyState } from '../../components/ui';
import useUiStore from '../../store/uiStore';

const emptyCoordinator = { username: '', fullName: '', email: '', phone: '', password: '' };

/**
 * One school, everything about it: its teams, its athletes, the registration form
 * to hand over, and the logins that let the school submit its own roster.
 */
const AmashuriAdminSchoolDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [tab, setTab] = useState('roster');
  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyCoordinator);

  const { data: schoolRes, isLoading } = useQuery({
    queryKey: ['akc-school', id],
    queryFn: () => getSchool(id),
    retry: false,
  });
  const school = schoolRes?.data;

  const { data: athletesRes } = useQuery({
    queryKey: ['akc-school-athletes', id],
    queryFn: () => getAkcAthletes({ schoolId: id }),
  });
  const athletes = athletesRes?.data || [];

  const { data: coordRes } = useQuery({
    queryKey: ['akc-school-coordinators', id],
    queryFn: () => getSchoolCoordinators(id),
  });
  const coordinators = coordRes?.data || [];

  const refreshCoordinators = () =>
    queryClient.invalidateQueries({ queryKey: ['akc-school-coordinators', id] });

  const createCoordinator = useMutation({
    mutationFn: () => createSchoolCoordinator(id, form),
    onSuccess: () => {
      setModalOpen(false);
      setForm(emptyCoordinator);
      refreshCoordinators();
      pushToast('Coordinator login created. Share the username and password with the school.', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Could not create that login'),
  });

  const toggleCoordinator = useMutation({
    mutationFn: ({ userId, active }: any) => setCoordinatorActive(userId, active),
    onSuccess: refreshCoordinators,
    onError: (err: any) => pushToast(err.response?.data?.message || 'Could not update that login'),
  });

  if (isLoading) return <Skeleton type="card" count={3} />;
  if (!school) {
    return <EmptyState icon={School} title="School not found" hint="It may have been removed." />;
  }

  const verified = athletes.filter((a) => a.docVerified).length;
  const tabs = [
    { id: 'roster', label: 'Registration', icon: <School size={15} /> },
    { id: 'athletes', label: `Athletes (${athletes.length})`, icon: <Users2 size={15} /> },
    { id: 'access', label: `School access (${coordinators.length})`, icon: <KeyRound size={15} /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Link to="/admin/amashuri/schools" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100">
        <ChevronLeft size={13} /> All schools
      </Link>

      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">
          {school.name} <span className="text-rwanda-blue">{school.code || ''}</span>
        </h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">
          {school.category} · {school.sector || 'Sector not set'} · {school.teams?.length || 0} team(s) · {athletes.length} athlete(s), {verified} verified
        </p>
      </div>

      <div className="flex flex-wrap gap-6 border-b border-surface-3 dark:border-white/5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${
              tab === t.id ? 'border-rwanda-blue text-rwanda-blue' : 'border-transparent opacity-40 hover:opacity-100'
            }`}
          >
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'roster' && (
        <div className="space-y-6">
          <ConsentPanel
            schoolName={school.name}
            schoolCode={school.code}
            queryKey={['akc-school-consent', id]}
            onLoad={() => getSchoolConsentStatus(id)}
            onDownload={() => downloadConsentForm(id)}
            onImport={importConsentForm}
            onDone={() => queryClient.invalidateQueries({ queryKey: ['akc-school-athletes', id] })}
          />
          <RosterWorkbench
            schoolName={school.name}
            schoolCode={school.code}
            onDownloadForm={(params) => downloadRosterForm(id, params)}
            onImport={importAkcPlayers}
            onImported={() => {
              queryClient.invalidateQueries({ queryKey: ['akc-school-athletes', id] });
              queryClient.invalidateQueries({ queryKey: ['akc-school', id] });
            }}
          />
        </div>
      )}

      {tab === 'athletes' && (
        athletes.length === 0 ? (
          <EmptyState icon={Users2} title="No athletes registered" hint="Use the Registration tab to send this school a form." />
        ) : (
          <AdminTable headers={['Athlete', 'Class', 'Student code', 'Born', 'Guardian', 'Status']}>
            {athletes.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary">{a.fullName}</span>
                    <span className="text-[10px] uppercase tracking-widest opacity-40">
                      {a.gender} · {a.ageCategory}{a.nationality && a.nationality !== 'Rwandan' ? ` · ${a.nationality}` : ''}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-secondary">{a.schoolClass || '—'}</td>
                <td className="px-6 py-4 font-mono text-[11px] opacity-50">{a.studentCode || '—'}</td>
                <td className="px-6 py-4 text-sm tabular-nums text-secondary">{a.dob ? format(new Date(a.dob), 'd MMM yyyy') : '—'}</td>
                <td className="px-6 py-4 font-mono text-[11px] opacity-60">{a.guardianPhone || '—'}</td>
                <td className="px-6 py-4">
                  {a.docVerified
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green"><ShieldCheck size={11} /> Verified</span>
                    : <span className="inline-flex items-center gap-1 rounded-full bg-rwanda-yellow/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rwanda-yellow"><Clock size={11} /> Pending</span>}
                </td>
              </tr>
            ))}
          </AdminTable>
        )
      )}

      {tab === 'access' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs opacity-60 max-w-xl leading-relaxed">
              A coordinator login lets this school download its own form and submit its roster directly.
              The account is bound to {school.name} — it can never see or register athletes for another school.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="flex shrink-0 items-center gap-2 bg-rwanda-blue text-white px-5 py-2.5 rounded-xl font-display text-sm uppercase tracking-widest hover:brightness-110 transition-all"
            >
              <Plus size={15} /><span>Add login</span>
            </button>
          </div>

          {coordinators.length === 0 ? (
            <EmptyState icon={KeyRound} title="No school login yet" hint="Create one so this school can submit its own roster." />
          ) : (
            <AdminTable headers={['Coordinator', 'Username', 'Contact', 'Last login', 'Status', 'Actions']}>
              {coordinators.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                  <td className="px-6 py-4 text-sm font-semibold text-primary">{c.fullName}</td>
                  <td className="px-6 py-4 font-mono text-[11px] opacity-60">{c.username}</td>
                  <td className="px-6 py-4 text-[11px] opacity-60">{c.email || c.phone || '—'}</td>
                  <td className="px-6 py-4 text-[11px] tabular-nums opacity-60">
                    {c.lastLogin ? format(new Date(c.lastLogin), 'd MMM yyyy') : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      c.active ? 'bg-green/10 text-green' : 'bg-surface-2 text-tertiary'
                    }`}>{c.active ? 'Active' : 'Suspended'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleCoordinator.mutate({ userId: c.id, active: !c.active })}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rwanda-blue hover:underline"
                    >
                      {c.active ? <><UserX size={12} /> Suspend</> : <><UserCheck size={12} /> Restore</>}
                    </button>
                  </td>
                </tr>
              ))}
            </AdminTable>
          )}
        </div>
      )}

      <AdminModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={`School login — ${school.name}`}>
        <div className="space-y-5">
          {[
            ['fullName', 'Coordinator name', 'text', 'e.g. Marie Uwimana'],
            ['username', 'Username', 'text', 'e.g. esb.coord'],
            ['email', 'Email (optional)', 'email', 'coordinator@school.rw'],
            ['phone', 'Phone (optional)', 'text', '0788123456'],
            ['password', 'Temporary password', 'password', 'At least 8 characters'],
          ].map(([key, label, type, placeholder]: any) => (
            <label key={key} className="block space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">{label}</span>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-3.5 rounded-xl outline-none"
              />
            </label>
          ))}
          <p className="text-[11px] opacity-50 leading-relaxed">
            Share these details with the school directly. Ask them to change the password after their first sign-in.
          </p>
          <button
            onClick={() => createCoordinator.mutate()}
            disabled={createCoordinator.isPending || !form.username.trim() || !form.fullName.trim() || form.password.length < 8}
            className="w-full bg-rwanda-blue text-white font-display text-lg uppercase tracking-widest py-3.5 rounded-xl hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {createCoordinator.isPending ? <Loader2 className="animate-spin mx-auto" /> : <span>Create login</span>}
          </button>
        </div>
      </AdminModal>
    </div>
  );
};

export default AmashuriAdminSchoolDetail;
