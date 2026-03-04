import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../axios';
import Layout from '../../components/base/Layout';
import Swal from 'sweetalert2';

/* ────────────────────────────────────────────
   CONSTANTES
   ──────────────────────────────────────────── */
const TABS = [
    { key: 'absences', label: 'Absences', icon: 'ri-calendar-line', color: '#f06548' },
    { key: 'accomptes', label: 'Avances', icon: 'ri-money-dollar-circle-line', color: '#f7b84b' },
    { key: 'departs', label: 'Départs', icon: 'ri-user-unfollow-line', color: '#405189' },
    { key: 'heures', label: 'Heures & Nuit', icon: 'ri-time-line', color: '#299cdb' },
    { key: 'mutations', label: 'Mutations', icon: 'ri-refresh-line', color: '#0ab39c' },
];

const ABS_TYPE_LABELS = {
    ABSENCE_NON_REMUNEREE: { short: 'Non rémunérée', icon: 'ri-close-circle-line', color: '#f06548' },
    ACCIDENT_DE_TRAVAIL: { short: 'Accident travail', icon: 'ri-first-aid-kit-line', color: '#f7b84b' },
    ABSENCE_MISE_A_PIEDS: { short: 'Mise à pied', icon: 'ri-error-warning-line', color: '#ea5455' },
    ABSENCE_CONGES_DE_MATERNITE: { short: 'Congé maternité', icon: 'ri-heart-2-line', color: '#e83e8c' },
    ABSENCE_CONGES_PAYE: { short: 'Congé payé', icon: 'ri-sun-line', color: '#0ab39c' },
    ABSENCE_REMUNEREE: { short: 'Rémunérée', icon: 'ri-checkbox-circle-line', color: '#299cdb' },
    ABSENCE_PATERNITE: { short: 'Paternité', icon: 'ri-user-heart-line', color: '#405189' },
    ABSENCE_MALADIE: { short: 'Maladie', icon: 'ri-stethoscope-line', color: '#f7b84b' },
    ABSENCE_FORMATION: { short: 'Formation', icon: 'ri-book-open-line', color: '#6610f2' },
};

const MUT_STATUS_COLORS = {
    'En attente': { bg: '#fff8e1', color: '#f7b84b', icon: 'ri-time-line' },
    'Validé': { bg: '#e8f5e9', color: '#0ab39c', icon: 'ri-check-line' },
    'annulé': { bg: '#f3f3f3', color: '#878a99', icon: 'ri-forbid-line' },
    'rejeté': { bg: '#fde8e4', color: '#f06548', icon: 'ri-close-line' },
};

const PER_PAGE = 15;

/* ────────────────────────────────────────────
   COMPOSANT PRINCIPAL
   ──────────────────────────────────────────── */
