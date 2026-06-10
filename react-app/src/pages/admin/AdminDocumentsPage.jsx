import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, CheckCircle, XCircle, Eye, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';

const AdminDocumentsPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('PENDING');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  const { data: docs, isLoading } = useQuery({
    queryKey: ['admin-documents', filter],
    queryFn: async () => {
      const { data } = await apiClient.get('/documents', { params: { status: filter } });
      return data.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, note }) => {
      await apiClient.put(`/documents/${id}/review`, { status, reviewNote: note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-documents']);
      setSelectedDoc(null);
      setReviewNote('');
      alert('Document reviewed successfully!');
    }
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Document <span className="text-red">Verification</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Review athlete IDs and certificates</p>
        </div>
        
        <div className="flex bg-surface-dark p-1 rounded-2xl border border-white/10">
          {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === s ? 'bg-red text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton type="table-row" count={5} />
      ) : (
        <AdminTable headers={['Player', 'Doc Type', 'Filename', 'Uploaded At', 'Actions']}>
          {docs?.map(doc => (
            <tr key={doc.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-sm font-bold uppercase tracking-tight">{doc.player?.fullName}</span>
                  <span className="text-[8px] opacity-40 uppercase font-bold tracking-widest">{doc.player?.team?.name}</span>
                </div>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{doc.docType.replace('_', ' ')}</td>
              <td className="px-6 py-5 text-xs opacity-40 italic">{doc.originalName || 'document.pdf'}</td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-40">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
              <td className="px-6 py-5">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setSelectedDoc(doc)}
                    className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Eye size={16} />
                    <span className="text-[10px] font-bold uppercase">Review</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* Review Modal */}
      <AdminModal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)} title="Verify Document">
        <div className="space-y-8">
          <div className="aspect-[4/3] bg-surface-2 dark:bg-white/5 rounded-3xl border border-surface-3 dark:border-white/10 flex items-center justify-center overflow-hidden">
            {selectedDoc?.filename?.endsWith('.pdf') ? (
              <div className="flex flex-col items-center space-y-4 opacity-40">
                <FileText size={64} />