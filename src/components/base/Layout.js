import React, { useEffect } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Loading from './Loading';

/**
 * Layout principal de l'application.
 * Encapsule Header, Sidebar, Footer et le contenu de la page.
 * Utilise le contexte d'authentification pour l'utilisateur.
 */
const Layout = ({ children }) => {
    const { user, logout, loading } = useAuth();

    // Écoute des erreurs globales émises par l'intercepteur axios
    useEffect(() => {
        const handleForbidden = (e) => {
            Swal.fire({
                icon: 'error',
                title: 'Accès refusé',
                text: e.detail?.message || 'Vous n\'avez pas les droits pour effectuer cette action.',
                confirmButtonText: 'OK',
            });
        };

        const handleServerError = (e) => {
            Swal.fire({
                icon: 'error',
                title: 'Erreur serveur',
                text: e.detail?.message || 'Une erreur inattendue est survenue. Veuillez réessayer.',
                confirmButtonText: 'OK',
            });
        };

        window.addEventListener('api:forbidden', handleForbidden);
        window.addEventListener('api:servererror', handleServerError);
        return () => {
            window.removeEventListener('api:forbidden', handleForbidden);
            window.removeEventListener('api:servererror', handleServerError);
        };
    }, []);

    if (loading || !user) {
        return <Loading loading={true} />;
    }

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div id="layout-wrapper">
            <Header user={user} handleLogout={handleLogout} />
            <Sidebar user={user} />
            <div className="vertical-overlay"></div>
            <div className="main-content">
                <div className="page-content">
                    <div className="container-fluid">
                        {children}
                    </div>
                </div>
                <Footer />
            </div>
        </div>
    );
};

export default Layout;
