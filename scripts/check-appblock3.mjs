import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage();
await p.goto('http://localhost:5004/',{waitUntil:'networkidle'}); await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const a=document.querySelector('.lp-app-block'); return {html:a?.outerHTML, strip:!!document.querySelector('.lp-app-strip')}}));
await b.close();
