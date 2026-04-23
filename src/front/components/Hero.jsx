import React from "react";
import { useNavigate } from "react-router-dom";
import { Stats } from "./Stats";

export const Hero = () => {
    const navigate = useNavigate();

    // 🖱️ Función para bajar suavemente a la sección "Cómo funciona"
    const scrollToHowItWorks = () => {
        const section = document.getElementById('how-it-works');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="hero-section">
            <div className="hero-content">
                <h1>Viaja en grupo <br/><span className="text-highlight">sin complicaciones</span></h1>
                
                <p>
                    Organiza destinos, gastos y decisiones con tus amigos en un solo lugar.
                </p>
                
                <div className="hero-buttons">
                    <button className="btn-start" onClick={() => navigate("/login", { state: { tab: "register" } })}>
                        Comienza GRATIS
                    </button>
                    
                    {/* 🛠️ Botón actualizado: Ahora hace scroll en lugar de navegar */}
                    <button className="btn-demo" onClick={scrollToHowItWorks}>
                        Explorar cómo funciona
                    </button>
                </div>
            </div>
            
            <Stats />
        </section>
    );
};