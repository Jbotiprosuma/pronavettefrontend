// src/components/roles/RoleForm.jsx
import React, { useState, useEffect } from 'react';

const RoleForm = ({ role, permissions, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        id: role?.id || null,
        name: role?.name || '',
        description: role?.description || '',
        permissionIds: role?.permissions?.map(p => p.id) || []
    });

    useEffect(() => {
        setFormData({
            id: role?.id || null,
            name: role?.name || '',
            description: role?.description || '',
            permissionIds: role?.permissions?.map(p => p.id) || []
        });
    }, [role, permissions]); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handlePermissionChange = (e) => {
        const permissionId = Number(e.target.value);
        const isChecked = e.target.checked;

        setFormData(prevData => {
            const newPermissionIds = isChecked
                ? [...prevData.permissionIds, permissionId]
                : prevData.permissionIds.filter(id => id !== permissionId);
            return {
                ...prevData,
                permissionIds: newPermissionIds
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="name" className="form-label">Nom du rôle</label>
                <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={role && !role.is_deletable}
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
                    disabled={role && !role.is_deletable}
                ></textarea>
            </div>
            <div className="mb-3">
                <label className="form-label">Permissions</label>
                <div className="row">
                    {permissions.map(permission => (
                        <div className="col-md-4 col-lg-3" key={permission.id}>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`permission-${permission.id}`}
                                    value={permission.id}
                                    checked={formData.permissionIds.includes(permission.id)}
                                    onChange={handlePermissionChange}
                                    // Désactiver les checkboxes si le rôle n'est pas modifiable
                                    disabled={role && !role.is_deletable}
                                />
                                <label className="form-check-label" htmlFor={`permission-${permission.id}`}>
                                    {permission.name}
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="d-flex justify-content-end gap-2">
                <button
                    type="submit"
                    className="btn btn-primary"
                    // Désactiver le bouton de soumission si le rôle n'est pas modifiable en mode édition
                    disabled={role && !role.is_deletable && formData.id}
                >
                    {formData.id ? 'Mettre à jour' : 'Créer'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Annuler
                </button>
            </div>
        </form>
    );
};

export default RoleForm;