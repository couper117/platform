import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './context/ThemeContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import CommandPalette from './components/shared/CommandPalette';
import Toaster from './components/shared/Toaster';

// Layouts are small and shared on every route — keep them eager.
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import TeamLayout from './components/layout/TeamLayout';
import ReporterLayout from './components/layout/ReporterLayout';

// Route pages are code-split so heavy deps (recharts, framer-motion) load on demand.
// Public Pages
const HomePage = lazy(() => import('./pages/public/HomePage'));
const LeaguesPage = lazy(() => import('./pages/public/LeaguesPage'));
const LeagueDetailsPage = lazy(() => import('./pages/public/LeagueDetailsPage'));
const FixturesPage = lazy(() => import('./pages/public/FixturesPage'));
const MatchDetailsPage = lazy(() => import('./pages/public/MatchDetailsPage'));
const PlayerPage = lazy(() => import('./pages/public/PlayerPage'));
const NewsListPage = lazy(() => import('./pages/public/NewsListPage'));
const NewsArticlePage = lazy(() => import('./pages/public/NewsArticlePage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const LegalPage = lazy(() => import('./pages/public/LegalPage'));
// Sport section: a shell with real routed tabs, not one page with anchor links.
const SportsIndexPage = lazy(() => import('./pages/public/SportsIndexPage'));
const SportLayout = lazy(() => import('./pages/public/sport/SportLayout'));
const SportOverview = lazy(() => import('./pages/public/sport/SportOverview'));
const SportMatches = lazy(() => import('./pages/public/sport/SportMatches'));
const SportTeams = lazy(() => import('./pages/public/sport/SportTeams'));
const SportStandings = lazy(() => import('./pages/public/sport/SportStandings'));
const SportNews = lazy(() => import('./pages/public/sport/SportNews'));
// A club gets its own section, same shape as a sport's: a shell plus routed tabs.
// Named Club* deliberately: TeamLayout and TeamPlayersPage already exist for the
// signed-in team PORTAL, and shadowing those silently breaks /team.
const ClubLayout = lazy(() => import('./pages/public/club/ClubLayout'));
const ClubOverview = lazy(() => import('./pages/public/club/ClubOverview'));
const ClubMatches = lazy(() => import('./pages/public/club/ClubMatches'));
const ClubRecord = lazy(() => import('./pages/public/club/ClubRecord'));
const ClubStats = lazy(() => import('./pages/public/club/ClubStats'));
const ClubPlayers = lazy(() => import('./pages/public/club/ClubPlayers'));
const ExplorePage = lazy(() => import('./pages/public/ExplorePage'));
const TeamsIndexPage = lazy(() => import('./pages/public/TeamsIndexPage'));

// First-run sport preference. Eager, not lazy: it decides what the landing route
// renders, so a lazy chunk would flash the landing page before redirecting.
import FavouriteSportGate from './components/onboarding/FavouriteSportGate';

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterTeamPage = lazy(() => import('./pages/auth/RegisterTeamPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AkcAdminDashboard = lazy(() => import('./pages/admin/AkcAdminDashboard'));
const AdminLeaguesPage = lazy(() => import('./pages/admin/AdminLeaguesPage'));
const AdminTeamsPage = lazy(() => import('./pages/admin/AdminTeamsPage'));
const AdminFixturesPage = lazy(() => import('./pages/admin/AdminFixturesPage'));
const AdminPlayersPage = lazy(() => import('./pages/admin/AdminPlayersPage'));
const AdminDocumentsPage = lazy(() => import('./pages/admin/AdminDocumentsPage'));
const AdminNewsPage = lazy(() => import('./pages/admin/AdminNewsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminModulePage = lazy(() => import('./pages/admin/AdminModulePage'));
const AdminSportAdminsPage = lazy(() => import('./pages/admin/AdminSportAdminsPage'));
const AdminAdsPage = lazy(() => import('./pages/admin/AdminAdsPage'));
const AdminVisitorsPage = lazy(() => import('./pages/admin/AdminVisitorsPage'));
const AdminChampionshipsPage = lazy(() => import('./pages/admin/AdminChampionshipsPage'));
const LiveReportingPage = lazy(() => import('./pages/admin/LiveReportingPage'));
const LiveMatchPage = lazy(() => import('./pages/admin/LiveMatchPage'));

// Team Pages
const TeamDashboard = lazy(() => import('./pages/team/TeamDashboard'));
const TeamLineupsPage = lazy(() => import('./pages/team/TeamLineupsPage'));
const TeamPlayersPage = lazy(() => import('./pages/team/TeamPlayersPage'));
const TeamDocumentsPage = lazy(() => import('./pages/team/TeamDocumentsPage'));
const TeamFixturesPage = lazy(() => import('./pages/team/TeamFixturesPage'));
const TeamProfilePage = lazy(() => import('./pages/team/TeamProfilePage'));

// Amashuri Games (Rwanda Inter-School Sports) Pages
const AmashuriLayout = lazy(() => import('./pages/akc3/AmashuriLayout'));
const AmashuriOverview = lazy(() => import('./pages/akc3/AmashuriOverview'));
const AmashuriTeamPage = lazy(() => import('./pages/akc3/AmashuriTeamPage'));
const AmashuriAthletePage = lazy(() => import('./pages/akc3/AmashuriAthletePage'));
const SchoolDirectory = lazy(() => import('./pages/akc3/SchoolDirectory'));
const SchoolProfilePage = lazy(() => import('./pages/akc3/SchoolProfilePage'));
const AkcFixturesPage = lazy(() => import('./pages/akc3/AkcFixturesPage'));
const AkcStandingsPage = lazy(() => import('./pages/akc3/AkcStandingsPage'));
const ChampionshipsPage = lazy(() => import('./pages/akc3/ChampionshipsPage'));
const AmashuriMatchPage = lazy(() => import('./pages/akc3/AmashuriMatchPage'));

// Living styleguide (/design-system). Lazy, so it costs nothing unless visited.
const DesignSystemPage = lazy(() => import('./pages/dev/DesignSystemPage'));

// Shared (eager — needed for first paint / transitions)
import SplashScreen from './components/shared/SplashScreen';
import PageLoader from './components/shared/PageLoader';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Resets scroll on navigation.
 *
 * This used to also hold a full-screen loader over Home and /admin for a FIXED 600ms
 * on every visit — a delay the app manufactured rather than needed, which made those
 * two routes feel 600ms slower than they were. Suspense already covers the only real
 * wait (fetching a lazy chunk) and shows PageLoader for exactly as long as that takes,
 * so the timer is gone and only the scroll reset remains.
 */
const RouteWatcher = ({ children }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return children;
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  // SplashScreen owns its own timing now — it waits for webfonts, holds long enough
  // for its fill animation to be seen, caps itself, then slides away and calls back.
  // App only needs to know when it has finished leaving so it can unmount it.

  return (
    <HelmetProvider>
      <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {/* AnimatePresence so the curtain's exit actually plays before it unmounts. */}
        <AnimatePresence>
          {showSplash && <SplashScreen onReady={() => setShowSplash(false)} />}
        </AnimatePresence>
        <BrowserRouter>
        <CommandPaletteProvider>
        <CommandPalette />
        <RouteWatcher>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              {/* Landing page = Choose Your Sport. The gate wraps the ELEMENT only
                  — the path is unchanged — and sends a returning visitor straight to
                  the sport they picked. */}
              <Route
                path="/"
                element={
                  <FavouriteSportGate>
                    <ExplorePage />
                  </FavouriteSportGate>
                }
              />
              <Route path="/explore" element={<Navigate to="/" replace />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/sports" element={<SportsIndexPage />} />
              <Route path="/sports/:slug" element={<SportLayout />}>
                <Route index element={<SportOverview />} />
                <Route path="matches" element={<SportMatches />} />
                <Route path="teams" element={<SportTeams />} />
                <Route path="standings" element={<SportStandings />} />
                <Route path="news" element={<SportNews />} />
              </Route>
              <Route path="/leagues" element={<LeaguesPage />} />
              <Route path="/leagues/:id" element={<LeagueDetailsPage />} />
              <Route path="/fixtures" element={<FixturesPage />} />
              <Route path="/live" element={<FixturesPage />} />
              <Route path="/results" element={<FixturesPage />} />
              <Route path="/teams" element={<TeamsIndexPage />} />
              <Route path="/teams/:id" element={<ClubLayout />}>
                <Route index element={<ClubOverview />} />
                <Route path="matches" element={<ClubMatches />} />
                <Route path="record" element={<ClubRecord />} />
                <Route path="stats" element={<ClubStats />} />
                <Route path="players" element={<ClubPlayers />} />
              </Route>
              <Route path="/news" element={<NewsListPage />} />
              <Route path="/news/:slug" element={<NewsArticlePage />} />
              <Route path="/matches/:id" element={<MatchDetailsPage />} />
              <Route path="/players/:id" element={<PlayerPage />} />
              
              {/* Amashuri Games — Rwanda Inter-School Sports (umbrella incl. Kagame Cup) */}
              {/* The Games are a SECTION, not a page: one shell carrying the
                  photograph, the counts and the tab bar, with a real route per
                  category underneath it. The school profile stays outside the
                  shell — it is a school's own page, with its own identity. */}
              <Route path="/amashuri" element={<AmashuriLayout />}>
                <Route index element={<AmashuriOverview />} />
                <Route path="championships" element={<ChampionshipsPage />} />
                <Route path="schools" element={<SchoolDirectory />} />
                <Route path="fixtures" element={<AkcFixturesPage />} />
                <Route path="results" element={<AkcFixturesPage />} />
                <Route path="standings" element={<AkcStandingsPage />} />
              </Route>
              <Route path="/amashuri/schools/:id" element={<SchoolProfilePage />} />
              {/* school -> team -> athlete. Outside the section shell for the
                  same reason the school profile is: these are a school's own
                  pages, and the Games tab bar is not their navigation. */}
              <Route path="/amashuri/teams/:id" element={<AmashuriTeamPage />} />
              <Route path="/amashuri/athletes/:id" element={<AmashuriAthletePage />} />
              <Route path="/amashuri/matches/:id" element={<AmashuriMatchPage />} />

              {/* Legacy /akc3 redirects → /amashuri */}
              <Route path="/akc3" element={<Navigate to="/amashuri" replace />} />
              <Route path="/akc3/schools" element={<Navigate to="/amashuri/schools" replace />} />
              <Route path="/akc3/schools/:id" element={<Navigate to="/amashuri/schools" replace />} />
              <Route path="/akc3/fixtures" element={<Navigate to="/amashuri/fixtures" replace />} />
              <Route path="/akc3/results" element={<Navigate to="/amashuri/results" replace />} />
              <Route path="/akc3/standings" element={<Navigate to="/amashuri/standings" replace />} />
              
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<LegalPage type="privacy" />} />
              <Route path="/terms" element={<LegalPage type="terms" />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/team/register" element={<RegisterTeamPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="leagues" element={<AdminLeaguesPage />} />
              <Route path="teams" element={<AdminTeamsPage />} />
              <Route path="fixtures" element={<AdminFixturesPage />} />
              <Route path="players" element={<AdminPlayersPage />} />
              <Route path="documents" element={<AdminDocumentsPage />} />
              <Route path="news" element={<AdminNewsPage />} />
              <Route path="ads" element={<AdminAdsPage />} />
              <Route path="visitors" element={<AdminVisitorsPage />} />
              <Route path="akc3" element={<AkcAdminDashboard />} />
              <Route path="championships" element={<AdminChampionshipsPage />} />
              <Route path="sport-admins" element={<AdminSportAdminsPage />} />
              <Route path="content" element={<AdminModulePage />} />
              <Route path="media" element={<AdminModulePage />} />
              <Route path="users" element={<AdminModulePage />} />
              <Route path="roles" element={<AdminModulePage />} />
              <Route path="system-health" element={<AdminModulePage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              {/* Any other /admin/* (e.g. the Amashuri ecosystem modules) renders a
                  titled module scaffold rather than bouncing to the public site. */}
              <Route path="*" element={<AdminModulePage />} />
            </Route>

            {/* Team Manager Routes */}
            <Route path="/team" element={<TeamLayout />}>
              <Route index element={<Navigate to="/team/dashboard" replace />} />
              <Route path="dashboard" element={<TeamDashboard />} />
              <Route path="players" element={<TeamPlayersPage />} />
              <Route path="documents" element={<TeamDocumentsPage />} />
              <Route path="fixtures" element={<TeamFixturesPage />} />
              <Route path="lineups" element={<TeamLineupsPage />} />
              <Route path="profile" element={<TeamProfilePage />} />
              {/* Staff, Content, Media, News, Messages, Settings render a titled
                  module scaffold until wired — keeps the sidebar fully navigable. */}
              <Route path="*" element={<AdminModulePage />} />
            </Route>

            {/* Match Reporter Portal */}
            <Route element={<ReporterLayout />}>
              <Route path="/reporter/dashboard" element={<LiveReportingPage />} />
            </Route>
            {/* Full-screen live-scoring console (own header + auth guard). */}
            <Route path="/reporter/match/:id" element={<LiveMatchPage />} />
            
            {/* Living styleguide — deliberately outside PublicLayout so the
                chrome can't interfere with judging tokens in isolation. */}
            <Route path="/design-system" element={<DesignSystemPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </RouteWatcher>
        </CommandPaletteProvider>
      </BrowserRouter>
      <Toaster />
      {/* OPT-IN, NOT ALWAYS-ON.
          The devtools launcher is a fixed 40px circle in the bottom-right corner,
          which on a phone lands exactly on top of the last item in the bottom nav —
          a cartoon island covering "News" on every mobile screen, in the dev server
          the demo is shown from. Set VITE_DEVTOOLS=true in .env.local to get it
          back. */}
      {import.meta.env.VITE_DEVTOOLS === 'true' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
    </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
