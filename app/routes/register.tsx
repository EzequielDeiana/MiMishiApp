import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

console.log('Register.tsx - render inicial');

type RegisterForm = {
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
    const { user, isLoading } = useAuth()
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterForm>({
        defaultValues: {
            age: '',
        },
    });

    const handleRegister = async (formData: RegisterForm) => {
        try {
            const response = await axios.post('/api/auth/register', formData);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            } else {
                throw new Error('No token recibido');
            }
        } catch (err) {
            throw err;
        }
    };

    useEffect(() => {
        if (user && !isLoading) {
            navigate('/', { replace: true });
        }
    }, [user, isLoading, navigate]);

    const password = watch('password');

    const { register: registerUser } = useAuth();

    const onSubmit = async (data: RegisterForm) => {
        if (data.password !== data.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            console.log('Llamando register del contexto con data:', data);
            await registerUser(data);
            console.log('registerUser terminó con éxito');
            setSuccess('¡Cuenta creada exitosamente! Redirigiendo...');
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 1500);
        } catch (err: any) {
            console.error('Error desde registerUser:', err);
            setError(
                err.response?.data?.error ||
                'Error al registrar. Intenta con otro username o email.'
            );
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">Crear Cuenta</h2>

                {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-4">
                        <label className="block text-gray-700">Nombre de usuario</label>
                        <input
                            type="text"
                            {...register('username', {
                                required: 'El nombre de usuario es obligatorio',
                                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                            })}
                            className="w-full p-2 border rounded mt-1 text-gray-700"
                        />
                        {errors.username && (
                            <p className="text-red-500 text-sm">{errors.username.message}</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700">Nombre</label>
                        <input
                            type="text"
                            {...register('name', { required: 'El nombre es obligatorio' })}
                            className="w-full p-2 border rounded mt-1 text-gray-700"
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700">Apellido</label>
                        <input
                            type="text"
                            {...register('lastname', { required: 'El apellido es obligatorio' })}
                            className="w-full p-2 border rounded mt-1 text-gray-700"
                        />
                        {errors.lastname && (
                            <p className="text-red-500 text-sm">{errors.lastname.message}</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700">Edad</label>
                        <input
                            type="number"
                            {...register('age', {
                                required: 'La edad es obligatoria',
                                min: { value: 13, message: 'Debes tener al menos 13 años' },
                            })}
                            className="w-full p-2 border rounded mt-1 text-gray-700"
                        />
                        {errors.age && <p className="text-red-500 text-sm">{errors.age.message}</p>}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            {...register('email', {
                                required: 'El email es obligatorio',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Email inválido',
                                },
                            })}
                            className="w-full p-2 border rounded mt-1 text-gray-700"
                        />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700">Contraseña</label>
                        <input
                            type="password"
                            {...register('password', {
                                required: 'La contraseña es obligatoria',
                                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                            })}
                            className="w-full p-2 border rounded mt-1 text-gray-700"
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700">Confirmar contraseña</label>
                        <input
                            type="password"
                            {...register('confirmPassword', {
                                required: 'Confirma tu contraseña',
                            })}
                            className="w-full p-2 border rounded mt-1 text-gray-700"
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button
                        style={{ cursor: 'pointer' }}
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Creando cuenta...' : 'Registrarse'}
                    </button>
                </form>

                <p className="mt-4 text-center text-gray-700">
                    ¿Ya tienes cuenta? {' '}
                    <a href="/login" className="text-blue-600 hover:underline">
                        Inicia sesión
                    </a>
                </p>
                {success && (
                    <p className="text-green-600 mb-4 text-center font-medium">{success}</p>
                )}
            </div>
        </div>
    );
}
