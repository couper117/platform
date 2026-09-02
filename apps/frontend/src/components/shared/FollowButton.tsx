import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Heart, HeartOff } from 'lucide-react';
import apiClient from '../../api/client';

/**
 * Follow a team.
 *
 * Works signed in or not — the API accepts this browser's anonymous token, and
 * whatever it follows is moved onto an account at sign-in. Requiring
 * registration before someone can say "tell me about Rayon Sports" would lose
 * exactly the audience this is for.
 *
 * The count next to it is the honest one: a person who follows a club from both
 * their browser and their account is counted once, because the two rows are
 * merged when they sign in.
 */
const FollowButton = ({ teamId, size = 'md', showCount = true, className = '' }: any) => {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['follow', teamId],
    queryFn: async () => (await apiClient.get(`/favorites/count/${teamId}`)).data.data,
    enabled: !!teamId,
  });

  const following = !!data?.following;
  const followers = data?.followers ?? 0;

  const toggle = useMutation({
    mutationFn: async () =>
      following
        ? apiClient.delete(`/favorites/${teamId}`)
        : apiClient.post('/favorites', { teamId }),
    // Flip immediately. Following is a small, reversible thing and waiting on a
    // round trip to acknowledge a tap makes the whole page feel broken on a slow
    // connection; the rollback below covers the case where it genuinely failed.
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['follow', teamId] });
      const previous = qc.getQueryData(['follow', teamId]);
      qc.setQueryData(['follow', teamId], (old: any) => ({
        ...(old || {}),
        following: !following,
        followers: Math.max(0, followers + (following ? -1 : 1)),
      }));
      return { previous };
    },
    onError: (_e, _v, ctx: any) => qc.setQueryData(['follow', teamId], ctx?.previous),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['follow', teamId] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const pad = size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 py-1.5 text-[11px]';
  const icon = size === 'sm' ? 12 : 14;

  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle.mutate(); }}
      aria-pressed={following}
      aria-label={following ? t('follow.unfollow', 'Unfollow') : t('follow.follow', 'Follow')}
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider transition-colors ${pad} ${
        following
          ? 'border-brand bg-brand text-white hover:bg-brand-hover'
          : 'border-hairline bg-surface text-secondary hover:border-brand hover:text-brand-text'
      } ${className}`}
    >
      {following ? <Heart size={icon} fill="currentColor" /> : <Heart size={icon} />}
      <span>{following ? t('follow.following', 'Following') : t('follow.follow', 'Follow')}</span>
      {showCount && followers > 0 && (
        <span className={`tabular-nums ${following ? 'opacity-80' : 'opacity-50'}`}>{followers}</span>
      )}
    </button>
  );
};

export default FollowButton;
