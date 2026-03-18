import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();
console.log('ProtectedRoute - render: isLoading =', isLoading, 'user =', user);
  if (isLoading) {
    console.log('ProtectedRoute - todavía cargando sesión');
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - no hay user, redirigiendo a login');
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
