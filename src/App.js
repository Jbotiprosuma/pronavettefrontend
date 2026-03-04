import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

import Login from './pages/auth/Login';
import Dashboard from './pages/DashboardPage';
import ProfilePage from './pages/profil/ProfilePage';
import ServicePage from './pages/services/ServiceManagementPage';
import RoleManagementPage from './pages/roles/RoleManagementPage';
import UserPage from './pages/users/UserPage';
import NewUserPage from './pages/users/NewUserPage';
import EditUserPage from './pages/users/EditUserPage';
import NavettePage from './pages/navettes/NavettePage';
import EmployePage from './pages/employes/EmployePage';
import NavetteDetailPage from './pages/navettes/NavetteDetailPage';
import NavettePaiePage from './pages/navettes/NavettePaiePage';
import EmployeEditPage from './pages/employes/EmployeEditPage';
import EmployeCreatePage from './pages/employes/EmployeCreatePage';
import EmployeDetailPage from './pages/employes/EmployeDetailPage';
import MutationPage from './pages/mutations/MutationPage';
import MutationCreatePage from './pages/mutations/MutationCreatePage';
import MutationDetailPage from './pages/mutations/MutationDetailPage';
import MutationEditPage from './pages/mutations/MutationEditPage';
import NavetteLaunchPage from './pages/navettes/NavetteLaunchPage';
import NavetteHistoryPage from './pages/navettes/NavetteHistoryPage';
import StatistiquesPage from './pages/stats/StatistiquesPage';
import NotificationsPage from './pages/NotificationsPage';
import EmployerHistoryPage from './pages/historique/EmployerHistoryPage';

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Route publique */}
                    <Route path="/login" element={<Login />} />

                    {/* Routes protégées - Accès général */}
                    <Route path="/dashboard" element={
                        <PrivateRoute><Dashboard /></PrivateRoute>
                    } />
                    <Route path="/profil" element={
                        <PrivateRoute><ProfilePage /></PrivateRoute>
                    } />

                    {/* Routes - Services (admin, superadmin) */}
                    <Route path="/services" element={
                        <PrivateRoute roles={['admin', 'superadmin']}><ServicePage /></PrivateRoute>
                    } />

                    {/* Routes - Rôles & Permissions (superadmin) */}
                    <Route path="/roles" element={
                        <PrivateRoute roles={['superadmin']}><RoleManagementPage /></PrivateRoute>
                    } />

                    {/* Routes - Utilisateurs (admin, superadmin) */}
                    <Route path="/utilisateurs" element={
                        <PrivateRoute roles={['admin', 'superadmin']}><UserPage /></PrivateRoute>
                    } />
                    <Route path="/utilisateur/create" element={
                        <PrivateRoute roles={['admin', 'superadmin']}><NewUserPage /></PrivateRoute>
                    } />
                    <Route path="/utilisateur/:id" element={
                        <PrivateRoute roles={['admin', 'superadmin']}><EditUserPage /></PrivateRoute>
                    } />

                    {/* Routes - Employés (admin, superadmin, importer) */}
                    <Route path="/employes" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'importer']}><EmployePage /></PrivateRoute>
                    } />
                    <Route path="/employes/create" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'importer']}><EmployeCreatePage /></PrivateRoute>
                    } />
                    <Route path="/employes/edit/:slug" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'importer']}><EmployeEditPage /></PrivateRoute>
                    } />
                    <Route path="/employes/detail/:slug" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'importer']}><EmployeDetailPage /></PrivateRoute>
                    } />

                    {/* Routes - Navettes */}
                    <Route path="/navettes" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'paie']}><NavettePage /></PrivateRoute>
                    } />
                    <Route path="/navette/service" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'manager', 'representant', 'paie']}><NavetteDetailPage /></PrivateRoute>
                    } />
                    <Route path="/navette/detail/:id" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'paie']}><NavettePaiePage /></PrivateRoute>
                    } />
                    <Route path="/navette/lancer" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'paie']}><NavetteLaunchPage /></PrivateRoute>
                    } />
                    <Route path="/navettes/historique" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'paie']}><NavetteHistoryPage /></PrivateRoute>
                    } />

                    {/* Routes - Mutations */}
                    <Route path="/mutations" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'manager', 'representant']}><MutationPage /></PrivateRoute>
                    } />
                    <Route path="/mutation/create" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'manager', 'representant']}><MutationCreatePage /></PrivateRoute>
                    } />
                    <Route path="/mutation/detail/:id" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'manager', 'representant']}><MutationDetailPage /></PrivateRoute>
                    } />
                    <Route path="/mutation/edit/:id" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'manager', 'representant']}><MutationEditPage /></PrivateRoute>
                    } />

                    {/* Routes - Statistiques */}
                    <Route path="/statistiques" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'paie']}><StatistiquesPage /></PrivateRoute>
                    } />

                    {/* Routes - Historique employés */}
                    <Route path="/historique-employes" element={
                        <PrivateRoute roles={['admin', 'superadmin', 'paie']}><EmployerHistoryPage /></PrivateRoute>
                    } />

                    {/* Routes - Notifications */}
                    <Route path="/notifications" element={
                        <PrivateRoute><NotificationsPage /></PrivateRoute>
                    } />

                    {/* Route catch-all */}
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App;
