// UsersTable.jsx
import React, { useState } from 'react';
import { Grid, _ } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";
import { useNavigate } from 'react-router-dom';
import api from './../../axios'; // Assuming this path is correct
import Swal from 'sweetalert2'; // Import SweetAlert2

const UsersTable = ({ users }) => {
    const [updateUsers, setUpdateUsers] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const navigate = useNavigate();

    const statusChange = async (slug) => {
        setIsUpdatingStatus(true);
        try {
            await api.put(`users/${slug}/update-status`);
            Swal.fire({
                icon: 'success',
                title: 'Statut mis à jour !',
                text: 'Le statut de l\'utilisateur a été modifié avec succès.',
                showConfirmButton: false,
                timer: 2000 
            });
        } catch (err) {
            console.error("Erreur lors du changement de statut :", err);
            let errorMessage = 'Une erreur est survenue lors de la mise à jour du statut. Veuillez réessayer.';
            if (err.response && err.response.data && err.response.data.message) {
                errorMessage = err.response.data.message; // Use backend error message if available
            }
            Swal.fire({
                icon: 'error',
                title: 'Erreur !',
                text: errorMessage,
                confirmButtonText: 'OK'
            });
        } finally {
            setIsUpdatingStatus(false);
            const usersRepons = await api.get('users');
            setUpdateUsers(usersRepons.data.data);
        }
    };

    const handleViewClick = (slug) => {
        navigate(`/utilisateur/${slug}`);
    };
    let data = [];
    // The data mapping remains the same as you're passing the slug to formatter
    if (updateUsers) {
         data = updateUsers.map((user,index) => [
            index + 1,
            user.avatar_url,
            user.nom,
            user.prenom,
            user.status,
            user.service?.name || "—",
            user.role?.name || "—",
            new Date(user.createdAt).toLocaleDateString(),
            user.slug, 
        ]);
    } else {
         data = users.map((user,index) => [
            index + 1,
            user.avatar_url,
            user.nom,
            user.prenom,
            user.status,
            user.service?.name || "—",
            user.role?.name || "—",
            new Date(user.createdAt).toLocaleDateString(),
            user.slug, 
        ]);
    }

    return (
        <Grid
            columns={[
                {
                    name: "ID",
                    width: "90px",
                    formatter: (cell) =>
                        _(
                            <div className="text-center" style={{ fontWeight: 700 }}>
                                {cell}
                            </div>
                        ),
                },
                {
                    name: "photo",
                    width: "120px",
                    formatter: (cell) =>
                        _(<img src={cell} alt="avatar" style={{ height: "45px" }} />),
                },
                {
                    name: "Nom",
                    formatter: (cell) => _(<span className="text-reset">{cell}</span>),
                },
                {
                    name: "Prénom",
                    formatter: (cell) => _(<span className="text-reset">{cell}</span>),
                },
                {
                    name: "Statut",
                    formatter: (cell) => _(<span className="text-reset">{cell}</span>),
                },
                {
                    name: "Service",
                    formatter: (cell) => _(<div className="text-center">{cell}</div>),
                },
                {
                    name: "Rôle",
                    formatter: (cell) => _(<div className="text-center">{cell}</div>),
                },
                {
                    name: "Créé le",
                    formatter: (cell) => _(<div className="text-center">{cell}</div>),
                },
                {
                    name: "Action",
                     width: "150px",
                    formatter: (slug) =>
                        _(
                            <div>
                                <button href="#"
                                    className="btn btn-primary"
                                    title="Afficher l'utilisateur"
                                    data-bs-toggle="tooltip"
                                    style={{ marginRight: "5px" }}
                                    onClick={() => {
                                        handleViewClick(slug);
                                    }}
                                >
                                    <i className="ri-eye-line"></i>
                                </button>
                                <button
                                    className="btn btn-warning"
                                    onClick={() => statusChange(slug)}
                                    title="Changer le statut"
                                    data-bs-toggle="tooltip"
                                    disabled={isUpdatingStatus}
                                >
                                    {isUpdatingStatus ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                        <i className="ri-eye-off-line"></i>
                                    )}
                                </button>
                            </div>
                        ),
                },
            ]}
            data={data}
            search
            sort
            pagination={{
                limit: 50,
            }}
        />
    );
};

export default UsersTable;