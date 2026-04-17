import React, { useState } from "react";
import "../styles/ExpensesTab.css"; // <-- ¡ESTA ES LA LÍNEA MÁGICA!

export const ExpensesTab = ({ expensesList, setExpensesList, allParticipants }) => {
    // --- ESTADOS PARA LOS MODALES DE GASTOS ---
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [isEditingExpense, setIsEditingExpense] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    
    // Estado del formulario (sirve tanto para crear como para editar)
    const [expenseData, setExpenseData] = useState({ 
        id: null, 
        description: "", 
        amount: "", 
        category: "Comida", 
        paidBy: "Yo", 
        splitMethod: "equally", 
        splitWith: [], 
        settledWith: [] 
    });

    // --- FUNCIONES DEL FORMULARIO DE GASTOS ---
    const handleExpenseChange = (e) => {
        setExpenseData({ ...expenseData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (participant) => {
        setExpenseData(prev => ({
            ...prev, 
            splitWith: prev.splitWith.includes(participant) 
                ? prev.splitWith.filter(p => p !== participant) 
                : [...prev.splitWith, participant]
        }));
    };

    const handleExpenseSubmit = (e) => {
        e.preventDefault();
        const parsedAmount = parseFloat(expenseData.amount);
        
        if (isEditingExpense) {
            // Actualizamos un gasto existente
            setExpensesList(expensesList.map(exp => 
                exp.id === expenseData.id ? { ...expenseData, amount: parsedAmount } : exp
            ));
        } else {
            // Creamos un gasto nuevo
            setExpensesList([...expensesList, { 
                id: Date.now(), 
                ...expenseData, 
                amount: parsedAmount, 
                date: "Hoy", 
                settledWith: [] 
            }]);
        }
        
        // Limpiamos y cerramos
        setShowExpenseModal(false);
        setIsEditingExpense(false);
        setExpenseData({ id: null, description: "", amount: "", category: "Comida", paidBy: "Yo", splitMethod: "equally", splitWith: [], settledWith: [] });
    };

    // --- FUNCIONES DE INTERACCIÓN CON GASTOS CREADOS ---
    const handleEditExpenseClick = () => {
        setExpenseData(selectedExpense);
        setIsEditingExpense(true);
        setSelectedExpense(null);
        setShowExpenseModal(true);
    };

    const handleDeleteExpense = (id) => {
        const confirmDelete = window.confirm("¿Estás seguro de que quieres borrar este gasto? Esta acción actualizará los balances.");
        if (confirmDelete) {
            setExpensesList(expensesList.filter(exp => exp.id !== id));
            setSelectedExpense(null); // Cerramos el modal tras borrar
        }
    };

    // La función mágica para saldar deudas individualmente
    const toggleSettleDebt = (expenseId, personName) => {
        const updatedExpenses = expensesList.map(exp => {
            if (exp.id === expenseId) {
                const isAlreadySettled = exp.settledWith?.includes(personName);
                const newSettledWith = isAlreadySettled
                    ? exp.settledWith.filter(p => p !== personName) // Si ya estaba pagado, lo deshace
                    : [...(exp.settledWith || []), personName]; // Si no, lo añade a la lista de pagados
                
                const updatedExp = { ...exp, settledWith: newSettledWith };
                
                // Actualizamos también el selectedExpense para que la UI del modal se refresque en vivo
                if (selectedExpense && selectedExpense.id === expenseId) {
                    setSelectedExpense(updatedExp);
                }
                return updatedExp;
            }
            return exp;
        });
        setExpensesList(updatedExpenses);
    };

    // Helper para los iconos
    const getCategoryIcon = (category) => {
        switch(category) { 
            case "Comida": return "fa-solid fa-utensils"; 
            case "Transporte": return "fa-solid fa-taxi"; 
            default: return "fa-solid fa-receipt"; 
        }
    };

    return (
        <>
            <div className="expenses-section">
                <div className="expenses-header">
                    <h2>Control de Gastos</h2>
                    <button 
                        className="btn-add-expense-small" 
                        onClick={() => { 
                            setIsEditingExpense(false); 
                            // Pre-seleccionamos a todos por defecto al crear uno nuevo
                            setExpenseData({ description: "", amount: "", category: "Comida", paidBy: "Yo", splitMethod: "equally", splitWith: allParticipants, settledWith: [] }); 
                            setShowExpenseModal(true); 
                        }}
                    >
                        <i className="fa-solid fa-plus"></i> Añadir
                    </button>
                </div>
                
                {/* LISTA DE TARJETAS DE GASTOS */}
                {expensesList.length > 0 ? (
                    <div className="expenses-grid">
                        {expensesList.map((expense) => (
                            <div key={expense.id} className="expense-card clickable" onClick={() => setSelectedExpense(expense)}>
                                <div className="expense-card-icon">
                                    <i className={getCategoryIcon(expense.category)}></i>
                                </div>
                                <div className="expense-card-info">
                                    <h4>{expense.description}</h4>
                                    <span className="expense-payer">{expense.paidBy} pagó por {expense.splitWith.length}</span>
                                </div>
                                <div className="expense-card-amount">
                                    <h4>{expense.amount} €</h4>
                                    <span>{expense.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <i className="fa-solid fa-wallet"></i>
                        <h3>Aún no hay gastos registrados</h3>
                        <button className="btn-action" onClick={() => setShowExpenseModal(true)}>Añadir Gasto</button>
                    </div>
                )}
            </div>

            {/* --- MODAL: CREAR O EDITAR GASTO --- */}
            {showExpenseModal && (
                <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="activity-modal-header">
                            <h3>{isEditingExpense ? "Editar Gasto" : "Añadir Nuevo Gasto"}</h3>
                            <button className="btn-close-modal" onClick={() => setShowExpenseModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleExpenseSubmit} className="expense-form">
                            <div className="input-group full-width">
                                <label>Descripción</label>
                                <input type="text" name="description" value={expenseData.description} onChange={handleExpenseChange} required />
                            </div>
                            <div className="expense-row">
                                <div className="input-group">
                                    <label>Importe (€)</label>
                                    <input type="number" name="amount" value={expenseData.amount} onChange={handleExpenseChange} required />
                                </div>
                                <div className="input-group">
                                    <label>Categoría</label>
                                    <select name="category" value={expenseData.category} onChange={handleExpenseChange}>
                                        <option value="Comida">Comida</option>
                                        <option value="Transporte">Transporte</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>
                            </div>
                            <div className="expense-row">
                                <div className="input-group">
                                    <label>¿Quién pagó?</label>
                                    <select name="paidBy" value={expenseData.paidBy} onChange={handleExpenseChange}>
                                        {allParticipants.map((p, i) => <option key={i} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>¿Cómo se divide?</label>
                                    <select name="splitMethod" value={expenseData.splitMethod} onChange={handleExpenseChange}>
                                        <option value="equally">Partes iguales</option>
                                        <option value="custom">Personalizado</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Checkboxes para división personalizada */}
                            {expenseData.splitMethod === "custom" && (
                                <div className="custom-split-container">
                                    <div className="checkbox-grid">
                                        {allParticipants.map((p, i) => (
                                            <label key={i} className="checkbox-label">
                                                <input 
                                                    type="checkbox" 
                                                    checked={expenseData.splitWith.includes(p)} 
                                                    onChange={() => handleCheckboxChange(p)} 
                                                />
                                                <div className="custom-checkbox"></div> {p}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="modal-actions-itinerary">
                                <button type="button" className="btn-modal-cancel" onClick={() => setShowExpenseModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-modal-confirm">{isEditingExpense ? "Actualizar" : "Guardar"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL: DESGLOSE DEL GASTO (GDV-36) --- */}
            {selectedExpense && (
                <div className="modal-overlay" onClick={() => setSelectedExpense(null)}>
                    <div className="modal-content expense-breakdown-modal" onClick={(e) => e.stopPropagation()}>
                        
                        <div className="activity-modal-header">
                            <span className="day-badge">
                                <i className={getCategoryIcon(selectedExpense.category)}></i> {selectedExpense.category}
                            </span>
                            <button className="btn-close-modal" onClick={() => setSelectedExpense(null)}>&times;</button>
                        </div>
                        
                        <div className="breakdown-header">
                            <h2>{selectedExpense.description}</h2>
                            <h1 className="breakdown-total">{selectedExpense.amount} €</h1>
                            <p className="breakdown-subtitle">Pagado por <strong>{selectedExpense.paidBy}</strong> el {selectedExpense.date}</p>
                        </div>
                        
                        <div className="modal-divider"></div>
                        
                        <div className="breakdown-list">
                            <h4>División del gasto ({selectedExpense.splitWith.length} personas)</h4>
                            
                            {selectedExpense.splitWith.map((person, index) => {
                                const amountPerPerson = (selectedExpense.amount / selectedExpense.splitWith.length).toFixed(2);
                                const isPayer = person === selectedExpense.paidBy;
                                const isSettled = selectedExpense.settledWith?.includes(person);

                                return (
                                    <div key={index} className="breakdown-row">
                                        <div className="breakdown-person">
                                            <div className="avatar small-avatar">{person.charAt(0)}</div>
                                            <span>{person}</span>
                                        </div>
                                        <div className="breakdown-amount-interactive">
                                            {isPayer ? (
                                                <span className="text-credit">Pagó la cuenta</span>
                                            ) : (
                                                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                    <span className={isSettled ? "text-neutral" : "text-debit"}>
                                                        {isSettled ? "Saldado" : `Debe ${amountPerPerson} €`}
                                                    </span>
                                                    <button 
                                                        className={`btn-settle ${isSettled ? 'settled' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleSettleDebt(selectedExpense.id, person);
                                                        }}
                                                    >
                                                        {isSettled ? <i className="fa-solid fa-check"></i> : "Saldar"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="modal-actions-itinerary">
                            <button className="btn-delete-expense" onClick={() => handleDeleteExpense(selectedExpense.id)}>
                                <i className="fa-solid fa-trash"></i> Borrar
                            </button>
                            <button className="btn-edit-activity" onClick={handleEditExpenseClick}>
                                Editar
                            </button>
                            <button className="btn-modal-confirm" onClick={() => setSelectedExpense(null)}>
                                Cerrar
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
};