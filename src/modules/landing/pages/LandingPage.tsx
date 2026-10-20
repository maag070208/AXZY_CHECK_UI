import { ITButton, ITTabs } from "@axzydev/axzy_ui_system";
import { useEffect, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  FaArrowRight,
  FaBars,
  FaBell,
  FaCheckCircle,
  FaCloudDownloadAlt,
  FaDesktop,
  FaExternalLinkAlt,
  FaEye,
  FaHistory,
  FaLayerGroup,
  FaMapMarkerAlt,
  FaMobileAlt,
  FaQrcode,
  FaShieldAlt,
  FaTimes,
  FaTools,
  FaWhatsapp,
} from "react-icons/fa";
import logoGreen from "@assets/logo-green.svg";
import homeShot from "@assets/landing/current-home-gallery-crop.png";
import usersShot from "@assets/landing/current-users-crop.png";
import catalogsShot from "@assets/landing/current-catalogs-crop.png";
import roundsShot from "@assets/landing/current-rounds-crop.png";
import {
  DashboardMockup,
  GuardAppVisual,
  PhoneMockup,
  WebConsoleVisual,
} from "../components/LandingVisuals";
import "../landing.css";

const WHATSAPP_URL = `https://wa.me/526647700088?text=${encodeURIComponent(
  "Hola, me gustaría recibir una cotización de CheckApp. Tengo una empresa de seguridad con ___ guardias y ___ ubicaciones.",
)}`;

const DEMO_URL = "https://cfsp.axzy.dev";

const NAV_LINKS = [
  { id: "beneficios", label: "Beneficios" },
  { id: "modulos", label: "Módulos" },
  { id: "pantallas", label: "Pantallas" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "cotizacion", label: "Cotización" },
];

const BENEFITS: { icon: IconType; title: string; text: string }[] = [
  {
    icon: FaEye,
    title: "Transparencia operativa",
    text: "Cada ronda, escaneo y evidencia queda registrada y disponible para auditoría de la administración.",
  },
  {
    icon: FaShieldAlt,
    title: "Cero fraudes en rondas",
    text: "El oficial debe escanear el QR físico del punto y validar su ubicación GPS. No hay forma de marcar una ronda sin estar ahí.",
  },
  {
    icon: FaCloudDownloadAlt,
    title: "Operación sin internet",
    text: "Sótanos, estacionamientos o zonas sin señal: la app sigue registrando la ronda y sincroniza todo al recuperar conexión.",
  },
  {
    icon: FaBell,
    title: "Incidentes al instante",
    text: "Cada reporte llega con fotos, notas de voz y ubicación exacta, para que tu equipo y tu cliente actúen sin retrasos.",
  },
  {
    icon: FaTools,
    title: "Mantenimiento trazable",
    text: "Levanta reportes de infraestructura desde campo y da seguimiento a cada desperfecto desde la consola administrativa.",
  },
  {
    icon: FaHistory,
    title: "Auditoría cronológica",
    text: "Una línea de tiempo inalterable con cada escaneo, evidencia y suceso. Todo listo para auditorías o aclaraciones.",
  },
];

type ModuleItem = {
  id: string;
  label: string;
  icon: IconType;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  visual: ReactNode;
};

const MODULES: ModuleItem[] = [
  {
    id: "web",
    label: "Consola web",
    icon: FaDesktop,
    eyebrow: "Administración",
    title: "La consola que centraliza toda tu operación",
    description:
      "El centro de control para tu equipo administrativo: propiedades, rutas, puntos QR, guardias y métricas de cumplimiento en una sola pantalla.",
    bullets: [
      "Rutas secuenciales, puntos QR y cuadrantes de turno.",
      "Cobertura, cumplimiento y actividad en tiempo real.",
      "Reportes, auditoría y descarga de bitácoras.",
    ],
    visual: <WebConsoleVisual />,
  },
  {
    id: "app",
    label: "App móvil",
    icon: FaMobileAlt,
    eyebrow: "Campo y supervisión",
    title: "La app que guía al guardia en cada ronda",
    description:
      "Para guardias y supervisores: escaneo QR, validación GPS, evidencia multimedia y operación offline desde el celular.",
    bullets: [
      "Escaneo QR con validación de proximidad GPS.",
      "Fotos y notas de voz como evidencia del punto.",
      "Modo offline con sincronización automática.",
    ],
    visual: <GuardAppVisual />,
  },
];

