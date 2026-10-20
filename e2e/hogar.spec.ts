import { test, expect, Page } from "@playwright/test";
import { API_URL } from "./config";

const login = async (page: Page) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("123456");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/home/);
};

test("A2: agregar un familiar al hogar desde la propiedad y darlo de baja", async ({ page }) => {
  await login(page);
  const name = `Carla${Date.now().toString().slice(-6)}`;
  const propertyId = await page.evaluate(async (url) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${url}/properties`, { headers: { Authorization: `Bearer ${token}` } });
    return (await res.json()).data[0].id as number;
  }, API_URL);

  await page.goto(`/#/properties/${propertyId}`);
  await expect(page.getByRole("heading", { name: "Hogar" })).toBeVisible();

  await page.locator('input[name="householdFirstName"]').fill(name);
  await page.locator('input[name="householdKind"]').click();
  await page.getByText("Familiar", { exact: true }).click();
  await page.getByRole("button", { name: "Agregar al hogar" }).click();

  const row = page.locator("li", { hasText: name });
  await expect(row).toContainText("Familiar");

  await row.getByRole("button", { name: "Dar de baja" }).click();
  await expect(page.locator("li", { hasText: name })).toHaveCount(0);
});
