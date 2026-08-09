import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';
import rw from './locales/rw.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'rw', label: 'Kinyarwanda', short: 'RW' },
  { code: 'fr', label: 'Français', short: 'FR' },
];

export const STORAGE_KEY = 'rnsp-lang';

const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

const readStoredLanguage = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const detectLanguage = () => {
  const stored = readStoredLanguage();
  if (SUPPORTED_CODES.includes(stored)) return stored;

  const navigatorLangs = typeof navigator === 'undefined'
    ? []
    : [navigator.language, ...(navigator.languages || [])].filter(Boolean);

  for (const tag of navigatorLangs) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (SUPPORTED_CODES.includes(base)) return base;
  }

  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      rw: { translation: rw },
      fr: { translation: fr },
    },
    lng: detectLanguage(),
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_CODES,
    interpolation: {
      escapeValue: false,
    },
    returnEmptyString: false,
  });

const syncDocumentLanguage = (lng) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('lang', lng);
  document.title = i18n.t('seo.site_title');
};

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
  }
  syncDocumentLanguage(lng);
});

syncDocumentLanguage(i18n.language);

export const changeLanguage = (lng) => {
  if (!SUPPORTED_CODES.includes(lng)) return;
  i18n.changeLanguage(lng);
};

export default i18n;
