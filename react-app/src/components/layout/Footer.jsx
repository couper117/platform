import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-surface-dark text-white pt-12 pb-6 border-t-4 border-rwanda-green">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <h3 className="font-display text-2xl text-red">RNSP</h3>
          <p className="text-sm opacity-60">
            Official Rwanda National Sports Platform. Managing leagues, teams, and athletes across the nation.
          </p>
          <div className="flex space-x-4">
            {/* Social Icons Placeholder */}
            <div className="w-8 h-8 rounded-full bg-surface-dark2 flex items-center justify-center hover:bg-red cursor-pointer transition-colors">f</div>
            <div className="w-8 h-8 rounded-full bg-surface-dark2 flex items-center justify-center hover:bg-red cursor-pointer transition-colors">t</div>
            <div className="w-8 h-8 rounded-full bg-surface-dark2 flex items-center justify-center hover:bg-red cursor-pointer transition-colors">i</div>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-rwanda-yellow">Quick Links</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li><Link to="/leagues" className="hover:text-red transition-colors">All Leagues</Link></li>
            <li><Link to="/fixtures" className="hover:text-red transition-colors">Upcoming Fixtures</Link></li>
            <li><Link to="/results" className="hover:text-red transition-colors">Match Results</Link></li>
            <li><Link to="/news" className="hover:text-red transition-colors">Latest News</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-rwanda-yellow">Leagues</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li><Link to="/sports/football" className="hover:text-red transition-colors">Football</Link></li>
            <li><Link to="/sports/basketball" className="hover:text-red transition-colors">Basketball</Link></li>
            <li><Link to="/sports/volleyball" className="hover:text-red transition-colors">Volleyball</Link></li>
            <li><Link to="/akc3" className="hover:text-red transition-colors">Amashuri Kagame Cup</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-rwanda-yellow">Contact Us</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li>Email: info@rnsp.rw</li>
            <li>Phone: +250 123 456 789</li>
            <li>Address: Kigali, Rwanda</li>
            <li className="pt-2">
              <Link to="/contact" className="inline-block bg-surface-dark2 px-4 py-2 border border-surface-3 rounded hover:border-red hover:text-red transition-colors">
                Send a Message
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-6 border-t border-surface-dark2 flex flex-col md:flex-row justify-between items-center text-[10px] opacity-40 uppercase tracking-widest">
        <p>&copy; 2026 Rwanda National Sports Platform. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
