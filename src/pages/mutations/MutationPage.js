import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../axios';
import { useNavigate, Link } from 'react-router-dom';
import Loading from '../../components/base/Loading';
import AlertMessages from '../../components/base/AlertMessages';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import ActivityLogPanel from '../../components/base/ActivityLogPanel';
import moment from 'moment';

/* ---------- CONSTANTES ---------- */
const STATUS_CFG = {
    'En attente': { bg: 'warning',   icon: 'ri-time-line',          label: 'En attente' },
    'Validé':     { bg: 'success',   icon: 'ri-check-double-line',  label: 'Validé' },
    'Rejeté':     { bg: 'danger',    icon: 'ri-close-circle-line',  label: 'Rejeté' },
    'Annulé':     { bg: 'secondary', icon: 'ri-forbid-line',        label: 'Annulé' },
};
const PER_PAGE = 50;
const CLR = { primary:'#405189', success:'#0ab39c', warning:'#f7b84b', danger:'#f06548', info:'#299cdb', secondary:'#878a99' };

/* ---------- SUB-COMPONENTS ---------- */
const ActionBtn = ({ color, icon, title, onClick }) => (
    <button onClick={onClick} title={title} style={{
        width:30, height:30, borderRadius:8, border:'none', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        background:`${color}12`, color, fontSize:14, transition:'all .15s',
    }}><i className={icon}></i></button>
);

const PgBtn = ({ children, active, disabled, onClick }) => (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{
        minWidth:34, height:34, borderRadius:8,
        border: active ? 'none' : '1px solid #e9ebec',
        background: active ? '#405189' : '#fff',
        color: active ? '#fff' : disabled ? '#ccc' : '#495057',
        fontWeight:600, fontSize:13, cursor: disabled ? 'default' : 'pointer',
    }}>{children}</button>
);

const thS = {
    padding:'11px 14px', fontSize:11, fontWeight:700, textTransform:'uppercase',
    letterSpacing:.5, color:'#878a99', background:'#f8f9fa', borderBottom:'1.5px solid #e9ebec', whiteSpace:'nowrap',
};
const tdS = { padding:'10px 14px', fontSize:13, color:'#495057', verticalAlign:'middle' };

