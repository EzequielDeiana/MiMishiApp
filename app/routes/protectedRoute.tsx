import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
 
export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();
 
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-400">
        Cargando sesión...
      </div>
    );
  }
 
  if (!user) {
    return <Navigate to="/login" replace />;
  }
 
  return <Outlet />;
}
 