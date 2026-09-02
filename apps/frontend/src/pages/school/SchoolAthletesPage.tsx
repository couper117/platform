import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users2, ShieldCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { getMySchoolAthletes } from '../../api/endpoints/amashuri';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

const FILTERS = [
  { key: 'all', label: 'All', params: {} },
  { key: 'pending', label: 'Awaiting verification', params: { verified: 'false' } },
  { key: 'verified', label: 'Verified', params: { verified: 'true' } },
];

/** Every athlete this school has registered. Read-only: verification is the admin's call. */
const SchoolAthletesPage = () => {
  const [filter, setFilter] = useState('all');
  const active = FILTERS.find((f) => f.key === filter);

  const { data, isLoading } = useQuery({
    queryKey: ['my-school-athletes', filter],
    queryFn: () => getMySchoolAthletes(active.params),
  });
  const athletes = data?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">
          Our <span className="text-rwanda-blue">Athletes</span>
        </h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">
          Everyone registered from this school
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
              filter === f.key
                ? 'bg-rwanda-blue text-white'
                : 'bg-surface-2 dark:bg-white/5 opacity-50 hover:opacity-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : athletes.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No athletes yet"
          hint="Download a registration form from the dashboard, fill it in, and upload it."
        />
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
              <td className="px-6 py-4 text-sm tabular-nums text-secondary">
                {a.dob ? format(new Date(a.dob), 'd MMM yyyy') : '—'}
              </td>
              <td className="px-6 py-4 font-mono text-[11px] opacity-60">{a.guardianPhone || '—'}</td>
              <td className="px-6 py-4">
                {a.docVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green">
                    <ShieldCheck size={11} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rwanda-yellow/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rwanda-yellow">
                    <Clock size={11} /> Pending
                  </span>
                )}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
};

export default SchoolAthletesPage;
