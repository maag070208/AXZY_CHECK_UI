/**
 * Espejo de la semilla de permisos del API. Se usa SOLO como respaldo síncrono
 * antes de que llegue `GET /users/me/permissions` (tests y primer render).
 * En runtime manda la base de datos.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    "assignments.manage","access.check","accesspin.validate","catalogs.manage","chat.use","club.manage","dashboard.view",
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
    "vehicle.view","vehicle.manage","invitation.manage","invitation.approve",
    "client.view","client.manage","guard.assign",
  ],
  SHIFT: [
    "access.check","accesspin.validate","assignments.manage","properties.view","chat.use","club.manage","dashboard.view",
    "incidents.manage","kardex.manage","locations.manage","recurring.manage","recurring.operate",
    "shift-handover.manage","uniform.manage","users.read","round.view","round.start","round.end","round.scan",
    "assignment.view","kardex.view","kardex.delete",
    "incident.view","incident.create","incident.resolve","incident.delete",
    "maintenance.view","maintenance.create",
    "club.view","club.create","club.resolve","club.delete",
    "complaint.view","complaint.manage",
    "delinquency.view","access.event.view","announcement.view","vehicle.view",
    "invitation.manage","invitation.approve",
  ],
  GUARD: [
    "access.check","accesspin.validate","invitation.manage","chat.use","recurring.operate",
    "round.view","round.start","round.end","round.scan",
    "assignment.view","incident.create","incident.view","maintenance.create","maintenance.view",
    "club.view","club.create",
  ],
  MAINT: [
    "client.view",
    "chat.use","maintenance.manage","recurring.operate","round.view","round.start","round.end","round.scan",
    "assignment.view","incident.create","maintenance.view","maintenance.create","maintenance.resolve","maintenance.delete",
    "club.view","club.create","club.resolve","club.delete",
  ],
  /**
   * Administrador del cliente (residencial / plaza / maquila). Su alcance lo
   * fija el token: no elige cliente y no administra la organización (sin
   * usuarios, roles, clientes ni plantilla de guardias). Espejo de la semilla
   * del API (`permission-matrix.ts`).
   */
  CLIENT: [
    "dashboard.view","documents.view","properties.view","properties.manage","occupancy.change",
    "residents.manage","complaint.view","complaint.manage",
    "charge.view","charge.manage","payment.view","payment.manage",
    "delinquency.view","delinquency.manage","access.event.view",
    "announcement.view","announcement.manage","vehicle.view","vehicle.manage",
    "invitation.manage",
    "incident.view","incident.resolve","maintenance.view","maintenance.resolve",
    "club.view","club.resolve","round.view","kardex.view","assignment.view",
  ],
  RESDN: [
    "resident.self","invitation.view","invitation.create","invitation.revoke",
    "complaint.create","complaint.view","charge.view","payment.view","vehicle.self","accesspin.manage",
    "invitation.approve",
  ],
};
