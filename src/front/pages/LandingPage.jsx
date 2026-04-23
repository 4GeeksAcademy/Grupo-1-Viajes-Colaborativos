import React from "react";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import "../styles/LandingPage.css"; 

export const LandingPage = () => {
    return (
        <div className="landing-container">
            <Hero />
            
            {/* 🗺️ SECCIÓN: CÓMO FUNCIONA */}
            <section id="how-it-works" className="how-it-works-section" style={{ padding: "80px 20px", backgroundColor: "#ffffff" }}>
                <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
                    <h2 style={{ color: "#1E3A5F", fontSize: "2.5rem", marginBottom: "50px" }}>Tu viaje perfecto en 4 pasos</h2>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "30px" }}>
                        
                        {/* Paso 1 */}
                        <div className="step-card">
                            <div style={{ fontSize: "4rem", color: "#2EC4B6", marginBottom: "20px" }}>
                                <i className="fa-solid fa-map-location-dot"></i>
                            </div>
                            <h4 style={{ color: "#1E3A5F", fontSize: "1.25rem", marginBottom: "10px" }}>1. Crea tu aventura</h4>
                            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Ponle nombre a tu expedición y elige el destino de tus sueños.</p>
                        </div>

                        {/* Paso 2 */}
                        <div className="step-card">
                            <div style={{ fontSize: "4rem", color: "#2EC4B6", marginBottom: "20px" }}>
                                <i className="fa-solid fa-user-plus"></i>
                            </div>
                            <h4 style={{ color: "#1E3A5F", fontSize: "1.25rem", marginBottom: "10px" }}>2. Invita a tu equipo</h4>
                            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Comparte el acceso con tus amigos para que todos participen.</p>
                        </div>

                        {/* Paso 3 - ¡ICONO AÑADIDO AQUÍ! */}
                        <div className="step-card">
                            <div style={{ fontSize: "4rem", color: "#2EC4B6", marginBottom: "20px" }}>
                                <i className="fa-solid fa-clipboard-list"></i>
                            </div>
                            <h4 style={{ color: "#1E3A5F", fontSize: "1.25rem", marginBottom: "10px" }}>3. Organizad juntos</h4>
                            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Dividid gastos, subid documentos y armad el itinerario real.</p>
                        </div>

                        {/* Paso 4 */}
                        <div className="step-card">
                            <div style={{ fontSize: "4rem", color: "#2EC4B6", marginBottom: "20px" }}>
                                <i className="fa-solid fa-umbrella-beach"></i>
                            </div>
                            <h4 style={{ color: "#1E3A5F", fontSize: "1.25rem", marginBottom: "10px" }}>4. ¡A disfrutar!</h4>
                            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Todo bajo control en un solo lugar. ¡Buen viaje, explorador!</p>
                        </div>

                    </div>
                </div>
            </section>

            <Features />

            <section className="cta-footer">
                <h3>¿Listo para tu próxima expedición?</h3>
                <button className="btn-final" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>Crear mi viaje ahora</button>
            </section>
        </div>
    );
};