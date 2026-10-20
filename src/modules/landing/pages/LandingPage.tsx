import { ITButton, ITInput, ITSearchSelect, ITTabs , ITFlex } from "@axzydev/axzy_ui_system";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  FaArrowRight,
  FaBars,
  FaBuilding,
  FaBell,
  FaCheckCircle,
  FaChevronDown,
  FaCloudDownloadAlt,
  FaDesktop,
  FaExternalLinkAlt,
  FaEye,
  FaHistory,
  FaLayerGroup,
  FaMapMarkerAlt,
  FaMobileAlt,
  FaQrcode,
  FaQuestionCircle,
  FaShieldAlt,
  FaTimes,
  FaTimesCircle,
  FaTools,
  FaUserShield,
  FaUserTie,
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
  { id: "faq", label: "FAQ" },
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
      "Rutas asignadas y arranque de ronda controlado.",
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

const COMPARE_BAD = [
  "Rondas marcadas en papel o por WhatsApp.",
  "Reportes que llegan al día siguiente.",
  "Sin hora, foto ni ubicación del escaneo.",
  "El cliente pregunta y nadie tiene la respuesta.",
];

const COMPARE_GOOD = [
  "Cada escaneo con hora, GPS y evidencia.",
  "Incidencias y avance de la ronda en tiempo real.",
  "Alertas de rondas estancadas o sin cobertura.",
  "Reportes y auditoría listos para tu cliente.",
];

