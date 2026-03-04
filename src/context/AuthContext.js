import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../axios';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Charger l'utilisateur depuis le token stocké
    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            setIsAuthenticated(false);
            return;
        }

        try {
            const response = await api.get('users/me');
            setUser(response.data.user);
            setPermissions(response.data.user.permissions || []);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Session expirée ou invalide');
            localStorage.removeItem('token');
            setUser(null);
            setPermissions([]);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    // Login
    const login = async (username, password) => {
        const response = await api.post('auth/login', { username, password });
        const { token, status, message } = response.data;

        if (status === true) {
            localStorage.setItem('token', token);
            await loadUser();
            return { success: true };
        } else {
            return { success: false, message };
        }
    };

    // Logout
    const logout = async () => {
        try {
            if (user) {
                await api.get(`users/${user.id}/logout`);
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion', error);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            setPermissions([]);
            setIsAuthenticated(false);
        }
    };

    // Rafraîchir les données utilisateur (utile après mise à jour profil)
    const refreshUser = async () => {
        try {
            const response = await api.get('users/me');
            setUser(response.data.user);
            setPermissions(response.data.user.permissions || []);
        } catch (error) {
            console.error('Erreur lors du rafraîchissement utilisateur', error);
        }
    };

    // Vérifier si l'utilisateur a une permission
    const hasPermission = (requiredPermissions) => {
        if (!requiredPermissions || requiredPermissions.length === 0) return true;
        return requiredPermissions.some(p => permissions.includes(p));
    };

    // Vérifier si l'utilisateur a un rôle
    const hasRole = (...roles) => {
        if (!user || !user.role) return false;
        return roles.includes(user.role);
    };

    const value = {
        user,
        permissions,
        loading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
        hasPermission,
        hasRole,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
