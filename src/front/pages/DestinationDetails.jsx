import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export const DestinationDetails = () => {
    const { locationId, locationName } = useParams();
    const navigate = useNavigate();
    
    // Estados de API de TripAdvisor
    const [items, setItems] = useState([]);
    const [category, setCategory] = useState("restaurants"); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para la integración con Backend (Mis Viajes)
    const [userTrips, setUserTrips] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const stripHtml = (text) => {
        if (!text || typeof text !== 'string') return "";
        return text.replace(/<\/?[^>]+(>|$)/g, ""); 
    };

    // 1. CARGAR LOS VIAJES DEL USUARIO DESDE TU BACKEND (ESTO ES REAL)
    useEffect(() => {
        const fetchMyTrips = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trips`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserTrips(data.viajes || []);
                }
            } catch (error) {
                console.error("Error al cargar los viajes:", error);
            }
        };

        fetchMyTrips();
    }, []);

    // 2. BUSCAR DESTINOS (API REAL COMENTADA + MOCK ACTIVADO)
    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            setError(null);

            /* =================================================================
               ⬇️ CÓDIGO REAL DE LA API (COMENTADO PARA NO GASTAR CUOTA) ⬇️
               ================================================================= 
            const cleanId = locationId.toString().replace(/\D/g, "");
            let url = category === "restaurants" 
                ? `https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/searchRestaurants?locationId=${cleanId}`
                : `https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotels?geoId=${cleanId}&checkIn=2026-09-10&checkOut=2026-09-15&adults=2&pageNumber=1&currencyCode=USD`;
            
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
                    throw new Error("Límite de búsquedas alcanzado. Por favor, espera un minuto.");
                }
                
                const result = await response.json();
                const rawData = result.data?.data || result.data?.hotels || result.data || [];

                if (Array.isArray(rawData) && rawData.length > 0) {
                    const formatted = rawData.slice(0, 12).map(item => {
                        const title = stripHtml(item.title || item.name || "Lugar");
                        let imageUrl = category === "hotels" 
                            ? item.cardPhotos?.[0]?.sizes?.urlTemplate?.replace("{width}", "500").replace("{height}", "300") 
                            : item.heroImgUrl || item.mainPhotoSrc;
                        
                        const fallbackImage = `https://images.unsplash.com/photo-${category === 'hotels' ? '1566073771259-6a8506099945' : '1517248135467-4c7edcad34c4'}?w=500&q=80`;

                        return {
                            id: item.locationId || item.id,
                            title: title,
                            rating: item.averageRating || item.bubbleRating?.rating || "N/A",
                            reviews: item.userReviewCount || item.bubbleRating?.count || 0,
                            info: stripHtml(item.primaryInfo || item.secondaryInfo || category),
                            image: imageUrl || fallbackImage,
                            link: `https://www.tripadvisor.es/Search?q=${encodeURIComponent(title)}`
                        };
                    });
                    setItems(formatted);
                } else {
                    setError("No se encontraron resultados.");
                }
            } catch (err) {
                setError(err.message || "Error al conectar con TripAdvisor.");
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
                let fakeData = [];

                if (category === "restaurants") {
                    fakeData = [
                        {
                            id: "r1",
                            title: "La Taberna Gourmet (Prueba)",
                            rating: "4.8",
                            reviews: "342",
                            info: "Restaurante",
                            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80",
                            link: "https://www.tripadvisor.es/"
                        },
                        {
                            id: "r2",
                            title: "Pizzería Mamma Mia",
                            rating: "4.5",
                            reviews: "128",
                            info: "Restaurante Italiano",
                            image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80",
                            link: "https://www.tripadvisor.es/"
                        }
                    ];
                } else {
                    fakeData = [
                        {
                            id: "h1",
                            title: "Hotel Palace de Prueba",
                            rating: "4.7",
                            reviews: "892",
                            info: "Alojamiento",
                            image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80",
                            link: "https://www.tripadvisor.es/"
                        },
                        {
                            id: "h2",
                            title: "Hostal El Descanso",
                            rating: "4.2",
                            reviews: "105",
                            info: "Alojamiento",
                            image: "https://images.unsplash.com/photo-1551882547-ff40c0d5bf8f?w=500&q=80",
                            link: "https://www.tripadvisor.es/"
                        }
                    ];
                }
                
                setItems(fakeData);
                setIsLoading(false);
            }, 1000); 
            // =================================================================
            // ⬆️ FIN DEL CÓDIGO DE PRUEBA ⬆️
            // =================================================================

        };

        if (locationId) fetchDetails();
    }, [locationId, category]);

    // 3. ABRIR MODAL
    const handleOpenModal = (item) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Debes iniciar sesión para añadir lugares a tu viaje.");
            navigate("/login");
            return;
        }
        setSelectedItem(item);
        setShowModal(true);
    };

    // 4. GUARDAR EN EL BACKEND REAL (ESTO ES REAL Y CONECTARÁ CON TU DB)
    const saveToItinerary = async (trip) => {
        setIsSaving(true);
        const token = localStorage.getItem("token");

        const dateToUse = trip.starting_date || new Date().toISOString().split('T')[0];

        const payload = {
            title: selectedItem.title,
            destination: decodeURIComponent(locationName),
            starting_date: dateToUse,
            hour: "12:00", 
            notes: `${selectedItem.info} | Enlace: ${selectedItem.link}`
        };

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/new-activity/${trip.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert(`✅ ¡"${selectedItem.title}" añadido al itinerario de ${trip.title}!`);
                setShowModal(false);
            } else {
                const errorData = await response.json();
                alert(`Hubo un error: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Error al guardar la actividad:", error);
            alert("No se pudo conectar con el servidor.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "80px auto 0", fontFamily: "'Poppins', sans-serif", position: "relative" }}>
            
            <button onClick={() => navigate("/explore")} style={{ background: "none", border: "none", color: "#1E3A5F", cursor: "pointer", fontWeight: "bold", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-arrow-left"></i> Volver
            </button>

            <h1 style={{ color: "#1E3A5F", marginBottom: "5px" }}>Explorando {decodeURIComponent(locationName)}</h1>
            <p style={{ color: "#64748b", marginBottom: "30px" }}>Añade sitios directamente a tu itinerario. (Modo Pruebas Activado 🛠️)</p>
            
            <div style={{ display: "flex", gap: "20px", marginBottom: "30px", borderBottom: "2px solid #e2e8f0" }}>
                <button onClick={() => setCategory("restaurants")} style={{ padding: "15px 20px", background: "none", border: "none", cursor: "pointer", fontWeight: "bold", color: category === "restaurants" ? "#2EC4B6" : "#64748b", borderBottom: category === "restaurants" ? "3px solid #2EC4B6" : "3px solid transparent" }}>
                    🍴 Restaurantes
                </button>
                <button onClick={() => setCategory("hotels")} style={{ padding: "15px 20px", background: "none", border: "none", cursor: "pointer", fontWeight: "bold", color: category === "hotels" ? "#2EC4B6" : "#64748b", borderBottom: category === "hotels" ? "3px solid #2EC4B6" : "3px solid transparent" }}>
                    🏨 Hoteles
                </button>
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center", padding: "50px" }}><h3>Cargando opciones... 🔎</h3></div>
            ) : error ? (
                <div style={{ color: "#e74c3c", textAlign: "center", padding: "20px", background: "#fdecea", borderRadius: "8px" }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{marginRight: "10px"}}></i> {error}
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" }}>
                    {items.map((item, idx) => (
                        <div key={idx} style={{ background: "white", borderRadius: "15px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
                            <div style={{ height: "200px", overflow: "hidden" }}>
                                <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500"} />
                            </div>
                            <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                                <small style={{ color: "#2EC4B6", fontWeight: "bold", textTransform: "uppercase" }}>{item.info}</small>
                                <h4 style={{ margin: "10px 0", color: "#1E3A5F", fontSize: "1.1rem" }}>{item.title}</h4>
                                <div style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "20px" }}>⭐ {item.rating} ({item.reviews} opiniones)</div>
                                
                                <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <button 
                                        onClick={() => handleOpenModal(item)}
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "#1E3A5F", color: "white", fontWeight: "bold", cursor: "pointer", transition: "opacity 0.2s" }}
                                        onMouseOver={(e) => e.target.style.opacity = "0.9"}
                                        onMouseOut={(e) => e.target.style.opacity = "1"}
                                    >
                                        ➕ Añadir al viaje
                                    </button>
                                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #1E3A5F", color: "#1E3A5F", fontWeight: "bold", textDecoration: "none", textAlign: "center", fontSize: "0.9rem" }}>
                                        🌐 Ver en TripAdvisor
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL DE SELECCIÓN DE VIAJE */}
            {showModal && selectedItem && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
                    <div style={{ background: "white", padding: "30px", borderRadius: "16px", maxWidth: "500px", width: "90%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ margin: 0, color: "#1E3A5F" }}>Guardar en tu Itinerario</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#94a3b8" }}>&times;</button>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "25px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "12px" }}>
                            <img src={selectedItem.image} alt="Preview" style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover" }} />
                            <div>
                                <strong style={{ display: "block", color: "#1E3A5F" }}>{selectedItem.title}</strong>
                                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{selectedItem.info}</span>
                            </div>
                        </div>

                        <h4 style={{ marginBottom: "15px", color: "#64748b" }}>Selecciona un viaje activo:</h4>

                        {userTrips.length > 0 ? (
                            <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                                {userTrips.map(trip => (
                                    <button 
                                        key={trip.id}
                                        onClick={() => saveToItinerary(trip)}
                                        disabled={isSaving}
                                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "white", cursor: isSaving ? "not-allowed" : "pointer", textAlign: "left" }}
                                    >
                                        <div>
                                            <span style={{ display: "block", fontWeight: "bold", color: "#1E3A5F" }}>{trip.title}</span>
                                            <span style={{ fontSize: "0.8rem", color: "#64748b" }}><i className="fa-regular fa-calendar"></i> Inicia: {trip.starting_date}</span>
                                        </div>
                                        <i className="fa-solid fa-plus" style={{ color: "#2EC4B6", fontSize: "1.2rem" }}></i>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <p style={{ color: "#64748b", marginBottom: "20px" }}>No tienes viajes creados.</p>
                            </div>
                        )}

                        <button 
                            onClick={() => navigate("/new-trip")}
                            style={{ width: "100%", padding: "15px", borderRadius: "12px", border: "2px dashed #2EC4B6", background: "#f0fdfa", color: "#2EC4B6", fontWeight: "bold", cursor: "pointer", marginTop: "20px" }}
                        >
                            Crear un viaje nuevo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};