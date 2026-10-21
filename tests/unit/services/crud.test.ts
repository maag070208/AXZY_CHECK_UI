import { describe, expect, it } from "vitest";
import * as auth from "@app/modules/auth/services/AuthService";
import * as catAdmin from "@app/modules/catalogs/services/CatalogAdminService";
import * as catGeneric from "@app/modules/catalogs/services/GenericCatalogService";
import * as chat from "@app/modules/chat/services/ChatService";
import * as dashboard from "@app/modules/dashboard/services/DashboardService";
import * as guards from "@app/modules/guards/service/guards.service";
import * as report from "@app/modules/home/services/ReportService";
import * as invitations from "@app/modules/invitations/services/invitations.service";
import * as kardex from "@app/modules/kardex/services/KardexService";
import * as locations from "@app/modules/locations/service/locations.service";
import * as properties from "@app/modules/properties/service/properties.service";
import * as residents from "@app/modules/residents/services/residents.service";
import * as rounds from "@app/modules/rounds/services/RoundsService";
import * as routes from "@app/modules/routes/services/RoutesService";
import * as shift from "@app/modules/shift-handover/services/ShiftHandoverService";
import * as uniform from "@app/modules/uniform/services/UniformService";
import * as users from "@app/modules/users/services/UserService";
import { stub } from "../../helpers/api";

type Case = [name: string, call: () => Promise<unknown>, method: "get" | "post" | "put" | "patch" | "delete", path: string, search?: string, body?: unknown];

