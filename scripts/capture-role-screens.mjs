import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.CAPTURE_BASE ?? 'http://localhost:5002';
const OUT = path.resolve('public/landing/roles');
const VIEWPORT = { width: 1440, height: 1000 };

const roles = [
  {
    key: 'admin', username: 'isabel', password: '123456',
    screens: [
      ['home', '/#/home'],
      ['locations', '/#/locations'],
      ['residents', '/#/residents'],
      ['residents-new', '/#/residents/nuevo'],
      ['access-log', '/#/access-log'],
      ['finance', '/#/finance'],
      ['announcements', '/#/announcements'],
      ['vehicles', '/#/vehicles'],
      ['guards', '/#/guards'],
    ],
  },
  {
    key: 'shift', username: 'e2e_shift', password: '123456',
    screens: [
      ['home', '/#/home'],
      ['guards', '/#/guards'],
      ['shift-handover', '/#/shift-handover'],
      ['new-shift', '/#/shift-handover/nuevo'],
      ['guard-tracking', '/#/guard-tracking'],
      ['incidents', '/#/incidents'],
      ['club', '/#/club'],
    ],
  },
  {
    key: 'guard', username: 'marcoh', password: '123456',
    screens: [
      ['home', '/#/home'],
      ['incidents', '/#/incidents'],
      ['club', '/#/club'],
      ['invitations', '/#/invitations'],
      ['chat', '/#/chat'],
    ],
  },
  {
    key: 'resident', username: 'e2e_resident', password: '123456',
    screens: [
      ['home', '/#/home'],
      ['profile', '/#/resident?tab=perfil'],
      ['contacts', '/#/resident?tab=contactos'],
      ['passes', '/#/resident?tab=invitaciones'],
    ],
  },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true });
for (const role of roles) {
  const dir = path.join(OUT, role.key);
  fs.mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: 'light', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => console.log(`[${role.key}] pageerror ${error.message}`));

  await page.goto(`${BASE}/#/login`, { waitUntil: 'networkidle' });
  await page.locator('input[name="username"]').fill(role.username);
  await page.locator('input[name="password"]').fill(role.password);
  await page.getByRole('button', { name: /Iniciar sesión/i }).click();
  await page.waitForURL(/\/home/, { timeout: 20000 });
  await sleep(2500);

  for (const [id, route] of role.screens) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await sleep(2200);
    const title = await page.title().catch(() => '');
    console.log(`[${role.key}] ${id} ${title}`);
    await page.screenshot({ path: path.join(dir, `${id}.png`), fullPage: false });

    if (role.key === 'admin' && id === 'locations') {
      const qr = page.getByRole('button', { name: 'Ver código QR' }).first();
      if (await qr.count()) {
        await qr.click();
        await sleep(900);
        await page.screenshot({ path: path.join(dir, 'locations-qr.png'), fullPage: false });
        await page.keyboard.press('Escape').catch(() => undefined);
        await sleep(400);
      }
    }
    if (role.key === 'resident' && id === 'passes') {
      const nuevo = page.getByRole('button', { name: /Nuevo pase|Generar invitación/i }).first();
      if (await nuevo.count()) {
        await nuevo.click();
        await sleep(900);
        await page.screenshot({ path: path.join(dir, 'pass-modal.png'), fullPage: false });
        await page.keyboard.press('Escape').catch(() => undefined);
        await sleep(400);
      }
    }
  }

  await context.close();
}
await browser.close();
