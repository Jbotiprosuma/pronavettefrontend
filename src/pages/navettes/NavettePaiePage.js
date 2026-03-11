import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../../axios';
import { useParams } from 'react-router-dom';
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
    },
};

const ETAT_STEPS = [
    { key: "En attente de l'enregistrement des informations des employés", label: 'Saisie', icon: 'ri-edit-2-line' },
    { key: "En attente de l'envoi des informations des employés au manager", label: 'Envoi', icon: 'ri-send-plane-line' },
    { key: "En attente de la confirmation des informations des employés par le manager", label: 'Confirmation', icon: 'ri-shield-check-line' },
    { key: "En attente du traitement de l'etat navette par la paie", label: 'Paie', icon: 'ri-money-dollar-circle-line' },
    { key: 'Etat navette cloturé', label: 'Clôturé', icon: 'ri-checkbox-circle-line' },
];

const NavettePaiePage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [navette, setNavette] = useState(null);
    const [navetteLines, setNavetteLines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [currentImagesToDisplay, setCurrentImagesToDisplay] = useState([]);
    const [isSingleImageModalOpen, setIsSingleImageModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const contentRef = useRef(null);
    const [expandedRows, setExpandedRows] = useState({});
    const [tableSearch, setTableSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'nom', dir: 'asc' });
    const [campagneDates, setCampagneDates] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const [isSignalementModalOpen, setIsSignalementModalOpen] = useState(false);
    const [signalementSelections, setSignalementSelections] = useState({});

    const fetchNavetteData = useCallback(async () => {
        try {
            const navetteResponse = await api.get(`navettes/detail/${id}`);
            const fetchedNavette = navetteResponse.data.data;
            setNavette(fetchedNavette);

            const campDates = navetteResponse.data.campagneDates || null;
            setCampagneDates(campDates);

            const sortedNavetteLines = fetchedNavette.navetteLignes
                .sort((a, b) => a.employer.nom.localeCompare(b.employer.nom));
            setNavetteLines(sortedNavetteLines);
        } catch (error) {
            console.error('Erreur lors de la récupération des informations :', error);
            Swal.fire('Erreur', 'Impossible de charger les données de la navette.', 'error');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchNavetteData();
    }, [fetchNavetteData]);

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
            let urgence = 'ok';
            if (joursRestants <= 1) urgence = 'critical';
            else if (joursRestants <= 3) urgence = 'warning';
            else if (joursRestants <= 5) urgence = 'caution';
            setCountdown({ joursRestants, heuresRestantes, minutesRestantes, joursEcoules, totalJours, pourcentage, urgence });
        };
        computeCountdown();
        const interval = setInterval(computeCountdown, 60000);
        return () => clearInterval(interval);
    }, [campagneDates]);

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
            case 'En attente': return 'bg-warning';
            case 'En cours': return 'bg-info';
            case 'Terminer': return 'bg-success';
            case 'Annuler': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };

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
                    console.error('Erreur lors de la clôture de la navette :', error.response?.data?.message || error.message);
                    Swal.fire('Erreur', error.response?.data?.message || 'Impossible de clôturer la navette.', 'error');
                }
            }
        });
    };

     const renderImageModal = () => (
        <Modal isOpen={isImageModalOpen} onRequestClose={closeImageModal} style={customModalStyles} contentLabel="Voir les Fichiers">
            <div className="modal-hdr">
                <h5><i className="ri-image-line me-2"></i>Fichiers Associés</h5>
                <button onClick={closeImageModal} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}><i className="ri-close-line"></i></button>
            </div>
            <div className="modal-body-c">
                <div className="d-flex flex-wrap justify-content-center gap-3">
                    {currentImagesToDisplay.length > 0 ? (
                        currentImagesToDisplay.map((filePath, index) => {
                            const isPdf = filePath.toLowerCase().endsWith('.pdf');
                            return (
                                <div key={index} style={{ width: 130, height: 130, overflow: 'hidden', border: '1px solid #e9ecef', borderRadius: 10, cursor: 'pointer', transition: 'all .2s' }}
                                    onClick={() => isPdf ? window.open(filePath, '_blank') : openSingleImageModal(filePath)}>
                                    {isPdf ? (
                                        <div className="d-flex flex-column align-items-center justify-content-center h-100 p-2 text-center">
                                            <i className="ri-file-pdf-line" style={{ fontSize: '2.5rem', color: '#f06548' }}></i>
                                            <span style={{ fontSize: '.72rem', marginTop: 4, color: '#878a99' }}>Fichier PDF</span>
                                        </div>
                                    ) : (
                                        <img src={filePath} alt={`Fichier ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-muted">Aucun fichier à afficher.</p>
                    )}
                </div>
            </div>
        </Modal>
    );

    const renderSingleImageModal = () => (
        <Modal isOpen={isSingleImageModalOpen} onRequestClose={closeSingleImageModal} style={customModalStyles} contentLabel="Image Agrandie">
            <div className="modal-hdr">
                <h5><i className="ri-zoom-in-line me-2"></i>Aperçu</h5>
                <button onClick={closeSingleImageModal} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}><i className="ri-close-line"></i></button>
            </div>
            <div className="modal-body-c text-center">
                {selectedImageSrc ? (
                    <img src={selectedImageSrc} alt="Aperçu" style={{ maxWidth: '90%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }} onError={(e) => { e.target.onerror = null; e.target.src = '/path/to/placeholder-image.png'; }} />
                ) : (
                    <p className="text-muted">Impossible de charger l'image.</p>
                )}
            </div>
        </Modal>
    );

    // ── sortedNavetteLines & filteredLines (avant early returns) ──
    const sortedNavetteLines = useMemo(() => {
        return [...navetteLines].sort((a, b) => {
            if (a.status === 'Cadre' && b.status !== 'Cadre') return -1;
            if (b.status === 'Cadre' && a.status !== 'Cadre') return 1;
            const nomA = `${a.employer.nom} ${a.employer.prenom}`;
            const nomB = `${b.employer.nom} ${b.employer.prenom}`;
            return nomA.localeCompare(nomB);
        });
    }, [navetteLines]);

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
    }, [sortedNavetteLines, tableSearch, sortConfig]);

    if (loading || !user || !navette) {
        return <Loading loading={true} />;
    }

    const currentStepIdx = ETAT_STEPS.findIndex(s => s.key === navette.etat);
    const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    const handleSort = (key) => setSortConfig(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    const sortIcon = (key) => sortConfig.key !== key ? 'ri-arrow-up-down-line opacity-25' : sortConfig.dir === 'asc' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line';

    const openImageModal = (images) => {
        const imagesArray = Array.isArray(images) ? images : (images ? JSON.parse(images) : []);
        setCurrentImagesToDisplay(imagesArray);
        setIsImageModalOpen(true);
    };
    const closeImageModal = () => { setIsImageModalOpen(false); setCurrentImagesToDisplay([]); };
    const openSingleImageModal = (imageSrc) => { setSelectedImageSrc(imageSrc); setIsSingleImageModalOpen(true); };
    const closeSingleImageModal = () => { setIsSingleImageModalOpen(false); setSelectedImageSrc(''); };

    const renderSignalementModal = () => {
        const selectedCount = Object.values(signalementSelections).filter(v => v.checked).length;

        return (
            <Modal isOpen={isSignalementModalOpen} onRequestClose={() => setIsSignalementModalOpen(false)}
                style={{ ...customModalStyles, content: { ...customModalStyles.content, maxWidth: '780px' } }}
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
                    <div className="d-flex align-items-center justify-content-between mb-3 p-2" style={{ background: '#f8f9fa', borderRadius: 10 }}>
                        <span style={{ fontSize: '.82rem', color: '#495057', fontWeight: 600 }}>
                            <i className="ri-checkbox-multiple-line me-1 text-primary"></i>
                            {selectedCount} ligne{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '.75rem', color: '#878a99' }}>{navetteLines.length} employés au total</span>
                    </div>
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

    return (
        <>
            <Layout>
                <style>{`@keyframes pulse-step{0%,100%{box-shadow:0 0 0 0 rgba(64,81,137,.4)}50%{box-shadow:0 0 0 10px rgba(64,81,137,0)}}.step-active{animation:pulse-step 2s infinite}.fullscreen-bg{background:#f3f3f9;min-height:100vh;overflow:auto;padding:1.5rem}.nav-tbl th{cursor:pointer;user-select:none;white-space:nowrap;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:#878a99;font-weight:600;padding:10px 12px;border-bottom:2px solid #e9ecef;background:#fafbfc}.nav-tbl td{padding:8px 12px;font-size:.82rem;vertical-align:middle;border-bottom:1px solid #f0f0f0}.nav-tbl tbody tr:hover{background:#f4f6fb}.nav-tbl .expand-row{background:#f8faff;border-left:3px solid #405189;animation:slideDown .25s ease}@keyframes slideDown{from{opacity:0;max-height:0}to{opacity:1;max-height:600px}}.modal-hdr{background:linear-gradient(135deg,#405189 0%,#0ab39c 100%);color:#fff;padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between}.modal-hdr h5{margin:0;font-size:1.05rem;font-weight:600}.modal-body-c{padding:1.5rem;overflow-y:auto;flex:1}`}</style>
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
                                    <li className="breadcrumb-item"><a href="/navette/paie" style={{ color: 'rgba(255,255,255,.7)' }}>Campagnes</a></li>
                                    <li className="breadcrumb-item" style={{ color: 'rgba(255,255,255,.5)' }}>Traitement paie — {navette.service?.name}</li>
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
                                        <i className="ri-building-line me-1"></i>{navette.service?.name}
                                    </span>
                                    <span style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: '.75rem' }}>
                                        <i className="ri-calendar-line me-1"></i>{new Date(navette.periode_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <span className={`badge rounded-pill ${getStatusBadgeClass(navette.status)}`} style={{ fontSize: '.75rem', padding: '5px 12px' }}>{navette.status}</span>
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
                                                <div style={{ color: '#ff8080', fontSize: '.9rem', fontWeight: 600 }}>Campagne terminée</div>
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
                                    {campagneDates && (
                                        <div className="d-flex gap-3" style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.7)' }}>
                                            <span><i className="ri-play-circle-line me-1"></i>Début : {new Date(campagneDates.debut).toLocaleDateString('fr-FR')}</span>
                                            <span><i className="ri-stop-circle-line me-1"></i>Fin : {new Date(campagneDates.fin).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    )}
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
                                <button type="button" className="btn btn-sm btn-success" onClick={() => {
                                    const baseURL = process.env.REACT_APP_API_URL || 'http://10.0.80.41:4000/api/';
                                    const token = localStorage.getItem('token');
                                    window.open(`${baseURL}navettes/${navette.id}/export-sage?token=${token}`, '_blank');
                                }}>
                                    <i className="ri-file-excel-2-line me-1"></i>Exporter pour Sage
                                </button>
                                {navette.etat === "En attente du traitement de l'etat navette par la paie" && user.is_paie === true && (
                                    <button type="button" className="btn btn-sm btn-soft-warning" onClick={openSignalementModal}>
                                        <i className="ri-error-warning-line me-1"></i>Signaler des corrections
                                    </button>
                                )}
                                {navette.etat === "En attente du traitement de l'etat navette par la paie" && user.is_paie === true && (
                                    <button type="button" className="btn btn-sm btn-danger" onClick={handleCloseNavette}>
                                        <i className="ri-lock-fill me-1"></i>Clôturer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── KPI SUMMARY ── */}
                    <div className="d-flex gap-2 flex-wrap mb-3">
                        {[
                            { label: 'Employés', value: navetteLines.length, icon: 'ri-team-line', color: 'primary' },
                            { label: 'Cadres', value: navetteLines.filter(l => l.status === 'Cadre').length, icon: 'ri-user-star-line', color: 'warning' },
                            { label: 'Non-cadres', value: navetteLines.filter(l => l.status !== 'Cadre').length, icon: 'ri-user-line', color: 'success' },
                            { label: 'Mutations', value: navetteLines.filter(l => l.mutation_out || l.mutation_in).length, icon: 'ri-shuffle-line', color: 'info' },
                        ].map(s => (
                            <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '6px 14px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem' }}>
                                <i className={`${s.icon} text-${s.color}`}></i>
                                <span className="text-muted">{s.label}</span>
                                <strong className={`text-${s.color}`}>{s.value}</strong>
                            </div>
                        ))}
                    </div>

                    {/* ── TABLE CUSTOM ── */}
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLines.map(line => {
                                            const emp = line.employer;
                                            const isExpanded = !!expandedRows[line.id];
                                            const isMutOut = line.mutation_out === 1 || line.mutation_out === true;
                                            const isMutIn = line.mutation_in === 1 || line.mutation_in === true;
                                            const rowOpacity = isMutOut ? 0.5 : 1;

                                            return (
                                                <React.Fragment key={line.id}>
                                                    <tr style={{ opacity: rowOpacity, transition: 'background .15s' }}>
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
                                                            {isMutIn && <span className="badge bg-info-subtle text-info ms-2" style={{ fontSize: '.6rem' }}>Entrant</span>}
                                                        </td>
                                                        <td className="text-center fw-semibold">{line.nb_jours}</td>
                                                        <td className="text-center">{line.nb_jour_abs || <span className="text-muted">—</span>}</td>
                                                        <td className="text-end">{line.accompte ? `${line.accompte.toLocaleString()} F` : <span className="text-muted">—</span>}</td>
                                                        <td className="text-center">{line.prime_nuit || <span className="text-muted">—</span>}</td>
                                                        <td className="text-center">{line.heure_sup_15 || <span className="text-muted">—</span>}</td>
                                                        <td className="text-center">{line.heure_sup_50 || <span className="text-muted">—</span>}</td>
                                                        <td className="text-center">{line.heure_sup_75 || <span className="text-muted">—</span>}</td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr className="expand-row">
                                                            <td colSpan={11} style={{ padding: '14px 16px 14px 48px' }}>
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
                                                                    {/* Primes de nuit */}
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

            {renderImageModal()}
            {renderSingleImageModal()}
            {renderSignalementModal()}
        </>
    );
};

export default NavettePaiePage;