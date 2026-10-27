import { chromium } from '@playwright/test';
import fs from 'node:fs';
const b=await chromium.launch({headless:true}); const p=await b.newPage({viewport:{width:1440,height:1100}});
await p.goto('http://localhost:5004/',{waitUntil:'networkidle'}); await p.waitForTimeout(1000);
await p.locator('#pantallas').scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
fs.mkdirSync('public/landing/preview',{recursive:true});
for (const [id,label] of [['admin','Admin'],['shift','Jefe'],['guard','Guardia'],['resident','Residente']]) {
  await p.getByRole('tab',{name:label}).click();
  await p.waitForTimeout(900);
  await p.locator('#pantallas').screenshot({path:`public/landing/preview/roles-${id}.png`});
}
await b.close();
