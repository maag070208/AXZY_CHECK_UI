import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as club from "@app/modules/club/services/ClubService";
import * as incidents from "@app/modules/incidents/services/IncidentService";
import * as kardex from "@app/modules/kardex/services/KardexService";
import * as locations from "@app/modules/locations/service/locations.service";
import * as maint from "@app/modules/maintenances/services/MaintenanceService";
import * as properties from "@app/modules/properties/service/properties.service";
import * as residents from "@app/modules/residents/services/residents.service";
import * as rounds from "@app/modules/rounds/services/RoundsService";
import * as routes from "@app/modules/routes/services/RoutesService";
import * as shift from "@app/modules/shift-handover/services/ShiftHandoverService";
import * as uniform from "@app/modules/uniform/services/UniformService";
import * as users from "@app/modules/users/services/UserService";
import { mockTransport, stub } from "../../helpers/api";

/** Los 3 módulos de reportes (incidencias, casa club, mantenimientos) comparten forma. */
const reportModules = [
  {
    name: "incidents",
    base: "/incidents",
    list: incidents.getIncidents,
    create: incidents.createIncident,
    resolve: incidents.resolveIncident,
    remove: incidents.deleteIncident,
    removeMedia: incidents.deleteIncidentMedia,
    paginated: incidents.getPaginatedIncidents,
    upload: incidents.uploadIncidentFile,
    pdf: incidents.downloadIncidentsPdf,
    pdfPath: "/reports/incidents/pdf",
    file: "reporte-incidencias-",
    uploadKind: "incident",
  },
  {
    name: "club",
    base: "/club",
    list: club.getClubs,
    create: club.createClub,
    resolve: club.resolveClub,
    remove: club.deleteClub,
    removeMedia: club.deleteClubMedia,
    paginated: club.getPaginatedClubs,
    upload: club.uploadClubFile,
    pdf: club.downloadClubsPdf,
    pdfPath: "/reports/club/pdf",
    file: "reporte-casa-club-",
    uploadKind: "incident",
  },
  {
    name: "maintenance",
    base: "/maintenance",
    list: maint.getMaintenances,
    create: maint.createMaintenance,
    resolve: maint.resolveMaintenance,
    remove: maint.deleteMaintenance,
    removeMedia: maint.deleteMaintenanceMedia,
    paginated: maint.getPaginatedMaintenances,
    upload: maint.uploadMaintenanceFile,
    pdf: maint.downloadMaintenancesPdf,
    pdfPath: "/maintenance/report/pdf",
    file: "reporte-mantenimientos-",
    uploadKind: "maintenance",
  },
] as const;

