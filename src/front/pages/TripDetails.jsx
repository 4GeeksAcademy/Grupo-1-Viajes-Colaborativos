import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "../styles/TripDetails.css";

import { ItineraryTab } from "../components/ItineraryTab";
import { ExpensesTab } from "../components/ExpensesTab";
import { ChatTab } from "../components/ChatTab";

export const TripDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { store, dispatch } = useGlobalReducer();

    const [activeTab, setActiveTab] = useState("itinerario");
    const [tripItinerary, setTripItinerary] = useState([]);
    const [expensesList, setExpensesList] = useState([]);

    // 🎨 CHAPA Y PINTURA: Nuestro traductor VIP de estados
    const stateTranslations = {
        "PLANNING": { text: "Planificando", color: "#3498db" }, // Azul
        "ONGOING": { text: "En curso", color: "#2ecc71" },      // Verde
        "FINISHED": { text: "Finalizado", color: "#95a5a6" }    // Gris
    };

    useEffect(() => {
        const fetchTripDetails = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trip-detail/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    dispatch({ type: "load_trip_details", payload: data });
                    setTripItinerary(data.itinerary || []);
                    setExpensesList(data.expense || []);
                } else {
                    if (response.status === 401) navigate("/login");
                }
            } catch (error) {
                console.error("Error de conexión con el backend:", error);
            }
        };

        if (id) fetchTripDetails();
    }, [id, navigate, dispatch]);

    if (!store.currentTrip) {
        return (
            <div className="trip-details-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "100px" }}>
                <div className="spinner"></div>
                <h2>Cargando información del viaje...</h2>
            </div>
        );
    }

    const trip = store.currentTrip;
    const formattedDates = `${trip.starting_date} al ${trip.ending_date}`;

    // 🎨 CHAPA Y PINTURA: Calculamos el estado actual. 
    // Usamos toUpperCase() por si la base de datos lo devuelve en minúsculas.
    const safeState = trip.state ? trip.state.toUpperCase() : "PLANNING";
    const currentState = stateTranslations[safeState] || { text: trip.state, color: "var(--brand-teal)" };

    const allParticipants = store.travelers && store.travelers.length > 0
        ? store.travelers.map(t => t.name)
        : ["Usuario"];

    const calculateBalances = () => {
        let balances = {};
        allParticipants.forEach(p => balances[p] = 0);

        expensesList.forEach(exp => {
            const amount = parseFloat(exp.amount) || 0;
            const splitArray = exp.splitWith || allParticipants;
            const splitAmount = amount / splitArray.length;
            const payerName = exp.payer_name || allParticipants[0];

            if (balances[payerName] !== undefined) balances[payerName] += amount;

            splitArray.forEach(person => {
                if (balances[person] !== undefined) balances[person] -= splitAmount;
            });
        });
        return balances;
    };

    const participantBalances = calculateBalances();
    const totalSpent = expensesList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    return (
        <div className="trip-details-wrapper">
            {/* HERO SECTION */}
            <div className="trip-hero" style={{
                backgroundImage: `linear-gradient(rgba(30, 58, 95, 0.7), rgba(30, 58, 95, 0.4)), url('https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80')`
            }}>
                <div className="hero-content">
                    <button className="btn-back-light" onClick={() => navigate("/my-trips")}>
                        <i className="fa-solid fa-arrow-left"></i> Volver
                    </button>
                    
                    {/* 🎨 CHAPA Y PINTURA: Aplicamos el color y el texto traducido */}
                    <span className="hero-badge" style={{ backgroundColor: currentState.color }}>
                        {currentState.text}
                    </span>
                    
                    <h1>{trip.title}</h1>
                    <p><i className="fa-regular fa-calendar"></i> {formattedDates}</p>
                </div>
            </div>

            {/* CONTENEDOR PRINCIPAL */}
            <div className="trip-content-container">
                <div className="main-column">
                    <div className="main-layout-wrapper">

                        {/* ÁREA DE PESTAÑAS (IZQUIERDA EN PC / ABAJO EN MÓVIL) */}
                        <div className="tabs-content-area">
                            <div className="content-tabs">
                                <button className={activeTab === "itinerario" ? "active" : ""} onClick={() => setActiveTab("itinerario")}>Itinerario</button>
                                <button className={activeTab === "gastos" ? "active" : ""} onClick={() => setActiveTab("gastos")}>Gastos</button>
                                <button className={activeTab === "documentos" ? "active" : ""} onClick={() => setActiveTab("documentos")}>Documentos</button>
                            </div>

                            {activeTab === "itinerario" && (
                                <ItineraryTab tripItinerary={tripItinerary} setTripItinerary={setTripItinerary} />
                            )}

                            {activeTab === "gastos" && (
                                <ExpensesTab
                                    expensesList={expensesList}
                                    setExpensesList={setExpensesList}
                                    allParticipants={allParticipants}
                                    travelers={store.travelers || []}
                                />
                            )}

                            {activeTab === "documentos" && (
                                <div className="empty-state">
                                    <i className="fa-regular fa-folder-open"></i>
                                    <h3>Aún no hay documentos</h3>
                                    <p>Sube aquí tus reservas de hotel o vuelos.</p>
                                </div>
                            )}
                        </div>

                        {/* CHAT PERSISTENTE (DERECHA EN PC / ARRIBA EN MÓVIL) */}
                        <div className="chat-desktop-view persistent-chat">
                            <ChatTab />
                        </div>
                        
                    </div>
                </div>

                {/* BARRA LATERAL / SIDEBAR */}
                <div className="side-column">
                    <div className="summary-card budget-card">
                        <h3><i className="fa-solid fa-chart-pie"></i> Presupuesto</h3>
                        <div className="budget-numbers">
                            <div><span>Gastado</span><h4>{totalSpent.toFixed(2)}€</h4></div>
                            <div><span>Total</span><h4>{trip.budget || 0}€</h4></div>
                        </div>
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{
                                width: `${trip.budget > 0 ? Math.min((totalSpent / trip.budget) * 100, 100) : 0}%`,
                                backgroundColor: totalSpent > trip.budget ? "#e74c3c" : "#2ecc71"
                            }}></div>
                        </div>
                    </div>

                    <div className="summary-card friends-card">
                        <h3><i className="fa-solid fa-users"></i> Viajeros y Balances</h3>
                        <ul className="friends-list">
                            {allParticipants.map((person, i) => {
                                const balance = participantBalances[person] || 0;
                                const balanceClass = balance > 0.01 ? "balance-positive" : balance < -0.01 ? "balance-negative" : "balance-neutral";

                                return (
                                    <li key={i}>
                                        <div className="avatar friend-avatar">{person.charAt(0).toUpperCase()}</div>
                                        <span>{person}</span>
                                        <span className={`balance-badge ${balanceClass}`}>
                                            {balance > 0 ? `+${balance.toFixed(2)}` : balance.toFixed(2)} €
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};