import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import "../styles/ChatTab.css";

export const ChatTab = () => {
    // 1. Obtenemos el ID del viaje de la URL
    const { id } = useParams(); 
    
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    // Leemos quién es el usuario logueado desde el localStorage (para saber qué burbujas son tuyas)
    const currentUserString = localStorage.getItem("user");
    const currentUser = currentUserString ? JSON.parse(currentUserString) : null;

    // Auto-scroll al último mensaje
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 2. FUNCIÓN: Leer mensajes de la base de datos
    const fetchMessages = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

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
                if (data.messages) {
                    setMessages(data.messages);
                }
            }
        } catch (error) {
            console.error("Error al cargar el historial del chat:", error);
        }
    };

    // 3. EFECTO: Cargar al entrar y refrescar (Polling)
    useEffect(() => {
        fetchMessages();
        // Pregunta a Rigo cada 5 segundos si hay mensajes nuevos
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [id]);

    // 4. FUNCIÓN: Enviar a la base de datos
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/new-message/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                // 🛠️ EL FIX ESTÁ AQUÍ: Rigo exige "content"
                body: JSON.stringify({ content: newMessage }) 
            });

            if (response.ok) {
                setNewMessage(""); // Limpiamos el input si se envió con éxito
                fetchMessages();   // Pedimos la lista actualizada
            } else {
                const errorData = await response.json();
                console.error("Rigo rechazó el mensaje:", errorData);
            }
        } catch (error) {
            console.error("Error al enviar el mensaje:", error);
        }
    };

    return (
        <div className="chat-section">
            <div className="chat-messages-container">
                {messages.length > 0 ? (
                    messages.map((msg, index) => {
                        // 🛠️ IDENTIDAD: Comparamos el user_id del mensaje con tu ID
                        const isMe = currentUser && msg.user_id === currentUser.id;

                        return (
                            <div key={msg.id || index} className={`message-wrapper ${isMe ? "me" : "others"}`}>
                                {!isMe && <span className="message-user">{msg.user_name || "Viajero"}</span>}
                                <div className="message-bubble">
                                    {/* 🛠️ EL OTRO FIX: Renderizamos msg.content en lugar de msg.text */}
                                    <p>{msg.content}</p>
                                    <span className="message-time">
                                        {msg.date_time 
                                            ? new Date(msg.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                            : "Ahora"}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p style={{ textAlign: "center", color: "#94a3b8", marginTop: "20px", fontSize: "0.9rem" }}>
                        Aún no hay mensajes. ¡Escribe el primero!
                    </p>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input 
                    type="text" 
                    placeholder="Escribe un mensaje al grupo..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn-send-chat">
                    <i className="fa-solid fa-paper-plane"></i>
                </button>
            </form>
        </div>
    );
};