import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  School, Upload, FileText, Plus, Trophy, ArrowRight, Loader2,
  AlertCircle, Download, Users,
} from 'lucide-react';
import apiClient from '../../api/client';
import { importAkcPlayers, downloadAkcImportTemplate } from '../../api/endpoints/amashuri';
import { PageHeader, StatCard, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  Button, Field, Input, Modal, Select, StatusPill,
  Skeleton, SkeletonList, EmptyState, ErrorState, cn,
} from '../../components/ui';
import useUiStore from '../../store/uiStore';

const CATEGORIES = ['SECONDARY', 'TVET', 'PRIMARY'];
const REQUIRED_CSV_COLUMNS = ['schoolCode', 'sportId', 'gender', 'ageCategory', 'playerFullName'];
const OPTIONAL_CSV_COLUMNS = ['dob', 'position', 'jersey', 'idType', 'idNumber', 'playerGender', 'level'];
const emptySchoolForm = { name: '', shortName: '', code: '', category: 'SECONDARY', sector: '' };

const TABS = [
  { id: 'schools', label: 'School registry', icon: School },
  { id: 'import', label: 'Bulk import', icon: Upload },
  { id: 'competitions', label: 'Championships', icon: Trophy },
];

/**
 * AMASHURI COMMAND CENTRE — the schools-games equivalent of the ministry
 * dashboard, and built from the same kit: one PageHeader, one stat row, then
 * panels. Nothing here draws its own card or heading style.
 *
 * The three headline numbers are DERIVED from the school registry this page
 * already loads — no extra request, and nothing on screen that the data does not
 * actually say. The status column used to print a green "Active" chip on every
 * row regardless of the record; it now shows each school's real visibility.
 */
