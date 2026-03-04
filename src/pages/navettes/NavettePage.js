import React, { useState, useEffect, useMemo } from 'react';
import api from '../../axios';
import { NavLink, useNavigate } from 'react-router-dom';
import Loading from '../../components/base/Loading';
import AlertMessages from '../../components/base/AlertMessages';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';
import ActivityLogPanel from '../../components/base/ActivityLogPanel';

/* ────────────────────────────────────────────
   CONSTANTES
   ──────────────────────────────────────────── */
const STATUS_CFG = {
    'En attente': { bg: 'warning', icon: 'ri-time-line', gradient: 'linear-gradient(135deg,#f7b84b,#f0a531)' },
    'En cours':   { bg: 'info',    icon: 'ri-loader-4-line', gradient: 'linear-gradient(135deg,#299cdb,#2385c0)' },
    'bloqué':     { bg: 'danger',  icon: 'ri-lock-line', gradient: 'linear-gradient(135deg,#f06548,#d9534f)' },
    'Terminé':    { bg: 'success', icon: 'ri-check-double-line', gradient: 'linear-gradient(135deg,#0ab39c,#099885)' },
};

const ETAT_SHORT = {
    "En attente de l'enregistrement des informations des employés": { short: 'Saisie', icon: 'ri-edit-line', color: '#f7b84b' },
    "En attente de l'envoi des informations des employés au manager": { short: 'Envoi manager', icon: 'ri-send-plane-line', color: '#299cdb' },
    "En attente de la confirmation des informations des employés par le manager": { short: 'Confirmation', icon: 'ri-user-settings-line', color: '#405189' },
    "En attente du traitement de l'etat navette par la paie": { short: 'Traitement paie', icon: 'ri-money-dollar-circle-line', color: '#0ab39c' },
    "Etat navette cloturé": { short: 'Clôturé', icon: 'ri-checkbox-circle-line', color: '#0ab39c' },
};

const PER_PAGE = 10;

/* ────────────────────────────────────────────
   COMPOSANT PRINCIPAL
   ──────────────────────────────────────────── */
const NavettePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [navettes, setNavettes] = useState(null);
    const [services, setServices] = useState([]);
    const [alert, setAlert] = useState(null);

    /* Filtres & tri */
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterService, setFilterService] = useState('');
    const [filterPeriode, setFilterPeriode] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', dir: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchReq = async () => {
            try {
                const [navetteData, serviceData] = await Promise.all([
                    api.get('navettes'),
                    api.get('services'),
                ]);
                setNavettes(navetteData.data.data);
                setServices(serviceData.data.data || []);
            } catch (error) {
                console.error('Erreur lors de la récupération des navettes', error);
            }
        };
        fetchReq();
    }, []);

    /* ── KPI ── */
    const kpi = useMemo(() => {
        if (!navettes) return { total: 0, enAttente: 0, enCours: 0, bloque: 0, termine: 0, forcees: 0, totalEmployes: 0 };
        const total = navettes.length;
        const enAttente = navettes.filter(n => n.status === 'En attente').length;
        const enCours = navettes.filter(n => n.status === 'En cours').length;
        const bloque = navettes.filter(n => n.status === 'bloqué').length;
        const termine = navettes.filter(n => n.status === 'Terminé').length;
        const forcees = navettes.filter(n => n.status_force === true).length;
        const totalEmployes = navettes.reduce((acc, n) => acc + (n.navetteLignes?.length || 0), 0);
        return { total, enAttente, enCours, bloque, termine, forcees, totalEmployes };
    }, [navettes]);

    /* ── Filtered & sorted ── */
    const filtered = useMemo(() => {
        if (!navettes) return [];
        let data = [...navettes];

        if (search) {
            const q = search.toLowerCase();
            data = data.filter(n =>
                (n.code || '').toLowerCase().includes(q)
                || (n.name || '').toLowerCase().includes(q)
                || (n.service?.name || '').toLowerCase().includes(q)
            );
        }
        if (filterStatus === '__force__') {
            data = data.filter(n => n.status_force === true);
        } else if (filterStatus) {
            data = data.filter(n => n.status === filterStatus);
        }
        if (filterService) data = data.filter(n => String(n.service_id) === filterService);
        if (filterPeriode) data = data.filter(n => {
            if (!n.periode_at) return false;
            const d = new Date(n.periode_at);
            const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return ym === filterPeriode;
        });

        data.sort((a, b) => {
            const { key, dir } = sortConfig;
            let vA, vB;
            if (key === 'service') { vA = a.service?.name || ''; vB = b.service?.name || ''; }
            else if (key === 'periode_at' || key === 'created_at') { vA = new Date(a[key] || 0); vB = new Date(b[key] || 0); }
            else if (key === 'employes') { vA = a.navetteLignes?.length || 0; vB = b.navetteLignes?.length || 0; }
            else { vA = (a[key] || '').toString().toLowerCase(); vB = (b[key] || '').toString().toLowerCase(); }
            if (vA < vB) return dir === 'asc' ? -1 : 1;
            if (vA > vB) return dir === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [navettes, search, filterStatus, filterService, filterPeriode, sortConfig]);

    /* Pagination */
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
    useEffect(() => setCurrentPage(1), [search, filterStatus, filterService, filterPeriode]);

    /* Helpers */
    const handleSort = (key) => setSortConfig(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    const sortIcon = (key) => sortConfig.key !== key ? 'ri-arrow-up-down-line opacity-25' : sortConfig.dir === 'asc' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line';
    const hasActiveFilters = search || filterStatus || filterService || filterPeriode;
    const clearFilters = () => { setSearch(''); setFilterStatus(''); setFilterService(''); setFilterPeriode(''); };

    const getEtatProgress = (etat) => {
        const etats = Object.keys(ETAT_SHORT);
        const idx = etats.indexOf(etat);
        return idx >= 0 ? ((idx + 1) / etats.length) * 100 : 0;
    };

    if (!navettes) return <Loading loading={true} />;

    return (
        <Layout>
            <style>{`
                .nav-pg-tbl th{cursor:pointer;user-select:none;white-space:nowrap;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:#878a99;font-weight:600;padding:10px 14px;border-bottom:2px solid #e9ecef;background:#fafbfc}
                .nav-pg-tbl td{padding:10px 14px;font-size:.82rem;vertical-align:middle;border-bottom:1px solid #f0f0f0}
                .nav-pg-tbl tbody tr{transition:all .15s}
                .nav-pg-tbl tbody tr:hover{background:#f4f6fb;transform:translateX(2px)}
                .kpi-card{transition:all .2s;cursor:pointer;border:2px solid transparent}
                .kpi-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.1)}
                .kpi-card.active{border-color:var(--kpi-color);box-shadow:0 2px 12px rgba(0,0,0,.12)}
                .etat-progress{height:4px;border-radius:2px;background:#e9ecef;overflow:hidden;width:80px}
                .etat-progress-bar{height:100%;border-radius:2px;transition:width .4s ease}
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
                            <li className="breadcrumb-item" style={{ color: 'rgba(255,255,255,.5)' }}>Campagnes</li>
                        </ol>
                    </nav>
                    <div className="d-flex gap-2">
                        {(user.role === 'paie' || user.role === 'admin' || user.role === 'superadmin') && (
                            <>
                                <NavLink to="/navette/lancer" className="btn btn-sm" style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: 10, padding: '6px 16px', fontSize: '.82rem' }}>
                                    <i className="ri-rocket-line me-1"></i>Lancer une campagne
                                </NavLink>
                                <NavLink to="/navettes/historique" className="btn btn-sm" style={{ background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.85)', borderRadius: 10, padding: '6px 16px', fontSize: '.82rem' }}>
                                    <i className="ri-history-line me-1"></i>Historique
                                </NavLink>
                            </>
                        )}
                    </div>
                </div>

                <div className="d-flex align-items-center gap-3 flex-wrap">
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="ri-road-map-line" style={{ fontSize: '1.4rem', color: '#fff' }}></i>
                    </div>
                    <div>
                        <h3 className="fw-bold mb-1" style={{ color: '#fff', fontSize: '1.35rem' }}>
                            Campagnes du mois
                            <span style={{ opacity: .7, fontWeight: 400, fontSize: '.9rem', marginLeft: 8 }}>
                               de {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </span>
                        </h3>
                        <div className="d-flex gap-2 flex-wrap">
                            <span style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: '.75rem' }}>
                                <i className="ri-file-list-3-line me-1"></i>{kpi.total} navette{kpi.total > 1 ? 's' : ''}
                            </span>
                            <span style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: '.75rem' }}>
                                <i className="ri-team-line me-1"></i>{kpi.totalEmployes} employé{kpi.totalEmployes > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <AlertMessages alert={alert} setAlert={setAlert} />

            {/* ── KPI CARDS ── */}
            <div className="row g-3 mb-3">
                {[
                    { label: 'Total',      value: kpi.total,     icon: 'ri-file-list-3-line',   color: '#405189', filter: '' },
                    { label: 'En attente',  value: kpi.enAttente, icon: 'ri-time-line',          color: '#f7b84b', filter: 'En attente' },
                    { label: 'En cours',    value: kpi.enCours,   icon: 'ri-loader-4-line',      color: '#299cdb', filter: 'En cours' },
                    { label: 'Bloqué',      value: kpi.bloque,    icon: 'ri-lock-line',          color: '#f06548', filter: 'bloqué' },
                    { label: 'Terminé',     value: kpi.termine,   icon: 'ri-check-double-line',  color: '#0ab39c', filter: 'Terminé' },
                    { label: 'Forcées',     value: kpi.forcees,   icon: 'ri-alarm-warning-line', color: '#f0a531', filter: '__force__' },
                ].map((card) => (
                    <div key={card.label} className="col-6 col-md-4 col-xl">
                        <div
                            className={`card border-0 kpi-card ${filterStatus === card.filter ? 'active' : ''}`}
                            style={{ '--kpi-color': card.color, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)', cursor: card.filter !== undefined ? 'pointer' : 'default' }}
                            onClick={() => setFilterStatus(filterStatus === card.filter ? '' : card.filter)}
                        >
                            <div className="card-body p-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <i className={card.icon} style={{ fontSize: '1.2rem', color: card.color }}></i>
                                    </div>
                                    <div>
                                        <div className="text-muted text-uppercase" style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.04em' }}>{card.label}</div>
                                        <h4 className="fw-bold mb-0" style={{ color: card.color, fontSize: '1.4rem' }}>{card.value}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── FILTRES ── */}
            <div className="card border-0 mb-3" style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                <div className="card-body py-3">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-3">
                            <div className="position-relative">
                                <i className="ri-search-line position-absolute" style={{ left: 10, top: '50%', transform: 'translateY(-50%)', color: '#878a99', fontSize: '.85rem' }}></i>
                                <input type="text" className="form-control form-control-sm" placeholder="Rechercher (code, libellé, service)..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30, borderRadius: 8, fontSize: '.8rem' }} />
                            </div>
                        </div>
                        <div className="col-md-2">
                            <select className="form-select form-select-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ borderRadius: 8, fontSize: '.8rem' }}>
                                <option value="">Tous les statuts</option>
                                {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select form-select-sm" value={filterService} onChange={e => setFilterService(e.target.value)} style={{ borderRadius: 8, fontSize: '.8rem' }}>
                                <option value="">Tous les services</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <input type="month" className="form-control form-control-sm" value={filterPeriode} onChange={e => setFilterPeriode(e.target.value)} style={{ borderRadius: 8, fontSize: '.8rem' }} />
                        </div>
                        <div className="col-md-2 d-flex gap-2 align-items-center">
                            {hasActiveFilters && (
                                <button className="btn btn-sm btn-ghost-danger" onClick={clearFilters} style={{ fontSize: '.78rem', borderRadius: 8 }}>
                                    <i className="ri-close-line me-1"></i>Réinitialiser
                                </button>
                            )}
                            <span className="badge bg-primary-subtle text-primary rounded-pill px-3">{filtered.length} / {navettes.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TABLE CARD ── */}
            <div className="card border-0" style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                <div className="card-header bg-transparent d-flex align-items-center py-3">
                    <h5 className="card-title mb-0 flex-grow-1 fw-semibold" style={{ fontSize: '1rem' }}>
                        <i className="ri-list-check-2 me-2 text-primary"></i>États navettes
                    </h5>
                </div>

                <div className="card-body p-0" style={{ overflowX: 'auto' }}>
                    {paginated.length > 0 ? (
                        <table className="nav-pg-tbl w-100" style={{ borderCollapse: 'collapse', minWidth: 800 }}>
                            <thead>
                                <tr>
                                    <th style={{ width: 50 }}>#</th>
                                    <th onClick={() => handleSort('code')}>Code <i className={sortIcon('code')} style={{ fontSize: '.7rem' }}></i></th>
                                    <th onClick={() => handleSort('name')}>Libellé <i className={sortIcon('name')} style={{ fontSize: '.7rem' }}></i></th>
                                    <th onClick={() => handleSort('service')}>Service <i className={sortIcon('service')} style={{ fontSize: '.7rem' }}></i></th>
                                    <th onClick={() => handleSort('periode_at')} className="text-center">Période <i className={sortIcon('periode_at')} style={{ fontSize: '.7rem' }}></i></th>
                                    <th onClick={() => handleSort('employes')} className="text-center">Employés <i className={sortIcon('employes')} style={{ fontSize: '.7rem' }}></i></th>
                                    <th onClick={() => handleSort('status')} className="text-center">Statut <i className={sortIcon('status')} style={{ fontSize: '.7rem' }}></i></th>
                                    <th>Progression</th>
                                    <th onClick={() => handleSort('created_at')} className="text-center">Créé le <i className={sortIcon('created_at')} style={{ fontSize: '.7rem' }}></i></th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((n, idx) => {
                                    const cfg = STATUS_CFG[n.status] || STATUS_CFG['En attente'];
                                    const etatCfg = ETAT_SHORT[n.etat] || { short: n.etat, icon: 'ri-question-line', color: '#878a99' };
                                    const progress = getEtatProgress(n.etat);
                                    const empCount = n.navetteLignes?.length || 0;

                                    return (
                                        <tr key={n.id}>
                                            <td className="fw-medium text-muted">{(currentPage - 1) * PER_PAGE + idx + 1}</td>
                                            <td>
                                                <code style={{ fontSize: '.78rem', background: '#f0f2f5', padding: '2px 8px', borderRadius: 4 }}>{n.code}</code>
                                            </td>
                                            <td>
                                                <span className="fw-semibold">{n.name}</span>
                                            </td>
                                            <td>
                                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '.72rem' }}>
                                                    <i className="ri-building-line me-1"></i>{n.service?.name}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span style={{ fontSize: '.82rem' }}>{new Date(n.periode_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-light text-dark border" style={{ fontSize: '.75rem' }}>
                                                    <i className="ri-team-line me-1"></i>{empCount}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge bg-${cfg.bg}-subtle text-${cfg.bg} border border-${cfg.bg}-subtle`} style={{ fontSize: '.72rem' }}>
                                                    <i className={`${cfg.icon} me-1`}></i>{n.status}
                                                </span>
                                                {n.status_force && (
                                                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle ms-1" style={{ fontSize: '.62rem' }} title="Clôturée automatiquement par le système — le manager n'a pas envoyé la navette à temps">
                                                        <i className="ri-alarm-warning-line me-1"></i>Forcé
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className={etatCfg.icon} style={{ fontSize: '.8rem', color: etatCfg.color }}></i>
                                                    <div>
                                                        <div style={{ fontSize: '.72rem', fontWeight: 600, color: etatCfg.color, lineHeight: 1.2 }}>{etatCfg.short}</div>
                                                        <div className="etat-progress">
                                                            <div className="etat-progress-bar" style={{ width: `${progress}%`, background: etatCfg.color }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span style={{ fontSize: '.78rem', color: '#878a99' }}>{new Date(n.created_at || n.createdAt).toLocaleDateString('fr-FR')}</span>
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ background: 'linear-gradient(135deg,#405189,#0ab39c)', color: '#fff', borderRadius: 8, padding: '4px 14px', fontSize: '.75rem', border: 'none', fontWeight: 500 }}
                                                    onClick={() => navigate(`/navette/detail/${n.id}`)}
                                                    title="Consulter les détails"
                                                >
                                                    <i className="ri-eye-line me-1"></i>Détails
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, #f7b84b22, #f0650422)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <i className="ri-inbox-line" style={{ fontSize: '2rem', color: '#f7b84b' }}></i>
                            </div>
                            <h6 className="fw-semibold mb-1">Aucune navette trouvée</h6>
                            <p className="mb-0" style={{ fontSize: '.85rem' }}>
                                {hasActiveFilters ? 'Essayez de modifier vos filtres de recherche.' : "Aucune campagne n'a été lancée pour ce mois."}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="card-footer bg-transparent d-flex justify-content-between align-items-center py-2">
                        <small className="text-muted">
                            {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} sur {filtered.length}
                        </small>
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>‹</button>
                            </li>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 7) pageNum = i + 1;
                                else if (currentPage <= 4) pageNum = i + 1;
                                else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                                else pageNum = currentPage - 3 + i;
                                return (
                                    <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(pageNum)}>{pageNum}</button>
                                    </li>
                                );
                            })}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>›</button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Journal d'activité — Admin uniquement */}
            <ActivityLogPanel module="navette" isAdmin={user?.is_admin || user?.is_superadmin} />
             <br/>
        </Layout>
    );
};

export default NavettePage;
