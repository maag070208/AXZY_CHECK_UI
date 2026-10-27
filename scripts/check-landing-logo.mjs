import { chromium } from '@playwright/test'; const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5004/',{waitUntil:'networkidle'}); await p.locator('#pantallas').scrollIntoViewIfNeeded(); await p.getByRole('tab',{name:'Residente'}).click(); await p.waitForTimeout(500); await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(300);
console.log(await p.evaluate(()=>[...document.querySelectorAll('.lp-logo img')].map(i=>i.src)));
console.log(await p.evaluate(()=>{const l=document.querySelector('.lp-nav-link');return {color:getComputedStyle(l).color,bg:getComputedStyle(l.closest('.lp-nav')).backgroundColor}}));
await b.close();
