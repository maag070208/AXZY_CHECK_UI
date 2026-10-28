import { SHOTS } from "../landing.shots";

const BrowserTop = () => (
  <div className="lp-browser-top">
    <span className="lp-browser-dot" />
    <span className="lp-browser-dot" />
    <span className="lp-browser-dot" />
    <span className="lp-browser-url" />
  </div>
);

/** Consola web: captura real del monitoreo en vivo (WEB actual). */
export const WebConsoleVisual = () => (
  <div className="lp-browser lp-browser-real" aria-hidden="true">
    <BrowserTop />
    <img className="lp-module-shot" src={SHOTS.webHome} alt="" />
  </div>
);

/** App móvil: captura real de la app de campo actual. */
export const GuardAppVisual = () => (
  <div className="lp-module-phone" aria-hidden="true">
    <div className="lp-module-phone-screen lp-phone-screen-real">
      <img src={SHOTS.guardHome} alt="" />
    </div>
  </div>
);
