export const initialStore = () => {
  return {
    message: null,
    // --- ESTADOS PARA EL BACKEND ---
    currentTrip: null,      // Aquí guardaremos el viaje actual
    itinerary: [],          // Actividades del viaje
    expenses: [],           // Gastos del viaje
    messages: [],           // Mensajes del chat
    travelers: [],          // Compañeros de viaje
    loading: false          // Para saber si estamos cargando datos
  }
}

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case 'set_hello':
      return { ...store, message: action.payload };

    // --- NUEVOS CASES PARA LA CONEXIÓN ---
    
    // Carga todos los detalles del viaje
    case 'load_trip_details':
      return {
        ...store,
        currentTrip: action.payload.trip,
        itinerary: action.payload.itinerary,
        expenses: action.payload.expense,
        travelers: action.payload.travelers,
        messages: action.payload.messages
      };

    // Añadir un mensaje nuevo al chat en tiempo real
    case 'add_message':
      return {
        ...store,
        messages: [...store.messages, action.payload]
      };

    case 'set_loading':
      return { ...store, loading: action.payload };

    default:
      return store; 
  }
}

// --- ACTIONS (Las funciones que llamarán a tu Backend) ---
export const getActions = ({ getStore, getActions, setStore }) => {
  return {
    loadTripData: async (tripId) => {
      const token = localStorage.getItem("token"); // Asegúrate de que el token se guarde con este nombre al hacer Login
      
      try {
        const response = await fetch(`${process.env.BACKEND_URL}/api/trip-detail/${tripId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) throw new Error("No se pudo cargar el viaje");

        const data = await response.json();
        
        // ¡LA MAGIA OCURRE AQUÍ! Guardamos los datos recibidos en el estado global
        setStore({
            currentTrip: data.trip,
            itinerary: data.itinerary,
            expenses: data.expense,
            travelers: data.travelers,
            messages: data.messages
        });

        return data; 

      } catch (error) {
        console.error("Error cargando viaje:", error);
      }
    }
  }
}