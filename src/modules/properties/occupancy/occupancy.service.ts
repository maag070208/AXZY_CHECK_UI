import { get, post } from "@app/core/axios/axios";

export interface OccupancyStatus {
  id: number;
  code: string;
  name: string;
  isOccupied: boolean;
  allowsResidents: boolean;
  allowedNext: string[];
}

export interface PropertyKind {
  id: number;
  code: string;
  name: string;
  isUnitContainer: boolean;
}

export interface PersonLite {
  id: number;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface OccupancyPeriodRow {
  id: number;
  startDate: string;
  endDate: string | null;
  status: { code: string; name: string };
  tenant?: PersonLite | null;
  owner?: PersonLite | null;
  notes?: string | null;
}

export interface OccupancyView {
  propertyId: number;
  status: { code: string; name: string } | null;
  residentCount: number;
  maxResidents: number | null;
  overcrowded: boolean;
  current: OccupancyPeriodRow | null;
  history: OccupancyPeriodRow[];
}

export interface OccupancyStats {
  properties: number;
  residents: number;
  overcrowded: number;
  byStatus: { code: string; name: string; count: number }[];
}

export interface ImportRow {
  identifier: string;
  name: string;
  mainStreet: string;
  kind: string;
  occupancy: string;
  floor?: number | null;
  unitNumber?: string | null;
}

export interface ImportResult {
  created: number;
  createdIds: number[];
  errors: { row: number; messages: string[] }[];
}

export const getOccupancyStatuses = () => get<OccupancyStatus[]>("/properties/occupancy-statuses");
export const getPropertyKinds = () => get<PropertyKind[]>("/properties/kinds");
export const getOccupancy = (propertyId: number) => get<OccupancyView>(`/properties/${propertyId}/occupancy`);
export const getOccupancyStats = () => get<OccupancyStats>("/properties/stats/occupancy");

export const changeOccupancy = (
  propertyId: number,
  body: { status: string; tenantPersonId?: number | null; releaseResidents?: boolean; notes?: string | null },
) => post<unknown>(`/properties/${propertyId}/occupancy`, body).catch((error) => error as { success: false; code?: string; messages?: string[] });

export const importProperties = (rows: ImportRow[]) =>
  post<ImportResult>("/properties/import", { rows }).catch((error) => error as { success: false; messages?: string[] });

export const searchPersons = (q: string) => get<PersonLite[]>(`/persons?q=${encodeURIComponent(q)}`);
export const createPerson = (body: { firstName: string; lastName?: string | null; phone?: string | null; email?: string | null; confirmNewPerson?: boolean }) =>
  post<PersonLite>("/persons", body).catch((error) => error as { success: false; code?: string; messages?: string[]; candidates?: PersonLite[] });

/** CSV sencillo (encabezado obligatorio, separador coma, sin comillas con comas dentro). */
export const parseImportCsv = (text: string): ImportRow[] => {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (!headerLine) return [];
  const headers = headerLine.split(",").map((h) => h.trim());
  return lines.map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    const floor = row.floor ? Number(row.floor) : null;
    return {
      identifier: row.identifier,
      name: row.name,
      mainStreet: row.mainStreet,
      kind: row.kind,
      occupancy: row.occupancy,
      floor: floor !== null && !Number.isNaN(floor) ? floor : null,
      unitNumber: row.unitNumber || null,
    };
  });
};
