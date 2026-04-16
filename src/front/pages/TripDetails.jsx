import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/TripDetails.css";

// 1. BASE DE DATOS COMPLETA (Con los 7 viajes de MyTrips)
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
        itinerary: [
            { date: "2026-10-01", time: "12:00", title: "Llegada a Positano", location: "Costa Amalfitana", desc: "Check-in en el hotel con vistas al mar." }
        ]
    },
    "3": {
        id: "3",
        title: "London Weekend",
        dates: "24 - 26 Noviembre, 2026",
        status: "Planificando",
        image: "https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?auto=format&fit=crop&w=1200&q=80",
        budget: { total: 600, spent: 150 },
        companions: ["Tomás"],
        itinerary: [
            { date: "2026-11-24", time: "15:00", title: "Paseo por el Támesis", location: "London Eye", desc: "Vistas de la ciudad desde la noria." }
        ]
    },
    "4": {
        id: "4",
        title: "Escapada a París",
        dates: "Julio 2023",
        status: "Pasados",
        image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
        budget: { total: 1000, spent: 1000 },
        companions: ["Sofía"],
        itinerary: [
            { date: "2023-07-10", time: "20:00", title: "Cena Torre Eiffel", location: "París", desc: "Despedida del viaje en restaurante." }
        ]
    },
    "5": {
        id: "5",
        title: "Ruta por Japón",
        dates: "10 - 25 Abril, 2026",
        status: "En curso",
        image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80",
        budget: { total: 3000, spent: 1200 },
        companions: ["Yuki", "Kenji"],
        itinerary: [
            { date: "2026-04-10", time: "08:00", title: "Llegada a Narita", location: "Tokio", desc: "Activación del JR Pass y viaje a Shinjuku." }
        ]
    },
    "6": {
        id: "6",
        title: "Aventura en los Alpes",
        dates: "Diciembre 2024",
        status: "Planificando",
        image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80",
        budget: { total: 1500, spent: 450 },
        companions: ["Elena", "Marcos"],
        itinerary: [
            { date: "2024-12-15", time: "09:00", title: "Llegada a Chamonix", location: "Estación de bus", desc: "Recogida de equipo de esquí en la tienda central." }
        ]
    },
    "7": {
        id: "7",
        title: "Roadtrip California",
        dates: "Agosto 2022",
        status: "Pasados",
        image: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=1200&q=80",
        budget: { total: 2500, spent: 2500 },
        companions: ["James"],
        itinerary: [
            { date: "2022-08-01", time: "10:00", title: "Golden Gate", location: "San Francisco", desc: "Cruzar el puente en bicicleta." }
        ]
    }
};

