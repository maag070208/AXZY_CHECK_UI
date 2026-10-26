import { get, patch, post } from "@app/core/axios/axios";
import { ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";
import { TResult } from "@app/core/types/TResult";

export type ChargeCategory = "CUOTA" | "MANTENIMIENTO" | "EXTRA" | "RECARGO";
export type ChargeStatus = "PENDING" | "PARTIAL" | "PAID" | "CANCELLED";
export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "AJUSTE";

export interface FinanceProperty {
  id: number;
  identifier: string;
  name: string;
}

export interface FinanceResident {
  id: number;
  name: string;
  lastName?: string | null;
  username?: string;
}

export interface ChargeRow {
  id: number;
  propertyId: number;
  residentId: number;
  concept: string;
  category: ChargeCategory;
  amount: number;
  dueDate: string;
  status: ChargeStatus;
  period?: string | null;
  notes?: string | null;
  paidAmount: number;
  outstanding: number;
  property?: FinanceProperty | null;
  resident?: FinanceResident | null;
  createdAt: string;
}

export interface PaymentAllocationRow {
  id: number;
  amount: number;
  chargeId: number;
  charge?: { concept: string; residentId: number } | null;
}

export interface PaymentRow {
  id: number;
  propertyId: number;
  residentId?: number | null;
  folio?: number | null;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  paidAt: string;
  unallocatedAmount: number;
  allocatedAmount: number;
  appliedAmount: number;
  voidedAt?: string | null;
  voidReason?: string | null;
  property?: FinanceProperty | null;
  resident?: FinanceResident | null;
  registeredBy?: FinanceResident | null;
  voidedBy?: FinanceResident | null;
  allocations: PaymentAllocationRow[];
}

export interface PropertyBalance {
  id: number;
  identifier: string;
  name: string;
  totalCharges: number;
  applied: number;
  credit: number;
  totalPaid: number;
  balance: number;
  residents: number;
  pendingCharges: number;
}

export interface FinanceSummary {
  items: PropertyBalance[];
  totals: {
    properties: number;
    totalCharges: number;
    totalPaid: number;
    balance: number;
  };
}

export const CHARGE_CATEGORY_LABELS: Record<ChargeCategory, string> = {
  CUOTA: "Cuota",
  MANTENIMIENTO: "Mantenimiento",
  EXTRA: "Extra",
  RECARGO: "Recargo",
};

export const CHARGE_STATUS_LABELS: Record<ChargeStatus, string> = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagado",
  CANCELLED: "Cancelado",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  AJUSTE: "Ajuste",
};

const errorOf = (messages: string[] | null | undefined, fallback: string) =>
  new Error(messages?.[0] ?? fallback);

/** El wrapper de axios lanza el TResult de error; lo convertimos a Error para los formularios. */
const request = async <T>(promise: Promise<TResult<T>>, fallback: string): Promise<TResult<T>> => {
  try {
    return await promise;
  } catch (error: any) {
    const message = Array.isArray(error?.messages) && error.messages.length ? error.messages[0] : undefined;
    throw new Error(message ?? fallback);
  }
};

const cleanFilters = (filters?: Record<string, unknown>) => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    result[key] = value;
  }
  return result;
};

export const getCharges = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<ChargeRow>> => {
  const res = await request(
    get<{ data: ChargeRow[]; total: number }>("/charges", {
      params: {
        page: params.page,
        pageSize: params.limit,
        ...cleanFilters(params.filters as Record<string, unknown>),
      },
    }),
    "No se pudieron cargar los cargos",
  );
  if (!res.success || !res.data) {
    throw errorOf(res.messages, "No se pudieron cargar los cargos");
  }
  return { data: res.data.data, total: res.data.total };
};

