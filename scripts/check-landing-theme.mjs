import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5004/',{waitUntil:'networkidle'}); await p.waitForTimeout(500);
await p.getByRole('tab',{name:'Jefe'}).click(); await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const el=document.querySelector('.checkapp-landing'); const s=getComputedStyle(el); return {style:el.getAttribute('style'), dark:s.getPropertyValue('--lp-dark'), green:s.getPropertyValue('--lp-green'), bg:s.backgroundColor, bodybg:getComputedStyle(document.body).backgroundColor}}));
await b.close();
