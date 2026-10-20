import { chromium } from './node_modules/.pnpm/playwright@1.49.1/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1610, height: 1043 }, deviceScaleFactor: 1 });
await page.goto('http://localhost:5002/#/login', { waitUntil: 'networkidle' });
await page.fill('#username', 'aamaro');
await page.fill('#password', '123456');
await page.click('button:has-text("Iniciar Sesión")');
await page.waitForTimeout(5000);
console.log('URL:', page.url());
console.log('BODY HEAD:', (await page.locator('body').innerText()).slice(0, 600));
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1000);
const boxes = await page.evaluate(() => {
  const find = (text) => {
    const els = [...document.querySelectorAll('h1,h2,h3,p,span,div')].filter(e => (e.textContent || '').trim() === text);
    const el = els[0];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const cards = [...document.querySelectorAll('*')].filter(e => e.className && String(e.className).includes('bg-emerald-50'));
  return {
    title: find('Buenas tardes, Asael'),
    desc: find('Martes, 20 de octubre · El pulso de tu operación en tiempo real.'),
    ribbon: find('RONDAS ACTIVAS'),
    kpi: cards[0] ? (() => { const r = cards[0].getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
    now: find('Ahora mismo'),
  };
});
console.log('BOXES:', JSON.stringify(boxes, null, 2));
await page.screenshot({ path: '/tmp/checkapp-home.png', fullPage: false });
await browser.close();
