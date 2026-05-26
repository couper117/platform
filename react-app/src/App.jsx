import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import TeamLayout from './components/layout/TeamLayout';
import ReporterLayout from './components/layout/ReporterLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import LeaguesPage from './pages/public/LeaguesPage';
import LeagueDetailsPage from './pages/public/LeagueDetailsPage';
import FixturesPage from './pages/public/FixturesPage';
import MatchDetailsPage from './pages/public/MatchDetailsPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterTeamPage from './pages/auth/RegisterTeamPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AkcAdminDashboard from './pages/admin/AkcAdminDashboard';
import AdminLeaguesPage from './pages/admin/AdminLeaguesPage';
import AdminTeamsPage from './pages/admin/AdminTeamsPage';
import AdminFixturesPage from './pages/admin/AdminFixturesPage';
import LiveReportingPage from './pages/admin/LiveReportingPage';

// Team Pages
import TeamDashboard from './pages/team/TeamDashboard';

// AKC3 Pages
import AkcHome from './pages/akc3/AkcHome';
import SchoolDirectory from './pages/akc3/SchoolDirectory';
import SchoolProfilePage from './pages/akc3/SchoolProfilePage';
import AkcFixturesPage from './pages/akc3/AkcFixturesPage';
import AkcStandingsPage from './pages/akc3/AkcStandingsPage';

// Shared
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
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
      window.scrollTo(0, 0);
    }, 2000);
    return () => clearTimeout(timer);
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
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {showSplash && <SplashScreen />}
      <BrowserRouter>
        <RouteWatcher>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/leagues" element={<LeaguesPage />} />
              <Route path="/leagues/:id" element={<LeagueDetailsPage />} />
              <Route path="/fixtures" element={<FixturesPage />} />
              <Route path="/results" element={<FixturesPage />} />
              <Route path="/news" element={<div className="p-20 font-display text-3xl text-center opacity-20 py-40 italic">RwaSport News Center</div>} />
              <Route path="/news/:slug" element={<div className="p-20 font-display text-3xl">Article Page</div>} />
              <Route path="/matches/:id" element={<MatchDetailsPage />} />
              
              {/* AKC3 (Kagame Cup) */}
              <Route path="/akc3" element={<AkcHome />} />
              <Route path="/akc3/schools" element={<SchoolDirectory />} />
              <Route path="/akc3/schools/:id" element={<SchoolProfilePage />} />
              <Route path="/akc3/fixtures" element={<AkcFixturesPage />} />
              <Route path="/akc3/results" element={<AkcFixturesPage />} />
              <Route path="/akc3/standings" element={<AkcStandingsPage />} />
              
              <Route path="/contact" element={<div className="p-20 font-display text-3xl text-center opacity-20 py-40 italic">Support Center</div>} />
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
              <Route path="akc3" element={<AkcAdminDashboard />} />
              <Route path="fixtures" element={<AdminFixturesPage />} />
              <Route path="players" element={<div className="font-display text-3xl opacity-20 py-20 uppercase">Athlete Registry</div>} />
              <Route path="documents" element={<div className="font-display text-3xl opacity-20 py-20 uppercase">Document Review</div>} />
              <Route path="news" element={<div className="font-display text-3xl opacity-20 py-20 uppercase">News Publisher</div>} />
              <Route path="settings" element={<div className="font-display text-3xl opacity-20 py-20 uppercase">System Config</div>} />
            </Route>

            {/* Team Manager Routes */}
            <Route path="/team" element={<TeamLayout />}>
              <Route index element={<Navigate to="/team/dashboard" replace />} />
              <Route path="dashboard" element={<TeamDashboard />} />
              <Route path="players" element={<div className="font-display text-3xl uppercase opacity-20 py-20 uppercase">Roster Management</div>} />
              <Route path="documents" element={<div className="font-display text-3xl uppercase opacity-20 py-20 uppercase">Document Uploads</div>} />
              <Route path="fixtures" element={<div className="font-display text-3xl uppercase opacity-20 py-20 uppercase">Team Schedule</div>} />
              <Route path="profile" element={<div className="font-display text-3xl uppercase opacity-20 py-20 uppercase">Club Profile</div>} />
            </Route>

            {/* Match Reporter Portal */}
            <Route element={<ReporterLayout />}>
              <Route path="/reporter/dashboard" element={<LiveReportingPage />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RouteWatcher>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
