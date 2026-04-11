import React from "react";
import "../../front/styles/LandingPage.css"; // Asegúrate de crear este archivo

export const LandingPage = () => {
    return (
        <div className="landing-container">
            {/* HERO SECTION */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Expande tus horizontes con Expedition</h1>
                    <p>
                        La plataforma colaborativa para planificar viajes con amigos 
                        sin complicaciones. Gestiona gastos, itinerarios y más.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn-start">Empieza gratis</button>
                        <button className="btn-demo">Ver demo</button>
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="stats-card">
                <div className="stat-item">
                    <span className="stat-number">1M+</span>
                    <span className="stat-label">Viajeros</span>
                </div>
                <div className="divider"></div>
                <div className="stat-item">
                    <span className="stat-number">500k</span>
                    <span className="stat-label">Destinos</span>
                </div>
                <div className="divider"></div>
                <div className="stat-item">
                    <span className="stat-number">4.8/5</span>
                    <span className="stat-label">Valoración</span>
                </div>
            </section>

            {/* FEATURES SECTION (Basado en tus modelos: Expense, Chat, Itinerary) */}
            <section className="features-section">
                <h2>Todo lo que necesitas</h2>
                <div className="feature-card">
                    <div className="icon">💰</div>
                    <h3>Gestión de Gastos</h3>
                    <p>Divide cuentas y liquida deudas fácilmente .</p>
                </div>
                <div className="feature-card">
                    <div className="icon">📍</div>
                    <h3>Itinerarios Vivos</h3>
                    <p>Planifica cada parada con tu grupo en tiempo real .</p>
                </div>
                <div className="feature-card">
                    <div className="icon">💬</div>
                    <h3>Chat Grupal</h3>
                    <p>Toda la comunicación en un solo lugar .</p>
                </div>
            </section>

            {/* CALL TO ACTION FINAL */}
            <section className="cta-footer">
                <h3>¿Listo para tu próxima expedición?</h3>
                <button className="btn-final">Crear mi viaje ahora</button>
            </section>
        </div>
    );
};