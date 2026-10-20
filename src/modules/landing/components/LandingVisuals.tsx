import currentHome from "@assets/landing/current-home-crop.png";
import currentUsers from "@assets/landing/current-users-crop.png";
import currentAppHome from "@assets/landing/current-app-home.png";

const BrowserTop = () => (
  <div className="lp-browser-top">
    <span className="lp-browser-dot" />
    <span className="lp-browser-dot" />
    <span className="lp-browser-dot" />
    <span className="lp-browser-url" />
  </div>
);

/** Hero: captura real del monitoreo en vivo (WEB actual). */
export const DashboardMockup = () => (
  <div className="lp-dashboard lp-dashboard-real">
    <img className="lp-real-shot" src={currentHome} alt="Monitoreo en vivo de CheckApp" />
  </div>
);

/** Teléfono del hero: captura real de la app actual. */
export const PhoneMockup = () => (
  <div className="lp-phone" aria-hidden="true">
    <div className="lp-phone-screen lp-phone-screen-real">
      <img src={currentAppHome} alt="" />
    </div>
  </div>
);

/** Consola web: captura real del directorio de usuarios (WEB actual). */
export const WebConsoleVisual = () => (
  <div className="lp-browser lp-browser-real" aria-hidden="true">
    <BrowserTop />
    <img className="lp-module-shot" src={currentUsers} alt="" />
  </div>
);

/** App móvil: captura real de la app de campo actual. */
export const GuardAppVisual = () => (
  <div className="lp-module-phone" aria-hidden="true">
    <div className="lp-module-phone-screen lp-phone-screen-real">
      <img src={currentAppHome} alt="" />
    </div>
  </div>
);
