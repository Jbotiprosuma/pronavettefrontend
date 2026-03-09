import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../../axios';
import Loading from '../../components/base/Loading';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import Modal from 'react-modal';

const customModalStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '680px',
        padding: 0,
        borderRadius: '16px',
        border: 'none',
        boxShadow: '0 25px 60px rgba(0,0,0,.15)',
        maxHeight: '88vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    overlay: {
        backgroundColor: 'rgba(15,23,42,.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1050,
    },
};

// Styles pour les modals de formulaire (absences, acomptes, etc.) qui s'affichent AU-DESSUS du modal d'actions
const subModalStyles = {
    content: {
        ...customModalStyles.content,
    },
    overlay: {
        backgroundColor: 'rgba(15,23,42,.45)',
        backdropFilter: 'blur(2px)',
        zIndex: 1060,
    },
};

const ETAT_STEPS = [
    { key: "En attente de l'enregistrement des informations des employés", label: 'Saisie', icon: 'ri-edit-2-line' },
    { key: "En attente de l'envoi des informations des employés au manager", label: 'Envoi', icon: 'ri-send-plane-line' },
    { key: "En attente de la confirmation des informations des employés par le manager", label: 'Confirmation', icon: 'ri-shield-check-line' },
    { key: "En attente du traitement de l'etat navette par la paie", label: 'Paie', icon: 'ri-money-dollar-circle-line' },
    { key: 'Etat navette cloturé', label: 'Clôturé', icon: 'ri-checkbox-circle-line' },
];

