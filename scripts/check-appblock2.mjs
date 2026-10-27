import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5004/',{waitUntil:'networkidle'}); await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const a=document.querySelector('.lp-app-block'), s=document.querySelector('#pantallas'), g=document.querySelector('.lp-app-strip'); return {app:!!a, appDisplay:a&&getComputedStyle(a).display, appRect:a?.getBoundingClientRect().toJSON(), strip:g?.getBoundingClientRect().toJSON(), section:s?.getBoundingClientRect().toJSON(), phoneCount:document.querySelectorAll('.lp-phone').length, phoneRects:[...document.querySelectorAll('.lp-phone')].slice(0,3).map(x=>x.getBoundingClientRect().toJSON())}}));
await b.close();
