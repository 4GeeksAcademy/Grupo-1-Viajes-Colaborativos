import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import "../styles/AuthPage.css";

export const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);

    // --- 1. ESTADOS PARA EL FORMULARIO ---
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    // --- ESTADOS PARA RECUPERAR CONTRASEÑA ---
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [isRecovering, setIsRecovering] = useState(false);

    useEffect(() => {
        if (location.state?.tab === "register") {
            setIsLogin(false);
        } else if (location.state?.tab === "login") {
            setIsLogin(true);
        }
        setErrorMsg("");
    }, [location]);

    // --- 2. FUNCIÓN DE ENVÍO MANUAL ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        const endpoint = isLogin ? "/api/login" : "/api/sign-up";
        const bodyData = { email: email.trim().toLowerCase(), password: password };

        if (!isLogin) {
            bodyData.name = name.trim();
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("user", JSON.stringify(data.user));
                navigate("/my-trips");
            } else {
                setErrorMsg(data.message || "Ocurrió un error inesperado");
            }
        } catch (error) {
            console.error("Error de red:", error);
            setErrorMsg("No se pudo conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    // --- 🚀 FUNCIÓN LOGIN CON GOOGLE ---
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/google-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: credentialResponse.credential })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("user", JSON.stringify(data.user));
                navigate("/my-trips");
            } else {
                setErrorMsg(data.message || "Error al iniciar sesión con Google");
            }
        } catch (error) {
            setErrorMsg("No se pudo conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    // --- 🔑 FUNCIÓN PARA RECUPERAR CONTRASEÑA ---
    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        if (!recoveryEmail.trim()) return;

        setIsRecovering(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: recoveryEmail.trim().toLowerCase() })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ ${data.message}`);
                setShowForgotModal(false);
                setRecoveryEmail("");
            } else {
                alert(`⚠️ Error: ${data.message || data.msg || "Ocurrió un error al procesar tu solicitud."}`);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("⚠️ No se pudo conectar con el servidor.");
        } finally {
            setIsRecovering(false);
        }
    };

    return (
        // 🚀 ENVOLVEMOS LA PÁGINA EN EL PROVEEDOR DE GOOGLE
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <div className="auth-wrapper">
                <div className="auth-card">
                    <div className="auth-tabs">
                        <button type="button" className={`tab-btn ${isLogin ? "active" : ""}`} onClick={() => { setIsLogin(true); setErrorMsg(""); }}>
                            Inicia sesión
                        </button>
                        <button type="button" className={`tab-btn ${!isLogin ? "active" : ""}`} onClick={() => { setIsLogin(false); setErrorMsg(""); }}>
                            Regístrate
                        </button>
                    </div>

                    <div className="auth-body">
                        <h2>{isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}</h2>
                        <p className="auth-subtitle">
                            {isLogin ? "Gestiona tus aventuras compartidas con facilidad." : "Únete a Expedition y empieza a planificar con tus amigos."}
                        </p>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            {errorMsg && (
                                <div className="auth-error-badge" style={{ backgroundColor: "#fdecea", color: "#e74c3c", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "15px", textAlign: "center", border: "1px solid #f5c6cb" }}>
                                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "8px" }}></i>
                                    {errorMsg}
                                </div>
                            )}

                            {!isLogin && (
                                <div className="input-group">
                                    <label>NOMBRE COMPLETO</label>
                                    <div className="input-with-icon">
                                        <i className="fa-regular fa-user"></i>
                                        <input type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} />
                                    </div>
                                </div>
                            )}

                            <div className="input-group">
                                <label>CORREO ELECTRÓNICO</label>
                                <div className="input-with-icon">
                                    <i className="fa-regular fa-envelope"></i>
                                    <input type="email" placeholder="ejemplo@travel.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>CONTRASEÑA</label>
                                <div className="input-with-icon">
                                    <i className="fa-solid fa-lock"></i>
                                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                            </div>

                            {isLogin && (
                                <div className="forgot-password">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}>
                                        ¿Has olvidado tu contraseña?
                                    </a>
                                </div>
                            )}

                            <button type="submit" className="btn-submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                                {loading ? "Cargando..." : (isLogin ? "Entrar" : "Registrarse")}
                            </button>
                        </form>

                        <div className="auth-divider">
                            <span>O CONTINÚA CON</span>
                        </div>

                        <div className="social-login" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                            {/* 🚀 EL BOTÓN REAL DE GOOGLE */}
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setErrorMsg("El inicio de sesión con Google falló")}
                                text={isLogin ? "signin_with" : "signup_with"}
                                theme="outline"
                                size="large"
                            />
                        </div>
                    </div>
                </div>

                <div className="auth-footer-text">
                    {isLogin ? "¿Aún no tienes cuenta? " : "¿Ya tienes una cuenta? "}
                    <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Únete a la comunidad" : "Inicia sesión"}
                    </span>
                </div>

                {/* MODAL DE RECUPERACIÓN DE CONTRASEÑA */}
                {showForgotModal && (
                    <div className="modal-overlay" onClick={() => setShowForgotModal(false)} style={{ zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center', position: 'relative' }}>
                            <h3 style={{ color: 'var(--brand-navy, #1E3A5F)', marginBottom: '10px' }}>Recuperar Contraseña</h3>
                            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.5' }}>
                                Introduce tu correo y te enviaremos instrucciones.
                            </p>
                            
                            <form onSubmit={handleForgotPasswordSubmit}>
                                <div className="input-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--brand-navy, #1E3A5F)', display: 'block', marginBottom: '5px' }}>CORREO ELECTRÓNICO</label>
                                    <input type="email" placeholder="ejemplo@travel.com" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    <button type="button" onClick={() => setShowForgotModal(false)} disabled={isRecovering} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#e2e8f0', color: '#334155', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>Cancelar</button>
                                    <button type="submit" disabled={isRecovering} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--brand-teal, #2EC4B6)', color: 'white', cursor: isRecovering ? 'not-allowed' : 'pointer', fontWeight: 'bold', flex: 1, opacity: isRecovering ? 0.7 : 1 }}>
                                        {isRecovering ? "Enviando..." : "Enviar"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </GoogleOAuthProvider>
    );
};