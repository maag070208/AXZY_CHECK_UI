import { ITBadget, ITLayout } from "@axzydev/axzy_ui_system";
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
  const appEnv = import.meta.env.VITE_APP_ENV;
  const isProd = appEnv === "PROD";

  const badgeRow = (
    <div className="flex items-center gap-2 px-3 py-2">
      <ITBadget
        label={`v${import.meta.env.VITE_APP_VERSION}`}
        color={isProd ? "success" : "warning"}
        variant="filled"
        size="small"
      />
      <ITBadget
        label={appEnv}
        color={isProd ? "success" : "warning"}
        variant="outlined"
        size="small"
      />
    </div>
  );

  const badgeLabel = new Proxy(badgeRow as unknown as object, {
    get: (target, prop, receiver) => {
      if (prop === "toLowerCase") return () => "";
      return Reflect.get(target, prop, receiver);
    },
  }) as unknown as string;

  return isAuth ? (
    <ITLayout
      topBar={{
        logo: <NAVBAR_LOGO />,
        userMenu: {
          userName: user.name || "Usuario",
          userEmail: "",
          menuItems: [
            {
              label: badgeLabel,
              onClick: () => {},
            },
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
