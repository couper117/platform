import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const navItems = [
  { path: '/admin', label: 'dashboard', icon: '📊' },
  { path: '/admin/sports', label: 'sports', icon: '🏅' },
  { path: '/admin/leagues', label: 'leagues', icon: '🏆' },
  { path: '/admin/teams', label: 'teams', icon: '⚽' },
  { path: '/admin/fixtures', label: 'fixtures', icon: '📅' },
  { path: '/admin/players', label: 'players', icon: '👥' },
  { path: '/admin/news', label: 'news', icon: '📰' },
  { path: '/admin/users', label: 'admin_users', icon: '👤' },
  { path: '/admin/settings', label: 'settings', icon: '⚙️' },
  { path: '/admin/activity', label: 'activity_log', icon: '📋' },
];

export default function AdminLayout() {
  const { t } = useTranslation();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>RNSP Admin</h2>
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`} end={item.path === '/admin'}>
            <span>{item.icon}</span>
            <span>{t(item.label)}</span>
          </NavLink>
        ))}
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}