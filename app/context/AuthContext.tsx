import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { useContext } from 'react';
import { useNavigate } from 'react-router';
import type { RegisterForm } from '../types/auth';

interface User {
  userId: string;
  username?: string;
  name?: string;
  lastname?: string;
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (formData: RegisterForm) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const loadUserFromToken = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = jwtDecode<User>(token);
      setUser(decoded);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('User cargado desde token:', decoded);
    } catch (err) {
      console.error('Token inválido al cargar manualmente', err);
      localStorage.removeItem('token');
    }
  }
  setIsLoading(false);
};
console.log('AuthProvider - render inicial, isLoading =', isLoading, 'user =', user);
 useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<User>(token);
        setUser(decoded);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.error('Token inválido al cargar', err);
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
    console.log('AuthProvider - carga terminada, isLoading = false');
  }, []);

   const refreshUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
      
      console.log('Usuario refrescado en contexto:', res.data.user);
    } catch (err) {
      console.error('Error refrescando usuario:', err);
      logout();
    }
  };


  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token } = res.data;
      localStorage.setItem('token', token);

      const decoded = jwtDecode<User>(token);
      setUser(decoded);
      console.log('User seteado después de login/register:', decoded);
      console.log('User cargado al F5:', decoded);

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (err) {
      console.error('Error en login', err);
      throw err;
    }
  };

  const register = async (formData: RegisterForm) => {
  try {
    const response = await axios.post('/api/auth/register', formData);
    console.log('POST register respuesta:', response.data);

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      const decoded = jwtDecode<User>(response.data.token);
      console.log('Decoded token en register:', decoded);
      setUser(decoded);
      console.log('User seteado después de login/register:', decoded);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    } else {
      throw new Error('No token en respuesta');
    }
  } catch (err) {
    console.error('Error en register del contexto:', err);
    throw err;
  }
};

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}