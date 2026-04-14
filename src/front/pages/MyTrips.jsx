import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MyTrips.css";

export const MyTrips = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState("Todos");

    const trips = [
        {
            id: 1,
            title: "Lisboa Editorial",
            date: "12 - 15 Septiembre",
            status: "En curso",
            image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=800&q=80",
            featured: true, 
        },
        {
            id: 2,
            title: "Costa Italiana",
            date: "01 - 12 Octubre",
            status: "Planificando",
            image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=500&q=80",
            featured: false,
        },
        {
            id: 3,
            title: "London Weekend",
            date: "24 - 26 Noviembre",
            status: "Planificando",
            image: "https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?auto=format&fit=crop&w=500&q=80",
            featured: false,
        },
        {
            id: 4,
            title: "Escapada a París",
            date: "Julio 2023",
            status: "Pasados",
            image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=500&q=80",
            featured: false,
        }
    ];

    const suggestions = [
        { title: "Misterios de la India", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=400&q=80" },
        { title: "Islas Griegas", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=400&q=80" },
        { title: "Tokio Moderno", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400&q=80" },
        { title: "Dubai Futurista", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=400&q=80" }
    ];

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-container">
                
                <div className="dashboard-header">
                    <div className="header-text">
                        <h1>Mis Viajes</h1>
                        <p>Gestiona tus próximas aventuras y recuerdos pasados.</p>
                    </div>
                    <button className="btn-new-trip" onClick={() => navigate("/new-trip")}>
                        <i className="fa-solid fa-plus"></i> Crear nuevo viaje
                    </button>
                </div>

                <div className="trip-filters">
                    {["Todos", "En curso", "Planificando", "Pasados"].map(filter => (
                        <button 
                            key={filter} 
                            type="button"
                            className={`btn-filter ${activeFilter === filter ? "active" : ""}`}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <div className="trips-grid">
                    {trips.map((trip) => (
                        <div key={trip.id} className={`trip-card ${trip.featured ? "featured-card" : ""}`}>
                            <div className="trip-img-container">
                                <img src={trip.image} alt={trip.title} />
                                <span className={`status-badge ${trip.status.replace(/\s+/g, '-').toLowerCase()}`}>
                                    {trip.status}
                                </span>
                            </div>
                            <div className="trip-info">
                                <h3>{trip.title}</h3>
                                <p><i className="fa-regular fa-calendar"></i> {trip.date}</p>
                                
                                {trip.status === "En curso" && (
                                    <div className="trip-progress">
                                        <div className="progress-bar"><div className="progress-fill"></div></div>
                                        <span className="link-details" onClick={() => navigate(`/trip/${trip.id}`)}>
                                            Ver detalles <i className="fa-solid fa-chevron-right"></i>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="trip-card explore-card">
                        <div className="explore-content">
                            <div className="compass-icon">
                                <i className="fa-regular fa-compass"></i>
                            </div>
                            <h3>¿Sin ideas?</h3>
                            <p>Explora destinos seleccionados por nuestra comunidad de viajeros.</p>
                            <button className="btn-explore-link">Explorar destinos</button>
                        </div>
                    </div>
                </div>

                <div className="suggestions-section">
                    <div className="suggestions-header">
                        <h2>Sugerencias para ti</h2>
                        <span className="link-view-all">Ver todas</span>
                    </div>
                    <div className="suggestions-grid">
                        {suggestions.map((sug, index) => (
                            <div key={index} className="suggestion-card">
                                <img src={sug.image} alt={sug.title} />
                                <div className="suggestion-overlay">
                                    <h4>{sug.title}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};