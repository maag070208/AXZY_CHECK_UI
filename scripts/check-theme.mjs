import { chromium } from '@playwright/test';
const b=await chromium.launch({headless:true}); const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5002/#/login');
await p.locator('input[name=username]').fill('e2e_shift'); await p.locator('input[name=password]').fill('123456');
await p.getByRole('button',{name:/Iniciar sesión/i}).click(); await p.waitForURL(/home/); await p.waitForTimeout(2500);
console.log(await p.evaluate(()=>({role:JSON.parse(localStorage.getItem('persist:root')||'{}').auth, last:localStorage.getItem('lastRole'), color:getComputedStyle(document.documentElement).getPropertyValue('--color-primary'), btn:getComputedStyle([...document.querySelectorAll('button')].find(x=>x.textContent?.includes('Nuevo reporte'))).backgroundColor})));
await b.close();
