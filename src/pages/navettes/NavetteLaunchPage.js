import React, { useState, useEffect, useCallback } from 'react';
import api from '../../axios';
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/base/Loading';
import AlertMessages from '../../components/base/AlertMessages';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import ActivityLogPanel from '../../components/base/ActivityLogPanel';

const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const STATUS_STYLE = {
    'En attente': { bg: '#f7b84b', light: '#f7b84b15', icon: 'ri-time-line' },
    'En cours':   { bg: '#299cdb', light: '#299cdb15', icon: 'ri-loader-2-line' },
    'Terminé':    { bg: '#0ab39c', light: '#0ab39c15', icon: 'ri-checkbox-circle-line' },
    'bloqué':     { bg: '#f06548', light: '#f0654815', icon: 'ri-forbid-line' },
};

const CAMPAGNE_STATUS_STYLE = {
    programmee:  { bg: '#299cdb', light: '#299cdb15', icon: 'ri-calendar-schedule-line', label: 'Programmée' },
    active:      { bg: '#0ab39c', light: '#0ab39c15', icon: 'ri-play-circle-line',       label: 'Active' },
    terminee:    { bg: '#878a99', light: '#878a9912', icon: 'ri-checkbox-circle-line',    label: 'Terminée' },
    desactivee:  { bg: '#f7b84b', light: '#f7b84b15', icon: 'ri-pause-circle-line',      label: 'Désactivée' },
};

const NavetteLaunchPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);
    const [campagnes, setCampagnes] = useState([]);
    const [loadingCampagnes, setLoadingCampagnes] = useState(true);
    const [currentMonthStatus, setCurrentMonthStatus] = useState(null);
    const [showLaunchForm, setShowLaunchForm] = useState(false);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [expandedCampagne, setExpandedCampagne] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'programmees' | 'executees'

    const now = new Date();
    const moisCourant = now.getMonth() + 1;
    const anneeCourante = now.getFullYear();

    // Dates par défaut : du 1er au dernier jour du mois courant
    const premierJour = new Date(anneeCourante, moisCourant - 1, 1).toISOString().split('T')[0];
    const dernierJour = new Date(anneeCourante, moisCourant, 0).toISOString().split('T')[0];

    const [periodeDebut, setPeriodeDebut] = useState(premierJour);
    const [periodeFin, setPeriodeFin] = useState(dernierJour);

    // Scheduling state
    const [selectedMois, setSelectedMois] = useState([]);
    const [scheduleDebutJour, setScheduleDebutJour] = useState(1);
    const [scheduleFinJour, setScheduleFinJour] = useState(25);
    const [schedulingLoading, setSchedulingLoading] = useState(false);

    // ── Fetch ──
    const fetchCampagnes = useCallback(async () => {
        setLoadingCampagnes(true);
        try {
            const res = await api.get('campagnes');
            setCampagnes(res.data.data || []);
        } catch (error) {
            console.error('Erreur chargement campagnes:', error);
            setAlert({ type: 'danger', message: 'Erreur lors du chargement des campagnes.' });
        } finally {
            setLoadingCampagnes(false);
        }
    }, []);

    const fetchCurrentMonthStatus = useCallback(async () => {
        try {
            const res = await api.get('campagnes/current-month');
            setCurrentMonthStatus(res.data.data || null);
        } catch (error) {
            console.error('Erreur statut mois courant:', error);
        }
    }, []);

    useEffect(() => {
        fetchCampagnes();
        fetchCurrentMonthStatus();
    }, [fetchCampagnes, fetchCurrentMonthStatus]);

    // ── Dérivées ──
    const canLaunch = currentMonthStatus && !currentMonthStatus.hasActiveCampagne;
    const campagnesProgrammees = campagnes.filter(c => c.status === 'programmee' || c.status === 'desactivee');
    const campagnesExecutees = campagnes.filter(c => c.is_executed);

    const filteredCampagnes = activeTab === 'programmees' ? campagnesProgrammees
        : activeTab === 'executees' ? campagnesExecutees
        : campagnes;

    // Mois occupés : mois avec une campagne existante cette année
    const occupiedMois = campagnes.filter(c => c.annee === anneeCourante).map(c => c.mois);

    // ══ Lancer manuellement (mois courant) ══
    const handleLaunch = async () => {
        if (!periodeDebut || !periodeFin) {
            setAlert({ type: 'warning', message: 'Veuillez renseigner les dates de début et de fin de période.' });
            return;
        }
        if (new Date(periodeDebut) > new Date(periodeFin)) {
            setAlert({ type: 'warning', message: 'La date de début doit être antérieure à la date de fin.' });
            return;
        }

        const result = await Swal.fire({
            title: 'Lancer la campagne ?',
            html: `<p>Vous êtes sur le point de lancer les états navettes pour <strong>${MOIS_NOMS[moisCourant - 1]} ${anneeCourante}</strong>.</p>
                   <p>Période : du <strong>${new Date(periodeDebut).toLocaleDateString('fr-FR')}</strong> au <strong>${new Date(periodeFin).toLocaleDateString('fr-FR')}</strong></p>
                   <p>Cela créera un état navette pour <strong>chaque service</strong> avec ses employés actifs.</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0ab39c',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, lancer !',
            cancelButtonText: 'Annuler'
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            const response = await api.post('campagnes/launch', {
                periode_debut_at: periodeDebut,
                periode_fin_at: periodeFin
            });

            const nbNavettes = response.data.data?.length || 0;
            await Swal.fire({
                title: 'Campagne lancée !',
                html: `<p>${nbNavettes} état(s) navette(s) créé(s) avec succès.</p>`,
                icon: 'success',
                confirmButtonColor: '#0ab39c'
            });

            setShowLaunchForm(false);
            fetchCampagnes();
            fetchCurrentMonthStatus();
        } catch (error) {
            console.error('Erreur lancement:', error);
            setAlert({
                type: 'danger',
                message: error.response?.data?.message || 'Erreur lors du lancement de la campagne.'
            });
        } finally {
            setLoading(false);
        }
    };

    // ══ Programmer des campagnes futures ══
    const handleSchedule = async () => {
        if (selectedMois.length === 0) {
            setAlert({ type: 'warning', message: 'Veuillez sélectionner au moins un mois.' });
            return;
        }
        if (!scheduleDebutJour || !scheduleFinJour) {
            setAlert({ type: 'warning', message: 'Veuillez renseigner les jours de début et fin de période.' });
            return;
        }
        if (parseInt(scheduleDebutJour) > parseInt(scheduleFinJour)) {
            setAlert({ type: 'warning', message: 'Le jour de début doit être antérieur au jour de fin.' });
            return;
        }

        const moisLabels = selectedMois.map(m => MOIS_NOMS[m - 1]).join(', ');
        const result = await Swal.fire({
            title: 'Programmer les campagnes ?',
            html: `<p>Vous allez programmer <strong>${selectedMois.length}</strong> campagne(s) pour :</p>
                   <p><strong>${moisLabels}</strong></p>
                   <p>Période : du <strong>${scheduleDebutJour}</strong> au <strong>${scheduleFinJour}</strong> de chaque mois.</p>
                   <p style="font-size:.85rem;color:#878a99">Les campagnes seront automatiquement lancées le 1er jour du mois concerné.</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0ab39c',
            confirmButtonText: 'Programmer',
            cancelButtonText: 'Annuler'
        });

        if (!result.isConfirmed) return;

        setSchedulingLoading(true);
        try {
            const res = await api.post('campagnes/schedule', {
                moisList: selectedMois,
                periode_debut_jour: parseInt(scheduleDebutJour),
                periode_fin_jour: parseInt(scheduleFinJour),
            });

            await Swal.fire({
                title: 'Campagnes programmées !',
                text: res.data.message,
                icon: 'success',
                confirmButtonColor: '#0ab39c'
            });

            setSelectedMois([]);
            setShowScheduleForm(false);
            fetchCampagnes();
            fetchCurrentMonthStatus();
        } catch (error) {
            console.error('Erreur programmation:', error);
            setAlert({
                type: 'danger',
                message: error.response?.data?.message || 'Erreur lors de la programmation.',
            });
        } finally {
            setSchedulingLoading(false);
        }
    };

    // ══ Toggle programmée ↔ désactivée ══
    const handleToggle = async (campagne) => {
        const newLabel = campagne.status === 'programmee' ? 'désactiver' : 'réactiver';
        const result = await Swal.fire({
            title: `${campagne.status === 'programmee' ? 'Désactiver' : 'Réactiver'} la campagne ?`,
            html: `<p>Voulez-vous ${newLabel} la campagne <strong>${MOIS_NOMS[campagne.mois - 1]} ${campagne.annee}</strong> ?</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: campagne.status === 'programmee' ? '#f7b84b' : '#0ab39c',
            confirmButtonText: campagne.status === 'programmee' ? 'Désactiver' : 'Réactiver',
            cancelButtonText: 'Annuler'
        });
        if (!result.isConfirmed) return;

        try {
            const res = await api.put(`campagnes/${campagne.id}/toggle`);
            await Swal.fire({ title: 'Fait !', text: res.data.message, icon: 'success', confirmButtonColor: '#0ab39c' });
            fetchCampagnes();
            fetchCurrentMonthStatus();
        } catch (error) {
            Swal.fire({ title: 'Erreur', text: error.response?.data?.message || 'Erreur.', icon: 'error' });
        }
    };

    // ══ Modifier campagne programmée ══
    const handleEditScheduled = async (campagne) => {
        const dateDebut = campagne.periode_debut_at ? new Date(campagne.periode_debut_at).toISOString().split('T')[0] : '';
        const dateFin = campagne.periode_fin_at ? new Date(campagne.periode_fin_at).toISOString().split('T')[0] : '';

        const { value: formValues } = await Swal.fire({
            title: `Modifier — ${MOIS_NOMS[campagne.mois - 1]} ${campagne.annee}`,
            html: `
                <div class="text-start">
                    <label for="swal-debut" class="form-label mt-2">Date de début :</label>
                    <input type="date" id="swal-debut" class="form-control" value="${dateDebut}">
                    <label for="swal-fin" class="form-label mt-3">Date de fin :</label>
                    <input type="date" id="swal-fin" class="form-control" value="${dateFin}">
                </div>`,
            showCancelButton: true,
            confirmButtonColor: '#0ab39c',
            confirmButtonText: 'Enregistrer',
            cancelButtonText: 'Annuler',
            preConfirm: () => {
                const debut = document.getElementById('swal-debut').value;
                const fin = document.getElementById('swal-fin').value;
                if (!debut || !fin) { Swal.showValidationMessage('Veuillez renseigner les deux dates.'); return false; }
                if (new Date(debut) > new Date(fin)) { Swal.showValidationMessage('La date de début doit être antérieure à la date de fin.'); return false; }
                return { debut, fin };
            }
        });
        if (!formValues) return;

        try {
            const res = await api.put(`campagnes/${campagne.id}`, {
                periode_debut_at: formValues.debut,
                periode_fin_at: formValues.fin,
            });
            await Swal.fire({ title: 'Modifiée !', text: res.data.message, icon: 'success', confirmButtonColor: '#0ab39c' });
            fetchCampagnes();
        } catch (error) {
            Swal.fire({ title: 'Erreur', text: error.response?.data?.message || 'Erreur.', icon: 'error' });
        }
    };

    // ══ Supprimer campagne programmée ══
    const handleDeleteScheduled = async (campagne) => {
        const result = await Swal.fire({
            title: 'Supprimer cette campagne programmée ?',
            html: `<p>Vous allez supprimer la campagne programmée <strong>${MOIS_NOMS[campagne.mois - 1]} ${campagne.annee}</strong>.</p>
                   <p class="text-danger"><i class="ri-alarm-warning-line"></i> Cette action est irréversible.</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler'
        });
        if (!result.isConfirmed) return;

        try {
            await api.delete(`campagnes/${campagne.id}`);
            await Swal.fire({ title: 'Supprimée !', text: 'Campagne programmée supprimée.', icon: 'success', confirmButtonColor: '#0ab39c' });
            fetchCampagnes();
            fetchCurrentMonthStatus();
        } catch (error) {
            Swal.fire({ title: 'Erreur', text: error.response?.data?.message || 'Erreur.', icon: 'error' });
        }
    };

    // ══ Prolonger une campagne exécutée ══
    const handleProlonger = async (campagne) => {
        const dateActuelle = campagne.periode_fin_at ? new Date(campagne.periode_fin_at).toISOString().split('T')[0] : '';

        const { value: nouvelleDateFin } = await Swal.fire({
            title: 'Prolonger la campagne',
            html: `<p>Date de fin actuelle : <strong>${dateActuelle ? new Date(dateActuelle).toLocaleDateString('fr-FR') : 'N/A'}</strong></p>
                   <label for="swal-new-date" class="form-label mt-3">Nouvelle date de fin :</label>
                   <input type="date" id="swal-new-date" class="form-control" value="${dateActuelle}" min="${dateActuelle}">`,
            showCancelButton: true,
            confirmButtonColor: '#0ab39c',
            confirmButtonText: 'Prolonger',
            cancelButtonText: 'Annuler',
            preConfirm: () => {
                const val = document.getElementById('swal-new-date').value;
                if (!val) { Swal.showValidationMessage('Veuillez saisir une date.'); return false; }
                if (new Date(val) <= new Date(dateActuelle)) { Swal.showValidationMessage('La nouvelle date doit être postérieure.'); return false; }
                return val;
            }
        });
        if (!nouvelleDateFin) return;

        try {
            const res = await api.put(`campagnes/${campagne.id}/extend`, { nouvelle_date_fin: nouvelleDateFin });
            await Swal.fire({ title: 'Prolongée !', text: res.data.message, icon: 'success', confirmButtonColor: '#0ab39c' });
            fetchCampagnes();
        } catch (error) {
            Swal.fire({ title: 'Erreur', text: error.response?.data?.message || 'Erreur.', icon: 'error' });
        }
    };

    // ══ Modifier dates d'une campagne exécutée ══
    const handleModifierDates = async (campagne) => {
        const dateDebut = campagne.periode_debut_at ? new Date(campagne.periode_debut_at).toISOString().split('T')[0] : '';
        const dateFin = campagne.periode_fin_at ? new Date(campagne.periode_fin_at).toISOString().split('T')[0] : '';

        const { value: formValues } = await Swal.fire({
            title: 'Modifier les dates de la campagne',
            html: `
                <div class="text-start">
                    <label for="swal-debut" class="form-label mt-2">Date de début :</label>
                    <input type="date" id="swal-debut" class="form-control" value="${dateDebut}">
                    <label for="swal-fin" class="form-label mt-3">Date de fin :</label>
                    <input type="date" id="swal-fin" class="form-control" value="${dateFin}">
                </div>`,
            showCancelButton: true,
            confirmButtonColor: '#0ab39c',
            confirmButtonText: 'Enregistrer',
            cancelButtonText: 'Annuler',
            preConfirm: () => {
                const debut = document.getElementById('swal-debut').value;
                const fin = document.getElementById('swal-fin').value;
                if (!debut || !fin) { Swal.showValidationMessage('Veuillez renseigner les deux dates.'); return false; }
                if (new Date(debut) > new Date(fin)) { Swal.showValidationMessage('Date début > date fin.'); return false; }
                return { debut, fin };
            }
        });
        if (!formValues) return;

        try {
            const res = await api.put(`campagnes/${campagne.id}/dates`, {
                nouvelle_date_debut: formValues.debut,
                nouvelle_date_fin: formValues.fin,
            });
            await Swal.fire({ title: 'Dates modifiées !', text: res.data.message, icon: 'success', confirmButtonColor: '#0ab39c' });
            fetchCampagnes();
        } catch (error) {
            Swal.fire({ title: 'Erreur', text: error.response?.data?.message || 'Erreur.', icon: 'error' });
        }
    };

    // ══ Supprimer campagne exécutée ══
    const handleDeleteExecuted = async (campagne) => {
        if (!campagne.isDeletable) {
            Swal.fire({
                title: 'Suppression impossible',
                html: `<p>Cette campagne ne peut pas être supprimée car des services ont déjà interagi avec les navettes.</p>
                       <p><strong>${campagne.totalSaisies}</strong> saisie(s) effectuée(s).</p>`,
                icon: 'warning',
                confirmButtonColor: '#0ab39c'
            });
            return;
        }

        const periodeLabel = `${MOIS_NOMS[campagne.mois - 1]} ${campagne.annee}`;
        const result = await Swal.fire({
            title: 'Supprimer cette campagne ?',
            html: `<p>Vous allez supprimer la campagne <strong>${periodeLabel}</strong> comprenant <strong>${campagne.totalServices}</strong> navette(s).</p>
                   <p class="text-danger"><i class="ri-alarm-warning-line"></i> Cette action est irréversible.</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler'
        });
        if (!result.isConfirmed) return;

        try {
            const res = await api.delete(`campagnes/${campagne.id}/executed`);
            await Swal.fire({ title: 'Supprimée !', text: res.data.message, icon: 'success', confirmButtonColor: '#0ab39c' });
            fetchCampagnes();
            fetchCurrentMonthStatus();
        } catch (error) {
            Swal.fire({ title: 'Erreur', text: error.response?.data?.message || 'Erreur.', icon: 'error' });
        }
    };

    // ── Utilitaires ──
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('fr-FR');
    };

    const getCampagneProgress = (campagne) => {
        const total = campagne.totalServices || 0;
        if (total === 0) return 0;
        const terminees = campagne.statusCounts?.['Terminé'] || 0;
        return Math.round((terminees / total) * 100);
    };

    const isExpired = (dateStr) => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    };

    const isCampagneTerminee = (campagne) => {
        const total = campagne.totalServices || 0;
        if (total === 0) return false;
        return (campagne.statusCounts?.['Terminé'] || 0) === total;
    };

    const toggleMoisSelection = (mois) => {
        setSelectedMois(prev =>
            prev.includes(mois) ? prev.filter(m => m !== mois) : [...prev, mois].sort((a, b) => a - b)
        );
    };

    if (!user) return <Loading loading={true} />;

    // ── KPIs ──
    const kpiCards = [
        { label: 'Total',       icon: 'ri-rocket-line',             color: '#405189', value: campagnes.length },
        { label: 'Actives',     icon: 'ri-play-circle-line',        color: '#0ab39c', value: campagnesExecutees.filter(c => !isCampagneTerminee(c) && c.status === 'active').length },
        { label: 'Programmées', icon: 'ri-calendar-schedule-line',  color: '#299cdb', value: campagnesProgrammees.filter(c => c.status === 'programmee').length },
        { label: 'Navettes',    icon: 'ri-file-list-3-line',        color: '#f7b84b', value: campagnes.reduce((a, c) => a + (c.totalServices || 0), 0) },
        { label: 'Terminées',   icon: 'ri-check-double-line',       color: '#878a99', value: campagnesExecutees.filter(c => isCampagneTerminee(c)).length },
    ];

    return (
        <Layout>
            {/* ============ STYLE ============ */}
            <style>{`
                .launch-hero{background:linear-gradient(135deg,#405189 0%,#2e3a5f 50%,#0ab39c 100%);border-radius:16px;padding:32px 36px;color:#fff;margin-bottom:28px;position:relative;overflow:hidden}
                .launch-hero::after{content:'';position:absolute;top:-40%;right:-10%;width:320px;height:320px;background:radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%);border-radius:50%}
                .launch-hero h3{font-weight:700;font-size:1.5rem;margin-bottom:4px}
                .launch-hero p{opacity:.85;margin:0;font-size:.88rem}

                .launch-kpi{background:#fff;border-radius:14px;padding:18px 20px;box-shadow:0 2px 12px rgba(0,0,0,.06);transition:transform .2s,box-shadow .2s;height:100%}
                .launch-kpi:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.1)}
                .launch-kpi-icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
                .launch-kpi-label{font-size:.72rem;text-transform:uppercase;font-weight:600;letter-spacing:.3px;color:#878a99;margin-bottom:2px}
                .launch-kpi-val{font-size:1.45rem;font-weight:700;line-height:1.15}

                .launch-section{font-size:.82rem;text-transform:uppercase;letter-spacing:.6px;font-weight:700;color:#878a99;margin-bottom:16px;display:flex;align-items:center;gap:8px}
                .launch-section i{font-size:15px}

                .launch-form-card{background:#fff;border-radius:14px;border:2px solid #40518930;padding:28px 32px;box-shadow:0 2px 16px rgba(0,0,0,.06);position:relative;overflow:hidden}
                .launch-form-card::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#405189,#0ab39c)}

                .launch-tbl{width:100%;border-collapse:separate;border-spacing:0;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)}
                .launch-tbl th{font-size:.72rem;text-transform:uppercase;color:#878a99;font-weight:600;padding:12px 14px;background:#f8f9fa;border-bottom:2px solid #eef0f7}
                .launch-tbl td{padding:14px;border-bottom:1px solid #f3f3f9;font-size:.85rem;color:#495057;vertical-align:middle}
                .launch-tbl tbody tr:hover{background:#f8f9fc}
                .launch-tbl tbody tr:last-child td{border-bottom:none}

                .launch-status-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 12px;border-radius:20px;font-size:.74rem;font-weight:600}
                .launch-progress{height:7px;background:#f3f3f9;border-radius:8px;overflow:hidden}
                .launch-progress-fill{height:100%;border-radius:8px;transition:width .5s ease}
                .launch-status-dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0}
                .launch-mini-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:.67rem;font-weight:600;margin-right:3px}

                .launch-expand-card{background:#f8f9fc;border-radius:12px;padding:20px;margin:4px 14px 14px}
                .launch-sub-tbl{width:100%;border-collapse:separate;border-spacing:0;background:#fff;border-radius:10px;overflow:hidden}
                .launch-sub-tbl th{font-size:.68rem;text-transform:uppercase;color:#878a99;font-weight:600;padding:10px 12px;background:#f8f9fa;border-bottom:1px solid #eef0f7}
                .launch-sub-tbl td{padding:10px 12px;border-bottom:1px solid #f3f3f9;font-size:.82rem;color:#495057}
                .launch-sub-tbl tbody tr:last-child td{border-bottom:none}

                .launch-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;border:none;cursor:pointer;transition:all .2s;font-size:16px}
                .launch-btn:hover{transform:scale(1.08)}
                .launch-btn-primary{background:#40518912;color:#405189}
                .launch-btn-primary:hover{background:#40518925}
                .launch-btn-info{background:#299cdb12;color:#299cdb}
                .launch-btn-info:hover{background:#299cdb25}
                .launch-btn-success{background:#0ab39c12;color:#0ab39c}
                .launch-btn-success:hover{background:#0ab39c25}
                .launch-btn-warning{background:#f7b84b12;color:#f7b84b}
                .launch-btn-warning:hover{background:#f7b84b25}
                .launch-btn-danger{background:#f0654812;color:#f06548}
                .launch-btn-danger:hover{background:#f0654825}
                .launch-btn-disabled{background:#878a9910;color:#d2d2d8;cursor:not-allowed}
                .launch-btn-disabled:hover{transform:none}

                .launch-empty{text-align:center;padding:48px 20px}
                .launch-empty i{font-size:56px;display:block;margin-bottom:12px;color:#d2d2d8}
                .launch-empty h5{color:#495057;font-weight:600;margin-bottom:6px}
                .launch-empty p{color:#878a99;font-size:.88rem;margin-bottom:20px}

                .launch-expire-tag{display:inline-flex;align-items:center;gap:4px;font-size:.68rem;color:#f06548;font-weight:600;margin-top:2px}

                .launch-tab{padding:8px 18px;border-radius:10px;border:none;background:transparent;color:#878a99;font-weight:600;font-size:.82rem;cursor:pointer;transition:all .2s}
                .launch-tab:hover{background:#f3f3f9;color:#495057}
                .launch-tab.active{background:#405189;color:#fff}
                .launch-tab .tab-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;border-radius:10px;font-size:.68rem;font-weight:700;margin-left:6px;padding:0 6px}

                .mois-chip{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:12px;border:2px solid #e9ecf0;cursor:pointer;transition:all .2s;font-size:.84rem;font-weight:600;color:#495057;background:#fff;user-select:none}
                .mois-chip:hover{border-color:#405189;background:#40518908}
                .mois-chip.selected{border-color:#405189;background:#40518915;color:#405189}
                .mois-chip.disabled{opacity:.4;cursor:not-allowed;border-color:#e9ecf0;background:#f8f9fa}
                .mois-chip .chip-check{width:18px;height:18px;border-radius:5px;border:2px solid #d2d2d8;display:flex;align-items:center;justify-content:center;transition:all .2s;font-size:11px}
                .mois-chip.selected .chip-check{border-color:#405189;background:#405189;color:#fff}

                .hero-btn{position:relative;z-index:11;backdrop-filter:blur(8px);color:#fff;font-weight:600;border-radius:10px;border:1px solid rgba(255,255,255,.25);font-size:.84rem;padding:8px 18px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;transition:all .2s}
                .hero-btn:hover{transform:translateY(-1px)}
                .hero-btn-launch{background:rgba(10,179,156,.35)}
                .hero-btn-launch:hover{background:rgba(10,179,156,.5)}
                .hero-btn-schedule{background:rgba(41,156,219,.3)}
                .hero-btn-schedule:hover{background:rgba(41,156,219,.45)}
                .hero-btn-close{background:rgba(255,255,255,.15)}
                .hero-btn-close:hover{background:rgba(255,255,255,.25)}
                .hero-btn-disabled{background:rgba(255,255,255,.08);opacity:.5;cursor:not-allowed}
                .hero-btn-disabled:hover{transform:none}
            `}</style>

            <AlertMessages alert={alert} setAlert={setAlert} />

            {/* ============ HERO ============ */}
            <div className="launch-hero">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div>
                        <h3 className="text-light"><i className="ri-rocket-line me-2" style={{ opacity: .85 }} />Gestion des Campagnes</h3>
                        <p>Lancez, programmez et gérez les campagnes navettes de vos services</p>
                        {currentMonthStatus && (
                            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                                {currentMonthStatus.hasActiveCampagne ? (
                                    <span style={{ background: 'rgba(10,179,156,.25)', padding: '4px 14px', borderRadius: 20, fontSize: '.78rem', fontWeight: 600 }}>
                                        <i className="ri-checkbox-circle-fill me-1" />{MOIS_NOMS[moisCourant - 1]} {anneeCourante} — Campagne déjà lancée
                                    </span>
                                ) : currentMonthStatus.hasScheduledCampagne ? (
                                    <span style={{ background: 'rgba(41,156,219,.25)', padding: '4px 14px', borderRadius: 20, fontSize: '.78rem', fontWeight: 600 }}>
                                        <i className="ri-calendar-schedule-line me-1" />{MOIS_NOMS[moisCourant - 1]} {anneeCourante} — Campagne programmée
                                    </span>
                                ) : (
                                    <span style={{ background: 'rgba(247,184,75,.25)', padding: '4px 14px', borderRadius: 20, fontSize: '.78rem', fontWeight: 600 }}>
                                        <i className="ri-alert-line me-1" />{MOIS_NOMS[moisCourant - 1]} {anneeCourante} — Aucune campagne
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="d-flex gap-2 flex-wrap my-3">
                        {/* Bouton Lancer — visible seulement si pas de campagne active ce mois */}
                        {canLaunch && (
                            <button
                                className={`hero-btn ${showLaunchForm ? 'hero-btn-close' : 'hero-btn-launch'}`}
                                onClick={() => { setShowLaunchForm(!showLaunchForm); setShowScheduleForm(false); }}
                            >
                                {showLaunchForm
                                    ? <><i className="ri-close-line" />Fermer</>
                                    : <><i className="ri-rocket-line" />Lancer {MOIS_NOMS[moisCourant - 1]}</>
                                }
                            </button>
                        )}
                        <button
                            className={`hero-btn ${showScheduleForm ? 'hero-btn-close' : 'hero-btn-schedule'}`}
                            onClick={() => { setShowScheduleForm(!showScheduleForm); setShowLaunchForm(false); }}
                        >
                            {showScheduleForm
                                ? <><i className="ri-close-line" />Fermer</>
                                : <><i className="ri-calendar-schedule-line" />Programmer</>
                            }
                        </button>
                    </div>
                </div>
            </div>

            {/* ============ KPIs ============ */}
            <div className="row g-3 mb-4">
                {kpiCards.map((kpi, i) => (
                    <div className="col" key={i} style={{ minWidth: 160 }}>
                        <div className="launch-kpi">
                            <div className="d-flex align-items-center gap-3">
                                <div className="launch-kpi-icon" style={{ background: `${kpi.color}15`, color: kpi.color }}>
                                    <i className={kpi.icon} />
                                </div>
                                <div>
                                    <div className="launch-kpi-label">{kpi.label}</div>
                                    <div className="launch-kpi-val" style={{ color: kpi.color }}>{kpi.value}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ============ FORMULAIRE LANCEMENT MANUEL ============ */}
            {showLaunchForm && canLaunch && (
                <div className="row justify-content-center mb-4">
                    <div className="col-lg-8 col-xl-6">
                        <div className="launch-form-card">
                            <h6 style={{ fontWeight: 700, color: '#405189', marginBottom: 16, fontSize: '.95rem' }}>
                                <i className="ri-rocket-line me-2" />
                                Lancer la campagne — {MOIS_NOMS[moisCourant - 1]} {anneeCourante}
                            </h6>
                            <div style={{ background: '#299cdb10', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <i className="ri-information-line" style={{ color: '#299cdb', fontSize: 18, marginTop: 2 }} />
                                <span style={{ fontSize: '.84rem', color: '#495057' }}>
                                    Lancer une campagne créera un état navette pour <strong>chaque service</strong> avec ses employés actifs.
                                    {currentMonthStatus?.hasScheduledCampagne && (
                                        <><br /><strong style={{ color: '#f7b84b' }}>Note :</strong> Une campagne programmée existe pour ce mois — elle sera utilisée et lancée immédiatement.</>
                                    )}
                                </span>
                            </div>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#495057', marginBottom: 6, display: 'block' }}>
                                        Date de début <span style={{ color: '#f06548' }}>*</span>
                                    </label>
                                    <input
                                        type="date" className="form-control" value={periodeDebut}
                                        onChange={(e) => setPeriodeDebut(e.target.value)}
                                        style={{ borderRadius: 10, border: '1px solid #ddd', padding: '10px 14px' }}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#495057', marginBottom: 6, display: 'block' }}>
                                        Date de fin <span style={{ color: '#f06548' }}>*</span>
                                    </label>
                                    <input
                                        type="date" className="form-control" value={periodeFin}
                                        onChange={(e) => setPeriodeFin(e.target.value)}
                                        style={{ borderRadius: 10, border: '1px solid #ddd', padding: '10px 14px' }}
                                    />
                                </div>
                            </div>
                            <div className="mt-4 d-flex justify-content-end gap-2">
                                <button className="btn" style={{ background: '#f3f3f9', color: '#495057', fontWeight: 600, borderRadius: 10, padding: '8px 20px' }}
                                    onClick={() => setShowLaunchForm(false)} disabled={loading}>
                                    Annuler
                                </button>
                                <button className="btn" style={{ background: 'linear-gradient(135deg,#405189,#0ab39c)', color: '#fff', fontWeight: 600, borderRadius: 10, padding: '8px 24px', border: 'none' }}
                                    onClick={handleLaunch} disabled={loading}>
                                    {loading
                                        ? <><span className="spinner-border spinner-border-sm me-2" />Lancement...</>
                                        : <><i className="ri-rocket-line me-1" />Lancer la campagne</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ FORMULAIRE PROGRAMMATION ============ */}
            {showScheduleForm && (
                <div className="row justify-content-center mb-4">
                    <div className="col-lg-10 col-xl-8">
                        <div className="launch-form-card">
                            <h6 style={{ fontWeight: 700, color: '#299cdb', marginBottom: 16, fontSize: '.95rem' }}>
                                <i className="ri-calendar-schedule-line me-2" />
                                Programmer des campagnes — {anneeCourante}
                            </h6>
                            <div style={{ background: '#299cdb10', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <i className="ri-information-line" style={{ color: '#299cdb', fontSize: 18, marginTop: 2 }} />
                                <span style={{ fontSize: '.84rem', color: '#495057' }}>
                                    Les campagnes programmées seront <strong>lancées automatiquement</strong> le 1er jour du mois sélectionné. Vous pouvez modifier, désactiver ou supprimer une campagne programmée à tout moment.
                                </span>
                            </div>

                            {/* Sélection des mois */}
                            <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#495057', marginBottom: 10, display: 'block' }}>
                                Sélectionnez les mois <span style={{ color: '#f06548' }}>*</span>
                            </label>
                            <div className="d-flex flex-wrap gap-2 mb-4">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                                    const isOccupied = occupiedMois.includes(m);
                                    const isPast = m < moisCourant;
                                    const isDisabled = isOccupied || isPast;
                                    const isSelected = selectedMois.includes(m);

                                    return (
                                        <div
                                            key={m}
                                            className={`mois-chip ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                            onClick={() => !isDisabled && toggleMoisSelection(m)}
                                            title={isOccupied ? 'Campagne existante' : isPast ? 'Mois passé' : ''}
                                        >
                                            <span className="chip-check">
                                                {isSelected && <i className="ri-check-line" />}
                                                {isOccupied && !isSelected && <i className="ri-lock-line" style={{ fontSize: 10 }} />}
                                            </span>
                                            {MOIS_NOMS[m - 1].substring(0, 4)}.
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedMois.length > 0 && (
                                <div style={{ background: '#40518908', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: '.82rem', color: '#405189', fontWeight: 600 }}>
                                    <i className="ri-check-double-line me-1" />
                                    {selectedMois.length} mois sélectionné(s) : {selectedMois.map(m => MOIS_NOMS[m - 1]).join(', ')}
                                </div>
                            )}

                            {/* Jours de période */}
                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#495057', marginBottom: 6, display: 'block' }}>
                                        Jour de début de période <span style={{ color: '#f06548' }}>*</span>
                                    </label>
                                    <input
                                        type="number" className="form-control" value={scheduleDebutJour}
                                        onChange={(e) => setScheduleDebutJour(e.target.value)}
                                        min={1} max={28}
                                        style={{ borderRadius: 10, border: '1px solid #ddd', padding: '10px 14px' }}
                                    />
                                    <div style={{ fontSize: '.72rem', color: '#878a99', marginTop: 4 }}>Ex: 1 = le 1er du mois</div>
                                </div>
                                <div className="col-md-6">
                                    <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#495057', marginBottom: 6, display: 'block' }}>
                                        Jour de fin de période <span style={{ color: '#f06548' }}>*</span>
                                    </label>
                                    <input
                                        type="number" className="form-control" value={scheduleFinJour}
                                        onChange={(e) => setScheduleFinJour(e.target.value)}
                                        min={1} max={31}
                                        style={{ borderRadius: 10, border: '1px solid #ddd', padding: '10px 14px' }}
                                    />
                                    <div style={{ fontSize: '.72rem', color: '#878a99', marginTop: 4 }}>Ex: 25 = le 25 du mois (ajusté si le mois est plus court)</div>
                                </div>
                            </div>

                            <div className="mt-4 d-flex justify-content-end gap-2">
                                <button className="btn" style={{ background: '#f3f3f9', color: '#495057', fontWeight: 600, borderRadius: 10, padding: '8px 20px' }}
                                    onClick={() => { setShowScheduleForm(false); setSelectedMois([]); }} disabled={schedulingLoading}>
                                    Annuler
                                </button>
                                <button className="btn" style={{ background: 'linear-gradient(135deg,#299cdb,#405189)', color: '#fff', fontWeight: 600, borderRadius: 10, padding: '8px 24px', border: 'none' }}
                                    onClick={handleSchedule} disabled={schedulingLoading || selectedMois.length === 0}>
                                    {schedulingLoading
                                        ? <><span className="spinner-border spinner-border-sm me-2" />Programmation...</>
                                        : <><i className="ri-calendar-schedule-line me-1" />Programmer {selectedMois.length > 0 ? `(${selectedMois.length})` : ''}</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ TABS ============ */}
            <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
                <div className="launch-section mb-0" style={{ marginRight: 8 }}>
                    <i className="ri-list-check" style={{ color: '#405189' }} />
                    Campagnes
                </div>
                <button className={`launch-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                    Toutes
                    <span className="tab-count" style={{ background: activeTab === 'all' ? 'rgba(255,255,255,.2)' : '#f3f3f9', color: activeTab === 'all' ? '#fff' : '#878a99' }}>
                        {campagnes.length}
                    </span>
                </button>
                <button className={`launch-tab ${activeTab === 'programmees' ? 'active' : ''}`} onClick={() => setActiveTab('programmees')}>
                    Programmées
                    <span className="tab-count" style={{ background: activeTab === 'programmees' ? 'rgba(255,255,255,.2)' : '#299cdb15', color: activeTab === 'programmees' ? '#fff' : '#299cdb' }}>
                        {campagnesProgrammees.length}
                    </span>
                </button>
                <button className={`launch-tab ${activeTab === 'executees' ? 'active' : ''}`} onClick={() => setActiveTab('executees')}>
                    Exécutées
                    <span className="tab-count" style={{ background: activeTab === 'executees' ? 'rgba(255,255,255,.2)' : '#0ab39c15', color: activeTab === 'executees' ? '#fff' : '#0ab39c' }}>
                        {campagnesExecutees.length}
                    </span>
                </button>
            </div>

            {/* ============ LISTE ============ */}
            {loadingCampagnes ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                    <div className="spinner-border" style={{ color: '#405189' }} role="status" />
                    <p style={{ marginTop: 12, color: '#878a99', fontSize: '.88rem' }}>Chargement des campagnes...</p>
                </div>
            ) : filteredCampagnes.length === 0 ? (
                <div className="launch-empty" style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                    <i className="ri-rocket-line" />
                    <h5>Aucune campagne</h5>
                    <p>{activeTab === 'programmees' ? 'Aucune campagne programmée. Utilisez le bouton "Programmer" pour en créer.' : activeTab === 'executees' ? 'Aucune campagne exécutée.' : 'Lancez ou programmez votre première campagne navette.'}</p>
                    {activeTab !== 'executees' && (
                        <button className="btn" style={{ background: 'linear-gradient(135deg,#405189,#0ab39c)', color: '#fff', fontWeight: 600, borderRadius: 10, padding: '8px 24px', border: 'none' }}
                            onClick={() => { setShowScheduleForm(true); setShowLaunchForm(false); }}>
                            <i className="ri-calendar-schedule-line me-1" />Programmer
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="launch-tbl">
                        <thead>
                            <tr>
                                {activeTab !== 'programmees' && <th style={{ width: 40 }}></th>}
                                <th>Période</th>
                                <th>Début</th>
                                <th>Fin</th>
                                <th style={{ textAlign: 'center' }}>Statut</th>
                                {activeTab !== 'programmees' && <th style={{ textAlign: 'center' }}>Services</th>}
                                {activeTab !== 'programmees' && <th style={{ minWidth: 180 }}>Avancement</th>}
                                {activeTab !== 'programmees' && <th style={{ textAlign: 'center' }}>Saisies</th>}
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCampagnes.map((campagne, index) => {
                                const isExecuted = campagne.is_executed;
                                const progress = isExecuted ? getCampagneProgress(campagne) : 0;
                                const expired = isExecuted && isExpired(campagne.periode_fin_at);
                                const isExpanded = expandedCampagne === campagne.id;
                                const progressColor = progress === 100 ? '#0ab39c' : progress > 50 ? '#299cdb' : '#f7b84b';
                                const cs = CAMPAGNE_STATUS_STYLE[campagne.status] || CAMPAGNE_STATUS_STYLE.programmee;

                                // Override status for expired executed
                                let displayCS = cs;
                                if (isExecuted && expired && progress < 100) {
                                    displayCS = { bg: '#f06548', light: '#f0654815', icon: 'ri-alarm-warning-line', label: 'Expirée' };
                                } else if (isExecuted && progress === 100) {
                                    displayCS = CAMPAGNE_STATUS_STYLE.terminee;
                                }

                                return (
                                    <React.Fragment key={campagne.id}>
                                        <tr style={expired && progress < 100 ? { background: '#f7b84b08' } : {}}>
                                            {/* Expand button (only for executed) */}
                                            {activeTab !== 'programmees' && (
                                                <td style={{ padding: '14px 6px 14px 14px' }}>
                                                    {isExecuted ? (
                                                        <button
                                                            onClick={() => setExpandedCampagne(isExpanded ? null : campagne.id)}
                                                            style={{
                                                                width: 28, height: 28, borderRadius: 8, border: 'none',
                                                                background: isExpanded ? '#40518915' : '#f3f3f9',
                                                                color: isExpanded ? '#405189' : '#878a99',
                                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all .2s', fontSize: 16,
                                                            }}
                                                        >
                                                            <i className={`ri-arrow-${isExpanded ? 'down' : 'right'}-s-line`} />
                                                        </button>
                                                    ) : <span />}
                                                </td>
                                            )}

                                            {/* Période */}
                                            <td>
                                                <div style={{ fontWeight: 700, color: '#495057', fontSize: '.9rem' }}>
                                                    {MOIS_NOMS[campagne.mois - 1]} {campagne.annee}
                                                </div>
                                                <div style={{ fontSize: '.72rem', color: '#878a99' }}>
                                                    {isExecuted ? `Lancée le ${formatDate(campagne.executed_at)}` : `Créée le ${formatDate(campagne.created_at)}`}
                                                </div>
                                            </td>

                                            {/* Début */}
                                            <td>{formatDate(campagne.periode_debut_at)}</td>

                                            {/* Fin */}
                                            <td>
                                                <span style={expired ? { color: '#f06548', fontWeight: 600 } : {}}>
                                                    {formatDate(campagne.periode_fin_at)}
                                                </span>
                                                {expired && isExecuted && (
                                                    <div className="launch-expire-tag"><i className="ri-time-line" />Expirée</div>
                                                )}
                                            </td>

                                            {/* Statut */}
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="launch-status-pill" style={{ background: displayCS.light, color: displayCS.bg }}>
                                                    <i className={displayCS.icon} style={{ fontSize: 13 }} />
                                                    {displayCS.label}
                                                </span>
                                            </td>

                                            {/* Services (only for executed) */}
                                            {activeTab !== 'programmees' && (
                                                <td style={{ textAlign: 'center' }}>
                                                    {isExecuted ? (
                                                        <span style={{ background: '#40518912', color: '#405189', fontWeight: 700, padding: '4px 12px', borderRadius: 20, fontSize: '.82rem' }}>
                                                            {campagne.totalServices}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#878a99', fontSize: '.8rem' }}>—</span>
                                                    )}
                                                </td>
                                            )}

                                            {/* Avancement (only for executed) */}
                                            {activeTab !== 'programmees' && (
                                                <td>
                                                    {isExecuted ? (
                                                        <>
                                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                                <div className="launch-progress flex-grow-1">
                                                                    <div className="launch-progress-fill" style={{ width: `${progress}%`, background: progressColor }} />
                                                                </div>
                                                                <span style={{ fontSize: '.78rem', fontWeight: 700, color: progressColor, minWidth: 36 }}>
                                                                    {progress}%
                                                                </span>
                                                            </div>
                                                            <div className="d-flex gap-1 flex-wrap">
                                                                {Object.entries(campagne.statusCounts || {}).filter(([, v]) => v > 0).map(([st, cnt]) => {
                                                                    const s = STATUS_STYLE[st] || { bg: '#878a99', light: '#878a9915' };
                                                                    return (
                                                                        <span key={st} className="launch-mini-badge" style={{ background: s.light, color: s.bg }}>
                                                                            <span className="launch-status-dot" style={{ background: s.bg }} />
                                                                            {cnt} {st.toLowerCase()}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span style={{ color: '#878a99', fontSize: '.8rem' }}>—</span>
                                                    )}
                                                </td>
                                            )}

                                            {/* Saisies (only for executed) */}
                                            {activeTab !== 'programmees' && (
                                                <td style={{ textAlign: 'center' }}>
                                                    {isExecuted ? (
                                                        <span style={{
                                                            background: campagne.totalSaisies > 0 ? '#0ab39c15' : '#878a9910',
                                                            color: campagne.totalSaisies > 0 ? '#0ab39c' : '#878a99',
                                                            fontWeight: 700, padding: '3px 12px', borderRadius: 20, fontSize: '.82rem',
                                                        }}>
                                                            {campagne.totalSaisies}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#878a99', fontSize: '.8rem' }}>—</span>
                                                    )}
                                                </td>
                                            )}

                                            {/* Actions */}
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="d-flex gap-1 justify-content-end">
                                                    {!isExecuted ? (
                                                        /* ── Actions campagne programmée ── */
                                                        <>
                                                            <button className="launch-btn launch-btn-primary" onClick={() => handleEditScheduled(campagne)}
                                                                title="Modifier les dates">
                                                                <i className="ri-edit-line" />
                                                            </button>
                                                            <button
                                                                className={`launch-btn ${campagne.status === 'programmee' ? 'launch-btn-warning' : 'launch-btn-success'}`}
                                                                onClick={() => handleToggle(campagne)}
                                                                title={campagne.status === 'programmee' ? 'Désactiver' : 'Réactiver'}
                                                            >
                                                                <i className={campagne.status === 'programmee' ? 'ri-pause-circle-line' : 'ri-play-circle-line'} />
                                                            </button>
                                                            <button className="launch-btn launch-btn-danger" onClick={() => handleDeleteScheduled(campagne)}
                                                                title="Supprimer">
                                                                <i className="ri-delete-bin-line" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        /* ── Actions campagne exécutée ── */
                                                        <>
                                                            {!isCampagneTerminee(campagne) && campagne.totalSaisies === 0 && (
                                                                <button className="launch-btn launch-btn-primary" onClick={() => handleModifierDates(campagne)}
                                                                    title="Modifier les dates">
                                                                    <i className="ri-edit-line" />
                                                                </button>
                                                            )}
                                                            <button className="launch-btn launch-btn-info" onClick={() => handleProlonger(campagne)}
                                                                title="Prolonger">
                                                                <i className="ri-calendar-event-line" />
                                                            </button>
                                                            {campagne.isDeletable && !isExpired(campagne.periode_fin_at) && !isCampagneTerminee(campagne) && (
                                                                <button className="launch-btn launch-btn-danger" onClick={() => handleDeleteExecuted(campagne)}
                                                                    title="Supprimer">
                                                                    <i className="ri-delete-bin-line" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* ── Détails navettes (expanded) ── */}
                                        {isExpanded && isExecuted && (
                                            <tr>
                                                <td colSpan="9" style={{ padding: 0, background: 'transparent' }}>
                                                    <div className="launch-expand-card">
                                                        <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#495057', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <i className="ri-list-unordered" style={{ color: '#405189' }} />
                                                            Navettes — {MOIS_NOMS[campagne.mois - 1]} {campagne.annee}
                                                            <span style={{ background: '#40518912', color: '#405189', padding: '2px 10px', borderRadius: 12, fontSize: '.72rem', fontWeight: 600 }}>
                                                                {(campagne.navettes || []).length}
                                                            </span>
                                                        </div>
                                                        <div style={{ overflowX: 'auto' }}>
                                                            <table className="launch-sub-tbl">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Code</th>
                                                                        <th>Service</th>
                                                                        <th>Statut</th>
                                                                        <th>État</th>
                                                                        <th style={{ textAlign: 'right' }}>Action</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {(campagne.navettes || []).map((nav) => {
                                                                        const ns = STATUS_STYLE[nav.status] || { bg: '#878a99', light: '#878a9915', icon: 'ri-question-line' };
                                                                        return (
                                                                            <tr key={nav.id}>
                                                                                <td>
                                                                                    <span style={{ fontFamily: 'monospace', fontSize: '.82rem', background: '#f3f3f9', padding: '3px 8px', borderRadius: 6, color: '#405189', fontWeight: 600 }}>
                                                                                        {nav.code}
                                                                                    </span>
                                                                                </td>
                                                                                <td style={{ fontWeight: 600 }}>{nav.service?.name || 'N/A'}</td>
                                                                                <td>
                                                                                    <span className="launch-status-pill" style={{ background: ns.light, color: ns.bg }}>
                                                                                        <i className={ns.icon} style={{ fontSize: 12 }} />
                                                                                        {nav.status}
                                                                                    </span>
                                                                                    {nav.status_force && (
                                                                                        <span style={{ background: '#f7b84b18', color: '#f7b84b', padding: '2px 8px', borderRadius: 10, fontSize: '.68rem', fontWeight: 600, marginLeft: 6 }} title="Clôture forcée par le système">
                                                                                            <i className="ri-alarm-warning-line" style={{ fontSize: 10, marginRight: 3 }} />Forcé
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                                <td style={{ fontSize: '.8rem', color: '#878a99', maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                    {nav.etat}
                                                                                </td>
                                                                                <td style={{ textAlign: 'right' }}>
                                                                                    <button className="launch-btn launch-btn-primary" onClick={() => navigate(`/navette/${nav.id}`)} title="Voir">
                                                                                        <i className="ri-eye-line" />
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
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
                </div>
            )}

            {/* Journal d'activité — Admin uniquement */}
            <ActivityLogPanel module="campagne" isAdmin={user?.is_admin || user?.is_superadmin} />
        </Layout>
    );
};

export default NavetteLaunchPage;
