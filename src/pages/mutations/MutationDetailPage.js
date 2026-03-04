import React from 'react';
import Loading from '../../components/base/Loading';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';
import MutationDetail from '../../components/mutations/MutationDetail';

const MutationDetailPage = () => {
    const { user } = useAuth();
    if (!user) return <Loading loading={true} />;
    return <Layout><MutationDetail /></Layout>;
};

export default MutationDetailPage;