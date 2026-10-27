import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1200}});
await p.goto('http://localhost:5004/',{waitUntil:'networkidle'});
await p.addStyleTag({content:'*{animation:none!important;transition:none!important;scroll-behavior:auto!important}'});
await p.locator('#pantallas').scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
for (const [id,label] of [['admin','Admin'],['shift','Jefe'],['guard','Guardia'],['resident','Residente']]) {
  await p.getByRole('tab',{name:label}).click(); await p.waitForTimeout(600);
  await p.locator('#pantallas').screenshot({path:`public/landing/preview/full-${id}.png`});
}
await b.close();
