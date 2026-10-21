import { ITBadget, ITButton, ITCard, ITDataTable, ITDialog, ITFlex, ITGrid, ITPage, ITProgress, ITText } from "@axzydev/axzy_ui_system";
import { useCallback, useState } from "react";
import {
  FaBrush, FaCut, FaEye, FaHandPeace, FaHatCowboy, FaHeadphones, FaLink,
  FaMale, FaPen, FaPlus, FaShoePrints, FaSprayCan, FaTshirt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getPaginatedUniformChecks } from "../services/UniformService";

const CHECKLIST_ITEMS: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "pantalon", label: "Pantalón", icon: FaMale },
  { key: "botas", label: "Botas", icon: FaShoePrints },
  { key: "cinturon", label: "Cinturón", icon: FaLink },
  { key: "camisa", label: "Camisa", icon: FaTshirt },
  { key: "pluma", label: "Pluma", icon: FaPen },
  { key: "gorra", label: "Gorra (solo recorrido)", icon: FaHatCowboy },
  { key: "unas", label: "Aseo: uñas", icon: FaHandPeace },
  { key: "orejas", label: "Aseo: orejas", icon: FaHeadphones },
  { key: "desodorante", label: "Aseo: desodorante / pulcro", icon: FaSprayCan },
  { key: "afeitado", label: "Afeitado", icon: FaCut },
  { key: "peinado", label: "Peinado", icon: FaBrush },
];

const UNIFORM_FIELDS = CHECKLIST_ITEMS.map((i) => i.key);

const complianceScore = (row: any) => {
  const ok = UNIFORM_FIELDS.filter((field) => row[field]).length;
  return { ok, total: UNIFORM_FIELDS.length };
};

