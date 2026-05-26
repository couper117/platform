import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';
import rw from './locales/rw.json';
import sw from './locales/sw.json';

const savedLang = localStorage.getItem('rnsp-lang') || 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr }, rw: { translation: rw }, sw: { translation: sw } },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;