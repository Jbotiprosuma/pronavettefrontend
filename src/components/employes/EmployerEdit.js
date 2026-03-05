import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../axios';
import Swal from 'sweetalert2';

const CLR = { primary:'#405189', success:'#0ab39c', warning:'#f7b84b', danger:'#f06548', info:'#299cdb', secondary:'#878a99' };

const EmployerEdit = ({ user }) => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nom:'', prenom:'', matricule:'', email:'', service_id:'', poste_occupe:'',
        is_cadre:false, genre:'Homme', date_embauche:'', date_depart:'', type_depart:'',
        last_update_by: user.id,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [services, setServices] = useState([]);
    const [empName, setEmpName] = useState('');

    useEffect(() => {
        const f = async () => {
            try {
                const [eR, sR] = await Promise.all([api.get(`/employes/${slug}`), api.get('/services')]);
                const d = eR.data.data;
                setServices(sR.data.data);
                setEmpName(`${d.prenom} ${d.nom}`);
                setFormData({
                    nom:d.nom||'', prenom:d.prenom||'', matricule:d.matricule||'', email:d.email||'',
                    service_id:d.service_id||'', poste_occupe:d.poste_occupe||'', is_cadre:!!d.is_cadre,
                    genre:d.genre||'Homme',
                    date_embauche:d.date_embauche?new Date(d.date_embauche).toISOString().split('T')[0]:'',
                    date_depart:d.date_depart?new Date(d.date_depart).toISOString().split('T')[0]:'',
                    type_depart:d.type_depart||'', last_update_by:user.id,
                });
            } catch { Swal.fire('Erreur',"Impossible de charger les données.",'error'); navigate('/employes'); }
            finally { setLoading(false); }
        }; f();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug, navigate]);

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setFormData(p=>({...p, [name]: type==='checkbox'?checked:value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/employes/${slug}`, formData);
            Swal.fire('Succès !','Les informations ont été mises à jour.','success');
            navigate('/employes');
        } catch(err) { Swal.fire('Erreur',err.response?.data?.message||'Erreur.','error'); }
        finally { setSaving(false); }
    };

    if(loading) return <div style={{textAlign:'center',padding:80}}><div className="spinner-border text-primary"></div><p style={{color:'#878a99',marginTop:16,fontSize:14}}>Chargement...</p></div>;

    const initials = (formData.prenom?.[0]||'')+(formData.nom?.[0]||'');
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
                    <button onClick={()=>navigate('/employes')} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontWeight:600,fontSize:13,marginBottom:14,display:'inline-flex',alignItems:'center',gap:6}}>
                        <i className="ri-arrow-left-line"></i> Retour
                    </button>
                    <div style={{display:'flex',alignItems:'center',gap:16}}>
                        <div style={{width:56,height:56,borderRadius:14,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:22,fontWeight:700}}>{initials}</div>
                        <div>
                            <h2 style={{color:'#fff',margin:0,fontSize:24,fontWeight:700}}>Modifier l'employé</h2>
                            <p style={{color:'rgba(255,255,255,.75)',margin:'4px 0 0',fontSize:14}}>{empName} &bull; {formData.matricule}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
                <div className="row g-4">
                    {/* Identité */}
                    <div className="col-lg-6">
                        <div style={{background:'#fff',borderRadius:14,boxShadow:'0 2px 12px rgba(0,0,0,.06)',overflow:'hidden'}}>
                            <div style={{padding:'14px 20px',borderBottom:'1px solid #f3f3f9',fontWeight:700,fontSize:14,color:'#495057'}}>
                                <i className="ri-user-line" style={{marginRight:8,color:CLR.primary}}></i>Identité
                            </div>
                            <div style={{padding:20}}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label style={labelS}>Nom <span style={{color:CLR.danger}}>*</span></label>
                                        <input type="text" name="nom" value={formData.nom} onChange={handleChange} required style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                    <div className="col-md-6">
                                        <label style={labelS}>Prénom <span style={{color:CLR.danger}}>*</span></label>
                                        <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} required style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                    <div className="col-md-6">
                                        <label style={labelS}>Matricule</label>
                                        <input type="text" name="matricule" value={formData.matricule} disabled style={{...inputS,background:'#f8f9fa',color:'#878a99'}}/>
                                    </div>
                                    <div className="col-md-6">
                                        <label style={labelS}>Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                    <div className="col-md-6">
                                        <label style={labelS}>Genre</label>
                                        <select name="genre" value={formData.genre} onChange={handleChange} style={inputS}>
                                            <option value="Homme">Homme</option>
                                            <option value="Femme">Femme</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label style={{...labelS,display:'flex',alignItems:'center',gap:8,marginTop:20,cursor:'pointer'}}>
                                            <input type="checkbox" name="is_cadre" checked={formData.is_cadre} onChange={handleChange} style={{width:18,height:18,accentColor:CLR.primary}}/>
                                            <span>Est Cadre</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Professionnel */}
                    <div className="col-lg-6">
                        <div style={{background:'#fff',borderRadius:14,boxShadow:'0 2px 12px rgba(0,0,0,.06)',overflow:'hidden'}}>
                            <div style={{padding:'14px 20px',borderBottom:'1px solid #f3f3f9',fontWeight:700,fontSize:14,color:'#495057'}}>
                                <i className="ri-briefcase-line" style={{marginRight:8,color:CLR.info}}></i>Professionnel
                            </div>
                            <div style={{padding:20}}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label style={labelS}>Service</label>
                                        <select name="service_id" value={formData.service_id} onChange={handleChange} style={inputS} onFocus={focus} onBlur={blur}>
                                            <option value="">Sélectionner</option>
                                            {services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label style={labelS}>Poste occupé</label>
                                        <input type="text" name="poste_occupe" value={formData.poste_occupe} onChange={handleChange} style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                    <div className="col-md-4">
                                        <label style={labelS}>Date d'embauche</label>
                                        <input type="date" name="date_embauche" value={formData.date_embauche} onChange={handleChange} style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                    <div className="col-md-4">
                                        <label style={labelS}>Date de départ</label>
                                        <input type="date" name="date_depart" value={formData.date_depart} onChange={handleChange} style={inputS} onFocus={focus} onBlur={blur}/>
                                    </div>
                                    <div className="col-md-4">
                                        <label style={labelS}>Type de départ</label>
                                        <select name="type_depart" value={formData.type_depart} onChange={handleChange} style={inputS}>
                                            <option value="">--</option>
                                            <option value="DEMISSION">DEMISSION</option>
                                            <option value="RETRAITE">RETRAITE</option>
                                            <option value="DECES">D\u00c9C\u00c8S</option>
                                            <option value="LICENCIEMENT">LICENCIEMENT</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit bar */}
                <div style={{background:'#fff',borderRadius:14,padding:'16px 22px',marginTop:24,boxShadow:'0 2px 12px rgba(0,0,0,.06)',display:'flex',justifyContent:'flex-end',gap:10}}>
                    <button type="button" onClick={()=>navigate(-1)} style={{background:'#f3f3f9',color:'#495057',border:'none',borderRadius:10,padding:'10px 20px',fontWeight:600,fontSize:13,cursor:'pointer'}}>
                        Annuler
                    </button>
                    <button type="submit" disabled={saving} style={{background:CLR.primary,color:'#fff',border:'none',borderRadius:10,padding:'10px 24px',fontWeight:600,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:8,opacity:saving?.7:1}}>
                        {saving?<span className="spinner-border spinner-border-sm"></span>:<i className="ri-save-line"></i>}
                        Sauvegarder
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmployerEdit;