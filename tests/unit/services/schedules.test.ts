import { describe, expect, it } from "vitest";
import * as svc from "@app/modules/schedules/SchedulesService";
import { stub } from "../../helpers/api";

describe("SchedulesService", () => {
  it("getSchedules devuelve la lista o [] si no hay data", async () => {
    stub("get", "/schedules", { success: true, data: [{ id: 1 }] });
    expect(await svc.getSchedules()).toEqual([{ id: 1 }]);
    stub("get", "/schedules", { success: true });
    expect(await svc.getSchedules()).toEqual([]);
  });

  it("getPaginatedSchedules mapea, rellena faltantes y tolera fallo", async () => {
    stub("post", "/schedules/datatable", { success: true, data: { rows: [{ id: 1 }], total: 1 } });
    expect(await svc.getPaginatedSchedules({})).toEqual({ data: [{ id: 1 }], total: 1 });
    stub("post", "/schedules/datatable", { success: true, data: {} });
    expect(await svc.getPaginatedSchedules({})).toEqual({ data: [], total: 0 });
    stub("post", "/schedules/datatable", { success: false });
    expect(await svc.getPaginatedSchedules({})).toEqual({ data: [], total: 0 });
  });

  it("create / update / delete devuelven data", async () => {
    const c = stub("post", "/schedules", { success: true, data: { id: 3 } });
    expect(await svc.createSchedule({ name: "x" })).toEqual({ id: 3 });
    expect(c.body).toEqual({ name: "x" });
    const u = stub("put", "/schedules/3", { success: true, data: { id: 3 } });
    expect(await svc.updateSchedule(3, { name: "y" })).toEqual({ id: 3 });
    expect(u.body).toEqual({ name: "y" });
    stub("delete", "/schedules/3", { success: true, data: true });
    expect(await svc.deleteSchedule(3)).toBe(true);
  });
});
