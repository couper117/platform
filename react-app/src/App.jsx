import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import TeamLayout from './components/layout/TeamLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import LeaguesPage from './pages/public/LeaguesPage';
import LeagueDetailsPage from './pages/public/LeagueDetailsPage';
import FixturesPage from './pages/public/FixturesPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterTeamPage from './pages/auth/RegisterTeamPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// AKC3 Pages
import AkcHome from './pages/akc3/AkcHome';
import SchoolDirectory from './pages/akc3/SchoolDirectory';

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

// Component to handle page transitions
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
              <Route path="/news" element={<div className="p-20 font-display text-3xl text-center uppercase tracking-widest opacity-40 py-40 italic">RwaSport News Center</div>} />
              
              {/* AKC3 Public Routes */}
              <Route path="/akc3" element={<AkcHome />} />
              <Route path="/akc3/schools" element={<SchoolDirectory />} />
              <Route path="/akc3/schools/:id" element={<div className="p-20 font-display text-3xl text-center uppercase tracking-widest opacity-40 py-40">School Profile & Teams</div>} />
              
              <Route path="/contact" element={<div className="p-20 font-display text-3xl text-center uppercase tracking-widest opacity-40 py-40">Contact Support Center</div>} />
            </Route>

            {/* Auth Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/team/register" element={<RegisterTeamPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="leagues" element={<div className="font-display text-3xl uppercase opacity-20 py-20">Leagues Management</div>} />
              <Route path="akc3" element={<div className="font-display text-3xl uppercase opacity-20 py-20">AKC3 Management Center</div>} />
              <Route path="settings" element={<div className="font-display text-3xl uppercase opacity-20 py-20">System Configuration</div>} />
            </Route>

            {/* Team Manager Routes */}
            <Route path="/team" element={<TeamLayout />}>
              <Route index element={<Navigate to="/team/dashboard" replace />} />
              <Route path="dashboard" element={<div className="font-display text-3xl uppercase opacity-20 py-20">Manager Hub</div>} />
              <Route path="profile" element={<div className="font-display text-3xl uppercase opacity-20 py-20">Club Profile</div>} />
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