export const TripDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- ESTADOS DE LA PÁGINA ---
    const [activeTab, setActiveTab] = useState("itinerario");
    const [trip, setTrip] = useState(null);
    const [tripItinerary, setTripItinerary] = useState([]);

    // --- CARGA DINÁMICA ---
    useEffect(() => {
        // Buscamos el viaje asegurándonos de que el ID sea string
        const foundTrip = tripsData[String(id)];
        if (foundTrip) {
            setTrip(foundTrip);
            setTripItinerary(foundTrip.itinerary || []);
        }
    }, [id]);

    // --- ESTADOS MODALES ITINERARIO ---
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [isEditingActivity, setIsEditingActivity] = useState(false);
    const [tempActivityData, setTempActivityData] = useState(null);
    const [showAddActivityModal, setShowAddActivityModal] = useState(false);
    
    const today = new Date().toISOString().split('T')[0];
    const [newActivity, setNewActivity] = useState({
        date: today,
        time: "12:00",
        title: "",
        location: "",
        desc: ""
    });

    // --- ESTADOS MODAL GASTOS ---
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseData, setExpenseData] = useState({
        description: "",
        amount: "",
        category: "Comida",
        paidBy: "Yo",
        splitMethod: "equally",
        splitWith: []
    });

    // --- FORMATEO ---
    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Render de carga si el ID no existe en tripsData
    if (!trip) {
        return (
            <div className="trip-details-wrapper" style={{display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "100px"}}>
                <h2>Cargando información del viaje...</h2>
                <button className="btn-action" style={{marginTop: "20px"}} onClick={() => navigate("/my-trips")}>Volver a Mis Viajes</button>
            </div>
        );
    }

    const allParticipants = ["Yo", ...trip.companions];

    // === LÓGICA ITINERARIO ===
    const openActivityModal = (activity) => {
        setSelectedActivity(activity);
        setTempActivityData({ ...activity });
        setIsEditingActivity(false);
    };

    const handleActivityChange = (e) => {
        setTempActivityData({ ...tempActivityData, [e.target.name]: e.target.value });
    };

    const saveActivityChanges = () => {
        const updated = tripItinerary.map(item => 
            item.title === selectedActivity.title ? tempActivityData : item
        );
        setTripItinerary(updated);
        setSelectedActivity(tempActivityData);
        setIsEditingActivity(false);
    };

    const handleAddActivitySubmit = (e) => {
        e.preventDefault();
        const updatedList = [...tripItinerary, newActivity].sort((a, b) => new Date(a.date) - new Date(b.date));
        setTripItinerary(updatedList);
        setShowAddActivityModal(false);
        setNewActivity({ date: today, time: "12:00", title: "", location: "", desc: "" });
    };

    // === LÓGICA GASTOS ===
    const handleExpenseChange = (e) => {
        setExpenseData({ ...expenseData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (participant) => {
        setExpenseData(prev => {
            const isSelected = prev.splitWith.includes(participant);
            const newSplitWith = isSelected 
                ? prev.splitWith.filter(p => p !== participant)
                : [...prev.splitWith, participant];
            return { ...prev, splitWith: newSplitWith };
        });
    };

    const handleExpenseSubmit = (e) => {
        e.preventDefault();
        setShowExpenseModal(false);
        setExpenseData({ description: "", amount: "", category: "Comida", paidBy: "Yo", splitMethod: "equally", splitWith: [] });
    };

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
                    <div className="content-tabs">
                        <button className={activeTab === "itinerario" ? "active" : ""} onClick={() => setActiveTab("itinerario")}>Itinerario</button>
                        <button className={activeTab === "gastos" ? "active" : ""} onClick={() => setActiveTab("gastos")}>Gastos</button>
                        <button className={activeTab === "documentos" ? "active" : ""} onClick={() => setActiveTab("documentos")}>Documentos</button>
                    </div>

                    {activeTab === "itinerario" && (
                        <div className="itinerary-section">
                            <h2>Plan de Viaje</h2>
                            {tripItinerary.length > 0 ? (
                                <div className="timeline">
                                    {tripItinerary.map((item, index) => (
                                        <div key={index} className="timeline-item clickable" onClick={() => openActivityModal(item)}>
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-content">
                                                <span className="day-badge">{formatDateDisplay(item.date)}</span>
                                                <span className="time-tag">{item.time}</span>
                                                <h3>{item.title}</h3>
                                                <p>{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: "#64748b", margin: "20px 0" }}>Aún no hay actividades planeadas para este viaje.</p>
                            )}
                            <button className="btn-add-day" onClick={() => setShowAddActivityModal(true)}>
                                <i className="fa-solid fa-plus"></i> Añadir actividad
                            </button>
                        </div>
                    )}

                    {activeTab === "gastos" && (
                        <div className="empty-state">
                            <i className="fa-solid fa-wallet"></i>
                            <h3>Gestiona tus gastos compartidos</h3>
                            <button className="btn-action" onClick={() => setShowExpenseModal(true)}>Añadir Gasto</button>
                        </div>
                    )}
                    
                    {activeTab === "documentos" && (
                        <div className="empty-state">
                            <i className="fa-regular fa-folder-open"></i>
                            <h3>Aún no hay documentos</h3>
                        </div>
                    )}
                </div>

                {/* COLUMNA LATERAL */}
                <div className="side-column">
                    <div className="summary-card budget-card">
                        <h3><i className="fa-solid fa-chart-pie"></i> Presupuesto</h3>
                        <div className="budget-numbers">
                            <div><span>Gastado</span><h4>{trip.budget.spent}€</h4></div>
                            <div><span>Total</span><h4>{trip.budget.total}€</h4></div>
                        </div>
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${trip.budget.total > 0 ? (trip.budget.spent / trip.budget.total) * 100 : 0}%` }}></div>
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
                            <span className="day-badge">{formatDateDisplay(tempActivityData.date)}</span>
                            <button className="btn-close-modal" onClick={() => setSelectedActivity(null)}>&times;</button>
                        </div>
                        {isEditingActivity ? (
                            <div className="activity-edit-form">
                                <div className="input-group full-width"><label>Título</label><input type="text" name="title" value={tempActivityData.title} onChange={handleActivityChange} /></div>
                                <div className="expense-row">
                                    <div className="input-group"><label>Fecha</label><input type="date" name="date" value={tempActivityData.date} onChange={handleActivityChange} /></div>
                                    <div className="input-group"><label>Hora</label><input type="time" name="time" value={tempActivityData.time} onChange={handleActivityChange} /></div>
                                </div>
                                <div className="input-group full-width"><label>Ubicación</label><input type="text" name="location" value={tempActivityData.location} onChange={handleActivityChange} /></div>
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

            {/* MODAL NUEVA ACTIVIDAD */}
            {showAddActivityModal && (
                <div className="modal-overlay" onClick={() => setShowAddActivityModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="activity-modal-header"><h3>Nueva Actividad</h3><button className="btn-close-modal" onClick={() => setShowAddActivityModal(false)}>&times;</button></div>
                        <form onSubmit={handleAddActivitySubmit} className="activity-edit-form">
                            <div className="input-group full-width"><label>Título</label><input type="text" name="title" value={newActivity.title} onChange={handleNewActivityChange} required /></div>
                            <div className="expense-row">
                                <div className="input-group"><label>Fecha</label><input type="date" name="date" value={newActivity.date} onChange={handleNewActivityChange} required /></div>
                                <div className="input-group"><label>Hora</label><input type="time" name="time" value={newActivity.time} onChange={handleNewActivityChange} /></div>
                            </div>
                            <div className="input-group full-width"><label>Ubicación</label><input type="text" name="location" value={newActivity.location} onChange={handleNewActivityChange} placeholder="¿Dónde es?" /></div>
                            <div className="input-group full-width"><label>Descripción</label><textarea name="desc" rows="3" value={newActivity.desc} onChange={handleNewActivityChange}></textarea></div>
                            <div className="modal-actions-itinerary">
                                <button type="button" className="btn-modal-cancel" onClick={() => setShowAddActivityModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-modal-confirm">Crear Actividad</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL GASTOS */}
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
                                    <label>¿Cómo se divide?</label>
                                    <select name="splitMethod" value={expenseData.splitMethod} onChange={handleExpenseChange}>
                                        <option value="equally">Partes iguales</option>
                                        <option value="custom">Personalizado</option>
                                    </select>
                                </div>
                            </div>
                            {expenseData.splitMethod === "custom" && (
                                <div className="custom-split-container">
                                    <div className="checkbox-grid">
                                        {allParticipants.map((p, i) => (
                                            <label key={i} className="checkbox-label">
                                                <input type="checkbox" checked={expenseData.splitWith.includes(p)} onChange={() => handleCheckboxChange(p)} />
                                                <div className="custom-checkbox"></div> {p}
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