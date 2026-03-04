// src/components/services/ServiceTable.jsx
import React from 'react';

const ServiceTable = ({ services, onDelete, onEdit, user }) => { // Ajouter onEdit
    if (!services || services.length === 0) {
        return <p>Aucun service trouvé.</p>;
    }

    // Déterminez si l'utilisateur a les permissions d'administration
    // Assurez-vous que user.is_super_admin et user.is_admin sont des nombres (1 ou 0) ou des booléens
    const canManageServices = user.role === "superadmin" || user.role === "admin";

    return (
        <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle table-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col" style={{ width: '70px' }}>ID</th>
                        <th scope="col" style={{ width: '70px' }}>Nom</th>
                        <th scope="col" style={{ width: '300px' }}>Description</th>
                        <th scope="col" style={{ width: '100px' }}>Date De Création</th>
                        {canManageServices && <th scope="col" style={{ width: '120px' }}>Action</th>}
                    </tr>
                </thead>
                <tbody>
                    {services.map((service) => (
                        <tr key={service.id}>
                            <td className="text-center" style={{ fontWeight: 700 }}>{service.id}</td>
                            <td>{service.name}</td>
                            <td>{service.description}</td>
                            <td className="text-center">{new Date(service.createdAt).toLocaleDateString()}</td>
                            {canManageServices && (
                                <td>
                                    {/* Utiliser onClick pour appeler onEdit et changer le mode du parent */}
                                    <button
                                        type="button"
                                        onClick={() => onEdit(service)}
                                        className="btn btn-primary btn-sm me-1"
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        title="Modifier"
                                    >
                                        <i className="ri-edit-box-line"></i>
                                    </button>
                                    {/* Pour "Ajouter des responsables", vous pouvez garder un Link vers une autre page si c'est une gestion complexe */}
                                    {/* Ou transformer en modal/component pour rester sur la même page */}
                                   
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() => onDelete(service.slug)}
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        title="Supprimer"
                                    >
                                        <i className="ri-delete-bin-6-line"></i>
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ServiceTable;