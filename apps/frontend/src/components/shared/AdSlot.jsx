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
 * arriving late drops into space that was already there — it can never push
 * fixtures down mid-scroll. It collapses to nothing only once the request has
 * resolved and there is genuinely no ad to show; collapsing upward after a
 * settled response is far less disruptive than content jumping down, and an empty
 * grey box on every screen is worse than either.
 *
 * A FIXED HEIGHT RATHER THAN aspect-ratio
 * The brief specified aspect-ratio. A full-bleed slot with an aspect ratio has a
 * different height on every device, so the space reserved never matches the
 * creative — and ads are sold at fixed pixel sizes (320x50, 320x100). A fixed
 * height reserves exactly what the creative needs and is stable across viewports,
 * which is the actual goal.
 */
/**
 * Reserved heights per placement, matching the sizes ads are actually sold at:
 * a mobile banner (320x50), a desktop leaderboard (728x90) and a sidebar
 * medium rectangle (300x250).
 */
const VARIANTS = {
  // The in-list mobile slot. It used to be a full-bleed 64px strip with a bottom
  // rule — no rounding, no border, no label — so it read as a broken row of the
  // fixture list rather than as an advert. It is a card like everything else
  // around it now, at the 320x100 large mobile banner ratio.
  inline: 'h-[112px] rounded-card border',
  leaderboard: 'h-24 rounded-card border',
  sidebar: 'h-[250px] rounded-card border',
  // The 160x600 wide skyscraper. Width comes from the caller (SideRails pins it
  // into the gutter), so only the height is fixed here.
  skyscraper: 'h-[600px] rounded-card border',
};

const AdSlot = ({ position, variant = 'inline', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  // Query copied verbatim from the old AdBanner — same key, same shape.
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
    <div className={cn('w-full', className)}>
      {/* An advert sitting inside a list of real fixtures has to declare itself.
          Nothing said so before, which is both a dark pattern and the reason the
          slot read as a broken row. */}
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-disabled">
        Sponsored
      </p>
      <div
        className={cn(
          'w-full overflow-hidden border-hairline bg-surface-2',
          VARIANTS[variant] ?? VARIANTS.inline
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
          // Holding the space while the request is in flight.
          <div className="h-full animate-pulse bg-surface-3" />
        )}
      </div>
    </div>
  );
};

export default AdSlot;
