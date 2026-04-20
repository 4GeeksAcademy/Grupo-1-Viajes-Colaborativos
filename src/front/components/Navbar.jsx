import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

// 1. IMPORTAMOS TU LOGO AQUÍ
import logoExpedition from "../assets/img/EXPEDITION-LOGO.png";

export const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Detectamos si está en el Login
    const isLoginPage = location.pathname === "/login"; 

    // 🧠 MAGIA NUEVA: Verificamos si el usuario tiene un token guardado.
    // Si hay token = Está logueado. Si no hay = Es un visitante.
    const isAuthenticated = !!localStorage.getItem("token");

    // Función para cerrar sesión correctamente
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setMenuOpen(false);
        navigate("/login");
    };

    return (
        <nav className={`navbar-expedition ${isLoginPage ? "navbar-login-mode" : ""}`}>
            <div className="nav-container">
                {/* 1. IZQUIERDA: Menú Móvil y Logo */}
                <div className="nav-left">
                    <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                        <i className="fa-solid fa-bars-staggered"></i>
                    </button>
                    
                    <Link to="/" className="nav-logo">
                        <img src={logoExpedition} alt="Expedition Logo" className="logo-img" />
                    </Link>
                </div>

                {/* 2. CENTRO: Menú de navegación */}
                <div className="nav-center desktop-only">
                    <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>
                        Inicio
                    </Link>
                    
                    {/* 🔒 RUTAS PROTEGIDAS: Solo se muestran si el usuario está logueado */}
                    {isAuthenticated && (
                        <>
                            <Link to="/my-trips" className={`nav-link ${location.pathname === "/my-trips" ? "active" : ""}`}>
                                Mis viajes
                            </Link>
                            <Link to="/profile" className={`nav-link ${location.pathname === "/profile" ? "active" : ""}`}>
                                Perfil
                            </Link>
                        </>
                    )}
                </div>

                {/* 3. DERECHA: Autenticación y Avatar */}
                <div className="nav-right">
                    {isAuthenticated ? (
                        // ✅ SI ESTÁ LOGUEADO: Mostramos Cerrar Sesión y el Avatar
                        <>
                            <div className="logout-text desktop-only" onClick={handleLogout} style={{ cursor: "pointer" }}>
                                Cerrar sesión
                            </div>
                            <div 
                                className="profile-icon" 
                                onClick={() => navigate("/profile")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="fa-solid fa-user"></i>
                            </div>
                        </>
                    ) : (
                        // ❌ SI NO ESTÁ LOGUEADO: Escondemos el Avatar y mostramos "Iniciar sesión"
                        // (Pero lo ocultamos si ya estamos en la propia pantalla de login)
                        !isLoginPage && (
                            <div 
                                className="logout-text desktop-only" 
                                onClick={() => navigate("/login")}
                                style={{ cursor: "pointer", fontWeight: "600", color: "var(--brand-navy)" }}
                            >
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
                    
                    {/* 🔒 RUTAS PROTEGIDAS EN MÓVIL */}
                    {isAuthenticated && (
                        <>
                            <Link to="/my-trips" onClick={() => setMenuOpen(false)}>Mis viajes</Link>
                            <Link to="/profile" onClick={() => setMenuOpen(false)}>Perfil</Link>
                        </>
                    )}
                    
                    <hr style={{ border: "0.5px solid #f1f5f9", margin: "5px 0" }} />
                    
                    {/* Botón de sesión dinámico en el móvil */}
                    {isAuthenticated ? (
                        <div 
                            style={{ padding: "10px 20px", color: "#e74c3c", cursor: "pointer", fontWeight: "bold" }} 
                            onClick={handleLogout}
                        >
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