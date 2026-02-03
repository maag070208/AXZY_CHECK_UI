import { ITLayout } from "axzy_ui_system";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { NAVBAR_LOGO, useNavigationItems } from "../constants/navbar.constants";
import { isAuthenticated } from "../store/auth/auth.slice";
import { AppState } from "../store/store";

export const PrivateRoutes = () => {
  const isAuth = useSelector(isAuthenticated);
  const user = useSelector((state: AppState) => state.auth);
  const navigate = useNavigate();
  const navigationItems = useNavigationItems();

  return isAuth ? (
    <ITLayout
      topBar={{
        logo: <NAVBAR_LOGO />,
        userMenu: {
          userName: user.name || "Usuario",
          userEmail: "",
          menuItems: [
            {
              label: "Cerrar Sesión",
              onClick: () => {
                navigate("/login");
              },
            },
          ],
        },
      }}
      sidebar={{
        navigationItems: navigationItems,
      }}
    >
      <Outlet />
    </ITLayout>
  ) : (
    <Navigate to="/login" />
  );
};
