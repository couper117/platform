import useAuthStore from '../store/authStore';

/**
 * What the signed-in account may do, as the server resolved it.
 *
 * The admin UI has been deciding which menus and buttons to draw by comparing
 * role names — `role === 'SUPERADMIN' || role === 'LEAGUE_ADMIN'` — which writes
 * the same policy twice, once on each side of the network, and guarantees the
 * two drift apart the moment a role gains or loses something. `/auth/me` now
 * returns the resolved capability list, so the browser renders the policy
 * instead of restating it.
 *
 * This is presentation only. Hiding a button is a courtesy to the person using
 * the app, never a control: every route is gated server-side by
 * requireCapability, so editing this list in a console buys nothing.
 */

/**
 * Sessions created before capabilities existed have a stored user without the
 * field. Treating that as "holds nothing" would blank the admin menu for anyone
 * already signed in, so an unknown list is treated as unknown rather than empty:
 * the UI is shown and the server refuses anything they should not have. The gap
 * closes on its own — syncUser() re-fetches /auth/me on load.
 */
const unknownPolicy = (capabilities: unknown): boolean => !Array.isArray(capabilities);

/**
 * Test a single capability.
 *
 *   const canReport = useCan('fixtures.report');
 */
export function useCan(capability: string): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  const caps = (user as any).capabilities;
  if (unknownPolicy(caps)) return user.role !== 'PUBLIC';
  return caps.includes(capability);
}

/** True when the account holds at least one of these. */
export function useCanAny(capabilities: string[]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  const caps = (user as any).capabilities;
  if (unknownPolicy(caps)) return user.role !== 'PUBLIC';
  return capabilities.some((c) => caps.includes(c));
}

/** True only when the account holds all of these. */
export function useCanAll(capabilities: string[]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  const caps = (user as any).capabilities;
  if (unknownPolicy(caps)) return user.role !== 'PUBLIC';
  return capabilities.length > 0 && capabilities.every((c) => caps.includes(c));
}

/**
 * The whole list, for a component that needs to filter a set of items rather
 * than ask one question — a navigation menu, typically.
 */
export function useCapabilities(): string[] {
  const user = useAuthStore((s) => s.user);
  const caps = (user as any)?.capabilities;
  return Array.isArray(caps) ? caps : [];
}

export default useCan;
