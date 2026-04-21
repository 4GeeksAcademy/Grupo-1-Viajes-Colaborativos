import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css"; 

export const Footer = () => {
    return (
        <footer className="expedition-footer">
            <div className="footer-content">
                
                {/* 1. SECCIÓN DE MARCA */}
                <div className="footer-brand">
                    <h3><i className="fa-solid fa-earth-americas"></i> Expedition</h3>
                    <p>Tu compañero ideal para planificar, organizar y disfrutar de las mejores aventuras con tus amigos.</p>
                </div>
                
                {/* 2. ENLACES RÁPIDOS */}
                <div className="footer-links">
                    <h4>Enlaces Rápidos</h4>
                    <ul>
                        <li><Link to="/"><i className="fa-solid fa-angle-right"></i> Inicio</Link></li>
                        <li><Link to="/my-trips"><i className="fa-solid fa-angle-right"></i> Mis Viajes</Link></li>
                        {/* Puedes añadir más rutas aquí si las tienes, como /profile */}
                    </ul>
                </div>

                {/* 3. REDES SOCIALES */}
                <div className="footer-social">
                    <h4>Síguenos</h4>
                    <div className="social-icons">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-instagram"></i></a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-x-twitter"></i></a>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-github"></i></a>
                    </div>
                </div>

            </div>
            
            {/* 4. COPYRIGHT */}
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Grupo 1 - Viajes Colaborativos. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};