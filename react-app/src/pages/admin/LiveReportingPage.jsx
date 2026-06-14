import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Play, StopCircle, Award, AlertTriangle, Users, Loader2, ChevronRight } from 'lucide-react';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import Skeleton from '../../components/shared/Skeleton';

const LiveReportingPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedFixture, setSelectedFixture] = useState(null);

  // Fetch fixtures assigned to this reporter
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['reporter-assignments', user.id],
    queryFn: async () => {
      // In a real app, you'd have a specific endpoint for reporter's matches
      const { data } = await apiClient.get('/fixtures', { params: { status: 'SCHEDULED' } }); 
      return data.data;
    },
  });

  const addEventMutation = useMutation({
    mutationFn: async (eventData) => {
      await apiClient.post(`/fixtures/${selectedFixture.id}/events`, eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['match-details', selectedFixture.id]);
      alert('Event logged successfully!');
    }
  });

  if (isLoading) return <div className="p-8"><Skeleton type="card" count={3} /></div>;

  if (!selectedFixture) {
    return (
      <div className="p-6 sm:p-10 space-y-10 animate-in fade-in duration-500">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Pitch-Side <span className="text-red">Reporting</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Select an assigned match to begin live updates</p>
        </div>

        <div className="grid grid-cols-1 gap-4">