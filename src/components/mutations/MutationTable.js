// MutationTable.js
import React, { useState } from 'react';
import { Grid, _ } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";
import { useNavigate } from 'react-router-dom';
import api from '../../axios';
import Swal from 'sweetalert2';

const MutationTable = ({ mutations }) => {
    const [updateMutations, setUpdateMutations] = useState(mutations);
    const refreshData = (async () => {
        try {
            const response = await api.get('mutations');
            setUpdateMutations(response.data.data);
        } catch (error) {
            console.error("Erreur lors du rechargement des mutations :", error);
        }
    });

    const navigate = useNavigate();

    // --- 1. Changement de statut (Maintenu, mais ajusté au modèle 'Validé'/'En attente') ---
    const statusChange = async (slug, currentStatus) => {
        const newStatus = currentStatus === 'Validé' ? 'En attente' : 'Validé';

        try {
            const result = await Swal.fire({
                title: 'Valider la Mutation ?',
                text: "Ceci confirmera la mutation et mettra à jour son statut à 'Validé'.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Oui, Valider !',
                cancelButtonText: 'Annuler'
            });

            if (result.isConfirmed) {
                try {

                    await api.patch(`mutations/${slug}/confirm`, { status: newStatus });
                    Swal.fire({
                        icon: 'success',
                        title: 'Statut mis à jour !',
                        text: `La mutation est maintenant en statut : ${newStatus}.`,
                        showConfirmButton: false,
                        timer: 2000
                    });
                    refreshData();
                } catch (err) {
                    console.error("Erreur lors de la suppression :", err);
                    const errorMessage = err.response?.data?.message || 'Une erreur est survenue lors de la suppression.';
                    Swal.fire({
                        icon: 'error',
                        title: 'Erreur !',
                        text: errorMessage,
                        confirmButtonText: 'OK'
                    });
                }
            }


        } catch (err) {
            console.error("Erreur lors du changement de statut :", err);
            const errorMessage = err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du statut. Veuillez réessayer.';
            Swal.fire({
                icon: 'error',
                title: 'Erreur !',
                text: errorMessage,
                confirmButtonText: 'OK'
            });
        } finally {
            refreshData(); // Recharger les données
        }
    };

    // --- 2. Modification (Redirection) ---
    const handleEditClick = (slug) => {
        navigate(`/mutation/edit/${slug}`);
    };

    // --- 3. Affichage des détails (Ajout d'une fonction pour visualiser) ---
    const handleViewClick = (slug) => {
        navigate(`/mutation/detail/${slug}`);
    };

    // --- 4. Suppression (Soft Delete) ---
    const handleDeleteClick = async (slug) => {
        const result = await Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: "Vous ne pourrez pas annuler cette suppression !",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`mutations/${slug}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Supprimé !',
                    text: 'La mutation a été supprimée.',
                    showConfirmButton: false,
                    timer: 2000
                });
                refreshData();
            } catch (err) {
                console.error("Erreur lors de la suppression :", err);
                const errorMessage = err.response?.data?.message || 'Une erreur est survenue lors de la suppression.';
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur !',
                    text: errorMessage,
                    confirmButtonText: 'OK'
                });
            }
        }
    };

    // --- Préparation des données (Basé sur le modèle et les includes) ---
    let data = [];
    const currentMutations = updateMutations;

    data = currentMutations.map((mutation, index) => [
        // 0. ID
        index + 1,
        // 1. Employé (Matricule + Nom/Prénom)
        `${mutation.employer?.matricule || '—'} - ${mutation.employer?.nom || ''} ${mutation.employer?.prenom || ''}`,
        // 2. Ancien Service
        mutation.serviceOld?.name || "—",
        // 3. Nouveau Service
        mutation.serviceNew?.name || "—",
        // 4. Jours Travaillés
        mutation.nb_jours_job || 0,
        // 5. Jours Absence
        mutation.nb_jour_abs || 0,
        // 6. Heures Sup. (Total simplifié)
        (mutation.heure_sup_15 || 0) + (mutation.heure_sup_50 || 0) + (mutation.heure_sup_75 || 0),
        // 7. Créateur
        mutation.createdby ? `${mutation.createdby.nom} ${mutation.createdby.prenom}` : '—',
        // 8. Statut (Utilisé pour l'icône dans la colonne Action)
        mutation.status,
        // 9. Créé le
        new Date(mutation.createdAt).toLocaleDateString(),
        // 10. SLUG/ID (pour les actions - l'ID est plus fiable pour les mutations)
        mutation.id,
    ]);

    return (
        <Grid
            columns={[
                { name: "N°", width: "70px", formatter: (cell) => _(<div className="text-center" style={{ fontWeight: 700 }}>{cell}</div>) },
                { name: "Employé", width: "200px", formatter: (cell) => _(<span className="text-reset">{cell}</span>) },
                { name: "Ancien Service", width: "200px", formatter: (cell) => _(<div className="text-center">{cell}</div>) },
                { name: "Nouveau Service", width: "200px", formatter: (cell) => _(<div className="text-center">{cell}</div>) },
                { name: "Jours T", width: "80px", formatter: (cell) => _(<div className="text-center">{cell}</div>) },
                { name: "Jours Abs", width: "80px", formatter: (cell) => _(<div className="text-center">{cell}</div>) },
                { name: "H. Sup", width: "80px", formatter: (cell) => _(<div className="text-center">{cell}</div>) },
                { name: "Créé par", width: "120px", formatter: (cell) => _(<div className="text-center">{cell}</div>) },
                {
                    name: "Statut",
                    width: "100px",
                    formatter: (cell) => _(
                        <span className={`badge ${cell === 'Validé' ? 'bg-success' : 'bg-warning'}`}>
                            {cell}
                        </span>
                    )
                },
                { name: "Créé le", width: "100px", formatter: (cell) => _(<div className="text-center">{cell}</div>) },

                {
                    name: "Action",
                    width: "100px",
                    formatter: (id, row) => {
                        // Le statut actuel est à l'index 8
                        const status = row.cells[8].data;
                        const isConfirmed = status === 'Validé' || status === 'Rejeté' || status === 'Annulé'  ;

                        return _(
                            <div className="d-flex justify-content-center">
                                <button
                                    className="btn btn-sm btn-info text-white"
                                    title="Voir les détails"
                                    style={{ marginRight: "5px" }}
                                    onClick={() => handleViewClick(id)}
                                >
                                    <i className="ri-eye-line"></i>
                                </button>
                                <button
                                    className="btn btn-sm btn-primary"
                                    title="Modifier la mutation"
                                    style={{ marginRight: "5px" }}
                                    onClick={() => handleEditClick(id)}
                                    disabled={isConfirmed}
                                >
                                    <i className="ri-pencil-line"></i>
                                </button>
                                <button
                                    className={`btn btn-sm ${isConfirmed ? 'btn-warning' : 'btn-success'}`}
                                    onClick={() => statusChange(id, status)}
                                    title={isConfirmed ? 'Passer en Attente' : 'Valider la Mutation'}
                                    style={{ marginRight: "5px" }}
                                    disabled={isConfirmed}
                                >
                                    <i className={`ri-${isConfirmed ? 'lock-line' : 'check-line'}`}></i>
                                </button>
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDeleteClick(id)}
                                    title="Supprimer la mutation"
                                    disabled={isConfirmed}
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

export default MutationTable;