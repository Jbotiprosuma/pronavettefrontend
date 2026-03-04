import React, { useState, useEffect, useCallback } from 'react';
import api from '../../axios';
import Layout from '../../components/base/Layout';
import Loading from '../../components/base/Loading';
import AlertMessages from '../../components/base/AlertMessages';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const TYPE_CONFIG = {
    absence:      { label:'Absences',       icon:'ri-calendar-line',      color:'#f06548', bg:'#f0654812' },
    prime:        { label:'Primes',         icon:'ri-money-dollar-circle-line', color:'#0ab39c', bg:'#0ab39c12' },
    acompte:      { label:'Acomptes',       icon:'ri-hand-coin-line',           color:'#f7b84b', bg:'#f7b84b12' },
    heure_sup:    { label:'Heures Sup',     icon:'ri-time-line',                color:'#299cdb', bg:'#299cdb12' },
    prime_nuit:   { label:'Primes Nuit',    icon:'ri-moon-line',                color:'#405189', bg:'#40518912' },
    mutation:     { label:'Mutations',      icon:'ri-user-shared-line',         color:'#878a99', bg:'#878a9912' },
    depart:       { label:'Départs',        icon:'ri-logout-box-line',          color:'#343a40', bg:'#343a4012' },
    embauche:     { label:'Embauches',      icon:'ri-user-add-line',            color:'#0ab39c', bg:'#0ab39c12' },
    modification: { label:'Modifications',  icon:'ri-edit-line',                color:'#f7b84b', bg:'#f7b84b12' },
    import:       { label:'Imports',        icon:'ri-upload-line',              color:'#299cdb', bg:'#299cdb12' },
    navette:      { label:'Navettes',       icon:'ri-ship-line',                color:'#405189', bg:'#40518912' },
};
const CLR = { primary:'#405189', success:'#0ab39c', warning:'#f7b84b', danger:'#f06548', info:'#299cdb', secondary:'#878a99' };

