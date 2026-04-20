import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/NewTrip.css"; 

export const NewTrip = () => {
    const navigate = useNavigate();
    
    const [trip, setTrip] = useState({
        title: "",
        destination: "",
        starting_date: "",
        ending_date: "",
        state: "PLANNING", 
        budget: "",
        notes: "",
        users: "",
        image_url: "" // 📸 NUEVO ESTADO PARA LA IMAGEN
    });

    const handleChange = (e) => {
        setTrip({ ...trip, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const emailsArray = trip.users
            .split(",")
            .map(email => email.trim())
            .filter(email => email !== "");

        const payload = {
            title: String(trip.title),
            destination: String(trip.destination),
            state: String(trip.state), 
            starting_date: String(trip.starting_date),
            ending_date: String(trip.ending_date),
            budget: String(trip.budget),
            notes: String(trip.notes),
            users: emailsArray,
            image_url: String(trip.image_url) // 📸 ENVIAMOS LA IMAGEN
        };

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/new_trip`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                navigate(`/trip-details/${data.trip.id}`);
            } else {
                const errorData = await response.json();
                alert(`Rigo dice: ${errorData.message}`); 
            }
        } catch (error) {
            console.error("Error de conexión:", error);
        }
    };

    return (
        <div className="new-trip-wrapper">
            <div className="new-trip-container">
                
                {/* 🛠️ FIX: Botón de volver a prueba de balas usando Link y zIndex máximo */}
                <Link 
                    to="/my-trips" 
                    className="btn-back" 
                    style={{ 
                        cursor: "pointer", 
                        position: "relative", 
                        zIndex: 9999, 
                        display: "inline-block",
                        textDecoration: "none" 
                    }}
                >
                    <i className="fa-solid fa-arrow-left"></i> Volver a Mis Viajes
                </Link>

                <div className="new-trip-card">
                    <div className="card-header">
                        <h2>Planifica una nueva aventura</h2>
                        <p>El primer paso de tu próximo gran viaje comienza aquí.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="new-trip-form">
                        
                        <div className="input-group">
                            <label>Nombre del Viaje (Título)</label>
                            <input 
                                type="text" 
                                name="title"
                                placeholder="Ej. Aventura en Roma" 
                                value={trip.title}
                                onChange={handleChange}
                                required 
                            />
                        </div>

                        <div className="input-group">
                            <label>¿A dónde vamos? (Destino)</label>
                            <input 
                                type="text" 
                                name="destination"
                                placeholder="Ej. Italia" 
                                value={trip.destination}
                                onChange={handleChange}
                                required 
                            />
                        </div>

                        <div className="dates-row" style={{ display: 'flex', gap: '20px' }}>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label>Fecha de inicio</label>
                                <input 
                                    type="date" 
                                    name="starting_date"
                                    value={trip.starting_date}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label>Fecha de regreso</label>
                                <input 
                                    type="date" 
                                    name="ending_date"
                                    value={trip.ending_date}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Presupuesto Total Estimado (€)</label>
                            <input 
                                type="number" 
                                name="budget"
                                placeholder="Ej. 1500" 
                                value={trip.budget}
                                onChange={handleChange}
                                required 
                                min="0"
                                step="0.01"
                            />
                        </div>

                        {/* 📸 NUEVO CAMPO VISUAL PARA LA IMAGEN */}
                        <div className="input-group">
                            <label>Foto de portada (Enlace de la imagen)</label>
                            <input 
                                type="url" 
                                name="image_url"
                                placeholder="Pega el link (Ej: https://unsplash.com/.../foto.jpg)" 
                                value={trip.image_url}
                                onChange={handleChange}
                            />
                            <small style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "5px", display: "block" }}>
                                Opcional. Pega el enlace de una imagen para darle color a tu viaje.
                            </small>
                        </div>

                        <div className="input-group">
                            <label>Estado del viaje</label>
                            <select name="state" value={trip.state} onChange={handleChange}>
                                <option value="PLANNING">Planificando (Aún viendo detalles)</option>
                                <option value="ONGOING">En curso (¡Billetes comprados!)</option>
                                <option value="FINISHED">Finalizado (Viaje terminado)</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Invita a tus compañeros (Opcional)</label>
                            <input 
                                type="text" 
                                name="users"
                                placeholder="pepe@gmail.com, maria@hotmail.com" 
                                value={trip.users}
                                onChange={handleChange}
                            />
                            <small style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "5px", display: "block" }}>
                                Separa los correos electrónicos con comas. Deben estar registrados en la app.
                            </small>
                        </div>

                        <div className="input-group">
                            <label>Notas de planificación (Obligatorio)</label>
                            <textarea 
                                name="notes"
                                placeholder="Ideas iniciales, cosas que no olvidar..." 
                                value={trip.notes}
                                onChange={handleChange}
                                required
                                rows="3"
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ced4da" }}
                            ></textarea>
                        </div>

                        <button type="submit" className="btn-create-trip" style={{ marginTop: "20px" }}>
                            <i className="fa-solid fa-plane-departure"></i> Comenzar Aventura
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};