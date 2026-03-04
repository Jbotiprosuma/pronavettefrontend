// frontend/src/components/mutations/WizardHeader.js
import React from 'react';

const WizardHeader = ({ step, totalSteps, currentEmployerName, currentEmployerIndex, totalEmployers }) => {
    return (
        <div className="card-header bg-primary text-white p-3">
            <h4 className="mb-1 text-light">Assistant de Création de Mutation Multiples</h4>
            <div className="d-flex justify-content-between align-items-center">
                <p className="mb-0">
                    <span className="badge bg-primary me-2">Étape {step} sur {totalSteps}</span>
                    {step === 1 && "Sélectionnez les employés concernés."}
                    {step === 2 && (
                        <>
                            Renseignement des données : 
                            <span className="fw-bold ms-1 text-warning">
                                {currentEmployerName} 
                            </span> 
                            (Mutation {currentEmployerIndex + 1} / {totalEmployers})
                        </>
                    )}
                </p>
                <i className="ri-shuffle-line fs-3"></i>
            </div>
        </div>
    );
};

export default WizardHeader;