const cases: Case[] = [
  ["auth.login", () => auth.login({ username: "a", password: "b" } as never), "post", "/users/login", "", { username: "a", password: "b" }],
  ["auth.register", () => auth.register({ a: 1 } as never), "post", "/users", "", { a: 1 }],

  ["catAdmin.getCategories", () => catAdmin.getCategories(), "get", "/catalog-admin/categories", ""],
  ["catAdmin.getCategories(type)", () => catAdmin.getCategories("INCIDENT"), "get", "/catalog-admin/categories", "?type=INCIDENT"],
  ["catAdmin.createCategory", () => catAdmin.createCategory({ name: "n" } as never), "post", "/catalog-admin/categories", "", { name: "n" }],
  ["catAdmin.updateCategory", () => catAdmin.updateCategory(4, { name: "n" } as never), "put", "/catalog-admin/categories/4", "", { name: "n" }],
  ["catAdmin.deleteCategory", () => catAdmin.deleteCategory(4), "delete", "/catalog-admin/categories/4"],
  ["catAdmin.reorderCategories", () => catAdmin.reorderCategories([2, 1]), "put", "/catalog-admin/categories/reorder", "", { ids: [2, 1] }],
  ["catAdmin.getTypes", () => catAdmin.getTypes(3), "get", "/catalog-admin/types", "?categoryId=3"],
  ["catAdmin.createType", () => catAdmin.createType({ name: "n" } as never), "post", "/catalog-admin/types", "", { name: "n" }],
  ["catAdmin.updateType", () => catAdmin.updateType(5, { name: "n" } as never), "put", "/catalog-admin/types/5", "", { name: "n" }],
  ["catAdmin.deleteType", () => catAdmin.deleteType(5), "delete", "/catalog-admin/types/5"],
  ["catAdmin.reorderTypes", () => catAdmin.reorderTypes([1, 2]), "put", "/catalog-admin/types/reorder", "", { ids: [1, 2] }],

  ["catGeneric.list", () => catGeneric.listGenericCatalog("x" as never), "get", "/catalogs/x", "?all=true"],
  ["catGeneric.create", () => catGeneric.createGenericCatalogItem("x" as never, { name: "n", value: "v" }), "post", "/catalogs/x", "", { name: "n", value: "v" }],
  ["catGeneric.update", () => catGeneric.updateGenericCatalogItem("x" as never, 2, { active: false }), "put", "/catalogs/x/2", "", { active: false }],
  ["catGeneric.delete", () => catGeneric.deleteGenericCatalogItem("x" as never, 2), "delete", "/catalogs/x/2"],

  ["chat.getMessages", () => chat.getMessages(), "get", "/chat/messages", "?limit=30"],
  ["chat.getMessages(cursor)", () => chat.getMessages(9, 5), "get", "/chat/messages", "?cursor=9&limit=5"],
  ["chat.sendMessage", () => chat.sendMessage("hola"), "post", "/chat/messages", "", { message: "hola" }],
  ["chat.getRealtimeToken", () => chat.getRealtimeToken(), "get", "/realtime/token"],

  ["dashboard.getLiveDashboard", () => dashboard.getLiveDashboard(), "get", "/dashboard/live"],
  ["dashboard.getRealtimeToken", () => dashboard.getRealtimeToken(), "get", "/realtime/token"],

  ["guards.createAssignment", () => guards.createAssignment({ guardId: 1 } as never), "post", "/assignments", "", { guardId: 1 }],
  ["guards.getActiveAssignments", () => guards.getActiveAssignments(3), "get", "/assignments", "?guardId=3"],
  ["guards.getAllAssignmentsByGuard", () => guards.getAllAssignmentsByGuard(3), "get", "/assignments/all", "?guardId=3"],
  ["guards.updateAssignmentStatus", () => guards.updateAssignmentStatus(8, "DONE"), "patch", "/assignments/8/status", "", { status: "DONE" }],

  ["report.getGuardStats", () => report.getGuardStats({ a: "1" } as never), "get", "/reports/guards/stats", "?a=1"],
  ["report.getTopPerformance", () => report.getTopPerformance({ a: "1" } as never), "get", "/reports/guards/top-performance", "?a=1"],
  ["report.getDistribution", () => report.getDistribution({ a: "1" } as never), "get", "/reports/guards/distribution", "?a=1"],
  ["report.getDetailedReport", () => report.getDetailedReport({ a: "1" } as never), "get", "/reports/guards/detail", "?a=1"],
  ["report.getGuardDetailBreakdown", () => report.getGuardDetailBreakdown(6, { a: "1" } as never), "get", "/reports/guards/detail-breakdown/6", "?a=1"],
  ["report.getWorkloadComparison", () => report.getWorkloadComparison({ a: "1" } as never), "get", "/reports/guards/workload", "?a=1"],

  ["kardex.getKardex()", () => kardex.getKardex({}), "get", "/kardex", ""],
  ["kardex.getKardex(filtros)", () => kardex.getKardex({ userId: 1, locationId: 2, startDate: "a", endDate: "b" } as never), "get", "/kardex", "?userId=1&locationId=2&startDate=a&endDate=b"],
  ["kardex.deleteKardexEntry", () => kardex.deleteKardexEntry(3), "delete", "/kardex/3"],
  ["kardex.deleteKardexMedia", () => kardex.deleteKardexMedia(3, "k"), "delete", "/kardex/3/media", "?key=k"],

  ["locations.getLocations", () => locations.getLocations(), "get", "/locations"],
  ["locations.createLocation", () => locations.createLocation({ aisle: "a", spot: "s", number: "1" }), "post", "/locations", "", { aisle: "a", spot: "s", number: "1" }],
  ["locations.updateLocation", () => locations.updateLocation(2, { aisle: "a", spot: "s", number: "1", name: "n" }), "put", "/locations/2", "", { aisle: "a", spot: "s", number: "1", name: "n" }],
  ["locations.deleteLocation", () => locations.deleteLocation(2), "delete", "/locations/2"],

  ["properties.getPropertiesList", () => properties.getPropertiesList(), "get", "/properties"],
  ["properties.createProperty", () => properties.createProperty({ a: 1 }), "post", "/properties", "", { a: 1 }],
  ["properties.updateProperty", () => properties.updateProperty(2, { a: 1 }), "put", "/properties/2", "", { a: 1 }],
  ["properties.deleteProperty", () => properties.deleteProperty(2), "delete", "/properties/2"],
  ["properties.getPropertyById", () => properties.getPropertyById(2), "get", "/properties/2"],
  ["properties.getPropertyTypes", () => properties.getPropertyTypes(), "get", "/catalog/property_type"],

  ["residents.getResidentsList", () => residents.getResidentsList(), "get", "/residents"],
  ["residents.createResident", () => residents.createResident({ a: 1 }), "post", "/residents", "", { a: 1 }],
  ["residents.updateResident", () => residents.updateResident(2, { a: 1 }), "put", "/residents/2", "", { a: 1 }],
  ["residents.deleteResident", () => residents.deleteResident(2), "delete", "/residents/2"],
  ["residents.getResidentById", () => residents.getResidentById(2), "get", "/residents/2"],
  ["residents.getResidentContacts", () => residents.getResidentContacts(2), "get", "/residents/2/contacts"],
  ["residents.createResidentContact", () => residents.createResidentContact(2, { a: 1 }), "post", "/residents/2/contacts", "", { a: 1 }],
  ["residents.updateResidentContact", () => residents.updateResidentContact(7, { a: 1 }), "put", "/residents/contacts/7", "", { a: 1 }],
  ["residents.deleteResidentContact", () => residents.deleteResidentContact(7), "delete", "/residents/contacts/7"],

  ["rounds.getRounds()", () => rounds.getRounds(), "get", "/rounds", ""],
  ["rounds.getRounds(fecha, guardia)", () => rounds.getRounds("2026-01-01", 4), "get", "/rounds", "?date=2026-01-01&guardId=4"],
  ["rounds.getRoundDetail", () => rounds.getRoundDetail(4), "get", "/rounds/4"],
  ["rounds.startRound", () => rounds.startRound(4), "post", "/rounds/start", "", { guardId: 4 }],
  ["rounds.endRound", () => rounds.endRound(4), "put", "/rounds/4/end", "", {}],

  ["routes.getRoutesList", () => routes.getRoutesList(), "get", "/recurring"],
  ["routes.createRoute", () => routes.createRoute({ a: 1 } as never), "post", "/recurring", "", { a: 1 }],
  ["routes.updateRoute", () => routes.updateRoute(3, { a: 1 } as never), "put", "/recurring/3", "", { a: 1 }],
  ["routes.deleteRoute", () => routes.deleteRoute(3), "delete", "/recurring/3"],
  ["routes.assignGuardToRoute", () => routes.assignGuardToRoute(3, [1, 2]), "post", "/recurring/3/assign", "", { guardIds: [1, 2] }],

  ["shift.createShiftHandover", () => shift.createShiftHandover({ a: 1 } as never), "post", "/shift-handover", "", { a: 1 }],
  ["shift.getShiftHandoverDetail", () => shift.getShiftHandoverDetail(3), "get", "/shift-handover/3"],
  ["uniform.createUniformCheck", () => uniform.createUniformCheck({ a: 1 } as never), "post", "/uniform", "", { a: 1 }],

  ["users.getUsers", () => users.getUsers(), "get", "/users"],
  ["users.createUser", () => users.createUser({ a: 1 } as never), "post", "/users", "", { a: 1 }],
  ["users.updateUser", () => users.updateUser(3, { a: 1 } as never), "put", "/users/3", "", { a: 1 }],
  ["users.changePassword", () => users.changePassword(3, { oldPassword: "a", newPassword: "b" } as never), "put", "/users/3/password", "", { oldPassword: "a", newPassword: "b" }],
  ["users.resetPassword", () => users.resetPassword(3, "nueva"), "put", "/users/3/reset-password", "", { newPassword: "nueva" }],
  ["users.deleteUser", () => users.deleteUser(3), "delete", "/users/3"],

  ["invitations.createInvitation", () => invitations.createInvitation({ a: 1 }), "post", "/invitations", "", { a: 1 }],
  ["invitations.updateInvitationStatus", () => invitations.updateInvitationStatus(3, "OK"), "put", "/invitations/3/status", "", { status: "OK" }],
  ["invitations.updateInvitationStatus(motivo)", () => invitations.updateInvitationStatus(3, "NO", "porque"), "put", "/invitations/3/status", "", { status: "NO", reason: "porque" }],
];

