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

                {/* 3. DERECHA */}
                <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {isAuthenticated ? (
                        <>
                            {/* 🔔 BOTÓN DE NOTIFICACIONES */}
                            <div style={{ position: 'relative' }}>
                                <div 
                                    className="notification-icon" 
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    style={{ cursor: "pointer", fontSize: "1.2rem", color: "var(--brand-navy)", position: "relative" }}
                                >
                                    <i className="fa-regular fa-bell"></i>
                                    {/* Puntito rojo de aviso */}
                                    <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "8px", height: "8px", backgroundColor: "#e74c3c", borderRadius: "50%" }}></span>
                                </div>

                                {/* DESPLEGABLE DE NOTIFICACIONES */}
                                {showNotifications && (
                                    <div style={{ position: "absolute", top: "40px", right: "-10px", width: "250px", background: "white", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 1000, padding: "10px" }}>
                                        <h4 style={{ margin: "5px 10px 10px", color: "var(--brand-navy)", fontSize: "0.9rem" }}>Notificaciones</h4>
                                        <div style={{ padding: "15px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                                            <i className="fa-solid fa-check-circle" style={{ color: "var(--brand-teal)", fontSize: "1.5rem", marginBottom: "10px", display: "block" }}></i>
                                            Todo al día. No tienes notificaciones nuevas.
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="logout-text desktop-only" onClick={handleLogout} style={{ cursor: "pointer" }}>
                                Cerrar sesión
                            </div>
                            <div className="profile-icon" onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
                                <i className="fa-solid fa-user"></i>
                            </div>
                        </>
                    ) : (
                        !isLoginPage && (
                            <div className="logout-text desktop-only" onClick={() => navigate("/login")} style={{ cursor: "pointer", fontWeight: "600", color: "var(--brand-navy)" }}>
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
                        <div style={{ padding: "10px 20px", color: "#e74c3c", cursor: "pointer", fontWeight: "bold" }} onClick={handleLogout}>
                            Cerrar sesión
                        </div>
                    ) : (
                        <Link to="/login" onClick={() => setMenuOpen(false)} style={{ color: "var(--brand-navy)", fontWeight: "bold" }}>
                            Iniciar sesión
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
};