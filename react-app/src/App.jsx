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
const AdminAdsPage = lazy(() => import('./pages/admin/AdminAdsPage'));
const AdminVisitorsPage = lazy(() => import('./pages/admin/AdminVisitorsPage'));
const AdminChampionshipsPage = lazy(() => import('./pages/admin/AdminChampionshipsPage'));
const LiveReportingPage = lazy(() => import('./pages/admin/LiveReportingPage'));

// Team Pages
const TeamDashboard = lazy(() => import('./pages/team/TeamDashboard'));

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