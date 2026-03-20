import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import en from './locales/en.json';
 
// Evitar re-inicializar si ya fue inicializado (SSR puede llamar esto múltiples veces)
if (!i18n.isInitialized) {
  // ✅ localStorage solo en cliente
  const savedLang =
    typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
  const defaultLang =
    savedLang === 'en' || savedLang === 'es' ? savedLang : 'es';
 
  i18n.use(initReactI18next).init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: defaultLang,
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}
 
export const changeLang = (lang: 'es' | 'en') => {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    localStorage.setItem('lang', lang);
  }
};
 
export type SupportedLang = 'es' | 'en';
 
export default i18n;