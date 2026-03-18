import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
 
type ProfileForm = {
  username: string;
  name: string;
  lastname: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
};
 
type ProfilePayload = {
  username: string;
  name: string;
  lastname: string;
  currentPassword?: string;
  password?: string;
};
 
export default function Profile() {
  const { refreshUser, user } = useAuth();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
 
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>();
 
  useEffect(() => {
    if (user) {
      reset({
        username: user.username || '',
        name: user.name || '',
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
        name: data.name,
        lastname: data.lastname,
      };
 
      if (data.newPassword) {
        if (!data.currentPassword) throw new Error('Debes ingresar la contraseña actual');
        if (data.newPassword !== data.confirmNewPassword) throw new Error('Las contraseñas no coinciden');
        payload.currentPassword = data.currentPassword;
        payload.password = data.newPassword;
      }
 
      const res = await axios.patch('/api/auth/profile', payload);
 
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
 
      await refreshUser();
      toast.success('Perfil actualizado exitosamente');
      setSuccess('Perfil actualizado exitosamente');
 
      reset({
        username: data.username,
        name: data.name,
        lastname: data.lastname,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } }; message?: string };
      setError(axiosError.response?.data?.error || axiosError.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };
 
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Skeleton height={48} className="mb-10 mx-auto" />
        <Skeleton height={520} className="rounded-2xl" />
      </div>
    );
  }
 
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-10 text-center text-gray-800 dark:text-gray-100">
        Configuración de Cuenta
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
        {/* Avatar */}
        <div className="mb-10">
          <label className="block text-gray-700 dark:text-gray-300 mb-4 font-semibold text-lg">
            Imagen de perfil
          </label>
 
          <div className="flex flex-col sm:flex-row items-center gap-8 mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-300 dark:border-gray-600 shadow-md flex-shrink-0">
              {preview ? (
                <img src={preview} alt="Previsualización" className="w-full h-full object-cover" />
              ) : user?.avatar ? (
                <img
                  //src={`${process.env.VITE_API_URL}${user.avatar}`}
                  src={`http://localhost:4000${user.avatar}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={e => (console.log(e))}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-5xl font-bold text-gray-600 dark:text-gray-300">
                  {user?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
 
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.avatar ? 'Imagen actual' : 'Sin imagen de perfil'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Recomendado: 200×200 px
              </p>
            </div>
          </div>
 
          <input
            id="avatar-input"
            type="file"
            accept="image/jpeg,image/png"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result as string);
                reader.readAsDataURL(file);
              } else {
                setPreview(null);
              }
            }}
            className="block w-full text-sm text-gray-700 dark:text-gray-300
                       file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0
                       file:text-sm file:font-medium
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100
                       dark:file:bg-indigo-950/60 dark:file:text-indigo-300
                       dark:hover:file:bg-indigo-900/60"
          />
        </div>
 
        {/* Botones avatar */}
        <div className="flex flex-wrap gap-4 mb-10">
          <button
            type="button"
            onClick={async () => {
              const fileInput = document.getElementById('avatar-input') as HTMLInputElement | null;
              if (!fileInput?.files?.length) {
                setError('No seleccionaste ninguna imagen');
                return;
              }
 
              const file = fileInput.files[0];
              const formData = new FormData();
              formData.append('avatar', file);
 
              try {
                const res = await axios.post('/api/auth/profile/avatar', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
 
                if (res.data.token) {
                  localStorage.setItem('token', res.data.token);
                }
 
                await refreshUser();
                toast.success('Imagen de perfil actualizada');
                setPreview(null);
                fileInput.value = '';
              } catch {
                toast.error('Error al subir imagen');
              }
            }}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-6 py-2.5 rounded-lg transition"
          >
            Subir Imagen
          </button>
 
          <button
            type="button"
            onClick={async () => {
              if (!confirm('¿Borrar imagen de perfil?')) return;
              try {
                const res = await axios.delete('/api/auth/profile/avatar');
                if (res.data.token) {
                  localStorage.setItem('token', res.data.token);
                }
                await refreshUser();
                toast.success('Imagen de perfil eliminada');
              } catch {
                toast.error('Error al eliminar imagen');
              }
            }}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white px-6 py-2.5 rounded-lg transition"
          >
            Borrar Imagen
          </button>
        </div>
 
        {/* Campos de texto — username, name, lastname */}
        {(
          [
            { name: 'username', label: 'Nombre de usuario' },
            { name: 'name', label: 'Nombre' },
            { name: 'lastname', label: 'Apellido' },
          ] as const
        ).map(field => (
          <div key={field.name} className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
              {field.label}
            </label>
            <input
              type="text"
              {...register(field.name, { required: `${field.label} es obligatorio` })}
              className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition"
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
            Contraseña actual <span className="text-gray-400 dark:text-gray-500 font-normal">(solo si querés cambiarla)</span>
          </label>
          <input
            type="password"
            {...register('currentPassword')}
            className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition"
          />
        </div>
 
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
            Nueva contraseña
          </label>
          <input
            type="password"
            {...register('newPassword', {
              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
            })}
            className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition"
          />
          {errors.newPassword && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.newPassword.message}</p>
          )}
        </div>
 
        <div className="mb-10">
          <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
            Confirmar nueva contraseña
          </label>
          <input
            type="password"
            {...register('confirmNewPassword', {
              validate: value =>
                !newPassword || value === newPassword || 'Las contraseñas no coinciden',
            })}
            className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition"
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
          {loading ? 'Actualizando...' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  );
}