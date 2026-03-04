import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../axios';
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/base/Loading';
import AlertMessages from '../../components/base/AlertMessages';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';

/* ────────────────────────────────────────────
   CONSTANTES
   ──────────────────────────────────────────── */
const STATUS_CFG = {
    'En attente': { bg: 'warning', icon: 'ri-time-line' },
    'En cours':   { bg: 'info',    icon: 'ri-loader-4-line' },
    'bloqué':     { bg: 'danger',  icon: 'ri-lock-line' },
    'Terminé':    { bg: 'success', icon: 'ri-check-double-line' },
    'Terminer':   { bg: 'success', icon: 'ri-check-double-line' },
    'Annuler':    { bg: 'danger',  icon: 'ri-close-circle-line' },
};

const ETAT_SHORT = {
    "En attente de l'enregistrement des informations des employés": { short: 'Saisie', icon: 'ri-edit-line', color: '#f7b84b' },
    "En attente de l'envoi des informations des employés au manager": { short: 'Envoi manager', icon: 'ri-send-plane-line', color: '#299cdb' },
    "En attente de la confirmation des informations des employés par le manager": { short: 'Confirmation', icon: 'ri-user-settings-line', color: '#405189' },
    "En attente du traitement de l'etat navette par la paie": { short: 'Traitement paie', icon: 'ri-money-dollar-circle-line', color: '#0ab39c' },
    "Etat navette cloturé": { short: 'Clôturé', icon: 'ri-checkbox-circle-line', color: '#0ab39c' },
};

const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

/* ────────────────────────────────────────────
   COMPOSANT PRINCIPAL
   ──────────────────────────────────────────── */
const NavetteHistoryPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [navettes, setNavettes] = useState([]);
    const [grouped, setGrouped] = useState({});
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);

    /* Filtres */
    const now = new Date();
    const [annee, setAnnee] = useState(now.getFullYear().toString());
    const [mois, setMois] = useState('');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [collapsedPeriods, setCollapsedPeriods] = useState({});

    const fetchHistorique = useCallback(async () => {
        setLoading(true);
        try {
            let url = 'navettes/historique?';
            if (annee) url += `annee=${annee}&`;
            if (mois) url += `mois=${mois}&`;
            const response = await api.get(url);
            setNavettes(response.data.data || []);
            setGrouped(response.data.grouped || {});
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique :', error);
            setAlert({ type: 'danger', message: 'Erreur lors du chargement de l\'historique.' });
        } finally {
            setLoading(false);
        }
    }, [annee, mois]);

    useEffect(() => { fetchHistorique(); }, [fetchHistorique]);

    /* KPI */
    const kpi = useMemo(() => {
        const total = navettes.length;
        const periodes = Object.keys(grouped).length;
        const termine = navettes.filter(n => n.status === 'Terminé' || n.status === 'Terminer').length;
        const enCours = navettes.filter(n => n.status === 'En cours' || n.status === 'En attente').length;
        return { total, periodes, termine, enCours };
    }, [navettes, grouped]);

    /* Helpers */
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
    const formatPeriode = (key) => {
        if (!key || key === 'inconnu') return 'Période inconnue';
        const [y, m] = key.split('-');
        return `${MOIS_NOMS[parseInt(m) - 1]} ${y}`;
    };

    const annees = [];
    for (let y = 2024; y <= now.getFullYear() + 1; y++) annees.push(y);

    const togglePeriod = (key) => setCollapsedPeriods(prev => ({ ...prev, [key]: !prev[key] }));

    const getEtatProgress = (etat) => {
        const etats = Object.keys(ETAT_SHORT);
        const idx = etats.indexOf(etat);
        return idx >= 0 ? ((idx + 1) / etats.length) * 100 : 0;
    };

    /* Filtrage local par recherche */
    const filteredGrouped = useMemo(() => {
        const q = search.trim().toLowerCase();
        const result = {};
        Object.entries(grouped).forEach(([key, navs]) => {
            let filtered = navs;
            if (q) {
                filtered = filtered.filter(n =>
                    (n.name || '').toLowerCase().includes(q)
                    || (n.service?.name || '').toLowerCase().includes(q)
                    || (n.status || '').toLowerCase().includes(q)
                );
            }
            if (filterStatus) {
                filtered = filtered.filter(n => n.status === filterStatus);
            }
            if (filtered.length > 0) result[key] = filtered;
        });
        return result;
    }, [grouped, search, filterStatus]);

    const filteredTotal = Object.values(filteredGrouped).reduce((acc, arr) => acc + arr.length, 0);

    /* Pagination des périodes */
    const PERIODS_PER_PAGE = 6;
    const [periodPage, setPeriodPage] = useState(1);
    const sortedPeriodKeys = useMemo(() => Object.keys(filteredGrouped).sort().reverse(), [filteredGrouped]);
    const totalPeriodPages = Math.ceil(sortedPeriodKeys.length / PERIODS_PER_PAGE);
    const pagedPeriodKeys = sortedPeriodKeys.slice((periodPage - 1) * PERIODS_PER_PAGE, periodPage * PERIODS_PER_PAGE);
    useEffect(() => setPeriodPage(1), [search, filterStatus, annee, mois]);

    if (!user) return <Loading loading={true} />;

    return (
        <Layout>
            <style>{`
                .hist-tbl th{white-space:nowrap;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:#878a99;font-weight:600;padding:10px 14px;border-bottom:2px solid #e9ecef;background:#fafbfc}
                .hist-tbl td{padding:10px 14px;font-size:.82rem;vertical-align:middle;border-bottom:1px solid #f0f0f0}
                .hist-tbl tbody tr{transition:all .15s}
                .hist-tbl tbody tr:hover{background:#f4f6fb;transform:translateX(2px)}
                .period-card{transition:all .2s;overflow:hidden}
                .period-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.08)}
                .period-header{cursor:pointer;transition:background .2s}
                .period-header:hover{background:#f4f6fb !important}
                .etat-progress-sm{height:3px;border-radius:2px;background:#e9ecef;overflow:hidden;width:60px}
                .etat-progress-sm .bar{height:100%;border-radius:2px;transition:width .4s ease}
            `}</style>

            {/* ── HERO HEADER ── */}
            <div style={{ borderRadius: 16, background: 'linear-gradient(135deg, #405189 0%, #2e3a5f 50%, #0ab39c 100%)', padding: '1.5rem 2rem 1.25rem', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }}></div>
                <div style={{ position: 'absolute', bottom: -20, left: '30%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }}></div>
                <div style={{ position: 'absolute', top: '40%', right: '20%', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }}></div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <nav>
                        <ol className="breadcrumb mb-0" style={{ fontSize: '.8rem' }}>
                            <li className="breadcrumb-item"><a href="/dashboard" style={{ color: 'rgba(255,255,255,.7)' }}>Tableau de bord</a></li>
                            <li className="breadcrumb-item"><a href="/navettes" style={{ color: 'rgba(255,255,255,.7)' }}>Campagnes</a></li>
                            <li className="breadcrumb-item" style={{ color: 'rgba(255,255,255,.5)' }}>Historique</li>
                        </ol>
                    </nav>
                    <button onClick={() => navigate('/navettes')} className="btn btn-sm" style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: 10, padding: '6px 16px', fontSize: '.82rem' }}>
                        <i className="ri-arrow-left-line me-1"></i>Campagnes du mois
                    </button>
                </div>

                <div className="d-flex align-items-center gap-3 flex-wrap">
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="ri-history-line" style={{ fontSize: '1.4rem', color: '#fff' }}></i>
                    </div>
                    <div>
                        <h3 className="fw-bold mb-1" style={{ color: '#fff', fontSize: '1.35rem' }}>
                            Historique des campagnes
                        </h3>
                        <div className="d-flex gap-2 flex-wrap">
                            <span style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: '.75rem' }}>
                                <i className="ri-file-list-3-line me-1"></i>{kpi.total} navette{kpi.total > 1 ? 's' : ''}
                            </span>
                            <span style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: '.75rem' }}>
                                <i className="ri-calendar-line me-1"></i>{kpi.periodes} période{kpi.periodes > 1 ? 's' : ''}
                            </span>
                            <span style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: '.75rem' }}>
                                <i className="ri-check-double-line me-1"></i>{kpi.termine} terminée{kpi.termine > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <AlertMessages alert={alert} setAlert={setAlert} />

            {/* ── FILTRES ── */}
            <div className="card border-0 mb-3" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                <div className="card-body py-3">
                    <div className="row g-2 align-items-end">
                        <div className="col-md-3">
                            <label className="form-label mb-1" style={{ fontSize: '.75rem', fontWeight: 600, color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em' }}>Année</label>
                            <select className="form-select form-select-sm" value={annee} onChange={(e) => setAnnee(e.target.value)} style={{ borderRadius: 8 }}>
                                <option value="">Toutes les années</option>
                                {annees.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label mb-1" style={{ fontSize: '.75rem', fontWeight: 600, color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em' }}>Mois</label>
                            <select className="form-select form-select-sm" value={mois} onChange={(e) => setMois(e.target.value)} style={{ borderRadius: 8 }}>
                                <option value="">Tous les mois</option>
                                {MOIS_NOMS.map((nom, i) => <option key={i + 1} value={i + 1}>{nom}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label mb-1" style={{ fontSize: '.75rem', fontWeight: 600, color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em' }}>Recherche</label>
                            <div className="position-relative">
                                <i className="ri-search-line position-absolute" style={{ left: 10, top: '50%', transform: 'translateY(-50%)', color: '#878a99', fontSize: '.85rem' }}></i>
                                <input type="text" className="form-control form-control-sm" placeholder="Nom, service, statut..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30, borderRadius: 8, fontSize: '.8rem' }} />
                            </div>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label mb-1" style={{ fontSize: '.75rem', fontWeight: 600, color: '#878a99', textTransform: 'uppercase', letterSpacing: '.04em' }}>Statut</label>
                            <select className="form-select form-select-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ borderRadius: 8 }}>
                                <option value="">Tous les statuts</option>
                                {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="col-md-1 d-flex gap-2 align-items-end">
                            <button className="btn btn-sm btn-primary flex-grow-1" onClick={fetchHistorique} style={{ borderRadius: 8 }}>
                                <i className="ri-search-line me-1"></i>Filtrer
                            </button>
                            {(mois || search || filterStatus) && (
                                <button className="btn btn-sm btn-ghost-danger" onClick={() => { setMois(''); setSearch(''); setFilterStatus(''); }} style={{ borderRadius: 8 }}>
                                    <i className="ri-close-line"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── KPI RAPIDES ── */}
            <div className="d-flex gap-2 flex-wrap mb-3">
                {[
                    { label: 'Total', value: filteredTotal, icon: 'ri-file-list-3-line', color: 'primary' },
                    { label: 'Périodes', value: Object.keys(filteredGrouped).length, icon: 'ri-calendar-line', color: 'info' },
                    { label: 'Terminées', value: kpi.termine, icon: 'ri-check-double-line', color: 'success' },
                    { label: 'En cours', value: kpi.enCours, icon: 'ri-loader-4-line', color: 'warning' },
                ].map(s => (
                    <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '6px 14px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem' }}>
                        <i className={`${s.icon} text-${s.color}`}></i>
                        <span className="text-muted">{s.label}</span>
                        <strong className={`text-${s.color}`}>{s.value}</strong>
                    </div>
                ))}
            </div>

            {/* ── CONTENU ── */}
            {loading ? (
                <Loading loading={true} />
            ) : Object.keys(filteredGrouped).length === 0 ? (
                <div className="card border-0" style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                    <div className="card-body text-center py-5">
                        <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg,#f7b84b22,#f0650422)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <i className="ri-inbox-line" style={{ fontSize: '2rem', color: '#f7b84b' }}></i>
                        </div>
                        <h6 className="fw-semibold mb-1">Aucune campagne trouvée</h6>
                        <p className="text-muted mb-0" style={{ fontSize: '.85rem' }}>Essayez de modifier vos filtres de recherche.</p>
                    </div>
                </div>
            ) : (
                <>
                {pagedPeriodKeys.map((periodeKey) => {
                    const navs = filteredGrouped[periodeKey];
                    const isCollapsed = collapsedPeriods[periodeKey];
                    const termineCount = navs.filter(n => n.status === 'Terminé' || n.status === 'Terminer').length;
                    const progressPct = navs.length > 0 ? Math.round((termineCount / navs.length) * 100) : 0;

                    return (
                        <div key={periodeKey} className="card border-0 period-card mb-3" style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                            {/* Period Header */}
                            <div
                                className="period-header d-flex align-items-center justify-content-between px-4 py-3"
                                style={{ background: '#fafbfc', borderBottom: isCollapsed ? 'none' : '1px solid #e9ecef', borderRadius: isCollapsed ? 14 : '14px 14px 0 0' }}
                                onClick={() => togglePeriod(periodeKey)}
                            >
                                <div className="d-flex align-items-center gap-3">
                                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#405189,#0ab39c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <i className="ri-calendar-line" style={{ color: '#fff', fontSize: '1rem' }}></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-0 fw-semibold" style={{ fontSize: '.95rem' }}>{formatPeriode(periodeKey)}</h6>
                                        <div className="d-flex gap-2 mt-1">
                                            <span className="badge bg-primary-subtle text-primary" style={{ fontSize: '.68rem' }}>{navs.length} service{navs.length > 1 ? 's' : ''}</span>
                                            <span className="badge bg-success-subtle text-success" style={{ fontSize: '.68rem' }}>{termineCount} terminée{termineCount > 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    {/* Mini progress */}
                                    <div className="d-none d-md-flex align-items-center gap-2">
                                        <div style={{ width: 80, height: 6, borderRadius: 3, background: '#e9ecef', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', borderRadius: 3, width: `${progressPct}%`, background: progressPct === 100 ? '#0ab39c' : '#f7b84b', transition: 'width .4s ease' }}></div>
                                        </div>
                                        <span style={{ fontSize: '.7rem', color: '#878a99', fontWeight: 600 }}>{progressPct}%</span>
                                    </div>
                                    <i className={`ri-arrow-${isCollapsed ? 'down' : 'up'}-s-line`} style={{ fontSize: '1.2rem', color: '#878a99', transition: 'transform .2s' }}></i>
                                </div>
                            </div>

                            {/* Period Body */}
                            {!isCollapsed && (
                                <div className="p-0" style={{ animation: 'slideDown .25s ease' }}>
                                    <table className="hist-tbl w-100" style={{ borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th>Service</th>
                                                <th>Libellé</th>
                                                <th className="text-center">Période campagne</th>
                                                <th className="text-center">Statut</th>
                                                <th>Progression</th>
                                                <th className="text-center">Créé le</th>
                                                <th className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {navs.map((navette) => {
                                                const cfg = STATUS_CFG[navette.status] || STATUS_CFG['En attente'];
                                                const etatCfg = ETAT_SHORT[navette.etat] || { short: navette.etat || '—', icon: 'ri-question-line', color: '#878a99' };
                                                const progress = getEtatProgress(navette.etat);

                                                return (
                                                    <tr key={navette.id}>
                                                        <td>
                                                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '.72rem' }}>
                                                                <i className="ri-building-line me-1"></i>{navette.service?.name || '—'}
                                                            </span>
                                                        </td>
                                                        <td><span className="fw-semibold">{navette.name}</span></td>
                                                        <td className="text-center">
                                                            <span style={{ fontSize: '.78rem', color: '#495057' }}>
                                                                {formatDate(navette.periode_debut_at)} <i className="ri-arrow-right-line mx-1" style={{ fontSize: '.65rem', color: '#c0c0c0' }}></i> {formatDate(navette.periode_fin_at)}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className={`badge bg-${cfg.bg}-subtle text-${cfg.bg} border border-${cfg.bg}-subtle`} style={{ fontSize: '.72rem' }}>
                                                                <i className={`${cfg.icon} me-1`}></i>{navette.status || 'En attente'}
                                                            </span>
                                                            {navette.status_force && (
                                                                <span className="badge bg-warning-subtle text-warning border border-warning-subtle ms-1" style={{ fontSize: '.6rem' }} title="Clôturée automatiquement — le manager n'a pas envoyé à temps">
                                                                    <i className="ri-alarm-warning-line me-1"></i>Forcé
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <i className={etatCfg.icon} style={{ fontSize: '.75rem', color: etatCfg.color }}></i>
                                                                <div>
                                                                    <div style={{ fontSize: '.7rem', fontWeight: 600, color: etatCfg.color, lineHeight: 1.2 }}>{etatCfg.short}</div>
                                                                    <div className="etat-progress-sm">
                                                                        <div className="bar" style={{ width: `${progress}%`, background: etatCfg.color }}></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <span style={{ fontSize: '.78rem', color: '#878a99' }}>{formatDate(navette.created_at)}</span>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-sm"
                                                                style={{ background: 'linear-gradient(135deg,#405189,#0ab39c)', color: '#fff', borderRadius: 8, padding: '4px 14px', fontSize: '.75rem', border: 'none', fontWeight: 500 }}
                                                                onClick={() => navigate(`/navette/detail/${navette.id}`)}
                                                                title="Voir le détail"
                                                            >
                                                                <i className="ri-eye-line me-1"></i>Détails
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Pagination des périodes */}
                {totalPeriodPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3 px-2">
                        <span style={{ fontSize: '.82rem', color: '#878a99' }}>
                            {sortedPeriodKeys.length} période{sortedPeriodKeys.length > 1 ? 's' : ''} — Page {periodPage}/{totalPeriodPages}
                        </span>
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${periodPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPeriodPage(p => p - 1)} style={{ borderRadius: 8 }}>‹</button>
                            </li>
                            {Array.from({ length: Math.min(totalPeriodPages, 7) }, (_, i) => {
                                let pn;
                                if (totalPeriodPages <= 7) pn = i + 1;
                                else if (periodPage <= 4) pn = i + 1;
                                else if (periodPage >= totalPeriodPages - 3) pn = totalPeriodPages - 6 + i;
                                else pn = periodPage - 3 + i;
                                return (
                                    <li key={pn} className={`page-item ${periodPage === pn ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => setPeriodPage(pn)} style={{ borderRadius: 8 }}>{pn}</button>
                                    </li>
                                );
                            })}
                            <li className={`page-item ${periodPage === totalPeriodPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPeriodPage(p => p + 1)} style={{ borderRadius: 8 }}>›</button>
                            </li>
                        </ul>
                    </div>
                )}
                </>
            )}
        </Layout>
    );
};

export default NavetteHistoryPage;
