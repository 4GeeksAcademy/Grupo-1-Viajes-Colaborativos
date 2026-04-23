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

    // 1. CARGAR LOS VIAJES DEL USUARIO DESDE TU BACKEND 
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

    // 2. BUSCAR DESTINOS 
    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            setError(null);

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

    // 4. GUARDAR EN EL BACKEND REAL 
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

    // Obtenemos el nombre decodificado para usarlo en la URL de la imagen de fondo
    const decodedLocationName = decodeURIComponent(locationName);
    const heroImage = `https://source.unsplash.com/1920x600/?${encodeURIComponent(decodedLocationName)},city`;

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }}>
            
            {/* HERO SECTION DINÁMICO */}
            <div style={{ 
                position: "relative",
                backgroundImage: `linear-gradient(rgba(30, 58, 95, 0.7), rgba(30, 58, 95, 0.8)), url('${heroImage}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                padding: "120px 20px 80px", // Aumentado para dejar hueco
                textAlign: "center",
                color: "white"
            }}>
                {/* Botón Volver (Posición absoluta arreglada) */}
                <button 
                    onClick={() => navigate("/explore")} 
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
                    <h1 style={{ fontSize: "3.5rem", margin: "20px 0 10px", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                        {decodedLocationName}
                    </h1>
                    <p style={{ fontSize: "1.2rem", color: "#e2e8f0", maxWidth: "600px", margin: "0 auto" }}>
                        Añade los mejores sitios directamente a tu itinerario. (Modo Pruebas Activado 🛠️)
                    </p>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
                
                {/* SELECTOR DE CATEGORÍAS */}
                <div style={{ display: "flex", gap: "20px", marginBottom: "40px", borderBottom: "2px solid #e2e8f0", justifyContent: "center" }}>
                    <button 
                        onClick={() => setCategory("restaurants")} 
                        style={{ 
                            padding: "15px 30px", 
                            background: "none", 
                            border: "none", 
                            cursor: "pointer", 
                            fontWeight: "bold", 
                            fontSize: "1.1rem",
                            color: category === "restaurants" ? "#2EC4B6" : "#64748b", 
                            borderBottom: category === "restaurants" ? "3px solid #2EC4B6" : "3px solid transparent",
                            transition: "color 0.2s, border-color 0.2s"
                        }}
                    >
                        <i className="fa-solid fa-utensils" style={{ marginRight: "8px" }}></i> Restaurantes
                    </button>
                    <button 
                        onClick={() => setCategory("hotels")} 
                        style={{ 
                            padding: "15px 30px", 
                            background: "none", 
                            border: "none", 
                            cursor: "pointer", 
                            fontWeight: "bold", 
                            fontSize: "1.1rem",
                            color: category === "hotels" ? "#2EC4B6" : "#64748b", 
                            borderBottom: category === "hotels" ? "3px solid #2EC4B6" : "3px solid transparent",
                            transition: "color 0.2s, border-color 0.2s"
                        }}
                    >
                        <i className="fa-solid fa-bed" style={{ marginRight: "8px" }}></i> Hoteles
                    </button>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "80px 20px" }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "3rem", color: "var(--brand-teal)", marginBottom: "20px" }}></i>
                        <h3 style={{ color: "var(--brand-navy)" }}>Buscando los mejores lugares... 🔎</h3>
                    </div>
                ) : error ? (
                    <div style={{ color: "#e74c3c", textAlign: "center", padding: "20px", background: "#fdecea", borderRadius: "8px", border: "1px solid #f5b7b1" }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{marginRight: "10px"}}></i> {error}
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "30px" }}>
                        {items.map((item, idx) => (
                            <div key={idx} style={{ 
                                background: "white", 
                                borderRadius: "16px", 
                                overflow: "hidden", 
                                boxShadow: "0 10px 20px rgba(0,0,0,0.05)", 
                                display: "flex", 
                                flexDirection: "column",
                                border: "1px solid #f1f5f9",
                                transition: "transform 0.3s ease, box-shadow 0.3s ease"
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = "translateY(-5px)";
                                e.currentTarget.style.boxShadow = "0 15px 30px rgba(0,0,0,0.1)";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.05)";
                            }}
                            >
                                <div style={{ height: "220px", overflow: "hidden", position: "relative" }}>
                                    <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500"} />
                                </div>
                                <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                                    <small style={{ color: "#2EC4B6", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>{item.info}</small>
                                    <h4 style={{ margin: "10px 0", color: "#1E3A5F", fontSize: "1.2rem" }}>{item.title}</h4>
                                    <div style={{ fontSize: "0.95rem", color: "#64748b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "5px" }}>
                                        <i className="fa-solid fa-star" style={{ color: "#f1c40f" }}></i> 
                                        <span style={{ fontWeight: "bold", color: "#1E3A5F" }}>{item.rating}</span> 
                                        <span>({item.reviews} opiniones)</span>
                                    </div>
                                    
                                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <button 
                                            onClick={() => handleOpenModal(item)}
                                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "#1E3A5F", color: "white", fontWeight: "bold", cursor: "pointer", transition: "background 0.2s" }}
                                            onMouseOver={(e) => e.target.style.background = "#2a4d7a"}
                                            onMouseOut={(e) => e.target.style.background = "#1E3A5F"}
                                        >
                                            <i className="fa-solid fa-plus" style={{ marginRight: "8px" }}></i> Añadir al viaje
                                        </button>
                                        <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", color: "#1E3A5F", fontWeight: "bold", textDecoration: "none", textAlign: "center", fontSize: "0.9rem", background: "#f8fafc", transition: "background 0.2s" }}
                                        onMouseOver={(e) => e.target.style.background = "#e2e8f0"}
                                        onMouseOut={(e) => e.target.style.background = "#f8fafc"}
                                        >
                                            <i className="fa-solid fa-arrow-up-right-from-square" style={{ marginRight: "8px" }}></i> Ver en TripAdvisor
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MODAL DE SELECCIÓN DE VIAJE */}
                {showModal && selectedItem && (
                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(30, 58, 95, 0.7)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
                        <div style={{ background: "white", padding: "30px", borderRadius: "20px", maxWidth: "500px", width: "90%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                <h2 style={{ margin: 0, color: "#1E3A5F", display: "flex", alignItems: "center", gap: "10px" }}>
                                    <i className="fa-solid fa-bookmark" style={{ color: "var(--brand-teal)" }}></i>
                                    Guardar en Itinerario
                                </h2>
                                <button onClick={() => setShowModal(false)} style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", color: "#64748b", transition: "background 0.2s" }}
                                onMouseOver={(e) => e.target.style.background = "#e2e8f0"}
                                onMouseOut={(e) => e.target.style.background = "#f1f5f9"}
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "25px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <img src={selectedItem.image} alt="Preview" style={{ width: "70px", height: "70px", borderRadius: "10px", objectFit: "cover", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} />
                                <div>
                                    <strong style={{ display: "block", color: "#1E3A5F", fontSize: "1.1rem", marginBottom: "4px" }}>{selectedItem.title}</strong>
                                    <span style={{ fontSize: "0.85rem", color: "white", background: "var(--brand-teal)", padding: "3px 8px", borderRadius: "12px", fontWeight: "bold" }}>{selectedItem.info}</span>
                                </div>
                            </div>

                            <h4 style={{ marginBottom: "15px", color: "#64748b", fontSize: "0.95rem" }}>Selecciona un viaje activo:</h4>

                            {userTrips.length > 0 ? (
                                <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "5px" }}>
                                    {userTrips.map(trip => (
                                        <button 
                                            key={trip.id}
                                            onClick={() => saveToItinerary(trip)}
                                            disabled={isSaving}
                                            style={{ 
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "space-between", 
                                                padding: "15px", 
                                                border: "1px solid #e2e8f0", 
                                                borderRadius: "12px", 
                                                background: "white", 
                                                cursor: isSaving ? "not-allowed" : "pointer", 
                                                textAlign: "left",
                                                transition: "border-color 0.2s, box-shadow 0.2s"
                                            }}
                                            onMouseOver={(e) => {
                                                if(!isSaving) {
                                                    e.currentTarget.style.borderColor = "var(--brand-teal)";
                                                    e.currentTarget.style.boxShadow = "0 4px 6px rgba(46, 196, 182, 0.1)";
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                if(!isSaving) {
                                                    e.currentTarget.style.borderColor = "#e2e8f0";
                                                    e.currentTarget.style.boxShadow = "none";
                                                }
                                            }}
                                        >
                                            <div>
                                                <span style={{ display: "block", fontWeight: "bold", color: "#1E3A5F", fontSize: "1.05rem" }}>{trip.title}</span>
                                                <span style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px", display: "block" }}><i className="fa-regular fa-calendar" style={{ marginRight: "4px" }}></i> Inicia: {trip.starting_date}</span>
                                            </div>
                                            <div style={{ 
                                                width: "36px", 
                                                height: "36px", 
                                                borderRadius: "50%", 
                                                background: "#f0fdfa", 
                                                display: "flex", 
                                                justifyContent: "center", 
                                                alignItems: "center" 
                                            }}>
                                                <i className="fa-solid fa-plus" style={{ color: "#2EC4B6", fontSize: "1.1rem" }}></i>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", padding: "30px 20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                                    <i className="fa-solid fa-suitcase-rolling" style={{ fontSize: "2.5rem", color: "#94a3b8", marginBottom: "15px" }}></i>
                                    <p style={{ color: "#475569", marginBottom: "0", fontWeight: "500" }}>No tienes viajes creados aún.</p>
                                </div>
                            )}

                            <button 
                                onClick={() => navigate("/new-trip")}
                                style={{ width: "100%", padding: "15px", borderRadius: "12px", border: "2px dashed #2EC4B6", background: "#f0fdfa", color: "#2EC4B6", fontWeight: "bold", cursor: "pointer", marginTop: "20px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", transition: "background 0.2s" }}
                                onMouseOver={(e) => e.target.style.background = "#ccfbf1"}
                                onMouseOut={(e) => e.target.style.background = "#f0fdfa"}
                            >
                                <i className="fa-solid fa-plane-departure"></i> Crear un viaje nuevo
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};