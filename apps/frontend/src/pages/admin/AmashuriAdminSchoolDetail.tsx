import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { School, Users, Users2, KeyRound, Plus, ChevronLeft, UserX, UserCheck, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import {
  getSchool, getAkcAthletes, downloadRosterForm, importAkcPlayers,
  getSchoolCoordinators, createSchoolCoordinator, setCoordinatorActive,
  getSchoolConsentStatus, downloadConsentForm, importConsentForm,
} from '../../api/endpoints/amashuri';
import RosterWorkbench from '../../components/amashuri/RosterWorkbench';
import ConsentPanel from '../../components/amashuri/ConsentPanel';
import { PageHeader, StatCard, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  Badge, Button, Field, Input, Modal, StatusPill,
  Skeleton, SkeletonList, EmptyState, cn,
} from '../../components/ui';
import useUiStore from '../../store/uiStore';

const emptyCoordinator = { username: '', fullName: '', email: '', phone: '', password: '' };

const COORDINATOR_FIELDS: Array<[string, string, string, string]> = [
  ['fullName', 'Coordinator name', 'text', 'e.g. Marie Uwimana'],
  ['username', 'Username', 'text', 'e.g. esb.coord'],
  ['email', 'Email (optional)', 'email', 'coordinator@school.rw'],
  ['phone', 'Phone (optional)', 'text', '0788123456'],
  ['password', 'Temporary password', 'password', 'At least 8 characters'],
];

/**
 * One school, everything about it: its teams, its athletes, the registration form
 * to hand over, and the logins that let the school submit its own roster.
 *
 * The three counts that used to be crammed into an eyebrow line — teams, athletes,
 * verified — are the numbers an administrator actually came here for, so they are
 * stat cards now and the subtitle carries only what the school IS.
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

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-64" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <StatCard.Skeleton key={i} />)}
        </div>
        <SkeletonList count={4} className="mt-4 space-y-3">
          <Skeleton className="h-12 w-full" />
        </SkeletonList>
      </div>
    );
  }
  if (!school) {
    return <EmptyState icon={School} title="School not found" hint="It may have been removed." />;
  }

  const verified = athletes.filter((a) => a.docVerified).length;
  const tabs = [
    { id: 'roster', label: 'Registration', icon: School },
    { id: 'athletes', label: `Athletes (${athletes.length})`, icon: Users2 },
    { id: 'access', label: `School access (${coordinators.length})`, icon: KeyRound },
  ];

  return (
    <div>
      <Link
        to="/admin/amashuri/schools"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
      >
        <ChevronLeft size={15} aria-hidden="true" /> All schools
      </Link>

      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            {school.name}
            {school.code && <Badge>{school.code}</Badge>}
          </span>
        }
        subtitle={`${school.category} · ${school.sector || 'Sector not set'}`}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Users} value={school.teams?.length || 0} label="Teams" />
        <StatCard icon={Users2} value={athletes.length} label="Athletes" />
        <StatCard icon={ShieldCheck} value={verified} label="Verified documents" tone="brand" />
      </div>

      <nav className="scroll-contain mt-4 flex gap-1 overflow-x-auto border-b border-hairline" aria-label="School sections">
        {tabs.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setTab(s.id)}
            aria-selected={tab === s.id}
            className={cn(
              'relative flex min-h-tap items-center gap-2 whitespace-nowrap px-3 text-sm transition-colors duration-150 ease-standard',
              tab === s.id ? 'font-semibold text-primary' : 'text-tertiary hover:text-primary'
            )}
          >
            <s.icon size={15} aria-hidden="true" />
            {s.label}
            {tab === s.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
          </button>
        ))}
      </nav>

      <div className="mt-4">
        {tab === 'roster' && (
          <div className="space-y-4">
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
          <Panel flush>
            {athletes.length === 0 ? (
              <EmptyState
                icon={Users2}
                title="No athletes registered"
                hint="Use the Registration tab to send this school a form."
              />
            ) : (
              <TableWrap>
                <table className="w-full min-w-[820px] text-left">
                  <thead>
                    <tr>
                      <Th>Athlete</Th>
                      <Th>Class</Th>
                      <Th>Student code</Th>
                      <Th>Born</Th>
                      <Th>Guardian</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {athletes.map((a) => (
                      <tr key={a.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                        <Td>
                          <span className="block font-medium text-primary">{a.fullName}</span>
                          <span className="mt-0.5 block text-xs text-tertiary">
                            {a.gender} · {a.ageCategory}
                            {a.nationality && a.nationality !== 'Rwandan' ? ` · ${a.nationality}` : ''}
                          </span>
                        </Td>
                        <Td>{a.schoolClass || '—'}</Td>
                        <Td className="tabular-nums text-tertiary">{a.studentCode || '—'}</Td>
                        <Td className="tabular-nums">{a.dob ? format(new Date(a.dob), 'd MMM yyyy') : '—'}</Td>
                        <Td className="tabular-nums text-tertiary">{a.guardianPhone || '—'}</Td>
                        <Td>
                          <StatusPill
                            status={a.docVerified ? 'VERIFIED' : 'PENDING'}
                            label={a.docVerified ? 'Verified' : 'Pending'}
                          />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </Panel>
        )}

        {tab === 'access' && (
          <Panel flush>
            <div className="flex flex-col gap-3 border-b border-hairline p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-sm text-secondary">
                A coordinator login lets this school download its own form and submit its roster directly.
                The account is bound to {school.name} — it can never see or register athletes for another school.
              </p>
              <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)} className="shrink-0">Add login</Button>
            </div>

            {coordinators.length === 0 ? (
              <EmptyState
                icon={KeyRound}
                title="No school login yet"
                hint="Create one so this school can submit its own roster."
              />
            ) : (
              <TableWrap>
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr>
                      <Th>Coordinator</Th>
                      <Th>Username</Th>
                      <Th>Contact</Th>
                      <Th>Last login</Th>
                      <Th>Status</Th>
                      <Th align="right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {coordinators.map((c) => (
                      <tr key={c.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                        <Td className="font-medium text-primary">{c.fullName}</Td>
                        <Td className="tabular-nums">{c.username}</Td>
                        <Td className="text-tertiary">{c.email || c.phone || '—'}</Td>
                        <Td className="tabular-nums text-tertiary">
                          {c.lastLogin ? format(new Date(c.lastLogin), 'd MMM yyyy') : 'Never'}
                        </Td>
                        <Td>
                          <StatusPill
                            status={c.active ? 'ACTIVE' : 'SUSPENDED'}
                            label={c.active ? 'Active' : 'Suspended'}
                          />
                        </Td>
                        <Td align="right">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={c.active ? UserX : UserCheck}
                            onClick={() => toggleCoordinator.mutate({ userId: c.id, active: !c.active })}
                          >
                            {c.active ? 'Suspend' : 'Restore'}
                          </Button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </Panel>
        )}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={`School login — ${school.name}`}
        description="Share these details with the school directly. Ask them to change the password after their first sign-in."
        size="sm"
      >
        <div className="space-y-4">
          {COORDINATOR_FIELDS.map(([key, label, type, placeholder]) => (
            <Field key={key} label={label}>
              {(p) => (
                <Input
                  {...p}
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              )}
            </Field>
          ))}
          <Button
            block
            onClick={() => createCoordinator.mutate()}
            loading={createCoordinator.isPending}
            disabled={!form.username.trim() || !form.fullName.trim() || form.password.length < 8}
          >
            Create login
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AmashuriAdminSchoolDetail;