export const getPayments = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<PaymentRow>> => {
  const res = await request(
    get<{ data: PaymentRow[]; total: number }>("/payments", {
      params: {
        page: params.page,
        pageSize: params.limit,
        ...cleanFilters(params.filters as Record<string, unknown>),
      },
    }),
    "No se pudieron cargar los pagos",
  );
  if (!res.success || !res.data) {
    throw errorOf(res.messages, "No se pudieron cargar los pagos");
  }
  return { data: res.data.data, total: res.data.total };
};

export const getFinanceSummary = async (): Promise<FinanceSummary> => {
  const res = await request(get<FinanceSummary>("/finance/summary"), "No se pudo cargar el resumen de saldos");
  if (!res.success || !res.data) {
    throw errorOf(res.messages, "No se pudo cargar el resumen de saldos");
  }
  return res.data;
};

export const createCharge = async (data: {
  propertyId: number;
  residentId?: number;
  concept: string;
  category: ChargeCategory;
  amount: number;
  dueDate: string;
  period?: string | null;
  notes?: string | null;
}): Promise<ChargeRow> => {
  const res = await request(post<ChargeRow>("/charges", data), "No se pudo registrar el cargo");
  if (!res.success || !res.data) {
    throw errorOf(res.messages, "No se pudo registrar el cargo");
  }
  return res.data;
};

export const generateMonthlyCharges = async (data: {
  period: string;
  amount: number;
  dueDate: string;
  concept?: string;
  propertyIds?: number[];
}): Promise<{ created: number; skipped: number; results: Array<{ propertyId: number; status: string }> }> => {
  const res = await request(
    post<{ created: number; skipped: number; results: Array<{ propertyId: number; status: string }> }>(
      "/charges/monthly",
      data,
    ),
    "No se pudieron generar las cuotas",
  );
  if (!res.success || !res.data) {
    throw errorOf(res.messages, "No se pudieron generar las cuotas");
  }
  return res.data;
};

export const cancelCharge = async (id: number, reason: string): Promise<ChargeRow> => {
  const res = await request(patch<ChargeRow>(`/charges/${id}/cancel`, { reason }), "No se pudo cancelar el cargo");
  if (!res.success || !res.data) {
    throw errorOf(res.messages, "No se pudo cancelar el cargo");
  }
  return res.data;
};

export const registerPayment = async (data: {
  propertyId: number;
  residentId?: number;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  paidAt?: string;
  chargeIds?: number[];
  allowOverpayment?: boolean;
}): Promise<PaymentRow> => {
  const res = await request(post<PaymentRow>("/payments", data), "No se pudo registrar el pago");
  if (!res.success || !res.data) {
    throw errorOf(res.messages, "No se pudo registrar el pago");
  }
  return res.data;
};

export const voidPayment = async (id: number, reason: string): Promise<PaymentRow> => {
  const res = await request(post<PaymentRow>(`/payments/${id}/void`, { reason }), "No se pudo reversar el pago");
  if (!res.success || !res.data) {
    throw errorOf(res.messages, "No se pudo reversar el pago");
  }
  return res.data;
};

/** Descarga el recibo PDF del pago (el navegador lo guarda). */
export const downloadPaymentReceipt = async (paymentId: number): Promise<TResult<boolean>> => {
  try {
    const { axiosInstance } = await import("@app/core/axios/axios");
    const response = await axiosInstance.get(`/payments/${paymentId}/receipt`, {
      responseType: "blob",
      headers: { Accept: "application/pdf" },
    });

    const blob = response.data as Blob;
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `recibo-pago-${paymentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { data: true, success: true, message: "Recibo descargado", messages: ["Recibo descargado"], ex: null };
  } catch (error: unknown) {
    const e = error as { response?: { data?: Blob }; message?: string };
    let message = "No se pudo descargar el recibo";
    if (e.response?.data instanceof Blob) {
      try {
        const parsed = JSON.parse(await e.response.data.text()) as { messages?: string[] };
        if (parsed.messages?.length) message = parsed.messages[0];
      } catch {
        message = e.message ?? message;
      }
    } else if (e.message) {
      message = e.message;
    }
    return { data: false, success: false, message, messages: [message], ex: null };
  }
};
