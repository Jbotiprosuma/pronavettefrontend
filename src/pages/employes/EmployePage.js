import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../axios';
import { useNavigate, Link } from 'react-router-dom';
import Loading from '../../components/base/Loading';
import AlertMessages from '../../components/base/AlertMessages';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';
import ImportEmployerModal from '../../components/employes/ImportEmployerModal';
import Swal from 'sweetalert2';
import ActivityLogPanel from '../../components/base/ActivityLogPanel';
import moment from 'moment';

/* ---------- CONSTANTES ---------- */
const STATUS_BADGE = {
    'Activé':    { icon:'ri-checkbox-circle-line', color:'#0ab39c' },
    'Désactivé': { icon:'ri-close-circle-line',    color:'#f06548' },
};
const GENRE_ICON = { Homme:'ri-men-line', Femme:'ri-women-line' };
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
    <button onClick={disabled?undefined:onClick} disabled={disabled} style={{
        minWidth:34, height:34, borderRadius:8,
        border:active?'none':'1px solid #e9ebec',
        background:active?'#405189':'#fff',
        color:active?'#fff':disabled?'#ccc':'#495057',
        fontWeight:600, fontSize:13, cursor:disabled?'default':'pointer',
    }}>{children}</button>
);
const thS = { padding:'11px 14px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'#878a99', background:'#f8f9fa', borderBottom:'1.5px solid #e9ebec', whiteSpace:'nowrap' };
const tdS = { padding:'10px 14px', fontSize:13, color:'#495057', verticalAlign:'middle' };

/* ---------- COMPOSANT PRINCIPAL ---------- */
const EmployePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [employes, setEmployes] = useState([]);
    const [trashed, setTrashed] = useState([]);
    const [services, setServices] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [alert, setAlert] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [activeTab, setActiveTab] = useState('actifs');

    const [search, setSearch] = useState('');
    const [filterService, setFilterService] = useState('');
    const [filterGenre, setFilterGenre] = useState('');
    const [filterCadre, setFilterCadre] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    /* -- FETCH -- */
    const fetchEmployes = useCallback(async () => {
        try {
            const [empRes, srvRes] = await Promise.all([api.get('employes'), api.get('services')]);
            setEmployes(empRes.data.data || []);
            setServices(srvRes.data.data || srvRes.data || []);
        } catch { setAlert({ type:'danger', message:'Erreur lors du chargement des employés.' }); }
        finally { setLoadingData(false); }
    }, []);
    const fetchTrashed = useCallback(async () => {
        try { const r = await api.get('employes/trash'); setTrashed(r.data.data || []); }
        catch { setAlert({ type:'danger', message:'Erreur lors du chargement de la corbeille.' }); }
    }, []);

    useEffect(() => { fetchEmployes(); fetchTrashed(); }, [fetchEmployes, fetchTrashed]);
    useEffect(() => { if (activeTab==='corbeille') fetchTrashed(); }, [activeTab, fetchTrashed]);

    /* -- FILTRAGE -- */
    const currentList = activeTab==='actifs' ? employes : trashed;
    const filtered = useMemo(() => {
        return currentList.filter(emp => {
            if (search) { const s=search.toLowerCase(); const h=[emp.matricule,emp.nom,emp.prenom,emp.email,emp.poste_occupe,emp.service?.name].filter(Boolean).join(' ').toLowerCase(); if(!h.includes(s)) return false; }
            if (filterService && String(emp.service_id)!==filterService) return false;
            if (filterGenre && emp.genre!==filterGenre) return false;
            if (filterCadre!=='' && String(emp.is_cadre)!==filterCadre) return false;
            if (filterStatus && emp.status!==filterStatus) return false;
            return true;
        });
    }, [currentList, search, filterService, filterGenre, filterCadre, filterStatus]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paged = filtered.slice((currentPage-1)*pageSize, currentPage*pageSize);
    useEffect(() => { setCurrentPage(1); }, [search, filterService, filterGenre, filterCadre, filterStatus, activeTab]);
    useEffect(() => { setSelectedIds(new Set()); setSelectAll(false); }, [activeTab]);

    /* -- S\u00c9LECTION -- */
    const handleToggleSelect = id => { setSelectedIds(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; }); };
    const handleSelectAll = () => { if(selectAll){setSelectedIds(new Set());}else{setSelectedIds(new Set(filtered.map(e=>e.id)));} setSelectAll(!selectAll); };

    /* -- ACTIONS -- */
    const handleDelete = async slug => {
        const r = await Swal.fire({ title:'Supprimer cet employé ?', text:'Il sera placé dans la corbeille.', icon:'warning', showCancelButton:true, confirmButtonColor:'#405189', cancelButtonColor:'#d33', confirmButtonText:'Oui, supprimer', cancelButtonText:'Annuler' });
        if(!r.isConfirmed)return;
        try { await api.delete(`employes/${slug}`); Swal.fire({icon:'success',title:'Supprimé !',timer:1500,showConfirmButton:false}); fetchEmployes(); }
        catch(e) { Swal.fire({icon:'error',title:'Erreur',text:e.response?.data?.message||'Erreur'}); }
    };
    const handleBulkDelete = async () => {
        if(!selectedIds.size)return;
        const r = await Swal.fire({ title:`Supprimer ${selectedIds.size} employé(s) ?`, text:'Ils seront placés dans la corbeille.', icon:'warning', showCancelButton:true, confirmButtonColor:'#405189', cancelButtonColor:'#d33', confirmButtonText:'Oui, supprimer', cancelButtonText:'Annuler' });
        if(!r.isConfirmed)return;
        try { await api.post('employes/bulk-delete',{ids:[...selectedIds]}); Swal.fire({icon:'success',title:'Supprimés !',timer:1500,showConfirmButton:false}); setSelectedIds(new Set()); setSelectAll(false); fetchEmployes(); }
        catch(e) { Swal.fire({icon:'error',title:'Erreur',text:e.response?.data?.message||'Erreur'}); }
    };
    const handleRestore = async id => {
        try { await api.post(`employes/${id}/restore`); Swal.fire({icon:'success',title:'Restauré !',timer:1500,showConfirmButton:false}); fetchTrashed(); fetchEmployes(); }
        catch(e) { Swal.fire({icon:'error',title:'Erreur',text:e.response?.data?.message||'Erreur'}); }
    };
    const handleBulkRestore = async () => {
        if(!selectedIds.size)return;
        try { await api.post('employes/bulk-restore',{ids:[...selectedIds]}); Swal.fire({icon:'success',title:'Restaurés !',timer:1500,showConfirmButton:false}); setSelectedIds(new Set()); setSelectAll(false); fetchTrashed(); fetchEmployes(); }
        catch(e) { Swal.fire({icon:'error',title:'Erreur',text:e.response?.data?.message||'Erreur'}); }
    };
    const handleToggleStatus = async slug => {
        try { await api.patch(`employes/${slug}/toggle-status`); Swal.fire({icon:'success',title:'Statut mis à jour !',timer:1500,showConfirmButton:false}); fetchEmployes(); }
        catch(e) { Swal.fire({icon:'error',title:'Erreur',text:e.response?.data?.message||'Erreur'}); }
    };
    const handleExport = async () => {
        try { const r=await api.get('employes/export',{responseType:'blob'}); const u=window.URL.createObjectURL(new Blob([r.data])); const a=document.createElement('a'); a.href=u; a.setAttribute('download',`employes_${new Date().toISOString().slice(0,10)}.xlsx`); document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(u); }
        catch { setAlert({type:'danger',message:"Erreur lors de l'export."}); }
    };
    const handleImportSubmit = async file => {
        const fd = new FormData(); fd.append('file',file);
        try {
            const r = await api.post('employes/import',fd,{headers:{'Content-Type':'multipart/form-data'}});
            let msg = r.data.message+(r.data.summary?` \u2022 ${r.data.summary}`:'');
            if(r.data.details?.length){
                const errs=r.data.details.filter(d=>d.type==='erreur'); const warns=r.data.details.filter(d=>d.type==='avertissement');
                if(errs.length){ const l=errs.slice(0,5).map(e=>`\u2022 [${e.matricule||'?'}] ${e.message}`).join('\n'); msg+=`\n\nLignes ignorées :\n${l}${errs.length>5?`\n... et ${errs.length-5} autre(s)`:''}`; }
                if(warns.length){ const l=warns.slice(0,5).map(w=>`\u2022 [${w.matricule||'?'}] ${w.message}`).join('\n'); msg+=`\n\nAvertissements :\n${l}${warns.length>5?`\n... et ${warns.length-5} autre(s)`:''}`; }
            }
            setAlert({type:'success',message:msg}); fetchEmployes();
        } catch(e) { setAlert({type:'danger',message:e.response?.data?.message||"Erreur lors de l'import."}); throw e; }
    };

    const clearFilters = () => { setSearch(''); setFilterService(''); setFilterGenre(''); setFilterCadre(''); setFilterStatus(''); };
    const hasActiveFilters = search||filterService||filterGenre||filterCadre!==''||filterStatus;

    if (loadingData || !user) return <Loading loading={true} />;

    const kpiCards = [
        { label:'Total actifs', value:employes.length, icon:'ri-team-line', color:CLR.primary },
        { label:'Hommes', value:employes.filter(e=>e.genre==='Homme').length, icon:'ri-men-line', color:CLR.info },
        { label:'Femmes', value:employes.filter(e=>e.genre==='Femme').length, icon:'ri-women-line', color:CLR.danger },
        { label:'Corbeille', value:trashed.length, icon:'ri-delete-bin-line', color:CLR.warning, onClick:()=>{setActiveTab('corbeille');fetchTrashed();} },
    ];

    return (
        <>
        <Layout>
            {/* HERO */}
            <div style={{background:'linear-gradient(135deg,#405189 0%,#2e3a5f 50%,#0ab39c 100%)',borderRadius:16,padding:'32px 36px',marginBottom:28,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)'}}/>
                <div style={{position:'relative',zIndex:1,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
                    <div>
                        <h2 style={{color:'#fff',margin:0,fontSize:24,fontWeight:700}}><i className="ri-team-line" style={{marginRight:12}}></i>Gestion des employés</h2>
                        <p style={{color:'rgba(255,255,255,.75)',margin:'6px 0 0',fontSize:14}}>Gestion complète de vos effectifs</p>
                    </div>
                    <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                        {activeTab==='actifs' && <>
                            <button onClick={()=>{const b=process.env.REACT_APP_API_URL||'http://localhost:4000/api/';const t=localStorage.getItem('token');window.open(`${b}navettes/template-employes?token=${t}`,'_blank');}} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'9px 18px',cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                                <i className="ri-download-2-line"></i> Template
                            </button>
                            <button onClick={handleExport} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'9px 18px',cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                                <i className="ri-file-excel-2-line"></i> Exporter
                            </button>
                            <button onClick={()=>setShowImportModal(true)} style={{background:'rgba(255,255,255,.25)',border:'1px solid rgba(255,255,255,.3)',color:'#fff',borderRadius:10,padding:'9px 18px',cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                                <i className="ri-upload-2-line"></i> Importer
                            </button>
                            <button onClick={()=>navigate('/employes/create')} style={{background:'#fff',color:'#405189',borderRadius:10,padding:'9px 18px',fontWeight:600,fontSize:13,border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                                <i className="ri-add-line"></i> Nouvel employé
                            </button>
                        </>}
                    </div>
                </div>
            </div>

            <AlertMessages alert={alert} setAlert={setAlert} />

            {/* KPI CARDS */}
            <div className="row g-3 mb-4">
                {kpiCards.map((c,i)=>(
                    <div key={i} className="col-6 col-md-3">
                        <div onClick={c.onClick} style={{
                            background:'#fff', borderRadius:14, padding:'18px 16px',
                            boxShadow:'0 2px 12px rgba(0,0,0,.06)', cursor:c.onClick?'pointer':'default',
                            transition:'all .2s', display:'flex', alignItems:'center', gap:14,
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
                ))}
            </div>

            {/* TABS + FILTERS + TABLE CARD */}
            <div style={{background:'#fff',borderRadius:14,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>

                {/* Tab bar */}
                <div style={{padding:'0 22px',borderBottom:'1px solid #f3f3f9',display:'flex',alignItems:'center',gap:0}}>
                    {[
                        {key:'actifs',label:'Actifs',icon:'ri-team-line',count:employes.length,color:CLR.success},
                        {key:'corbeille',label:'Corbeille',icon:'ri-delete-bin-line',count:trashed.length,color:CLR.danger},
                    ].map(tab=>(
                        <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{
                            padding:'14px 20px', background:'none', border:'none', borderBottom:activeTab===tab.key?`2.5px solid ${CLR.primary}`:'2.5px solid transparent',
                            color:activeTab===tab.key?CLR.primary:'#878a99', fontWeight:600, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all .2s',
                        }}>
                            <i className={tab.icon}></i>{tab.label}
                            <span style={{background:activeTab===tab.key?`${tab.color}15`:'#f3f3f9',color:activeTab===tab.key?tab.color:'#878a99',borderRadius:8,padding:'1px 8px',fontSize:11,fontWeight:700}}>{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Search + Filter toggle + Bulk */}
                <div style={{padding:'18px 22px',borderBottom:'1px solid #f3f3f9'}}>
                    <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
                        <div style={{position:'relative',flex:'1 1 280px',maxWidth:360}}>
                            <i className="ri-search-line" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#878a99'}}></i>
                            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher (nom, matricule, email, fonction)"
                                style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px 8px 36px',fontSize:13,outline:'none'}}/>
                        </div>
                        <button onClick={()=>setShowFilters(!showFilters)} style={{
                            background:showFilters?`${CLR.primary}12`:'#f3f3f9', color:showFilters?CLR.primary:'#878a99',
                            border:'none', borderRadius:10, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer',
                            display:'flex', alignItems:'center', gap:6,
                        }}>
                            <i className="ri-filter-3-line"></i>Filtres
                            {hasActiveFilters && <span style={{width:8,height:8,borderRadius:'50%',background:CLR.warning}}></span>}
                        </button>
                        {hasActiveFilters && <button onClick={clearFilters} style={{background:`${CLR.danger}12`,color:CLR.danger,border:'none',borderRadius:10,padding:'8px 14px',fontSize:13,cursor:'pointer',fontWeight:600}}>
                            <i className="ri-close-line" style={{marginRight:4}}></i>Réinitialiser
                        </button>}

                        {selectedIds.size>0 && (
                            <div style={{display:'flex',gap:8,alignItems:'center',borderLeft:'2px solid #e9ebec',paddingLeft:16,marginLeft:'auto'}}>
                                <span style={{fontWeight:700,color:CLR.primary,fontSize:13}}>{selectedIds.size} sélectionné(s)</span>
                                {activeTab==='actifs'
                                    ? <button onClick={handleBulkDelete} style={{background:`${CLR.danger}12`,color:CLR.danger,border:'none',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer'}}><i className="ri-delete-bin-line" style={{marginRight:4}}></i>Supprimer</button>
                                    : <button onClick={handleBulkRestore} style={{background:`${CLR.success}12`,color:CLR.success,border:'none',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer'}}><i className="ri-refresh-line" style={{marginRight:4}}></i>Restaurer</button>
                                }
                            </div>
                        )}
                    </div>

                    {/* Advanced filters panel */}
                    {showFilters && (
                        <div className="row g-3" style={{marginTop:12,padding:16,background:'#f8f9fa',borderRadius:12}}>
                            <div className="col-md-3">
                                <label style={{fontSize:11,fontWeight:600,textTransform:'uppercase',color:'#878a99',marginBottom:4,display:'block'}}>Service</label>
                                <select value={filterService} onChange={e=>setFilterService(e.target.value)} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13,background:'#fff'}}>
                                    <option value="">Tous les services</option>
                                    {services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label style={{fontSize:11,fontWeight:600,textTransform:'uppercase',color:'#878a99',marginBottom:4,display:'block'}}>Genre</label>
                                <select value={filterGenre} onChange={e=>setFilterGenre(e.target.value)} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13,background:'#fff'}}>
                                    <option value="">Tous</option>
                                    <option value="Homme">Homme</option>
                                    <option value="Femme">Femme</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label style={{fontSize:11,fontWeight:600,textTransform:'uppercase',color:'#878a99',marginBottom:4,display:'block'}}>Cadre</label>
                                <select value={filterCadre} onChange={e=>setFilterCadre(e.target.value)} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13,background:'#fff'}}>
                                    <option value="">Tous</option>
                                    <option value="true">Cadre</option>
                                    <option value="false">Non cadre</option>
                                </select>
                            </div>
                            {activeTab==='actifs' && <div className="col-md-2">
                                <label style={{fontSize:11,fontWeight:600,textTransform:'uppercase',color:'#878a99',marginBottom:4,display:'block'}}>Statut</label>
                                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13,background:'#fff'}}>
                                    <option value="">Tous</option>
                                    <option value="Activé">Activé</option>
                                    <option value="Désactivé">Désactivé</option>
                                </select>
                            </div>}
                            <div className="col-md-3 d-flex align-items-end">
                                <span style={{fontSize:12,color:'#878a99'}}><i className="ri-information-line" style={{marginRight:4}}></i>{filtered.length} résultat{filtered.length!==1?'s':''}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* TABLE */}
                {paged.length===0 ? (
                    <div style={{textAlign:'center',padding:'60px 20px'}}>
                        <i className={activeTab==='corbeille'?'ri-delete-bin-line':'ri-team-line'} style={{fontSize:56,color:'#e9ebec'}}></i>
                        <h5 style={{color:'#878a99',marginTop:16,fontWeight:600}}>{activeTab==='corbeille'?'La corbeille est vide':'Aucun employé trouvé'}</h5>
                        <p style={{color:'#adb5bd',fontSize:13}}>{hasActiveFilters?'Essayez de modifier vos filtres.':'Aucun employé à afficher.'}</p>
                        {hasActiveFilters && <button onClick={clearFilters} style={{background:CLR.primary,color:'#fff',border:'none',borderRadius:10,padding:'10px 24px',fontWeight:600,cursor:'pointer'}}><i className="ri-filter-off-line" style={{marginRight:6}}></i>Réinitialiser</button>}
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
                            <thead>
                                <tr>
                                    <th style={{...thS,width:40}}><input type="checkbox" className="form-check-input" checked={selectAll&&filtered.length>0} onChange={handleSelectAll}/></th>
                                    <th style={{...thS,width:50}}>#</th>
                                    <th style={thS}>Employé</th>
                                    <th style={thS}>Matricule</th>
                                    <th style={thS}>Fonction</th>
                                    <th style={thS}>Service</th>
                                    <th style={thS}>Genre</th>
                                    <th style={thS}>Cadre</th>
                                    <th style={thS}>{activeTab==='actifs'?'Statut':'Supprimé le'}</th>
                                    <th style={{...thS,width:160}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((emp,idx)=>{
                                    const stB = STATUS_BADGE[emp.status]||STATUS_BADGE['Activé'];
                                    return (
                                        <tr key={emp.id} style={{borderBottom:'1px solid #f3f3f9',background:selectedIds.has(emp.id)?'#40518906':'transparent',transition:'background .15s'}}
                                            onMouseEnter={e=>{if(!selectedIds.has(emp.id))e.currentTarget.style.background='#f8f9fa'}}
                                            onMouseLeave={e=>{if(!selectedIds.has(emp.id))e.currentTarget.style.background='transparent'}}>
                                            <td style={tdS}><input type="checkbox" className="form-check-input" checked={selectedIds.has(emp.id)} onChange={()=>handleToggleSelect(emp.id)}/></td>
                                            <td style={{...tdS,fontWeight:600,color:'#878a99',fontSize:12}}>{(currentPage-1)*pageSize+idx+1}</td>
                                            <td style={tdS}>
                                                <div style={{display:'flex',alignItems:'center',gap:10}}>
                                                    <img src={emp.avatar_url} alt="" style={{width:36,height:36,borderRadius:10,objectFit:'cover'}}/>
                                                    <div>
                                                        <Link to={`/employes/detail/${emp.slug}`} style={{fontWeight:600,fontSize:13,color:'#495057',textDecoration:'none'}}>{emp.nom} {emp.prenom}</Link>
                                                        {emp.email && <div style={{fontSize:11,color:'#878a99'}}>{emp.email}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdS}><span style={{background:'#878a9912',color:'#878a99',borderRadius:8,padding:'3px 10px',fontSize:12,fontWeight:600}}>{emp.matricule}</span></td>
                                            <td style={{...tdS,fontSize:13}}>{emp.poste_occupe||<span style={{color:'#adb5bd'}}>--</span>}</td>
                                            <td style={tdS}>{emp.service?.name ? <span style={{background:`${CLR.info}12`,color:CLR.info,borderRadius:8,padding:'3px 10px',fontSize:12,fontWeight:600}}>{emp.service.name}</span> : <span style={{color:'#adb5bd'}}>--</span>}</td>
                                            <td style={tdS}>{emp.genre ? <span><i className={GENRE_ICON[emp.genre]||''} style={{marginRight:4}}></i>{emp.genre}</span> : '--'}</td>
                                            <td style={tdS}>{emp.is_cadre
                                                ? <span style={{background:`${CLR.primary}12`,color:CLR.primary,borderRadius:8,padding:'3px 10px',fontSize:12,fontWeight:600}}>Cadre</span>
                                                : <span style={{color:'#adb5bd',fontSize:12}}>Non cadre</span>
                                            }</td>
                                            {activeTab==='actifs' ? (
                                                <td style={tdS}>
                                                    <span style={{display:'inline-flex',alignItems:'center',gap:4,background:`${stB.color}15`,color:stB.color,borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600}}>
                                                        <i className={stB.icon} style={{fontSize:13}}></i>{emp.status}
                                                    </span>
                                                </td>
                                            ) : (
                                                <td style={{...tdS,fontSize:12,color:'#878a99'}}>{emp.deleted_at?moment(emp.deleted_at).format('DD/MM/YYYY HH:mm'):'--'}</td>
                                            )}
                                            <td style={tdS}>
                                                {activeTab==='actifs' ? (
                                                    <div style={{display:'flex',gap:4}}>
                                                        <ActionBtn color={CLR.info} icon="ri-eye-line" title="Détails" onClick={()=>navigate(`/employes/detail/${emp.slug}`)}/>
                                                        <ActionBtn color={CLR.primary} icon="ri-pencil-line" title="Modifier" onClick={()=>navigate(`/employes/edit/${emp.slug}`)}/>
                                                        <ActionBtn color={CLR.warning} icon={`ri-${emp.status==='Activé'?'eye-off-line':'eye-line'}`} title="Changer statut" onClick={()=>handleToggleStatus(emp.slug)}/>
                                                        <ActionBtn color={CLR.danger} icon="ri-delete-bin-line" title="Supprimer" onClick={()=>handleDelete(emp.slug)}/>
                                                    </div>
                                                ) : (
                                                    <button onClick={()=>handleRestore(emp.id)} style={{background:`${CLR.success}12`,color:CLR.success,border:'none',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                                                        <i className="ri-refresh-line"></i> Restaurer
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION */}
                {totalPages>1 && (
                    <div style={{padding:'14px 22px',borderTop:'1px solid #f3f3f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:13,color:'#878a99'}}>{filtered.length} résultat{filtered.length!==1?'s':''} -- Page {currentPage}/{totalPages}</span>
                        <div style={{display:'flex',gap:4}}>
                            <PgBtn disabled={currentPage===1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))}>{'\u2039'}</PgBtn>
                            {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
                                let pg;
                                if(totalPages<=5) pg=i+1;
                                else if(currentPage<=3) pg=i+1;
                                else if(currentPage>=totalPages-2) pg=totalPages-4+i;
                                else pg=currentPage-2+i;
                                return <PgBtn key={pg} active={pg===currentPage} onClick={()=>setCurrentPage(pg)}>{pg}</PgBtn>;
                            })}
                            <PgBtn disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}>{'\u203a'}</PgBtn>
                        </div>
                    </div>
                )}
            </div>

            {/* Journal d'activité — Admin uniquement */}
            <ActivityLogPanel module="employe" isAdmin={user?.is_admin || user?.is_superadmin} />
            <br/>
        </Layout>

        <ImportEmployerModal show={showImportModal} onClose={()=>setShowImportModal(false)} onImportSubmit={handleImportSubmit} alert={setAlert} />
        </>
    );
};

export default EmployePage;