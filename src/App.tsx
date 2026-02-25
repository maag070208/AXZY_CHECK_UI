import LoginPage from "@app/modules/auth/pages/LoginPage";
import RegisterPage from "@app/modules/auth/pages/RegisterPage";
import { ITLoader } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { PrivateRoutes } from "./core/routes/PrivateRoutes";
import { setAuth } from "./core/store/auth/auth.slice";
import HomePage from "./modules/home/pages/HomePage";

import LocationsPage from "./modules/locations/pages/LocationsPage";
import UsersPage from "./modules/users/pages/UsersPage";
import IncidentsPage from "./modules/incidents/pages/IncidentsPage";
import MaintenancesPage from "./modules/maintenances/pages/MaintenancesPage";
import KardexPage from "./modules/kardex/pages/KardexPage";
import RoundsPage from "./modules/rounds/pages/RoundsPage";
import RoundDetailPage from "./modules/rounds/pages/RoundDetailPage";
import SchedulesPage from "./modules/schedules/pages/SchedulesPage";
import RoutesPage from "./modules/routes/pages/RoutesPage";


function App() {
  const token = useSelector((state: any) => state.auth.token);
  const dispatch = useDispatch();

  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeunload", () => {});
    window.addEventListener("unload", handleTabClosing);
    return () => {
      window.removeEventListener("beforeunload", () => {});
      window.removeEventListener("unload", handleTabClosing);
    };
  });

  const handleTabClosing = () => {
    localStorage.setItem("token", token);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && storedToken !== "null") {
      dispatch(setAuth(storedToken));
    }
    setIsAppReady(true);
  }, [dispatch]);

  if (!isAppReady) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <ITLoader size="lg" />
      </div>
    );
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PrivateRoutes />}>
        <Route path="/home" element={<HomePage />} />
        
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/maintenances" element={<MaintenancesPage />} />
        <Route path="/kardex" element={<KardexPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        
        <Route path="/rounds" element={<RoundsPage />} />
        <Route path="/rounds/:id" element={<RoundDetailPage />} />
        <Route path="/routes" element={<RoutesPage />} />

      </Route>
      <Route path="*" element={<Navigate to="/home" />} />
    </Routes>
  );
}

export default App;
