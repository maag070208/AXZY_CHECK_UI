import { ITAlert, ITButton, ITCard, ITChip, ITDataTable, ITFlex, ITPage, ITSegmentedControl, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useState } from "react";
import { FaCommentDots, FaSync } from "react-icons/fa";
import ComplaintDetailDialog from "../components/ComplaintDetailDialog";
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_STATUS_LABELS,
  ComplaintListItem,
  ComplaintStatus,
  getComplaints,
} from "../services/ComplaintService";

type StatusFilter = ComplaintStatus | "ALL";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "NEW", label: COMPLAINT_STATUS_LABELS.NEW },
  { value: "IN_REVIEW", label: COMPLAINT_STATUS_LABELS.IN_REVIEW },
  { value: "WAITING_RESIDENT", label: COMPLAINT_STATUS_LABELS.WAITING_RESIDENT },
  { value: "RESOLVED", label: COMPLAINT_STATUS_LABELS.RESOLVED },
  { value: "CLOSED", label: COMPLAINT_STATUS_LABELS.CLOSED },
];

const ComplaintsPage = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (params: { page: number; limit: number }) => {
      try {
        const result = await getComplaints({
          page: params.page,
          pageSize: params.limit,
          ...(statusFilter !== "ALL" && { status: statusFilter }),
        });
        setLoadError(null);
        return result;
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "No se pudieron cargar las quejas");
        return { data: [], total: 0 };
      }
    },
    [statusFilter],
  );

  const columns = [
    {
      key: "title",
      label: "Asunto",
      render: (row: ComplaintListItem) => <ITText className="font-semibold!">{row.title}</ITText>,
    },
    {
      key: "category",
      label: "Categoría",
      render: (row: ComplaintListItem) => <ITText>{COMPLAINT_CATEGORY_LABELS[row.category]}</ITText>,
    },
    {
      key: "author",
      label: "Residente",
      render: (row: ComplaintListItem) => (
        <ITText>{row.author ? `${row.author.name} ${row.author.lastName ?? ""}`.trim() : "—"}</ITText>
      ),
    },
    {
      key: "createdAt",
      label: "Fecha",
      render: (row: ComplaintListItem) => <ITText muted>{dayjs(row.createdAt).format("DD/MM/YYYY HH:mm")}</ITText>,
    },
    {
      key: "status",
      label: "Estado",
      render: (row: ComplaintListItem) => <ITChip label={COMPLAINT_STATUS_LABELS[row.status]} />,
    },
  ];

  return (
    <ITPage
      noPadding
      className="m-0! px-4! max-w-screen!"
      title="Buzón de quejas"
      description="Quejas y sugerencias de los residentes"
      icon={<FaCommentDots />}
      actions={
        <ITButton
          variant="outline"
          icon={<FaSync />}
          label="Refrescar"
          ariaLabel="Refrescar quejas"
          onClick={() => setRefreshKey((k) => k + 1)}
        />
      }
    >
      <ITFlex direction="column" gap={4} className="py-4">
        <ITCard contentClassName="p-4!">
          <ITSegmentedControl
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
          />
        </ITCard>

        {loadError && <ITAlert variant="error" title="No se pudieron cargar las quejas">{loadError}</ITAlert>}

        <ITCard contentClassName="p-0!">
          <ITDataTable
            key={`${statusFilter}-${refreshKey}`}
            fetchData={fetchData as any}
            columns={columns as any}
            defaultItemsPerPage={25}
            itemsPerPageOptions={[25, 50]}
            density="compact"
            rowHeight={50}
            onRowClick={(row: ComplaintListItem) => setSelectedId(row.id)}
          />
        </ITCard>
      </ITFlex>

      {selectedId !== null && (
        <ComplaintDetailDialog
          complaintId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </ITPage>
  );
};

export default ComplaintsPage;
