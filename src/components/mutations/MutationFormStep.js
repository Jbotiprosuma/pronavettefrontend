// frontend/src/components/mutations/MutationFormStep.js
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

/**
 * Calcule le nombre de jours du 1er du mois à la date de départ.
 * Retourne un entier plafonné à 30 (convention paie).
 */
const calculerBaseJours = (periodeAt, departAt) => {
    if (!periodeAt || !departAt) return 30;

    const [year, month] = periodeAt.split('-').map(Number);
    const periodeStart = new Date(year, month - 1, 1); // 1er du mois
    const dateDepart = new Date(departAt);

    // Si le départ est dans le même mois/année
    if (dateDepart.getFullYear() === year && (dateDepart.getMonth() + 1) === month) {
        const diffMs = dateDepart.getTime() - periodeStart.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return Math.min(30, Math.max(0, diffDays));
    }

    // Autre mois → 30 par défaut
    return 30;
};

// NOTE: Le composant principal s'occupe de l'état global et du chargement des références
const MutationFormStep = ({ employer, initialData, referenceData, onFormSubmit, onPrevious, isFirst, isLast, loading }) => {

    // État local du formulaire (initialisé avec les données stockées ou l'initialData)
    const [formData, setFormData] = useState(() => ({
        ...initialData,
        _base_jours: initialData.nb_jours_job || 30,
    }));
    const [navetteLignes, setNavetteLignes] = useState([]);

    // Effet pour initialiser les lignes de navette si une navette est déjà sélectionnée
    useEffect(() => {
        if (formData.navette_id) {
            const selectedNavette = referenceData.navettes.find(n => n.id === formData.navette_id);
            setNavetteLignes(selectedNavette?.navetteLignes || []);
        } else {
            setNavetteLignes([]);
        }
    }, [formData.navette_id, referenceData.navettes]);

    // --- Auto-détection de la navette et ligne pour la période sélectionnée ---
    useEffect(() => {
        if (!formData.periode_at || !initialData.service_old_id) return;

        const periodeInput = formData.periode_at; // format "YYYY-MM"
        const serviceOldId = initialData.service_old_id;

        const navetteMatch = referenceData.navettes.find(n => {
            if (String(n.service_id) !== String(serviceOldId)) return false;
            if (!n.periode_at) return false;
            const navPeriode = n.periode_at.substring(0, 7);
            return navPeriode === periodeInput;
        });

        if (navetteMatch) {
            const lignes = navetteMatch.navetteLignes || [];
            const ligneMatch = lignes.find(l => String(l.employer_id) === String(employer.id));
            const baseJours = calculerBaseJours(periodeInput, formData.depart_at);

            if (ligneMatch) {
                // NavetteLigne trouvée → remplir tout depuis la ligne (readOnly)
                const absReduit = ligneMatch.nb_jour_abs_reduit || 0;
                const absTotal = ligneMatch.nb_jour_abs || 0;
                setNavetteLignes(lignes);
                setFormData(prev => ({
                    ...prev,
                    navette_id: navetteMatch.id,
                    navette_ligne_id: ligneMatch.id,
                    _base_jours: baseJours,
                    nb_jours_job: Math.max(0, baseJours - absReduit),
                    nb_jour_abs: absTotal,
                    nb_jour_abs_reduit: absReduit,
                    accompte: ligneMatch.accompte || 0,
                    prime_nuit: ligneMatch.prime_nuit || 0,
                    heure_sup_15: ligneMatch.heure_sup_15 || 0,
                    heure_sup_50: ligneMatch.heure_sup_50 || 0,
                    heure_sup_75: ligneMatch.heure_sup_75 || 0,
                }));
            } else {
                // Navette existe mais pas de ligne pour cet employé
                setNavetteLignes(lignes);
                setFormData(prev => ({
                    ...prev,
                    navette_id: navetteMatch.id,
                    navette_ligne_id: null,
                    _base_jours: baseJours,
                    nb_jours_job: Math.max(0, baseJours - (parseInt(prev.nb_jour_abs) || 0)),
                }));
            }
        } else {
            // Aucune navette pour cette période → reset
            const baseJours = calculerBaseJours(periodeInput, formData.depart_at);
            setNavetteLignes([]);
            setFormData(prev => ({
                ...prev,
                navette_id: null,
                navette_ligne_id: null,
                _base_jours: baseJours,
                nb_jours_job: Math.max(0, baseJours - (parseInt(prev.nb_jour_abs) || 0)),
            }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.periode_at]);

    // --- Gestion des changements de formulaire ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? (checked ? 1 : 0) : value;

        setFormData(prev => {
            const updated = { ...prev, [name]: newValue };
            const hasLigne = !!prev.navette_ligne_id;

            // Quand la date de départ change → recalculer base et nb_jours_job
            if (name === 'depart_at') {
                const base = calculerBaseJours(prev.periode_at, newValue);
                updated._base_jours = base;
                // Si ligne navette → utiliser nb_jour_abs_reduit, sinon nb_jour_abs saisi
                const absToUse = hasLigne ? (parseInt(prev.nb_jour_abs_reduit) || 0) : (parseInt(prev.nb_jour_abs) || 0);
                updated.nb_jours_job = Math.max(0, base - absToUse);
            }

            // Quand les jours d'absence changent (seulement si PAS de ligne navette)
            if (name === 'nb_jour_abs' && !hasLigne) {
                const abs = parseInt(newValue) || 0;
                updated.nb_jours_job = Math.max(0, (prev._base_jours || 30) - abs);
            }

            return updated;
        });
    };

    // --- Soumission du formulaire ---
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation minimale (Nouveau Service et Période restent obligatoires)
        if (!formData.service_new_id || !formData.periode_at) {
            Swal.fire('Champs Manquants', 'Veuillez renseigner le Nouveau Service et la Période.', 'warning');
            return;
        }

        // Passe les données au composant parent pour l'appel API et la progression
        onFormSubmit(formData, employer.id);
    };

    // --- Calculs pour l'affichage ---
    const oldServiceName = referenceData.services.find(s => s.id === initialData.service_old_id)?.name || 'N/A';
    const hasNavetteLigne = !!formData.navette_ligne_id;

    return (
        <form onSubmit={handleSubmit}>
            <div className="alert alert-info p-2 d-flex justify-content-between align-items-center">
                <strong className='me-3'>Employé Actuel : {employer.nom} {employer.prenom} ({employer.matricule})</strong>
                <span className="badge bg-secondary">
                    Cadre : {initialData.is_cadre ? 'Oui' : 'Non'}
                </span>
            </div>

            <div className="row">
                {/* --- Bloc 1: Mouvement et Période --- */}
                <div className="col-md-5 border-end">
                    <h5 className="text-primary">Mouvement et Période</h5>
                    <hr />
                    <div className="mb-3">
                        <label className="form-label">Ancien Service</label>
                        <input
                            type="text"
                            className="form-control"
                            value={oldServiceName}
                            disabled
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="service_new_id" className="form-label">Nouveau Service <span className="text-danger">*</span></label>
                        <select
                            className="form-select"
                            id="service_new_id"
                            name="service_new_id"
                            value={formData.service_new_id}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        >
                            <option value="">Sélectionner le nouveau service</option>
                            {referenceData.services.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="periode_at" className="form-label">Période concernée (Mois/Année) <span className="text-danger">*</span></label>
                        <input
                            type="month"
                            className="form-control"
                            id="periode_at"
                            name="periode_at"
                            value={formData.periode_at}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>
                    {/* CHANGEMENT: Type date pour depart_at */}
                    <div className="mb-3">
                        <label htmlFor="depart_at" className="form-label">Date de Départ du service</label>
                        <input
                            type="date"
                            className="form-control"
                            name="depart_at"
                            value={formData.depart_at}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="arrivee_at" className="form-label">Date d'Arrivée prevue de l'autre service</label>
                        <input
                            type="date"
                            className="form-control"
                            name="arrivee_at"
                            value={formData.arrivee_at}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* --- Bloc 2: Navette et Paie (Combiné pour simplifier) --- */}
                <div className="col-md-7">
                    <div className="row">
                        <h5 className="text-primary mb-3">
                            Détails Etat Navette
                            {hasNavetteLigne && <small className="text-success ms-2">(Pré-rempli depuis la ligne navette)</small>}
                        </h5>
                        <hr />
                        <div className="col-6">
                            <div className="mb-3">
                                <label htmlFor="navette_id" className="form-label">
                                    Navette
                                    {formData.navette_id && (
                                        <span className="badge bg-success-subtle text-success ms-2 fs-10">Auto</span>
                                    )}
                                    {formData.periode_at && !formData.navette_id && (
                                        <span className="badge bg-warning-subtle text-warning ms-2 fs-10">Aucune campagne</span>
                                    )}
                                </label>
                                <select className="form-select bg-light" name="navette_id" value={formData.navette_id || ''} disabled>
                                    <option value="">(Aucune navette pour cette période)</option>
                                    {referenceData.navettes.map(navette => (
                                        <option key={navette.id} value={navette.id}>{navette.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="navette_ligne_id" className="form-label">
                                    Ligne de Navette
                                    {formData.navette_ligne_id && (
                                        <span className="badge bg-success-subtle text-success ms-2 fs-10">Champs préremplis</span>
                                    )}
                                </label>
                                <select
                                    className="form-select bg-light"
                                    name="navette_ligne_id"
                                    value={formData.navette_ligne_id || ''}
                                    disabled
                                >
                                    <option value="">(Aucune ligne trouvée)</option>
                                    {navetteLignes.map(ligne => (
                                        <option key={ligne.id} value={ligne.id}>
                                            {ligne.employer ? `${ligne.employer.matricule} — ${ligne.employer.nom} ${ligne.employer.prenom}` : `Ligne #${ligne.id}`}
                                            {' '}({ligne.nb_jours || 30}j)
                                        </option>
                                    ))}
                                </select>
                                {!formData.periode_at && (
                                    <small className="text-muted">
                                        <i className="ri-information-line me-1"></i>
                                        Sélectionnez une période pour détecter la navette automatiquement.
                                    </small>
                                )}
                            </div>

                            <div className="mb-3">
                                <label htmlFor="nb_jours_job" className="form-label">
                                    Jours Travaillés
                                    <small className="text-muted ms-2">
                                        ({formData._base_jours || 30} - {hasNavetteLigne ? (formData.nb_jour_abs_reduit || 0) : (formData.nb_jour_abs || 0)} abs{hasNavetteLigne ? ' réd.' : ''})
                                    </small>
                                </label>
                                <input type="number" className="form-control bg-light" name="nb_jours_job" value={formData.nb_jours_job} readOnly tabIndex={-1} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="nb_jour_abs" className="form-label">
                                    Jours d'Absence
                                    {hasNavetteLigne && <span className="badge bg-info-subtle text-info ms-2 fs-10">Ligne</span>}
                                </label>
                                <input type="number" className={`form-control ${hasNavetteLigne ? 'bg-light' : ''}`} name="nb_jour_abs" value={formData.nb_jour_abs} onChange={handleChange} min="0" max={formData._base_jours || 30} readOnly={hasNavetteLigne} disabled={loading} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="accompte" className="form-label">
                                    Acompte (F CFA)
                                    {hasNavetteLigne && <span className="badge bg-info-subtle text-info ms-2 fs-10">Ligne</span>}
                                </label>
                                <input type="number" className={`form-control ${hasNavetteLigne ? 'bg-light' : ''}`} name="accompte" value={formData.accompte} onChange={handleChange} min="0" readOnly={hasNavetteLigne} disabled={loading} />
                            </div>
                        </div>

                        <div className="col-6">
                            {/* CHANGEMENT: Prime Nuit en Jours (quantité) */}
                            <div className="mb-3">
                                <label htmlFor="prime_nuit" className="form-label">
                                    Prime Nuit (Nb Jours)
                                    {hasNavetteLigne && <span className="badge bg-info-subtle text-info ms-2 fs-10">Ligne</span>}
                                </label>
                                <input type="number" className={`form-control ${hasNavetteLigne ? 'bg-light' : ''}`} name="prime_nuit" value={formData.prime_nuit} onChange={handleChange} min="0" readOnly={hasNavetteLigne} disabled={loading} />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="heure_sup_15" className="form-label">H. Sup 15%</label>
                                <input type="number" className={`form-control ${hasNavetteLigne ? 'bg-light' : ''}`} name="heure_sup_15" value={formData.heure_sup_15} onChange={handleChange} min="0" readOnly={hasNavetteLigne} disabled={loading} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="heure_sup_50" className="form-label">H. Sup 50%</label>
                                <input type="number" className={`form-control ${hasNavetteLigne ? 'bg-light' : ''}`} name="heure_sup_50" value={formData.heure_sup_50} onChange={handleChange} min="0" readOnly={hasNavetteLigne} disabled={loading} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="heure_sup_75" className="form-label">H. Sup 75%</label>
                                <input type="number" className={`form-control ${hasNavetteLigne ? 'bg-light' : ''}`} name="heure_sup_75" value={formData.heure_sup_75} onChange={handleChange} min="0" readOnly={hasNavetteLigne} disabled={loading} />
                            </div>
                            <div className="form-check mt-5 ">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`is_cadre_${employer.id}`}
                                    name="is_cadre"
                                    checked={formData.is_cadre === 1}
                                    onChange={handleChange}
                                    disabled={loading || hasNavetteLigne}
                                />
                                <label className="form-check-label " htmlFor={`is_cadre_${employer.id}`}>
                                    Est-il un cadre ?
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <hr />
            <div className="d-flex justify-content-between">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onPrevious}
                    disabled={loading}
                >
                    <i className="ri-arrow-left-line me-1"></i>
                    {isFirst ? 'Retour à la Sélection' : 'Précédent'}
                </button>
                <button
                    type="submit"
                    className={`btn ${isLast ? 'btn-success' : 'btn-primary'}`}
                    disabled={loading || !formData.service_new_id || !formData.periode_at}
                >
                    {loading ? (
                        <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                        <i className={`ri-${isLast ? 'check-line' : 'arrow-right-line'} me-1`}></i>
                    )}
                    {isLast ? 'Finaliser toutes les Mutations' : 'Valider et Passer au Suivant'}
                </button>
            </div>
        </form>
    );
};

export default MutationFormStep;