import React from 'react';
import Loading from '../../components/base/Loading';
import Layout from '../../components/base/Layout';
import { useAuth } from '../../context/AuthContext';
import MutationEdit from '../../components/mutations/MutationEdit';

const MutationEditPage = () => {
    const { user } = useAuth();
    if (!user) return <Loading loading={true} />;
    return <Layout><MutationEdit /></Layout>;
};

export default MutationEditPage;