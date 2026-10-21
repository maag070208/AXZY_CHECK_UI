import { ITBadget, ITCard, ITFlex, ITSegmentedControl, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { GENERIC_CATALOGS, GenericCatalogKey, listGenericCatalog } from "../services/GenericCatalogService";
import { GenericCatalogTable } from "./GenericCatalogTable";

export const GenericCatalogCards = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeKey, setActiveKey] = useState<GenericCatalogKey>("property-types");
  const [version, setVersion] = useState(0);
  const active = GENERIC_CATALOGS.find((c) => c.key === activeKey) ?? GENERIC_CATALOGS[0];

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      GENERIC_CATALOGS.map(async (catalog) => {
        try {
          const res = await listGenericCatalog(catalog.key);
          return [catalog.key, (res.data ?? []).length] as const;
        } catch {
          return [catalog.key, 0] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) setCounts(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
  }, [version]);

  return (
    <ITCard className="mt-5 rounded-3xl" contentClassName="space-y-4 p-5!">
      <ITFlex align="center" justify="between" gap={2} wrap="wrap">
        <ITFlex direction="column">
          <ITText as="h2" className="text-base font-black text-slate-900 dark:text-white">Otros catálogos</ITText>
          <ITText as="p" className="text-xs text-slate-500">Selecciona un catálogo y administra sus valores.</ITText>
        </ITFlex>
        <ITBadget color="secondary" variant="filled" size="sm">{GENERIC_CATALOGS.length} catálogos</ITBadget>
      </ITFlex>

      <ITSegmentedControl
        size="sm"
        options={GENERIC_CATALOGS.map((catalog) => ({
          value: catalog.key,
          label: `${catalog.label} (${counts[catalog.key] ?? 0})`,
        }))}
        value={activeKey}
        onChange={(value) => setActiveKey(value as GenericCatalogKey)}
      />

      <GenericCatalogTable
        key={active.key}
        catalogKey={active.key}
        label={active.label}
        onChanged={() => setVersion((v) => v + 1)}
      />
    </ITCard>
  );
};