const thS = { padding:'11px 14px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'#878a99', background:'#f8f9fa', borderBottom:'1.5px solid #e9ebec', whiteSpace:'nowrap' };
const tdS = { padding:'10px 14px', fontSize:13, color:'#495057', verticalAlign:'middle' };

const ActionBtn = ({ color, icon, title, onClick, label }) => (
    <button onClick={onClick} title={title} style={{
        borderRadius:8, border:'none', cursor:'pointer',
        display:'inline-flex', alignItems:'center', gap:5,
        background:`${color}12`, color, fontSize:13, fontWeight:600, padding:'7px 14px', transition:'all .15s',
    }}><i className={icon}></i>{label&&<span>{label}</span>}</button>
);
const PgBtn = ({ children, active, disabled, onClick }) => (
    <button onClick={disabled?undefined:onClick} disabled={disabled} style={{
        minWidth:34, height:34, borderRadius:8, border:active?'none':'1px solid #e9ebec',
        background:active?'#405189':'#fff', color:active?'#fff':disabled?'#ccc':'#495057',
        fontWeight:600, fontSize:13, cursor:disabled?'default':'pointer',
    }}>{children}</button>
);

const EmployerHistoryPage = () => {
    const { user } = useAuth();
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list');

    // List state
    const [employees, setEmployees] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    const [includeDeparted, setIncludeDeparted] = useState(false);
    const [services, setServices] = useState([]);

    // Detail state
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyResume, setHistoryResume] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [historyTotalCount, setHistoryTotalCount] = useState(0);
    const [typeFilter, setTypeFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Stats
    const [stats, setStats] = useState(null);
    const [showStats, setShowStats] = useState(false);

    useEffect(() => { const f = async () => { try { const r = await api.get('/services'); setServices(r.data.data||r.data||[]); } catch {} }; f(); }, []);

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit:20 };
            if(search) params.search = search;
            if(serviceFilter) params.service_id = serviceFilter;
            if(includeDeparted) params.include_departed = 'true';
            const r = await api.get('/employer-history/employees',{params});
            setEmployees(r.data.data||[]); setTotalCount(r.data.totalCount||0); setTotalPages(r.data.totalPages||1);
        } catch { setAlert({type:'danger',message:'Erreur lors du chargement.'}); }
        finally { setLoading(false); }
    }, [page, search, serviceFilter, includeDeparted]);

    useEffect(() => { if(view==='list') fetchEmployees(); }, [view, fetchEmployees]);

    const fetchHistory = useCallback(async () => {
        if(!selectedEmployee) return;
        setLoading(true);
        try {
            const params = { page:historyPage, limit:30 };
            if(typeFilter) params.type = typeFilter;
            if(dateFrom) params.date_from = dateFrom;
            if(dateTo) params.date_to = dateTo;
            const r = await api.get(`/employer-history/${selectedEmployee.id}`,{params});
            setHistory(r.data.data||[]); setHistoryResume(r.data.resume||[]);
            setHistoryTotalPages(r.data.totalPages||1); setHistoryTotalCount(r.data.totalCount||0);
            if(r.data.employer) setSelectedEmployee(p=>({...p,...r.data.employer}));
        } catch { setAlert({type:'danger',message:"Erreur lors du chargement de l'historique."}); }
        finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEmployee?.id, historyPage, typeFilter, dateFrom, dateTo]);

    useEffect(() => { if(view==='detail') fetchHistory(); }, [view, fetchHistory]);

    const fetchStats = async empId => {
        try { const params={}; if(dateFrom)params.date_from=dateFrom; if(dateTo)params.date_to=dateTo; const r=await api.get(`/employer-history/${empId}/stats`,{params}); setStats(r.data); setShowStats(true); }
        catch { console.error('Erreur stats'); }
    };

    const handleSync = async () => {
        const r = await Swal.fire({ title:"Synchroniser l'historique ?", html:'<p>Importer toutes les données existantes dans la table d\'historique.</p><p class="text-warning"><strong>\u00c0 exécuter une seule fois.</strong></p>', icon:'question', showCancelButton:true, confirmButtonText:'Synchroniser', cancelButtonText:'Annuler', confirmButtonColor:'#0ab39c' });
        if(!r.isConfirmed)return;
        try { const res=await api.post('/employer-history/sync'); await Swal.fire({title:'Synchronisation terminée',text:res.data.message,icon:'success',confirmButtonColor:'#0ab39c'}); fetchEmployees(); }
        catch(e) { Swal.fire('Erreur',e.response?.data?.message||'Erreur','error'); }
    };

    const openDetail = emp => { setSelectedEmployee(emp); setTypeFilter(''); setDateFrom(''); setDateTo(''); setHistoryPage(1); setShowStats(false); setStats(null); setView('detail'); };
    const backToList = () => { setView('list'); setSelectedEmployee(null); setHistory([]); setStats(null); setShowStats(false); };

    const fmtD = d => d ? new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'}) : '-';
    const fmtDT = d => d ? new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '-';
    const fmtN = n => (n===null||n===undefined)?'0':new Intl.NumberFormat('fr-FR').format(n);

    if(!user) return <Loading loading={true}/>;

    return (
        <Layout>
            {/* HERO */}
            <div style={{background:'linear-gradient(135deg,#405189 0%,#2e3a5f 50%,#0ab39c 100%)',borderRadius:16,padding:'32px 36px',marginBottom:28,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)'}}/>
                <div style={{position:'relative',zIndex:1,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
                    <div>
                        {view==='detail' && (
                            <button onClick={backToList} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontWeight:600,fontSize:13,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                                <i className="ri-arrow-left-line"></i> Retour à la liste
                            </button>
                        )}
                        <h2 style={{color:'#fff',margin:0,fontSize:24,fontWeight:700}}>
                            <i className={view==='list'?'ri-history-line':'ri-user-line'} style={{marginRight:12}}></i>
                            {view==='list'?'Historique des employés':`${selectedEmployee?.prenom} ${selectedEmployee?.nom}`}
                        </h2>
                        <p style={{color:'rgba(255,255,255,.75)',margin:'6px 0 0',fontSize:14}}>
                            {view==='list'?'Suivez l\'historique complet de chaque employé':`Matricule : ${selectedEmployee?.matricule} \u2022 ${selectedEmployee?.service?.name||''}`}
                        </p>
                    </div>
                    {view==='list' && (user.role==='admin'||user.role==='superadmin') && (
                        <button onClick={handleSync} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'9px 18px',cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                            <i className="ri-refresh-line"></i> Sync
                        </button>
                    )}
                </div>
            </div>

            <AlertMessages alert={alert} setAlert={setAlert} />

            {/* ==================== VUE LISTE ==================== */}
            {view==='list' && (
                <>
                    {/* Filters */}
                    <div style={{background:'#fff',borderRadius:14,padding:'18px 22px',marginBottom:20,boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
                        <div className="row g-3 align-items-center">
                            <div className="col-md-4">
                                <div style={{display:'flex',gap:0}}>
                                    <div style={{position:'relative',flex:1}}>
                                        <i className="ri-search-line" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#878a99'}}></i>
                                        <input type="text" value={searchInput} onChange={e=>setSearchInput(e.target.value)}
                                            onKeyDown={e=>{if(e.key==='Enter'){setSearch(searchInput);setPage(1);}}}
                                            placeholder="Rechercher"
                                            style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:'10px 0 0 10px',padding:'8px 12px 8px 36px',fontSize:13,outline:'none'}}/>
                                    </div>
                                    <button onClick={()=>{setSearch(searchInput);setPage(1);}} style={{background:CLR.primary,color:'#fff',border:'none',borderRadius:'0 10px 10px 0',padding:'0 16px',cursor:'pointer'}}>
                                        <i className="ri-search-line"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <select value={serviceFilter} onChange={e=>{setServiceFilter(e.target.value);setPage(1);}} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13,background:'#fff'}}>
                                    <option value="">Tous les services</option>
                                    {services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'#495057'}}>
                                    <input type="checkbox" checked={includeDeparted} onChange={e=>{setIncludeDeparted(e.target.checked);setPage(1);}}
                                        style={{width:18,height:18,accentColor:CLR.primary}}/>
                                    Inclure les départs
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Employee Table */}
                    <div style={{background:'#fff',borderRadius:14,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
                        <div style={{padding:'16px 22px',borderBottom:'1px solid #f3f3f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div style={{fontWeight:700,fontSize:15,color:'#495057'}}>
                                <i className="ri-team-line" style={{marginRight:8}}></i>Employés
                                <span style={{marginLeft:10,background:'#40518912',color:CLR.primary,borderRadius:8,padding:'2px 10px',fontSize:12,fontWeight:700}}>{totalCount}</span>
                            </div>
                        </div>

                        {loading ? (
                            <div style={{textAlign:'center',padding:60}}><div className="spinner-border text-primary" role="status"></div></div>
                        ) : employees.length===0 ? (
                            <div style={{textAlign:'center',padding:'60px 20px'}}>
                                <i className="ri-user-unfollow-line" style={{fontSize:56,color:'#e9ebec'}}></i>
                                <h5 style={{color:'#878a99',marginTop:16,fontWeight:600}}>Aucun employé trouvé</h5>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
                                    <thead><tr>
                                        <th style={thS}>Matricule</th>
                                        <th style={thS}>Nom & Prénom</th>
                                        <th style={thS}>Service</th>
                                        <th style={thS}>Statut</th>
                                        {['absence','prime','acompte','heure_sup','prime_nuit','mutation'].map(t=>
                                            <th key={t} style={{...thS,textAlign:'center'}}>{TYPE_CONFIG[t]?.label}</th>
                                        )}
                                        <th style={{...thS,textAlign:'center'}}>Total</th>
                                        <th style={{...thS,textAlign:'center'}}>Actions</th>
                                    </tr></thead>
                                    <tbody>
                                        {employees.map(emp=>(
                                            <tr key={emp.id} style={{borderBottom:'1px solid #f3f3f9',transition:'background .15s'}}
                                                onMouseEnter={e=>e.currentTarget.style.background='#f8f9fa'}
                                                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                                <td style={tdS}><span style={{background:'#f3f3f9',color:'#495057',borderRadius:6,padding:'2px 8px',fontSize:12,fontWeight:700,fontFamily:'monospace'}}>{emp.matricule}</span></td>
                                                <td style={tdS}>
                                                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                                                        <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:'#40518912',color:CLR.primary,fontWeight:700,fontSize:12}}>
                                                            {(emp.prenom?.[0]||'')+(emp.nom?.[0]||'')}
                                                        </div>
                                                        <div>
                                                            <div style={{fontWeight:600,fontSize:13,color:'#495057'}}>{emp.nom} {emp.prenom}</div>
                                                            {emp.is_cadre && <span style={{background:`${CLR.info}12`,color:CLR.info,borderRadius:6,padding:'1px 6px',fontSize:10,fontWeight:600}}>Cadre</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={tdS}><span style={{fontSize:13}}>{emp.service?.name||'-'}</span></td>
                                                <td style={tdS}>{emp.date_depart
                                                    ? <span style={{background:'#f0654812',color:CLR.danger,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:600}}>{emp.type_depart||'Parti'}</span>
                                                    : <span style={{background:'#0ab39c12',color:CLR.success,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:600}}>Actif</span>
                                                }</td>
                                                {['absence','prime','acompte','heure_sup','prime_nuit','mutation'].map(type=>(
                                                    <td key={type} style={{...tdS,textAlign:'center'}}>
                                                        {emp.summary?.[type]>0
                                                            ? <span style={{background:TYPE_CONFIG[type]?.bg,color:TYPE_CONFIG[type]?.color,borderRadius:8,padding:'2px 8px',fontSize:12,fontWeight:700}}>{emp.summary[type]}</span>
                                                            : <span style={{color:'#ccc'}}>-</span>
                                                        }
                                                    </td>
                                                ))}
                                                <td style={{...tdS,textAlign:'center'}}><span style={{background:'#40518915',color:CLR.primary,borderRadius:8,padding:'2px 10px',fontSize:12,fontWeight:700}}>{emp.totalEvents||0}</span></td>
                                                <td style={{...tdS,textAlign:'center'}}>
                                                    <ActionBtn color={CLR.primary} icon="ri-eye-line" title="Voir l'historique" label="Détail" onClick={()=>openDetail(emp)}/>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {totalPages>1 && (
                            <div style={{padding:'14px 22px',borderTop:'1px solid #f3f3f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                <span style={{fontSize:13,color:'#878a99'}}>Page {page}/{totalPages} ({totalCount} employés)</span>
                                <div style={{display:'flex',gap:4}}>
                                    <PgBtn disabled={page<=1} onClick={()=>setPage(p=>p-1)}>{'\u2039'}</PgBtn>
                                    <PgBtn disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>{'\u203a'}</PgBtn>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ==================== VUE D\u00c9TAIL ==================== */}
            {view==='detail' && selectedEmployee && (
                <>
                    {/* Resume KPI cards */}
                    <div className="row g-3 mb-4">
                        {historyResume.map(r=>{
                            const cfg=TYPE_CONFIG[r.type]||TYPE_CONFIG.navette;
                            const active=typeFilter===r.type;
                            return (
                                <div className="col-xl-2 col-md-4 col-6" key={r.type}>
                                    <div onClick={()=>{setTypeFilter(typeFilter===r.type?'':r.type);setHistoryPage(1);}} style={{
                                        background:active?`${cfg.color}08`:'#fff', borderRadius:14, padding:'16px 14px',
                                        boxShadow:active?`0 0 0 2px ${cfg.color}`:'0 2px 12px rgba(0,0,0,.06)',
                                        cursor:'pointer', transition:'all .2s', display:'flex', alignItems:'center', gap:12,
                                    }}>
                                        <div style={{width:40,height:40,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:cfg.bg,color:cfg.color,fontSize:18}}>
                                            <i className={cfg.icon}></i>
                                        </div>
                                        <div style={{overflow:'hidden'}}>
                                            <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',color:'#878a99',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{cfg.label}</div>
                                            <div style={{fontSize:20,fontWeight:700,color:cfg.color,lineHeight:1.1}}>{r.count}</div>
                                            {r.total_montant>0 && <div style={{fontSize:10,color:'#878a99'}}>{fmtN(r.total_montant)} FCFA</div>}
                                            {r.total_quantite>0&&!r.total_montant && <div style={{fontSize:10,color:'#878a99'}}>{fmtN(r.total_quantite)} j/h</div>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Filters */}
                    <div style={{background:'#fff',borderRadius:14,padding:'18px 22px',marginBottom:20,boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3">
                                <label style={{fontSize:11,fontWeight:600,textTransform:'uppercase',color:'#878a99',marginBottom:4,display:'block'}}>Type</label>
                                <select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setHistoryPage(1);}} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13,background:'#fff'}}>
                                    <option value="">Tous les types</option>
                                    {Object.entries(TYPE_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label style={{fontSize:11,fontWeight:600,textTransform:'uppercase',color:'#878a99',marginBottom:4,display:'block'}}>Du</label>
                                <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setHistoryPage(1);}} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13}}/>
                            </div>
                            <div className="col-md-3">
                                <label style={{fontSize:11,fontWeight:600,textTransform:'uppercase',color:'#878a99',marginBottom:4,display:'block'}}>Au</label>
                                <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setHistoryPage(1);}} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13}}/>
                            </div>
                            <div className="col-md-3" style={{display:'flex',gap:8,alignItems:'flex-end'}}>
                                <ActionBtn color={CLR.info} icon="ri-bar-chart-2-line" label="Statistiques" onClick={()=>fetchStats(selectedEmployee.id)}/>
                                {(dateFrom||dateTo||typeFilter) && <ActionBtn color={CLR.secondary} icon="ri-filter-off-line" label="Reset" onClick={()=>{setTypeFilter('');setDateFrom('');setDateTo('');setHistoryPage(1);}}/>}
                            </div>
                        </div>
                    </div>

                    {/* Stats Panel */}
                    {showStats && stats && (
                        <div style={{background:'#fff',borderRadius:14,padding:0,marginBottom:20,boxShadow:'0 2px 12px rgba(0,0,0,.06)',overflow:'hidden'}}>
                            <div style={{padding:'14px 22px',borderBottom:'1px solid #f3f3f9',display:'flex',justifyContent:'space-between',alignItems:'center',background:`${CLR.info}06`}}>
                                <div style={{fontWeight:700,fontSize:15,color:'#495057'}}><i className="ri-bar-chart-grouped-line" style={{marginRight:8}}></i>Statistiques - {stats.employer?.prenom} {stats.employer?.nom}</div>
                                <button onClick={()=>setShowStats(false)} style={{background:'#f3f3f9',border:'none',borderRadius:8,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#878a99'}}><i className="ri-close-line"></i></button>
                            </div>
                            <div style={{padding:22}}>
                                <div className="row g-4">
                                    {/* Absences */}
                                    <div className="col-md-4">
                                        <h6 style={{color:CLR.danger,marginBottom:12,fontSize:14}}><i className="ri-calendar-line" style={{marginRight:6}}></i>Absences</h6>
                                        {stats.absences?.length>0 ? stats.absences.map((a,i)=>(
                                            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f3f3f9',fontSize:13}}>
                                                <span style={{color:'#878a99'}}>{a.sous_type?.replace(/_/g,' ')}</span>
                                                <span><strong>{a.count}</strong> fois - {fmtN(a.total_jours)} j</span>
                                            </div>
                                        )) : <p style={{color:'#adb5bd',fontSize:13}}>Aucune absence</p>}
                                    </div>
                                    {/* Primes */}
                                    <div className="col-md-4">
                                        <h6 style={{color:CLR.success,marginBottom:12,fontSize:14}}><i className="ri-money-dollar-circle-line" style={{marginRight:6}}></i>Primes</h6>
                                        {stats.primes?.length>0 ? stats.primes.map((p,i)=>(
                                            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f3f3f9',fontSize:13}}>
                                                <span style={{color:'#878a99'}}>{p.sous_type}</span>
                                                <span><strong>{p.count}x</strong> - {fmtN(p.total_montant)} F</span>
                                            </div>
                                        )) : <p style={{color:'#adb5bd',fontSize:13}}>Aucune prime</p>}
                                    </div>
                                    {/* Acomptes */}
                                    <div className="col-md-4">
                                        <h6 style={{color:CLR.warning,marginBottom:12,fontSize:14}}><i className="ri-hand-coin-line" style={{marginRight:6}}></i>Acomptes</h6>
                                        <div style={{display:'flex',gap:20}}>
                                            <div><div style={{fontSize:10,color:'#878a99',textTransform:'uppercase'}}>Total</div><strong>{fmtN(stats.acomptes?.total_montant||0)} F</strong></div>
                                            <div><div style={{fontSize:10,color:'#878a99',textTransform:'uppercase'}}>Nombre</div><strong>{stats.acomptes?.count||0}</strong></div>
                                            <div><div style={{fontSize:10,color:'#878a99',textTransform:'uppercase'}}>Moyenne</div><strong>{fmtN(Math.round(stats.acomptes?.moyenne_montant||0))} F</strong></div>
                                        </div>
                                    </div>
                                    {/* Heures Sup */}
                                    <div className="col-md-4">
                                        <h6 style={{color:CLR.info,marginBottom:12,fontSize:14}}><i className="ri-time-line" style={{marginRight:6}}></i>Heures supplémentaires</h6>
                                        {stats.heuresSup?.length>0 ? stats.heuresSup.map((h,i)=>(
                                            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f3f3f9',fontSize:13}}>
                                                <span style={{color:'#878a99'}}>HS à {h.sous_type}</span>
                                                <span><strong>{h.count}x</strong> - {fmtN(h.total_heures)}h</span>
                                            </div>
                                        )) : <p style={{color:'#adb5bd',fontSize:13}}>Aucune heure sup</p>}
                                    </div>
                                    {/* Primes Nuit */}
                                    <div className="col-md-4">
                                        <h6 style={{color:CLR.primary,marginBottom:12,fontSize:14}}><i className="ri-moon-line" style={{marginRight:6}}></i>Primes de nuit</h6>
                                        <div style={{display:'flex',gap:20}}>
                                            <div><div style={{fontSize:10,color:'#878a99',textTransform:'uppercase'}}>Nombre</div><strong>{stats.primesNuit?.count||0}</strong></div>
                                            <div><div style={{fontSize:10,color:'#878a99',textTransform:'uppercase'}}>Total jours</div><strong>{fmtN(stats.primesNuit?.total_jours||0)} j</strong></div>
                                        </div>
                                    </div>
                                    {/* Mutations */}
                                    <div className="col-md-4">
                                        <h6 style={{color:CLR.secondary,marginBottom:12,fontSize:14}}><i className="ri-user-shared-line" style={{marginRight:6}}></i>Mutations</h6>
                                        {stats.mutations?.length>0 ? stats.mutations.map((m,i)=>(
                                            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f3f3f9',fontSize:13}}>
                                                <span style={{color:'#878a99'}}>{m.sous_type}</span>
                                                <strong>{m.count}</strong>
                                            </div>
                                        )) : <p style={{color:'#adb5bd',fontSize:13}}>Aucune mutation</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History Table */}
                    <div style={{background:'#fff',borderRadius:14,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
                        <div style={{padding:'16px 22px',borderBottom:'1px solid #f3f3f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div style={{fontWeight:700,fontSize:15,color:'#495057'}}>
                                <i className="ri-history-line" style={{marginRight:8}}></i>Historique
                                <span style={{marginLeft:10,background:'#40518912',color:CLR.primary,borderRadius:8,padding:'2px 10px',fontSize:12,fontWeight:700}}>{historyTotalCount}</span>
                                {typeFilter && <span style={{marginLeft:8,background:TYPE_CONFIG[typeFilter]?.bg,color:TYPE_CONFIG[typeFilter]?.color,borderRadius:8,padding:'2px 10px',fontSize:12,fontWeight:600}}>{TYPE_CONFIG[typeFilter]?.label}</span>}
                            </div>
                        </div>

                        {loading ? (
                            <div style={{textAlign:'center',padding:60}}><div className="spinner-border text-primary" role="status"></div></div>
                        ) : history.length===0 ? (
                            <div style={{textAlign:'center',padding:'60px 20px'}}>
                                <i className="ri-history-line" style={{fontSize:56,color:'#e9ebec'}}></i>
                                <h5 style={{color:'#878a99',marginTop:16,fontWeight:600}}>Aucun événement trouvé</h5>
                                <p style={{color:'#adb5bd',fontSize:13}}>Aucun historique disponible pour les critères sélectionnés.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
                                    <thead><tr>
                                        <th style={{...thS,width:50}}></th>
                                        <th style={thS}>Date</th>
                                        <th style={thS}>Type</th>
                                        <th style={thS}>Description</th>
                                        <th style={thS}>Montant</th>
                                        <th style={thS}>Quantité</th>
                                        <th style={thS}>Service</th>
                                        <th style={thS}>Par</th>
                                    </tr></thead>
                                    <tbody>
                                        {history.map(h=>{
                                            const cfg=TYPE_CONFIG[h.type]||TYPE_CONFIG.navette;
                                            return (
                                                <tr key={h.id} style={{borderBottom:'1px solid #f3f3f9',transition:'background .15s'}}
                                                    onMouseEnter={e=>e.currentTarget.style.background='#f8f9fa'}
                                                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                                    <td style={{...tdS,textAlign:'center'}}>
                                                        <div style={{width:32,height:32,borderRadius:8,display:'inline-flex',alignItems:'center',justifyContent:'center',background:cfg.bg,color:cfg.color,fontSize:15}}>
                                                            <i className={cfg.icon}></i>
                                                        </div>
                                                    </td>
                                                    <td style={tdS}>
                                                        <div style={{fontSize:13,fontWeight:600}}>{fmtD(h.periode_at)}</div>
                                                        <div style={{fontSize:11,color:'#878a99'}}>{fmtDT(h.created_at).split(' ').pop()}</div>
                                                    </td>
                                                    <td style={tdS}>
                                                        <span style={{background:cfg.bg,color:cfg.color,borderRadius:8,padding:'3px 10px',fontSize:12,fontWeight:600}}>{cfg.label}</span>
                                                        {h.sous_type && <div style={{fontSize:11,color:'#878a99',marginTop:2}}>{h.sous_type}</div>}
                                                    </td>
                                                    <td style={{...tdS,maxWidth:280}}><span style={{fontSize:13}}>{h.description}</span></td>
                                                    <td style={tdS}>{h.montant ? <strong style={{color:CLR.success}}>{fmtN(h.montant)} F</strong> : <span style={{color:'#ccc'}}>-</span>}</td>
                                                    <td style={tdS}>{h.quantite ? <strong>{fmtN(h.quantite)}</strong> : <span style={{color:'#ccc'}}>-</span>}</td>
                                                    <td style={{...tdS,fontSize:13}}>{h.service?.name||'-'}</td>
                                                    <td style={{...tdS,fontSize:12,color:'#878a99'}}>{h.creator?`${h.creator.prenom} ${h.creator.nom}`:'-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {historyTotalPages>1 && (
                            <div style={{padding:'14px 22px',borderTop:'1px solid #f3f3f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                <span style={{fontSize:13,color:'#878a99'}}>Page {historyPage}/{historyTotalPages} ({historyTotalCount} événements)</span>
                                <div style={{display:'flex',gap:4}}>
                                    <PgBtn disabled={historyPage<=1} onClick={()=>setHistoryPage(p=>p-1)}>{'\u2039'}</PgBtn>
                                    <PgBtn disabled={historyPage>=historyTotalPages} onClick={()=>setHistoryPage(p=>p+1)}>{'\u203a'}</PgBtn>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
            <br/>
        </Layout>
    );
};

export default EmployerHistoryPage;