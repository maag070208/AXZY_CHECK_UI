import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5002/#/login'); await p.locator('input[name=username]').fill('e2e_shift'); await p.locator('input[name=password]').fill('123456'); await p.getByRole('button',{name:/Iniciar sesión/i}).click(); await p.waitForURL(/home/);
await p.waitForTimeout(5000);
await p.screenshot({path:'public/landing/roles/shift/home.png'}); await b.close();
