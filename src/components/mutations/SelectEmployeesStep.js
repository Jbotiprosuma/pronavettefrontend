// frontend/src/components/mutations/SelectEmployeesStep.js
import React, { useState, useMemo } from 'react';

const SelectEmployeesStep = ({ employers, selectedEmployerIds, setSelectedEmployerIds, onNext, loading, pendingMutations = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Map des employer_id → info mutation en attente (pour accès rapide)
    const pendingMap = useMemo(() => {
        const map = {};
        pendingMutations.forEach(m => {
            map[m.employer_id] = m;
        });
        return map;
    }, [pendingMutations]);

    const toggleEmployerSelection = (employerId) => {
        // Bloquer si mutation en attente
        if (pendingMap[employerId]) return;

        const idString = employerId.toString();
        if (selectedEmployerIds.includes(idString)) {
            setSelectedEmployerIds(selectedEmployerIds.filter(id => id !== idString));
        } else {
            setSelectedEmployerIds([...selectedEmployerIds, idString]);
        }
    };

    const handleNextClick = (e) => {
        e.preventDefault();
        onNext();
    };

    const filteredEmployers = useMemo(() => {
        if (!searchTerm) return employers;
        const lc = searchTerm.toLowerCase();
        return employers.filter(emp =>
            (emp.matricule && emp.matricule.toLowerCase().includes(lc)) ||
            (emp.nom && emp.nom.toLowerCase().includes(lc)) ||
            (emp.prenom && emp.prenom.toLowerCase().includes(lc))
        );
    }, [employers, searchTerm]);

    return (
        <form onSubmit={handleNextClick}>
            <p className="lead">Cochez les employés pour lesquels vous souhaitez créer une mutation.</p>

            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher par Matricule, Nom ou Prénom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={loading}
                />
            </div>

            {pendingMutations.length > 0 && (
                <div className="alert alert-info d-flex align-items-center py-2 mb-3">
                    <i className="ri-information-line fs-18 me-2"></i>
                    <small>Les employés ayant déjà une mutation <strong>« En attente »</strong> ne peuvent pas être sélectionnés. Veuillez d'abord valider, rejeter ou annuler leur mutation existante.</small>
                </div>
            )}

            <div className="list-group list-group-flush mb-4" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px' }}>
                {filteredEmployers.length > 0 ? (
                    filteredEmployers.map(emp => {
                        const hasPending = !!pendingMap[emp.id];
                        const pendingInfo = pendingMap[emp.id];
                        const isSelected = selectedEmployerIds.includes(emp.id.toString());

                        return (
                            <div
                                key={emp.id}
                                className={`list-group-item d-flex justify-content-between align-items-center ${hasPending ? 'list-group-item-light' : isSelected ? 'list-group-item-primary' : ''}`}
                                style={hasPending ? { opacity: 0.65, cursor: 'not-allowed' } : {}}
                                title={hasPending ? `Mutation en attente vers ${pendingInfo?.serviceNew?.name || 'un autre service'}` : ''}
                            >
                                <label
                                    className={`form-check-label flex-grow-1 ${hasPending ? '' : ''}`}
                                    htmlFor={`emp-${emp.id}`}
                                    style={{ cursor: hasPending ? 'not-allowed' : 'pointer' }}
                                >
                                    <span className="fw-bold me-2">{emp.matricule}</span>
                                    {emp.nom} {emp.prenom}
                                    <small className="text-muted ms-3">({emp.service ? emp.service.name : 'Service non défini'})</small>

                                    {hasPending && (
                                        <span className="badge bg-warning-subtle text-warning ms-2" style={{ fontSize: '0.7rem' }}>
                                            <i className="ri-forbid-line me-1"></i>
                                            Mutation en attente {pendingInfo?.serviceNew?.name ? `→ ${pendingInfo.serviceNew.name}` : ''}
                                        </span>
                                    )}
                                </label>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`emp-${emp.id}`}
                                    checked={isSelected}
                                    onChange={() => toggleEmployerSelection(emp.id)}
                                    disabled={loading || hasPending}
                                />
                            </div>
                        );
                    })
                ) : (
                    <div className="list-group-item text-center text-muted">
                        {searchTerm ? "Aucun employé ne correspond à votre recherche." : "Aucun employé trouvé."}
                    </div>
                )}
            </div>

            <div className="d-flex justify-content-end">
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || selectedEmployerIds.length === 0}
                >
                    {loading ? (
                        <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                        <i className="ri-arrow-right-line me-1"></i>
                    )}
                    Passer au Renseignement ({selectedEmployerIds.length} sélectionné(s))
                </button>
            </div>
        </form>
    );
};

export default SelectEmployeesStep;