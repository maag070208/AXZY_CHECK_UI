/** Puertos del E2E: propios, para no chocar con un servidor de desarrollo que esté corriendo. */
export const API_PORT = Number(process.env.E2E_API_PORT ?? 4445);
export const API_URL = `http://localhost:${API_PORT}/api/v1`;
