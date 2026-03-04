import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from '../../axios';

const Header = ({ user, handleLogout }) => {
    // Initialiser l'état avec la valeur stockée dans localStorage ou "light" par défaut
    const [layoutMode, setLayoutMode] = useState(() => localStorage.getItem("layoutMode") || "light");
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const notifDropdownRef = useRef(null);
    const navigate = useNavigate();

    // Fonction pour basculer entre le mode sombre et clair
    const toggleLayoutMode = () => {
        const newMode = layoutMode === "light" ? "dark" : "light";
        setLayoutMode(newMode);
        localStorage.setItem("layoutMode", newMode); // Stocker la nouvelle préférence dans localStorage
    };

    // Effet pour mettre à jour l'attribut sur la balise <html> à chaque changement de mode
    useEffect(() => {
        document.documentElement.setAttribute("data-layout-mode", layoutMode);
    }, [layoutMode]);


    const [sidebarSize, setSidebarSize] = useState("lg");

    // Fonction pour basculer entre les tailles de la barre latérale
    const toggleSidebarSize = () => {
        const newSize = sidebarSize === "lg" ? "sm" : "lg";
        setSidebarSize(newSize);
    };

    // Appliquer l'attribut data-sidebar-size sur <html> à chaque changement
    useEffect(() => {
        document.documentElement.setAttribute("data-sidebar-size", sidebarSize);
    }, [sidebarSize]);

    // ===== NOTIFICATIONS =====
    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await axios.get('/notifications/unread-count');
            setUnreadCount(res.data.count || 0);
        } catch (err) {
            // silently ignore
        }
    }, []);

    const fetchRecentNotifications = useCallback(async () => {
        setLoadingNotifs(true);
        try {
            const res = await axios.get('/notifications?limit=5&filter=unread');
            setNotifications(res.data.data || []);
        } catch (err) {
            console.error('Erreur chargement notifications:', err);
        } finally {
            setLoadingNotifs(false);
        }
    }, []);

    // Polling unread count toutes les 30 secondes
    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user, fetchUnreadCount]);

    // Charger les notifs quand on ouvre le dropdown
    useEffect(() => {
        if (showNotifDropdown) {
            fetchRecentNotifications();
        }
    }, [showNotifDropdown, fetchRecentNotifications]);

    // Fermer le dropdown au clic extérieur
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
                setShowNotifDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (notif) => {
        try {
            await axios.put(`/notifications/${notif.id}/read`);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.filter(n => n.id !== notif.id));
            if (notif.link) {
                setShowNotifDropdown(false);
                navigate(notif.link);
            }
        } catch (err) {
            console.error('Erreur mark as read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.put('/notifications/read-all');
            setUnreadCount(0);
            setNotifications([]);
        } catch (err) {
            console.error('Erreur mark all read:', err);
        }
    };

    const getNotifIcon = (type) => {
        const icons = {
            navette_lancee: 'ri-rocket-line text-primary',
            navette_validee: 'ri-check-double-line text-success',
            navette_correction: 'ri-edit-line text-warning',
            navette_envoi_paie: 'ri-send-plane-line text-info',
            navette_signalement: 'ri-alarm-warning-line text-danger',
            navette_cloturee: 'ri-lock-line text-secondary',
            mutation_creee: 'ri-user-shared-line text-primary',
            mutation_confirmee: 'ri-user-follow-line text-success',
            mutation_rejetee: 'ri-user-unfollow-line text-danger',
            mutation_annulee: 'ri-close-circle-line text-warning',
            employe_importe: 'ri-file-upload-line text-info',
            general: 'ri-notification-3-line text-muted',
        };
        return icons[type] || icons.general;
    };

    const timeAgo = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'À l\'instant';
        if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
        return `Il y a ${Math.floor(diff / 86400)}j`;
    };

    return (
        <header id="page-topbar">
            <div className="layout-width">
                <div className="navbar-header">
                    <div className="d-flex">
                        <div className="navbar-brand-box horizontal-logo">
                            <a href="/dashboard" className="logo logo-dark">
                                <span className="logo-sm">
                                    <img src="logo.png" alt="logo" height="22" />
                                </span>
                                <span className="logo-lg">
                                    <img src="logo.png" alt="logo" height="22" />
                                </span>
                            </a>
                            <a href="/dashboard" className="logo logo-light">
                                <span className="logo-sm">
                                    <img src="logo.png" alt="logo" height="22" />
                                </span>
                                <span className="logo-lg">
                                    <img src="logo.png" alt="logo" height="22" />
                                </span>
                            </a>
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger"
                            id="topnav-hamburger-icon"
                            onClick={toggleSidebarSize}
                        >
                            <span className="hamburger-icon">
                                <span></span>
                                <span></span>
                                <span></span>
                            </span>
                        </button>
                    </div>

                    <div className="d-flex align-items-center">


                        {/* Mode sombre */}
                        <div className="ms-1 header-item d-none d-sm-flex">
                            <button type="button"
                                onClick={toggleLayoutMode}
                                className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle light-dark-mode">
                                <i className={`bx ${layoutMode === "light" ? "bx-moon" : "bx-sun"} fs-22`}></i>
                            </button>
                        </div>

                        {/* Notifications */}
                        <div className="dropdown topbar-head-dropdown ms-1 header-item" ref={notifDropdownRef}>
                            <button
                                type="button"
                                className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                            >
                                <i className='bx bx-bell fs-22'></i>
                                {unreadCount > 0 && (
                                    <span className="position-absolute topbar-badge fs-10 translate-middle badge rounded-pill bg-danger">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            {showNotifDropdown && (
                                <div className="dropdown-menu dropdown-menu-lg dropdown-menu-end p-0 show" style={{ position: 'absolute', right: 0, minWidth: '320px' }}>
                                    <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                                        <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
                                        {unreadCount > 0 && (
                                            <button
                                                className="btn btn-sm btn-soft-primary"
                                                onClick={handleMarkAllRead}
                                            >
                                                Tout marquer lu
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {loadingNotifs ? (
                                            <div className="text-center p-3">
                                                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                            </div>
                                        ) : notifications.length === 0 ? (
                                            <div className="text-center p-4 text-muted">
                                                <i className="bx bx-bell-off fs-24 d-block mb-2"></i>
                                                Aucune notification non lue
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div
                                                    key={notif.id}
                                                    className="d-flex align-items-start p-3 border-bottom notification-item"
                                                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                                    onClick={() => handleMarkAsRead(notif)}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--vz-light)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = ''}
                                                >
                                                    <div className="flex-shrink-0 me-3">
                                                        <i className={`${getNotifIcon(notif.type)} fs-20`}></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <h6 className="mb-1 fs-13 fw-semibold">{notif.title}</h6>
                                                        <p className="mb-1 fs-12 text-muted">{notif.message}</p>
                                                        <small className="text-muted fs-11">{timeAgo(notif.created_at)}</small>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-2 border-top text-center">
                                        <NavLink
                                            to="/notifications"
                                            className="btn btn-sm btn-link text-primary"
                                            onClick={() => setShowNotifDropdown(false)}
                                        >
                                            Voir toutes les notifications <i className="ri-arrow-right-s-line"></i>
                                        </NavLink>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Profile */}
                        <div className="dropdown ms-sm-3 header-item topbar-user">
                            <button type="button" className="btn" data-bs-toggle="dropdown">
                                <span className="d-flex align-items-center">
                                    <img className="rounded-circle header-profile-user" src={user ? `${user.avatar_url}` : "assets/images/users/avatar-1.jpg"} alt="User Avatar" />
                                    <span className="text-start ms-xl-2">
                                        <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">{user ? `${user.nom} ${user.prenom}` : "User"}</span>
                                        <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">
                                            {user && user.role === "standard" ? "Utilisateur" : ""}
                                            {user && user.role === "manager" ? "Manager" : ""}
                                            {user && user.role === "admin" ? "Administrateur" : ""}
                                            {user && user.role === "superadmin" ? "Super Admin" : ""}
                                        </span>
                                    </span>
                                </span>
                            </button>
                            <div className="dropdown-menu dropdown-menu-end">
                                <NavLink to="/profil" className="dropdown-item" >
                                    <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
                                    Profil
                                </NavLink>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item" onClick={handleLogout}><i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> Logout</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
