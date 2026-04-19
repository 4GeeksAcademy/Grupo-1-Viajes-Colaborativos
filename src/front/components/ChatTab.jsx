import React, { useState, useEffect, useRef } from "react";
import "../styles/ChatTab.css";

export const ChatTab = () => {
    // Mensajes de prueba para ver cómo queda el diseño
    const [messages, setMessages] = useState([
        { id: 1, user: "Carlos", text: "¡Chicos! ¿Ya tenéis todos el seguro de viaje?", time: "10:30", isMe: false },
        { id: 2, user: "Yo", text: "Sí, lo saqué ayer. Lo subiré ahora a la pestaña de documentos.", time: "10:32", isMe: true },
        { id: 3, user: "Ana", text: "Yo lo miro esta tarde sin falta. Por cierto, ¿quedamos en la T4?", time: "10:35", isMe: false },
    ]);

    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    // Auto-scroll al último mensaje cuando se abre o se envía uno nuevo
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msg = {
            id: Date.now(),
            user: "Yo",
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true
        };

        setMessages([...messages, msg]);
        setNewMessage("");
    };

    return (
        <div className="chat-section">
            <div className="chat-messages-container">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message-wrapper ${msg.isMe ? "me" : "others"}`}>
                        {!msg.isMe && <span className="message-user">{msg.user}</span>}
                        <div className="message-bubble">
                            <p>{msg.text}</p>
                            <span className="message-time">{msg.time}</span>
                        </div>
                    </div>
                ))}
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