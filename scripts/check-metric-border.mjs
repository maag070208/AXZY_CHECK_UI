import { chromium } from '@playwright/test'; const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5004/',{waitUntil:'networkidle'}); await p.locator('#pantallas').scrollIntoViewIfNeeded(); await p.getByRole('tab',{name:'Residente'}).click(); await p.waitForTimeout(300); await p.locator('#problema').scrollIntoViewIfNeeded();
console.log(await p.evaluate(()=>{const e=document.querySelector('.lp-shift-metric'); const s=getComputedStyle(e); return {border:s.border, borderColor:s.borderColor, borderWidth:s.borderWidth, boxShadow:s.boxShadow, outline:s.outline, rect:e.getBoundingClientRect().toJSON(), cls:e.className}}));
await b.close();
