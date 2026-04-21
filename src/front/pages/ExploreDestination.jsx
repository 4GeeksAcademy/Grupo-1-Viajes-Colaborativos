import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const ExploreDestination = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [places, setPlaces] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- FUNCIÓN PARA LIMPIAR ETIQUETAS HTML ---
    const stripHtml = (htmlString) => {
        if (!htmlString) return "";
        return htmlString.replace(/<\/?[^>]+(>|$)/g, ""); // Borra cualquier cosa entre < y >
    };

    // --- FUNCIÓN PARA BUSCAR (VERSIÓN MOCK / DATOS FALSOS) ---
    const handleSearch = async (e) => {
        e.preventDefault();
        
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setError(null);

        /* =================================================================
           ⬇️ CÓDIGO REAL DE LA API (COMENTADO PARA NO GASTAR CUOTA) ⬇️
           ================================================================= 
        const url = `https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchLocation?query=${encodeURIComponent(searchQuery)}`;
        
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': import.meta.env.VITE_RAPIDAPI_KEY,
                'x-rapidapi-host': import.meta.env.VITE_RAPIDAPI_HOST
            }
        };

        try {
            const response = await fetch(url, options);
            
            if (response.status === 429) {
                throw new Error("Límite de búsquedas alcanzado (Error 429). Espera un minuto.");
            }
            if (!response.ok) {
                throw new Error("No se pudo conectar con el servidor de TripAdvisor");
            }

            const result = await response.json();
            const rawData = result.data || result;

            if (Array.isArray(rawData) && rawData.length > 0) {
                const formattedPlaces = rawData.slice(0, 9).map((item, index) => {
                    const rawName = item.title || item.name || (item.result_object && item.result_object.name) || "Destino desconocido";
                    const cleanName = stripHtml(rawName);
                    
                    let imageUrl = `https://source.unsplash.com/500x300/?${encodeURIComponent(cleanName)}`;
                    if (item.image?.url) {
                        imageUrl = item.image.url;
                    } else if (item.result_object?.photo?.images?.medium?.url) {
                        imageUrl = item.result_object.photo.images.medium.url;
                    }

                    return {
                        id: item.locationId || item.geoId || item.id || index.toString(),
                        name: cleanName,
                        category: stripHtml(item.secondaryText || item.result_type || "Ubicación"),
                        rating: item.rating || (item.result_object && item.result_object.rating) || "N/A",
                        image: imageUrl,
                        description: stripHtml(item.geo_description || (item.result_object && item.result_object.geo_description) || "Un lugar increíble que debes explorar en tu próximo viaje.")
                    };
                });

                setPlaces(formattedPlaces);
            } else {
                setError("No encontramos resultados para tu búsqueda. Intenta con otra ciudad.");
                setPlaces([]);
            }

        } catch (error) {
            console.error("Error en la petición:", error);
            setError(error.message || "Hubo un problema al buscar los destinos.");
        } finally {
            setIsLoading(false);
        }
        =================================================================
        ⬆️ FIN DEL CÓDIGO REAL ⬆️
        ================================================================= */

        // =================================================================
        // ⬇️ CÓDIGO DE PRUEBA (DATOS FALSOS ACTIVADOS) ⬇️
        // =================================================================
        setTimeout(() => {
            const fakeCities = [
                {
                    id: "293984", // ID real falso de Tel Aviv
                    name: "Tel Aviv (Prueba)",
                    category: "Ciudad",
                    rating: "4.8",
                    image: "https://images.unsplash.com/photo-1544669527-31835742110c?w=500&q=80",
                    description: "Una vibrante ciudad costera conocida por su arquitectura Bauhaus, playas soleadas y animada vida nocturna."
                },
                {
                    id: "187147", // ID real falso de París
                    name: "París Central",
                    category: "Capital",
                    rating: "4.9",
                    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80",
                    description: "La ciudad de la luz y el amor. Explora la Torre Eiffel, el museo del Louvre y disfruta de la alta gastronomía."
                },
                {
                    id: "274707", // ID real falso de Kioto
                    name: "Kioto Tradicional",
                    category: "Prefectura",
                    rating: "4.7",
                    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&q=80",
                    description: "El corazón cultural de Japón. Famoso por sus templos budistas clásicos, jardines y santuarios sintoístas."
                }
            ];
            
            setPlaces(fakeCities);
            setIsLoading(false);
        }, 1000); 
        // =================================================================
        // ⬆️ FIN DEL CÓDIGO DE PRUEBA ⬆️
        // =================================================================
    };

    return (
        <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto", marginTop: "80px", fontFamily: "'Poppins', sans-serif" }}>
            
            {/* Botón para volver */}
            <button 
                onClick={() => navigate("/my-trips")}
                style={{ 
                    background: "none", 
                    border: "none", 
                    color: "var(--brand-navy, #1E3A5F)", 
                    cursor: "pointer", 
                    fontSize: "1rem", 
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: "600"
                }}
            >
                <i className="fa-solid fa-arrow-left"></i> Volver a Mis Viajes
            </button>

            {/* CABECERA Y BUSCADOR */}
            <div style={{ textAlign: "center", marginBottom: "50px" }}>
                <h1 style={{ color: "var(--brand-navy, #1E3A5F)", fontSize: "2.5rem", marginBottom: "15px" }}>
                    Descubre el Mundo (Modo Prueba 🛠️)
                </h1>
                <p style={{ color: "#64748b", fontSize: "1.1rem", marginBottom: "30px" }}>
                    Encuentra ciudades, atracciones y hoteles para tu próxima aventura sin gastar cuota de la API.
                </p>

                <form onSubmit={handleSearch} style={{ display: "flex", justifyContent: "center", gap: "10px", maxWidth: "600px", margin: "0 auto" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <i className="fa-solid fa-location-dot" style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
                        <input 
                            type="text" 
                            placeholder="Ej. Madrid, Tokio, Roma..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ 
                                width: "100%", 
                                padding: "15px 15px 15px 45px", 
                                borderRadius: "30px", 
                                border: "1px solid #e2e8f0",
                                fontSize: "1rem",
                                outline: "none",
                                boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
                            }}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        style={{ 
                            padding: "15px 30px", 
                            borderRadius: "30px", 
                            border: "none", 
                            background: "var(--brand-teal, #2EC4B6)", 
                            color: "white", 
                            fontWeight: "bold",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? "Buscando..." : "Buscar"}
                    </button>
                </form>
            </div>

            {/* ÁREA DE RESULTADOS */}
            <div>
                {error && <div style={{ color: "#e74c3c", textAlign: "center", marginBottom: "20px", padding: "15px", background: "#fdecea", borderRadius: "8px" }}>{error}</div>}

                {places.length > 0 && (
                    <>
                        <h2 style={{ color: "var(--brand-navy, #1E3A5F)", marginBottom: "25px", fontSize: "1.5rem" }}>
                            Resultados simulados para "{searchQuery}"
                        </h2>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "25px" }}>
                            {places.map((place) => (
                                <div key={place.id} style={{ 
                                    background: "white", 
                                    borderRadius: "16px", 
                                    overflow: "hidden", 
                                    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                                    transition: "transform 0.3s ease",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column"
                                }}
                                onClick={() => navigate(`/destination-details/${place.id}/${encodeURIComponent(place.name)}`)}
                                >
                                    {/* Imagen del lugar */}
                                    <div style={{ height: "200px", width: "100%", position: "relative" }}>
                                        <img 
                                            src={place.image} 
                                            alt={place.name} 
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=500&q=80" }}
                                        />
                                        {place.rating !== "N/A" && (
                                            <span style={{ 
                                                position: "absolute", 
                                                top: "15px", 
                                                right: "15px", 
                                                background: "rgba(255,255,255,0.9)", 
                                                padding: "5px 10px", 
                                                borderRadius: "20px",
                                                fontSize: "0.85rem",
                                                fontWeight: "bold",
                                                color: "var(--brand-navy, #1E3A5F)",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "5px"
                                            }}>
                                                <i className="fa-solid fa-star" style={{ color: "#f1c40f" }}></i> {place.rating}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info del lugar */}
                                    <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                                        <span style={{ fontSize: "0.8rem", color: "var(--brand-teal, #2EC4B6)", fontWeight: "bold", textTransform: "uppercase" }}>
                                            {place.category}
                                        </span>
                                        <h3 style={{ color: "var(--brand-navy, #1E3A5F)", fontSize: "1.2rem", margin: "10px 0" }}>
                                            {place.name}
                                        </h3>
                                        <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "20px", flex: 1 }}>
                                            {place.description.length > 100 ? place.description.substring(0, 100) + "..." : place.description}
                                        </p>
                                        <button style={{ 
                                            width: "100%", 
                                            padding: "10px", 
                                            borderRadius: "8px", 
                                            border: "1px solid #e2e8f0", 
                                            background: "transparent",
                                            color: "var(--brand-navy, #1E3A5F)",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            marginTop: "auto"
                                        }}>
                                            Ver puntos de interés
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};