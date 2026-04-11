import React from "react";
import { Outlet } from "react-router-dom"; // Outlet es donde se cargan las páginas como LandingPage o Home
import { Navbar } from "../components/Navbar"; // Verifica que la "N" coincida con tu archivo
import { Footer } from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";

export const Layout = () => {
    return (
        <div>
            <ScrollToTop>
                {/* El Navbar ahora aparecerá en todas tus rutas automáticamente */}
                <Navbar />
                
                {/* Aquí es donde React Router inyecta la LandingPage o el Home */}
                <Outlet />
                
                <Footer />
            </ScrollToTop>
        </div>
    );
};