import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/TripDetails.css";

// Importamos nuestros nuevos componentes hijos
import { ItineraryTab } from "../components/ItineraryTab";
import { ExpensesTab } from "../components/ExpensesTab";
import { ChatTab } from "../components/ChatTab";

// 1. BASE DE DATOS COMPLETA
const tripsData = {
        "1": {
                id: "1",
                title: "Lisboa Editorial",
                dates: "12 - 15 Septiembre, 2026",
                status: "En curso",
                image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80",
                budget: { total: 800, spent: 345 },
                companions: ["Ana", "Carlos"],
                itinerary: [
                        { date: "2026-09-12", time: "10:30", title: "Llegada y Check-in", location: "Aeropuerto de Lisboa", desc: "Vuelo de mañana. Tarde libre por Alfama." },
                        { date: "2026-09-13", time: "11:00", title: "Ruta de los Miradores", location: "Miradouro de Santa Luzia", desc: "Tour fotográfico y cena con Fado." }
                ]
        },
        "2": {
                id: "2",
                title: "Costa Italiana",
                dates: "01 - 12 Octubre, 2026",
                status: "Planificando",
                image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80",
                budget: { total: 2000, spent: 0 },
                companions: ["Lucía", "Pedro"],
                itinerary: [{ date: "2026-10-01", time: "12:00", title: "Llegada a Positano", location: "Costa Amalfitana", desc: "Check-in en el hotel." }]
        },
        "3": {
                id: "3",
                title: "London Weekend",
                dates: "24 - 26 Noviembre, 2026",
                status: "Planificando",
                image: "https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?auto=format&fit=crop&w=1200&q=80",
                budget: { total: 600, spent: 150 },
                companions: ["Tomás"],
                itinerary: [{ date: "2026-11-24", time: "15:00", title: "Paseo por el Támesis", location: "London Eye", desc: "Vistas de la ciudad." }]
        },
        "4": {
                id: "4",
                title: "Escapada a París",
                dates: "Julio 2023",
                status: "Pasados",
                image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
                budget: { total: 1000, spent: 1000 },
                companions: ["Sofía"],
                itinerary: [{ date: "2023-07-10", time: "20:00", title: "Cena Torre Eiffel", location: "París", desc: "Despedida del viaje en restaurante." }]
        },
        "5": {
                id: "5",
                title: "Ruta por Japón",
                dates: "10 - 25 Abril, 2026",
                status: "En curso",
                image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80",
                budget: { total: 3000, spent: 1200 },
                companions: ["Yuki", "Kenji"],
                itinerary: [{ date: "2026-04-10", time: "08:00", title: "Llegada a Narita", location: "Tokio", desc: "Activación del JR Pass." }]
        },
        "6": {
                id: "6",
                title: "Aventura en los Alpes",
                dates: "Diciembre 2024",
                status: "Planificando",
                image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80",
                budget: { total: 1500, spent: 450 },
                companions: ["Elena", "Marcos"],
                itinerary: [{ date: "2024-12-15", time: "09:00", title: "Llegada a Chamonix", location: "Estación de bus", desc: "Recogida de equipo de esquí." }]
        },
        "7": {
                id: "7",
                title: "Roadtrip California",
                dates: "Agosto 2022",
                status: "Pasados",
                image: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=1200&q=80",
                budget: { total: 2500, spent: 2500 },
                companions: ["James"],
                itinerary: [{ date: "2022-08-01", time: "10:00", title: "Golden Gate", location: "San Francisco", desc: "Cruzar el puente en bicicleta." }]
        }
};

