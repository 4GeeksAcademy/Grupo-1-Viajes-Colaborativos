import React, { useState } from "react";
import { useParams } from "react-router-dom"; // <-- Necesario para obtener el ID del viaje
import "../styles/ItineraryTab.css";

export const ItineraryTab = ({ tripItinerary, setTripItinerary }) => {
    const { id } = useParams(); // Obtenemos el ID de la URL

    // Estados internos solo para esta pestaña
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [isEditingActivity, setIsEditingActivity] = useState(false);
    const [tempActivityData, setTempActivityData] = useState(null);
    const [showAddActivityModal, setShowAddActivityModal] = useState(false);
    const [loading, setLoading] = useState(false); // Para mostrar "Guardando..."
    
    const today = new Date().toISOString().split('T')[0];
    
    // ALINEADO CON LA BASE DE DATOS: title, destination, hour, starting_date, notes
    const [newActivity, setNewActivity] = useState({ 
        starting_date: today, 
        hour: "12:00", 
        title: "", 
        destination: "", 
        notes: "" 
    });

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
        // (Nota: La edición al backend la dejaremos para el siguiente paso, por ahora se queda en local)
        setTripItinerary(tripItinerary.map(item => item.id === selectedActivity.id ? tempActivityData : item));
        setSelectedActivity(tempActivityData); 
        setIsEditingActivity(false);
    };

    const handleNewActivityChange = (e) => {
        setNewActivity({ ...newActivity, [e.target.name]: e.target.value });
    };

    // --- LA FUNCIÓN MÁGICA CONECTADA AL BACKEND ---
    const handleAddActivitySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem("token");

        try {
            // Enviamos el paquete exacto que espera routes.py
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/new-activity/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(newActivity)
            });

            if (response.ok) {
                const data = await response.json();
                
                // Añadimos la actividad devuelta por el servidor a la lista y ordenamos por fecha
                const updatedItinerary = [...tripItinerary, data.itinerary].sort((a, b) => new Date(a.starting_date) - new Date(b.starting_date));
                
                setTripItinerary(updatedItinerary);
                setShowAddActivityModal(false); 
                
                // Reseteamos el formulario
                setNewActivity({ starting_date: today, hour: "12:00", title: "", destination: "", notes: "" });
            } else {
                const errorData = await response.json();
                alert("Error al guardar: " + (errorData.message || "Error desconocido"));
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor.");
        } finally {
            setLoading(false);
        }
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
                                    <span className="day-badge">{formatDateDisplay(item.starting_date)}</span>
                                    <span className="time-tag">{item.hour}</span>
                                    <h3>{item.title}</h3>
                                    <p>{item.notes}</p>
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
                            <span className="day-badge">{formatDateDisplay(tempActivityData.starting_date)}</span>
                            <button className="btn-close-modal" onClick={() => setSelectedActivity(null)}>&times;</button>
                        </div>
                        {isEditingActivity ? (
                            <div className="activity-edit-form">
                                <div className="input-group full-width"><label>Título</label><input type="text" name="title" value={tempActivityData.title} onChange={handleActivityChange} /></div>
                                <div className="expense-row">
                                    <div className="input-group"><label>Fecha</label><input type="date" name="starting_date" value={tempActivityData.starting_date} onChange={handleActivityChange} /></div>
                                    <div className="input-group"><label>Hora</label><input type="time" name="hour" value={tempActivityData.hour} onChange={handleActivityChange} /></div>
                                </div>
                                <div className="input-group full-width"><label>Ubicación</label><input type="text" name="destination" value={tempActivityData.destination} onChange={handleActivityChange} /></div>
                                <div className="input-group full-width"><label>Descripción</label><textarea name="notes" rows="3" value={tempActivityData.notes} onChange={handleActivityChange}></textarea></div>
                                <div className="modal-actions-itinerary">
                                    <button className="btn-modal-cancel" onClick={() => setIsEditingActivity(false)}>Cancelar</button>
                                    <button className="btn-modal-confirm" onClick={saveActivityChanges}>Guardar</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="activity-main-info">
                                    <h2>{selectedActivity.title}</h2>
                                    <div className="info-row"><i className="fa-regular fa-clock"></i> {selectedActivity.hour}</div>
                                    <div className="info-row"><i className="fa-solid fa-location-dot"></i> {selectedActivity.destination}</div>
                                </div>
                                <div className="activity-description"><h4>Descripción</h4><p>{selectedActivity.notes}</p></div>
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
                            <div className="input-group full-width">
                                <label>Título</label>
                                <input type="text" name="title" value={newActivity.title} onChange={handleNewActivityChange} required />
                            </div>
                            <div className="expense-row">
                                <div className="input-group">
                                    <label>Fecha</label>
                                    <input type="date" name="starting_date" value={newActivity.starting_date} onChange={handleNewActivityChange} required />
                                </div>
                                <div className="input-group">
                                    <label>Hora</label>
                                    <input type="time" name="hour" value={newActivity.hour} onChange={handleNewActivityChange} required />
                                </div>
                            </div>
                            <div className="input-group full-width">
                                <label>Ubicación</label>
                                <input type="text" name="destination" value={newActivity.destination} onChange={handleNewActivityChange} required />
                            </div>
                            <div className="input-group full-width">
                                <label>Descripción</label>
                                <textarea name="notes" rows="3" value={newActivity.notes} onChange={handleNewActivityChange}></textarea>
                            </div>
                            <div className="modal-actions-itinerary">
                                <button type="button" className="btn-modal-cancel" onClick={() => setShowAddActivityModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-modal-confirm" disabled={loading}>
                                    {loading ? "Guardando..." : "Crear Actividad"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};