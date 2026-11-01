import { test, expect, type Page } from "@playwright/test";
import { API_URL } from "./config";

const SHOTS = process.env.E2E_SHOTS_DIR;
const channel = process.env.E2E_CHANNEL;

// Tablet de caseta en vertical. `E2E_CHANNEL=chrome` usa el Chrome instalado si no hay navegadores de Playwright.
test.use({ viewport: { width: 820, height: 1180 }, ...(channel ? { channel } : {}) });

const login = async (page: Page, username: string) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill("123456");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/home/);
};

/** El login valida el turno: la prueba usa al guardia sembrado que esté en horario a esta hora. */
const guardOnShift = async (page: Page) => {
  for (const username of ["victor", "marco", "asael"]) {
    const res = await page.request.post(`${API_URL}/users/login`, { data: { username, password: "123456" } });
    if (res.ok()) return username;
  }
  throw new Error("Ningún guardia sembrado está en turno");
};

/** Los nombres de persona no aceptan dígitos: el sufijo único usa solo letras. */
const uniqueName = (prefix: string) => `${prefix} ${Date.now().toString(36).replace(/\d/g, (d) => "abcdefghij"[Number(d)])}`;

const pick = async (page: Page, name: string, option: RegExp | string) => {
  await page.locator(`input[name="${name}"]`).click();
  // Las opciones se pintan en una capa aparte del diálogo.
  const list = page.locator(".max-h-60");
  const target = typeof option === "string" ? list.getByText(option, { exact: true }) : list.getByText(option);
  await target.first().click();
};

const noHorizontalScroll = async (page: Page) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
};

test.describe("Caseta en tablet", () => {
  test("el guardia registra a un repartidor sin cita y le marca entrada y salida", async ({ page }) => {
    await login(page, await guardOnShift(page));
    await expect(page.getByText("Validar pase")).toBeVisible();
    await noHorizontalScroll(page);

    const name = uniqueName("Repartidor");
    await page.getByRole("button", { name: "Visita sin cita" }).click();
    await page.locator('input[name="walk-in-name"]').fill(name);
    await pick(page, "walk-in-property", /^[^S].* - /);
    await pick(page, "walk-in-type", "Entrega");
    await page.locator('input[name="walk-in-plate"]').fill("abc-123");
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/caseta-dialogo.png` });
    await page.getByRole("button", { name: "Registrar visita" }).click();

    const arriving = page.getByRole("list", { name: "Visitas por llegar" });
    await expect(arriving.getByText(name)).toBeVisible();
    await expect(arriving.getByText("Placa ABC123")).toBeVisible();
    await page.getByRole("button", { name: `Registrar entrada de ${name}` }).click();
    await page.getByRole("button", { name: "Confirmar entrada" }).click();

    const inside = page.getByRole("list", { name: "Visitas dentro" });
    await expect(inside.getByText(name)).toBeVisible();
    await noHorizontalScroll(page);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/caseta-tablet.png`, fullPage: true });

    await page.getByRole("button", { name: `Registrar salida de ${name}` }).click();
    await page.getByRole("button", { name: "Confirmar salida" }).click();
    await expect(inside.getByText(name)).toBeHidden();
  });

  test("una visita sin cita espera autorización y el admin la autoriza desde su inicio", async ({ page }) => {
    await login(page, await guardOnShift(page));
    const name = uniqueName("Visita");
    await page.getByRole("button", { name: "Visita sin cita" }).click();
    await page.locator('input[name="walk-in-name"]').fill(name);
    await pick(page, "walk-in-property", /^[^S].* - /);
    await pick(page, "walk-in-type", "Visita");
    await page.getByRole("button", { name: "Registrar visita" }).click();

    const awaiting = page.getByRole("list", { name: "Visitas por autorizar" });
    await expect(awaiting.getByText(name)).toBeVisible();
    await expect(awaiting.getByText("Esperando residente")).toBeVisible();
    await expect(page.getByRole("button", { name: `Autorizar a ${name}` })).toHaveCount(0);

    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
    await login(page, "admin");
    await page.getByRole("button", { name: `Autorizar a ${name}` }).click();
    await expect(page.getByRole("button", { name: `Autorizar a ${name}` })).toHaveCount(0);
  });

  test("el admin ve los indicadores y descarga el PDF", async ({ page }) => {
    await login(page, "admin");
    await page.goto("/#/access-log");
    await expect(page.getByText(/Visitas · últimos 30 días/)).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Descargar PDF" }).click();
    expect((await download).suggestedFilename()).toMatch(/^indicadores-visitas-.*\.pdf$/);

    await page.getByRole("button", { name: "12 meses" }).click();
    await expect(page.getByText(/Visitas · últimos 12 meses/)).toBeVisible();
    await page.getByRole("button", { name: "Semana", exact: true }).click();
    const excel = page.waitForEvent("download");
    await page.getByRole("button", { name: "Descargar Excel" }).click();
    expect((await excel).suggestedFilename()).toMatch(/^indicadores-visitas-.*\.xlsx$/);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/indicadores-tablet.png` });
  });
});
