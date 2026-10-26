/**
 * Espejo de la semilla de permisos del API. Se usa SOLO como respaldo síncrono
 * antes de que llegue `GET /users/me/permissions` (tests y primer render).
 * En runtime manda la base de datos.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    "assignments.manage","access.check","catalogs.manage","chat.use","club.manage","dashboard.view",
    "documents.view","incidents.manage","kardex.manage","locations.manage","maintenance.manage",
    "occupancy.change","properties.manage","properties.view","recurring.manage","recurring.operate",
    "residents.manage","schedules.manage","settings.manage","shift-handover.manage","uniform.manage",
    "users.manage","users.read","round.view","round.start","round.end","round.scan",
    "assignment.view","kardex.view","kardex.delete",
    "incident.view","incident.create","incident.resolve","incident.delete",
    "maintenance.view","maintenance.create","maintenance.resolve","maintenance.delete",
    "club.view","club.create","club.resolve","club.delete",
    "complaint.view","complaint.manage",
    "charge.view","charge.manage","payment.view","payment.manage",
    "delinquency.view","delinquency.manage","access.event.view",
    "announcement.view","announcement.manage",
    "vehicle.view","vehicle.manage",
  ],
  SHIFT: [
    "access.check","assignments.manage","properties.view","chat.use","club.manage","dashboard.view",
    "incidents.manage","kardex.manage","locations.manage","recurring.manage","recurring.operate",
    "shift-handover.manage","uniform.manage","users.read","round.view","round.start","round.end","round.scan",
    "assignment.view","kardex.view","kardex.delete",
    "incident.view","incident.create","incident.resolve","incident.delete",
    "maintenance.view","maintenance.create",
    "club.view","club.create","club.resolve","club.delete",
    "complaint.view","complaint.manage",
    "delinquency.view","access.event.view","announcement.view","vehicle.view",
  ],
  GUARD: [
    "access.check","chat.use","recurring.operate",
    "round.view","round.start","round.end","round.scan",
    "assignment.view","incident.create","maintenance.create","club.view","club.create",
  ],
  MAINT: [
    "chat.use","maintenance.manage","recurring.operate",
    "round.view","round.start","round.end","round.scan",
    "assignment.view","incident.create",
    "maintenance.view","maintenance.create","maintenance.resolve","maintenance.delete",
    "club.view","club.create","club.resolve","club.delete",
  ],
  RESDN: [
    "resident.self", "invitation.view", "invitation.create", "invitation.revoke",
    "complaint.create", "complaint.view", "charge.view", "payment.view", "vehicle.self",
  ],
};
