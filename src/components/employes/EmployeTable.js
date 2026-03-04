// EmployeTable.jsx
import React, { useState } from 'react';
import { Grid, _ } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";
import { useNavigate } from 'react-router-dom';
import api from '../../axios'; 
import Swal from 'sweetalert2'; 

const EmployeTable = ({ employes }) => {
    const [updateEmployes, setUpdateEmployes] = useState(null);
    // On conserve un état pour tous les types de mise à jour/suppression pour gérer le spinner
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); 
    const navigate = useNavigate();

    // --- Fonctions de Mise à Jour du DOM (Après Succès) ---
    const refreshUsersData = async () => {
        try {
            const usersRepons = await api.get('employes');
            setUpdateEmployes(usersRepons.data.data);
        } catch (error) {
            console.error("Erreur lors du rechargement des utilisateurs :", error);
            // Optionnel: Afficher un message d'erreur si le rechargement échoue
        }
    };

    // --- 1. Changement de statut ---
    const statusChange = async (slug) => {
        setIsUpdatingStatus(true);
        try {
            await api.patch(`employes/${slug}/toggle-status`);
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
                errorMessage = err.response.data.message;
            }
            Swal.fire({
                icon: 'error',
                title: 'Erreur !',
                text: errorMessage,
                confirmButtonText: 'OK'
            });
        } finally {
            setIsUpdatingStatus(false);
            // Recharger les données après l'opération
            refreshUsersData(); 
        }
    };

    // --- 2. Modification (Redirection) ---
    const handleEditClick = (slug) => {
        // Redirige vers la route de modification de l'utilisateur
        navigate(`/employes/edit/${slug}`); 
    };

    // --- 3. Suppression (Soft Delete) ---
    const handleDeleteClick = async (slug) => {
        const result = await Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: "Vous ne pourrez pas annuler cette suppression !",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
            try {
                // Endpoint de suppression (assurez-vous que cette route existe sur le backend)
                await api.delete(`employes/${slug}`); 
                Swal.fire({
                    icon: 'success',
                    title: 'Supprimé !',
                    text: 'L\'utilisateur a été supprimé avec succès (Soft Delete).',
                    showConfirmButton: false,
                    timer: 2000
                });
                refreshUsersData();
            } catch (err) {
                console.error("Erreur lors de la suppression :", err);
                let errorMessage = 'Une erreur est survenue lors de la suppression.';
                if (err.response && err.response.data && err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur !',
                    text: errorMessage,
                    confirmButtonText: 'OK'
                });
            }
        }
    };

    // --- Préparation des données ---
    let data = [];
    const currentEmployes = updateEmployes || employes;

    data = currentEmployes.map((employe, index) => [
        index + 1,
        employe.avatar_url,
        employe.matricule,
        employe.nom,
        employe.prenom,
        employe.poste_occupe,
        employe.genre,
        employe.service?.name || "—",
        employe.status,
        new Date(employe.createdAt).toLocaleDateString(),
        employe.slug, // Le slug est toujours la dernière colonne (index 10) pour les actions
    ]);

    return (
        <Grid
            columns={[
                { name: "ID", width: "90px", formatter: (cell) => _(<div className="text-center" style={{ fontWeight: 700 }}>{cell}</div>) },
                { name: "photo", width: "120px", formatter: (cell) => _(<img src={cell} alt="avatar" style={{ height: "45px" }} />) },
                { name: "Matricule", formatter: (cell) => _(<span className="text-reset">{cell}</span>) },
                { name: "Nom", formatter: (cell) => _(<span className="text-reset">{cell}</span>) },
                { name: "Prénom", formatter: (cell) => _(<span className="text-reset">{cell}</span>) },
                { name: "Fonction", formatter: (cell) => _(<div className="text-center">{cell}</div>) },
                { name: "Genre", formatter: (cell) => _(<div className="text-center">{cell}</div>) },
                { name: "Service", formatter: (cell) => _(<div className="text-center">{cell}</div>) },
                { name: "Statut", formatter: (cell) => _(<span className="text-reset">{cell}</span>) },
                { name: "Créé le", formatter: (cell) => _(<div className="text-center">{cell}</div>) },
                
                // --- NOUVELLE COLONNE ACTION ---
                {
                    name: "Action",
                    width: "150px",
                    // Le slug est passé en paramètre car c'est la dernière valeur de l'array de données
                    formatter: (slug, row) => {
                        // Pour obtenir le statut actuel et désactiver le bouton de statut si nécessaire
                        const status = row.cells[8].data; 
                        
                        return _(
                            <div>
                                {/* 1. Bouton Modifier (Édition générale) */}
                                <button
                                    className="btn btn-sm btn-primary"
                                    title="Modifier l'utilisateur"
                                    style={{ marginRight: "5px" }}
                                    onClick={() => handleEditClick(slug)}
                                >
                                  
                                    <i className="ri-pencil-line"></i>    
                                </button>
                                
                                <button
                                    className="btn btn-sm btn-warning"
                                    onClick={() => statusChange(slug)}
                                    title={`Passer au statut ${status === 'Activé' ? 'Désactivé' : 'Activé'}`}
                                    style={{ marginRight: "5px" }}
                                    // Désactiver pendant la mise à jour pour éviter les doubles clics
                                    disabled={isUpdatingStatus} 
                                >
                                    {isUpdatingStatus ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                        // Icône basée sur le statut actuel (optionnel)
                                        <i className={`ri-${status === 'Activé' ? 'eye-off-line' : 'eye-line'}`}></i>
                                    )}
                                </button>

                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDeleteClick(slug)}
                                    title="Supprimer l'utilisateur"
                                >
                                    <i className="ri-delete-bin-line"></i>
                                </button>
                            </div>
                        );
                    },
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

export default EmployeTable;