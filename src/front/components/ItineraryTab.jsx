import React, { useState } from "react";
import "../styles/ItineraryTab.css"; // <-- La línea mágica para el itinerario

export const ItineraryTab = ({ tripItinerary, setTripItinerary }) => {
    // Estados internos solo para esta pestaña
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [isEditingActivity, setIsEditingActivity] = useState(false);
    const [tempActivityData, setTempActivityData] = useState(null);
    const [showAddActivityModal, setShowAddActivityModal] = useState(false);
    
    const today = new Date().toISOString().split('T')[0];
    const [newActivity, setNewActivity] = useState({ date: today, time: "12:00", title: "", location: "", desc: "" });

    // Función de formateo de fecha
    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Funciones de control
    const openActivityModal = (activity) => { 
        setSelectedActivity(activity); 
        setTempActivityData({ ...activity }); 
        setIsEditingActivity(false); 
    };
    
    const handleActivityChange = (e) => {
        setTempActivityData({ ...tempActivityData, [e.target.name]: e.target.value });
    };
    
    const saveActivityChanges = () => {
        setTripItinerary(tripItinerary.map(item => item.title === selectedActivity.title ? tempActivityData : item));
        setSelectedActivity(tempActivityData); 
        setIsEditingActivity(false);
    };

    const handleNewActivityChange = (e) => {
        setNewActivity({ ...newActivity, [e.target.name]: e.target.value });
    };

    const handleAddActivitySubmit = (e) => {
        e.preventDefault();
        setTripItinerary([...tripItinerary, newActivity].sort((a, b) => new Date(a.date) - new Date(b.date)));
        setShowAddActivityModal(false); 
        setNewActivity({ date: today, time: "12:00", title: "", location: "", desc: "" });
    };

    return (
        <>
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
                    <p style={{ color: "#64748b", margin: "20px 0" }}>Aún no hay actividades planeadas.</p> 
                )}
                <button className="btn-add-day" onClick={() => setShowAddActivityModal(true)}>
                    <i className="fa-solid fa-plus"></i> Añadir actividad
                </button>
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
                            <div className="input-group full-width"><label>Ubicación</label><input type="text" name="location" value={newActivity.location} onChange={handleNewActivityChange} /></div>
                            <div className="input-group full-width"><label>Descripción</label><textarea name="desc" rows="3" value={newActivity.desc} onChange={handleNewActivityChange}></textarea></div>
                            <div className="modal-actions-itinerary">
                                <button type="button" className="btn-modal-cancel" onClick={() => setShowAddActivityModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-modal-confirm">Crear Actividad</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};