/* ---------- COMPOSANT PRINCIPAL ---------- */
const MutationPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [mutations, setMutations] = useState([]);
    const [services, setServices] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [alert, setAlert] = useState(null);

    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterService, setFilterService] = useState('');
    const [filterApplied, setFilterApplied] = useState('');
    const [filterPeriode, setFilterPeriode] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);

    /* -- Chargement -- */
    const fetchMutations = useCallback(async () => {
        try { const r = await api.get('mutations'); setMutations(r.data.data || []); }
        catch { setAlert({ type:'danger', message:'Erreur lors du chargement des mutations.' }); }
    }, []);
    const fetchServices = useCallback(async () => {
        try { const r = await api.get('services'); setServices(r.data.data || []); } catch {}
    }, []);
    useEffect(() => { Promise.all([fetchMutations(), fetchServices()]).finally(() => setLoadingData(false)); }, [fetchMutations, fetchServices]);

    /* -- KPI -- */
    const kpi = useMemo(() => {
        const t = mutations.length;
        return {
            total: t,
            enAttente: mutations.filter(m => m.status === 'En attente').length,
            valide:    mutations.filter(m => m.status === 'Validé').length,
            rejete:    mutations.filter(m => m.status === 'Rejeté').length,
            annule:    mutations.filter(m => m.status === 'Annulé').length,
            applique:  mutations.filter(m => m.is_apply).length,
        };
    }, [mutations]);

    /* -- Filtrage -- */
    const filtered = useMemo(() => {
        let data = [...mutations];
        if (search) { const q = search.toLowerCase(); data = data.filter(m => { const e = m.employer; return (e?.matricule||'').toLowerCase().includes(q)||(e?.nom||'').toLowerCase().includes(q)||(e?.prenom||'').toLowerCase().includes(q)||(m.serviceOld?.name||'').toLowerCase().includes(q)||(m.serviceNew?.name||'').toLowerCase().includes(q); }); }
        if (filterStatus) data = data.filter(m => m.status === filterStatus);
        if (filterService) { const sid = parseInt(filterService); data = data.filter(m => m.service_old_id === sid || m.service_new_id === sid); }
        if (filterApplied === '1') data = data.filter(m => m.is_apply);
        if (filterApplied === '0') data = data.filter(m => !m.is_apply);
        if (filterPeriode) data = data.filter(m => m.periode_at && moment(m.periode_at).format('YYYY-MM') === filterPeriode);
        return data;
    }, [mutations, search, filterStatus, filterService, filterApplied, filterPeriode]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated  = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
    useEffect(() => setCurrentPage(1), [search, filterStatus, filterService, filterApplied, filterPeriode]);

    const hasActiveFilters = search || filterStatus || filterService || filterApplied || filterPeriode;
    const clearFilters = () => { setSearch(''); setFilterStatus(''); setFilterService(''); setFilterApplied(''); setFilterPeriode(''); };

    /* -- Sélection -- */
    const toggleSelect = id => { setSelectedIds(p => { const s = new Set(p); s.has(id)?s.delete(id):s.add(id); return s; }); };
    const toggleSelectAll = () => { selectedIds.size === paginated.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(paginated.map(m=>m.id))); };

    /* -- Actions -- */
    const doAction = async (url, title, text, msg, method='patch') => {
        const r = await Swal.fire({ title, text, icon:'question', showCancelButton:true, confirmButtonText:'Confirmer', cancelButtonText:'Annuler' });
        if (!r.isConfirmed) return;
        try { await api[method](url); Swal.fire({ icon:'success', title:'Succès', text:msg, timer:2000, showConfirmButton:false }); setSelectedIds(new Set()); await fetchMutations(); }
        catch(e) { Swal.fire('Erreur', e.response?.data?.message||'Une erreur est survenue.','error'); }
    };
    const handleConfirm = id => doAction(`mutations/${id}/confirm`,'Valider ?',"La mutation passera au statut 'Validé'.",'Mutation validée.');
    const handleReject  = id => doAction(`mutations/${id}/reject`,'Rejeter ?',"La mutation passera au statut 'Rejeté'.",'Mutation rejetée.');
    const handleCancel  = id => doAction(`mutations/${id}/reset`,'Annuler ?',"La mutation passera au statut 'Annulé'.",'Mutation annulée.');
    const handleDelete  = id => doAction(`mutations/${id}`,'Supprimer ?','Cette mutation sera supprimée.','Mutation supprimée.','delete');

    const handleExport = async () => {
        try { const r = await api.get('mutations/export',{responseType:'blob'}); const u=window.URL.createObjectURL(new Blob([r.data])); const a=document.createElement('a'); a.href=u; a.download=`mutations_${moment().format('YYYY-MM-DD')}.xlsx`; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(u); }
        catch { Swal.fire('Erreur',"Impossible d'exporter les mutations.",'error'); }
    };

    const bulkConfirm = async () => { const r=await Swal.fire({title:`Valider ${selectedIds.size} mutation(s) ?`,icon:'question',showCancelButton:true,confirmButtonText:'Valider',cancelButtonText:'Non'}); if(!r.isConfirmed)return; let ok=0; for(const mid of selectedIds){try{await api.patch(`mutations/${mid}/confirm`);ok++;}catch{}} Swal.fire({icon:'success',title:`${ok} mutations validées`,timer:2000,showConfirmButton:false}); setSelectedIds(new Set()); fetchMutations(); };
    const bulkReject  = async () => { const r=await Swal.fire({title:`Rejeter ${selectedIds.size} mutation(s) ?`,icon:'warning',showCancelButton:true,confirmButtonText:'Rejeter',cancelButtonText:'Non'}); if(!r.isConfirmed)return; let ok=0; for(const mid of selectedIds){try{await api.patch(`mutations/${mid}/reject`);ok++;}catch{}} Swal.fire({icon:'success',title:`${ok} mutations rejetées`,timer:2000,showConfirmButton:false}); setSelectedIds(new Set()); fetchMutations(); };

    const fmtDate  = d => d ? moment(d).format('DD/MM/YYYY') : '--';
    const fmtMonth = d => d ? moment(d).format('MM/YYYY') : '--';

    if (loadingData || !user) return <Loading loading={true} />;

    const cards = [
        { label:'Total',      value:kpi.total,     icon:'ri-shuffle-line',         color:CLR.primary },
        { label:'En attente', value:kpi.enAttente, icon:'ri-time-line',            color:CLR.warning,  filter:'En attente' },
        { label:'Validées',   value:kpi.valide,   icon:'ri-check-double-line',    color:CLR.success,  filter:'Validé' },
        { label:'Rejetées',   value:kpi.rejete,   icon:'ri-close-circle-line',    color:CLR.danger,   filter:'Rejeté' },
        { label:'Annulées',   value:kpi.annule,   icon:'ri-forbid-line',          color:CLR.secondary,filter:'Annulé' },
        { label:'Appliquées', value:kpi.applique, icon:'ri-checkbox-circle-line', color:CLR.info },
    ];

    return (
        <Layout>
            {/* HERO */}
            <div style={{background:'linear-gradient(135deg,#405189 0%,#2e3a5f 50%,#0ab39c 100%)',borderRadius:16,padding:'32px 36px',marginBottom:28,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)'}}/>
                <div style={{position:'relative',zIndex:1,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
                    <div>
                        <h2 style={{color:'#fff',margin:0,fontSize:24,fontWeight:700}}><i className="ri-shuffle-line" style={{marginRight:12}}></i>Gestion des mutations</h2>
                        <p style={{color:'rgba(255,255,255,.75)',margin:'6px 0 0',fontSize:14}}>Suivi et gestion des mutations d'employés entre services</p>
                    </div>
                    <div style={{display:'flex',gap:10}}>
                        <button onClick={handleExport} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'9px 18px',cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:6,backdropFilter:'blur(4px)'}}>
                            <i className="ri-file-excel-2-line"></i> Exporter
                        </button>
                        <Link to="/mutation/create" style={{background:'#fff',color:'#405189',borderRadius:10,padding:'9px 18px',fontWeight:600,fontSize:13,textDecoration:'none',display:'flex',alignItems:'center',gap:6,border:'none'}}>
                            <i className="ri-add-line"></i> Nouvelle mutation
                        </Link>
                    </div>
                </div>
            </div>

            <AlertMessages alert={alert} setAlert={setAlert} />

            {/* KPI CARDS */}
            <div className="row g-3 mb-4">
                {cards.map(c => { const act = filterStatus===c.filter; return (
                    <div key={c.label} className="col-6 col-md-4 col-xl-2">
                        <div onClick={()=>c.filter&&setFilterStatus(act?'':c.filter)} style={{
                            background:act?`${c.color}10`:'#fff', borderRadius:14, padding:'18px 16px',
                            boxShadow:act?`0 0 0 2px ${c.color}`:'0 2px 12px rgba(0,0,0,.06)',
                            cursor:c.filter?'pointer':'default', transition:'all .2s', display:'flex', alignItems:'center', gap:14,
                        }}>
                            <div style={{width:44,height:44,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${c.color}15`,color:c.color,fontSize:20}}>
                                <i className={c.icon}></i>
                            </div>
                            <div>
                                <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,color:'#878a99'}}>{c.label}</div>
                                <div style={{fontSize:22,fontWeight:700,color:c.color,lineHeight:1.1}}>{c.value}</div>
                            </div>
                        </div>
                    </div>
                ); })}
            </div>

            {/* FILTERS */}
            <div style={{background:'#fff',borderRadius:14,padding:'18px 22px',marginBottom:6,boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
                <div className="row g-3 align-items-end">
                    <div className="col-md-3">
                        <div style={{position:'relative'}}>
                            <i className="ri-search-line" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#878a99'}}></i>
                            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher"
                                style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px 8px 36px',fontSize:13,outline:'none'}}/>
                        </div>
                    </div>
                    <div className="col-md-2">
                        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13,outline:'none',background:'#fff'}}>
                            <option value="">Tous les statuts</option>
                            {Object.keys(STATUS_CFG).map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <select value={filterService} onChange={e=>setFilterService(e.target.value)} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13,outline:'none',background:'#fff'}}>
                            <option value="">Tous les services</option>
                            {services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <select value={filterApplied} onChange={e=>setFilterApplied(e.target.value)} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13,outline:'none',background:'#fff'}}>
                            <option value="">Appliquée ?</option>
                            <option value="1">Oui</option>
                            <option value="0">Non</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <input type="month" value={filterPeriode} onChange={e=>setFilterPeriode(e.target.value)} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13,outline:'none'}}/>
                    </div>
                    {hasActiveFilters && <div className="col-md-1">
                        <button onClick={clearFilters} style={{background:'#f0654812',color:'#f06548',border:'none',borderRadius:10,padding:'8px 14px',fontSize:13,cursor:'pointer',fontWeight:600}}>
                            <i className="ri-close-line"></i>
                        </button>
                    </div>}
                </div>
            </div>

            {/* BULK BAR */}
            {selectedIds.size > 0 && (
                <div style={{background:'#40518908',borderRadius:12,padding:'12px 20px',marginBottom:6,display:'flex',alignItems:'center',gap:12,border:'1.5px solid #40518925'}}>
                    <span style={{fontWeight:700,color:CLR.primary,fontSize:13}}><i className="ri-checkbox-multiple-line" style={{marginRight:6}}></i>{selectedIds.size} sélectionné(s)</span>
                    <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
                        <button onClick={bulkConfirm} style={{background:'#0ab39c15',color:CLR.success,border:'none',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer'}}><i className="ri-check-line" style={{marginRight:4}}></i>Valider</button>
                        <button onClick={bulkReject} style={{background:'#f0654815',color:CLR.danger,border:'none',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer'}}><i className="ri-close-circle-line" style={{marginRight:4}}></i>Rejeter</button>
                        <button onClick={()=>setSelectedIds(new Set())} style={{background:'#f3f3f9',color:'#878a99',border:'none',borderRadius:8,padding:'6px 12px',fontSize:12,cursor:'pointer'}}><i className="ri-close-line"></i></button>
                    </div>
                </div>
            )}

            {/* TABLE */}
            <div style={{background:'#fff',borderRadius:14,overflow:'hidden',marginTop:18,boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
                <div style={{padding:'16px 22px',borderBottom:'1px solid #f3f3f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontWeight:700,fontSize:15,color:'#495057'}}>
                        Liste des mutations
                        <span style={{marginLeft:10,background:'#40518912',color:CLR.primary,borderRadius:8,padding:'2px 10px',fontSize:12,fontWeight:700}}>{filtered.length}</span>
                    </div>
                </div>

                {paginated.length === 0 ? (
                    <div style={{textAlign:'center',padding:'60px 20px'}}>
                        <i className="ri-shuffle-line" style={{fontSize:56,color:'#e9ebec'}}></i>
                        <h5 style={{color:'#878a99',marginTop:16,fontWeight:600}}>Aucune mutation trouvée</h5>
                        <p style={{color:'#adb5bd',fontSize:13}}>{hasActiveFilters?'Essayez de modifier vos filtres.':'Aucune mutation à afficher.'}</p>
                        {hasActiveFilters && <button onClick={clearFilters} style={{background:CLR.primary,color:'#fff',border:'none',borderRadius:10,padding:'10px 24px',fontWeight:600,cursor:'pointer'}}><i className="ri-filter-off-line" style={{marginRight:6}}></i>Réinitialiser</button>}
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
                            <thead>
                                <tr>
                                    <th style={thS}><input type="checkbox" className="form-check-input" checked={paginated.length>0&&selectedIds.size===paginated.length} onChange={toggleSelectAll}/></th>
                                    <th style={thS}>#</th>
                                    <th style={thS}>Employé</th>
                                    <th style={thS}>Ancien service</th>
                                    <th style={thS}>Nouveau service</th>
                                    <th style={{...thS,textAlign:'center'}}>Période</th>
                                    <th style={{...thS,textAlign:'center'}}>Départ</th>
                                    <th style={{...thS,textAlign:'center'}}>Jours T.</th>
                                    <th style={{...thS,textAlign:'center'}}>Jours Abs.</th>
                                    <th style={{...thS,textAlign:'center'}}>Statut</th>
                                    <th style={{...thS,textAlign:'center'}}>Appliquée</th>
                                    <th style={{...thS,textAlign:'center'}}>Créé par</th>
                                    <th style={{...thS,textAlign:'center'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((m,idx)=>{
                                    const cfg=STATUS_CFG[m.status]||STATUS_CFG['En attente'];
                                    const isPending=m.status==='En attente';
                                    const sc=CLR[cfg.bg]||CLR.secondary;
                                    return (
                                        <tr key={m.id} style={{borderBottom:'1px solid #f3f3f9',background:selectedIds.has(m.id)?'#40518906':'transparent',transition:'background .15s'}}
                                            onMouseEnter={e=>{if(!selectedIds.has(m.id))e.currentTarget.style.background='#f8f9fa'}}
                                            onMouseLeave={e=>{if(!selectedIds.has(m.id))e.currentTarget.style.background='transparent'}}>
                                            <td style={tdS}><input type="checkbox" className="form-check-input" checked={selectedIds.has(m.id)} onChange={()=>toggleSelect(m.id)}/></td>
                                            <td style={{...tdS,fontWeight:600,color:'#878a99',fontSize:12}}>{(currentPage-1)*PER_PAGE+idx+1}</td>
                                            <td style={tdS}>
                                                <div style={{display:'flex',alignItems:'center',gap:10}}>
                                                    <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:'#40518912',color:CLR.primary,fontWeight:700,fontSize:12}}>
                                                        {(m.employer?.prenom?.[0]||'')+(m.employer?.nom?.[0]||'')}
                                                    </div>
                                                    <div>
                                                        <div style={{fontWeight:600,fontSize:13,color:'#495057'}}>{m.employer?.nom} {m.employer?.prenom}</div>
                                                        <div style={{fontSize:11,color:'#878a99'}}>{m.employer?.matricule}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdS}>
                                                <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'#f0654812',color:CLR.danger,borderRadius:8,padding:'3px 10px',fontSize:12,fontWeight:600}}>
                                                    <i className="ri-arrow-left-line" style={{fontSize:11}}></i>{m.serviceOld?.name||'--'}
                                                </span>
                                            </td>
                                            <td style={tdS}>
                                                <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'#0ab39c12',color:CLR.success,borderRadius:8,padding:'3px 10px',fontSize:12,fontWeight:600}}>
                                                    <i className="ri-arrow-right-line" style={{fontSize:11}}></i>{m.serviceNew?.name||'--'}
                                                </span>
                                            </td>
                                            <td style={{...tdS,textAlign:'center',fontSize:13}}>{fmtMonth(m.periode_at)}</td>
                                            <td style={{...tdS,textAlign:'center',fontSize:13}}>{fmtDate(m.depart_at)}</td>
                                            <td style={{...tdS,textAlign:'center',fontWeight:600}}>{m.nb_jours_job}</td>
                                            <td style={{...tdS,textAlign:'center',fontWeight:600}}>{m.nb_jour_abs}</td>
                                            <td style={{...tdS,textAlign:'center'}}>
                                                <span style={{display:'inline-flex',alignItems:'center',gap:4,background:`${sc}15`,color:sc,borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600}}>
                                                    <i className={cfg.icon} style={{fontSize:13}}></i>{cfg.label}
                                                </span>
                                            </td>
                                            <td style={{...tdS,textAlign:'center'}}>
                                                {m.is_apply
                                                    ? <span style={{display:'inline-flex',alignItems:'center',gap:3,background:'#299cdb12',color:CLR.info,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:600}}><i className="ri-checkbox-circle-fill" style={{fontSize:12}}></i>Oui</span>
                                                    : <span style={{color:'#adb5bd',fontSize:12}}>Non</span>
                                                }
                                            </td>
                                            <td style={{...tdS,textAlign:'center',fontSize:12,color:'#878a99'}}>{m.createdby?`${m.createdby.nom} ${m.createdby.prenom}`:'--'}</td>
                                            <td style={{...tdS,textAlign:'center'}}>
                                                <div style={{display:'flex',justifyContent:'center',gap:4}}>
                                                    <ActionBtn color={CLR.info} icon="ri-eye-line" title="Détails" onClick={()=>navigate(`/mutation/detail/${m.id}`)}/>
                                                    {isPending && <>
                                                        <ActionBtn color={CLR.primary} icon="ri-pencil-line" title="Modifier" onClick={()=>navigate(`/mutation/edit/${m.id}`)}/>
                                                        <ActionBtn color={CLR.success} icon="ri-check-double-line" title="Valider" onClick={()=>handleConfirm(m.id)}/>
                                                        <ActionBtn color={CLR.danger} icon="ri-close-circle-line" title="Rejeter" onClick={()=>handleReject(m.id)}/>
                                                        <ActionBtn color={CLR.secondary} icon="ri-forbid-line" title="Annuler" onClick={()=>handleCancel(m.id)}/>
                                                        <ActionBtn color={CLR.warning} icon="ri-delete-bin-line" title="Supprimer" onClick={()=>handleDelete(m.id)}/>
                                                    </>}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div style={{padding:'14px 22px',borderTop:'1px solid #f3f3f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:13,color:'#878a99'}}>{(currentPage-1)*PER_PAGE+1}\u2013{Math.min(currentPage*PER_PAGE,filtered.length)} sur {filtered.length}</span>
                        <div style={{display:'flex',gap:4}}>
                            <PgBtn disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}>{'\u2039'}</PgBtn>
                            {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
                                let pn;
                                if(totalPages<=7) pn=i+1;
                                else if(currentPage<=4) pn=i+1;
                                else if(currentPage>=totalPages-3) pn=totalPages-6+i;
                                else pn=currentPage-3+i;
                                return <PgBtn key={pn} active={currentPage===pn} onClick={()=>setCurrentPage(pn)}>{pn}</PgBtn>;
                            })}
                            <PgBtn disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)}>{'\u203a'}</PgBtn>
                        </div>
                    </div>
                )}
            </div>
            <br/>

            {/* Journal d'activité — Admin uniquement */}
            <ActivityLogPanel module="mutation" isAdmin={user?.is_admin || user?.is_superadmin} />
             <br/>
        </Layout>
    );
};

export default MutationPage;