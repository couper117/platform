import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, RotateCcw, AlertCircle, Loader2, Globe, Shield, Mail } from 'lucide-react';
import apiClient from '../../api/client';
import Skeleton from '../../components/shared/Skeleton';

const AdminSettingsPage = () => {
  const queryClient = useQueryClient();
  const [settingsData, setSettingsData] = useState({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get('/settings');
      setSettingsData(data.data);
      return data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      // Backend expects array of { skey, sval }
      const payload = Object.entries(updates).map(([skey, sval]) => ({ skey, sval }));
      await apiClient.put('/settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-settings']);
      alert('System settings updated successfully!');
    }
  });

  const handleChange = (key, val) => {
    setSettingsData(prev => ({ ...prev, [key]: val }));
  };

  const categories = [
    { id: 'branding', label: 'Identity & Branding', icon: <Globe size={18} /> },
    { id: 'contact', label: 'Contact & Support', icon: <Mail size={18} /> },
    { id: 'homepage', label: 'Homepage Config', icon: <RotateCcw size={18} /> },
  ];
