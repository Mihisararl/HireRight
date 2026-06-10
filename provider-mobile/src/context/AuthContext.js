import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginApi, loginWithGoogle as loginWithGoogleApi, getMe } from '../api/auth';
import { clearAuth, getStoredUser, getToken, saveAuth } from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setUser(null);
        return;
      }
      const profile = await getMe();
      setUser(profile);
    } catch {
      await clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const assertProviderUser = (data) => {
    if (data.user?.role !== 'provider') {
      throw new Error('This app is for service providers only.');
    }
    return data;
  };

  const login = useCallback(async (email, password) => {
    const data = assertProviderUser(await loginApi(email, password));
    await saveAuth(data.token, data.user);
    setUser(data.user);
    return data;
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const data = assertProviderUser(await loginWithGoogleApi(credential));
    await saveAuth(data.token, data.user);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await getMe();
    setUser(profile);
    const token = await getToken();
    if (token) await saveAuth(token, profile);
    return profile;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      loginWithGoogle,
      logout,
      refreshUser,
    }),
    [user, loading, login, loginWithGoogle, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
