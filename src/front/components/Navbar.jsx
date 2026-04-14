import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

// 1. IMPORTAMOS TU LOGO AQUÍ
// IMPORTANTE: Cambia "tu-logo.png" por el nombre exacto de tu archivo y asegúrate de que esté en esa carpeta.
import logoExpedition from "../assets/img/EXPEDITION-LOGO.png";

export const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // MAGIA: Detectamos si el usuario está en la Landing Page (Inicio público)
    const isLandingPage = location.pathname === "/";
    // MAGIA NUEVA: Detectamos si está en el Login
    const isLoginPage = location.pathname === "/login"; 

    // Aquí agregamos la clase dinámica en el nav para que cambie a modo login
    return (
        <nav className={`navbar-expedition ${isLoginPage ? "navbar-login-mode" : ""}`}>
            <div className="nav-container">
                {/* 1. IZQUIERDA: Menú Móvil y Logo */}
                <div className="nav-left">
                    <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                        <i className="fa-solid fa-bars-staggered"></i>
                    </button>
                    
                    {/* 2. REEMPLAZAMOS EL TEXTO POR LA ETIQUETA <img> */}
                    <Link to="/" className="nav-logo">
                        <img src={logoExpedition} alt="Expedition Logo" className="logo-img" />
                    </Link>
                </div>

                {/* 2. CENTRO: Solo se muestra si NO estamos en la Landing Page */}
                {!isLandingPage && (
                    <div className="nav-center desktop-only">
                        <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>
                            Inicio
                        </Link>
                        <Link to="/my-trips" className={`nav-link ${location.pathname === "/my-trips" ? "active" : ""}`}>
                            Mis viajes
                        </Link>
                        <Link to="/profile" className={`nav-link ${location.pathname === "/profile" ? "active" : ""}`}>
                            Perfil
                        </Link>
                    </div>
                )}

                {/* 3. DERECHA: Cerrar sesión (condicional) y Perfil */}
                <div className="nav-right">
                    {!isLandingPage && (
                        <div className="logout-text desktop-only" onClick={() => navigate("/login")}>
                            Cerrar sesión
                        </div>
                    )}
                    
                    <div 
                        className="profile-icon" 
                        onClick={() => navigate("/login", { state: { tab: "login", key: Date.now() } })}
                        style={{ cursor: "pointer" }}
                    >
                        <i className="fa-solid fa-user"></i>
                    </div>
                </div>
            </div>

            {/* Menú desplegable Móvil */}
            {menuOpen && (
                <div className="dropdown-menu-mobile">
                    {!isLandingPage && <Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link>}
                    
                    <Link to="/my-trips" onClick={() => setMenuOpen(false)}>Mis viajes</Link>
                    
                    {!isLandingPage && <Link to="/profile" onClick={() => setMenuOpen(false)}>Perfil</Link>}
                    
                    <hr style={{ border: "0.5px solid #f1f5f9", margin: "5px 0" }} />
                    
                    {/* El botón cambia dependiendo de dónde estés */}
                    <Link to="/login" onClick={() => setMenuOpen(false)}>
                        {isLandingPage ? "Iniciar sesión" : "Cerrar sesión"}
                    </Link>
                </div>
            )}
        </nav>
    );
};