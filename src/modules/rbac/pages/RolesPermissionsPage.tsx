import { useEffect, useMemo, useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITCheckbox,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITPage,
  ITSegmentedControl,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaChevronDown,
  FaChevronRight,
  FaLayerGroup,
  FaLock,
  FaSave,
  FaSearch,
  FaSync,
  FaShieldAlt,
  FaUndoAlt,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { buildNavigationItems } from "@app/core/constants/navbar.constants";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  getRbacMatrix,
  RbacMatrix,
  RbacPermission,
  updateRolePermissions,
} from "../services/rbac.service";

const ROLE_SHORT: Record<string, string> = {
  ADMIN: "Admin",
  SHIFT: "Jefe",
  GUARD: "Guardia",
  MAINT: "Maint.",
  RESDN: "Residente",
};

const ROLE_ORDER = ["ADMIN", "SHIFT", "GUARD", "MAINT", "RESDN"];

const RESOURCE_LABELS: Record<string, string> = {
  round: "Rondas",
  assignment: "Asignaciones",
  assignments: "Asignaciones",
  kardex: "Kardex",
  incident: "Incidencias",
  incidents: "Incidencias",
  maintenance: "Mantenimiento",
  club: "Casa Club",
  location: "Ubicaciones",
  locations: "Ubicaciones",
  recurring: "Rutas recurrentes",
  access: "Accesos y caseta",
  chat: "Chat",
  dashboard: "Dashboard",
  "shift-handover": "Entrega de turno",
  uniform: "Uniforme",
  catalogs: "Catálogos",
  schedules: "Horarios",
  users: "Usuarios y guardias",
  properties: "Propiedades",
  residents: "Residentes",
  documents: "Documentos",
  settings: "Ajustes",
  occupancy: "Ocupación",
};

const resourceOf = (code: string) => code.split(".")[0] ?? "otros";
const resourceLabel = (key: string) => RESOURCE_LABELS[key] ?? key;

