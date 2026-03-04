import React from 'react';

/* =========================================================
   CONFIGURATION DES COULEURS & ICÔNES
   ========================================================= */
const KPI_COLORS = {
    primary:   { bg: '#40518915', text: '#405189', icon: '#405189' },
    success:   { bg: '#0ab39c15', text: '#0ab39c', icon: '#0ab39c' },
    warning:   { bg: '#f7b84b15', text: '#f7b84b', icon: '#d4920a' },
    danger:    { bg: '#f0654815', text: '#f06548', icon: '#f06548' },
    info:      { bg: '#299cdb15', text: '#299cdb', icon: '#299cdb' },
    secondary: { bg: '#878a9915', text: '#878a99', icon: '#878a99' },
};

const MUT_STATUS_COLORS = {
    'En attente': '#f7b84b',
    'Validé': '#0ab39c',
    'Rejeté': '#f06548',
};

/* =========================================================
   HELPERS
   ========================================================= */
const fmt = (v) => (v == null ? '0' : new Intl.NumberFormat('fr-FR').format(Math.round(v)));

const pct = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(1) : '0');

const EvolBadge = ({ value }) => {
    if (!value || value === 0 || value === '0' || value === '0.0') return null;
    const n = parseFloat(value);
    const up = n > 0;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600,
            padding: '2px 8px', borderRadius: 20,
            background: up ? '#f0654815' : '#0ab39c15',
            color: up ? '#f06548' : '#0ab39c',
        }}>
            <i className={`ri-arrow-${up ? 'up' : 'down'}-line`} />
            {Math.abs(n)}%
        </span>
    );
};

/* =========================================================
   COMPOSANT PRINCIPAL
   ========================================================= */
