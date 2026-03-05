import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../axios';
import Swal from 'sweetalert2';
import Loading from '../base/Loading';

const CLR = { primary:'#405189', success:'#0ab39c', warning:'#f7b84b', danger:'#f06548', info:'#299cdb', secondary:'#878a99' };
const STATUS_CFG = {
    'En attente': { color:CLR.warning, icon:'ri-time-line',         label:'En attente'  },
    'Validé':     { color:CLR.success, icon:'ri-check-double-line', label:'Validé'      },
    'Rejeté':     { color:CLR.danger,  icon:'ri-close-circle-line', label:'Rejeté'      },
    'Annulé':     { color:CLR.secondary,icon:'ri-forbid-line',      label:'Annulé'      },
};
const fmtD = d => d ? new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}) : '-';
const fmtMY = d => d ? new Date(d).toLocaleDateString('fr-FR',{year:'numeric',month:'long'}) : '-';

const KpiCard = ({ icon, label, value, unit='', color=CLR.primary }) => (
    <div style={{background:'#fff',borderRadius:14,padding:'16px 18px',boxShadow:'0 2px 12px rgba(0,0,0,.06)',display:'flex',alignItems:'center',gap:14,height:'100%'}}>
        <div style={{width:44,height:44,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${color}15`,color,fontSize:18,flexShrink:0}}>
            <i className={icon}></i>
        </div>
        <div>
            <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',color:'#878a99'}}>{label}</div>
            <div style={{fontSize:22,fontWeight:700,color:'#495057'}}>{value??'-'} <span style={{fontSize:12,fontWeight:500,color:'#878a99'}}>{unit}</span></div>
        </div>
    </div>
);

const MutationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mutation, setMutation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMutation = async () => {
        setLoading(true);
        try { const r = await api.get(`/mutations/${id}`); setMutation(r.data.data); setError(null); }
        catch(err) { const m=err.response?.data?.message||'Impossible de charger les détails.'; Swal.fire('Erreur',m,'error'); setError(m); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchMutation(); }, [id]); // eslint-disable-line

    const doAction = async (url, title, text, msg) => {
        const r = await Swal.fire({ title, text, icon:'question', showCancelButton:true, confirmButtonText:'Confirmer', cancelButtonText:'Annuler', confirmButtonColor:CLR.primary });
        if(!r.isConfirmed) return;
        setActionLoading(true);
        try { await api.patch(url); Swal.fire('Succès',msg,'success'); await fetchMutation(); }
        catch(err) { Swal.fire('Erreur',err.response?.data?.message||'Erreur.','error'); }
        finally { setActionLoading(false); }
    };
    const handleConfirm=()=>doAction(`/mutations/${id}/confirm`,'Valider la mutation ?',"La mutation passera au statut 'Validé'.",'Mutation validée.');
    const handleReject =()=>doAction(`/mutations/${id}/reject`,'Rejeter la mutation ?',"La mutation passera au statut 'Rejeté'.",'Mutation rejetée.');
    const handleReset  =()=>doAction(`/mutations/${id}/reset`,'Annuler la mutation ?',"La mutation passera au statut 'Annulé'.",'Mutation annulée.');

    if(loading) return <Loading loading={true}/>;
    if(error) return <div style={{textAlign:'center',padding:'60px 20px'}}><i className="ri-error-warning-line" style={{fontSize:56,color:'#e9ebec'}}></i><h5 style={{color:'#878a99',marginTop:16}}>{error}</h5><button onClick={()=>navigate('/mutations')} style={{background:CLR.primary,color:'#fff',border:'none',borderRadius:10,padding:'9px 18px',cursor:'pointer',fontWeight:600,fontSize:13,marginTop:8}}><i className="ri-arrow-left-line" style={{marginRight:6}}></i>Retour</button></div>;
    if(!mutation) return null;

    const { employer, serviceOld, serviceNew, navette, createdby, confirmeby, nb_jours_job, nb_jour_abs, accompte, prime_nuit, heure_sup_15, heure_sup_50, heure_sup_75, status, confirme_at, periode_at, depart_at, arrivee_at, is_cadre, is_apply } = mutation;
    const cfg = STATUS_CFG[status] || STATUS_CFG['En attente'];
    const isPending = status==='En attente';

    const steps = [
        { label:'Créée',  icon:'ri-add-circle-line' },
        { label:'En attente', icon:'ri-time-line' },
        { label:status==='En attente'?'Décision':status, icon:cfg.icon },
        { label:'Appliquée',  icon:'ri-check-double-line' },
    ];
    const stepIdx = status==='En attente'?1:status==='Validé'?(is_apply?3:2):2;
    const initials = (employer?.prenom?.[0]||'')+(employer?.nom?.[0]||'');

    return (
        <div>
            {/* HERO */}
            <div style={{background:'linear-gradient(135deg,#405189 0%,#2e3a5f 50%,#0ab39c 100%)',borderRadius:16,padding:'32px 36px',marginBottom:28,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)'}}/>
                <div style={{position:'relative',zIndex:1}}>
                    <button onClick={()=>navigate('/mutations')} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontWeight:600,fontSize:13,marginBottom:14,display:'inline-flex',alignItems:'center',gap:6}}>
                        <i className="ri-arrow-left-line"></i> Retour aux mutations
                    </button>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
                        <div style={{display:'flex',alignItems:'center',gap:16}}>
                            <div style={{width:56,height:56,borderRadius:14,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:22,fontWeight:700}}>
                                {initials}
                            </div>
                            <div>
                                <h2 style={{color:'#fff',margin:0,fontSize:24,fontWeight:700}}>{employer?.prenom} {employer?.nom}</h2>
                                <p style={{color:'rgba(255,255,255,.75)',margin:'4px 0 0',fontSize:14}}>
                                    Matricule : {employer?.matricule} &bull; Mutation #{id}
                                </p>
                            </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <span style={{background:`${cfg.color}25`,color:'#fff',borderRadius:20,padding:'6px 16px',fontSize:13,fontWeight:700,display:'inline-flex',alignItems:'center',gap:6}}>
                                <i className={cfg.icon}></i> {cfg.label}
                            </span>
                            {is_cadre ? <span style={{background:'rgba(255,255,255,.15)',color:'#fff',borderRadius:20,padding:'5px 12px',fontSize:11,fontWeight:600}}>Cadre</span> : null}
                        </div>
                    </div>
                </div>
            </div>

            {/* STEPPER */}
            <div style={{background:'#fff',borderRadius:14,padding:'20px 24px',marginBottom:24,boxShadow:'0 2px 12px rgba(0,0,0,.06)',display:'flex',alignItems:'center',justifyContent:'center',gap:0}}>
                {steps.map((s,i)=>(
                    <React.Fragment key={i}>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',minWidth:80}}>
                            <div style={{width:40,height:40,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                                background:i<stepIdx?CLR.success:i===stepIdx?cfg.color:'#f3f3f9',
                                color:i<=stepIdx?'#fff':'#878a99',fontSize:18,transition:'all .3s'}}>
                                <i className={i<stepIdx?'ri-check-line':s.icon}></i>
                            </div>
                            <span style={{fontSize:11,fontWeight:i<=stepIdx?700:500,color:i<=stepIdx?'#495057':'#878a99',marginTop:6,textAlign:'center',width:80}}>{s.label}</span>
                        </div>
                        {i<steps.length-1 && <div style={{flex:1,height:2,background:i<stepIdx?CLR.success:'#e9ebec',maxWidth:80,margin:'0 4px',marginBottom:20}}/>}
                    </React.Fragment>
                ))}
            </div>

            {/* CONTENT */}
            <div className="row g-4 mb-4">
                {/* Mouvement */}
                <div className="col-lg-5">
                    <div style={{background:'#fff',borderRadius:14,boxShadow:'0 2px 12px rgba(0,0,0,.06)',overflow:'hidden',height:'100%'}}>
                        <div style={{padding:'14px 20px',borderBottom:'1px solid #f3f3f9',fontWeight:700,fontSize:14,color:'#495057'}}>
                            <i className="ri-user-shared-line" style={{marginRight:8,color:CLR.primary}}></i>Mouvement
                        </div>
                        <div style={{padding:20}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,padding:16,background:'#f8f9fa',borderRadius:12,marginBottom:16}}>
                                <div style={{textAlign:'center'}}>
                                    <div style={{background:`${CLR.danger}12`,color:CLR.danger,borderRadius:10,padding:'6px 16px',fontWeight:700,fontSize:13}}>{serviceOld?.name||'-'}</div>
                                    <div style={{fontSize:10,color:'#878a99',marginTop:4}}>Ancien service</div>
                                </div>
                                <i className="ri-arrow-right-circle-fill" style={{fontSize:28,color:CLR.primary}}></i>
                                <div style={{textAlign:'center'}}>
                                    <div style={{background:`${CLR.success}12`,color:CLR.success,borderRadius:10,padding:'6px 16px',fontWeight:700,fontSize:13}}>{serviceNew?.name||'-'}</div>
                                    <div style={{fontSize:10,color:'#878a99',marginTop:4}}>Nouveau service</div>
                                </div>
                            </div>
                            {[
                                ['Période', fmtMY(periode_at), 'ri-calendar-line'],
                                ['Départ', fmtD(depart_at), 'ri-flight-takeoff-line'],
                                ['Arrivée', fmtD(arrivee_at), 'ri-flight-land-line'],
                                ['Navette', navette?.name||'Non assignée', 'ri-bus-line'],
                                ['Appliquée', is_apply?'Oui':'Non', 'ri-check-line'],
                            ].map(([label,val,icon],i)=>(
                                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<4?'1px solid #f3f3f9':'none'}}>
                                    <span style={{fontSize:13,color:'#878a99',display:'flex',alignItems:'center',gap:6}}><i className={icon} style={{fontSize:15}}></i>{label}</span>
                                    <span style={{fontSize:13,fontWeight:600,color:'#495057'}}>{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Historique */}
                <div className="col-lg-4">
                    <div style={{background:'#fff',borderRadius:14,boxShadow:'0 2px 12px rgba(0,0,0,.06)',overflow:'hidden',height:'100%'}}>
                        <div style={{padding:'14px 20px',borderBottom:'1px solid #f3f3f9',fontWeight:700,fontSize:14,color:'#495057'}}>
                            <i className="ri-history-line" style={{marginRight:8,color:CLR.info}}></i>Historique
                        </div>
                        <div style={{padding:20}}>
                            <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:16,paddingBottom:16,borderBottom:'1px solid #f3f3f9'}}>
                                <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${CLR.primary}12`,color:CLR.primary,fontSize:16,flexShrink:0}}>
                                    <i className="ri-add-circle-line"></i>
                                </div>
                                <div>
                                    <div style={{fontSize:11,color:'#878a99'}}>Créée par</div>
                                    <div style={{fontSize:13,fontWeight:600,color:'#495057'}}>{createdby?.prenom} {createdby?.nom}</div>
                                    <div style={{fontSize:11,color:'#878a99'}}>{fmtD(mutation.created_at)}</div>
                                </div>
                            </div>
                            {confirme_at && (
                                <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:16,paddingBottom:16,borderBottom:'1px solid #f3f3f9'}}>
                                    <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${cfg.color}12`,color:cfg.color,fontSize:16,flexShrink:0}}>
                                        <i className={cfg.icon}></i>
                                    </div>
                                    <div>
                                        <div style={{fontSize:11,color:'#878a99'}}>{cfg.label} par</div>
                                        <div style={{fontSize:13,fontWeight:600,color:'#495057'}}>{confirmeby?.prenom} {confirmeby?.nom}</div>
                                        <div style={{fontSize:11,color:'#878a99'}}>{fmtD(confirme_at)}</div>
                                    </div>
                                </div>
                            )}
                            {mutation.updated_at!==mutation.created_at && (
                                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                                    <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${CLR.warning}12`,color:CLR.warning,fontSize:16,flexShrink:0}}>
                                        <i className="ri-pencil-line"></i>
                                    </div>
                                    <div>
                                        <div style={{fontSize:11,color:'#878a99'}}>Dernière modification</div>
                                        <div style={{fontSize:11,color:'#878a99'}}>{fmtD(mutation.updated_at)}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="col-lg-3">
                    <div style={{background:'#fff',borderRadius:14,boxShadow:'0 2px 12px rgba(0,0,0,.06)',overflow:'hidden',height:'100%'}}>
                        <div style={{padding:'14px 20px',borderBottom:'1px solid #f3f3f9',fontWeight:700,fontSize:14,color:'#495057'}}>
                            <i className="ri-settings-3-line" style={{marginRight:8,color:CLR.secondary}}></i>Actions
                        </div>
                        <div style={{padding:20,display:'flex',flexDirection:'column',gap:10}}>
                            {isPending ? (<>
                                <button onClick={handleConfirm} disabled={actionLoading} style={{width:'100%',padding:'10px 16px',borderRadius:10,border:'none',cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:CLR.success,color:'#fff'}}>
                                    {actionLoading?<span className="spinner-border spinner-border-sm"></span>:<i className="ri-check-double-line"></i>} Valider
                                </button>
                                <button onClick={handleReject} disabled={actionLoading} style={{width:'100%',padding:'10px 16px',borderRadius:10,border:`1.5px solid ${CLR.danger}`,cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'#fff',color:CLR.danger}}>
                                    {actionLoading?<span className="spinner-border spinner-border-sm"></span>:<i className="ri-close-circle-line"></i>} Rejeter
                                </button>
                                <button onClick={handleReset} disabled={actionLoading} style={{width:'100%',padding:'10px 16px',borderRadius:10,border:'1.5px solid #e9ebec',cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'#fff',color:CLR.secondary}}>
                                    {actionLoading?<span className="spinner-border spinner-border-sm"></span>:<i className="ri-forbid-line"></i>} Annuler
                                </button>
                                <hr style={{margin:'8px 0',borderColor:'#f3f3f9'}}/>
                                <button onClick={()=>navigate(`/mutation/edit/${id}`)} style={{width:'100%',padding:'10px 16px',borderRadius:10,border:'1.5px solid #e9ebec',cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'#fff',color:CLR.info}}>
                                    <i className="ri-pencil-line"></i> Modifier
                                </button>
                            </>) : (
                                <div style={{textAlign:'center',padding:'16px 0'}}>
                                    <div style={{width:48,height:48,borderRadius:12,display:'inline-flex',alignItems:'center',justifyContent:'center',background:`${cfg.color}12`,color:cfg.color,fontSize:24,marginBottom:10}}>
                                        <i className={cfg.icon}></i>
                                    </div>
                                    <div style={{fontSize:14,fontWeight:700,color:cfg.color}}>Mutation {cfg.label.toLowerCase()}</div>
                                    {confirme_at && <div style={{fontSize:12,color:'#878a99',marginTop:4}}>le {fmtD(confirme_at)}</div>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Récapitulatif Paie */}
            <div style={{background:'#fff',borderRadius:14,boxShadow:'0 2px 12px rgba(0,0,0,.06)',overflow:'hidden',marginBottom:28}}>
                <div style={{padding:'14px 20px',borderBottom:'1px solid #f3f3f9',fontWeight:700,fontSize:14,color:'#495057'}}>
                    <i className="ri-bar-chart-line" style={{marginRight:8,color:CLR.success}}></i>Récapitulatif Paie
                </div>
                <div style={{padding:20}}>
                    <div className="row g-3">
                        <div className="col-6 col-md-3"><KpiCard icon="ri-calendar-check-line" label="Jours travaillés" value={nb_jours_job} unit="j" color={CLR.primary}/></div>
                        <div className="col-6 col-md-3"><KpiCard icon="ri-calendar-line" label="Jours d'absence" value={nb_jour_abs} unit="j" color={CLR.danger}/></div>
                        <div className="col-6 col-md-3"><KpiCard icon="ri-money-dollar-box-line" label="Acompte" value={accompte?.toLocaleString('fr-FR')} unit="FCFA" color={CLR.success}/></div>
                        <div className="col-6 col-md-3"><KpiCard icon="ri-moon-line" label="Prime Nuit" value={prime_nuit} unit="j" color={CLR.info}/></div>
                        <div className="col-6 col-md-4"><KpiCard icon="ri-time-line" label="H. Sup 15%" value={heure_sup_15} unit="h" color={CLR.warning}/></div>
                        <div className="col-6 col-md-4"><KpiCard icon="ri-time-line" label="H. Sup 50%" value={heure_sup_50} unit="h" color={CLR.warning}/></div>
                        <div className="col-6 col-md-4"><KpiCard icon="ri-time-line" label="H. Sup 75%" value={heure_sup_75} unit="h" color={CLR.warning}/></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MutationDetail;