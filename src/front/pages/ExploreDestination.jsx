import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const ExploreDestination = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [places, setPlaces] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- DATOS POR DEFECTO PARA LLENAR EL ESPACIO EN BLANCO ---
    const popularDestinations = [
        { id: "298184", name: "Tokio", category: "Japón", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&q=80", description: "Una metrópolis que mezcla lo ultramoderno con lo tradicional." },
        { id: "187147", name: "París", category: "Francia", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80", description: "La ciudad de la luz. Arte, gastronomía y paseos inolvidables por el Sena." },
        { id: "60763", name: "Nueva York", category: "EE.UU.", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=500&q=80", description: "La ciudad que nunca duerme. Rascacielos, Central Park y Broadway." },
        { id: "297701", name: "Bali", category: "Indonesia", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&q=80", description: "El paraíso terrenal. Playas increíbles, templos sagrados y selvas exuberantes." }
    ];

    // --- FUNCIÓN PARA LIMPIAR ETIQUETAS HTML ---
    const stripHtml = (htmlString) => {
        if (!htmlString) return "";
        return htmlString.replace(/<\/?[^>]+(>|$)/g, ""); 
    };

    // --- FUNCIÓN PARA BUSCAR (SOLO SE EJECUTA AL DARLE A BUSCAR O ENTER) ---
    const handleSearch = async (e) => {
        e.preventDefault(); 
        
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setError(null);

        // Simulamos el tiempo de carga de la API
        setTimeout(() => {
            const fakeCities = [
                {
                    id: "293984", 
                    name: `${searchQuery} (Prueba)`,
                    category: "Ciudad Encontrada",
                    rating: "4.8",
                    image: `https://source.unsplash.com/500x300/?${encodeURIComponent(searchQuery)},city`,
                    description: `Explora los mejores rincones, restaurantes y hoteles de ${searchQuery}.`
                }
            ];
            
            setPlaces(fakeCities);
            setIsLoading(false);
        }, 1200); 
    };

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            
            {/* HERO SECTION CON FONDO DINÁMICO */}
            <div style={{ 
                position: "relative",
                backgroundImage: `linear-gradient(rgba(30, 58, 95, 0.7), rgba(30, 58, 95, 0.8)), url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1920&q=80')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                padding: "120px 20px 80px", 
                textAlign: "center",
                color: "white"
            }}>
                {/* Botón Volver (Posición absoluta arreglada para no chocar con Navbar) */}
                <button 
                    onClick={() => navigate("/my-trips")}
                    style={{ 
                        position: "absolute",
                        top: "90px",
                        left: "5%",
                        background: "rgba(255, 255, 255, 0.15)", 
                        border: "1px solid rgba(255, 255, 255, 0.3)", 
                        color: "white", 
                        cursor: "pointer", 
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "0.9rem", 
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        fontWeight: "bold",
                        transition: "all 0.2s ease",
                        backdropFilter: "blur(4px)",
                        zIndex: 10
                    }}
                    onMouseOver={(e) => e.target.style.background = "rgba(255, 255, 255, 0.25)"}
                    onMouseOut={(e) => e.target.style.background = "rgba(255, 255, 255, 0.15)"}
                >
                    <i className="fa-solid fa-arrow-left"></i> Volver
                </button>

                <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
                    <h1 style={{ fontSize: "3rem", marginBottom: "15px", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                        Descubre el Mundo <span style={{fontSize: "1.5rem"}}></span>
                    </h1>
                    <p style={{ fontSize: "1.2rem", marginBottom: "40px", color: "#e2e8f0", maxWidth: "700px", margin: "0 auto 40px" }}>
                        Encuentra ciudades, atracciones y hoteles para tu próxima aventura sin gastar cuota de la API.
                    </p>

                    <form onSubmit={handleSearch} style={{ display: "flex", justifyContent: "center", gap: "10px", maxWidth: "700px", margin: "0 auto" }}>
                        <div style={{ position: "relative", flex: 1 }}>
                            <i className="fa-solid fa-location-dot" style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "1.2rem" }}></i>
                            <input 
                                type="text" 
                                placeholder="Ej. Madrid, Tokio, Roma..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                style={{ 
                                    width: "100%", 
                                    padding: "20px 20px 20px 50px", 
                                    borderRadius: "30px", 
                                    border: "none",
                                    fontSize: "1.1rem",
                                    outline: "none",
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                                }}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            style={{ 
                                padding: "0 35px", 
                                borderRadius: "30px", 
                                border: "none", 
                                background: "var(--brand-teal, #2EC4B6)", 
                                color: "white", 
                                fontSize: "1.1rem",
                                fontWeight: "bold",
                                cursor: isLoading ? "not-allowed" : "pointer",
                                boxShadow: "0 10px 25px rgba(46, 196, 182, 0.3)",
                                transition: "transform 0.2s, background 0.2s",
                                opacity: isLoading ? 0.8 : 1
                            }}
                            onMouseOver={(e) => !isLoading && (e.target.style.transform = "scale(1.05)")}
                            onMouseOut={(e) => !isLoading && (e.target.style.transform = "scale(1)")}
                        >
                            {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : "Buscar"}
                        </button>
                    </form>
                </div>
            </div>

            {/* ÁREA DE RESULTADOS Y ESPACIO EN BLANCO */}
            <div style={{ padding: "50px 20px", maxWidth: "1200px", margin: "0 auto", flex: 1, width: "100%" }}>
                
                {error && <div style={{ color: "#e74c3c", textAlign: "center", marginBottom: "20px", padding: "15px", background: "#fdecea", borderRadius: "8px", border: "1px solid #f5b7b1" }}>{error}</div>}

                {/* DESTINOS POPULARES */}
                {!isLoading && places.length === 0 && !error && (
                    <div>
                        <h2 style={{ color: "var(--brand-navy, #1E3A5F)", marginBottom: "30px", fontSize: "1.8rem", textAlign: "center" }}>
                            Destinos Populares para Inspirarte
                        </h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "25px" }}>
                            {popularDestinations.map((dest) => (
                                <div key={dest.id} style={{ 
                                    background: "white", 
                                    borderRadius: "16px", 
                                    overflow: "hidden", 
                                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                                    cursor: "pointer",
                                    transition: "transform 0.3s ease",
                                    border: "1px solid #f1f5f9"
                                }}
                                onClick={() => navigate(`/destination-details/${dest.id}/${encodeURIComponent(dest.name)}`)}
                                onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                                >
                                    <div style={{ height: "180px", width: "100%" }}>
                                        <img src={dest.image} alt={dest.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </div>
                                    <div style={{ padding: "20px" }}>
                                        <span style={{ fontSize: "0.75rem", color: "var(--brand-teal)", fontWeight: "bold", textTransform: "uppercase" }}>{dest.category}</span>
                                        <h3 style={{ color: "var(--brand-navy)", fontSize: "1.3rem", margin: "5px 0 10px" }}>{dest.name}</h3>
                                        <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>{dest.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* RESULTADOS DE LA BÚSQUEDA */}
                {places.length > 0 && (
                    <div>
                        <h2 style={{ color: "var(--brand-navy, #1E3A5F)", marginBottom: "25px", fontSize: "1.8rem" }}>
                            Resultados para "{searchQuery}"
                        </h2>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "30px" }}>
                            {places.map((place) => (
                                <div key={place.id} style={{ 
                                    background: "white", 
                                    borderRadius: "16px", 
                                    overflow: "hidden", 
                                    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    border: "1px solid #f1f5f9"
                                }}
                                onClick={() => navigate(`/destination-details/${place.id}/${encodeURIComponent(place.name)}`)}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = "translateY(-5px)";
                                    e.currentTarget.style.boxShadow = "0 15px 30px rgba(0,0,0,0.1)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.05)";
                                }}
                                >
                                    <div style={{ height: "220px", width: "100%", position: "relative" }}>
                                        <img 
                                            src={place.image} 
                                            alt={place.name} 
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=500&q=80" }}
                                        />
                                        {place.rating !== "N/A" && (
                                            <span style={{ 
                                                position: "absolute", top: "15px", right: "15px", background: "rgba(255,255,255,0.95)", 
                                                padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "bold", color: "var(--brand-navy)",
                                                display: "flex", alignItems: "center", gap: "5px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
                                            }}>
                                                <i className="fa-solid fa-star" style={{ color: "#f1c40f" }}></i> {place.rating}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                                        <span style={{ fontSize: "0.75rem", color: "var(--brand-teal)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>{place.category}</span>
                                        <h3 style={{ color: "var(--brand-navy)", fontSize: "1.3rem", margin: "8px 0 12px" }}>{place.name}</h3>
                                        <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "20px", flex: 1 }}>{place.description}</p>
                                        <button style={{ 
                                            width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc",
                                            color: "var(--brand-navy)", fontWeight: "600", cursor: "pointer", marginTop: "auto", transition: "background 0.2s"
                                        }}
                                        onMouseOver={(e) => e.target.style.background = "#e2e8f0"}
                                        onMouseOut={(e) => e.target.style.background = "#f8fafc"}
                                        >
                                            Ver puntos de interés
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};