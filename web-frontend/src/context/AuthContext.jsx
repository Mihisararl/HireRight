import { createContext, useState, useEffect, useCallback } from 'react';

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

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
