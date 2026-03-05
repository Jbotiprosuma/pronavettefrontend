import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../axios';
import Layout from '../../components/base/Layout';
import Loading from '../../components/base/Loading';
import AlertMessages from '../../components/base/AlertMessages';
import moment from 'moment';
import 'moment/locale/fr';
moment.locale('fr');

const CLR = { primary:'#405189', success:'#0ab39c', warning:'#f7b84b', danger:'#f06548', info:'#299cdb', secondary:'#878a99' };
const thS = { padding:'11px 14px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'#878a99', background:'#f8f9fa', borderBottom:'1.5px solid #e9ebec', whiteSpace:'nowrap' };
const tdS = { padding:'10px 14px', fontSize:13, color:'#495057', verticalAlign:'middle' };
const STATUS_CFG = { 'Activé':{color:CLR.success,icon:'ri-checkbox-circle-line'},'Désactivé':{color:CLR.danger,icon:'ri-close-circle-line'} };
const HIST_CFG = {
    absence:{icon:'ri-calendar-line',color:CLR.danger,label:'Absence'},
    prime:{icon:'ri-money-dollar-circle-line',color:CLR.success,label:'Prime'},
    acompte:{icon:'ri-hand-coin-line',color:CLR.warning,label:'Acompte'},
    heure_sup:{icon:'ri-time-line',color:CLR.info,label:'Heure sup.'},
    prime_nuit:{icon:'ri-moon-line',color:CLR.primary,label:'Prime nuit'},
    mutation:{icon:'ri-arrow-left-right-line',color:CLR.secondary,label:'Mutation'},
    depart:{icon:'ri-logout-box-line',color:CLR.danger,label:'Départ'},
    embauche:{icon:'ri-user-add-line',color:CLR.success,label:'Embauche'},
    modification:{icon:'ri-edit-line',color:CLR.warning,label:'Modification'},
    import:{icon:'ri-upload-2-line',color:CLR.info,label:'Import'},
    navette:{icon:'ri-bus-line',color:CLR.primary,label:'Navette'},
};

const KpiCard = ({ icon, label, value, color }) => (
    <div style={{background:'#fff',borderRadius:14,padding:'16px 18px',boxShadow:'0 2px 12px rgba(0,0,0,.06)',display:'flex',alignItems:'center',gap:14,height:'100%'}}>
        <div style={{width:44,height:44,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${color}15`,color,fontSize:18,flexShrink:0}}>
            <i className={icon}></i>
        </div>
        <div>
            <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',color:'#878a99'}}>{label}</div>
            <div style={{fontSize:22,fontWeight:700,color:'#495057'}}>{value??0}</div>
        </div>
    </div>
);

const InfoItem = ({ icon, label, value, badge, badgeColor }) => (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #f3f3f9'}}>
        <div style={{width:32,height:32,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'#f3f3f9',color:'#878a99',fontSize:15,flexShrink:0}}>
            <i className={icon}></i>
        </div>
        <div style={{flex:1}}>
            <div style={{fontSize:11,color:'#878a99'}}>{label}</div>
            {badge ? <span style={{background:`${badgeColor||CLR.primary}12`,color:badgeColor||CLR.primary,borderRadius:8,padding:'2px 10px',fontSize:12,fontWeight:600}}>{value}</span>
            : <div style={{fontSize:13,fontWeight:600,color:'#495057'}}>{value||'-'}</div>}
        </div>
    </div>
);

const EmployeDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [employer, setEmployer] = useState(null);
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [historyTypeFilter, setHistoryTypeFilter] = useState('');
    const [historySearch, setHistorySearch] = useState('');

    useEffect(() => {
        const f = async () => {
            try {
                const r = await api.get(`employes/${slug}?detailed=true`);
                setEmployer(r.data.data); setStats(r.data.stats||null); setLogs(r.data.logs||[]); setHistory(r.data.history||[]);
            } catch(err) { setAlert({type:'danger',message:err.response?.data?.message||'Employé introuvable.'}); }
            finally { setLoading(false); }
        }; f();
    }, [slug]);

    const filteredHistory = useMemo(() => history.filter(h => {
        if(historyTypeFilter && h.type!==historyTypeFilter) return false;
        if(historySearch) { const s=historySearch.toLowerCase(); if(!h.description?.toLowerCase().includes(s)&&!h.sous_type?.toLowerCase().includes(s)) return false; }
        return true;
    }), [history, historyTypeFilter, historySearch]);

    const statsGrouped = useMemo(() => {
        const m={}; history.forEach(h=>{ if(!m[h.type])m[h.type]={count:0,montant:0,quantite:0}; m[h.type].count++; m[h.type].montant+=parseFloat(h.montant||0); m[h.type].quantite+=parseFloat(h.quantite||0); }); return m;
    }, [history]);

    if(loading) return <Loading loading={true}/>;

    if(!employer) return (
        <Layout>
            <AlertMessages alert={alert} setAlert={setAlert}/>
            <div style={{textAlign:'center',padding:'60px 20px'}}><i className="ri-user-unfollow-line" style={{fontSize:56,color:'#e9ebec'}}></i><h5 style={{color:'#878a99',marginTop:16}}>Employé introuvable</h5><Link to="/employes" style={{background:CLR.primary,color:'#fff',border:'none',borderRadius:10,padding:'9px 18px',fontWeight:600,fontSize:13,textDecoration:'none',display:'inline-block',marginTop:8}}>Retour</Link></div>
        </Layout>
    );

    const st = STATUS_CFG[employer.status]||STATUS_CFG['Activé'];
    const initials = `${(employer.prenom?.[0]||'')}${(employer.nom?.[0]||'')}`.toUpperCase();
    const fmtD = d => d ? moment(d).format('DD MMMM YYYY') : '-';
    const fmtDT = d => d ? moment(d).format('DD/MM/YYYY HH:mm') : '-';
    const fmtN = n => (n===null||n===undefined)?'0':new Intl.NumberFormat('fr-FR').format(n);

    const tabs = [
        { key:'info', label:'Informations', icon:'ri-user-line' },
        { key:'activity', label:'Journal', icon:'ri-file-list-3-line' },
        { key:'history', label:'Historique', icon:'ri-history-line' },
        { key:'stats', label:'Statistiques', icon:'ri-bar-chart-2-line' },
    ];

    return (
        <Layout>
            <AlertMessages alert={alert} setAlert={setAlert}/>

            {/* HERO */}
            <div style={{background:'linear-gradient(135deg,#405189 0%,#2e3a5f 50%,#0ab39c 100%)',borderRadius:16,padding:'32px 36px',marginBottom:28,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)'}}/>
                <div style={{position:'relative',zIndex:1}}>
                    <button onClick={()=>navigate('/employes')} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontWeight:600,fontSize:13,marginBottom:14,display:'inline-flex',alignItems:'center',gap:6}}>
                        <i className="ri-arrow-left-line"></i> Retour
                    </button>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
                        <div style={{display:'flex',alignItems:'center',gap:16}}>
                            {employer.avatar_url && !employer.avatar_url.startsWith('data:')
                                ? <img src={employer.avatar_url} alt="" style={{width:56,height:56,borderRadius:14,objectFit:'cover'}}/>
                                : <div style={{width:56,height:56,borderRadius:14,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:22,fontWeight:700}}>{initials}</div>
                            }
                            <div>
                                <h2 style={{color:'#fff',margin:0,fontSize:24,fontWeight:700}}>{employer.prenom} {employer.nom}</h2>
                                <p style={{color:'rgba(255,255,255,.75)',margin:'4px 0 0',fontSize:14}}>
                                    {employer.poste_occupe||'Poste non défini'} &bull; {employer.matricule}
                                </p>
                            </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <span style={{background:`${st.color}25`,color:'#fff',borderRadius:20,padding:'5px 14px',fontSize:12,fontWeight:700,display:'inline-flex',alignItems:'center',gap:5}}>
                                <i className={st.icon}></i>{employer.status}
                            </span>
                            {employer.is_cadre && <span style={{background:'rgba(255,255,255,.15)',color:'#fff',borderRadius:20,padding:'5px 12px',fontSize:11,fontWeight:600}}>Cadre</span>}
                            <button onClick={()=>navigate(`/employes/edit/${employer.slug}`)} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'8px 16px',cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                                <i className="ri-pencil-line"></i> Modifier
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI */}
            {stats && (
                <div className="row g-3 mb-4">
                    <div className="col-6 col-xl-2"><KpiCard icon="ri-arrow-left-right-line" label="Mutations" value={stats.mutations} color={CLR.secondary}/></div>
                    <div className="col-6 col-xl-2"><KpiCard icon="ri-calendar-line" label="Absences" value={stats.absences} color={CLR.danger}/></div>
                    <div className="col-6 col-xl-2"><KpiCard icon="ri-hand-coin-line" label="Acomptes" value={stats.accomptes} color={CLR.warning}/></div>
                    <div className="col-6 col-xl-2"><KpiCard icon="ri-time-line" label="Heures sup." value={stats.heuresSup} color={CLR.info}/></div>
                    <div className="col-6 col-xl-2"><KpiCard icon="ri-money-dollar-circle-line" label="Primes" value={stats.primes} color={CLR.success}/></div>
                    <div className="col-6 col-xl-2"><KpiCard icon="ri-moon-line" label="Primes nuit" value={stats.primesNuit} color={CLR.primary}/></div>
                </div>
            )}

            {/* TABS */}
            <div style={{background:'#fff',borderRadius:14,boxShadow:'0 2px 12px rgba(0,0,0,.06)',overflow:'hidden'}}>
                <div style={{display:'flex',gap:0,borderBottom:'2px solid #f3f3f9',padding:'0 22px',overflowX:'auto'}}>
                    {tabs.map(t=>(
                        <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
                            padding:'14px 20px',border:'none',background:'transparent',cursor:'pointer',
                            fontWeight:activeTab===t.key?700:500,fontSize:13,
                            color:activeTab===t.key?CLR.primary:'#878a99',
                            borderBottom:activeTab===t.key?`2.5px solid ${CLR.primary}`:'2.5px solid transparent',
                            display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap',transition:'all .2s',marginBottom:-2,
                        }}>
                            <i className={t.icon}></i>{t.label}
                        </button>
                    ))}
                </div>

                <div style={{padding:22}}>
                    {/* TAB: Informations */}
                    {activeTab==='info' && (
                        <div className="row g-4">
                            <div className="col-lg-6">
                                <h6 style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#878a99',marginBottom:16}}>Informations personnelles</h6>
                                <InfoItem icon="ri-user-line" label="Nom complet" value={`${employer.prenom} ${employer.nom}`}/>
                                <InfoItem icon="ri-id-card-line" label="Matricule" value={employer.matricule} badge badgeColor={CLR.secondary}/>
                                <InfoItem icon="ri-mail-line" label="Email" value={employer.email}/>
                                <InfoItem icon="ri-user-heart-line" label="Genre" value={employer.genre}/>
                                <InfoItem icon="ri-briefcase-line" label="Poste" value={employer.poste_occupe}/>
                                <InfoItem icon="ri-shield-check-line" label="Cadre" value={employer.is_cadre?'Oui':'Non'}/>
                            </div>
                            <div className="col-lg-6">
                                <h6 style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#878a99',marginBottom:16}}>Service & Dates</h6>
                                <InfoItem icon="ri-building-line" label="Service" value={employer.service?.name} badge badgeColor={CLR.info}/>
                                <InfoItem icon="ri-calendar-check-line" label="Date d'embauche" value={fmtD(employer.date_embauche)}/>
                                {employer.date_embauche && <InfoItem icon="ri-timer-line" label="Ancienneté" value={moment(employer.date_embauche).fromNow(true)} badge badgeColor={CLR.primary}/>}
                                {employer.date_depart && <InfoItem icon="ri-door-open-line" label="Date de départ" value={fmtD(employer.date_depart)}/>}
                                {employer.type_depart && <InfoItem icon="ri-information-line" label="Type de départ" value={employer.type_depart} badge badgeColor={CLR.danger}/>}
                                <InfoItem icon="ri-time-line" label="Créé le" value={fmtDT(employer.created_at)}/>
                                {employer.creator && <InfoItem icon="ri-user-star-line" label="Créé par" value={employer.creator.username}/>}
                            </div>
                        </div>
                    )}

                    {/* TAB: Activity Log */}
                    {activeTab==='activity' && (
                        <div>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                                <h6 style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#878a99',margin:0}}>Journal des modifications <span style={{background:`${CLR.secondary}12`,color:CLR.secondary,borderRadius:8,padding:'2px 10px',fontSize:12,fontWeight:700,marginLeft:8}}>{logs.length}</span></h6>
                            </div>
                            {logs.length===0 ? (
                                <div style={{textAlign:'center',padding:'40px 20px'}}><i className="ri-file-list-3-line" style={{fontSize:48,color:'#e9ebec'}}></i><p style={{color:'#878a99',marginTop:12}}>Aucune modification enregistrée.</p></div>
                            ) : logs.map((log,i)=>(
                                <div key={log.id||i} style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid #f3f3f9'}}>
                                    <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${CLR.info}12`,color:CLR.info,fontSize:16,flexShrink:0}}>
                                        <i className="ri-edit-2-line"></i>
                                    </div>
                                    <div style={{flex:1}}>
                                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                            <span style={{fontSize:13,fontWeight:600,color:'#495057'}}>{log.name}</span>
                                            <span style={{fontSize:11,color:'#878a99'}}>{fmtDT(log.created_at)}</span>
                                        </div>
                                        {log.note && <pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit',fontSize:12,color:'#878a99',background:'#f8f9fa',borderRadius:8,padding:'8px 12px',margin:'6px 0 0'}}>{log.note}</pre>}
                                        {log.user && <div style={{fontSize:11,color:'#878a99',marginTop:4}}><i className="ri-user-line" style={{marginRight:4}}></i>Par {log.user.username}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TAB: Historique */}
                    {activeTab==='history' && (
                        <div>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
                                <h6 style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#878a99',margin:0}}>Historique complet <span style={{background:`${CLR.secondary}12`,color:CLR.secondary,borderRadius:8,padding:'2px 10px',fontSize:12,fontWeight:700,marginLeft:8}}>{filteredHistory.length}</span></h6>
                                <div style={{display:'flex',gap:8}}>
                                    <input type="text" placeholder="Rechercher..." value={historySearch} onChange={e=>setHistorySearch(e.target.value)}
                                        style={{border:'1.5px solid #e9ebec',borderRadius:10,padding:'6px 12px',fontSize:13,width:180,outline:'none'}}/>
                                    <select value={historyTypeFilter} onChange={e=>setHistoryTypeFilter(e.target.value)}
                                        style={{border:'1.5px solid #e9ebec',borderRadius:10,padding:'6px 12px',fontSize:13,width:160,background:'#fff'}}>
                                        <option value="">Tous types</option>
                                        {Object.entries(HIST_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            {filteredHistory.length===0 ? (
                                <div style={{textAlign:'center',padding:'40px 20px'}}><i className="ri-history-line" style={{fontSize:48,color:'#e9ebec'}}></i><p style={{color:'#878a99',marginTop:12}}>Aucun événement trouvé.</p></div>
                            ) : (
                                <div className="table-responsive">
                                    <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
                                        <thead><tr>
                                            <th style={{...thS,width:40}}></th>
                                            <th style={thS}>Description</th>
                                            <th style={thS}>Sous-type</th>
                                            <th style={thS}>Montant</th>
                                            <th style={thS}>Quantité</th>
                                            <th style={thS}>Période</th>
                                            <th style={thS}>Date</th>
                                        </tr></thead>
                                        <tbody>
                                            {filteredHistory.map((h,i)=>{
                                                const c=HIST_CFG[h.type]||{icon:'ri-question-line',color:CLR.secondary,label:h.type};
                                                return (
                                                    <tr key={h.id||i} style={{borderBottom:'1px solid #f3f3f9',transition:'background .15s'}}
                                                        onMouseEnter={e=>e.currentTarget.style.background='#f8f9fa'}
                                                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                                        <td style={{...tdS,textAlign:'center'}}>
                                                            <div style={{width:28,height:28,borderRadius:8,display:'inline-flex',alignItems:'center',justifyContent:'center',background:`${c.color}12`,color:c.color,fontSize:14}}>
                                                                <i className={c.icon}></i>
                                                            </div>
                                                        </td>
                                                        <td style={tdS}>{h.description||'-'}</td>
                                                        <td style={tdS}>{h.sous_type||'-'}</td>
                                                        <td style={tdS}>{h.montant?<strong style={{color:CLR.success}}>{fmtN(h.montant)} F</strong>:'-'}</td>
                                                        <td style={tdS}>{h.quantite||'-'}</td>
                                                        <td style={tdS}>{h.periode_at?moment(h.periode_at).format('MMM YYYY'):'-'}</td>
                                                        <td style={{...tdS,fontSize:12,color:'#878a99'}}>{moment(h.created_at).format('DD/MM/YY HH:mm')}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: Statistiques */}
                    {activeTab==='stats' && (
                        <div>
                            <h6 style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#878a99',marginBottom:20}}>Statistiques par type</h6>
                            {Object.keys(statsGrouped).length===0 ? (
                                <div style={{textAlign:'center',padding:'40px 20px'}}><i className="ri-bar-chart-2-line" style={{fontSize:48,color:'#e9ebec'}}></i><p style={{color:'#878a99',marginTop:12}}>Aucune donnée.</p></div>
                            ) : (
                                <div className="row g-3">
                                    {Object.entries(statsGrouped).map(([type,data])=>{
                                        const c=HIST_CFG[type]||{icon:'ri-question-line',color:CLR.secondary,label:type};
                                        return (
                                            <div className="col-md-6 col-lg-4" key={type}>
                                                <div style={{background:'#fff',borderRadius:14,border:`1.5px solid ${c.color}20`,padding:16}}>
                                                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                                                        <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${c.color}12`,color:c.color,fontSize:16}}>
                                                            <i className={c.icon}></i>
                                                        </div>
                                                        <span style={{fontSize:14,fontWeight:700,color:'#495057'}}>{c.label}</span>
                                                    </div>
                                                    <div style={{display:'flex',justifyContent:'space-around',textAlign:'center'}}>
                                                        <div><div style={{fontSize:20,fontWeight:700,color:c.color}}>{data.count}</div><div style={{fontSize:10,color:'#878a99',textTransform:'uppercase'}}>Total</div></div>
                                                        <div><div style={{fontSize:20,fontWeight:700,color:'#495057'}}>{data.montant?fmtN(data.montant):'-'}</div><div style={{fontSize:10,color:'#878a99',textTransform:'uppercase'}}>Montant</div></div>
                                                        <div><div style={{fontSize:20,fontWeight:700,color:'#495057'}}>{data.quantite||'-'}</div><div style={{fontSize:10,color:'#878a99',textTransform:'uppercase'}}>Quantité</div></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default EmployeDetailPage;