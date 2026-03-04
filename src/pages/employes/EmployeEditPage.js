import React from 'react';
import Loading from '../../components/base/Loading';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';
import EmployerEdit from '../../components/employes/EmployerEdit';

const EmployeEditPage = () => {
    const { user } = useAuth();
    if (!user) return <Loading loading={true} />;
    return <Layout><EmployerEdit user={user} /></Layout>;
};

export default EmployeEditPage;