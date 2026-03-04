import React from 'react';
import Loading from '../../components/base/Loading';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';
import EmployerCreate from '../../components/employes/EmployerCreate';

const EmployeCreatePage = () => {
    const { user } = useAuth();

    if (!user) {
        return <Loading loading={true} />;
    }

    return (
        <Layout>
           
                            <div className="row">
                                <div className="col-12">
                                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                        <h4 className="mb-sm-0">Gestion des employés</h4>
                                        <div className="page-title-right">
                                            <ol className="breadcrumb m-0">
                                                <li className="breadcrumb-item"><a href="/dashboard">Tableau de bord</a></li>
                                                <li className="breadcrumb-item active">Modification D'un employé</li>
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
                                                Modification D'un employé
                                            </h4>
                                        </div>
                                        <div className="card-body">
                                            <div style={{ overflowX: "auto" }}>
                                                <EmployerCreate user = {user} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                       
            </Layout>
    );
};

export default EmployeCreatePage;