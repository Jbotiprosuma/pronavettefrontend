import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ user }) => {
    return (
        <div className="app-menu navbar-menu">
            <div className="navbar-brand-box">
                <NavLink to="/dashboard" className="logo logo-dark">
                    <span className="logo-sm">
                        <img src="/logo.png" alt="logo" height="50" />
                    </span>
                    <span className="logo-lg">
                        <img src="/logo.png" alt="logo" height="50" />
                    </span>
                </NavLink>
                <NavLink to="/dashboard" className="logo logo-light">
                    <span className="logo-sm">
                        <img src="/logo.png" alt="logo" height="50" />
                    </span>
                    <span className="logo-lg">
                        <img src="/logo.png" alt="logo" height="50" />
                    </span>
                </NavLink>
                <button type="button" className="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover">
                    <i className="ri-record-circle-line"></i>
                </button>
            </div>

            <div id="scrollbar">
                <div className="container-fluid">
                    <ul className="navbar-nav" id="navbar-nav">
                        <li className="menu-title"><span>Menu</span></li>
                        <li className="nav-item">
                            <NavLink to="/dashboard" className="nav-link menu-link" >
                                <i className="ri-dashboard-2-line"></i>
                                <span>Dashboards</span>
                            </NavLink>
                        </li>
                        {user && user.role && (user.role === "manager" || user.role === "representant") && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/navette/service" className="nav-link menu-link" >
                                        <i className="ri-bubble-chart-fill"></i>
                                        <span>Navette</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/mutations" className="nav-link menu-link" >
                                        <i className="ri-clockwise-2-fill"></i>
                                        <span>Mutations</span>
                                    </NavLink>
                                </li>
                            </>
                        )}
                        {user && user.role && (user.role === "paie") && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/navettes" className="nav-link menu-link" >
                                        <i className="ri-table-alt-fill"></i>
                                        <span>Mes navettes</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/navette/lancer" className="nav-link menu-link" >
                                        <i className="ri-rocket-line"></i>
                                        <span>Lancer une campagne</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/statistiques" className="nav-link menu-link" >
                                        <i className="ri-bar-chart-2-line"></i>
                                        <span>Statistiques</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/employes" className="nav-link menu-link" >
                                        <i className=" ri-server-line"></i>
                                        <span>Mes employés</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/historique-employes" className="nav-link menu-link" >
                                        <i className="ri-file-list-3-line"></i>
                                        <span>Historique employés</span>
                                    </NavLink>
                                </li>
                            </>
                        )}
                        {user && user.role && (user.role === "importer") && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/employes" className="nav-link menu-link" >
                                        <i className=" ri-server-line"></i>
                                        <span>Mes employés</span>
                                    </NavLink>
                                </li>
                            </>
                        )}
                        {user && user.role && user.role === "admin" && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/navettes" className="nav-link menu-link" >
                                        <i className=" ri-table-alt-fill"></i>
                                        <span>Mes Navettes</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/navette/lancer" className="nav-link menu-link" >
                                        <i className="ri-rocket-line"></i>
                                        <span>Lancer une campagne</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/navettes/historique" className="nav-link menu-link" >
                                        <i className="ri-history-line"></i>
                                        <span>Historique</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/navette/service" className="nav-link menu-link" >
                                        <i className="ri-bubble-chart-fill"></i>
                                        <span>Navette</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/mutations" className="nav-link menu-link" >
                                        <i className="ri-clockwise-2-fill"></i>
                                        <span>Mutations</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/statistiques" className="nav-link menu-link" >
                                        <i className="ri-bar-chart-2-line"></i>
                                        <span>Statistiques</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/services" className="nav-link menu-link" >
                                        <i className="ri-database-line"></i>
                                        <span>Mes services</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/employes" className="nav-link menu-link" >
                                        <i className=" ri-server-line"></i>
                                        <span>Mes employés</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/historique-employes" className="nav-link menu-link" >
                                        <i className="ri-file-list-3-line"></i>
                                        <span>Historique employés</span>
                                    </NavLink>
                                </li>
                                <li className="menu-title text-uppercase"><span>Profil & utilisateurs</span></li>
                                <li className="nav-item">
                                    <NavLink to="/utilisateurs" className="nav-link menu-link" >
                                        <i className="ri-team-fill"></i>
                                        <span>Mes utilisateurs</span>
                                    </NavLink>
                                </li>
                            </>
                        )}
                        {user && user.role && user.role === "superadmin" && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/navettes" className="nav-link menu-link" >
                                        <i className=" ri-table-alt-fill"></i>
                                        <span>Mes Navettes</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/navette/lancer" className="nav-link menu-link" >
                                        <i className="ri-rocket-line"></i>
                                        <span>Lancer une campagne</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/navettes/historique" className="nav-link menu-link" >
                                        <i className="ri-history-line"></i>
                                        <span>Historique</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/navette/service" className="nav-link menu-link" >
                                        <i className="ri-bubble-chart-fill"></i>
                                        <span>Navette</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/services" className="nav-link menu-link" >
                                        <i className="ri-database-line"></i>
                                        <span>Mes services</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/mutations" className="nav-link menu-link" >
                                        <i className="ri-clockwise-2-fill"></i>
                                        <span>Mes mutations</span>

                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/employes" className="nav-link menu-link" >
                                        <i className=" ri-server-line"></i>
                                        <span>Mes employés</span>

                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/statistiques" className="nav-link menu-link" >
                                        <i className="ri-bar-chart-2-line"></i>
                                        <span>Statistiques</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/historique-employes" className="nav-link menu-link" >
                                        <i className="ri-file-list-3-line"></i>
                                        <span>Historique employés</span>
                                    </NavLink>
                                </li>
                                <li className="menu-title text-uppercase"><span>Profil & utilisateurs</span></li>
                                <li className="nav-item">
                                    <NavLink to="/roles" className="nav-link menu-link" >
                                        <i className=" ri-git-repository-private-fill"></i>
                                        <span>Roles & permissions</span>
                                    </NavLink>
                                </li>

                                <li className="nav-item">
                                    <NavLink to="/utilisateurs" className="nav-link menu-link" >
                                        <i className="ri-team-fill"></i>
                                        <span>Mes utilisateurs</span>
                                    </NavLink>
                                </li>
                            </>
                        )}
                        <li className="nav-item">
                            <NavLink to="/profil" className="nav-link menu-link" >
                                <i className="ri-user-3-line"></i>
                                <span>Modifier mon profil</span>
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </div>
        </div >
    );
};

export default Sidebar;
