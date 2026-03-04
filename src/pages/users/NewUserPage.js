import React, { useState, useEffect } from 'react';
import api from '../../axios';
import { useNavigate, NavLink } from 'react-router-dom';
import Loading from '../../components/base/Loading';
import AlertMessages from '../../components/base/AlertMessages';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';

const NewUserPage = () => {
    const { user: currentUser } = useAuth();
    const [services, setServices] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nom: "",
        prenom: "",
        genre: "Homme",
        username: "",
        email: "",
        mail: "",
        role_id: "",
        service_id: "",
        is_representant: false,
        is_importer: false,
        is_paie: false,
        is_manager: false,
        is_admin: false,
        is_superadmin: false,
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const rolesResponse = await api.get('roles');
                const servicesResponse = await api.get('services');
                setRoles(rolesResponse.data.data);
                setServices(servicesResponse.data.data);
                setLoading(false);
            } catch (err) {
                console.error('Erreur lors de la récupération des données initiales :', err);
                setError('Impossible de charger les données nécessaires. Veuillez réessayer.');
                setLoading(false);
                navigate('/login');
            }
        };
        fetchData();
    }, [navigate]);

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setFormErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const getFilteredRoles = () => {
        if (currentUser?.is_sup === true) {
            return roles;
        } else if (currentUser?.is_superadmin === true) {
            return roles.filter(role => role.name !== 'superadmin');
        } else if (currentUser?.is_admin === true) {
            return roles.filter(role => role.name !== 'superadmin' && role.name !== 'admin');
        }
        return [];
    };

    const filteredRoles = getFilteredRoles();

    // Gère le changement du rôle pour mettre à jour les flags de permissions
    const handleRoleChange = e => {
        const selectedRole_id = e.target.value;
        const selectedRole = roles.find(role => role.id === Number(selectedRole_id));

        const flags = {
            is_representant: false,
            is_importer: false,
            is_paie: false,
            is_manager: false,
            is_admin: false,
            is_superadmin: false,
        };

        if (selectedRole) {
            // Mettre à jour les flags en fonction du slug du rôle sélectionné
            switch (selectedRole.slug) {
                case "representant":
                    flags.is_representant = true;
                    break;
                case "importer":
                    flags.is_importer = true;
                    break;
                 case "paie":
                    flags.is_paie = true;
                    break;
                case "manager":
                    flags.is_manager = true;
                    break;
                case "admin":
                    flags.is_admin = true;
                    break;
                case "superadmin":
                    flags.is_superadmin = true;
                    break;
                default:
                    break;
            }
        }

        setForm(prev => ({
            ...prev,
            role_id: selectedRole_id, // Stocke l'ID du rôle
            role: selectedRole ? selectedRole.slug : "", // Stocke le slug du rôle
            ...flags, // Applique les flags de permissions
        }));
        setFormErrors(prev => ({ ...prev, role_id: undefined })); // Efface l'erreur pour le rôle
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setFormErrors({});
        setAlert(null); // Réinitialiser les messages d'alerte
        setError(null); // Réinitialiser les messages d'erreur
        setLoading(true);
        try {
            const response = await api.post("/users", form);
            const status = response.data.status;
            const message = response.data.message;
            console.log(status);
            if (status === true) {
                setAlert({ type: 'success', message: 'Utilisateur créé avec succès !' });
                setForm({
                    nom: "",
                    prenom: "",
                    genre: "Homme",
                    username: "",
                    email: "",
                    mail: "",
                    role_id: "",
                    service_id: "",
                    is_representant: false,
                    is_importer: false,
                    is_paie: false,
                    is_manager: false,
                    is_admin: false,
                    is_superadmin: false,
                });
                navigate('/utilisateurs');
            } else {
                setError(message);
            }
            setLoading(false);

        } catch (err) {
            setLoading(false);

            console.error('Erreur lors de la création de l\'utilisateur :', err);
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
                setError('Veuillez corriger les erreurs dans le formulaire.');
            } else {
                setError('Une erreur est survenue lors de la création de l\'utilisateur.', err.message);
            }
        }
    };

    if (loading) {
        return <Loading loading={true} />;
    }

    return (
        <Layout>
                            {/* <!-- start page title --> */}
                            <div className="row">
                                <div className="col-12">
                                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                        <h4 className="mb-sm-0">Création d'un nouvel utilisateur</h4>
                                        <div className="page-title-right">
                                            <ol className="breadcrumb m-0">
                                                <li className="breadcrumb-item"><a href="/dashboard">Tableau de bord</a></li>
                                                <li className="breadcrumb-item"><NavLink to="/utilisateurs">Liste des utilisateurs</NavLink></li>
                                                <li className="breadcrumb-item active">Nouvel utilisateur</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* <!-- end page title --> */}

                            <AlertMessages alert={alert} setAlert={setAlert} />
                            {error && <AlertMessages alert={{ type: 'danger', message: error }} setAlert={setError} />}

                            <div className="row">
                                <div className="col-lg-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <h4 className="card-title mb-0 flex-grow-1">Formulaire de création d'utilisateur</h4>
                                        </div>
                                        <div className="card-body">
                                            <form onSubmit={handleSubmit} className="row g-3"> {/* g-3 pour les marges entre colonnes */}

                                                <div className="col-md-6">
                                                    <label htmlFor="nom" className="form-label">Nom <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        name="nom"
                                                        id="nom"
                                                        value={form.nom}
                                                        onChange={handleChange}
                                                        className={`form-control ${formErrors.nom ? 'is-invalid' : ''}`}
                                                    />
                                                    {formErrors.nom && <div className="invalid-feedback">{formErrors.nom[0]}</div>}
                                                </div>

                                                <div className="col-md-6">
                                                    <label htmlFor="prenom" className="form-label">Prénom <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        name="prenom"
                                                        id="prenom"
                                                        value={form.prenom}
                                                        onChange={handleChange}
                                                        className={`form-control ${formErrors.prenom ? 'is-invalid' : ''}`}
                                                    />
                                                    {formErrors.prenom && <div className="invalid-feedback">{formErrors.prenom[0]}</div>}
                                                </div>

                                                <div className="col-md-6">
                                                    <label htmlFor="genre" className="form-label">Genre <span className="text-danger">*</span></label>
                                                    <select
                                                        name="genre"
                                                        id="genre"
                                                        value={form.genre}
                                                        onChange={handleChange}
                                                        className="form-select"
                                                    >
                                                        <option value="Homme">Homme</option>
                                                        <option value="Femme">Femme</option>
                                                    </select>
                                                </div>

                                                <div className="col-md-6">
                                                    <label htmlFor="username" className="form-label">Nom d'utilisateur <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        name="username"
                                                        id="username"
                                                        value={form.username}
                                                        onChange={handleChange}
                                                        className={`form-control ${formErrors.username ? 'is-invalid' : ''}`}
                                                    />
                                                    {formErrors.username && <div className="invalid-feedback">{formErrors.username[0]}</div>}
                                                </div>

                                                <div className="col-md-6">
                                                    <label htmlFor="email" className="form-label">Adresse Email  <span className="text-danger">*</span></label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        id="email"
                                                        value={form.email}
                                                        onChange={handleChange}
                                                        className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                                                    />
                                                    {formErrors.email && <div className="invalid-feedback">{formErrors.email[0]}</div>}
                                                </div>

                                                <div className="col-md-6">
                                                    <label htmlFor="mail" className="form-label">Boite Email <span className="text-danger">*</span></label>
                                                    <input
                                                        type="email"
                                                        name="mail"
                                                        id="mail"
                                                        value={form.mail}
                                                        onChange={handleChange}
                                                        className={`form-control ${formErrors.mail ? 'is-invalid' : ''}`}
                                                    />
                                                    {formErrors.mail && <div className="invalid-feedback">{formErrors.mail[0]}</div>}
                                                </div>


                                                {/* Champ de sélection du Rôle (maintenant un select) */}
                                                <div className="col-md-6">
                                                    <label htmlFor="role_id" className="form-label">Rôle <span className="text-danger">*</span></label>
                                                    <select
                                                        name="role_id"
                                                        id="role_id"
                                                        value={form.role_id}
                                                        onChange={handleRoleChange}
                                                        className={`form-select ${formErrors.role_id ? 'is-invalid' : ''}`}
                                                    >
                                                        <option value="">-- Sélectionner un rôle --</option>
                                                        {filteredRoles.map(role => (
                                                            <option key={role.id} value={role.id}>
                                                                {role.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formErrors.role_id && <div className="invalid-feedback">{formErrors.role_id[0]}</div>}
                                                </div>

                                                {/* Champ de sélection du Service */}
                                                <div className="col-md-6">
                                                    <label htmlFor="service_id" className="form-label">Service <span className="text-danger">*</span></label>
                                                    <select
                                                        name="service_id"
                                                        id="service_id"
                                                        value={form.service_id}
                                                        onChange={handleChange}
                                                        className={`form-select ${formErrors.service_id ? 'is-invalid' : ''}`}
                                                    >
                                                        <option value="">-- Sélectionner un service --</option>
                                                        {services.map(service => (
                                                            <option key={service.id} value={service.id}>
                                                                {service.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formErrors.service_id && <div className="invalid-feedback">{formErrors.service_id[0]}</div>}
                                                </div>
                                                {/* Section des fonctions (permissions) */}
                                                <div className="col-12 mb-3">
                                                    <h5>Fonctions </h5>
                                                    <div className="row">
                                                        {[
                                                            { name: 'is_representant', label: 'Representant' },
                                                            { name: 'is_importer', label: 'Importeur' },
                                                            { name: 'is_paie', label: 'comptabilité paie' },
                                                            { name: 'is_manager', label: 'Manager' },
                                                            { name: 'is_admin', label: 'Administrateur' },
                                                            { name: 'is_superadmin', label: 'Super administrateur' },
                                                        ].map((func) => (
                                                            <div className="col-md-3 col-sm-6" key={func.name}>
                                                                <div className="form-check form-switch mb-2">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={func.name}
                                                                        name={func.name}
                                                                        checked={form[func.name]}
                                                                        onChange={handleChange}
                                                                        disabled={true}
                                                                    />
                                                                    <label className="form-check-label" htmlFor={func.name}>{func.label}</label>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="col-12 mt-4">
                                                    <button type="submit" className="btn btn-primary">Créer l'utilisateur</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
        </Layout>
    );
};

export default NewUserPage;
