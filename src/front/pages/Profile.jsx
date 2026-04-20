import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

export const Profile = () => {
    const navigate = useNavigate();

    const [user, setUser] = useState({
        firstName: "Alex",
        lastName: "Thompson",
        email: "alex.thompson@traveler.com",
        phone: "+34 600 000 000",
        location: "Madrid, España",
        bio: "Amante de la fotografía, las montañas y descubrir nuevas culturas."
    });

    const [notifications, setNotifications] = useState({
        itinerary: true,
        expenses: true,
        offers: false
    });

    // === NUEVOS ESTADOS PARA LOS MODALES ===
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleToggle = (setting) => {
        setNotifications({ ...notifications, [setting]: !notifications[setting] });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("¡Cambios guardados correctamente!");
    };

    // Funciones para manejar los modales
    const submitPasswordChange = (e) => {
        e.preventDefault();
        if(passwordData.new !== passwordData.confirm) {
            alert("Las contraseñas nuevas no coinciden.");
            return;
        }
        alert("¡Contraseña actualizada con éxito!");
        setShowPasswordModal(false);
        setPasswordData({ current: "", new: "", confirm: "" }); // Limpiar formulario
    };

    const confirmDeleteAccount = () => {
        alert("Tu cuenta ha sido eliminada. Lamentamos verte partir.");
        setShowDeleteModal(false);
        navigate("/"); // Lo mandamos de vuelta al inicio
    };

    return (
        <div className="profile-wrapper">
            <div className="profile-container">
                
                <button className="btn-back-profile" onClick={() => navigate("/my-trips")}>
                    <i className="fa-solid fa-arrow-left"></i> Volver a Mis Viajes
                </button>

                <div className="profile-card">
                    {/* CABECERA */}
                    <div className="profile-header">
                        <div className="profile-avatar-container">
                            <div className="profile-avatar">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </div>
                            <button className="btn-edit-avatar" title="Cambiar foto">
                                <i className="fa-solid fa-pencil"></i>
                            </button>
                        </div>
                        <div className="profile-title">
                            <h2>{user.firstName} {user.lastName}</h2>
                            <p><i className="fa-solid fa-award"></i> Explorador • Premium</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="profile-form">
                        {/* 1. INFORMACIÓN PERSONAL */}
                        <div className="form-section-title">
                            <h3>Información Personal</h3>
                            <hr />
                        </div>
                        <div className="profile-grid">
                            <div className="input-group">
                                <label>Nombre</label>
                                <input type="text" name="firstName" value={user.firstName} onChange={handleChange} required />
                            </div>
                            <div className="input-group">
                                <label>Apellidos</label>
                                <input type="text" name="lastName" value={user.lastName} onChange={handleChange} required />
                            </div>
                            <div className="input-group">
                                <label>Correo Electrónico</label>
                                <input type="email" name="email" value={user.email} onChange={handleChange} required />
                            </div>
                            <div className="input-group">
                                <label>Teléfono</label>
                                <input type="tel" name="phone" value={user.phone} onChange={handleChange} />
                            </div>
                            <div className="input-group full-width">
                                <label>Ubicación</label>
                                <input type="text" name="location" value={user.location} onChange={handleChange} />
                            </div>
                        </div>

                        {/* 2. CONFIGURADOR DE NOTIFICACIONES */}
                        <div className="form-section-title section-margin-top">
                            <h3><i className="fa-regular fa-bell"></i> Configuración de notificaciones</h3>
                            <hr />
                        </div>
                        <div className="notification-list">
                            <div className="notification-item">
                                <div className="noti-text">
                                    <h4>Actualizaciones de itinerario</h4>
                                    <p>Avisos sobre cambios en actividades y horarios.</p>
                                </div>
                                <label className="custom-switch">
                                    <input type="checkbox" checked={notifications.itinerary} onChange={() => handleToggle('itinerary')} />
                                    <span className="switch-slider"></span>
                                </label>
                            </div>
                            <div className="notification-item">
                                <div className="noti-text">
                                    <h4>Gastos compartidos</h4>
                                    <p>Alertas sobre nuevas facturas o pagos pendientes.</p>
                                </div>
                                <label className="custom-switch">
                                    <input type="checkbox" checked={notifications.expenses} onChange={() => handleToggle('expenses')} />
                                    <span className="switch-slider"></span>
                                </label>
                            </div>
                        </div>

                        {/* 3. SEGURIDAD */}
                        <div className="form-section-title section-margin-top">
                            <h3><i className="fa-solid fa-shield-halved"></i> Seguridad de la cuenta</h3>
                            <hr />
                        </div>
                        <div className="account-actions-row">
                            {/* Al hacer clic, activamos los modales */}
                            <button type="button" className="btn-change-password" onClick={() => setShowPasswordModal(true)}>
                                Cambiar Contraseña
                            </button>
                            <button type="button" className="btn-delete-account" onClick={() => setShowDeleteModal(true)}>
                                Eliminar Cuenta
                            </button>
                        </div>

                        <div className="profile-actions-main">
                            <button type="submit" className="btn-save">
                                <i className="fa-regular fa-floppy-disk"></i> Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* =========================================
                MODAL: CAMBIAR CONTRASEÑA
                ========================================= */}
            {showPasswordModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Cambiar Contraseña</h3>
                        <p>Introduce tu contraseña actual y la nueva que deseas utilizar.</p>
                        <form onSubmit={submitPasswordChange}>
                            <div className="input-group">
                                <label>Contraseña Actual</label>
                                <input type="password" name="current" value={passwordData.current} onChange={handlePasswordChange} required />
                            </div>
                            <div className="input-group">
                                <label>Nueva Contraseña</label>
                                <input type="password" name="new" value={passwordData.new} onChange={handlePasswordChange} required />
                            </div>
                            <div className="input-group">
                                <label>Confirmar Nueva Contraseña</label>
                                <input type="password" name="confirm" value={passwordData.confirm} onChange={handlePasswordChange} required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-modal-cancel" onClick={() => setShowPasswordModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-modal-confirm">Actualizar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================
                MODAL: ELIMINAR CUENTA
                ========================================= */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content danger-modal">
                        <div className="danger-icon">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <h3>¿Eliminar cuenta definitivamente?</h3>
                        <p>Esta acción <strong>no se puede deshacer</strong>. Todos tus viajes, gastos, e información personal serán eliminados de nuestros servidores para siempre.</p>
                        <div className="modal-actions">
                            <button type="button" className="btn-modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                            <button type="button" className="btn-modal-danger" onClick={confirmDeleteAccount}>Sí, eliminar mi cuenta</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};