const SCREENS = [
  {
    id: "home",
    image: homeShot,
    title: "Monitoreo en vivo",
    text: "Rondas, guardias e incidencias en tiempo real.",
  },
  {
    id: "users",
    image: usersShot,
    title: "Directorio de usuarios",
    text: "Altas, roles y accesos del personal.",
  },
  {
    id: "catalogs",
    image: catalogsShot,
    title: "Catálogos",
    text: "Categorías y tipos de incidencia.",
  },
  {
    id: "rounds",
    image: roundsShot,
    title: "Historial de recorridos",
    text: "Avance y desempeño de cada ronda.",
  },
];

const STEPS: { icon: IconType; title: string; text: string }[] = [
  {
    icon: FaQrcode,
    title: "Escanea el QR",
    text: "El guardia llega al punto de control y escanea el código físico con la app.",
  },
  {
    icon: FaMapMarkerAlt,
    title: "Valida GPS y evidencia",
    text: "La app confirma ubicación, hora y evidencia multimedia del punto.",
  },
  {
    icon: FaShieldAlt,
    title: "Ve la ronda en vivo",
    text: "Tú y tu cliente ven la ronda completada en la consola web, al instante.",
  },
];

const ScreenCard = ({ screen }: { screen: (typeof SCREENS)[number] }) => (
  <figure className="lp-screen">
    <div className="lp-screen-top">
      <span />
      <span />
      <span />
      <span className="lp-screen-url">checkapp / {screen.title}</span>
    </div>
    <img src={screen.image} alt={`Pantalla de ${screen.title} en CheckApp`} loading="lazy" />
    <figcaption>
      <strong>{screen.title}</strong>
      <span>{screen.text}</span>
    </figcaption>
  </figure>
);

type ModulePanelProps = {
  item: ModuleItem;
  onQuote: () => void;
};

