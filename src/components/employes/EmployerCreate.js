// frontend/src/components/employes/EmployerCreate.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../axios';
import Swal from 'sweetalert2';

const EmployerCreate = () => {
    const navigate = useNavigate();

    // État initial du formulaire pour la création (tous les champs sont vides)
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        matricule: '', // Obligatoire
        email: '',
        service_id: '',
        poste_occupe: '',
        is_cadre: false,
        genre: 'Homme',
        date_embauche: '',
        date_depart: '',
        type_depart: '',
    });
    const [loading, setLoading] = useState(false); // Pour l'état de soumission
    const [initialLoading, setInitialLoading] = useState(true); // Pour le chargement des services
    const [services, setServices] = useState([]);

    // --- Chargement de la liste des services ---
    useEffect(() => {
        const fetchServices = async () => {
            try {
                // Charger la liste des services pour la liste déroulante
                const servicesResponse = await api.get('/services');
                setServices(servicesResponse.data.data);
            } catch (error) {
                console.error("Erreur lors du chargement des services :", error);
                Swal.fire('Erreur', "Impossible de charger la liste des services.", 'error');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchServices();
    }, []);

    // --- Gestion des changements de formulaire ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            // Gérer la case à cocher 'is_cadre' (boolean)
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // --- Gestion de la soumission du formulaire (Création) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Requête POST vers la nouvelle route de création
            await api.post('/employes', formData);

            Swal.fire('Créé !', 'Le nouvel employé a été créé avec succès.', 'success');

            // Redirection vers la vue de détail (en utilisant le slug de la réponse)
            navigate(`/employes`);

        } catch (error) {
            console.error("Erreur lors de la création :", error);
            const errorMessage = error.response?.data?.message || "Erreur lors de la création de l'employé.";
            Swal.fire('Erreur', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div>Chargement des listes de données...</div>;
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Création d'un nouvel Employé</h3>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    {/* Groupe MATRICULE et EMAIL */}
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label className="form-label">Matricule <span className="text-danger">*</span></label>
                            <input type="text" name="matricule" value={formData.matricule} onChange={handleChange} className="form-control" required />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" />
                        </div>
                    </div>

                    {/* Groupe NOM et PRÉNOM */}
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label className="form-label">Nom <span className="text-danger">*</span></label>
                            <input type="text" name="nom" value={formData.nom} onChange={handleChange} className="form-control" required />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Prénom <span className="text-danger">*</span></label>
                            <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} className="form-control" required />
                        </div>
                    </div>

                    {/* Groupe SERVICE et POSTE */}
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label className="form-label">Service</label>
                            <select name="service_id" value={formData.service_id} onChange={handleChange} className="form-select">
                                <option value="">Sélectionnez un service</option>
                                {services.map(service => (
                                    <option key={service.id} value={service.id}>{service.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Poste Occupé</label>
                            <input type="text" name="poste_occupe" value={formData.poste_occupe} onChange={handleChange} className="form-control" />
                        </div>
                    </div>

                    {/* Groupe CADRE et GENRE */}
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <div className="form-check mt-4">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="is_cadre"
                                    checked={formData.is_cadre}
                                    onChange={handleChange}
                                    id="isCadreCheck"
                                />
                                <label className="form-check-label" htmlFor="isCadreCheck">
                                    Est Cadre
                                </label>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Genre</label>
                            <select name="genre" value={formData.genre} onChange={handleChange} className="form-select">
                                <option value="Homme">Homme</option>
                                <option value="Femme">Femme</option>
                            </select>
                        </div>
                    </div>

                    {/* Groupe Dates et Type de Départ */}
                    <div className="row mb-3">
                        <div className="col-md-4">
                            <label className="form-label">Date d'Embauche</label>
                            <input type="date" name="date_embauche" value={formData.date_embauche} onChange={handleChange} className="form-control" />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Date de Départ</label>
                            <input type="date" name="date_depart" value={formData.date_depart} onChange={handleChange} className="form-control" />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Type de Départ</label>
                            <select name="type_depart" value={formData.type_depart} onChange={handleChange} className="form-select">
                                <option value="">—</option>
                                <option value="DEMISSION">DEMISSION</option>
                                <option value="RETRAITE">RETRAITE</option>
                                <option value="DECES">DÉCÈS</option>
                                <option value="LICENCIEMENT">LICENCIEMENT</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-success mt-4" disabled={loading}>
                        {loading ? 'Création...' : 'Créer l\'employé'}
                    </button>
                    <button type="button" className="btn btn-secondary mt-4 ms-2" onClick={() => navigate(-1)}>
                        Annuler
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EmployerCreate;