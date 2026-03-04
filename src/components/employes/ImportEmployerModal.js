// app/components/employes/ImportEmployerModal.jsx
import React, { useState } from 'react';

const ImportEmployerModal = ({ show, onClose, onImportSubmit, alert }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);

    // Ne réinitialisez pas l'alerte ici, elle est gérée par le composant parent
    // pour persister si le modal se ferme mais l'alerte doit rester visible.

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            alert({ type: 'danger', message: 'Veuillez sélectionner un fichier Excel.' });
            return;
        }

        setLoading(true);
        try {
            await onImportSubmit(selectedFile); // Appelle la fonction d'importation passée par le parent
            setSelectedFile(null); // Réinitialise le champ de fichier après soumission
            onClose(); // Ferme le modal après succès
        } catch (error) {
            // L'alerte sera gérée par le composant parent
        } finally {
            setLoading(false);
        }
    };

    if (!show) {
        return null;
    }

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Importer des Employés via Excel</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            {/* Optionnel: Afficher des messages d'alerte spécifiques au modal si vous voulez */}
                            {/* {alert && <AlertMessages alert={alert} setAlert={() => {}} />} */}
                            <p>Veuillez sélectionner un fichier Excel (.xls, .xlsx) contenant la liste des employés à importer.</p>
                            <input
                                type="file"
                                className="form-control"
                                accept=".xls,.xlsx"
                                onChange={handleFileChange}
                            />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Importation en cours...' : 'Importer'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>

        </>
    );
};

export default ImportEmployerModal;