const DashboardStats = ({ user, navData, kpis }) => {
    if (!user) return null;

    const nc = navData?.navetteCounts || { newCount: 0, encours: 0, terminer: 0 };
    const empCount = navData?.employeCount || 0;
    const k = kpis || {};

    const isFiltered = k.isFiltered;
    const serviceName = k.serviceName;

    /* ---- Données KPI principale ---- */
    const mainKpis = [
        { label: 'Employés actifs', value: fmt(k.totalEmployes ?? empCount), icon: 'ri-team-line', color: 'primary', sub: `${fmt(k.totalDeparts || 0)} départs total` },
        { label: 'Navettes en cours', value: nc.encours, icon: 'ri-loader-2-line', color: 'warning', sub: `${nc.newCount} en attente · ${nc.terminer} terminées` },
        { label: 'Taux de départ', value: `${k.tauxDepart || 0}%`, icon: 'ri-user-unfollow-line', color: 'danger', sub: `${k.departsMois || 0} ce mois` },
        { label: 'Total navettes', value: k.navettesTotal ?? (nc.newCount + nc.encours + nc.terminer), icon: 'ri-article-line', color: 'success', sub: `${nc.encours} actives` },
    ];

    /* ---- Données mois courant ---- */
    const monthKpis = [
        { label: 'Absences', value: k.totalAbsencesMois ?? 0, icon: 'ri-calendar-line', color: 'warning', sub: `${k.totalJoursAbsMois || 0} jour(s)`, evol: k.evolAbsences },
        { label: 'Avances sur salaire', value: `${fmt(k.totalAccomptesMois)} F`, icon: 'ri-money-dollar-circle-line', color: 'info', sub: 'ce mois', evol: k.evolAccomptes },
        { label: 'Mutations', value: k.totalMutationsMois ?? 0, icon: 'ri-user-shared-line', color: 'primary', evol: k.evolMutations, badges: [
            { label: `${k.totalMutationsEnAttente || 0} att.`, color: '#f7b84b' },
            { label: `${k.totalMutationsValidees || 0} val.`, color: '#0ab39c' },
            { label: `${k.totalMutationsRejetees || 0} rej.`, color: '#f06548' },
        ]},
        { label: 'Heures sup', value: `${k.totalHeureSupMois || 0}h`, icon: 'ri-time-line', color: 'secondary', sub: `Nuit : ${k.totalPrimesNuitMois || 0}j`, breakdown: [
            { label: '15%', val: k.totalHeureSup15Mois || 0 },
            { label: '50%', val: k.totalHeureSup50Mois || 0 },
            { label: '75%', val: k.totalHeureSup75Mois || 0 },
        ]},
    ];

    /* ---- Navettes progress ---- */
    const totalNav = (nc.newCount || 0) + (nc.encours || 0) + (nc.terminer || 0);
    const navProgress = [
        { label: 'En attente', count: nc.newCount || 0, color: '#299cdb' },
        { label: 'En cours', count: nc.encours || 0, color: '#f7b84b' },
        { label: 'Terminées', count: nc.terminer || 0, color: '#0ab39c' },
    ];

    return (
        <div>
            {/* ======== STYLE EMBARQUÉ ======== */}
            <style>{`
                .dash-hero{background:linear-gradient(135deg,#405189 0%,#2e3a5f 50%,#0ab39c 100%);border-radius:16px;padding:32px 36px;color:#fff;margin-bottom:28px;position:relative;overflow:hidden}
                .dash-hero::after{content:'';position:absolute;top:-40%;right:-10%;width:320px;height:320px;background:radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%);border-radius:50%}
                .dash-hero h3{font-weight:700;font-size:1.6rem;margin-bottom:4px}
                .dash-hero p{opacity:.85;margin:0;font-size:.92rem}
                .dash-svc-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.18);backdrop-filter:blur(6px);border-radius:20px;padding:5px 14px;font-size:.82rem;font-weight:600;margin-top:10px;color:#fff}

                .dash-kpi{background:#fff;border-radius:14px;padding:22px 20px;box-shadow:0 2px 12px rgba(0,0,0,.06);transition:transform .2s,box-shadow .2s;height:100%}
                .dash-kpi:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.1)}
                .dash-kpi-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
                .dash-kpi-label{font-size:.78rem;text-transform:uppercase;font-weight:600;letter-spacing:.3px;color:#878a99;margin-bottom:4px}
                .dash-kpi-val{font-size:1.55rem;font-weight:700;color:#495057;line-height:1.15}
                .dash-kpi-sub{font-size:.75rem;color:#878a99;margin-top:3px}

                .dash-section-title{font-size:.82rem;text-transform:uppercase;letter-spacing:.6px;font-weight:700;color:#878a99;margin-bottom:16px;display:flex;align-items:center;gap:8px}
                .dash-section-title i{font-size:15px}

                .dash-month-card{background:#fff;border-radius:14px;padding:22px 20px;box-shadow:0 2px 12px rgba(0,0,0,.06);height:100%;transition:transform .2s,box-shadow .2s}
                .dash-month-card:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.1)}
                .dash-mini-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:.68rem;font-weight:600;margin-right:4px}

                .dash-progress-track{height:8px;background:#f3f3f9;border-radius:8px;overflow:hidden;display:flex}
                .dash-progress-fill{height:100%;transition:width .4s ease}

                .dash-rank-tbl{width:100%;border-collapse:separate;border-spacing:0}
                .dash-rank-tbl th{font-size:.72rem;text-transform:uppercase;color:#878a99;font-weight:600;padding:8px 10px;border-bottom:2px solid #f3f3f9}
                .dash-rank-tbl td{padding:10px;border-bottom:1px solid #f3f3f9;font-size:.85rem;color:#495057}
                .dash-rank-tbl tr:last-child td{border-bottom:none}
                .dash-rank-badge{width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:.72rem;color:#fff}

                .dash-mut-item{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #f3f3f9}
                .dash-mut-item:last-child{border-bottom:none}
                .dash-mut-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
                .dash-mut-name{font-weight:600;font-size:.88rem;color:#495057}
                .dash-mut-detail{font-size:.78rem;color:#878a99}
                .dash-mut-status{font-size:.72rem;font-weight:600;padding:2px 10px;border-radius:10px}

                .dash-depart-alert{background:linear-gradient(135deg,#f0654815 0%,#f0654808 100%);border-left:4px solid #f06548;border-radius:12px;padding:18px 22px;display:flex;align-items:center;gap:16px}
                .dash-depart-alert .alert-icon{width:44px;height:44px;border-radius:12px;background:#f0654818;display:flex;align-items:center;justify-content:center;font-size:20px;color:#f06548}

                .dash-empty{text-align:center;padding:28px 16px;color:#878a99;font-size:.85rem}
                .dash-empty i{font-size:28px;display:block;margin-bottom:8px;opacity:.5}
            `}</style>

            {/* ======== HERO HEADER ======== */}
            <div className="dash-hero">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div>
                        <h3 style={{ color: 'white', fontSize :'16px' }} >
                            <i className="ri-dashboard-line me-2" style={{ opacity: .85 }} />
                            Heureux de vous voir {user.genre === 'Homme' ? 'M.' : 'Mme'} {user.nom} {user.prenom}
                        </h3>
                        <p>Voici un aperçu des activités — de {k.moisCourant || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                        {isFiltered && serviceName && (
                            <div className="dash-svc-badge">
                                <i className="ri-building-line" />
                                Service : {serviceName}
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: 'right', opacity: .9, fontSize: '.92rem' }}>
                        <div><i className="ri-calendar-line me-1" />{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            {/* ======== KPI ROW PRINCIPALE ======== */}
            <div className="row g-3 mb-4">
                {mainKpis.map((kpi, i) => {
                    const c = KPI_COLORS[kpi.color];
                    return (
                        <div className="col-xl-3 col-md-6" key={i}>
                            <div className="dash-kpi">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="dash-kpi-icon" style={{ background: c.bg, color: c.icon }}>
                                        <i className={kpi.icon} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="dash-kpi-label">{kpi.label}</div>
                                        <div className="dash-kpi-val">{kpi.value}</div>
                                        {kpi.sub && <div className="dash-kpi-sub">{kpi.sub}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ======== NAVETTES PROGRESS ======== */}
            {totalNav > 0 && (
                <div className="mb-4" style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span style={{ fontWeight: 700, fontSize: '.92rem', color: '#495057' }}>
                            <i className="ri-article-line me-2" style={{ color: '#405189' }} />
                            Répartition des navettes
                        </span>
                        <span style={{ fontSize: '.8rem', color: '#878a99' }}>{totalNav} au total</span>
                    </div>
                    <div className="dash-progress-track mb-2">
                        {navProgress.map((np, i) => (
                            <div key={i} className="dash-progress-fill" style={{ width: `${pct(np.count, totalNav)}%`, background: np.color }} />
                        ))}
                    </div>
                    <div className="d-flex gap-4 flex-wrap">
                        {navProgress.map((np, i) => (
                            <span key={i} style={{ fontSize: '.78rem', color: '#495057', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: np.color, display: 'inline-block' }} />
                                {np.label} : <b>{np.count}</b> ({pct(np.count, totalNav)}%)
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ======== ALERTE DÉPARTS CE MOIS ======== */}
            {(k.departsMois || 0) > 0 && (
                <div className="dash-depart-alert mb-4">
                    <div className="alert-icon"><i className="ri-logout-box-r-line" /></div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '.95rem', color: '#f06548' }}>
                            {k.departsMois} départ{k.departsMois > 1 ? 's' : ''} ce mois
                        </div>
                        <div style={{ fontSize: '.8rem', color: '#878a99' }}>
                            Attention : des employés ont quitté l'entreprise durant {k.moisCourant || 'ce mois'}
                        </div>
                    </div>
                </div>
            )}

            {/* ======== STATISTIQUES MENSUELLES ======== */}
            {kpis && (
                <>
                    <div className="dash-section-title mt-1">
                        <i className="ri-bar-chart-grouped-line" />
                        Statistiques du mois — {k.moisCourant}
                    </div>

                    <div className="row g-3 mb-4">
                        {monthKpis.map((mk, i) => {
                            const c = KPI_COLORS[mk.color];
                            return (
                                <div className="col-xl-3 col-md-6" key={i}>
                                    <div className="dash-month-card">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <span className="dash-kpi-label">{mk.label}</span>
                                            <EvolBadge value={mk.evol} />
                                        </div>
                                        <div className="d-flex align-items-end justify-content-between">
                                            <div>
                                                <div className="dash-kpi-val" style={{ fontSize: '1.4rem' }}>{mk.value}</div>
                                                {mk.sub && <div className="dash-kpi-sub">{mk.sub}</div>}
                                                {mk.badges && (
                                                    <div className="mt-2">
                                                        {mk.badges.map((b, j) => (
                                                            <span key={j} className="dash-mini-badge" style={{ background: `${b.color}15`, color: b.color }}>{b.label}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {mk.breakdown && (
                                                    <div className="mt-2 d-flex gap-2">
                                                        {mk.breakdown.map((br, j) => (
                                                            <span key={j} style={{ fontSize: '.72rem', color: '#878a99' }}>
                                                                <b>{br.val}h</b> à {br.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="dash-kpi-icon" style={{ background: c.bg, color: c.icon, width: 42, height: 42, fontSize: 20 }}>
                                                <i className={mk.icon} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ======== BOTTOM ROW: TOP ABSENTS + MUTATIONS RÉCENTES ======== */}
            <div className="row g-3 mb-3">
                {/* Top 5 absents */}
                <div className="col-xl-6">
                    <div style={{ background: '#fff', borderRadius: 14, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,.06)', height: '100%' }}>
                        <div className="dash-section-title mt-0 mb-3">
                            <i className="ri-medal-line" style={{ color: '#f7b84b' }} />
                            Top absences — {k.moisCourant || 'ce mois'}
                        </div>
                        {k.topAbsents && k.topAbsents.length > 0 ? (
                            <table className="dash-rank-tbl">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Employé</th>
                                        <th>Matricule</th>
                                        <th style={{ textAlign: 'right' }}>Jours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {k.topAbsents.map((emp, i) => {
                                        const rankColors = ['#f7b84b', '#878a99', '#cd7f32'];
                                        return (
                                            <tr key={i}>
                                                <td>
                                                    <span className="dash-rank-badge" style={{ background: rankColors[i] || '#d2d2d8' }}>
                                                        {i + 1}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 600 }}>{emp.nom} {emp.prenom}</td>
                                                <td style={{ color: '#878a99' }}>{emp.matricule}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span style={{ fontWeight: 700, color: '#f06548' }}>{emp.total_jours}j</span>
                                                    <span style={{ fontSize: '.72rem', color: '#878a99', marginLeft: 6 }}>({emp.nb_absences} abs.)</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="dash-empty">
                                <i className="ri-emotion-happy-line" />
                                Aucune absence enregistrée ce mois
                            </div>
                        )}
                    </div>
                </div>

                {/* Mutations récentes */}
                <div className="col-xl-6">
                    <div style={{ background: '#fff', borderRadius: 14, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,.06)', height: '100%' }}>
                        <div className="dash-section-title mt-0 mb-3">
                            <i className="ri-user-shared-line" style={{ color: '#405189' }} />
                            Mutations récentes
                        </div>
                        {k.recentMutations && k.recentMutations.length > 0 ? (
                            <div>
                                {k.recentMutations.map((m, i) => {
                                    const dotColor = MUT_STATUS_COLORS[m.status] || '#878a99';
                                    return (
                                        <div className="dash-mut-item" key={i}>
                                            <div className="dash-mut-dot" style={{ background: dotColor }} />
                                            <div className="flex-grow-1">
                                                <div className="dash-mut-name">{m.employe}</div>
                                                <div className="dash-mut-detail">
                                                    <i className="ri-arrow-right-line me-1" />
                                                    {m.de} → {m.vers}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="dash-mut-status" style={{ background: `${dotColor}15`, color: dotColor }}>
                                                    {m.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="dash-empty">
                                <i className="ri-exchange-line" />
                                Aucune mutation récente
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ======== EFFECTIF OVERVIEW ======== */}
            {kpis && (
                <div className="row g-3 mb-3">
                    <div className="col-12">
                        <div style={{ background: '#fff', borderRadius: 14, padding: '22px 28px', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                            <div className="dash-section-title mt-0 mb-3">
                                <i className="ri-pie-chart-line" style={{ color: '#0ab39c' }} />
                                Répartition de l'effectif
                            </div>
                            <div className="row g-3">
                                {/* Actifs */}
                                <div className="col-md-4">
                                    <div style={{ textAlign: 'center', padding: 16 }}>
                                        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0ab39c' }}>{fmt(k.totalEmployes)}</div>
                                        <div style={{ fontSize: '.82rem', color: '#878a99', fontWeight: 600 }}>Employés actifs</div>
                                        <div className="mt-2">
                                            <div className="dash-progress-track" style={{ height: 6 }}>
                                                <div className="dash-progress-fill" style={{ width: `${pct(k.totalEmployes, k.totalEmployes + k.totalDeparts)}%`, background: '#0ab39c' }} />
                                            </div>
                                            <div style={{ fontSize: '.72rem', color: '#878a99', marginTop: 4 }}>
                                                {pct(k.totalEmployes, k.totalEmployes + k.totalDeparts)}% de l'effectif total
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Départs */}
                                <div className="col-md-4">
                                    <div style={{ textAlign: 'center', padding: 16 }}>
                                        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f06548' }}>{fmt(k.totalDeparts)}</div>
                                        <div style={{ fontSize: '.82rem', color: '#878a99', fontWeight: 600 }}>Départs cumulés</div>
                                        <div className="mt-2">
                                            <div className="dash-progress-track" style={{ height: 6 }}>
                                                <div className="dash-progress-fill" style={{ width: `${k.tauxDepart}%`, background: '#f06548' }} />
                                            </div>
                                            <div style={{ fontSize: '.72rem', color: '#878a99', marginTop: 4 }}>
                                                Taux : {k.tauxDepart}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Effectif total */}
                                <div className="col-md-4">
                                    <div style={{ textAlign: 'center', padding: 16 }}>
                                        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#405189' }}>{fmt(k.totalEmployes + k.totalDeparts)}</div>
                                        <div style={{ fontSize: '.82rem', color: '#878a99', fontWeight: 600 }}>Effectif total (historique)</div>
                                        <div className="mt-3 d-flex justify-content-center gap-3">
                                            <span style={{ fontSize: '.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0ab39c' }} /> Actifs
                                            </span>
                                            <span style={{ fontSize: '.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f06548' }} /> Départs
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardStats;