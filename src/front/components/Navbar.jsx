import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";
import logoExpedition from "../assets/img/EXPEDITION-LOGO.png";

export const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    
    // 🔔 NUEVO: Estado para el menú de notificaciones
    const [showNotifications, setShowNotifications] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();

    const isLoginPage = location.pathname === "/login"; 
    const isAuthenticated = !!localStorage.getItem("token");

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setMenuOpen(false);
        navigate("/login");
    };

    return (
        <nav className={`navbar-expedition ${isLoginPage ? "navbar-login-mode" : ""}`}>
            <div className="nav-container">
                {/* 1. IZQUIERDA */}
                <div className="nav-left">
                    <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                        <i className="fa-solid fa-bars-staggered"></i>
                    </button>
                    
                    <Link to="/" className="nav-logo">
                        <img src={logoExpedition} alt="Expedition Logo" className="logo-img" />
                    </Link>
                </div>

                {/* 2. CENTRO */}
                <div className="nav-center desktop-only">
                    <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>Inicio</Link>
                    
                    {isAuthenticated && (
                        <>
                            <Link to="/my-trips" className={`nav-link ${location.pathname === "/my-trips" ? "active" : ""}`}>Mis viajes</Link>
                            <Link to="/profile" className={`nav-link ${location.pathname === "/profile" ? "active" : ""}`}>Perfil</Link>
                        </>
                    )}
                </div>

                {/* 3. DERECHA (Estilos movidos a CSS para poder adaptarlos en móvil) */}
                <div className="nav-right">
                    {isAuthenticated ? (
                        <>
                            {/* 🔔 BOTÓN DE NOTIFICACIONES */}
                            <div style={{ position: 'relative' }}>
                                <div 
                                    className="notification-icon" 
                                    onClick={() => setShowNotifications(!showNotifications)}
                                >
                                    <i className="fa-regular fa-bell"></i>
                                    {/* Puntito rojo de aviso */}
                                    <span className="notification-dot"></span>
                                </div>

                                {/* DESPLEGABLE DE NOTIFICACIONES */}
                                {showNotifications && (
                                    <div className="notifications-dropdown">
                                        <h4>Notificaciones</h4>
                                        <div className="notifications-empty">
                                            <i className="fa-solid fa-check-circle"></i>
                                            Todo al día. No tienes notificaciones nuevas.
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="logout-text desktop-only" onClick={handleLogout}>
                                Cerrar sesión
                            </div>
                            
                            <div className="profile-icon" onClick={() => navigate("/profile")}>
                                <i className="fa-solid fa-user"></i>
                            </div>
                        </>
                    ) : (
                        !isLoginPage && (
                            <div className="logout-text desktop-only" onClick={() => navigate("/login")}>
                                Iniciar sesión
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Menú desplegable Móvil */}
            {menuOpen && (
                <div className="dropdown-menu-mobile">
                    <Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
                    {isAuthenticated && (
                        <>
                            <Link to="/my-trips" onClick={() => setMenuOpen(false)}>Mis viajes</Link>
                            <Link to="/profile" onClick={() => setMenuOpen(false)}>Perfil</Link>
                        </>
                    )}
                    <hr style={{ border: "0.5px solid #f1f5f9", margin: "5px 0" }} />
                    {isAuthenticated ? (
                        <div className="mobile-logout-btn" onClick={handleLogout}>
                            Cerrar sesión
                        </div>
                    ) : (
                        <Link to="/login" onClick={() => setMenuOpen(false)} className="mobile-login-btn">
                            Iniciar sesión
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
};