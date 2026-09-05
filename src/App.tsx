import LoginPage from "@app/modules/auth/pages/LoginPage";
import RegisterPage from "@app/modules/auth/pages/RegisterPage";
import { ITLoader } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { PrivateRoutes } from "./core/routes/PrivateRoutes";
import { RoleRoute } from "./core/routes/RoleRoute";
import { setAuth } from "./core/store/auth/auth.slice";
import HomePage from "./modules/home/pages/HomePage";

import LocationsPage from "./modules/locations/pages/LocationsPage";
import PropertiesPage from "./modules/properties/pages/PropertiesPage";

import ResidentsPage from "./modules/residents/pages/ResidentsPage";
import InvitationsPage from "./modules/invitations/pages/InvitationsPage";
import UsersPage from "./modules/users/pages/UsersPage";
import IncidentsPage from "./modules/incidents/pages/IncidentsPage";
import ClubPage from "./modules/club/pages/ClubPage";
import MaintenancesPage from "./modules/maintenances/pages/MaintenancesPage";
import KardexPage from "./modules/kardex/pages/KardexPage";
import RoundsPage from "./modules/rounds/pages/RoundsPage";
import RoundDetailPage from "./modules/rounds/pages/RoundDetailPage";
import SchedulesPage from "./modules/schedules/pages/SchedulesPage";
import RoutesPage from "./modules/routes/pages/RoutesPage";
import GuardsPage from "./modules/guards/pages/GuardsPage";
import PropertyDetailPage from "./modules/properties/pages/PropertyDetailPage";
import CatalogsPage from "./modules/catalogs/pages/CatalogsPage";
import GuardTrackingPage from "./modules/guard-tracking/pages/GuardTrackingPage";
import ChatPage from "./modules/chat/pages/ChatPage";
import ShiftHandoverPage from "./modules/shift-handover/pages/ShiftHandoverPage";
import NewShiftHandoverPage from "./modules/shift-handover/pages/NewShiftHandoverPage";
import UniformPage from "./modules/uniform/pages/UniformPage";
import NewUniformCheckPage from "./modules/uniform/pages/NewUniformCheckPage";


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
        <Route path="/guards" element={<RoleRoute roles={["ADMIN", "SHIFT"]}><GuardsPage /></RoleRoute>} />

        <Route path="/locations" element={<RoleRoute roles={["ADMIN", "SHIFT"]}><LocationsPage /></RoleRoute>} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />

        <Route path="/residents" element={<ResidentsPage />} />
        <Route path="/invitations" element={<InvitationsPage />} />
        <Route path="/users" element={<RoleRoute roles={["ADMIN"]}><UsersPage /></RoleRoute>} />
        <Route path="/incidents" element={<RoleRoute roles={["ADMIN", "SHIFT"]}><IncidentsPage /></RoleRoute>} />
        <Route path="/club" element={<RoleRoute roles={["ADMIN", "SHIFT", "GUARD", "MAINT"]}><ClubPage /></RoleRoute>} />
        <Route path="/maintenances" element={<RoleRoute roles={["ADMIN", "MAINT"]}><MaintenancesPage /></RoleRoute>} />
        <Route path="/kardex" element={<RoleRoute roles={["ADMIN", "SHIFT"]}><KardexPage /></RoleRoute>} />
        <Route path="/schedules" element={<RoleRoute roles={["ADMIN"]}><SchedulesPage /></RoleRoute>} />

        <Route path="/rounds" element={<RoleRoute roles={["ADMIN", "SHIFT"]}><RoundsPage /></RoleRoute>} />
        <Route path="/rounds/:id" element={<RoleRoute roles={["ADMIN", "SHIFT"]}><RoundDetailPage /></RoleRoute>} />
        <Route path="/routes" element={<RoleRoute roles={["ADMIN", "SHIFT"]}><RoutesPage /></RoleRoute>} />
        <Route path="/catalogs" element={<RoleRoute roles={["ADMIN"]}><CatalogsPage /></RoleRoute>} />
        <Route path="/guard-tracking" element={<RoleRoute roles={["ADMIN", "SHIFT"]}><GuardTrackingPage /></RoleRoute>} />
        <Route path="/chat" element={<RoleRoute roles={["ADMIN", "SHIFT"]}><ChatPage /></RoleRoute>} />
        <Route path="/shift-handover" element={<RoleRoute roles={["ADMIN", "SHIFT"]}><ShiftHandoverPage /></RoleRoute>} />
        <Route path="/shift-handover/nuevo" element={<RoleRoute roles={["ADMIN", "SHIFT"]}><NewShiftHandoverPage /></RoleRoute>} />
        <Route path="/uniform" element={<RoleRoute roles={["ADMIN", "SHIFT"]}><UniformPage /></RoleRoute>} />
        <Route path="/uniform/nuevo" element={<RoleRoute roles={["ADMIN", "SHIFT"]}><NewUniformCheckPage /></RoleRoute>} />

      </Route>
      <Route path="*" element={<Navigate to="/home" />} />
    </Routes>
  );
}

export default App;
