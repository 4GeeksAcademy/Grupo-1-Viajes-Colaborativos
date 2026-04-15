import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/TripDetails.css";

export const TripDetails = () => {
    const { id } = useParams(); // Esto captura el número del viaje de la URL
    const navigate = useNavigate();

    // Pestañas internas
    const [activeTab, setActiveTab] = useState("itinerario");

    // Simulamos que buscamos los datos de este viaje específico en la base de datos
    const trip = {
        id: id,
        title: "Lisboa Editorial",
        dates: "12 - 15 Septiembre",
        status: "En curso",
        image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80",
        budget: { total: 800, spent: 345 },
        companions: ["Ana", "Carlos"],
        itinerary: [
            { day: 1, date: "12 Sept", title: "Llegada y Check-in", desc: "Vuelo de mañana. Tarde libre por Alfama." },
            { day: 2, date: "13 Sept", title: "Ruta de los Miradores", desc: "Tour fotográfico y cena con Fado." },
            { day: 3, date: "14 Sept", title: "Excursión a Sintra", desc: "Tren temprano para ver el Palacio da Pena." }
        ]
    };

    return (
        <div className="trip-details-wrapper">
            
            {/* CABECERA GIGANTE CON LA FOTO */}
            <div className="trip-hero" style={{ backgroundImage: `linear-gradient(rgba(30, 58, 95, 0.7), rgba(30, 58, 95, 0.4)), url(${trip.image})` }}>
                <div className="hero-content">
                    <button className="btn-back-light" onClick={() => navigate("/my-trips")}>
                        <i className="fa-solid fa-arrow-left"></i> Volver
                    </button>
                    <span className="hero-badge">{trip.status}</span>
                    <h1>{trip.title}</h1>
                    <p><i className="fa-regular fa-calendar"></i> {trip.dates}</p>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL DIVIDIDO */}
            <div className="trip-content-container">
                
                {/* Columna Izquierda (Principal) */}
                <div className="main-column">
                    <div className="content-tabs">
                        <button className={activeTab === "itinerario" ? "active" : ""} onClick={() => setActiveTab("itinerario")}>Itinerario</button>
                        <button className={activeTab === "gastos" ? "active" : ""} onClick={() => setActiveTab("gastos")}>Gastos</button>
                        <button className={activeTab === "documentos" ? "active" : ""} onClick={() => setActiveTab("documentos")}>Documentos</button>
                    </div>

                    {activeTab === "itinerario" && (
                        <div className="itinerary-section">
                            <h2>Plan de Viaje</h2>
                            <div className="timeline">
                                {trip.itinerary.map((item, index) => (
                                    <div key={index} className="timeline-item">
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <span className="day-badge">Día {item.day} - {item.date}</span>
                                            <h3>{item.title}</h3>
                                            <p>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="btn-add-day"><i className="fa-solid fa-plus"></i> Añadir actividad</button>
                        </div>
                    )}

                    {activeTab === "gastos" && (
                        <div className="empty-state">
                            <i className="fa-solid fa-wallet"></i>
                            <h3>Aún no hay gastos registrados</h3>
                            <p>Añade tus primeros tickets para llevar el control.</p>
                            <button className="btn-action">Añadir Gasto</button>
                        </div>
                    )}

                    {activeTab === "documentos" && (
                        <div className="empty-state">
                            <i className="fa-solid fa-file-pdf"></i>
                            <h3>Carpeta vacía</h3>
                            <p>Sube tus billetes de avión y reservas de hotel aquí.</p>
                        </div>
                    )}
                </div>

                {/* Columna Derecha (Widgets de resumen) */}
                <div className="side-column">
                    <div className="summary-card budget-card">
                        <h3><i className="fa-solid fa-chart-pie"></i> Presupuesto</h3>
                        <div className="budget-numbers">
                            <div>
                                <span>Gastado</span>
                                <h4>{trip.budget.spent}€</h4>
                            </div>
                            <div>
                                <span>Total</span>
                                <h4>{trip.budget.total}€</h4>
                            </div>
                        </div>
                        <div className="progress-bar-bg">
                            {/* Calculamos el % de la barra matemáticamente */}
                            <div className="progress-bar-fill" style={{ width: `${(trip.budget.spent / trip.budget.total) * 100}%` }}></div>
                        </div>
                    </div>

                    <div className="summary-card friends-card">
                        <h3><i className="fa-solid fa-users"></i> Viajeros</h3>
                        <ul className="friends-list">
                            <li><div className="avatar">Yo</div> Tú (Organizador)</li>
                            {trip.companions.map((friend, i) => (
                                <li key={i}><div className="avatar friend-avatar">{friend.charAt(0)}</div> {friend}</li>
                            ))}
                        </ul>
                        <button className="btn-invite"><i className="fa-solid fa-user-plus"></i> Invitar amigo</button>
                    </div>
                </div>

            </div>
        </div>
    );
};