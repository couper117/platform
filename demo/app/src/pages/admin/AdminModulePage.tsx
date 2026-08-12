import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutTemplate, Image as ImageIcon, Users2, KeyRound, Activity, Database, Server, Cloud, Mail, Radio,
  CheckCircle2, Copy, Eye, GripVertical, Check, X,
} from 'lucide-react';
import apiClient from '../../api/client';

/**
 * One page component for the Super Admin modules that are governance/content
 * scaffolds rather than operational data: Website Content, Media Library, Users,
 * Roles & Permissions, System Health. Keeps the sidebar fully navigable and
 * expresses the Super Admin's remit (platform + content, not sports operations).
 * Read-only / non-persistent in the demo; wires to real endpoints in the port.
 */

const MODULES = {
  '/admin/content': { title: 'Website Content', icon: LayoutTemplate, desc: 'Manage homepage sections, banners and featured content — presentation only, never operational sports data.', kind: 'content' },
  '/admin/media': { title: 'Media Library', icon: ImageIcon, desc: 'Images and media used across the platform.', kind: 'media' },
  '/admin/users': { title: 'Users', icon: Users2, desc: 'Platform users and administrators.', kind: 'users' },
  '/admin/roles': { title: 'Roles & Permissions', icon: KeyRound, desc: 'The Super Admin permission matrix — oversight and content, not operational management.', kind: 'roles' },
  '/admin/system-health': { title: 'System Health', icon: Activity, desc: 'Live status of core platform services.', kind: 'health' },
};

