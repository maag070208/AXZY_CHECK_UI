import homeAnalytics from "@assets/landing/home_analytics.png";
import homeDetail from "@assets/landing/home_detalle_operativo.png";
import guardScreen from "@assets/landing/home_guard_screen.png";
import adminScreen from "@assets/landing/home_admin_screen.png";
import clientHome from "@assets/landing/home_page.png";

const BrowserTop = () => (
  <div className="lp-browser-top">
    <span className="lp-browser-dot" />
    <span className="lp-browser-dot" />
    <span className="lp-browser-dot" />
    <span className="lp-browser-url" />
  </div>
);

/** Panel operativo del hero: captura real de la consola web. */
export const DashboardMockup = () => (
  <div className="lp-dashboard lp-dashboard-real">
    <img
      className="lp-real-shot"
      src={homeAnalytics}
      alt="Panel de Security Analytics de CheckApp"
    />
  </div>
);

/** Teléfono del hero: captura real de la app de guardia. */
export const PhoneMockup = () => (
  <div className="lp-phone" aria-hidden="true">
    <div className="lp-phone-screen lp-phone-screen-real">
      <img src={guardScreen} alt="" />
    </div>
  </div>
);

/** Consola web: captura real de Detalle Operativo. */
export const WebConsoleVisual = () => (
  <div className="lp-browser lp-browser-real" aria-hidden="true">
    <BrowserTop />
    <img className="lp-module-shot" src={homeDetail} alt="" />
  </div>
);

/** App de guardia: captura real de la app móvil. */
export const GuardAppVisual = () => (
  <div className="lp-module-phone" aria-hidden="true">
    <div className="lp-module-phone-screen lp-phone-screen-real">
      <img src={guardScreen} alt="" />
    </div>
  </div>
);

/** App de supervisión: captura real del panel móvil de administración. */
export const SupervisorAppVisual = () => (
  <div className="lp-module-phone" aria-hidden="true">
    <div className="lp-module-phone-screen lp-phone-screen-real">
      <img src={adminScreen} alt="" />
    </div>
  </div>
);

/** Portal del cliente: captura real del portal web. */
export const ClientPortalVisual = () => (
  <div className="lp-browser lp-browser-real" aria-hidden="true">
    <BrowserTop />
    <img className="lp-module-shot" src={clientHome} alt="" />
  </div>
);
