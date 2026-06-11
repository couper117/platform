import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Trophy, Plus, Edit2, Trash2, UserPlus, AlertCircle, Loader2, ShieldCheck, X } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';

const AdminLeaguesPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReporterModalOpen, setIsModalReporterOpen] = useState(false);
  const [isAdminModalOpen, setIsModalAdminOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [reporterEmail, setReporterEmail] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: leagues, isLoading } = useQuery({
    queryKey: ['admin-leagues'],
    queryFn: async () => {
      const { data } = await apiClient.get('/leagues');
      return data.data;
    },
  });

  const { data: sports } = useQuery({
    queryKey: ['admin-sports-list'],
    queryFn: async () => {
      const { data } = await apiClient.get('/sports');
      return data.data;
    },
  });

  const createLeagueMutation = useMutation({
    mutationFn: async (data) => {
      await apiClient.post('/leagues', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-leagues']);
      setIsModalOpen(false);
      reset();
      alert('League created successfully!');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to create league');
    }
  });

  const deleteLeagueMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/leagues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-leagues']);
      alert('League deleted successfully');
    }
  });

  const assignReporterMutation = useMutation({
    mutationFn: async ({ leagueId, email }) => {
      await apiClient.post(`/leagues/${leagueId}/assign-reporter`, { email });
    },
    onSuccess: () => {
      setIsModalReporterOpen(false);
      setReporterEmail('');