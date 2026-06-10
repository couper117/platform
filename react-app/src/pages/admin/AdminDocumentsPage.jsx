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