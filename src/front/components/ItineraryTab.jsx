import React, { useState } from "react";
import { useParams } from "react-router-dom"; 
import "../styles/ItineraryTab.css";

export const ItineraryTab = ({ tripItinerary, setTripItinerary }) => {
    const { id } = useParams(); 

    // Estados internos
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [isEditingActivity, setIsEditingActivity] = useState(false);
    const [tempActivityData, setTempActivityData] = useState(null);
    const [showAddActivityModal, setShowAddActivityModal] = useState(false);
    const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false); // 📸 NUEVO MODAL "VER TODO"
    const [loading, setLoading] = useState(false); 
    
    const today = new Date().toISOString().split('T')[0];
    
    const [newActivity, setNewActivity] = useState({ 
        starting_date: today, 
        hour: "12:00", 
        title: "", 
        destination: "", 
        notes: "" 
    });

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const openActivityModal = (activity) => { 
        setSelectedActivity(activity); 
        setTempActivityData({ ...activity }); 
        setIsEditingActivity(false); 
    };
    
    const handleActivityChange = (e) => {
        setTempActivityData({ ...tempActivityData, [e.target.name]: e.target.value });
    };
    
    const saveActivityChanges = () => {
        setTripItinerary(tripItinerary.map(item => item.id === selectedActivity.id ? tempActivityData : item));
        setSelectedActivity(tempActivityData); 
        setIsEditingActivity(false);
    };

    const handleNewActivityChange = (e) => {
        setNewActivity({ ...newActivity, [e.target.name]: e.target.value });
    };

    // --- AÑADIR ACTIVIDAD ---
    const handleAddActivitySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem("token");

        try {
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
                const updatedItinerary = [...tripItinerary, data.itinerary].sort((a, b) => new Date(a.starting_date) - new Date(b.starting_date));
                setTripItinerary(updatedItinerary);
                setShowAddActivityModal(false); 
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

    // --- 🗑️ ELIMINAR ACTIVIDAD ---
    const handleDeleteActivity = async (activityId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta actividad del itinerario?")) return;
        
        setLoading(true);
        const token = localStorage.getItem("token");

        try {
            // Asumimos que la ruta de tu backend es /api/activity/<id> (cámbiala si es diferente)
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/activity/${activityId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Actualizamos el estado local quitando la actividad borrada
                setTripItinerary(tripItinerary.filter(item => item.id !== activityId));
                setSelectedActivity(null); // Cerramos el modal
            } else {
                const errorData = await response.json();
                alert("Error al eliminar: " + (errorData.message || "Error desconocido"));
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor para eliminar.");
        } finally {
            setLoading(false);
        }
    };

    // Para la vista principal mostramos solo las 3 primeras actividades
    const previewItinerary = tripItinerary.slice(0, 3);

    return (
        <>
            <div className="itinerary-section">
                <h2>Plan de Viaje</h2>
                
                {tripItinerary.length > 0 ? (
                    <>
                        <div className="timeline">
                            {previewItinerary.map((item, index) => (
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
                        
                        {/* 📸 BOTÓN PARA VER TODO SI HAY MÁS DE 3 */}
                        {tripItinerary.length > 3 && (
                            <button 
                                className="btn-action" 
                                style={{ marginTop: "10px", marginBottom: "20px" }}
                                onClick={() => setShowAllActivitiesModal(true)}
                            >
                                <i className="fa-solid fa-list-ul"></i> Ver todo el itinerario ({tripItinerary.length})
                            </button>
                        )}
                    </>
                ) : ( 
                    <p style={{ color: "#64748b", margin: "20px 0" }}>Aún no hay actividades planeadas.</p> 
                )}
                
                <button className="btn-add-day" onClick={() => setShowAddActivityModal(true)}>
                    <i className="fa-solid fa-plus"></i> Añadir actividad
                </button>
            </div>

            {/* MODAL DETALLE/EDICIÓN ITINERARIO (CON BOTÓN DE BORRAR) */}
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
                                
                                <div className="modal-actions-itinerary" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                                    {/* 🗑️ BOTÓN ELIMINAR */}
                                    <button 
                                        onClick={() => handleDeleteActivity(selectedActivity.id)}
                                        disabled={loading}
                                        style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "10px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
                                    >
                                        <i className="fa-solid fa-trash"></i> {loading ? "..." : "Eliminar"}
                                    </button>
                                    
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="btn-edit-activity" onClick={() => setIsEditingActivity(true)}>Editar</button>
                                        <button className="btn-modal-confirm" onClick={() => setSelectedActivity(null)}>Cerrar</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* 📸 NUEVO MODAL: VER TODO EL ITINERARIO */}
            {showAllActivitiesModal && (
                <div className="modal-overlay" onClick={() => setShowAllActivitiesModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="activity-modal-header" style={{ marginBottom: "20px" }}>
                            <h3>Itinerario Completo</h3>
                            <button className="btn-close-modal" onClick={() => setShowAllActivitiesModal(false)}>&times;</button>
                        </div>
                        <div className="timeline">
                            {tripItinerary.map((item, index) => (
                                <div key={index} className="timeline-item clickable" onClick={() => {
                                    setShowAllActivitiesModal(false);
                                    openActivityModal(item);
                                }}>
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