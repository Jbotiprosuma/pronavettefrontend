import React, { useState, useEffect } from 'react';
import api from '../../axios';
import Swal from 'sweetalert2';

const ProfileUpdateForm = ({ user, onUpdate }) => {
    // État pour gérer chaque champ de profil avec les valeurs actuelles
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        genre: '',
        email: '',
        username: '',
        service: '',
        mail: '',
        status: '',
    });

    // Charger les valeurs actuelles de l'utilisateur au montage du composant
    useEffect(() => {
        if (user) {
            setFormData({
                nom: user.nom || '',
                prenom: user.prenom || '',
                genre: user.genre || '',
                email: user.email || '',
                username: user.username || '',
                service: user.service || '',
                mail: user.mail || '',
                status: user.status || '',
            });
        }
    }, [user]);

    // Fonction pour gérer les changements de chaque champ
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Fonction pour soumettre le formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`users/${user.slug}/information`, formData);
            if (response.status === 200) {
                onUpdate(response.data);
                Swal.fire({
                    icon: 'success',
                    title: 'Information du profil mise à jour !',
                    text: 'Votre profil a été mise à jour avec succès.',
                });
            }
        } catch (error) {
            console.error("Error updating profile", error);
            Swal.fire({
                icon: 'error',
                title: 'Échec de la mise à jour',
                text: 'La mise à jour du profil a échoué. Veuillez réessayer.',
            });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="row">
                <div className="col-lg-6">
                    <div className="mb-3">
                        <label htmlFor="firstnameInput" className="form-label">Prenom(s)</label>
                        <input
                            type="text"
                            className="form-control"
                            id="firstnameInput"
                            name="prenom"
                            placeholder="Taper votre  prenom"
                            value={formData.prenom}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="col-lg-6">
                    <div className="mb-3">
                        <label htmlFor="lastnameInput" className="form-label">Nom</label>
                        <input
                            type="text"
                            className="form-control"
                            id="lastnameInput"
                            name="nom"
                            placeholder="Taper votre nom"
                            value={formData.nom}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                 <div className="col-lg-6">
                    <div className="mb-3">
                        <label htmlFor="Input" className="form-label">Genre</label>
                        <select className="form-control" name="genre" value={formData.genre || ''} onChange={handleChange}>
                            <option value="">Sélectionnez un genre</option>
                            <option value="Homme">Homme</option>
                            <option value="Femme">Femme</option>
                        </select>
                    </div>
                </div>
                <div className="col-lg-6">
                    <div className="mb-3">
                        <label htmlFor="emailInput" className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            id="emailInput"
                            name="email"
                            readOnly
                            value={formData.email}

                        />
                    </div>
                </div>
                <div className="col-lg-6">
                    <div className="mb-3">
                        <label htmlFor="usernameInput" className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            id="usernameInput"
                            name="username"
                            readOnly
                            value={formData.username}

                        />
                    </div>
                </div>
               
                <div className="col-lg-6">
                    <div className="mb-3">
                        <label htmlFor="serviceInput" className="form-label">Service</label>
                        <input
                            type="text"
                            className="form-control"
                            id="serviceInput"
                            name="service"
                            readOnly
                            value={formData.service}

                        />
                    </div>
                </div>
                <div className="col-lg-6">
                    <div className="mb-3">
                        <label htmlFor="mail" className="form-label">Boite email</label>
                        <input
                            type="text"
                            className="form-control"
                            id="mail"
                            name="mail"
                            readOnly
                            value={formData.mail}

                        />
                    </div>
                </div>
                <div className="col-lg-6">
                    <div className="mb-3">
                        <label htmlFor="usernameInput" className="form-label">Status de votre compte</label>
                        <input
                            type="text"
                            className="form-control"
                            id="usernameInput"
                            name="username"
                            readOnly
                            value={formData.status}
                        />
                    </div>
                </div>
            </div>
            <div className="hstack gap-2 justify-content-end">
                <button type="submit" className="btn btn-primary">Mèttre à jour</button>
                <button
                    type="button"
                    className="btn btn-soft-success"
                    onClick={() => setFormData({
                        nom: user.nom || '',
                        prenom: user.prenom || '',
                        genre: user.genre || '',
                        email: user.email || '',
                        username: user.username || '',
                        service: user.service || '',
                        mail: user.mail || '',
                        status: user.status || '',
                    })}
                >
                    Annuler
                </button>
            </div>
        </form>
    );
};

export default ProfileUpdateForm;
