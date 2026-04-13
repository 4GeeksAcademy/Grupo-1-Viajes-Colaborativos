import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // 1. Añadimos useNavigate
import "../styles/Navbar.css";

export const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate(); // 2. Lo inicializamos

    return (
        <nav className="navbar-expedition">
            <div className="nav-container">
                <div className="nav-left">
                    <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                        <i className="fa-solid fa-bars-staggered"></i>
                    </button>
                    <Link to="/" className="nav-logo">
                        Expedition
                    </Link>
                </div>

                <div className="nav-right">
                    {/* 3. Le ponemos un onClick al ícono circular de perfil para que te lleve al login y añadimos cursor: pointer en css o style */}
                    <div 
                        className="profile-icon" 
                        onClick={() => navigate("/login")}
                        style={{ cursor: "pointer" }} 
                    >
                        <i className="fa-solid fa-user"></i>
                    </div>
                </div>
            </div>

            {/* Menú desplegable */}
            {menuOpen && (
                <div className="dropdown-menu-mobile">
                    {/* Asegúrate de que las rutas sean correctas aquí también */}
                    <Link to="/home" onClick={() => setMenuOpen(false)}>Mis Viajes</Link>
                    <Link to="/login" onClick={() => setMenuOpen(false)}>Iniciar Sesión</Link>
                </div>
            )}
        </nav>
    );
};