const ModulePanel = ({ item, onQuote }: ModulePanelProps) => (
  <div className="lp-module">
    <div className="lp-module-copy">
      <span className="lp-eyebrow">{item.eyebrow}</span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <ul className="lp-module-list">
        {item.bullets.map((bullet) => (
          <li key={bullet}>
            <FaCheckCircle size={11} /> {bullet}
          </li>
        ))}
      </ul>
      <div className="lp-module-actions">
        <ITButton
          className="lp-btn-dark"
          onClick={() => window.open(DEMO_URL, "_blank", "noopener,noreferrer")}
        >
          <span className="lp-cta-inner">
            Explorar demo <FaExternalLinkAlt size={10} />
          </span>
        </ITButton>
        <button type="button" className="lp-text-link" onClick={onQuote}>
          Solicitar información <FaArrowRight size={9} />
        </button>
      </div>
    </div>
    <div className="lp-visual">{item.visual}</div>
  </div>
);

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "CheckApp — Control de rondas y seguridad en tiempo real";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  const openWhatsApp = () => window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");

  return (
    <div className="checkapp-landing">
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <button
            type="button"
            className="lp-logo"
            aria-label="CheckApp, ir al inicio"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img src={logoGreen} alt="CheckApp" />
          </button>

          <nav className="lp-nav-links" aria-label="Navegación principal">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                className="lp-nav-link"
                onClick={() => scrollTo(link.id)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="lp-nav-actions">
            <ITButton className="lp-btn-dark" onClick={openWhatsApp}>
              <span className="lp-cta-inner">
                Solicitar demo <FaArrowRight size={10} />
              </span>
            </ITButton>
            <button
              type="button"
              className="lp-mobile-toggle"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              aria-controls="lp-mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lp-mobile-panel" id="lp-mobile-menu">
            <div className="lp-container">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className="lp-mobile-link"
                  onClick={() => scrollTo(link.id)}
                >
                  {link.label}
                </button>
              ))}
              <div className="lp-mobile-actions">
                <ITButton className="lp-btn-dark" onClick={openWhatsApp}>
                  <span className="lp-cta-inner">
                    Solicitar demo <FaArrowRight size={10} />
                  </span>
                </ITButton>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-hero-badge">
                <span className="lp-live-dot" />
                Ecosistema operativo de seguridad · v2.0
              </span>

              <h1>
                Tus rondas,
                <br />
                <span className="lp-gradient-text">bajo control.</span>
                <br />
                En tiempo real.
              </h1>

              <p>
                Digitaliza el patrullaje de tu empresa de seguridad: QR en sitio, validación GPS,
                evidencia multimedia y reportes en vivo. Sin papeles, sin fraudes y sin depender de
                la señal.
              </p>

              <div className="lp-hero-actions">
                <ITButton className="lp-btn-primary" onClick={openWhatsApp}>
                  <span className="lp-cta-inner">
                    Solicitar demo <FaArrowRight size={10} />
                  </span>
                </ITButton>
                <ITButton className="lp-btn-ghost" onClick={() => scrollTo("modulos")}>
                  <span className="lp-cta-inner">Ver módulos</span>
                </ITButton>
              </div>

              <ul className="lp-hero-points">
                <li>
                  <FaCheckCircle size={11} /> QR + GPS en cada punto
                </li>
                <li>
                  <FaCheckCircle size={11} /> Operación 100% offline
                </li>
                <li>
                  <FaCheckCircle size={11} /> Reportes al instante
                </li>
              </ul>
            </div>

            <div className="lp-hero-visual">
              <DashboardMockup />
              <PhoneMockup />
            </div>
          </div>
        </section>

        <section className="lp-trust">
          <div className="lp-container lp-trust-inner">
            <span className="lp-trust-label">Diseñado para agencias de seguridad privada</span>
            <div className="lp-trust-stats">
              <div className="lp-trust-stat">
                <strong>+100</strong>
                <span>guardias por operación</span>
              </div>
              <div className="lp-trust-stat">
                <strong>2</strong>
                <span>interfaces conectadas</span>
              </div>
              <div className="lp-trust-stat">
                <strong>100%</strong>
                <span>trazabilidad de rondas</span>
              </div>
              <div className="lp-trust-stat">
                <strong>24/7</strong>
                <span>operación continua</span>
              </div>
            </div>
          </div>
        </section>

        <section id="beneficios" className="lp-section">
          <div className="lp-container">
            <div className="lp-section-head">
              <span className="lp-eyebrow">
                <FaLayerGroup size={10} /> Valor operativo
              </span>
              <h2>Lo que cambia cuando tus rondas son digitales</h2>
              <p>
                Menos bitácoras en papel, más control sobre lo que pasa en campo. CheckApp conecta
                a guardias, supervisores y administración en una sola operación.
              </p>
            </div>

            <div className="lp-benefits-grid">
              {BENEFITS.map(({ icon: Icon, title, text }, index) => (
                <article className="lp-benefit" key={title}>
                  <div className="lp-benefit-icon">
                    <Icon size={19} />
                  </div>
                  <span className="lp-benefit-num">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="modulos" className="lp-section lp-modules">
          <div className="lp-container">
            <div className="lp-section-head">
              <span className="lp-eyebrow">
                <FaDesktop size={10} /> Ecosistema completo
              </span>
              <h2>Dos interfaces. Una sola operación.</h2>
              <p>
                Cada actor de la operación tiene la herramienta que necesita, conectada al mismo
                centro de control.
              </p>
            </div>

            <ITTabs
              variant="line"
              containerClassName="lp-tabs"
              className="lp-tabs-head"
              items={MODULES.map((item) => {
                const Icon = item.icon;
                return {
                  id: item.id,
                  label: item.label,
                  icon: <Icon size={12} />,
                  content: <ModulePanel item={item} onQuote={() => scrollTo("cotizacion")} />,
                };
              })}
            />
          </div>
        </section>

        <section id="pantallas" className="lp-section lp-screens">
          <div className="lp-container">
            <div className="lp-section-head">
              <span className="lp-eyebrow">
                <FaDesktop size={10} /> Así se ve
              </span>
              <h2>Pantallas reales de la operación</h2>
              <p>Un vistazo a la consola que usa tu equipo todos los días.</p>
            </div>
            <div className="lp-screens-grid">
              {SCREENS.map((screen) => (
                <ScreenCard key={screen.id} screen={screen} />
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="lp-section lp-steps-section">
          <div className="lp-container">
            <div className="lp-section-head">
              <span className="lp-eyebrow">
                <FaQrcode size={10} /> Así de simple
              </span>
              <h2>Una ronda, tres pasos, cero papeleo</h2>
              <p>
                El guardia solo tiene que escanear. La plataforma hace el resto: valida, registra y
                muestra la evidencia.
              </p>
            </div>

            <div className="lp-steps">
              {STEPS.map(({ icon: Icon, title, text }, index) => (
                <div className="lp-step" key={title}>
                  <div className="lp-step-icon">
                    <Icon size={22} />
                    <span className="lp-step-num">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="lp-steps-note">
              <FaCloudDownloadAlt size={13} /> Si no hay señal, la app guarda el registro y lo
              sincroniza al recuperar conexión.
            </p>
          </div>
        </section>

        <section id="cotizacion" className="lp-cta-section">
          <div className="lp-container">
            <div className="lp-cta">
              <div>
                <span className="lp-eyebrow lp-eyebrow-light">
                  <FaWhatsapp size={11} /> Cotización a la medida
                </span>
                <h2>¿Listo para tomar el control de tus rondas?</h2>
                <p>
                  Cuéntanos cuántos guardias y ubicaciones tienes y armamos una propuesta adaptada a tu
                  operación. Te respondemos por WhatsApp.
                </p>
                <div className="lp-cta-actions">
                  <ITButton className="lp-btn-white" onClick={openWhatsApp}>
                    <span className="lp-cta-inner">
                      <FaWhatsapp size={12} /> Cotizar por WhatsApp
                    </span>
                  </ITButton>
                </div>
              </div>

              <div className="lp-cta-panel">
                <div className="lp-cta-stat">
                  <strong>1</strong>
                  <span>plataforma central</span>
                </div>
                <div className="lp-cta-stat">
                  <strong>2</strong>
                  <span>interfaces conectadas</span>
                </div>
                <div className="lp-cta-stat">
                  <strong>100%</strong>
                  <span>trazabilidad de rondas</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-grid">
          <div className="lp-footer-brand">
            <img src={logoGreen} alt="CheckApp" />
            <p>
              La plataforma integral para digitalizar la gestión de personal de seguridad en calle:
              rondas, evidencia y transparencia operativa.
            </p>
            <div className="lp-footer-points">
              <span>
                <FaCheckCircle size={9} /> Offline
              </span>
              <span>
                <FaCheckCircle size={9} /> QR + GPS
              </span>
              <span>
                <FaCheckCircle size={9} /> Multi-cliente
              </span>
            </div>
          </div>

          <div>
            <h4>Producto</h4>
            <button type="button" className="lp-footer-link" onClick={() => scrollTo("beneficios")}>
              Beneficios
            </button>
            <button type="button" className="lp-footer-link" onClick={() => scrollTo("modulos")}>
              Módulos
            </button>
            <button
              type="button"
              className="lp-footer-link"
              onClick={() => scrollTo("como-funciona")}
            >
              Cómo funciona
            </button>
            <a className="lp-footer-link" href={DEMO_URL} target="_blank" rel="noreferrer">
              Explorar demo
            </a>
          </div>

          <div>
            <h4>Contacto</h4>
            <a className="lp-footer-link" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a className="lp-footer-link" href="mailto:aamaro@axzy.dev">
              aamaro@axzy.dev
            </a>
            <button type="button" className="lp-footer-link" onClick={() => scrollTo("cotizacion")}>
              Solicitar cotización
            </button>
          </div>

          <div>
            <h4>Legal</h4>
            <a
              className="lp-footer-link"
              href="https://checkapp.axzy.dev/privacidad.html"
              target="_blank"
              rel="noreferrer"
            >
              Aviso de privacidad
            </a>
            <a
              className="lp-footer-link"
              href="https://checkapp.axzy.dev/terminos.html"
              target="_blank"
              rel="noreferrer"
            >
              Términos y condiciones
            </a>
            <a
              className="lp-footer-link"
              href="https://checkapp.axzy.dev/valores.html"
              target="_blank"
              rel="noreferrer"
            >
              Nuestros valores
            </a>
          </div>
        </div>

        <div className="lp-container lp-footer-bottom">
          <span>© 2026 AXZY Security Suite. Todos los derechos reservados.</span>
          <span>
            Desarrollado por{" "}
            <a href="https://axzy.dev" target="_blank" rel="noreferrer">
              axzydev
            </a>{" "}
            &{" "}
            <a href="https://isstech.mx" target="_blank" rel="noreferrer">
              ISST
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
