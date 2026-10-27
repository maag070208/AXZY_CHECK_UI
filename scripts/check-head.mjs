import { chromium } from '@playwright/test'; const b=await chromium.launch(); const p=await b.newPage();
await p.goto('http://localhost:5004/',{waitUntil:'networkidle'}); await p.getByRole('tab',{name:'Guardia'}).click(); await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const h=document.querySelector('.lp-role-app-head h3'); const p=document.querySelector('.lp-role-app-head p'); return {h:getComputedStyle(h).color,p:getComputedStyle(p).color,opacity:getComputedStyle(h).opacity,html:h?.outerHTML}})); await b.close();
