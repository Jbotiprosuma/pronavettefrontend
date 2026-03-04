import React, { useState, useEffect, useCallback } from 'react';
import axios from '../axios';
import Swal from 'sweetalert2';
import Layout from '../components/base/Layout';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState(''); // '', 'unread', 'read'
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (filter) params.filter = filter;
            const res = await axios.get('/notifications', { params });
            setNotifications(res.data.data || []);
            setTotalCount(res.data.totalCount || 0);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            console.error('Erreur chargement notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id) => {
        try {
            await axios.put(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (err) {
            console.error('Erreur:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.put('/notifications/read-all');
            fetchNotifications();
            Swal.fire({ icon: 'success', title: 'Toutes les notifications ont été marquées comme lues', timer: 1500, showConfirmButton: false });
        } catch (err) {
            console.error('Erreur:', err);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Supprimer cette notification ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Supprimer',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#d33',
        });
        if (result.isConfirmed) {
            try {
                await axios.delete(`/notifications/${id}`);
                fetchNotifications();
            } catch (err) {
                console.error('Erreur suppression:', err);
            }
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

    const getNotifBadge = (type) => {
        if (type?.startsWith('navette_')) return <span className="badge bg-info-subtle text-info">Navette</span>;
        if (type?.startsWith('mutation_')) return <span className="badge bg-warning-subtle text-warning">Mutation</span>;
        if (type === 'employe_importe') return <span className="badge bg-success-subtle text-success">Import</span>;
        return <span className="badge bg-secondary-subtle text-secondary">Général</span>;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const unreadInList = notifications.filter(n => !n.is_read).length;

    return (
        <Layout>
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Notifications</h4>
                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item"><a href="/dashboard">Tableau de bord</a></li>
                                <li className="breadcrumb-item active">Notifications</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                                <h5 className="card-title mb-0">
                                    <i className="bx bx-bell me-2"></i>
                                    Mes notifications
                                    {totalCount > 0 && <span className="badge bg-soft-primary text-primary ms-2">{totalCount}</span>}
                                </h5>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <div className="btn-group btn-group-sm" role="group">
                                    <button
                                        className={`btn ${filter === '' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => { setFilter(''); setPage(1); }}
                                    >
                                        Toutes
                                    </button>
                                    <button
                                        className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => { setFilter('unread'); setPage(1); }}
                                    >
                                        Non lues
                                    </button>
                                    <button
                                        className={`btn ${filter === 'read' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => { setFilter('read'); setPage(1); }}
                                    >
                                        Lues
                                    </button>
                                </div>
                                {unreadInList > 0 && (
                                    <button className="btn btn-sm btn-soft-success" onClick={handleMarkAllRead}>
                                        <i className="ri-check-double-line me-1"></i>
                                        Tout marquer lu
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p className="mt-2 text-muted">Chargement...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center p-5">
                                    <i className="bx bx-bell-off fs-48 text-muted d-block mb-3"></i>
                                    <h5 className="text-muted">Aucune notification</h5>
                                    <p className="text-muted mb-0">
                                        {filter === 'unread' ? 'Vous n\'avez pas de notifications non lues.' : 'Aucune notification trouvée.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            className={`list-group-item list-group-item-action d-flex align-items-start gap-3 p-3 ${!notif.is_read ? 'bg-light' : ''}`}
                                        >
                                            <div className="flex-shrink-0">
                                                <div className="avatar-sm">
                                                    <div className="avatar-title rounded-circle bg-soft-primary text-primary fs-20">
                                                        <i className={getNotifIcon(notif.type)}></i>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex align-items-center justify-content-between mb-1">
                                                    <h6 className={`mb-0 fs-14 ${!notif.is_read ? 'fw-bold' : ''}`}>
                                                        {!notif.is_read && <span className="badge bg-danger me-1" style={{ width: 8, height: 8, padding: 0, borderRadius: '50%', display: 'inline-block' }}></span>}
                                                        {notif.title}
                                                    </h6>
                                                    {getNotifBadge(notif.type)}
                                                </div>
                                                <p className="mb-1 text-muted fs-13">{notif.message}</p>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <small className="text-muted">
                                                        <i className="ri-time-line me-1"></i>
                                                        {formatDate(notif.created_at)}
                                                    </small>
                                                    <div className="d-flex gap-1">
                                                        {!notif.is_read && (
                                                            <button
                                                                className="btn btn-sm btn-soft-success"
                                                                onClick={() => handleMarkAsRead(notif.id)}
                                                                title="Marquer comme lu"
                                                            >
                                                                <i className="ri-check-line"></i>
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn-sm btn-soft-danger"
                                                            onClick={() => handleDelete(notif.id)}
                                                            title="Supprimer"
                                                        >
                                                            <i className="ri-delete-bin-line"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="card-footer d-flex align-items-center justify-content-between">
                                <span className="text-muted fs-13">
                                    Page {page} sur {totalPages} ({totalCount} notifications)
                                </span>
                                <div className="btn-group btn-group-sm">
                                    <button
                                        className="btn btn-outline-primary"
                                        disabled={page <= 1}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        <i className="ri-arrow-left-s-line"></i> Précédent
                                    </button>
                                    <button
                                        className="btn btn-outline-primary"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Suivant <i className="ri-arrow-right-s-line"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default NotificationsPage;
