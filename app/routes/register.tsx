import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
 
type RegisterFormLocal = {
  username: string;
  name: string;
  lastname: string;
  age: string;
  email: string;
  password: string;
  confirmPassword: string;
};
 
export default function Register() {
  const navigate = useNavigate();
  const { user, isLoading, register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
 
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormLocal>({
    defaultValues: { age: '' },
  });
 
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);
 
  const password = watch('password');
 
  const onSubmit = async (data: RegisterFormLocal) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
 
    try {
      await registerUser(data);
      setSuccess('¡Cuenta creada exitosamente! Redirigiendo...');
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(
        axiosError.response?.data?.error ||
        'Error al registrar. Intenta con otro username o email.'
      );
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 transition-colors py-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          Crear Cuenta
        </h2>
 
        {error && (
          <p className="text-red-600 dark:text-red-400 mb-4 text-center text-sm font-medium">
            {error}
          </p>
        )}
 
        {success && (
          <p className="text-green-600 dark:text-green-400 mb-4 text-center text-sm font-medium">
            {success}
          </p>
        )}
 
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Username */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Nombre de usuario
            </label>
            <input
              type="text"
              {...register('username', {
                required: 'El nombre de usuario es obligatorio',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition"
            />
            {errors.username && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>
 
          {/* Nombre */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Nombre
            </label>
            <input
              type="text"
              {...register('name', { required: 'El nombre es obligatorio' })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition"
            />
            {errors.name && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
 
          {/* Apellido */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Apellido
            </label>
            <input
              type="text"
              {...register('lastname', { required: 'El apellido es obligatorio' })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition"
            />
            {errors.lastname && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.lastname.message}</p>
            )}
          </div>
 
          {/* Edad */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Edad
            </label>
            <input
              type="number"
              {...register('age', {
                required: 'La edad es obligatoria',
                min: { value: 13, message: 'Debes tener al menos 13 años' },
              })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition"
            />
            {errors.age && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.age.message}</p>
            )}
          </div>
 
          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Email
            </label>
            <input
              type="email"
              {...register('email', {
                required: 'El email es obligatorio',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido',
                },
              })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition"
            />
            {errors.email && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
 
          {/* Contraseña */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Contraseña
            </label>
            <input
              type="password"
              {...register('password', {
                required: 'La contraseña es obligatoria',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition"
            />
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>
 
          {/* Confirmar contraseña */}
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Confirmar contraseña
            </label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Confirma tu contraseña',
                validate: value => value === password || 'Las contraseñas no coinciden',
              })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
 
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600
                       text-white py-3 rounded-xl font-medium transition
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
 
        <p className="mt-5 text-center text-gray-600 dark:text-gray-400 text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-indigo-500 hover:text-indigo-400 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}