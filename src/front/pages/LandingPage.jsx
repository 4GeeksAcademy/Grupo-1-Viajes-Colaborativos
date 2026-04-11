import React from "react";
import { Hero } from "../components/Hero";
import { Stats } from "../components/Stats";
import { Features } from "../components/Features";
import "../styles/LandingPage.css"; // 

export const LandingPage = () => {
    return (
        <div className="landing-container">
            {/* Aquí llamamos a los componentes */}
            <Hero />
            <Stats />
            <Features />

            {/* CALL TO ACTION FINAL (Este es pequeñito, lo podemos dejar aquí o separarlo luego) */}
            <section className="cta-footer">
                <h3>¿Listo para tu próxima expedición?</h3>
                <button className="btn-final">Crear mi viaje ahora</button>
            </section>
        </div>
    );
};