import {
  ITAlert,
  ITButton,
  ITCard,
  ITDataTable,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITSearchSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { FaClipboardList, FaDownload, FaSync } from "react-icons/fa";
import { getPropertiesList, Property } from "@modules/properties/service/properties.service";
import {
  AccessDecision,
  AccessDirection,
  AccessEventRow,
  AccessMethod,
  downloadAccessLogCsv,
  getAccessLog,
} from "../services/access-log.service";

const METHOD_LABEL: Record<AccessMethod, string> = { QR: "QR", TAG: "Tag", PIN: "PIN", MANUAL: "Manual" };
const DIRECTION_LABEL: Record<AccessDirection, string> = { ENTRY: "Entrada", EXIT: "Salida" };
const DECISION_LABEL: Record<AccessDecision, string> = { ALLOWED: "Permitido", DENIED: "Denegado" };
const REASON_LABEL: Record<string, string> = {
  PROPERTY_DEBT: "Adeudo",
  EXCEPTION: "Excepción",
  PIN_VALID: "PIN válido",
  PERSONAL_QR: "Pase QR personal",
  INVALID_PIN: "PIN inválido",
  VEHICLE_ENTRY: "Entrada de vehículo",
  VEHICLE_EXIT: "Salida de vehículo",
  EXIT: "Salida",
  CLEAR: "Sin adeudo",
  IN_SCHEDULE: "En horario",
  OUT_OF_SCHEDULE: "Fuera de horario",
  REVOKED: "Revocado",
  EXPIRED: "Vencido",
  NOT_YET_VALID: "Aún no vigente",
  SCOPE_MISMATCH: "Tipo de acceso distinto",
  UNKNOWN_PASS: "Pase desconocido",
  NO_AUTHORIZATION: "Sin autorización",
};

const METHOD_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "QR", label: "QR" },
  { value: "TAG", label: "Tag" },
  { value: "PIN", label: "PIN" },
  { value: "MANUAL", label: "Manual" },
];
const DIRECTION_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "ENTRY", label: "Entrada" },
  { value: "EXIT", label: "Salida" },
];
const DECISION_OPTIONS = [
  { value: "ALL", label: "Todas" },
  { value: "ALLOWED", label: "Permitido" },
  { value: "DENIED", label: "Denegado" },
];

const personOf = (row: AccessEventRow) => {
  if (row.person) return `${row.person.firstName} ${row.person.lastName ?? ""}`.trim();
  if (row.vehicle) return row.vehicle.plate + (row.vehicle.tagCode ? ` · ${row.vehicle.tagCode}` : "");
  if (row.invitation) return row.invitation.guestName;
  return "—";
};

