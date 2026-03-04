// src/components/roles/RoleTable.jsx
import React from 'react';

const RoleTable = ({ roles, onDelete, onEdit, user }) => {
    if (!roles || roles.length === 0) {
        return <p>Aucun rôle trouvé.</p>;
    }

    const canManageRoles = user && (user.role === "superadmin" || user.role === "admin");

    return (
        <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle table-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col" style={{ width: '70px' }}>ID</th>
                        <th scope="col" style={{ width: '100px' }}>Nom</th>
                        <th scope="col" style={{ width: '200px' }}>Description</th>
                        <th scope="col" style={{ width: '150px' }}>Permissions</th>
                        <th scope="col" style={{ width: '100px' }}>Modifiable</th>
                        <th scope="col" style={{ width: '100px' }}>Date de Création</th>
                        {canManageRoles && <th scope="col" style={{ width: '120px' }}>Action</th>}
                    </tr>
                </thead>
                <tbody>
                    {roles.map((role) => (
                        <tr key={role.id}>
                            <td className="text-center" style={{ fontWeight: 700 }}>{role.id}</td>
                            <td>{role.name}</td>
                            <td>{role.description}</td>
                            <td>
                                {role.permissions && role.permissions.length > 0
                                    ? role.permissions.map(p => p.name).join(', ')
                                    : 'Aucune'}
                            </td>
                            <td className="text-center">
                                {role.is_deletable ? (
                                    <span className="badge bg-success">Oui</span>
                                ) : (
                                    <span className="badge bg-danger">Non</span>
                                )}
                            </td>
                            <td className="text-center">{new Date(role.createdAt).toLocaleDateString()}</td>
                            {canManageRoles && (
                                <td>
                                    {role.is_deletable && ( 
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => onEdit(role)}
                                                className="btn btn-primary btn-sm me-1"
                                                data-bs-toggle="tooltip"
                                                data-bs-placement="top"
                                                title="Modifier"
                                            >
                                                <i className="ri-edit-box-line"></i>
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => onDelete(role.id)}
                                                data-bs-toggle="tooltip"
                                                data-bs-placement="top"
                                                title="Supprimer"
                                            >
                                                <i className="ri-delete-bin-6-line"></i>
                                            </button>
                                        </>
                                    )}
                                    {!role.is_deletable && (
                                        <span className="text-muted">Système</span>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RoleTable;