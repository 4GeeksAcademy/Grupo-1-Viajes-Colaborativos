// Import necessary components and functions from react-router-dom.
import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage"; // <-- Importamos la nueva página de Login/Registro
import { MyTrips } from "./pages/MyTrips";
import { NewTrip } from "./pages/NewTrip";
import { TripDetails } from "./pages/TripDetails";
import { Profile } from "./pages/Profile";

export const router = createBrowserRouter(
    createRoutesFromElements(
    // CreateRoutesFromElements function allows you to build route elements declaratively.
    // Create your routes here, if you want to keep the Navbar and Footer in all views, add your new routes inside the containing Route.
    // Root, on the contrary, create a sister Route, if you have doubts, try it!
    // Note: keep in mind that errorElement will be the default page when you don't get a route, customize that page to make your project more attractive.
    // Note: The child paths of the Layout element replace the Outlet component with the elements contained in the "element" attribute of these child paths.

      // Root Route: All navigation will start from here.
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>}>
            
            {/* Landing Page es la vista por defecto al entrar a la web */}
            <Route index element={<LandingPage />} />

            {/* Ruta para el sistema de Autenticación (Login/Registro) */}
            <Route path="/login" element={<AuthPage />} />

            {/* Ruta para el sistema de Autenticación (mytrips) */}
            <Route element={<MyTrips />} path="/my-trips" />

            {/* Ruta para el sistema de Autenticación (newtrip) */}
            <Route path="/new-trip" element={<NewTrip />} />

            {/* ¡AQUÍ ESTÁ LA CORRECCIÓN! Cambiamos /trip/ por /trip-details/ */}
            <Route path="/trip-details/:id" element={<TripDetails />} />

            <Route path="/profile" element={<Profile />} />

            {/* Cambiamos el path de Home a "/home" para que no choque con la Landing Page */}
            <Route path="/home" element={<Home />} />
            
            {/* Rutas dinámicas y de demostración */}
            <Route path="/single/:theId" element={<Single />} />
            <Route path="/demo" element={<Demo />} />
            
        </Route>
    )
);