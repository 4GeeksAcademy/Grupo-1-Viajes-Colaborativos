import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";
import logoExpedition from "../assets/img/EXPEDITION-LOGO.png";

export const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    
    // 🔔 ESTADOS PARA NOTIFICACIONES
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();

    const isLoginPage = location.pathname === "/login"; 
    const isAuthenticated = !!localStorage.getItem("token");

    // 🔔 FUNCIÓN PARA OBTENER NOTIFICACIONES DEL BACKEND
    const fetchNotifications = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                // Comprobar si hay alguna no leída para encender el punto rojo
                const unread = data.some(n => !n.is_read);
                setHasUnread(unread);
            }
        } catch (error) {
            console.error("Error al cargar notificaciones:", error);
        }
    };

    // 🔔 FUNCIÓN PARA MARCAR COMO LEÍDAS
    const markAsRead = async () => {
        if (!hasUnread) return; // Si ya están leídas, no hace nada

        const token = localStorage.getItem("token");
        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications/read`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            setHasUnread(false);
            fetchNotifications(); // Recargar para actualizar visualmente
        } catch (error) {
            console.error("Error al marcar como leídas:", error);
        }
    };

    // 🔄 Efecto para cargar notificaciones cuando el usuario inicia sesión o navega
    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        }
    }, [isAuthenticated, location.pathname]);


    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setMenuOpen(false);
        navigate("/login");
    };

    // Al abrir el menú de notificaciones, las marcamos como leídas
    const toggleNotifications = () => {
        const isOpening = !showNotifications;
        setShowNotifications(isOpening);
        if (isOpening) {
            markAsRead();
        }
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
                <div className="nav-right">
                    {isAuthenticated ? (
                        <>
                            {/* 🔔 BOTÓN DE NOTIFICACIONES */}
                            <div style={{ position: 'relative' }}>
                                <div 
                                    className="notification-icon" 
                                    onClick={toggleNotifications}
                                >
                                    <i className="fa-regular fa-bell"></i>
                                    {/* El punto rojo ahora solo sale si hay notificaciones sin leer */}
                                    {hasUnread && <span className="notification-dot"></span>}
                                </div>

                                {/* DESPLEGABLE DE NOTIFICACIONES */}
                                {showNotifications && (
                                    <div className="notifications-dropdown" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <h4 style={{ margin: "5px 10px 10px", color: "var(--brand-navy)", fontSize: "0.9rem" }}>Notificaciones</h4>
                                        
                                        {notifications.length === 0 ? (
                                            <div className="notifications-empty" style={{ padding: "15px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                                                <i className="fa-solid fa-check-circle" style={{ color: "var(--brand-teal)", fontSize: "1.5rem", marginBottom: "10px", display: "block" }}></i>
                                                Todo al día. No tienes notificaciones nuevas.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                {notifications.map((noti) => (
                                                    <div key={noti.id} style={{ 
                                                        padding: "10px", 
                                                        borderBottom: "1px solid #f1f5f9",
                                                        backgroundColor: noti.is_read ? "transparent" : "#f0fdfa"
                                                    }}>
                                                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--brand-navy)" }}>
                                                            {noti.message}
                                                        </p>
                                                        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                                                            {new Date(noti.date_time).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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