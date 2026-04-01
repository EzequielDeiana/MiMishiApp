import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
 
type ProfileForm = {
  username:           string;
  name:               string;
  lastname:           string;
  currentPassword?:   string;
  newPassword?:       string;
  confirmNewPassword?: string;
};
 
type ProfilePayload = {
  username:        string;
  name:            string;
  lastname:        string;
  currentPassword?: string;
  password?:       string;
};
 
export default function Profile() {
  const { refreshUser, user } = useAuth();
  const { t } = useTranslation();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
 
  const {
    register, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm<ProfileForm>();
 
  useEffect(() => {
    if (user) {
      reset({
        username: user.username || '',
        name:     user.name     || '',
        lastname: user.lastname || '',
      });
    }
  }, [user, reset]);
 
  const newPassword = watch('newPassword');
 
  const onSubmit = async (data: ProfileForm) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: ProfilePayload = {
        username: data.username,
        name:     data.name,
        lastname: data.lastname,
      };
 
      if (data.newPassword) {
        if (!data.currentPassword) throw new Error(t('validation.required_current_pass'));
        if (data.newPassword !== data.confirmNewPassword) throw new Error(t('validation.passwords_match'));
        payload.currentPassword = data.currentPassword;
        payload.password        = data.newPassword;
      }
 
      const res = await axios.patch('/api/auth/profile', payload);
      if (res.data.token) localStorage.setItem('token', res.data.token);
 
      await refreshUser();
      toast.success(t('profile.success'));
      setSuccess(t('profile.success'));
 
      reset({
        username:           data.username,
        name:               data.name,
        lastname:           data.lastname,
        currentPassword:    '',
        newPassword:        '',
        confirmNewPassword: '',
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e.response?.data?.error || e.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };
 
  const inputClass = `w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg
    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
    focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition`;
 
  if (loading) return (
    <div className="max-w-xl mx-auto p-6">
      <Skeleton height={48} className="mb-10 mx-auto" />
      <Skeleton height={420} className="rounded-2xl" />
    </div>
  );
 
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-10 text-center text-gray-800 dark:text-gray-100">
        {t('profile.title')}
      </h1>
 
      {success && (
        <p className="text-green-600 dark:text-green-400 mb-6 text-center font-medium">{success}</p>
      )}
      {error && (
        <p className="text-red-600 dark:text-red-400 mb-6 text-center font-medium">{error}</p>
      )}
 
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700"
      >
        {/* Inicial del usuario como avatar decorativo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-indigo-600 dark:bg-indigo-700 flex items-center justify-center text-white text-4xl font-bold shadow-md">
            {user?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
        </div>
 
        {/* Campos de texto */}
        {([
          { name: 'username' as const, label: t('profile.username') },
          { name: 'name'     as const, label: t('profile.name') },
          { name: 'lastname' as const, label: t('profile.lastname') },
        ]).map(field => (
          <div key={field.name} className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
              {field.label}
            </label>
            <input
              type="text"
              {...register(field.name, { required: `${field.label} ${t('validation.required_field')}` })}
              className={inputClass}
            />
            {errors[field.name] && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1.5">
                {errors[field.name]?.message}
              </p>
            )}
          </div>
        ))}
 
        {/* Contraseñas */}
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
            {t('profile.current_pass')}{' '}
            <span className="text-gray-400 font-normal">{t('profile.current_pass_hint')}</span>
          </label>
          <input type="password" {...register('currentPassword')} className={inputClass} />
        </div>
 
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
            {t('profile.new_pass')}
          </label>
          <input
            type="password"
            {...register('newPassword', { minLength: { value: 6, message: t('validation.min_password') } })}
            className={inputClass}
          />
          {errors.newPassword && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.newPassword.message}</p>
          )}
        </div>
 
        <div className="mb-10">
          <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
            {t('profile.confirm_pass')}
          </label>
          <input
            type="password"
            {...register('confirmNewPassword', {
              validate: v => !newPassword || v === newPassword || t('validation.passwords_match'),
            })}
            className={inputClass}
          />
          {errors.confirmNewPassword && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.confirmNewPassword.message}</p>
          )}
        </div>
 
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600
                     text-white py-3.5 rounded-xl font-medium transition
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('profile.saving') : t('profile.save')}
        </button>
      </form>
    </div>
  );
}