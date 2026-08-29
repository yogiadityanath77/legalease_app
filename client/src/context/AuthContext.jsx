import { createContext, useContext, useMemo, useState } from 'react';
import api from '../utils/axios';

const AuthContext = createContext(null);

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(readUser);

  const persist = (nextToken, nextUser) => {
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const register = async ({ name, email, password }) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    persist(data.token, data.user);
    return data;
  };

  const login = async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.token, data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, isAuthenticated: Boolean(token), register, login, logout }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
