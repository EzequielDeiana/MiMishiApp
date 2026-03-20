import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
 
type RegisterFormLocal = {
  username: string; name: string; lastname: string;
  age: string; email: string; password: string; confirmPassword: string;
};
 
export default function Register() {
  const navigate = useNavigate();
  const { user, isLoading, register: registerUser } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
 
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormLocal>({
    defaultValues: { age: '' },
  });
 
  useEffect(() => {
    if (user && !isLoading) navigate('/', { replace: true });
  }, [user, isLoading, navigate]);
 
  const password = watch('password');
 
  const onSubmit = async (data: RegisterFormLocal) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await registerUser(data);
      setSuccess(t('auth.register_success'));
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || t('auth.register_error'));
    } finally {
      setLoading(false);
    }
  };
 
  const inputClass = `w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
    focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition`;
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 transition-colors py-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          {t('auth.register_title')}
        </h2>
 
        {error && <p className="text-red-600 dark:text-red-400 mb-4 text-center text-sm font-medium">{error}</p>}
        {success && <p className="text-green-600 dark:text-green-400 mb-4 text-center text-sm font-medium">{success}</p>}
 
        <form onSubmit={handleSubmit(onSubmit)}>
          {[
            { name: 'username' as const, label: t('auth.username'), type: 'text', rules: { required: t('validation.required_username'), minLength: { value: 3, message: t('validation.min_username') } } },
            { name: 'name' as const, label: t('auth.name'), type: 'text', rules: { required: t('validation.required_name') } },
            { name: 'lastname' as const, label: t('auth.lastname'), type: 'text', rules: { required: t('validation.required_lastname') } },
            { name: 'age' as const, label: t('auth.age'), type: 'number', rules: { required: t('validation.required_age'), min: { value: 13, message: t('validation.min_age') } } },
            { name: 'email' as const, label: t('auth.email'), type: 'email', rules: { required: t('validation.required_email'), pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: t('validation.invalid_email') } } },
            { name: 'password' as const, label: t('auth.password'), type: 'password', rules: { required: t('validation.required_password'), minLength: { value: 6, message: t('validation.min_password') } } },
          ].map(field => (
            <div key={field.name} className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">{field.label}</label>
              <input type={field.type} {...register(field.name, field.rules)} className={inputClass} />
              {errors[field.name] && <p className="text-red-500 text-sm mt-1">{errors[field.name]?.message}</p>}
            </div>
          ))}
 
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">{t('auth.register_confirm')}</label>
            <input type="password" {...register('confirmPassword', {
              required: t('validation.confirm_password'),
              validate: v => v === password || t('validation.passwords_match'),
            })} className={inputClass} />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>
 
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600
                       text-white py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? t('auth.register_loading') : t('auth.register_submit')}
          </button>
        </form>
 
        <p className="mt-5 text-center text-gray-600 dark:text-gray-400 text-sm">
          {t('auth.register_has_account')}{' '}
          <Link to="/login" className="text-indigo-500 hover:text-indigo-400 hover:underline font-medium">
            {t('auth.register_login_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}