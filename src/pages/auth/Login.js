import React, { useState } from 'react';
import { useNavigate, NavLink, Navigate } from 'react-router-dom';
import Loading from '../../components/base/Loading';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const [username, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, login, loading: authLoading } = useAuth();

    // Si déjà connecté, rediriger vers le dashboard
    if (authLoading) {
        return <Loading loading={true} />;
    }
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await login(username, password);
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.message || 'Identifiants incorrects');
            }
        } catch (error) {
            setError('Erreur ! Assurez-vous d\'entrer les bonnes informations');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper auth-bg-cover py-5 d-flex justify-content-center align-items-center min-vh-100">
            <Loading loading={loading} />
            <div className="auth-page-content overflow-hidden pt-lg-5 " >
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card overflow-hidden">

                                <div className="row g-0">

                                    <div className="col-lg-6">
                                        <div className="bg-overlay"  ></div>
                                        <div className="p-lg-5 pt-4 auth-one-bg h-100 d-flex align-items-center justify-content-center">
                                            <div className="mt-4">
                                                <NavLink to="/" className="nav-link menu-link" >
                                                    <img src="logo.png" alt="Logo" height="150" />
                                                </NavLink>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-6">
                                        <div className="p-lg-5 p-4">
                                            <div>
                                                <h5 className="text-primary">NOUS SOMMES HEUREUX DE VOUS VOIR</h5>
                                                <p className="text-muted">Veuillez utiliser vos accès <b>PROSUMA</b> pour vous connecter</p>
                                            </div>

                                            {error && <p className="text-danger"> <b>{error}</b> </p>}

                                            <form onSubmit={handleSubmit}>
                                                <div className="mb-3">
                                                    <label htmlFor="email" className="form-label">Identifiant</label>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        id="email"
                                                        placeholder="Taper un email de prosuma"
                                                        value={username}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                    />
                                                </div>

                                                <div className="mb-3">

                                                    <label className="form-label" htmlFor="password-input">Mot de passe</label>
                                                    <div className="position-relative auth-pass-inputgroup mb-3">
                                                        <input
                                                            type={passwordVisible ? "text" : "password"}
                                                            className="form-control pe-5"
                                                            placeholder="Taper le mot de passe de votre compte"
                                                            id="password-input"
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                                            onClick={() => setPasswordVisible(!passwordVisible)}
                                                        >
                                                            <i className={passwordVisible ? "ri-eye-off-fill align-middle" : "ri-eye-fill align-middle"}></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-4 mb-5">
                                                    <button className="btn btn-primary w-100" type="submit">Connexion</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="footer">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12 text-center">
                            <p className="mb-0">&copy; {new Date().getFullYear()} © PRONAVETTE   <i className="mdi mdi-heart text-danger"></i>  TOUT DROIT RESERVE</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Login;
