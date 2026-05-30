import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

const AdBanner = ({ position }) => {
  const { data: ads } = useQuery({
    queryKey: ['active-ads', position],
    queryFn: async () => {
      // API endpoint for active ads
      const { data } = await apiClient.get(`/ads?position=${position}`);
      return data.data;
    },
  });

  if (!ads || ads.length === 0) return null;