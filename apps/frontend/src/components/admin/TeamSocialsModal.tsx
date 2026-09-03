import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Facebook, Instagram, Youtube, Ticket, ShoppingBag, Globe } from 'lucide-react';
import apiClient from '../../api/client';
import { Modal, Button, Input, Field } from '../ui';

/**
 * A club's links: where it lives on the rest of the internet.
 *
 * These go straight onto a public page as `href`s, so the server drops anything
 * that is not http(s) — a `javascript:` URL here would be an XSS waiting to be
 * clicked by every visitor to that club. This form mirrors that rule so the
 * rejection is visible at the point of entry rather than silent on save.
 *
 * A cleared field removes the link. `website` is a real column on Team and the
 * rest live in the `socials` JSON, which is why they are sent separately.
 */

const NETWORKS = [
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/…' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/…' },
  { key: 'x', label: 'X', icon: Globe, placeholder: 'https://x.com/…' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@…' },
  { key: 'tickets', label: 'Tickets', icon: Ticket, placeholder: 'https://…' },
  { key: 'store', label: 'Store', icon: ShoppingBag, placeholder: 'https://…' },
];

const isUrl = (v: string) => !v || /^https?:\/\//i.test(v.trim());

const TeamSocialsModal = ({ team, open, onClose }: { team: any; open: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [website, setWebsite] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !team) return;
    setWebsite(team.website || '');
    const s = team.socials || {};
    setValues(Object.fromEntries(NETWORKS.map((n) => [n.key, s[n.key] || ''])));
    setError('');
  }, [open, team]);

  const save = useMutation({
    mutationFn: async () => {
      // multipart, because the same endpoint also takes a logo upload; socials
      // travel as JSON in one field so the object survives the encoding.
      const fd = new FormData();
      fd.append('website', website.trim());
      fd.append('socials', JSON.stringify(values));
      const { data } = await apiClient.put(`/teams/${team.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-detail', String(team.id)] });
      onClose();
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Could not save these links'),
  });

  if (!team) return null;

  const invalid = [website, ...Object.values(values)].some((v) => !isUrl(v));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${team.name} — links`}
      description="These appear on the club's public page. Leave a field blank to remove that link."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={save.isPending} disabled={invalid} onClick={() => { setError(''); save.mutate(); }}>
            Save links
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field
          label="Official website"
          error={isUrl(website) ? undefined : 'Must start with http:// or https://'}
        >
          {(p: any) => (
            <Input {...p} value={website} placeholder="https://…" onChange={(e: any) => setWebsite(e.target.value)} />
          )}
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {NETWORKS.map((n) => (
            <Field
              key={n.key}
              label={n.label}
              error={isUrl(values[n.key] ?? '') ? undefined : 'Must start with http:// or https://'}
            >
              {(p: any) => (
                <Input
                  {...p}
                  value={values[n.key] ?? ''}
                  placeholder={n.placeholder}
                  onChange={(e: any) => setValues((v) => ({ ...v, [n.key]: e.target.value }))}
                />
              )}
            </Field>
          ))}
        </div>

        {error && (
          <p role="alert" className="rounded-control bg-danger/10 px-3 py-2 text-sm text-danger-text">{error}</p>
        )}
      </div>
    </Modal>
  );
};

export default TeamSocialsModal;