const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-surface-3 dark:border-white/10 bg-white dark:bg-surface-dark2 ${className}`}>{children}</div>
);

/* ── Website Content: enable/reorder homepage sections (visual, non-persistent) ── */
const ContentModule = () => {
  const [sections, setSections] = useState([
    { id: 'hero', label: 'Hero Banner', on: true },
    { id: 'live', label: 'Live & Today', on: true },
    { id: 'sports', label: 'Popular Sports', on: true },
    { id: 'matches', label: 'Upcoming Matches', on: true },
    { id: 'championships', label: 'Championships', on: false },
    { id: 'ads', label: 'Advertisement Slot', on: true },
    { id: 'cta', label: 'Register CTA', on: true },
  ]);
  const toggle = (id) => setSections((s) => s.map((x) => (x.id === id ? { ...x, on: !x.on } : x)));
  return (
    <Card className="p-5">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Homepage sections · drag to reorder</p>
      <ul className="space-y-2">
        {sections.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-xl border border-surface-3 dark:border-white/10 bg-surface-2 dark:bg-white/5 p-3">
            <GripVertical size={16} className="shrink-0 cursor-grab opacity-30" />
            <span className="flex-1 text-sm font-semibold">{s.label}</span>
            <button
              type="button"
              onClick={() => toggle(s.id)}
              aria-pressed={s.on}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${s.on ? 'bg-brand-strong' : 'bg-surface-3 dark:bg-white/15'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${s.on ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs opacity-50">Changes here affect only platform presentation. Operational sports data is managed by Sport Administrators.</p>
    </Card>
  );
};

/* ── Media Library ── */
const MediaModule = () => {
  const { data } = useQuery({ queryKey: ['admin-ads-media'], queryFn: async () => (await apiClient.get('/ads')).data });
  const items = (data?.data || []).map((a) => ({ url: a.imageUrl, name: a.title }));
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.length === 0 ? <p className="opacity-50">No media yet.</p> : items.map((m, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-video bg-surface-2 dark:bg-white/5">{m.url && <img src={m.url} alt="" className="h-full w-full object-cover" />}</div>
          <div className="flex items-center justify-between p-3">
            <span className="min-w-0 flex-1 truncate text-xs font-semibold">{m.name}</span>
            <button className="shrink-0 opacity-40 hover:opacity-100" aria-label="Copy URL"><Copy size={13} /></button>
          </div>
        </Card>
      ))}
    </div>
  );
};

/* ── Users ── */
const UsersModule = () => {
  const { data } = useQuery({ queryKey: ['admin-users'], queryFn: async () => (await apiClient.get('/admin/sport-admins')).data });
  const admins = data?.data || [];
  return (
    <Card className="overflow-x-auto p-2 sm:p-4">
      <table className="w-full min-w-[520px] text-left">
        <thead><tr className="text-[9px] font-bold uppercase tracking-widest opacity-40">
          <th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th><th className="p-2">Status</th><th className="p-2 text-right">View</th>
        </tr></thead>
        <tbody>
          {admins.map((a) => (
            <tr key={a.id} className="border-t border-surface-3/60 dark:border-white/5">
              <td className="p-2 text-sm font-medium">{a.user?.fullName}</td>
              <td className="p-2 text-sm opacity-70">{a.user?.email}</td>
              <td className="p-2 text-sm opacity-70">{a.user?.role?.replace(/_/g, ' ')}</td>
              <td className="p-2"><span className="rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-bold uppercase text-green">Active</span></td>
              <td className="p-2 text-right"><Eye size={15} className="ml-auto opacity-40" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

/* ── Roles & Permissions matrix (Super Admin) ── */
const ROLE_MATRIX = [
  ['Sport Admins', true, true, true, true],
  ['Leagues', true, false, false, false],
  ['Teams', true, false, false, false],
  ['Championships', true, false, false, false],
  ['Players', true, false, false, false],
  ['News', true, true, true, true],
  ['Advertisements', true, true, true, true],
  ['Website Content', true, false, true, false],
  ['Audit Logs', true, false, false, false],
  ['Settings', true, false, true, false],
];
const RolesModule = () => (
  <Card className="overflow-x-auto p-2 sm:p-4">
    <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest opacity-40">Super Admin — Ministry of Sport</p>
    <table className="w-full min-w-[480px] text-left">
      <thead><tr className="text-[9px] font-bold uppercase tracking-widest opacity-40">
        <th className="p-2">Resource</th><th className="p-2 text-center">View</th><th className="p-2 text-center">Create</th><th className="p-2 text-center">Edit</th><th className="p-2 text-center">Delete</th>
      </tr></thead>
      <tbody>
        {ROLE_MATRIX.map(([res, ...perms]) => (
          <tr key={res} className="border-t border-surface-3/60 dark:border-white/5">
            <td className="p-2 text-sm font-medium">{res}</td>
            {perms.map((p, i) => (
              <td key={i} className="p-2 text-center">
                {p ? <Check size={15} className="mx-auto text-green" /> : <X size={15} className="mx-auto opacity-25" />}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
);

/* ── System Health ── */
const HEALTH = [['Database', Database], ['Server Status', Server], ['API Services', Radio], ['File Storage', Cloud], ['Email Service', Mail]];
const HealthModule = () => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {HEALTH.map(([label, Icon]) => (
      <Card key={label} className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 dark:bg-white/5 opacity-70"><Icon size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{label}</p>
          <p className="text-[11px] opacity-50">Operational · &lt;120ms</p>
        </div>
        <CheckCircle2 size={18} className="text-green" />
      </Card>
    ))}
  </div>
);

const titleCase = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* Generic module scaffold for sections still being wired to the backend. */
const ScaffoldModule = ({ title }) => (
  <Card className="flex flex-col items-center gap-3 p-12 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 dark:bg-white/5 opacity-60"><LayoutTemplate size={22} /></span>
    <p className="text-lg font-bold">{title}</p>
    <p className="max-w-md text-sm opacity-50">This module is part of the RwaSport administration portal. Its list, filters and create/edit flows connect to the existing platform data when this section is wired to the backend.</p>
  </Card>
);

const AdminModulePage = () => {
  const { pathname } = useLocation();
  const key = Object.keys(MODULES).find((k) => pathname.startsWith(k));
  const mod = key
    ? MODULES[key]
    : { title: titleCase(pathname.split('/').filter(Boolean).pop() || 'Module'), icon: LayoutTemplate, desc: 'Amashuri administration module.', kind: 'scaffold' };
  const Icon = mod.icon;
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Icon size={20} /></span>
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">{mod.title}</h1>
          <p className="mt-0.5 max-w-xl text-sm opacity-50">{mod.desc}</p>
        </div>
      </div>
      {mod.kind === 'content' && <ContentModule />}
      {mod.kind === 'media' && <MediaModule />}
      {mod.kind === 'users' && <UsersModule />}
      {mod.kind === 'roles' && <RolesModule />}
      {mod.kind === 'health' && <HealthModule />}
      {mod.kind === 'scaffold' && <ScaffoldModule title={mod.title} />}
    </div>
  );
};

export default AdminModulePage;
