import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  if (!user) return null;

  return (
    <nav className="bg-gray-800 dark:bg-gray-950 text-white shadow-lg fixed top-0 left-0 right-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold">
              MiMishu
            </Link>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-800 transition"
            >
              Home
            </Link>
            <Link
              to="/transactions"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-800 transition"
            >
              Transacciones
            </Link>
            <Link
              to="/profile"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-800 transition"
            >
              Perfil
            </Link>
          </div>

          {/* Usuario + Logout + Dark toggle (desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {user.avatar ? (
                <img
                  //src={`${process.env.VITE_API_URL}${user.avatar}`}
                  src={`http://localhost:4000${user.avatar}`}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-700 flex items-center justify-center text-white font-bold text-sm">
                  {user.username?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium">
                {user.username || 'Usuario'}
              </span>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-800 transition"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition"
            >
              Cerrar Sesión
            </button>
          </div>

          {/* Hamburguesa mobile */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-700 transition"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md hover:bg-gray-700 focus:outline-none"
              aria-label="Abrir menú"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú mobile */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 dark:bg-gray-950">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 dark:hover:bg-gray-800 transition"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/transactions"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 dark:hover:bg-gray-800 transition"
              onClick={() => setIsOpen(false)}
            >
              Transacciones
            </Link>
            <Link
              to="/profile"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 dark:hover:bg-gray-800 transition"
              onClick={() => setIsOpen(false)}
            >
              Perfil
            </Link>

            <div className="flex items-center px-3 py-2">
              {user.avatar ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}${user.avatar}`}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover mr-3"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-700 flex items-center justify-center text-white font-bold text-sm mr-3">
                  {user.username?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-base font-medium">{user.username || 'Usuario'}</span>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-red-600 hover:bg-red-700 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}