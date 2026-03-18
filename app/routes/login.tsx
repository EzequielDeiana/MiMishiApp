import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router';
 
type LoginForm = {
  email: string;
  password: string;
};
 
export default function Login() {
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
 
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();
 
  // ✅ Redirige si ya está autenticado
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);
 
  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 transition-colors">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          Iniciar Sesión
        </h2>
 
        {error && (
          <p className="text-red-600 dark:text-red-400 mb-4 text-center text-sm font-medium">
            {error}
          </p>
        )}
 
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Email
            </label>
            <input
              type="email"
              {...register('email', { required: 'El email es obligatorio' })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mt-1
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                         placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
            />
            {errors.email && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
 
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Contraseña
            </label>
            <input
              type="password"
              {...register('password', { required: 'La contraseña es obligatoria' })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mt-1
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                         placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
            />
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>
 
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600
                       text-white py-3 rounded-xl font-medium transition
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
 
        <p className="mt-5 text-center text-gray-600 dark:text-gray-400 text-sm">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-indigo-500 hover:text-indigo-400 hover:underline font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
 