import React from "react";

export const Stats = () => {
    return (
        <div className="stats-wrapper">
            <section className="stats-container">
                <div className="stat-item">
                    <span className="stat-number">1M+</span>
                    <span className="stat-label">Viajeros</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">500K</span>
                    <span className="stat-label">Destinos</span>
                </div>
            </section>
            {/* El texto extra que aparece abajo en tu diseño */}
            <p className="hero-bottom-text">
                <i>Expande tus horizontes, nosotros hacemos el resto</i>
            </p>
        </div>
    );
};