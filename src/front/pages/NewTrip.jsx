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
        image_url: "" // 📸 AQUÍ GUARDAREMOS LA URL O EL BASE64
    });

    const [isUploadingFile, setIsUploadingFile] = useState(false); // Alternar entre URL y Archivo
    const [fileName, setFileName] = useState(""); // Solo para mostrar el nombre visualmente

    const handleChange = (e) => {
        setTrip({ ...trip, [e.target.name]: e.target.value });
    };

    // 📸 MANEJADOR PARA CONVERTIR ARCHIVO A BASE64
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                setTrip({ ...trip, image_url: reader.result }); 
            };
        }
    };

    // 🔄 LIMPIAR EL CAMPO AL CAMBIAR DE MODO
    const toggleImageMode = (mode) => {
        setIsUploadingFile(mode);
        setTrip({ ...trip, image_url: "" });
        setFileName("");
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
            image_url: String(trip.image_url) // 📸 ENVIAMOS LA IMAGEN AL BACKEND
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

                        {/* 📸 NUEVO COMPONENTE DUAL PARA LA FOTO DE PORTADA */}
                        <div className="input-group" style={{ background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                <span><i className="fa-solid fa-image" style={{ color: "var(--brand-teal)", marginRight: "5px" }}></i> Foto de portada (Opcional)</span>
                                
                                {/* Pestañas para cambiar el modo */}
                                <div style={{ display: "flex", gap: "5px", background: "#e2e8f0", padding: "3px", borderRadius: "6px" }}>
                                    <button 
                                        type="button" 
                                        onClick={() => toggleImageMode(false)}
                                        style={{ padding: "5px 10px", fontSize: "0.75rem", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", background: !isUploadingFile ? "white" : "transparent", color: !isUploadingFile ? "var(--brand-navy)" : "#64748b", boxShadow: !isUploadingFile ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
                                    >
                                        Pegar URL
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => toggleImageMode(true)}
                                        style={{ padding: "5px 10px", fontSize: "0.75rem", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", background: isUploadingFile ? "white" : "transparent", color: isUploadingFile ? "var(--brand-navy)" : "#64748b", boxShadow: isUploadingFile ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
                                    >
                                        Subir Archivo
                                    </button>
                                </div>
                            </label>

                            {/* MODO 1: PEGAR URL */}
                            {!isUploadingFile && (
                                <input 
                                    type="url" 
                                    name="image_url"
                                    placeholder="Ej: https://unsplash.com/.../foto.jpg" 
                                    value={trip.image_url}
                                    onChange={handleChange}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            )}

                            {/* MODO 2: SUBIR ARCHIVO */}
                            {isUploadingFile && (
                                <div style={{ position: "relative" }}>
                                    <input 
                                        type="file" 
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleFileChange}
                                        onClick={(e) => { e.target.value = null; }} 
                                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px dashed #94a3b8", cursor: "pointer", background: "white" }}
                                    />
                                    {fileName && (
                                        <p style={{ margin: "10px 0 0 0", fontSize: "0.85rem", color: "var(--brand-teal)", fontWeight: "bold" }}>
                                            <i className="fa-solid fa-check-circle"></i> Archivo listo: {fileName}
                                        </p>
                                    )}
                                </div>
                            )}
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