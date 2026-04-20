import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

    // Sincronizar la pestaña con la navegación
    useEffect(() => {
        if (location.state?.tab === "register") {
            setIsLogin(false);
        } else if (location.state?.tab === "login") {
            setIsLogin(true);
        }
        // Limpiar errores al cambiar de pestaña
        setErrorMsg("");
    }, [location]);

    // --- 2. FUNCIÓN DE ENVÍO (HANDLESUBMIT) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        // Definimos la ruta dependiendo de si es login o registro
        const endpoint = isLogin ? "/api/login" : "/api/sign-up";

        // Preparamos el cuerpo de la petición
        const bodyData = {
            email: email.trim().toLowerCase(),
            password: password
        };

        // Si es registro, añadimos el nombre
        if (!isLogin) {
            bodyData.name = name.trim();
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(bodyData)
            });

            const data = await response.json();

            if (response.ok) {
                // Guardamos el token en localStorage
                localStorage.setItem("token", data.access_token);
                // Opcional: guardar datos del usuario
                localStorage.setItem("user", JSON.stringify(data.user));

                // Redirigimos al panel principal de viajes del usuario
                navigate("/my-trips");
            } else {
                // Manejo de errores del backend
                setErrorMsg(data.message || "Ocurrió un error inesperado");
            }
        } catch (error) {
            console.error("Error de red:", error);
            setErrorMsg("No se pudo conectar con el servidor. Verifica tu conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-tabs">
                    <button
                        type="button"
                        className={`tab-btn ${isLogin ? "active" : ""}`}
                        onClick={() => { setIsLogin(true); setErrorMsg(""); }}
                    >
                        Inicia sesión
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${!isLogin ? "active" : ""}`}
                        onClick={() => { setIsLogin(false); setErrorMsg(""); }}
                    >
                        Regístrate
                    </button>
                </div>

                <div className="auth-body">
                    <h2>{isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}</h2>
                    <p className="auth-subtitle">
                        {isLogin
                            ? "Gestiona tus aventuras compartidas con facilidad."
                            : "Únete a Expedition y empieza a planificar con tus amigos."}
                    </p>

                    <form className="auth-form" onSubmit={handleSubmit}>

                        {/* Mensaje de Error dinámico */}
                        {errorMsg && (
                            <div className="auth-error-badge" style={{
                                backgroundColor: "#fdecea",
                                color: "#e74c3c",
                                padding: "10px",
                                borderRadius: "8px",
                                fontSize: "0.85rem",
                                marginBottom: "15px",
                                textAlign: "center",
                                border: "1px solid #f5c6cb"
                            }}>
                                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "8px" }}></i>
                                {errorMsg}
                            </div>
                        )}

                        {/* Campo Nombre (Solo en Registro) */}
                        {!isLogin && (
                            <div className="input-group">
                                <label>NOMBRE COMPLETO</label>
                                <div className="input-with-icon">
                                    <i className="fa-regular fa-user"></i>
                                    <input
                                        type="text"
                                        placeholder="Tu nombre"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Campo Email */}
                        <div className="input-group">
                            <label>CORREO ELECTRÓNICO</label>
                            <div className="input-with-icon">
                                <i className="fa-regular fa-envelope"></i>
                                <input
                                    type="email"
                                    placeholder="ejemplo@travel.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Campo Password */}
                        <div className="input-group">
                            <label>CONTRASEÑA</label>
                            <div className="input-with-icon">
                                <i className="fa-solid fa-lock"></i>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {isLogin && (
                            <div className="forgot-password">
                                <a href="#">¿Has olvidado tu contraseña?</a>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                        >
                            {loading ? "Cargando..." : (isLogin ? "Entrar" : "Registrarse")}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>O CONTINÚA CON</span>
                    </div>

                    <div className="social-login">
                        <button className="btn-social" type="button">
                            <i className="fa-brands fa-google" style={{ color: "#DB4437" }}></i> Google
                        </button>
                        <button className="btn-social" type="button">
                            <i className="fa-brands fa-facebook" style={{ color: "#4267B2" }}></i> Facebook
                        </button>
                    </div>
                </div>
            </div>

            <div className="auth-footer-text">
                {isLogin ? "¿Aún no tienes cuenta? " : "¿Ya tienes una cuenta? "}
                <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Únete a la comunidad" : "Inicia sesión"}
                </span>
            </div>
        </div>
    );
};