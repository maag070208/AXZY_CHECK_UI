import { test, expect, type Page } from "@playwright/test";

const login = async (page: Page) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("123456");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/home/);
};

const openSection = async (page: Page, section: string, item: string) => {
  await page.getByRole("button", { name: section, exact: true }).click();
  await page.getByText(item, { exact: true }).click();
};

test.describe("Fase 2A — accesos, avisos y vehículos", () => {
  test("ADMIN envía un aviso y lo ve en el historial", async ({ page }) => {
    await login(page);
    await openSection(page, "Residencial", "Avisos");
    await expect(page).toHaveURL(/#\/announcements/);
    await expect(page.getByRole("button", { name: "Nuevo aviso" })).toBeVisible();

    const title = `E2E Aviso ${Date.now()}`;
    await page.getByRole("button", { name: "Nuevo aviso" }).click();
    await page.getByPlaceholder("Ej. Corte de agua programado").fill(title);
    await page.getByPlaceholder("Escribe el comunicado…").fill("Mensaje generado por la prueba E2E.");
    await page.getByRole("button", { name: "Enviar aviso" }).click();

    await expect(page.getByText(title)).toBeVisible();
  });

  test("ADMIN consulta la bitácora de accesos", async ({ page }) => {
    await login(page);
    await openSection(page, "Operación", "Bitácora de accesos");
    await expect(page).toHaveURL(/#\/access-log/);
    await expect(page.getByRole("button", { name: "Exportar CSV" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Fecha" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Decisión" })).toBeVisible();
  });

  test("ADMIN revisa el control de morosos y la regla", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Finanzas" }).click();
    await expect(page).toHaveURL(/#\/finance/);
    await page.getByRole("button", { name: "Cobranza" }).click();
    await expect(page.getByText("Control de morosos")).toBeVisible();
    await expect(page.getByText("Excepción temporal")).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar regla" })).toBeVisible();
  });

  test("ADMIN abre el padrón de vehículos", async ({ page }) => {
    await login(page);
    await openSection(page, "Residencial", "Vehículos");
    await expect(page).toHaveURL(/#\/vehicles/);
    await expect(page.getByRole("button", { name: "Pendientes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Aprobados" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Refrescar" })).toBeVisible();
  });
});
