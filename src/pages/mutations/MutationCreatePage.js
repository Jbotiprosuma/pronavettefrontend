import React from 'react';
import Loading from '../../components/base/Loading';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';
import MultiMutationWizard from '../../components/mutations/MultiMutationWizard';

const MutationCreatePage = () => {
    const { user } = useAuth();

    if (!user) {
        return <Loading loading={true} />;
    }

    return (
        <Layout>

            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Gestion des mutations des employés</h4>
                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item"><a href="/dashboard">Tableau de bord</a></li>
                                <li className="breadcrumb-item active">Création de mutation</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-lg-12">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0 flex-grow-1 d-flex justify-content-between align-items-center">
                                Créer une Nouvelle Mutation
                            </h4>
                        </div>
                        <div className="card-body">
                            <div style={{ overflowX: "auto" }}>
                                <MultiMutationWizard />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </Layout>
    );
};

export default MutationCreatePage;