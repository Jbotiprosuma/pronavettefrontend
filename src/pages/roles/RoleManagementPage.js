import React, { useState, useEffect, useMemo } from 'react';
import api from '../../axios';
import Loading from '../../components/base/Loading';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';
import RoleForm from '../../components/roles/RoleForm';
import AlertMessages from '../../components/base/AlertMessages';
import Swal from 'sweetalert2';

const CLR = { primary:'#405189', success:'#0ab39c', warning:'#f7b84b', danger:'#f06548', info:'#299cdb', secondary:'#878a99' };
const thS = { padding:'11px 14px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'#878a99', background:'#f8f9fa', borderBottom:'1.5px solid #e9ebec', whiteSpace:'nowrap' };
const tdS = { padding:'10px 14px', fontSize:13, color:'#495057', verticalAlign:'middle' };
const ActionBtn = ({ color, icon, title, onClick }) => (
    <button onClick={onClick} title={title} style={{
        width:30, height:30, borderRadius:8, border:'none', cursor:'pointer',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        background:`${color}12`, color, fontSize:15, transition:'all .15s',
    }}><i className={icon}></i></button>
);
const PgBtn = ({ children, active, disabled, onClick }) => (
    <button onClick={disabled?undefined:onClick} disabled={disabled} style={{
        minWidth:34, height:34, borderRadius:8, border:active?'none':'1px solid #e9ebec',
        background:active?'#405189':'#fff', color:active?'#fff':disabled?'#ccc':'#495057',
        fontWeight:600, fontSize:13, cursor:disabled?'default':'pointer',
    }}>{children}</button>
);

const RoleManagementPage = () => {
    const { user } = useAuth();
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);
    const [currentRole, setCurrentRole] = useState(null);
    const [mode, setMode] = useState('list');

    /* Filtres & pagination */
    const [search, setSearch] = useState('');
    const [filterModifiable, setFilterModifiable] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    const fetchRoles = async () => {
        setLoading(true);
        try { const r = await api.get('/roles'); setRoles(r.data.data); }
        catch { setAlert({ type:'danger', message:'Impossible de charger les rôles.' }); }
        finally { setLoading(false); }
    };
    const fetchPermissions = async () => {
        try { const r = await api.get('/permissions'); setPermissions(r.data.data); } catch {}
    };

    useEffect(() => { fetchRoles(); fetchPermissions(); }, []);

    /* Filtrage & pagination */
    const filtered = useMemo(() => {
        let data = [...roles];
        if (search) {
            const q = search.toLowerCase();
            data = data.filter(r =>
                (r.name || '').toLowerCase().includes(q)
                || (r.description || '').toLowerCase().includes(q)
                || (r.permissions || []).some(p => (p.name || '').toLowerCase().includes(q))
            );
        }
        if (filterModifiable === '1') data = data.filter(r => r.is_deletable);
        if (filterModifiable === '0') data = data.filter(r => !r.is_deletable);
        return data;
    }, [roles, search, filterModifiable]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    useEffect(() => setCurrentPage(1), [search, filterModifiable]);

    const hasActiveFilters = search || filterModifiable;
    const clearFilters = () => { setSearch(''); setFilterModifiable(''); };

    const canManageRoles = user?.role === 'superadmin' || user?.role === 'admin';

    /* Actions */
    const handleSaveRole = async (roleData) => {
        setLoading(true);
        try {
            if (roleData.id) {
                await api.put(`/roles/${roleData.id}`, roleData);
                setAlert({ type:'success', message:'Rôle mis à jour avec succès !' });
            } else {
                await api.post('/roles', roleData);
                setAlert({ type:'success', message:'Rôle créé avec succès !' });
            }
            setMode('list'); setCurrentRole(null); await fetchRoles();
        } catch(err) {
            setAlert({ type:'danger', message: err.response?.data?.message || "Erreur lors de l'enregistrement du rôle." });
            setLoading(false);
        }
    };

    const handleDeleteRole = (id) => {
        Swal.fire({
            title:'Supprimer ce rôle ?', text:'Cette action est irréversible.', icon:'warning',
            showCancelButton:true, confirmButtonColor:CLR.danger, cancelButtonColor:CLR.primary,
            confirmButtonText:'Supprimer', cancelButtonText:'Annuler'
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            setLoading(true);
            try {
                await api.delete(`/roles/${id}`);
                setAlert({ type:'success', message:'Rôle supprimé avec succès !' });
                Swal.fire('Supprimé !', 'Le rôle a été supprimé.', 'success');
                await fetchRoles();
            } catch(err) {
                setAlert({ type:'danger', message: err.response?.data?.message || 'Impossible de supprimer le rôle.' });
                Swal.fire('Erreur !', 'Impossible de supprimer le rôle.', 'error');
                setLoading(false);
            }
        });
    };

    if (!user || loading) return <Loading loading={true} />;

    /* KPI */
    const kpiCards = [
        { label:'Total', value:roles.length, icon:'ri-shield-user-line', color:CLR.primary },
        { label:'Modifiables', value:roles.filter(r=>r.is_deletable).length, icon:'ri-settings-3-line', color:CLR.success },
        { label:'Système', value:roles.filter(r=>!r.is_deletable).length, icon:'ri-lock-line', color:CLR.warning },
    ];

    return (
        <Layout>
            {/* HERO */}
            <div style={{background:'linear-gradient(135deg,#405189 0%,#2e3a5f 50%,#0ab39c 100%)',borderRadius:16,padding:'32px 36px',marginBottom:28,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)'}}/>
                <div style={{position:'relative',zIndex:1,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
                    <div>
                        {mode !== 'list' && (
                            <button onClick={()=>{setMode('list');setCurrentRole(null);}} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontWeight:600,fontSize:13,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                                <i className="ri-arrow-left-line"></i> Retour
                            </button>
                        )}
                        <h2 style={{color:'#fff',margin:0,fontSize:24,fontWeight:700}}>
                            <i className="ri-shield-user-line" style={{marginRight:12}}></i>
                            {mode==='list'?'Gestion des rôles':mode==='create'?'Nouveau rôle':'Modifier le rôle'}
                        </h2>
                        <p style={{color:'rgba(255,255,255,.75)',margin:'6px 0 0',fontSize:14}}>
                            {mode==='list'?`${roles.length} rôle${roles.length>1?'s':''} configuré${roles.length>1?'s':''}`:'Remplissez le formulaire ci-dessous'}
                        </p>
                    </div>
                    {mode==='list' && canManageRoles && (
                        <button onClick={()=>{setCurrentRole(null);setMode('create');}} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'9px 18px',cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                            <i className="ri-add-line"></i> Nouveau rôle
                        </button>
                    )}
                </div>
            </div>

            <AlertMessages alert={alert} setAlert={setAlert} />

            {/* KPI */}
            {mode==='list' && (
                <div className="row g-3 mb-4">
                    {kpiCards.map((c,i)=>(
                        <div key={i} className="col-6 col-md-4">
                            <div style={{background:'#fff',borderRadius:14,padding:'18px 16px',boxShadow:'0 2px 12px rgba(0,0,0,.06)',display:'flex',alignItems:'center',gap:14}}>
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
            )}

            {/* TABLE */}
            {mode==='list' && (
                <div style={{background:'#fff',borderRadius:14,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
                    {/* Search + Filters header */}
                    <div style={{padding:'16px 22px',borderBottom:'1px solid #f3f3f9',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
                        <div style={{fontWeight:700,fontSize:15,color:'#495057'}}>
                            <i className="ri-list-check" style={{marginRight:8}}></i>Liste des rôles
                            <span style={{marginLeft:10,background:'#40518912',color:CLR.primary,borderRadius:8,padding:'2px 10px',fontSize:12,fontWeight:700}}>{filtered.length}</span>
                        </div>
                        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                            <div style={{position:'relative',minWidth:220}}>
                                <i className="ri-search-line" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#878a99'}}></i>
                                <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un rôle..."
                                    style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px 8px 36px',fontSize:13,outline:'none'}}/>
                            </div>
                            <select value={filterModifiable} onChange={e=>setFilterModifiable(e.target.value)}
                                style={{border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13,outline:'none',background:'#fff',minWidth:140}}>
                                <option value="">Tous les types</option>
                                <option value="1">Modifiables</option>
                                <option value="0">Système</option>
                            </select>
                            {hasActiveFilters && <button onClick={clearFilters} style={{background:`${CLR.danger}12`,color:CLR.danger,border:'none',borderRadius:10,padding:'8px 14px',fontSize:13,cursor:'pointer',fontWeight:600}}>
                                <i className="ri-close-line" style={{marginRight:4}}></i>Réinitialiser
                            </button>}
                        </div>
                    </div>

                    {paged.length===0 ? (
                        <div style={{textAlign:'center',padding:'60px 20px'}}>
                            <i className="ri-shield-user-line" style={{fontSize:56,color:'#e9ebec'}}></i>
                            <h5 style={{color:'#878a99',marginTop:16,fontWeight:600}}>Aucun rôle trouvé</h5>
                            <p style={{color:'#adb5bd',fontSize:13}}>{hasActiveFilters?'Essayez de modifier vos filtres.':'Aucun rôle à afficher.'}</p>
                            {hasActiveFilters && <button onClick={clearFilters} style={{background:CLR.primary,color:'#fff',border:'none',borderRadius:10,padding:'10px 24px',fontWeight:600,cursor:'pointer'}}><i className="ri-filter-off-line" style={{marginRight:6}}></i>Réinitialiser</button>}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
                                <thead><tr>
                                    <th style={{...thS,width:50,textAlign:'center'}}>#</th>
                                    <th style={thS}>Nom</th>
                                    <th style={thS}>Description</th>
                                    <th style={thS}>Permissions</th>
                                    <th style={{...thS,textAlign:'center'}}>Modifiable</th>
                                    <th style={{...thS,textAlign:'center'}}>Date de création</th>
                                    {canManageRoles && <th style={{...thS,textAlign:'center',width:120}}>Actions</th>}
                                </tr></thead>
                                <tbody>
                                    {paged.map((role,idx)=>(
                                        <tr key={role.id} style={{borderBottom:'1px solid #f3f3f9',transition:'background .15s'}}
                                            onMouseEnter={e=>e.currentTarget.style.background='#f8f9fa'}
                                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                            <td style={{...tdS,textAlign:'center',fontWeight:700,color:CLR.primary}}>{(currentPage-1)*pageSize+idx+1}</td>
                                            <td style={tdS}>
                                                <div style={{display:'flex',alignItems:'center',gap:10}}>
                                                    <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${CLR.primary}12`,color:CLR.primary,fontWeight:700,fontSize:14}}>
                                                        {role.name?.[0]?.toUpperCase()||'R'}
                                                    </div>
                                                    <span style={{fontWeight:600}}>{role.name}</span>
                                                </div>
                                            </td>
                                            <td style={{...tdS,color:'#878a99',maxWidth:250}}>{role.description||'-'}</td>
                                            <td style={{...tdS,maxWidth:300}}>
                                                {role.permissions && role.permissions.length > 0
                                                    ? <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                                                        {role.permissions.slice(0,3).map(p => (
                                                            <span key={p.id||p.name} style={{background:`${CLR.info}12`,color:CLR.info,borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600}}>{p.name}</span>
                                                        ))}
                                                        {role.permissions.length > 3 && (
                                                            <span style={{background:'#f3f3f9',color:'#878a99',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600}}>+{role.permissions.length - 3}</span>
                                                        )}
                                                      </div>
                                                    : <span style={{color:'#adb5bd',fontSize:12}}>Aucune</span>
                                                }
                                            </td>
                                            <td style={{...tdS,textAlign:'center'}}>
                                                {role.is_deletable
                                                    ? <span style={{display:'inline-flex',alignItems:'center',gap:4,background:`${CLR.success}15`,color:CLR.success,borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600}}><i className="ri-checkbox-circle-fill" style={{fontSize:13}}></i>Oui</span>
                                                    : <span style={{display:'inline-flex',alignItems:'center',gap:4,background:`${CLR.warning}15`,color:CLR.warning,borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600}}><i className="ri-lock-fill" style={{fontSize:13}}></i>Système</span>
                                                }
                                            </td>
                                            <td style={{...tdS,textAlign:'center',fontSize:12,color:'#878a99'}}>{new Date(role.createdAt).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}</td>
                                            {canManageRoles && (
                                                <td style={{...tdS,textAlign:'center'}}>
                                                    {role.is_deletable ? (
                                                        <div style={{display:'flex',gap:6,justifyContent:'center'}}>
                                                            <ActionBtn color={CLR.info} icon="ri-pencil-line" title="Modifier" onClick={()=>{setCurrentRole(role);setMode('edit');}}/>
                                                            <ActionBtn color={CLR.danger} icon="ri-delete-bin-line" title="Supprimer" onClick={()=>handleDeleteRole(role.id)}/>
                                                        </div>
                                                    ) : (
                                                        <span style={{color:'#adb5bd',fontSize:12}}>Système</span>
                                                    )}
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
            {(mode==='create' || mode==='edit') && (
                <div style={{background:'#fff',borderRadius:14,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
                    <div style={{padding:'16px 22px',borderBottom:'1px solid #f3f3f9',fontWeight:700,fontSize:15,color:'#495057'}}>
                        <i className={mode==='create'?'ri-add-circle-line':'ri-pencil-line'} style={{marginRight:8}}></i>
                        {mode==='create'?'Créer un nouveau rôle':'Modifier le rôle'}
                    </div>
                    <div style={{padding:22}}>
                        <RoleForm
                            role={currentRole}
                            permissions={permissions}
                            onSave={handleSaveRole}
                            onCancel={()=>{setCurrentRole(null);setMode('list');}}
                        />
                    </div>
                </div>
            )}
            <br/>
        </Layout>
    );
};

export default RoleManagementPage;