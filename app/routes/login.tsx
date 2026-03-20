import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router';
 
type LoginForm = { email: string; password: string };
 
export default function Login() {
  const { login, user, isLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
 
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
 
  useEffect(() => {
    if (user && !isLoading) navigate('/', { replace: true });
  }, [user, isLoading, navigate]);
 
  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || t('auth.login_error'));
    } finally {
      setLoading(false);
    }
  };
 
  const inputClass = `w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
    focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition`;
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 transition-colors">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          {t('auth.login_title')}
        </h2>
 
        {error && <p className="text-red-600 dark:text-red-400 mb-4 text-center text-sm font-medium">{error}</p>}
 
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">{t('auth.email')}</label>
            <input type="email" {...register('email', { required: t('validation.required_email') })} className={inputClass} />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
 
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">{t('auth.password')}</label>
            <input type="password" {...register('password', { required: t('validation.required_password') })} className={inputClass} />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
 
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600
                       text-white py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? t('auth.login_loading') : t('auth.login_submit')}
          </button>
        </form>
 
        <p className="mt-5 text-center text-gray-600 dark:text-gray-400 text-sm">
          {t('auth.login_no_account')}{' '}
          <Link to="/register" className="text-indigo-500 hover:text-indigo-400 hover:underline font-medium">
            {t('auth.login_register_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}