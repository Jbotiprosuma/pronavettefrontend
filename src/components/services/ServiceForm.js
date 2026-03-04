// src/components/services/ServiceForm.jsx
import React, { useState, useEffect } from 'react';

const ServiceForm = ({ service, onSave, onCancel }) => {
    // Initialiser l'état du formulaire avec les données du service si en mode édition
    // Ou avec des valeurs vides si en mode création
    const [formData, setFormData] = useState({
        id: service?.id || null, // Garde l'ID pour les mises à jour
        name: service?.name || '',
        slug: service?.slug || '',
        description: service?.description || ''
    });

    // Mettre à jour formData si le prop 'service' change (par ex. pour passer de création à édition)
    useEffect(() => {
        setFormData({
            id: service?.id || null,
            name: service?.name || '',
            slug: service?.slug || '',
            description: service?.description || ''
        });
    }, [service]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData); // Appelle la fonction onSave du composant parent
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="name" className="form-label">Nom du service</label>
                <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                ></textarea>
            </div>
            <div className="d-flex justify-content-end gap-2">
                <button type="submit" className="btn btn-primary">
                    {formData.id ? 'Mettre à jour' : 'Créer'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Annuler
                </button>
            </div>
        </form>
    );
};

export default ServiceForm;