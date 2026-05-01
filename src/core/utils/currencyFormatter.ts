export const formatCurrency = ( value: any) => {
    if(typeof value !== 'number') return 0;
    return value.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
    })
};


export const formatCurrencyMX = (value: number) => {
  return value.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
};
 