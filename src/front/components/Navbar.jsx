import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css"; // Asegúrate de que la ruta sea correcta

export const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="navbar-expedition">
            <div className="nav-container">
                {/* Lado izquierdo: Botón hamburguesa + Logo */}
                <div className="nav-left">
                    <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                        <i className="fa-solid fa-bars-staggered"></i>
                    </button>
                    <Link to="/" className="nav-logo">
                        Expedition
                    </Link>
                </div>

                {/* Lado derecho: Círculo de perfil */}
                <div className="nav-right">
                    <div className="profile-icon">
                        <i className="fa-solid fa-user"></i>
                    </div>
                </div>
            </div>

            {/* Menú desplegable que aparece al hacer click */}
            {menuOpen && (
                <div className="dropdown-menu-mobile">
                    <Link to="/home" onClick={() => setMenuOpen(false)}>Mis Viajes</Link>
                    <Link to="/demo" onClick={() => setMenuOpen(false)}>Demo</Link>
                    <Link to="/login" onClick={() => setMenuOpen(false)}>Cerrar Sesión</Link>
                </div>
            )}
        </nav>
    );
};