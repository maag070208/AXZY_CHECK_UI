import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1100}});
await p.goto('http://localhost:5004/',{waitUntil:'networkidle'}); await p.locator('#pantallas').scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const s=document.querySelector('#pantallas'); const a=document.querySelector('.lp-app-block'); return {section:s?.getBoundingClientRect().toJSON(), app:a?.getBoundingClientRect().toJSON(), html:a?.outerHTML.slice(0,200), imgs:[...document.querySelectorAll('.lp-phone img')].map(i=>({src:i.src,complete:i.complete,w:i.naturalWidth}))}}));
await p.locator('.lp-app-block').screenshot({path:'public/landing/preview/app-block.png'});
await b.close();