const sortRoles = <T extends { name: string }>(roles: T[] = []): T[] =>
  [...roles].sort((a, b) => {
    const ia = ROLE_ORDER.indexOf(a.name);
    const ib = ROLE_ORDER.indexOf(b.name);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

const sameSet = (a: Set<string>, b: string[]) =>
  a.size === b.length && b.every((code) => a.has(code));

type Draft = Record<string, Set<string>>;

const buildDraft = (matrix: RbacMatrix): Draft =>
  Object.fromEntries(
    matrix.roles.map((role) => [role.name, new Set(role.permissions)]),
  );

const RolesPermissionsPage = () => {
  const dispatch = useDispatch();
  const [matrix, setMatrix] = useState<RbacMatrix | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");
  const [focusRole, setFocusRole] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRbacMatrix();
      if (!res.success || !res.data || !Array.isArray(res.data.roles)) {
        setError(res.messages?.[0] ?? "No se pudo cargar la matriz de permisos");
        return;
      }
      setMatrix(res.data);
      setDraft(buildDraft(res.data));
    } catch {
      setError("No se pudo cargar la matriz de permisos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roles = useMemo(() => sortRoles(matrix?.roles), [matrix]);
  const roleNames = useMemo(() => roles.map((role) => role.name), [roles]);

  const changedRoles = useMemo(
    () =>
      roles
        .filter((role) => draft[role.name] && !sameSet(draft[role.name], role.permissions))
        .map((role) => role.name),
    [roles, draft],
  );

  const dirty = changedRoles.length > 0;

  const previewRole = focusRole ?? roles[0]?.name ?? "ADMIN";
  const previewItems = useMemo(() => {
    const has = (permission?: string | string[]) => {
      if (!permission) return true;
      const codes = Array.isArray(permission) ? permission : [permission];
      return codes.some((code) => draft[previewRole]?.has(code));
    };
    return buildNavigationItems(has);
  }, [draft, previewRole]);

  const groups = useMemo(() => {
    const search = query.trim().toLowerCase();
    const map = new Map<string, RbacPermission[]>();

    for (const permission of matrix?.permissions ?? []) {
      if (search) {
        const haystack = `${permission.code} ${permission.description} ${resourceLabel(resourceOf(permission.code))}`.toLowerCase();
        if (!haystack.includes(search)) continue;
      }

      if (mode === "diff") {
        const values = roleNames.map((role) => draft[role]?.has(permission.code) ?? false);
        const unique = new Set(values);
        if (unique.size === 1) continue;
      }

      const key = resourceOf(permission.code);
      const list = map.get(key) ?? [];
      list.push(permission);
      map.set(key, list);
    }

    return [...map.entries()].sort((a, b) =>
      resourceLabel(a[0]).localeCompare(resourceLabel(b[0])),
    );
  }, [matrix, query, mode, roleNames, draft]);

  const toggle = (role: string, code: string, checked: boolean) => {
    if (role === "ADMIN" && code === "users.manage") return;
    setDraft((prev) => {
      const next = { ...prev };
      const set = new Set(next[role] ?? []);
      if (checked) set.add(code);
      else set.delete(code);
      next[role] = set;
      return next;
    });
  };

  const toggleGroup = (role: string, permissions: RbacPermission[], checked: boolean) => {
    setDraft((prev) => {
      const next = { ...prev };
      const set = new Set(next[role] ?? []);
      for (const permission of permissions) {
        if (role === "ADMIN" && permission.code === "users.manage") continue;
        if (checked) set.add(permission.code);
        else set.delete(permission.code);
      }
      next[role] = set;
      return next;
    });
  };

  const groupState = (role: string, permissions: RbacPermission[]) => {
    const total = permissions.length;
    const active = permissions.filter((p) => draft[role]?.has(p.code)).length;
    const all = active === total;
    return { active, total, all, some: active > 0 && !all };
  };

  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      for (const roleName of changedRoles) {
        const res = await updateRolePermissions(roleName, [...(draft[roleName] ?? [])]);
        if (!res.success) {
          dispatch(
            showToast({
              message: res.messages?.[0] ?? `No se pudo guardar ${roleName}`,
              type: "error",
              position: "top-right",
            }),
          );
          return;
        }
      }
      await load();
      dispatch(
        showToast({
          message:
            changedRoles.length === 1
              ? "Permisos actualizados"
              : `${changedRoles.length} roles actualizados`,
          type: "success",
          position: "top-right",
        }),
      );
    } catch {
      dispatch(
        showToast({
          message: "No se pudo guardar la matriz",
          type: "error",
          position: "top-right",
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (matrix) setDraft(buildDraft(matrix));
  };

  if (loading) {
    return (
      <ITFlex align="center" justify="center" className="h-[70vh]">
        <ITLoader size="lg" />
      </ITFlex>
    );
  }

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50 mb-8"
      noPadding
      title="Roles y permisos"
      description="Compara y edita la matriz RBAC de los 5 roles."
      icon={<FaShieldAlt size={20} />}
      actions={
        <ITFlex align="center" gap={2}>
          <ITButton
            variant="outlined"
            color="secondary"
            size="md"
            onClick={discard}
            disabled={!dirty || saving}
          >
            <ITFlex align="center" gap={2}>
              <FaUndoAlt /> Descartar
            </ITFlex>
          </ITButton>
          <ITButton
            variant="solid"
            color="primary"
            size="md"
            onClick={() => void save()}
            disabled={!dirty || saving}
          >
            <ITFlex align="center" gap={2}>
              <FaSave /> {saving ? "Guardando..." : "Guardar cambios"}
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      {error ? (
        <ITAlert variant="error" title="Error al cargar" className="mb-4">
          {error}
        </ITAlert>
      ) : null}

      <ITGrid container columns={12} spacing={4}>
      <ITGrid item xs={12} xl={9}>
      <ITCard className="mt-0" contentClassName="p-0!">
        <ITFlex
          align="center"
          gap={2}
          wrap="wrap"
          className="border-b border-slate-100 bg-slate-50/70 px-4 py-2"
        >
          <ITText as="span" className="mr-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Resumen
          </ITText>
          {roles.map((role) => (
            <ITButton
              key={role.name}
              size="sm"
              variant={focusRole === role.name ? "solid" : "ghost"}
              color={focusRole === role.name ? "primary" : "secondary"}
              onClick={() => setFocusRole(focusRole === role.name ? null : role.name)}
            >
              <ITFlex align="center" gap={2}>
                <ITText as="span" className="text-[11px] font-bold">
                  {ROLE_SHORT[role.name] ?? role.name}
                </ITText>
                <ITBadget
                  size="sm"
                  variant="filled"
                  color={focusRole === role.name ? "primary" : "secondary"}
                >
                  {draft[role.name]?.size ?? 0}
                </ITBadget>
              </ITFlex>
            </ITButton>
          ))}
        </ITFlex>

        <ITFlex
          align="center"
          justify="between"
          gap={3}
          wrap="wrap"
          className="border-b border-slate-100 px-4 py-3"
        >
          <ITFlex align="center" gap={3} wrap="wrap">
            <ITInput
              name="rbac-search"
              placeholder="Buscar permiso o módulo..."
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              iconLeft={<FaSearch />}
              size="sm"
              className="w-[260px]"
            />
            <ITSegmentedControl
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { label: "Todos", value: "all" },
                { label: "Solo diferencias", value: "diff" },
              ]}
            />
          </ITFlex>

          <ITFlex align="center" gap={2}>
            {dirty ? (
              <ITBadget color="warning" variant="filled" size="sm">
                {changedRoles.length} rol(es) con cambios
              </ITBadget>
            ) : (
              <ITBadget color="success" variant="outlined" size="sm">
                Sin cambios
              </ITBadget>
            )}
            {focusRole ? (
              <ITButton size="sm" variant="ghost" onClick={() => setFocusRole(null)}>
                Quitar foco: {ROLE_SHORT[focusRole] ?? focusRole}
              </ITButton>
            ) : null}
            <ITButton
              size="sm"
              variant="outlined"
              color="secondary"
              onClick={() => void load()}
              disabled={saving || dirty}
            >
              <ITFlex align="center" gap={2}>
                <FaSync /> Actualizar
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>

        <ITFlex className="max-h-[70vh] overflow-auto">
          <ITFlex
            direction="column"
            className="min-w-[980px]"
            style={{ minWidth: 980 }}
          >
            {/* Header */}
            <ITFlex
              className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50"
              style={{ display: "grid", gridTemplateColumns: "minmax(360px,1fr) repeat(5, 104px)" }}
            >
              <ITFlex
                align="center"
                gap={2}
                className="sticky left-0 z-30 bg-slate-50 px-4 py-3"
              >
                <FaLayerGroup className="text-slate-400" />
                <ITText as="span" className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Permiso
                </ITText>
              </ITFlex>
              {roles.map((role) => (
                <ITFlex
                  key={role.name}
                  direction="column"
                  align="center"
                  justify="center"
                  className={`cursor-pointer border-l border-slate-100 px-1 py-2 ${focusRole === role.name ? "bg-emerald-50" : ""
                    }`}
                  onClick={() => setFocusRole(focusRole === role.name ? null : role.name)}
                >
                  <ITText as="span" className="text-[10px] font-black uppercase tracking-wide text-slate-600">
                    {ROLE_SHORT[role.name] ?? role.name}
                  </ITText>
                  <ITText as="span" className="text-[10px] font-bold text-slate-400">
                    {draft[role.name]?.size ?? 0}
                  </ITText>
                </ITFlex>
              ))}
            </ITFlex>

            {/* Groups */}
            {groups.length === 0 ? (
              <ITFlex align="center" justify="center" className="px-6 py-12">
                <ITText as="p" className="text-sm text-slate-400">
                  No hay permisos que coincidan con el filtro.
                </ITText>
              </ITFlex>
            ) : (
              groups.map(([resource, permissions]) => {
                const isCollapsed = collapsed.has(resource);
                return (
                  <ITFlex key={resource} direction="column">
                    <ITFlex
                      align="center"
                      className="border-b border-slate-100 bg-white"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(360px,1fr) repeat(5, 104px)",
                      }}
                    >
                      <ITFlex align="center" className="px-4 py-2">
                        <ITButton
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setCollapsed((prev) => {
                              const next = new Set(prev);
                              if (next.has(resource)) next.delete(resource);
                              else next.add(resource);
                              return next;
                            })
                          }
                        >
                          <ITFlex align="center" gap={2}>
                            {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
                            <ITText as="span" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                              {resourceLabel(resource)}
                            </ITText>
                            <ITBadget size="sm" variant="filled" color="secondary">
                              {permissions.length}
                            </ITBadget>
                          </ITFlex>
                        </ITButton>
                      </ITFlex>

                      {roles.map((role) => {
                        const state = groupState(role.name, permissions);
                        return (
                          <ITFlex
                            key={role.name}
                            align="center"
                            justify="center"
                            className="border-l border-slate-100"
                          >
                            <ITCheckbox
                              checked={state.all}
                              indeterminate={state.some}
                              label={<span className="sr-only">{role.name}</span>}
                              onChange={(checked) => toggleGroup(role.name, permissions, checked)}
                            />
                          </ITFlex>
                        );
                      })}
                    </ITFlex>

                    {!isCollapsed &&
                      permissions.map((permission) => {
                        const locked = permission.code === "users.manage";
                        return (
                          <ITFlex
                            key={permission.code}
                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                            style={{
                              display: "grid",
                              gridTemplateColumns: "minmax(360px,1fr) repeat(5, 104px)",
                            }}
                          >
                            <ITFlex
                              direction="column"
                              gap={1}
                              className="sticky left-0 z-10 bg-white px-4 py-3"
                            >
                              <ITFlex align="center" gap={2} wrap="wrap">
                                <ITText as="p" className="text-sm font-semibold text-slate-800">
                                  {permission.description}
                                </ITText>
                                {locked ? (
                                  <ITBadget size="sm" variant="outlined" color="warning">
                                    <ITFlex align="center" gap={1}>
                                      <FaLock /> Protegido
                                    </ITFlex>
                                  </ITBadget>
                                ) : null}
                              </ITFlex>
                              <ITText as="code" className="font-mono text-[10px] text-slate-400">
                                {permission.code}
                              </ITText>
                            </ITFlex>

                            {roles.map((role) => {
                              const isLocked = role.name === "ADMIN" && locked;
                              const active = focusRole === role.name;
                              return (
                                <ITFlex
                                  key={role.name}
                                  align="center"
                                  justify="center"
                                  className={`border-l border-slate-100 ${active ? "bg-emerald-50/60" : ""
                                    }`}
                                >
                                  <ITCheckbox
                                    checked={draft[role.name]?.has(permission.code) ?? false}
                                    disabled={isLocked}
                                    label={<span className="sr-only">{role.name}</span>}
                                    onChange={(checked) =>
                                      toggle(role.name, permission.code, checked)
                                    }
                                  />
                                </ITFlex>
                              );
                            })}
                          </ITFlex>
                        );
                      })}
                  </ITFlex>
                );
              })
            )}
          </ITFlex>
        </ITFlex>
      </ITCard>
      </ITGrid>

      <ITGrid item xs={12} xl={3}>
      <ITFlex direction="column" gap={4} className="self-start xl:sticky xl:top-4">
        <ITCard
          title="Menú lateral"
          headerActions={
            <ITBadget size="sm" variant="filled" color="success">
              {ROLE_SHORT[previewRole] ?? previewRole}
            </ITBadget>
          }
          contentClassName="p-3"
        >
          <ITText as="p" className="text-[10px] text-slate-400">
            Así verá la navegación este rol. Se actualiza con los checkboxes del borrador.
          </ITText>

          <ITFlex direction="column" gap={1} className="mt-3">
            {previewItems.length === 0 ? (
              <ITText as="p" className="text-xs text-slate-400">
                Sin accesos laterales.
              </ITText>
            ) : (
              previewItems.map((item) => (
                <ITFlex key={item.id} direction="column" gap={1}>
                  <ITFlex
                    align="center"
                    gap={2}
                    className="rounded-lg px-2 py-1.5 text-slate-600"
                  >
                    <ITText as="span" className="text-xs text-slate-400">
                      {item.icon}
                    </ITText>
                    <ITText as="span" className="text-xs font-bold">
                      {item.label}
                    </ITText>
                  </ITFlex>

                  {item.subitems?.map((group) => (
                    <ITFlex
                      key={group.id}
                      direction="column"
                      gap={1}
                      className="ml-4 border-l border-slate-100 pl-3"
                    >
                      <ITText as="p" className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {group.label}
                      </ITText>
                      {group.items.map((leaf) => (
                        <ITFlex key={leaf.id} align="center" gap={2} className="px-1 py-1">
                          <ITText as="span" className="h-1 w-1 rounded-full bg-slate-300" />
                          <ITText as="span" className="text-[11px] font-medium text-slate-600">
                            {leaf.label}
                          </ITText>
                        </ITFlex>
                      ))}
                    </ITFlex>
                  ))}
                </ITFlex>
              ))
            )}
          </ITFlex>

          {dirty ? (
            <ITText as="p" className="mt-3 text-[10px] font-semibold text-amber-600">
              Preview con cambios sin guardar.
            </ITText>
          ) : null}
        </ITCard>
      </ITFlex>
      </ITGrid>
      </ITGrid>

      <ITText as="p" className="mt-2 text-[10px] text-slate-400">
        Clic en un rol para resaltar su columna. Cada celda se guarda por rol.
      </ITText>
    </ITPage>
  );
};

export default RolesPermissionsPage;
