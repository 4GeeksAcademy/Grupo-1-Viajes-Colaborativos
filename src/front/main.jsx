// src/front/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css' 
import { RouterProvider } from "react-router-dom"; 
import { router } from "./routes"; 
import { StoreProvider } from './hooks/useGlobalReducer'; 
import { BackendURL } from './components/BackendURL';

const Main = () => {
    // Si no hay URL de backend, mostramos el aviso
    if(!import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL == "") {
        return <BackendURL />;
    }

    return (
        <StoreProvider> 
            {/* RouterProvider DEBE ser el único que maneje la vista */}
            <RouterProvider router={router} />
        </StoreProvider>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Main />)