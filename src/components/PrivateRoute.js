import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './base/Loading';

/**
 * Composant de protection des routes.
 * Vérifie l'authentification et optionnellement les rôles/permissions.
 * 
 * @param {React.ReactNode} children - Le composant à afficher si autorisé
 * @param {string[]} roles - Rôles autorisés (optionnel, OU logique)
 * @param {string[]} permissions - Permissions requises (optionnel, OU logique)
 */
const PrivateRoute = ({ children, roles, permissions }) => {
    const { isAuthenticated, loading, hasRole, hasPermission } = useAuth();

    if (loading) {
        return <Loading loading={true} />;
    }

    // Non authentifié → redirection login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Vérification des rôles si spécifiés
    if (roles && roles.length > 0 && !hasRole(...roles)) {
        return <Navigate to="/dashboard" replace />;
    }

    // Vérification des permissions si spécifiées
    if (permissions && permissions.length > 0 && !hasPermission(permissions)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PrivateRoute;