const PERSONAS: { icon: IconType; role: string; title: string; bullets: string[] }[] = [
  {
    icon: FaBuilding,
    role: "Dirección y administración",
    title: "Administración",
    bullets: [
      "Visibilidad total sin pedir reportes.",
      "Cumplimiento y auditoría al día.",
      "Clientes mejor atendidos.",
    ],
  },
  {
    icon: FaUserTie,
    role: "Supervisión en campo",
    title: "Jefe de turno",
    bullets: [
      "Rondas y novedades en vivo.",
      "Entrega de turno clara y firmada.",
      "Menos llamadas y WhatsApp.",
    ],
  },
  {
    icon: FaUserShield,
    role: "Operación diaria",
    title: "Guardia",
    bullets: [
      "Ronda guiada paso a paso.",
      "Evidencia con foto y voz.",
      "Funciona sin señal.",
    ],
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "¿Necesito señal en todos los puntos?",
    a: "No. La app registra la ronda aunque no haya internet y sincroniza automáticamente cuando recupera conexión.",
  },
  {
    q: "¿Cuánto tarda la implementación?",
    a: "Días, no meses. Configuramos rutas, puntos QR, turnos y usuarios contigo, y tu equipo empieza a operar con acompañamiento.",
  },
  {
    q: "¿Se adapta a mi operación?",
    a: "Sí. Definimos rutas, puntos de control, turnos y catálogos según tu operación; no tienes que cambiar tu forma de trabajar.",
  },
  {
    q: "¿Qué necesito para empezar?",
    a: "Un celular o tablet por guardia, los puntos QR impresos y tu equipo. Nosotros te ayudamos con la puesta en marcha.",
  },
  {
    q: "¿Cómo se cobra?",
    a: "La cotización se arma según el número de guardias, ubicaciones y módulos que necesites. Sin costos escondidos ni permanencia forzada.",
  },
  {
    q: "¿Puedo verlo funcionando antes de decidir?",
    a: "Sí. Coordinamos una demo guiada con tus rutas y datos de ejemplo para que tú y tu equipo vean la operación completa antes de contratar.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Cada usuario entra con su cuenta y rol; cada acción queda registrada con fecha, ubicación y evidencia para auditoría.",
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
  <figure className="lp-screen" data-reveal>
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

const QuoteForm = () => {
  const [form, setForm] = useState({
    name: "",
    company: "",
    guards: "",
    locations: "",
    contact: "",
  });
  const [sent, setSent] = useState(false);

  const update =
    (field: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = [
      "Hola, quiero cotizar CheckApp.",
      `Nombre: ${form.name}`,
      `Empresa: ${form.company}`,
      `Guardias: ${form.guards}`,
      `Ubicaciones: ${form.locations}`,
      `Contacto: ${form.contact}`,
    ].join("\n");
    window.open(
      `https://wa.me/526647700088?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setSent(true);
  };

  return (
    <form className="lp-quote-form" onSubmit={submit}>
      <div className="lp-quote-head">
        <span className="lp-quote-badge">
          <FaWhatsapp size={11} /> Respuesta el mismo día
        </span>
        <h3>Cotiza tu operación</h3>
        <p>Completa tus datos y te enviamos una propuesta por WhatsApp.</p>
      </div>

      <div className="lp-form-grid">
        <ITInput
          name="name"
          label="Nombre"
          required
          value={form.name}
          onChange={update("name")}
          placeholder="Tu nombre"
        />
        <ITInput
          name="company"
          label="Empresa"
          required
          value={form.company}
          onChange={update("company")}
          placeholder="Agencia o residencial"
        />
        <ITSearchSelect
          name="guards"
          label="Guardias"
          required
          value={form.guards}
          onChange={(value) => setForm((prev) => ({ ...prev, guards: String(value) }))}
          options={[
            { label: "1 a 20", value: "1 a 20" },
            { label: "21 a 50", value: "21 a 50" },
            { label: "51 a 100", value: "51 a 100" },
            { label: "Más de 100", value: "Más de 100" },
          ]}
          clearable={false}
        />
        <ITSearchSelect
          name="locations"
          label="Ubicaciones"
          required
          value={form.locations}
          onChange={(value) => setForm((prev) => ({ ...prev, locations: String(value) }))}
          options={[
            { label: "1 a 5", value: "1 a 5" },
            { label: "6 a 15", value: "6 a 15" },
            { label: "16 a 30", value: "16 a 30" },
            { label: "Más de 30", value: "Más de 30" },
          ]}
          clearable={false}
        />
        <div className="lp-form-full">
          <ITInput
            name="contact"
            label="WhatsApp o email"
            required
            value={form.contact}
            onChange={update("contact")}
            placeholder="Para enviarte la propuesta"
          />
        </div>
      </div>

      <ITButton type="submit" color="primary" variant="filled" className="lp-form-submit" size="md">
        <ITFlex align="center" gap={2}><FaWhatsapp size={14} /> Solicitar cotización
      </ITFlex></ITButton>
      <p className="lp-form-note">
        {sent
          ? "Abrimos WhatsApp con tus datos. Si no se abrió, escríbenos a aamaro@axzy.dev."
          : "Sin compromiso. No compartimos tus datos."}
      </p>
    </form>
  );
};

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
        <ITButton variant="text" color="gray" type="button" className="lp-text-link" onClick={onQuote} size="md">
          <ITFlex align="center" gap={2}>Solicitar información <FaArrowRight size={9} /></ITFlex>
        </ITButton>
      </div>
    </div>
    <div className="lp-visual">{item.visual}</div>
  </div>
);

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);
  const progressRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "CheckApp — Control de rondas y seguridad en tiempo real";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    const target = document.getElementById("cotizacion");
    if (!target || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry.isIntersecting),
      { threshold: 0.18 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateProgress = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const value = height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${value})`;
      }
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);


  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  const openWhatsApp = () => window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");

  return (
    <div className="checkapp-landing">
      <div className="lp-progress" aria-hidden="true">
        <span ref={progressRef} />
      </div>
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <ITButton variant="text" color="gray"
            type="button"
            className="lp-logo"
            ariaLabel="CheckApp, ir al inicio"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img src={logoGreen} alt="CheckApp" />
          </ITButton>

          <nav className="lp-nav-links" aria-label="Navegación principal">
            {NAV_LINKS.map((link) => (
              <ITButton variant="text" color="gray"
                key={link.id}
                type="button"
                className="lp-nav-link"
                onClick={() => scrollTo(link.id)}
              >
                {link.label}
              </ITButton>
            ))}
          </nav>

          <div className="lp-nav-actions">
            <ITButton variant="text" color="gray"
              type="button"
              className="lp-mobile-toggle"
              ariaLabel={menuOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <FaTimes /> : <FaBars />}
            </ITButton>
          </div>
        </div>

        {menuOpen && (
          <div className="lp-mobile-panel" id="lp-mobile-menu">
            <div className="lp-container">
              {NAV_LINKS.map((link) => (
                <ITButton variant="text" color="gray"
                  key={link.id}
                  type="button"
                  className="lp-mobile-link"
                  onClick={() => scrollTo(link.id)}
                >
                  {link.label}
                </ITButton>
              ))}
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
                <ITButton className="lp-btn-primary" onClick={() => scrollTo("cotizacion")}>
                  <span className="lp-cta-inner">
                    Solicitar cotización <FaArrowRight size={10} />
                  </span>
                </ITButton>
                <ITButton className="lp-btn-ghost" onClick={() => scrollTo("como-funciona")}>
                  <span className="lp-cta-inner">Ver cómo funciona</span>
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

          <ITButton variant="text" color="gray" type="button" className="lp-scroll-cue" onClick={() => scrollTo("problema")} size="md">
            <ITFlex align="center" gap={2}><span>Desliza para recorrer</span>
            <FaChevronDown size={12} /></ITFlex>
          </ITButton>
        </section>

        <section className="lp-trust">
          <div className="lp-container lp-trust-inner" data-reveal>
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

        <section id="problema" className="lp-section lp-compare-section">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaTimesCircle size={10} /> Parada 01 · El costo de no ver
              </span>
              <h2>El papel no te dice qué está pasando ahora.</h2>
              <p>
                Cuando la operación depende de bitácoras y WhatsApp, la evidencia llega tarde y el
                cliente pierde confianza.
              </p>
            </div>

            <div className="lp-shift" data-reveal>
              <article className="lp-shift-side lp-shift-before">
                <div className="lp-shift-top">
                  <span className="lp-shift-tag">Antes</span>
                  <FaTimesCircle size={22} />
                </div>
                <h3>Sin CheckApp</h3>
                <p className="lp-shift-sub">La operación se sostiene con confianza y mensajes.</p>
                <ul>
                  {COMPARE_BAD.map((item) => (
                    <li key={item}>
                      <FaTimes size={10} /> {item}
                    </li>
                  ))}
                </ul>
                <div className="lp-shift-metric">
                  <span>Reportes</span>
                  <strong>Al día siguiente</strong>
                </div>
              </article>

              <div className="lp-shift-mid" aria-hidden="true">
                <span>
                  <FaArrowRight size={16} />
                </span>
              </div>

              <article className="lp-shift-side lp-shift-after">
                <div className="lp-shift-top">
                  <span className="lp-shift-tag">Después</span>
                  <FaCheckCircle size={22} />
                </div>
                <h3>Con CheckApp</h3>
                <p className="lp-shift-sub">La operación se sostiene con evidencia y datos.</p>
                <ul>
                  {COMPARE_GOOD.map((item) => (
                    <li key={item}>
                      <FaCheckCircle size={10} /> {item}
                    </li>
                  ))}
                </ul>
                <div className="lp-shift-metric">
                  <span>Reportes</span>
                  <strong>En vivo</strong>
                </div>
              </article>
            </div>

            <div className="lp-shift-footer" data-reveal>
              <p>
                <strong>No es un GPS. Es la prueba de que el trabajo se hizo.</strong>
              </p>
              <ITButton variant="text" color="gray" type="button" onClick={() => scrollTo("cotizacion")} size="md">
                <ITFlex align="center" gap={2}>Quiero verlo en mi operación <FaArrowRight size={10} /></ITFlex>
              </ITButton>
            </div>
          </div>
        </section>

        <section id="beneficios" className="lp-section">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaLayerGroup size={10} /> Parada 02 · Resultados
              </span>
              <h2>Lo que ganas cuando tus rondas son digitales.</h2>
              <p>
                Menos supervisión manual, más evidencia y control sobre lo que pasa en campo.
                CheckApp conecta a guardias, supervisores y administración en una sola operación.
              </p>
            </div>

            <div className="lp-benefits-grid">
              {BENEFITS.map(({ icon: Icon, title, text }, index) => (
                <article className="lp-benefit" key={title} data-reveal>
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
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaDesktop size={10} /> Parada 03 · Tu operación
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
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaDesktop size={10} /> Parada 04 · Así se ve
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
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaQrcode size={10} /> Parada 05 · Así de simple
              </span>
              <h2>Una ronda, tres pasos, cero papeleo</h2>
              <p>
                El guardia solo tiene que escanear. La plataforma hace el resto: valida, registra y
                muestra la evidencia.
              </p>
            </div>

            <div className="lp-steps" data-reveal>
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

            <p className="lp-steps-note" data-reveal>
              <FaCloudDownloadAlt size={13} /> Si no hay señal, la app guarda el registro y lo
              sincroniza al recuperar conexión.
            </p>
          </div>
        </section>

        <section id="para-quien" className="lp-section lp-personas-section">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaUserShield size={10} /> Parada 06 · Tu equipo
              </span>
              <h2>Una operación, tres roles, la misma verdad.</h2>
              <p>
                CheckApp no reemplaza a tu gente: le da a cada rol la información que necesita para
                decidir mejor.
              </p>
            </div>

            <div className="lp-personas-grid">
              {PERSONAS.map(({ icon: Icon, role, title, bullets }) => (
                <article className="lp-persona" key={title} data-reveal>
                  <div className="lp-persona-icon">
                    <Icon size={20} />
                  </div>
                  <span className="lp-persona-role">{role}</span>
                  <h3>{title}</h3>
                  <ul>
                    {bullets.map((bullet) => (
                      <li key={bullet}>
                        <FaCheckCircle size={10} /> {bullet}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="lp-section lp-faq-section">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaQuestionCircle size={10} /> Parada 07 · Dudas frecuentes
              </span>
              <h2>Lo que suelen preguntarnos antes de empezar</h2>
              <p>Si tu duda no está aquí, escríbenos por WhatsApp y te respondemos hoy.</p>
            </div>

            <div className="lp-faq-list" data-reveal>
              {FAQS.map(({ q, a }) => (
                <details className="lp-faq-item" key={q}>
                  <summary>
                    {q} <FaChevronDown size={12} />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>

            <p className="lp-faq-cta">
              ¿Otra duda?{" "}
              <ITButton variant="text" color="gray" type="button" onClick={openWhatsApp} size="md">
                <ITFlex align="center" gap={2}>Habla con un especialista <FaArrowRight size={10} /></ITFlex>
              </ITButton>
            </p>
          </div>
        </section>

        <section id="cotizacion" className="lp-cta-section">
          <div className="lp-container">
            <div className="lp-cta" data-reveal>
              <div className="lp-cta-copy">
                <span className="lp-eyebrow lp-eyebrow-light">
                  <FaWhatsapp size={11} /> Parada 08 · Cotización
                </span>
                <h2>¿Listo para tomar el control de tus rondas?</h2>
                <p>
                  Cuéntanos cuántos guardias y ubicaciones tienes. Te enviamos una propuesta clara,
                  sin compromiso.
                </p>

                <ul className="lp-cta-list">
                  <li>
                    <FaCheckCircle size={12} /> Implementación acompañada en días.
                  </li>
                  <li>
                    <FaCheckCircle size={12} /> Sin hardware especial ni instalaciones.
                  </li>
                  <li>
                    <FaCheckCircle size={12} /> Propuesta según tu operación.
                  </li>
                </ul>

                <div className="lp-cta-metrics">
                  <span>
                    <strong>1</strong> plataforma
                  </span>
                  <span>
                    <strong>2</strong> interfaces
                  </span>
                  <span>
                    <strong>100%</strong> trazabilidad
                  </span>
                </div>
              </div>

              <QuoteForm />
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
            <ITButton variant="text" color="gray" type="button" className="lp-footer-link" onClick={() => scrollTo("beneficios")}>
              Beneficios
            </ITButton>
            <ITButton variant="text" color="gray" type="button" className="lp-footer-link" onClick={() => scrollTo("modulos")}>
              Módulos
            </ITButton>
            <ITButton variant="text" color="gray"
              type="button"
              className="lp-footer-link"
              onClick={() => scrollTo("como-funciona")}
            >
              Cómo funciona
            </ITButton>
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
            <ITButton variant="text" color="gray" type="button" className="lp-footer-link" onClick={() => scrollTo("cotizacion")}>
              Solicitar cotización
            </ITButton>
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

      <a
        className={`lp-fab${ctaVisible ? " is-hidden" : ""}`}
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Cotizar por WhatsApp"
      >
        <FaWhatsapp size={18} />
        <span>Cotizar</span>
      </a>
    </div>
  );
};

export default LandingPage;
