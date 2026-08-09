import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import apiClient from '../../api/client';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import useUiStore from '../../store/uiStore';

const STATUS_STYLE = {
  APPROVED: 'bg-green/5 text-green border-green/10',
  PENDING: 'bg-gold/5 text-gold border-gold/20',
  REJECTED: 'bg-red/5 text-red border-red/10',
};

const STATUS_ICON = { APPROVED: CheckCircle, PENDING: Clock, REJECTED: XCircle };

const TeamDocumentsPage = () => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [docType, setDocType] = useState('BIRTH_CERTIFICATE');
  const [file, setFile] = useState(null);

  const { data: team, isLoading, isError } = useQuery({
    queryKey: ['team-dashboard-data'],
    queryFn: async () => {
      const { data } = await apiClient.get('/teams/my');
      return data.data;
    },
  });

  const { data: requirements } = useQuery({
    queryKey: ['document-requirements'],
    queryFn: async () => {
      const { data } = await apiClient.get('/documents/requirements');
      return data.data;
    },
    staleTime: Infinity,
  });

  const docTypes = requirements?.requiredDocTypes || ['BIRTH_CERTIFICATE', 'PASSPORT', 'NATIONAL_ID'];

  const players = team?.players || [];
  const documents = players.flatMap(p => (p.documents || []).map(d => ({ ...d, player: p })));

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('playerId', playerId);
      fd.append('docType', docType);
      fd.append('file', file);
      await apiClient.post('/documents/upload', fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-dashboard-data'] });
      setIsModalOpen(false);
      setPlayerId('');
      setDocType('BIRTH_CERTIFICATE');
      setFile(null);
      pushToast('Document uploaded — pending review.', 'success');
    },
    onError: (err) => pushToast(err.response?.data?.message || 'Failed to upload document'),
  });

  if (isLoading) return <Skeleton type="card" count={3} />;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Verification <span className="text-red">Documents</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">
            Required for every athlete: {docTypes.map(t => t.replace('_', ' ')).join(', ')}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!players.length}
          className="bg-red text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-2 disabled:opacity-40"
        >
          <Upload size={20} />
          <span>Upload Document</span>
        </button>
      </div>

      {isError ? (
        <EmptyState icon={FileText} title="Couldn't load documents" hint="Something went wrong. Try refreshing the page." />
      ) : !players.length ? (
        <EmptyState icon={FileText} title="Register a player first" hint="You need at least one athlete on your roster before uploading documents." />
      ) : !documents.length ? (
        <EmptyState icon={FileText} title="No documents uploaded yet" hint="Upload ID, passport, or medical documents to get your players verified." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => {
            const Icon = STATUS_ICON[doc.status] || Clock;
            return (
              <div key={doc.id} className="bg-white dark:bg-surface-dark2 p-6 rounded-3xl border border-surface-3 dark:border-white/5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-surface-2 dark:bg-white/5 rounded-2xl opacity-60">
                    <FileText size={20} />
                  </div>
                  <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase flex items-center gap-1 ${STATUS_STYLE[doc.status] || ''}`}>
                    <Icon size={10} />
                    {doc.status}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm uppercase tracking-tight">{doc.docType.replace('_', ' ')}</p>
                  <p className="text-[10px] opacity-40 uppercase tracking-widest">{doc.player.fullName}</p>
                </div>
                {doc.reviewNote && (
                  <p className="text-xs italic opacity-50 border-t border-surface-3 dark:border-white/5 pt-3">{doc.reviewNote}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Document">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Player</label>
            <select className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" value={playerId} onChange={e => setPlayerId(e.target.value)}>
              <option value="">Select a player...</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Document Type</label>
            <select className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" value={docType} onChange={e => setDocType(e.target.value)}>
              {['BIRTH_CERTIFICATE', 'PASSPORT', 'NATIONAL_ID', 'MEDICAL', 'OTHER'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">File</label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-3.5 rounded-xl outline-none text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-red file:text-white file:text-[10px] file:uppercase file:font-bold"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <button
            onClick={() => uploadMutation.mutate()}
            disabled={!playerId || !file || uploadMutation.isPending}
            className="w-full bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all disabled:opacity-50"
          >
            {uploadMutation.isPending ? <Loader2 className="animate-spin mx-auto" /> : <span>Upload</span>}
          </button>
        </div>
      </AdminModal>
    </div>
  );
};

export default TeamDocumentsPage;
