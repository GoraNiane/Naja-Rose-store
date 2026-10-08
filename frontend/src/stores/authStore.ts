import { useState, useEffect } from 'react';
import { User } from '../types';

const TOKEN_KEY = 'naja_token';
const USER_KEY = 'naja_user';

let currentUser: User | null = null;
let currentToken: string | null = null;
let authListeners: Array<() => void> = [];

try {
  currentToken = localStorage.getItem(TOKEN_KEY);
  const savedUser = localStorage.getItem(USER_KEY);
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
  }
} catch {
  currentUser = null;
}

function notifyAuth() {
  if (currentToken) {
    localStorage.setItem(TOKEN_KEY, currentToken);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }

  if (currentUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  } else {
    localStorage.removeItem(USER_KEY);
  }

  authListeners.forEach((fn) => fn());
}

export const authStore = {
  getUser: () => currentUser,
  getToken: () => currentToken,
  isAuthenticated: () => Boolean(currentToken && currentUser),
  isAdmin: () => currentUser?.role === 'ADMIN',

  setAuth: (user: User, token: string) => {
    currentUser = user;
    currentToken = token;
    notifyAuth();
  },

  logout: () => {
    currentUser = null;
    currentToken = null;
    notifyAuth();
  },
};

export function useAuthStore() {
  const [user, setUser] = useState<User | null>(currentUser);
  const [token, setToken] = useState<string | null>(currentToken);

  useEffect(() => {
    const listener = () => {
      setUser(currentUser ? { ...currentUser } : null);
      setToken(currentToken);
    };
    authListeners.push(listener);
    return () => {
      authListeners = authListeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'ADMIN',
    setAuth: authStore.setAuth,
    logout: authStore.logout,
  };
}
