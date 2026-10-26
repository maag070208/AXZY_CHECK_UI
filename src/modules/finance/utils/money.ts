const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const money = (value: number) => formatter.format(Number.isFinite(value) ? value : 0);
