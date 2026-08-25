import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { School, Upload, FileText, CheckCircle2, Plus, Trophy, ArrowRight, Loader2, AlertCircle, ShieldCheck, Download } from 'lucide-react';
import Skeleton from '../../components/shared/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import AdminModal from '../../components/admin/AdminModal';
import apiClient from '../../api/client';
import { importAkcPlayers, downloadAkcImportTemplate } from '../../api/endpoints/amashuri';
import useUiStore from '../../store/uiStore';

const CATEGORIES = ['SECONDARY', 'TVET', 'PRIMARY'];
const REQUIRED_CSV_COLUMNS = ['schoolCode', 'sportId', 'gender', 'ageCategory', 'playerFullName'];
const OPTIONAL_CSV_COLUMNS = ['dob', 'position', 'jersey', 'idType', 'idNumber', 'playerGender', 'level'];
const emptySchoolForm = { name: '', shortName: '', code: '', category: 'SECONDARY', sector: '' };

const AkcAdminDashboard = () => {
  const navigate = useNavigate();
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

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Amashuri <span className="text-rwanda-blue">Command Center</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Manage the inter-school sports ecosystem and bulk imports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 border-b border-surface-3 dark:border-white/5">
        {[
          { id: 'schools', label: 'School Registry', icon: <School size={16} /> },
          { id: 'import', label: 'Bulk Import', icon: <Upload size={16} /> },
          { id: 'competitions', label: 'Championships', icon: <Trophy size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 py-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${
              activeTab === tab.id ? 'border-rwanda-blue text-rwanda-blue' : 'border-transparent opacity-40 hover:opacity-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-8">
        {activeTab === 'schools' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-display uppercase tracking-tight">Registered Institutions</h2>
              <button
                onClick={() => setIsSchoolModalOpen(true)}
                className="flex items-center space-x-2 bg-rwanda-blue text-white px-6 py-2.5 rounded-xl font-display text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-rwanda-blue/20"
              >
                <Plus size={16} />
                <span>Add School</span>
              </button>
            </div>

            {schoolsLoading ? (
              <Skeleton type="table-row" count={5} />
            ) : schoolsError ? (
              <EmptyState icon={School} title="Couldn't load schools" hint="Something went wrong fetching the school registry. Try refreshing the page." />
            ) : !schools?.data?.length ? (
              <EmptyState icon={School} title="No schools registered yet" hint="Add a school to start building the AKC3 network." />
            ) : (
              <div className="bg-white dark:bg-surface-dark2 rounded-3xl border border-surface-3 dark:border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-2 dark:bg-white/5 text-[10px] uppercase font-bold tracking-widest opacity-40">
                      <th className="p-5">School Name</th>
                      <th className="p-5">Category</th>
                      <th className="p-5">Code</th>
                      <th className="p-5">Teams</th>
                      <th className="p-5">Status</th>
                      <th className="p-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-3 dark:divide-white/5">
                    {schools.data.map(school => (
                      <tr key={school.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
                        <td className="p-5 font-bold text-sm">{school.name}</td>
                        <td className="p-5 text-[10px] font-bold opacity-60">{school.category}</td>
                        <td className="p-5 font-mono text-[10px] opacity-40">{school.code}</td>
                        <td className="p-5 text-sm">{school._count?.teams || 0}</td>
                        <td className="p-5">
                          <span className="bg-green/5 text-green text-[8px] font-bold px-2 py-1 rounded border border-green/10 uppercase">Active</span>
                        </td>
                        <td className="p-5">
                          <button onClick={() => navigate(`/admin/amashuri/school/${school.id}`)} className="text-[10px] font-bold text-rwanda-blue hover:underline uppercase">Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'import' && (
          <div className="max-w-4xl mx-auto space-y-10 py-10">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-rwanda-blue/5 rounded-full flex items-center justify-center text-rwanda-blue mx-auto">
                <Upload size={40} />
              </div>
              <h2 className="text-3xl font-display uppercase tracking-tight">Bulk Athlete Import</h2>
              <p className="text-sm opacity-60 max-w-lg mx-auto">
                Upload a CSV to register student athletes across the Amashuri network. School teams are created as needed.
                Every file is checked first — nothing is saved until you confirm.
              </p>
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-40 space-y-1">
                <p>Required: {REQUIRED_CSV_COLUMNS.join(', ')}</p>
                <p>Optional: {OPTIONAL_CSV_COLUMNS.join(', ')}</p>
              </div>
              <button onClick={handleDownloadTemplate} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rwanda-blue hover:underline">
                <Download size={13} /> Download CSV template
              </button>
            </div>

            <div className="p-12 border-2 border-dashed border-surface-3 dark:border-white/10 rounded-3xl text-center space-y-6 bg-white dark:bg-surface-dark2">
              <input type="file" id="csv-upload" className="hidden" accept=".csv,text/csv" onChange={handleCsvChange} disabled={importMutation.isPending} />
              <label htmlFor="csv-upload" className="block cursor-pointer">
                <div className="space-y-4">
                  <div className="inline-block p-4 bg-surface-2 dark:bg-white/5 rounded-2xl opacity-40">
                    {importMutation.isPending ? <Loader2 size={48} className="mx-auto animate-spin" /> : <FileText size={48} className="mx-auto" />}
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold uppercase text-[10px] tracking-[0.3em]">
                      {importMutation.isPending
                        ? (importMutation.variables?.dryRun ? 'Checking file…' : 'Importing…')
                        : csvFile?.name || 'Drop your CSV here or click to browse'}
                    </p>
                    <p className="text-[10px] opacity-40 uppercase tracking-widest italic">Up to 5,000 rows / 5MB per upload</p>
                  </div>
                </div>
              </label>
            </div>

            {importResults && (
              <div className="bg-white dark:bg-surface-dark2 p-8 rounded-3xl border border-surface-3 dark:border-white/5 space-y-6 animate-in zoom-in-95">
                <div className={`flex items-center space-x-3 ${importResults.dryRun ? 'text-rwanda-blue' : 'text-green'}`}>
                  {importResults.dryRun ? <ShieldCheck size={24} /> : <CheckCircle2 size={24} />}
                  <h3 className="text-xl font-display uppercase tracking-tight">
                    {importResults.dryRun ? 'Checked — nothing saved yet' : 'Import Complete'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-surface-2 dark:bg-white/5 rounded-2xl text-center">
                    <span className="block text-2xl font-display">{importResults.totalRows}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Rows read</span>
                  </div>
                  <div className="p-4 bg-surface-2 dark:bg-white/5 rounded-2xl text-center">
                    <span className="block text-2xl font-display text-green">{importResults.created}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">{importResults.dryRun ? 'Ready' : 'Created'}</span>
                  </div>
                  <div className="p-4 bg-surface-2 dark:bg-white/5 rounded-2xl text-center">
                    <span className="block text-2xl font-display text-rwanda-yellow">{importResults.skipped}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Skipped</span>
                  </div>
                  <div className="p-4 bg-surface-2 dark:bg-white/5 rounded-2xl text-center">
                    <span className="block text-2xl font-display text-rwanda-blue">{importResults.teamsCreated}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">{importResults.dryRun ? 'New teams' : 'Teams added'}</span>
                  </div>
                </div>

                {importResults.warnings?.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-rwanda-yellow">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}

                {importResults.report?.length > 0 && (
                  <div className="border-t border-surface-3 dark:border-white/5 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3">Row-by-row result</p>
                    <div className="max-h-72 overflow-y-auto rounded-2xl border border-surface-3 dark:border-white/5">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-surface-2 dark:bg-surface-dark2">
                          <tr className="text-[9px] uppercase font-bold tracking-widest opacity-40">
                            <th className="p-3">Line</th>
                            <th className="p-3">Athlete</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-3 dark:divide-white/5">
                          {importResults.report.map((r) => (
                            <tr key={r.row} className={r.status === 'skipped' ? 'bg-red/[0.03]' : undefined}>
                              <td className="p-3 font-mono opacity-40 tabular-nums">{r.line}</td>
                              <td className="p-3 font-medium">{r.name || <span className="opacity-30">—</span>}</td>
                              <td className="p-3">
                                <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${
                                  r.status === 'skipped'
                                    ? 'bg-red/5 text-red border border-red/10'
                                    : 'bg-green/5 text-green border border-green/10'
                                }`}>
                                  {r.status === 'skipped' ? 'Skipped' : importResults.dryRun ? 'Ready' : 'Created'}
                                </span>
                              </td>
                              <td className="p-3 opacity-60">{r.reason || ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {importResults.dryRun && (
                  <div className="flex flex-col sm:flex-row gap-3 border-t border-surface-3 dark:border-white/5 pt-6">
                    <button
                      onClick={() => importMutation.mutate({ file: csvFile, dryRun: false })}
                      disabled={!canCommit || importMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-rwanda-blue text-white font-display text-lg uppercase tracking-widest py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {importMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                      <span>Import {importResults.created} athlete{importResults.created === 1 ? '' : 's'}</span>
                    </button>
                    <button
                      onClick={() => { setCsvFile(null); setImportResults(null); }}
                      className="px-8 py-3 rounded-xl border border-surface-3 dark:border-white/10 font-display text-lg uppercase tracking-widest opacity-60 hover:opacity-100 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'competitions' && (
          <div className="max-w-3xl mx-auto py-10 space-y-8 text-center">
            <div className="w-20 h-20 bg-rwanda-blue/5 rounded-full flex items-center justify-center text-rwanda-blue mx-auto">
              <Trophy size={40} />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-display uppercase tracking-tight">Manage Championships</h2>
              <p className="text-sm opacity-60 max-w-lg mx-auto">
                Create and manage every inter-school championship â€” including the Kagame Cup â€” set their level, status and dates, and track fixtures.
              </p>
            </div>
            <Link
              to="/admin/championships"
              className="inline-flex items-center gap-2 bg-rwanda-blue text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-rwanda-blue/20"
            >
              <span>Open Championship Manager</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>

      <AdminModal isOpen={isSchoolModalOpen} onClose={() => setIsSchoolModalOpen(false)} title="Add School">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">School Name</label>
            <input className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" value={schoolForm.name} onChange={e => setSchoolForm({ ...schoolForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Short Name</label>
              <input className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" value={schoolForm.shortName} onChange={e => setSchoolForm({ ...schoolForm, shortName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Code</label>
              <input className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" placeholder="Used by CSV import" value={schoolForm.code} onChange={e => setSchoolForm({ ...schoolForm, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Category</label>
              <select className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" value={schoolForm.category} onChange={e => setSchoolForm({ ...schoolForm, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Sector</label>
              <input className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" value={schoolForm.sector} onChange={e => setSchoolForm({ ...schoolForm, sector: e.target.value })} />
            </div>
          </div>
          <button
            onClick={() => createSchoolMutation.mutate(schoolForm)}
            disabled={!schoolForm.name.trim() || createSchoolMutation.isPending}
            className="w-full bg-rwanda-blue text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
          >
            {createSchoolMutation.isPending ? <Loader2 className="animate-spin mx-auto" /> : <span>Add School</span>}
          </button>
        </div>
      </AdminModal>
    </div>
  );
};

export default AkcAdminDashboard;
