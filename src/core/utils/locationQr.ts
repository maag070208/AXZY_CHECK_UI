const SECRET = "checkapp.location.v1.2026";

const hash = (value: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
};

export const signLocationQr = (id: number) =>
  hash(`CHECKAPP|LOCATION|${id}|v1|${SECRET}`);

export const buildLocationQrPayload = (id: number) =>
  JSON.stringify({ app: "CHECKAPP", type: "LOCATION", v: 1, id, sig: signLocationQr(id) });
