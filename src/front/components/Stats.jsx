import React from "react";

export const Stats = () => {
    return (
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
    );
};