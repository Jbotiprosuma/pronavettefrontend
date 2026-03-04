import React, { useState, useEffect } from 'react';
import api from '../../axios';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
import Loading from '../../components/base/Loading';
import AlertMessages from '../../components/base/AlertMessages';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';

const EditUserPage = () => {
    const { id } = useParams();
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

    // 1. Fetch initial data: roles, services
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesResponse, servicesResponse] = await Promise.all([
                    api.get('roles'),
                    api.get('services')
                ]);
                setRoles(rolesResponse.data.data);
                setServices(servicesResponse.data.data);
            } catch (err) {
                console.error('Erreur lors de la récupération des données initiales :', err);
                setError('Impossible de charger les données nécessaires. Veuillez réessayer.');
                setLoading(false);
                navigate('/login');
            }
        };
        fetchData();
    }, [navigate]);

    // 2. Fetch the specific user's data for editing AND populate the form
    useEffect(() => {
        if (id && roles.length > 0 && services.length > 0) { // Ensure roles and services are loaded
            const fetchUserData = async () => {
                try {
                    const userToEditResponse = await api.get(`users/${id}`);
                    const userData = userToEditResponse.data.data;
                    // Find the role object by ID to populate the form flags
                    const userRole = roles.find(r => r.id === userData.role_id);
                    const initialFlags = {
                        is_representant: false, is_importer: false, is_paie: false,
                        is_manager: false, is_admin: false, is_superadmin: false,
                        isAdmin: false, isSuperadmin: false,
                    };

                    if (userRole) {
                        switch (userRole.slug) {
                            case "representant": initialFlags.is_representant = true; break;
                            case "importer": initialFlags.is_importer = true; break;
                            case "paie": initialFlags.is_paie = true; break;
                            case "manager": initialFlags.is_manager = true; break;
                            case "admin": initialFlags.is_admin = true; break;
                            case "superadmin": initialFlags.is_superadmin = true; break;
                            default: break;
                        }
                    }

                    setForm({
                        nom: userData.nom || "",
                        prenom: userData.prenom || "",
                        genre: userData.genre || "Homme",
                        username: userData.username || "",
                        email: userData.email || "",
                        mail: userData.mail || "",
                        role_id: userData.role_id || "",
                        service_id: userData.service_id || "",
                        ...initialFlags
                    });
                    setLoading(false); // Only set loading to false after user data is loaded
                } catch (err) {
                    console.error('Erreur lors de la récupération de l\'utilisateur à éditer :', err);
                    setError('Impossible de charger les détails de l\'utilisateur. Veuillez réessayer.');
                    setLoading(false);
                    // Optionally navigate away if user doesn't exist or no permission
                    navigate('/utilisateurs');
                }
            };
            fetchUserData();
        }
        else if (!id) {
            navigate('/utilisateurs');
        }
    }, [id, roles, services, navigate]);

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setFormErrors(prev => ({ ...prev, [name]: undefined }));
    };

    /**
     * Filters the available roles based on the current logged-in user's permissions.
     * Uses 'name' property of the role object for filtering.
     */
    const getFilteredRoles = () => {
        if (!currentUser || !roles.length) {
            return []; // Return empty if currentUser or roles data is not yet loaded
        }

        if (currentUser.is_sup === true) {
            return roles; // 'is_sup' users can see and select ALL roles.
        } else if (currentUser.is_superadmin === true) {
            // 'is_superadmin' users can see all roles EXCEPT 'superadmin' itself.
            return roles.filter(role => role.name !== 'superadmin');
        } else if (currentUser.is_admin === true) {
            // 'is_admin' users can see all roles EXCEPT 'superadmin' AND 'admin'.
            return roles.filter(role => role.name !== 'superadmin' && role.name !== 'admin');
        }

        // For any other role, return an empty array (or specific roles they are allowed to assign)
        return [];
    };

    const filteredRoles = getFilteredRoles(); // This will re-evaluate when currentUser or roles change

    // Handles the change of the role dropdown to update permission flags for the edited user
    const handleRoleChange = e => {
        const selectedRole_id = e.target.value;
        const selectedRole = roles.find(role => role.id === Number(selectedRole_id));

        const flags = { // Reset all flags before setting new ones
            is_representant: false, is_importer: false, is_paie: false,
            is_manager: false, is_admin: false, is_superadmin: false,
        };

        if (selectedRole) {
            switch (selectedRole.slug) {
                case "representant": flags.is_representant = true; break;
                case "importer": flags.is_importer = true; break;
                case "paie": flags.is_paie = true; break;
                case "manager": flags.is_manager = true; break;
                case "admin": flags.is_admin = true; break;
                case "superadmin": flags.is_superadmin = true; break;
                default: break;
            }
        }

        setForm(prev => ({
            ...prev,
            role_id: selectedRole_id,
            role: selectedRole ? selectedRole.slug : "", // Store slug if needed by backend
            ...flags,
        }));
        setFormErrors(prev => ({ ...prev, role_id: undefined }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setFormErrors({});
        setAlert(null);
        setError(null);
        try {
            const response = await api.put(`/users/${id}`, form);
            let status = response.data.status;
            let message = response.data.message;
            if (status === true) {
                setAlert({ type: 'success', message: 'Utilisateur mis à jour avec succès !' });
                navigate('/utilisateurs');
            } else {
                setError(message);
            }
        } catch (err) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur :', err);
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
                setError('Veuillez corriger les erreurs dans le formulaire.');
            } else {
                setError('Une erreur est survenue lors de la mise à jour de l\'utilisateur. Veuillez réessayer.');
            }
        }
    };

    if (loading || !form.nom) {
        return <Loading loading={true} />;
    }

    return (
        <Layout>
                            {/* */}
                            <div className="row">
                                <div className="col-12">
                                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                        <h4 className="mb-sm-0">Édition de l'utilisateur</h4>
                                        <div className="page-title-right">
                                            <ol className="breadcrumb m-0">
                                                <li className="breadcrumb-item"><a href="/dashboard">Tableau de bord</a></li>
                                                <li className="breadcrumb-item"><NavLink to="/utilisateurs">Liste des utilisateurs</NavLink></li>
                                                <li className="breadcrumb-item active">Éditer utilisateur</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* */}

                            <AlertMessages alert={alert} setAlert={setAlert} />
                            {error && <AlertMessages alert={{ type: 'danger', message: error }} setAlert={setError} />}

                            <div className="row">
                                <div className="col-lg-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <h4 className="card-title mb-0 flex-grow-1">Formulaire d'édition d'utilisateur</h4>
                                        </div>
                                        <div className="card-body">
                                            <form onSubmit={handleSubmit} className="row g-3">

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
                                                    <label htmlFor="email" className="form-label">Email <span className="text-danger">*</span></label>
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

                                                {/* Role Selection Field (with filtering) */}
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

                                                {/* Service Selection Field */}
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

                                                {/* Functions Section (Permissions) - Keep disabled as they are derived from role_id */}
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
                                                    <button type="submit" className="btn btn-primary">Mettre à jour l'utilisateur</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
        </Layout>
    );
};

export default EditUserPage;