const StatistiquesPage = () => {
    const [activeTab, setActiveTab] = useState('absences');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState([]);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ date_from: '', date_to: '', service_id: '', matricule: '' });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchServices = async () => {
            try { const res = await api.get('/services'); setServices(res.data.data || []); }
            catch (e) { console.error(e); }
        };
        fetchServices();
    }, []);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.service_id) params.append('service_id', filters.service_id);
            if (filters.matricule) params.append('matricule', filters.matricule);
            params.append('page', page);
            params.append('limit', PER_PAGE);
            const res = await api.get(`/stats/${activeTab}?${params.toString()}`);
            setData(res.data);
        } catch (error) {
            console.error(error);
            Swal.fire('Erreur', 'Impossible de charger les statistiques.', 'error');
        } finally { setLoading(false); }
    }, [activeTab, filters, page]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { setPage(1); setData(null); }, [activeTab]);

    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
    const hasActiveFilters = filters.date_from || filters.date_to || filters.service_id || filters.matricule;
    const clearFilters = () => setFilters({ date_from: '', date_to: '', service_id: '', matricule: '' });

    const fmt = (n) => n == null ? '0' : Number(n).toLocaleString('fr-FR');
    const fmtMoney = (n) => n == null ? '0' : Number(n).toLocaleString('fr-FR') + ' F';
    const fmtMonth = (m) => {
        if (!m) return '-';
        const [y, mo] = m.split('-');
        const d = new Date(y, parseInt(mo) - 1);
        return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    };
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-';

    /* ── Computed KPIs ── */
    const absKpi = useMemo(() => {
        if (!data?.byType) return { totalJours: 0, totalCount: 0, types: 0 };
        const totalJours = data.byType.reduce((a, b) => a + (parseFloat(b.total_jours) || 0), 0);
        const totalCount = data.byType.reduce((a, b) => a + (parseInt(b.count) || 0), 0);
        return { totalJours, totalCount, types: data.byType.length };
    }, [data]);

    const heuresKpi = useMemo(() => {
        if (!data?.heureSup) return { hs15: 0, hs50: 0, hs75: 0, total: 0, nuit: 0 };
        const hs15 = data.heureSup.reduce((a, b) => a + (parseFloat(b.total_hs15) || 0), 0);
        const hs50 = data.heureSup.reduce((a, b) => a + (parseFloat(b.total_hs50) || 0), 0);
        const hs75 = data.heureSup.reduce((a, b) => a + (parseFloat(b.total_hs75) || 0), 0);
        const nuit = data.primesNuit ? data.primesNuit.reduce((a, b) => a + (parseFloat(b.total_jours_nuit) || 0), 0) : 0;
        return { hs15, hs50, hs75, total: hs15 + hs50 + hs75, nuit };
    }, [data]);

    const mutKpi = useMemo(() => {
        if (!data?.byStatus) return { total: 0, attente: 0, valide: 0, rejete: 0 };
        const attente = data.byStatus.find(s => s.status === 'En attente');
        const valide = data.byStatus.find(s => s.status === 'Validé');
        const rejete = data.byStatus.find(s => s.status === 'rejeté');
        const total = data.byStatus.reduce((a, b) => a + (parseInt(b.count) || 0), 0);
        return { total, attente: parseInt(attente?.count) || 0, valide: parseInt(valide?.count) || 0, rejete: parseInt(rejete?.count) || 0 };
    }, [data]);

    /* ── Render helpers ── */
    const maxVal = (arr, key) => Math.max(...arr.map(a => parseFloat(a[key]) || 0), 1);

    const renderBar = (value, max, color = '#0ab39c') => (
        <div style={{ height: 6, borderRadius: 3, background: '#e9ecef', overflow: 'hidden', minWidth: 60, flex: 1 }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${Math.min((parseFloat(value) / max) * 100, 100)}%`, background: color, transition: 'width .4s ease' }} />
        </div>
    );

    const renderRankBadge = (i) => {
        const colors = ['linear-gradient(135deg,#f7b84b,#f0a531)', 'linear-gradient(135deg,#878a99,#6c6f78)', 'linear-gradient(135deg,#cd7f32,#b56d2b)'];
        if (i < 3) return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: colors[i], color: '#fff', fontWeight: 700, fontSize: '.75rem' }}>{i + 1}</span>;
        return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: '#f0f0f0', color: '#878a99', fontWeight: 600, fontSize: '.75rem' }}>{i + 1}</span>;
    };

    const renderPagination = () => {
        if (!data || !data.totalPages || data.totalPages <= 1) return null;
        return (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '.8rem', color: '#878a99' }}>Page {data.page} sur {data.totalPages} — {fmt(data.totalCount)} résultat{data.totalCount > 1 ? 's' : ''}</span>
                <div className="d-flex gap-1">
                    <button className="btn btn-sm" disabled={data.page <= 1} onClick={() => setPage(p => p - 1)}
                        style={{ borderRadius: 8, border: '1px solid #e9ecef', background: '#fff', padding: '4px 12px', fontSize: '.8rem', color: '#405189' }}>
                        <i className="ri-arrow-left-s-line me-1" />Préc.
                    </button>
                    <button className="btn btn-sm" disabled={data.page >= data.totalPages} onClick={() => setPage(p => p + 1)}
                        style={{ borderRadius: 8, border: '1px solid #e9ecef', background: '#fff', padding: '4px 12px', fontSize: '.8rem', color: '#405189' }}>
                        Suiv.<i className="ri-arrow-right-s-line ms-1" />
                    </button>
                </div>
            </div>
        );
    };

    const renderEmpty = (msg) => (
        <div className="text-center py-5">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f3f6f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <i className="ri-bar-chart-box-line" style={{ fontSize: '1.6rem', color: '#878a99' }} />
            </div>
            <p style={{ color: '#878a99', fontSize: '.9rem', margin: 0 }}>{msg || 'Aucune donnée disponible'}</p>
        </div>
    );

    const SectionTitle = ({ icon, title, subtitle, count }) => (
        <div className="d-flex align-items-center gap-3 mb-3">
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f3f6f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={icon} style={{ fontSize: '1.1rem', color: '#405189' }} />
            </div>
            <div>
                <h6 className="fw-semibold mb-0" style={{ fontSize: '.92rem', color: '#2e3a5f' }}>
                    {title}
                    {count !== undefined && <span className="ms-2 badge" style={{ background: '#405189', fontSize: '.7rem', borderRadius: 20, fontWeight: 500 }}>{count}</span>}
                </h6>
                {subtitle && <span style={{ fontSize: '.76rem', color: '#878a99' }}>{subtitle}</span>}
            </div>
        </div>
    );

    /* ──────────────────────────────────────────
       ONGLET ABSENCES
       ────────────────────────────────────────── */
    const renderAbsences = () => {
        if (!data) return null;
        const maxJours = data.byMonth ? maxVal(data.byMonth, 'total_jours') : 1;
        return (
            <>
                {/* KPI cards */}
                <div className="row g-3 mb-4">
                    {[
                        { label: 'Total jours', value: fmt(absKpi.totalJours), icon: 'ri-calendar-line', color: '#f06548', sub: 'Cumul absences' },
                        { label: 'Nombre d\'entrées', value: fmt(absKpi.totalCount), icon: 'ri-file-list-3-line', color: '#299cdb', sub: 'Enregistrements' },
                        { label: 'Types d\'absence', value: absKpi.types, icon: 'ri-pie-chart-line', color: '#405189', sub: 'Catégories' },
                        { label: 'Moy. jours/entrée', value: absKpi.totalCount > 0 ? (absKpi.totalJours / absKpi.totalCount).toFixed(1) : '0', icon: 'ri-bar-chart-line', color: '#0ab39c', sub: 'Moyenne' },
                    ].map((c, i) => (
                        <div key={i} className="col-6 col-lg-3">
                            <div className="card border-0 h-100" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                                <div className="card-body p-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <i className={c.icon} style={{ fontSize: '1.2rem', color: c.color }} />
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: '.72rem', color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{c.label}</p>
                                            <h4 className="mb-0 fw-bold" style={{ fontSize: '1.3rem', color: '#2e3a5f' }}>{c.value}</h4>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '.7rem', color: '#878a99' }}>{c.sub}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Répartition par type */}
                {data.byType && data.byType.length > 0 && (
                    <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-pie-chart-line" title="Répartition par type" subtitle="Distribution des absences par catégorie" />
                            <div className="row g-2">
                                {data.byType.map((item, i) => {
                                    const cfg = ABS_TYPE_LABELS[item.type_abs] || { short: item.type_abs?.replace(/_/g, ' '), icon: 'ri-question-line', color: '#878a99' };
                                    return (
                                        <div key={i} className="col-6 col-md-4 col-lg-3">
                                            <div style={{ borderRadius: 10, border: '1px solid #f0f0f0', padding: '14px', transition: 'all .15s' }}>
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <i className={cfg.icon} style={{ color: cfg.color, fontSize: '1rem' }} />
                                                    <span style={{ fontSize: '.76rem', fontWeight: 600, color: '#2e3a5f' }}>{cfg.short}</span>
                                                </div>
                                                <div className="d-flex align-items-end gap-2">
                                                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#2e3a5f' }}>{fmt(item.total_jours)}</span>
                                                    <span style={{ fontSize: '.72rem', color: '#878a99', marginBottom: 2 }}>jours</span>
                                                </div>
                                                <span className="badge" style={{ background: `${cfg.color}18`, color: cfg.color, fontSize: '.68rem', borderRadius: 6, fontWeight: 500, marginTop: 4 }}>{item.count} entrée{parseInt(item.count) > 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Évolution mensuelle */}
                {data.byMonth && data.byMonth.length > 0 && (
                    <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-line-chart-line" title="Évolution mensuelle" subtitle="Tendance des absences mois par mois" count={data.byMonth.length} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th>Mois</th><th>Total jours</th><th style={{ width: '35%' }}>Répartition</th><th>Entrées</th></tr></thead>
                                    <tbody>
                                        {data.byMonth.map((m, i) => (
                                            <tr key={i}>
                                                <td><span className="fw-semibold">{fmtMonth(m.mois)}</span></td>
                                                <td><span className="fw-bold" style={{ color: '#f06548' }}>{fmt(m.total_jours)}</span></td>
                                                <td>{renderBar(m.total_jours, maxJours, '#f06548')}</td>
                                                <td><span className="badge" style={{ background: '#f3f6f9', color: '#405189', borderRadius: 6, fontWeight: 500 }}>{m.count}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top employés absentéistes */}
                {data.topEmployees && data.topEmployees.length > 0 && (
                    <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-user-star-line" title="Top 10 — Employés les plus absents" subtitle="Classement par cumul de jours d'absence" count={data.topEmployees.length} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th style={{ width: 50 }}>#</th><th>Matricule</th><th>Nom & Prénom</th><th>Total jours</th><th style={{ width: '25%' }}></th><th>Entrées</th></tr></thead>
                                    <tbody>
                                        {data.topEmployees.map((emp, i) => (
                                            <tr key={i}>
                                                <td>{renderRankBadge(i)}</td>
                                                <td><code style={{ fontSize: '.8rem', color: '#405189' }}>{emp.matricule || '-'}</code></td>
                                                <td className="fw-semibold">{emp.nom || ''} {emp.prenom || ''}</td>
                                                <td><span className="fw-bold" style={{ color: '#f06548' }}>{fmt(emp.total_jours)}</span></td>
                                                <td>{renderBar(emp.total_jours, data.topEmployees[0]?.total_jours || 1, '#f06548')}</td>
                                                <td><span className="badge" style={{ background: '#f3f6f9', color: '#405189', borderRadius: 6, fontWeight: 500 }}>{emp.count || '-'}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Détails */}
                {data.details && data.details.length > 0 && (
                    <div className="card border-0" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-list-check-2" title="Détails des absences" subtitle="Liste détaillée avec pagination" count={data.totalCount} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th>Date</th><th>Matricule</th><th>Nom & Prénom</th><th>Service</th><th>Jours</th><th>Type</th><th>Motif</th></tr></thead>
                                    <tbody>
                                        {data.details.map((d, i) => {
                                            const cfg = ABS_TYPE_LABELS[d.type_abs] || { short: d.type_abs?.replace(/_/g, ' '), color: '#878a99' };
                                            return (
                                                <tr key={i}>
                                                    <td>{fmtDate(d.created_at)}</td>
                                                    <td><code style={{ fontSize: '.8rem', color: '#405189' }}>{d.navette_ligne?.employer?.matricule || d.employer?.matricule || '-'}</code></td>
                                                    <td>{d.navette_ligne?.employer?.nom || d.employer?.nom || ''} {d.navette_ligne?.employer?.prenom || d.employer?.prenom || ''}</td>
                                                    <td>{d.navette_ligne?.service?.name || '-'}</td>
                                                    <td><span className="fw-bold">{d.nb_jours}</span></td>
                                                    <td><span className="badge" style={{ background: `${cfg.color}18`, color: cfg.color, borderRadius: 6, fontSize: '.72rem', fontWeight: 500 }}>{cfg.short}</span></td>
                                                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.motif || '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {renderPagination()}
                        </div>
                    </div>
                )}

                {(!data.byType || data.byType.length === 0) && (!data.details || data.details.length === 0) && renderEmpty('Aucune absence enregistrée sur cette période.')}
            </>
        );
    };

    /* ──────────────────────────────────────────
       ONGLET AVANCES
       ────────────────────────────────────────── */
    const renderAccomptes = () => {
        if (!data) return null;
        const maxSomme = data.byMonth ? maxVal(data.byMonth, 'total_somme') : 1;
        return (
            <>
                {/* KPI */}
                <div className="row g-3 mb-4">
                    {[
                        { label: 'Total avances', value: fmtMoney(data.totals?.total_somme), icon: 'ri-money-dollar-circle-line', color: '#f7b84b', sub: 'Montant global' },
                        { label: 'Moyenne/avance', value: fmtMoney(Math.round(data.totals?.avg_somme || 0)), icon: 'ri-bar-chart-line', color: '#299cdb', sub: 'Par avance' },
                        { label: 'Nb d\'avances', value: fmt(data.totals?.count), icon: 'ri-file-list-3-line', color: '#405189', sub: 'Enregistrements' },
                    ].map((c, i) => (
                        <div key={i} className="col-md-4">
                            <div className="card border-0 h-100" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                                <div className="card-body p-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <i className={c.icon} style={{ fontSize: '1.2rem', color: c.color }} />
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: '.72rem', color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{c.label}</p>
                                            <h4 className="mb-0 fw-bold" style={{ fontSize: '1.2rem', color: '#2e3a5f' }}>{c.value}</h4>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '.7rem', color: '#878a99' }}>{c.sub}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Évolution mensuelle */}
                {data.byMonth && data.byMonth.length > 0 && (
                    <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-line-chart-line" title="Évolution mensuelle" subtitle="Tendance des avances mois par mois" count={data.byMonth.length} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th>Mois</th><th>Total (F CFA)</th><th style={{ width: '35%' }}>Répartition</th><th>Nombre</th></tr></thead>
                                    <tbody>
                                        {data.byMonth.map((m, i) => (
                                            <tr key={i}>
                                                <td><span className="fw-semibold">{fmtMonth(m.mois)}</span></td>
                                                <td><span className="fw-bold" style={{ color: '#f7b84b' }}>{fmtMoney(m.total_somme)}</span></td>
                                                <td>{renderBar(m.total_somme, maxSomme, '#f7b84b')}</td>
                                                <td><span className="badge" style={{ background: '#f3f6f9', color: '#405189', borderRadius: 6, fontWeight: 500 }}>{m.count}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top employés */}
                {data.topEmployees && data.topEmployees.length > 0 && (
                    <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-user-star-line" title="Top 10 — Avances les plus élevées" subtitle="Classement par montant cumulé" count={data.topEmployees.length} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th style={{ width: 50 }}>#</th><th>Matricule</th><th>Nom & Prénom</th><th>Total (F CFA)</th><th style={{ width: '25%' }}></th><th>Nb avances</th></tr></thead>
                                    <tbody>
                                        {data.topEmployees.map((emp, i) => (
                                            <tr key={i}>
                                                <td>{renderRankBadge(i)}</td>
                                                <td><code style={{ fontSize: '.8rem', color: '#405189' }}>{emp.matricule || '-'}</code></td>
                                                <td className="fw-semibold">{emp.nom || ''} {emp.prenom || ''}</td>
                                                <td><span className="fw-bold" style={{ color: '#f7b84b' }}>{fmtMoney(emp.total_somme)}</span></td>
                                                <td>{renderBar(emp.total_somme, data.topEmployees[0]?.total_somme || 1, '#f7b84b')}</td>
                                                <td><span className="badge" style={{ background: '#f3f6f9', color: '#405189', borderRadius: 6, fontWeight: 500 }}>{emp.count || '-'}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Détails */}
                {data.details && data.details.length > 0 && (
                    <div className="card border-0" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-list-check-2" title="Détails des avances" subtitle="Liste détaillée avec pagination" count={data.totalCount} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th>Date</th><th>Matricule</th><th>Nom & Prénom</th><th>Service</th><th>Somme (F CFA)</th><th>Motif</th></tr></thead>
                                    <tbody>
                                        {data.details.map((d, i) => (
                                            <tr key={i}>
                                                <td>{fmtDate(d.created_at)}</td>
                                                <td><code style={{ fontSize: '.8rem', color: '#405189' }}>{d.navette_ligne?.employer?.matricule || '-'}</code></td>
                                                <td>{d.navette_ligne?.employer?.nom || ''} {d.navette_ligne?.employer?.prenom || ''}</td>
                                                <td>{d.navette_ligne?.service?.name || '-'}</td>
                                                <td><span className="fw-bold" style={{ color: '#f7b84b' }}>{fmtMoney(d.somme)}</span></td>
                                                <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.motif || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {renderPagination()}
                        </div>
                    </div>
                )}

                {!data.totals?.count && renderEmpty('Aucune avance sur salaire enregistrée sur cette période.')}
            </>
        );
    };

    /* ──────────────────────────────────────────
       ONGLET DÉPARTS
       ────────────────────────────────────────── */
    const renderDeparts = () => {
        if (!data) return null;
        const maxByMonth = data.byMonth ? maxVal(data.byMonth, 'count') : 1;
        const maxByService = data.byService ? maxVal(data.byService, 'count') : 1;
        return (
            <>
                {/* KPI */}
                <div className="row g-3 mb-4">
                    {[
                        { label: 'Employés actifs', value: fmt(data.totalActifs), icon: 'ri-team-line', color: '#0ab39c' },
                        { label: 'Total départs', value: fmt(data.totalDeparts), icon: 'ri-user-unfollow-line', color: '#f06548' },
                        { label: 'Taux de départ', value: `${data.tauxDepart || 0}%`, icon: 'ri-percent-line', color: '#f7b84b' },
                    ].map((c, i) => (
                        <div key={i} className="col-md-4">
                            <div className="card border-0 h-100" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                                <div className="card-body p-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <i className={c.icon} style={{ fontSize: '1.2rem', color: c.color }} />
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: '.72rem', color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{c.label}</p>
                                            <h4 className="mb-0 fw-bold" style={{ fontSize: '1.3rem', color: '#2e3a5f' }}>{c.value}</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Par type */}
                {data.byType && data.byType.length > 0 && (
                    <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-pie-chart-line" title="Par type de départ" subtitle="Répartition selon la nature du départ" />
                            <div className="row g-2">
                                {data.byType.map((item, i) => {
                                    const colors = ['#f06548', '#f7b84b', '#405189', '#299cdb', '#0ab39c', '#e83e8c'];
                                    const c = colors[i % colors.length];
                                    return (
                                        <div key={i} className="col-6 col-md-3">
                                            <div style={{ borderRadius: 10, border: '1px solid #f0f0f0', padding: '14px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '.78rem', fontWeight: 600, color: '#2e3a5f' }}>{item.type_depart || 'Non spécifié'}</span>
                                                <h3 className="fw-bold mt-1 mb-0" style={{ color: c }}>{item.count}</h3>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Par mois */}
                {data.byMonth && data.byMonth.length > 0 && (
                    <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-line-chart-line" title="Évolution mensuelle des départs" count={data.byMonth.length} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th>Mois</th><th>Nb départs</th><th style={{ width: '40%' }}>Répartition</th></tr></thead>
                                    <tbody>
                                        {data.byMonth.map((m, i) => (
                                            <tr key={i}>
                                                <td><span className="fw-semibold">{fmtMonth(m.mois)}</span></td>
                                                <td><span className="fw-bold" style={{ color: '#f06548' }}>{m.count}</span></td>
                                                <td>{renderBar(m.count, maxByMonth, '#f06548')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Par service */}
                {data.byService && data.byService.length > 0 && (
                    <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-building-line" title="Départs par service" count={data.byService.length} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th>Service</th><th>Départs</th><th style={{ width: '40%' }}>Répartition</th></tr></thead>
                                    <tbody>
                                        {data.byService.map((s, i) => (
                                            <tr key={i}>
                                                <td className="fw-semibold">{s['service.name'] || s.service?.name || 'N/A'}</td>
                                                <td><span className="fw-bold" style={{ color: '#405189' }}>{s.count}</span></td>
                                                <td>{renderBar(s.count, maxByService, '#405189')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Détails */}
                {data.details && data.details.length > 0 && (
                    <div className="card border-0" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-list-check-2" title="Liste détaillée des départs" count={data.totalCount} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th>Matricule</th><th>Nom & Prénom</th><th>Service</th><th>Date départ</th><th>Type</th></tr></thead>
                                    <tbody>
                                        {data.details.map((d, i) => (
                                            <tr key={i}>
                                                <td><code style={{ fontSize: '.8rem', color: '#405189' }}>{d.matricule}</code></td>
                                                <td className="fw-semibold">{d.nom} {d.prenom}</td>
                                                <td>{d.service?.name || 'N/A'}</td>
                                                <td>{fmtDate(d.date_depart)}</td>
                                                <td><span className="badge" style={{ background: '#f0654818', color: '#f06548', borderRadius: 6, fontSize: '.72rem', fontWeight: 500 }}>{d.type_depart || 'N/A'}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {renderPagination()}
                        </div>
                    </div>
                )}

                {!data.totalDeparts && renderEmpty('Aucun départ enregistré.')}
            </>
        );
    };

    /* ──────────────────────────────────────────
       ONGLET HEURES & NUIT
       ────────────────────────────────────────── */
    const renderHeures = () => {
        if (!data) return null;
        const maxHS = data.heureSup ? Math.max(...data.heureSup.map(m => (parseFloat(m.total_hs15) || 0) + (parseFloat(m.total_hs50) || 0) + (parseFloat(m.total_hs75) || 0)), 1) : 1;
        return (
            <>
                {/* KPI */}
                <div className="row g-3 mb-4">
                    {[
                        { label: 'HS 15%', value: fmt(heuresKpi.hs15), icon: 'ri-timer-line', color: '#0ab39c' },
                        { label: 'HS 50%', value: fmt(heuresKpi.hs50), icon: 'ri-timer-flash-line', color: '#f7b84b' },
                        { label: 'HS 75%', value: fmt(heuresKpi.hs75), icon: 'ri-alarm-warning-line', color: '#f06548' },
                        { label: 'Total HS', value: fmt(heuresKpi.total), icon: 'ri-time-line', color: '#299cdb' },
                        { label: 'Nuits', value: fmt(heuresKpi.nuit) + ' j', icon: 'ri-moon-line', color: '#405189' },
                    ].map((c, i) => (
                        <div key={i} className="col-6 col-lg">
                            <div className="card border-0 h-100" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                                <div className="card-body p-3 text-center">
                                    <div className="mx-auto mb-2" style={{ width: 40, height: 40, borderRadius: 10, background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className={c.icon} style={{ fontSize: '1.1rem', color: c.color }} />
                                    </div>
                                    <h4 className="mb-0 fw-bold" style={{ fontSize: '1.2rem', color: '#2e3a5f' }}>{c.value}</h4>
                                    <p className="mb-0" style={{ fontSize: '.7rem', color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{c.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Heures sup par mois */}
                {data.heureSup && data.heureSup.length > 0 && (
                    <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-line-chart-line" title="Heures supplémentaires par mois" count={data.heureSup.length} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th>Mois</th><th>HS 15%</th><th>HS 50%</th><th>HS 75%</th><th>Total</th><th style={{ width: '25%' }}></th></tr></thead>
                                    <tbody>
                                        {data.heureSup.map((m, i) => {
                                            const total = (parseFloat(m.total_hs15) || 0) + (parseFloat(m.total_hs50) || 0) + (parseFloat(m.total_hs75) || 0);
                                            return (
                                                <tr key={i}>
                                                    <td><span className="fw-semibold">{fmtMonth(m.mois)}</span></td>
                                                    <td style={{ color: '#0ab39c' }}>{fmt(m.total_hs15)}</td>
                                                    <td style={{ color: '#f7b84b' }}>{fmt(m.total_hs50)}</td>
                                                    <td style={{ color: '#f06548' }}>{fmt(m.total_hs75)}</td>
                                                    <td><span className="fw-bold" style={{ color: '#299cdb' }}>{fmt(total)}</span></td>
                                                    <td>{renderBar(total, maxHS, '#299cdb')}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Primes nuit par mois */}
                {data.primesNuit && data.primesNuit.length > 0 && (
                    <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-moon-line" title="Primes de nuit par mois" count={data.primesNuit.length} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th>Mois</th><th>Total jours nuit</th><th style={{ width: '35%' }}>Répartition</th><th>Entrées</th></tr></thead>
                                    <tbody>
                                        {data.primesNuit.map((m, i) => (
                                            <tr key={i}>
                                                <td><span className="fw-semibold">{fmtMonth(m.mois)}</span></td>
                                                <td><span className="fw-bold" style={{ color: '#405189' }}>{fmt(m.total_jours_nuit)}</span></td>
                                                <td>{renderBar(m.total_jours_nuit, maxVal(data.primesNuit, 'total_jours_nuit'), '#405189')}</td>
                                                <td><span className="badge" style={{ background: '#f3f6f9', color: '#405189', borderRadius: 6, fontWeight: 500 }}>{m.count}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top employés HS */}
                {data.topHeureSup && data.topHeureSup.length > 0 && (
                    <div className="card border-0" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-user-star-line" title="Top 10 — Heures supplémentaires" subtitle="Classement par cumul" count={data.topHeureSup.length} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th style={{ width: 50 }}>#</th><th>Matricule</th><th>Nom & Prénom</th><th>Total heures</th><th style={{ width: '30%' }}></th></tr></thead>
                                    <tbody>
                                        {data.topHeureSup.map((emp, i) => (
                                            <tr key={i}>
                                                <td>{renderRankBadge(i)}</td>
                                                <td><code style={{ fontSize: '.8rem', color: '#405189' }}>{emp.matricule || emp.employer?.matricule || '-'}</code></td>
                                                <td className="fw-semibold">{emp.nom || emp.employer?.nom || ''} {emp.prenom || emp.employer?.prenom || ''}</td>
                                                <td><span className="fw-bold" style={{ color: '#299cdb' }}>{fmt(emp.total_heures)}</span></td>
                                                <td>{renderBar(emp.total_heures, data.topHeureSup[0]?.total_heures || 1, '#299cdb')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {(!data.heureSup || data.heureSup.length === 0) && (!data.topHeureSup || data.topHeureSup.length === 0) && renderEmpty('Aucune donnée d\'heures supplémentaires sur cette période.')}
            </>
        );
    };

    /* ──────────────────────────────────────────
       ONGLET MUTATIONS
       ────────────────────────────────────────── */
    const renderMutations = () => {
        if (!data) return null;
        const maxByMonth = data.byMonth ? maxVal(data.byMonth, 'count') : 1;
        return (
            <>
                {/* KPI */}
                <div className="row g-3 mb-4">
                    {[
                        { label: 'Total', value: fmt(mutKpi.total), icon: 'ri-refresh-line', color: '#405189' },
                        { label: 'En attente', value: fmt(mutKpi.attente), icon: 'ri-time-line', color: '#f7b84b' },
                        { label: 'Validées', value: fmt(mutKpi.valide), icon: 'ri-check-double-line', color: '#0ab39c' },
                        { label: 'Rejetées', value: fmt(mutKpi.rejete), icon: 'ri-close-circle-line', color: '#f06548' },
                    ].map((c, i) => (
                        <div key={i} className="col-6 col-lg-3">
                            <div className="card border-0 h-100" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                                <div className="card-body p-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <i className={c.icon} style={{ fontSize: '1.2rem', color: c.color }} />
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: '.72rem', color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{c.label}</p>
                                            <h4 className="mb-0 fw-bold" style={{ fontSize: '1.3rem', color: '#2e3a5f' }}>{c.value}</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Par statut - badges visuels */}
                {data.byStatus && data.byStatus.length > 0 && (
                    <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-pie-chart-line" title="Répartition par statut" />
                            <div className="d-flex gap-3 flex-wrap">
                                {data.byStatus.map((item, i) => {
                                    const cfg = MUT_STATUS_COLORS[item.status] || { bg: '#f3f6f9', color: '#878a99', icon: 'ri-question-line' };
                                    const pct = mutKpi.total > 0 ? ((parseInt(item.count) / mutKpi.total) * 100).toFixed(0) : 0;
                                    return (
                                        <div key={i} style={{ borderRadius: 12, background: cfg.bg, padding: '16px 20px', minWidth: 140, flex: 1 }}>
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <i className={cfg.icon} style={{ color: cfg.color }} />
                                                <span style={{ fontSize: '.8rem', fontWeight: 600, color: cfg.color }}>{item.status}</span>
                                            </div>
                                            <div className="d-flex align-items-end gap-2">
                                                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2e3a5f' }}>{item.count}</span>
                                                <span style={{ fontSize: '.78rem', color: '#878a99', marginBottom: 3 }}>{pct}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Par mois */}
                {data.byMonth && data.byMonth.length > 0 && (
                    <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-line-chart-line" title="Évolution mensuelle" count={data.byMonth.length} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th>Mois</th><th>Mutations</th><th style={{ width: '40%' }}>Répartition</th></tr></thead>
                                    <tbody>
                                        {data.byMonth.map((m, i) => (
                                            <tr key={i}>
                                                <td><span className="fw-semibold">{fmtMonth(m.mois)}</span></td>
                                                <td><span className="fw-bold" style={{ color: '#0ab39c' }}>{m.count}</span></td>
                                                <td>{renderBar(m.count, maxByMonth, '#0ab39c')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Flux entre services */}
                {data.flux && data.flux.length > 0 && (
                    <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-arrow-left-right-line" title="Flux entre services" subtitle="Mouvements inter-services" count={data.flux.length} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th>Service d'origine</th><th style={{ width: 40, textAlign: 'center' }}></th><th>Service destination</th><th>Nombre</th></tr></thead>
                                    <tbody>
                                        {data.flux.map((f, i) => (
                                            <tr key={i}>
                                                <td className="fw-semibold">{f['serviceOld.name'] || 'N/A'}</td>
                                                <td style={{ textAlign: 'center' }}><i className="ri-arrow-right-line" style={{ color: '#0ab39c' }} /></td>
                                                <td className="fw-semibold">{f['serviceNew.name'] || 'N/A'}</td>
                                                <td><span className="badge" style={{ background: '#0ab39c18', color: '#0ab39c', borderRadius: 6, fontWeight: 600 }}>{f.count}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Historique détaillé */}
                {data.details && data.details.length > 0 && (
                    <div className="card border-0" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="card-body p-4">
                            <SectionTitle icon="ri-list-check-2" title="Historique détaillé" count={data.totalCount} />
                            <div className="table-responsive">
                                <table className="stat-tbl w-100">
                                    <thead><tr><th>Date</th><th>Matricule</th><th>Nom & Prénom</th><th>Ancien service</th><th></th><th>Nouveau service</th><th>Statut</th></tr></thead>
                                    <tbody>
                                        {data.details.map((d, i) => {
                                            const cfg = MUT_STATUS_COLORS[d.status] || { bg: '#f3f6f9', color: '#878a99' };
                                            return (
                                                <tr key={i}>
                                                    <td>{fmtDate(d.created_at)}</td>
                                                    <td><code style={{ fontSize: '.8rem', color: '#405189' }}>{d.employer?.matricule || '-'}</code></td>
                                                    <td className="fw-semibold">{d.employer?.nom || ''} {d.employer?.prenom || ''}</td>
                                                    <td>{d.serviceOld?.name || 'N/A'}</td>
                                                    <td style={{ textAlign: 'center' }}><i className="ri-arrow-right-line" style={{ color: '#0ab39c', fontSize: '.9rem' }} /></td>
                                                    <td>{d.serviceNew?.name || 'N/A'}</td>
                                                    <td><span className="badge" style={{ background: cfg.bg, color: cfg.color, borderRadius: 6, fontSize: '.72rem', fontWeight: 600 }}>{d.status}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {renderPagination()}
                        </div>
                    </div>
                )}

                {mutKpi.total === 0 && renderEmpty('Aucune mutation enregistrée sur cette période.')}
            </>
        );
    };

    /* ──────────────────────────────────────────
       ROUTING ONGLETS
       ────────────────────────────────────────── */
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'absences': return renderAbsences();
            case 'accomptes': return renderAccomptes();
            case 'departs': return renderDeparts();
            case 'heures': return renderHeures();
            case 'mutations': return renderMutations();
            default: return null;
        }
    };

    const activeTabCfg = TABS.find(t => t.key === activeTab);

    /* ──────────────────────────────────────────
       RENDU PRINCIPAL
       ────────────────────────────────────────── */
    return (
        <Layout>
            <style>{`
                .stat-tbl th{cursor:default;user-select:none;white-space:nowrap;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:#878a99;font-weight:600;padding:10px 14px;border-bottom:2px solid #e9ecef;background:#fafbfc}
                .stat-tbl td{padding:10px 14px;font-size:.82rem;vertical-align:middle;border-bottom:1px solid #f0f0f0}
                .stat-tbl tbody tr{transition:all .15s}
                .stat-tbl tbody tr:hover{background:#f4f6fb}
                .stat-tab{transition:all .2s;cursor:pointer;border:none;background:transparent;padding:10px 18px;border-radius:10px;font-size:.84rem;font-weight:500;color:#878a99;display:flex;align-items:center;gap:6px;white-space:nowrap}
                .stat-tab:hover{background:#f3f6f9;color:#405189}
                .stat-tab.active{background:var(--tab-color);color:#fff;box-shadow:0 3px 10px rgba(0,0,0,.15)}
                .stat-filter-card{transition:all .3s ease;overflow:hidden}
            `}</style>

            {/* ── HERO HEADER ── */}
            <div style={{ borderRadius: 16, background: 'linear-gradient(135deg, #405189 0%, #2e3a5f 50%, #0ab39c 100%)', padding: '1.5rem 2rem 1.25rem', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
                <div style={{ position: 'absolute', bottom: -20, left: '30%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
                <div style={{ position: 'absolute', top: '40%', right: '20%', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <nav>
                        <ol className="breadcrumb mb-0" style={{ fontSize: '.8rem' }}>
                            <li className="breadcrumb-item"><a href="/dashboard" style={{ color: 'rgba(255,255,255,.7)' }}>Tableau de bord</a></li>
                            <li className="breadcrumb-item" style={{ color: 'rgba(255,255,255,.5)' }}>Statistiques</li>
                        </ol>
                    </nav>
                    <button
                        className="btn btn-sm"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ background: hasActiveFilters ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.12)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: 10, padding: '6px 16px', fontSize: '.82rem' }}
                    >
                        <i className="ri-filter-3-line me-1" />Filtres
                        {hasActiveFilters && <span className="badge ms-1" style={{ background: '#f06548', fontSize: '.65rem', borderRadius: 8 }}>actif</span>}
                    </button>
                </div>

                <div className="d-flex align-items-center gap-3 flex-wrap">
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="ri-bar-chart-box-line" style={{ fontSize: '1.4rem', color: '#fff' }} />
                    </div>
                    <div>
                        <h3 className="fw-bold mb-1" style={{ color: '#fff', fontSize: '1.35rem' }}>
                            Statistiques & Analyses
                            <span style={{ opacity: .7, fontWeight: 400, fontSize: '.9rem', marginLeft: 8 }}>
                                Module RH
                            </span>
                        </h3>
                        <div className="d-flex gap-2 flex-wrap">
                            <span style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: '.75rem' }}>
                                <i className={`${activeTabCfg?.icon} me-1`} />{activeTabCfg?.label}
                            </span>
                            {hasActiveFilters && (
                                <span style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: '.75rem' }}>
                                    <i className="ri-filter-line me-1" />Filtres appliqués
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FILTRES ── */}
            <div className="stat-filter-card" style={{ maxHeight: showFilters ? 200 : 0, opacity: showFilters ? 1 : 0, marginBottom: showFilters ? '1rem' : 0 }}>
                <div className="card border-0" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                    <div className="card-body p-3">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3 col-6">
                                <label className="form-label" style={{ fontSize: '.76rem', fontWeight: 600, color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em' }}>Date début</label>
                                <input type="date" className="form-control form-control-sm" style={{ borderRadius: 8, fontSize: '.84rem' }}
                                    value={filters.date_from} onChange={(e) => handleFilterChange('date_from', e.target.value)} />
                            </div>
                            <div className="col-md-3 col-6">
                                <label className="form-label" style={{ fontSize: '.76rem', fontWeight: 600, color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em' }}>Date fin</label>
                                <input type="date" className="form-control form-control-sm" style={{ borderRadius: 8, fontSize: '.84rem' }}
                                    value={filters.date_to} onChange={(e) => handleFilterChange('date_to', e.target.value)} />
                            </div>
                            <div className="col-md-3 col-6">
                                <label className="form-label" style={{ fontSize: '.76rem', fontWeight: 600, color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em' }}>Service</label>
                                <select className="form-select form-select-sm" style={{ borderRadius: 8, fontSize: '.84rem' }}
                                    value={filters.service_id} onChange={(e) => handleFilterChange('service_id', e.target.value)}>
                                    <option value="">Tous</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2 col-6">
                                <label className="form-label" style={{ fontSize: '.76rem', fontWeight: 600, color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em' }}>Matricule</label>
                                <input type="text" className="form-control form-control-sm" placeholder="Rechercher..." style={{ borderRadius: 8, fontSize: '.84rem' }}
                                    value={filters.matricule} onChange={(e) => handleFilterChange('matricule', e.target.value)} />
                            </div>
                            <div className="col-md-1 col-12">
                                {hasActiveFilters && (
                                    <button className="btn btn-sm w-100" onClick={clearFilters}
                                        style={{ borderRadius: 8, background: '#f0654818', color: '#f06548', fontSize: '.78rem', fontWeight: 600, border: 'none' }}>
                                        <i className="ri-close-line" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="d-flex gap-2 flex-wrap mb-4" style={{ padding: '6px', background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        className={`stat-tab ${activeTab === tab.key ? 'active' : ''}`}
                        style={{ '--tab-color': tab.color }}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <i className={tab.icon} style={{ fontSize: '1rem' }} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── CONTENU ── */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border" style={{ color: activeTabCfg?.color }} role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                    <p className="mt-2" style={{ color: '#878a99', fontSize: '.9rem' }}>Chargement des statistiques...</p>
                </div>
            ) : (
                renderActiveTab()
            )}
        </Layout>
    );
};

export default StatistiquesPage;
