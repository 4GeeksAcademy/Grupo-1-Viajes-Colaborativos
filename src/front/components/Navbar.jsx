import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

// 1. IMPORTAMOS TU LOGO AQUÍ
// IMPORTANTE: Cambia "tu-logo.png" por el nombre exacto de tu archivo y asegúrate de que esté en esa carpeta.
import logoExpedition from "../assets/img/EXPEDITION-LOGO.png";

export const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <nav className="navbar-expedition">
            <div className="nav-container">
                <div className="nav-left">
                    <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                        <i className="fa-solid fa-bars-staggered"></i>
                    </button>
                    
                    {/* 2. REEMPLAZAMOS EL TEXTO POR LA ETIQUETA <img> */}
                    <Link to="/" className="nav-logo">
                        <img src={logoExpedition} alt="Expedition Logo" className="logo-img" />
                    </Link>
                </div>

                <div className="nav-right">
                    <div 
                        className="profile-icon" 
                        onClick={() => navigate("/login", { state: { tab: "login", key: Date.now() } })}
                        style={{ cursor: "pointer" }}
                    >
                        <i className="fa-solid fa-user"></i>
                    </div>
                </div>
            </div>

            {/* Menú desplegable */}
            {menuOpen && (
                <div className="dropdown-menu-mobile">
                    <Link to="/home" onClick={() => setMenuOpen(false)}>Mis Viajes</Link>
                    <Link to="/login" onClick={() => setMenuOpen(false)}>Iniciar Sesión</Link>
                </div>
            )}
        </nav>
    );
};