import React from 'react';
import { Grid, _ } from "gridjs-react";
import "gridjs/dist/theme/mermaid.css";
import { useNavigate } from 'react-router-dom';

const NavetteTable = ({ navettes }) => {

    const navigate = useNavigate();

    const handleViewClick = (slug) => {
        navigate(`/navette/detail/${slug}`);
    };

    // Préparation des données pour la grille
    const data = navettes.map((navette, index) => [
        index + 1,
        navette.code,
        navette.id,
        navette.name,
        navette.service.name,
        new Date(navette.periode_at).toLocaleDateString('fr-FR'),
        navette.status,
        navette.etat,
        new Date(navette.createdAt).toLocaleDateString('fr-FR'),
    ]);

    return (
        <Grid
            data={data}
            columns={[
                {
                    name: "N°",
                    width: "100px",
                },
                {
                    name: "Identifiant",
                    width: "200px",
                },
                {
                    name: "Action",
                    width: "150px",
                    formatter: (cell, row) => {
                        const id = row.cells[2].data;
                        return _(
                            <div className="text-center">
                                <button
                                    className="btn btn-primary"
                                    title="Consulter les détails de la campagne"
                                    data-bs-toggle="tooltip"
                                    onClick={() => handleViewClick(id)}
                                >
                                    <i className="ri-eye-line"></i> 
                                </button>
                            </div>
                        );
                    },
                },
                {
                    name: "Libellé",
                    width: "250px",
                },
                {
                    name: "Service",
                    width: "250px",
                },
                {
                    name: "Période concernée",
                    width: "170px",
                },
                {
                    name: "Statut",
                    width: "130px",
                },
                {
                    name: "État",
                },
                {
                    name: "Créé le",
                    width: "150px",
                },
            ]}
            search={true}
            sort={true}
            pagination={{
                enabled: true,
                limit: 10,
            }}
            style={{
                table: {
                    width: '100%',
                },
            }}
        />
    );
};

export default NavetteTable;
