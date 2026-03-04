import React, { useState, useEffect, useMemo } from 'react';
import api from '../../axios';
import { Link, useNavigate } from 'react-router-dom';
import Loading from '../../components/base/Loading';
import AlertMessages from '../../components/base/AlertMessages';
import Layout from '../../components/base/Layout';
import Swal from 'sweetalert2';

const CLR = { primary:'#405189', success:'#0ab39c', warning:'#f7b84b', danger:'#f06548', info:'#299cdb', secondary:'#878a99' };
const thS = { padding:'11px 14px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'#878a99', background:'#f8f9fa', borderBottom:'1.5px solid #e9ebec', whiteSpace:'nowrap' };
const tdS = { padding:'10px 14px', fontSize:13, color:'#495057', verticalAlign:'middle' };

const ActionBtn = ({ color, icon, title, onClick }) => (
    <button onClick={onClick} title={title} style={{
        width:30, height:30, borderRadius:8, border:'none', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        background:`${color}12`, color, fontSize:14, transition:'all .15s',
    }}><i className={icon}></i></button>
);
const PgBtn = ({ children, active, disabled, onClick }) => (
    <button onClick={disabled?undefined:onClick} disabled={disabled} style={{
        minWidth:34, height:34, borderRadius:8, border:active?'none':'1px solid #e9ebec',
        background:active?'#405189':'#fff', color:active?'#fff':disabled?'#ccc':'#495057',
        fontWeight:600, fontSize:13, cursor:disabled?'default':'pointer',
    }}>{children}</button>
);

const UserPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const pageSize = 50;

    const fetchUsers = async () => {
        try { const r = await api.get('users'); setUsers(r.data.data||[]); }
        catch { console.error('Erreur chargement utilisateurs'); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchUsers(); }, []);

    const statusChange = async slug => {
        setIsUpdatingStatus(true);
        try {
            await api.put(`users/${slug}/update-status`);
            Swal.fire({ icon:'success', title:'Statut mis à jour !', showConfirmButton:false, timer:2000 });
            fetchUsers();
        } catch(e) {
            Swal.fire({ icon:'error', title:'Erreur', text:e.response?.data?.message||'Erreur' });
        } finally { setIsUpdatingStatus(false); }
    };

    /* Filtrage */
    const roles = useMemo(() => [...new Set(users.map(u=>u.role?.name).filter(Boolean))], [users]);

    const filtered = useMemo(() => {
        let data = [...users];
        if(search) { const q=search.toLowerCase(); data=data.filter(u=>[u.nom,u.prenom,u.email,u.service?.name].filter(Boolean).join(' ').toLowerCase().includes(q)); }
        if(filterRole) data=data.filter(u=>u.role?.name===filterRole);
        if(filterStatus) data=data.filter(u=>u.status===filterStatus);
        return data;
    }, [users, search, filterRole, filterStatus]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paged = filtered.slice((currentPage-1)*pageSize, currentPage*pageSize);
    useEffect(()=>setCurrentPage(1), [search, filterRole, filterStatus]);

    const hasActiveFilters = search||filterRole||filterStatus;
    const clearFilters = () => { setSearch(''); setFilterRole(''); setFilterStatus(''); };

    /* KPI */
    const kpiCards = [
        { label:'Total', value:users.length, icon:'ri-group-line', color:CLR.primary },
        { label:'Actifs', value:users.filter(u=>u.status==='Activé').length, icon:'ri-checkbox-circle-line', color:CLR.success },
        { label:'Inactifs', value:users.filter(u=>u.status==='Désactivé').length, icon:'ri-close-circle-line', color:CLR.danger },
        { label:'Rôles', value:roles.length, icon:'ri-shield-user-line', color:CLR.info },
    ];

    if (loading) return <Loading loading={true} />;

    return (
        <Layout>
            {/* HERO */}
            <div style={{background:'linear-gradient(135deg,#405189 0%,#2e3a5f 50%,#0ab39c 100%)',borderRadius:16,padding:'32px 36px',marginBottom:28,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)'}}/>
                <div style={{position:'relative',zIndex:1,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
                    <div>
                        <h2 style={{color:'#fff',margin:0,fontSize:24,fontWeight:700}}><i className="ri-group-line" style={{marginRight:12}}></i>Gestion des utilisateurs</h2>
                        <p style={{color:'rgba(255,255,255,.75)',margin:'6px 0 0',fontSize:14}}>Gérer les comptes et les accès au système</p>
                    </div>
                    <Link to="/utilisateur/create" style={{background:'#fff',color:'#405189',borderRadius:10,padding:'9px 18px',fontWeight:600,fontSize:13,textDecoration:'none',display:'flex',alignItems:'center',gap:6,border:'none'}}>
                        <i className="ri-add-line"></i> Nouvel utilisateur
                    </Link>
                </div>
            </div>

            <AlertMessages alert={alert} setAlert={setAlert} />

            {/* KPI CARDS */}
            <div className="row g-3 mb-4">
                {kpiCards.map((c,i)=>(
                    <div key={i} className="col-6 col-md-3">
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

            {/* FILTERS + TABLE */}
            <div style={{background:'#fff',borderRadius:14,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
                {/* Filters bar */}
                <div style={{padding:'18px 22px',borderBottom:'1px solid #f3f3f9'}}>
                    <div className="row g-3 align-items-end">
                        <div className="col-md-4">
                            <div style={{position:'relative'}}>
                                <i className="ri-search-line" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#878a99'}}></i>
                                <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher (nom, prénom, email, service)"
                                    style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px 8px 36px',fontSize:13,outline:'none'}}/>
                            </div>
                        </div>
                        <div className="col-md-2">
                            <select value={filterRole} onChange={e=>setFilterRole(e.target.value)} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13,background:'#fff'}}>
                                <option value="">Tous les rôles</option>
                                {roles.map(r=><option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{width:'100%',border:'1.5px solid #e9ebec',borderRadius:10,padding:'8px 12px',fontSize:13,background:'#fff'}}>
                                <option value="">Tous les statuts</option>
                                <option value="Activé">Activé</option>
                                <option value="Désactivé">Désactivé</option>
                            </select>
                        </div>
                        {hasActiveFilters && <div className="col-md-2">
                            <button onClick={clearFilters} style={{background:'#f0654812',color:CLR.danger,border:'none',borderRadius:10,padding:'8px 14px',fontSize:13,cursor:'pointer',fontWeight:600}}>
                                <i className="ri-close-line" style={{marginRight:4}}></i>Réinitialiser
                            </button>
                        </div>}
                        <div className="col-md-2 ms-auto d-flex justify-content-end">
                            <span style={{fontSize:12,color:'#878a99',alignSelf:'center'}}>{filtered.length} résultat{filtered.length!==1?'s':''}</span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {paged.length===0 ? (
                    <div style={{textAlign:'center',padding:'60px 20px'}}>
                        <i className="ri-group-line" style={{fontSize:56,color:'#e9ebec'}}></i>
                        <h5 style={{color:'#878a99',marginTop:16,fontWeight:600}}>Aucun utilisateur trouvé</h5>
                        <p style={{color:'#adb5bd',fontSize:13}}>Essayez de modifier vos filtres.</p>
                        {hasActiveFilters && <button onClick={clearFilters} style={{background:CLR.primary,color:'#fff',border:'none',borderRadius:10,padding:'10px 24px',fontWeight:600,cursor:'pointer'}}><i className="ri-filter-off-line" style={{marginRight:6}}></i>Réinitialiser</button>}
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
                            <thead><tr>
                                <th style={{...thS,width:50}}>#</th>
                                <th style={thS}>Utilisateur</th>
                                <th style={thS}>Service</th>
                                <th style={thS}>Rôle</th>
                                <th style={{...thS,textAlign:'center'}}>Statut</th>
                                <th style={{...thS,textAlign:'center'}}>Créé le</th>
                                <th style={{...thS,textAlign:'center',width:120}}>Actions</th>
                            </tr></thead>
                            <tbody>
                                {paged.map((u,idx)=>{
                                    const isActive = u.status==='Activé';
                                    const stColor = isActive?CLR.success:CLR.danger;
                                    return (
                                        <tr key={u.id||idx} style={{borderBottom:'1px solid #f3f3f9',transition:'background .15s'}}
                                            onMouseEnter={e=>e.currentTarget.style.background='#f8f9fa'}
                                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                            <td style={{...tdS,fontWeight:600,color:'#878a99',fontSize:12}}>{(currentPage-1)*pageSize+idx+1}</td>
                                            <td style={tdS}>
                                                <div style={{display:'flex',alignItems:'center',gap:10}}>
                                                    <img src={u.avatar_url} alt="" style={{width:36,height:36,borderRadius:10,objectFit:'cover'}}/>
                                                    <div>
                                                        <div style={{fontWeight:600,fontSize:13,color:'#495057'}}>{u.nom} {u.prenom}</div>
                                                        {u.email && <div style={{fontSize:11,color:'#878a99'}}>{u.email}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdS}>{u.service?.name ? <span style={{background:`${CLR.info}12`,color:CLR.info,borderRadius:8,padding:'3px 10px',fontSize:12,fontWeight:600}}>{u.service.name}</span> : <span style={{color:'#adb5bd'}}>-</span>}</td>
                                            <td style={tdS}>{u.role?.name ? <span style={{background:`${CLR.primary}12`,color:CLR.primary,borderRadius:8,padding:'3px 10px',fontSize:12,fontWeight:600}}>{u.role.name}</span> : <span style={{color:'#adb5bd'}}>-</span>}</td>
                                            <td style={{...tdS,textAlign:'center'}}>
                                                <span style={{display:'inline-flex',alignItems:'center',gap:4,background:`${stColor}15`,color:stColor,borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600}}>
                                                    <i className={isActive?'ri-checkbox-circle-fill':'ri-close-circle-fill'} style={{fontSize:13}}></i>{u.status}
                                                </span>
                                            </td>
                                            <td style={{...tdS,textAlign:'center',fontSize:12,color:'#878a99'}}>{u.createdAt?new Date(u.createdAt).toLocaleDateString('fr-FR'):'-'}</td>
                                            <td style={{...tdS,textAlign:'center'}}>
                                                <div style={{display:'flex',justifyContent:'center',gap:4}}>
                                                    <ActionBtn color={CLR.primary} icon="ri-eye-line" title="Voir le profil" onClick={()=>navigate(`/utilisateur/${u.slug}`)}/>
                                                    <ActionBtn color={CLR.warning} icon={isActive?'ri-eye-off-line':'ri-eye-line'} title="Changer le statut" onClick={()=>statusChange(u.slug)}/>
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
                {totalPages>1 && (
                    <div style={{padding:'14px 22px',borderTop:'1px solid #f3f3f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:13,color:'#878a99'}}>Page {currentPage}/{totalPages} ({filtered.length} utilisateurs)</span>
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
            <br/>
        </Layout>
    );
};

export default UserPage;