const AccessLogPage = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState("ALL");
  const [method, setMethod] = useState("ALL");
  const [direction, setDirection] = useState("ALL");
  const [decision, setDecision] = useState("ALL");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState<any>(dayjs().subtract(30, "day").toDate());
  const [to, setTo] = useState<any>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getPropertiesList()
      .then((res) => res.success && res.data && setProperties(res.data))
      .catch(() => setProperties([]));
  }, []);

  const filters = useCallback(
    () => ({
      ...(propertyId !== "ALL" ? { propertyId: Number(propertyId) } : {}),
      ...(method !== "ALL" ? { method: method as AccessMethod } : {}),
      ...(direction !== "ALL" ? { direction: direction as AccessDirection } : {}),
      ...(decision !== "ALL" ? { decision: decision as AccessDecision } : {}),
      ...(query.trim() ? { q: query.trim() } : {}),
      from: dayjs(from).format("YYYY-MM-DD"),
      to: dayjs(to).format("YYYY-MM-DD"),
    }),
    [propertyId, method, direction, decision, query, from, to],
  );

  const fetchData = useCallback(
    async (params: { page: number; limit: number }) => {
      try {
        const result = await getAccessLog({ ...filters(), page: params.page, pageSize: params.limit });
        setLoadError(null);
        return { data: result.items, total: result.total };
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "No se pudo cargar la bitácora");
        return { data: [], total: 0 };
      }
    },
    [filters],
  );

  const columns = [
    {
      key: "occurredAt",
      label: "Fecha",
      render: (row: AccessEventRow) => <ITText muted>{dayjs(row.occurredAt).format("DD/MM/YYYY HH:mm")}</ITText>,
    },
    {
      key: "property",
      label: "Propiedad",
      render: (row: AccessEventRow) => <ITText>{row.property?.identifier ?? "—"}</ITText>,
    },
    {
      key: "person",
      label: "Persona / vehículo",
      render: (row: AccessEventRow) => <ITText className="font-semibold!">{personOf(row)}</ITText>,
    },
    {
      key: "method",
      label: "Método",
      render: (row: AccessEventRow) => <ITText>{METHOD_LABEL[row.method]}</ITText>,
    },
    {
      key: "direction",
      label: "Sentido",
      render: (row: AccessEventRow) => <ITText>{DIRECTION_LABEL[row.direction]}</ITText>,
    },
    {
      key: "decision",
      label: "Decisión",
      render: (row: AccessEventRow) => (
        <ITText className={row.decision === "ALLOWED" ? "font-bold! text-emerald-700" : "font-bold! text-rose-700"}>
          {DECISION_LABEL[row.decision]}
        </ITText>
      ),
    },
    {
      key: "guard",
      label: "Guardia",
      render: (row: AccessEventRow) => <ITText muted>{row.guard ? `${row.guard.name} ${row.guard.lastName ?? ""}`.trim() : "—"}</ITText>,
    },
    {
      key: "reason",
      label: "Motivo",
      render: (row: AccessEventRow) => <ITText muted>{row.reason ? REASON_LABEL[row.reason] ?? row.reason : "—"}</ITText>,
    },
  ];

  const propertyOptions = [
    { value: "ALL", label: "Todas las propiedades" },
    ...properties.map((property) => ({ value: String(property.id), label: `${property.identifier} · ${property.name}` })),
  ];

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadAccessLogCsv(filters());
    } finally {
      setExporting(false);
    }
  };

  return (
    <ITPage
      noPadding
      className="m-0! px-4! max-w-screen!"
      title="Bitácora de accesos"
      description="Entradas y salidas de visitas, autorizaciones, vehículos y clave peatonal"
      icon={<FaClipboardList />}
      actions={
        <ITFlex gap={2}>
          <ITButton variant="outline" icon={<FaSync />} label="Refrescar" ariaLabel="Refrescar bitácora" onClick={() => setRefreshKey((key) => key + 1)} />
          <ITButton variant="outline" icon={<FaDownload />} label={exporting ? "Exportando…" : "Exportar CSV"} onClick={() => void exportCsv()} disabled={exporting} />
        </ITFlex>
      }
    >
      <ITFlex direction="column" gap={4} className="py-4">
        <ITCard contentClassName="p-4!">
          <ITFlex direction="column" gap={3}>
            <ITGrid container columns={12} spacing={3}>
              <ITGrid item xs={12} md={3}>
                <ITDatePicker name="from" label="Desde" value={from} onChange={(event: any) => setFrom(event.target.value)} />
              </ITGrid>
              <ITGrid item xs={12} md={3}>
                <ITDatePicker name="to" label="Hasta" value={to} onChange={(event: any) => setTo(event.target.value)} />
              </ITGrid>
              <ITGrid item xs={12} md={3}>
                <ITSearchSelect name="property" label="Propiedad" options={propertyOptions} value={propertyId} onChange={(value) => setPropertyId(String(value))} clearable={false} />
              </ITGrid>
              <ITGrid item xs={12} md={3}>
                <ITInput name="q" label="Buscar" placeholder="Persona, placa, tag, propiedad…" value={query} onChange={(event) => setQuery(event.target.value)} />
              </ITGrid>
              <ITGrid item xs={6} md={2}>
                <ITSearchSelect name="method" label="Método" options={METHOD_OPTIONS} value={method} onChange={(value) => setMethod(String(value))} clearable={false} />
              </ITGrid>
              <ITGrid item xs={6} md={2}>
                <ITSearchSelect name="direction" label="Sentido" options={DIRECTION_OPTIONS} value={direction} onChange={(value) => setDirection(String(value))} clearable={false} />
              </ITGrid>
              <ITGrid item xs={6} md={2}>
                <ITSearchSelect name="decision" label="Decisión" options={DECISION_OPTIONS} value={decision} onChange={(value) => setDecision(String(value))} clearable={false} />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITFlex justify="end" className="h-full items-end pb-1">
                  <ITButton label="Aplicar filtros" onClick={() => setRefreshKey((key) => key + 1)} />
                </ITFlex>
              </ITGrid>
            </ITGrid>
          </ITFlex>
        </ITCard>

        {loadError && <ITAlert variant="error" title="No se pudo cargar la bitácora">{loadError}</ITAlert>}
        <ITCard contentClassName="p-0!">
          <ITDataTable
            key={`${refreshKey}-${propertyId}-${method}-${direction}-${decision}-${query}`}
            fetchData={fetchData as any}
            columns={columns as any}
            defaultItemsPerPage={25}
            itemsPerPageOptions={[25, 50, 100]}
            density="compact"
            rowHeight={50}
          />
        </ITCard>
      </ITFlex>
    </ITPage>
  );
};

export default AccessLogPage;
