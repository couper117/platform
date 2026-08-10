// Single source of truth for which portal a role lands on after login and where
// the Navbar "profile" link points. Keeps LoginPage and Navbar from diverging.
export const roleHome = (role) => {
  switch (role) {
    case 'SUPERADMIN':
    case 'LEAGUE_ADMIN':
    case 'FEDERATION_ADMIN':
      return '/admin/dashboard';
    case 'AMASHURI_ADMIN':
      return '/admin/akc3';
    case 'MATCH_REPORTER':
      return '/reporter/dashboard';
    case 'TEAM_MANAGER':
    default:
      return '/team/dashboard';
  }
};
