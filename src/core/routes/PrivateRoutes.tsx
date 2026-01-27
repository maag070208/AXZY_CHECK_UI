import { ITLayout } from "axzy_ui_system";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { NAVBAR_LOGO, useNavigationItems } from "../constants/navbar.constants";
import { isAuthenticated, logout } from "../store/auth/auth.slice";
import { AppDispatch, AppState } from "../store/store";

export const PrivateRoutes = () => {
  const isAuth = useSelector(isAuthenticated);
  const user = useSelector((state: AppState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
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
                dispatch(logout());
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
