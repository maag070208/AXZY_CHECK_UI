import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5004/',{waitUntil:'networkidle'}); await p.addStyleTag({content:'*{animation:none!important;transition:none!important}'}); await p.waitForTimeout(800);
for (const [id,label] of [['admin','Admin'],['shift','Jefe'],['guard','Guardia'],['resident','Residente']]) { await p.getByRole('tab',{name:label}).click(); await p.waitForTimeout(400); await p.screenshot({path:`public/landing/preview/top-${id}.png`}); }
await b.close();
