import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5004/',{waitUntil:'networkidle'}); await p.addStyleTag({content:'*{animation:none!important;transition:none!important;scroll-behavior:auto!important}'}); await p.locator('#pantallas').scrollIntoViewIfNeeded(); await p.getByRole('tab',{name:'Residente'}).click(); await p.waitForTimeout(400);
for (const [id,sel] of [['problema','#problema'],['beneficios','#beneficios'],['modulos','#modulos'],['como','#como-funciona'],['offline','#offline'],['planes','#planes'],['personas','#para-quien'],['faq','#faq'],['pantallas','#pantallas']]) { if(await p.locator(sel).count()){ await p.locator(sel).scrollIntoViewIfNeeded(); await p.waitForTimeout(250); await p.locator(sel).screenshot({path:`public/landing/preview/sec-${id}.png`}); }}
await b.close();
