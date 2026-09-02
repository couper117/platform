import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { School, Users2, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import {
  getMySchool, downloadMyRosterForm, importMyRoster,
  getMyConsentStatus, downloadMyConsentForm, importMyConsentForm,
} from '../../api/endpoints/amashuri';
import RosterWorkbench from '../../components/amashuri/RosterWorkbench';
import ConsentPanel from '../../components/amashuri/ConsentPanel';
import Skeleton from '../../components/shared/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

/**
 * A school coordinator's home: their school, what is registered so far, and the
 * two-step roster flow — take the form, send it back filled.
 */
const SchoolDashboard = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-school'],
    queryFn: getMySchool,
    retry: false,
  });

  if (isLoading) return <Skeleton type="card" count={3} />;

  if (isError) {
    return (
      <EmptyState
        icon={School}
        title="Your school isn't set up yet"
        hint={(error as any)?.response?.data?.message || 'Ask an Amashuri admin to link your account to a school.'}
      />
    );
  }

  const { school, teams, athletes } = data.data;

  const stats = [
    { label: 'Athletes registered', value: athletes.total, icon: <Users2 size={16} />, tone: 'text-rwanda-blue' },
    { label: 'Documents verified', value: athletes.verified, icon: <ShieldCheck size={16} />, tone: 'text-green' },
    { label: 'Awaiting verification', value: athletes.pending, icon: <Clock size={16} />, tone: 'text-rwanda-yellow' },
    { label: 'Teams', value: teams.length, icon: <School size={16} />, tone: 'text-primary' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">
            {school.name} <span className="text-rwanda-blue">Portal</span>
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">
            School code {school.code || '—'} · Register your athletes for the Amashuri Games
          </p>
        </div>
        <Link
          to="/school/athletes"
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-rwanda-blue hover:underline"
        >
          View all athletes <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-surface-dark2 rounded-2xl border border-surface-3 dark:border-white/5 p-5">
            <span className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest opacity-40 ${s.tone}`}>
              {s.icon}
            </span>
            <p className={`mt-2 text-3xl font-display tabular-nums ${s.tone}`}>{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">{s.label}</p>
          </div>
        ))}
      </div>

      <ConsentPanel
        schoolName={school.name}
        schoolCode={school.code}
        queryKey={['my-school-consent']}
        onLoad={getMyConsentStatus}
        onDownload={downloadMyConsentForm}
        onImport={importMyConsentForm}
        onDone={() => {
          queryClient.invalidateQueries({ queryKey: ['my-school'] });
          queryClient.invalidateQueries({ queryKey: ['my-school-athletes'] });
        }}
      />

      <RosterWorkbench
        schoolName={school.name}
        schoolCode={school.code}
        onDownloadForm={downloadMyRosterForm}
        onImport={importMyRoster}
        onImported={() => {
          queryClient.invalidateQueries({ queryKey: ['my-school'] });
          queryClient.invalidateQueries({ queryKey: ['my-school-athletes'] });
        }}
      />
    </div>
  );
};

export default SchoolDashboard;
