import { ITAlert, ITButton, ITCard, ITChip, ITDataTable, ITFlex, ITInput, ITPage, ITSegmentedControl, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useState } from "react";
import { FaCar, FaCheck, FaSync, FaTimes } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useCan } from "@app/core/permissions/useCan";
import { P } from "@app/core/permissions/permissions.constants";
import { ApproveVehicleDialog } from "../components/ApproveVehicleDialog";
import { getVehicles, rejectVehicle, VehicleRow, VehicleStatus } from "../services/vehicles.service";

const STATUS_OPTIONS: { value: VehicleStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "APPROVED", label: "Aprobados" },
  { value: "REJECTED", label: "Rechazados" },
];

const STATUS_LABEL: Record<VehicleStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  INACTIVE: "Inactivo",
};

const VehiclesPage = () => {
  const dispatch = useDispatch();
  const canManage = useCan()(P.VEHICLE_MANAGE);
  const [status, setStatus] = useState<VehicleStatus | "ALL">("PENDING");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [approving, setApproving] = useState<VehicleRow | null>(null);

  const fetchData = useCallback(
    async (params: { page: number; limit: number }) => {
      try {
        const result = await getVehicles({
          page: params.page,
          pageSize: params.limit,
          ...(status !== "ALL" ? { status } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        });
        setLoadError(null);
        return { data: result.items, total: result.total };
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "No se pudo cargar el padrón");
        return { data: [], total: 0 };
      }
    },
    [status, search],
  );

  const reject = async (vehicle: VehicleRow) => {
    try {
      await rejectVehicle(vehicle.id);
      setRefreshKey((key) => key + 1);
      dispatch(showToast({ message: "Vehículo rechazado", type: "success" }));
    } catch (error) {
      dispatch(showToast({ message: error instanceof Error ? error.message : "No se pudo rechazar", type: "error" }));
    }
  };

  const columns = [
    {
      key: "plate",
      label: "Vehículo",
      render: (row: VehicleRow) => (
        <ITFlex direction="column">
          <ITText className="font-semibold!">{row.plate}</ITText>
          <ITText as="p" muted className="text-[11px]">{[row.brand, row.model, row.color].filter(Boolean).join(" · ") || "Sin datos"}</ITText>
        </ITFlex>
      ),
    },
    {
      key: "owner",
      label: "Propietario",
      render: (row: VehicleRow) => <ITText>{row.owner ? `${row.owner.name} ${row.owner.lastName ?? ""}`.trim() : "—"}</ITText>,
    },
    {
      key: "property",
      label: "Propiedad",
      render: (row: VehicleRow) => <ITText>{row.property?.identifier ?? "—"}</ITText>,
    },
    {
      key: "tagCode",
      label: "Tag",
      render: (row: VehicleRow) => <ITText muted>{row.tagCode ?? "—"}</ITText>,
    },
    {
      key: "status",
      label: "Estado",
      render: (row: VehicleRow) => <ITChip label={STATUS_LABEL[row.status]} />,
    },
    {
      key: "createdAt",
      label: "Alta",
      render: (row: VehicleRow) => <ITText muted>{dayjs(row.createdAt).format("DD/MM/YYYY")}</ITText>,
    },
    ...(canManage
      ? [
          {
            key: "actions",
            label: "",
            render: (row: VehicleRow) => (
              <ITFlex gap={1} justify="end">
                {row.status !== "APPROVED" && (
                  <ITButton size="sm" variant="text" icon={<FaCheck />} ariaLabel={`Aprobar ${row.plate}`} onClick={() => setApproving(row)} />
                )}
                {row.status === "PENDING" && (
                  <ITButton size="sm" variant="text" color="danger" icon={<FaTimes />} ariaLabel={`Rechazar ${row.plate}`} onClick={() => void reject(row)} />
                )}
              </ITFlex>
            ),
          },
        ]
      : []),
  ];

  return (
    <ITPage
      noPadding
      className="m-0! px-4! max-w-screen!"
      title="Vehículos"
      description="Padrón, tags y aprobación de vehículos"
      icon={<FaCar />}
      actions={
        <ITButton variant="outline" icon={<FaSync />} label="Refrescar" ariaLabel="Refrescar vehículos" onClick={() => setRefreshKey((key) => key + 1)} />
      }
    >
      <ITFlex direction="column" gap={4} className="py-4">
        <ITCard contentClassName="p-4!">
          <ITFlex direction="column" gap={3}>
            <ITSegmentedControl options={STATUS_OPTIONS} value={status} onChange={(value) => setStatus(value as VehicleStatus | "ALL")} />
            <ITInput name="search" label="Buscar" placeholder="Placa, tag o propietario…" value={search} onChange={(event) => setSearch(event.target.value)} />
          </ITFlex>
        </ITCard>

        {loadError && <ITAlert variant="error" title="No se pudo cargar el padrón">{loadError}</ITAlert>}
        <ITCard contentClassName="p-0!">
          <ITDataTable
            key={`${status}-${search}-${refreshKey}`}
            fetchData={fetchData as any}
            columns={columns as any}
            defaultItemsPerPage={20}
            itemsPerPageOptions={[20, 50]}
            density="compact"
            rowHeight={56}
          />
        </ITCard>
      </ITFlex>

      <ApproveVehicleDialog
        vehicle={approving}
        isOpen={!!approving}
        onClose={() => setApproving(null)}
        onApproved={() => {
          setApproving(null);
          setRefreshKey((key) => key + 1);
          dispatch(showToast({ message: "Vehículo aprobado", type: "success" }));
        }}
      />
    </ITPage>
  );
};

export default VehiclesPage;
