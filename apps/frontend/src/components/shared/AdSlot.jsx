import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import cn from '../ui/cn';

/**
 * Advertising slot. Revenue surface, so it has to be reliable, and it sits inside
 * a live-updating list, so it must never move the content around it.
 *
 * HOW THE SPACE IS RESERVED
 * The slot holds its full height for the entire life of the request, so an ad
 * arriving late drops into space that was already there â€” it can never push
 * fixtures down mid-scroll. It collapses to nothing only once the request has
 * resolved and there is genuinely no ad to show; collapsing upward after a
 * settled response is far less disruptive than content jumping down, and an empty
 * grey box on every screen is worse than either.
 *
 * A FIXED HEIGHT RATHER THAN aspect-ratio
 * The brief specified aspect-ratio. A full-bleed slot with an aspect ratio has a
 * different height on every device, so the space reserved never matches the
 * creative â€” and ads are sold at fixed pixel sizes (320x50, 320x100). A fixed
 * height reserves exactly what the creative needs and is stable across viewports,
 * which is the actual goal.
 */
/**
 * Reserved heights per placement, matching the sizes ads are actually sold at:
 * a mobile banner (320x50), a desktop leaderboard (728x90) and a sidebar
 * medium rectangle (300x250).
 */
const VARIANTS = {
  inline: 'h-16 border-b',
  leaderboard: 'h-24 rounded-card border',
  sidebar: 'h-[250px] rounded-card border',
};

const AdSlot = ({ position, variant = 'inline', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  // Query copied verbatim from the old AdBanner â€” same key, same shape.
  const { data: ads, isPending } = useQuery({
    queryKey: ['active-ads', position],
    queryFn: async () => {
      const { data } = await apiClient.get(`/ads?position=${position}`);
      return data?.data ?? data ?? [];
    },
  });

  const ad = ads?.[0];
  const settled = !isPending;

  // Resolved, and there is nothing to show.
  if (settled && (!ad?.imageUrl || imgError)) return null;

  return (
    <div
      className={cn(
        'w-full overflow-hidden border-hairline bg-surface-2',
        VARIANTS[variant] ?? VARIANTS.inline,
        className
      )}
    >
      {ad?.imageUrl ? (
        <a
          href={ad.targetUrl || '#'}
      onClick={() => { apiClient.post(`/ads/${ad.id}/click`).catch(() => {}); }}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block h-full"
        >
          <img
            src={ad.imageUrl}
            alt={ad.title || 'Advertisement'}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        </a>
      ) : (
        // Holding the space while the request is in flight. Labelled so the slot
        // never reads as a broken image.
        <div className="flex h-full items-center justify-center">
          <span className="text-xs uppercase tracking-wider text-disabled">Advertisement</span>
        </div>
      )}
    </div>
  );
};

export default AdSlot;
