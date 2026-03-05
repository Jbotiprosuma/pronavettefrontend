import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../axios';
import moment from 'moment';

const CLR = { primary:'#405189', success:'#0ab39c', warning:'#f7b84b', danger:'#f06548', info:'#299cdb', secondary:'#878a99' };

const calculerJoursTravailles = (periodeAt, departAt) => {
    if (!periodeAt) return 0;
    const [year, month] = periodeAt.split('-').map(Number);
    const totalJoursMois = 30;
    if (departAt) {
        const dateDepart = new Date(departAt);
        if (dateDepart.getFullYear() === year && (dateDepart.getMonth() + 1) === month) {
            return Math.min(dateDepart.getDate(), totalJoursMois);
        }
    }
    return totalJoursMois;
};

const initialState = {
    service_old_id:'', service_new_id:'', navette_id:'', navette_ligne_id:'',
    nb_jours_job:0, nb_jour_abs:0, accompte:0, prime_nuit:0,
    heure_sup_15:0, heure_sup_50:0, heure_sup_75:0, is_cadre:0,
    periode_at:'', depart_at:'', arrivee_at:'', _base_jours:30,
};

const MutationEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(initialState);
    const [mutation, setMutation] = useState(null);
    const [refData, setRefData] = useState({ services:[], navettes:[] });
    const [navetteLignes, setNavetteLignes] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [mR,sR,nR] = await Promise.all([api.get(`/mutations/${id}`),api.get('/services'),api.get('/navettes')]);
                const d = mR.data.data;
                if(d.status!=='En attente') {
                    Swal.fire({icon:'warning',title:'Modification impossible',text:`Statut "${d.status}" ne peut plus être modifié.`,confirmButtonText:'OK'});
                    navigate('/mutations'); return;
                }
                setMutation(d);
                setFormData({
                    ...d,
                    depart_at: d.depart_at?moment(d.depart_at).format('YYYY-MM-DD'):'',
                    arrivee_at: d.arrivee_at?moment(d.arrivee_at).format('YYYY-MM-DD'):'',
                    periode_at: d.periode_at?moment(d.periode_at).format('YYYY-MM'):'',
                    navette_id: d.navette_id||'', navette_ligne_id: d.navette_ligne_id||'',
                    is_cadre: d.is_cadre?1:0, _base_jours: d.nb_jours_job||30,
                });
                setRefData({ services:sR.data.data, navettes:nR.data.data });
                if(d.navette_id) { const n=nR.data.data.find(x=>x.id===d.navette_id); setNavetteLignes(n?.navetteLignes||[]); }
            } catch { Swal.fire('Erreur','Impossible de charger.','error'); navigate('/mutations'); }
            finally { setLoading(false); }
        };
        fetch();
    }, [id, navigate]);

    useEffect(() => {
        if(formData.navette_id) { const n=refData.navettes.find(x=>x.id===formData.navette_id); setNavetteLignes(n?.navetteLignes||[]); }
        else setNavetteLignes([]);
    }, [formData.navette_id, refData.navettes]);

    useEffect(() => {
        if(!formData.periode_at||!mutation) return;
        const pi=formData.periode_at, soId=mutation.service_old_id, eId=mutation.employer_id;
        const nm=refData.navettes.find(n=>String(n.service_id)===String(soId)&&n.periode_at?.substring(0,7)===pi);
        if(nm) {
            const ls=nm.navetteLignes||[]; const lm=ls.find(l=>String(l.employer_id)===String(eId));
            const bj=calculerJoursTravailles(pi,formData.depart_at);
            if(lm) { const abs=lm.nb_jour_abs||0; setNavetteLignes(ls); setFormData(p=>({...p,navette_id:nm.id,navette_ligne_id:lm.id,_base_jours:lm.nb_jours||bj,nb_jours_job:Math.max(0,(lm.nb_jours||bj)-abs),nb_jour_abs:abs,accompte:lm.accompte||0,prime_nuit:lm.prime_nuit||0,heure_sup_15:lm.heure_sup_15||0,heure_sup_50:lm.heure_sup_50||0,heure_sup_75:lm.heure_sup_75||0})); }
            else { setNavetteLignes(ls); setFormData(p=>({...p,navette_id:nm.id,navette_ligne_id:null,_base_jours:bj,nb_jours_job:bj})); }
        } else {
            const bj=calculerJoursTravailles(pi,formData.depart_at); setNavetteLignes([]);
            setFormData(p=>({...p,navette_id:null,navette_ligne_id:null,_base_jours:bj,nb_jours_job:Math.max(0,bj-(parseInt(p.nb_jour_abs)||0))}));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.periode_at]);

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        const nv = type==='checkbox'?(checked?1:0):value;
        setFormData(p => {
            const u = {...p,[name]:nv};
            if(name==='depart_at'&&!p.navette_ligne_id) { const b=calculerJoursTravailles(p.periode_at,nv); u._base_jours=b; u.nb_jours_job=Math.max(0,b-(parseInt(p.nb_jour_abs)||0)); }
            if(name==='nb_jour_abs') { u.nb_jours_job=Math.max(0,(p._base_jours||30)-(parseInt(nv)||0)); }
            return u;
        });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if(!formData.service_new_id||!formData.periode_at) { Swal.fire('Champs manquants','Veuillez renseigner le nouveau service et la période.','warning'); return; }
        setSaving(true);
        try {
            await api.put(`/mutations/${id}`, {
                ...formData,
                navette_id:formData.navette_id===""?null:parseInt(formData.navette_id),
                navette_ligne_id:formData.navette_ligne_id===""?null:parseInt(formData.navette_ligne_id),
                nb_jours_job:formData.nb_jours_job||0, nb_jour_abs:formData.nb_jour_abs||0,
                accompte:formData.accompte||0, prime_nuit:formData.prime_nuit||0,
                heure_sup_15:formData.heure_sup_15||0, heure_sup_50:formData.heure_sup_50||0, heure_sup_75:formData.heure_sup_75||0,
            });
            Swal.fire('Succès','Mutation mise à jour.','success'); navigate('/mutations');
        } catch(err) { Swal.fire('Erreur',err.response?.data?.message||'Erreur.','error'); }
        finally { setSaving(false); }
    };

    if(loading) return <div style={{textAlign:'center',padding:80}}><div className="spinner-border text-primary"></div><p style={{color:'#878a99',marginTop:16,fontSize:14}}>Chargement...</p></div>;
    if(!mutation) return null;

    const emp = mutation.employer||{};
    const oldSvc = refData.services.find(s=>s.id===mutation.service_old_id)?.name||'N/A';
    const initials = (emp.prenom?.[0]||'')+(emp.nom?.[0]||'');
    const inputS = { width:'100%', border:'1.5px solid #e9ebec', borderRadius:10, padding:'10px 14px', fontSize:13, outline:'none', transition:'border .2s', background:'#fff' };
    const labelS = { fontSize:12, fontWeight:600, color:'#495057', marginBottom:6, display:'block' };
    const focus = e=>e.target.style.borderColor=CLR.primary;
    const blur = e=>e.target.style.borderColor='#e9ebec';

    return (
        <div>
            {/* HERO */}
            <div style={{background:'linear-gradient(135deg,#405189 0%,#2e3a5f 50%,#0ab39c 100%)',borderRadius:16,padding:'32px 36px',marginBottom:28,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)'}}/>
                <div style={{position:'relative',zIndex:1}}>
                    <button onClick={()=>navigate('/mutations')} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontWeight:600,fontSize:13,marginBottom:14,display:'inline-flex',alignItems:'center',gap:6}}>
                        <i className="ri-arrow-left-line"></i> Retour
                    </button>
                    <div style={{display:'flex',alignItems:'center',gap:16}}>
                        <div style={{width:56,height:56,borderRadius:14,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:22,fontWeight:700}}>{initials}</div>
                        <div>
                            <h2 style={{color:'#fff',margin:0,fontSize:24,fontWeight:700}}>Modifier la mutation #{id}</h2>
                            <p style={{color:'rgba(255,255,255,.75)',margin:'4px 0 0',fontSize:14}}>{emp.prenom} {emp.nom} &bull; {emp.matricule}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
                <div className="row g-4">
                    {/* Left: Mouvement */}
                    <div className="col-lg-5">
                        <div style={{background:'#fff',borderRadius:14,boxShadow:'0 2px 12px rgba(0,0,0,.06)',overflow:'hidden'}}>
                            <div style={{padding:'14px 20px',borderBottom:'1px solid #f3f3f9',fontWeight:700,fontSize:14,color:'#495057'}}>
                                <i className="ri-arrow-left-right-line" style={{marginRight:8,color:CLR.primary}}></i>Mouvement & Période
                            </div>
                            <div style={{padding:20}}>
                                <div style={{marginBottom:16}}>
                                    <label style={labelS}>Ancien Service</label>
                                    <input type="text" value={oldSvc} disabled style={{...inputS,background:'#f8f9fa',color:'#878a99'}}/>
                                </div>
                                <div style={{marginBottom:16}}>
                                    <label style={labelS}>Nouveau Service <span style={{color:CLR.danger}}>*</span></label>
                                    <select name="service_new_id" value={formData.service_new_id} onChange={handleChange} required style={inputS} onFocus={focus} onBlur={blur}>
                                        <option value="">Sélectionner...</option>
                                        {refData.services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div style={{marginBottom:16}}>
                                    <label style={labelS}>Période <span style={{color:CLR.danger}}>*</span></label>
                                    <input type="month" name="periode_at" value={formData.periode_at} onChange={handleChange} required style={inputS} onFocus={focus} onBlur={blur}/>
                                </div>
                                <div className="row g-3">
                                    <div className="col-6">
                                        <label style={labelS}>Date de départ</label>
                                        <input type="date" name="depart_at" value={formData.depart_at} onChange={handleChange} style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                    <div className="col-6">
                                        <label style={labelS}>Date d'arrivée</label>
                                        <input type="date" name="arrivee_at" value={formData.arrivee_at} onChange={handleChange} style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Paie */}
                    <div className="col-lg-7">
                        <div style={{background:'#fff',borderRadius:14,boxShadow:'0 2px 12px rgba(0,0,0,.06)',overflow:'hidden'}}>
                            <div style={{padding:'14px 20px',borderBottom:'1px solid #f3f3f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                <span style={{fontWeight:700,fontSize:14,color:'#495057'}}>
                                    <i className="ri-bar-chart-line" style={{marginRight:8,color:CLR.success}}></i>Détails Navette & Paie
                                </span>
                                <div style={{display:'flex',gap:8}}>
                                    {formData.navette_id && <span style={{background:`${CLR.success}12`,color:CLR.success,borderRadius:8,padding:'2px 10px',fontSize:11,fontWeight:600}}>Navette auto</span>}
                                    {formData.navette_ligne_id && <span style={{background:`${CLR.success}12`,color:CLR.success,borderRadius:8,padding:'2px 10px',fontSize:11,fontWeight:600}}>Ligne préremplie</span>}
                                </div>
                            </div>
                            <div style={{padding:20}}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label style={labelS}>Navette</label>
                                        <select value={formData.navette_id||''} disabled style={{...inputS,background:'#f8f9fa'}}>
                                            <option value="">Aucune navette</option>
                                            {refData.navettes.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label style={labelS}>Ligne de Navette</label>
                                        <select value={formData.navette_ligne_id||''} disabled style={{...inputS,background:'#f8f9fa'}}>
                                            <option value="">Aucune ligne</option>
                                            {navetteLignes.map(l=><option key={l.id} value={l.id}>{l.employer?`${l.employer.matricule} - ${l.employer.nom} ${l.employer.prenom}`:`Ligne #${l.id}`} ({l.nb_jours||30}j)</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label style={labelS}>Jours travaillés <span style={{fontSize:10,color:'#878a99'}}>({formData._base_jours||30} - {formData.nb_jour_abs||0} abs)</span></label>
                                        <input type="number" name="nb_jours_job" value={formData.nb_jours_job} readOnly style={{...inputS,background:'#f8f9fa'}}/>
                                    </div>
                                    <div className="col-md-4">
                                        <label style={labelS}>Jours d'absence</label>
                                        <input type="number" name="nb_jour_abs" value={formData.nb_jour_abs} onChange={handleChange} min="0" max={formData._base_jours||30} style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                    <div className="col-md-4">
                                        <label style={labelS}>Acompte (FCFA)</label>
                                        <input type="number" name="accompte" value={formData.accompte} onChange={handleChange} min="0" style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                    <div className="col-md-4">
                                        <label style={labelS}>Prime Nuit (jours)</label>
                                        <input type="number" name="prime_nuit" value={formData.prime_nuit} onChange={handleChange} min="0" style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                    <div className="col-md-4">
                                        <label style={labelS}>H. Sup 15%</label>
                                        <input type="number" name="heure_sup_15" value={formData.heure_sup_15} onChange={handleChange} min="0" style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                    <div className="col-md-4">
                                        <label style={labelS}>H. Sup 50%</label>
                                        <input type="number" name="heure_sup_50" value={formData.heure_sup_50} onChange={handleChange} min="0" style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                    <div className="col-md-4">
                                        <label style={labelS}>H. Sup 75%</label>
                                        <input type="number" name="heure_sup_75" value={formData.heure_sup_75} onChange={handleChange} min="0" style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                    <div className="col-md-4">
                                        <label style={{...labelS,display:'flex',alignItems:'center',gap:8,marginTop:6,cursor:'pointer'}}>
                                            <input type="checkbox" name="is_cadre" checked={formData.is_cadre===1} onChange={handleChange} style={{width:18,height:18,accentColor:CLR.primary}}/>
                                            <span>Est cadre</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit bar */}
                <div style={{background:'#fff',borderRadius:14,padding:'16px 22px',marginTop:24,boxShadow:'0 2px 12px rgba(0,0,0,.06)',display:'flex',justifyContent:'flex-end',gap:10}}>
                    <button type="button" onClick={()=>navigate('/mutations')} style={{background:'#f3f3f9',color:'#495057',border:'none',borderRadius:10,padding:'10px 20px',fontWeight:600,fontSize:13,cursor:'pointer'}}>
                        Annuler
                    </button>
                    <button type="submit" disabled={saving||!formData.service_new_id||!formData.periode_at} style={{background:CLR.primary,color:'#fff',border:'none',borderRadius:10,padding:'10px 24px',fontWeight:600,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:8,opacity:(saving||!formData.service_new_id||!formData.periode_at)?.6:1}}>
                        {saving?<span className="spinner-border spinner-border-sm"></span>:<i className="ri-save-line"></i>}
                        Enregistrer
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MutationEdit;