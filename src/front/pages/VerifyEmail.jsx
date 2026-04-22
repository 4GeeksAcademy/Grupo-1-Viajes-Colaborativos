import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

export const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [message, setMessage] = useState("Verificando tu cuenta...");

    useEffect(() => {
        const token = searchParams.get("token");
        
        if (!token) {
            setStatus("error");
            setMessage("Enlace no válido. Faltan credenciales de verificación.");
            return;
        }

        const verifyAccount = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/verify-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: token })
                });

                const data = await response.json();

                if (response.ok) {
                    setStatus("success");
                    setMessage(data.message);
                } else {
                    setStatus("error");
                    setMessage(data.message || "Error al verificar la cuenta.");
                }
            } catch (error) {
                setStatus("error");
                setMessage("Error de conexión con el servidor.");
            }
        };

        verifyAccount();
    }, [searchParams]);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center", padding: "20px" }}>
            
            {status === "loading" && (
                <>
                    <div className="spinner" style={{ marginBottom: "20px" }}></div>
                    <h2>{message}</h2>
                </>
            )}

            {status === "success" && (
                <>
                    <i className="fa-solid fa-circle-check" style={{ fontSize: "5rem", color: "#2ecc71", marginBottom: "20px" }}></i>
                    <h2 style={{ color: "#1e293b", marginBottom: "10px" }}>¡Cuenta Verificada!</h2>
                    <p style={{ color: "#64748b", marginBottom: "30px" }}>{message}</p>
                    <Link to="/login" style={{ background: "var(--brand-teal, #2EC4B6)", color: "white", padding: "12px 25px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
                        Ir a Iniciar Sesión
                    </Link>
                </>
            )}

            {status === "error" && (
                <>
                    <i className="fa-solid fa-circle-xmark" style={{ fontSize: "5rem", color: "#e74c3c", marginBottom: "20px" }}></i>
                    <h2 style={{ color: "#1e293b", marginBottom: "10px" }}>Error de Verificación</h2>
                    <p style={{ color: "#64748b", marginBottom: "30px" }}>{message}</p>
                    <Link to="/" style={{ background: "#e2e8f0", color: "#334155", padding: "12px 25px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
                        Volver al inicio
                    </Link>
                </>
            )}
        </div>
    );
};