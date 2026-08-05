import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

const AdBanner = ({ position }) => {
  const [imgError, setImgError] = useState(false);

  const { data: ads } = useQuery({
    queryKey: ['active-ads', position],
    queryFn: async () => {
      const { data } = await apiClient.get(`/ads?position=${position}`);
      return data?.data ?? data ?? [];
    },
  });

  // Hide the whole banner when there's no ad or its image can't load (no broken-image icon).
  if (!ads || ads.length === 0 || imgError) return null;
  const ad = ads[0];
  if (!ad?.imageUrl) return null;

  return (
    <div className="w-full bg-surface-2 dark:bg-surface-dark2 border-y border-surface-3 dark:border-white/5 py-3">
      <div className="container mx-auto px-4 text-center">
        <a
          href={ad.targetUrl || '#'}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block overflow-hidden rounded-xl"
        >
          <img
            src={ad.imageUrl}
            alt={ad.title}
            onError={() => setImgError(true)}
            className="w-full h-16 md:h-24 object-cover"
          />
        </a>
      </div>
    </div>
  );
};

export default AdBanner;
