import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

export const Profile = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    const [user, setUser] = useState({
        firstName: "",
        lastName: "",
        email: ""
    });

    const [notifications, setNotifications] = useState({
        itinerary: true,
        expenses: true,
        offers: false
    });

    // === ESTADOS PARA LOS MODALES ===
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });
    const [isDeleting, setIsDeleting] = useState(false);

    // 1. OBTENER DATOS DEL USUARIO AL ENTRAR
    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser({
                        firstName: data.user.name || "",
                        lastName: data.user.last_name || "",
                        email: data.user.email || ""
                    });
                } else {
                    if (response.status === 401) navigate("/login");
                }
            } catch (error) {
                console.error("Error al cargar perfil:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, [navigate]);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleToggle = (setting) => {
        setNotifications({ ...notifications, [setting]: !notifications[setting] });
    };

    // 2. GUARDAR LOS CAMBIOS DE PERFIL
    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(user)
            });

            if (response.ok) {
                alert("¡Cambios guardados correctamente!");
                const userData = JSON.parse(localStorage.getItem("user") || "{}");
                userData.name = user.firstName;
                localStorage.setItem("user", JSON.stringify(userData));
            } else {
                alert("Hubo un error al guardar los cambios.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión con el servidor.");
        }
    };

    // 3. CAMBIAR CONTRASEÑA
    const submitPasswordChange = async (e) => {
        e.preventDefault();
        
        if (passwordData.new !== passwordData.confirm) {
            alert("Las contraseñas nuevas no coinciden.");
            return;
        }

        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/update-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    current: passwordData.current,
                    new: passwordData.new
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert("¡Contraseña actualizada con éxito!");
                setShowPasswordModal(false);
                setPasswordData({ current: "", new: "", confirm: "" }); 
            } else {
                alert(data.message || "Error al actualizar la contraseña.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión con el servidor.");
        }
    };

    // 4. ELIMINAR CUENTA REAL EN LA BASE DE DATOS
    const confirmDeleteAccount = async () => {
        setIsDeleting(true);
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/delete-account`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert("Tu cuenta ha sido eliminada. Lamentamos verte partir.");
                setShowDeleteModal(false);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login"); 
            } else {
                alert("Error al intentar eliminar la cuenta.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión con el servidor.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return <div style={{ textAlign: "center", marginTop: "100px" }}>Cargando perfil...</div>;
    }

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
                                {user.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}
                                {user.lastName ? user.lastName.charAt(0).toUpperCase() : ""}
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
                                <input type="text" name="lastName" value={user.lastName} onChange={handleChange} />
                            </div>
                            <div className="input-group full-width">
                                <label>Correo Electrónico</label>
                                <input type="email" name="email" value={user.email} onChange={handleChange} required />
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

            {/* MODAL: CAMBIAR CONTRASEÑA */}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Cambiar Contraseña</h3>
                        <p>Introduce tu contraseña actual y la nueva que deseas utilizar.</p>
                        <form onSubmit={submitPasswordChange}>
                            <div className="input-group">
                                <label>Contraseña Actual</label>
                                <input type="password" name="current" value={passwordData.current} onChange={handlePasswordChange} required />
                            </div>
                            <div className="input-group">
                                <label>Nueva Contraseña</label>
                                <input type="password" name="new" value={passwordData.new} onChange={handlePasswordChange} required minLength="6" />
                            </div>
                            <div className="input-group">
                                <label>Confirmar Nueva Contraseña</label>
                                <input type="password" name="confirm" value={passwordData.confirm} onChange={handlePasswordChange} required minLength="6" />
                            </div>
                            <div className="modal-actions-itinerary">
                                <button type="button" className="btn-modal-cancel" onClick={() => setShowPasswordModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-modal-confirm">Actualizar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ELIMINAR CUENTA */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content danger-modal" onClick={(e) => e.stopPropagation()} style={{textAlign: "center"}}>
                        <div className="danger-icon" style={{fontSize: "3rem", color: "#e74c3c", marginBottom: "15px"}}>
                            <i className="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <h3>¿Eliminar cuenta definitivamente?</h3>
                        <p style={{marginTop: "10px", marginBottom: "20px"}}>Esta acción <strong>no se puede deshacer</strong>. Todos tus viajes, gastos e información personal serán eliminados de nuestros servidores para siempre.</p>
                        <div className="modal-actions-itinerary" style={{justifyContent: "center", gap: "15px"}}>
                            <button type="button" className="btn-modal-cancel" disabled={isDeleting} onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                            <button type="button" className="btn-modal-danger" disabled={isDeleting} style={{background: "#e74c3c", color: "white", padding: "10px 15px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold"}} onClick={confirmDeleteAccount}>
                                {isDeleting ? "Eliminando..." : "Sí, eliminar mi cuenta"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};