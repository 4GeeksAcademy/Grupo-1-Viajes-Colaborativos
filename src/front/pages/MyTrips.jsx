import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MyTrips.css";

export const MyTrips = () => {
    // 1. HERRAMIENTAS DE REACT
    const navigate = useNavigate(); 
    const [activeFilter, setActiveFilter] = useState("Todos"); 
    
    // Estados para la Base de Datos Real
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    // 2. CONEXIÓN AL BACKEND
    useEffect(() => {
        const fetchMyTrips = async () => {
            const token = localStorage.getItem("token");
            
            // Si no hay llave, a iniciar sesión
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trips`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setTrips(data.viajes || []);
                } else if (response.status === 401) {
                    navigate("/login");
                }
            } catch (error) {
                console.error("Error al cargar los viajes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyTrips();
    }, [navigate]);

    // 3. TRADUCTOR DE ESTADOS
    const translateStatus = (status) => {
        if (!status) return "Planificando";
        const s = status.toUpperCase();
        if (s === "FINISHED") return "Pasados";
        if (s === "ONGOING") return "En curso";
        if (s === "PLANNING") return "Planificando";
        return status;
    };

    // 4. DATOS DE SUGERENCIAS (Estáticos por ahora)
    const suggestions = [
        { title: "Misterios de la India", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=400&q=80" },
        { title: "Islas Griegas", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=400&q=80" },
        { title: "Tokio Moderno", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400&q=80" },
        { title: "Dubai Futurista", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=400&q=80" }
    ];

    // 5. LA MAGIA DEL FILTRADO
    const filteredTrips = activeFilter === "Todos" 
        ? trips 
        : trips.filter(trip => translateStatus(trip.state) === activeFilter);

    // 6. PANTALLA DE CARGA
    if (loading) {
        return (
            <div className="dashboard-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <h2>Cargando tus aventuras... 🌍</h2>
            </div>
        );
    }

    // 7. RENDERIZADO VISUAL
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
                    {filteredTrips.length === 0 ? (
                        <div style={{ padding: "20px", color: "#64748b" }}>
                            No tienes viajes en esta categoría.
                        </div>
                    ) : (
                        filteredTrips.map((trip) => {
                            const statusEsp = translateStatus(trip.state);
                            
                            // 📸 LÓGICA DE LA IMAGEN: 
                            // 1. Usa la image_url de la DB si existe y no es nula.
                            // 2. Si no hay imagen, busca una aleatoria en Unsplash basada en el destino.
                            const tripImage = trip.image_url && trip.image_url.trim() !== "" 
                                ? trip.image_url 
                                : `https://source.unsplash.com/500x300/?${encodeURIComponent(trip.destination || 'travel')}`;

                            return (
                                <div key={trip.id} className="trip-card">
                                    <div className="trip-img-container">
                                        <img 
                                            src={tripImage} 
                                            alt={trip.title} 
                                            // 📸 Seguridad extra: si la URL de la DB está rota, muestra paisaje por defecto
                                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=500&q=80" }}
                                        />
                                        <span className={`status-badge ${statusEsp.replace(/\s+/g, '-').toLowerCase()}`}>
                                            {statusEsp}
                                        </span>
                                    </div>

                                    <div className="trip-info">
                                        <h3>{trip.title}</h3>
                                        <p><i className="fa-regular fa-calendar"></i> {trip.starting_date} al {trip.ending_date}</p>
                                        
                                        <div className="trip-progress" style={statusEsp !== "En curso" ? { justifyContent: "flex-end" } : {}}>
                                            {statusEsp === "En curso" && (
                                                <div className="progress-bar"><div className="progress-fill"></div></div>
                                            )}
                                            
                                            <span className="link-details" onClick={() => navigate(`/trip-details/${trip.id}`)}>
                                                Ver detalles <i className="fa-solid fa-chevron-right"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    <div className="trip-card explore-card">
                        <div className="explore-content">
                            <div className="compass-icon">
                                <i className="fa-regular fa-compass"></i>
                            </div>
                            <h3>¿Sin ideas?</h3>
                            <p>Explora destinos seleccionados por nuestra comunidad.</p>
                            {/* AÑADIDA LA NAVEGACIÓN AQUÍ 👇 */}
                            <button className="btn-explore-link" onClick={() => navigate("/explore")}>Explorar destinos</button>
                        </div>
                    </div>
                </div>

                <div className="suggestions-section">
                    <div className="suggestions-header">
                        <h2>Sugerencias para ti</h2>
                        {/* AÑADIDA LA NAVEGACIÓN AQUÍ 👇 */}
                        <span className="link-view-all" onClick={() => navigate("/explore")} style={{ cursor: "pointer" }}>Ver todas</span>
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