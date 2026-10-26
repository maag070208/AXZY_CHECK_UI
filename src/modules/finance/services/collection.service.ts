import { get, post, put } from "@app/core/axios/axios";

export type CollectionFrequency = "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "FOUR_MONTHLY" | "SEMIANNUAL" | "ANNUAL";
export type LateFeeType = "NONE" | "FIXED" | "PERCENT";

export interface CollectionConfigRow {
  id: number;
  propertyId: number;
  concept: string;
  amount: number;
  frequency: CollectionFrequency;
  dueDay: number;
  nextChargeDate: string;
  graceDays: number;
  lateFeeType: LateFeeType;
  lateFeeValue: number;
  active: boolean;
  property?: { id: number; identifier: string; name: string } | null;
}

export interface CollectionConfigInput {
  propertyId: number;
  concept: string;
  amount: number;
  frequency: CollectionFrequency;
  dueDay: number;
  nextChargeDate: string;
  graceDays: number;
  lateFeeType: LateFeeType;
  lateFeeValue: number;
  active: boolean;
}

export interface CollectionRunResult {
  created: number;
  skipped: number;
  results: Array<{
    configId: number;
    propertyId: number;
    status: string;
    chargeId?: number;
    lateFeeChargeId?: number;
    period?: string;
    amount?: number;
    message?: string;
  }>;
}

const errorOf = (messages: string[] | undefined, fallback: string) => new Error(messages?.[0] ?? fallback);

export const COLLECTION_FREQUENCY_OPTIONS: { value: CollectionFrequency; label: string }[] = [
  { value: "MONTHLY", label: "Mensual" },
  { value: "BIMONTHLY", label: "Bimestral" },
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "FOUR_MONTHLY", label: "Cuatrimestral" },
  { value: "SEMIANNUAL", label: "Semestral" },
  { value: "ANNUAL", label: "Anual" },
];

export const COLLECTION_FREQUENCY_LABELS: Record<CollectionFrequency, string> = Object.fromEntries(
  COLLECTION_FREQUENCY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<CollectionFrequency, string>;

export const LATE_FEE_OPTIONS: { value: LateFeeType; label: string }[] = [
  { value: "NONE", label: "Sin recargo" },
  { value: "FIXED", label: "Monto fijo" },
  { value: "PERCENT", label: "Porcentaje del saldo" },
];

export const LATE_FEE_LABELS: Record<LateFeeType, string> = {
  NONE: "Sin recargo",
  FIXED: "Fijo",
  PERCENT: "Porcentaje",
};

export const getCollectionConfigs = async (): Promise<CollectionConfigRow[]> => {
  const res = await get<CollectionConfigRow[]>("/collections/configs");
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudo cargar la cobranza");
  return res.data;
};

export const saveCollectionConfig = async (input: CollectionConfigInput): Promise<CollectionConfigRow> => {
  const res = await post<CollectionConfigRow>("/collections/configs", input);
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudo guardar la configuración");
  return res.data;
};

export const updateCollectionConfig = async (
  id: number,
  input: Partial<Omit<CollectionConfigInput, "propertyId">>,
): Promise<CollectionConfigRow> => {
  const res = await put<CollectionConfigRow>(`/collections/configs/${id}`, input);
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudo actualizar la configuración");
  return res.data;
};

export const generateCollectionCharges = async (input: { propertyId?: number; throughDate?: string } = {}) => {
  const res = await post<CollectionRunResult>("/collections/generate", input);
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudieron generar los cargos");
  return res.data;
};

export const applyLateFees = async (input: { propertyId?: number } = {}) => {
  const res = await post<CollectionRunResult>("/collections/apply-late-fees", input);
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudieron aplicar los recargos");
  return res.data;
};
