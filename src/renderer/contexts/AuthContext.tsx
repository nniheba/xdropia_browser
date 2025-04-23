import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  plan: 'free' | 'premium' | 'team';
  maxSessions: number;
  activeSessions: number;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [navigate]);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }

      await api.validateToken();

      const userData = await api.getCurrentUser();
      
      const sessionsData = await api.checkActiveSessions();
      
      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        plan: userData.meta?.plan || 'free',
        maxSessions: userData.meta?.plan === 'team' ? 5 : 1,
        activeSessions: sessionsData.active_sessions || 0,
        isAdmin: userData.meta?.role === 'administrator' || false
      };
      
      if (user.activeSessions >= user.maxSessions) {
        if (user.plan === 'team') {
          setError(`Has excedido el límite de ${user.maxSessions} sesiones activas para tu plan de equipo`);
        } else {
          setError('Solo puedes tener una sesión activa con tu plan actual');
        }
        await api.logout();
        return false;
      }
      
      setUser(user);
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await api.login(email, password);
      
      const userData = await api.getCurrentUser();
      
      const sessionsData = await api.checkActiveSessions();
      
      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        plan: userData.meta?.plan || 'free',
        maxSessions: userData.meta?.plan === 'team' ? 5 : 1,
        activeSessions: sessionsData.active_sessions || 0,
        isAdmin: userData.meta?.role === 'administrator' || false
      };
      
      if (user.activeSessions >= user.maxSessions) {
        if (user.plan === 'team') {
          setError(`Has excedido el límite de ${user.maxSessions} sesiones activas para tu plan de equipo`);
        } else {
          setError('Solo puedes tener una sesión activa con tu plan actual');
        }
        await api.logout();
        return;
      }
      
      await api.registerSession();
      
      user.activeSessions += 1;
      
      setUser(user);
      
      if (window.api) {
        await window.api.setUserData(user);
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    
    try {
      await api.logout();
      
      setUser(null);
      
      if (window.api) {
        await window.api.clearUserData();
      }
      
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
