import { ITChip, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { setAuth } from "@app/core/store/auth/auth.slice";
import { AppDispatch } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { Blobatar } from "@blobatar/react";
import { IAuthLogin } from "@core/types/auth.types";
import type { ComponentType } from "react";
import {
  FaArrowRight,
  FaClipboardList,
  FaComments,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaQrcode,
  FaRoute,
  FaShieldAlt,
  FaUserShield,
  FaWallet,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import LoginFormComponent from "../components/LoginForm";
import { RoleLogo } from "@app/core/components/RoleLogo";
import { login } from "../services/AuthService";
import { decodeToken } from "react-jwt";

type Feature = { icon: ComponentType<{ size?: number }>; label: string };
type Person = { name: string; role: string };

interface RoleDesign {
  panelClass: string;
  orbClass: string;
  accentClass: string;
  chipColor: "success" | "info" | "primary" | "purple";
  chipClass: string;
  eyebrow: string;
  headline: string;
  description: string;
  people: Person[];
  communityTitle: string;
  communityLabel: string;
  communityHint: string;
  features: Feature[];
  footerLabel: string;
  rightEyebrow: string;
  rightTitle: string;
  rightDescription: string;
}

const PEOPLE_ADMIN: Person[] = [
  { name: "Ana Administradora", role: "Administración" },
  { name: "Sergio Supervisor", role: "Jefe de turno" },
  { name: "Gabriela Guardia", role: "Guardia" },
  { name: "Rosa Residente", role: "Residente" },
];

const PEOPLE_SHIFT: Person[] = [
  { name: "Sergio Supervisor", role: "Jefe de guardias" },
  { name: "Gabriela Guardia", role: "Guardia" },
  { name: "Gonzalo Guardia", role: "Guardia" },
  { name: "Mateo Mantenimiento", role: "Mantenimiento" },
];

const PEOPLE_GUARD: Person[] = [
  { name: "Gabriela Guardia", role: "Guardia" },
  { name: "Gonzalo Guardia", role: "Guardia" },
  { name: "Sergio Supervisor", role: "Jefe de turno" },
  { name: "Rosa Residente", role: "Residente" },
];

const PEOPLE_RESIDENT: Person[] = [
  { name: "Rosa Residente", role: "Residente" },
  { name: "Ana Vecina", role: "Residente" },
  { name: "Sergio Supervisor", role: "Jefe de guardias" },
  { name: "Gabriela Guardia", role: "Guardia" },
];

const GENERIC: RoleDesign = {
  panelClass: "bg-[#065911]",
  orbClass: "bg-emerald-700/50",
  accentClass: "bg-emerald-400/15 text-emerald-200",
  chipColor: "success",
  chipClass: "bg-white/10! text-emerald-100!",
  eyebrow: "CHECKAPP RESIDENCIAL",
  headline: "La comunidad, más simple y segura.",
  description: "Accesos, pagos, kardex y comunicación en un solo lugar. La operación del residencial, clara para todos.",
  people: PEOPLE_ADMIN,
  communityTitle: "Una comunidad conectada",
  communityLabel: "Todo conectado",
  communityHint: "Accesos y pagos",
  features: [
    { icon: FaShieldAlt, label: "Accesos con QR" },
    { icon: FaWallet, label: "Pagos y recibos" },
    { icon: FaClipboardList, label: "Kardex y bitácora" },
    { icon: FaComments, label: "Quejas y seguimiento" },
  ],
  footerLabel: "Operación en tiempo real",
  rightEyebrow: "ACCESO SEGURO",
  rightTitle: "Bienvenido de nuevo",
  rightDescription: "Inicia sesión para continuar con la operación del residencial.",
};

const ROLE_DESIGNS: Record<string, RoleDesign> = {
  admin: {
    ...GENERIC,
    eyebrow: "ADMINISTRACIÓN",
    headline: "La operación, clara y bajo control.",
    description: "Rondas, guardias, accesos y finanzas en una sola consola. Decide con información en tiempo real.",
    people: PEOPLE_ADMIN,
    communityLabel: "Todo bajo control",
    communityHint: "Operación y comunidad",
    features: [
      { icon: FaUserShield, label: "Rondas y guardias" },
      { icon: FaWallet, label: "Cobranza y pagos" },
      { icon: FaClipboardList, label: "Expedientes y kardex" },
      { icon: FaShieldAlt, label: "Reportes y accesos" },
    ],
    rightEyebrow: "ACCESO ADMINISTRATIVO",
    rightDescription: "Inicia sesión para continuar con la operación del residencial.",
  },
  jefe: {
    ...GENERIC,
    panelClass: "bg-[#064E4B]",
    orbClass: "bg-teal-700/50",
    accentClass: "bg-teal-400/15 text-teal-200",
    chipColor: "info",
    chipClass: "bg-white/10! text-teal-100!",
    eyebrow: "JEFE DE GUARDIAS",
    headline: "Cada turno, coordinado y sin huecos.",
    description: "Tu equipo, las rondas y las novedades del turno, siempre a la vista para decidir a tiempo.",
    people: PEOPLE_SHIFT,
    communityTitle: "Tu equipo en turno",
    communityLabel: "Equipo en turno",
    communityHint: "Guardias y supervisión",
    features: [
      { icon: FaUserShield, label: "Guardias en turno" },
      { icon: FaRoute, label: "Rondas activas" },
      { icon: FaClipboardList, label: "Novedades del turno" },
      { icon: FaExchangeAlt, label: "Entrega de turno" },
    ],
    footerLabel: "Turno en tiempo real",
    rightEyebrow: "ACCESO JEFE DE GUARDIAS",
    rightTitle: "Tu turno empieza aquí",
    rightDescription: "Coordina guardias, rondas y novedades del turno.",
  },
  guardia: {
    ...GENERIC,
    panelClass: "bg-[#0B2E4F]",
    orbClass: "bg-sky-700/50",
    accentClass: "bg-sky-400/15 text-sky-200",
    chipColor: "info",
    chipClass: "bg-white/10! text-sky-100!",
    eyebrow: "GUARDIA",
    headline: "Tu ronda, tu caseta, todo en un lugar.",
    description: "Escanea accesos, revisa tus asignaciones y reporta novedades desde donde estés.",
    people: PEOPLE_GUARD,
    communityTitle: "Tu operación diaria",
    communityLabel: "Operación diaria",
    communityHint: "Caseta, rondas y reportes",
    features: [
      { icon: FaQrcode, label: "Escaneo de accesos" },
      { icon: FaRoute, label: "Mi ronda" },
      { icon: FaClipboardList, label: "Mis asignaciones" },
      { icon: FaExclamationTriangle, label: "Reportar incidencia" },
    ],
    footerLabel: "Accesos en tiempo real",
    rightEyebrow: "ACCESO GUARDIA",
    rightTitle: "Bienvenido a tu turno",
    rightDescription: "Consulta tu ronda, escanea accesos y reporta novedades.",
  },
  mantenimiento: {
    ...GENERIC,
    panelClass: "bg-[#334155]",
    orbClass: "bg-slate-700/50",
    accentClass: "bg-slate-400/15 text-slate-200",
    chipColor: "info",
    chipClass: "bg-white/10! text-slate-100!",
    eyebrow: "MANTENIMIENTO",
    headline: "El mantenimiento, sin perder el hilo.",
    description: "Tus órdenes, reportes y pendientes del residencial en un solo lugar.",
    people: PEOPLE_ADMIN,
    communityTitle: "Tu operación",
    communityLabel: "Mantenimiento",
    communityHint: "Órdenes y reportes",
    features: [
      { icon: FaClipboardList, label: "Mis órdenes" },
      { icon: FaExclamationTriangle, label: "Reportar novedad" },
    ],
    footerLabel: "Operación en tiempo real",
    rightEyebrow: "ACCESO MANTENIMIENTO",
    rightTitle: "Bienvenido a tu turno",
    rightDescription: "Consulta tus órdenes y reporta novedades.",
  },
  residente: {
    ...GENERIC,
    panelClass: "bg-[#3B1D5A]",
    orbClass: "bg-violet-700/50",
    accentClass: "bg-violet-400/15 text-violet-200",
    chipColor: "purple",
    chipClass: "bg-white/10! text-violet-100!",
    eyebrow: "RESIDENTE",
    headline: "Tu comunidad, más simple y segura.",
    description: "Pases, pagos, kardex y quejas de tu propiedad, sin filas y desde cualquier lugar.",
    people: PEOPLE_RESIDENT,
    communityTitle: "Tu comunidad",
    communityLabel: "Tu comunidad",
    communityHint: "Pases, pagos y servicios",
    features: [
      { icon: FaQrcode, label: "Mis pases" },
      { icon: FaWallet, label: "Mis pagos" },
      { icon: FaClipboardList, label: "Mi kardex" },
      { icon: FaComments, label: "Quejas y seguimiento" },
    ],
    footerLabel: "Comunidad en tiempo real",
    rightEyebrow: "ACCESO RESIDENTE",
    rightTitle: "Bienvenido a tu comunidad",
    rightDescription: "Consulta tus pases, pagos y todo lo de tu propiedad.",
  },
};

const ROLE_ALIASES: Record<string, string> = {
  admin: "admin",
  administrador: "admin",
  jefe: "jefe",
  "jefe-de-guardias": "jefe",
  shift: "jefe",
  guardia: "guardia",
  guard: "guardia",
  residente: "residente",
  resident: "residente",
  resdn: "residente",
  maint: "mantenimiento",
  mantenimiento: "mantenimiento",
  maintenance: "mantenimiento",
};

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  // Sin sesión mostramos el verde normal. Si alguien ya inició sesión antes,
  // el login conserva el color del último rol guardado en localStorage.
  const lastRole = typeof window !== "undefined" ? localStorage.getItem("lastRole") : null;
  const roleKey = lastRole ? ROLE_ALIASES[lastRole.toLowerCase()] : undefined;
  const design = roleKey ? ROLE_DESIGNS[roleKey] : GENERIC;

  const handleSubmit = async (values: IAuthLogin) => {
    const response = await login({ ...values }).catch(() => {
      dispatch(
        showToast({
          message: "Error al iniciar sesión",
          type: "error",
          position: "top-right",
        }),
      );
      return null;
    });

    if (response) {
      if (!response.success) {
        dispatch(
          showToast({
            message: response.message,
            type: "error",
            position: "top-right",
          }),
        );
        return;
      }

      // El token se guarda al iniciar sesión; signOut lo borra al cerrarla.
      localStorage.setItem("token", response.data);
      const decoded = decodeToken<{ role?: string }>(response.data);
      if (decoded?.role) localStorage.setItem("lastRole", decoded.role);
      dispatch(setAuth(response.data));
      navigate("/home");
    }
  };

  return (
    <ITFlex align="center" justify="center" className="relative min-h-screen w-full overflow-hidden bg-[#F4F9F6] px-4 py-6 sm:px-6 lg:px-10">
      <ITFlex className="pointer-events-none absolute -left-24 -top-32 h-[420px] w-[420px] rounded-full bg-emerald-100/70 blur-3xl" />
      <ITFlex className="pointer-events-none absolute -bottom-40 -right-24 h-[460px] w-[460px] rounded-full bg-teal-100/60 blur-3xl" />

      <ITFlex className="relative z-10 mx-auto my-auto grid w-full max-w-[1180px] overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-emerald-900/10 lg:grid-cols-[1.05fr_0.95fr]">
        <ITFlex direction="column" justify="between" className={`relative hidden min-h-[720px] overflow-hidden p-12! lg:flex ${design.panelClass}`}>
          <ITFlex className={`pointer-events-none absolute -right-24 -top-24 h-[330px] w-[330px] rounded-full ${design.orbClass}`} />
          <ITFlex className="pointer-events-none absolute -bottom-32 -left-24 h-[360px] w-[360px] rounded-full border border-white/10 bg-white/5" />

          <ITFlex className="relative z-10">
            <RoleLogo className="h-9 w-[150px]" invert />

            <ITFlex direction="column" className="mt-12 max-w-[440px]">
              <ITChip label={design.eyebrow} size="sm" variant="soft" color={design.chipColor} className={`w-fit ${design.chipClass}`} />
              <ITText as="h1" className="mt-5 text-[38px] font-black leading-[1.08] tracking-tight text-white!">
                {design.headline}
              </ITText>
              <ITText as="p" className="mt-5 max-w-[390px] text-sm leading-6 text-white/75!">
                {design.description}
              </ITText>
            </ITFlex>
          </ITFlex>

          <ITFlex direction="column" className="relative z-10 mt-8">
            <ITFlex className="rounded-3xl border border-white/15 bg-white/10 p-6! backdrop-blur-sm">
              <ITText as="p" className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60!">
                {design.communityTitle}
              </ITText>
              <ITFlex align="center" className="mt-4">
                <ITFlex className="flex -space-x-3">
                  {design.people.map((person) => (
                    <ITFlex
                      key={person.name}
                      className="h-11 w-11 overflow-hidden rounded-full border-2 border-white/20 bg-white"
                    >
                      <Blobatar name={person.name} size={40} animate="hover" />
                    </ITFlex>
                  ))}
                </ITFlex>
                <ITFlex direction="column" className="ml-4 min-w-0">
                  <ITText as="p" className="text-sm font-bold text-white!">{design.communityLabel}</ITText>
                  <ITText as="p" className="text-[11px] text-white/65!">{design.communityHint}</ITText>
                </ITFlex>
              </ITFlex>
            </ITFlex>

            <ITFlex className="mt-6 grid grid-cols-2 gap-3">
              {design.features.map(({ icon: Icon, label }) => (
                <ITFlex key={label} align="center" gap={2} className="rounded-xl border border-white/10 bg-white/5 px-4! py-3.5!">
                  <ITFlex align="center" justify="center" className={`h-7 w-7 shrink-0 rounded-lg ${design.accentClass}`}>
                    <Icon size={12} />
                  </ITFlex>
                  <ITText as="span" className="text-[10px] font-bold text-white/80!">{label}</ITText>
                </ITFlex>
              ))}
            </ITFlex>

            <ITFlex align="center" gap={2} className="mt-6 text-[10px] font-semibold text-white/60!">
              <ITText as="span" className={`h-1.5 w-1.5 rounded-full ${design.accentClass.split(" ")[0]}`} />
              {design.footerLabel}
              <FaArrowRight size={9} />
            </ITFlex>
          </ITFlex>
        </ITFlex>

        <ITFlex align="center" justify="center" className="bg-white px-6 py-12 sm:px-10 lg:px-16">
          <ITFlex direction="column" className="w-full max-w-[400px]">
            <ITFlex align="center" justify="between" className="lg:hidden">
              <RoleLogo className="h-9 w-auto" />
            </ITFlex>

            <ITChip label={design.rightEyebrow} size="sm" variant="soft" color={design.chipColor} className="mt-8 w-fit lg:mt-0" />
            <ITText as="h2" className="mt-4 text-[30px] font-black tracking-tight text-slate-900">
              {design.rightTitle}
            </ITText>
            <ITText as="p" className="mt-2 text-sm leading-6 text-slate-500">
              {design.rightDescription}
            </ITText>

            <ITFlex direction="column" className="mt-8">
              <LoginFormComponent onSubmit={handleSubmit} />
            </ITFlex>

            <ITText as="p" className="mt-8 text-center text-[10px] font-semibold text-slate-400">
              CheckApp · Gestión residencial inteligente
            </ITText>


          </ITFlex>
        </ITFlex>
      </ITFlex>
    </ITFlex>
  );
};

export default LoginPage;
