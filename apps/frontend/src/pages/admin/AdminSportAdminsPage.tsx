import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, X } from 'lucide-react';
import apiClient from '../../api/client';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { Button, IconButton, Input, ErrorState, Skeleton } from '../../components/ui';

/**
 * Super Admin → sport admins.
 *
 * One panel per federation, plus Amashuri Games, which has its own dedicated
 * admin rather than a federation. Assigning and revoking happen in place: the
 * roster is short, and a modal per federation would be a lot of ceremony for
 * typing one email address.
 */

const AssignForm = ({ onAssign, pending }) => {
  const [email, setEmail] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    onAssign(email.trim(), () => setEmail(''));
  };
  return (
    <form onSubmit={submit} className="mt-4 flex gap-2">
      <Input
        type="email"
        aria-label="Administrator email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="admin@email.com"
        className="flex-1 text-sm"
      />
      <Button type="submit" loading={pending} icon={UserPlus} className="shrink-0">
        Assign
      </Button>
    </form>
  );
};

const AdminChip = ({ user, onRevoke }) => (
  <span className="inline-flex items-center gap-2 rounded-pill border border-hairline bg-surface-2 py-1 pl-3 pr-1">
    <span className="text-sm font-medium text-primary">{user.fullName || user.username}</span>
    <span className="text-xs text-tertiary">{user.email}</span>
    {onRevoke && (
      <IconButton
        icon={X}
        size="sm"
        variant="danger"
        className="h-6 w-6"
        label={`Revoke ${user.fullName || user.username}`}
        onClick={() => onRevoke(user)}
      />
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
    <div>
      <PageHeader
        title="Sport admins"
        subtitle="Assign an admin to each sport / federation. They manage only that sport."
      />

      {error && (
        <p role="alert" className="mb-4 rounded-control bg-danger/10 p-3 text-sm font-semibold text-danger-text">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Panel key={i}>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-3 w-24" />
              <Skeleton className="mt-4 h-8 w-56 rounded-pill" />
              <Skeleton className="mt-4 h-tap w-full" />
            </Panel>
          ))}
        </div>
      ) : isError ? (
        <Panel>
          <ErrorState title="Could not load the roster" />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {federations.map((fed) => (
            <Panel
              key={fed.id}
              title={fed.name}
              hint={`${fed.abbreviation || '—'} · ${fed.sport?.name || 'No sport'}`}
            >
              <div className="flex flex-wrap gap-2">
                {fed.admins.length > 0 ? fed.admins.map((a) => (
                  <AdminChip key={a.id} user={a.user} onRevoke={(u) => revoke.mutate({ userId: u.id, federationId: fed.id })} />
                )) : <span className="text-sm text-tertiary">No admin assigned yet</span>}
              </div>
              <AssignForm
                pending={assignFed.isPending}
                onAssign={(email, reset) => assignFed.mutate({ email, federationId: fed.id }, { onSuccess: reset })}
              />
            </Panel>
          ))}

          {/* Amashuri (own section, own admin) */}
          <Panel title="Amashuri Games" hint="Inter-school section · dedicated admin">
            <div className="flex flex-wrap gap-2">
              {amashuriAdmins.length > 0 ? amashuriAdmins.map((u) => (
                <AdminChip key={u.id} user={u} onRevoke={(x) => revoke.mutate({ userId: x.id })} />
              )) : <span className="text-sm text-tertiary">No Amashuri admin assigned yet</span>}
            </div>
            <AssignForm
              pending={assignAmashuri.isPending}
              onAssign={(email, reset) => assignAmashuri.mutate({ email }, { onSuccess: reset })}
            />
          </Panel>
        </div>
      )}
    </div>
  );
};

export default AdminSportAdminsPage;
