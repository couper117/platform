import useAuthStore from '../store/authStore';
import { profileFor } from '../config/sportProfiles';

/**
 * Sport-scoping for admin views. A FEDERATION_ADMIN is limited to their own
 * sport; everyone else sees everything. Returns filter params, a queryKey part,
 * and the sport's management profile (terminology/forms adapt per sport type).
 */
export default function useSportScope() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const isScoped = role === 'FEDERATION_ADMIN';
  const sportId = isScoped ? (user?.sportId ?? null) : null;
  const sport: any = isScoped ? (user?.sport ?? null) : null;
  return {
    sportId,
    sport,
    sportType: sport?.type ?? null,
    // Adapted terminology/forms for the scoped sport; null when unscoped
    // (super admin manages every sport, so it keeps the generic labels).
    profile: isScoped && sport?.type ? profileFor(sport.type) : null,
    isScoped,
    params: sportId ? { sportId } : {},
    key: sportId ? `sport-${sportId}` : 'all',
  };
}
