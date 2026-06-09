import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import he from './locales/he.json';
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import de from './locales/de.json';

export const SUPPORTED_LANGS = ['he', 'en', 'es', 'pt', 'ru', 'de'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

// Sets the document direction + lang attribute. Hebrew is RTL, everything else
// LTR. Guarded so it is a no-op in non-DOM environments (e.g. the Node test run).
function applyDir(lng: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.dir = lng === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      he: { translation: he },
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
      ru: { translation: ru },
      de: { translation: de },
    },
    supportedLngs: [...SUPPORTED_LANGS],
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'pn_lang',
      caches: ['localStorage'],
    },
  });

// Apply the resolved direction once after init, and on every change.
applyDir(i18n.resolvedLanguage ?? i18n.language ?? 'he');
i18n.on('languageChanged', applyDir);

export default i18n;
