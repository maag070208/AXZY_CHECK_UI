export const translateScanType = (type: string): string => {
  const translations: Record<string, string> = {
    ASSIGNMENT: "Asignada",
    RECURRING: "Ronda",
    FREE: "Libre",
  };
  return translations[type] || type;
};
