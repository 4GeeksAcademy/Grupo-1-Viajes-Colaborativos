import React from "react";

export const Features = () => {
    return (
        <section className="features-section">
            <h2>Todo lo que necesitas</h2>
            <div className="feature-card">
                <div className="icon">💰</div>
                <h3>Gestión de Gastos</h3>
                <p>Divide cuentas y liquida deudas fácilmente (Model: Expense/Debt).</p>
            </div>
            <div className="feature-card">
                <div className="icon">📍</div>
                <h3>Itinerarios Vivos</h3>
                <p>Planifica cada parada con tu grupo en tiempo real (Model: Itinerary).</p>
            </div>
            <div className="feature-card">
                <div className="icon">💬</div>
                <h3>Chat Grupal</h3>
                <p>Toda la comunicación en un solo lugar (Model: Chat/Message).</p>
            </div>
        </section>
    );
};