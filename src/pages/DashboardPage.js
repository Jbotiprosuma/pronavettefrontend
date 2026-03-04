import React, { useState, useEffect } from 'react';
import api from '../axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/base/Layout';
import Loading from '../components/base/Loading';
import DashboardStats from '../components/base/DashboardStats';

const DashboardPage = () => {
    const { user } = useAuth();
    const [navData, setNavData] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [nav, dash] = await Promise.all([
                    api.get('navettes/all'),
                    api.get('stats/dashboard').catch(() => ({ data: null })),
                ]);
                setNavData(nav.data.data);
                setKpis(dash.data);
            } catch (e) {
                console.error('Erreur dashboard:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <Loading loading={true} />;

    return (
        <Layout>
            <DashboardStats user={user} navData={navData} kpis={kpis} />
        </Layout>
    );
};

export default DashboardPage;
