import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5002/#/login'); await p.locator('input[name=username]').fill('e2e_resident'); await p.locator('input[name=password]').fill('123456'); await p.getByRole('button',{name:/Iniciar sesión/i}).click(); await p.waitForURL(/home/); await p.goto('http://localhost:5002/#/resident?tab=perfil'); await p.waitForTimeout(1000);
console.log(await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const b=getComputedStyle(e).backgroundColor; return b!=='rgba(0, 0, 0, 0)'&&b!=='transparent'}).slice(0,20).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,120),bg:getComputedStyle(e).backgroundColor,pos:getComputedStyle(e).position}))));
await b.close();
