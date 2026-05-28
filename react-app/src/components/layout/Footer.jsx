import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-surface-dark text-white pt-12 pb-6 border-t-4 border-rwanda-green">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <h3 className="font-display text-2xl text-red uppercase tracking-tighter">RwaSport</h3>
          <p className="text-sm opacity-60">
            Official Rwanda National Sports Platform. Managing leagues, teams, and athletes across the nation.
          </p>
          <div className="flex space-x-4">
            <div className="w-8 h-8 rounded-full bg-surface-dark2 flex items-center justify-center hover:bg-red cursor-pointer transition-colors text-[10px] font-bold">FB</div>
            <div className="w-8 h-8 rounded-full bg-surface-dark2 flex items-center justify-center hover:bg-red cursor-pointer transition-colors text-[10px] font-bold">X</div>
            <div className="w-8 h-8 rounded-full bg-surface-dark2 flex items-center justify-center hover:bg-red cursor-pointer transition-colors text-[10px] font-bold">IG</div>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-rwanda-yellow uppercase">Quick Links</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li><Link to="/leagues" className="hover:text-red transition-colors">All Leagues</Link></li>
            <li><Link to="/fixtures" className="hover:text-red transition-colors">Upcoming Fixtures</Link></li>
            <li><Link to="/results" className="hover:text-red transition-colors">Match Results</Link></li>
            <li><Link to="/news" className="hover:text-red transition-colors">Latest News</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-rwanda-yellow uppercase">Leagues</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li><Link to="/sports/football" className="hover:text-red transition-colors">Football</Link></li>
            <li><Link to="/sports/basketball" className="hover:text-red transition-colors">Basketball</Link></li>