import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { changeLang } from '../i18n/i18n';
import type { SupportedLang } from '../i18n/i18n';
import { Link } from 'react-router';
import logo from '../assets/images/logo.png';
 
export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
 
  if (!user) return null;
 
  const currentLang = i18n.language as SupportedLang;
 
  const navLinks = [
    { to: '/',             label: t('nav.home') },
    { to: '/transactions', label: t('nav.transactions') },
    { to: '/history',      label: t('nav.history') },
    { to: '/profile',      label: t('nav.profile') },
  ];
 
  const LangToggle = () => (
    <div className="flex items-center bg-gray-700 dark:bg-gray-800 rounded-lg overflow-hidden text-xs font-semibold">
      {(['es', 'en'] as SupportedLang[]).map(l => (
        <button
          key={l}
          onClick={() => changeLang(l)}
          className={`px-3 py-1.5 transition ${
            currentLang === l
              ? 'bg-blue-500 text-white'
              : 'text-gray-300 hover:bg-gray-600'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
 
  const UserAvatar = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => (
    <div className={`rounded-full bg-indigo-600 dark:bg-indigo-700 flex items-center justify-center text-white font-bold ${
      size === 'sm' ? 'w-8 h-8 text-sm' : 'w-9 h-9 text-base'
    }`}>
      {user.username?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
 
  return (
    <nav className="bg-gray-800 dark:bg-gray-950 text-white shadow-lg fixed top-0 left-0 right-0 z-50 transition-colors border-b border-blue-400 dark:border-blue-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
 
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <img src={logo} alt="Logo" className="w-42 h-24 object-cover" />
            </Link>
          </div>
 
          {/* Desktop — links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-800 transition">
                {link.label}
              </Link>
            ))}
            <button onClick={logout}
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-800 transition">
              {t('nav.logout')}
            </button>
          </div>
 
          {/* Desktop — idioma + usuario */}
          <div className="hidden md:flex items-center space-x-3">
            <LangToggle />
            <div className="flex items-center space-x-2">
              <UserAvatar />
              <span className="text-sm font-medium">{user.username}</span>
            </div>
          </div>
 
          {/* Mobile — idioma + hamburguesa */}
          <div className="md:hidden flex items-center space-x-2">
            <LangToggle />
            <button onClick={() => setIsOpen(prev => !prev)}
              className="p-2 rounded-md hover:bg-gray-700 focus:outline-none"
              aria-label="Abrir menú">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>
 
      {/* Mobile — menú desplegable */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 dark:bg-gray-950">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 dark:hover:bg-gray-800 transition"
                onClick={() => setIsOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="flex items-center px-3 py-2 gap-3">
              <UserAvatar size="md" />
              <span className="text-base font-medium">{user.username}</span>
            </div>
            <button onClick={() => { setIsOpen(false); logout(); }}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-red-600 hover:bg-red-700 transition">
              {t('nav.logout')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}