const AkcAdminDashboard = () => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [activeTab, setActiveTab] = useState('schools');
  const [importResults, setImportResults] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [schoolForm, setSchoolForm] = useState(emptySchoolForm);

  const { data: schools, isLoading: schoolsLoading, isError: schoolsError } = useQuery({
    queryKey: ['admin-akc-schools'],
    queryFn: async () => {
      const { data } = await apiClient.get('/akc3/schools');
      return data;
    },
  });

  const createSchoolMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/akc3/admin/schools', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-akc-schools'] });
      setIsSchoolModalOpen(false);
      setSchoolForm(emptySchoolForm);
      pushToast('School added!', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to add school'),
  });

  // The file goes up untouched — the server owns CSV parsing so quoted commas and
  // spreadsheet quirks are handled in one place rather than two.
  const importMutation = useMutation({
    mutationFn: ({ file, dryRun }: any) => importAkcPlayers(file, { dryRun }),
    onSuccess: (data: any) => {
      const r = data.data;
      setImportResults(r);
      if (r.dryRun) {
        pushToast(
          `Checked ${r.totalRows} row(s) — ${r.created} ready to import, ${r.skipped} would be skipped. Nothing saved yet.`,
          r.skipped ? 'info' : 'success'
        );
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['admin-akc-schools'] });
      pushToast(
        `Imported ${r.created} athlete(s), ${r.skipped} skipped.`,
        r.skipped ? 'info' : 'success'
      );
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to import CSV'),
  });

  // Picking a file only validates it. Committing is a second, deliberate step —
  // these are children's records and the whole file lands at once.
  const handleCsvChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCsvFile(file);
    setImportResults(null);
    importMutation.mutate({ file, dryRun: true });
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadAkcImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'amashuri-athletes-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      pushToast('Could not download the template.');
    }
  };

  const validated = importResults?.dryRun ? importResults : null;
  const canCommit = Boolean(csvFile && validated && validated.created > 0);

  // Derived from the registry this page already loads — no extra request, and no
  // number on screen that the data does not actually say. There are only two
  // honest ones: GET /akc3/schools filters to `active: true`, so a "visible to the
  // public" tile would always equal the total.
  const schoolList = schools?.data || [];
  const teamCount = schoolList.reduce((sum, s) => sum + (s._count?.teams || 0), 0);

  return (
    <div>
      <PageHeader
        title="Amashuri command centre"
        subtitle="Manage the inter-school sports ecosystem and bulk imports"
        actions={
          activeTab === 'schools' && (
            <Button size="sm" icon={Plus} onClick={() => setIsSchoolModalOpen(true)}>Add school</Button>
          )
        }
      />

      {/* Two tiles in a two-column grid. The Amashuri dataset is small, and a
          fixed four-wide row would strand them at the left of an empty band. */}
      <div className="grid grid-cols-2 gap-3">
        {schoolsLoading ? (
          Array.from({ length: 2 }, (_, i) => <StatCard.Skeleton key={i} />)
        ) : (
          <>
            <StatCard icon={School} value={schoolList.length} label="Schools registered" tone="brand" />
            <StatCard icon={Users} value={teamCount} label="School teams" />
          </>
        )}
      </div>

      <nav className="scroll-contain mt-4 flex gap-1 overflow-x-auto border-b border-hairline" aria-label="Amashuri sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
            className={cn(
              'relative flex min-h-tap items-center gap-2 whitespace-nowrap px-3 text-sm transition-colors duration-150 ease-standard',
              activeTab === tab.id ? 'font-semibold text-primary' : 'text-tertiary hover:text-primary'
            )}
          >
            <tab.icon size={15} aria-hidden="true" />
            {tab.label}
            {activeTab === tab.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
          </button>
        ))}
      </nav>

      <div className="mt-4">
        {activeTab === 'schools' && (
          <Panel flush>
            {schoolsLoading ? (
              <SkeletonList count={6} className="space-y-3 p-4">
                <Skeleton className="h-10 w-full" />
              </SkeletonList>
            ) : schoolsError ? (
              <ErrorState
                title="Couldn't load schools"
                hint="Something went wrong fetching the school registry. Try refreshing the page."
              />
            ) : schoolList.length === 0 ? (
              <EmptyState
                icon={School}
                title="No schools registered yet"
                hint="Add a school to start building the Amashuri network."
                action={<Button size="sm" icon={Plus} onClick={() => setIsSchoolModalOpen(true)}>Add school</Button>}
              />
            ) : (
              <TableWrap>
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr>
                      <Th>School name</Th>
                      <Th>Category</Th>
                      <Th>Code</Th>
                      <Th align="right">Teams</Th>
                      <Th>Status</Th>
                      <Th align="right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolList.map((school) => (
                      <tr key={school.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                        <Td className="font-medium text-primary">{school.name}</Td>
                        <Td>{school.category}</Td>
                        <Td className="tabular-nums text-tertiary">{school.code}</Td>
                        <Td align="right">{school._count?.teams || 0}</Td>
                        <Td>
                          <StatusPill
                            status={school.active === false ? 'SUSPENDED' : 'ACTIVE'}
                            label={school.active === false ? 'Hidden' : 'Active'}
                          />
                        </Td>
                        <Td align="right">
                          <Link
                            to={`/admin/amashuri/school/${school.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
                          >
                            Manage
                            <ArrowRight size={13} aria-hidden="true" />
                          </Link>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </Panel>
        )}

        {activeTab === 'import' && (
          <div className="grid gap-4">
            <Panel
              title="Bulk athlete import"
              hint="Upload a CSV to register student athletes across the Amashuri network. School teams are created as needed, and every file is checked before anything is saved."
            >
              {/* The drop target is the one dashed border in the admin portal: here
                  the dashed edge IS the affordance, not decoration. */}
              <input
                type="file"
                id="csv-upload"
                className="hidden"
                accept=".csv,text/csv"
                onChange={handleCsvChange}
                disabled={importMutation.isPending}
              />
              <label
                htmlFor="csv-upload"
                className="flex cursor-pointer flex-col items-center gap-3 rounded-card border border-dashed border-hairline bg-surface-2 px-4 py-10 text-center transition-colors duration-150 ease-standard hover:border-brand/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-control bg-surface text-tertiary">
                  {importMutation.isPending
                    ? <Loader2 size={22} className="animate-spin" aria-hidden="true" />
                    : <FileText size={22} aria-hidden="true" />}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {importMutation.isPending
                    ? (importMutation.variables?.dryRun ? 'Checking file…' : 'Importing…')
                    : csvFile?.name || 'Drop your CSV here, or click to browse'}
                </span>
                <span className="text-xs text-tertiary">Up to 5,000 rows / 5MB per upload</span>
              </label>

              <dl className="mt-4 space-y-1 text-xs text-tertiary">
                <div className="flex flex-wrap gap-x-1.5">
                  <dt className="font-semibold text-secondary">Required columns:</dt>
                  <dd>{REQUIRED_CSV_COLUMNS.join(', ')}</dd>
                </div>
                <div className="flex flex-wrap gap-x-1.5">
                  <dt className="font-semibold text-secondary">Optional columns:</dt>
                  <dd>{OPTIONAL_CSV_COLUMNS.join(', ')}</dd>
                </div>
              </dl>

              <Button variant="ghost" size="sm" icon={Download} onClick={handleDownloadTemplate} className="mt-3 -ml-4">
                Download CSV template
              </Button>
            </Panel>

            {importResults && (
              <Panel
                title={importResults.dryRun ? 'Checked — nothing saved yet' : 'Import complete'}
                hint={importResults.dryRun
                  ? 'Review the rows below, then confirm to save them.'
                  : 'These athletes are now on the register.'}
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard value={importResults.totalRows} label="Rows read" />
                  <StatCard value={importResults.created} label={importResults.dryRun ? 'Ready' : 'Created'} tone="brand" />
                  <StatCard value={importResults.skipped} label="Skipped" tone="warn" />
                  <StatCard value={importResults.teamsCreated} label={importResults.dryRun ? 'New teams' : 'Teams added'} />
                </div>

                {importResults.warnings?.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {importResults.warnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-live">
                        <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {importResults.report?.length > 0 && (
                  <div className="mt-4 border-t border-hairline pt-4">
                    <p className="mb-2 text-sm font-semibold text-primary">Row-by-row result</p>
                    <div className="max-h-72 overflow-y-auto rounded-card border border-hairline">
                      <TableWrap>
                        <table className="w-full min-w-[520px] text-left">
                          <thead className="sticky top-0 bg-surface">
                            <tr>
                              <Th>Line</Th>
                              <Th>Athlete</Th>
                              <Th>Status</Th>
                              <Th>Reason</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {importResults.report.map((r) => (
                              <tr key={r.row} className={r.status === 'skipped' ? 'bg-surface-2' : undefined}>
                                <Td className="tabular-nums text-tertiary">{r.line}</Td>
                                <Td className="font-medium text-primary">{r.name || <span className="font-normal text-tertiary">—</span>}</Td>
                                <Td>
                                  <StatusPill
                                    status={r.status === 'skipped' ? 'REJECTED' : 'APPROVED'}
                                    label={r.status === 'skipped' ? 'Skipped' : importResults.dryRun ? 'Ready' : 'Created'}
                                  />
                                </Td>
                                <Td className="text-tertiary">{r.reason || ''}</Td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TableWrap>
                    </div>
                  </div>
                )}

                {importResults.dryRun && (
                  <div className="mt-4 flex flex-col gap-2 border-t border-hairline pt-4 sm:flex-row">
                    <Button
                      icon={Upload}
                      onClick={() => importMutation.mutate({ file: csvFile, dryRun: false })}
                      disabled={!canCommit}
                      loading={importMutation.isPending}
                      className="sm:flex-1"
                    >
                      Import {importResults.created} athlete{importResults.created === 1 ? '' : 's'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => { setCsvFile(null); setImportResults(null); }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </Panel>
            )}
          </div>
        )}

        {/* Championships are run from their own manager — this tab hands over
            rather than duplicating a second, drifting copy of that screen. */}
        {activeTab === 'competitions' && (
          <Panel flush>
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-tertiary">
                <Trophy size={18} aria-hidden="true" />
              </span>
              <p className="text-base font-semibold text-primary">Manage championships</p>
              <p className="max-w-md text-sm text-secondary">
                Create and manage every inter-school championship — including the Kagame Cup — set their
                level, status and dates, and track fixtures.
              </p>
              <Button to="/admin/championships" size="sm" icon={ArrowRight} iconRight className="mt-2">
                Open championship manager
              </Button>
            </div>
          </Panel>
        )}
      </div>

      <Modal
        open={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        title="Add school"
        size="sm"
      >
        <div className="space-y-4">
          <Field label="School name">
            {(p) => <Input {...p} value={schoolForm.name} onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })} />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Short name">
              {(p) => <Input {...p} value={schoolForm.shortName} onChange={(e) => setSchoolForm({ ...schoolForm, shortName: e.target.value })} />}
            </Field>
            <Field label="Code">
              {(p) => <Input {...p} placeholder="Used by CSV import" value={schoolForm.code} onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value })} />}
            </Field>
            <Field label="Category">
              {(p) => (
                <Select
                  {...p}
                  size="md"
                  value={schoolForm.category}
                  onChange={(e) => setSchoolForm({ ...schoolForm, category: e.target.value })}
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
              )}
            </Field>
            <Field label="Sector">
              {(p) => <Input {...p} value={schoolForm.sector} onChange={(e) => setSchoolForm({ ...schoolForm, sector: e.target.value })} />}
            </Field>
          </div>
          <Button
            block
            onClick={() => createSchoolMutation.mutate(schoolForm)}
            disabled={!schoolForm.name.trim()}
            loading={createSchoolMutation.isPending}
          >
            Add school
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AkcAdminDashboard;
