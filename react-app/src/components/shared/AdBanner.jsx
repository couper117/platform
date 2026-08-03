import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

const AdBanner = ({ position }) => {
  const { data: ads } = useQuery({
    queryKey: ['active-ads', position],
    queryFn: async () => {
      const { data } = await apiClient.get(`/ads?position=${position}`);
      // Tolerate both { data: [...] } and a bare array response shape.
      return data?.data ?? data ?? [];
    },
  });

  if (!ads || ads.length === 0) return null;
  const ad = ads[0]; // Take the first active ad for this position

  return (
    <div className="w-full bg-surface-2 dark:bg-surface-dark2 border-y border-surface-3 dark:border-white/5 py-3">
      <div className="container mx-auto px-4 text-center">
        {/* Ads point at external sites — use a real anchor, not react-router Link. */}
        <a
          href={ad.targetUrl || '#'}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block overflow-hidden rounded-xl"
        >
          <img src={ad.imageUrl} alt={ad.title} className="w-full h-16 md:h-24 object-cover" />
        </a>
      </div>
    </div>
  );
};

export default AdBanner;
