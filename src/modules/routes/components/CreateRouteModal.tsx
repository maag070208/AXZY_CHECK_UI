import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITAvatar,
  ITBadget,
  ITButton,
  ITCard,
  ITDialog,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaCheck, FaMinus, FaPlus, FaPrint, FaRoute, FaTrash, FaUserShield } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getLocations, Location } from "../../locations/service/locations.service";
import { getUsers, User } from "../../users/services/UserService";
import { printLocationQRs } from "@core/utils/printLocationQRs";
import { createRoute, ILocationCreate, updateRoute } from "../services/RoutesService";

interface CreateRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editConfig?: any;
}

const AVATAR_COLORS = ["#047857", "#0284c7", "#4f46e5", "#d97706", "#e11d48", "#0d9488"];

export const CreateRouteModal = ({ isOpen, onClose, onSuccess, editConfig }: CreateRouteModalProps) => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");
  const [addedLocations, setAddedLocations] = useState<ILocationCreate[]>([]);
  const [selectedGuards, setSelectedGuards] = useState<number[]>([]);

  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [allGuards, setAllGuards] = useState<User[]>([]);

  const [selectedLocId, setSelectedLocId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchInitialData();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && editConfig) {
      setTitle(editConfig.title);
      const mapped = editConfig.recurringLocations.map((rl: any) => ({
        locationId: rl.location.id,
        locationName: rl.location.name,
        tasks: rl.tasks.map((t: any) => ({
          description: t.description,
          reqPhoto: t.reqPhoto,
        })),
      }));
      setAddedLocations(mapped);
      setSelectedGuards(editConfig.guards ? editConfig.guards.map((g: any) => g.id) : []);
    } else if (isOpen) {
      setTitle("");
      setAddedLocations([]);
      if (allGuards.length > 0) setSelectedGuards(allGuards.map((g) => g.id));
    }
  }, [isOpen, editConfig, allGuards]);

  const fetchInitialData = async () => {
    const [locRes, usersRes] = await Promise.all([getLocations(), getUsers()]);

    if (locRes.success && locRes.data) setAllLocations(locRes.data);

    if (usersRes.success && usersRes.data) {
      const guards = usersRes.data.filter((u) => {
        const roleName = typeof u.role === "object" ? u.role.name : u.role;
        return (roleName === "GUARD" || roleName === "SHIFT" || roleName === "MAINT") && u.active;
      });
      setAllGuards(guards);
      if (!editConfig) setSelectedGuards(guards.map((g) => g.id));
    }
  };

  const handleAddLocation = () => {
    // El selector solo ofrece ubicaciones aún no agregadas y el botón está deshabilitado sin selección.
    const locIdNum = Number(selectedLocId);
    const locObj = allLocations.find((l) => l.id === locIdNum)!;
    setAddedLocations([
      ...addedLocations,
      { locationId: locIdNum, locationName: locObj.name, tasks: [] },
    ]);
    setSelectedLocId("");
  };

  const handleRemoveLocation = (index: number) => {
    const copy = [...addedLocations];
    copy.splice(index, 1);
    setAddedLocations(copy);
  };

  const handleAddTask = (locIndex: number) => {
    const copy = [...addedLocations];
    copy[locIndex].tasks.push({ description: "", reqPhoto: false });
    setAddedLocations(copy);
  };

  const handleRemoveTask = (locIndex: number, taskIndex: number) => {
    const copy = [...addedLocations];
    copy[locIndex].tasks.splice(taskIndex, 1);
    setAddedLocations(copy);
  };

  const handleTaskChange = (locIndex: number, taskIndex: number, val: string) => {
    const copy = [...addedLocations];
    copy[locIndex].tasks[taskIndex].description = val;
    setAddedLocations(copy);
  };

  const handlePrintQRs = async () => {
    try {
      await printLocationQRs(
        addedLocations.map((l) => ({ id: l.locationId, name: l.locationName! })),
        title.trim() || undefined,
      );
    } catch {
      dispatch(showToast({ message: "No se pudieron generar los QR", type: "error" }));
    }
  };

  const toggleGuard = (guardId: number) => {
    if (selectedGuards.includes(guardId)) {
      setSelectedGuards(selectedGuards.filter((id) => id !== guardId));
    } else {
      setSelectedGuards([...selectedGuards, guardId]);
    }
  };

  const toggleAllGuards = () => {
    if (selectedGuards.length === allGuards.length) setSelectedGuards([]);
    else setSelectedGuards(allGuards.map((g) => g.id));
  };

  const handleSave = async () => {
    // El botón "Guardar" solo se habilita con nombre y al menos una ubicación (canSave).
    setLoading(true);
    try {
      const payload = { title, locations: addedLocations, guardIds: selectedGuards };
      const res = editConfig ? await updateRoute(editConfig.id, payload) : await createRoute(payload);
      if (res.success) {
        dispatch(showToast({ message: "Guardado correctamente", type: "success" }));
        onSuccess();
        onClose();
      } else {
        dispatch(showToast({ message: "Error al guardar: " + (res.messages?.join(", ") || ""), type: "error" }));
      }
    } catch {
      dispatch(showToast({ message: "Error de conexión", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  const availableLocations = allLocations.filter((l) => !addedLocations.find((al) => al.locationId === l.id));
  const canSave = !loading && !!title.trim() && addedLocations.length > 0;

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} fullScreen padded={false}>
      <ITFlex direction="column" className="h-full min-h-0 bg-slate-50 dark:bg-slate-950">
        <ITFlex align="center" justify="between" gap={3} className="bg-white px-6 py-4 shadow-sm dark:bg-slate-900">
          <ITFlex align="center" gap={3}>
            <ITButton
              variant="icon-only"
              color="secondary"
              size="md"
              icon={<FaArrowLeft />}
              ariaLabel="Volver"
              title="Volver"
              onClick={onClose}
            />
            <ITFlex direction="column">
              <ITText as="h2" className="text-xl font-black text-slate-900 dark:text-white">
                {editConfig ? "Ajustar ruta" : "Nueva ruta"}
              </ITText>
              <ITText as="p" className="text-[11px] text-slate-500">
                Configura el personal y los puntos de control del recorrido.
              </ITText>
            </ITFlex>
          </ITFlex>

          <ITFlex align="center" gap={2} className="pr-8">
            <ITBadget color="success" variant="filled" size="sm">
              {selectedGuards.length} guardias
            </ITBadget>
            <ITBadget color="primary" variant="filled" size="sm">
              {addedLocations.length} puntos
            </ITBadget>
          </ITFlex>
        </ITFlex>

        <ITFlex direction="column" className="flex-1 min-h-0 w-full overflow-y-auto p-6 lg:overflow-hidden">
          <ITGrid container columns={12} spacing={5} className="h-auto min-h-0 w-full lg:h-full">
            <ITGrid item xs={12} lg={4} className="h-auto min-h-0 lg:h-full">
              <ITCard className="h-auto min-h-0 border-0! bg-white! shadow-none! lg:h-full" contentClassName="flex h-full min-h-0 flex-col gap-4 p-5!">
                <ITFlex align="center" gap={3}>
                  <ITFlex align="center" justify="center" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <FaUserShield size={14} />
                  </ITFlex>
                  <ITFlex direction="column">
                    <ITText as="h3" className="text-lg font-black text-slate-900 dark:text-white">
                      Nombre y personal
                    </ITText>
                    <ITText as="p" className="text-[11px] text-slate-500">
                      Define el nombre y quiénes recorren la ruta.
                    </ITText>
                  </ITFlex>
                </ITFlex>

                <ITInput
                  name="title"
                  label="Nombre de la ruta"
                  placeholder="Ej: Ronda perimetral nocturna"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => {}}
                />

                <ITFlex direction="column" className="flex-1 min-h-0">
                  <ITFlex align="center" justify="between" className="mb-2">
                    <ITFlex direction="column">
                      <ITText as="h4" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Personal
                      </ITText>
                      <ITText as="p" className="text-[11px] text-slate-400">
                        {selectedGuards.length} de {allGuards.length} asignados
                      </ITText>
                    </ITFlex>
                    <ITButton variant="text" color="primary" size="sm" onClick={toggleAllGuards}>
                      {selectedGuards.length === allGuards.length ? "Limpiar" : "Marcar todos"}
                    </ITButton>
                  </ITFlex>

                  <ITFlex direction="column" gap={1} className="flex-1 min-h-0 overflow-y-auto pr-1">
                    {allGuards.map((guard) => {
                      const on = selectedGuards.includes(guard.id);
                      return (
                        <ITCard
                          key={guard.id}
                          onClick={() => toggleGuard(guard.id)}
                          className={`shrink-0 rounded-xl border-0! shadow-none! ${
                            on ? "bg-emerald-50!" : "bg-slate-50/60!"
                          }`}
                          contentClassName="p-2!"
                        >
                          <ITFlex align="center" gap={2}>
                            <ITAvatar
                              initials={`${guard.name[0]}${guard.lastName?.[0] || ""}`}
                              size="xs"
                              color={on ? AVATAR_COLORS[guard.id % AVATAR_COLORS.length] : "#cbd5e1"}
                            />
                            <ITText as="span" className={`flex-1 min-w-0 truncate text-[13px] font-semibold ${on ? "text-slate-800 dark:text-slate-100" : "text-slate-500"}`}>
                              {guard.name} {guard.lastName}
                            </ITText>
                            <ITFlex
                              align="center"
                              justify="center"
                              className={`h-4 w-4 shrink-0 rounded ${
                                on ? "bg-[#065911] text-white" : "bg-white text-transparent dark:bg-slate-800"
                              }`}
                            >
                              {on && <FaCheck size={8} />}
                            </ITFlex>
                          </ITFlex>
                        </ITCard>
                      );
                    })}
                  </ITFlex>
                </ITFlex>
              </ITCard>
            </ITGrid>

            <ITGrid item xs={12} lg={8} className="h-auto min-h-0 lg:h-full">
              <ITCard className="h-auto min-h-0 border-0! bg-white! shadow-none! lg:h-full" contentClassName="flex h-full min-h-0 flex-col gap-3 p-5!">
                <ITFlex align="center" justify="between" gap={3}>
                  <ITFlex align="center" gap={3}>
                    <ITFlex align="center" justify="center" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
                      <FaRoute size={14} />
                    </ITFlex>
                    <ITFlex direction="column">
                      <ITText as="h3" className="text-lg font-black text-slate-900 dark:text-white">
                        Puntos de control
                      </ITText>
                      <ITText as="p" className="text-[11px] text-slate-500">
                        {addedLocations.length} {addedLocations.length === 1 ? "punto" : "puntos"} en el recorrido
                      </ITText>
                    </ITFlex>
                  </ITFlex>
                  <ITButton
                    variant="outlined"
                    color="secondary"
                    size="sm"
                    icon={<FaPrint />}
                    onClick={handlePrintQRs}
                    disabled={addedLocations.length === 0}
                  >
                    Imprimir QRs
                  </ITButton>
                </ITFlex>

                <ITFlex align="center" gap={2}>
                  <ITFlex className="flex-1 min-w-0">
                    <ITSearchSelect
                      placeholder="Busca una ubicación para agregarla..."
                      noResultsMessage="No hay ubicaciones disponibles"
                      value={selectedLocId}
                      onChange={(val) => setSelectedLocId(String(val))}
                      options={availableLocations.map((l) => ({
                        label: `${l.name} (${l.aisle}-${l.number})`,
                        value: String(l.id),
                      }))}
                    />
                  </ITFlex>
                  <ITButton onClick={handleAddLocation} disabled={!selectedLocId} color="primary" size="md" icon={<FaPlus />}>
                    Añadir
                  </ITButton>
                </ITFlex>

                <ITFlex direction="column" gap={2} className="flex-1 min-h-0 overflow-y-auto pr-1">
                  {addedLocations.map((loc, idx) => (
                    <ITCard
                      key={loc.locationId}
                      className="shrink-0 rounded-2xl border-0! bg-slate-50/40! shadow-none!"
                      contentClassName="p-3!"
                    >
                      <ITFlex align="center" gap={3}>
                        <ITText as="span" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-black text-[#065911] dark:bg-emerald-950/30 dark:text-emerald-400">
                          {idx + 1}
                        </ITText>
                        <ITFlex direction="column" className="min-w-0 flex-1">
                          <ITText as="h4" className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                            {loc.locationName}
                          </ITText>
                          <ITText as="p" className="text-[11px] text-slate-400">
                            {loc.tasks.length === 0
                              ? "Sin consignas"
                              : `${loc.tasks.length} ${loc.tasks.length === 1 ? "consigna" : "consignas"}`}
                          </ITText>
                        </ITFlex>
                        <ITButton variant="text" color="primary" size="sm" icon={<FaPlus />} onClick={() => handleAddTask(idx)}>
                          Consigna
                        </ITButton>
                        <ITButton
                          variant="icon-only"
                          color="danger"
                          size="sm"
                          icon={<FaTrash size={12} />}
                          ariaLabel={`Quitar ${loc.locationName}`}
                          title={`Quitar ${loc.locationName}`}
                          onClick={() => handleRemoveLocation(idx)}
                        />
                      </ITFlex>

                      {loc.tasks.length > 0 && (
                        <ITFlex direction="column" gap={2} className="mt-3">
                          {loc.tasks.map((task, tIdx) => (
                            <ITFlex key={tIdx} align="center" gap={2}>
                              <ITFlex className="flex-1 min-w-0">
                                <ITInput
                                  name={`task-${idx}-${tIdx}`}
                                  placeholder="Instrucción para el guardia..."
                                  value={task.description}
                                  onChange={(e) => handleTaskChange(idx, tIdx, e.target.value)}
                                  onBlur={() => {}}
                                />
                              </ITFlex>
                              <ITButton
                                variant="icon-only"
                                color="danger"
                                size="sm"
                                icon={<FaMinus size={11} />}
                                ariaLabel="Quitar consigna"
                                title="Quitar consigna"
                                onClick={() => handleRemoveTask(idx, tIdx)}
                              />
                            </ITFlex>
                          ))}
                        </ITFlex>
                      )}
                    </ITCard>
                  ))}

                  {addedLocations.length === 0 && (
                    <ITEmptyState
                      icon={<FaRoute />}
                      title="Ruta vacía"
                      description="Busca y agrega los puntos de control que forman este recorrido."
                      className="py-10"
                    />
                  )}
                </ITFlex>
              </ITCard>
            </ITGrid>
          </ITGrid>
        </ITFlex>

        <ITFlex align="center" justify="end" gap={2} className="bg-white px-6 py-4 shadow-sm dark:bg-slate-900">
          <ITButton onClick={onClose} variant="outlined" color="secondary">
            Descartar
          </ITButton>
          <ITButton onClick={handleSave} color="primary" disabled={!canSave}>
            {loading ? "Guardando..." : editConfig ? "Guardar cambios" : "Crear ruta"}
          </ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
