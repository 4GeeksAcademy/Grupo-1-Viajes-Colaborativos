import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
    
    // 📸 ESTADOS PARA LA EDICIÓN DE IMAGEN
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState("");
    const [isUpdatingImage, setIsUpdatingImage] = useState(false);

    // 📸 NUEVOS ESTADOS PARA MODALES DE OPCIÓN D
    const [showAddTravelerModal, setShowAddTravelerModal] = useState(false);
    const [showAddDocModal, setShowAddDocModal] = useState(false);

    const stateTranslations = {
        "PLANNING": { text: "Planificando", color: "#3498db" },
        "ONGOING": { text: "En curso", color: "#2ecc71" },
        "FINISHED": { text: "Finalizado", color: "#95a5a6" }
    };

    // Extraemos el fetch a una función para poder reutilizarlo al actualizar la imagen
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

    useEffect(() => {
        if (id) fetchTripDetails();
    }, [id, navigate, dispatch]);

    // 📸 FUNCIÓN PARA ACTUALIZAR LA IMAGEN EN EL BACKEND
    const handleImageUpdate = async () => {
        setIsUpdatingImage(true);
        const token = localStorage.getItem("token");
        
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/update-trip-image/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ image_url: newImageUrl })
            });

            if (response.ok) {
                setIsEditingImage(false);
                setNewImageUrl("");
                fetchTripDetails(); // Recargamos los datos para que se vea la foto nueva
            } else {
                alert("Hubo un error al actualizar la imagen.");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsUpdatingImage(false);
        }
    };

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

    // 📸 LÓGICA DE FONDO: Usa la imagen del viaje o una por defecto
    const heroImage = trip.image_url && trip.image_url.trim() !== "" 
        ? trip.image_url 
        : `https://source.unsplash.com/1200x400/?${encodeURIComponent(trip.destination || 'travel')}`;

    return (
        <div className="trip-details-wrapper">
            {/* HERO SECTION */}
            <div className="trip-hero" style={{
                backgroundImage: `linear-gradient(rgba(30, 58, 95, 0.7), rgba(30, 58, 95, 0.4)), url('${heroImage}')`
            }}>
                
                {/* 🛠️ FIX DEFINITIVO: Botón fuera del hero-content y sin posiciones forzadas en línea.
                    Ahora tu archivo CSS tiene el control absoluto en móvil y PC. */}
                <Link 
                    to="/my-trips" 
                    className="btn-back-light" 
                    style={{ 
                        cursor: "pointer", 
                        zIndex: 9999,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        textDecoration: "none"
                    }}
                >
                    <i className="fa-solid fa-arrow-left"></i> Volver
                </Link>

                <div className="hero-content" style={{ position: "relative", width: "100%" }}>
                    
                    <span className="hero-badge" style={{ backgroundColor: currentState.color }}>
                        {currentState.text}
                    </span>
                    
                    <h1>{trip.title}</h1>
                    <p><i className="fa-regular fa-calendar"></i> {formattedDates}</p>

                    {/* 📸 INTERFAZ DE EDICIÓN DE IMAGEN */}
                    <div style={{ position: "absolute", bottom: "10px", right: "20px" }}>
                        {!isEditingImage ? (
                            <button 
                                onClick={() => { setIsEditingImage(true); setNewImageUrl(trip.image_url || ""); }}
                                style={{ background: "rgba(255,255,255,0.2)", border: "1px solid white", color: "white", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", backdropFilter: "blur(4px)" }}
                            >
                                <i className="fa-solid fa-camera"></i> Cambiar Foto
                            </button>
                        ) : (
                            <div style={{ background: "white", padding: "10px", borderRadius: "8px", display: "flex", gap: "10px", alignItems: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                                <input 
                                    type="url" 
                                    placeholder="Pega la nueva URL..." 
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: "250px" }}
                                />
                                <button 
                                    onClick={handleImageUpdate}
                                    disabled={isUpdatingImage}
                                    style={{ background: "var(--brand-teal)", color: "white", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer" }}
                                >
                                    {isUpdatingImage ? "..." : "Guardar"}
                                </button>
                                <button 
                                    onClick={() => setIsEditingImage(false)}
                                    style={{ background: "#e2e8f0", color: "#334155", border: "none", padding: "8px 10px", borderRadius: "4px", cursor: "pointer" }}
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* CONTENEDOR PRINCIPAL */}
            <div className="trip-content-container">
                <div className="main-column">
                    <div className="main-layout-wrapper">

                        {/* ÁREA DE PESTAÑAS */}
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
                                <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <i className="fa-regular fa-folder-open"></i>
                                    <h3>Aún no hay documentos</h3>
                                    <p>Sube aquí tus reservas de hotel o vuelos.</p>
                                    
                                    {/* 📸 NUEVO: Botón Añadir Documento */}
                                    <button 
                                        className="btn-action" 
                                        style={{ marginTop: "15px", width: "auto", padding: "10px 20px" }}
                                        onClick={() => setShowAddDocModal(true)}
                                    >
                                        <i className="fa-solid fa-upload"></i> Subir Documento
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* CHAT PERSISTENTE */}
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
                        
                        {/* 📸 NUEVO: Botón Añadir Viajero */}
                        <button 
                            className="btn-invite" 
                            style={{ width: "100%", marginTop: "10px", padding: "10px", border: "1px dashed var(--brand-teal)", background: "transparent", color: "var(--brand-teal)", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
                            onClick={() => setShowAddTravelerModal(true)}
                        >
                            <i className="fa-solid fa-user-plus"></i> Invitar Viajero
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODALES SIMULADOS PARA DOCUMENTOS Y VIAJEROS --- */}
            {showAddTravelerModal && (
                <div className="modal-overlay" onClick={() => setShowAddTravelerModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '30px' }}>
                        <h2><i className="fa-solid fa-envelope-open-text" style={{color: "var(--brand-teal)", fontSize: "2rem", marginBottom: "15px"}}></i></h2>
                        <h3>Invitar a un amigo</h3>
                        <p style={{color: "#64748b", margin: "15px 0"}}>Próximamente podrás añadir viajeros escribiendo su correo electrónico aquí.</p>
                        <button className="btn-modal-confirm" onClick={() => setShowAddTravelerModal(false)}>Entendido</button>
                    </div>
                </div>
            )}

            {showAddDocModal && (
                <div className="modal-overlay" onClick={() => setShowAddDocModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '30px' }}>
                        <h2><i className="fa-solid fa-file-pdf" style={{color: "#e74c3c", fontSize: "2rem", marginBottom: "15px"}}></i></h2>
                        <h3>Gestor de Archivos</h3>
                        <p style={{color: "#64748b", margin: "15px 0"}}>La subida de billetes y reservas (PDF/Imágenes) estará disponible en la próxima actualización.</p>
                        <button className="btn-modal-confirm" onClick={() => setShowAddDocModal(false)}>Entendido</button>
                    </div>
                </div>
            )}

        </div>
    );
};