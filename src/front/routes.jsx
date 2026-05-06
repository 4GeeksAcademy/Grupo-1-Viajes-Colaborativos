/**
 * Configuración de rutas de React Router.
 */
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
import { AuthPage } from "./pages/AuthPage";
import { MyTrips } from "./pages/MyTrips";
import { NewTrip } from "./pages/NewTrip";
import { TripDetails } from "./pages/TripDetails";
import { Profile } from "./pages/Profile";
import { ExploreDestination } from "./pages/ExploreDestination";
import { DestinationDetails } from "./pages/DestinationDetails";
import { VerifyEmail } from "./pages/VerifyEmail";


/**
 * Router principal de la aplicación.
 */
export const router = createBrowserRouter(
    createRoutesFromElements(
      // Ruta raíz con Layout (Navbar y Footer)
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>}>
            
            {/* Landing Page */}
            <Route index element={<LandingPage />} />

            {/* Login/Registro */}
            <Route path="/login" element={<AuthPage />} />

            {/* Verificar email */}
            <Route path="/verify" element={<VerifyEmail />} />

            {/* Mis viajes */}
            <Route element={<MyTrips />} path="/my-trips" />

            {/* Nuevo viaje */}
            <Route path="/new-trip" element={<NewTrip />} />

            {/* Detalles del viaje */}
            <Route path="/trip-details/:id" element={<TripDetails />} />

            {/* Perfil */}
            <Route path="/profile" element={<Profile />} />

            {/* Explorador de destinos */}
            <Route path="/explore" element={<ExploreDestination />} />
            <Route path="/destination-details/:locationId/:locationName" element={<DestinationDetails />} />

            {/* home */}
            <Route path="/home" element={<Home />} />
            
            {/* Rutas de demostración */}
            <Route path="/single/:theId" element={<Single />} />
            <Route path="/demo" element={<Demo />} />
            
        </Route>
    )
);