import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
 
export default function DarkModeButton() {
  const { t } = useTranslation();
 
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
 
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);
 
  return (
    <button
      onClick={() => setDarkMode(prev => !prev)}
      aria-label={t('general.dark_mode')}
      className="fixed bottom-6 left-6 z-50
                 w-12 h-12 rounded-full shadow-lg
                 bg-white dark:bg-gray-800
                 border border-gray-200 dark:border-gray-700
                 flex items-center justify-center text-xl
                 hover:scale-110 active:scale-95 transition-transform duration-150"
    >
      {darkMode ? '☀️' : '🌙'}
    </button>
  );
}
 