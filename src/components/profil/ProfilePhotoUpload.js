import React from 'react';
import Swal from 'sweetalert2';  
import api from '../../axios';

const ProfilePhotoUpload = ({ user, onPhotoUpdate }) => {
    // Fonction pour gérer le changement de fichier
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Préparer le fichier pour l'envoi
            const formData = new FormData();
            formData.append('image', file);

            try {
                // Requête API pour mettre à jour la photo de profil
                const response = await api.put(`users/${user.slug}/photo`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.status === 200) {
                    onPhotoUpdate(response.data.photo); 
                    Swal.fire({
                        icon: 'success',
                        title: 'Photo de profil mise à jour !',
                        text: 'Votre photo de profil a été mise à jour avec succès.',
                    });
                }
            } catch (error) {
                console.error("Erreur lors de la mise à jour de la photo de profil", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Échec de la mise à jour',
                    text: 'La mise à jour de la photo de profil a échoué. Veuillez réessayer.',
                });
            }
        }
    };

    return (

        <input
            id="profile-img-file-input"
            type="file"
            className="profile-img-file-input"
            onChange={handleFileChange}
            accept="image/*"
        />

    );
};

export default ProfilePhotoUpload;
