import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiFetch, setToken as saveToken, removeToken, getToken, getUser, setUser as saveUser } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiFetch('/users/tokens', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Login failed' };
      }

      const data = await response.json();
      const { token: authToken, user: userData } = data;

      // Store  user data
      await saveToken(authToken);
      await saveUser(userData);

      setToken(authToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed. Please check your connection.'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Registration failed' };
      }

      const data = await response.json();
      const { token: authToken, user: newUser } = data;

      // Store  user data
      await saveToken(authToken);
      await saveUser(newUser);

      setToken(authToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed. Please check your connection.'
      };
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await removeToken();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};