import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/TripDetails.css";

export const TripDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // 1. ESTADOS DE NAVEGACIÓN
    const [activeTab, setActiveTab] = useState("itinerario");

    // 2. ESTADOS PARA ITINERARIO (GDV-35)
    const [selectedActivity, setSelectedActivity] = useState(null); 
    const [isEditingActivity, setIsEditingActivity] = useState(false); 
    const [tempActivityData, setTempActivityData] = useState(null);   

    const trip = {
        id: id,
        title: "Lisboa Editorial",
        dates: "12 - 15 Septiembre",
        status: "En curso",
        image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80",
        budget: { total: 800, spent: 345 },
        companions: ["Ana", "Carlos"],
        itinerary: [
            { 
                day: 1, date: "12 Sept", time: "10:30", title: "Llegada y Check-in", 
                location: "Aeropuerto de Lisboa / Hotel Altis", desc: "Vuelo de mañana. Tarde libre por Alfama.",
                notes: "Recordar pedir el código de la puerta por WhatsApp al dueño del AirBnb."
            },
            { 
                day: 2, date: "13 Sept", time: "11:00", title: "Ruta de los Miradores", 
                location: "Miradouro de Santa Luzia", desc: "Tour fotográfico y cena con Fado.",
                notes: "Llevar calzado cómodo, hay muchas cuestas empedradas."
            }
        ]
    };

    // === FUNCIONES ITINERARIO ===
    const openActivityModal = (activity) => {
        setSelectedActivity(activity);
        setTempActivityData({ ...activity });
        setIsEditingActivity(false);
    };

    const handleActivityChange = (e) => {
        setTempActivityData({ ...tempActivityData, [e.target.name]: e.target.value });
    };

    const saveActivityChanges = () => {
        setSelectedActivity(tempActivityData); 
        setIsEditingActivity(false);
        alert("Actividad actualizada");
    };

    // =========================================
    // 3. LÓGICA DE GASTOS
    // =========================================
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const allParticipants = ["Yo", ...trip.companions];

    const [expenseData, setExpenseData] = useState({
        description: "",
        amount: "",
        category: "Comida",
        paidBy: "Yo",
        splitMethod: "equally",
        splitWith: allParticipants
    });

    const handleExpenseChange = (e) => {
        setExpenseData({ ...expenseData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (participant) => {
        setExpenseData((prev) => {
            const isSelected = prev.splitWith.includes(participant);
            const newSplitWith = isSelected 
                ? prev.splitWith.filter(p => p !== participant)
                : [...prev.splitWith, participant];
            return { ...prev, splitWith: newSplitWith };
        });
    };

    const handleExpenseSubmit = (e) => {
        e.preventDefault();
        console.log("Gasto guardado:", expenseData);
        alert(`¡Gasto de ${expenseData.amount}€ guardado!`);
        setShowExpenseModal(false);
        setExpenseData({ description: "", amount: "", category: "Comida", paidBy: "Yo", splitMethod: "equally", splitWith: allParticipants });
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
                                    <div key={index} className="timeline-item clickable" onClick={() => openActivityModal(item)}>
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <span className="day-badge">Día {item.day} - {item.date}</span>
                                            <span className="time-tag">{item.time}</span>
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
                            <button className="btn-action" onClick={() => setShowExpenseModal(true)}>Añadir Gasto</button>
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
                            <li><div className="avatar">Yo</div> Tú</li>
                            {trip.companions.map((f, i) => <li key={i}><div className="avatar friend-avatar">{f.charAt(0)}</div> {f}</li>)}
                        </ul>
                    </div>
                </div>
            </div>

            {/* MODAL DETALLE/EDICIÓN ITINERARIO */}
            {selectedActivity && (
                <div className="modal-overlay" onClick={() => setSelectedActivity(null)}>
                    <div className="modal-content activity-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="activity-modal-header">
                            <span className="day-badge">Día {tempActivityData.day}</span>
                            <button className="btn-close-modal" onClick={() => setSelectedActivity(null)}>&times;</button>
                        </div>
                        {isEditingActivity ? (
                            <div className="activity-edit-form">
                                <div className="input-group full-width"><label>Título</label><input type="text" name="title" value={tempActivityData.title} onChange={handleActivityChange} /></div>
                                <div className="expense-row">
                                    <div className="input-group"><label>Hora</label><input type="time" name="time" value={tempActivityData.time} onChange={handleActivityChange} /></div>
                                    <div className="input-group"><label>Ubicación</label><input type="text" name="location" value={tempActivityData.location} onChange={handleActivityChange} /></div>
                                </div>
                                <div className="input-group full-width"><label>Descripción</label><textarea name="desc" rows="3" value={tempActivityData.desc} onChange={handleActivityChange}></textarea></div>
                                <div className="modal-actions-itinerary">
                                    <button className="btn-modal-cancel" onClick={() => setIsEditingActivity(false)}>Cancelar</button>
                                    <button className="btn-modal-confirm" onClick={saveActivityChanges}>Guardar</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="activity-main-info">
                                    <h2>{selectedActivity.title}</h2>
                                    <div className="info-row"><i className="fa-regular fa-clock"></i> {selectedActivity.time}</div>
                                    <div className="info-row"><i className="fa-solid fa-location-dot"></i> {selectedActivity.location}</div>
                                </div>
                                <div className="activity-description"><h4>Descripción</h4><p>{selectedActivity.desc}</p></div>
                                <div className="modal-actions-itinerary">
                                    <button className="btn-edit-activity" onClick={() => setIsEditingActivity(true)}>Editar</button>
                                    <button className="btn-modal-confirm" onClick={() => setSelectedActivity(null)}>Cerrar</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL GASTOS ACTUALIZADO PARA CHECKBOX CUSTOM */}
            {showExpenseModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Añadir Nuevo Gasto</h3>
                        <form onSubmit={handleExpenseSubmit} className="expense-form">
                            <div className="input-group full-width">
                                <label>Descripción</label>
                                <input type="text" name="description" value={expenseData.description} onChange={handleExpenseChange} required />
                            </div>
                            <div className="expense-row">
                                <div className="input-group"><label>Importe (€)</label><input type="number" name="amount" value={expenseData.amount} onChange={handleExpenseChange} required /></div>
                                <div className="input-group">
                                    <label>Categoría</label>
                                    <select name="category" value={expenseData.category} onChange={handleExpenseChange}>
                                        <option value="Comida">Comida</option><option value="Transporte">Transporte</option><option value="Otros">Otros</option>
                                    </select>
                                </div>
                            </div>
                            <div className="expense-row">
                                <div className="input-group">
                                    <label>¿Quién pagó?</label>
                                    <select name="paidBy" value={expenseData.paidBy} onChange={handleExpenseChange}>
                                        {allParticipants.map((p, i) => <option key={i} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>¿Cómo se divide?</label>
                                    <select name="splitMethod" value={expenseData.splitMethod} onChange={handleExpenseChange}>
                                        <option value="equally">Partes iguales</option><option value="custom">Personalizado</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* AQUÍ ESTÁ EL CAMBIO PARA EL CHECKBOX ELEGANTE */}
                            {expenseData.splitMethod === "custom" && (
                                <div className="custom-split-container">
                                    <div className="checkbox-grid">
                                        {allParticipants.map((p, i) => (
                                            <label key={i} className="checkbox-label">
                                                <input 
                                                    type="checkbox" 
                                                    checked={expenseData.splitWith.includes(p)} 
                                                    onChange={() => handleCheckboxChange(p)} 
                                                />
                                                <div className="custom-checkbox"></div>
                                                {p}
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