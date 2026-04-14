import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NewTrip.css"; // Crearemos este archivo en el Paso 2

export const NewTrip = () => {
    const navigate = useNavigate();
    
    // Aquí guardaremos temporalmente lo que el usuario escriba
    const [trip, setTrip] = useState({
        title: "",
        startDate: "",
        endDate: "",
        status: "Planificando", // Por defecto
        imageUrl: "" 
    });

    const handleChange = (e) => {
        setTrip({ ...trip, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Por ahora solo lo mostramos en consola. ¡Más adelante lo enviaremos a Python!
        console.log("Viaje listo para guardar:", trip);
        
        // Simulamos que se guardó y devolvemos al usuario a su panel
        alert("¡Aventura creada con éxito! (Simulación)");
        navigate("/my-trips");
    };

    return (
        <div className="new-trip-wrapper">
            <div className="new-trip-container">
                
                {/* Botón para volver atrás */}
                <button className="btn-back" onClick={() => navigate("/my-trips")}>
                    <i className="fa-solid fa-arrow-left"></i> Volver a Mis Viajes
                </button>

                <div className="new-trip-card">
                    <div className="card-header">
                        <h2>Planifica una nueva aventura</h2>
                        <p>El primer paso de tu próximo gran viaje comienza aquí.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="new-trip-form">
                        
                        <div className="input-group">
                            <label>¿A dónde vamos? (Destino)</label>
                            <input 
                                type="text" 
                                name="title"
                                placeholder="Ej. Escapada a Kioto" 
                                value={trip.title}
                                onChange={handleChange}
                                required 
                            />
                        </div>

                        <div className="dates-row">
                            <div className="input-group">
                                <label>Fecha de inicio</label>
                                <input 
                                    type="date" 
                                    name="startDate"
                                    value={trip.startDate}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Fecha de regreso</label>
                                <input 
                                    type="date" 
                                    name="endDate"
                                    value={trip.endDate}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Estado del viaje</label>
                            <select name="status" value={trip.status} onChange={handleChange}>
                                <option value="Planificando">Planificando (Aún viendo detalles)</option>
                                <option value="En curso">En curso (¡Billetes comprados!)</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>URL de portada (Opcional)</label>
                            <input 
                                type="url" 
                                name="imageUrl"
                                placeholder="https://images.unsplash.com/..." 
                                value={trip.imageUrl}
                                onChange={handleChange}
                            />
                            <small>Pega el enlace de una imagen para que se vea en tu tarjeta.</small>
                        </div>

                        <button type="submit" className="btn-create-trip">
                            <i className="fa-solid fa-plane-departure"></i> Comenzar Aventura
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};