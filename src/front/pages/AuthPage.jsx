import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // <-- Importamos useLocation
import "../styles/AuthPage.css";

export const AuthPage = () => {
    const location = useLocation();
    const [isLogin, setIsLogin] = useState(true);

    // Este efecto vigila de dónde viene el usuario para abrir la pestaña correcta
    useEffect(() => {
        if (location.state?.tab === "register") {
            setIsLogin(false);
        } else if (location.state?.tab === "login") {
            setIsLogin(true);
        }
    }, [location]); // Se ejecuta cada vez que cambia la navegación

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                {/* PESTAÑAS (TABS) */}
                <div className="auth-tabs">
                    <button 
                        type="button" /* <--- AÑADE ESTO AQUÍ */
                        className={`tab-btn ${isLogin ? "active" : ""}`} 
                        onClick={() => setIsLogin(true)}
                    >
                        Inicia sesión
                    </button>
                    <button 
                        type="button" /* <--- AÑADE ESTO AQUÍ */
                        className={`tab-btn ${!isLogin ? "active" : ""}`} 
                        onClick={() => setIsLogin(false)}
                    >
                        Regístrate
                    </button>
</div>

                {/* CONTENIDO DEL FORMULARIO */}
                <div className="auth-body">
                    <h2>{isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}</h2>
                    <p className="auth-subtitle">
                        {isLogin 
                            ? "Gestiona tus aventuras compartidas con facilidad." 
                            : "Únete a Expedition y empieza a planificar con tus amigos."}
                    </p>

                    <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                        {/* Campo Nombre (Solo aparece si es Registro) */}
                        {!isLogin && (
                            <div className="input-group">
                                <label>NOMBRE COMPLETO</label>
                                <div className="input-with-icon">
                                    <i className="fa-regular fa-user"></i>
                                    <input type="text" placeholder="Tu nombre" />
                                </div>
                            </div>
                        )}

                        <div className="input-group">
                            <label>CORREO ELECTRÓNICO</label>
                            <div className="input-with-icon">
                                <i className="fa-regular fa-envelope"></i>
                                <input type="email" placeholder="ejemplo@travel.com" />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>CONTRASEÑA</label>
                            <div className="input-with-icon">
                                <i className="fa-solid fa-lock"></i>
                                <input type="password" placeholder="••••••••" />
                            </div>
                        </div>

                        {isLogin && (
                            <div className="forgot-password">
                                <a href="#">¿Has olvidado tu contraseña?</a>
                            </div>
                        )}

                        <button type="submit" className="btn-submit">
                            {isLogin ? "Entrar" : "Registrarse"}
                        </button>
                    </form>

                    {/* REDES SOCIALES */}
                    <div className="auth-divider">
                        <span>O CONTINÚA CON</span>
                    </div>

                    <div className="social-login">
                        <button className="btn-social">
                            <i className="fa-brands fa-google" style={{color: "#DB4437"}}></i> Google
                        </button>
                        <button className="btn-social">
                            <i className="fa-brands fa-facebook" style={{color: "#4267B2"}}></i> Facebook
                        </button>
                    </div>
                </div>
            </div>

            {/* FOOTER DEL COMPONENTE */}
            <div className="auth-footer-text">
                {isLogin ? "¿Aún no tienes cuenta? " : "¿Ya tienes una cuenta? "}
                <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Únete a la comunidad" : "Inicia sesión"}
                </span>
            </div>
        </div>
    );
};