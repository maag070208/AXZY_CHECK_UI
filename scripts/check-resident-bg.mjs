import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5002/#/login'); await p.locator('input[name=username]').fill('e2e_resident'); await p.locator('input[name=password]').fill('123456'); await p.getByRole('button',{name:/Iniciar sesión/i}).click(); await p.waitForURL(/home/); await p.goto('http://localhost:5002/#/resident?tab=perfil'); await p.waitForTimeout(2000);
console.log(await p.evaluate(()=>{const els=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect(); return r.width>1000&&r.height>700}); return els.slice(0,12).map(e=>({tag:e.tagName,cls:e.className,bg:getComputedStyle(e).backgroundColor,rect:e.getBoundingClientRect().toJSON()}))}));
await b.close();