const UniformPage = () => {
  const navigate = useNavigate();
  const memoizedFetch = useCallback((params: any) => getPaginatedUniformChecks(params), []);
  const [detail, setDetail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const score = detail ? complianceScore(detail) : { ok: 0, total: UNIFORM_FIELDS.length };
  const pct = Math.round((score.ok / score.total) * 100);

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      title="Uniforme"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Personal" }, { label: "Uniforme" }]}
      description="Checklist de uniformidad y aseo por elemento."
      icon={<FaTshirt size={20} />}
      iconColor="#065911"
      actions={
        <ITButton onClick={() => navigate("/uniform/nuevo")} color="primary" size="md">
          <ITFlex align="center" gap={2}>Nuevo checklist<FaPlus /></ITFlex>
        </ITButton>
      }
    >
      <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
        <ITDataTable
          defaultItemsPerPage={50}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          showViewToggle={false}
          virtualized
          virtualizedMaxHeight={400}
          rowHeight={50}
          fetchData={memoizedFetch as any}
          columns={[
            {
              key: "createdAt",
              label: "FECHA",
              type: "string",
              sortable: false,
              render: (row: any) => (
                <ITText as="span" className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {new Date(row.createdAt).toLocaleDateString("es-MX")}
                </ITText>
              ),
            },
            {
              key: "guard",
              label: "GUARDIA",
              type: "string",
              render: (row: any) => (
                <ITFlex align="center" gap={2}>
                  <ITFlex align="center" justify="center" className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-black text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                    {(row.guard?.name || "?").charAt(0)}{(row.guard?.lastName || "").charAt(0)}
                  </ITFlex>
                  <ITText as="span" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {row.guard?.name} {row.guard?.lastName}
                  </ITText>
                </ITFlex>
              ),
            },
            {
              key: "evaluatedBy",
              label: "EVALUADO POR",
              type: "string",
              render: (row: any) => (
                <ITText as="span" className="text-xs text-slate-500">
                  {row.evaluatedBy?.name} {row.evaluatedBy?.lastName}
                </ITText>
              ),
            },
            {
              key: "score",
              label: "CUMPLIMIENTO",
              type: "string",
              render: (row: any) => {
                const { ok, total } = complianceScore(row);
                const color = ok === total ? "success" : ok >= total * 0.7 ? "primary" : "danger";
                return <ITBadget label={`${ok}/${total}`} color={color} variant="filled" />;
              },
            },
            {
              key: "notes",
              label: "NOTAS",
              type: "string",
              render: (row: any) => (
                <ITText as="span" className="line-clamp-1 text-xs text-slate-400">{row.notes || "—"}</ITText>
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              actions: (row: any) => (
                <ITButton
                  onClick={() => { setDetail(row); setDetailOpen(true); }}
                  size="md"
                  color="primary"
                  variant="icon-only"
                  icon={<FaEye />}
                  ariaLabel="Ver detalles"
                  title="Ver detalles"
                />
              ),
            },
          ]}
        />
      </ITFlex>

      <ITDialog isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de uniforme" className="w-[760px] max-w-[95vw]">
        {detail && (
          <ITFlex direction="column" gap={4}>
            <ITCard className="rounded-2xl border-0! bg-emerald-50/60! shadow-none!" contentClassName="p-4!">
              <ITFlex align="center" justify="between" gap={3} wrap="wrap">
                <ITFlex align="center" gap={3}>
                  <ITFlex align="center" justify="center" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#065911] text-sm font-black text-white">
                    {(detail.guard?.name || "?").charAt(0)}{(detail.guard?.lastName || "").charAt(0)}
                  </ITFlex>
                  <ITFlex direction="column">
                    <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-emerald-700/70">Guardia evaluado</ITText>
                    <ITText as="p" className="text-lg font-black text-emerald-950 dark:text-emerald-100">{detail.guard?.name} {detail.guard?.lastName}</ITText>
                    <ITText as="p" className="text-[11px] text-emerald-700/70 capitalize">
                      {new Date(detail.createdAt).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </ITText>
                  </ITFlex>
                </ITFlex>
                <ITFlex direction="column" align="end" gap={1}>
                  <ITBadget color={pct >= 70 ? "success" : "warning"} variant="filled" size="sm">{pct >= 70 ? "Cumple" : "No cumple"}</ITBadget>
                  <ITText as="p" className="text-2xl font-black text-emerald-900 dark:text-emerald-200">{pct}%</ITText>
                  <ITText as="p" className="text-[10px] text-emerald-700/70">{score.ok}/{score.total} puntos</ITText>
                </ITFlex>
              </ITFlex>
              <ITProgress value={score.ok} max={score.total} color={pct >= 70 ? "success" : "warning"} size="sm" className="mt-3" />
            </ITCard>

            <ITCard className="rounded-2xl border-0! bg-white! shadow-none!" contentClassName="p-4!">
              <ITFlex align="center" gap={2} className="mb-3">
                <ITFlex align="center" justify="center" className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 dark:bg-slate-800"><FaEye size={12} /></ITFlex>
                <ITText as="p" className="text-xs font-black text-slate-800 dark:text-slate-100">Checklist de uniforme</ITText>
                <ITText as="span" className="ml-auto text-[10px] font-semibold text-slate-400">Evaluó: {detail.evaluatedBy?.name} {detail.evaluatedBy?.lastName}</ITText>
              </ITFlex>
              <ITGrid container columns={12} spacing={2}>
                {CHECKLIST_ITEMS.map((item) => {
                  const ok = !!detail[item.key];
                  return (
                    <ITGrid item xs={12} sm={6} key={item.key}>
                      <ITFlex align="center" gap={2} className={`rounded-xl border p-2.5 ${ok ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/60"}`}>
                        <item.icon className={ok ? "text-emerald-600" : "text-amber-500"} />
                        <ITText as="span" className={`min-w-0 flex-1 text-xs font-semibold ${ok ? "text-emerald-900" : "text-amber-900"}`}>{item.label}</ITText>
                        <ITBadget color={ok ? "success" : "warning"} variant="filled" size="sm">{ok ? "Sí" : "No"}</ITBadget>
                      </ITFlex>
                    </ITGrid>
                  );
                })}
              </ITGrid>
            </ITCard>

            {detail.notes && (
              <ITCard className="rounded-2xl border-0! bg-amber-50! shadow-none!" contentClassName="p-4!">
                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-amber-700">Notas</ITText>
                <ITText as="p" className="mt-1 text-xs text-amber-800">{detail.notes}</ITText>
              </ITCard>
            )}
          </ITFlex>
        )}
      </ITDialog>
    </ITPage>
  );
};

export default UniformPage;