export const TripDetails = () => {
        const { id } = useParams();
        const navigate = useNavigate();

        // --- ESTADOS GLOBALES DE LA PÁGINA ---
        const [activeTab, setActiveTab] = useState("itinerario");
        const [trip, setTrip] = useState(null);

        // Estos estados los maneja el Padre para poder calcular los totales en la barra lateral
        const [tripItinerary, setTripItinerary] = useState([]);
        const [expensesList, setExpensesList] = useState([
                { id: 1, description: "Cena en Alfama", amount: 120, category: "Comida", paidBy: "Carlos", splitMethod: "equally", splitWith: ["Yo", "Ana", "Carlos"], settledWith: [], date: "14 Sept" },
                { id: 2, description: "Uber al aeropuerto", amount: 25, category: "Transporte", paidBy: "Yo", splitMethod: "equally", splitWith: ["Yo", "Carlos"], settledWith: [], date: "15 Sept" }
        ]);

        // --- CARGA DINÁMICA ---
        useEffect(() => {
                const foundTrip = tripsData[String(id)];
                if (foundTrip) {
                        setTrip(foundTrip);
                        setTripItinerary(foundTrip.itinerary || []);
                }
        }, [id]);

        // Render de carga de seguridad
        if (!trip) {
                return (
                        <div className="trip-details-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "100px" }}>
                                <h2>Cargando información del viaje...</h2>
                                <button className="btn-action" style={{ marginTop: "20px" }} onClick={() => navigate("/my-trips")}>Volver a Mis Viajes</button>
                        </div>
                );
        }

        const allParticipants = ["Yo", ...trip.companions];

        // --- MATEMÁTICAS CENTRALIZADAS ---
        const calculateBalances = () => {
                let balances = {};
                allParticipants.forEach(p => balances[p] = 0);

                expensesList.forEach(exp => {
                        const splitAmount = parseFloat(exp.amount) / exp.splitWith.length;
                        if (balances[exp.paidBy] !== undefined) balances[exp.paidBy] += parseFloat(exp.amount);

                        exp.splitWith.forEach(person => {
                                if (balances[person] !== undefined) balances[person] -= splitAmount;
                        });

                        if (exp.settledWith && exp.settledWith.length > 0) {
                                exp.settledWith.forEach(settledPerson => {
                                        if (balances[settledPerson] !== undefined && balances[exp.paidBy] !== undefined) {
                                                balances[settledPerson] += splitAmount;
                                                balances[exp.paidBy] -= splitAmount;
                                        }
                                });
                        }
                });
                return balances;
        };

        const participantBalances = calculateBalances();
        const totalSpent = expensesList.reduce((acc, curr) => acc + curr.amount, 0);

        return (
                <div className="trip-details-wrapper">
                        {/* HERO */}
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

                        <div className="trip-content-container">

                                {/* COLUMNA PRINCIPAL */}
                                <div className="main-column">
                                        <div className="main-layout-wrapper">

                                                {/* BLOQUE 1: LAS PESTAÑAS */}
                                                <div className="tabs-content-area">
                                                        <div className="content-tabs">
                                                                <button className={activeTab === "itinerario" ? "active" : ""} onClick={() => setActiveTab("itinerario")}>Itinerario</button>
                                                                <button className={activeTab === "gastos" ? "active" : ""} onClick={() => setActiveTab("gastos")}>Gastos</button>
                                                                <button className={activeTab === "documentos" ? "active" : ""} onClick={() => setActiveTab("documentos")}>Documentos</button>
                                                        </div>

                                                        {activeTab === "itinerario" && (
                                                                <ItineraryTab
                                                                        tripItinerary={tripItinerary}
                                                                        setTripItinerary={setTripItinerary}
                                                                />
                                                        )}

                                                        {activeTab === "gastos" && (
                                                                <ExpensesTab
                                                                        expensesList={expensesList}
                                                                        setExpensesList={setExpensesList}
                                                                        allParticipants={allParticipants}
                                                                />
                                                        )}

                                                        {activeTab === "documentos" && (
                                                                <div className="empty-state">
                                                                        <i className="fa-regular fa-folder-open"></i>
                                                                        <h3>Aún no hay documentos</h3>
                                                                        <p style={{ marginTop: "10px" }}>Aquí podrás subir tus billetes y reservas.</p>
                                                                </div>
                                                        )}
                                                </div>

                                                {/* BLOQUE 2: EL CHAT FIJO */}
                                                <div className="persistent-chat">
                                                        <ChatTab />
                                                </div>

                                        </div>
                                </div>

                                {/* COLUMNA LATERAL */}
                                <div className="side-column">
                                        <div className="summary-card budget-card">
                                                <h3><i className="fa-solid fa-chart-pie"></i> Presupuesto</h3>
                                                <div className="budget-numbers">
                                                        <div><span>Gastado</span><h4>{totalSpent.toFixed(2)}€</h4></div>
                                                        <div><span>Total</span><h4>{trip.budget.total}€</h4></div>
                                                </div>
                                                <div className="progress-bar-bg">
                                                        <div className="progress-bar-fill" style={{ width: `${trip.budget.total > 0 ? (totalSpent / trip.budget.total) * 100 : 0}%` }}></div>
                                                </div>
                                        </div>

                                        <div className="summary-card friends-card">
                                                <h3><i className="fa-solid fa-users"></i> Viajeros y Balances</h3>
                                                <ul className="friends-list">
                                                        {allParticipants.map((person, i) => {
                                                                const balance = participantBalances[person];
                                                                let balanceClass = "balance-neutral";
                                                                let balanceText = "0.00 €";

                                                                if (balance > 0.01) {
                                                                        balanceClass = "balance-positive";
                                                                        balanceText = `+${balance.toFixed(2)} €`;
                                                                } else if (balance < -0.01) {
                                                                        balanceClass = "balance-negative";
                                                                        balanceText = `${balance.toFixed(2)} €`;
                                                                }

                                                                return (
                                                                        <li key={i}>
                                                                                <div className="avatar friend-avatar">{person.charAt(0)}</div>
                                                                                <span>{person === "Yo" ? "Tú" : person}</span>
                                                                                <span className={`balance-badge ${balanceClass}`}>{balanceText}</span>
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