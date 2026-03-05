import React, { useState, useEffect, useMemo } from 'react';
import api from '../../axios';
import Layout from '../../components/base/Layout';
import Loading from '../../components/base/Loading';
import AlertMessages from '../../components/base/AlertMessages';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const CLR = { primary:'#405189', success:'#0ab39c', warning:'#f7b84b', danger:'#f06548', info:'#299cdb', secondary:'#878a99' };
const thS = { padding:'11px 14px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'#878a99', background:'#f8f9fa', borderBottom:'1.5px solid #e9ebec', whiteSpace:'nowrap' };
const tdS = { padding:'10px 14px', fontSize:13, color:'#495057', verticalAlign:'middle' };
const ActionBtn = ({ color, icon, title, onClick }) => (
    <button onClick={onClick} title={title} style={{ width:30, height:30, borderRadius:8, border:'none', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', background:`${color}12`, color, fontSize:15, transition:'all .15s' }}><i className={icon}></i></button>
);

const PgBtn = ({ children, active, disabled, onClick }) => (
    <button onClick={disabled?undefined:onClick} disabled={disabled} style={{
        minWidth:34, height:34, borderRadius:8, border:active?'none':'1px solid #e9ebec',
        background:active?'#405189':'#fff', color:active?'#fff':disabled?'#ccc':'#495057',
        fontWeight:600, fontSize:13, cursor:disabled?'default':'pointer',
    }}>{children}</button>
);

const ServiceManagementPage = () => {
    const { user } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);
    const [mode, setMode] = useState('list');
    const [currentService, setCurrentService] = useState(null);
    const [formData, setFormData] = useState({ name:'', description:'' });
    const canManage = user?.role==='superadmin' || user?.role==='admin';

    /* Filtres & pagination */
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    const fetchServices = async () => {
        setLoading(true);
        try { const r = await api.get('/services'); setServices(r.data.data||[]); }
        catch { setAlert({type:'danger',message:'Impossible de charger les services.'}); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchServices(); }, []);

    /* Filtrage & Pagination */
    const filtered = useMemo(() => {
        if (!search) return services;
        const q = search.toLowerCase();
        return services.filter(s =>
            (s.name || '').toLowerCase().includes(q)
            || (s.description || '').toLowerCase().includes(q)
        );
    }, [services, search]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    useEffect(() => setCurrentPage(1), [search]);

    const hasActiveFilters = !!search;
    const clearFilters = () => { setSearch(''); };

    useEffect(() => {
        if(currentService) setFormData({ name:currentService.name||'', description:currentService.description||'' });
        else setFormData({ name:'', description:'' });
    }, [currentService]);

    const handleSave = async e => {
        e.preventDefault();
        setSaving(true);
        try {
            if(currentService?.slug) {
                await api.put(`/services/${currentService.slug}`, { ...formData, slug:currentService.slug });
                setAlert({type:'success',message:'Service mis à jour avec succès !'});
            } else {
                await api.post('/services', formData);
                setAlert({type:'success',message:'Service créé avec succès !'});
            }
            setMode('list'); setCurrentService(null); await fetchServices();
        } catch(err) {
            setAlert({type:'danger',message:err.response?.data?.message||"Erreur lors de l'enregistrement."});
        } finally { setSaving(false); }
    };

    const handleDelete = slug => {
        Swal.fire({ title:'Supprimer ce service ?', text:'Cette action est irréversible.', icon:'warning', showCancelButton:true, confirmButtonColor:CLR.danger, cancelButtonColor:CLR.primary, confirmButtonText:'Supprimer', cancelButtonText:'Annuler' }).then(async r => {
            if(!r.isConfirmed) return;
            try { await api.delete(`/services/${slug}`); setAlert({type:'success',message:'Service supprimé.'}); Swal.fire('Supprimé','Le service a été supprimé.','success'); await fetchServices(); }
            catch(err) { setAlert({type:'danger',message:err.response?.data?.message||'Impossible de supprimer.'}); Swal.fire('Erreur','Impossible de supprimer.','error'); }
        });
    };

    if(!user) return <Loading loading={true}/>;

    const inputStyle = { width:'100%', border:'1.5px solid #e9ebec', borderRadius:10, padding:'10px 14px', fontSize:14, outline:'none', transition:'border .2s' };

    return (
        <Layout>
            {/* HERO */}
            <div style={{background:'linear-gradient(135deg,#405189 0%,#2e3a5f 50%,#0ab39c 100%)',borderRadius:16,padding:'32px 36px',marginBottom:28,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)'}}/>
                <div style={{position:'relative',zIndex:1,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
                    <div>
                        {mode!=='list' && (
                            <button onClick={()=>{setMode('list');setCurrentService(null);}} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontWeight:600,fontSize:13,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                                <i className="ri-arrow-left-line"></i> Retour
                            </button>
                        )}
                        <h2 style={{color:'#fff',margin:0,fontSize:24,fontWeight:700}}>
                            <i className="ri-building-2-line" style={{marginRight:12}}></i>
                            {mode==='list'?'Gestion des services':mode==='create'?'Nouveau service':'Modifier le service'}
                        </h2>
                        <p style={{color:'rgba(255,255,255,.75)',margin:'6px 0 0',fontSize:14}}>
                            {mode==='list'?`${services.length} service${services.length>1?'s':''} enregistré${services.length>1?'s':''}`:'Remplissez le formulaire ci-dessous'}
                        </p>
                    </div>
                    {mode==='list'&&canManage && (
                        <button onClick={()=>{setCurrentService(null);setMode('create');}} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'9px 18px',cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                            <i className="ri-add-line"></i> Nouveau service
                        </button>
                    )}
                </div>
            </div>

            <AlertMessages alert={alert} setAlert={setAlert} />

            {/* KPI */}
            {mode==='list' && (
                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <div style={{background:'#fff',borderRadius:14,padding:'16px 18px',boxShadow:'0 2px 12px rgba(0,0,0,.06)',display:'flex',alignItems:'center',gap:14}}>
                            <div style={{width:44,height:44,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${CLR.primary}15`,color:CLR.primary,fontSize:18}}>
                                <i className="ri-building-2-line"></i>
                            </div>
                            <div>
                                <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',color:'#878a99'}}>Total services</div>
                                <div style={{fontSize:22,fontWeight:700,color:'#495057'}}>{services.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TABLE */}
            {mode==='list' && (
                <div style={{background:'#fff',borderRadius:14,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
                    <div style={{padding:'16px 22px',borderBottom:'1px solid #f3f3f9',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
                        <div style={{fontWeight:700,fontSize:15,color:'#495057'}}>
                            <i className="ri-list-check" style={{marginRight:8}}></i>Liste des services
                            <span style={{marginLeft:10,background:'#40518912',color:CLR.primary,borderRadius:8,padding:'2px 10px',fontSize:12,fontWeight:700}}>{filtered.length}</span>
                        </div>
                        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                            <div style={{position:'relative',minWidth:220}}>
                                <i className="ri-search-line" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#878a99'}}></i>
                                <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un service..."
                                    style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px 8px 36px',fontSize:13,outline:'none'}}/>
                            </div>
                            {hasActiveFilters && <button onClick={clearFilters} style={{background:`${CLR.danger}12`,color:CLR.danger,border:'none',borderRadius:10,padding:'8px 14px',fontSize:13,cursor:'pointer',fontWeight:600}}>
                                <i className="ri-close-line" style={{marginRight:4}}></i>Réinitialiser
                            </button>}
                        </div>
                    </div>
                    {loading ? (
                        <div style={{textAlign:'center',padding:60}}><div className="spinner-border text-primary"></div></div>
                    ) : paged.length===0 ? (
                        <div style={{textAlign:'center',padding:'60px 20px'}}>
                            <i className="ri-building-2-line" style={{fontSize:56,color:'#e9ebec'}}></i>
                            <h5 style={{color:'#878a99',marginTop:16,fontWeight:600}}>Aucun service trouvé</h5>
                            <p style={{color:'#adb5bd',fontSize:13}}>{hasActiveFilters?'Essayez de modifier votre recherche.':'Aucun service enregistré.'}</p>
                            {hasActiveFilters && <button onClick={clearFilters} style={{background:CLR.primary,color:'#fff',border:'none',borderRadius:10,padding:'10px 24px',fontWeight:600,cursor:'pointer'}}><i className="ri-filter-off-line" style={{marginRight:6}}></i>Réinitialiser</button>}
                            {!hasActiveFilters && canManage && <button onClick={()=>{setCurrentService(null);setMode('create');}} style={{background:CLR.primary,color:'#fff',border:'none',borderRadius:10,padding:'9px 18px',cursor:'pointer',fontWeight:600,fontSize:13,marginTop:8}}>
                                <i className="ri-add-line" style={{marginRight:6}}></i>Créer un service
                            </button>}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
                                <thead><tr>
                                    <th style={{...thS,width:60,textAlign:'center'}}>#</th>
                                    <th style={thS}>Nom</th>
                                    <th style={thS}>Description</th>
                                    <th style={thS}>Date de création</th>
                                    {canManage && <th style={{...thS,textAlign:'center',width:100}}>Actions</th>}
                                </tr></thead>
                                <tbody>
                                    {paged.map((s,idx)=>(
                                        <tr key={s.id} style={{borderBottom:'1px solid #f3f3f9',transition:'background .15s'}}
                                            onMouseEnter={e=>e.currentTarget.style.background='#f8f9fa'}
                                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                            <td style={{...tdS,textAlign:'center',fontWeight:700,color:CLR.primary}}>{(currentPage-1)*pageSize+idx+1}</td>
                                            <td style={tdS}>
                                                <div style={{display:'flex',alignItems:'center',gap:10}}>
                                                    <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${CLR.primary}12`,color:CLR.primary,fontWeight:700,fontSize:14}}>
                                                        {s.name?.[0]?.toUpperCase()||'S'}
                                                    </div>
                                                    <span style={{fontWeight:600}}>{s.name}</span>
                                                </div>
                                            </td>
                                            <td style={{...tdS,color:'#878a99',maxWidth:300}}>{s.description||'-'}</td>
                                            <td style={tdS}>{new Date(s.createdAt).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}</td>
                                            {canManage && (
                                                <td style={{...tdS,textAlign:'center'}}>
                                                    <div style={{display:'flex',gap:6,justifyContent:'center'}}>
                                                        <ActionBtn color={CLR.info} icon="ri-pencil-line" title="Modifier" onClick={()=>{setCurrentService(s);setMode('edit');}}/>
                                                        <ActionBtn color={CLR.danger} icon="ri-delete-bin-line" title="Supprimer" onClick={()=>handleDelete(s.slug)}/>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* PAGINATION */}
                    {totalPages > 1 && (
                        <div style={{padding:'14px 22px',borderTop:'1px solid #f3f3f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:13,color:'#878a99'}}>{filtered.length} résultat{filtered.length!==1?'s':''} — Page {currentPage}/{totalPages}</span>
                            <div style={{display:'flex',gap:4}}>
                                <PgBtn disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}>{'\u2039'}</PgBtn>
                                {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
                                    let pg;
                                    if(totalPages<=5) pg=i+1;
                                    else if(currentPage<=3) pg=i+1;
                                    else if(currentPage>=totalPages-2) pg=totalPages-4+i;
                                    else pg=currentPage-2+i;
                                    return <PgBtn key={pg} active={pg===currentPage} onClick={()=>setCurrentPage(pg)}>{pg}</PgBtn>;
                                })}
                                <PgBtn disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)}>{'\u203a'}</PgBtn>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* FORM */}
            {(mode==='create'||mode==='edit') && (
                <div style={{background:'#fff',borderRadius:14,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
                    <div style={{padding:'16px 22px',borderBottom:'1px solid #f3f3f9',fontWeight:700,fontSize:15,color:'#495057'}}>
                        <i className={mode==='create'?'ri-add-circle-line':'ri-pencil-line'} style={{marginRight:8}}></i>
                        {mode==='create'?'Créer un nouveau service':'Modifier le service'}
                    </div>
                    <div style={{padding:22}}>
                        <form onSubmit={handleSave}>
                            <div style={{marginBottom:20}}>
                                <label style={{fontSize:12,fontWeight:600,color:'#495057',marginBottom:6,display:'block'}}>Nom du service <span style={{color:CLR.danger}}>*</span></label>
                                <input type="text" value={formData.name} onChange={e=>setFormData(p=>({...p,name:e.target.value}))} required
                                    style={inputStyle} onFocus={e=>e.target.style.borderColor=CLR.primary} onBlur={e=>e.target.style.borderColor='#e9ebec'}/>
                            </div>
                            <div style={{marginBottom:24}}>
                                <label style={{fontSize:12,fontWeight:600,color:'#495057',marginBottom:6,display:'block'}}>Description</label>
                                <textarea value={formData.description} onChange={e=>setFormData(p=>({...p,description:e.target.value}))} rows={3}
                                    style={{...inputStyle,resize:'vertical'}} onFocus={e=>e.target.style.borderColor=CLR.primary} onBlur={e=>e.target.style.borderColor='#e9ebec'}/>
                            </div>
                            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                                <button type="button" onClick={()=>{setMode('list');setCurrentService(null);}} style={{background:'#f3f3f9',color:'#495057',border:'none',borderRadius:10,padding:'10px 20px',fontWeight:600,fontSize:13,cursor:'pointer'}}>
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving} style={{background:CLR.primary,color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',fontWeight:600,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:6,opacity:saving?.7:1}}>
                                    {saving?<span className="spinner-border spinner-border-sm"></span>:<i className={mode==='create'?'ri-add-line':'ri-save-line'}></i>}
                                    {mode==='create'?'Créer':'Mettre à jour'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
             <br/>
        </Layout>
    );
};

export default ServiceManagementPage;