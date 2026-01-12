import LoginPage from "@app/modules/auth/pages/LoginPage";
import RegisterPage from "@app/modules/auth/pages/RegisterPage";
import { ITLoader } from "axzy_ui_system";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { PrivateRoutes } from "./core/routes/PrivateRoutes";
import { setAuth } from "./core/store/auth/auth.slice";
import HomePage from "./modules/home/pages/HomePage";

import LocationsPage from "./modules/locations/pages/LocationsPage";
import EntriesPage from "./modules/entries/pages/EntriesPage";
import EntryDetailPage from "./modules/entries/pages/EntryDetailPage";
import MovementsPage from "./modules/movements/pages/MovementsPage";
import ExitsPage from "./modules/exits/pages/ExitsPage";
import UsersPage from "./modules/users/pages/UsersPage";
import KeyAssignmentsPage from "./modules/key-assignments/pages/KeyAssignmentsPage";


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
        <Route path="/entries" element={<EntriesPage />} />
        <Route path="/assignments" element={<KeyAssignmentsPage />} />
        <Route path="/entries/:id" element={<EntryDetailPage />} />
        <Route path="/movements" element={<MovementsPage />} />
        <Route path="/exits" element={<ExitsPage />} />
        <Route path="/users" element={<UsersPage />} />

      </Route>
      <Route path="*" element={<Navigate to="/home" />} />
    </Routes>
  );
}

export default App;
