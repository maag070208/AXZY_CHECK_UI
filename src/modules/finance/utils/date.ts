/** Fecha de solo día (vencimientos y pagos) sin corrimiento por zona horaria. */
export const formatDateOnly = (value?: string | null) => {
  if (!value) return "—";
  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};
