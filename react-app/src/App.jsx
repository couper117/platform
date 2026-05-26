import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/leagues" element={<LeaguesPage />} />
            <Route path="/leagues/:id" element={<LeagueDetailsPage />} />
            <Route path="/fixtures" element={<FixturesPage />} />
            <Route path="/results" element={<FixturesPage />} />
            <Route path="/news" element={<div className="p-20 font-display text-3xl">News Page</div>} />
            <Route path="/news/:slug" element={<div className="p-20 font-display text-3xl">Article Page</div>} />
            <Route path="/matches/:id" element={<div className="p-20 font-display text-3xl">Match Details</div>} />
            <Route path="/contact" element={<div className="p-20 font-display text-3xl">Contact Page</div>} />
            <Route path="/akc3" element={<div className="p-20 font-display text-3xl">AKC3 Home</div>} />
          </Route>

          {/* Auth Routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/team/register" element={<RegisterTeamPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="leagues" element={<div className="font-display text-3xl">Manage Leagues</div>} />
            <Route path="fixtures" element={<div className="font-display text-3xl">Manage Fixtures</div>} />
            <Route path="teams" element={<div className="font-display text-3xl">Manage Teams</div>} />
            <Route path="players" element={<div className="font-display text-3xl">Manage Players</div>} />
            <Route path="documents" element={<div className="font-display text-3xl">Review Documents</div>} />
            <Route path="news" element={<div className="font-display text-3xl">Manage News</div>} />
            <Route path="akc3" element={<div className="font-display text-3xl">AKC3 Management</div>} />
            <Route path="settings" element={<div className="font-display text-3xl">System Settings</div>} />
          </Route>

          {/* Team Manager Routes */}
          <Route path="/team" element={<TeamLayout />}>
            <Route index element={<Navigate to="/team/dashboard" replace />} />
            <Route path="dashboard" element={<div className="font-display text-3xl">Team Dashboard</div>} />
            <Route path="players" element={<div className="font-display text-3xl">My Team Players</div>} />
            <Route path="documents" element={<div className="font-display text-3xl">Team Documents</div>} />
            <Route path="fixtures" element={<div className="font-display text-3xl">Team Fixtures</div>} />
            <Route path="profile" element={<div className="font-display text-3xl">Team Profile</div>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
