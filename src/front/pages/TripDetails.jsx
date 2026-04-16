import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/TripDetails.css";

export const TripDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Pestañas internas (Lo pongo por defecto en gastos para que pruebes más rápido)
    const [activeTab, setActiveTab] = useState("gastos");

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

    // =========================================
    // NUEVO: LÓGICA DEL MODAL DE GASTOS (Estilo Splitwise)
    // =========================================
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    
    // Lista completa de personas en el viaje (Tú + los compañeros)
    const allParticipants = ["Yo", ...trip.companions];

    const [expenseData, setExpenseData] = useState({
        description: "",
        amount: "",
        category: "Comida",
        paidBy: "Yo",
        splitMethod: "equally", // Puede ser 'equally' (todos) o 'custom' (algunos)
        splitWith: allParticipants // Por defecto, todos están seleccionados
    });

    // Maneja los inputs de texto normales
    const handleExpenseChange = (e) => {
        setExpenseData({ ...expenseData, [e.target.name]: e.target.value });
    };

    // Maneja los checkboxes de la división personalizada
    const handleCheckboxChange = (participant) => {
        setExpenseData((prev) => {
            const isSelected = prev.splitWith.includes(participant);
            // Si ya estaba, lo quitamos. Si no estaba, lo añadimos.
            const newSplitWith = isSelected 
                ? prev.splitWith.filter(p => p !== participant)
                : [...prev.splitWith, participant];
            
            return { ...prev, splitWith: newSplitWith };
        });
    };

    // Guarda el gasto y cierra el modal
    const handleExpenseSubmit = (e) => {
        e.preventDefault();
        
        // Pequeña validación
        if (expenseData.splitMethod === "custom" && expenseData.splitWith.length === 0) {
            alert("Debes seleccionar al menos a una persona para dividir el gasto.");
            return;
        }

        console.log("Gasto registrado:", expenseData);
        alert(`¡Gasto de ${expenseData.amount}€ guardado con éxito!`);
        
        setShowExpenseModal(false);
        // Reseteamos el formulario
        setExpenseData({ 
            description: "", amount: "", category: "Comida", 
            paidBy: "Yo", splitMethod: "equally", splitWith: allParticipants 
        });
    };

    return (
        <div className="trip-details-wrapper">
            
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
                            {/* NUEVO: Botón que abre el modal */}
                            <button className="btn-action" onClick={() => setShowExpenseModal(true)}>
                                Añadir Gasto
                            </button>
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

                <div className="side-column">
                    <div className="summary-card budget-card">
                        <h3><i className="fa-solid fa-chart-pie"></i> Presupuesto</h3>
                        <div className="budget-numbers">
                            <div><span>Gastado</span><h4>{trip.budget.spent}€</h4></div>
                            <div><span>Total</span><h4>{trip.budget.total}€</h4></div>
                        </div>
                        <div className="progress-bar-bg">
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

            {/* =========================================
                NUEVO: MODAL DE GASTOS 
                ========================================= */}
            {showExpenseModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Añadir Nuevo Gasto</h3>
                        <p>Registra un ticket y decide cómo dividirlo.</p>
                        
                        <form onSubmit={handleExpenseSubmit} className="expense-form">
                            
                            {/* Primera fila: Qué y Cuánto */}
                            <div className="input-group full-width">
                                <label>Descripción</label>
                                <input type="text" name="description" value={expenseData.description} onChange={handleExpenseChange} placeholder="Ej. Cena, Entradas museo..." required />
                            </div>

                            <div className="expense-row">
                                <div className="input-group">
                                    <label>Importe (€)</label>
                                    <input type="number" name="amount" value={expenseData.amount} onChange={handleExpenseChange} placeholder="0.00" min="0.01" step="0.01" required />
                                </div>
                                <div className="input-group">
                                    <label>Categoría</label>
                                    <select name="category" value={expenseData.category} onChange={handleExpenseChange}>
                                        <option value="Comida">Comida y Bebida</option>
                                        <option value="Transporte">Transporte</option>
                                        <option value="Alojamiento">Alojamiento</option>
                                        <option value="Actividades">Actividades</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>
                            </div>

                            {/* Segunda fila: Lógica de Splitwise */}
                            <div className="expense-row split-logic-row">
                                <div className="input-group">
                                    <label>¿Quién pagó?</label>
                                    <select name="paidBy" value={expenseData.paidBy} onChange={handleExpenseChange}>
                                        {allParticipants.map((p, i) => (
                                            <option key={i} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>¿Cómo se divide?</label>
                                    <select name="splitMethod" value={expenseData.splitMethod} onChange={handleExpenseChange}>
                                        <option value="equally">Partes iguales (Todos)</option>
                                        <option value="custom">Personalizado...</option>
                                    </select>
                                </div>
                            </div>

                            {/* Si elige "Personalizado", mostramos los checkboxes */}
                            {expenseData.splitMethod === "custom" && (
                                <div className="custom-split-container">
                                    <label className="split-label-title">Selecciona quién participa en este gasto:</label>
                                    <div className="checkbox-grid">
                                        {allParticipants.map((participant, index) => (
                                            <label key={index} className="checkbox-label">
                                                <input 
                                                    type="checkbox" 
                                                    checked={expenseData.splitWith.includes(participant)}
                                                    onChange={() => handleCheckboxChange(participant)}
                                                />
                                                <span className="custom-checkbox"></span>
                                                {participant}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn-modal-cancel" onClick={() => setShowExpenseModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-modal-confirm">Guardar Gasto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};