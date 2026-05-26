import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { School, Users, Upload, FileText, CheckCircle2, AlertCircle, Plus, Search } from 'lucide-react';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';
import apiClient from '../../api/client';

const AkcAdminDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('schools');
  const [importResults, setImportResults] = useState(null);

  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ['admin-akc-schools'],
    queryFn: async () => {
      const { data } = await apiClient.get('/akc3/schools');
      return data;
    },
  });

  // Mock Mutation for CSV Import
  const importMutation = useMutation({
    mutationFn: async (rows) => {
      const { data } = await apiClient.post('/akc3/admin/import/players', { rows });
      return data;
    },
    onSuccess: (data) => {
      setImportResults(data.data);
      queryClient.invalidateQueries(['admin-akc-schools']);
    }
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">AKC3 <span className="text-rwanda-blue">Command Center</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Manage school sports ecosystem and bulk imports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 border-b border-surface-3 dark:border-white/5">
        {[
          { id: 'schools', label: 'School Registry', icon: <School size={16} /> },
          { id: 'import', label: 'Bulk Import', icon: <Upload size={16} /> },
          { id: 'competitions', label: 'Interschool Comps', icon: <Trophy size={16} /> },
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
              <button className="flex items-center space-x-2 bg-rwanda-blue text-white px-6 py-2.5 rounded-xl font-display text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-rwanda-blue/20">
                <Plus size={16} />
                <span>Add School</span>
              </button>
            </div>

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
                  {schoolsLoading ? (
                    <Skeleton type="table-row" count={5} />
                  ) : schools?.data?.map(school => (
                    <tr key={school.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
                      <td className="p-5 font-bold text-sm">{school.name}</td>
                      <td className="p-5 text-[10px] font-bold opacity-60">{school.category}</td>
                      <td className="p-5 font-mono text-[10px] opacity-40">{school.code}</td>
                      <td className="p-5 text-sm">{school._count?.teams || 0}</td>
                      <td className="p-5">
                        <span className="bg-green/5 text-green text-[8px] font-bold px-2 py-1 rounded border border-green/10 uppercase">Active</span>
                      </td>
                      <td className="p-5">
                        <button className="text-[10px] font-bold text-rwanda-blue hover:underline uppercase">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="max-w-4xl mx-auto space-y-10 py-10">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-rwanda-blue/5 rounded-full flex items-center justify-center text-rwanda-blue mx-auto">
                <Upload size={40} />
              </div>
              <h2 className="text-3xl font-display uppercase tracking-tight">Bulk Player Import</h2>
              <p className="text-sm opacity-60 max-w-lg mx-auto">Upload a CSV file to register players, create teams, and schools automatically across the AKC3 network.</p>
            </div>

            <div className="p-12 border-2 border-dashed border-surface-3 dark:border-white/10 rounded-3xl text-center space-y-6 bg-white dark:bg-surface-dark2">
              <input type="file" id="csv-upload" className="hidden" accept=".csv" />
              <label htmlFor="csv-upload" className="block cursor-pointer">
                <div className="space-y-4">
                  <div className="inline-block p-4 bg-surface-2 dark:bg-white/5 rounded-2xl opacity-40">
                    <FileText size={48} className="mx-auto" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold uppercase text-[10px] tracking-[0.3em]">Drop your CSV here or click to browse</p>
                    <p className="text-[10px] opacity-40 uppercase tracking-widest italic">Supports up to 5,000 rows per upload</p>
                  </div>
                </div>
              </label>
            </div>

            {importResults && (
              <div className="bg-white dark:bg-surface-dark2 p-8 rounded-3xl border border-surface-3 dark:border-white/5 space-y-6 animate-in zoom-in-95">
                <div className="flex items-center space-x-3 text-green">
                  <CheckCircle2 size={24} />
                  <h3 className="text-xl font-display uppercase tracking-tight">Import Complete</h3>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-4 bg-surface-2 dark:bg-white/5 rounded-2xl text-center">
                    <span className="block text-2xl font-display text-green">{importResults.created}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Created</span>
                  </div>
                  <div className="p-4 bg-surface-2 dark:bg-white/5 rounded-2xl text-center">
                    <span className="block text-2xl font-display text-rwanda-yellow">{importResults.skipped}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Skipped</span>
                  </div>
                  <div className="p-4 bg-surface-2 dark:bg-white/5 rounded-2xl text-center">
                    <span className="block text-2xl font-display text-red">{importResults.errors?.length || 0}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Errors</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AkcAdminDashboard;
