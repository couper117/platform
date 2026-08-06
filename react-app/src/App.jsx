import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './context/ThemeContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import CommandPalette from './components/shared/CommandPalette';

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
const NewsListPage = lazy(() => import('./pages/public/NewsListPage'));
const NewsArticlePage = lazy(() => import('./pages/public/NewsArticlePage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const LegalPage = lazy(() => import('./pages/public/LegalPage'));
const SportHubPage = lazy(() => import('./pages/public/SportHubPage'));
const ExplorePage = lazy(() => import('./pages/public/ExplorePage'));

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
const AdminSportAdminsPage = lazy(() => import('./pages/admin/AdminSportAdminsPage'));
const AdminAdsPage = lazy(() => import('./pages/admin/AdminAdsPage'));
const AdminVisitorsPage = lazy(() => import('./pages/admin/AdminVisitorsPage'));
const AdminChampionshipsPage = lazy(() => import('./pages/admin/AdminChampionshipsPage'));
const LiveReportingPage = lazy(() => import('./pages/admin/LiveReportingPage'));

// Team Pages
const TeamDashboard = lazy(() => import('./pages/team/TeamDashboard'));
const TeamLineupsPage = lazy(() => import('./pages/team/TeamLineupsPage'));

// Amashuri Games (Rwanda Inter-School Sports) Pages
const AkcHome = lazy(() => import('./pages/akc3/AkcHome'));
const SchoolDirectory = lazy(() => import('./pages/akc3/SchoolDirectory'));
const SchoolProfilePage = lazy(() => import('./pages/akc3/SchoolProfilePage'));
const AkcFixturesPage = lazy(() => import('./pages/akc3/AkcFixturesPage'));
const AkcStandingsPage = lazy(() => import('./pages/akc3/AkcStandingsPage'));
const ChampionshipsPage = lazy(() => import('./pages/akc3/ChampionshipsPage'));
const AmashuriMatchPage = lazy(() => import('./pages/akc3/AmashuriMatchPage'));

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

const RouteWatcher = ({ children }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Only show loader for Home and Admin pages
    const isTargetPage = location.pathname === '/' || location.pathname.startsWith('/admin');
    
    if (isTargetPage) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        window.scrollTo(0, 0);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setIsTransitioning(false);
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <>
      {isTransitioning && <PageLoader />}
      {children}
    </>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <HelmetProvider>
      <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {showSplash && <SplashScreen />}
        <BrowserRouter>
        <CommandPaletteProvider>
        <CommandPalette />
        <RouteWatcher>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/sports/:slug" element={<SportHubPage />} />
              <Route path="/leagues" element={<LeaguesPage />} />
              <Route path="/leagues/:id" element={<LeagueDetailsPage />} />
              <Route path="/fixtures" element={<FixturesPage />} />
              <Route path="/results" element={<FixturesPage />} />
              <Route path="/news" element={<NewsListPage />} />
              <Route path="/news/:slug" element={<NewsArticlePage />} />
              <Route path="/matches/:id" element={<MatchDetailsPage />} />
              
              {/* Amashuri Games — Rwanda Inter-School Sports (umbrella incl. Kagame Cup) */}
              <Route path="/amashuri" element={<AkcHome />} />
              <Route path="/amashuri/championships" element={<ChampionshipsPage />} />
              <Route path="/amashuri/schools" element={<SchoolDirectory />} />
              <Route path="/amashuri/schools/:id" element={<SchoolProfilePage />} />
              <Route path="/amashuri/fixtures" element={<AkcFixturesPage />} />
              <Route path="/amashuri/results" element={<AkcFixturesPage />} />
              <Route path="/amashuri/standings" element={<AkcStandingsPage />} />
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
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Team Manager Routes */}
            <Route path="/team" element={<TeamLayout />}>
              <Route index element={<Navigate to="/team/dashboard" replace />} />
              <Route path="dashboard" element={<TeamDashboard />} />
              <Route path="players" element={<div className="font-display text-3xl uppercase opacity-20 py-20 uppercase">Roster Management</div>} />
              <Route path="documents" element={<div className="font-display text-3xl uppercase opacity-20 py-20 uppercase">Document Uploads</div>} />
              <Route path="fixtures" element={<TeamLineupsPage />} />
              <Route path="profile" element={<div className="font-display text-3xl uppercase opacity-20 py-20 uppercase">Club Profile</div>} />
            </Route>

            {/* Match Reporter Portal */}
            <Route element={<ReporterLayout />}>
              <Route path="/reporter/dashboard" element={<LiveReportingPage />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </RouteWatcher>
        </CommandPaletteProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
    </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
