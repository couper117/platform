import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, ShieldCheck, XCircle, Mail, Trash2, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import Skeleton from '../../components/shared/Skeleton';

const AdminTeamsPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('PENDING');

  const { data: teams, isLoading } = useQuery({
    queryKey: ['admin-teams', filter],
    queryFn: async () => {
      const { data } = await apiClient.get('/teams', { params: { status: filter } });
      return data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await apiClient.put(`/teams/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-teams']);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to update team status');
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-teams']);
      alert('Team deleted successfully');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to delete team');
    }
  });

  const handleDeleteTeam = (id) => {
    if (window.confirm('Are you sure you want to delete this team? This will remove all its players and matches.')) {
      deleteTeamMutation.mutate(id);
    }