"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/utils/api';
import { requestForToken } from '@/utils/firebase';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for token on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Enforce that only admins can use this dashboard
        if (parsedUser.role !== 'admin') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (pathname !== '/login') router.replace('/login');
          setIsLoading(false);
          return;
        }

        setToken(storedToken);
        setUser(parsedUser);
        
        // If user is already logged in, request FCM token
        requestForToken().then(async fcmToken => {
          if (fcmToken) {
            api.put('/users/profile', { fcmToken }).catch(console.error);
          }
        }).catch(console.error);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (pathname !== '/login') router.replace('/login');
      }
    } else {
      // No token, redirect to login if not already there
      if (pathname !== '/login') {
        router.replace('/login');
      }
    }
    setIsLoading(false);
  }, [pathname, router]);

  // Setup foreground message listener once on mount
  useEffect(() => {
    let unsubscribe: any;
    
    const setupListener = async () => {
      try {
        const { onMessage } = await import('firebase/messaging');
        const { messaging } = await import('@/utils/firebase');
        const msg = await messaging();
        
        if (msg) {
          unsubscribe = onMessage(msg, (payload) => {
            const title = payload.notification?.title || 'New Notification';
            const options = {
              body: payload.notification?.body,
              icon: '/favicon.ico', // You can change this to your logo path
            };
            
            // Show native browser notification even when app is open
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(title, options);
            }
            
            // Dispatch a global event so UI components can instantly refresh
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('new_notification'));
            }
          });
        }
      } catch (e) {
        console.error('Failed to setup foreground listener', e);
      }
    };

    if (token) {
      setupListener();
      
      // Also setup Socket.io listener as a fallback for real-time UI updates
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
      const socket = require('socket.io-client').io(backendUrl, {
        auth: { token }
      });
      
      socket.on('new_notification', () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('new_notification'));
        }
      });
      
      return () => {
        if (unsubscribe) unsubscribe();
        socket.disconnect();
      };
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [token]);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    router.replace('/');
    
    // Request FCM token and save to backend upon login
    requestForToken().then(async fcmToken => {
      if (fcmToken) {
        api.put('/users/profile', { fcmToken }).catch(console.error);
      }
    }).catch(console.error);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
