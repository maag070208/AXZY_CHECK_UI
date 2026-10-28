import { ITButton, ITTabs, ITFlex } from "@axzydev/axzy_ui_system";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  FaWifi,
  FaCrown,
  FaRocket,
  FaHeadset,
  FaSyncAlt,
  FaCamera,
  FaExclamationTriangle,
} from "react-icons/fa";
import { RoleLogo } from "@app/core/components/RoleLogo";
import { setRoleFavicon } from "@core/utils/roleFavicon";
import {
  GuardAppVisual,
  WebConsoleVisual,
} from "../components/LandingVisuals";
import { SHOTS } from "../landing.shots";
import "../landing.css";

const WHATSAPP_URL = `https://wa.me/526647700088?text=${encodeURIComponent(
  "Hola, me gustaría recibir una cotización de CheckApp. Tengo una empresa de seguridad con ___ guardias y ___ ubicaciones.",
)}`;

const NAV_LINKS = [
  { id: "beneficios", label: "Beneficios" },
  { id: "modulos", label: "Módulos" },
  { id: "pantallas", label: "Pantallas" },
  { id: "offline", label: "Offline" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "planes", label: "Planes" },
  { id: "faq", label: "FAQ" },
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

const ROLE_VIEWS = [
  {
    key: "admin",
    label: "Admin",
    color: "#065911",
    soft: "#E8F7EF",
    description: "La consola completa: operación, personas, accesos y finanzas.",
    screens: [
      { id: "home", image: "/landing/roles/admin/home.png", title: "Monitoreo en vivo", text: "Rondas, guardias e incidencias en tiempo real." },
      { id: "locations", image: "/landing/roles/admin/locations.png", title: "Ubicaciones y QR", text: "Puntos de control listos para imprimir." },
      { id: "locations-qr", image: "/landing/roles/admin/locations-qr.png", title: "QR de ubicación", text: "Vista e impresión del punto de control." },
      { id: "residents", image: "/landing/roles/admin/residents.png", title: "Residentes", text: "Padrón, contactos y estado de cada hogar." },
      { id: "residents-new", image: "/landing/roles/admin/residents-new.png", title: "Alta de residente", text: "Formulario guiado con validaciones." },
      { id: "access-log", image: "/landing/roles/admin/access-log.png", title: "Bitácora de accesos", text: "Cada entrada y salida con su evidencia." },
      { id: "finance", image: "/landing/roles/admin/finance.png", title: "Finanzas", text: "Cobranza, pagos y morosidad en una vista." },
      { id: "announcements", image: "/landing/roles/admin/announcements.png", title: "Avisos", text: "Comunicación directa con la comunidad." },
      { id: "guards", image: "/landing/roles/admin/guards.png", title: "Guardias", text: "Turnos, asignaciones y desempeño." },
      { id: "vehicles", image: "/landing/roles/admin/vehicles.png", title: "Vehículos", text: "Tags, aprobaciones y accesos." },
    ],
  },
  {
    key: "shift",
    label: "Jefe",
    color: "#064E4B",
    soft: "#E6FFFA",
    description: "El turno bajo control: equipo, rondas y entrega de novedades.",
    screens: [
      { id: "home", image: "/landing/roles/shift/home.png", title: "Pulso del turno", text: "KPIs, alertas y cobertura en vivo." },
      { id: "guards", image: "/landing/roles/shift/guards.png", title: "Equipo en turno", text: "Guardias, tareas y asignaciones." },
      { id: "shift-handover", image: "/landing/roles/shift/shift-handover.png", title: "Entrega de turno", text: "Checklist y novedades firmadas." },
      { id: "new-shift", image: "/landing/roles/shift/new-shift.png", title: "Nueva entrega", text: "Captura guiada del cambio de turno." },
      { id: "guard-tracking", image: "/landing/roles/shift/guard-tracking.png", title: "Seguimiento", text: "Rondas y recorridos del equipo." },
      { id: "incidents", image: "/landing/roles/shift/incidents.png", title: "Incidencias", text: "Novedades atendidas y pendientes." },
      { id: "club", image: "/landing/roles/shift/club.png", title: "Casa Club", text: "Reservas y reportes de amenidades." },
    ],
  },
  {
    key: "guard",
    label: "Guardia",
    color: "#0B2E4F",
    soft: "#E0F2FE",
    description: "La operación en campo: accesos, incidencias y apoyo al residente.",
    screens: [
      { id: "home", image: "/landing/roles/guard/home.png", title: "Inicio de caseta", text: "Accesos rápidos a la operación diaria." },
      { id: "incidents", image: "/landing/roles/guard/incidents.png", title: "Incidencias", text: "Reporta y da seguimiento desde campo." },
      { id: "club", image: "/landing/roles/guard/club.png", title: "Casa Club", text: "Reportes de amenidades." },
      { id: "invitations", image: "/landing/roles/guard/invitations.png", title: "Invitaciones", text: "Pases de visita y códigos QR." },
      { id: "chat", image: "/landing/roles/guard/chat.png", title: "Chat", text: "Comunicación con el equipo." },
    ],
  },
  {
    key: "resident",
    label: "Residente",
    color: "#3B1D5A",
    soft: "#F3E8FF",
    description: "La comunidad desde el teléfono: perfil, contactos y pases.",
    screens: [
      { id: "home", image: "/landing/roles/resident/home.png", title: "Mi comunidad", text: "Accesos rápidos a lo importante." },
      { id: "profile", image: "/landing/roles/resident/profile.png", title: "Mi perfil", text: "Datos del hogar y de contacto." },
      { id: "contacts", image: "/landing/roles/resident/contacts.png", title: "Mi agenda", text: "Contactos de confianza y accesos." },
      { id: "passes", image: "/landing/roles/resident/passes.png", title: "Mis pases", text: "Invitaciones y QR de visitas." },
      { id: "pass-modal", image: "/landing/roles/resident/pass-modal.png", title: "Nuevo pase", text: "Alta de visita con vigencia y QR." },
    ],
  },
];

const ScreenCard = ({ screen }: { screen: (typeof ROLE_VIEWS)[number]["screens"][number] }) => (
  <figure className="lp-screen" data-reveal>
    <div className="lp-screen-top">
      <span />
      <span />
      <span />
      <span className="lp-screen-url">CheckApp · {screen.title}</span>
    </div>
    <img src={screen.image} alt={`Pantalla de ${screen.title} en CheckApp`} loading="lazy" />
    <figcaption>
      <strong>{screen.title}</strong>
      <span>{screen.text}</span>
    </figcaption>
  </figure>
);

const ROLE_APP: Record<string, { src: string; title: string }[]> = {
  admin: [
    { src: "/landing/app/shift/home.png", title: "Supervisión en turno" },
    { src: "/landing/app/guard/home.png", title: "Caseta del guardia" },
    { src: "/landing/app/shift/menu.png", title: "Módulos en campo" },
  ],
  shift: [
    { src: "/landing/app/shift/home.png", title: "Pulso del turno" },
    { src: "/landing/app/shift/menu.png", title: "Módulos del jefe" },
  ],
  guard: [
    { src: "/landing/app/guard/home.png", title: "Caseta del guardia" },
    { src: "/landing/app/guard/vehicles.png", title: "Consulta de vehículos" },
    { src: "/landing/app/guard/pin.png", title: "Clave peatonal" },
  ],
  resident: [
    { src: "/landing/app/resident/home.png", title: "Mi comunidad" },
    { src: "/landing/app/resident/contacts.png", title: "Mi agenda" },
    { src: "/landing/app/resident/access.png", title: "Mis accesos" },
  ],
};

const LANDING_ROLE_THEMES: Record<string, Record<string, string>> = {
  admin: { "--lp-bg": "#04120A", "--lp-nav-bg": "rgba(4,18,10,0.74)", "--lp-green": "#065911", "--lp-green-2": "#12A36F", "--lp-green-3": "#DFF0E3", "--lp-mint": "#5EE0A0", "--lp-dark": "#04120A", "--lp-dark-2": "#06270F" },
  shift: { "--lp-bg": "#022C2A", "--lp-nav-bg": "rgba(2,44,42,0.78)", "--lp-green": "#064E4B", "--lp-green-2": "#14B8A6", "--lp-green-3": "#D9F5F0", "--lp-mint": "#5EEAD4", "--lp-dark": "#022C2A", "--lp-dark-2": "#064E4B" },
  guard: { "--lp-bg": "#061A2C", "--lp-nav-bg": "rgba(6,26,44,0.8)", "--lp-green": "#0B2E4F", "--lp-green-2": "#0EA5E9", "--lp-green-3": "#DCEFFB", "--lp-mint": "#7DD3FC", "--lp-dark": "#061A2C", "--lp-dark-2": "#0B2E4F" },
  resident: { "--lp-bg": "#1E0F30", "--lp-nav-bg": "rgba(30,15,48,0.82)", "--lp-green": "#3B1D5A", "--lp-green-2": "#A855F7", "--lp-green-3": "#F0E4FA", "--lp-mint": "#D8B4FE", "--lp-dark": "#1E0F30", "--lp-dark-2": "#3B1D5A" },
};

const RoleShowcase = ({ role, onRoleChange }: { role: string; onRoleChange: (role: string) => void }) => {
  const current = ROLE_VIEWS.find((item) => item.key === role) ?? ROLE_VIEWS[0];

  return (
    <section id="pantallas" className="lp-section lp-screens">
      <div className="lp-container">
        <div className="lp-section-head" data-reveal>
          <span className="lp-eyebrow">
            <FaDesktop size={10} /> Parada 04 · Así se ve
          </span>
          <h2>Una plataforma. La vista de cada rol.</h2>
          <p>Cambia de rol y conoce cómo se ve la operación para administración, jefe, guardia y residente.</p>
        </div>

        <div className="lp-role-tabs" role="tablist" aria-label="Vistas por rol">
          {ROLE_VIEWS.map((item) => {
            const active = item.key === current.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`lp-role-tab${active ? " is-active" : ""}`}
                style={active ? { backgroundColor: item.color, borderColor: item.color, color: "#fff" } : { borderColor: `${item.color}33`, color: item.color }}
                onClick={() => onRoleChange(item.key)}
              >
                <span className="lp-role-dot" style={{ backgroundColor: active ? "#fff" : item.color }} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="lp-role-current" style={{ backgroundColor: current.soft, borderColor: `${current.color}22` }}>
          <span className="lp-role-current-dot" style={{ backgroundColor: current.color }} />
          <p><strong>{current.label}</strong> · {current.description}</p>
        </div>

        <div className="lp-screens-grid lpx-swap" key={current.key}>
          {current.screens.map((screen) => (
            <ScreenCard key={`${current.key}-${screen.id}`} screen={screen} />
          ))}
        </div>

        <div className="lp-role-app-block">
          <div className="lp-role-app-head" data-reveal>
            <span className="lp-eyebrow"><FaMobileAlt size={10} /> También en la APP</span>
            <h3>La misma operación, en la mano</h3>
            <p>
              {current.key === "admin"
                ? "Lo que tu equipo usa en campo, conectado a tu consola."
                : `Capturas reales de la app para ${current.label.toLowerCase()}.`}
            </p>
          </div>
          <div className="lp-role-app-strip lpx-swap" key={`app-${current.key}`}>
            {ROLE_APP[current.key].map((shot) => (
              <figure className="lp-phone" key={shot.src} data-reveal>
                <div className="lp-phone-notch" />
                <img src={shot.src} alt={`${shot.title} en la app CheckApp`} loading="lazy" />
                <figcaption>{shot.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
const PLANS = [
  {
    id: "standard",
    name: "Estándar",
    eyebrow: "Para empezar",
    tagline: "Una caseta o una operación pequeña, ordenada desde el día uno.",
    guards: "10",
    points: "100",
    rounds: "300",
    support: "Correo · 48 h",
    highlight: false,
    features: [
      "App móvil + consola web",
      "Rondas con QR y GPS",
      "Modo offline y sync",
      "Incidencias y mantenimiento",
      "Reportes y bitácoras",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    eyebrow: "Para crecer",
    ribbon: "El más elegido",
    tagline: "Para empresas que ya operan varias rutas y necesitan control fino.",
    guards: "30",
    points: "500",
    rounds: "1,500",
    support: "Prioritario · 8 h",
    highlight: true,
    features: [
      "Todo lo de Estándar",
      "Panel de cumplimiento y KPIs",
      "Catálogos y reportes avanzados",
      "Onboarding acompañado",
      "Soporte prioritario",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    eyebrow: "Operación a escala",
    tagline: "Multi-sitio, auditoría y acuerdos de servicio a la medida.",
    guards: "100",
    points: "2,000",
    rounds: "6,000",
    support: "24/7 + SLA",
    highlight: false,
    features: [
      "Todo lo de Pro",
      "Multi-sitio y multi-cliente",
      "API y exportaciones",
      "Account manager dedicado",
      "SLA y soporte 24/7",
    ],
  },
];

const CAPABILITIES = [
  "QR + GPS",
  "Evidencia multimedia",
  "Offline-first",
  "Sync automático",
  "Multi-sitio",
  "Control de accesos",
  "Residentes y pases QR",
  "Entrega de turno",
  "Finanzas y morosidad",
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
    a: "Tenemos planes Estándar, Pro y Enterprise con guardias, puntos QR y rondas mensuales incluidas. Si tu operación es más grande, armamos un plan a medida. Sin costos escondidos ni permanencia forzada.",
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

const PlanCard = ({ plan, onQuote }: { plan: (typeof PLANS)[number]; onQuote: () => void }) => (
  <article className={`lp-plan${plan.highlight ? " lp-plan-highlight" : ""}`} data-reveal>
    {plan.highlight && (
      <span className="lp-plan-ribbon">
        <FaCrown size={11} /> {plan.ribbon ?? plan.eyebrow}
      </span>
    )}
    <span className="lp-plan-eyebrow">{plan.eyebrow}</span>
    <h3>{plan.name}</h3>
    <p className="lp-plan-tagline">{plan.tagline}</p>
    <div className="lp-plan-price lp-plan-quote">
      <strong>Cotiza tu plan</strong>
      <span>Propuesta a tu medida</span>
    </div>
    <div className="lp-plan-limits">
      <div>
        <strong>{plan.guards}</strong>
        <span>guardias</span>
      </div>
      <div>
        <strong>{plan.points}</strong>
        <span>puntos QR</span>
      </div>
      <div>
        <strong>{plan.rounds}</strong>
        <span>rondas / mes</span>
      </div>
    </div>
    <div className="lp-plan-support">
      <FaHeadset size={13} /> Soporte {plan.support}
    </div>
    <ul className="lp-plan-features">
      {plan.features.map((feature) => (
        <li key={feature}>
          <FaCheckCircle size={11} /> {feature}
        </li>
      ))}
    </ul>
    <button type="button" className={`lp-plan-cta${plan.highlight ? " is-solid" : ""}`} onClick={onQuote}>
      Cotizar por WhatsApp <FaWhatsapp size={11} />
    </button>
  </article>
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
        <ITButton type="button" onClick={onQuote}>
          <span className="lp-cta-inner">
            Solicitar información <FaArrowRight size={10} />
          </span>
        </ITButton>
      </div>
    </div>
    <div className="lp-visual">{item.visual}</div>
  </div>
);

const HELP_GUARDS = [
  { label: "1–10", value: 10 },
  { label: "11–30", value: 30 },
  { label: "31–100", value: 100 },
  { label: "+100", value: 150 },
];

const HELP_POINTS = [
  { label: "1–100", value: 100 },
  { label: "101–500", value: 500 },
  { label: "501–2,000", value: 2000 },
  { label: "+2,000", value: 2500 },
];

const HELP_DEMO_WHEN = ["Hoy", "Mañana", "Esta semana", "Coordinar"];

type HelpStep = "guards" | "points" | "recommendation" | "demo" | "when" | "phone" | "done";
type ChatMessage = { id: number; from: "a" | "me"; text: string };

const HelpAssistant = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [step, setStep] = useState<HelpStep>("guards");
  const [guards, setGuards] = useState<number | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [demo, setDemo] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, from: "a", text: "Hola, soy A. Te armo una cotización en menos de un minuto. ¿Cuántos guardias tienes?" },
  ]);
  const chatRef = useRef<HTMLDivElement | null>(null);

  const plan = (() => {
    if (guards === null || points === null) return null;
    if (guards <= 10 && points <= 100) return PLANS[0];
    if (guards <= 30 && points <= 500) return PLANS[1];
    return PLANS[2];
  })();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, step, open]);

  const say = (text: string, from: "a" | "me" = "a") => {
    setMessages(current => [...current, { id: Date.now() + Math.random(), from, text }]);
  };

  const respond = (text: string, next: HelpStep, delay = 500) => {
    setTyping(true);
    window.setTimeout(() => {
      say(text);
      setStep(next);
      setTyping(false);
    }, delay);
  };

  const pickGuards = (option: (typeof HELP_GUARDS)[number]) => {
    if (step !== "guards" || typing) return;
    setGuards(option.value);
    say(option.label, "me");
    respond("Perfecto. ¿Cuántos puntos QR necesitas controlar?", "points");
  };

  const pickPoints = (option: (typeof HELP_POINTS)[number]) => {
    if (step !== "points" || guards === null) return;
    setPoints(option.value);
    const recommended =
      guards <= 10 && option.value <= 100
        ? PLANS[0]
        : guards <= 30 && option.value <= 500
          ? PLANS[1]
          : PLANS[2];
    say(option.label, "me");
    respond(
      `Con eso te recomiendo el plan ${recommended.name}. ¿Quieres agendar una demo o solo la cotización?`,
      "recommendation",
    );
  };

  const chooseDemo = (wantsDemo: boolean) => {
    if (step !== "recommendation" || typing) return;
    if (wantsDemo) {
      say("Quiero agendar una demo", "me");
      respond("Excelente. ¿Cuándo te queda bien?", "when");
    } else {
      say("Solo la cotización por ahora", "me");
      respond("Listo. ¿Me dejas tu WhatsApp? Es opcional.", "phone");
    }
  };

  const chooseWhen = (when: string) => {
    if (step !== "when" || typing) return;
    setDemo(when);
    say(when, "me");
    respond("Perfecto, lo dejo anotado. ¿Me dejas tu WhatsApp? Es opcional.", "phone");
  };

  const finish = (withPhone: boolean) => {
    if (step !== "phone") return;
    const cleanPhone = phone.trim();
    if (withPhone && cleanPhone) say(cleanPhone, "me");
    if (!withPhone || !cleanPhone) say("Prefiero no dejar teléfono", "me");
    say("Listo. Te dejo el resumen y el botón para enviarlo por WhatsApp.");
    setStep("done");
  };

  const reset = () => {
    setStep("guards");
    setGuards(null);
    setPoints(null);
    setDemo(null);
    setPhone("");
    setTyping(false);
    setMessages([
      { id: Date.now(), from: "a", text: "Hola, soy A. Te armo una cotización en menos de un minuto. ¿Cuántos guardias tienes?" },
    ]);
  };

  const send = () => {
    if (!plan) return;
    const parts = [
      "Hola, quiero cotizar CheckApp.",
      `Plan sugerido: ${plan.name}.`,
      `Guardias: ${guards}. Puntos QR: ${points}.`,
    ];
    if (demo) parts.push(`Demo: ${demo}.`);
    if (phone.trim()) parts.push(`WhatsApp: ${phone.trim()}.`);
    window.open(
      `https://wa.me/526647700088?text=${encodeURIComponent(parts.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <>
      {open && (
        <aside className="lp-help-panel lp-help-chat" aria-label="Asistente de cotización">
          <div className="lp-help-head">
            <div className="lp-help-avatar">A</div>
            <div>
              <strong>A · Asistente CheckApp</strong>
              <span><i /> En línea · responde al instante</span>
            </div>
            <button type="button" aria-label="Cerrar asistente" onClick={() => onOpenChange(false)}>
              <FaTimes size={14} />
            </button>
          </div>

          <div className="lp-help-chat-log" ref={chatRef} aria-live="polite">
            {messages.map(message => (
              <div key={message.id} className={`lp-help-msg lp-help-msg-${message.from}`}>
                {message.from === "a" && <span className="lp-help-mini-avatar">A</span>}
                <p>{message.text}</p>
              </div>
            ))}

            {typing && (
              <div className="lp-help-msg lp-help-msg-a lp-help-typing">
                <span className="lp-help-mini-avatar">A</span>
                <p aria-label="A está escribiendo"><i /><i /><i /></p>
              </div>
            )}

            {step === "guards" && (
              <div className="lp-help-quick">
                {HELP_GUARDS.map(option => (
                  <button key={option.label} type="button" onClick={() => pickGuards(option)}
                    disabled={typing}>
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {step === "points" && (
              <div className="lp-help-quick">
                {HELP_POINTS.map(option => (
                  <button key={option.label} type="button" onClick={() => pickPoints(option)}
                    disabled={typing}>
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {step === "recommendation" && plan && (
              <>
                <div className="lp-help-result lp-help-inline-result">
                  <span>Recomendación de A</span>
                  <strong>{plan.name}</strong>
                  <small>Hasta {plan.guards} guardias · {plan.points} puntos · {plan.rounds} rondas/mes.</small>
                </div>
                <div className="lp-help-quick">
                  <button type="button" onClick={() => chooseDemo(true)}
                    disabled={typing}>Agendar demo</button>
                  <button type="button" onClick={() => chooseDemo(false)}
                    disabled={typing}>Solo cotización</button>
                </div>
              </>
            )}

            {step === "when" && (
              <div className="lp-help-quick lp-help-quick-wide">
                {HELP_DEMO_WHEN.map(option => (
                  <button key={option} type="button" onClick={() => chooseWhen(option)}
                    disabled={typing}>
                    {option}
                  </button>
                ))}
              </div>
            )}

            {step === "phone" && (
              <form
                className="lp-help-phone"
                onSubmit={event => {
                  event.preventDefault();
                  finish(true);
                }}
              >
                <input
                  type="tel"
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  placeholder="Tu WhatsApp (opcional)"
                  aria-label="WhatsApp opcional"
                />
                <div>
                  <button type="submit">Enviar</button>
                  <button type="button" onClick={() => finish(false)}>Omitir</button>
                </div>
              </form>
            )}

            {step === "done" && plan && (
              <div className="lp-help-final">
                <div className="lp-help-result">
                  <span>Resumen</span>
                  <strong>{plan.name}</strong>
                  <small>
                    {guards} guardias · {points} puntos
                    {demo ? ` · Demo: ${demo}` : ""}
                    {phone.trim() ? ` · WhatsApp: ${phone.trim()}` : " · Sin teléfono"}
                  </small>
                </div>
                <button type="button" className="lp-help-send" onClick={send}>
                  <FaWhatsapp size={13} /> Enviar por WhatsApp
                </button>
                <button type="button" className="lp-help-form" onClick={reset}>
                  Volver a empezar
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      <button
        type="button"
        className={`lp-help-toggle${open ? " is-open" : ""}`}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente de cotización"}
        onClick={() => onOpenChange(!open)}
      >
        <span className="lp-help-toggle-avatar">A</span>
        <span>Ayuda</span>
      </button>
    </>
  );
};


/** Hero con capturas reales: consola web detrás y app del guardia al frente, con eventos en vivo. */
const HERO_EVENTS = [
  { icon: FaQrcode, title: "Punto E2E-03 escaneado", meta: "GPS a 4 m · 22:14" },
  { icon: FaCamera, title: "Evidencia adjunta", meta: "2 fotos · nota de voz" },
  { icon: FaExclamationTriangle, title: "Incidencia reportada", meta: "Acceso norte · ahora" },
  { icon: FaSyncAlt, title: "Ronda sincronizada", meta: "8/8 puntos · consola al día" },
];

const useCycle = (length: number, ms: number) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % length), ms);
    return () => window.clearInterval(id);
  }, [length, ms]);
  return index;
};

const HeroScene = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const eventIndex = useCycle(HERO_EVENTS.length, 2600);
  const event = HERO_EVENTS[eventIndex];
  const EventIcon = event.icon;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -6}deg`);
    el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <div className="lpx-hero" ref={ref} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="lpx-hero-glow" aria-hidden="true" />
      <div className="lpx-hero-stage">
        <figure className="lpx-browser">
          <div className="lpx-browser-bar" aria-hidden="true">
            <i /><i /><i />
            <span>checkapp · Monitoreo en vivo</span>
          </div>
          <img src={SHOTS.webHome} alt="Consola web de CheckApp con el monitoreo en vivo de la operación" />
        </figure>

        <figure className="lpx-phone">
          <span className="lpx-phone-island" aria-hidden="true" />
          <img src={SHOTS.guardHome} alt="App del guardia en CheckApp con su ronda y accesos rápidos" />
          <span className="lpx-phone-scan" aria-hidden="true" />
        </figure>

        <div className="lpx-event" aria-live="polite" key={eventIndex}>
          <span className="lpx-event-icon"><EventIcon /></span>
          <span>
            <strong>{event.title}</strong>
            <small>{event.meta}</small>
          </span>
        </div>

        <div className="lpx-chip lpx-chip--live" aria-hidden="true">
          <span className="lp-live-dot" /> En vivo
        </div>
        <div className="lpx-chip lpx-chip--offline" aria-hidden="true">
          <FaCloudDownloadAlt /> Offline listo
        </div>
      </div>
    </div>
  );
};

const OFFLINE_QUEUE = [
  { icon: FaQrcode, label: "Escaneo · Punto E2E-01" },
  { icon: FaCamera, label: "Evidencia · 3 fotos" },
  { icon: FaExclamationTriangle, label: "Incidencia · Portón sur" },
  { icon: FaMapMarkerAlt, label: "Cierre de ronda · GPS" },
];

const OFFLINE_STATES = [
  { tone: "off", icon: FaWifi, title: "Sin señal", text: "Todo se guarda en el teléfono." },
  { tone: "sync", icon: FaSyncAlt, title: "Sincronizando", text: "Subiendo lo pendiente, sin duplicar." },
  { tone: "ok", icon: FaCheckCircle, title: "Todo al día", text: "La consola ya tiene la ronda completa." },
] as const;

/** Escena offline: la app real del guardia y la cola de sincronización animada. */
const OfflineScene = () => {
  const step = useCycle(OFFLINE_STATES.length, 2800);
  const state = OFFLINE_STATES[step];
  const StateIcon = state.icon;

  return (
    <div className={`lpx-offline is-${state.tone}`}>
      <div className="lpx-offline-rings" aria-hidden="true"><i /><i /><i /></div>

      <figure className="lpx-phone lpx-phone--offline">
        <span className="lpx-phone-island" aria-hidden="true" />
        <img src={SHOTS.guardHome} alt="App del guardia con el botón Sync para revisar y enviar lo pendiente" />
        <figcaption className="lpx-phone-signal" aria-hidden="true">
          <FaWifi /> {state.tone === "off" ? "Sin conexión" : "Conectado"}
        </figcaption>
      </figure>

      <div className="lpx-sync" role="status" aria-live="polite">
        <div className="lpx-sync-head">
          <span className="lpx-sync-icon"><StateIcon /></span>
          <div>
            <strong>{state.title}</strong>
            <small>{state.text}</small>
          </div>
        </div>
        <ul className="lpx-sync-list">
          {OFFLINE_QUEUE.map(({ icon: Icon, label }, index) => (
            <li key={label} style={{ "--i": index } as React.CSSProperties}>
              <Icon />
              <span>{label}</span>
              <em>{state.tone === "off" ? "Guardado" : state.tone === "sync" ? "Enviando" : "Listo"}</em>
            </li>
          ))}
        </ul>
        <div className="lpx-sync-bar" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [landingRole, setLandingRole] = useState("admin");

  useEffect(() => {
    setRoleFavicon(landingRole);
  }, [landingRole]);
  const progressRef = useRef<HTMLSpanElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Entrada escalonada al hacer scroll y conteo de cifras. Sin movimiento si el sistema lo pide.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("lpx-js");

    const countUp = (el: HTMLElement) => {
      const target = Number(el.dataset.count);
      const { prefix = "", suffix = "" } = el.dataset;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1400);
        el.textContent = `${prefix}${Math.round(target * (1 - Math.pow(1 - t, 3)))}${suffix}`;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.dataset.in = "true";
          el.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
          observer.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    root.querySelectorAll("[data-reveal]:not([data-in])").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [landingRole]);

  // Brillo que sigue al cursor en tarjetas.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onMove = (event: PointerEvent) => {
      const card = (event.target as HTMLElement).closest<HTMLElement>(".lp-benefit, .lp-plan, .lp-persona, .lp-step, .lp-screen");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - r.left}px`);
      card.style.setProperty("--my", `${event.clientY - r.top}px`);
    };
    root.addEventListener("pointermove", onMove, { passive: true });
    return () => root.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "CheckApp — Control de rondas y seguridad en tiempo real";
    return () => {
      document.title = previousTitle;
    };
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
  const openWhatsAppForPlan = (planName: string) => {
    const url = `https://wa.me/526647700088?text=${encodeURIComponent(
      `Hola, quiero cotizar el plan ${planName} de CheckApp. Tengo una empresa de seguridad con ___ guardias y ___ ubicaciones.`,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="checkapp-landing" ref={rootRef} style={LANDING_ROLE_THEMES[landingRole] as React.CSSProperties}>
      <div className="lp-progress" aria-hidden="true">
        <span ref={progressRef} />
      </div>
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <button
            type="button"
            className="lp-logo"
            aria-label="CheckApp, ir al inicio"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <RoleLogo key={landingRole} role={landingRole} invert className="h-9 w-auto" />
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
            <button
              type="button"
              className="lp-mobile-toggle"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
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
                  className="lp-nav-link"
                  onClick={() => scrollTo(link.id)}
                >
                  {link.label}
                </button>
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
                Ecosistema operativo de seguridad · v2.1 offline + sync
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
                <ITButton className="lp-btn-primary" onClick={() => setHelpOpen(true)}>
                  <span className="lp-cta-inner">
                    Solicitar cotización <FaArrowRight size={10} />
                  </span>
                </ITButton>
                <ITButton className="lp-btn-ghost" onClick={() => scrollTo("planes")}>
                  <span className="lp-cta-inner">Ver planes</span>
                </ITButton>
              </div>

              <ul className="lp-hero-points">
                <li>
                  <FaCheckCircle size={11} /> QR + GPS en cada punto
                </li>
                <li>
                  <FaCheckCircle size={11} /> Offline + sync automático
                </li>
                <li>
                  <FaCheckCircle size={11} /> Reportes al instante
                </li>
              </ul>

            </div>

            <div className="lp-hero-visual">
              <HeroScene />
            </div>
          </div>
        </section>

        <section className="lp-trust">
          <div className="lp-container lp-trust-inner" data-reveal>
            <span className="lp-trust-label">Diseñado para agencias de seguridad privada</span>
            <div className="lp-trust-capabilities lpx-marquee" aria-label="Capacidades de la plataforma">
              <div className="lpx-marquee-track">
                {[...CAPABILITIES, ...CAPABILITIES].map((item, index) => (
                  <span key={`${item}-${index}`} aria-hidden={index >= CAPABILITIES.length}>{item}</span>
                ))}
              </div>
            </div>
            <div className="lp-trust-stats">
              <div className="lp-trust-stat">
                <strong data-count="100" data-prefix="+">+100</strong>
                <span>guardias por operación</span>
              </div>
              <div className="lp-trust-stat">
                <strong>2</strong>
                <span>interfaces conectadas</span>
              </div>
              <div className="lp-trust-stat">
                <strong data-count="100" data-suffix="%">100%</strong>
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
              <ITButton variant="text" color="gray" type="button" onClick={() => setHelpOpen(true)} size="md">
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
                  content: <ModulePanel item={item} onQuote={() => setHelpOpen(true)} />,
                };
              })}
            />
          </div>
        </section>

        <RoleShowcase role={landingRole} onRoleChange={setLandingRole} />

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

        <section id="offline" className="lp-section lp-offline-section">
          <div className="lp-container">
            <div className="lp-offline-grid">
              <div className="lp-offline-copy" data-reveal>
                <span className="lp-eyebrow">
                  <FaWifi size={10} /> Nuevo · Operación sin señal
                </span>
                <h2>El WiFi se puede caer. La operación no.</h2>
                <p>
                  El guardia escanea, reporta y cierra la ronda aunque no haya señal. Todo queda
                  guardado en el teléfono y se sincroniza solo al recuperar conexión.
                </p>
                <ul className="lp-offline-points">
                  <li><FaCheckCircle size={12} /> Escaneo y evidencias sin internet.</li>
                  <li><FaCheckCircle size={12} /> Botón Sync con revisión paso a paso.</li>
                  <li><FaCheckCircle size={12} /> Sin duplicados: fotos ya subidas no se repiten.</li>
                  <li><FaCheckCircle size={12} /> Todo llega a la consola al volver la red.</li>
                </ul>
                <button type="button" className="lp-offline-link" onClick={() => scrollTo("planes")}>
                  Ver planes con offline incluido <FaArrowRight size={10} />
                </button>
              </div>

              <div className="lp-offline-visual" data-reveal>
                <OfflineScene />
              </div>
            </div>
          </div>
        </section>

        <section id="planes" className="lp-section lp-pricing-section">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaRocket size={10} /> Planes claros
              </span>
              <h2>Elige el plan según tu operación.</h2>
              <p>
                Cada operación es distinta. Cotiza tu plan por WhatsApp y te armamos una propuesta
                a la medida.
              </p>
            </div>

            <div className="lp-pricing-grid">
              {PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onQuote={() => openWhatsAppForPlan(plan.name)}
                />
              ))}
            </div>

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

      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-grid">
          <div className="lp-footer-brand">
            <RoleLogo key={landingRole} role={landingRole} invert className="h-9 w-auto" />
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
            <ITButton variant="text" color="gray" type="button" onClick={() => scrollTo("beneficios")}>
              Beneficios
            </ITButton>
            <ITButton variant="text" color="gray" type="button" onClick={() => scrollTo("modulos")}>
              Módulos
            </ITButton>
            <ITButton variant="text" color="gray"
              type="button"
             
              onClick={() => scrollTo("como-funciona")}
            >
              Cómo funciona
            </ITButton>
          </div>

          <div>
            <h4>Contacto</h4>
            <a className="lp-footer-link" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a className="lp-footer-link" href="mailto:aamaro@axzy.dev">
              aamaro@axzy.dev
            </a>
            <ITButton variant="text" color="gray" type="button" onClick={() => setHelpOpen(true)}>
              Solicitar cotización
            </ITButton>
          </div>

          <div>
            <h4>Legal</h4>
            <ITButton variant="text" color="gray" type="button" onClick={() => navigate("/legal")}>
              Centro legal
            </ITButton>
            <ITButton variant="text" color="gray" type="button" onClick={() => navigate("/legal/privacidad")}>
              Aviso de privacidad
            </ITButton>
            <ITButton variant="text" color="gray" type="button" onClick={() => navigate("/legal/simplificado")}>
              Aviso simplificado
            </ITButton>
            <ITButton variant="text" color="gray" type="button" onClick={() => navigate("/legal/terminos")}>
              Términos y condiciones
            </ITButton>
            <ITButton variant="text" color="gray" type="button" onClick={() => navigate("/legal/arco")}>
              Derechos ARCO
            </ITButton>
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

      <HelpAssistant open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};

export default LandingPage;
