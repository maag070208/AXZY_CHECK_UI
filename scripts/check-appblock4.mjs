import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5004/',{waitUntil:'networkidle'});
await p.getByRole('tab',{name:'Residente'}).click(); await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const a=document.querySelector('.lp-app-block'), s=document.querySelector('#pantallas'), st=document.querySelector('.lp-app-strip'); return {app:a?.getBoundingClientRect().toJSON(), appH:a&&getComputedStyle(a).height, appOverflow:a&&getComputedStyle(a).overflow, strip:st?.getBoundingClientRect().toJSON(), section:s?.getBoundingClientRect().toJSON(), phones:document.querySelectorAll('.lp-phone').length, html:a?.outerHTML.slice(0,100), scrollH:document.documentElement.scrollHeight}}));
await b.close();
