import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
 
export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();
 
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-400">
        {t('general.loading_session')}
      </div>
    );
  }
 
  if (!user) return <Navigate to="/login" replace />;
 
  return <Outlet />;
}
 