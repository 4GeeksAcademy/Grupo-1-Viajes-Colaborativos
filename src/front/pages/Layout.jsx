import React from "react";
import { Outlet } from "react-router-dom"; // Outlet es donde se cargan las páginas como LandingPage o Home
import { Navbar } from "../components/Navbar"; // Verifica que la "N" coincida con tu archivo
import { Footer } from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";

export const Layout = () => {
    return (
        <div className="app-container" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            
            {/* Aquí es donde React Router inyecta el contenido de tus vistas */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <Outlet /> 
            </div>
            
            <Footer /> {/* 👈 Y aquí ponemos el Footer para que siempre esté abajo */}
        </div>
    );
};