describe("servicios: método, ruta y cuerpo", () => {
  it.each(cases)("%s", async (_n, call, method, path, search = "", body) => {
    const seen = stub(method, path, { success: true, data: "ok" });
    await call();
    expect(seen.method).toBe(method.toUpperCase());
    expect(seen.path).toBe(path);
    expect(seen.search).toBe(search);
    if (body !== undefined) expect(seen.body).toEqual(body);
  });
});

describe("guards.getGuardsDataTable", () => {
  it("agrega filters vacíos si no vienen y pega a /users/datatable", async () => {
    const seen = stub("post", "/users/datatable", { success: true, data: { rows: [], total: 0 } });
    await guards.getGuardsDataTable({ pageIndex: 0 } as never);
    expect(seen.body).toEqual({ pageIndex: 0, filters: {} });
  });

  it("respeta filters existentes", async () => {
    const seen = stub("post", "/users/datatable", { success: true, data: { rows: [], total: 0 } });
    await guards.getGuardsDataTable({ pageIndex: 0, filters: { role: "GUARD" } } as never);
    expect(seen.body).toEqual({ pageIndex: 0, filters: { role: "GUARD" } });
  });
});

describe("invitations: errores devuelven respuesta segura", () => {
  const fail = (path: string, method: "post" | "put", body: unknown) => stub(method, path, body, 500);

  it("getPaginatedInvitations mapea rows/total", async () => {
    stub("post", "/invitations/datatable", { success: true, data: { rows: [1], total: 1 } });
    expect(await invitations.getPaginatedInvitations({})).toEqual({ data: [1], total: 1, success: true });
  });

  it("getPaginatedInvitations en error", async () => {
    fail("/invitations/datatable", "post", { messages: ["x"] });
    expect(await invitations.getPaginatedInvitations({})).toEqual({ success: false, data: null, messages: ["x"] });
    fail("/invitations/datatable", "post", {});
    expect((await invitations.getPaginatedInvitations({})).messages).toEqual(["Error fetching invitations data"]);
  });

  it("createInvitation en error", async () => {
    fail("/invitations", "post", { messages: ["x"] });
    expect(await invitations.createInvitation({})).toEqual({ success: false, data: null, messages: ["x"] });
    fail("/invitations", "post", {});
    expect((await invitations.createInvitation({})).messages).toEqual(["Error creating invitation"]);
  });

  it("updateInvitationStatus en error", async () => {
    fail("/invitations/1/status", "put", { messages: ["x"] });
    expect(await invitations.updateInvitationStatus(1, "A")).toEqual({ success: false, data: null, messages: ["x"] });
    fail("/invitations/1/status", "put", {});
    expect((await invitations.updateInvitationStatus(1, "A")).messages).toEqual(["Error updating status"]);
  });
});
