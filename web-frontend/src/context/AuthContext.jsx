import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize auth from localStorage
    useEffect(() => {
        const initAuth = () => {
            try {
                const token = localStorage.getItem('token');
                const raw = localStorage.getItem('user');
                if (token && raw && raw !== 'undefined') {
                    const parsedUser = JSON.parse(raw);
                    setUser(parsedUser);
                } else {
                    setUser(null);
                }
            } catch (err) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = useCallback((userData, token) => {
        if (!userData || !token) return;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setLoading(false);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
    }, []);

    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await api.get('/auth/me');
            const nextUser = response.data?.user;
            if (nextUser) {
                localStorage.setItem('user', JSON.stringify(nextUser));
                setUser(nextUser);
            }
        } catch (err) {
            // If refresh fails, keep the existing session as-is
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
