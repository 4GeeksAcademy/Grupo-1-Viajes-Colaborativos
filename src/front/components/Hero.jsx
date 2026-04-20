import React from "react";
import { useNavigate } from "react-router-dom";
import { Stats } from "./Stats";

export const Hero = () => {
    const navigate = useNavigate();

    return (
        <section className="hero-section">
            <div className="hero-content">
                <h1>Viaja en grupo <br/><span className="text-highlight">sin complicaciones</span></h1>
                
                {/* Texto actualizado al diseño */}
                <p>
                    Organiza destinos, gastos y decisiones con tus amigos en un solo lugar.
                </p>
                
                <div className="hero-buttons">
                    {/* Botones actualizados */}
                    <button className="btn-start" onClick={() => navigate("/login", { state: { tab: "register" } })}>
                        Comienza GRATIS
                    </button>
                    <button className="btn-demo" onClick={() => navigate("/demo")}>
                        Explorar cómo funciona
                    </button>
                </div>
            </div>
            
            <Stats />
        </section>
    );
};