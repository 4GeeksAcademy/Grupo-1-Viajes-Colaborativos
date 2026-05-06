/**
 * Punto de entrada principal de React.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css' 
import { RouterProvider } from "react-router-dom"; 
import { router } from "./routes"; 
import { StoreProvider } from './hooks/useGlobalReducer'; 
import { BackendURL } from './components/BackendURL';

/**
 * Componente principal.
 * Verifica la configuración del backend.
 */
const Main = () => {
    // Si no hay URL de backend, mostramos el aviso
    if(!import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL == "") {
        return <BackendURL />;
    }

    return (
        <StoreProvider> 
            <RouterProvider router={router} />
        </StoreProvider>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Main />)