describe.each(reportModules)("servicio de reportes: $name", (m) => {
  it("list sin filtros no manda query", async () => {
    const seen = stub("get", m.base);
    await (m.list as () => Promise<unknown>)();
    expect(seen.search).toBe("");
  });

  it("list arma el query con todos los filtros", async () => {
    const seen = stub("get", m.base);
    const d = new Date("2026-01-02T00:00:00.000Z");
    await (m.list as (f: unknown) => Promise<unknown>)({ startDate: d, endDate: d, guardId: 2, category: "c", title: "t" });
    expect(seen.search).toBe(
      "?startDate=2026-01-02T00:00:00.000Z&endDate=2026-01-02T00:00:00.000Z&guardId=2&category=c&title=t",
    );
  });

  it("create / resolve / remove / removeMedia usan la ruta correcta", async () => {
    const post = stub("post", m.base);
    await (m.create as (d: unknown) => Promise<unknown>)({ a: 1 });
    expect(post.body).toEqual({ a: 1 });

    const put = stub("put", `${m.base}/5/resolve`);
    await (m.resolve as (id: number) => Promise<unknown>)(5);
    expect(put.path).toBe(`${m.base}/5/resolve`);

    const del = stub("delete", `${m.base}/5`);
    await (m.remove as (id: number) => Promise<unknown>)(5);
    expect(del.method).toBe("DELETE");

    const media = stub("delete", `${m.base}/5/media`);
    await (m.removeMedia as (id: number, k: string) => Promise<unknown>)(5, "abc");
    expect(media.search).toBe("?key=abc");
  });

  it("paginated: mapea, rellena faltantes y tolera fallo", async () => {
    stub("post", `${m.base}/datatable`, { success: true, data: { rows: [{ id: 1 }], total: 1 } });
    expect(await m.paginated({})).toEqual({ data: [{ id: 1 }], total: 1 });
    stub("post", `${m.base}/datatable`, { success: true, data: {} });
    expect(await m.paginated({})).toEqual({ data: [], total: 0 });
    stub("post", `${m.base}/datatable`, { success: false });
    expect(await m.paginated({})).toEqual({ data: [], total: 0 });
  });

  it("upload: imagen, video y respuesta sin url", async () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    let reply: unknown = { success: true, data: { url: "u", type: "IMAGE", key: "k" } };
    let sent: FormData | undefined;
    mockTransport((c) => {
      sent = c.data as FormData;
      return { data: reply };
    });
    expect(await m.upload(file)).toEqual({ url: "u", type: "IMAGE", key: "k" });
    expect(sent?.get("location")).toBe(m.uploadKind);
    reply = { success: true, data: { url: "u", type: "VIDEO", key: "k" } };
    expect((await m.upload(file))?.type).toBe("VIDEO");
    reply = { success: false };
    expect(await m.upload(file)).toBeNull();
  });

  describe("pdf", () => {
    const filters = { startDate: new Date("2026-01-01T00:00:00.000Z"), endDate: new Date("2026-01-02T00:00:00.000Z") };
    let click: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      URL.createObjectURL = vi.fn(() => "blob:x");
      URL.revokeObjectURL = vi.fn();
      click = vi.fn();
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(click as never);
    });
    afterEach(() => vi.restoreAllMocks());

    const ok = () => ({ data: new Blob(["%PDF"]) });

    it("descarga el archivo con ids y opciones por defecto", async () => {
      let url = "";
      mockTransport((c) => {
        url = c.url!;
        return ok();
      });
      const res = await m.pdf({ ...filters, ids: [1, 2] });
      expect(res.success).toBe(true);
      expect(url).toContain(m.pdfPath);
      expect(url).toContain("includeImages=true&includeLocation=true&ids=1,2");
      expect(click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:x");
    });

    it("respeta includeImages/includeLocation en false y omite ids vacíos", async () => {
      let url = "";
      mockTransport((c) => {
        url = c.url!;
        return ok();
      });
      await m.pdf({ ...filters, ids: [], includeImages: false, includeLocation: false });
      expect(url).toContain("includeImages=false&includeLocation=false");
      expect(url).not.toContain("ids=");
    });

    it("error con mensajes del servidor", async () => {
      mockTransport(() => ({ status: 400, data: new Blob([JSON.stringify({ messages: ["a", "b"] })]) }));
      expect(await m.pdf(filters)).toMatchObject({ success: false, data: false, message: "a, b" });
    });

    it("error con JSON sin mensajes conserva el texto por defecto", async () => {
      mockTransport(() => ({ status: 400, data: new Blob([JSON.stringify({ messages: [] })]) }));
      expect((await m.pdf(filters)).message).toBe("Error al generar el PDF");
    });

    it("error con cuerpo que no es JSON usa el mensaje de axios", async () => {
      mockTransport(() => ({ status: 500, data: new Blob(["no-json"]) }));
      expect((await m.pdf(filters)).message).toMatch(/status code 500/);
    });

    it("error sin cuerpo Blob usa el mensaje de axios", async () => {
      mockTransport(() => ({ status: 500, data: "texto" }));
      expect((await m.pdf(filters)).message).toMatch(/status code 500/);
    });

    it("error sin mensaje conserva el texto por defecto", async () => {
      mockTransport(() => Object.assign(new Error(""), { message: "" }));
      expect((await m.pdf(filters)).message).toBe("Error al generar el PDF");
    });
  });
});

describe("paginados simples (rows/total con respaldo)", () => {
  const cases: [string, string, (p: never) => Promise<{ data: unknown[]; total: number }>][] = [
    ["locations", "/locations/datatable", locations.getPaginatedLocations as never],
    ["properties", "/properties/datatable", properties.getPaginatedProperties as never],
    ["residents", "/residents/datatable", residents.getPaginatedResidents as never],
    ["rounds", "/rounds/datatable", rounds.getPaginatedRounds as never],
    ["routes", "/recurring/datatable", routes.getPaginatedRoutes as never],
    ["shift", "/shift-handover/datatable", shift.getPaginatedShiftHandovers as never],
    ["uniform", "/uniform/datatable", uniform.getPaginatedUniformChecks as never],
    ["users", "/users/datatable", users.getPaginatedUsers as never],
  ];

  it.each(cases)("%s", async (_n, path, call) => {
    stub("post", path, { success: true, data: { rows: [{ id: 1 }], total: 4 } });
    expect(await call({} as never)).toEqual({ data: [{ id: 1 }], total: 4 });
    stub("post", path, { success: true, data: {} });
    expect(await call({} as never)).toEqual({ data: [], total: 0 });
    stub("post", path, { success: false });
    expect(await call({} as never)).toEqual({ data: [], total: 0 });
  });

  it("kardex lee data.data en lugar de rows", async () => {
    stub("post", "/kardex/datatable", { success: true, data: { data: [{ id: 1 }], total: 2 } });
    expect(await kardex.getPaginatedKardex({} as never)).toEqual({ data: [{ id: 1 }], total: 2 });
    stub("post", "/kardex/datatable", { success: true, data: {} });
    expect(await kardex.getPaginatedKardex({} as never)).toEqual({ data: [], total: 0 });
    stub("post", "/kardex/datatable", { success: false });
    expect(await kardex.getPaginatedKardex({} as never)).toEqual({ data: [], total: 0 });
  });
});

describe("residents.uploadResidentImage", () => {
  const file = new File(["x"], "a.png");
  it("devuelve la url", async () => {
    mockTransport(() => ({ data: { success: true, data: { url: "http://img" } } }));
    expect(await residents.uploadResidentImage(file)).toBe("http://img");
  });
  it("devuelve null sin url", async () => {
    mockTransport(() => ({ data: { success: false } }));
    expect(await residents.uploadResidentImage(file)).toBeNull();
  });
});
