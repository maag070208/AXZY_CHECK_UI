import LoginPage from "@app/modules/auth/pages/LoginPage";
import { ITFlex, ITLoader } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoutes } from "./core/routes/PrivateRoutes";
import { PermissionRoute } from "./core/routes/PermissionRoute";
import { P } from "./core/permissions/permissions.constants";
import { setAuth, setPermissions } from "./core/store/auth/auth.slice";
import { getMyPermissions } from "./modules/auth/services/AuthService";
import HomePage from "./modules/home/pages/HomePage";

import LocationsPage from "./modules/locations/pages/LocationsPage";
import PropertiesPage from "./modules/properties/pages/PropertiesPage";

import ResidentsPage from "./modules/residents/pages/ResidentsPage";
import ResidentDetailPage from "./modules/residents/pages/ResidentDetailPage";
import ResidentFormPage from "./modules/residents/pages/ResidentFormPage";
import InvitationsPage from "./modules/invitations/pages/InvitationsPage";
import AnnouncementsPage from "./modules/announcements/pages/AnnouncementsPage";
import VehiclesPage from "./modules/vehicles/pages/VehiclesPage";
import UsersPage from "./modules/users/pages/UsersPage";
import IncidentsPage from "./modules/incidents/pages/IncidentsPage";
import ComplaintsPage from "./modules/complaints/pages/ComplaintsPage";
import FinancePage from "./modules/finance/pages/FinancePage";
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
import RolesPermissionsPage from "./modules/rbac/pages/RolesPermissionsPage";
import ResidentPortalPage from "./modules/resident/pages/ResidentPortalPage";

function App() {
  const token = useSelector((state: any) => state.auth.token);
  const permissions = useSelector((state: any) => state.auth.permissions);
  const dispatch = useDispatch();

  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && storedToken !== "null") {
      dispatch(setAuth(storedToken));
    }
    setIsAppReady(true);
  }, [dispatch]);

  useEffect(() => {
    if (!token || permissions !== null) return;

    getMyPermissions()
      .then((res) => {
        dispatch(
          setPermissions(res.success && res.data?.permissions ? res.data.permissions : []),
        );
      })
      .catch(() => {
        // Fail closed: sin permisos no se pinta nada protegido.
        dispatch(setPermissions([]));
      });
  }, [token, permissions, dispatch]);

  if (!isAppReady) {
    return (
      <ITFlex align="center" justify="center" className="flex h-screen items-center justify-center">
        <ITLoader size="lg" />
      </ITFlex>
    );
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/:role" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route element={<PrivateRoutes />}>
        <Route path="/home" element={<HomePage />} />

        <Route path="/guards" element={<PermissionRoute permissions={P.ASSIGNMENTS_MANAGE}><GuardsPage /></PermissionRoute>} />
        <Route path="/locations" element={<PermissionRoute permissions={P.LOCATIONS_MANAGE}><LocationsPage /></PermissionRoute>} />

        <Route path="/properties" element={<PermissionRoute permissions={P.PROPERTIES_VIEW}><PropertiesPage /></PermissionRoute>} />
        <Route path="/properties/:id" element={<PermissionRoute permissions={P.PROPERTIES_VIEW}><PropertyDetailPage /></PermissionRoute>} />

        <Route path="/residents" element={<PermissionRoute permissions={P.PROPERTIES_VIEW}><ResidentsPage /></PermissionRoute>} />
        <Route path="/residents/nuevo" element={<PermissionRoute permissions={P.PROPERTIES_VIEW}><ResidentFormPage /></PermissionRoute>} />
        <Route path="/residents/:id" element={<PermissionRoute permissions={P.PROPERTIES_VIEW}><ResidentDetailPage /></PermissionRoute>} />
        <Route path="/residents/:id/editar" element={<PermissionRoute permissions={P.PROPERTIES_VIEW}><ResidentFormPage /></PermissionRoute>} />
        <Route path="/invitations" element={<PermissionRoute permissions={P.ACCESS_CHECK}><InvitationsPage /></PermissionRoute>} />
        <Route path="/announcements" element={<PermissionRoute permissions={P.ANNOUNCEMENT_VIEW}><AnnouncementsPage /></PermissionRoute>} />
        <Route path="/vehicles" element={<PermissionRoute permissions={P.VEHICLE_VIEW}><VehiclesPage /></PermissionRoute>} />

        <Route path="/users" element={<PermissionRoute permissions={P.USERS_MANAGE}><UsersPage /></PermissionRoute>} />
        <Route path="/roles" element={<PermissionRoute permissions={P.USERS_MANAGE}><RolesPermissionsPage /></PermissionRoute>} />
        <Route path="/resident" element={<PermissionRoute permissions={P.RESIDENT_SELF}><ResidentPortalPage /></PermissionRoute>} />
        <Route path="/incidents" element={<PermissionRoute permissions={P.INCIDENT_VIEW}><IncidentsPage /></PermissionRoute>} />
        <Route path="/complaints" element={<PermissionRoute permissions={P.COMPLAINT_VIEW}><ComplaintsPage /></PermissionRoute>} />
        <Route path="/finance" element={<PermissionRoute permissions={P.CHARGE_MANAGE}><FinancePage /></PermissionRoute>} />
        {/* Crear reportes de club lo puede hacer cualquier staff; resolver exige club.manage. */}
        <Route path="/club" element={<PermissionRoute permissions={P.CLUB_VIEW}><ClubPage /></PermissionRoute>} />
        <Route path="/maintenances" element={<PermissionRoute permissions={P.MAINTENANCE_VIEW}><MaintenancesPage /></PermissionRoute>} />
        <Route path="/kardex" element={<PermissionRoute permissions={P.KARDEX_VIEW}><KardexPage /></PermissionRoute>} />
        <Route path="/schedules" element={<PermissionRoute permissions={P.SCHEDULES_MANAGE}><SchedulesPage /></PermissionRoute>} />

        <Route path="/rounds" element={<PermissionRoute permissions={P.ROUND_VIEW}><RoundsPage /></PermissionRoute>} />
        <Route path="/rounds/:id" element={<PermissionRoute permissions={P.ROUND_VIEW}><RoundDetailPage /></PermissionRoute>} />
        <Route path="/routes" element={<PermissionRoute permissions={P.RECURRING_MANAGE}><RoutesPage /></PermissionRoute>} />
        <Route path="/catalogs" element={<PermissionRoute permissions={P.CATALOGS_MANAGE}><CatalogsPage /></PermissionRoute>} />
        <Route path="/guard-tracking" element={<PermissionRoute permissions={P.DASHBOARD_VIEW}><GuardTrackingPage /></PermissionRoute>} />
        <Route path="/chat" element={<PermissionRoute permissions={P.CHAT_USE}><ChatPage /></PermissionRoute>} />
        <Route path="/shift-handover" element={<PermissionRoute permissions={P.SHIFT_HANDOVER_MANAGE}><ShiftHandoverPage /></PermissionRoute>} />
        <Route path="/shift-handover/nuevo" element={<PermissionRoute permissions={P.SHIFT_HANDOVER_MANAGE}><NewShiftHandoverPage /></PermissionRoute>} />
        <Route path="/uniform" element={<PermissionRoute permissions={P.UNIFORM_MANAGE}><UniformPage /></PermissionRoute>} />
        <Route path="/uniform/nuevo" element={<PermissionRoute permissions={P.UNIFORM_MANAGE}><NewUniformCheckPage /></PermissionRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/home" />} />
    </Routes>
  );
}

export default App;
