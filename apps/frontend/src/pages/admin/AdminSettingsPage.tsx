import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Shield } from 'lucide-react';
import apiClient from '../../api/client';
import { Field, Input, Button, Skeleton } from '../../components/ui';
import { PageHeader, Panel } from '../../components/admin/AdminUI';

/**
 * Super Admin → System configuration. Platform branding, contact details and the
 * competition rules that apply across every federation.
 *
 * Presentation only: the /settings and /settings/all queries, the { skey, sval }
 * payload shape and the single save-everything mutation are exactly as they were.
 */

const AdminSettingsPage = () => {
  const queryClient = useQueryClient();
  const [settingsData, setSettingsData] = useState<any>({});
  const [rules, setRules] = useState([]); // [{ skey, sval, label }]

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get('/settings');
      setSettingsData(data.data);
      return data.data;
    },
  });

  // Competition/eligibility rules (private settings, grp = 'rules').
  useQuery({
    queryKey: ['admin-rules'],
    queryFn: async () => {
      const { data } = await apiClient.get('/settings/all');
      const ruleRows = (data.data || []).filter((s) => s.grp === 'rules');
      setRules(ruleRows.map((r) => ({ skey: r.skey, sval: r.sval, label: r.label || r.skey })));
      return ruleRows;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      // Backend expects array of { skey, sval }
      const payload = Object.entries(updates).map(([skey, sval]) => ({ skey, sval }));
      await apiClient.put('/settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] });
      alert('System settings updated successfully!');
    }
  });

  const handleChange = (key, val) => {
    setSettingsData(prev => ({ ...prev, [key]: val }));
  };

  const handleRuleChange = (skey, val) => {
    setRules(prev => prev.map(r => r.skey === skey ? { ...r, sval: val } : r));
  };

  const saveAll = () => {
    const ruleMap = Object.fromEntries(rules.map(r => [r.skey, r.sval]));
    updateMutation.mutate({ ...settingsData, ...ruleMap });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="System configuration" subtitle="Manage global platform settings and branding." />
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <Panel key={i}>
                <Skeleton className="h-4 w-32" />
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-tap w-full rounded-input" />
                  <Skeleton className="h-tap w-full rounded-input" />
                </div>
              </Panel>
            ))}
          </div>
          <Panel>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-16 w-full" />
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="System configuration"
        subtitle="Manage global platform settings and branding."
        actions={
          <Button
            size="sm"
            icon={Save}
            loading={updateMutation.isPending}
            disabled={updateMutation.isPending}
            onClick={saveAll}
          >
            Save all changes
          </Button>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel title="Branding">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Platform name">
                {({ invalid, ...p }) => (
                  <Input
                    {...p}
                    value={settingsData.site_name || ''}
                    onChange={(e) => handleChange('site_name', e.target.value)}
                  />
                )}
              </Field>
              <Field label="Tagline">
                {({ invalid, ...p }) => (
                  <Input
                    {...p}
                    value={settingsData.hero_title || ''}
                    onChange={(e) => handleChange('hero_title', e.target.value)}
                  />
                )}
              </Field>
            </div>
          </Panel>

          <Panel title="Contact info">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Official email">
                {({ invalid, ...p }) => (
                  <Input
                    {...p}
                    value={settingsData.contact_email || ''}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                  />
                )}
              </Field>
            </div>
          </Panel>

          <Panel
            title="Competition rules"
            hint="Eligibility, discipline and points rules applied across all federations. Changes take effect immediately."
          >
            {rules.length === 0 ? (
              <p className="text-sm text-tertiary">Loading rules…</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {rules.map((r) => (
                  <Field key={r.skey} label={r.label}>
                    {({ invalid, ...p }) => (
                      <Input
                        {...p}
                        type="number"
                        className="tabular-nums"
                        value={r.sval ?? ''}
                        onChange={(e) => handleRuleChange(r.skey, e.target.value)}
                      />
                    )}
                  </Field>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* The one caveat an operator needs before they press save. It is a note,
            not an alarm, so it sits on the standard surface rather than a black
            slab — nothing on this screen is more urgent than anything else. */}
        <Panel title="Admin note">
          <div className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-tint text-brand-text">
              <Shield size={15} aria-hidden="true" />
            </span>
            <p className="text-sm leading-relaxed text-secondary">
              Changes made here affect the public-facing site instantly. Please verify all
              information before saving, especially contact emails and platform branding.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
