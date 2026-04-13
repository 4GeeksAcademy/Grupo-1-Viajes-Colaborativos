import React from "react";
import { useNavigate } from "react-router-dom"; // 1. Importamos el hook de navegación

export const Hero = () => {
    const navigate = useNavigate(); // 2. Lo inicializamos

    return (
        <section className="hero-section">
            <div className="hero-content">
                <h1>Expande tus horizontes con EXPEDITION</h1>
                <p>
                    Planifica viajes sin complicaciones. Gestiona gastos, itinerarios y más.
                </p>
                <div className="hero-buttons">
                    {/* 3. Le añadimos el evento onClick a los botones */}
                    <button className="btn-start" onClick={() => navigate("/login")}>
                        Empieza gratis
                    </button>
                    <button className="btn-demo" onClick={() => navigate("/demo")}>
                        Ver demo
                    </button>
                </div>
            </div>
        </section>
    );
};
