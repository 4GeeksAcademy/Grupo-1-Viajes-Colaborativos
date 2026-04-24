import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "../styles/TripDetails.css";

import { ItineraryTab } from "../components/ItineraryTab";
import { ExpensesTab } from "../components/ExpensesTab";
import { ChatTab } from "../components/ChatTab";

export const TripDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { store, dispatch } = useGlobalReducer();

    const [activeTab, setActiveTab] = useState("itinerario");
    const [tripItinerary, setTripItinerary] = useState([]);
    const [expensesList, setExpensesList] = useState([]);
    
    // 📄 ESTADO PARA LOS DOCUMENTOS
    const [documentsList, setDocumentsList] = useState([]);
    
    // 📸 ESTADOS PARA LA EDICIÓN DE IMAGEN
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState("");
    const [isUpdatingImage, setIsUpdatingImage] = useState(false);

    // 📱 ESTADO PARA EL MENÚ MÓVIL
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // 📸 ESTADOS PARA MODALES
    const [showAddTravelerModal, setShowAddTravelerModal] = useState(false);
    const [showAddDocModal, setShowAddDocModal] = useState(false);
    
    // ⚙️ ESTADOS PARA GESTIONAR VIAJE
    const [showEditTripModal, setShowEditTripModal] = useState(false);
    const [isUpdatingTrip, setIsUpdatingTrip] = useState(false);
    const [editTripData, setEditTripData] = useState({
        title: "", destination: "", budget: "", starting_date: "", ending_date: "", state: "PLANNING", notes: ""
    });

    // 🧑‍🤝‍🧑 ESTADOS PARA INVITAR VIAJERO
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);

    // 📄 ESTADOS PARA SUBIR DOCUMENTOS
    const [docTitle, setDocTitle] = useState("");
    const [docFile, setDocFile] = useState(null);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);

    const stateTranslations = {
        "PLANNING": { text: "Planificando", color: "#3498db" },
        "ONGOING": { text: "En curso", color: "#2ecc71" },
        "FINISHED": { text: "Finalizado", color: "#95a5a6" }
    };

    const fetchTripDetails = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trip-detail/${id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                dispatch({ type: "load_trip_details", payload: data });
                setTripItinerary(data.itinerary || []);
                setExpensesList(data.expense || []);
                setDocumentsList(data.document || []);
            } else {
                if (response.status === 401) {
                    localStorage.removeItem("token");
                    navigate("/login");
                }
            }
        } catch (error) {
            console.error("Error de conexión con el backend:", error);
        }
    };

    useEffect(() => {
        if (id) fetchTripDetails();
    }, [id, navigate, dispatch]);

    // 📸 MANEJADOR PARA CONVERTIR FOTO DE PORTADA A BASE64
    const handleHeroFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                setNewImageUrl(reader.result); 
            };
        }
    };

    // 📸 FUNCIÓN PARA ACTUALIZAR LA IMAGEN
    const handleImageUpdate = async () => {
        setIsUpdatingImage(true);
        const token = localStorage.getItem("token");
        
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/update-trip-image/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ image_url: newImageUrl })
            });

            if (response.ok) {
                setIsEditingImage(false);
                setNewImageUrl("");
                fetchTripDetails(); 
            } else {
                const errorData = await response.json();
                alert(`Error al actualizar imagen: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsUpdatingImage(false);
        }
    };

    // 🧑‍🤝‍🧑 FUNCIÓN PARA INVITAR VIAJERO
    const handleInviteTraveler = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setIsInviting(true);
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/add-traveler/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ email: inviteEmail })
            });

            if (response.ok) {
                alert("✅ ¡Viajero añadido con éxito!");
                setShowAddTravelerModal(false);
                setInviteEmail("");
                fetchTripDetails(); 
            } else {
                const errorData = await response.json();
                alert(`⚠️ Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Error al invitar:", error);
            alert("No se pudo conectar con el servidor.");
        } finally {
            setIsInviting(false);
        }
    };

    // ⚙️ ABRIR MODAL DE EDICIÓN Y CARGAR DATOS
    const openEditModal = () => {
        if (store.currentTrip) {
            setEditTripData({
                title: store.currentTrip.title || "",
                destination: store.currentTrip.destination || "",
                budget: store.currentTrip.budget || "",
                starting_date: store.currentTrip.starting_date || "",
                ending_date: store.currentTrip.ending_date || "",
                state: store.currentTrip.state || "PLANNING",
                notes: store.currentTrip.notes || ""
            });
            setShowEditTripModal(true);
        }
    };

    // ⚙️ FUNCIÓN PARA ACTUALIZAR DATOS DEL VIAJE
    const handleUpdateTrip = async (e) => {
        e.preventDefault();
        setIsUpdatingTrip(true);
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trip/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(editTripData)
            });

            if (response.ok) {
                setShowEditTripModal(false);
                fetchTripDetails(); 
                alert("Datos del viaje actualizados.");
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Error al actualizar el viaje:", error);
        } finally {
            setIsUpdatingTrip(false);
        }
    };

    // 🏃‍♂️ FUNCIÓN PARA ABANDONAR EL VIAJE
    const handleLeaveTrip = async () => {
        if (window.confirm("¿Estás seguro de que quieres abandonar este viaje? Dejarás de tener acceso al itinerario y los gastos compartidos.")) {
            const token = localStorage.getItem("token");
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/leave-trip/${id}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (response.ok) {
                    navigate("/my-trips"); 
                } else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.message}`);
                }
            } catch (error) {
                console.error("Error al salir del viaje:", error);
            }
        }
    };

    // 📄 MANEJADOR PARA CONVERTIR ARCHIVO A BASE64 (DOCUMENTOS)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                setDocFile(reader.result); 
            };
        }
    };

    // 📄 FUNCIÓN PARA ENVIAR EL DOCUMENTO AL BACKEND
    const handleUploadDocument = async (e) => {
        e.preventDefault();
        if (!docTitle.trim() || !docFile) {
            alert("Por favor, ponle un título y selecciona un archivo.");
            return;
        }

        setIsUploadingDoc(true);
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/add-document/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: docTitle,
                    document: docFile 
                })
            });

            if (response.ok) {
                alert("¡Documento subido correctamente a la nube!");
                setShowAddDocModal(false);
                setDocTitle("");
                setDocFile(null);
                fetchTripDetails(); 
            } else {
                const errorData = await response.json();
                alert(`Error al subir: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Error subiendo documento:", error);
            alert("Hubo un error de conexión.");
        } finally {
            setIsUploadingDoc(false);
        }
    };

    // 🗑️ FUNCIÓN PARA ELIMINAR DOCUMENTO
    const handleDeleteDocument = async (docId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este documento? Se borrará para todos.")) return;

        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/delete-document/${docId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                fetchTripDetails(); 
            } else {
                alert("Error al eliminar el documento.");
            }
        } catch (error) {
            console.error("Error al borrar documento:", error);
        }
    };

    if (!store.currentTrip) {
        return (
            <div className="trip-details-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "100px" }}>
                <div className="spinner"></div>
                <h2>Cargando información del viaje...</h2>
            </div>
        );
    }

    const trip = store.currentTrip;
    const formattedDates = `${trip.starting_date} al ${trip.ending_date}`;

    const safeState = trip.state ? trip.state.toUpperCase() : "PLANNING";
    const currentState = stateTranslations[safeState] || { text: trip.state, color: "var(--brand-teal)" };

    const allParticipants = store.travelers && store.travelers.length > 0
        ? store.travelers.map(t => t.name)
        : ["Usuario"];

    // 🌟 MATEMÁTICAS MEJORADAS PARA EL BOTÓN SALDAR
    const calculateBalances = () => {
        let balances = {};
        allParticipants.forEach(p => balances[p] = 0);

        expensesList.forEach(exp => {
            const amount = parseFloat(exp.amount) || 0;
            const splitArray = exp.splitWith || allParticipants;
            const splitAmount = amount / splitArray.length;
            const payerName = exp.paidBy || exp.payer_name || allParticipants[0];

            if (balances[payerName] !== undefined) balances[payerName] += amount;

            splitArray.forEach(person => {
                if (balances[person] !== undefined) {
                    balances[person] -= splitAmount;
                    
                    // Si la persona ya saldó su deuda, anulamos el cálculo para ella
                    const isSettled = (exp.settledWith || []).includes(person);
                    if (isSettled && person !== payerName) {
                        balances[person] += splitAmount; // El deudor recupera el balance
                        balances[payerName] -= splitAmount; // Al pagador se le resta lo que ya le pagaron
                    }
                }
            });
        });
        return balances;
    };

    const participantBalances = calculateBalances();
    const totalSpent = expensesList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    const heroImage = trip.image_url && trip.image_url.trim() !== "" 
        ? trip.image_url 
        : `https://loremflickr.com/1920/1080/${encodeURIComponent(trip.destination || 'city')}?lock=${trip.id || 1}`;

    return (
        <div className="trip-details-wrapper">
            {/* HERO SECTION */}
            <div className="trip-hero" style={{
                backgroundImage: `linear-gradient(rgba(30, 58, 95, 0.7), rgba(30, 58, 95, 0.4)), url('${heroImage}')`
            }}>
                <Link 
                    to="/my-trips" 
                    className="btn-back-light" 
                    style={{ 
                        cursor: "pointer", 
                        zIndex: 9999,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        textDecoration: "none"
                    }}
                >
                    <i className="fa-solid fa-arrow-left"></i> Volver
                </Link>

                <div className="hero-content" style={{ position: "relative", width: "100%" }}>
                    <span className="hero-badge" style={{ backgroundColor: currentState.color }}>
                        {currentState.text}
                    </span>

                    <div className="hero-title-row">
                        <div className="hero-text-area">
                            <h1>{trip.title}</h1>
                            <p><i className="fa-regular fa-calendar"></i> {formattedDates}</p>
                        </div>

                        <div className="mobile-menu-container">
                            <button 
                                className="btn-mobile-toggle" 
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                            >
                                <i className="fa-solid fa-ellipsis-vertical"></i>
                            </button>

                            {showMobileMenu && (
                                <div className="mobile-dropdown-menu">
                                    <button onClick={() => { setShowMobileMenu(false); openEditModal(); }}>
                                        <i className="fa-solid fa-gear"></i> Gestionar Viaje
                                    </button>
                                    <button onClick={() => { setShowMobileMenu(false); setIsEditingImage(true); setNewImageUrl(trip.image_url || ""); }}>
                                        <i className="fa-solid fa-camera"></i> Cambiar Foto
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BOTONES DE ESCRITORIO */}
                    <div className="hero-action-buttons desktop-only-btn">
                        <button onClick={openEditModal} className="btn-hero-action">
                            <i className="fa-solid fa-gear"></i> Gestionar Viaje
                        </button>

                        <button onClick={() => { setIsEditingImage(true); setNewImageUrl(trip.image_url || ""); }} className="btn-hero-action">
                            <i className="fa-solid fa-camera"></i> Cambiar Foto
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENEDOR PRINCIPAL */}
            <div className="trip-content-container">
                <div className="main-column">
                    <div className="main-layout-wrapper">

                        {/* ÁREA DE PESTAÑAS */}
                        <div className="tabs-content-area">
                            <div className="content-tabs">
                                <button className={activeTab === "itinerario" ? "active" : ""} onClick={() => setActiveTab("itinerario")}>Itinerario</button>
                                <button className={activeTab === "gastos" ? "active" : ""} onClick={() => setActiveTab("gastos")}>Gastos</button>
                                <button className={activeTab === "documentos" ? "active" : ""} onClick={() => setActiveTab("documentos")}>Documentos</button>
                            </div>

                            {activeTab === "itinerario" && (
                                <ItineraryTab tripItinerary={tripItinerary} setTripItinerary={setTripItinerary} />
                            )}

                            {activeTab === "gastos" && (
                                <ExpensesTab
                                    expensesList={expensesList}
                                    setExpensesList={setExpensesList}
                                    allParticipants={allParticipants}
                                    travelers={store.travelers || []}
                                />
                            )}

                            {/* 📄 PESTAÑA DE DOCUMENTOS CON LISTA REAL */}
                            {activeTab === "documentos" && (
                                <div className="documents-tab-content" style={{ padding: "20px 0" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                        <h3 style={{ margin: 0, color: "var(--brand-navy)" }}>Archivos del Viaje</h3>
                                        <button 
                                            className="btn-action" 
                                            style={{ width: "auto", padding: "8px 15px", fontSize: "0.9rem" }}
                                            onClick={() => setShowAddDocModal(true)}
                                        >
                                            <i className="fa-solid fa-upload"></i> Subir Documento
                                        </button>
                                    </div>

                                    {documentsList.length === 0 ? (
                                        <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: "40px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                                            <i className="fa-regular fa-folder-open" style={{ fontSize: "3rem", color: "#94a3b8", marginBottom: "15px" }}></i>
                                            <h3 style={{ color: "#334155" }}>Aún no hay documentos</h3>
                                            <p style={{ color: "#64748b" }}>Sube aquí tus reservas de hotel, vuelos o tickets.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: "grid", gap: "15px", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                                            {documentsList.map((doc) => (
                                                <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                                                        <i className="fa-solid fa-file-pdf" style={{ fontSize: "1.8rem", color: "#e74c3c" }}></i>
                                                        <span style={{ fontWeight: "bold", color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }} title={doc.title}>
                                                            {doc.title}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-teal)", background: "#f0fdfa", padding: "8px 12px", borderRadius: "6px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }} title="Ver/Descargar">
                                                            <i className="fa-solid fa-eye"></i>
                                                        </a>
                                                        <button onClick={() => handleDeleteDocument(doc.id)} style={{ color: "#e74c3c", background: "#fff1f2", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Eliminar">
                                                            <i className="fa-solid fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* CHAT PERSISTENTE */}
                        <div className="chat-desktop-view persistent-chat">
                            <ChatTab />
                        </div>
                        
                    </div>
                </div>

                {/* BARRA LATERAL / SIDEBAR */}
                <div className="side-column">
                    <div className="summary-card budget-card">
                        <h3><i className="fa-solid fa-chart-pie"></i> Presupuesto</h3>
                        <div className="budget-numbers">
                            <div><span>Gastado</span><h4>{totalSpent.toFixed(2)}€</h4></div>
                            <div><span>Total</span><h4>{trip.budget || 0}€</h4></div>
                        </div>
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{
                                width: `${trip.budget > 0 ? Math.min((totalSpent / trip.budget) * 100, 100) : 0}%`,
                                backgroundColor: totalSpent > trip.budget ? "#e74c3c" : "#2ecc71"
                            }}></div>
                        </div>
                    </div>

                    <div className="summary-card friends-card">
                        <h3><i className="fa-solid fa-users"></i> Viajeros y Balances</h3>
                        <ul className="friends-list">
                            {allParticipants.map((person, i) => {
                                const balance = participantBalances[person] || 0;
                                const balanceClass = balance > 0.01 ? "balance-positive" : balance < -0.01 ? "balance-negative" : "balance-neutral";

                                return (
                                    <li key={i}>
                                        <div className="avatar friend-avatar">{person.charAt(0).toUpperCase()}</div>
                                        <span>{person}</span>
                                        <span className={`balance-badge ${balanceClass}`}>
                                            {balance > 0 ? `+${balance.toFixed(2)}` : balance.toFixed(2)} €
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                        
                        <button 
                            className="btn-invite" 
                            style={{ width: "100%", marginTop: "10px", padding: "10px", border: "1px dashed var(--brand-teal)", background: "transparent", color: "var(--brand-teal)", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
                            onClick={() => setShowAddTravelerModal(true)}
                        >
                            <i className="fa-solid fa-user-plus"></i> Invitar Viajero
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODALES --- */}

            {/* MODAL CAMBIAR FOTO DE PORTADA (NUEVO) */}
            {isEditingImage && (
                <div className="modal-overlay" onClick={() => setIsEditingImage(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '30px', maxWidth: '400px', width: '90%' }}>
                        <h3 style={{ marginBottom: "15px", color: "#1e293b", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                            <i className="fa-solid fa-image" style={{ color: "var(--brand-teal)" }}></i> 
                            Foto de portada
                        </h3>
                        <p style={{ color: "#64748b", fontSize: "0.9rem", textAlign: "center", marginBottom: "20px" }}>
                            Sube una imagen de tu ordenador o pega un enlace de internet.
                        </p>

                        {newImageUrl && newImageUrl.startsWith("data:image") ? (
                            <div style={{ padding: "15px", background: "#f0fdfa", border: "1px dashed var(--brand-teal)", borderRadius: "8px", textAlign: "center" }}>
                                <i className="fa-solid fa-circle-check" style={{ fontSize: "2rem", color: "var(--brand-teal)", marginBottom: "10px" }}></i>
                                <p style={{ margin: "0", color: "var(--brand-navy)", fontWeight: "bold", fontSize: "0.9rem" }}>¡Imagen lista!</p>
                                <button type="button" onClick={() => setNewImageUrl(trip.image_url || "")} style={{ marginTop: "10px", background: "transparent", border: "none", color: "#e74c3c", cursor: "pointer", textDecoration: "underline", fontSize: "0.8rem" }}>Elegir otra distinta</button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "#1e293b", fontWeight: "bold" }}>Subir archivo</label>
                                    <input 
                                        type="file" 
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleHeroFileChange}
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px dashed #94a3b8", background: "#f8fafc", cursor: "pointer" }}
                                    />
                                </div>
                                <div style={{ textAlign: "center", color: "#cbd5e1", fontSize: "0.8rem", fontWeight: "bold" }}>— O PEGA UNA URL —</div>
                                <div>
                                    <input 
                                        type="url" 
                                        placeholder="https://ejemplo.com/foto.jpg" 
                                        value={newImageUrl} 
                                        onChange={(e) => setNewImageUrl(e.target.value)}
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                            <button onClick={() => { setIsEditingImage(false); setNewImageUrl(""); }} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#e2e8f0", color: "#475569", cursor: "pointer", fontWeight: "bold" }}>
                                Cancelar
                            </button>
                            <button onClick={handleImageUpdate} disabled={isUpdatingImage || !newImageUrl} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "var(--brand-teal)", color: "white", cursor: (isUpdatingImage || !newImageUrl) ? "not-allowed" : "pointer", fontWeight: "bold" }}>
                                {isUpdatingImage ? "Guardando..." : "Guardar foto"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL INVITAR VIAJERO */}
            {showAddTravelerModal && (
                <div className="modal-overlay" onClick={() => setShowAddTravelerModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '30px', maxWidth: '400px' }}>
                        <h2><i className="fa-solid fa-envelope-open-text" style={{color: "var(--brand-teal)", fontSize: "2rem", marginBottom: "15px"}}></i></h2>
                        <h3>Invitar a un amigo</h3>
                        <p style={{color: "#64748b", margin: "15px 0", fontSize: "0.95rem"}}>
                            Introduce el correo electrónico del usuario registrado con el que vas a compartir esta aventura.
                        </p>
                        
                        <form onSubmit={handleInviteTraveler} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
                            <input 
                                type="email" 
                                placeholder="correo@ejemplo.com" 
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                required
                                style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", fontSize: "1rem" }}
                            />
                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button 
                                    type="button" 
                                    className="btn-modal-cancel" 
                                    onClick={() => setShowAddTravelerModal(false)}
                                    style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#f1f5f9", color: "#64748b", cursor: "pointer", fontWeight: "bold" }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isInviting}
                                    style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "var(--brand-teal)", color: "white", cursor: isInviting ? "not-allowed" : "pointer", fontWeight: "bold" }}
                                >
                                    {isInviting ? "Enviando..." : "Añadir"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL GESTIONAR VIAJE */}
            {showEditTripModal && (
                <div className="modal-overlay" onClick={() => setShowEditTripModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '30px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: "20px", color: "#1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
                            <i className="fa-solid fa-pen-to-square" style={{ color: "var(--brand-teal)" }}></i> Configuración del Viaje
                        </h3>
                        
                        <form onSubmit={handleUpdateTrip} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "#64748b", fontWeight: "bold" }}>Título</label>
                                <input type="text" value={editTripData.title} onChange={(e) => setEditTripData({...editTripData, title: e.target.value})} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                            </div>
                            
                            <div style={{ display: "flex", gap: "15px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "#64748b", fontWeight: "bold" }}>Destino</label>
                                    <input type="text" value={editTripData.destination} onChange={(e) => setEditTripData({...editTripData, destination: e.target.value})} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "#64748b", fontWeight: "bold" }}>Presupuesto Total (€)</label>
                                    <input type="number" value={editTripData.budget} onChange={(e) => setEditTripData({...editTripData, budget: e.target.value})} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "15px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "#64748b", fontWeight: "bold" }}>Fecha Inicio</label>
                                    <input type="date" value={editTripData.starting_date} onChange={(e) => setEditTripData({...editTripData, starting_date: e.target.value})} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "#64748b", fontWeight: "bold" }}>Fecha Fin</label>
                                    <input type="date" value={editTripData.ending_date} onChange={(e) => setEditTripData({...editTripData, ending_date: e.target.value})} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "#64748b", fontWeight: "bold" }}>Estado del Viaje</label>
                                <select value={editTripData.state} onChange={(e) => setEditTripData({...editTripData, state: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white" }}>
                                    <option value="PLANNING">Planificando</option>
                                    <option value="ONGOING">En curso</option>
                                    <option value="FINISHED">Finalizado</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "#64748b", fontWeight: "bold" }}>Notas adicionales (Opcional)</label>
                                <textarea rows="3" value={editTripData.notes} onChange={(e) => setEditTripData({...editTripData, notes: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}></textarea>
                            </div>

                            {/* Botones de acción del formulario */}
                            <div style={{ display: "flex", gap: "10px", marginTop: "10px", paddingTop: "15px", borderTop: "1px solid #e2e8f0" }}>
                                <button type="button" onClick={() => setShowEditTripModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#f1f5f9", color: "#64748b", cursor: "pointer", fontWeight: "bold" }}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isUpdatingTrip} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "var(--brand-teal)", color: "white", cursor: isUpdatingTrip ? "not-allowed" : "pointer", fontWeight: "bold" }}>
                                    {isUpdatingTrip ? "Guardando..." : "Guardar Cambios"}
                                </button>
                            </div>

                            {/* Zona de peligro: Abandonar Viaje */}
                            <div style={{ marginTop: "20px", padding: "15px", background: "#fff1f2", borderRadius: "8px", border: "1px dashed #fda4af", textAlign: "center" }}>
                                <p style={{ color: "#be123c", fontSize: "0.9rem", marginBottom: "10px", fontWeight: "bold" }}>¿Ya no vas a este viaje?</p>
                                <button 
                                    type="button" 
                                    onClick={handleLeaveTrip}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "none", background: "#e11d48", color: "white", cursor: "pointer", fontWeight: "bold" }}
                                >
                                    <i className="fa-solid fa-person-walking-arrow-right"></i> Abandonar Viaje
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 📄 MODAL SUBIR DOCUMENTOS */}
            {showAddDocModal && (
                <div className="modal-overlay" onClick={() => setShowAddDocModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '30px', maxWidth: '400px', width: '90%' }}>
                        <h3 style={{ marginBottom: "20px", color: "#1e293b", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                            <i className="fa-solid fa-cloud-arrow-up" style={{ color: "var(--brand-teal)" }}></i> 
                            Subir Documento
                        </h3>
                        <p style={{ color: "#64748b", fontSize: "0.9rem", textAlign: "center", marginBottom: "20px" }}>
                            Sube una imagen o PDF con tus reservas o billetes para que todos puedan verlo.
                        </p>

                        <form onSubmit={handleUploadDocument} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "#1e293b", fontWeight: "bold" }}>Título del documento</label>
                                <input 
                                    type="text" 
                                    value={docTitle} 
                                    onChange={(e) => setDocTitle(e.target.value)} 
                                    placeholder="Ej: Billetes de avión ida" 
                                    required 
                                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} 
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "#1e293b", fontWeight: "bold" }}>Archivo (PDF o Imagen)</label>
                                
                                {docFile ? (
                                    <div style={{ padding: "15px", background: "#f0fdfa", border: "1px dashed var(--brand-teal)", borderRadius: "8px", textAlign: "center" }}>
                                        <i className="fa-solid fa-file-circle-check" style={{ fontSize: "2rem", color: "var(--brand-teal)", marginBottom: "10px" }}></i>
                                        <p style={{ margin: "0", color: "var(--brand-navy)", fontWeight: "bold", fontSize: "0.9rem" }}>¡Documento cargado!</p>
                                        <button type="button" onClick={() => setDocFile(null)} style={{ marginTop: "10px", background: "transparent", border: "none", color: "#e74c3c", cursor: "pointer", textDecoration: "underline", fontSize: "0.8rem" }}>Elegir otro distinto</button>
                                    </div>
                                ) : (
                                    <input 
                                        type="file" 
                                        accept=".pdf, image/png, image/jpeg, image/jpg"
                                        onChange={handleFileChange} 
                                        required 
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px dashed #94a3b8", background: "#f8fafc", cursor: "pointer" }} 
                                    />
                                )}
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                                <button 
                                    type="button" 
                                    onClick={() => { setShowAddDocModal(false); setDocFile(null); setDocTitle(""); }} 
                                    style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#e2e8f0", color: "#475569", cursor: "pointer", fontWeight: "bold" }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isUploadingDoc || !docFile} 
                                    style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "var(--brand-teal)", color: "white", cursor: (isUploadingDoc || !docFile) ? "not-allowed" : "pointer", fontWeight: "bold" }}
                                >
                                    {isUploadingDoc ? "Subiendo..." : "Subir archivo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};