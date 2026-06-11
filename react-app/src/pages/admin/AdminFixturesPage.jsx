import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Activity, Plus, Calendar, MapPin, Trophy, Clock, Search, Trash2, Edit2, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';

const AdminFixturesPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { register, handleSubmit, reset } = useForm();

  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ['admin-fixtures'],
    queryFn: async () => {
      const { data } = await apiClient.get('/fixtures');
      return data.data;
    },
  });

  const { data: leagues } = useQuery({
    queryKey: ['admin-leagues-list'],
    queryFn: async () => {
      const { data } = await apiClient.get('/leagues');
      return data.data;
    },
  });

  // Fetch teams based on selected league (needs reactive state from form)
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const { data: teams } = useQuery({
    queryKey: ['admin-teams-list', selectedLeagueId],
    queryFn: async () => {
      if (!selectedLeagueId) return [];
      const { data } = await apiClient.get('/teams', { params: { leagueId: selectedLeagueId } });
      return data.data;
    },
    enabled: !!selectedLeagueId
  });

  const createFixtureMutation = useMutation({
    mutationFn: async (data) => {
      await apiClient.post('/fixtures', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-fixtures']);
      setIsModalOpen(false);
      reset();
      alert('Match scheduled successfully!');
    }
  });

  const deleteFixtureMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/fixtures/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-fixtures']);