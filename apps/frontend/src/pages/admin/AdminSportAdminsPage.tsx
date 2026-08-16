import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, UserPlus, X, GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import apiClient from '../../api/client';
import Skeleton from '../../components/shared/Skeleton';

const AssignForm = ({ onAssign, pending }) => {
  const [email, setEmail] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    onAssign(email.trim(), () => setEmail(''));
  };
  return (
    <form onSubmit={submit} className="flex gap-2 mt-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="admin@email.com"
        className="flex-1 bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:border-red outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-red text-white px-4 py-2 rounded-lg font-display text-xs uppercase tracking-widest hover:bg-red-dark transition-colors flex items-center gap-1.5 disabled:opacity-50"
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Assign
      </button>
    </form>
  );
};

const AdminChip = ({ user, onRevoke }) => (
  <span className="inline-flex items-center gap-2 bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 rounded-full pl-3 pr-1.5 py-1">
    <span className="text-xs font-bold">{user.fullName || user.username}</span>
    <span className="text-[10px] opacity-40">{user.email}</span>
    {onRevoke && (
      <button onClick={() => onRevoke(user)} title="Revoke" className="w-5 h-5 rounded-full hover:bg-red/10 text-red flex items-center justify-center">
        <X size={12} />
      </button>
    )}
  </span>
);

const AdminSportAdminsPage = () => {
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-roster'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/roster');
      return data.data;
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-roster'] });
  const handleErr = (e) => setError(e.response?.data?.message || 'Something went wrong');

  const assignFed = useMutation({
    mutationFn: ({ email, federationId }: any) => apiClient.post('/admin/assign-federation-admin', { email, federationId }),
    onSuccess: () => { setError(''); refresh(); },
    onError: handleErr,
  });
  const assignAmashuri = useMutation({
    mutationFn: ({ email }: any) => apiClient.post('/admin/assign-amashuri-admin', { email }),
    onSuccess: () => { setError(''); refresh(); },
    onError: handleErr,
  });
  const revoke = useMutation({
    mutationFn: (payload: any) => apiClient.post('/admin/revoke-admin', payload),
    onSuccess: () => { setError(''); refresh(); },
    onError: handleErr,
  });

  const federations = data?.federations || [];
  const amashuriAdmins = data?.amashuriAdmins || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">Sport <span className="text-red">Admins</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Assign an admin to each sport / federation. They manage only that sport.</p>
      </div>

      {error && (
        <div className="bg-red/10 border border-red/20 p-3 rounded-xl flex items-center gap-2 text-red text-xs font-bold uppercase tracking-wider">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : isError ? (
        <div className="py-16 text-center opacity-50 font-display uppercase tracking-widest">Couldn't load roster</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {federations.map((fed) => (
            <div key={fed.id} className="bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/5 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-11 h-11 rounded-xl bg-red/10 text-red flex items-center justify-center"><ShieldCheck size={18} /></span>
                <div>
                  <h3 className="font-display text-xl uppercase tracking-tight leading-none">{fed.name}</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1">{fed.abbreviation || 'â€”'} Â· {fed.sport?.name || 'No sport'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {fed.admins.length > 0 ? fed.admins.map((a) => (
                  <AdminChip key={a.id} user={a.user} onRevoke={(u) => revoke.mutate({ userId: u.id, federationId: fed.id })} />
                )) : <span className="text-xs opacity-40 italic">No admin assigned yet</span>}
              </div>
              <AssignForm
                pending={assignFed.isPending}
                onAssign={(email, reset) => assignFed.mutate({ email, federationId: fed.id }, { onSuccess: reset })}
              />
            </div>
          ))}

          {/* Amashuri (own section, own admin) */}
          <div className="bg-white dark:bg-surface-dark2 border-2 border-red/30 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-11 h-11 rounded-xl bg-red text-white flex items-center justify-center"><GraduationCap size={18} /></span>
              <div>
                <h3 className="font-display text-xl uppercase tracking-tight leading-none">Amashuri Games</h3>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1">Inter-school section Â· dedicated admin</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {amashuriAdmins.length > 0 ? amashuriAdmins.map((u) => (
                <AdminChip key={u.id} user={u} onRevoke={(x) => revoke.mutate({ userId: x.id })} />
              )) : <span className="text-xs opacity-40 italic">No Amashuri admin assigned yet</span>}
            </div>
            <AssignForm
              pending={assignAmashuri.isPending}
              onAssign={(email, reset) => assignAmashuri.mutate({ email }, { onSuccess: reset })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSportAdminsPage;
