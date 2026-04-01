import { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { useNavigate } from 'react-router';
import type { RegisterForm } from '../types/auth';
 
interface User {
  userId:    string;
  username?: string;
  name?:     string;
  lastname?: string;
}
 
interface AuthContextType {
  user:        User | null;
  login:       (email: string, password: string) => Promise<void>;
  register:    (formData: RegisterForm) => Promise<void>;
  logout:      () => void;
  isLoading:   boolean;
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
 
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
 
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<User>(token);
        setUser(decoded);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch {
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);
 
  const refreshUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
    } catch {
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (err) {
      throw err;
    }
  };
 
  const register = async (formData: RegisterForm) => {
    try {
      const response = await axios.post('/api/auth/register', formData);
      if (!response.data.token) throw new Error('No token en respuesta');
      localStorage.setItem('token', response.data.token);
      const decoded = jwtDecode<User>(response.data.token);
      setUser(decoded);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    } catch (err) {
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