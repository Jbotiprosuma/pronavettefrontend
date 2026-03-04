import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api/',
});

api.interceptors.request.use(function (config) {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});

// Intercepteur de réponse : gestion globale des erreurs HTTP
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            // Token expiré ou invalide
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        } else if (status === 403) {
            // Accès refusé : émettre un événement global pour notifier l'UI
            window.dispatchEvent(new CustomEvent('api:forbidden', {
                detail: { message: error.response?.data?.message || 'Accès refusé.' }
            }));
        } else if (status >= 500) {
            // Erreur serveur : émettre un événement global
            window.dispatchEvent(new CustomEvent('api:servererror', {
                detail: { message: error.response?.data?.message || 'Une erreur serveur est survenue.' }
            }));
        }

        return Promise.reject(error);
    }
);

export default api;
