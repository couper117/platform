import useAuthStore from '../store/authStore';

/**
 * Sport-scoping for admin views. A FEDERATION_ADMIN is limited to their own
 * sport; everyone else sees everything. Returns filter params + a queryKey part.
 */
export default function useSportScope() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const sportId = role === 'FEDERATION_ADMIN' ? (user?.sportId ?? null) : null;
  return {
    sportId,
    sport: role === 'FEDERATION_ADMIN' ? (user?.sport ?? null) : null,
    isScoped: role === 'FEDERATION_ADMIN',
    params: sportId ? { sportId } : {},
    key: sportId ? `sport-${sportId}` : 'all',
  };
}
