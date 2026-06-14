import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { School, Users, Upload, FileText, CheckCircle2, Plus, Trophy, ArrowRight } from 'lucide-react';
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