const NavetteDetailPage = () => {
    const { user } = useAuth();
    const [navette, setNavette] = useState(null);
    const [navetteLines, setNavetteLines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAbModalOpen, setIsAbModalOpen] = useState(false);
    const [isAccompteModalOpen, setIsAccompteModalOpen] = useState(false);
    const [isHeureModalOpen, setIsHeureModalOpen] = useState(false);
    const [isPrimeModalOpen, setIsPrimeModalOpen] = useState(false);
    const [isPrimeNuitModalOpen, setIsPrimeNuitModalOpen] = useState(false);
    const [isDepartModalOpen, setIsDepartModalOpen] = useState(false);
    const [currentNavetteLigne, setCurrentNavetteLigne] = useState(null);
    const [currentEmployerAb, setCurrentEmployerAb] = useState(null);
    const [currentEmployerAccompte, setCurrentEmployerAccompte] = useState(null);
    const [currentEmployerHeure, setCurrentEmployerHeure] = useState(null);
    const [currentEmployerPrime, setCurrentEmployerPrime] = useState(null);
    const [currentEmployerPrimeNuit, setCurrentEmployerPrimeNuit] = useState(null);
    const [currentDepart, setCurrentDepart] = useState(null);
    const [abFormData, setAbFormData] = useState({ nb_jours: '', type_abs: '', motif: '', images: '' });
    const [accompteFormData, setAccompteFormData] = useState({ somme: '', motif: '', code_accompte: 'CL30' });
    const [heureFormData, setHeureFormData] = useState({ heures: '', pourcentage: '' });
    const [primeFormData, setPrimeFormData] = useState({ montant: '', type_prime: '' });
    const [primeNuitFormData, setPrimeNuitFormData] = useState({ code_prime_nuit: 'CL12', nb_jour: '' });
    const [departFormData, setDepartFormData] = useState({ date_depart: '', type_depart: '' });
    const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
    const [mutationFormData, setMutationFormData] = useState({
        service_new_id: '', periode_at: '', depart_at: '', arrivee_at: '',
        nb_jours_job: 0, nb_jour_abs: 0, accompte: 0, prime_nuit: 0,
        heure_sup_15: 0, heure_sup_50: 0, heure_sup_75: 0, is_cadre: 0,
    });
    const [allServices, setAllServices] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [currentImagesToDisplay, setCurrentImagesToDisplay] = useState([]);
    const [isSingleImageModalOpen, setIsSingleImageModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState('');
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [campagneStatus, setCampagneStatus] = useState('active');
    const [campagneDates, setCampagneDates] = useState(null); // { debut, fin }
    const [countdown, setCountdown] = useState(null); // { joursRestants, heuresRestantes, minutesRestantes, joursEcoules, totalJours, pourcentage, urgence }
    // Map employer_id → mutation en attente (pour bloquer édition / mutation)
    const [pendingMutationMap, setPendingMutationMap] = useState({});
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionModalLine, setActionModalLine] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const contentRef = useRef(null);
    const [expandedRows, setExpandedRows] = useState({});
    const [tableSearch, setTableSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'nom', dir: 'asc' });

    // const fetchNavetteData = useCallback(async () => {
    //     try {
    //         const userResponse = await api.get('users/me');
    //         const navetteResponse = await api.get(`navettes/service`);

    //         setUser(userResponse.data.user);
    //         const fetchedNavette = navetteResponse.data.data;
    //         setNavette(fetchedNavette);

    //         const sortedNavetteLines = fetchedNavette.navetteLignes
    //             .sort((a, b) => a.employer.nom.localeCompare(b.employer.nom));

    //         setNavetteLines(sortedNavetteLines);

    //     } catch (error) {
    //         console.error('Erreur lors de la récupération des informations :', error);
    //         Swal.fire('Erreur', 'Impossible de charger les données de la navette.', 'error');
    //     } finally {
    //         setLoading(false);
    //     }
    // }, []);

    const fetchNavetteData = useCallback(async () => {
        try {
            const [navetteResponse, pendingRes] = await Promise.all([
                api.get(`navettes/service`),
                api.get('/mutations/pending-employer-ids'),
            ]);

            const fetchedNavette = navetteResponse.data.data;
            const readOnly = navetteResponse.data.readOnly || false;
            const campStatus = navetteResponse.data.campagneStatus || 'active';
            const campDates = navetteResponse.data.campagneDates || null;

            setIsReadOnly(readOnly);
            setCampagneStatus(campStatus);
            setCampagneDates(campDates);

            // Construire la map employer_id → mutation en attente
            const pMap = {};
            (pendingRes.data.data || []).forEach(m => { pMap[m.employer_id] = m; });
            setPendingMutationMap(pMap);

            // 🚨 VÉRIFICATION CLÉ : Si aucune navette n'est retournée
            if (!fetchedNavette || Object.keys(fetchedNavette).length === 0) {
                console.log('Aucune navette trouvée pour le service actuel.');
                setNavette([]);
                setNavetteLines([]);
                return;
            }

            // Si une navette existe
            setNavette(fetchedNavette);

            const sortedNavetteLines = fetchedNavette.navetteLignes
                .sort((a, b) => a.employer.nom.localeCompare(b.employer.nom));

            setNavetteLines(sortedNavetteLines);

        } catch (error) {
            console.error('Erreur lors de la récupération des informations :', error);
            Swal.fire('Erreur', 'Impossible de charger les données de la navette.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNavetteData();
    }, [fetchNavetteData]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await api.get('/services');
                setAllServices(res.data.data || []);
            } catch (e) {
                console.error('Erreur chargement services:', e);
            }
        };
        fetchServices();
    }, []);

    // ── COUNTDOWN TIMER ──
    useEffect(() => {
        if (!campagneDates || !campagneDates.debut || !campagneDates.fin) {
            setCountdown(null);
            return;
        }
        const computeCountdown = () => {
            const now = new Date();
            const debut = new Date(campagneDates.debut);
            const fin = new Date(campagneDates.fin);
            // Normaliser fin à 23:59:59
            fin.setHours(23, 59, 59, 999);
            const totalMs = fin.getTime() - debut.getTime();
            const elapsedMs = now.getTime() - debut.getTime();
            const remainingMs = fin.getTime() - now.getTime();

            const totalJours = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
            const joursEcoules = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));

            if (remainingMs <= 0) {
                setCountdown({ joursRestants: 0, heuresRestantes: 0, minutesRestantes: 0, joursEcoules: totalJours, totalJours, pourcentage: 100, urgence: 'expired' });
                return;
            }
            const joursRestants = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
            const heuresRestantes = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutesRestantes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
            const pourcentage = Math.min(100, Math.round((elapsedMs / totalMs) * 100));

            let urgence = 'ok'; // vert
            if (joursRestants <= 1) urgence = 'critical'; // rouge
            else if (joursRestants <= 3) urgence = 'warning'; // orange
            else if (joursRestants <= 5) urgence = 'caution'; // jaune

            setCountdown({ joursRestants, heuresRestantes, minutesRestantes, joursEcoules, totalJours, pourcentage, urgence });
        };
        computeCountdown();
        const interval = setInterval(computeCountdown, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [campagneDates]);

    useEffect(() => {
        window.handleOpenModal = (type, lineData) => {
            const parsedLineData = JSON.parse(lineData.replace(/&quot;/g, '"'));
            switch (type) {
                case 'absences': openModal(setIsAbModalOpen, parsedLineData); break;
                case 'acomptes': openModal(setIsAccompteModalOpen, parsedLineData); break;
                case 'heures-sup': openModal(setIsHeureModalOpen, parsedLineData); break;
                case 'primes': openModal(setIsPrimeModalOpen, parsedLineData); break;
                case 'primes-nuit': openModal(setIsPrimeNuitModalOpen, parsedLineData); break;
                case 'depart': openModal(setIsDepartModalOpen, parsedLineData); break;
                case 'mutation': handleOpenMutationModal(parsedLineData); break;
                default: break;
            }
        };

        return () => {
            delete window.handleOpenModal; // Nettoyage lors du démontage du composant
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navette]);

    const currentStepIdx = navette ? ETAT_STEPS.findIndex(s => s.key === navette.etat) : -1;

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            contentRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, []);

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'En attente':
                return 'bg-warning';
            case 'En cours':
                return 'bg-info';
            case 'Terminer':
                return 'bg-success';
            case 'Annuler':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };
    const getStatusLigneBadgeClass = (status) => {
        switch (status) {
            case 'Non cadre':
                return 'bg-success';
            case 'Cadre':
                return 'bg-warning';
            default:
                return 'bg-secondary';
        }
    };

    const openModal = (modalSetter, navetteLigne, data = null) => {
        setCurrentNavetteLigne(navetteLigne);
        if (data) {
            // Populate form data if editing existing record
            if (modalSetter === setIsAbModalOpen) setAbFormData(data);
            if (modalSetter === setIsAccompteModalOpen) setAccompteFormData(data);
            if (modalSetter === setIsHeureModalOpen) setHeureFormData(data);
            if (modalSetter === setIsPrimeModalOpen) setPrimeFormData(data);
            if (modalSetter === setIsPrimeNuitModalOpen) setPrimeNuitFormData(data);
            if (modalSetter === setIsDepartModalOpen) setDepartFormData(data);
        } else {
            setAbFormData({ nb_jours: '', type_abs: '', motif: '', images: [] });
            setAccompteFormData({ somme: '', motif: '', code_accompte: 'CL30' });
            setHeureFormData({ heures: '', pourcentage: '' });
            setPrimeFormData({ montant: '', type_prime: '' });
            setPrimeNuitFormData({ code_prime_nuit: 'CL12', nb_jour: '' });
            setDepartFormData({ date_depart: '', type_depart: '' });
        }
        modalSetter(true);
    };

    const closeModal = (modalSetter) => {
        modalSetter(false);
        // Ne PAS réinitialiser currentNavetteLigne si le modal d'actions est toujours ouvert
        if (!isActionModalOpen) {
            setCurrentNavetteLigne(null);
        }
        setCurrentEmployerAb(null);
        setCurrentEmployerAccompte(null);
        setCurrentEmployerHeure(null);
        setCurrentEmployerPrime(null);
        setCurrentEmployerPrimeNuit(null);
        setCurrentDepart(null);
        setNewImages([]);
    };

    const closeActionModal = () => {
        setIsActionModalOpen(false);
        setActionModalLine(null);
        setCurrentNavetteLigne(null);
    };

    // Quand navetteLines se met à jour (après un fetchNavetteData), si le modal
    // d'actions est ouvert, on rafraîchit automatiquement la ligne affichée.
    // Ce useEffect lit toujours les valeurs courantes de isActionModalOpen et
    // actionModalLine, évitant ainsi le problème de closure stale.
    useEffect(() => {
        if (isActionModalOpen && actionModalLine && navetteLines.length > 0) {
            const updatedLine = navetteLines.find(l => l.id === actionModalLine.id);
            if (updatedLine) {
                setActionModalLine(updatedLine);
                setCurrentNavetteLigne(updatedLine);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navetteLines]);

    const handleChildSubmitImages = async (entityType, formData, isEdit, id = null, newFiles = [], filesToDelete = []) => {
        try {
            const dataToSend = new FormData();
            console.log(newFiles);
            console.log("Nouvelles images à envoyer:", newFiles); // Pour le debug
            console.log("Images existantes restantes:", formData.images.filter(img => !filesToDelete.includes(img))); // Pour le debug

            // Ajouter les champs texte du formulaire
            dataToSend.append('employer_id', currentNavetteLigne.employer_id);
            dataToSend.append('navette_id', navette.id);
            dataToSend.append('navette_ligne_id', currentNavetteLigne.id);
            dataToSend.append('nb_jours', formData.nb_jours);
            dataToSend.append('type_abs', formData.type_abs);
            dataToSend.append('motif', formData.motif);

            // Ajouter les nouvelles images
            newFiles.forEach((file, index) => {
                dataToSend.append(`images`, file);
            });

            const remainingExistingImages = formData.images.filter(imagePath => !filesToDelete.includes(imagePath));

            dataToSend.append('existing_images_json', JSON.stringify(remainingExistingImages));


            // Ajouter la liste des images à supprimer
            if (filesToDelete.length > 0) {
                dataToSend.append('images_to_delete', JSON.stringify(filesToDelete));
            }


            if (isEdit) {
                await api.put(`navettes/${entityType}/${id}`, dataToSend);
                Swal.fire('Succès', `${entityType} mis à jour avec succès!`, 'success');
            } else {
                await api.post(`navettes/${entityType}`, dataToSend);
                Swal.fire('Succès', `${entityType} créé avec succès!`, 'success');
            }
            closeModal(getModalSetter(entityType));
            await fetchNavetteData();
        } catch (error) {
            console.error(`Erreur lors de l'opération ${entityType}:`, error);
            Swal.fire('Erreur', `Impossible de sauvegarder ${entityType}.`, 'error');
        }
    };

    const handleChildSubmit = async (entityType, formData, isEdit, id = null) => {
        try {
            const dataToSend = {
                ...formData,
                employer_id: currentNavetteLigne.employer_id,
                navette_id: navette.id,
                navette_ligne_id: currentNavetteLigne.id,
            };
            if (isEdit) {
                await api.put(`navettes/${entityType}/${id}`, dataToSend);
                Swal.fire('Succès', `${entityType} mis à jour avec succès!`, 'success');
            } else {
                await api.post(`navettes/${entityType}`, dataToSend);
                Swal.fire('Succès', `${entityType} créé avec succès!`, 'success');
            }
            closeModal(getModalSetter(entityType));
            await fetchNavetteData();
        } catch (error) {
            console.error(`Erreur lors de l'opération ${entityType}:`, error);
            Swal.fire('Erreur', `Impossible de sauvegarder ${entityType}.`, 'error');
        }
    };

    const handleDeleteChild = async (entityType, id) => {
        Swal.fire({
            title: `Supprimer cette ${entityType} ?`,
            text: "Cette action est irréversible !",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimer!',
            cancelButtonText: 'Annuler'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`navettes/${entityType}/${id}`);
                    Swal.fire('Supprimé!', `${entityType} a été supprimé.`, 'success');
                    closeModal(getModalSetter(entityType));
                    await fetchNavetteData();
                } catch (error) {
                    console.error(`Erreur lors de la suppression de ${entityType}:`, error);
                    Swal.fire('Erreur', `Impossible de supprimer ${entityType}.`, 'error');
                }
            }
        });
    };

    const getModalSetter = (entityType) => {
        switch (entityType) {
            case 'absences': return setIsAbModalOpen;
            case 'acomptes': return setIsAccompteModalOpen;
            case 'heures-sup': return setIsHeureModalOpen;
            case 'primes': return setIsPrimeModalOpen;
            case 'primes-nuit': return setIsPrimeNuitModalOpen;
            case 'depart': return setIsDepartModalOpen;
            case 'mutation': return setIsMutationModalOpen;
            default: return null;
        }
    };

    const handleValidateUpdates = async () => {
        Swal.fire({
            title: 'Valider les mises à jour ?',
            text: "Confirmez-vous que les informations des employés sont validées ?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, valider!',
            cancelButtonText: 'Annuler'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // L'ID de la navette est disponible via l'état `navette`
                    await api.put(`navettes/${navette.id}/validate-updates`);
                    Swal.fire('Succès', 'Mises à jour validées et navette passée à l\'étape suivante!', 'success');
                    await fetchNavetteData(); // Recharger pour afficher le nouvel état
                } catch (error) {
                    console.error('Erreur lors de la validation des mises à jour :', error.response?.data?.message || error.message);
                    Swal.fire('Erreur', error.response?.data?.message || 'Impossible de valider les mises à jour.', 'error');
                }
            }
        });
    };

    const handleCorrection = async () => {
        Swal.fire({
            title: 'Correction des informations ?',
            text: "Activer la modification de ces information ?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, accorder!',
            cancelButtonText: 'Annuler'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // L'ID de la navette est disponible via l'état `navette`
                    await api.put(`navettes/${navette.id}/correction`);
                    Swal.fire('Succès', 'Autorisation de modification accordée avec succès !', 'success');
                    await fetchNavetteData(); // Recharger pour afficher le nouvel état
                } catch (error) {
                    console.error('Erreur lors de la validation des mises à jour :', error.response?.data?.message || error.message);
                    Swal.fire('Erreur', error.response?.data?.message || 'Impossible de valider les mises à jour.', 'error');
                }
            }
        });
    };

    const handleSendToPayroll = async () => {
        Swal.fire({
            title: 'Envoyer à la paie ?',
            text: "Confirmez-vous l'envoi de l'état navette à la paie ?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, envoyer!',
            cancelButtonText: 'Annuler'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.put(`navettes/${navette.id}/send-to-payroll`);
                    Swal.fire('Succès', 'Navette envoyée à la paie avec succès!', 'success');
                    await fetchNavetteData(); // Recharger pour afficher le nouvel état
                } catch (error) {
                    console.error('Erreur lors de l\'envoi à la paie :', error.response?.data?.message || error.message);
                    Swal.fire('Erreur', error.response?.data?.message || 'Impossible d\'envoyer la navette à la paie.', 'error');
                }
            }
        });
    };

    // ── SIGNALEMENT PROFESSIONNEL ──
    const [isSignalementModalOpen, setIsSignalementModalOpen] = useState(false);
    const [signalementSelections, setSignalementSelections] = useState({}); // { [navette_ligne_id]: { checked: bool, comment: string } }

    const openSignalementModal = () => {
        const selections = {};
        navetteLines.forEach(line => {
            selections[line.id] = {
                checked: !!line.correction_flag,
                comment: line.correction_comment || ''
            };
        });
        setSignalementSelections(selections);
        setIsSignalementModalOpen(true);
    };

    const handleSignalementToggle = (lineId) => {
        setSignalementSelections(prev => ({
            ...prev,
            [lineId]: { ...prev[lineId], checked: !prev[lineId]?.checked }
        }));
    };

    const handleSignalementComment = (lineId, comment) => {
        setSignalementSelections(prev => ({
            ...prev,
            [lineId]: { ...prev[lineId], comment }
        }));
    };

    const handleSignalementSubmit = async () => {
        const lignesSignalees = Object.entries(signalementSelections)
            .filter(([, v]) => v.checked)
            .map(([id, v]) => ({ navette_ligne_id: parseInt(id), comment: v.comment || '' }));

        if (lignesSignalees.length === 0) {
            Swal.fire('Attention', 'Veuillez sélectionner au moins une ligne à signaler.', 'warning');
            return;
        }

        const hasEmptyComments = lignesSignalees.some(l => !l.comment || !l.comment.trim());
        if (hasEmptyComments) {
            Swal.fire('Attention', 'Veuillez ajouter un commentaire pour chaque ligne signalée.', 'warning');
            return;
        }

        const result = await Swal.fire({
            title: `Signaler ${lignesSignalees.length} ligne${lignesSignalees.length > 1 ? 's' : ''} ?`,
            text: "L'état navette sera renvoyé au manager pour correction.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Confirmer le signalement',
            cancelButtonText: 'Annuler',
        });

        if (!result.isConfirmed) return;

        try {
            await api.put(`navettes/${navette.id}/signaler`, { lignes: lignesSignalees });
            Swal.fire('Succès', 'Signalement envoyé avec succès !', 'success');
            setIsSignalementModalOpen(false);
            await fetchNavetteData();
        } catch (error) {
            Swal.fire('Erreur', error.response?.data?.message || 'Impossible de signaler le problème.', 'error');
        }
    };

    const renderSignalementModal = () => {
        const selectedCount = Object.values(signalementSelections).filter(v => v.checked).length;

        return (
            <Modal isOpen={isSignalementModalOpen} onRequestClose={() => setIsSignalementModalOpen(false)}
                style={{ ...subModalStyles, content: { ...subModalStyles.content, maxWidth: '780px' } }}
                contentLabel="Signaler des corrections">
                <div className="modal-hdr" style={{ background: 'linear-gradient(135deg, #f06548, #d9534f)' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="ri-error-warning-line" style={{ fontSize: '1.2rem', color: '#fff' }}></i>
                        </div>
                        <div>
                            <h5 className="mb-0 text-white" style={{ fontSize: '1.05rem', fontWeight: 700 }}>Signaler des corrections</h5>
                            <span style={{ color: 'rgba(255,255,255,.7)', fontSize: '.75rem' }}>Sélectionnez les lignes à corriger et ajoutez vos commentaires</span>
                        </div>
                    </div>
                    <button onClick={() => setIsSignalementModalOpen(false)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, fontSize: '.9rem', cursor: 'pointer' }}>✕</button>
                </div>
                <div className="modal-body-c" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {/* Summary bar */}
                    <div className="d-flex align-items-center justify-content-between mb-3 p-2" style={{ background: '#f8f9fa', borderRadius: 10 }}>
                        <span style={{ fontSize: '.82rem', color: '#495057', fontWeight: 600 }}>
                            <i className="ri-checkbox-multiple-line me-1 text-primary"></i>
                            {selectedCount} ligne{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '.75rem', color: '#878a99' }}>{navetteLines.length} employés au total</span>
                    </div>

                    {/* Lines list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {navetteLines.map(line => {
                            const sel = signalementSelections[line.id] || { checked: false, comment: '' };
                            const emp = line.employer;
                            return (
                                <div key={line.id} style={{
                                    border: sel.checked ? '2px solid #f06548' : '1.5px solid #e9ecef',
                                    borderRadius: 12, padding: '12px 16px',
                                    background: sel.checked ? '#fef2f0' : '#fff',
                                    transition: 'all .2s',
                                }}>
                                    <div className="d-flex align-items-center gap-3">
                                        <input type="checkbox" className="form-check-input"
                                            checked={sel.checked}
                                            onChange={() => handleSignalementToggle(line.id)}
                                            style={{ width: 20, height: 20, cursor: 'pointer' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="fw-semibold" style={{ fontSize: '.85rem' }}>{emp.nom} {emp.prenom}</span>
                                                <code style={{ fontSize: '.72rem', background: '#f0f2f5', padding: '1px 6px', borderRadius: 4 }}>{emp.matricule}</code>
                                                <span className={`badge rounded-pill ${line.status === 'Cadre' ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'}`} style={{ fontSize: '.62rem' }}>{line.status}</span>
                                            </div>
                                            <div className="d-flex gap-3 mt-1" style={{ fontSize: '.72rem', color: '#878a99' }}>
                                                <span>Jours: {line.nb_jours}</span>
                                                <span>Abs: {line.nb_jour_abs || 0}</span>
                                                <span>Acompte: {line.accompte ? `${line.accompte.toLocaleString()} F` : '—'}</span>
                                                <span>P.Nuit: {line.prime_nuit || '—'}</span>
                                            </div>
                                        </div>
                                        {sel.checked && <i className="ri-error-warning-fill text-danger" style={{ fontSize: '1.1rem' }}></i>}
                                    </div>
                                    {sel.checked && (
                                        <div className="mt-2" style={{ marginLeft: 36 }}>
                                            <textarea
                                                className="form-control"
                                                placeholder="Décrivez le problème constaté sur cette ligne..."
                                                value={sel.comment}
                                                onChange={(e) => handleSignalementComment(line.id, e.target.value)}
                                                rows={2}
                                                style={{ fontSize: '.82rem', borderColor: '#f06548', borderRadius: 8, resize: 'vertical' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* Footer */}
                <div style={{ padding: '14px 24px', borderTop: '1px solid #e9ecef', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.78rem', color: '#878a99' }}>
                        {selectedCount > 0 ? <><i className="ri-error-warning-line text-danger me-1"></i>{selectedCount} correction{selectedCount > 1 ? 's' : ''} à envoyer</> : 'Aucune ligne sélectionnée'}
                    </span>
                    <div className="d-flex gap-2">
                        <button className="btn btn-light btn-sm" style={{ borderRadius: 8 }} onClick={() => setIsSignalementModalOpen(false)}>Annuler</button>
                        <button className="btn btn-danger btn-sm" style={{ borderRadius: 8 }} disabled={selectedCount === 0} onClick={handleSignalementSubmit}>
                            <i className="ri-send-plane-fill me-1"></i>Envoyer le signalement
                        </button>
                    </div>
                </div>
            </Modal>
        );
    };

    const handleCloseNavette = async () => {
        Swal.fire({
            title: 'Clôturer la navette ?',
            text: "Cette action clôturera définitivement la navette. Êtes-vous sûr ?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, clôturer!',
            cancelButtonText: 'Annuler'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.put(`navettes/${navette.id}/close`);
                    Swal.fire('Succès', 'Navette clôturée avec succès!', 'success');
                    await fetchNavetteData();
                } catch (error) {
                    Swal.fire('Erreur', error.response?.data?.message || 'Impossible de clôturer la navette.', 'error');
                }
            }
        });
    };

    // --- MUTATION : Pré-calcul et ouverture du modal ---
    const handleOpenMutationModal = (navetteLigne) => {
        if (!navette) return;

        // Bloquer si l'employé a déjà une mutation en attente
        const emp = navetteLigne.employer;
        if (pendingMutationMap[emp.id]) {
            const pm = pendingMutationMap[emp.id];
            Swal.fire({
                icon: 'warning',
                title: 'Mutation impossible',
                html: `<strong>${emp.nom} ${emp.prenom}</strong> (${emp.matricule}) a déjà une mutation <span class="badge bg-warning">En attente</span> vers le service <strong>${pm.serviceNew?.name || '—'}</strong>.<br/><br/>Veuillez d'abord <strong>valider</strong>, <strong>rejeter</strong> ou <strong>annuler</strong> cette mutation existante avant d'en créer une nouvelle.`,
                confirmButtonText: 'Compris',
            });
            return;
        }

        setCurrentNavetteLigne(navetteLigne);

        // Utiliser directement les champs pré-calculés de la ligne navette
        const absencesReductrices = navetteLigne.nb_jour_abs_reduit || 0;
        const totalAbsJours = navetteLigne.nb_jour_abs || 0;
        const totalAccompte = navetteLigne.accompte || 0;
        const totalPrimeNuit = navetteLigne.prime_nuit || 0;

        // Période formatée en YYYY-MM
        const periodeDate = new Date(navette.periode_at);
        const periodeFormatted = `${periodeDate.getFullYear()}-${String(periodeDate.getMonth() + 1).padStart(2, '0')}`;

        // Date de départ = aujourd'hui
        const today = new Date().toISOString().split('T')[0];

        // Calcul des jours travaillés : jours entre 1er du mois et date départ - absences réductrices
        const debutPeriode = new Date(periodeDate.getFullYear(), periodeDate.getMonth(), 1);
        const departDate = new Date(today);
        const diffTime = departDate.getTime() - debutPeriode.getTime();
        const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        const nbJoursJob = Math.min(30, Math.max(0, diffDays - absencesReductrices));

        setMutationFormData({
            service_new_id: '',
            periode_at: periodeFormatted,
            depart_at: today,
            arrivee_at: '',
            nb_jours_job: nbJoursJob,
            nb_jour_abs: totalAbsJours,
            absences_reductrices: absencesReductrices,
            accompte: totalAccompte,
            prime_nuit: totalPrimeNuit,
            heure_sup_15: navetteLigne.heure_sup_15 || 0,
            heure_sup_50: navetteLigne.heure_sup_50 || 0,
            heure_sup_75: navetteLigne.heure_sup_75 || 0,
            is_cadre: emp?.is_cadre ? 1 : 0,
        });
        setIsMutationModalOpen(true);
    };

    // Recalcul dynamique des jours travaillés quand la date de départ change
    const handleMutationDepartChange = (newDepartAt) => {
        const periodeDate = new Date(navette.periode_at);
        const debutPeriode = navette.periode_debut_at
            ? new Date(navette.periode_debut_at)
            : new Date(periodeDate.getFullYear(), periodeDate.getMonth(), 1);
        const departDate = new Date(newDepartAt);
        const diffTime = departDate.getTime() - debutPeriode.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const nbJoursJob = Math.min(30, Math.max(0, diffDays - (mutationFormData.absences_reductrices || 0)));

        setMutationFormData(prev => ({
            ...prev,
            depart_at: newDepartAt,
            nb_jours_job: nbJoursJob,
        }));
    };

    const handleMutationSubmit = async (e) => {
        e.preventDefault();
        if (!mutationFormData.service_new_id || !mutationFormData.periode_at) {
            Swal.fire('Attention', 'Veuillez renseigner le nouveau service et la période.', 'warning');
            return;
        }
        if (String(mutationFormData.service_new_id) === String(navette.service?.id)) {
            Swal.fire('Attention', 'Le nouveau service doit être différent du service actuel.', 'warning');
            return;
        }
        try {
            const dataToSend = {
                employer_id: currentNavetteLigne.employer_id,
                service_old_id: navette.service?.id,
                service_new_id: parseInt(mutationFormData.service_new_id),
                navette_id: navette.id,
                navette_ligne_id: currentNavetteLigne.id,
                periode_at: mutationFormData.periode_at + '-01',
                depart_at: mutationFormData.depart_at,
                arrivee_at: mutationFormData.arrivee_at,
                nb_jours_job: parseInt(mutationFormData.nb_jours_job) || 0,
                nb_jour_abs: parseInt(mutationFormData.nb_jour_abs) || 0,
                accompte: parseInt(mutationFormData.accompte) || 0,
                prime_nuit: parseInt(mutationFormData.prime_nuit) || 0,
                heure_sup_15: parseInt(mutationFormData.heure_sup_15) || 0,
                heure_sup_50: parseInt(mutationFormData.heure_sup_50) || 0,
                heure_sup_75: parseInt(mutationFormData.heure_sup_75) || 0,
                is_cadre: mutationFormData.is_cadre,
            };
            await api.post('/mutations', dataToSend);
            Swal.fire('Succès', 'Mutation créée avec succès!', 'success');
            setIsMutationModalOpen(false);
            if (!isActionModalOpen) setCurrentNavetteLigne(null);
            await fetchNavetteData();
        } catch (error) {
            console.error('Erreur mutation:', error);
            Swal.fire('Erreur', error.response?.data?.message || 'Impossible de créer la mutation.', 'error');
        }
    };

    const renderMutationModal = () => (
        <Modal isOpen={isMutationModalOpen} onRequestClose={() => { setIsMutationModalOpen(false); if (!isActionModalOpen) setCurrentNavetteLigne(null); }} style={subModalStyles} contentLabel="Créer une Mutation">
            <div className="modal-hdr" style={{ background: 'linear-gradient(135deg, #405189, #2e3a5f)' }}>
                <h5 className="mb-0 text-white d-flex align-items-center gap-2"><i className="ri-shuffle-line"></i> Muter {currentNavetteLigne?.employer?.nom} {currentNavetteLigne?.employer?.prenom}</h5>
                <button onClick={() => { setIsMutationModalOpen(false); if (!isActionModalOpen) setCurrentNavetteLigne(null); }} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, fontSize: '.9rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body-c">
            <div className="alert alert-info p-2 d-flex justify-content-between align-items-center mb-3">
                <strong>Matricule : {currentNavetteLigne?.employer?.matricule}</strong>
                <span className="badge bg-secondary">Service actuel : {navette?.service?.name}</span>
                <span className="badge bg-info">Cadre : {mutationFormData.is_cadre ? 'Oui' : 'Non'}</span>
            </div>
            <form onSubmit={handleMutationSubmit}>
                <div className="row">
                    <div className="col-md-6">
                        <h6 className="text-primary">Mouvement</h6>
                        <hr />
                        <div className="mb-3">
                            <label className="form-label">Nouveau Service <span className="text-danger">*</span></label>
                            <select className="form-select" value={mutationFormData.service_new_id}
                                onChange={(e) => setMutationFormData({ ...mutationFormData, service_new_id: e.target.value })} required>
                                <option value="">Sélectionner le nouveau service</option>
                                {allServices.filter(s => s.id !== navette?.service?.id).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Période</label>
                            <input type="month" className="form-control bg-light" value={mutationFormData.periode_at} readOnly />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Date de départ du service <span className="text-danger">*</span></label>
                            <input type="date" className="form-control" value={mutationFormData.depart_at}
                                onChange={(e) => handleMutationDepartChange(e.target.value)} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Date d'arrivée prévue</label>
                            <input type="date" className="form-control" value={mutationFormData.arrivee_at}
                                onChange={(e) => setMutationFormData({ ...mutationFormData, arrivee_at: e.target.value })} />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <h6 className="text-primary">Récapitulatif ligne navette <small className="text-muted">(lecture seule)</small></h6>
                        <hr />
                        <div className="row">
                            <div className="col-6 mb-2">
                                <label className="form-label">Jours travaillés</label>
                                <input type="number" className="form-control bg-light fw-bold" value={mutationFormData.nb_jours_job} readOnly />
                                <small className="text-muted">Calculé auto. (départ - début période - abs. déductibles)</small>
                            </div>
                            <div className="col-6 mb-2">
                                <label className="form-label">Jours d'absence</label>
                                <input type="number" className="form-control bg-light" value={mutationFormData.nb_jour_abs} readOnly />
                            </div>
                            <div className="col-6 mb-2">
                                <label className="form-label">Acompte (F CFA)</label>
                                <input type="number" className="form-control bg-light" value={mutationFormData.accompte} readOnly />
                            </div>
                            <div className="col-6 mb-2">
                                <label className="form-label">Prime Nuit (Jours)</label>
                                <input type="number" className="form-control bg-light" value={mutationFormData.prime_nuit} readOnly />
                            </div>
                            <div className="col-4 mb-2">
                                <label className="form-label">H.Sup 15%</label>
                                <input type="number" className="form-control bg-light" value={mutationFormData.heure_sup_15} readOnly />
                            </div>
                            <div className="col-4 mb-2">
                                <label className="form-label">H.Sup 50%</label>
                                <input type="number" className="form-control bg-light" value={mutationFormData.heure_sup_50} readOnly />
                            </div>
                            <div className="col-4 mb-2">
                                <label className="form-label">H.Sup 75%</label>
                                <input type="number" className="form-control bg-light" value={mutationFormData.heure_sup_75} readOnly />
                            </div>
                        </div>
                        <div className="form-check mt-2">
                            <input className="form-check-input" type="checkbox" checked={mutationFormData.is_cadre === 1} disabled />
                            <label className="form-check-label">Cadre ?</label>
                        </div>
                    </div>
                </div>
                <hr />
                <div className="d-flex justify-content-end gap-2">
                    <button type="submit" className="btn btn-primary">Créer la mutation</button>
                    <button type="button" className="btn btn-light" style={{ borderRadius: 10 }} onClick={() => { setIsMutationModalOpen(false); if (!isActionModalOpen) setCurrentNavetteLigne(null); }}>Annuler</button>
                </div>
            </form>
            </div>
        </Modal>
    );

    const renderAbModal = () => (
        <Modal isOpen={isAbModalOpen} onRequestClose={() => closeModal(setIsAbModalOpen)} style={subModalStyles} contentLabel="Gérer Absences">
            <div className="modal-hdr" style={{ background: 'linear-gradient(135deg, #0ab39c, #099885)' }}>
                <h5 className="mb-0 text-white d-flex align-items-center gap-2"><i className="ri-calendar-line"></i> {currentEmployerAb ? 'Modifier une absence de' : 'Ajouter des absences pour'} {currentNavetteLigne?.employer?.nom} {currentNavetteLigne?.employer?.prenom}</h5>
                <button onClick={() => closeModal(setIsAbModalOpen)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, fontSize: '.9rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body-c">
            <form onSubmit={(e) => { e.preventDefault(); handleChildSubmitImages('absences', abFormData, !!currentEmployerAb, currentEmployerAb?.id, newImages, imagesToDelete); }}>
                <div className="mb-3">
                    <label className="form-label">Nombre de jours <span style={{ color: 'red' }} >*</span> </label>
                    <input
                        type="number"
                        className="form-control"
                        value={abFormData.nb_jours}
                        onChange={(e) => setAbFormData({ ...abFormData, nb_jours: parseInt(e.target.value, 10) || 0 })}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Type d'absence  <span style={{ color: 'red' }} >*</span> </label>
                    <select
                        className="form-select"
                        value={abFormData.type_abs}
                        onChange={(e) => setAbFormData({ ...abFormData, type_abs: e.target.value })}
                        required
                    >
                        {['', 'ABSENCE_NON_REMUNEREE', 'ACCIDENT_DE_TRAVAIL', 'ABSENCE_MISE_A_PIEDS', 'ABSENCE_CONGES_DE_MATERNITE', 'ABSENCE_CONGES_PAYE', 'ABSENCE_REMUNEREE', 'ABSENCE_PATERNITE', 'ABSENCE_MALADIE', 'ABSENCE_FORMATION', 'ABSENCE_CONGES_A_CALCULER', 'ABSENCE_CONGES_SUP_MATERNITE'].map(type => (
                            <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label">Commentaire  <span style={{ color: 'red' }} >*</span> </label>
                    <textarea
                        className="form-control"
                        value={abFormData.motif}
                        required
                        onChange={(e) => setAbFormData({ ...abFormData, motif: e.target.value })}
                    ></textarea>
                </div>

                {abFormData.images && abFormData.images.length > 0 && (
                    <div className="mb-3">
                        <label className="form-label">Liste des images/PDF rattachés :</label>
                        <div className="d-flex flex-wrap gap-2">
                            {abFormData.images.map((fileUrl, index) => {
                                const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
                                return (
                                    <div key={index} className="position-relative" style={{ width: '100px', height: '100px' }}>
                                        {isPdf ? (
                                            <div className="d-flex align-items-center justify-content-center border" style={{ width: '100%', height: '100%' }}>
                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary" style={{ fontSize: '0.75rem' }}>
                                                    Voir PDF
                                                </a>
                                            </div>
                                        ) : (
                                            <img
                                                src={fileUrl}
                                                alt={`Absence ${index}`}
                                                className="img-thumbnail"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm position-absolute top-0 end-0"
                                            onClick={() => {
                                                setAbFormData(prev => ({
                                                    ...prev,
                                                    images: prev.images.filter(img => img !== fileUrl)
                                                }));
                                                setImagesToDelete(prev => [...prev, fileUrl]);
                                            }}
                                        >
                                            X
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="mb-3">
                    <label htmlFor="newImagesInput" className="form-label">Ajouter de nouveaux fichiers (images ou PDF) :</label>
                    <input
                        type="file"
                        className="form-control"
                        id="newImagesInput"
                        multiple
                        accept="image/*, .pdf"
                        onChange={(e) => setNewImages(prevFiles => [...prevFiles, ...Array.from(e.target.files)])}
                    />

                    {newImages.length > 0 && (
                        <div className="mt-2">
                            <label className="form-label">Nouveaux fichiers à uploader :</label>
                            <div className="d-flex flex-wrap gap-2">
                                {newImages.map((file, index) => {
                                    const isImage = file.type.startsWith('image/');
                                    return (
                                        <div key={file.name + file.lastModified} className="position-relative" style={{ width: '100px', height: '100px' }}>
                                            {isImage ? (
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Nouveau fichier ${index}`}
                                                    className="img-thumbnail"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onLoad={() => URL.revokeObjectURL(file)}
                                                />
                                            ) : (
                                                <div className="d-flex flex-column align-items-center justify-content-center border" style={{ width: '100%', height: '100%', padding: '5px' }}>
                                                    <i className="bi bi-file-earmark-pdf" style={{ fontSize: '2rem' }}></i>
                                                    <span style={{ fontSize: '0.7rem', textAlign: 'center', wordBreak: 'break-all' }}>{file.name}</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                style={{ width: '20px', height: '20px', fontSize: '0.75rem' }}
                                                onClick={() => {
                                                    // Correction : J'utilise `setNewImages`
                                                    setNewImages(prev => prev.filter((_, i) => i !== index));
                                                }}
                                            >
                                                X
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                <b>NB: <span style={{ color: 'red' }} >*</span> obligatoire</b>

                <div className="d-flex justify-content-end gap-2">
                    <button type="submit" className="btn btn-primary">{currentEmployerAb ? 'Modifier' : 'Ajouter'}</button>
                    <button type="button" className="btn btn-light" style={{ borderRadius: 10 }} onClick={() => closeModal(setIsAbModalOpen)}>Quitter</button>
                </div>
            </form>
            {currentNavetteLigne?.absences?.length > 0 && (
                <div className="mt-4">
                    <h5>Historique des Absences pour {currentNavetteLigne?.employer?.nom} {currentNavetteLigne?.employer?.prenom}:</h5>
                    <table className="table table-striped table-hover mt-2">
                        <thead>
                            <tr>
                                <th>Jours</th>
                                <th>Type</th>
                                <th>Motif</th>
                                <th>Fichiers</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentNavetteLigne.absences.map(ab => (
                                <tr key={ab.id}>
                                    <td>{ab.nb_jours}</td>
                                    <td>{ab.type_abs.replace(/_/g, ' ')}</td>
                                    <td>{ab.motif || 'N/A'}</td>
                                    <td>
                                        {ab.images && ab.images.length > 0 ? (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => openImageModal(ab.images)}
                                            >
                                                Voir Fichiers
                                            </button>
                                        ) : (
                                            'Aucun'
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-info me-2"
                                            onClick={() => {
                                                setCurrentEmployerAb(ab);
                                                setAbFormData({
                                                    ...ab,
                                                    images: Array.isArray(ab.images) ? ab.images : (ab.images ? JSON.parse(ab.images) : [])
                                                });

                                                setNewImages([]);
                                                setImagesToDelete([]);
                                            }}
                                        >
                                            Éditer
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteChild('absences', ab.id)}>Supprimer</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            </div>
        </Modal>
    );

    const renderAccompteModal = () => (
        <Modal isOpen={isAccompteModalOpen} onRequestClose={() => closeModal(setIsAccompteModalOpen)} style={subModalStyles} contentLabel="Gérer Acomptes">
            <div className="modal-hdr" style={{ background: 'linear-gradient(135deg, #f7b84b, #e5a63b)' }}>
                <h5 className="mb-0 text-white d-flex align-items-center gap-2"><i className="ri-money-dollar-circle-line"></i> {currentEmployerAccompte ? 'Modifier un acompte de' : 'Ajouter un acompte pour'} {currentNavetteLigne?.employer?.nom} {currentNavetteLigne?.employer?.prenom}</h5>
                <button onClick={() => closeModal(setIsAccompteModalOpen)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, fontSize: '.9rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body-c">
            <form onSubmit={(e) => { e.preventDefault(); handleChildSubmit('acomptes', accompteFormData, !!currentEmployerAccompte, currentEmployerAccompte?.id); }}>
                <div className="mb-3">
                    <label className="form-label">Code Sage <span style={{ color: 'red' }} >*</span></label>
                    <select className="form-select" value={accompteFormData.code_accompte || 'CL30'} onChange={(e) => setAccompteFormData({ ...accompteFormData, code_accompte: e.target.value })} required>
                        <optgroup label="Acompte">
                            <option value="CL30">CL30 - Acompte</option>
                        </optgroup>
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label">Somme <span style={{ color: 'red' }} >*</span></label>
                    <input type="number" step="0.01" className="form-control" value={accompteFormData.somme} onChange={(e) => setAccompteFormData({ ...accompteFormData, somme: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Motif</label>
                    <textarea className="form-control" value={accompteFormData.motif} onChange={(e) => setAccompteFormData({ ...accompteFormData, motif: e.target.value })}></textarea>
                </div>
                <b>NB: <span style={{ color: 'red' }} >*</span> obligatoire</b>
                {/* Champ images si nécessaire */}
                <div className="d-flex justify-content-end gap-2">
                    <button type="submit" className="btn btn-primary">{currentEmployerAccompte ? 'Modifier' : 'Ajouter'}</button>
                    <button type="button" className="btn btn-light" style={{ borderRadius: 10 }} onClick={() => closeModal(setIsAccompteModalOpen)}>Quitter</button>
                </div>
            </form>
            {currentNavetteLigne?.acomptes?.length > 0 && (
                <div className="mt-4">
                    <h5>Liste des acomptes :</h5>
                    <ul className="list-group">
                        {currentNavetteLigne.acomptes.map(acc => (
                            <li key={acc.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <span><code>{acc.code_accompte || 'CL30'}</code> — {acc.somme} F CFA - {acc.motif || 'Aucun motif'}</span>
                                <div>
                                    <button className="btn btn-sm btn-info me-2" onClick={() => { setCurrentEmployerAccompte(acc); setAccompteFormData({ somme: acc.somme, motif: acc.motif, code_accompte: acc.code_accompte || 'CL30' }); }}>Éditer</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteChild('acomptes', acc.id)}>Supprimer</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            </div>
        </Modal>
    );

    const renderHeureModal = () => (
        <Modal isOpen={isHeureModalOpen} onRequestClose={() => closeModal(setIsHeureModalOpen)} style={subModalStyles} contentLabel="Gérer Heures Sup.">
            <div className="modal-hdr" style={{ background: 'linear-gradient(135deg, #405189, #3577f1)' }}>
                <h5 className="mb-0 text-white d-flex align-items-center gap-2"><i className="ri-time-line"></i> {currentEmployerHeure ? 'Modifier les heures sup. de' : 'Ajouter des heures sup. pour'} {currentNavetteLigne?.employer?.nom} {currentNavetteLigne?.employer?.prenom}</h5>
                <button onClick={() => closeModal(setIsHeureModalOpen)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, fontSize: '.9rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body-c">
            <form onSubmit={(e) => { e.preventDefault(); handleChildSubmit('heures-sup', heureFormData, !!currentEmployerHeure, currentEmployerHeure?.id); }}>
                <div className="mb-3">
                    <label className="form-label">Heures <span style={{ color: 'red' }} >*</span></label>
                    <input type="number" step="0.5" className="form-control" value={heureFormData.heures} onChange={(e) => setHeureFormData({ ...heureFormData, heures: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Pourcentage <span style={{ color: 'red' }} >*</span></label>
                    <select
                        className="form-select"
                        value={heureFormData.pourcentage}
                        onChange={(e) => setHeureFormData({ ...heureFormData, pourcentage: e.target.value })}
                        required
                    >
                        <option value=""></option>
                        <option value="15">15%</option>
                        {/* <option value="50">50%</option> */}
                        <option value="75">75%</option>
                    </select>
                </div>
                <b>NB: <span style={{ color: 'red' }} >*</span> obligatoire</b>
                <div className="d-flex justify-content-end gap-2">
                    <button type="submit" className="btn btn-primary">{currentEmployerHeure ? 'Modifier' : 'Ajouter'}</button>
                    <button type="button" className="btn btn-light" style={{ borderRadius: 10 }} onClick={() => closeModal(setIsHeureModalOpen)}>Quitter</button>
                </div>
            </form>
            {currentNavetteLigne?.heuresSup?.length > 0 && (
                <div className="mt-4">
                    <h5>Liste des heures supplémentaires :</h5>
                    <ul className="list-group">
                        {currentNavetteLigne.heuresSup.map(h => (
                            <li key={h.id} className="list-group-item d-flex justify-content-between align-items-center">
                                {h.heures} heures de {h.pourcentage}%
                                <div>
                                    <button className="btn btn-sm btn-info me-2" onClick={() => { setCurrentEmployerHeure(h); setHeureFormData(h); }}>Éditer</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteChild('heures-sup', h.id)}>Supprimer</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            </div>
        </Modal>
    );

    const renderPrimeModal = () => (
        <Modal isOpen={isPrimeModalOpen} onRequestClose={() => closeModal(setIsPrimeModalOpen)} style={subModalStyles} contentLabel="Gérer Primes">
            <div className="modal-hdr" style={{ background: 'linear-gradient(135deg, #0ab39c, #099885)' }}>
                <h5 className="mb-0 text-white d-flex align-items-center gap-2"><i className="ri-award-line"></i> {currentEmployerPrime ? 'Modifier la prime de' : 'Ajouter une prime pour'} {currentNavetteLigne?.employer?.nom} {currentNavetteLigne?.employer?.prenom}</h5>
                <button onClick={() => closeModal(setIsPrimeModalOpen)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, fontSize: '.9rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body-c">
            <form onSubmit={(e) => { e.preventDefault(); handleChildSubmit('primes', primeFormData, !!currentEmployerPrime, currentEmployerPrime?.id); }}>
                <div className="mb-3">
                    <label className="form-label">Montant <span style={{ color: 'red' }} >*</span></label>
                    <input type="number" step="0.01" className="form-control" value={primeFormData.montant} onChange={(e) => setPrimeFormData({ ...primeFormData, montant: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Type de prime <span style={{ color: 'red' }} >*</span></label>
                    <select
                        className="form-select"
                        value={primeFormData.type_prime}
                        onChange={(e) => setPrimeFormData({ ...primeFormData, type_prime: e.target.value })}
                        required
                    >
                        <option value=""></option>
                        <optgroup label="Primes courantes">
                            {['PRIME CAISSE', 'PRIME IMPOSABLE', 'PRIME ASTREINTE', 'PRIME DE FRAIS', 'PRIME TENUE', 'PRIME INVENTAIRE', 'PRIME DE PANIER', 'PRIME DE TRANSPORT DE NUIT'].map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>
                <b>NB: <span style={{ color: 'red' }} >*</span> obligatoire</b>

                <div className="d-flex justify-content-end gap-2">
                    <button type="submit" className="btn btn-primary">{currentEmployerPrime ? 'Modifier' : 'Ajouter'}</button>
                    <button type="button" className="btn btn-light" style={{ borderRadius: 10 }} onClick={() => closeModal(setIsPrimeModalOpen)}>Quitter</button>
                </div>
            </form>
            {currentNavetteLigne?.primes?.length > 0 && (
                <div className="mt-4">
                    <h5>Liste des primes :</h5>
                    <ul className="list-group">
                        {currentNavetteLigne.primes.map(p => (
                            <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                                {p.montant} F CFA ({p.type_prime || 'N/A'})
                                <div>
                                    <button className="btn btn-sm btn-info me-2" onClick={() => { setCurrentEmployerPrime(p); setPrimeFormData(p); }}>Éditer</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteChild('primes', p.id)}>Supprimer</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            </div>
        </Modal>
    );

    const renderPrimeNuitModal = () => (
        <Modal isOpen={isPrimeNuitModalOpen} onRequestClose={() => closeModal(setIsPrimeNuitModalOpen)} style={subModalStyles} contentLabel="Gérer Primes de Nuit">
            <div className="modal-hdr" style={{ background: 'linear-gradient(135deg, #2e3a5f, #1a1f36)' }}>
                <h5 className="mb-0 text-white d-flex align-items-center gap-2"><i className="ri-moon-line"></i> {currentEmployerPrimeNuit ? 'Modifier une prime de nuit de' : 'Ajouter une prime de nuit pour'} {currentNavetteLigne?.employer?.nom} {currentNavetteLigne?.employer?.prenom}</h5>
                <button onClick={() => closeModal(setIsPrimeNuitModalOpen)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, fontSize: '.9rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body-c">
            <form onSubmit={(e) => { e.preventDefault(); handleChildSubmit('primes-nuit', primeNuitFormData, !!currentEmployerPrimeNuit, currentEmployerPrimeNuit?.id); }}>
                <div className="mb-3">
                    <label className="form-label">Code prime <span style={{ color: 'red' }} >*</span></label>
                    <select className="form-select" value={primeNuitFormData.code_prime_nuit} onChange={(e) => setPrimeNuitFormData({ ...primeNuitFormData, code_prime_nuit: e.target.value })} required>
                        <option value="CL12">CL12 — Prime de nuit</option>
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label">Nombre de jours <span style={{ color: 'red' }} >*</span></label>
                    <input type="number" step="1" min="0" className="form-control" value={primeNuitFormData.nb_jour} onChange={(e) => setPrimeNuitFormData({ ...primeNuitFormData, nb_jour: parseInt(e.target.value, 10) || 0 })} required />
                </div>
                <b>NB: <span style={{ color: 'red' }} >*</span> obligatoire</b>
                <div className="d-flex justify-content-end gap-2">
                    <button type="submit" className="btn btn-primary">{currentEmployerPrimeNuit ? 'Modifier' : 'Ajouter'}</button>
                    <button type="button" className="btn btn-light" style={{ borderRadius: 10 }} onClick={() => closeModal(setIsPrimeNuitModalOpen)}>Quitter</button>
                </div>
            </form>
            {currentNavetteLigne?.primesNuit?.length > 0 && (
                <div className="mt-4">
                    <h5>Liste des primes de nuit :</h5>
                    <ul className="list-group">
                        {currentNavetteLigne.primesNuit.map(pn => (
                            <li key={pn.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <span><code>{pn.code_prime_nuit}</code> — {pn.nb_jour} jour{pn.nb_jour > 1 ? 's' : ''}</span>
                                <div>
                                    <button className="btn btn-sm btn-info me-2" onClick={() => { setCurrentEmployerPrimeNuit(pn); setPrimeNuitFormData({ code_prime_nuit: pn.code_prime_nuit || 'CL12', nb_jour: pn.nb_jour }); }}>Éditer</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteChild('primes-nuit', pn.id)}>Supprimer</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            </div>
        </Modal>
    );

    const renderImageModal = () => (
        <Modal
            isOpen={isImageModalOpen}
            onRequestClose={closeImageModal}
            style={subModalStyles}
            contentLabel="Voir les Fichiers"
        >
            <div className="modal-hdr" style={{ background: 'linear-gradient(135deg, #3577f1, #405189)' }}>
                <h5 className="mb-0 text-white d-flex align-items-center gap-2"><i className="ri-image-line"></i> Fichiers Associés</h5>
                <button onClick={closeImageModal} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, fontSize: '.9rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body-c">
            <div
                className="d-flex flex-wrap justify-content-center gap-3"
            >
                {currentImagesToDisplay.length > 0 ? (
                    currentImagesToDisplay.map((filePath, index) => {
                        const isPdf = filePath.toLowerCase().endsWith('.pdf');
                        return (
                            <div
                                key={index}
                                style={{ width: '150px', height: '150px', overflow: 'hidden', border: '1px solid #ddd', cursor: 'pointer' }}
                                onClick={() => {
                                    // L'action change en fonction du type de fichier
                                    if (isPdf) {
                                        window.open(filePath, '_blank');
                                    } else {
                                        openSingleImageModal(filePath);
                                    }
                                }}
                            >
                                {isPdf ? (
                                    <div className="d-flex flex-column align-items-center justify-content-center h-100 p-2 text-center">
                                        <i className="bi bi-file-earmark-pdf" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                                        <span style={{ fontSize: '0.8rem', marginTop: '5px' }}>Fichier PDF</span>
                                    </div>
                                ) : (
                                    <img
                                        src={filePath}
                                        alt={`Fichier ${index}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p>Aucun fichier à afficher.</p>
                )}
            </div>
            <div className="d-flex justify-content-end mt-3">
                <button type="button" className="btn btn-light" style={{ borderRadius: 10 }} onClick={closeImageModal}>Fermer</button>
            </div>
            </div>
        </Modal>
    );

    const renderSingleImageModal = () => (
        <Modal
            isOpen={isSingleImageModalOpen}
            onRequestClose={closeSingleImageModal}
            style={subModalStyles}
            contentLabel="Image Agrandie"
        >
            <div className="modal-hdr" style={{ background: 'linear-gradient(135deg, #3577f1, #405189)' }}>
                <h5 className="mb-0 text-white d-flex align-items-center gap-2"><i className="ri-zoom-in-line"></i> Aperçu</h5>
                <button onClick={closeSingleImageModal} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, fontSize: '.9rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body-c text-center">
                {selectedImageSrc ? (
                    // Cette modale est spécifiquement pour les images, donc pas besoin de la modifier
                    <img
                        src={selectedImageSrc}
                        alt="Aperçu"
                        style={{ maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = '/path/to/placeholder-image.png'; }}
                    />
                ) : (
                    <p>Impossible de charger l'image.</p>
                )}
            <div className="d-flex justify-content-end mt-3">
                <button type="button" className="btn btn-light" style={{ borderRadius: 10 }} onClick={closeSingleImageModal}>Fermer</button>
            </div>
            </div>
        </Modal>
    );

    const openActionModal = (line) => {
        setActionModalLine(line);
        setIsActionModalOpen(true);
    };

    const handleActionClick = (type, line) => {
        // Le modal d'actions RESTE ouvert — le formulaire s'affiche par-dessus
        const lineData = JSON.stringify(line).replace(/"/g, '&quot;');
        window.handleOpenModal(type, lineData);
    };

    const renderActionModal = () => {
        if (!actionModalLine) return null;
        const line = actionModalLine;
        const emp = line.employer;
        const empId = line.employer_id || emp?.id;
        const hasPendingMut = empId && pendingMutationMap[empId];

        const actions = [
            {
                key: 'absences', label: 'Absences', icon: 'ri-calendar-line',
                color: '#0ab39c', bg: '#e8f8f5',
                done: line.absences?.length > 0,
                count: line.absences?.length || 0,
                subtitle: line.nb_jour_abs ? `${line.nb_jour_abs} jour${line.nb_jour_abs > 1 ? 's' : ''}` : null,
            },
            {
                key: 'acomptes', label: 'Acomptes', icon: 'ri-money-dollar-circle-line',
                color: '#f7b84b', bg: '#fff8e8',
                done: line.acomptes?.length > 0,
                count: line.acomptes?.length || 0,
                subtitle: line.accompte ? `${line.accompte.toLocaleString()} F` : null,
            },
            {
                key: 'heures-sup', label: 'Heures Sup.', icon: 'ri-time-line',
                color: '#405189', bg: '#eceef5',
                done: line.heuresSup?.length > 0,
                count: line.heuresSup?.length || 0,
                subtitle: (line.heure_sup_15 || line.heure_sup_50 || line.heure_sup_75) ? `15%: ${line.heure_sup_15 || 0}h · 50%: ${line.heure_sup_50 || 0}h · 75%: ${line.heure_sup_75 || 0}h` : null,
            },
            {
                key: 'primes', label: 'Primes', icon: 'ri-award-line',
                color: '#0ab39c', bg: '#e8f5e9',
                done: line.primes?.length > 0,
                count: line.primes?.length || 0,
                subtitle: line.primes?.length > 0 ? line.primes.map(p => `${p.montant?.toLocaleString()} F`).join(', ') : null,
            },
            {
                key: 'primes-nuit', label: 'Primes de Nuit', icon: 'ri-moon-line',
                color: '#2e3a5f', bg: '#eaecf2',
                done: line.primesNuit?.length > 0,
                count: line.primesNuit?.length || 0,
                subtitle: line.prime_nuit ? `${line.prime_nuit} jour${line.prime_nuit > 1 ? 's' : ''}` : null,
            },
            {
                key: 'depart', label: 'Départ', icon: 'ri-door-open-line',
                color: '#f06548', bg: '#fde8e8',
                done: !!emp?.date_depart,
                count: emp?.date_depart ? 1 : 0,
                subtitle: emp?.date_depart ? `${new Date(emp.date_depart).toLocaleDateString('fr-FR')} — ${emp.type_depart}` : null,
            },
            {
                key: 'mutation', label: 'Mutation', icon: 'ri-shuffle-line',
                color: '#495057', bg: '#e9ecef',
                done: !!hasPendingMut,
                count: hasPendingMut ? 1 : 0,
                subtitle: hasPendingMut ? `Vers ${hasPendingMut.serviceNew?.name || '—'}` : null,
                disabled: !!hasPendingMut,
            },
        ];

        const doneCount = actions.filter(a => a.done).length;

        return (
            <Modal
                isOpen={isActionModalOpen}
                onRequestClose={closeActionModal}
                style={{
                    ...customModalStyles,
                    content: { ...customModalStyles.content, maxWidth: '560px' }
                }}
                contentLabel="Actions Employé"
            >
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #405189 0%, #2e3a5f 60%, #0ab39c 100%)', color: '#fff', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700 }}>
                            {emp?.nom?.charAt(0)}{emp?.prenom?.charAt(0)}
                        </div>
                        <div>
                            <h5 className="mb-0 text-white" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{emp?.nom} {emp?.prenom}</h5>
                            <div className="d-flex gap-2 mt-1">
                                <span style={{ background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '1px 10px', fontSize: '.7rem' }}>{emp?.matricule}</span>
                                <span style={{ background: line.status === 'Cadre' ? 'rgba(247,184,75,.3)' : 'rgba(10,179,156,.3)', borderRadius: 12, padding: '1px 10px', fontSize: '.7rem' }}>{line.status}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={closeActionModal} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, fontSize: '.9rem', cursor: 'pointer' }}>✕</button>
                </div>

                {/* Progress bar */}
                <div style={{ padding: '14px 24px 0', background: '#fff' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <span style={{ fontSize: '.78rem', color: '#878a99', fontWeight: 600 }}>Progression des actions</span>
                        <span style={{ fontSize: '.78rem', fontWeight: 700, color: doneCount === actions.length ? '#0ab39c' : '#405189' }}>{doneCount} / {actions.length}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: '#f0f2f5', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${(doneCount / actions.length) * 100}%`, background: doneCount === actions.length ? '#0ab39c' : 'linear-gradient(90deg, #405189, #0ab39c)', transition: 'width .4s ease' }}></div>
                    </div>
                </div>

                {/* Actions grid */}
                <div style={{ padding: '16px 24px 24px', overflowY: 'auto', flex: 1, background: '#fff' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {actions.map(action => (
                            <button
                                key={action.key}
                                disabled={action.disabled}
                                onClick={() => handleActionClick(action.key, line)}
                                style={{
                                    position: 'relative',
                                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                    padding: '14px 16px', borderRadius: 12,
                                    background: action.done ? `${action.bg}` : '#fafbfc',
                                    border: action.done ? `1.5px solid ${action.color}30` : '1.5px solid #e9ecef',
                                    cursor: action.disabled ? 'not-allowed' : 'pointer',
                                    opacity: action.disabled ? .55 : 1,
                                    transition: 'all .2s ease',
                                    textAlign: 'left',
                                }}
                                onMouseEnter={e => { if (!action.disabled) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.08)'; } }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                {/* Status indicator */}
                                {action.done && (
                                    <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="ri-check-line" style={{ color: '#fff', fontSize: '.65rem' }}></i>
                                    </div>
                                )}
                                {!action.done && !action.disabled && (
                                    <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: '#e9ecef', border: '2px solid #d0d4db' }}></div>
                                )}

                                {/* Icon */}
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: action.done ? `${action.color}20` : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                                    <i className={action.icon} style={{ fontSize: '1.05rem', color: action.done ? action.color : '#878a99' }}></i>
                                </div>

                                {/* Label & info */}
                                <span style={{ fontSize: '.82rem', fontWeight: 600, color: action.done ? action.color : '#495057', lineHeight: 1.2 }}>{action.label}</span>
                                {action.done && action.subtitle && (
                                    <span style={{ fontSize: '.68rem', color: '#878a99', marginTop: 3, lineHeight: 1.3, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                        {action.subtitle}
                                    </span>
                                )}
                                {action.done && action.count > 0 && (
                                    <span style={{ fontSize: '.65rem', color: action.color, fontWeight: 700, marginTop: 2 }}>
                                        {action.count} enregistrement{action.count > 1 ? 's' : ''}
                                    </span>
                                )}
                                {!action.done && !action.disabled && (
                                    <span style={{ fontSize: '.68rem', color: '#b0b5be', marginTop: 3, fontStyle: 'italic' }}>Non renseigné</span>
                                )}
                                {action.disabled && (
                                    <span style={{ fontSize: '.68rem', color: '#b0b5be', marginTop: 3 }}>Mutation en attente</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        );
    };

    const renderDepartModal = () => (
        <Modal isOpen={isDepartModalOpen} onRequestClose={() => closeModal(setIsDepartModalOpen)} style={subModalStyles} contentLabel="Gérer Départ">
            <div className="modal-hdr" style={{ background: 'linear-gradient(135deg, #f06548, #d9534f)' }}>
                <h5 className="mb-0 text-white d-flex align-items-center gap-2"><i className="ri-door-open-line"></i> {currentDepart ? 'Modifier le départ de' : 'Ajouter un départ pour'} {currentNavetteLigne?.employer?.nom} {currentNavetteLigne?.employer?.prenom}</h5>
                <button onClick={() => closeModal(setIsDepartModalOpen)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, fontSize: '.9rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body-c">
            <form onSubmit={(e) => { e.preventDefault(); handleChildSubmit('depart', departFormData, !!currentDepart, currentDepart?.id); }}>
                <div className="mb-3">
                    <label className="form-label">Date de départ <span style={{ color: 'red' }} >*</span></label>
                    <input type="date" className="form-control" value={departFormData.date_depart} onChange={(e) => setDepartFormData({ ...departFormData, date_depart: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Type de départ <span style={{ color: 'red' }} >*</span></label>
                    <select
                        className="form-select"
                        value={departFormData.type_depart}
                        onChange={(e) => setDepartFormData({ ...departFormData, type_depart: e.target.value })}
                        required
                    >
                        {['', 'DEMISSION', 'RETRAITE', 'DECES', 'LICENCIEMENT'].map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                <b>NB: <span style={{ color: 'red' }} >*</span> obligatoire</b>
                <div className="d-flex justify-content-end gap-2">
                    <button type="submit" className="btn btn-primary">{currentDepart ? 'Modifier' : 'Ajouter'}</button>
                    <button type="button" className="btn btn-light" style={{ borderRadius: 10 }} onClick={() => closeModal(setIsDepartModalOpen)}>Quitter</button>
                </div>
            </form>
            {currentNavetteLigne?.employer?.date_depart && (
                <div className="mt-4">
                    <h5>Détail sur le départ:</h5>
                    <ul className="list-group">
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                            Date de départ :{new Date(currentNavetteLigne?.employer?.date_depart).toLocaleDateString()} - Type de départ : ({currentNavetteLigne?.employer?.type_depart || 'N/A'})
                            <div>
                                <button className="btn btn-sm btn-info me-2" onClick={() => {
                                    setCurrentDepart(currentNavetteLigne?.employer);
                                    const rawDate = currentNavetteLigne?.employer?.date_depart;
                                    let formattedDate = '';
                                    if (rawDate) {
                                        const dateObj = new Date(rawDate);
                                        formattedDate = dateObj.toISOString().slice(0, 10);
                                    }
                                    setDepartFormData({
                                        ...currentNavetteLigne?.employer,
                                        date_depart: formattedDate
                                    });

                                }}>Éditer</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteChild('depart', currentNavetteLigne?.employer?.id)}>Supprimer</button>
                            </div>
                        </li>
                    </ul>
                </div>
            )}
            </div>
        </Modal>
    );

    const sortedNavetteLines = [...navetteLines].sort((a, b) => {
        if (a.status === 'Cadre' && b.status !== 'Cadre') return -1;
        if (b.status === 'Cadre' && a.status !== 'Cadre') return 1;
        const nomA = `${a.employer.nom} ${a.employer.prenom}`;
        const nomB = `${b.employer.nom} ${b.employer.prenom}`;
        return nomA.localeCompare(nomB);
    });

    const filteredLines = useMemo(() => {
        let list = [...sortedNavetteLines];
        if (tableSearch.trim()) {
            const q = tableSearch.toLowerCase();
            list = list.filter(l => {
                const full = `${l.employer.matricule} ${l.employer.nom} ${l.employer.prenom} ${l.status}`.toLowerCase();
                return full.includes(q);
            });
        }
        list.sort((a, b) => {
            const { key, dir } = sortConfig;
            let va, vb;
            if (key === 'nom') { va = `${a.employer.nom} ${a.employer.prenom}`; vb = `${b.employer.nom} ${b.employer.prenom}`; }
            else if (key === 'matricule') { va = a.employer.matricule; vb = b.employer.matricule; }
            else if (key === 'status') { va = a.status; vb = b.status; }
            else if (key === 'jours') { va = a.nb_jours; vb = b.nb_jours; }
            else if (key === 'abs') { va = a.nb_jour_abs; vb = b.nb_jour_abs; }
            else { va = a.employer.nom; vb = b.employer.nom; }
            if (typeof va === 'string') return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            return dir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
        });
        return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortedNavetteLines, tableSearch, sortConfig]);

    if (loading || !user || !navette) {
        return <Loading loading={true} />;
    }
    if (navette && navette.length === 0) {
        return (
            <Layout>
                <div style={{ borderRadius: 16, background: 'linear-gradient(135deg, #405189 0%, #2e3a5f 50%, #0ab39c 100%)', padding: '1.5rem 2rem 1.25rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }}></div>
                    <div className="d-flex justify-content-between align-items-center">
                        <nav>
                            <ol className="breadcrumb mb-0" style={{ fontSize: '.8rem' }}>
                                <li className="breadcrumb-item"><a href="/dashboard" style={{ color: 'rgba(255,255,255,.7)' }}>Tableau de bord</a></li>
                                <li className="breadcrumb-item" style={{ color: 'rgba(255,255,255,.5)' }}>État navette — {user?.service}</li>
                            </ol>
                        </nav>
                    </div>
                </div>
                <div className="card border-0 text-center" style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                    <div className="card-body py-5">
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #f7b84b22, #f0650422)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <i className="ri-road-map-line" style={{ fontSize: '2.2rem', color: '#f7b84b' }}></i>
                        </div>
                        <h4 className="fw-bold mb-2">L'état navette n'a pas encore été lancé</h4>
                        <p className="text-muted mb-0" style={{ maxWidth: 500, margin: '0 auto' }}>
                            Cette page vous permet de gérer les états navettes de vos employés. Veuillez vous informer auprès de la paie pour en savoir plus.
                        </p>
                    </div>
                </div>
            </Layout>
        )
    }

    const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    const handleSort = (key) => setSortConfig(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    const sortIcon = (key) => sortConfig.key !== key ? 'ri-arrow-up-down-line opacity-25' : sortConfig.dir === 'asc' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line';

    const openImageModal = (images) => {
        const imagesArray = Array.isArray(images) ? images : (images ? JSON.parse(images) : []);
        setCurrentImagesToDisplay(imagesArray);
        setIsImageModalOpen(true);
    };

    const closeImageModal = () => {
        setIsImageModalOpen(false);
        setCurrentImagesToDisplay([]);
    };

    const openSingleImageModal = (imageSrc) => {
        setSelectedImageSrc(imageSrc);
        setIsSingleImageModalOpen(true);
    };

    const closeSingleImageModal = () => {
        setIsSingleImageModalOpen(false);
        setSelectedImageSrc('');
    };

    return (
        <>
            <Layout>
                <style>{`@keyframes pulse-step{0%,100%{box-shadow:0 0 0 0 rgba(64,81,137,.4)}50%{box-shadow:0 0 0 10px rgba(64,81,137,0)}}.step-active{animation:pulse-step 2s infinite}.fullscreen-bg{background:#f3f3f9;min-height:100vh;overflow:auto;padding:1.5rem}.nav-tbl th{cursor:pointer;user-select:none;white-space:nowrap;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:#878a99;font-weight:600;padding:10px 12px;border-bottom:2px solid #e9ecef;background:#fafbfc}.nav-tbl td{padding:8px 12px;font-size:.82rem;vertical-align:middle;border-bottom:1px solid #f0f0f0}.nav-tbl tbody tr:hover{background:#f4f6fb}.nav-tbl .expand-row{background:#f8faff;border-left:3px solid #405189;animation:slideDown .25s ease}@keyframes slideDown{from{opacity:0;max-height:0}to{opacity:1;max-height:600px}}.action-pill{border:none;border-radius:8px;padding:4px 10px;font-size:.72rem;font-weight:500;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:4px}.action-pill:hover{transform:translateY(-1px);box-shadow:0 2px 6px rgba(0,0,0,.12)}.modal-hdr{background:linear-gradient(135deg,#405189 0%,#0ab39c 100%);color:#fff;padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between}.modal-hdr h5{margin:0;font-size:1.05rem;font-weight:600}.modal-body-c{padding:1.5rem;overflow-y:auto;flex:1}`}</style>
                <div ref={contentRef} className={isFullscreen ? 'fullscreen-bg' : ''}>

                    {/* ── HERO HEADER ── */}
                    <div style={{ borderRadius: 16, background: 'linear-gradient(135deg, #405189 0%, #2e3a5f 50%, #0ab39c 100%)', padding: '1.5rem 2rem 1.25rem', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }}></div>
                        <div style={{ position: 'absolute', bottom: -20, left: '30%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }}></div>
                        <div style={{ position: 'absolute', top: '40%', right: '20%', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }}></div>

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <nav>
                                <ol className="breadcrumb mb-0" style={{ fontSize: '.8rem' }}>
                                    <li className="breadcrumb-item"><a href="/dashboard" style={{ color: 'rgba(255,255,255,.7)' }}>Tableau de bord</a></li>
                                    <li className="breadcrumb-item" style={{ color: 'rgba(255,255,255,.5)' }}>État navette — {user?.service}</li>
                                </ol>
                            </nav>
                            <button onClick={toggleFullscreen} className="btn btn-sm" style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: 10, width: 38, height: 38 }} title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}>
                                <i className={isFullscreen ? 'ri-fullscreen-exit-line fs-5' : 'ri-fullscreen-line fs-5'}></i>
                            </button>
                        </div>

                        <div className="d-flex align-items-center gap-3 flex-wrap">
                            <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid rgba(255,255,255,.3)', overflow: 'hidden', flexShrink: 0 }}>
                                <img src={user ? user.avatar_url : 'assets/images/users/avatar-1.jpg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <h3 className="fw-bold mb-1" style={{ color: '#fff', fontSize: '1.35rem' }}>
                                    {navette.name} <span style={{ opacity: .7, fontWeight: 400 }}>({navette.code})</span>
                                </h3>
                                <div className="d-flex gap-2 flex-wrap">
                                    <span style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: '.75rem' }}>
                                        <i className="ri-building-line me-1"></i>{navette.service.name}
                                    </span>
                                    <span style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: '.75rem' }}>
                                        <i className="ri-calendar-line me-1"></i>{new Date(navette.periode_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <span className={`badge rounded-pill ${getStatusBadgeClass(navette.status)}`} style={{ fontSize: '.75rem', padding: '5px 12px' }}>{navette.status}</span>
                                    {navette.status_force && (
                                        <span className="badge rounded-pill" style={{ fontSize: '.7rem', padding: '4px 10px', background: 'rgba(247,184,75,.2)', color: '#f7b84b', border: '1px solid rgba(247,184,75,.35)' }} title="Cette navette a été clôturée automatiquement par le système car le manager n'a pas envoyé la navette à temps.">
                                            <i className="ri-alarm-warning-line me-1"></i>Clôture forcée
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── COUNTDOWN CAMPAGNE ── */}
                        {countdown && (
                            <div className="mt-3" style={{
                                background: 'rgba(255,255,255,.1)',
                                backdropFilter: 'blur(8px)',
                                border: `1px solid ${countdown.urgence === 'critical' ? 'rgba(255,80,80,.5)' : countdown.urgence === 'warning' ? 'rgba(255,165,0,.4)' : countdown.urgence === 'expired' ? 'rgba(255,60,60,.6)' : 'rgba(255,255,255,.2)'}`,
                                borderRadius: 12,
                                padding: '12px 16px',
                            }}>
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                    {/* Temps restant */}
                                    <div className="d-flex align-items-center gap-3">
                                        <div style={{
                                            width: 40, height: 40, borderRadius: '50%',
                                            background: countdown.urgence === 'expired' ? 'rgba(255,60,60,.25)' : countdown.urgence === 'critical' ? 'rgba(255,80,80,.25)' : countdown.urgence === 'warning' ? 'rgba(255,165,0,.2)' : 'rgba(10,179,156,.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <i className={`${countdown.urgence === 'expired' ? 'ri-time-fill' : 'ri-timer-line'}`} style={{
                                                fontSize: '1.2rem',
                                                color: countdown.urgence === 'expired' ? '#ff5050' : countdown.urgence === 'critical' ? '#ff6b6b' : countdown.urgence === 'warning' ? '#ffa500' : '#0ab39c'
                                            }}></i>
                                        </div>
                                        <div>
                                            {countdown.urgence === 'expired' ? (
                                                <div style={{ color: '#ff8080', fontSize: '.9rem', fontWeight: 600 }}>
                                                    Campagne terminée
                                                </div>
                                            ) : (
                                                <>
                                                    <div style={{ color: '#fff', fontSize: '.9rem', fontWeight: 600, lineHeight: 1.2 }}>
                                                        <span style={{
                                                            color: countdown.urgence === 'critical' ? '#ff6b6b' : countdown.urgence === 'warning' ? '#ffa500' : '#7aefdf',
                                                            fontSize: '1.1rem', fontWeight: 700,
                                                        }}>
                                                            {countdown.joursRestants}j {countdown.heuresRestantes}h {countdown.minutesRestantes}m
                                                        </span>
                                                        <span style={{ opacity: .8, fontSize: '.78rem', marginLeft: 6 }}>restant{countdown.joursRestants > 1 ? 's' : ''}</span>
                                                    </div>
                                                    <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.72rem', marginTop: 1 }}>
                                                        {countdown.joursEcoules} jour{countdown.joursEcoules > 1 ? 's' : ''} écoulé{countdown.joursEcoules > 1 ? 's' : ''} sur {countdown.totalJours}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    {campagneDates && (
                                        <div className="d-flex gap-3" style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.7)' }}>
                                            <span><i className="ri-play-circle-line me-1"></i>Début : {new Date(campagneDates.debut).toLocaleDateString('fr-FR')}</span>
                                            <span><i className="ri-stop-circle-line me-1"></i>Fin : {new Date(campagneDates.fin).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    )}

                                    {/* Progress bar */}
                                    <div style={{ width: 120, flexShrink: 0 }}>
                                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.15)', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 3,
                                                width: `${countdown.pourcentage}%`,
                                                background: countdown.urgence === 'expired' ? '#ff5050' : countdown.urgence === 'critical' ? '#ff6b6b' : countdown.urgence === 'warning' ? '#ffa500' : countdown.urgence === 'caution' ? '#ffc107' : '#0ab39c',
                                                transition: 'width .5s ease',
                                            }}></div>
                                        </div>
                                        <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.5)', textAlign: 'center', marginTop: 2 }}>
                                            {countdown.pourcentage}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isReadOnly && (
                            <div className="mt-3" style={{ background: 'rgba(255,200,50,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,200,50,.3)', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: '.85rem' }}>
                                <i className={`ri-${campagneStatus === 'not_started' ? 'time-line' : 'alarm-warning-line'} me-2`}></i>
                                <strong>Lecture seule</strong> — {campagneStatus === 'not_started' ? "La campagne n'a pas encore démarré." : 'La période est dépassée.'}
                            </div>
                        )}
                    </div>

                    {/* ── ÉTAT STEPPER ── */}
                    <div className="card mb-3 border-0" style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                        <div className="card-body py-3 px-4">
                            <div className="d-flex align-items-center justify-content-between position-relative" style={{ minHeight: 60 }}>
                                <div className="position-absolute" style={{ top: 19, left: 28, right: 28, height: 3, background: '#e9ecef', borderRadius: 2, zIndex: 0 }}></div>
                                <div className="position-absolute" style={{ top: 19, left: 28, height: 3, background: 'linear-gradient(90deg, #0ab39c, #405189)', borderRadius: 2, zIndex: 1, width: `${Math.max(0, currentStepIdx) / (ETAT_STEPS.length - 1) * 100}%`, transition: 'width .6s ease' }}></div>
                                {ETAT_STEPS.map((step, idx) => {
                                    const done = idx < currentStepIdx;
                                    const active = idx === currentStepIdx;
                                    const bg = done ? '#0ab39c' : active ? '#405189' : '#e9ecef';
                                    const clr = done || active ? '#fff' : '#878a99';
                                    return (
                                        <div key={idx} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 2, flex: '1 1 0', maxWidth: 120 }}>
                                            <div className={active ? 'step-active' : ''} style={{ width: 38, height: 38, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: clr, fontSize: '1rem', transition: 'all .3s', border: active ? '3px solid rgba(64,81,137,.3)' : 'none' }}>
                                                {done ? <i className="ri-check-line"></i> : <i className={step.icon}></i>}
                                            </div>
                                            <span className="text-center mt-1 d-none d-md-block" style={{ fontSize: '.6rem', fontWeight: active ? 700 : 500, color: active ? '#405189' : done ? '#0ab39c' : '#878a99', lineHeight: 1.2 }}>{step.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="d-flex justify-content-end gap-2 mt-2 pt-2 border-top">
                                {!isReadOnly && navette.etat === "En attente de l'envoi des informations des employés au manager" && (user.is_representant === true || user.is_manager === true) && (
                                    <button type="button" className="btn btn-sm btn-primary" onClick={handleValidateUpdates}>
                                        <i className="ri-check-line me-1"></i>Valider & envoyer au manager
                                    </button>
                                )}
                                {!isReadOnly && navette.etat === "En attente de la confirmation des informations des employés par le manager" && user.is_manager === true && (
                                    <button type="button" className="btn btn-sm btn-soft-warning me-2" onClick={handleCorrection}>
                                        <i className="ri-edit-line me-1"></i>Corrections
                                    </button>
                                )}
                                {!isReadOnly && navette.etat === "En attente de la confirmation des informations des employés par le manager" && user.is_manager === true && (
                                    <button type="button" className="btn btn-sm btn-primary" onClick={handleSendToPayroll}>
                                        <i className="ri-send-plane-fill me-1"></i>Confirmer & transmettre à la Paie
                                    </button>
                                )}
                                {navette.etat === "En attente du traitement de l'etat navette par la paie" && (
                                    <>
                                        <button type="button" className="btn btn-sm btn-danger" onClick={openSignalementModal}>
                                            <i className="ri-error-warning-line me-1"></i>Signaler des corrections
                                        </button>
                                        <button type="button" className="btn btn-sm btn-success" onClick={handleCloseNavette}>
                                            <i className="ri-checkbox-circle-line me-1"></i>Clôturer la navette
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── STATS RAPIDES ── */}
                    <div className="d-flex gap-2 flex-wrap mb-3">
                        {[
                            { label: 'Employés', value: navetteLines.length, icon: 'ri-team-line', color: 'primary' },
                            { label: 'Cadres', value: navetteLines.filter(l => l.status === 'Cadre').length, icon: 'ri-user-star-line', color: 'warning' },
                            { label: 'Non-cadres', value: navetteLines.filter(l => l.status !== 'Cadre').length, icon: 'ri-user-line', color: 'success' },
                        ].map(s => (
                            <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '6px 14px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem' }}>
                                <i className={`${s.icon} text-${s.color}`}></i>
                                <span className="text-muted">{s.label}</span>
                                <strong className={`text-${s.color}`}>{s.value}</strong>
                            </div>
                        ))}
                    </div>

                    {/* ── TABLE ── */}
                    <div className="card border-0" style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                        <div className="card-header bg-transparent d-flex align-items-center py-3 flex-wrap gap-2">
                            <h5 className="card-title mb-0 flex-grow-1 fw-semibold" style={{ fontSize: '1rem' }}>
                                <i className="ri-list-check-2 me-2 text-primary"></i>Liste des employés
                            </h5>
                            <div className="position-relative" style={{ maxWidth: 220 }}>
                                <i className="ri-search-line position-absolute" style={{ left: 10, top: '50%', transform: 'translateY(-50%)', color: '#878a99', fontSize: '.85rem' }}></i>
                                <input type="text" className="form-control form-control-sm" placeholder="Rechercher..." value={tableSearch} onChange={e => setTableSearch(e.target.value)} style={{ paddingLeft: 30, borderRadius: 8, fontSize: '.8rem' }} />
                            </div>
                            <span className="badge bg-primary-subtle text-primary rounded-pill px-3">{filteredLines.length} / {navetteLines.length}</span>
                        </div>
                        <div className="card-body p-0" style={{ overflowX: 'auto' }}>
                            {navetteLines.some(l => l.correction_flag) && (
                                <div className="alert alert-danger d-flex align-items-center m-3 mb-0 py-2 px-3" style={{ borderRadius: 10, background: 'linear-gradient(135deg, rgba(240,101,72,.08), rgba(240,101,72,.04))', border: '1px solid rgba(240,101,72,.25)' }}>
                                    <i className="ri-error-warning-fill me-2 fs-5" style={{ color: '#f06548' }}></i>
                                    <span style={{ fontSize: '.82rem', color: '#495057' }}>
                                        <strong>{navetteLines.filter(l => l.correction_flag).length} ligne{navetteLines.filter(l => l.correction_flag).length > 1 ? 's' : ''}</strong> signalée{navetteLines.filter(l => l.correction_flag).length > 1 ? 's' : ''} par la paie — les lignes concernées sont surlignées en rouge avec le détail de la correction.
                                    </span>
                                </div>
                            )}
                            {filteredLines.length > 0 ? (
                                <table className="nav-tbl w-100" style={{ borderCollapse: 'collapse', minWidth: 900 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: 36 }}></th>
                                            <th onClick={() => handleSort('status')}>Statut <i className={sortIcon('status')} style={{ fontSize: '.7rem' }}></i></th>
                                            <th onClick={() => handleSort('matricule')}>Matricule <i className={sortIcon('matricule')} style={{ fontSize: '.7rem' }}></i></th>
                                            <th onClick={() => handleSort('nom')}>Nom & Prénom <i className={sortIcon('nom')} style={{ fontSize: '.7rem' }}></i></th>
                                            <th onClick={() => handleSort('jours')} className="text-center">Jours <i className={sortIcon('jours')} style={{ fontSize: '.7rem' }}></i></th>
                                            <th onClick={() => handleSort('abs')} className="text-center">Abs. <i className={sortIcon('abs')} style={{ fontSize: '.7rem' }}></i></th>
                                            <th className="text-end">Acompte</th>
                                            <th className="text-center">P. Nuit</th>
                                            <th className="text-center">H.15%</th>
                                            <th className="text-center">H.50%</th>
                                            <th className="text-center">H.75%</th>
                                            <th className="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLines.map(line => {
                                            const emp = line.employer;
                                            const empId = line.employer_id || emp?.id;
                                            const isMutOut = line.mutation_out === 1 || line.mutation_out === true;
                                            const isMutIn = line.mutation_in === 1 || line.mutation_in === true;
                                            const hasPendingMut = empId && pendingMutationMap[empId];
                                            const isExpanded = expandedRows[line.id];
                                            const rowOpacity = isMutOut ? .5 : 1;
                                            const lineData = JSON.stringify(line).replace(/"/g, '&quot;');
                                            const canEdit = !isReadOnly && !isMutOut && !(isMutIn && hasPendingMut)
                                                && (navette.etat === "En attente de l'enregistrement des informations des employés" || navette.etat === "En attente de l'envoi des informations des employés au manager");

                                            return (
                                                <React.Fragment key={line.id}>
                                                    <tr style={{ opacity: rowOpacity, transition: 'background .15s', background: line.correction_flag ? 'rgba(240, 101, 72, 0.08)' : 'transparent' }}>
                                                        <td>
                                                            <button onClick={() => toggleRow(line.id)} className="btn btn-sm p-0 border-0" style={{ width: 24, height: 24, borderRadius: 6, background: isExpanded ? '#405189' : '#e9ecef', color: isExpanded ? '#fff' : '#878a99', fontSize: '.7rem', transition: 'all .2s' }}>
                                                                <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                                                            </button>
                                                        </td>
                                                        <td>
                                                            <span className={`badge rounded-pill ${line.status === 'Cadre' ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'}`} style={{ fontSize: '.68rem' }}>{line.status}</span>
                                                        </td>
                                                        <td><code style={{ fontSize: '.78rem', background: '#f0f2f5', padding: '2px 6px', borderRadius: 4 }}>{emp.matricule}</code></td>
                                                        <td>
                                                            <span className={`fw-semibold ${isMutOut ? 'text-muted text-decoration-line-through' : ''}`}>{emp.nom} {emp.prenom}</span>
                                                            {isMutOut && <span className="badge bg-danger-subtle text-danger ms-2" style={{ fontSize: '.6rem' }}>Sortant</span>}
                                                            {isMutIn && hasPendingMut && <span className="badge bg-warning-subtle text-warning ms-2" style={{ fontSize: '.6rem' }}><i className="ri-time-line me-1"></i>En attente</span>}
                                                            {isMutIn && !hasPendingMut && <span className="badge bg-info-subtle text-info ms-2" style={{ fontSize: '.6rem' }}>Entrant</span>}
                                                            {!isMutOut && !isMutIn && hasPendingMut && <span className="badge bg-warning-subtle text-warning ms-2" style={{ fontSize: '.6rem' }}><i className="ri-time-line me-1"></i>Mutation</span>}
                                                            {line.correction_flag && (
                                                                <span className="badge bg-danger ms-2" style={{ fontSize: '.6rem', cursor: 'help' }} title={line.correction_comment || 'Correction demandée'}>
                                                                    <i className="ri-error-warning-line me-1"></i>À corriger
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="text-center fw-semibold">{line.nb_jours}</td>
                                                        <td className="text-center">{line.nb_jour_abs || <span className="text-muted">—</span>}</td>
                                                        <td className="text-end">{line.accompte ? `${line.accompte.toLocaleString()} F` : <span className="text-muted">—</span>}</td>
                                                        <td className="text-center">{line.prime_nuit || <span className="text-muted">—</span>}</td>
                                                        <td className="text-center">{line.heure_sup_15 || <span className="text-muted">—</span>}</td>
                                                        <td className="text-center">{line.heure_sup_50 || <span className="text-muted">—</span>}</td>
                                                        <td className="text-center">{line.heure_sup_75 || <span className="text-muted">—</span>}</td>
                                                        <td className="text-center">
                                                            {isMutOut ? (
                                                                <span className="text-muted" style={{ fontSize: '.72rem' }}><i className="ri-arrow-right-up-line me-1"></i>Muté</span>
                                                            ) : isMutIn && hasPendingMut ? (
                                                                <span className="text-warning" style={{ fontSize: '.72rem' }}><i className="ri-time-line me-1"></i>Bloqué</span>
                                                            ) : isReadOnly ? (
                                                                <span className="text-muted" style={{ fontSize: '.72rem' }}><i className="ri-lock-line me-1"></i>Lecture</span>
                                                            ) : canEdit ? (
                                                                (() => {
                                                                    const doneActions = [
                                                                        line.absences?.length > 0,
                                                                        line.acomptes?.length > 0,
                                                                        line.heuresSup?.length > 0,
                                                                        line.primes?.length > 0,
                                                                        line.primesNuit?.length > 0,
                                                                        !!emp?.date_depart,
                                                                        !!hasPendingMut,
                                                                    ].filter(Boolean).length;
                                                                    return (
                                                                        <button
                                                                            className="action-pill"
                                                                            onClick={() => openActionModal(line)}
                                                                            style={{
                                                                                background: doneActions > 0 ? 'linear-gradient(135deg, #405189, #0ab39c)' : '#f0f2f5',
                                                                                color: doneActions > 0 ? '#fff' : '#495057',
                                                                                padding: '5px 14px', borderRadius: 20, fontWeight: 600,
                                                                                fontSize: '.73rem', gap: 6, border: 'none',
                                                                            }}
                                                                        >
                                                                            <i className="ri-tools-line"></i>
                                                                            Actions
                                                                            {doneActions > 0 && (
                                                                                <span style={{ background: 'rgba(255,255,255,.25)', borderRadius: 10, padding: '0 6px', fontSize: '.65rem', marginLeft: 4 }}>{doneActions}/7</span>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })()
                                                            ) : (
                                                                <span className="text-muted" style={{ fontSize: '.72rem' }}>—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr className="expand-row">
                                                            <td colSpan={12} style={{ padding: '14px 16px 14px 48px' }}>
                                                                {line.correction_flag && (
                                                                    <div className="alert alert-danger d-flex align-items-start mb-3 py-2 px-3" style={{ fontSize: '.78rem', borderLeft: '4px solid #f06548' }}>
                                                                        <i className="ri-error-warning-fill me-2 fs-5" style={{ color: '#f06548' }}></i>
                                                                        <div>
                                                                            <strong>Correction demandée par la paie :</strong>
                                                                            <p className="mb-0 mt-1">{line.correction_comment || 'Aucun commentaire'}</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="row g-3">
                                                                    {/* Absences */}
                                                                    <div className="col-lg-6">
                                                                        <h6 className="fw-semibold mb-2" style={{ fontSize: '.78rem', color: '#405189' }}><i className="ri-calendar-line me-1"></i>Absences</h6>
                                                                        {line.absences?.length > 0 ? (
                                                                            <table className="table table-sm mb-0" style={{ fontSize: '.75rem' }}>
                                                                                <thead><tr className="table-light"><th>Jours</th><th>Type</th><th>Motif</th><th>Fichiers</th></tr></thead>
                                                                                <tbody>
                                                                                    {line.absences.map((ab, i) => (
                                                                                        <tr key={ab.id || i}>
                                                                                            <td>{ab.nb_jours}</td>
                                                                                            <td>{ab.type_abs.replace(/_/g, ' ')}</td>
                                                                                            <td>{ab.motif || '—'}</td>
                                                                                            <td>{ab.images?.length > 0 ? <button className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: '.7rem' }} onClick={() => openImageModal(ab.images)}>Voir</button> : '—'}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        ) : <span className="text-muted" style={{ fontSize: '.75rem' }}>Aucune absence</span>}
                                                                    </div>
                                                                    {/* Primes */}
                                                                    <div className="col-lg-6">
                                                                        <h6 className="fw-semibold mb-2" style={{ fontSize: '.78rem', color: '#0ab39c' }}><i className="ri-award-line me-1"></i>Primes</h6>
                                                                        {line.primes?.length > 0 ? (
                                                                            <table className="table table-sm mb-0" style={{ fontSize: '.75rem' }}>
                                                                                <thead><tr className="table-light"><th>Type</th><th>Montant</th></tr></thead>
                                                                                <tbody>
                                                                                    {line.primes.map((p, i) => (
                                                                                        <tr key={p.id || i}><td>{p.type_prime}</td><td>{p.montant?.toLocaleString()} F</td></tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        ) : <span className="text-muted" style={{ fontSize: '.75rem' }}>Aucune prime</span>}
                                                                    </div>
                                                                    {/* Primes Nuit */}
                                                                    <div className="col-lg-4">
                                                                        <h6 className="fw-semibold mb-2" style={{ fontSize: '.78rem', color: '#2e3a5f' }}><i className="ri-moon-line me-1"></i>Primes de nuit</h6>
                                                                        {line.primesNuit?.length > 0 ? (
                                                                            <div className="d-flex gap-2 flex-wrap">
                                                                                {line.primesNuit.map((pn, i) => (
                                                                                    <span key={pn.id || i} className="badge bg-dark-subtle text-dark" style={{ fontSize: '.72rem' }}>{pn.nb_jour} jour{pn.nb_jour > 1 ? 's' : ''}</span>
                                                                                ))}
                                                                            </div>
                                                                        ) : <span className="text-muted" style={{ fontSize: '.75rem' }}>—</span>}
                                                                    </div>
                                                                    {/* Départ */}
                                                                    <div className="col-lg-4">
                                                                        <h6 className="fw-semibold mb-2" style={{ fontSize: '.78rem', color: '#f06548' }}><i className="ri-door-open-line me-1"></i>Départ</h6>
                                                                        {emp.date_depart ? (
                                                                            <span style={{ fontSize: '.78rem' }}>{new Date(emp.date_depart).toLocaleDateString()} — {emp.type_depart}</span>
                                                                        ) : <span className="text-muted" style={{ fontSize: '.75rem' }}>—</span>}
                                                                    </div>
                                                                    {/* Heures Sup */}
                                                                    <div className="col-lg-4">
                                                                        <h6 className="fw-semibold mb-2" style={{ fontSize: '.78rem', color: '#405189' }}><i className="ri-time-line me-1"></i>Heures Sup.</h6>
                                                                        <div className="d-flex gap-2">
                                                                            {[{ p: '15%', v: line.heure_sup_15 }, { p: '50%', v: line.heure_sup_50 }, { p: '75%', v: line.heure_sup_75 }].map(h => (
                                                                                <span key={h.p} className="badge bg-primary-subtle text-primary" style={{ fontSize: '.72rem' }}>{h.p}: {h.v || 0}h</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="ri-inbox-line d-block mb-2" style={{ fontSize: '2.5rem' }}></i>
                                    <p className="mb-0">Aucune ligne de navette trouvée.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </Layout>

            {renderActionModal()}
            {renderSignalementModal()}
            {renderAbModal()}
            {renderAccompteModal()}
            {renderHeureModal()}
            {renderPrimeModal()}
            {renderPrimeNuitModal()}
            {renderDepartModal()}
            {renderMutationModal()}
            {renderImageModal()}
            {renderSingleImageModal()}
        </>
    );
};

export default NavetteDetailPage;