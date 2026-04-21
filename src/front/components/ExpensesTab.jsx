import React, { useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/ExpensesTab.css";

export const ExpensesTab = ({ expensesList, setExpensesList, travelers, allParticipants }) => {
    const { id } = useParams(); 

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showAllExpensesModal, setShowAllExpensesModal] = useState(false); // 📸 NUEVO MODAL "VER TODOS"
    const [isEditingExpense, setIsEditingExpense] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [loading, setLoading] = useState(false); 
    
    const [expenseData, setExpenseData] = useState({ 
        id: null, 
        description: "", 
        amount: "", 
        category: "Comida", 
        paidBy: allParticipants[0] || "Yo", 
        splitMethod: "equally", 
        splitWith: [], 
        settledWith: [] 
    });

    const handleExpenseChange = (e) => {
        setExpenseData({ ...expenseData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (participant) => {
        setExpenseData(prev => {
            // Paracaídas de seguridad: si splitWith es undefined, usamos []
            const currentSplitWith = prev.splitWith || [];
            return {
                ...prev, 
                splitWith: currentSplitWith.includes(participant) 
                    ? currentSplitWith.filter(p => p !== participant) 
                    : [...currentSplitWith, participant]
            };
        });
    };

    // --- LA FUNCIÓN MÁGICA CONECTADA AL BACKEND ---
    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        const parsedAmount = parseFloat(expenseData.amount);
        
        if (isEditingExpense) {
            setExpensesList(expensesList.map(exp => 
                exp.id === expenseData.id ? { ...expenseData, amount: parsedAmount } : exp
            ));
            cerrarModal();
        } else {
            const payerObj = travelers.find(t => t.name === expenseData.paidBy);
            const payerId = payerObj ? payerObj.id : null;

            // Paracaídas: asegurar que splitWith sea un arreglo
            const validSplitWith = expenseData.splitWith || [];

            const debtorsList = validSplitWith.map(name => {
                const t = travelers.find(t => t.name === name);
                return t ? { id: t.id } : null;
            }).filter(d => d !== null);

            const newExpensePayload = {
                amount: parsedAmount,
                description: expenseData.description,
                payer_id: payerId,
                debtors: debtorsList
            };

            setLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/new-expense/${id}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(newExpensePayload)
                });

                if (response.ok) {
                    const responseData = await response.json();
                    
                    setExpensesList([...expensesList, { 
                        id: responseData.expense.id, 
                        ...expenseData, 
                        amount: parsedAmount, 
                        date: "Hoy", 
                        settledWith: [] 
                    }]);
                    
                    cerrarModal();
                } else {
                    const errorData = await response.json();
                    alert("Error al guardar en el servidor: " + (errorData.message || ""));
                }
            } catch (error) {
                console.error("Error de conexión:", error);
                alert("Error de conexión con el backend");
            } finally {
                setLoading(false);
            }
        }
    };

    const cerrarModal = () => {
        setShowExpenseModal(false);
        setIsEditingExpense(false);
        setExpenseData({ id: null, description: "", amount: "", category: "Comida", paidBy: allParticipants[0] || "Yo", splitMethod: "equally", splitWith: [], settledWith: [] });
    };

    const handleEditExpenseClick = () => {
        // Paracaídas al cargar datos para editar: evitamos que variables clave sean undefined
        setExpenseData({
            ...selectedExpense,
            splitWith: selectedExpense.splitWith || allParticipants, // Por defecto marcamos a todos si viene vacío
            settledWith: selectedExpense.settledWith || []
        });
        setIsEditingExpense(true);
        setSelectedExpense(null);
        setShowExpenseModal(true);
    };

    const handleDeleteExpense = (id) => {
        const confirmDelete = window.confirm("¿Estás seguro de que quieres borrar este gasto? Esta acción actualizará los balances.");
        if (confirmDelete) {
            setExpensesList(expensesList.filter(exp => exp.id !== id));
            setSelectedExpense(null);
        }
    };

    const toggleSettleDebt = (expenseId, personName) => {
        const updatedExpenses = expensesList.map(exp => {
            if (exp.id === expenseId) {
                const settledList = exp.settledWith || [];
                const isAlreadySettled = settledList.includes(personName);
                const newSettledWith = isAlreadySettled
                    ? settledList.filter(p => p !== personName) 
                    : [...settledList, personName]; 
                
                const updatedExp = { ...exp, settledWith: newSettledWith };
                
                if (selectedExpense && selectedExpense.id === expenseId) {
                    setSelectedExpense(updatedExp);
                }
                return updatedExp;
            }
            return exp;
        });
        setExpensesList(updatedExpenses);
    };

    const getCategoryIcon = (category) => {
        switch(category) { 
            case "Comida": return "fa-solid fa-utensils"; 
            case "Transporte": return "fa-solid fa-taxi"; 
            default: return "fa-solid fa-receipt"; 
        }
    };

    // 📸 Extraemos solo los primeros 3 gastos para la vista principal
    const previewExpenses = expensesList.slice(0, 3);

    return (
        <>
            <div className="expenses-section">
                <div className="expenses-header">
                    <h2>Control de Gastos</h2>
                    <button 
                        className="btn-add-expense-small" 
                        onClick={() => { 
                            setIsEditingExpense(false); 
                            setExpenseData({ description: "", amount: "", category: "Comida", paidBy: allParticipants[0] || "Yo", splitMethod: "equally", splitWith: allParticipants, settledWith: [] }); 
                            setShowExpenseModal(true); 
                        }}
                    >
                        <i className="fa-solid fa-plus"></i> Añadir
                    </button>
                </div>
                
                {expensesList.length > 0 ? (
                    <>
                        <div className="expenses-grid">
                            {previewExpenses.map((expense) => (
                                <div key={expense.id} className="expense-card clickable" onClick={() => setSelectedExpense(expense)}>
                                    <div className="expense-card-icon">
                                        <i className={getCategoryIcon(expense.category)}></i>
                                    </div>
                                    <div className="expense-card-info">
                                        <h4>{expense.description}</h4>
                                        <span className="expense-payer">{expense.paidBy} pagó por {expense.splitWith ? expense.splitWith.length : 0}</span>
                                    </div>
                                    <div className="expense-card-amount">
                                        <h4>{expense.amount} €</h4>
                                        <span>{expense.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* 📸 BOTÓN PARA VER TODOS LOS GASTOS SI HAY MÁS DE 3 */}
                        {expensesList.length > 3 && (
                            <button 
                                className="btn-action" 
                                style={{ marginTop: "15px", marginBottom: "10px" }}
                                onClick={() => setShowAllExpensesModal(true)}
                            >
                                <i className="fa-solid fa-list-ul"></i> Ver todos los gastos ({expensesList.length})
                            </button>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <i className="fa-solid fa-wallet"></i>
                        <h3>Aún no hay gastos registrados</h3>
                        <button className="btn-action" onClick={() => setShowExpenseModal(true)}>Añadir Gasto</button>
                    </div>
                )}
            </div>

            {/* --- MODAL TODOS LOS GASTOS --- */}
            {showAllExpensesModal && (
                <div className="modal-overlay" onClick={() => setShowAllExpensesModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto', backgroundColor: "#f8fafc" }}>
                        <div className="activity-modal-header" style={{ marginBottom: "20px" }}>
                            <h3>Historial de Gastos</h3>
                            <button className="btn-close-modal" onClick={() => setShowAllExpensesModal(false)}>&times;</button>
                        </div>
                        <div className="expenses-grid">
                            {expensesList.map((expense) => (
                                <div key={expense.id} className="expense-card clickable" style={{ background: "white" }} onClick={() => {
                                    setShowAllExpensesModal(false); // Cerramos el historial
                                    setSelectedExpense(expense); // Abrimos el detalle
                                }}>
                                    <div className="expense-card-icon">
                                        <i className={getCategoryIcon(expense.category)}></i>
                                    </div>
                                    <div className="expense-card-info">
                                        <h4>{expense.description}</h4>
                                        <span className="expense-payer">{expense.paidBy} pagó por {expense.splitWith ? expense.splitWith.length : 0}</span>
                                    </div>
                                    <div className="expense-card-amount">
                                        <h4>{expense.amount} €</h4>
                                        <span>{expense.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CREAR/EDITAR --- */}
            {showExpenseModal && (
                <div className="modal-overlay" onClick={cerrarModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="activity-modal-header">
                            <h3>{isEditingExpense ? "Editar Gasto" : "Añadir Nuevo Gasto"}</h3>
                            <button className="btn-close-modal" type="button" onClick={cerrarModal}>&times;</button>
                        </div>
                        <form onSubmit={handleExpenseSubmit} className="expense-form">
                            <div className="input-group full-width">
                                <label>Descripción</label>
                                <input type="text" name="description" value={expenseData.description} onChange={handleExpenseChange} required />
                            </div>
                            <div className="expense-row">
                                <div className="input-group">
                                    <label>Importe (€)</label>
                                    <input type="number" step="0.01" min="0" name="amount" value={expenseData.amount} onChange={handleExpenseChange} required />
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
                            
                            {expenseData.splitMethod === "custom" && (
                                <div className="custom-split-container">
                                    <div className="checkbox-grid">
                                        {allParticipants.map((p, i) => (
                                            <label key={i} className="checkbox-label">
                                                <input 
                                                    type="checkbox" 
                                                    // Paracaídas aquí: aseguramos que lea un array y no de error
                                                    checked={(expenseData.splitWith || []).includes(p)} 
                                                    onChange={() => handleCheckboxChange(p)} 
                                                />
                                                <div className="custom-checkbox"></div> {p}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="modal-actions-itinerary">
                                <button type="button" className="btn-modal-cancel" onClick={cerrarModal}>Cancelar</button>
                                <button type="submit" className="btn-modal-confirm" disabled={loading}>
                                    {loading ? "Guardando..." : (isEditingExpense ? "Actualizar" : "Guardar")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL DESGLOSE --- */}
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
                            <h4>División del gasto ({selectedExpense.splitWith ? selectedExpense.splitWith.length : 0} personas)</h4>
                            
                            {/* Paracaídas aquí también al mapear */}
                            {(selectedExpense.splitWith || []).map((person, index) => {
                                const amountPerPerson = (selectedExpense.amount / (selectedExpense.splitWith || allParticipants).length).toFixed(2);
                                const isPayer = person === selectedExpense.paidBy;
                                const isSettled = (selectedExpense.settledWith || []).includes(person);

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