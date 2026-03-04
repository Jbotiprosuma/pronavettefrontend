import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/base/Layout';
import ProfileUpdateForm from '../../components/profil/ProfileUpdateForm';
import ProfilePhotoUpload from '../../components/profil/ProfilePhotoUpload';

const ProfilePage = () => {
    const { user, refreshUser } = useAuth();

    const handleUpdate = async () => {
        await refreshUser();
    };

    const handlePhotoUpdate = async () => {
        await refreshUser();
    };

    return (
        <Layout>
            <div className="position-relative mx-n4 mt-n4">
                <div className="profile-wid-bg profile-setting-img">
                    <img src="assets/images/business-background.jpg" className="profile-wid-img" alt="" />
                    <div className="overlay-content"></div>
                </div>
            </div>

            <div className="row">
                <div className="col-xxl-3">
                    <div className="card mt-n5">
                        <div className="card-body p-4">
                            <div className="text-center">
                                <div className="profile-user position-relative d-inline-block mx-auto mb-4">
                                    <img src={user ? user.avatar_url : "assets/images/users/avatar-1.jpg"}
                                        className="rounded-circle avatar-xl img-thumbnail user-profile-image"
                                        alt="user-profile-image" />
                                    <div className="avatar-xs p-0 rounded-circle profile-photo-edit">
                                        <ProfilePhotoUpload user={user} onPhotoUpdate={handlePhotoUpdate} />
                                        <label htmlFor="profile-img-file-input"
                                            className="profile-photo-edit avatar-xs">
                                            <span className="avatar-title rounded-circle bg-light text-body">
                                                <i className="ri-camera-fill"></i>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <h5 className="fs-16 mb-1">{user ? `${user.nom} ${user.prenom}` : "User"}</h5>
                                <p className="text-muted mb-0">
                                    {user && user.role === "standard" ? "Utilisateur" : ""}
                                    {user && user.role === "manager" ? "Manager" : ""}
                                    {user && user.role === "representant" ? "Représentant" : ""}
                                    {user && user.role === "paie" ? "Service Paie" : ""}
                                    {user && user.role === "admin" ? "Administrateur" : ""}
                                    {user && user.role === "superadmin" ? "Super Admin" : ""}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xxl-9">
                    <div className="card mt-xxl-n5">
                        <div className="card-header">
                            <ul className="nav nav-tabs-custom rounded card-header-tabs border-bottom-0" role="tablist">
                                <li className="nav-item">
                                    <button className="nav-link active" data-bs-toggle="tab" href="#personalDetails" role="tab">
                                        <i className="fas fa-home"></i> Informations personnelles
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <div className="card-body p-4">
                            <div className="tab-content">
                                <div className="tab-pane active" id="personalDetails" role="tabpanel">
                                    <ProfileUpdateForm user={user} onUpdate={handleUpdate} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProfilePage;
