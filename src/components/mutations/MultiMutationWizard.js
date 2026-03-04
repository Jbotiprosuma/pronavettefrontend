// frontend/src/components/mutations/MultiMutationWizard.js
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import SelectEmployeesStep from './SelectEmployeesStep'; 
import MutationFormStep from './MutationFormStep';       
import WizardHeader from './WizardHeader';     

const initialMutationState = {
    service_old_id: '',
    service_new_id: '',
    navette_id: null,
    navette_ligne_id: null,
    nb_jours_job: 0,
    nb_jour_abs: 0,
    accompte: 0,
    prime_nuit: 0,
    heure_sup_15: 0,
    heure_sup_50: 0,
    heure_sup_75: 0,
    is_cadre: 0,
    periode_at: '',
    depart_at: '',
    arrivee_at: '',
};

const MultiMutationWizard = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Sélection, 2: Formulaire
    const [loading, setLoading] = useState(true);

    // Contient tous les employés chargés initialement
    const [allEmployers, setAllEmployers] = useState([]);

    // IDs des employés sélectionnés à l'Étape 1
    const [selectedEmployerIds, setSelectedEmployerIds] = useState([]);

    // Données des mutations en cours de saisie. Clé: employerId, Valeur: formData
    const [mutationsData, setMutationsData] = useState({});

    // Index de l'employé en cours de saisie (pour l'Étape 2)
    const [currentEmployerIndex, setCurrentEmployerIndex] = useState(0);

    // --- Chargement des données de référence (Employés, Services, Navettes) ---
    const [referenceData, setReferenceData] = useState({ services: [], navettes: [] });
    // IDs des employés ayant une mutation en attente (bloqués)
    const [pendingMutations, setPendingMutations] = useState([]);

    useEffect(() => {
        const fetchReferenceData = async () => {
            try {
                const [employersRes, servicesRes, navettesRes, pendingRes] = await Promise.all([
                    api.get('/employes'),
                    api.get('/services'),
                    api.get('/navettes'),
                    api.get('/mutations/pending-employer-ids'),
                ]);

                setAllEmployers(employersRes.data.data);
                setReferenceData({
                    services: servicesRes.data.data,
                    navettes: navettesRes.data.data,
                });
                setPendingMutations(pendingRes.data.data || []);
            } catch (error) {
                console.error("Erreur lors du chargement des données de référence:", error);
                Swal.fire('Erreur', 'Impossible de charger les listes de référence.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchReferenceData();
    }, []);

    // Liste des objets Employés réellement sélectionnés (utile pour l'Étape 2)
    const selectedEmployers = useMemo(() => {
        return allEmployers.filter(emp => selectedEmployerIds.includes(emp.id.toString()));
    }, [allEmployers, selectedEmployerIds]);


    // --- Logique du Wizard ---

    /**
     * Gère la transition de l'Étape 1 à l'Étape 2.
     * Initialise les données de formulaire pour les employés sélectionnés.
     */
    const handleStep1Submit = () => {
        if (selectedEmployerIds.length === 0) {
            Swal.fire('Attention', 'Veuillez sélectionner au moins un employé.', 'warning');
            return;
        }

        // Initialiser l'état des mutations pour les employés sélectionnés
        const initialData = {};
        selectedEmployers.forEach(emp => {
            // Déterminer l'ancien service ici pour l'initialisation
            const service_old_id = emp.service_id || '';
            const is_cadre = emp.is_cadre ? 1 : 0; // Utiliser la valeur par défaut du modèle Employé

            initialData[emp.id] = {
                ...initialMutationState,
                service_old_id: service_old_id,
                is_cadre: is_cadre,
            };
        });

        setMutationsData(initialData);
        setCurrentEmployerIndex(0); // Commencer avec le premier employé
        setStep(2);
    };

    /**
     * Gère la soumission du formulaire pour l'employé actuel et passe au suivant.
     */
    // const handleMutationSubmit = async (formData, currentEmployerId) => {
    //     setLoading(true);

    //     // 1. Envoi au Backend
    //     const dataToSend = {
    //         ...formData,
    //         employer_id: currentEmployerId,
    //         // Nettoyage des données (comme dans l'ancien composant)
    //         nb_jours_job: parseInt(formData.nb_jours_job) || 0,
    //         nb_jour_abs: parseInt(formData.nb_jour_abs) || 0,
    //         accompte: parseInt(formData.accompte) || 0,
    //         prime_nuit: parseInt(formData.prime_nuit) || 0,
    //         heure_sup_15: parseInt(formData.heure_sup_15) || 0,
    //         heure_sup_50: parseInt(formData.heure_sup_50) || 0,
    //         heure_sup_75: parseInt(formData.heure_sup_75) || 0,
    //         is_cadre: formData.is_cadre, // Déjà 0 ou 1
    //         // Les autres champs sont déjà des chaînes ou des dates
    //     };

    //     try {
    //         // Route: POST /mutations
    //         await api.post('/mutations', dataToSend);

    //         // 2. Passage à l'employé suivant ou fin
    //         const nextIndex = currentEmployerIndex + 1;

    //         if (nextIndex < selectedEmployers.length) {
    //             // Passer à l'employé suivant
    //             setCurrentEmployerIndex(nextIndex);
    //             Swal.fire('Succès', `Mutation de ${selectedEmployers[currentEmployerIndex].nom} enregistrée. Passage au suivant.`, 'success');
    //         } else {
    //             // Toutes les mutations sont terminées
    //             Swal.fire({
    //                 icon: 'success',
    //                 title: 'Processus Terminé !',
    //                 text: `${selectedEmployers.length} mutations ont été enregistrées avec succès.`,
    //                 showConfirmButton: true,
    //             });
    //             navigate('/mutations'); // Retour à la liste
    //         }
    //     } catch (err) {
    //         console.error("Erreur lors de la création de la mutation:", err);
    //         const errorMessage = err.response?.data?.message || `Erreur lors de l'enregistrement de la mutation pour ${selectedEmployers[currentEmployerIndex].nom}.`;
    //         Swal.fire('Erreur', errorMessage, 'error');

    //         // NOTE: On peut choisir de rester sur le même formulaire pour correction, ou d'annuler.
    //         // Pour l'instant, on reste pour laisser l'utilisateur corriger.
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const handleMutationSubmit = async (formData, currentEmployerId) => {

        // NOUVEAU: 1. Mettre à jour l'état PREDÉCESSEUR avec les données soumises.
        // Cette étape garantit que si l'API échoue, le formulaire enfant se re-rendra
        // avec ces données complètes (via la prop initialData).
        setMutationsData(prevData => ({
            ...prevData,
            [currentEmployerId]: formData,
        }));

        setLoading(true); // Mettre le loading ici (après la mise à jour de l'état)

        const dataToSend = {
            ...formData,
            employer_id: currentEmployerId,
            // Nettoyage des données
            nb_jours_job: parseInt(formData.nb_jours_job) || 0,
            nb_jour_abs: parseInt(formData.nb_jour_abs) || 0,
            accompte: parseInt(formData.accompte) || 0,
            prime_nuit: parseInt(formData.prime_nuit) || 0,
            heure_sup_15: parseInt(formData.heure_sup_15) || 0,
            heure_sup_50: parseInt(formData.heure_sup_50) || 0,
            heure_sup_75: parseInt(formData.heure_sup_75) || 0,
            is_cadre: formData.is_cadre,
            navette_id: formData.navette_id === "" ? null : parseInt(formData.navette_id),
            navette_ligne_id: formData.navette_ligne_id === "" ? null : parseInt(formData.navette_ligne_id)
            // Les autres champs sont déjà des chaînes ou des dates
        };

        try {
            // Route: POST /mutations
            await api.post('/mutations', dataToSend);

            // 2. Si la création réussit: Passage à l'employé suivant ou fin
            const nextIndex = currentEmployerIndex + 1;

            if (nextIndex < selectedEmployers.length) {
                // Passer à l'employé suivant
                setCurrentEmployerIndex(nextIndex);
                Swal.fire('Succès', `Mutation de ${selectedEmployers[currentEmployerIndex].nom} enregistrée. Passage au suivant.`, 'success');
            } else {
                // Toutes les mutations sont terminées
                Swal.fire({
                    icon: 'success',
                    title: 'Processus Terminé !',
                    text: `${selectedEmployers.length} mutations ont été enregistrées avec succès.`,
                    showConfirmButton: true,
                });
                navigate('/mutations'); // Retour à la liste
            }
        } catch (err) {
            console.error("Erreur lors de la création de la mutation:", err);
            const errorMessage = err.response?.data?.message || `Erreur lors de l'enregistrement de la mutation pour ${selectedEmployers[currentEmployerIndex].nom}.`;
            Swal.fire('Erreur', errorMessage, 'error');

            // Le formulaire reste sur la même étape, mais grâce à la mise à jour de 'mutationsData' 
            // au début, les données sont conservées.
        } finally {
            setLoading(false);
        }
    }
    // --- Rendu du Wizard ---
    if (loading) {
        return <p className="text-center mt-5">Chargement des données de référence...</p>;
    }

    return (
        <div className="container mt-4">
            <div className="card shadow-lg">
                <WizardHeader
                    step={step}
                    totalSteps={2}
                    currentEmployerName={step === 2 ? `${selectedEmployers[currentEmployerIndex].nom} ${selectedEmployers[currentEmployerIndex].prenom}` : null}
                    currentEmployerIndex={currentEmployerIndex}
                    totalEmployers={selectedEmployers.length}
                />

                <div className="card-body">
                    {step === 1 && (
                        <SelectEmployeesStep
                            employers={allEmployers}
                            selectedEmployerIds={selectedEmployerIds}
                            setSelectedEmployerIds={setSelectedEmployerIds}
                            onNext={handleStep1Submit}
                            loading={loading}
                            pendingMutations={pendingMutations}
                        />
                    )}

                    {step === 2 && selectedEmployers.length > 0 && (
                        <MutationFormStep
                            // Données de l'employé en cours
                            employer={selectedEmployers[currentEmployerIndex]}
                            // État du formulaire pour cet employé
                            initialData={mutationsData[selectedEmployers[currentEmployerIndex].id]}
                            // Données de référence
                            referenceData={referenceData}
                            // Gestion de la progression
                            onFormSubmit={handleMutationSubmit}
                            onPrevious={() => {
                                // Permet de revenir à l'employé précédent (ou à l'étape 1)
                                if (currentEmployerIndex > 0) {
                                    setCurrentEmployerIndex(currentEmployerIndex - 1);
                                } else {
                                    setStep(1); // Retour à la sélection si c'est le premier
                                }
                            }}
                            isFirst={currentEmployerIndex === 0}
                            isLast={currentEmployerIndex === selectedEmployers.length - 1}
                            loading={loading}
                        />
                    )}

                    {step === 2 && selectedEmployers.length === 0 && (
                        <div className="alert alert-warning">Aucun employé sélectionné. Retournez à la première étape.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MultiMutationWizard;