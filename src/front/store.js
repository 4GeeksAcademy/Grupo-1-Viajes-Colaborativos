/**
 * Estado global de la aplicación.
 */

// =============================================================================
// ESTADO INICIAL
// =============================================================================

export const initialStore = () => {
  return {
    message: null,
    currentTrip: null,      // Viaje actual
    itinerary: [],          // Actividades del viaje
    expenses: [],           // Gastos del viaje
    messages: [],           // Mensajes del chat
    travelers: [],          // Compañeros de viaje
    loading: false          // Indicador de carga
  }
}

// =============================================================================
// REDUCER - Maneja los cambios de estado
// =============================================================================

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case 'set_hello':
      return { ...store, message: action.payload };

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

    // Añadir un mensaje nuevo al chat
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

// =============================================================================
// ACTIONS - Funciones que llaman al Backend
// =============================================================================

export const getActions = ({ getStore, getActions, setStore }) => {
  return {
    loadTripData: async (tripId) => {
      const token = localStorage.getItem("token");
      
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
        
        // Guardamos los datos en el estado global
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