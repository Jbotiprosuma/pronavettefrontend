import React, { useState, useEffect, useCallback } from 'react';
import api from '../../axios';

// ── Styles des actions ──
const ACTION_STYLES = {
    create:             { bg: '#0ab39c', icon: 'ri-add-circle-line',       label: 'Création' },
    create_navettes:    { bg: '#0ab39c', icon: 'ri-ship-line',             label: 'Création navettes' },
    create_absence:     { bg: '#f7b84b', icon: 'ri-calendar-line',   label: 'Ajout absence' },
    create_acompte:     { bg: '#299cdb', icon: 'ri-money-dollar-circle-line', label: 'Ajout acompte' },
    create_heure_sup:   { bg: '#405189', icon: 'ri-time-line',             label: 'Ajout heure sup' },
    create_prime:       { bg: '#0ab39c', icon: 'ri-gift-line',             label: 'Ajout prime' },
    create_prime_nuit:  { bg: '#405189', icon: 'ri-moon-line',             label: 'Ajout prime nuit' },
    update:             { bg: '#299cdb', icon: 'ri-edit-line',             label: 'Modification' },
    update_absence:     { bg: '#f7b84b', icon: 'ri-edit-line',             label: 'Modif absence' },
    update_acompte:     { bg: '#299cdb', icon: 'ri-edit-line',             label: 'Modif acompte' },
    update_heure_sup:   { bg: '#405189', icon: 'ri-edit-line',             label: 'Modif heure sup' },
    update_prime:       { bg: '#0ab39c', icon: 'ri-edit-line',             label: 'Modif prime' },
    update_prime_nuit:  { bg: '#405189', icon: 'ri-edit-line',             label: 'Modif prime nuit' },
    update_dates:       { bg: '#299cdb', icon: 'ri-calendar-2-line',       label: 'Modif dates' },
    update_campagne_dates: { bg: '#299cdb', icon: 'ri-calendar-2-line',    label: 'Modif dates campagne' },
    delete:             { bg: '#f06548', icon: 'ri-delete-bin-line',       label: 'Suppression' },
    delete_absence:     { bg: '#f06548', icon: 'ri-delete-bin-line',       label: 'Suppr absence' },
    delete_acompte:     { bg: '#f06548', icon: 'ri-delete-bin-line',       label: 'Suppr acompte' },
    delete_heure_sup:   { bg: '#f06548', icon: 'ri-delete-bin-line',       label: 'Suppr heure sup' },
    delete_prime:       { bg: '#f06548', icon: 'ri-delete-bin-line',       label: 'Suppr prime' },
    delete_prime_nuit:  { bg: '#f06548', icon: 'ri-delete-bin-line',       label: 'Suppr prime nuit' },
    delete_executed:    { bg: '#f06548', icon: 'ri-delete-bin-line',       label: 'Suppr exécutée' },
    delete_campagne:    { bg: '#f06548', icon: 'ri-delete-bin-line',       label: 'Suppr campagne' },
    bulk_delete:        { bg: '#f06548', icon: 'ri-delete-bin-2-line',     label: 'Suppr en masse' },
    force_delete:       { bg: '#cc0000', icon: 'ri-skull-line',            label: 'Suppr définitive' },
    launch:             { bg: '#0ab39c', icon: 'ri-rocket-line',           label: 'Lancement' },
    schedule:           { bg: '#299cdb', icon: 'ri-calendar-schedule-line',label: 'Programmation' },
    activate:           { bg: '#0ab39c', icon: 'ri-play-circle-line',      label: 'Activation' },
    deactivate:         { bg: '#f7b84b', icon: 'ri-pause-circle-line',     label: 'Désactivation' },
    extend:             { bg: '#299cdb', icon: 'ri-arrow-right-line',      label: 'Prolongation' },
    prolonger_campagne: { bg: '#299cdb', icon: 'ri-arrow-right-line',      label: 'Prolongation' },
    validate:           { bg: '#0ab39c', icon: 'ri-checkbox-circle-line',  label: 'Validation' },
    correction:         { bg: '#f7b84b', icon: 'ri-arrow-go-back-line',    label: 'Correction' },
    signaler:           { bg: '#f06548', icon: 'ri-error-warning-line',    label: 'Signalement' },
    send_to_payroll:    { bg: '#405189', icon: 'ri-send-plane-line',       label: 'Envoi paie' },
    close:              { bg: '#878a99', icon: 'ri-lock-line',             label: 'Clôture' },
    depart:             { bg: '#f7b84b', icon: 'ri-user-unfollow-line',    label: 'Départ' },
    depart_delete:      { bg: '#299cdb', icon: 'ri-user-follow-line',      label: 'Annul. départ' },
    confirm:            { bg: '#0ab39c', icon: 'ri-check-double-line',     label: 'Confirmation' },
    reject:             { bg: '#f06548', icon: 'ri-close-circle-line',     label: 'Rejet' },
    cancel:             { bg: '#878a99', icon: 'ri-forbid-line',           label: 'Annulation' },
    reset:              { bg: '#f7b84b', icon: 'ri-refresh-line',          label: 'Réinitialisation' },
    restore:            { bg: '#0ab39c', icon: 'ri-arrow-go-back-line',    label: 'Restauration' },
    bulk_restore:       { bg: '#0ab39c', icon: 'ri-arrow-go-back-fill',    label: 'Restaur. masse' },
    toggle_status:      { bg: '#f7b84b', icon: 'ri-toggle-line',           label: 'Changement statut' },
    import_excel:       { bg: '#405189', icon: 'ri-file-excel-line',       label: 'Import Excel' },
};

const getActionStyle = (action) => ACTION_STYLES[action] || { bg: '#878a99', icon: 'ri-information-line', label: action };

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const MODULE_LABELS = {
    campagne: 'Campagnes',
    navette: 'Navettes',
    mutation: 'Mutations',
    employe: 'Employés',
};

/**
 * Composant réutilisable pour afficher les logs d'activité d'un module
 * @param {string} module - campagne | navette | mutation | employe
 * @param {number|null} targetId - Filtrer par ID cible (optionnel)
 * @param {boolean} isAdmin - L'utilisateur courant est-il admin ?
 * @param {number} defaultLimit - Nombre d'éléments par page (défaut: 20)
 */
const ActivityLogPanel = ({ module, targetId = null, isAdmin = false, defaultLimit = 20 }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
    const [expanded, setExpanded] = useState(null); // ID du log déplié
    const [filterAction, setFilterAction] = useState('');
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const fetchLogs = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { module, page, limit: defaultLimit };
            if (targetId) params.target_id = targetId;
            if (filterAction) params.action = filterAction;
            if (filterFrom) params.from = filterFrom;
            if (filterTo) params.to = filterTo;

            const res = await api.get('activity-logs', { params });
            setLogs(res.data.data || []);
            setPagination(res.data.pagination || { total: 0, page: 1, totalPages: 1 });
        } catch (err) {
            console.error('Erreur chargement activity logs:', err);
            setLogs([]);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [module, targetId, filterAction, filterFrom, filterTo, defaultLimit]);

    useEffect(() => { if (isOpen) fetchLogs(1); }, [isOpen, fetchLogs]); // eslint-disable-line react-hooks/exhaustive-deps

    // Ne rien afficher si l'utilisateur n'est pas admin
    if (!isAdmin) return null;

    const parseValues = (values) => {
        if (!values) return null;
        // Si c'est une chaîne JSON échappée, la parser
        if (typeof values === 'string') {
            try { return JSON.parse(values); } catch { return null; }
        }
        return values;
    };

    const formatValue = (val) => {
        if (val === null || val === undefined) return <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>—</span>;
        if (typeof val === 'boolean') return (
            <span style={{
                background: val ? '#0ab39c20' : '#f0654820',
                color: val ? '#0ab39c' : '#f06548',
                borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600,
            }}>{val ? 'Oui' : 'Non'}</span>
        );
        if (typeof val === 'number') return <span style={{ color: '#405189', fontWeight: 600 }}>{val}</span>;
        if (typeof val === 'object') return (
            <span style={{ color: '#878a99', fontStyle: 'italic', fontSize: 11 }}>
                {JSON.stringify(val)}
            </span>
        );
        // Détecter les dates ISO
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
            try {
                const d = new Date(val);
                if (!isNaN(d)) return <span style={{ color: '#405189' }}>{d.toLocaleDateString('fr-FR')}</span>;
            } catch { /* ignore */ }
        }
        return <span style={{ color: '#343a40' }}>{String(val)}</span>;
    };

    const FIELD_LABELS = {
        periode_debut_at: 'Début période', periode_fin_at: 'Fin période',
        navettes_count: 'Navettes créées', created_count: 'Campagnes créées',
        moisList: 'Mois', periode_debut_jour: 'Jour début', periode_fin_jour: 'Jour fin',
        status: 'Statut', etat: 'État', employer_id: 'Employé ID',
        navette_id: 'Navette ID', service_id: 'Service ID', service_new_id: 'Nouveau service',
        service_old_id: 'Ancien service', nb_jours: 'Nb jours', type_abs: 'Type absence',
        motif: 'Motif', somme: 'Montant (FCFA)', heures: 'Heures', pourcentage: 'Pourcentage (%)',
        montant: 'Montant', type_prime: 'Type prime', nb_jour: 'Nb jours nuit',
        date_depart: 'Date départ', type_depart: 'Type départ',
        nouvelle_date_fin: 'Nouvelle fin', nouvelle_date_debut: 'Nouveau début',
        confirmed_by: 'Confirmé par', rejet_motif: 'Motif rejet',
        matricule: 'Matricule', nom: 'Nom', prenom: 'Prénom',
        ids: 'IDs', created: 'Créés', updated: 'Mis à jour', errors: 'Erreurs',
        count: 'Nb éléments', statut: 'Statut',
    };

    const renderValues = (label, rawValues, colorAccent) => {
        const values = parseValues(rawValues);
        if (!values || (typeof values === 'object' && !Array.isArray(values) && Object.keys(values).length === 0)) return null;

        const entries = typeof values === 'object' && !Array.isArray(values)
            ? Object.entries(values)
            : null;

        return (
            <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
                }}>
                    <div style={{
                        width: 3, height: 14, borderRadius: 2,
                        background: colorAccent || '#405189',
                    }} />
                    <small style={{ fontWeight: 700, color: '#495057', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {label}
                    </small>
                </div>
                {entries ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {entries.map(([key, val]) => (
                                <tr key={key} style={{ borderBottom: '1px solid #f3f3f9' }}>
                                    <td style={{
                                        padding: '4px 8px 4px 0', fontSize: 12,
                                        color: '#878a99', whiteSpace: 'nowrap', width: '40%',
                                        fontWeight: 500,
                                    }}>
                                        {FIELD_LABELS[key] || key}
                                    </td>
                                    <td style={{ padding: '4px 0', fontSize: 12 }}>
                                        {formatValue(val)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <span style={{ fontSize: 12, color: '#343a40' }}>{JSON.stringify(values)}</span>
                )}
            </div>
        );
    };

    // Obtenir les actions uniques pour le filtre
    const uniqueActions = [...new Set(logs.map(l => l.action))];

    return (
        <div style={{ marginTop: 24 }}>
            {/* ── Header toggle ── */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    background: 'linear-gradient(135deg, #405189 0%, #2d3a6f 100%)',
                    color: '#fff', padding: '14px 20px', borderRadius: isOpen ? '10px 10px 0 0' : 10,
                    transition: 'border-radius 0.3s',
                }}
            >
                <i className="ri-history-line" style={{ fontSize: 20 }} />
                <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>
                    Journal d'activité — {MODULE_LABELS[module] || module}
                </span>
                {pagination.total > 0 && (
                    <span style={{
                        background: 'rgba(255,255,255,0.2)', padding: '2px 10px',
                        borderRadius: 20, fontSize: 12,
                    }}>
                        {pagination.total} entrée(s)
                    </span>
                )}
                <i className={isOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
                   style={{ fontSize: 18, transition: 'transform 0.3s' }} />
            </div>

            {/* ── Body ── */}
            {isOpen && (
                <div style={{
                    background: '#fff', border: '1px solid #e9ebec', borderTop: 'none',
                    borderRadius: '0 0 10px 10px', padding: 20,
                }}>
                    {/* ── Filtres ── */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'end' }}>
                        <div style={{ flex: '1 1 180px' }}>
                            <label style={{ fontSize: 12, color: '#878a99', marginBottom: 4, display: 'block' }}>Action</label>
                            <select
                                className="form-select form-select-sm"
                                value={filterAction}
                                onChange={e => setFilterAction(e.target.value)}
                                style={{ fontSize: 13 }}
                            >
                                <option value="">Toutes les actions</option>
                                {Object.entries(ACTION_STYLES).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: '1 1 150px' }}>
                            <label style={{ fontSize: 12, color: '#878a99', marginBottom: 4, display: 'block' }}>Du</label>
                            <input type="date" className="form-control form-control-sm" value={filterFrom}
                                   onChange={e => setFilterFrom(e.target.value)} style={{ fontSize: 13 }} />
                        </div>
                        <div style={{ flex: '1 1 150px' }}>
                            <label style={{ fontSize: 12, color: '#878a99', marginBottom: 4, display: 'block' }}>Au</label>
                            <input type="date" className="form-control form-control-sm" value={filterTo}
                                   onChange={e => setFilterTo(e.target.value)} style={{ fontSize: 13 }} />
                        </div>
                        <button
                            className="btn btn-sm btn-soft-primary"
                            onClick={() => fetchLogs(1)}
                            style={{ height: 31, whiteSpace: 'nowrap' }}
                        >
                            <i className="ri-search-line me-1" /> Filtrer
                        </button>
                        {(filterAction || filterFrom || filterTo) && (
                            <button
                                className="btn btn-sm btn-soft-danger"
                                onClick={() => { setFilterAction(''); setFilterFrom(''); setFilterTo(''); }}
                                style={{ height: 31 }}
                            >
                                <i className="ri-close-line" />
                            </button>
                        )}
                    </div>

                    {/* ── Liste ── */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#878a99' }}>
                            <div className="spinner-border spinner-border-sm me-2" />
                            Chargement...
                        </div>
                    ) : logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#878a99' }}>
                            <i className="ri-inbox-line" style={{ fontSize: 40, display: 'block', marginBottom: 8 }} />
                            Aucun log d'activité trouvé.
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {logs.map(log => {
                                    const style = getActionStyle(log.action);
                                    const isExpanded = expanded === log.id;

                                    return (
                                        <div key={log.id} style={{
                                            border: '1px solid #e9ebec', borderRadius: 8,
                                            overflow: 'hidden', transition: 'box-shadow 0.2s',
                                            boxShadow: isExpanded ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                        }}>
                                            {/* ── Log header ── */}
                                            <div
                                                onClick={() => setExpanded(isExpanded ? null : log.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                    padding: '10px 16px', cursor: 'pointer',
                                                    background: isExpanded ? '#f3f3f9' : '#fff',
                                                    transition: 'background 0.2s',
                                                }}
                                            >
                                                {/* Action badge */}
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    background: `${style.bg}15`, color: style.bg,
                                                    padding: '3px 10px', borderRadius: 20, fontSize: 12,
                                                    fontWeight: 600, whiteSpace: 'nowrap',
                                                }}>
                                                    <i className={style.icon} style={{ fontSize: 13 }} />
                                                    {style.label}
                                                </span>

                                                {/* Target label */}
                                                <span style={{
                                                    flex: 1, fontSize: 13, color: '#495057',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }}>
                                                    {log.target_label || '—'}
                                                </span>

                                                {/* User */}
                                                <span style={{ fontSize: 12, color: '#878a99', whiteSpace: 'nowrap' }}>
                                                    <i className="ri-user-line me-1" />
                                                    {log.user ? `${log.user.prenom || ''} ${log.user.nom || ''}`.trim() || log.user.email : 'Système'}
                                                </span>

                                                {/* Date */}
                                                <span style={{ fontSize: 12, color: '#878a99', whiteSpace: 'nowrap' }}>
                                                    {formatDate(log.created_at)}
                                                </span>

                                                <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
                                                   style={{ fontSize: 16, color: '#878a99' }} />
                                            </div>

                                            {/* ── Log details ── */}
                                            {isExpanded && (
                                                <div style={{
                                                    padding: '12px 16px', background: '#fafbfc',
                                                    borderTop: '1px solid #e9ebec',
                                                }}>
                                                    <p style={{ margin: '0 0 8px', fontSize: 13, color: '#495057' }}>
                                                        {log.description}
                                                    </p>

                                                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 8 }}>
                                                        {renderValues('Anciennes valeurs', log.old_values, '#f06548')}
                                                        {renderValues('Nouvelles valeurs', log.new_values, '#0ab39c')}
                                                    </div>

                                                    <div style={{
                                                        display: 'flex', gap: 16, marginTop: 10,
                                                        fontSize: 11, color: '#adb5bd',
                                                    }}>
                                                        {log.ip_address && (
                                                            <span><i className="ri-global-line me-1" />{log.ip_address}</span>
                                                        )}
                                                        {log.target_id && (
                                                            <span><i className="ri-hashtag me-1" />ID: {log.target_id}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── Pagination ── */}
                            {pagination.totalPages > 1 && (
                                <div style={{
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    gap: 8, marginTop: 16,
                                }}>
                                    <button
                                        className="btn btn-sm btn-soft-secondary"
                                        disabled={pagination.page <= 1}
                                        onClick={() => fetchLogs(pagination.page - 1)}
                                    >
                                        <i className="ri-arrow-left-s-line" />
                                    </button>
                                    <span style={{ fontSize: 13, color: '#495057' }}>
                                        Page {pagination.page} / {pagination.totalPages}
                                    </span>
                                    <button
                                        className="btn btn-sm btn-soft-secondary"
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => fetchLogs(pagination.page + 1)}
                                    >
                                        <i className="ri-arrow-right-s-line" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ActivityLogPanel;
