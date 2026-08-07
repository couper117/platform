import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-surface-dark text-white pt-12 pb-6 border-t-4 border-rwanda-green">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <h3 className="font-display text-2xl text-red uppercase tracking-tighter">RwaSport</h3>
          <p className="text-sm opacity-60">
            {t('footer.about')}
          </p>
          <div className="flex space-x-4">
            <div className="w-8 h-8 rounded-full bg-surface-dark2 flex items-center justify-center hover:bg-red cursor-pointer transition-colors text-[10px] font-bold">FB</div>
            <div className="w-8 h-8 rounded-full bg-surface-dark2 flex items-center justify-center hover:bg-red cursor-pointer transition-colors text-[10px] font-bold">X</div>
            <div className="w-8 h-8 rounded-full bg-surface-dark2 flex items-center justify-center hover:bg-red cursor-pointer transition-colors text-[10px] font-bold">IG</div>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-rwanda-yellow uppercase">{t('footer.quick_links')}</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li><Link to="/leagues" className="hover:text-red transition-colors">{t('footer.all_leagues')}</Link></li>
            <li><Link to="/fixtures" className="hover:text-red transition-colors">{t('footer.upcoming_fixtures')}</Link></li>
            <li><Link to="/results" className="hover:text-red transition-colors">{t('footer.match_results')}</Link></li>
            <li><Link to="/news" className="hover:text-red transition-colors">{t('footer.latest_news')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-rwanda-yellow uppercase">{t('nav.leagues')}</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li><Link to="/sports/football" className="hover:text-red transition-colors">{t('enums.sport.FOOTBALL')}</Link></li>
            <li><Link to="/sports/basketball" className="hover:text-red transition-colors">{t('enums.sport.BASKETBALL')}</Link></li>
            <li><Link to="/sports/volleyball" className="hover:text-red transition-colors">{t('enums.sport.VOLLEYBALL')}</Link></li>
            <li><Link to="/amashuri" className="hover:text-red transition-colors">{t('footer.kagame_cup')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-rwanda-yellow uppercase">{t('footer.contact_us')}</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li>{t('footer.email')}: info@rwasport.rw</li>
            <li>{t('footer.phone')}: +250 123 456 789</li>
            <li>{t('footer.address')}: Kigali, Rwanda</li>
            <li className="pt-2">
              <Link to="/contact" className="inline-block bg-surface-dark2 px-4 py-2 border border-surface-3 rounded hover:border-red hover:text-red transition-colors font-display text-xs uppercase tracking-widest">
                {t('footer.send_message')}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12 pt-6 border-t border-surface-dark2 flex flex-col md:flex-row justify-between items-center text-[10px] opacity-40 uppercase tracking-widest">
        <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link to="/privacy">{t('footer.privacy')}</Link>
          <Link to="/terms">{t('footer.terms')}</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
