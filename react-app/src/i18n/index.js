import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';
import rw from './locales/rw.json';
import sw from './locales/sw.json';

const SUPPORTED = ['en', 'fr', 'rw', 'sw'];
// Prefer a stored choice, then the browser language, then English.
const browserLang = (navigator.language || 'en').slice(0, 2).toLowerCase();
const initialLang = localStorage.getItem('rnsp-lang')
  || (SUPPORTED.includes(browserLang) ? browserLang : 'en');

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      rw: { translation: rw },
      sw: { translation: sw },
    },
    lng: initialLang,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED,
    interpolation: {
      escapeValue: false,
    },
  });

// Keep <html lang> in sync for a11y/SEO.
const applyHtmlLang = (lng) => { document.documentElement.lang = lng; };
applyHtmlLang(initialLang);
i18n.on('languageChanged', applyHtmlLang);

export default i18n;
