import { ITAlert, ITButton, ITCard, ITDataTable, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { FaBullhorn, FaPlus, FaSync } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useCan } from "@app/core/permissions/useCan";
import { P } from "@app/core/permissions/permissions.constants";
import { getPropertiesList, Property } from "@modules/properties/service/properties.service";
import { AnnouncementDialog } from "../components/AnnouncementDialog";
import { Announcement, getAnnouncements } from "../services/announcements.service";

const AUDIENCE_LABELS: Record<string, string> = {
  ALL: "Todos",
  PROPERTY: "Propiedad",
  ROLE: "Rol",
};

const AnnouncementsPage = () => {
  const dispatch = useDispatch();
  const can = useCan();
  const canManage = can(P.ANNOUNCEMENT_MANAGE);
  const [properties, setProperties] = useState<Property[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getPropertiesList()
      .then((res) => {
        if (res.success && res.data) setProperties(res.data);
      })
      .catch(() => setProperties([]));
  }, []);

  const fetchData = useCallback(async (params: { page: number; limit: number }) => {
    try {
      const result = await getAnnouncements({ page: params.page, pageSize: params.limit });
      setLoadError(null);
      return { data: result.items, total: result.total };
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudieron cargar los avisos");
      return { data: [], total: 0 };
    }
  }, [refreshKey]);

  const columns = [
    {
      key: "title",
      label: "Aviso",
      render: (row: Announcement) => (
        <ITFlex direction="column" className="min-w-0">
          <ITText className="truncate font-semibold!">{row.title}</ITText>
          <ITText as="p" muted className="truncate text-[11px]">{row.body}</ITText>
        </ITFlex>
      ),
    },
    {
      key: "audience",
      label: "Destinatarios",
      render: (row: Announcement) => (
        <ITText>
          {AUDIENCE_LABELS[row.audience]}
          {row.audience === "PROPERTY" && row.property ? ` · ${row.property.identifier}` : ""}
          {row.audience === "ROLE" && row.roleName ? ` · ${row.roleName}` : ""}
        </ITText>
      ),
    },
    {
      key: "sentAt",
      label: "Enviado",
      render: (row: Announcement) => <ITText muted>{dayjs(row.sentAt).format("DD/MM/YYYY HH:mm")}</ITText>,
    },
    {
      key: "recipients",
      label: "Lecturas",
      render: (row: Announcement) => (
        <ITText muted>
          {row.readCount}/{row.recipients}
        </ITText>
      ),
    },
  ];

  return (
    <ITPage
      noPadding
      className="m-0! px-4! max-w-screen!"
      title="Avisos"
      description="Comunicados y notificaciones para residentes"
      icon={<FaBullhorn />}
      actions={
        <ITFlex gap={2}>
          <ITButton variant="outline" icon={<FaSync />} label="Refrescar" ariaLabel="Refrescar avisos" onClick={() => setRefreshKey((k) => k + 1)} />
          {canManage && (
            <ITButton icon={<FaPlus />} label="Nuevo aviso" onClick={() => setDialogOpen(true)} />
          )}
        </ITFlex>
      }
    >
      <ITFlex direction="column" gap={4} className="py-4">
        {loadError && <ITAlert variant="error" title="No se pudieron cargar los avisos">{loadError}</ITAlert>}
        <ITCard contentClassName="p-0!">
          <ITDataTable
            key={refreshKey}
            fetchData={fetchData as any}
            columns={columns as any}
            defaultItemsPerPage={20}
            itemsPerPageOptions={[20, 50]}
            density="compact"
            rowHeight={58}
          />
        </ITCard>
      </ITFlex>

      <AnnouncementDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        properties={properties}
        onSent={() => {
          setDialogOpen(false);
          setRefreshKey((k) => k + 1);
          dispatch(showToast({ message: "Aviso enviado", type: "success" }));
        }}
      />
    </ITPage>
  );
};

export default AnnouncementsPage;
