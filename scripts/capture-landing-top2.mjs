import { chromium } from '@playwright/test';
import fs from 'node:fs';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5004/',{waitUntil:'networkidle'});
await p.addStyleTag({content:'*{animation:none!important;transition:none!important;scroll-behavior:auto!important}'});
await p.locator('#pantallas').scrollIntoViewIfNeeded(); await p.waitForTimeout(700);
for (const [id,label] of [['admin','Admin'],['shift','Jefe'],['guard','Guardia'],['resident','Residente']]) {
  await p.getByRole('tab',{name:label}).click();
  await p.waitForTimeout(500);
  await p.evaluate(()=>window.scrollTo(0,0));
  await p.waitForTimeout(400);
  await p.screenshot({path:`public/landing/preview/top-${id}.png`});
  await p.locator('#pantallas').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await p.locator('#pantallas').screenshot({path:`public/landing/preview/section-${id}.png`});
}
await b.close();
