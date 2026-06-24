'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();

  // Load token and user session on startup
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          // Verify session
          const userData = await api.get('/auth/me');
          setUser(userData);
          // Fetch notifications
          fetchNotifications();
        } catch (error) {
          console.log('Session verification failed, logging out...');
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const data = await api.post('/auth/login', { username, password });
      
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      
      // Fetch initial notifications
      setTimeout(async () => {
        try {
          const list = await api.get('/notifications');
          setNotifications(list);
        } catch (err) {
          console.error(err);
        }
      }, 100);

      // Redirect based on role
      router.push('/dashboard');
      return data.user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setNotifications([]);
    router.push('/');
  };

  const fetchNotifications = async () => {
    try {
      const list = await api.get('/notifications');
      setNotifications(list);
    } catch (error) {
      if (error.status !== 401 && error.status !== 403) {
        console.error('Failed to fetch notifications:', error);
      }
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      // Update local state
      setNotifications(prev =>
        prev.map(n => {
          if (n._id === id) {
            // Add current user id to readBy array locally
            return { ...n, readBy: [...(n.readBy || []), user?.id] };
          }
          return n;
        })
      );
    } catch (error) {
      if (error.status !== 401 && error.status !== 403) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        notifications,
        login,
        logout,
        fetchNotifications,
        markNotificationRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
