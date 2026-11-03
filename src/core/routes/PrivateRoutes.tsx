import { ITLayout } from "@axzydev/axzy_ui_system";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useNavigationItems } from "../constants/navbar.constants";
import { blobatarUri } from "blobatar/uri";
import { RoleLogo } from "../components/RoleLogo";
import { post } from "../axios/axios";
import { isAuthenticated, logout as logoutAction } from "../store/auth/auth.slice";
import { AppState, AppDispatch } from "../store/store";
import { useTenantBootstrap } from "../store/tenant/useTenantBootstrap";
import { ClientSelector } from "@modules/clients/components/ClientSelector";

/**
 * Cierre de sesión real (F9 · T-F9-10): avisa al API (marca isLoggedIn=false),
 * limpia el estado de Redux y borra el token persistido. Antes solo navegaba a
 * /login, y el token seguía guardado en localStorage.
 */
const signOut = async (dispatch: AppDispatch, navigate: (to: string) => void) => {
  try {
    await post("/users/logout", {});
  } catch {
    // Si el API no responde, igual cerramos la sesión local.
  } finally {
    localStorage.removeItem("token");
    dispatch(logoutAction());
    navigate("/login");
  }
};

export const PrivateRoutes = () => {
  const isAuth = useSelector(isAuthenticated);
  const user = useSelector((state: AppState) => state.auth);
  const selectionVersion = useSelector((state: AppState) => state.tenant.selectionVersion);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const navigationItems = useNavigationItems();
  const { canSelectClients, clients, selectedClientId, status, selectClient, reload } = useTenantBootstrap();

  return isAuth ? (
    <ITLayout
      topBar={{
        logo: <RoleLogo className="h-8 w-auto" />,
        userMenu: {
          userName: user.name || "Usuario",
          userEmail: "",
          userImage: user.photoUrl ?? blobatarUri(user.name || "Usuario", { size: 64 }),
          menuItems: [
            {
              label: "Cerrar Sesión",
              onClick: () => {
                void signOut(dispatch, navigate);
              },
            },
          ],
        },
      }}
      sidebar={{
        navigationItems: navigationItems,
      }}
      contentClassName="mx-0! px-8! max-w-full! mb-12! bg-slate-50!"
    >
      {canSelectClients && (
        <ClientSelector
          clients={clients}
          selectedClientId={selectedClientId}
          status={status}
          onSelect={selectClient}
          onRetry={reload}
        />
      )}
      {/*
        Al cambiar de cliente se remonta la vista actual (key = generación de la
        selección): así ninguna pantalla conserva filas ni estado del cliente
        anterior y todas vuelven a pedir sus datos con el nuevo X-Client-Id.
      */}
      <div key={canSelectClients ? `${user.id}:${selectionVersion}` : "tenant-fixed"}>
        <Outlet />
      </div>
    </ITLayout>
  ) : (
    <Navigate to="/login" />
  );
};
