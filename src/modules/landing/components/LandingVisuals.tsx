import currentUsers from "@assets/landing/current-users-crop.png";
import currentAppInicio from "@assets/landing/app-home-sync.png";

const BrowserTop = () => (
  <div className="lp-browser-top">
    <span className="lp-browser-dot" />
    <span className="lp-browser-dot" />
    <span className="lp-browser-dot" />
    <span className="lp-browser-url" />
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
      <img src={currentAppInicio} alt="" />
    </div>
  </div>
);
